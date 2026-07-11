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

	const { data: restaurant } = await db
		.from("restaurants")
		.select("id, city, lat, lon, timezone")
		.eq("id", restaurantId)
		.maybeSingle()
	if (!restaurant)
		return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 })

	const { data: ruleRows } = await db
		.from("recommendation_rules")
		.select("id, rule_type, name, conditions, suggested_item_ids, priority, is_active")
		.eq("restaurant_id", restaurantId)
		.eq("is_active", true)

	// Best sellers: most-referenced items across recent order_items.
	const { data: sellers } = await db
		.from("order_items")
		.select("menu_item_id")
		.not("menu_item_id", "is", null)
		.limit(500)
	const counts = new Map<string, number>()
	for (const row of sellers ?? []) {
		const id = row.menu_item_id as string | null
		if (id) counts.set(id, (counts.get(id) ?? 0) + 1)
	}
	const bestSellerItemIds = [...counts.entries()]
		.sort((a, b) => b[1] - a[1])
		.map(([id]) => id)

	const weather = await getCurrentWeather(
		restaurant.city ?? "Ho Chi Minh",
		restaurant.lat ?? undefined,
		restaurant.lon ?? undefined,
	)

	// Local hour at the restaurant timezone.
	const hour = Number(
		new Intl.DateTimeFormat("en-US", {
			hour: "numeric",
			hour12: false,
			timeZone: restaurant.timezone || "Asia/Ho_Chi_Minh",
		}).format(new Date()),
	)

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
		weather: weather.bucket,
		bestSellerItemIds,
	})

	return NextResponse.json({
		...result,
		context: { hour, timeOfDay: timeOfDayFromHour(hour), weather: weather.bucket },
	})
}
