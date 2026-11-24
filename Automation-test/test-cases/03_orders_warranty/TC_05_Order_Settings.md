# Bộ Test Case: Cài Đặt Đơn Hàng & Vận Chuyển (Order Settings)

* **Mã Phân hệ:** ADM-ORD-SETTINGS
* **Tên Màn hình:** Cài Đặt Đơn Hàng & Biểu Phí Vận Chuyển (Order & Shipping Master Settings)
* **Đường dẫn (URL):** `/admin/orders/settings`
* **Tài liệu tham chiếu:** FRD - [ADM-Master] Order, Custom Request, Return & Warranty Management (User Story US-05)
* **Đối tượng sử dụng:** Giám đốc Vận hành, Quản trị viên hệ thống, Quản lý Logistics, QC Tester
* **Môi trường áp dụng:** Local (`http://localhost:4200`) & Vercel Dev (`https://dcor-studio-dev.vercel.app`)

---

## 1. Ma trận Test Case Tổng hợp

| Mã Test Case | Tên Kịch bản Kiểm thử | Phân loại | Mức độ | Tiêu chí FRD |
| :--- | :--- | :--- | :--- | :--- |
| **TC-ORDSET-01** | Kiểm tra hiển thị các khối cấu hình vận hành và bảng phương thức | Chức năng (Functional) | P1 - Cao | Mục 1.2.1 |
| **TC-ORDSET-02** | Cấu hình Mức Miễn phí vận chuyển (Free Shipping Threshold) | Nghiệp vụ cốt lõi | P1 - Cao | Scenario 5.1 |
| **TC-ORDSET-03** | Thêm mới Gói phương thức giao nhận vận chuyển | Chức năng thêm mới | P1 - Cao | Mục 1.2.1 |
| **TC-ORDSET-04** | Chỉnh sửa biểu phí giao hàng và thời gian cam kết vận chuyển | Chức năng cập nhật | P1 - Cao | Mục 1.2.1 |
| **TC-ORDSET-05** | Bật / Tắt trạng thái hoạt động của một phương thức vận chuyển | Cập nhật nhanh | P2 - Trung bình | Mục 1.2.1 |
| **TC-ORDSET-06** | Cấu hình Tỷ lệ đặt cọc bắt buộc cho đơn tiêu chuẩn và may đo | Cấu hình tài chính | P1 - Cao | Mục 1.2.1 |
| **TC-ORDSET-07** | Bắt lỗi kiểm tra tính hợp lệ số tiền và tỷ lệ phần trăm cọc | Kiểm tra tính hợp lệ | P1 - Cao | Mục 1.2.1 |
| **TC-ORDSET-08** | Sắp xếp danh sách phương thức theo cột dọc (▲ Tăng dần / ▼ Giảm dần) | Giao diện & Sắp xếp | P2 - Trung bình | Mục 1.2.1 |

---

## 2. Kịch bản Kiểm thử Chi tiết

### TC-ORDSET-01: Kiểm tra hiển thị các khối cấu hình vận hành và bảng phương thức
* **Tiền điều kiện:** Người dùng truy cập trang `/admin/orders/settings`.
* **Các bước thực hiện:**
  1. Chờ trang nạp hoàn tất dữ liệu.
  2. Quan sát cấu trúc giao diện trang cài đặt.
* **Kết quả mong đợi:**
  * Hiển thị rõ ràng các phân khu cấu hình:
    1. **Khối Chính sách Vận chuyển & Miễn phí:** Cấu hình ngưỡng tiền và thời gian.
    2. **Khối Phương thức Giao nhận:** Bảng liệt kê các gói giao hàng.
    3. **Khối Quy định Đặt cọc & Thanh toán:** Tỷ lệ cọc tối thiểu.
  * Các trường thông tin điền sẵn dữ liệu hiện hành, không bị trống trơn.

---

### TC-ORDSET-02: Cấu hình Mức Miễn phí vận chuyển (Free Shipping Threshold)
* **Tiền điều kiện:** Đang ở khối Chính sách Vận chuyển.
* **Các bước thực hiện:**
  1. Tại ô "Ngưỡng miễn phí vận chuyển nội thành", nhập: `15000000` (15.000.000 ₫).
  2. Nhấp nút **"Lưu cài đặt vận chuyển"**.
* **Kết quả mong đợi:**
  * Hệ thống thông báo: *"Cập nhật chính sách vận chuyển thành công"*.
  * Mức mới 15 triệu VNĐ được ghi nhận.
  * Khi khách hàng đặt đơn hàng nội thành có tổng giá trị $\ge 15.000.000$ ₫, hệ thống ngoài giỏ hàng tự động áp dụng phí vận chuyển là `0 ₫`.

---

### TC-ORDSET-03: Thêm mới Gói phương thức giao nhận vận chuyển
* **Tiền điều kiện:** Bảng danh sách phương thức giao nhận đang mở.
* **Các bước thực hiện:**
  1. Nhấp nút **"Thêm phương thức giao nhận"**.
  2. Nhập Tên phương thức: `Giao Siêu Tốc 24H & Lắp Đặt Tận Phòng`.
  3. Nhập Mã phương thức: `SHIP-EXPRESS-ROOM`.
  4. Nhập Phí cơ bản: `350000` (350.000 ₫).
  5. Nhập Thời gian cam kết giao: `Trong vòng 24 giờ`.
  6. Chọn Đơn vị vận hành: `Đội xe DCOR Logistics`.
  7. Nhấp nút **"Lưu phương thức"**.
* **Kết quả mong đợi:**
  * Phương thức mới xuất hiện ngay trên bảng danh sách với trạng thái "Đang kích hoạt".
  * Khách hàng đặt mua tại bước thanh toán sẽ nhìn thấy tùy chọn giao hàng siêu tốc này.

---

### TC-ORDSET-04: Chỉnh sửa biểu phí giao hàng và thời gian cam kết vận chuyển
* **Tiền điều kiện:** Có sẵn gói giao hàng tiêu chuẩn trong danh sách.
* **Các bước thực hiện:**
  1. Nhấp nút **"Chỉnh sửa"** tại dòng gói *Giao hàng Tiêu chuẩn*.
  2. Đổi cước phí từ `200.000 ₫` thành `150.000 ₫`.
  3. Cập nhật thời gian cam kết thành `2 - 3 ngày làm việc`.
  4. Nhấp nút **"Cập nhật"**.
* **Kết quả mong đợi:**
  * Biểu phí mới `150.000 ₫` được cập nhật tức thì trên bảng.

---

### TC-ORDSET-05: Bật / Tắt trạng thái hoạt động của một phương thức vận chuyển
* **Tiền điều kiện:** Gói vận chuyển đang ở trạng thái kích hoạt (công tắc màu xanh).
* **Các bước thực hiện:**
  1. Gạt công tắc chuyển sang "Tắt" (Tạm dừng dịch vụ).
* **Kết quả mong đợi:**
  * Trạng thái đổi sang màu xám "Tạm dừng".
  * Ngoài website storefront của khách hàng, tùy chọn giao hàng này ngay lập tức bị ẩn đi, không cho khách chọn nữa.

---

### TC-ORDSET-06: Cấu hình Tỷ lệ đặt cọc bắt buộc cho đơn tiêu chuẩn và may đo
* **Tiền điều kiện:** Chuyển sang khối "Quy định Đặt cọc".
* **Các bước thực hiện:**
  1. Tại ô "Tỷ lệ cọc tối thiểu đơn hàng tiêu chuẩn", thiết lập: `30%`.
  2. Tại ô "Tỷ lệ cọc tối thiểu đơn may đo Custom", thiết lập: `50%`.
  3. Nhấp nút **"Lưu quy định cọc"**.
* **Kết quả mong đợi:**
  * Hệ thống áp dụng quy định cọc mới: Đơn may đo khi tạo hợp đồng tự động tính toán số tiền cọc bắt buộc là 50% tổng giá trị dự toán.

---

### TC-ORDSET-07: Bắt lỗi kiểm tra tính hợp lệ số tiền và tỷ lệ phần trăm cọc
* **Tiền điều kiện:** Đang ở form chỉnh sửa cấu hình cọc.
* **Các bước thực hiện:**
  1. Nhập tỷ lệ cọc là `120%` (vượt quá 100%) hoặc nhập số âm `-10%`.
  2. Nhập số tiền ngưỡng miễn phí vận chuyển là chữ cái không phải số.
  3. Nhấp nút Lưu.
* **Kết quả mong đợi:**
  * Hệ thống chặn lưu và hiển thị cảnh báo viền đỏ rõ ràng:
    * *"Tỷ lệ đặt cọc hợp lệ phải nằm trong khoảng từ 0% đến 100%"*
    * *"Số tiền phải là số nguyên dương hợp lệ"*

---

### TC-ORDSET-08: Sắp xếp danh sách phương thức theo cột dọc (▲ Tăng dần / ▼ Giảm dần)
* **Tiền điều kiện:** Đang xem bảng phương thức giao nhận.
* **Các bước thực hiện:**
  1. Nhấp chuột lần 1 vào tiêu đề cột **"Cước phí cơ bản"**.
  2. Nhấp chuột lần 2 vào tiêu đề cột **"Cước phí cơ bản"**.
* **Kết quả mong đợi:**
  * Nhấp lần 1: Sắp xếp cước phí từ rẻ nhất đến đắt nhất. Cụm nút hiển thị **chỉ duy nhất mũi tên hướng lên (▲)** màu xanh đậm.
  * Nhấp lần 2: Đảo chiều cước phí từ đắt nhất đến rẻ nhất. Cụm nút hiển thị **chỉ duy nhất mũi tên hướng xuống (▼)** màu xanh đậm.

