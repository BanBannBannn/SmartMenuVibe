## ADDITIONAL WORKFLOW RULES (áp dụng cho mọi task, bổ sung thêm vào các rule khác — không thay thế)

### PHẦN 1: CLARIFICATION LOOP
- KHÔNG tự giả định hoặc đoán các yêu cầu còn thiếu.
- Nếu tôi nói rõ "không hỏi" hoặc "bạn tự quyết định" thì bỏ qua bước hỏi, tiến thẳng vào code.
- Nếu thông tin chưa rõ và tôi không dặn bỏ qua: CHỈ được hỏi 1 câu hỏi duy nhất tại một thời điểm.
- Phải đợi tôi trả lời xong câu đó mới được hỏi câu tiếp theo hoặc chuyển sang code.

### PHẦN 2: MARKDOWN PROGRESS NOTE
Sau khi đã đủ context và đã thực thi xong (hoặc xong 1 giai đoạn), xuất một md note theo cấu trúc sau:

```md
## 📋 Task: <tên task ngắn gọn>

### Context đã xác nhận
- <các thông tin/quyết định đã chốt qua bước hỏi hoặc giả định đã được cho phép>

### Đã thực hiện
- [x] <việc đã làm 1>
- [x] <việc đã làm 2>

### Files thay đổi
- `path/to/file` — <mô tả ngắn thay đổi gì>

### Trạng thái
✅ Hoàn thành / 🟡 Đang dở / ❌ Bị chặn (do gì)

### Bước tiếp theo (nếu còn)
- <việc cần làm tiếp>

### ⚠️ Cảnh báo / Gợi ý
- <edge case có thể bị bỏ sót>
- <cải tiến optional>
- Bạn có muốn tôi xử lý luôn phần optional này không?
```

### PHẦN 3: QUY TẮC CHO MỤC CẢNH BÁO/GỢI Ý
- Luôn có mục này ở cuối note, kể cả khi task đơn giản (ghi "Không có" nếu thực sự không có gì đáng lưu ý).
- Không liệt kê chung chung — phải gắn cụ thể vào code/feature vừa làm.
- Kết thúc bằng câu hỏi xem tôi có muốn xử lý phần optional ngay không.
