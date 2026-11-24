# Bộ Test Case: Lệnh Xuất - Nhập Kho (Inventory Transactions)

* **Mã Phân hệ:** ADM-INV-TRANS
* **Tên Màn hình:** Lệnh Xuất - Nhập - Điều Chuyển Kho (Stock Transactions & Dispatch)
* **Đường dẫn (URL):** `/admin/inventory/transactions`
* **Tài liệu tham chiếu:** FRD - [ADM-Master] Product, Inventory & Customer Management (User Story US-06)
* **Đối tượng sử dụng:** Nhân viên Điều phối Kho, Thủ kho, Quản lý Vận hành, QC Tester
* **Môi trường áp dụng:** Local (`http://localhost:4200`) & Vercel Dev (`https://dcor-studio-dev.vercel.app`)

---

## 1. Ma trận Test Case Tổng hợp

| Mã Test Case | Tên Kịch bản Kiểm thử | Phân loại | Mức độ | Tiêu chí FRD |
| :--- | :--- | :--- | :--- | :--- |
| **TC-TRANS-01** | Kiểm tra hiển thị danh sách các lệnh kho và bộ lọc loại chứng từ | Chức năng (Functional) | P1 - Cao | Mục 1.2.1 |
| **TC-TRANS-02** | Tạo Lệnh xuất kho theo Mã đơn hàng bán lẻ (Happy Path) | Chức năng nghiệp vụ | P1 - Cao | Scenario 6.1 |
| **TC-TRANS-03** | Tạo Lệnh nhập kho thành phẩm từ Xưởng sản xuất | Chức năng thêm mới | P1 - Cao | Mục 1.2.1 |
| **TC-TRANS-04** | Tạo Lệnh xuất điều chuyển nội bộ giữa 2 Showroom | Chức năng nghiệp vụ | P1 - Cao | Mục 1.2.1 |
| **TC-TRANS-05** | Xác nhận hoàn tất Lệnh xuất kho và trừ tồn thực tế | Nghiệp vụ cốt lõi | P1 - Cao | Scenario 6.1 |
| **TC-TRANS-06** | Kiểm tra ràng buộc không cho phép xuất kho vượt quá tồn khả dụng | Ràng buộc an toàn | P1 - Cao | Mục 1.2.1 |
| **TC-TRANS-07** | In Phiếu xuất kho chuẩn khổ A4 bàn giao hàng hóa | Tiện ích (Print) | P1 - Cao | Scenario 6.2 |
| **TC-TRANS-08** | Sắp xếp danh sách lệnh theo cột dọc (▲ Tăng dần / ▼ Giảm dần) | Giao diện & Sắp xếp | P1 - Cao | Mục 1.2.1 |
| **TC-TRANS-09** | Hủy lệnh xuất/nhập kho ở trạng thái Chờ xử lý | Nghiệp vụ / An toàn | P2 - Trung bình | Mục 3.1.2 |
| **TC-TRANS-10** | Tìm kiếm lệnh kho theo Mã chứng từ và Mã đơn hàng | Tìm kiếm (Search) | P2 - Trung bình | Mục 1.2.1 |
| **TC-TRANS-11** | Lệnh điều chuyển nội bộ có Kho xuất và Kho nhận trùng nhau | Trường hợp biên (Validation) | P1 - Cao | Mục 1.2.1 |
| **TC-TRANS-12** | Nhấp xác nhận xuất kho liên tiếp 2 lần cùng 1 lúc (Chống trừ trùng) | Trường hợp biên (Idempotency) | P1 - Cao | Scenario 6.1 |

---

## 2. Kịch bản Kiểm thử Chi tiết (Happy Path & Chức Năng Cốt Lõi)

### TC-TRANS-01: Kiểm tra hiển thị danh sách các lệnh kho và bộ lọc loại chứng từ
* **Tiền điều kiện:** Người dùng truy cập trang `/admin/inventory/transactions`.
* **Các bước thực hiện:**
  1. Chờ trang nạp hoàn tất dữ liệu.
  2. Quan sát bảng danh sách lệnh kho.
  3. Lọc theo Loại chứng từ: **"Tất cả"**, **"Nhập kho"**, **"Xuất bán"**, **"Điều chuyển kho"**, **"Xuất hủy"**.
* **Kết quả mong đợi:**
  * Bảng hiển thị các cột: Mã chứng từ (PXK-xxxxx / PNK-xxxxx), Loại lệnh, Kho nguồn, Kho đích, Tham chiếu đơn hàng, Ngày tạo, Tổng số lượng, Trạng thái (Nháp, Đang xử lý, Hoàn tất, Đã hủy), Thao tác.
  * Bộ lọc phân loại chính xác các loại lệnh tương ứng.

---

### TC-TRANS-02: Tạo Lệnh xuất kho theo Mã đơn hàng bán lẻ (Happy Path)
* **Tiền điều kiện:** Có đơn hàng `ORD-99881` đã thanh toán và đang ở trạng thái sẵn sàng xuất giao.
* **Các bước thực hiện:**
  1. Nhấp nút **"Tạo lệnh xuất kho"**.
  2. Chọn loại lệnh: **"Xuất bán theo đơn hàng"**.
  3. Nhập mã đơn `ORD-99881` vào ô liên kết đơn hàng.
  4. Quan sát các trường dữ liệu tự động điền.
  5. Chọn Kho xuất: `Kho Showroom Quận 7`.
  6. Nhấp nút **"Lưu lệnh xuất"**.
* **Kết quả mong đợi:**
  * Hệ thống tự động trích xuất danh sách sản phẩm, số lượng và tên khách hàng từ đơn `ORD-99881`.
  * Lệnh xuất kho mới được khởi tạo ở trạng thái **"Chờ xuất kho"** (hoặc Đang xử lý).

---

### TC-TRANS-03: Tạo Lệnh nhập kho thành phẩm từ Xưởng sản xuất
* **Tiền điều kiện:** Xưởng sản xuất Tân Bình bàn giao 10 chiếc *Bàn Ăn Gỗ Me Tây*.
* **Các bước thực hiện:**
  1. Nhấp nút **"Tạo lệnh nhập kho"**.
  2. Chọn nguồn nhập: `Xưởng sản xuất DCOR Tân Bình`.
  3. Chọn Kho tiếp nhận: `Kho Tổng Bình Dương`.
  4. Thêm sản phẩm *Bàn Ăn Gỗ Me Tây*, nhập số lượng `10`, nhập đơn giá vốn sản xuất.
  5. Nhấp nút **"Lưu và xác nhận nhập kho"**.
* **Kết quả mong đợi:**
  * Lệnh nhập kho được lưu thành công.
  * Tồn thực tế của *Bàn Ăn Gỗ Me Tây* tại Kho Tổng Bình Dương lập tức tăng thêm 10 chiếc.
  * Trạng thái lệnh chuyển thành **"Đã hoàn tất"**.

---

### TC-TRANS-04: Tạo Lệnh xuất điều chuyển nội bộ giữa 2 Showroom
* **Tiền điều kiện:** Showroom Q2 cần mượn 2 bộ sofa từ Kho Tổng Bình Dương để trưng bày.
* **Các bước thực hiện:**
  1. Nhấp **"Tạo lệnh điều chuyển"**.
  2. Chọn Kho xuất: `Kho Tổng Bình Dương`.
  3. Chọn Kho nhận: `Kho Showroom Thảo Điền - Q2`.
  4. Chọn sản phẩm và nhập số lượng `2`.
  5. Nhấp nút **"Khởi tạo điều chuyển"**.
* **Kết quả mong đợi:**
  * Lệnh được tạo ở trạng thái **"Đang vận chuyển (In-transit)"**.
  * Hàng hóa rời khỏi kho xuất và chưa cộng vào kho nhận cho đến khi thủ kho Q2 bấm xác nhận nhận hàng.

---

### TC-TRANS-05: Xác nhận hoàn tất Lệnh xuất kho và trừ tồn thực tế
* **Tiền điều kiện:** Lệnh xuất kho đang ở trạng thái "Chờ xuất kho" với 2 sản phẩm nội thất.
* **Các bước thực hiện:**
  1. Thủ kho kiểm đếm xong hàng, mở chi tiết lệnh xuất.
  2. Nhấp nút **"Xác nhận xuất kho hoàn tất"**.
* **Kết quả mong đợi:**
  * Trạng thái lệnh đổi sang **"Đã hoàn tất"** (màu xanh lá cây).
  * Số tồn thực tế của 2 sản phẩm tương ứng tại kho xuất bị trừ đi chính xác 2 chiếc.
  * Tồn cam kết của đơn hàng được giải phóng.

---

### TC-TRANS-06: Kiểm tra ràng buộc không cho phép xuất kho vượt quá tồn khả dụng
* **Tiền điều kiện:** Mã sản phẩm chỉ còn tồn khả dụng `3 chiếc`.
* **Các bước thực hiện:**
  1. Tạo một lệnh xuất kho thủ công (hoặc xuất hủy).
  2. Nhập số lượng xuất là `5 chiếc`.
  3. Nhấp nút Lưu.
* **Kết quả mong đợi:**
  * Hệ thống chặn hành động và báo lỗi: *"Số lượng xuất (5) vượt quá số lượng tồn khả dụng trong kho (3). Vui lòng kiểm tra lại."*
  * Không cho phép xác nhận xuất âm kho.

---

### TC-TRANS-07: In Phiếu xuất kho chuẩn khổ A4 bàn giao hàng hóa
* **Tiền điều kiện:** Lệnh xuất kho đã được xác nhận hoàn tất.
* **Các bước thực hiện:**
  1. Nhấp nút **"In phiếu xuất kho"** (biểu tượng máy in).
* **Kết quả mong đợi:**
  * Mở cửa sổ xem trước bản in khổ giấy A4 chuẩn chỉnh.
  * Bản in có đầy đủ: Logo DCOR Studio, Tên phiếu "PHIẾU XUẤT KHO KIÊM BÀN GIAO", Mã chứng từ, Ngày tháng, Tên khách nhận, Địa chỉ giao hàng, Bảng liệt kê sản phẩm (STT, Mã, Tên, ĐVT, Số lượng), và 3 ô chữ ký: **Người lập phiếu**, **Thủ kho xuất**, **Người nhận hàng**.

---

### TC-TRANS-08: Sắp xếp danh sách lệnh theo cột dọc (▲ Tăng dần / ▼ Giảm dần)
* **Tiền điều kiện:** Đang ở bảng danh sách lệnh kho.
* **Các bước thực hiện:**
  1. Nhấp chuột lần 1 vào tiêu đề cột **"Ngày tạo"**.
  2. Nhấp chuột lần 2 vào tiêu đề cột **"Ngày tạo"**.
* **Kết quả mong đợi:**
  * Nhấp lần 1: Sắp xếp từ cũ nhất đến mới nhất. Cụm nút chuyển sang hiển thị **chỉ duy nhất mũi tên hướng lên (▲)** màu xanh đậm, ẩn mũi tên xuống.
  * Nhấp lần 2: Đảo chiều từ mới nhất đến cũ nhất. Cụm nút chuyển sang hiển thị **chỉ duy nhất mũi tên hướng xuống (▼)** màu xanh đậm, ẩn mũi tên lên.

---

### TC-TRANS-09: Hủy lệnh xuất/nhập kho ở trạng thái Chờ xử lý
* **Tiền điều kiện:** Lệnh kho đang ở trạng thái "Nháp" hoặc "Chờ xử lý".
* **Các bước thực hiện:**
  1. Nhấp nút **"Hủy lệnh"**.
  2. Nhập lý do hủy (ví dụ: *Khách hủy đơn hàng*) và bấm Xác nhận.
* **Kết quả mong đợi:**
  * Trạng thái lệnh chuyển thành **"Đã hủy"**.
  * Hàng hóa đã cam kết giữ chỗ được giải phóng quay trở lại Tồn khả dụng.

---

### TC-TRANS-10: Tìm kiếm lệnh kho theo Mã chứng từ và Mã đơn hàng
* **Tiền điều kiện:** Có nhiều chứng từ trong danh sách.
* **Các bước thực hiện:**
  1. Nhập mã phiếu `PXK-2026-042` vào ô tìm kiếm.
  2. Xóa và nhập mã đơn hàng `ORD-99881`.
* **Kết quả mong đợi:**
  * Bảng lập tức hiển thị chính xác chứng từ có mã khớp với từ khóa tìm kiếm.

---

## 3. Kịch bản Kiểm thử Chi tiết Trường Hợp Biên (Edge Cases & Negative Scenarios)

### TC-TRANS-11: Lệnh điều chuyển nội bộ có Kho xuất và Kho nhận trùng nhau
* **Tiền điều kiện:** Đang tạo lệnh điều chuyển nội bộ.
* **Các bước thực hiện:**
  1. Chọn Kho xuất: `Kho Tổng Bình Dương`.
  2. Chọn Kho nhận: `Kho Tổng Bình Dương` (trùng lặp).
  3. Nhấp nút Tiếp tục.
* **Kết quả mong đợi:**
  * Hệ thống chặn và hiển thị lỗi viền đỏ: *"Kho tiếp nhận không được trùng với Kho xuất hàng. Vui lòng chọn điểm kho khác."*
  * Danh sách kho nhận tự động loại bỏ kho xuất đã chọn.

---

### TC-TRANS-12: Nhấp xác nhận xuất kho liên tiếp 2 lần cùng 1 lúc (Chống trừ trùng)
* **Tiền điều kiện:** Lệnh xuất kho đang ở trạng thái Chờ xuất kho với số lượng `2 chiếc`.
* **Các bước thực hiện:**
  1. Người dùng double-click thật nhanh vào nút "Xác nhận xuất kho" hoặc mở 2 tab cùng thực hiện submit.
* **Kết quả mong đợi:**
  * Hệ thống khóa nút ngay cú click đầu tiên (Loading state & Disable button).
  * Backend áp dụng cơ chế khóa phân tán / Idempotency key.
  * **Chỉ duy nhất 1 lần trừ tồn được thực hiện** (trừ đúng 2 chiếc, không bao giờ bị trừ thành 4 chiếc).
