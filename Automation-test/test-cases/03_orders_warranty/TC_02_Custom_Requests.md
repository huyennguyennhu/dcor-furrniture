# Bộ Test Case: Đơn May Đo & Custom (Custom Requests)

* **Mã Phân hệ:** ADM-CUSTOM-REQ
* **Tên Màn hình:** Quản trị Đơn May Đo & Thiết Kế Riêng (Custom Requests Management)
* **Đường dẫn (URL):** `/admin/custom-requests`
* **Tài liệu tham chiếu:** FRD - [ADM-Master] Order, Custom Request, Return & Warranty Management (User Story US-02)
* **Đối tượng sử dụng:** Kiến trúc sư, Chuyên viên Báo giá Custom, Kế toán, Quản đốc Xưởng, QC Tester
* **Môi trường áp dụng:** Local (`http://localhost:4200`) & Vercel Dev (`https://dcor-studio-dev.vercel.app`)

---

## 1. Ma trận Test Case Tổng hợp

| Mã Test Case | Tên Kịch bản Kiểm thử | Phân loại | Mức độ | Tiêu chí FRD |
| :--- | :--- | :--- | :--- | :--- |
| **TC-CUSTREQ-01** | Kiểm tra hiển thị danh sách yêu cầu may đo và các tab trạng thái | Chức năng (Functional) | P1 - Cao | Mục 1.2.1 |
| **TC-CUSTREQ-02** | Tiếp nhận hồ sơ may đo mới từ khách hàng và phân công xử lý | Nghiệp vụ cốt lõi | P1 - Cao | Scenario 2.1 |
| **TC-CUSTREQ-03** | Tải lên bản vẽ phối cảnh 3D và ghi chú kỹ thuật kích thước | Chức năng chi tiết | P1 - Cao | Scenario 2.1 |
| **TC-CUSTREQ-04** | Lập bảng dự toán báo giá chi tiết và gửi duyệt hợp đồng | Nghiệp vụ báo giá | P1 - Cao | Scenario 2.2 |
| **TC-CUSTREQ-05** | Xác nhận thanh toán cọc 30% và tự động sinh Lệnh sản xuất xưởng | Nghiệp vụ liên phân hệ | P1 - Cao | Scenario 2.3 |
| **TC-CUSTREQ-06** | Tìm kiếm yêu cầu may đo theo Mã hồ sơ, SĐT và Tên khách hàng | Tìm kiếm (Search) | P1 - Cao | Mục 1.2.1 |
| **TC-CUSTREQ-07** | Sắp xếp danh sách theo cột dọc (▲ Tăng dần / ▼ Giảm dần) | Giao diện & Sắp xếp | P1 - Cao | Mục 1.2.1 |
| **TC-CUSTREQ-08** | Từ chối hoặc hủy hồ sơ may đo do không khả thi kỹ thuật | Nghiệp vụ / An toàn | P2 - Trung bình | Mục 3.1.2 |
| **TC-CUSTREQ-09** | Xuất hồ sơ thiết kế may đo ra tệp PDF bàn giao xưởng mộc | Tiện ích (Export) | P2 - Trung bình | Mục 1.2.1 |

---

## 2. Kịch bản Kiểm thử Chi tiết

### TC-CUSTREQ-01: Kiểm tra hiển thị danh sách yêu cầu may đo và các tab trạng thái
* **Tiền điều kiện:** Người dùng truy cập trang `/admin/custom-requests`.
* **Các bước thực hiện:**
  1. Chờ trang nạp hoàn tất dữ liệu.
  2. Quan sát hàng tab trạng thái xử lý hồ sơ custom.
* **Kết quả mong đợi:**
  * Hiển thị đầy đủ các tab: **Tất cả**, **Chờ tiếp nhận**, **Đang tư vấn / Khảo sát**, **Đã gửi báo giá**, **Đã ký hợp đồng & Cọc**, **Đang sản xuất**, **Hoàn tất bàn giao**, **Đã hủy**.
  * Bảng hiển thị các cột: Mã yêu cầu (CR-xxxxx), Khách hàng, Loại không gian (Phòng khách, Bếp, Ngủ), Kích thước yêu cầu, Ngân sách dự kiến, Chuyên viên phụ trách, Trạng thái, Thao tác.

---

### TC-CUSTREQ-02: Tiếp nhận hồ sơ may đo mới từ khách hàng và phân công xử lý
* **Tiền điều kiện:** Có hồ sơ may đo gửi từ website đang ở trạng thái "Chờ tiếp nhận" (màu vàng).
* **Các bước thực hiện:**
  1. Mở chi tiết hồ sơ `CR-2026-015`.
  2. Nhấp nút **"Tiếp nhận xử lý"**.
  3. Chọn Chuyên viên phụ trách: `KTS. Hoàng Minh Đức`.
  4. Nhấp Lưu tiếp nhận.
* **Kết quả mong đợi:**
  * Trạng thái hồ sơ chuyển sang **"Đang tư vấn / Khảo sát"**.
  * Tên chuyên viên phụ trách được gán vào hồ sơ, nhật ký ghi nhận thời gian bắt đầu tiếp nhận.

---

### TC-CUSTREQ-03: Tải lên bản vẽ phối cảnh 3D và ghi chú kỹ thuật kích thước
* **Tiền điều kiện:** Hồ sơ đang ở trạng thái "Đang tư vấn / Khảo sát".
* **Các bước thực hiện:**
  1. Tại tab "Bản vẽ & Thiết kế 3D", nhấp tải lên 2 tệp ảnh phối cảnh 3D (.jpg / .png).
  2. Nhập thông số kích thước thực tế sau khảo sát: `3200 x 2400 x 850 mm`.
  3. Nhập quy cách vật liệu: `Gỗ óc chó Bắc Mỹ tự nhiên kết hợp đá Vicostone`.
  4. Nhấp Lưu thông tin thiết kế.
* **Kết quả mong đợi:**
  * Bản vẽ 3D hiển thị rõ nét, hỗ trợ nhấp phóng to toàn màn hình.
  * Thông số kỹ thuật được lưu chuẩn xác.

---

### TC-CUSTREQ-04: Lập bảng dự toán báo giá chi tiết và gửi duyệt hợp đồng
* **Tiền điều kiện:** Đã hoàn tất bản vẽ thiết kế.
* **Các bước thực hiện:**
  1. Chuyển sang tab "Dự toán & Báo giá".
  2. Thêm các hạng mục chi phí:
     * Khung gỗ óc chó: `32.000.000 ₫`
     * Mặt đá cao cấp: `12.000.000 ₫`
     * Phụ kiện ray trượt Hafele: `4.500.000 ₫`
  3. Kiểm tra Tổng giá trị báo giá: `48.500.000 ₫`.
  4. Nhấp nút **"Gửi báo giá cho khách hàng"**.
* **Kết quả mong đợi:**
  * Hệ thống tự động sinh Mã hợp đồng mẫu và phiếu báo giá.
  * Trạng thái hồ sơ chuyển thành **"Đã gửi báo giá"** (màu xanh dương).
  * Tiền cọc 30% cần thu tự động tính là `14.550.000 ₫`.

---

### TC-CUSTREQ-05: Xác nhận thanh toán cọc 30% và tự động sinh Lệnh sản xuất xưởng
* **Tiền điều kiện:** Khách hàng đã ký hợp đồng điện tử và chuyển khoản cọc `14.550.000 ₫`.
* **Các bước thực hiện:**
  1. Kế toán kiểm tra sao kê ngân hàng.
  2. Mở hồ sơ, nhấp nút **"Xác nhận đã nhận cọc 30%"**.
* **Kết quả mong đợi:**
  * Trạng thái hồ sơ chuyển sang **"Đã ký hợp đồng & Nhận cọc"**.
  * **Hệ thống tự động phát sinh một Lệnh sản xuất nội thất mới** chuyển thẳng sang phân hệ Quản lý Xưởng sản xuất.
  * Số tiền cọc được ghi nhận vào báo cáo tài chính dòng tiền.

---

### TC-CUSTREQ-06: Tìm kiếm yêu cầu may đo theo Mã hồ sơ, SĐT và Tên khách hàng
* **Tiền điều kiện:** Bảng danh sách đang hiển thị nhiều hồ sơ.
* **Các bước thực hiện:**
  1. Nhập mã hồ sơ: `CR-2026-015`.
  2. Xóa và nhập số điện thoại khách: `0988776655`.
* **Kết quả mong đợi:**
  * Bảng lọc chính xác hồ sơ tương ứng trong vòng 1 giây.

---

### TC-CUSTREQ-07: Sắp xếp danh sách theo cột dọc (▲ Tăng dần / ▼ Giảm dần)
* **Tiền điều kiện:** Đang xem bảng danh sách custom.
* **Các bước thực hiện:**
  1. Nhấp chuột lần 1 vào tiêu đề cột **"Ngân sách dự kiến"**.
  2. Nhấp chuột lần 2 vào tiêu đề cột **"Ngân sách dự kiến"**.
* **Kết quả mong đợi:**
  * Nhấp lần 1: Sắp xếp từ ngân sách nhỏ đến lớn. Cụm nút hiển thị **chỉ duy nhất mũi tên hướng lên (▲)** màu xanh đậm, ẩn mũi tên xuống.
  * Nhấp lần 2: Đảo chiều từ ngân sách lớn đến nhỏ. Cụm nút hiển thị **chỉ duy nhất mũi tên hướng xuống (▼)** màu xanh đậm, ẩn mũi tên lên.

---

### TC-CUSTREQ-08: Từ chối hoặc hủy hồ sơ may đo do không khả thi kỹ thuật
* **Tiền điều kiện:** Hồ sơ đang ở trạng thái Chờ tiếp nhận hoặc Đang tư vấn.
* **Các bước thực hiện:**
  1. Nhấp nút **"Từ chối yêu cầu"**.
  2. Nhập lý do (ví dụ: *Kích thước không gian quá hẹp không đủ tiêu chuẩn an toàn kết cấu*).
  3. Bấm Xác nhận.
* **Kết quả mong đợi:**
  * Trạng thái hồ sơ chuyển sang **"Đã hủy"** (màu xám).
  * Hồ sơ không bị xóa mất mà lưu trữ trong lịch sử để tiện tra cứu lại.

---

### TC-CUSTREQ-09: Xuất hồ sơ thiết kế may đo ra tệp PDF bàn giao xưởng mộc
* **Tiền điều kiện:** Hồ sơ đã duyệt cọc và chuẩn bị chuyển xưởng.
* **Các bước thực hiện:**
  1. Nhấp nút **"Xuất hồ sơ sản xuất (PDF)"**.
* **Kết quả mong đợi:**
  * Tạo tệp PDF kỹ thuật gồm: Bìa hợp đồng, Bản vẽ phối cảnh 3D có kích thước chuẩn xác, Bảng kê bóc tách vật liệu và Ghi chú kỹ thuật thợ mộc.

