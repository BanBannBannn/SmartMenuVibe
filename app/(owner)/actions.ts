"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { slugify } from "@/lib/utils"
import type { TablesUpdate } from "@/types/database"
import { ACTIVE_RESTAURANT_COOKIE } from "@/lib/data/owner"
import { randomUUID } from "crypto"
import {
	uploadMenuImage,
	deleteMenuImageByUrl,
	isImageFile,
} from "@/lib/storage/menu-images"

async function requireUser() {
	const supabase = await createClient()
	const {
		data: { user },
	} = await supabase.auth.getUser()
	if (!user) throw new Error("UNAUTHORIZED")
	return { supabase, user }
}

function optionalHttpUrl(value: FormDataEntryValue | null) {
	const raw = String(value ?? "").trim()
	if (!raw) return null
	try {
		const parsed = new URL(raw)
		return parsed.protocol === "http:" || parsed.protocol === "https:"
			? parsed.toString()
			: null
	} catch {
		return null
	}
}

async function setActiveRestaurantCookie(id: string) {
	const store = await cookies()
	store.set(ACTIVE_RESTAURANT_COOKIE, id, {
		path: "/",
		maxAge: 60 * 60 * 24 * 365,
		sameSite: "lax",
	})
}

export async function createRestaurant(formData: FormData) {
	const { supabase, user } = await requireUser()
	const name = String(formData.get("name") ?? "").trim()
	if (!name) return
	const { data: restaurant } = await supabase
		.from("restaurants")
		.insert({
			owner_id: user.id,
			name,
			slug: `${slugify(name)}-${randomUUID().slice(0, 6)}`,
			city: String(formData.get("city") ?? "") || null,
			status: "active",
		})
		.select("id")
		.single()
	// Bootstrap a default active menu so the owner can start adding items.
	if (restaurant) {
		await supabase.from("menus").insert({
			restaurant_id: restaurant.id,
			name: "Menu chính",
			is_active: true,
		})
		// Make the freshly created restaurant the active one for this user.
		await setActiveRestaurantCookie(restaurant.id)
	}
	revalidatePath("/dashboard", "layout")
}

/** Switch which restaurant the owner is currently managing (multi-restaurant). */
export async function setActiveRestaurant(formData: FormData) {
	const { supabase, user } = await requireUser()
	const id = String(formData.get("id") ?? "")
	if (!id) return
	// Verify the user actually owns / staffs this restaurant before switching.
	const { data: owned } = await supabase
		.from("restaurants")
		.select("id")
		.eq("id", id)
		.eq("owner_id", user.id)
		.maybeSingle()
	let allowed = Boolean(owned)
	if (!allowed) {
		const { data: staff } = await supabase
			.from("restaurant_staff")
			.select("id")
			.eq("restaurant_id", id)
			.eq("user_id", user.id)
			.maybeSingle()
		allowed = Boolean(staff)
	}
	if (!allowed) return
	await setActiveRestaurantCookie(id)
	revalidatePath("/dashboard", "layout")
}

export async function updateProfile(formData: FormData) {
	const { supabase, user } = await requireUser()
	const fullName = String(formData.get("full_name") ?? "")
		.trim()
		.slice(0, 120)
	const phone =
		String(formData.get("phone") ?? "")
			.trim()
			.slice(0, 30) || null
	const avatarUrl = optionalHttpUrl(formData.get("avatar_url"))
	if (!fullName) return

	await supabase
		.from("profiles")
		.update({ full_name: fullName, phone, avatar_url: avatarUrl })
		.eq("id", user.id)

	// Keep Supabase Auth metadata aligned with the public profile display name.
	await supabase.auth.updateUser({ data: { full_name: fullName } })
	revalidatePath("/dashboard", "layout")
	revalidatePath("/dashboard/settings")
}

export async function updateRestaurantSettings(formData: FormData) {
	const { supabase, user } = await requireUser()
	const id = String(formData.get("id") ?? "")
	const name = String(formData.get("name") ?? "")
		.trim()
		.slice(0, 160)
	const primary = String(formData.get("primary") ?? "").trim()
	if (!id || !name) return

	const timezoneInput = String(
		formData.get("timezone") ?? "Asia/Ho_Chi_Minh",
	).trim()
	let timezone = "Asia/Ho_Chi_Minh"
	try {
		new Intl.DateTimeFormat("vi-VN", { timeZone: timezoneInput }).format()
		timezone = timezoneInput
	} catch {
		// Invalid IANA timezone: keep the safe project default.
	}

	const patch: TablesUpdate<"restaurants"> = {
		name,
		address:
			String(formData.get("address") ?? "")
				.trim()
				.slice(0, 300) || null,
		city:
			String(formData.get("city") ?? "")
				.trim()
				.slice(0, 120) || null,
		description:
			String(formData.get("description") ?? "")
				.trim()
				.slice(0, 1000) || null,
		logo_url: optionalHttpUrl(formData.get("logo_url")),
		cover_url: optionalHttpUrl(formData.get("cover_url")),
		timezone,
		face_enabled: formData.get("face_enabled") === "on",
	}
	if (primary) patch.theme_settings = { primary }

	// Defense in depth: only the authenticated owner can update this row.
	// Supabase RLS applies the same ownership rule at the database layer.
	await supabase
		.from("restaurants")
		.update(patch)
		.eq("id", id)
		.eq("owner_id", user.id)

	revalidatePath("/dashboard/settings")
	revalidatePath("/dashboard/restaurants")
	revalidatePath("/dashboard", "layout")
}

export async function deleteRecommendationRule(formData: FormData) {
	const { supabase } = await requireUser()
	await supabase
		.from("recommendation_rules")
		.delete()
		.eq("id", String(formData.get("id")))
	revalidatePath("/dashboard/recommendations")
}

export async function createCategory(formData: FormData) {
	const { supabase } = await requireUser()
	const menuId = String(formData.get("menuId"))
	const restaurantId = String(formData.get("restaurantId"))
	await supabase.from("menu_categories").insert({
		menu_id: menuId,
		restaurant_id: restaurantId,
		name: String(formData.get("name") ?? "Danh mục"),
	})
	revalidatePath("/dashboard/menu")
}

export async function createMenuItem(formData: FormData) {
	const { supabase } = await requireUser()
	const restaurantId = String(formData.get("restaurantId"))
	const file = formData.get("image")
	let imageUrl: string | null = null
	if (isImageFile(file)) {
		imageUrl = await uploadMenuImage(supabase, restaurantId, file)
	}
	await supabase.from("menu_items").insert({
		category_id: String(formData.get("categoryId")),
		restaurant_id: restaurantId,
		name: String(formData.get("name") ?? "Món mới"),
		description: String(formData.get("description") ?? "") || null,
		base_price: Number(formData.get("base_price") ?? 0),
		images: imageUrl ? [imageUrl] : [],
	})
	revalidatePath("/dashboard/menu")
	revalidatePath("/dashboard/builder")
}

export async function updateMenuItem(formData: FormData) {
	const { supabase } = await requireUser()
	const id = String(formData.get("id"))
	const restaurantId = String(formData.get("restaurantId"))
	const patch: Record<string, unknown> = {
		name: String(formData.get("name") ?? ""),
		description: String(formData.get("description") ?? "") || null,
		base_price: Number(formData.get("base_price") ?? 0),
	}
	const file = formData.get("image")
	if (isImageFile(file)) {
		const newUrl = await uploadMenuImage(supabase, restaurantId, file)
		if (newUrl) {
			patch.images = [newUrl]
			await deleteMenuImageByUrl(
				supabase,
				String(formData.get("currentImage") ?? ""),
			)
		}
	}
	await supabase.from("menu_items").update(patch).eq("id", id)
	revalidatePath("/dashboard/menu")
	revalidatePath("/dashboard/builder")
}

export async function toggleItemAvailability(id: string, available: boolean) {
	const { supabase } = await requireUser()
	await supabase
		.from("menu_items")
		.update({ is_available: available })
		.eq("id", id)
	revalidatePath("/dashboard/menu")
}

export async function deleteMenuItem(id: string) {
	const { supabase } = await requireUser()
	const { data: existing } = await supabase
		.from("menu_items")
		.select("images")
		.eq("id", id)
		.maybeSingle()
	await supabase.from("menu_items").delete().eq("id", id)
	for (const url of (existing?.images ?? []) as string[]) {
		await deleteMenuImageByUrl(supabase, url)
	}
	revalidatePath("/dashboard/menu")
	revalidatePath("/dashboard/builder")
}

export async function saveItemOrder(
	updates: { id: string; sort_order: number; category_id: string }[],
) {
	const { supabase } = await requireUser()
	await Promise.all(
		updates.map((u) =>
			supabase
				.from("menu_items")
				.update({ sort_order: u.sort_order, category_id: u.category_id })
				.eq("id", u.id),
		),
	)
	revalidatePath("/dashboard/builder")
}

// Persist the WYSIWYG canvas layout (positions + template + decoration) and
// derive the guest-facing sort order from the visual arrangement.
export async function saveMenuLayout(
	menuId: string,
	layout: {
		template: string
		positions: Record<string, { x: number; y: number; w: number }>
		title?: string | null
		subtitle?: string | null
		background?: string | null
	},
	order: { id: string; sort_order: number; category_id: string }[],
) {
	const { supabase } = await requireUser()
	await supabase.from("menus").update({ layout }).eq("id", menuId)
	await Promise.all(
		order.map((u) =>
			supabase
				.from("menu_items")
				.update({ sort_order: u.sort_order, category_id: u.category_id })
				.eq("id", u.id),
		),
	)
	revalidatePath("/dashboard/builder")
	revalidatePath("/dashboard/menu")
	revalidatePath("/dashboard/showcase")
}

export async function toggleItemTag(id: string, tag: string, on: boolean) {
	const { supabase } = await requireUser()
	const { data: existing } = await supabase
		.from("menu_items")
		.select("tags")
		.eq("id", id)
		.maybeSingle()
	const current = new Set((existing?.tags ?? []) as string[])
	if (on) current.add(tag)
	else current.delete(tag)
	await supabase
		.from("menu_items")
		.update({ tags: Array.from(current) })
		.eq("id", id)
	revalidatePath("/dashboard/builder")
	revalidatePath("/dashboard/menu")
}

export async function createTable(formData: FormData) {
	const { supabase } = await requireUser()
	await supabase.from("tables").insert({
		restaurant_id: String(formData.get("restaurantId")),
		table_number: String(formData.get("table_number") ?? "1"),
		qr_code_token: randomUUID().replace(/-/g, ""),
	})
	revalidatePath("/dashboard/tables")
}

export async function saveRecommendationRule(formData: FormData) {
	const { supabase } = await requireUser()
	const conditionsRaw = String(formData.get("conditions") ?? "{}")
	let conditions: unknown = {}
	try {
		conditions = JSON.parse(conditionsRaw)
	} catch {
		conditions = {}
	}
	await supabase.from("recommendation_rules").insert({
		restaurant_id: String(formData.get("restaurantId")),
		rule_type: String(formData.get("rule_type") ?? "best_seller") as
			"time_of_day" | "weather" | "combo" | "best_seller",
		name: String(formData.get("name") ?? "Luật mới"),
		conditions: conditions as any,
		suggested_item_ids: String(formData.get("suggested_item_ids") ?? "")
			.split(",")
			.map((s) => s.trim())
			.filter(Boolean),
		priority: Number(formData.get("priority") ?? 100),
	})
	revalidatePath("/dashboard/recommendations")
}
