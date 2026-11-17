import { describe, expect, it } from "vitest"
import { signalsFrom, suggestTemplates } from "./design-suggest"

const item = (name: string, price: number, photo = true) => ({
	name,
	base_price: price,
	images: photo ? ["x.jpg"] : [],
})

describe("suggestTemplates", () => {
	it("puts the bubble tea poster first for a milk tea shop", () => {
		const s = signalsFrom(
			[{ name: "Trà sữa" }, { name: "Topping" }],
			[item("Trà sữa trân châu", 30000), item("Matcha đá xay", 35000)],
		)
		expect(suggestTemplates(s)[0].templateId).toBe("bubbletea-poster")
	})

	it("prefers fine dining for an expensive menu without photos", () => {
		const s = signalsFrom(
			[{ name: "Khai vị" }, { name: "Món chính" }],
			[item("Bò wagyu nướng", 890000, false), item("Cá hồi áp chảo", 420000, false)],
		)
		const top = suggestTemplates(s)[0]
		expect(top.templateId).toBe("finedining-a4")
		expect(top.reasons.length).toBeGreaterThan(0)
	})

	it("falls back to the generic photo grid when nothing matches", () => {
		const s = signalsFrom([{ name: "Món" }], [item("Món A", 50000)])
		expect(suggestTemplates(s)[0].templateId).toBe("photo-grid")
	})

	it("ranks every template exactly once", () => {
		const s = signalsFrom([], [])
		const ids = suggestTemplates(s).map((t) => t.templateId)
		expect(new Set(ids).size).toBe(ids.length)
		expect(ids.length).toBe(7)
	})
})
