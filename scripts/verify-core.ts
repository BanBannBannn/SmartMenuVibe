/**
 * Standalone verifier for the pure business logic, runnable WITHOUT installing
 * vitest or any network deps:  npx tsx scripts/verify-core.ts
 * Mirrors the vitest specs so the core can be validated in an offline sandbox.
 */
import assert from "node:assert/strict"
import { unitPrice, priceCart } from "../lib/pricing"
import {
	timeOfDayFromHour,
	weatherBucket,
	recommend,
	type RecommendationRule,
} from "../lib/recommendation-engine/index"

let passed = 0
function check(label: string, fn: () => void) {
	fn()
	passed++
	console.log("  \u2713 " + label)
}

console.log("pricing")
check("unitPrice adds variant delta", () => {
	assert.equal(
		unitPrice({ menuItemId: "a", name: "Phở", basePrice: 50000, quantity: 1, variantPriceDelta: 10000 }),
		60000,
	)
})
check("unitPrice never negative", () => {
	assert.equal(unitPrice({ menuItemId: "a", name: "x", basePrice: 100, quantity: 1, variantPriceDelta: -500 }), 0)
})
check("priceCart totals", () => {
	const cart = priceCart([
		{ menuItemId: "a", name: "Phở", basePrice: 50000, quantity: 2 },
		{ menuItemId: "b", name: "Trà", basePrice: 15000, quantity: 1, variantPriceDelta: 5000 },
	])
	assert.equal(cart.subtotal, 120000)
	assert.equal(cart.itemCount, 3)
})

console.log("recommendation-engine")
check("timeOfDayFromHour buckets", () => {
	assert.equal(timeOfDayFromHour(7), "morning")
	assert.equal(timeOfDayFromHour(19), "evening")
	assert.equal(timeOfDayFromHour(2), "late_night")
})
check("weatherBucket classification", () => {
	assert.equal(weatherBucket("Rain", 35), "rain")
	assert.equal(weatherBucket("Clear", 33), "hot")
	assert.equal(weatherBucket("Clouds", 18), "cold")
})
const weatherRule: RecommendationRule = {
	id: "r1", ruleType: "weather", name: "Nóng",
	conditions: { weather: ["hot"] }, suggestedItemIds: ["drink1", "drink2"],
	priority: 200, isActive: true,
}
const timeRule: RecommendationRule = {
	id: "r2", ruleType: "time_of_day", name: "Sáng",
	conditions: { timesOfDay: ["morning"] }, suggestedItemIds: ["pho", "banhmi"],
	priority: 100, isActive: true,
}
check("recommend applies priority + dedupe", () => {
	const res = recommend([timeRule, weatherRule], { hour: 8, weather: "hot", bestSellerItemIds: ["bs1"] })
	assert.deepEqual(res.itemIds.slice(0, 2), ["drink1", "drink2"])
	assert.ok(res.itemIds.includes("pho"))
})
check("recommend falls back to best sellers", () => {
	const res = recommend([], { hour: 12, weather: "neutral", bestSellerItemIds: ["bs1", "bs2"] })
	assert.deepEqual(res.itemIds, ["bs1", "bs2"])
})
check("recommend respects limit", () => {
	const res = recommend([], { hour: 12, weather: "neutral", bestSellerItemIds: Array.from({ length: 20 }, (_, i) => `x${i}`) })
	assert.equal(res.itemIds.length, 6)
})

console.log(`\nAll ${passed} core checks passed \u2705`)
