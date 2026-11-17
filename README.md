# SmartMenu — Restaurant OS (Open Source Showcase)

> 🌟 **Dự án Mã nguồn mở / Portfolio Showcase**  
> Nền tảng SaaS đa nhà hàng: **menu số, đặt món qua QR, gợi ý món thông minh theo ngữ cảnh (thời gian, thời tiết, combo), và bảng bếp realtime**.  
> Được nghiên cứu & phát triển bởi **Trần Văn Gia Bân** ([@BanBannBannn](https://github.com/BanBannBannn)).

[![Open Source Showcase](https://img.shields.io/badge/Open%20Source-Showcase%20Repo-orange.svg)](https://github.com/BanBannBannn/SmartMenuVibe)
[![Next.js 16](https://img.shields.io/badge/Next.js-16%20App%20Router-black.svg)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Database%20%26%20Realtime-emerald.svg)](https://supabase.com/)
[![License MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## 🏬 3 Quán Demo Trực Quan (Demo Showcase)

Dự án đi kèm 3 quán demo được cấu hình sẵn 3 mẫu giao diện menu chuyên biệt và bộ quy tắc gợi ý món thông minh (`recommendation_rules`):

| Nhà hàng | Mẫu giao diện (Template) | Xem Menu Board (Showcase) | Thử Khách Đặt Món (QR Guest) | Tài khoản Chủ quán Demo |
|---|---|---|---|---|
| **Gà Rán Sài Gòn** | `fastfood-board` (Bảng Tivi tại quầy) | `/[slug]/showcase` | `/[slug]/demogaransaigon01` | `demo.garan@smartmenu.vn` |
| **Circle Bân Mart** | `convenience-grid` (Cửa hàng tiện lợi 24/7) | `/[slug]/showcase` | `/[slug]/democirclebanmart01` | `demo.mart@smartmenu.vn` |
| **Quán Bân Bân** | `vietnam-a4` (Thực đơn A4 truyền thống) | `/[slug]/showcase` | `/[slug]/demoquanbanban01` | `demo.quan@smartmenu.vn` |

> 💡 **Khách trải nghiệm**: Xem trực tiếp giao diện Menu Showcase và đặt món QR không cần đăng nhập.  
> 🔑 **Đăng nhập quản lý**: Thiết lập biến môi trường `DEMO_PASSWORD=MậtKhẩuCủaBạn` trong `.env.local` trước khi chạy `npx tsx scripts/seed-demo.ts` để tự thiết lập mật khẩu chủ quán riêng.

---

## 🛠 Tech Stack & Kiến Trúc

- **Core Framework**: **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **UI & Animation**: **TailwindCSS** + **shadcn UI** + **Framer Motion**
- **State & Drag-Drop**: **@dnd-kit** (menu builder), **TanStack Query** + **Zustand** (giỏ hàng)
- **Backend & Database**: **Supabase** (Postgres, Auth, Storage, Realtime, RLS)
- **Engine Gợi Ý (Recommendation)**: Thuần TypeScript, gợi ý món theo khung giờ, thời tiết (OpenWeatherMap) và món bán chạy.
- **Báo cáo & QR**: **Recharts** (doanh thu), **qrcode** (QR bàn)
- **Container**: **Docker** (multi-stage, `output: standalone`)

---

## 🚀 Bắt Đầu

```bash
# 1. Cài đặt dependencies
npm install

# 2. Tạo file môi trường
cp .env.example .env.local   # điền các khoá Supabase / OpenWeather

# 3. Khởi tạo cơ sở dữ liệu & nạp dữ liệu Seed 3 quán demo
supabase db push            # hoặc áp dụng các file trong supabase/migrations
npx tsx scripts/seed-demo.ts # Nạp 3 quán demo + thực đơn + quy tắc gợi ý món

# 4. Sinh TypeScript definitions từ Supabase
npm run db:types

# 5. Chạy môi trường Development
npm run dev
```

---

## 📌 Các Script Hỗ Trợ

```bash
npm run dev            # Chạy dev server
npm run build          # Build production (standalone Docker ready)
npm run start          # Chạy bản build production
npm run lint           # Kiểm tra linter TypeScript/ESLint
npm run test           # Chạy unit tests với Vitest
npm run verify:core    # Kiểm thử logic thuần (pricing & recommendation engine)
npx tsx scripts/seed-demo.ts # Seed dữ liệu 3 quán demo & quy tắc gợi ý món
```

---

## 📁 Kiến Trúc Thư Mục

```
app/
  (auth)/           # Server actions đăng nhập/đăng ký
  login, register   # Trang auth
  (guest)/[restaurantSlug]/[tableToken]/   # Trang đặt món cho thực khách
  (owner)/dashboard/                       # Cổng quản lý nhà hàng
  (admin)/admin/                           # Cổng Super Admin
  api/                                     # Order, AI, recommendations API
  privacy/, terms/                         # Trang Chính sách bảo mật & Điều khoản sử dụng
lib/
  supabase/         # Supabase client / server / admin / middleware
  pricing.ts        # Thuật toán tính giá đơn hàng (unit-tested)
  recommendation-engine/  # Engine gợi ý món thông minh theo ngữ cảnh
components/         # UI components, menu builder, kitchen board, tables...
scripts/seed-demo.ts# Seed script 3 quán demo & quy tắc gợi ý món
```

---

## 🔐 Bảo Mật, Tuân Thủ & Giấy Phép

- **Bảo mật RLS**: Bật Row Level Security trên 100% bảng trong database; service-role key chỉ dùng phía server.
- **Không dùng sinh trắc học**: Tính năng quét khuôn mặt đã được gỡ bỏ; hệ thống không thu thập ảnh hay dữ liệu khuôn mặt.
- **Giấy phép (License)**: Dự án mã nguồn mở phục vụ mục đích học tập & tham khảo cộng đồng.

---

## 👨‍💻 Tác Giả & Đóng Góp

Dự án được thực hiện bởi **Trần Văn Gia Bân** ([@BanBannBannn](https://github.com/BanBannBannn)).  
Mọi đóng góp, báo lỗi hoặc góp ý kiến trúc xin vui lòng mở [Issue](https://github.com/BanBannBannn/SmartMenuVibe/issues) hoặc [Pull Request](https://github.com/BanBannBannn/SmartMenuVibe/pulls) trên GitHub.

