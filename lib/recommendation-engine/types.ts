/** Shared types for the context-based recommendation engine (Plan section 3.6). */

export type TimeOfDay = "morning" | "noon" | "afternoon" | "evening" | "late_night"

export type WeatherBucket = "hot" | "cold" | "rain" | "neutral"

export type RuleType = "time_of_day" | "weather" | "combo" | "best_seller"

export type RecommendationRule = {
	id: string
	ruleType: RuleType
	name: string
	conditions: {
		from?: string // "18:00"
		to?: string // "22:00"
		timesOfDay?: TimeOfDay[]
		weather?: WeatherBucket[]
	}
	suggestedItemIds: string[]
	priority: number
	isActive: boolean
}

export type RecommendationContext = {
	/** Local hour 0-23 at the restaurant. */
	hour: number
	weather: WeatherBucket
	/** Item ids sorted by sales volume desc (from analytics). */
	bestSellerItemIds: string[]
}

export type RecommendationResult = {
	itemIds: string[]
	reasons: Record<string, string> // itemId -> human-readable reason (Vietnamese)
}
