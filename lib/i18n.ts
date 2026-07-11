/**
 * Lightweight i18n dictionary (Plan section 14 default: Vietnamese primary,
 * structure ready for Vietnamese/English later). Not a full i18n framework -
 * intentionally minimal so it adds no runtime deps. Swap for next-intl in
 * Phase 3 if full localisation is needed.
 */

export type Locale = "vi" | "en"

const dict = {
	vi: {
		"menu.recommended": "Gợi ý cho bạn",
		"menu.addToCart": "Thêm vào giỏ",
		"cart.title": "Giỏ hàng",
		"cart.submit": "Gửeri đơn",
		"cart.empty": "Giỏ hàng đang trống",
		"order.status.pending": "Chờ xác nhận",
		"order.status.confirmed": "Đã xác nhận",
		"order.status.preparing": "Đang làm",
		"order.status.ready": "Sẵn sàng",
		"order.status.served": "Đã phục vụ",
		"order.status.completed": "Hoàn thành",
		"order.status.cancelled": "Đã huỷ",
	},
	en: {
		"menu.recommended": "Recommended for you",
		"menu.addToCart": "Add to cart",
		"cart.title": "Cart",
		"cart.submit": "Place order",
		"cart.empty": "Your cart is empty",
		"order.status.pending": "Pending",
		"order.status.confirmed": "Confirmed",
		"order.status.preparing": "Preparing",
		"order.status.ready": "Ready",
		"order.status.served": "Served",
		"order.status.completed": "Completed",
		"order.status.cancelled": "Cancelled",
	},
} as const

export type MessageKey = keyof (typeof dict)["vi"]

export function t(key: MessageKey, locale: Locale = "vi"): string {
	return dict[locale][key] ?? dict.vi[key] ?? key
}

export const orderStatusLabel: Record<string, string> = {
	pending: dict.vi["order.status.pending"],
	confirmed: dict.vi["order.status.confirmed"],
	preparing: dict.vi["order.status.preparing"],
	ready: dict.vi["order.status.ready"],
	served: dict.vi["order.status.served"],
	completed: dict.vi["order.status.completed"],
	cancelled: dict.vi["order.status.cancelled"],
}
