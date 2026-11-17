import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getCurrentWeather } from "@/lib/weather"
import {
	recommend,
	timeOfDayFromHour,
	type RecommendationRule,
} from "@/lib/recommendation-engine"

/**
 * Public recommendations for a restaurant's menu (Plan section 3.6).
 * Query: ?restaurantId=...  Combines owner rules + local hour + weather +
 * best sellers. Works with zero rules (best-seller fallback).
 */
export async function GET(request: Request) {
	const { searchParams } = new URL(request.url)
	const restaurantId = searchParams.get("restaurantId")
	if (!restaurantId)
		return NextResponse.json({ error: "MISSING_RESTAURANT" }, { status: 400 })

	const db = createAdminClient()

	// Independent reads run in parallel.
	const [{ data: restaurant }, { data: ruleRows }, { data: recentOrders }] =
		await Promise.all([
			db
				.from("restaurants")
				.select("id, city, lat, lon, timezone")
				.eq("id", restaurantId)
				.maybeSingle(),
			db
				.from("recommendation_rules")
				.select(
					"id, rule_type, name, conditions, suggested_item_ids, priority, is_active",
				)
				.eq("restaurant_id", restaurantId)
				.eq("is_active", true),
			// Best sellers: items in this restaurant's 200 most recent orders.
			db
				.from("orders")
				.select("order_items(menu_item_id, quantity)")
				.eq("restaurant_id", restaurantId)
				.order("created_at", { ascending: false })
				.limit(200),
		])
	if (!restaurant)
		return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 })

	const counts = new Map<string, number>()
	for (const order of recentOrders ?? []) {
		for (const row of order.order_items ?? []) {
			const id = row.menu_item_id
			if (id) counts.set(id, (counts.get(id) ?? 0) + (row.quantity ?? 1))
		}
	}
	const bestSellerItemIds = [...counts.entries()]
		.sort((a, b) => b[1] - a[1])
		.map(([id]) => id)

	const weather = await getCurrentWeather(
		restaurant.city ?? "Ho Chi Minh",
		restaurant.lat ?? undefined,
		restaurant.lon ?? undefined,
	)

	// Local hour + minute at the restaurant timezone.
	const parts = new Intl.DateTimeFormat("en-US", {
		hour: "numeric",
		minute: "numeric",
		hour12: false,
		timeZone: restaurant.timezone || "Asia/Ho_Chi_Minh",
	}).formatToParts(new Date())
	const hour = Number(parts.find((p) => p.type === "hour")?.value ?? 0) % 24
	const minute = Number(parts.find((p) => p.type === "minute")?.value ?? 0)

	const rules: RecommendationRule[] = (ruleRows ?? []).map((r) => ({
		id: r.id,
		ruleType: r.rule_type,
		name: r.name,
		conditions: (r.conditions ?? {}) as RecommendationRule["conditions"],
		suggestedItemIds: (r.suggested_item_ids ?? []) as string[],
		priority: r.priority,
		isActive: r.is_active,
	}))

	const result = recommend(rules, {
		hour,
		minute,
		weather: weather.bucket,
		bestSellerItemIds,
	})

	return NextResponse.json(
		{
			...result,
			context: { hour, timeOfDay: timeOfDayFromHour(hour), weather: weather.bucket },
		},
		{
			// Same answer for every guest of a restaurant within a few minutes, so
			// let the CDN serve repeats instead of re-running four lookups.
			headers: {
				"Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
			},
		},
	)
}
