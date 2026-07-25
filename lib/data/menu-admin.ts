import "server-only"
import { createClient } from "@/lib/supabase/server"
import { parseLayout, pruneLayout, type MenuLayout } from "@/lib/menu-layout"

export type { MenuLayout }

export type AdminItem = {
	id: string
	name: string
	description: string | null
	base_price: number
	is_available: boolean
	category_id: string
	sort_order: number
	images: string[]
	tags: string[]
}
export type AdminCategory = { id: string; name: string; sort_order: number }
export type AdminMenu = { id: string; name: string; layout: MenuLayout | null }

/** Load the active menu with categories + items for the owner editor. */
export async function loadOwnerMenu(restaurantId: string) {
	const supabase = await createClient()
	const { data: menu } = await supabase
		.from("menus")
		.select("id, name, layout")
		.eq("restaurant_id", restaurantId)
		.eq("is_active", true)
		.order("sort_order")
		.limit(1)
		.maybeSingle()
	if (!menu) return { menu: null, categories: [], items: [] }

	const [{ data: categories }, { data: items }] = await Promise.all([
		supabase
			.from("menu_categories")
			.select("id, name, sort_order")
			.eq("menu_id", menu.id)
			.order("sort_order"),
		supabase
			.from("menu_items")
			.select(
				"id, name, description, base_price, is_available, category_id, sort_order, images, tags",
			)
			.eq("restaurant_id", restaurantId)
			.order("sort_order"),
	])

	const cats = (categories ?? []) as AdminCategory[]
	const adminItems = (items ?? []).map((i) => ({
		...i,
		images: (i.images ?? []) as string[],
		tags: (i.tags ?? []) as string[],
	})) as AdminItem[]

	// Elements pointing at deleted dishes/categories are dropped on read so the
	// editor never shows a placeholder the owner cannot explain.
	const parsed = parseLayout(menu.layout)
	const layout = parsed
		? pruneLayout(
				parsed,
				new Set(adminItems.map((i) => i.id)),
				new Set(cats.map((c) => c.id)),
			)
		: null

	return {
		menu: { id: menu.id, name: menu.name, layout } as AdminMenu,
		categories: cats,
		items: adminItems,
	}
}
