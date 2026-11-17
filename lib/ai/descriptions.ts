import { z } from "zod"

/**
 * Bulk dish descriptions. The prompt fights the "AI menu" voice: short,
 * concrete (ingredients, texture, how it is served), no stock superlatives.
 */

export const BANNED_PHRASES = [
	"hương vị tuyệt hảo",
	"đánh thức vị giác",
	"bùng nổ vị giác",
	"tan chảy trong miệng",
	"trải nghiệm ẩm thực",
	"khó cưỡng",
	"không thể bỏ qua",
	"đậm đà khó quên",
	"chuẩn vị",
	"hoàn hảo",
	"tuyệt vời",
	"thượng hạng",
	"đỉnh cao",
	"say đắm",
]

/** Tone per template family, picked by the rule-based design suggester. */
export const TONES: Record<string, string> = {
	"fastfood-board": "trẻ, nhanh, nói rõ phần ăn gồm gì",
	"convenience-grid": "cực ngắn, thực tế, như nhãn sản phẩm",
	"cafe-chalkboard": "ấm, thân thiện, như người pha chế giới thiệu",
	"finedining-a4": "tiết chế, chính xác về nguyên liệu và cách chế biến",
	"bubbletea-poster": "vui, trẻ trung, nói rõ vị và topping",
	"vietnam-a4": "mộc, gần gũi, nói rõ nguyên liệu chính và cách ăn",
	"photo-grid": "rõ ràng, trung tính",
}

export function descriptionsSystem(tone: string): string {
	return `Bạn viết mô tả món cho menu quán ăn Việt Nam.

Yêu cầu:
- Mỗi mô tả 1 câu, tối đa 18 từ, tiếng Việt tự nhiên như chủ quán tự viết.
- Nói điều cụ thể: nguyên liệu chính, cách chế biến, kết cấu, ăn kèm gì, khẩu phần. Không chung chung.
- Giọng văn: ${tone}.
- KHÔNG dùng các cụm sáo rỗng: ${BANNED_PHRASES.map((p) => `"${p}"`).join(", ")}.
- Không dùng dấu chấm than, không emoji, không viết hoa để nhấn mạnh.
- Không bịa thông tin không suy ra được từ tên món (không bịa xuất xứ, giải thưởng, "công thức gia truyền").
- Nếu tên món quá mơ hồ để mô tả chính xác, trả về chuỗi rỗng cho món đó.
- Giữ nguyên id của từng món.`
}

export const descriptionsJsonSchema = {
	type: "object",
	properties: {
		items: {
			type: "array",
			items: {
				type: "object",
				properties: {
					id: { type: "string" },
					description: { type: "string" },
				},
				required: ["id", "description"],
			},
		},
	},
	required: ["items"],
} as const

export const descriptionsResponseSchema = z.object({
	items: z.array(z.object({ id: z.string(), description: z.string() })),
})

/** Drop empty answers and any line that slipped a banned phrase through. */
export function cleanDescription(text: string): string | null {
	const t = text.trim().replace(/\s+/g, " ").replace(/!+/g, ".")
	if (!t) return null
	const lower = t.toLowerCase()
	if (BANNED_PHRASES.some((p) => lower.includes(p))) return null
	return t.slice(0, 200)
}
