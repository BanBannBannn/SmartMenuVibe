/** User-facing messages for the error codes returned by /api/ai/* routes. */
export const AI_ERRORS: Record<string, string> = {
	FILE_COUNT: "Chọn từ 1 đến 3 ảnh hoặc 1 file PDF.",
	FILE_TYPE: "Chỉ nhận ảnh JPG/PNG/WEBP hoặc PDF.",
	FILE_SIZE: "Tệp quá lớn (tối đa khoảng 4MB). Thử ảnh nhỏ hơn hoặc PDF ít trang hơn.",
	DAILY_LIMIT: "Bạn đã dùng hết 5 lượt hôm nay. Thử lại vào ngày mai nhé.",
	AI_QUOTA: "AI miễn phí đang hết lượt. Thử lại sau ít phút.",
	AI_DISABLED: "Tính năng AI chưa được cấu hình.",
	AI_UNAVAILABLE: "AI đang bận hoặc lỗi. Thử lại sau.",
	BAD_OUTPUT: "AI trả kết quả không hợp lệ. Thử lại nhé.",
}

export function aiErrorMessage(code: unknown, fallback = "Có lỗi xảy ra, thử lại sau.") {
	return (typeof code === "string" && AI_ERRORS[code]) || fallback
}
