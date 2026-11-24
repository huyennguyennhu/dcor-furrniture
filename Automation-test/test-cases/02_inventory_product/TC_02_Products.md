# Bộ Test Case: Danh Sách Sản Phẩm (Products Management)

* **Mã Phân hệ:** ADM-PROD-CATALOG
* **Tên Màn hình:** Danh sách Sản phẩm (Product Catalog Management)
* **Đường dẫn (URL):** `/admin/products`
* **Tài liệu tham chiếu:** FRD - [ADM-Master] Product, Inventory & Customer Management (User Story US-03)
* **Đối tượng sử dụng:** Chuyên viên Quản trị Sản phẩm, Thủ kho, Quản trị viên, QC Tester
* **Môi trường áp dụng:** Local (`http://localhost:4200`) & Vercel Dev (`https://dcor-studio-dev.vercel.app`)

---

## 1. Ma trận Test Case Tổng hợp

| Mã Test Case | Tên Kịch bản Kiểm thử | Phân loại | Mức độ | Tiêu chí FRD |
| :--- | :--- | :--- | :--- | :--- |
| **TC-PROD-01** | Kiểm tra hiển thị danh sách sản phẩm và các thẻ thống kê | Chức năng (Functional) | P1 - Cao | Mục 1.2.1 |
| **TC-PROD-02** | Tìm kiếm sản phẩm theo Tên sản phẩm và Mã SKU | Tìm kiếm (Search) | P1 - Cao | Mục 1.2.1 |
| **TC-PROD-03** | Lọc danh sách sản phẩm theo Danh mục phân cấp | Bộ lọc (Filter) | P1 - Cao | Mục 1.2.1 |
| **TC-PROD-04** | Lọc danh sách theo Trạng thái kinh doanh & Tình trạng tồn kho | Bộ lọc (Filter) | P1 - Cao | Mục 1.2.1 |
| **TC-PROD-05** | Sắp xếp danh sách theo cột dọc (▲ Tăng dần / ▼ Giảm dần) | Giao diện & Sắp xếp | P1 - Cao | Mục 1.2.1 |
| **TC-PROD-06** | Tạo mới sản phẩm nội thất hoàn chỉnh (Happy Path) | Chức năng thêm mới | P1 - Cao | Scenario 3.1 |
| **TC-PROD-07** | Bắt lỗi trùng lặp mã SKU khi tạo hoặc sửa sản phẩm | Kiểm tra tính hợp lệ | P1 - Cao | Scenario 3.2 |
| **TC-PROD-08** | Kiểm tra các trường thông tin bắt buộc khi tạo sản phẩm | Kiểm tra tính hợp lệ | P1 - Cao | Scenario 3.1 |
| **TC-PROD-09** | Chỉnh sửa thông tin, giá bán và hình ảnh sản phẩm | Chức năng cập nhật | P1 - Cao | Mục 1.2.1 |
| **TC-PROD-10** | Chuyển đổi nhanh trạng thái kinh doanh (Hoạt động / Tạm ẩn) | Cập nhật nhanh | P2 - Trung bình | Mục 1.2.1 |
| **TC-PROD-11** | Xóa sản phẩm có ràng buộc an toàn (Ngăn xóa nếu có đơn hàng) | Ràng buộc nghiệp vụ | P1 - Cao | Mục 1.2.1 |
| **TC-PROD-12** | Xem nhanh chi tiết sản phẩm qua ngăn kéo xem trước (Drawer) | Trải nghiệm người dùng | P2 - Trung bình | Mục 1.2.1 |
| **TC-PROD-13** | Nhập Đơn giá là số âm hoặc bằng 0 | Trường hợp biên (Validation) | P1 - Cao | Scenario 3.1 |
| **TC-PROD-14** | Tải lên tệp ảnh sai định dạng (.exe, .pdf) hoặc vượt quá 5MB | Trường hợp biên (Upload) | P2 - Trung bình | Scenario 3.1 |
| **TC-PROD-15** | Nhập quy cách kích thước (Dài, Rộng, Cao) là số âm hoặc chữ cái | Trường hợp biên (Validation) | P2 - Trung bình | Scenario 3.1 |
| **TC-PROD-16** | Tên sản phẩm chứa mã HTML độc hại (Chống tấn công XSS) | Trường hợp biên (Bảo mật) | P1 - Cao | Mục 1.2.1 |

---

## 2. Kịch bản Kiểm thử Chi tiết (Happy Path & Chức Năng Cốt Lõi)

### TC-PROD-01: Kiểm tra hiển thị danh sách sản phẩm và các thẻ thống kê
* **Tiền điều kiện:** Người dùng truy cập trang Quản lý Sản phẩm `/admin/products`.
* **Các bước thực hiện:**
  1. Chờ trang nạp hoàn tất dữ liệu.
  2. Quan sát hàng thẻ thống kê trên cùng và bảng danh sách.
* **Kết quả mong đợi:**
  * Hiển thị đủ 4 thẻ thống kê: Tổng số sản phẩm, Sản phẩm đang kinh doanh, Sản phẩm tạm ẩn, Sản phẩm hết hàng / sắp hết hàng.
  * Bảng hiển thị các cột: Sản phẩm (Hình thu nhỏ, Tên mẫu nội thất, Quy cách), Mã SKU, Danh mục, Đơn giá niêm yết (VNĐ), Số lượng tồn kho, Trạng thái kinh doanh, Thao tác.
  * Hình ảnh sản phẩm tải rõ nét, không bị lỗi icon ảnh vỡ.

---

### TC-PROD-02: Tìm kiếm sản phẩm theo Tên sản phẩm và Mã SKU
* **Tiền điều kiện:** Danh sách có nhiều sản phẩm với các tên và mã SKU khác nhau.
* **Các bước thực hiện:**
  1. Nhập mã SKU vào ô tìm kiếm (ví dụ: `SF-FLORENCE-01`).
  2. Xóa ô tìm kiếm, nhập tên tiếng Việt có dấu (ví dụ: `Bàn Trà Mặt Đá`).
* **Kết quả mong đợi:**
  * Khi tìm theo SKU: Bảng chỉ hiển thị duy nhất sản phẩm có mã SKU trùng khớp chính xác.
  * Khi tìm theo Tên: Hiển thị toàn bộ các sản phẩm có chứa cụm từ tìm kiếm, tốc độ phản hồi nhanh, không cần nhấn Enter.

---

### TC-PROD-03: Lọc danh sách sản phẩm theo Danh mục phân cấp
* **Tiền điều kiện:** Đang ở bảng danh sách sản phẩm.
* **Các bước thực hiện:**
  1. Nhấp vào bộ lọc thả xuống "Danh mục sản phẩm".
  2. Chọn một danh mục (ví dụ: **"Sofa & Ghế Thư Giãn"** hoặc **"Bàn Ăn & Bếp"**).
* **Kết quả mong đợi:**
  * Bảng cập nhật và chỉ hiển thị các sản phẩm thuộc danh mục đã chọn (bao gồm cả các sản phẩm thuộc danh mục con trực thuộc).
  * Bộ đếm số lượng kết quả hiển thị khớp với số dòng thực tế.

---

### TC-PROD-04: Lọc danh sách theo Trạng thái kinh doanh & Tình trạng tồn kho
* **Tiền điều kiện:** Hệ thống có các sản phẩm ở các trạng thái khác nhau.
* **Các bước thực hiện:**
  1. Lọc theo Trạng thái: Chọn **"Đang kinh doanh (Hoạt động)"**, sau đó chuyển sang **"Tạm ẩn"**.
  2. Lọc theo Tình trạng tồn: Chọn **"Hết hàng (Tồn = 0)"** hoặc **"Sắp hết hàng"**.
* **Kết quả mong đợi:**
  * Khi chọn "Hết hàng": Danh sách chỉ hiển thị các mã hàng có số lượng tồn kho khả dụng bằng 0.
  * Khi chọn "Tạm ẩn": Chỉ hiển thị các mẫu nội thất đang tạm dừng bán, không hiển thị ra ngoài website khách hàng.

---

### TC-PROD-05: Sắp xếp danh sách theo cột dọc (▲ Tăng dần / ▼ Giảm dần)
* **Tiền điều kiện:** Đang ở bảng danh sách sản phẩm.
* **Các bước thực hiện:**
  1. Nhấp chuột lần 1 vào tiêu đề cột **"Đơn giá"**.
  2. Quan sát thứ tự giá bán và cụm nút mũi tên tại tiêu đề cột.
  3. Nhấp chuột lần 2 vào tiêu đề cột **"Đơn giá"**.
  4. Quan sát lại thứ tự và cụm nút mũi tên.
* **Kết quả mong đợi:**
  * Nhấp lần 1: Danh sách sắp xếp giá từ thấp đến cao (Tăng dần). Cụm nút chuyển sang hiển thị **chỉ duy nhất mũi tên hướng lên (▲)** màu xanh đậm, mũi tên hướng xuống bị ẩn.
  * Nhấp lần 2: Danh sách đảo chiều sắp xếp giá từ cao xuống thấp (Giảm dần). Cụm nút chuyển sang hiển thị **chỉ duy nhất mũi tên hướng xuống (▼)** màu xanh đậm, mũi tên hướng lên bị ẩn.
  * Thực hiện tương tự thành công trên các cột: **"Tên sản phẩm"** và **"Số lượng tồn kho"**.

---

### TC-PROD-06: Tạo mới sản phẩm nội thất hoàn chỉnh (Happy Path)
* **Tiền điều kiện:** Người dùng có quyền Quản trị sản phẩm và đang ở form Thêm mới sản phẩm `/admin/products/new`.
* **Các bước thực hiện:**
  1. Nhập Tên sản phẩm: `Ghế Armchair Scandinavia DCOR`.
  2. Nhập Mã SKU: `AC-SCAN-01`.
  3. Chọn Danh mục: `Ghế Thư Giãn & Armchair`.
  4. Nhập Đơn giá niêm yết: `8500000`.
  5. Nhập Thông số kỹ thuật: Kích thước `850 x 800 x 920 mm`, Chất liệu `Gỗ sồi tự nhiên, Vải nỉ Bỉ cao cấp`.
  6. Tải lên 2 ảnh sản phẩm chất lượng cao (.jpg / .png).
  7. Nhấp nút **"Lưu sản phẩm"**.
* **Kết quả mong đợi:**
  * Hệ thống thông báo thành công: *"Thêm mới sản phẩm thành công"*.
  * Trình duyệt chuyển về danh sách sản phẩm, sản phẩm mới xuất hiện ở đầu bảng với trạng thái "Hoạt động".
  * Số lượng sản phẩm tổng tăng lên 1.

---

### TC-PROD-07: Bắt lỗi trùng lặp mã SKU khi tạo hoặc sửa sản phẩm
* **Tiền điều kiện:** Mã SKU `AC-SCAN-01` đã tồn tại trên hệ thống.
* **Các bước thực hiện:**
  1. Mở form thêm mới sản phẩm.
  2. Nhập thông tin và gõ mã SKU là `AC-SCAN-01`.
  3. Rà chuột hoặc chuyển sang ô nhập liệu khác (sự kiện Blur).
* **Kết quả mong đợi:**
  * Ô nhập mã SKU hiển thị viền đỏ cảnh báo.
  * Bên dưới xuất hiện dòng thông báo lỗi: *"Mã SKU này đã tồn tại trên hệ thống, vui lòng chọn mã khác"*.
  * Nút "Lưu sản phẩm" bị vô hiệu hóa (disabled), không cho phép lưu bản ghi trùng lặp.

---

### TC-PROD-08: Kiểm tra các trường thông tin bắt buộc khi tạo sản phẩm
* **Tiền điều kiện:** Form tạo mới sản phẩm đang để trống toàn bộ.
* **Các bước thực hiện:**
  1. Nhấp trực tiếp vào nút **"Lưu sản phẩm"**.
* **Kết quả mong đợi:**
  * Hệ thống chặn không cho lưu và cuộn đến trường lỗi đầu tiên.
  * Các trường bắt buộc hiển thị cảnh báo đỏ rõ ràng:
    * *"Tên sản phẩm không được để trống"*
    * *"Mã SKU là bắt buộc"*
    * *"Vui lòng chọn danh mục"*
    * *"Đơn giá phải lớn hơn 0"*
    * *"Vui lòng tải lên ít nhất 1 hình ảnh đại diện"*

---

### TC-PROD-09: Chỉnh sửa thông tin, giá bán và hình ảnh sản phẩm
* **Tiền điều kiện:** Có sẵn một sản phẩm trong danh sách.
* **Các bước thực hiện:**
  1. Nhấp vào nút **"Chỉnh sửa"** (biểu tượng cây bút) tại dòng sản phẩm cần sửa.
  2. Thay đổi giá bán từ `8,500,000 ₫` thành `7,900,000 ₫`.
  3. Thêm một ghi chú mô tả sản phẩm mới.
  4. Nhấp nút **"Cập nhật sản phẩm"**.
* **Kết quả mong đợi:**
  * Hệ thống hiển thị thông báo cập nhật thành công.
  * Trở lại danh sách sản phẩm, đơn giá mới `7,900,000 ₫` được hiển thị ngay lập tức.

---

### TC-PROD-10: Chuyển đổi nhanh trạng thái kinh doanh (Hoạt động / Tạm ẩn)
* **Tiền điều kiện:** Sản phẩm đang ở trạng thái "Hoạt động".
* **Các bước thực hiện:**
  1. Nhấp vào nút gạt bật/tắt (Toggle) hoặc menu thao tác và chọn **"Tạm ẩn kinh doanh"**.
* **Kết quả mong đợi:**
  * Nhãn trạng thái đổi ngay sang màu xám **"Tạm ẩn"**.
  * Sản phẩm này ngay lập tức không còn hiển thị trên danh mục bán hàng ngoài website của khách hàng.

---

### TC-PROD-11: Xóa sản phẩm có ràng buộc an toàn
* **Tiền điều kiện:**
  * Trường hợp 1: Sản phẩm đã phát sinh trong các đơn hàng đã bán hoặc đang giao.
  * Trường hợp 2: Sản phẩm mới tạo chưa từng phát sinh giao dịch nào.
* **Các bước thực hiện:**
  1. Thực hiện thao tác xóa sản phẩm ở Trường hợp 1 -> Quan sát kết quả.
  2. Thực hiện thao tác xóa sản phẩm ở Trường hợp 2 -> Nhấp xác nhận xóa.
* **Kết quả mong đợi:**
  * Ở Trường hợp 1: Hệ thống từ chối xóa và bật thông báo giải thích: *"Không thể xóa sản phẩm đã có lịch sử giao dịch đơn hàng. Bạn có thể chọn Tạm ẩn kinh doanh."*
  * Ở Trường hợp 2: Bật hộp thoại xác nhận an toàn, sau khi nhấn xác nhận, sản phẩm được xóa hoàn toàn khỏi danh sách.

---

### TC-PROD-12: Xem nhanh chi tiết sản phẩm qua ngăn kéo xem trước (Drawer)
* **Tiền điều kiện:** Đang xem bảng danh sách sản phẩm.
* **Các bước thực hiện:**
  1. Nhấp vào nút **"Xem trước"** (hoặc biểu tượng con mắt) tại dòng sản phẩm bất kỳ.
* **Kết quả mong đợi:**
  * Ngăn kéo trượt (Quick-view Drawer) trượt ra từ cạnh phải màn hình mượt mà.
  * Hiển thị thư viện ảnh dạng băng chuyền trượt, thông số kích thước, tình trạng tồn kho theo từng vị trí kho và bảng giá biến thể.
  * Người dùng có thể đóng ngăn kéo bằng cách nhấp dấu `X` hoặc nhấp vào vùng mờ bên ngoài.

---

## 3. Kịch bản Kiểm thử Chi tiết Trường Hợp Biên (Edge Cases & Negative Scenarios)

### TC-PROD-13: Nhập Đơn giá là số âm hoặc bằng 0
* **Tiền điều kiện:** Đang ở form thêm hoặc sửa sản phẩm.
* **Các bước thực hiện:**
  1. Nhập vào ô Đơn giá: `-1500000`.
  2. Thử nhập tiếp giá trị: `0`.
  3. Nhấp nút Lưu.
* **Kết quả mong đợi:**
  * Hệ thống chặn hành động submit form và hiển thị cảnh báo lỗi viền đỏ: *"Đơn giá niêm yết phải lớn hơn 0 ₫"*.
  * Không cho phép lưu sản phẩm có giá trị âm hoặc 0 ₫ vào hệ thống.

---

### TC-PROD-14: Tải lên tệp ảnh sai định dạng hoặc vượt quá 5MB
* **Tiền điều kiện:** Đang ở khu vực tải ảnh đại diện sản phẩm.
* **Các bước thực hiện:**
  1. Thử kéo thả một tệp thực thi `.exe` hoặc tệp văn bản `.docx` vào khung tải ảnh.
  2. Thử tải lên một tệp ảnh `.png` có dung lượng `12MB` (vượt ngưỡng 5MB).
* **Kết quả mong đợi:**
  * Khi chọn tệp sai định dạng: Báo lỗi ngay lập tức: *"Định dạng tệp không được hỗ trợ. Vui lòng chỉ tải tệp ảnh có đuôi .jpg, .png hoặc .webp"*.
  * Khi ảnh quá nặng: Báo lỗi: *"Dung lượng ảnh vượt quá giới hạn tối đa cho phép (5MB)"*.
  * Tệp không hợp lệ không được upload lên server.

---

### TC-PROD-15: Nhập quy cách kích thước là số âm hoặc chữ cái
* **Tiền điều kiện:** Đang ở nhóm trường thông số Kích thước (Dài x Rộng x Cao).
* **Các bước thực hiện:**
  1. Nhập Chiều dài: `-800`.
  2. Nhập Chiều rộng: `abc`.
* **Kết quả mong đợi:**
  * Hệ thống chặn không cho gõ chữ cái vào ô kích thước số (Numeric Only).
  * Với số âm: Hiển thị lỗi *"Kích thước hình học phải là số dương lớn hơn 0"*.

---

### TC-PROD-16: Tên sản phẩm chứa mã HTML độc hại (Chống tấn công XSS)
* **Tiền điều kiện:** Đang tạo sản phẩm mới.
* **Các bước thực hiện:**
  1. Nhập Tên sản phẩm: `<img src=x onerror=alert('Hacked')> Bàn Trà Cao Cấp`.
  2. Nhấp Lưu và quan sát hiển thị ngoài danh sách bảng sản phẩm.
* **Kết quả mong đợi:**
  * Tên sản phẩm được xử lý Escape an toàn.
  * Không hề bật mã JavaScript cảnh báo.
  * Hiển thị nguyên văn dạng chuỗi văn bản thuần an toàn.
