# Tiến độ & trạng thái hoàn thiện

Tài liệu này đối chiếu với checklist ở **Section 10** của `SmartMenu_Project_Plan.md`.

## Đã hoàn thành trong bản này

### Phase 0 — Nền tảng
- [x] Cấu hình dự án: `package.json`, `tsconfig.json`, `next.config.ts` (standalone), Tailwind, ESLint, Prettier, Vitest, Playwright config
- [x] Docker multi-stage + `docker-compose.yml` + `.dockerignore` (khớp Plan 12.3)
- [x] `.env.example` đầy đủ biến, không hardcode secret
- [x] Supabase client/server/admin/middleware

### Cơ sở dữ liệu (Supabase)
- [x] `migrations/…_init_schema.sql` — toàn bộ bảng ở Section 6.2
- [x] `…_functions_triggers.sql` — `set_updated_at`, `handle_new_user`, `has_restaurant_access`, `is_super_admin`, `recalc_order_totals`, `bump_revenue_summary`
- [x] `…_rls_policies.sql` — **RLS bật trên mọi bảng**
- [x] `…_storage.sql` — 3 bucket (logos, menu-images, covers)
- [x] `seed.sql` — 4 theme template hệ thống
- [x] `types/database.ts` (viết tay, có script sinh lại)

### Phase 1 — MVP
- [x] Auth: đăng nhập / đăng ký / đăng xuất / callback + middleware refresh session
- [x] Tạo & cấu hình nhà hàng, tự tạo menu mặc định
- [x] Menu CRUD (danh mục + món, bật/tắt còn hàng, xoá)
- [x] Đặt món cho khách qua QR: `/{slug}/{tableToken}` (server-rendered, giỏ hàng Zustand + localStorage, ≤ vài chạm)
- [x] Tạo bàn + sinh **QR** cho từng bàn (in được)
- [x] Luồng đơn hàng: API tạo đơn (định giá lại phía server, validate Zod, rate-limit)
- [x] **Kitchen Dashboard realtime** (Kanban, Supabase Realtime)
- [x] Theo dõi trạng thái đơn realtime cho khách (+ fallback polling)
- [x] Dashboard doanh thu (Recharts) + thống kê hôm nay
- [x] Cổng **Super Admin** (danh sách nhà hàng, kích hoạt/tạm khoá, nhật ký audit)
- [x] Responsive (mobile-first)

### Phase 2 — Builder + gợi ý
- [x] **Menu builder kéo–thả** (dnd-kit) + xem trước trực tiếp
- [x] Thư viện theme template + áp CSS variables theo nhà hàng
- [x] Hiệu ứng **Framer Motion** (giỏ hàng, thẻ món)
- [x] **AI viết mô tả món** (feature-flag, tự fallback khi thiếu LLM key)
- [x] **Engine gợi ý theo ngữ cảnh** (giờ + thời tiết + bán chạy + luật của quán) — thuần, có unit-test
- [x] UI cấu hình luật gợi ý cho chủ quán
- [x] **Màn hình đồng ý quét khuôn mặt riêng biệt** + Face Detect; Identify gắn cờ, mặc định tắt
- [x] API: orders, face, ai/description, recommendations

### Phase 3 — Mở rộng (scaffold)
- [x] PWA manifest + cờ `NEXT_PUBLIC_PAYMENTS_ENABLED`
- [x] Bảng `audit_logs`, `notifications` + ghi audit khi admin đổi trạng thái
- [x] Rate limiting (`lib/rate-limit.ts`)
- [x] Khung i18n (`lib/i18n.ts`, vi/en)

## Đã kiểm thử offline (trong sandbox không mạng)
- [x] `npx tsx scripts/verify-core.ts` → **8/8 check PASS** (định giá + engine gợi ý)
- [x] Cùng bộ test dưới dạng Vitest: `lib/pricing.test.ts`, `lib/recommendation-engine/index.test.ts`

## Cần môi trường CÓ MẠNG để hoàn tất (theo Plan Section 13)
Môi trường tạo bản này **không có mạng** nên chưa thể:
- [ ] `npm install` (cài Next.js, React, Supabase SDK, dnd-kit, recharts, framer-motion, vitest…)
- [ ] `npm run build` / kiểm tra type toàn dự án (cần types của Next/React sau khi cài)
- [ ] Kết nối Supabase thật: chạy migrations, test Auth/RLS/Realtime/Storage
- [ ] Gọi Azure Face, OpenWeather, LLM thật (đã tách sau feature-flag + fallback)
- [ ] Chạy E2E Playwright trên server thật

### Việc cần làm khi có mạng
1. `npm install` rồi `npm run build` để bắt lỗi type còn lại (đặc biệt ở tầng React/Next).
2. Tạo project Supabase, điền `.env.local`, `supabase db push`, `npm run db:types`.
3. Tạo Person Group Azure (nếu bật Identify sau khi được duyệt).
4. Chạy `npm run test` (Vitest) và E2E Playwright.

> Lưu ý: một số kiểu dữ liệu ở tầng UI dùng type React/Next chỉ có sau khi `npm install`. Logic nghiệp vụ thuần (định giá, gợi ý) đã được kiểm thử độc lập và chạy đạt trong môi trường hiện tại.
