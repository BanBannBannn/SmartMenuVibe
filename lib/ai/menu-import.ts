import { z } from "zod"

/**
 * Menu import: photo/PDF of a paper menu -> structured draft the owner reviews
 * before anything is written. Shared by the API route (validates the model
 * output) and the save action (re-validates what the browser sends back).
 */

// Prices are whole VND. Upper bound guards against "350000000" OCR slips.
const price = z.number().int().min(0).max(100_000_000)

export const draftVariantSchema = z.object({
	name: z.string().trim().min(1).max(60),
	price,
})

export const draftItemSchema = z.object({
	name: z.string().trim().min(1).max(120),
	description: z.string().trim().max(300).nullable(),
	price: price.nullable(),
	variants: z.array(draftVariantSchema).max(10),
})

export const draftCategorySchema = z.object({
	name: z.string().trim().min(1).max(80),
	items: z.array(draftItemSchema).max(150),
})

export const menuDraftSchema = z.object({
	categories: z.array(draftCategorySchema).max(40),
})

export type MenuDraft = z.infer<typeof menuDraftSchema>
export type DraftItem = z.infer<typeof draftItemSchema>

/** Same shape as menuDraftSchema, as JSON Schema for the model's structured output. */
export const menuDraftJsonSchema = {
	type: "object",
	properties: {
		categories: {
			type: "array",
			items: {
				type: "object",
				properties: {
					name: { type: "string", description: "Tên danh mục như in trên menu" },
					items: {
						type: "array",
						items: {
							type: "object",
							properties: {
								name: { type: "string" },
								description: {
									type: ["string", "null"],
									description: "Chỉ khi menu có in mô tả; không tự bịa",
								},
								price: {
									type: ["integer", "null"],
									description: "Giá VND dạng số nguyên, null nếu không đọc được",
								},
								variants: {
									type: "array",
									description: "Size/lựa chọn có giá riêng, ví dụ M/L",
									items: {
										type: "object",
										properties: {
											name: { type: "string" },
											price: { type: "integer", description: "Giá đầy đủ của lựa chọn (VND)" },
										},
										required: ["name", "price"],
									},
								},
							},
							required: ["name", "description", "price", "variants"],
						},
					},
				},
				required: ["name", "items"],
			},
		},
	},
	required: ["categories"],
} as const

export const MENU_IMPORT_SYSTEM = `Bạn chuyển ảnh/PDF menu quán ăn Việt Nam thành dữ liệu có cấu trúc.

Quy tắc:
- Chép đúng tên món, tên danh mục như trên menu (giữ dấu tiếng Việt). Không dịch, không viết lại, không thêm món không có.
- Giá: đổi sang số nguyên VND. "35k" / "35K" = 35000; "35" trên menu có đơn vị nghìn = 35000; "1tr2" = 1200000; "35.000đ" = 35000.
- Món có nhiều size/lựa chọn với giá khác nhau (M/L, nhỏ/lớn, 1 người/2 người): đưa vào variants với giá đầy đủ của từng lựa chọn; price của món = giá thấp nhất.
- Không đọc rõ giá thì để price = null, không đoán.
- description chỉ điền khi menu có in mô tả; nếu không có thì null. Không tự viết mô tả.
- Món không thuộc danh mục nào: gom vào danh mục "Khác".
- Bỏ qua địa chỉ, số điện thoại, wifi, khuyến mãi chung, ghi chú không phải món.
- Nếu ảnh không phải menu, trả về categories rỗng.`

/**
 * Turn a reviewed draft item into DB rows: base price = explicit price or the
 * cheapest variant; each variant stored as a delta from that base.
 */
export function toItemRows(item: DraftItem) {
	const variantPrices = item.variants.map((v) => v.price)
	const base =
		item.price ?? (variantPrices.length ? Math.min(...variantPrices) : 0)
	return {
		basePrice: base,
		variants: item.variants.map((v, i) => ({
			name: v.name,
			price_delta: v.price - base,
			sort_order: i,
		})),
	}
}
