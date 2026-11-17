import { describe, expect, it } from "vitest"
import { menuDraftSchema, toItemRows } from "./menu-import"

describe("toItemRows", () => {
	it("uses the explicit price as base and stores variant deltas", () => {
		const rows = toItemRows({
			name: "Trà sữa",
			description: null,
			price: 30000,
			variants: [
				{ name: "M", price: 30000 },
				{ name: "L", price: 35000 },
			],
		})
		expect(rows.basePrice).toBe(30000)
		expect(rows.variants.map((v) => v.price_delta)).toEqual([0, 5000])
	})

	it("falls back to the cheapest variant when the base price is missing", () => {
		const rows = toItemRows({
			name: "Lẩu",
			description: null,
			price: null,
			variants: [
				{ name: "2 người", price: 250000 },
				{ name: "4 người", price: 450000 },
			],
		})
		expect(rows.basePrice).toBe(250000)
		expect(rows.variants.map((v) => v.price_delta)).toEqual([0, 200000])
	})
})

describe("menuDraftSchema", () => {
	it("rejects absurd prices from OCR slips", () => {
		const bad = {
			categories: [
				{ name: "Món", items: [{ name: "Phở", description: null, price: 350_000_000, variants: [] }] },
			],
		}
		expect(menuDraftSchema.safeParse(bad).success).toBe(false)
	})
})
