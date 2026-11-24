# Bộ Test Case: Cài Đặt Tồn Kho & Điểm Kho (Inventory Settings)

* **Mã Phân hệ:** ADM-INV-SETTINGS
* **Tên Màn hình:** Cài Đặt Tồn Kho & Quản Trị Điểm Kho (Warehouse Master Settings)
* **Đường dẫn (URL):** `/admin/inventory/settings`
* **Tài liệu tham chiếu:** FRD - [ADM-Master] Product, Inventory & Customer Management (User Story US-08)
* **Đối tượng sử dụng:** Giám đốc Vận hành, Quản trị viên hệ thống, Quản lý Kho, QC Tester
* **Môi trường áp dụng:** Local (`http://localhost:4200`) & Vercel Dev (`https://dcor-studio-dev.vercel.app`)

---

## 1. Ma trận Test Case Tổng hợp

| Mã Test Case | Tên Kịch bản Kiểm thử | Phân loại | Mức độ | Tiêu chí FRD |
| :--- | :--- | :--- | :--- | :--- |
| **TC-SET-01** | Kiểm tra hiển thị danh sách các Điểm kho trong mạng lưới | Chức năng (Functional) | P1 - Cao | Mục 1.2.1 |
| **TC-SET-02** | Thêm mới Điểm kho Showroom / Xưởng sản xuất (Happy Path) | Chức năng thêm mới | P1 - Cao | Scenario 8.1 |
| **TC-SET-03** | Bắt lỗi trùng lặp Mã kho và kiểm tra các trường bắt buộc | Kiểm tra tính hợp lệ | P1 - Cao | Scenario 8.1 |
| **TC-SET-04** | Chỉnh sửa thông tin, địa chỉ và sức chứa của Điểm kho | Chức năng cập nhật | P1 - Cao | Mục 1.2.1 |
| **TC-SET-05** | Bật / Tắt trạng thái hoạt động của Điểm kho | Cập nhật nhanh | P2 - Trung bình | Mục 1.2.1 |
| **TC-SET-06** | Cấu hình Ngưỡng an toàn tối thiểu mặc định toàn hệ thống | Cấu hình nghiệp vụ | P1 - Cao | Mục 1.2.1 |
| **TC-SET-07** | Cấu hình Ngưỡng an toàn riêng biệt cho từng mã SKU đặc thù | Cấu hình chuyên sâu | P2 - Trung bình | Mục 1.2.1 |
| **TC-SET-08** | Quản lý danh mục Lý do Xuất - Nhập kho chuẩn mực | Cấu hình nghiệp vụ | P2 - Trung bình | Mục 1.2.1 |
| **TC-SET-09** | Sắp xếp danh sách điểm kho theo cột dọc (▲ Tăng dần / ▼ Giảm dần) | Giao diện & Sắp xếp | P2 - Trung bình | Mục 1.2.1 |

---

## 2. Kịch bản Kiểm thử Chi tiết

### TC-SET-01: Kiểm tra hiển thị danh sách các Điểm kho trong mạng lưới
* **Tiền điều kiện:** Người dùng truy cập trang `/admin/inventory/settings`.
* **Các bước thực hiện:**
  1. Chờ trang nạp hoàn tất dữ liệu.
  2. Quan sát bảng danh sách các điểm kho.
* **Kết quả mong đợi:**
  * Bảng hiển thị các cột: Mã kho, Tên điểm kho, Loại kho (Kho tổng, Xưởng sản xuất, Kho Showroom), Địa chỉ vật lý, Thủ kho phụ trách, Sức chứa tối đa (sản phẩm), Trạng thái (Hoạt động / Tạm dừng), Thao tác.
  * Hiển thị đầy đủ mạng lưới kho hiện tại của DCOR Studio.

---

### TC-SET-02: Thêm mới Điểm kho Showroom / Xưởng sản xuất (Happy Path)
* **Tiền điều kiện:** Công ty khai trương Showroom mới tại Quận 2.
* **Các bước thực hiện:**
  1. Nhấp nút **"Thêm điểm kho mới"**.
  2. Nhập Tên kho: `Kho Showroom Thảo Điền - Q2`.
  3. Nhập Mã kho: `WH-SHOWROOM-Q2`.
  4. Chọn Loại kho: `Showroom Trưng bày & Bán lẻ`.
  5. Nhập Địa chỉ: `12 Quốc Hương, Phường Thảo Điền, TP. Thủ Đức, TP.HCM`.
  6. Nhập Sức chứa tối đa: `200`.
  7. Chọn Thủ kho phụ trách: `Lê Hoàng Long`.
  8. Nhấp nút **"Lưu điểm kho"**.
* **Kết quả mong đợi:**
  * Hệ thống thông báo: *"Thêm điểm kho thành công"*.
  * Điểm kho mới xuất hiện ngay trên bảng danh sách với trạng thái "Đang hoạt động".
  * Điểm kho này lập tức xuất hiện trong danh sách lựa chọn của các màn hình Tạo lệnh kho và Báo cáo.

---

### TC-SET-03: Bắt lỗi trùng lặp Mã kho và kiểm tra các trường bắt buộc
* **Tiền điều kiện:** Mã kho `WH-SHOWROOM-Q2` đã tồn tại trên hệ thống.
* **Các bước thực hiện:**
  1. Mở form thêm mới điểm kho.
  2. Nhập Mã kho là `WH-SHOWROOM-Q2`.
  3. Để trống ô Tên kho và ô Loại kho.
  4. Nhấp nút Lưu.
* **Kết quả mong đợi:**
  * Hệ thống chặn hành động và hiển thị lỗi viền đỏ:
    * *"Mã kho đã tồn tại, vui lòng chọn mã khác"*
    * *"Tên điểm kho không được để trống"*
    * *"Vui lòng chọn loại kho"*
  * Form không được submit khi còn lỗi.

---

### TC-SET-04: Chỉnh sửa thông tin, địa chỉ và sức chứa của Điểm kho
* **Tiền điều kiện:** Có sẵn một điểm kho trong danh sách.
* **Các bước thực hiện:**
  1. Nhấp nút **"Chỉnh sửa"** (cây bút) tại dòng điểm kho cần sửa.
  2. Thay đổi sức chứa tối đa từ `200` thành `250`.
  3. Cập nhật số điện thoại liên hệ của thủ kho.
  4. Nhấp nút **"Cập nhật"**.
* **Kết quả mong đợi:**
  * Thông tin mới được cập nhật thành công và hiển thị ngay trên bảng.

---

### TC-SET-05: Bật / Tắt trạng thái hoạt động của Điểm kho
* **Tiền điều kiện:** Điểm kho đang ở trạng thái "Đang hoạt động".
* **Các bước thực hiện:**
  1. Nhấp vào nút gạt bật/tắt (Toggle) chuyển sang "Tạm dừng hoạt động".
* **Kết quả mong đợi:**
  * Bật hộp thoại xác nhận: *"Khi tạm dừng, kho này sẽ không thể tiếp nhận thêm lệnh nhập/xuất mới. Bạn có chắc chắn không?"*
  * Sau khi bấm xác nhận: Trạng thái chuyển sang màu xám **"Tạm dừng"**.

---

### TC-SET-06: Cấu hình Ngưỡng an toàn tối thiểu mặc định toàn hệ thống
* **Tiền điều kiện:** Chuyển sang tab "Cấu hình Ngưỡng cảnh báo tồn kho".
* **Các bước thực hiện:**
  1. Tại ô "Ngưỡng tồn an toàn mặc định", đổi giá trị từ `3 chiếc` thành `5 chiếc`.
  2. Bật công tắc: *"Gửi thông báo cảnh báo khi tồn kho chạm ngưỡng"*.
  3. Nhấp nút **"Lưu cấu hình"**.
* **Kết quả mong đợi:**
  * Cấu hình được áp dụng cho toàn bộ các sản phẩm chưa thiết lập ngưỡng riêng.
  * Khi tồn khả dụng của bất kỳ sản phẩm nào giảm xuống $\le 5$, hệ thống lập tức gắn nhãn Cảnh báo tồn thấp màu vàng cam.

---

### TC-SET-07: Cấu hình Ngưỡng an toàn riêng biệt cho từng mã SKU đặc thù
* **Tiền điều kiện:** Sản phẩm cao cấp *Sofa Da Bò Ý Florence* có chu kỳ sản xuất lâu hơn bình thường nên cần mức tồn an toàn cao hơn (ví dụ: `10 chiếc`).
* **Các bước thực hiện:**
  1. Tại bảng cấu hình ngưỡng riêng theo sản phẩm, nhấp **"Thêm cấu hình sản phẩm"**.
  2. Chọn sản phẩm: *Sofa Da Bò Ý Florence*.
  3. Nhập Ngưỡng an toàn riêng: `10 chiếc`.
  4. Nhấp Lưu.
* **Kết quả mong đợi:**
  * Sản phẩm này áp dụng ngưỡng an toàn là 10, trong khi các sản phẩm khác vẫn áp dụng ngưỡng mặc định là 5.

---

### TC-SET-08: Quản lý danh mục Lý do Xuất - Nhập kho chuẩn mực
* **Tiền điều kiện:** Chuyển sang tab "Danh mục Lý do giao dịch".
* **Các bước thực hiện:**
  1. Kiểm tra danh sách lý do có sẵn (Xuất bán lẻ, Xuất may đo, Nhập hoàn hàng, Nhập xưởng...).
  2. Thêm mới một lý do xuất kho: `Xuất chụp ảnh Lookbook & Marketing`.
  3. Nhấp Lưu.
* **Kết quả mong đợi:**
  * Lý do mới được lưu vào danh mục chuẩn.
  * Khi tạo lệnh xuất kho tại `/admin/inventory/transactions`, danh sách chọn lý do xuất kho xuất hiện tùy chọn `Xuất chụp ảnh Lookbook & Marketing`.

---

### TC-SET-09: Sắp xếp danh sách điểm kho theo cột dọc (▲ Tăng dần / ▼ Giảm dần)
* **Tiền điều kiện:** Đang xem bảng danh sách điểm kho.
* **Các bước thực hiện:**
  1. Nhấp chuột lần 1 vào tiêu đề cột **"Sức chứa"**.
  2. Nhấp chuột lần 2 vào tiêu đề cột **"Sức chứa"**.
* **Kết quả mong đợi:**
  * Nhấp lần 1: Sắp xếp sức chứa từ nhỏ đến lớn. Cụm nút chuyển sang hiển thị **chỉ duy nhất mũi tên hướng lên (▲)** màu xanh đậm, ẩn mũi tên xuống.
  * Nhấp lần 2: Đảo chiều từ lớn đến nhỏ. Cụm nút chuyển sang hiển thị **chỉ duy nhất mũi tên hướng xuống (▼)** màu xanh đậm, ẩn mũi tên lên.

