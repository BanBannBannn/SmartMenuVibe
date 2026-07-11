import "server-only"
import { createClient } from "@/lib/supabase/server"

export type MenuLayout = {
	template: "grid" | "list" | "magazine" | "free"
	positions: Record<string, { x: number; y: number; w: number }>
	// Decoration (shared by builder canvas + showcase menu).
	title?: string | null
	subtitle?: string | null
	background?: string | null
}

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

	const { data: categories } = await supabase
		.from("menu_categories")
		.select("id, name, sort_order")
		.eq("menu_id", menu.id)
		.order("sort_order")
	const { data: items } = await supabase
		.from("menu_items")
		.select(
			"id, name, description, base_price, is_available, category_id, sort_order, images, tags",
		)
		.eq("restaurant_id", restaurantId)
		.order("sort_order")

	const layout = (menu.layout ?? null) as MenuLayout | null
	return {
		menu: { id: menu.id, name: menu.name, layout } as AdminMenu,
		categories: (categories ?? []) as AdminCategory[],
		items: (items ?? []).map((i) => ({
			...i,
			images: (i.images ?? []) as string[],
			tags: (i.tags ?? []) as string[],
		})) as AdminItem[],
	}
}
