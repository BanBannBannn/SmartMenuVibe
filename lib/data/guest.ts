import "server-only"
import { createAdminClient } from "@/lib/supabase/admin"

/**
 * Guest-facing reads use the service role because anonymous guests have no
 * session. We only ever return non-sensitive, publicly-appropriate data
 * (active menus, available items) - never other restaurants' private data.
 */

export type PublicVariant = { id: string; name: string; price_delta: number }
export type PublicItem = {
	id: string
	name: string
	description: string | null
	base_price: number
	images: string[]
	tags: string[]
	category_id: string
	variants: PublicVariant[]
}
export type PublicCategory = { id: string; name: string; items: PublicItem[] }
export type PublicMenuDisplay = {
	title: string | null
	subtitle: string | null
	background: string | null
}
export type PublicMenu = {
	restaurant: {
		id: string
		name: string
		slug: string
		logo_url: string | null
		cover_url: string | null
		theme_settings: unknown
		city: string | null
		lat: number | null
		lon: number | null
		face_enabled: boolean
	}
	table: { id: string; table_number: string } | null
	categories: PublicCategory[]
	// Decoration for the showcase (big-screen) menu; ignored by the ordering UI.
	display: PublicMenuDisplay
}

export async function resolveTable(qrToken: string) {
	const db = createAdminClient()
	const { data } = await db
		.from("tables")
		.select("id, table_number, restaurant_id, is_active")
		.eq("qr_code_token", qrToken)
		.maybeSingle()
	return data && data.is_active ? data : null
}

/** Load the public menu for a restaurant slug + optional table token. */
export async function loadPublicMenu(
	slug: string,
	qrToken?: string,
): Promise<PublicMenu | null> {
	const db = createAdminClient()
	const { data: restaurant } = await db
		.from("restaurants")
		.select(
			"id, name, slug, logo_url, cover_url, theme_settings, city, lat, lon, face_enabled, status",
		)
		.eq("slug", slug)
		.maybeSingle()
	if (!restaurant || restaurant.status !== "active") return null

	const emptyDisplay: PublicMenuDisplay = {
		title: null,
		subtitle: null,
		background: null,
	}

	const { data: menu } = await db
		.from("menus")
		.select("id, layout")
		.eq("restaurant_id", restaurant.id)
		.eq("is_active", true)
		.order("sort_order")
		.limit(1)
		.maybeSingle()
	if (!menu)
		return { restaurant, table: null, categories: [], display: emptyDisplay }

	const layout = (menu.layout ?? {}) as {
		title?: string | null
		subtitle?: string | null
		background?: string | null
	}
	const display: PublicMenuDisplay = {
		title: layout.title ?? null,
		subtitle: layout.subtitle ?? null,
		background: layout.background ?? null,
	}

	const { data: categories } = await db
		.from("menu_categories")
		.select("id, name, sort_order")
		.eq("menu_id", menu.id)
		.order("sort_order")

	const { data: items } = await db
		.from("menu_items")
		.select(
			"id, name, description, base_price, images, tags, category_id, is_available, sort_order, menu_item_variants(id, name, price_delta)",
		)
		.eq("restaurant_id", restaurant.id)
		.eq("is_available", true)
		.order("sort_order")

	const byCategory = new Map<string, PublicItem[]>()
	for (const it of items ?? []) {
		const list = byCategory.get(it.category_id) ?? []
		list.push({
			id: it.id,
			name: it.name,
			description: it.description,
			base_price: it.base_price,
			images: it.images ?? [],
			tags: it.tags ?? [],
			category_id: it.category_id,
			variants: (it.menu_item_variants ?? []) as PublicVariant[],
		})
		byCategory.set(it.category_id, list)
	}

	let table = null
	if (qrToken) {
		const t = await resolveTable(qrToken)
		if (t && t.restaurant_id === restaurant.id)
			table = { id: t.id, table_number: t.table_number }
	}

	return {
		restaurant,
		table,
		display,
		categories: (categories ?? []).map((c) => ({
			id: c.id,
			name: c.name,
			items: byCategory.get(c.id) ?? [],
		})),
	}
}
