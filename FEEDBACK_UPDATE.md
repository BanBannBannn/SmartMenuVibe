## 📋 Task: Đã sửa chuẩn gửi Resend API & Đưa nút Phản ánh vào Dashboard Nhà Hàng

### Context đã xác nhận
- Địa chỉ gửi email (`from`) của Resend được chỉnh về chuẩn `onboarding@resend.dev`.
- Giữ nguyên email do người dùng/nhà hàng nhập ở phần thông tin chi tiết HTML và gán làm `reply_to`.
- Nút "Gửi phản ánh & Ý kiến" được đưa thêm vào trong giao diện quản lý nhà hàng (`/dashboard`).

### Đã thực hiện
- [x] Sửa định dạng payload `from: "onboarding@resend.dev"` trong [`app/api/feedback/route.ts`](file:///Users/tranvangiaban/Code/SmartMenuVibe/app/api/feedback/route.ts) và bổ sung log lỗi Resend chi tiết.
- [x] Đưa nút `FeedbackModal` vào Header Dashboard trong [`app/(owner)/layout.tsx`](file:///Users/tranvangiaban/Code/SmartMenuVibe/app/(owner)/layout.tsx).
- [x] Đưa nút `FeedbackModal` vào chân Sidebar và Mobile Navigation trong [`components/dashboard/dashboard-nav.tsx`](file:///Users/tranvangiaban/Code/SmartMenuVibe/components/dashboard/dashboard-nav.tsx).
- [x] Chạy `npm run typecheck`: 0 lỗi.

### Files thay đổi
- [`app/api/feedback/route.ts`](file:///Users/tranvangiaban/Code/SmartMenuVibe/app/api/feedback/route.ts) — Sửa từ địa chỉ gửi mail `onboarding@resend.dev` chuẩn API Resend.
- [`app/(owner)/layout.tsx`](file:///Users/tranvangiaban/Code/SmartMenuVibe/app/(owner)/layout.tsx) — Tích hợp nút Phản ánh ở Header Dashboard nhà hàng.
- [`components/dashboard/dashboard-nav.tsx`](file:///Users/tranvangiaban/Code/SmartMenuVibe/components/dashboard/dashboard-nav.tsx) — Tích hợp nút Phản ánh ở Sidebar & Mobile nav nhà hàng.

### Trạng thái
✅ Hoàn thành

### Bước tiếp theo (nếu còn)
- Không có.

### ⚠️ Cảnh báo / Gợi ý
- **Gửi Email thử nghiệm với Resend Sandbox:** Địa chỉ `onboarding@resend.dev` của Resend hoạt động ở chế độ Sandbox (Free tier), chỉ cho phép gửi email tới duy nhất địa chỉ email chính của tài khoản Resend mà bạn dùng tạo key (`tranvangiaban+smartmenu@gmail.com`). Do đó email phản ánh sẽ được gửi thẳng tới Gmail này của bạn mà không lo bị rơi vào spam hay từ chối domain.
- Bạn có muốn tôi xử lý luôn phần optional này không?
