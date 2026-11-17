import { describe, expect, it } from "vitest"
import { cleanDescription } from "./descriptions"

describe("cleanDescription", () => {
	it("drops lines that use banned stock phrases", () => {
		expect(cleanDescription("Phở bò với hương vị tuyệt hảo")).toBeNull()
		expect(cleanDescription("Món ăn ĐÁNH THỨC VỊ GIÁC")).toBeNull()
	})
	it("keeps concrete descriptions and strips exclamation marks", () => {
		expect(cleanDescription("  Bánh phở mềm, nước dùng xương bò hầm 8 tiếng! ")).toBe(
			"Bánh phở mềm, nước dùng xương bò hầm 8 tiếng.",
		)
	})
	it("treats empty answers as no suggestion", () => {
		expect(cleanDescription("   ")).toBeNull()
	})
})
