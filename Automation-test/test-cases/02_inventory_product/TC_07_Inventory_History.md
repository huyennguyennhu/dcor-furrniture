# Bộ Test Case: Lịch Sử Biến Động Tồn Kho (Inventory History)

* **Mã Phân hệ:** ADM-INV-HISTORY
* **Tên Màn hình:** Sổ Cái Biến Động Tồn Kho Bất Biến (Immutable Stock Ledger)
* **Đường dẫn (URL):** `/admin/inventory/history`
* **Tài liệu tham chiếu:** FRD - [ADM-Master] Product, Inventory & Customer Management (User Story US-07)
* **Đối tượng sử dụng:** Kế toán Kiểm toán Nội bộ, Quản lý Kho, Ban Giám đốc, QC Tester
* **Môi trường áp dụng:** Local (`http://localhost:4200`) & Vercel Dev (`https://dcor-studio-dev.vercel.app`)

---

## 1. Ma trận Test Case Tổng hợp

| Mã Test Case | Tên Kịch bản Kiểm thử | Phân loại | Mức độ | Tiêu chí FRD |
| :--- | :--- | :--- | :--- | :--- |
| **TC-HIST-01** | Kiểm tra hiển thị bảng Sổ cái biến động kho và các cột dữ liệu | Chức năng (Functional) | P1 - Cao | Mục 1.2.1 |
| **TC-HIST-02** | Kiểm tra Tiêu chuẩn Sổ cái Bất biến (Không có nút Sửa/Xóa) | Bảo mật / Kiểm toán | P1 - Cao | Mục 3.1.3 |
| **TC-HIST-03** | Tra cứu toàn bộ dòng biến động của một mã SKU cụ thể | Tìm kiếm & Truy vết | P1 - Cao | Scenario 7.1 |
| **TC-HIST-04** | Đối soát công thức số học: Tồn trước + Biến động = Tồn sau | Logic / Toàn vẹn | P1 - Cao | Scenario 7.1 |
| **TC-HIST-05** | Điều hướng chuyển hướng nhanh sang Chứng từ gốc từ Sổ cái | Điều hướng chuyên sâu | P1 - Cao | Scenario 7.2 |
| **TC-HIST-06** | Lọc biến động theo Loại nghiệp vụ (Nhập, Xuất, Kiểm kê, Đổi trả) | Bộ lọc (Filter) | P1 - Cao | Mục 1.2.1 |
| **TC-HIST-07** | Lọc biến động theo Điểm kho và Khoảng thời gian tùy biến | Bộ lọc (Filter) | P1 - Cao | Mục 1.2.1 |
| **TC-HIST-08** | Sắp xếp lịch sử theo cột dọc (▲ Tăng dần / ▼ Giảm dần) | Giao diện & Sắp xếp | P1 - Cao | Mục 1.2.1 |
| **TC-HIST-09** | Xuất dữ liệu Sổ cái phục vụ đối soát kiểm toán ra Excel / CSV | Tiện ích (Export) | P2 - Trung bình | Mục 1.2.1 |

---

## 2. Kịch bản Kiểm thử Chi tiết

### TC-HIST-01: Kiểm tra hiển thị bảng Sổ cái biến động kho và các cột dữ liệu
* **Tiền điều kiện:** Người dùng truy cập trang `/admin/inventory/history`.
* **Các bước thực hiện:**
  1. Chờ trang tải hoàn tất dữ liệu.
  2. Quan sát cấu trúc bảng lịch sử.
* **Kết quả mong đợi:**
  * Bảng hiển thị đầy đủ các cột: Thời gian ghi nhận (Ngày giờ chính xác đến giây), Mã chứng từ liên kết, Loại biến động, Điểm kho, Sản phẩm (Mã SKU + Tên), Số lượng tồn trước, Số lượng biến động (+/-), Số lượng tồn sau, Người thực hiện, Ghi chú nghiệp vụ.
  * Các biến động tăng hiển thị màu xanh lá cây kèm dấu cộng `+`; biến động giảm hiển thị màu đỏ kèm dấu trừ `-`.

---

### TC-HIST-02: Kiểm tra Tiêu chuẩn Sổ cái Bất biến (Không có nút Sửa/Xóa)
* **Tiền điều kiện:** Đang xem bảng lịch sử biến động kho.
* **Các bước thực hiện:**
  1. Rà soát toàn bộ các cột và các dòng trong bảng.
  2. Kiểm tra xem có xuất hiện nút "Chỉnh sửa (Edit)" hoặc "Xóa (Delete)" bản ghi nào hay không.
* **Kết quả mong đợi:**
  * **Tuyệt đối không có nút Sửa hoặc Xóa** ở bất kỳ dòng nào.
  * Dữ liệu sổ cái hoàn toàn tuân thủ nguyên tắc chỉ ghi thêm (Append-only) để phục vụ kiểm toán minh bạch, chống gian lận tồn kho.

---

### TC-HIST-03: Tra cứu toàn bộ dòng biến động của một mã SKU cụ thể
* **Tiền điều kiện:** Sản phẩm có mã SKU `SF-NORDIC-02` đã trải qua nhiều lần nhập, xuất và kiểm kê.
* **Các bước thực hiện:**
  1. Nhập mã SKU `SF-NORDIC-02` vào ô tìm kiếm.
* **Kết quả mong đợi:**
  * Bảng lọc và hiển thị toàn bộ chuỗi lịch sử tăng giảm của riêng sản phẩm này theo thứ tự thời gian mới nhất lên đầu.
  * Người dùng có thể đối soát từng bước luân chuyển của mã hàng này từ lúc nhập xưởng đến lúc giao cho khách hàng.

---

### TC-HIST-04: Đối soát công thức số học: Tồn trước + Biến động = Tồn sau
* **Tiền điều kiện:** Bảng lịch sử đang hiển thị các dòng biến động.
* **Các bước thực hiện:**
  1. Chọn ngẫu nhiên 3 dòng biến động khác nhau (1 dòng nhập, 1 dòng xuất, 1 dòng kiểm kê).
  2. Ghi nhận: Tồn trước ($T_{trước}$), Biến động ($\Delta$), Tồn sau ($T_{sau}$).
  3. Kiểm tra phép tính: $T_{trước} + \Delta = T_{sau}$.
* **Kết quả mong đợi:**
  * Ví dụ 1: Tồn trước `10`, Xuất bán `-3` -> Tồn sau bắt buộc phải bằng chính xác `7`.
  * Ví dụ 2: Tồn trước `5`, Nhập thêm `+10` -> Tồn sau bắt buộc phải bằng chính xác `15`.
  * Số liệu số học khớp 100%, không bị lệch dù chỉ 1 đơn vị.

---

### TC-HIST-05: Điều hướng chuyển hướng nhanh sang Chứng từ gốc từ Sổ cái
* **Tiền điều kiện:** Dòng biến động ghi nhận thao tác xuất phát từ Phiếu kiểm kê mã `PKK-2026-005` (hoặc Lệnh xuất `PXK-2026-012`).
* **Các bước thực hiện:**
  1. Di chuột vào dòng chữ mã chứng từ `PKK-2026-005` (có định dạng liên kết màu xanh).
  2. Nhấp chuột vào mã chứng từ này.
* **Kết quả mong đợi:**
  * Hệ thống mở trực tiếp trang chi tiết của Phiếu kiểm kê `PKK-2026-005` tại `/admin/inventory/audit`.
  * Người dùng có thể kiểm tra ngay biên bản kiểm kê, lý do chênh lệch và danh sách người kiểm duyệt.

---

### TC-HIST-06: Lọc biến động theo Loại nghiệp vụ
* **Tiền điều kiện:** Đang ở bảng lịch sử biến động kho.
* **Các bước thực hiện:**
  1. Nhấp vào bộ lọc Loại nghiệp vụ.
  2. Chọn lần lượt: **"Nhập kho"**, **"Xuất bán"**, **"Cân bằng kiểm kê"**, **"Đổi trả bảo hành"**.
* **Kết quả mong đợi:**
  * Bảng cập nhật và chỉ hiển thị các giao dịch thuộc đúng loại nghiệp vụ đã chọn.

---

### TC-HIST-07: Lọc biến động theo Điểm kho và Khoảng thời gian tùy biến
* **Tiền điều kiện:** Đang ở bảng lịch sử.
* **Các bước thực hiện:**
  1. Chọn Điểm kho: `Kho Showroom Quận 7`.
  2. Chọn Khoảng thời gian: Từ ngày `01/10/2026` đến `31/10/2026`.
* **Kết quả mong đợi:**
  * Bảng chỉ hiển thị các giao dịch phát sinh tại Kho Showroom Q7 trong tháng 10/2026.

---

### TC-HIST-08: Sắp xếp lịch sử theo cột dọc (▲ Tăng dần / ▼ Giảm dần)
* **Tiền điều kiện:** Đang xem bảng lịch sử.
* **Các bước thực hiện:**
  1. Nhấp chuột lần 1 vào tiêu đề cột **"Thời gian"**.
  2. Nhấp chuột lần 2 vào tiêu đề cột **"Thời gian"**.
* **Kết quả mong đợi:**
  * Nhấp lần 1: Sắp xếp từ giao dịch cũ nhất đến mới nhất. Cụm nút chuyển sang hiển thị **chỉ duy nhất mũi tên hướng lên (▲)** màu xanh đậm, ẩn mũi tên xuống.
  * Nhấp lần 2: Đảo chiều từ giao dịch mới nhất đến cũ nhất. Cụm nút chuyển sang hiển thị **chỉ duy nhất mũi tên hướng xuống (▼)** màu xanh đậm, ẩn mũi tên lên.

---

### TC-HIST-09: Xuất dữ liệu Sổ cái phục vụ đối soát kiểm toán ra Excel / CSV
* **Tiền điều kiện:** Đã chọn bộ lọc đối soát.
* **Các bước thực hiện:**
  1. Nhấp nút **"Xuất sổ cái kiểm toán"**.
* **Kết quả mong đợi:**
  * Tải xuống tệp tin bảng tính chứa đầy đủ các cột lịch sử phục vụ nộp báo cáo ban giám đốc hoặc kiểm toán độc lập.
  * Tệp mở chuẩn xác, không bị lỗi font hoặc sai lệch số liệu.

