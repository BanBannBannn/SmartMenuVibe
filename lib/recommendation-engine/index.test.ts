import { describe, it, expect } from "vitest"
import {
	timeOfDayFromHour,
	weatherBucket,
	recommend,
	type RecommendationRule,
} from "./index"

describe("timeOfDayFromHour", () => {
	it("maps hours to buckets", () => {
		expect(timeOfDayFromHour(7)).toBe("morning")
		expect(timeOfDayFromHour(12)).toBe("noon")
		expect(timeOfDayFromHour(15)).toBe("afternoon")
		expect(timeOfDayFromHour(19)).toBe("evening")
		expect(timeOfDayFromHour(2)).toBe("late_night")
	})
	it("normalises out-of-range hours", () => {
		expect(timeOfDayFromHour(26)).toBe("late_night")
		expect(timeOfDayFromHour(-1)).toBe("late_night")
	})
})

describe("weatherBucket", () => {
	it("classifies rain regardless of temp", () => {
		expect(weatherBucket("Rain", 35)).toBe("rain")
		expect(weatherBucket("Thunderstorm", 20)).toBe("rain")
	})
	it("classifies hot and cold by temperature", () => {
		expect(weatherBucket("Clear", 33)).toBe("hot")
		expect(weatherBucket("Clouds", 18)).toBe("cold")
		expect(weatherBucket("Clouds", 26)).toBe("neutral")
	})
})

describe("recommend", () => {
	const weatherRule: RecommendationRule = {
		id: "r1",
		ruleType: "weather",
		name: "Nóng",
		conditions: { weather: ["hot"] },
		suggestedItemIds: ["drink1", "drink2"],
		priority: 200,
		isActive: true,
	}
	const timeRule: RecommendationRule = {
		id: "r2",
		ruleType: "time_of_day",
		name: "Sáng",
		conditions: { timesOfDay: ["morning"] },
		suggestedItemIds: ["pho", "banhmi"],
		priority: 100,
		isActive: true,
	}

	it("applies matching rules by priority and dedupes", () => {
		const res = recommend([timeRule, weatherRule], {
			hour: 8,
			weather: "hot",
			bestSellerItemIds: ["bs1"],
		})
		// weather rule has higher priority so its items come first
		expect(res.itemIds.slice(0, 2)).toEqual(["drink1", "drink2"])
		expect(res.itemIds).toContain("pho")
		expect(res.reasons["drink1"]).toContain("nóng")
	})

	it("falls back to best sellers when no rules match", () => {
		const res = recommend([], {
			hour: 12,
			weather: "neutral",
			bestSellerItemIds: ["bs1", "bs2"],
		})
		expect(res.itemIds).toEqual(["bs1", "bs2"])
	})

	it("respects the limit", () => {
		const res = recommend([], {
			hour: 12,
			weather: "neutral",
			bestSellerItemIds: Array.from({ length: 20 }, (_, i) => `x${i}`),
		})
		expect(res.itemIds).toHaveLength(6)
	})
})
