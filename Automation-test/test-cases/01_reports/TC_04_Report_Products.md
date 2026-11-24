# Bộ Test Case: Báo Cáo Hiệu Quả Sản Phẩm (Products Report)

* **Mã Phân hệ:** ADM-11-PROD
* **Tên Màn hình:** Báo cáo Hiệu quả Sản phẩm & Ngành hàng (Product Sales Report)
* **Đường dẫn (URL):** `/admin/reports/products`
* **Tài liệu tham chiếu:** FRD - [ADM-11] Admin Reports & Dashboard (User Story US-04)
* **Đối tượng sử dụng:** Giám đốc Sản phẩm, Trưởng ngành hàng (Merchandiser), Quản lý Kho, QC Tester
* **Môi trường áp dụng:** Local (`http://localhost:4200`) & Vercel Dev (`https://dcor-studio-dev.vercel.app`)

---

## 1. Ma trận Test Case Tổng hợp

| Mã Test Case | Tên Kịch bản Kiểm thử | Phân loại | Mức độ | Tiêu chí FRD |
| :--- | :--- | :--- | :--- | :--- |
| **TC-PROD-01** | Kiểm tra hiển thị các thẻ KPI hiệu quả kinh doanh sản phẩm | Chức năng (Functional) | P1 - Cao | Mục 1.2.1 |
| **TC-PROD-02** | Nhấp vào Huy hiệu lượt bán của sản phẩm trong bảng Hiệu quả | Điều hướng chuyên sâu | P1 - Cao | Scenario 4.1 |
| **TC-PROD-03** | Lọc Biểu đồ Phễu tương tác theo Cây danh mục sản phẩm | Giao diện & Đồ họa | P1 - Cao | Scenario 4.2 |
| **TC-PROD-04** | Kiểm tra hiển thị Ma trận Bán kèm (Cross-sell Matrix) | Chức năng / Hiển thị | P1 - Cao | Scenario 4.3 |
| **TC-PROD-05** | Kiểm tra màu sắc độ đậm nhạt theo tỷ lệ trong Ma trận Bán kèm | Giao diện / UX | P2 - Trung bình | Scenario 4.3 |
| **TC-PROD-06** | Bảng xếp hạng Top sản phẩm doanh thu cao & Tỷ lệ hoàn trả | Chức năng / Hiển thị | P2 - Trung bình | Mục 1.2.1 |
| **TC-PROD-07** | Lọc sản phẩm theo Loại phòng (Phòng khách, Phòng ngủ, Phòng ăn) | Bộ lọc (Filter) | P1 - Cao | Mục 1.2.1 |
| **TC-PROD-08** | Lọc sản phẩm theo Phong cách (Hiện đại, Tân cổ điển, Minimalist) | Bộ lọc (Filter) | P2 - Trung bình | Mục 1.2.1 |
| **TC-PROD-09** | Xuất danh sách phân tích sản phẩm ra tệp bảng tính | Tiện ích (Export) | P2 - Trung bình | Mục 1.2.1 |
| **TC-PROD-10** | Ma trận Bán kèm khi không có đơn hàng nào mua chung 2 sản phẩm | Trường hợp biên (Edge Case) | P2 - Trung bình | Scenario 4.3 |
| **TC-PROD-11** | Tỷ lệ chuyển đổi Phễu khi Lượt xem sản phẩm bằng 0 | Trường hợp biên (Edge Case) | P2 - Trung bình | Scenario 4.2 |
| **TC-PROD-12** | Tìm kiếm sản phẩm với ký tự đặc biệt, dấu nháy đơn hoặc mã HTML (XSS) | Trường hợp biên (Bảo mật) | P1 - Cao | Mục 1.2.1 |
| **TC-PROD-13** | Sản phẩm có tên và quy cách kỹ thuật cực dài (> 150 ký tự) | Trường hợp biên (UI/UX) | P3 - Thấp | Mục 1.2.1 |

---

## 2. Kịch bản Kiểm thử Chi tiết (Happy Path & Chức Năng Cốt Lõi)

### TC-PROD-01: Kiểm tra hiển thị các thẻ KPI hiệu quả kinh doanh sản phẩm
* **Tiền điều kiện:** Người dùng truy cập trang Báo cáo Sản phẩm `/admin/reports/products`.
* **Các bước thực hiện:**
  1. Chờ trang tải hoàn tất dữ liệu.
  2. Quan sát 4 thẻ KPI ngành hàng đầu trang.
* **Kết quả mong đợi:**
  * Hiển thị đầy đủ 4 thẻ:
    1. **Doanh số bán lẻ sản phẩm:** Tổng giá trị hàng hóa bán ra trong kỳ.
    2. **Mặt hàng chủ lực bán chạy (Best Seller):** Tên mã SKU và số lượng bán ra cao nhất.
    3. **Tỷ lệ chuyển đổi mua hàng (Conversion Rate):** Tỷ lệ từ lượt xem sản phẩm chuyển thành đơn mua thành công.
    4. **Cảnh báo tồn kho luân chuyển:** Số lượng mặt hàng tồn kho cao nhưng tốc độ bán chậm (chậm luân chuyển).

---

### TC-PROD-02: Nhấp vào Huy hiệu lượt bán của sản phẩm trong bảng Hiệu quả
* **Tiền điều kiện:** Bảng "Hiệu quả kinh doanh & Tồn kho sản phẩm" đang hiển thị danh sách các mặt hàng nội thất (ví dụ: dòng sản phẩm *Sofa Da Bò Ý Florence*).
* **Các bước thực hiện:**
  1. Tìm dòng chứa sản phẩm *Sofa Da Bò Ý Florence*.
  2. Quan sát cột "Lượt bán" có chứa huy hiệu số lượng (ví dụ: `142 đơn`).
  3. Nhấp chuột vào huy hiệu số lượng `142 đơn`.
* **Kết quả mong đợi:**
  * Hệ thống mở sang trang Quản lý đơn hàng `/admin/orders`.
  * Ô tìm kiếm hoặc tham số URL tự động chứa tên sản phẩm: `searchProduct=Sofa Da Bò Ý Florence` (hoặc lọc theo mã SKU của sản phẩm).
  * Danh sách kết quả trên trang Đơn hàng chỉ hiển thị chính xác các đơn có đặt mua sản phẩm này.

---

### TC-PROD-03: Lọc Biểu đồ Phễu tương tác theo Cây danh mục sản phẩm
* **Tiền điều kiện:** Biểu đồ "Phễu tương tác sản phẩm theo thời gian" đang hiển thị 3 tầng chuyển đổi: Lượt xem sản phẩm -> Thêm vào giỏ hàng -> Đặt mua thành công.
* **Các bước thực hiện:**
  1. Nhấp vào nút lọc danh mục bên cạnh biểu đồ (chuyển từ "Tất cả danh mục" sang **"Bàn trà & Sofa"**).
* **Kết quả mong đợi:**
  * Chỉ duy nhất biểu đồ phễu tương tác thực hiện tính toán và vẽ lại số liệu cho riêng nhóm Bàn trà & Sofa.
  * Tỷ lệ phần trăm rơi rụng qua từng bước được hiển thị rõ ràng.
  * Toàn bộ trang không bị tải lại hoặc gián đoạn các khối khác.

---

### TC-PROD-04: Kiểm tra hiển thị Ma trận Bán kèm (Cross-sell Matrix)
* **Tiền điều kiện:** Cuộn chuột đến khu vực "Ma trận Bán kèm (Cross-sell Analysis)".
* **Các bước thực hiện:**
  1. Quan sát trục tung (cột dọc) và trục hoành (hàng ngang) của ma trận chứa danh sách các sản phẩm nội thất chính.
  2. Kiểm tra ô giao điểm giữa 2 sản phẩm (ví dụ: *Sofa Góc L-Shape* và *Bàn Trà Mặt Đá*).
* **Kết quả mong đợi:**
  * Ô giao điểm hiển thị giá trị phần trăm mua kèm (ví dụ: `68%`).
  * Các ô giao giữa một sản phẩm với chính nó được làm mờ hoặc ký hiệu `N/A`.
  * Các cặp sản phẩm không có đơn hàng mua chung hiển thị dấu gạch ngang rõ ràng `-`.

---

### TC-PROD-05: Kiểm tra màu sắc độ đậm nhạt theo tỷ lệ trong Ma trận Bán kèm
* **Tiền điều kiện:** Ma trận bán kèm đã hiển thị đầy đủ số liệu.
* **Các bước thực hiện:**
  1. So sánh màu nền của các ô có tỷ lệ mua kèm cao (trên 60%) so với các ô có tỷ lệ thấp (dưới 15%).
* **Kết quả mong đợi:**
  * Ô có tỷ lệ mua kèm càng cao thì màu nền thương hiệu (nâu ấm / cam đất) càng đậm nét.
  * Ô có tỷ lệ thấp hiển thị màu nền nhạt, giúp người quản lý nhìn lướt là nhận diện được ngay cặp sản phẩm thường bán kèm hiệu quả nhất.

---

### TC-PROD-06: Bảng xếp hạng Top sản phẩm doanh thu cao & Tỷ lệ hoàn trả
* **Tiền điều kiện:** Đang xem bảng danh sách sản phẩm.
* **Các bước thực hiện:**
  1. Quan sát cột "Doanh thu đóng góp" và cột "Tỷ lệ đổi trả / bảo hành".
* **Kết quả mong đợi:**
  * Sản phẩm có doanh thu cao nhất đứng ở vị trí số 1.
  * Cột tỷ lệ đổi trả hiển thị phần trăm rõ ràng, những sản phẩm có tỷ lệ đổi trả trên 5% được cảnh báo màu vàng hoặc đỏ để kiểm tra lại chất lượng sản xuất tại xưởng.

---

### TC-PROD-07: Lọc sản phẩm theo Loại phòng
* **Tiền điều kiện:** Đang ở trang Báo cáo Sản phẩm.
* **Các bước thực hiện:**
  1. Nhấp vào bộ lọc Loại phòng và chọn **"Phòng khách"**.
* **Kết quả mong đợi:**
  * Danh sách và biểu đồ chỉ hiển thị các mặt hàng thuộc không gian Phòng khách (Sofa, Bàn trà, Kệ tivi, Tủ giày).
  * Doanh số tổng được tính lại đúng cho nhóm không gian này.

---

### TC-PROD-08: Lọc sản phẩm theo Phong cách thiết kế
* **Tiền điều kiện:** Đang ở trang Báo cáo Sản phẩm.
* **Các bước thực hiện:**
  1. Nhấp vào bộ lọc Phong cách và chọn **"Hiện đại (Modern)"** hoặc **"Tân cổ điển (Neo-Classical)"**.
* **Kết quả mong đợi:**
  * Báo cáo cập nhật chỉ phân tích các mẫu nội thất thuộc đúng ngôn ngữ thiết kế đã chọn.

---

### TC-PROD-09: Xuất danh sách phân tích sản phẩm ra tệp bảng tính
* **Tiền điều kiện:** Đã chọn các điều kiện lọc sản phẩm.
* **Các bước thực hiện:**
  1. Nhấp nút **"Xuất Excel"** tại đầu bảng hiệu quả sản phẩm.
* **Kết quả mong đợi:**
  * Tải xuống tệp tin chứa danh sách SKU, Tên sản phẩm, Danh mục, Lượt xem, Lượt bán, Doanh thu, Tồn kho thực tế.
  * Định dạng số lượng và tiền tệ hiển thị chuẩn xác trong Excel.

---

## 3. Kịch bản Kiểm thử Chi tiết Trường Hợp Biên (Edge Cases & Negative Scenarios)

### TC-PROD-10: Ma trận Bán kèm khi không có đơn hàng nào mua chung 2 sản phẩm
* **Tiền điều kiện:** Toàn bộ khách hàng trong kỳ chỉ mua đơn hàng đơn lẻ 1 món (không có đơn hàng nào chứa từ 2 sản phẩm khác nhau trở lên).
* **Các bước thực hiện:**
  1. Quan sát ma trận bán kèm.
* **Kết quả mong đợi:**
  * Toàn bộ các ô giao nhau giữa các sản phẩm đều hiển thị ký hiệu `-` (0%).
  * Không ô nào bị tô màu đậm bất thường.
  * Xuất hiện dòng ghi chú giải thích: *"Trong chu kỳ này, các đơn hàng đều mua lẻ từng sản phẩm đơn chiếc"*.

---

### TC-PROD-11: Tỷ lệ chuyển đổi Phễu khi Lượt xem sản phẩm bằng 0
* **Tiền điều kiện:** Một danh mục sản phẩm mới đưa lên hệ thống chưa có lượt xem nào (Lượt xem = 0, Thêm giỏ = 0, Mua hàng = 0).
* **Các bước thực hiện:**
  1. Lọc biểu đồ phễu tương tác theo danh mục mới này.
* **Kết quả mong đợi:**
  * Hệ thống xử lý phép tính chuyển đổi $\frac{0}{0}$ an toàn.
  * Hiển thị tỷ lệ chuyển đổi `0%`, không hiển thị `NaN%`.
  * Biểu đồ giữ nguyên hình dạng phẳng ở mức 0 mà không phát sinh lỗi script console.

---

### TC-PROD-12: Tìm kiếm sản phẩm với ký tự đặc biệt, dấu nháy đơn hoặc mã HTML (XSS)
* **Tiền điều kiện:** Đang ở ô tìm kiếm sản phẩm trên báo cáo.
* **Các bước thực hiện:**
  1. Nhập chuỗi ký tự tấn công mã độc XSS: `<script>alert('XSS')</script>`.
  2. Nhập chuỗi chứa dấu nháy đơn và ký tự đặc biệt: `Sofa O'Connor & "Special" 100% #1`.
* **Kết quả mong đợi:**
  * Hệ thống mã hóa (Escape/Sanitize) toàn bộ các thẻ HTML, **tuyệt đối không bật hộp thoại pop-up cảnh báo script**.
  * Chuỗi tìm kiếm được xử lý an toàn dạng văn bản thuần (Plain Text).
  * Hiển thị kết quả tìm kiếm đúng hoặc thông báo không tìm thấy sản phẩm một cách sạch sẽ.

---

### TC-PROD-13: Sản phẩm có tên và quy cách kỹ thuật cực dài (> 150 ký tự)
* **Tiền điều kiện:** Tên sản phẩm đầy đủ là: `Bộ Bàn Ăn Gỗ Me Tây Nguyên Tấm Phong Cách Tân Cổ Điển Sang Trọng Nhập Khẩu Đi Kèm 8 Ghế Da Bò Thật Khung Gỗ Tự Nhiên Sơn Phủ PU 5 Lớp Chống Trầy Xước Cao Cấp DCOR-2026`.
* **Các bước thực hiện:**
  1. Quan sát cách hiển thị dòng sản phẩm này trên bảng hiệu quả kinh doanh.
* **Kết quả mong đợi:**
  * Tên sản phẩm tự động ngắt dòng hợp lý hoặc rút gọn bằng dấu 3 chấm `...` (Ellipsis).
  * Khi người dùng rà chuột (hover) vào tên, xuất hiện tooltip hiển thị đầy đủ 100% tên sản phẩm.
  * Bảng không bị giãn rộng làm vỡ khung hình hoặc đẩy các cột khác ra khỏi màn hình.
