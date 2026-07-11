import "server-only"
import { createClient } from "@/lib/supabase/server"

export type RuleType = "time_of_day" | "weather" | "combo" | "best_seller"

export type RecommendationRule = {
	id: string
	rule_type: RuleType
	name: string
	conditions: Record<string, unknown>
	suggested_item_ids: string[]
	priority: number
	is_active: boolean
}

export async function loadRecommendationRules(restaurantId: string) {
	const supabase = await createClient()
	const { data } = await supabase
		.from("recommendation_rules")
		.select(
			"id, rule_type, name, conditions, suggested_item_ids, priority, is_active",
		)
		.eq("restaurant_id", restaurantId)
		.order("priority")
	return (data ?? []) as RecommendationRule[]
}
