import "server-only"
import { cache } from "react"
import { cookies } from "next/headers"
import { getSessionUser } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

const RESTAURANT_FIELDS =
	"id, name, slug, status, description, theme_settings, face_enabled, city, timezone, created_at, logo_url, cover_url"

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
	logo_url: string | null
	cover_url: string | null
}

/**
 * Restaurants the current user may manage. Request-scoped React cache avoids
 * duplicate queries when the shared layout and a child page both need this
 * data. Supabase RLS remains the authorization boundary.
 */
export const getAccessibleRestaurants = cache(
	async (): Promise<OwnerRestaurant[]> => {
		const user = await getSessionUser()
		if (!user) return []

		const supabase = await createClient()
		const [{ data: staffRows }, { data: owned }] = await Promise.all([
			supabase
				.from("restaurant_staff")
				.select("restaurant_id")
				.eq("user_id", user.id),
			supabase
				.from("restaurants")
				.select(RESTAURANT_FIELDS)
				.eq("owner_id", user.id),
		])

		const staffIds = (staffRows ?? []).map((row) => row.restaurant_id)
		let staffed: OwnerRestaurant[] = []
		if (staffIds.length > 0) {
			const { data } = await supabase
				.from("restaurants")
				.select(RESTAURANT_FIELDS)
				.in("id", staffIds)
			staffed = (data ?? []) as OwnerRestaurant[]
		}

		const byId = new Map<string, OwnerRestaurant>()
		for (const restaurant of [
			...((owned ?? []) as OwnerRestaurant[]),
			...staffed,
		]) {
			byId.set(restaurant.id, restaurant)
		}
		return [...byId.values()].sort((a, b) =>
			a.created_at.localeCompare(b.created_at),
		)
	},
)

/** Resolve the active restaurant from the user's accessible set. */
export const getPrimaryRestaurant = cache(
	async (): Promise<OwnerRestaurant | null> => {
		const list = await getAccessibleRestaurants()
		if (list.length === 0) return null
		const store = await cookies()
		const activeId = store.get(ACTIVE_RESTAURANT_COOKIE)?.value
		return list.find((restaurant) => restaurant.id === activeId) ?? list[0]
	},
)

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
