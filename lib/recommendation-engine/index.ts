import type {
	RecommendationContext,
	RecommendationResult,
	RecommendationRule,
	TimeOfDay,
	WeatherBucket,
} from "./types"

export * from "./types"

/** Map a 0-23 hour to a time-of-day bucket. Ranges are inclusive of start. */
export function timeOfDayFromHour(hour: number): TimeOfDay {
	const h = ((hour % 24) + 24) % 24
	if (h >= 5 && h < 11) return "morning"
	if (h >= 11 && h < 14) return "noon"
	if (h >= 14 && h < 17) return "afternoon"
	if (h >= 17 && h < 22) return "evening"
	return "late_night"
}

/** Convert an OpenWeather condition + temperature to our simple bucket. */
export function weatherBucket(
	main: string,
	tempC: number,
): WeatherBucket {
	const m = main.toLowerCase()
	if (m.includes("rain") || m.includes("drizzle") || m.includes("thunderstorm"))
		return "rain"
	if (tempC <= 22) return "cold"
	if (tempC >= 30) return "hot"
	return "neutral"
}

function hhmmToMinutes(value: string): number {
	const [h, m] = value.split(":").map((n) => parseInt(n, 10))
	return h * 60 + (m || 0)
}

/** Does the current hour fall inside a rule's [from, to] window? Handles
 * windows that wrap past midnight (e.g. 22:00 -> 02:00). */
function hourInWindow(hour: number, from?: string, to?: string): boolean {
	if (!from || !to) return true
	const now = hour * 60
	const start = hhmmToMinutes(from)
	const end = hhmmToMinutes(to)
	if (start <= end) return now >= start && now <= end
	return now >= start || now <= end // wraps midnight
}

const REASONS: Record<string, string> = {
	morning: "Gợi ý cho buổi sáng",
	noon: "Gợi ý cho buổi trưa",
	afternoon: "Gợi ý cho buổi chiều",
	evening: "Gợi ý cho buổi tối",
	late_night: "Gợi ý cho đêm khuya",
	hot: "Trời nóng — món/đồ uống mát",
	cold: "Trời mát — món nóng, ấm bụng",
	rain: "Trời mưa — món nóng hổi",
	best_seller: "Món bán chạy tại quán",
	combo: "Combo ưu đãi của quán",
}

/**
 * Core engine. Deterministic, dependency-free, unit-tested (Plan section 11.3).
 * Combines owner-configured rules with time-of-day, weather and best sellers.
 * Rules are applied by priority (desc); duplicates are removed while keeping
 * the highest-priority reason. Returns at most `limit` item ids.
 */
export function recommend(
	rules: RecommendationRule[],
	context: RecommendationContext,
	limit = 6,
): RecommendationResult {
	const tod = timeOfDayFromHour(context.hour)
	const ordered = [...rules]
		.filter((r) => r.isActive)
		.sort((a, b) => b.priority - a.priority)

	const itemIds: string[] = []
	const reasons: Record<string, string> = {}

	const push = (ids: string[], reason: string) => {
		for (const id of ids) {
			if (!itemIds.includes(id)) {
				itemIds.push(id)
				reasons[id] = reason
			}
		}
	}

	for (const rule of ordered) {
		if (itemIds.length >= limit) break
		switch (rule.ruleType) {
			case "time_of_day": {
				const matchesList =
					!rule.conditions.timesOfDay ||
					rule.conditions.timesOfDay.includes(tod)
				if (
					matchesList &&
					hourInWindow(context.hour, rule.conditions.from, rule.conditions.to)
				) {
					push(rule.suggestedItemIds, REASONS[tod])
				}
				break
			}
			case "weather": {
				if (
					rule.conditions.weather &&
					rule.conditions.weather.includes(context.weather)
				) {
					push(rule.suggestedItemIds, REASONS[context.weather])
				}
				break
			}
			case "combo": {
				push(rule.suggestedItemIds, REASONS.combo)
				break
			}
			case "best_seller": {
				push(context.bestSellerItemIds, REASONS.best_seller)
				break
			}
		}
	}

	// Fallback: always fill remaining slots with best sellers so the block is
	// never empty even when a restaurant configured no rules.
	if (itemIds.length < limit) {
		push(context.bestSellerItemIds, REASONS.best_seller)
	}

	return { itemIds: itemIds.slice(0, limit), reasons }
}
