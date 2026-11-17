# Hướng dẫn triển khai: tối ưu hiệu năng & tính năng AI miễn phí

Tài liệu này dành cho PR `feat/ai-menu-import`. Nó hướng dẫn cách cấu hình, chạy thử, deploy và vận hành các thay đổi trong PR.

---

## 1. PR này thay đổi những gì

| Nhóm | Thay đổi | File chính |
|---|---|---|
| Hiệu năng | Menu của khách chỉ còn 2 lượt truy vấn song song (trước là 5 lượt tuần tự) và được cache. Cache tự làm mới khi chủ quán sửa menu. | `lib/data/guest.ts` |
| Hiệu năng | Middleware chỉ chạy ở dashboard, admin, login, register và `/api/ai`. Trang khách quét QR không còn gọi Supabase Auth. | `middleware.ts` |
| Hiệu năng | API gợi ý món chạy truy vấn song song và được CDN cache 5 phút. | `app/api/recommendations/route.ts` |
| Sửa lỗi | Món bán chạy chỉ tính trong quán đó (trước đây lấy lẫn đơn của quán khác). | như trên |
| Sửa lỗi | Ngưỡng thời tiết hợp với Việt Nam (tính cả nhiệt độ cảm nhận), luật khung giờ tính đến từng phút. | `lib/recommendation-engine/` |
| Bảo mật | Giá size/topping luôn lấy từ DB, khách không sửa request để giảm giá được nữa. | `lib/data/orders.ts` |
| Bảo mật | Rate limit dùng Upstash Redis (nếu có cấu hình). IP và mã thiết bị được băm trước khi lưu. | `lib/rate-limit.ts` |
| Dữ liệu cá nhân | Gỡ bỏ hoàn toàn tính năng quét khuôn mặt, kèm migration xoá dữ liệu sinh trắc học. | `supabase/migrations/20261117000000_remove_face_scan.sql` |
| AI | Nhập menu từ ảnh/PDF bằng Gemini (gói miễn phí). | `app/api/ai/menu-import/`, `components/menu/ai-menu-import.tsx` |
| AI | Viết mô tả hàng loạt (tối đa 40 món mỗi lần), có lọc câu chữ sáo rỗng. | `app/api/ai/descriptions/`, `components/menu/ai-descriptions.tsx` |
| Thiết kế | Gợi ý mẫu menu theo luật, không dùng AI ("Hợp với quán của bạn" trong builder). | `lib/design-suggest.ts` |
| Pháp lý | Điều khoản thêm mục quyền sở hữu nội dung, in ấn thương mại và tính năng AI. | `app/terms/page.tsx` |

---

## 2. Biến môi trường

Đặt trong `.env` khi chạy local, và trong **Vercel → Project → Settings → Environment Variables** khi deploy. Với Vercel, tick cả **Preview** lẫn **Production**.

| Biến | Bắt buộc? | Ý nghĩa |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Có | Như cũ |
| `OPENWEATHER_API_KEY` | Nên có | Thiếu thì gợi ý món theo thời tiết luôn ra "bình thường" |
| `GEMINI_API_KEY` | Cho AI | Thiếu thì các tính năng AI tự ẩn, app vẫn chạy bình thường |
| `GEMINI_MODELS` | Không | Danh sách model thử lần lượt, mặc định `gemini-3.8-flash,gemini-3.5-flash-lite` |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Không | Thiếu thì rate limit chạy trong bộ nhớ, và không chặn được khi Vercel chạy nhiều instance |

Các biến **đã bỏ** (xoá khỏi Vercel nếu còn): `AZURE_FACE_KEY`, `AZURE_FACE_ENDPOINT`, `FACE_IDENTIFY_ENABLED`, `AZURE_FACE_PERSON_GROUP`.

> ⚠️ Không bao giờ đặt key với tiền tố `NEXT_PUBLIC_`. Tiền tố này đưa key ra trình duyệt, ai cũng xem được.

---

## 3. Lấy key Gemini miễn phí

1. Vào <https://aistudio.google.com/apikey> và đăng nhập bằng tài khoản Google.
2. Bấm **Create API key**, rồi copy key vào `GEMINI_API_KEY`.
3. Vào trang **Rate limits** trong AI Studio, xem model nào còn hạn mức miễn phí và giới hạn bao nhiêu request mỗi ngày.
   - Hạn mức miễn phí thay đổi thường xuyên. Nếu model mặc định không còn miễn phí, chỉ cần sửa `GEMINI_MODELS`, không phải sửa code.
   - Mỗi model có hạn mức riêng. Code thử model đầu tiên, gặp lỗi hết lượt (429) thì chuyển sang model tiếp theo.

### Điều khoản gói miễn phí cần nhớ

- Google **có thể dùng dữ liệu gửi lên để cải thiện sản phẩm**, và có thể có người đọc dữ liệu đó.
- Vì vậy app **chỉ gửi nội dung menu công khai**: ảnh menu, tên món, tên danh mục. **Không bao giờ** gửi tên, số điện thoại hay đơn hàng của khách. Khi thêm tính năng AI mới, hãy giữ đúng nguyên tắc này.
- Người dùng ở EU, Anh và Thuỵ Sĩ bắt buộc phải dùng gói trả phí. Người dùng ở Việt Nam không bị ảnh hưởng.
- Google không giữ quyền sở hữu với nội dung AI tạo ra.

---

## 4. Upstash Redis (tuỳ chọn, miễn phí)

1. Tạo tài khoản ở <https://upstash.com>, rồi **Create Database** và chọn region gần Vercel nhất.
2. Trong tab **REST API**, copy `UPSTASH_REDIS_REST_URL` và `UPSTASH_REDIS_REST_TOKEN`.
3. Gói miễn phí dư dùng: mỗi lần đặt món hoặc gọi AI chỉ tốn khoảng 2 lệnh Redis.

Nếu Redis lỗi hoặc chưa cấu hình, code tự quay về đếm trong bộ nhớ, app không bị sập.

---

## 5. Chạy thử ở máy

```bash
git checkout feat/ai-menu-import
npm install
# điền .env theo mục 2
npm run dev
```

Trước đó, bật lại project Supabase. Gói miễn phí tự **pause** sau một thời gian không hoạt động; vào Supabase Dashboard và bấm **Restore project**.

Kiểm tra nhanh trước khi push:

```bash
npm run typecheck
npm test
npm run build
```

---

## 6. Migration database: làm đúng thứ tự

PR có migration `20261117000000_remove_face_scan.sql`. Migration này **xoá vĩnh viễn** bảng `face_scan_logs` và các cột `face_enabled`, `face_person_id`, `opted_in_face`.

Thứ tự bắt buộc:

1. **Deploy code mới trước.** Code mới không còn đọc các cột này.
2. **Sau đó mới chạy migration:**
   ```bash
   npm run db:push
   ```

Nếu chạy migration trước, code cũ đang chạy vẫn đọc `face_enabled` và sẽ lỗi. Nếu bạn deploy mới hoàn toàn từ đầu thì cứ chạy `db:push` là xong.

---

## 7. Deploy lên Vercel

1. Thêm biến môi trường như mục 2.
2. Mở PR. Vercel tự tạo một bản **Preview** riêng cho PR.
3. Chạy hết checklist ở mục 8 trên bản Preview.
4. Merge vào `main` để Vercel deploy Production.
5. Chạy `npm run db:push` (mục 6).

**Giới hạn thời gian của function.** Hai route AI được đặt chạy tối đa 60 giây (`maxDuration = 60`). Nếu log Vercel báo quá thời gian, kiểm tra giới hạn của gói Vercel bạn đang dùng.

**Vùng server.** `vercel.json` đang đặt `bom1` (Mumbai). Khi rảnh, nên chuyển sang `sin1` (Singapore) và để Supabase cùng ở Singapore, mỗi truy vấn sẽ nhanh hơn rõ rệt. Việc này để PR sau.

---

## 8. Checklist kiểm thử trên bản Preview

**Khách:**
- [ ] Quét QR (`/<slug>/<mã-bàn>`) thì menu hiện đúng món và giá.
- [ ] Đặt một món có size: tổng tiền đúng giá trong DB, đơn hiện trên màn hình bếp.
- [ ] Phần "Gợi ý" có món, và chỉ là món của chính quán đó.
- [ ] Trang `/<slug>/showcase` hiện bảng menu.

**Chủ quán:**
- [ ] Đăng nhập và đăng xuất bình thường.
- [ ] Sửa giá hoặc ẩn một món, rồi tải lại trang khách: thay đổi hiện **ngay**.
- [ ] Trang Cài đặt không còn ô "nhận diện khuôn mặt".
- [ ] Builder hiện mục **"Hợp với quán của bạn"**; bấm vào thì dựng lại menu theo mẫu đó, Ctrl+Z hoàn tác được.

**AI** (cần `GEMINI_API_KEY`):
- [ ] Quản lý menu → **Nhập menu từ ảnh**: chụp một menu giấy, chờ 10–40 giây, bảng nháp hiện ra.
- [ ] Sửa giá hoặc bỏ chọn vài dòng rồi lưu: món mới xuất hiện trong menu. Nhập lại cùng ảnh thì món đã có được bỏ qua, không bị trùng.
- [ ] **Viết mô tả món**: mô tả ngắn, cụ thể, không có câu kiểu "hương vị tuyệt hảo".
- [ ] Dùng quá 5 lần trong ngày thì hiện thông báo hết lượt.

---

## 9. Vận hành hằng ngày

| Việc | Cách làm |
|---|---|
| Xem AI có lỗi không | Vercel → Logs, lọc `[gemini]`, `[menu-import]`, `[descriptions]` |
| Model hết lượt miễn phí | Log có `[gemini] ... 429`. Code đã tự chuyển model khác. Nếu xảy ra thường xuyên, thêm model vào `GEMINI_MODELS` |
| Tắt AI khẩn cấp | Xoá `GEMINI_API_KEY` trên Vercel rồi redeploy. Các nút AI tự ẩn |
| Đổi số lượt mỗi ngày | Sửa `DAILY_LIMIT` trong `app/api/ai/menu-import/route.ts` và `app/api/ai/descriptions/route.ts` |
| Menu khách chưa cập nhật sau khi sửa thẳng trong DB | Bình thường: cache tự làm mới sau tối đa 5 phút. Sửa qua dashboard thì cập nhật ngay |

---

## 10. Xử lý sự cố

| Triệu chứng | Nguyên nhân thường gặp | Cách xử lý |
|---|---|---|
| Không thấy nút AI | Thiếu `GEMINI_API_KEY`, hoặc đã thêm key nhưng chưa redeploy | Thêm key rồi redeploy |
| "AI miễn phí đang hết lượt" | Mọi model trong `GEMINI_MODELS` đều đã hết hạn mức | Chờ sang ngày, thêm model khác, hoặc chuyển sang gói trả phí |
| "AI đọc menu không thành công" | Ảnh mờ, nghiêng hoặc thiếu sáng; menu viết tay khó đọc | Chụp thẳng, đủ sáng, mỗi ảnh một trang |
| "Tệp quá lớn" | PDF nhiều trang (ảnh thì trình duyệt đã tự thu nhỏ) | Tách PDF, hoặc chụp ảnh từng trang |
| Lỗi 404 ở mọi trang khách | Supabase đang pause, hoặc URL trong env sai | Restore project trong Supabase Dashboard |
| Lỗi `column face_enabled does not exist` | Đã chạy migration trước khi deploy code mới | Deploy code mới (xem mục 6) |

---

## 11. Bước tiếp theo nên làm

1. **Đổi vùng server** sang Singapore (mục 7).
2. **Mã hoá dữ liệu cá nhân**: số điện thoại và email (`profiles`, `guest_profiles`, `feedback`) mã hoá bằng AES-256-GCM ở server, lưu kèm HMAC để vẫn tìm kiếm được, key đặt trong Azure Key Vault.
3. **Dọn dữ liệu cũ**: cân nhắc xoá `guest_profiles` (gần như không còn dùng sau khi bỏ quét mặt), và tự xoá `feedback` cũ bằng `pg_cron`.
4. **Đổi tên mẫu** "Bảng gà rán (KFC)" và "Quầy tiện lợi (Circle K)" sang tên chung, tránh dùng thương hiệu của người khác trên menu khách in ra.
5. **Sửa cấu hình ESLint** (đang lỗi từ trước nên build phải bỏ qua lint).
6. **Học tiếp về AI**: chạy model trên máy bằng Ollama rồi thêm làm một nhà cung cấp trong `lib/llm`.
