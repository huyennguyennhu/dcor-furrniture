# Bộ Test Case: Tổng Quan Kho (Inventory Overview)

* **Mã Phân hệ:** ADM-INV-OVERVIEW
* **Tên Màn hình:** Tổng quan Kho & Tồn kho Thực tế (Inventory Overview)
* **Đường dẫn (URL):** `/admin/inventory`
* **Tài liệu tham chiếu:** FRD - [ADM-Master] Product, Inventory & Customer Management (User Story US-04)
* **Đối tượng sử dụng:** Quản lý Kho, Thủ kho, Sales Showroom, QC/QA Tester
* **Môi trường áp dụng:** Local (`http://localhost:4200`) & Vercel Dev (`https://dcor-studio-dev.vercel.app`)

---

## 1. Ma trận Test Case Tổng hợp

| Mã Test Case | Tên Kịch bản Kiểm thử | Phân loại | Mức độ | Tiêu chí FRD |
| :--- | :--- | :--- | :--- | :--- |
| **TC-INV-01** | Kiểm tra hiển thị 4 Thẻ chỉ số KPI Tồn kho tổng hợp | Chức năng (Functional) | P1 - Cao | Mục 1.2.1 |
| **TC-INV-02** | Đối soát logic tính toán 3 trạng thái tồn: Thực tế, Cam kết, Khả dụng | Logic / Tính toán | P1 - Cao | Scenario 4.1 |
| **TC-INV-03** | Lọc dữ liệu theo từng Điểm kho (Kho Tổng, Showroom Q7, Showroom Q2...) | Bộ lọc (Filter) | P1 - Cao | Mục 1.2.1 |
| **TC-INV-04** | Tìm kiếm sản phẩm trong kho theo Tên và Mã SKU | Tìm kiếm (Search) | P1 - Cao | Mục 1.2.1 |
| **TC-INV-05** | Tra cứu vị trí kệ lưu trữ vật lý chi tiết của từng SKU | Chức năng chi tiết | P1 - Cao | Scenario 4.2 |
| **TC-INV-06** | Kiểm tra hiển thị màu sắc huy hiệu cảnh báo Tồn thấp và Hết hàng | Giao diện / Cảnh báo | P1 - Cao | Mục 3.1.4 |
| **TC-INV-07** | Sắp xếp danh sách theo cột dọc (▲ Tăng dần / ▼ Giảm dần) | Giao diện & Sắp xếp | P1 - Cao | Mục 1.2.1 |
| **TC-INV-08** | Lọc nhanh các mặt hàng chạm hoặc dưới Ngưỡng an toàn | Bộ lọc (Filter) | P1 - Cao | Mục 1.2.1 |
| **TC-INV-09** | Xuất báo cáo kiểm soát tồn kho khả dụng ra Excel / CSV | Tiện ích (Export) | P2 - Trung bình | Mục 1.2.1 |
| **TC-INV-10** | Tồn thực tế nhỏ hơn Tồn cam kết (Hiện tượng âm tồn khả dụng) | Trường hợp biên (Edge Case) | P1 - Cao | Scenario 4.1 |
| **TC-INV-11** | Sản phẩm mới nhập kho chưa được phân bổ vị trí kệ lưu trữ | Trường hợp biên (Edge Case) | P2 - Trung bình | Scenario 4.2 |

---

## 2. Kịch bản Kiểm thử Chi tiết (Happy Path & Chức Năng Cốt Lõi)

### TC-INV-01: Kiểm tra hiển thị 4 Thẻ chỉ số KPI Tồn kho tổng hợp
* **Tiền điều kiện:** Người dùng đăng nhập hệ thống và vào trang Tổng quan Kho `/admin/inventory`.
* **Các bước thực hiện:**
  1. Chờ dữ liệu nạp hoàn tất.
  2. Quan sát hàng thẻ thống kê trên cùng.
* **Kết quả mong đợi:**
  * Hiển thị đủ 4 thẻ:
    1. **Tổng giá trị tồn kho:** Định dạng tiền tệ VNĐ (ví dụ: `2.450.000.000 ₫`).
    2. **Tổng số lượng SKU lưu kho:** Tổng số mã sản phẩm đang quản lý.
    3. **Cảnh báo tồn kho thấp:** Số lượng mã hàng có tồn kho khả dụng chạm hoặc dưới ngưỡng an toàn (màu cam/vàng).
    4. **Sản phẩm hết hàng:** Số lượng mã hàng có tồn khả dụng bằng 0 (màu đỏ).
  * Số liệu hiển thị tức thì, không bị lỗi tính toán.

---

### TC-INV-02: Đối soát logic tính toán 3 trạng thái tồn: Thực tế, Cam kết, Khả dụng
* **Tiền điều kiện:** Trang kho hiển thị các sản phẩm có phát sinh đơn hàng.
* **Các bước thực hiện:**
  1. Chọn một sản phẩm cụ thể (ví dụ: *Ghế Thư Giãn Bọc Da Eames*).
  2. Ghi nhận số liệu 3 cột:
     * Cột 1: **Tồn thực tế** (On-hand stock) = $A$
     * Cột 2: **Tồn cam kết giữ hàng** (Reserved stock cho đơn đang chờ xuất xưởng) = $B$
     * Cột 3: **Tồn khả dụng có thể bán** (Available stock) = $C$
  3. Kiểm tra công thức: $C = A - B$.
* **Kết quả mong đợi:**
  * Giá trị cột Tồn khả dụng luôn luôn bằng Tồn thực tế trừ Tồn cam kết: $C = A - B$.
  * Ví dụ: Thực tế 20 chiếc, Cam kết 5 chiếc -> Khả dụng bắt buộc phải bằng chính xác 15 chiếc.
  * Nhân viên bán hàng chỉ được phép bán thêm tối đa 15 chiếc.

---

### TC-INV-03: Lọc dữ liệu theo từng Điểm kho
* **Tiền điều kiện:** Hệ thống có mạng lưới nhiều điểm kho (Kho tổng Bình Dương, Kho Showroom Q7, Kho Showroom Q2, Kho Hà Nội).
* **Các bước thực hiện:**
  1. Nhấp vào bộ lọc thả xuống "Điểm kho / Chi nhánh".
  2. Chọn lần lượt: **"Kho Showroom Quận 7"**, **"Kho Tổng Bình Dương"**.
* **Kết quả mong đợi:**
  * Danh sách tồn kho cập nhật và chỉ hiển thị số lượng tồn tại điểm kho được chọn.
  * Thẻ Tổng giá trị tồn kho tính toán lại chính xác cho riêng kho đó.

---

### TC-INV-04: Tìm kiếm sản phẩm trong kho theo Tên và Mã SKU
* **Tiền điều kiện:** Đang ở ô tìm kiếm của trang kho.
* **Các bước thực hiện:**
  1. Nhập mã SKU: `SF-FLORENCE-01`.
  2. Xóa và nhập tên sản phẩm: `Sofa Da Bò Ý`.
* **Kết quả mong đợi:**
  * Tìm kiếm tức thì, lọc đúng sản phẩm cần tìm.
  * Hiển thị số lượng tồn của sản phẩm đó trên từng điểm kho.

---

### TC-INV-05: Tra cứu vị trí kệ lưu trữ vật lý chi tiết của từng SKU
* **Tiền điều kiện:** Thủ kho cần chuẩn bị hàng để xuất xưởng.
* **Các bước thực hiện:**
  1. Tìm sản phẩm cần lấy hàng trên bảng.
  2. Quan sát cột "Vị trí lưu kho" hoặc nhấp vào biểu tượng vị trí.
* **Kết quả mong đợi:**
  * Hiển thị chuẩn xác tọa độ vật lý theo 4 cấp: **Khu vực - Dãy kệ - Tầng - Ngăn** (ví dụ: `Khu B - Kệ 03 - Tầng 2 - Ngăn 04`).
  * Giúp thủ kho di chuyển đến đúng vị trí để nhặt hàng trong vòng 1-2 phút mà không phải tìm kiếm toàn kho.

---

### TC-INV-06: Kiểm tra hiển thị màu sắc huy hiệu cảnh báo Tồn thấp và Hết hàng
* **Tiền điều kiện:** Hệ thống có sản phẩm đủ hàng, sắp hết hàng và hết hàng.
* **Các bước thực hiện:**
  1. Quan sát cột Trạng thái tồn kho của các dòng sản phẩm.
* **Kết quả mong đợi:**
  * **Xanh lá cây (An toàn):** Khi Tồn khả dụng > Ngưỡng an toàn tối thiểu.
  * **Vàng cam (Cảnh báo tồn thấp):** Khi Tồn khả dụng $\le$ Ngưỡng an toàn và $> 0$.
  * **Đỏ (Hết hàng):** Khi Tồn khả dụng $= 0$.

---

### TC-INV-07: Sắp xếp danh sách theo cột dọc (▲ Tăng dần / ▼ Giảm dần)
* **Tiền điều kiện:** Đang xem bảng tổng quan kho.
* **Các bước thực hiện:**
  1. Nhấp chuột lần 1 vào tiêu đề cột **"Tồn khả dụng"**.
  2. Nhấp chuột lần 2 vào tiêu đề cột **"Tồn khả dụng"**.
* **Kết quả mong đợi:**
  * Nhấp lần 1: Sắp xếp số lượng từ ít đến nhiều (sản phẩm hết hàng hoặc tồn ít nổi lên trên đầu). Cụm nút chuyển sang hiển thị **chỉ duy nhất mũi tên hướng lên (▲)** màu xanh đậm, ẩn mũi tên xuống.
  * Nhấp lần 2: Đảo chiều từ nhiều đến ít. Cụm nút chuyển sang hiển thị **chỉ duy nhất mũi tên hướng xuống (▼)** màu xanh đậm, ẩn mũi tên lên.

---

### TC-INV-08: Lọc nhanh các mặt hàng chạm hoặc dưới Ngưỡng an toàn
* **Tiền điều kiện:** Đang ở trang Tổng quan kho.
* **Các bước thực hiện:**
  1. Nhấp trực tiếp vào thẻ KPI **"Cảnh báo tồn kho thấp"** ở đầu trang.
* **Kết quả mong đợi:**
  * Bảng dữ liệu tự động kích hoạt bộ lọc trạng thái "Tồn kho thấp".
  * Toàn bộ các mã hàng hiển thị đều là những mặt hàng cần bổ sung tồn gấp.

---

### TC-INV-09: Xuất báo cáo kiểm soát tồn kho khả dụng ra Excel / CSV
* **Tiền điều kiện:** Đã chọn kho cần đối soát.
* **Các bước thực hiện:**
  1. Nhấp nút **"Xuất báo cáo tồn kho"**.
* **Kết quả mong đợi:**
  * Tải xuống tệp tin `.xlsx` chứa đầy đủ: Mã SKU, Tên sản phẩm, Điểm kho, Vị trí kệ, Tồn thực tế, Tồn cam kết, Tồn khả dụng, Đơn giá vốn, Thành tiền.
  * Font tiếng Việt hiển thị sắc nét, không lỗi bảng mã UTF-8.

---

## 3. Kịch bản Kiểm thử Chi tiết Trường Hợp Biên (Edge Cases & Negative Scenarios)

### TC-INV-10: Tồn thực tế nhỏ hơn Tồn cam kết (Hiện tượng âm tồn khả dụng)
* **Tiền điều kiện:** Có 1 sản phẩm bị hỏng vỡ khi lưu kho dẫn đến tồn thực tế giảm còn `3 chiếc`, nhưng đơn hàng cũ đã cam kết giữ `5 chiếc`.
* **Các bước thực hiện:**
  1. Tra cứu sản phẩm này trên bảng Tổng quan kho.
* **Kết quả mong đợi:**
  * Công thức tính toán: $3 - 5 = -2$ chiếc khả dụng.
  * Cột Tồn khả dụng hiển thị `-2 chiếc` kèm nhãn cảnh báo đỏ nhấp nháy hoặc viền nổi bật: *"Thiếu hụt cam kết giao hàng (-2)"*.
  * Hệ thống phát tín hiệu cảnh báo khẩn cấp để Trưởng kho tiến hành điều chuyển hàng bổ sung hoặc thông báo cho nhân viên điều phối xử lý kịp thời.

---

### TC-INV-11: Sản phẩm mới nhập kho chưa được phân bổ vị trí kệ lưu trữ
* **Tiền điều kiện:** Sản phẩm mới nhập từ xưởng về kho đang tập kết tại cửa xuất nhập, chưa kịp xếp lên giá kệ.
* **Các bước thực hiện:**
  1. Quan sát cột "Vị trí lưu kho" của sản phẩm này.
* **Kết quả mong đợi:**
  * Không để trống ô hoặc hiển thị chữ `null`.
  * Hiển thị nhãn cảnh báo màu vàng: *"Chưa gán kệ (Khu vực tiếp nhận)"*.
  * Cung cấp nút thao tác nhanh: *"Định vị kệ ngay"* để thủ kho nhấp vào và chọn kệ lưu trữ chỉ bằng 2 click chuột.
