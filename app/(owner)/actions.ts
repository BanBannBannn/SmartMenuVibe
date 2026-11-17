"use server"

import { revalidatePath, revalidateTag } from "next/cache"
import { PUBLIC_MENU_TAG } from "@/lib/data/guest"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { slugify } from "@/lib/utils"
import { parseLayout } from "@/lib/menu-layout"
import type { Json, TablesUpdate } from "@/types/database"
import { ACTIVE_RESTAURANT_COOKIE } from "@/lib/data/owner"
import { randomUUID } from "crypto"
import { menuDraftSchema, toItemRows } from "@/lib/ai/menu-import"
import {
	uploadMenuImage,
	deleteMenuImageByUrl,
	isImageFile,
} from "@/lib/storage/menu-images"

/** Drop cached guest/showcase menus after any write that changes them. */
function refreshPublicMenus() {
	revalidateTag(PUBLIC_MENU_TAG)
}

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
	refreshPublicMenus()
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
	refreshPublicMenus()
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
	refreshPublicMenus()
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
	refreshPublicMenus()
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
	refreshPublicMenus()
}

export async function toggleItemAvailability(id: string, available: boolean) {
	const { supabase } = await requireUser()
	await supabase
		.from("menu_items")
		.update({ is_available: available })
		.eq("id", id)
	revalidatePath("/dashboard/menu")
	refreshPublicMenus()
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
	refreshPublicMenus()
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
	refreshPublicMenus()
}

/**
 * Persist the menu designer document. The layout is re-parsed server-side so a
 * tampered payload can never store an element shape the renderer cannot draw.
 *
 * Item ordering is deliberately NOT touched here: category blocks read
 * `sort_order`, which the Menu page owns. Moving a card on the design canvas
 * must not silently reshuffle the guest ordering page.
 */
export async function saveMenuLayout(menuId: string, layout: unknown) {
	const { supabase } = await requireUser()
	const parsed = parseLayout(layout)
	if (!parsed) throw new Error("INVALID_LAYOUT")

	// RLS scopes the update to menus the caller may manage.
	const { error } = await supabase
		.from("menus")
		.update({ layout: parsed as unknown as Json })
		.eq("id", menuId)
	if (error) throw new Error(error.message)

	revalidatePath("/dashboard/builder")
	revalidatePath("/dashboard/showcase")
	revalidatePath("/[restaurantSlug]/showcase", "page")
	refreshPublicMenus()
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
	refreshPublicMenus()
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

/**
 * Save an AI-read menu draft after the owner reviewed it. The draft is
 * re-validated here (the browser could send anything). Categories are matched
 * by name so re-importing the same menu does not duplicate them, and items
 * whose name already exists in that category are skipped. RLS limits every
 * write to restaurants the caller manages.
 */
export async function importMenuDraft(
	restaurantId: string,
	menuId: string,
	rawDraft: unknown,
): Promise<
	| { ok: true; categories: number; items: number; skipped: number }
	| { ok: false; error: string }
> {
	const { supabase } = await requireUser()
	const parsed = menuDraftSchema.safeParse(rawDraft)
	if (!parsed.success) return { ok: false, error: "VALIDATION" }

	const { data: menu } = await supabase
		.from("menus")
		.select("id")
		.eq("id", menuId)
		.eq("restaurant_id", restaurantId)
		.maybeSingle()
	if (!menu) return { ok: false, error: "MENU_NOT_FOUND" }

	const [{ data: existingCats }, { data: existingItems }] = await Promise.all([
		supabase
			.from("menu_categories")
			.select("id, name, sort_order")
			.eq("menu_id", menuId),
		supabase
			.from("menu_items")
			.select("name, category_id, sort_order")
			.eq("restaurant_id", restaurantId),
	])

	const norm = (s: string) => s.trim().toLocaleLowerCase("vi")
	const catIdByName = new Map(
		(existingCats ?? []).map((c) => [norm(c.name), c.id] as const),
	)
	let catSort = Math.max(0, ...(existingCats ?? []).map((c) => c.sort_order ?? 0))

	// Create the missing categories in one insert, with ids chosen up front.
	const newCats: { id: string; menu_id: string; restaurant_id: string; name: string; sort_order: number }[] = []
	for (const cat of parsed.data.categories) {
		if (!cat.items.length || catIdByName.has(norm(cat.name))) continue
		const id = randomUUID()
		catIdByName.set(norm(cat.name), id)
		newCats.push({ id, menu_id: menuId, restaurant_id: restaurantId, name: cat.name, sort_order: ++catSort })
	}
	if (newCats.length) {
		const { error } = await supabase.from("menu_categories").insert(newCats)
		if (error) return { ok: false, error: error.message }
	}

	const takenNames = new Set(
		(existingItems ?? []).map((i) => `${i.category_id}|${norm(i.name)}`),
	)
	const itemSort = new Map<string, number>()
	for (const i of existingItems ?? [])
		itemSort.set(i.category_id, Math.max(itemSort.get(i.category_id) ?? 0, i.sort_order ?? 0))

	const itemRows = []
	const variantRows = []
	let skipped = 0
	for (const cat of parsed.data.categories) {
		const categoryId = catIdByName.get(norm(cat.name))
		if (!categoryId) continue
		for (const item of cat.items) {
			const key = `${categoryId}|${norm(item.name)}`
			if (takenNames.has(key)) {
				skipped++
				continue
			}
			takenNames.add(key)
			const id = randomUUID()
			const { basePrice, variants } = toItemRows(item)
			const sort = (itemSort.get(categoryId) ?? 0) + 1
			itemSort.set(categoryId, sort)
			itemRows.push({
				id,
				category_id: categoryId,
				restaurant_id: restaurantId,
				name: item.name,
				description: item.description,
				base_price: basePrice,
				sort_order: sort,
			})
			for (const v of variants) variantRows.push({ ...v, menu_item_id: id })
		}
	}

	if (itemRows.length) {
		const { error } = await supabase.from("menu_items").insert(itemRows)
		if (error) return { ok: false, error: error.message }
	}
	if (variantRows.length) {
		const { error } = await supabase.from("menu_item_variants").insert(variantRows)
		if (error) return { ok: false, error: error.message }
	}

	revalidatePath("/dashboard/menu")
	revalidatePath("/dashboard/builder")
	refreshPublicMenus()
	return { ok: true, categories: newCats.length, items: itemRows.length, skipped }
}

/** Save reviewed AI descriptions. RLS + restaurant filter scope every update. */
export async function saveDescriptions(
	restaurantId: string,
	updates: { id: string; description: string }[],
): Promise<{ ok: boolean; saved: number }> {
	const { supabase } = await requireUser()
	const clean = updates
		.slice(0, 100)
		.map((u) => ({ id: String(u.id), description: String(u.description ?? "").trim().slice(0, 300) }))
		.filter((u) => u.id && u.description)
	const results = await Promise.all(
		clean.map((u) =>
			supabase
				.from("menu_items")
				.update({ description: u.description })
				.eq("id", u.id)
				.eq("restaurant_id", restaurantId),
		),
	)
	const saved = results.filter((r) => !r.error).length
	revalidatePath("/dashboard/menu")
	revalidatePath("/dashboard/builder")
	refreshPublicMenus()
	return { ok: saved === clean.length, saved }
}
