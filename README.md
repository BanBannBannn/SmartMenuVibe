# SmartMenu

Nền tảng SaaS đa nhà hàng: **menu số, đặt món qua QR, gợi ý món thông minh theo ngữ cảnh, và bảng bếp realtime**.

> Tài liệu bằng tiếng Việt, mã nguồn & cơ sở dữ liệu bằng tiếng Anh. Xem `SmartMenu_Project_Plan.md` để biết đặc tả đầy đủ.

## Tech stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **TailwindCSS** + shadcn-style UI + **Framer Motion**
- **@dnd-kit** (menu builder), **TanStack Query** + **Zustand** (giỏ hàng)
- **Supabase** (Postgres, Auth, Storage, Realtime, RLS)
- **Azure Face API** (Detect luôn bật; Identify gắn feature-flag)
- **OpenWeatherMap** (endpoint miễn phí 2.5)
- **Recharts** (doanh thu), **qrcode** (QR bàn)
- **Docker** (multi-stage, `output: standalone`)

## Bắt đầu

```bash
# 1. Cài dependencies (cần mạng)
npm install

# 2. Tạo file môi trường
cp .env.example .env.local   # điền các khoá Supabase / Azure / OpenWeather

# 3. Áp migrations + seed vào Supabase
supabase db push            # hoặc chạy các file trong supabase/migrations
npm run db:types            # sinh lại types/database.ts từ schema thật

# 4. Chạy dev
npm run dev
```

## Biến môi trường

Xem `.env.example`. Quan trọng:

| Biến | Ý nghĩa |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Chỉ dùng phía server (guest reads, order writes) |
| `SUPABASE_DB_POOLER_URL` | Supavisor **session pooler** (IPv4) |
| `AZURE_FACE_KEY` / `AZURE_FACE_ENDPOINT` | Azure Face |
| `FACE_IDENTIFY_ENABLED` | Mặc định `false` — chỉ bật sau khi Microsoft duyệt |
| `OPENWEATHER_API_KEY` | OpenWeather 2.5 |
| `LLM_PROVIDER` / `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` / `LLM_MODEL` | AI viết mô tả (tuỳ chọn, tự fallback) |
| `NEXT_PUBLIC_PAYMENTS_ENABLED` | Cờ thanh toán online (Phase 3, mặc định off) |

## Scripts

```bash
npm run dev            # chạy dev server
npm run build          # build production (standalone)
npm run start          # chạy bản build
npm run lint           # ESLint
npm run test           # Vitest (cần cài vitest)
npm run verify:core    # Kiểm thử logic thuần bằng tsx (KHÔNG cần cài thêm)
npm run db:types       # sinh types Supabase
```

## Kiến trúc thư mục

```
app/
  (auth)/           # server actions đăng nhập/đăng ký
  login, register   # trang auth
  (guest)/[restaurantSlug]/[tableToken]/   # trang đặt món cho khách
  (owner)/dashboard/                       # cổng chủ quán
  (admin)/admin/                           # cổng super admin
  api/                                     # orders, face, ai, recommendations
lib/
  supabase/         # client / server / admin / middleware
  pricing.ts        # tính giá thuần (unit-test)
  recommendation-engine/  # engine gợi ý thuần (unit-test)
  weather, azure-face, llm, qr, theme, i18n, rate-limit
components/         # ui/, guest/, menu/, menu-builder/, kitchen/, tables/, revenue/
supabase/migrations # schema, functions/triggers, RLS, storage
types/              # database.ts (Supabase), domain.ts
```

## Bảo mật & tuân thủ

- **RLS bật trên mọi bảng**; service-role chỉ dùng phía server và luôn giới hạn theo `restaurant_id`.
- **Không hardcode secret** — tất cả qua biến môi trường.
- **Khuôn mặt**: cần **đồng ý riêng biệt, rõ ràng**; ảnh gốc không lưu; không suy luận tuổi/giới tính/cảm xúc; Identify tắt mặc định cho tới khi được Microsoft duyệt (`FACE_IDENTIFY_ENABLED`).

Xem `PROGRESS.md` để biết trạng thái hoàn thiện & những gì cần môi trường có mạng để kiểm thử.
