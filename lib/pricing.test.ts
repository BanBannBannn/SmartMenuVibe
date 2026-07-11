import { describe, it, expect } from "vitest"
import { unitPrice, priceCart } from "./pricing"

describe("unitPrice", () => {
	it("adds variant delta to base price", () => {
		expect(unitPrice({ menuItemId: "a", name: "Phở", basePrice: 50000, quantity: 1, variantPriceDelta: 10000 })).toBe(60000)
	})
	it("rounds and never goes negative", () => {
		expect(unitPrice({ menuItemId: "a", name: "x", basePrice: 100.4, quantity: 1 })).toBe(100)
		expect(unitPrice({ menuItemId: "a", name: "x", basePrice: 100, quantity: 1, variantPriceDelta: -500 })).toBe(0)
	})
})

describe("priceCart", () => {
	it("computes subtotal, total and item count", () => {
		const cart = priceCart([
			{ menuItemId: "a", name: "Phở", basePrice: 50000, quantity: 2 },
			{ menuItemId: "b", name: "Trà", basePrice: 15000, quantity: 1, variantPriceDelta: 5000 },
		])
		expect(cart.subtotal).toBe(120000)
		expect(cart.total).toBe(120000)
		expect(cart.itemCount).toBe(3)
		expect(cart.lines[0].lineTotal).toBe(100000)
	})
	it("handles an empty cart", () => {
		const cart = priceCart([])
		expect(cart.subtotal).toBe(0)
		expect(cart.itemCount).toBe(0)
	})
})
