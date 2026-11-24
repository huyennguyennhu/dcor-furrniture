# Bộ Test Case: Quản Lý Danh Mục Sản Phẩm (Categories Management)

* **Mã Phân hệ:** ADM-PROD-CAT
* **Tên Màn hình:** Quản lý Danh mục & Cây Phân cấp (Category Hierarchy Management)
* **Đường dẫn (URL):** `/admin/products/categories`
* **Tài liệu tham chiếu:** FRD - [ADM-Master] Product, Inventory & Customer Management (User Story US-02)
* **Đối tượng sử dụng:** Chuyên viên Quản trị Sản phẩm, Quản trị viên hệ thống, QC Tester
* **Môi trường áp dụng:** Local (`http://localhost:4200`) & Vercel Dev (`https://dcor-studio-dev.vercel.app`)

---

## 1. Ma trận Test Case Tổng hợp

| Mã Test Case | Tên Kịch bản Kiểm thử | Phân loại | Mức độ | Tiêu chí FRD |
| :--- | :--- | :--- | :--- | :--- |
| **TC-CAT-01** | Kiểm tra hiển thị Cây phân cấp danh mục đa tầng | Chức năng (Functional) | P1 - Cao | Mục 1.2.1 |
| **TC-CAT-02** | Thêm mới Danh mục cha cấp 1 (Root Category) | Chức năng thêm mới | P1 - Cao | Scenario 2.1 |
| **TC-CAT-03** | Thêm mới Danh mục con trực thuộc Danh mục cha (Child Category) | Chức năng thêm mới | P1 - Cao | Scenario 2.1 |
| **TC-CAT-04** | Kiểm tra cơ chế tự động tạo mã đường dẫn (Slug) thân thiện SEO | Tự động hóa UI | P2 - Trung bình | Scenario 2.1 |
| **TC-CAT-05** | Kéo thả (Drag & Drop) sắp xếp thứ tự ưu tiên hiển thị | Thao tác tương tác | P1 - Cao | Scenario 2.2 |
| **TC-CAT-06** | Chỉnh sửa tên, mô tả và hình ảnh đại diện danh mục | Chức năng cập nhật | P1 - Cao | Mục 1.2.1 |
| **TC-CAT-07** | Ràng buộc nghiệp vụ: Chặn xóa danh mục đang chứa sản phẩm | Ràng buộc toàn vẹn | P1 - Cao | Scenario 2.3 |
| **TC-CAT-08** | Xóa danh mục rỗng (không chứa sản phẩm) an toàn | Chức năng xóa | P2 - Trung bình | Mục 1.2.1 |
| **TC-CAT-09** | Quản lý phân loại theo Loại phòng (Không gian sống) | Phân loại mở rộng | P2 - Trung bình | Mục 1.2.1 |
| **TC-CAT-10** | Quản lý phân loại theo Phong cách thiết kế nội thất | Phân loại mở rộng | P2 - Trung bình | Mục 1.2.1 |
| **TC-CAT-11** | Bật/tắt trạng thái hiển thị danh mục trên menu website | Cập nhật nhanh | P2 - Trung bình | Mục 1.2.1 |

---

## 2. Kịch bản Kiểm thử Chi tiết

### TC-CAT-01: Kiểm tra hiển thị Cây phân cấp danh mục đa tầng
* **Tiền điều kiện:** Người dùng truy cập trang Quản lý Danh mục `/admin/products/categories`.
* **Các bước thực hiện:**
  1. Chờ trang nạp hoàn tất dữ liệu.
  2. Quan sát cấu trúc bảng cây danh mục (Category Tree Table).
  3. Nhấp vào nút mở rộng/thu gọn (biểu tượng mũi tên `>` hoặc `v`) bên cạnh danh mục cha.
* **Kết quả mong đợi:**
  * Cấu trúc hiển thị phân cấp rõ ràng 2 tầng: Danh mục chính nằm thụt sát lề trái, danh mục con nằm thụt vào đầu dòng một khoảng chuẩn mực.
  * Hiển thị đầy đủ: Tên danh mục (kèm icon/ảnh đại diện), Mã slug, Số lượng sản phẩm trực thuộc, Thứ tự hiển thị, Trạng thái (Hiển thị / Ẩn), Cột thao tác.
  * Khi nhấp mũi tên mở rộng: Nhánh danh mục con xổ xuống trơn tru; khi nhấp thu gọn: Nhánh con ẩn đi gọn gàng.

---

### TC-CAT-02: Thêm mới Danh mục cha cấp 1 (Root Category)
* **Tiền điều kiện:** Đang ở trang Quản lý Danh mục.
* **Các bước thực hiện:**
  1. Nhấp nút **"Thêm danh mục"** ở góc trên trang.
  2. Nhập Tên danh mục tiếng Việt: `Nội Thất Văn Phòng Hiện Đại`.
  3. Để trống ô "Danh mục cha" (chọn `Là danh mục gốc`).
  4. Tải lên 1 hình ảnh đại diện / icon danh mục.
  5. Nhấp nút **"Lưu danh mục"**.
* **Kết quả mong đợi:**
  * Hệ thống hiển thị thông báo: *"Thêm danh mục thành công"*.
  * Danh mục mới xuất hiện ở cấp độ 1 ngoài bảng với số lượng sản phẩm là `0`.
  * Trạng thái mặc định là "Hiển thị".

---

### TC-CAT-03: Thêm mới Danh mục con trực thuộc Danh mục cha
* **Tiền điều kiện:** Đã có danh mục cha `Nội Thất Văn Phòng Hiện Đại`.
* **Các bước thực hiện:**
  1. Nhấp nút **"Thêm danh mục"** (hoặc nhấp dấu `+` trực tiếp tại dòng danh mục cha).
  2. Nhập Tên danh mục con: `Bàn Làm Việc Chân Sắt`.
  3. Tại ô "Danh mục cha", chọn: `Nội Thất Văn Phòng Hiện Đại`.
  4. Nhấp nút **"Lưu danh mục"**.
* **Kết quả mong đợi:**
  * Danh mục `Bàn Làm Việc Chân Sắt` được tạo thành công và nằm trực thuộc nhánh cha `Nội Thất Văn Phòng Hiện Đại`.
  * Khi mở rộng danh mục cha, danh mục con xuất hiện đầy đủ thông tin.

---

### TC-CAT-04: Kiểm tra cơ chế tự động tạo mã đường dẫn (Slug) thân thiện SEO
* **Tiền điều kiện:** Đang mở form thêm mới danh mục.
* **Các bước thực hiện:**
  1. Nhập vào ô Tên danh mục: `Bàn Trà Thông Minh Mặt Đá Cẩm Thạch`.
  2. Quan sát ô nhập liệu "Đường dẫn thân thiện (Slug)" bên dưới.
* **Kết quả mong đợi:**
  * Hệ thống tự động chuyển đổi chuỗi tiếng Việt có dấu thành chuỗi không dấu, cách nhau bởi dấu gạch ngang, chữ thường: `ban-tra-thong-minh-mat-da-cam-thach`.
  * Người dùng vẫn có thể chỉnh sửa thủ công slug nếu có nhu cầu tùy biến.

---

### TC-CAT-05: Kéo thả (Drag & Drop) sắp xếp thứ tự ưu tiên hiển thị
* **Tiền điều kiện:** Danh sách hiển thị các danh mục chính:
  1. *Sofa & Ghế Phòng Khách*
  2. *Bàn Ăn & Bếp*
  3. *Phòng Ngủ & Giường Nệm*
* **Các bước thực hiện:**
  1. Rê chuột vào biểu tượng tay cầm kéo (biểu tượng 6 dấu chấm hoặc mũi tên 4 hướng) tại dòng số 2 *Bàn Ăn & Bếp*.
  2. Nhấn giữ chuột trái và kéo lên phía trên dòng số 1.
  3. Thả chuột ra.
* **Kết quả mong đợi:**
  * Dòng *Bàn Ăn & Bếp* đổi vị trí thành công lên dòng số 1, *Sofa & Ghế Phòng Khách* lùi xuống dòng số 2.
  * Hiệu ứng chuyển động mượt mà, không bị giật trang.
  * Hệ thống tự động gửi yêu cầu cập nhật thứ tự hiển thị ngầm và hiển thị thông báo xác nhận thành công.

---

### TC-CAT-06: Chỉnh sửa tên, mô tả và hình ảnh đại diện danh mục
* **Tiền điều kiện:** Có sẵn một danh mục trong danh sách.
* **Các bước thực hiện:**
  1. Nhấp nút **"Chỉnh sửa"** (biểu tượng cây bút) tại dòng danh mục cần sửa.
  2. Thay đổi tên danh mục và tải ảnh đại diện mới.
  3. Nhấp nút **"Cập nhật"**.
* **Kết quả mong đợi:**
  * Thông tin mới được cập nhật ngay lập tức trên bảng dữ liệu.
  * Tên mới và ảnh mới hiển thị chính xác.

---

### TC-CAT-07: Ràng buộc nghiệp vụ - Chặn xóa danh mục đang chứa sản phẩm
* **Tiền điều kiện:** Danh mục `Sofa & Ghế Thư Giãn` đang chứa 28 sản phẩm nội thất đang kinh doanh trên hệ thống.
* **Các bước thực hiện:**
  1. Tìm danh mục `Sofa & Ghế Thư Giãn`.
  2. Nhấp vào nút **"Xóa"** (biểu tượng thùng rác màu đỏ).
* **Kết quả mong đợi:**
  * Hệ thống **nghiêm cấm hành vi xóa** và hiển thị hộp thoại cảnh báo: *"Không thể xóa danh mục đang chứa sản phẩm. Vui lòng chuyển toàn bộ 28 sản phẩm sang danh mục khác trước khi thực hiện xóa."*
  * Danh mục và toàn bộ sản phẩm bên trong giữ nguyên vẹn, không bị mất mát dữ liệu.

---

### TC-CAT-08: Xóa danh mục rỗng (không chứa sản phẩm) an toàn
* **Tiền điều kiện:** Tạo một danh mục thử nghiệm mới có số lượng sản phẩm bằng `0`.
* **Các bước thực hiện:**
  1. Nhấp nút **"Xóa"** tại dòng danh mục rỗng này.
  2. Quan sát hộp thoại xác nhận bật lên.
  3. Nhấp nút **"Xác nhận xóa"**.
* **Kết quả mong đợi:**
  * Hệ thống xóa danh mục khỏi cơ sở dữ liệu và hiển thị thông báo thành công: *"Đã xóa danh mục thành công"*.
  * Dòng danh mục biến mất khỏi bảng cây danh mục.

---

### TC-CAT-09: Quản lý phân loại theo Loại phòng (Không gian sống)
* **Tiền điều kiện:** Đang ở tab "Phân loại theo Không gian / Loại phòng" trên trang Danh mục.
* **Các bước thực hiện:**
  1. Kiểm tra danh sách các không gian: *Phòng khách, Phòng ngủ, Phòng ăn & Bếp, Phòng làm việc, Ban công & Ngoài trời*.
  2. Thêm mới một không gian sống: `Phòng Trẻ Em & Baby`.
* **Kết quả mong đợi:**
  * Không gian sống mới được lưu thành công.
  * Khi tạo sản phẩm mới, trường chọn Loại phòng sẽ có thêm tùy chọn `Phòng Trẻ Em & Baby`.

---

### TC-CAT-10: Quản lý phân loại theo Phong cách thiết kế nội thất
* **Tiền điều kiện:** Chuyển sang tab "Phong cách thiết kế (Styles)".
* **Các bước thực hiện:**
  1. Kiểm tra danh sách các ngôn ngữ thiết kế: *Hiện đại (Modern), Bắc Âu (Scandinavian), Tối giản (Minimalist), Tân cổ điển (Neo-Classical), Công nghiệp (Industrial)*.
  2. Cập nhật mô tả ngắn và ảnh đại diện cho phong cách *Bắc Âu (Scandinavian)*.
* **Kết quả mong đợi:**
  * Cập nhật thành công, ảnh đại diện mới được lưu và hiển thị chuẩn xác.

---

### TC-CAT-11: Bật/tắt trạng thái hiển thị danh mục trên menu website
* **Tiền điều kiện:** Danh mục đang ở trạng thái "Hiển thị" (nút gạt màu xanh).
* **Các bước thực hiện:**
  1. Gạt nút chuyển trạng thái sang "Tắt" (Ẩn).
* **Kết quả mong đợi:**
  * Trạng thái danh mục chuyển sang "Ẩn" (màu xám).
  * Menu điều hướng trên website bán hàng bên ngoài ngay lập tức ẩn danh mục này đi, không làm ảnh hưởng đến dữ liệu sản phẩm bên trong.

