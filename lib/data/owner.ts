import "server-only"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"

const RESTAURANT_FIELDS =
	"id, name, slug, status, description, theme_settings, face_enabled, city, timezone, created_at"

export const ACTIVE_RESTAURANT_COOKIE = "active_restaurant"

export type OwnerRestaurant = {
	id: string
	name: string
	slug: string
	status: string
	description: string | null
	theme_settings: unknown
	face_enabled: boolean
	city: string | null
	timezone: string
	created_at: string
}

/**
 * All restaurants the current user may manage: the ones they own PLUS any they
 * are staff of. This is the fix for the onboarding bug where a brand-new
 * account was landing on the first "active" restaurant in the whole platform
 * (the public-read RLS policy allows reading any active restaurant, so an
 * unfiltered query returned someone else's data).
 */
export async function getAccessibleRestaurants(): Promise<OwnerRestaurant[]> {
	const supabase = await createClient()
	const {
		data: { user },
	} = await supabase.auth.getUser()
	if (!user) return []

	const { data: staffRows } = await supabase
		.from("restaurant_staff")
		.select("restaurant_id")
		.eq("user_id", user.id)
	const staffIds = (staffRows ?? []).map((r) => r.restaurant_id)

	const { data: owned } = await supabase
		.from("restaurants")
		.select(RESTAURANT_FIELDS)
		.eq("owner_id", user.id)

	let staffed: OwnerRestaurant[] = []
	if (staffIds.length > 0) {
		const { data } = await supabase
			.from("restaurants")
			.select(RESTAURANT_FIELDS)
			.in("id", staffIds)
		staffed = (data ?? []) as OwnerRestaurant[]
	}

	const byId = new Map<string, OwnerRestaurant>()
	for (const r of [...((owned ?? []) as OwnerRestaurant[]), ...staffed]) {
		byId.set(r.id, r)
	}
	return [...byId.values()].sort((a, b) =>
		a.created_at < b.created_at ? -1 : a.created_at > b.created_at ? 1 : 0,
	)
}

/** Resolve the active restaurant for the current owner/staff. Honors the
 * `active_restaurant` cookie (set by the restaurant switcher) and otherwise
 * falls back to the first accessible restaurant. Returns null when the user
 * has none yet (so the UI can show the "create your first restaurant" flow). */
export async function getPrimaryRestaurant(): Promise<OwnerRestaurant | null> {
	const list = await getAccessibleRestaurants()
	if (list.length === 0) return null
	const store = await cookies()
	const activeId = store.get(ACTIVE_RESTAURANT_COOKIE)?.value
	if (activeId) {
		const found = list.find((r) => r.id === activeId)
		if (found) return found
	}
	return list[0]
}

export async function getDashboardStats(restaurantId: string) {
	const supabase = await createClient()
	const today = new Date().toISOString().slice(0, 10)
	const [{ data: summary }, { count: openOrders }] = await Promise.all([
		supabase
			.from("revenue_daily_summary")
			.select("total_orders, total_revenue")
			.eq("restaurant_id", restaurantId)
			.eq("date", today)
			.maybeSingle(),
		supabase
			.from("orders")
			.select("id", { count: "exact", head: true })
			.eq("restaurant_id", restaurantId)
			.in("status", ["pending", "confirmed", "preparing", "ready"]),
	])
	return {
		todayOrders: summary?.total_orders ?? 0,
		todayRevenue: summary?.total_revenue ?? 0,
		openOrders: openOrders ?? 0,
	}
}

export async function getRevenueSeries(restaurantId: string, days = 14) {
	const supabase = await createClient()
	const since = new Date(Date.now() - days * 86_400_000)
		.toISOString()
		.slice(0, 10)
	const { data } = await supabase
		.from("revenue_daily_summary")
		.select("date, total_orders, total_revenue")
		.eq("restaurant_id", restaurantId)
		.gte("date", since)
		.order("date")
	return data ?? []
}
