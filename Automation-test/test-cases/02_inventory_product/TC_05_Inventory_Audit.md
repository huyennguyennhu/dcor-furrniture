# Bộ Test Case: Kiểm Kê Kho & Cân Bằng Tồn (Inventory Audit)

* **Mã Phân hệ:** ADM-INV-AUDIT
* **Tên Màn hình:** Kiểm kê Kho & Cân bằng Tồn (Stock Audit & Reconciliation)
* **Đường dẫn (URL):** `/admin/inventory/audit`
* **Tài liệu tham chiếu:** FRD - [ADM-Master] Product, Inventory & Customer Management (User Story US-05)
* **Đối tượng sử dụng:** Quản lý Kho, Thủ kho, Kế toán Kiểm toán, QC Tester
* **Môi trường áp dụng:** Local (`http://localhost:4200`) & Vercel Dev (`https://dcor-studio-dev.vercel.app`)

---

## 1. Ma trận Test Case Tổng hợp

| Mã Test Case | Tên Kịch bản Kiểm thử | Phân loại | Mức độ | Tiêu chí FRD |
| :--- | :--- | :--- | :--- | :--- |
| **TC-AUDIT-01** | Kiểm tra hiển thị danh sách các đợt kiểm kê và bộ lọc trạng thái | Chức năng (Functional) | P1 - Cao | Mục 1.2.1 |
| **TC-AUDIT-02** | Khởi tạo Đợt kiểm kê mới theo Phạm vi (Toàn bộ kho / Danh mục) | Chức năng thêm mới | P1 - Cao | Mục 1.2.1 |
| **TC-AUDIT-03** | Nhập kết quả kiểm đếm và tính toán chênh lệch số lượng tự động | Logic / Tính toán | P1 - Cao | Scenario 5.1 |
| **TC-AUDIT-04** | Tính toán tự động Giá trị chênh lệch tài chính theo đơn giá vốn | Logic / Tính toán | P1 - Cao | Scenario 5.1 |
| **TC-AUDIT-05** | Bắt buộc chọn Lý do chênh lệch đối với các mã bị lệch thừa/thiếu | Ràng buộc nghiệp vụ | P1 - Cao | Scenario 5.1 |
| **TC-AUDIT-06** | Phê duyệt Cân bằng kho và cập nhật số tồn thực tế (Happy Path) | Nghiệp vụ cốt lõi | P1 - Cao | Scenario 5.2 |
| **TC-AUDIT-07** | Kiểm tra tự động phát sinh bút toán điều chỉnh vào Sổ cái biến động | Tích hợp liên phân hệ | P1 - Cao | Scenario 5.2 |
| **TC-AUDIT-08** | Phân quyền: Ngăn chặn Thủ kho tự ý phê duyệt Cân bằng kho | Bảo mật / RBAC | P1 - Cao | Mục 3.1.1 |
| **TC-AUDIT-09** | Hủy bỏ đợt kiểm kê đang thực hiện có cảnh báo an toàn | Nghiệp vụ / An toàn | P2 - Trung bình | Mục 3.1.2 |
| **TC-AUDIT-10** | Xuất Biên bản kiểm kê kho ra tệp bảng tính / PDF in ấn | Tiện ích (Export) | P2 - Trung bình | Mục 1.2.1 |
| **TC-AUDIT-11** | Nhập số lượng thực đếm là số âm hoặc số thập phân lẻ (-5, 2.5) | Trường hợp biên (Validation) | P1 - Cao | Scenario 5.1 |
| **TC-AUDIT-12** | Khởi tạo trùng lặp 2 đợt kiểm kê tại cùng 1 điểm kho cùng thời điểm | Trường hợp biên (Conflict Lock) | P1 - Cao | Mục 1.2.1 |

---

## 2. Kịch bản Kiểm thử Chi tiết (Happy Path & Chức Năng Cốt Lõi)

### TC-AUDIT-01: Kiểm tra hiển thị danh sách các đợt kiểm kê và bộ lọc trạng thái
* **Tiền điều kiện:** Người dùng truy cập trang Kiểm kê kho `/admin/inventory/audit`.
* **Các bước thực hiện:**
  1. Chờ trang nạp hoàn tất dữ liệu.
  2. Quan sát bảng danh sách các đợt kiểm kê.
  3. Lọc theo trạng thái: **"Đang kiểm đếm"**, **"Chờ duyệt cân bằng"**, **"Đã hoàn tất"**, **"Đã hủy"**.
* **Kết quả mong đợi:**
  * Bảng hiển thị các cột: Mã phiếu kiểm kê (PKK-xxxxx), Tên đợt kiểm kê, Kho kiểm kê, Ngày tạo, Người phụ trách, Tổng số mặt hàng, Trạng thái (Badge màu), Thao tác.
  * Bộ lọc lọc đúng các đợt kiểm kê theo từng trạng thái tương ứng.

---

### TC-AUDIT-02: Khởi tạo Đợt kiểm kê mới theo Phạm vi
* **Tiền điều kiện:** Đang ở trang Kiểm kê kho.
* **Các bước thực hiện:**
  1. Nhấp nút **"Tạo phiếu kiểm kê mới"**.
  2. Nhập Tên đợt kiểm kê: `Kiểm kê định kỳ Showroom Q7 - Quý 4/2026`.
  3. Chọn Điểm kho: `Kho Showroom Quận 7`.
  4. Chọn Phạm vi: `Theo nhóm danh mục: Sofa & Bàn Trà`.
  5. Chọn Người phụ trách và Ngày kiểm đếm.
  6. Nhấp nút **"Bắt đầu kiểm kê"**.
* **Kết quả mong đợi:**
  * Phiếu kiểm kê mới được tạo với mã tự động sinh (ví dụ: `PKK-2026-008`).
  * Trạng thái phiếu là **"Đang kiểm đếm"**.
  * Hệ thống tự động nạp toàn bộ danh sách các sản phẩm thuộc danh mục Sofa & Bàn Trà tại Kho Showroom Q7 kèm số tồn sổ sách hiện tại.

---

### TC-AUDIT-03: Nhập kết quả kiểm đếm và tính toán chênh lệch số lượng tự động
* **Tiền điều kiện:** Đang mở màn hình nhập liệu kiểm đếm của phiếu kiểm kê.
* **Các bước thực hiện:**
  1. Tìm dòng sản phẩm *Bàn Trà Gỗ Sồi* (Sổ sách hệ thống ghi nhận: `10 chiếc`).
  2. Nhập vào ô "Số lượng đếm thực tế": `8`.
  3. Tìm dòng sản phẩm *Đôn Sofa Nỉ* (Sổ sách hệ thống ghi nhận: `5 chiếc`).
  4. Nhập vào ô "Số lượng đếm thực tế": `6`.
* **Kết quả mong đợi:**
  * Với *Bàn Trà Gỗ Sồi*: Cột Chênh lệch tự động tính và hiển thị ngay lập tức `-2 chiếc` (Màu đỏ cảnh báo thiếu hàng).
  * Với *Đôn Sofa Nỉ*: Cột Chênh lệch tự động tính và hiển thị `+1 chiếc` (Màu xanh dương thừa hàng).
  * Với các mặt hàng đếm thực tế bằng sổ sách: Hiển thị `0` (Màu xanh lá cây khớp hàng).

---

### TC-AUDIT-04: Tính toán tự động Giá trị chênh lệch tài chính theo đơn giá vốn
* **Tiền điều kiện:** Sản phẩm *Bàn Trà Gỗ Sồi* có đơn giá vốn là `3.000.000 ₫/chiếc`, số lượng lệch là `-2`.
* **Các bước thực hiện:**
  1. Quan sát cột "Giá trị chênh lệch" của dòng sản phẩm này.
* **Kết quả mong đợi:**
  * Cột Giá trị chênh lệch tự động hiển thị: `-6.000.000 ₫` (Âm 6 triệu VNĐ).
  * Thẻ tổng kết ở chân bảng cộng dồn chính xác Tổng giá trị chênh lệch của toàn bộ đợt kiểm kê.

---

### TC-AUDIT-05: Bắt buộc chọn Lý do chênh lệch đối với các mã bị lệch thừa/thiếu
* **Tiền điều kiện:** Có sản phẩm bị lệch số lượng `-2`.
* **Các bước thực hiện:**
  1. Để trống ô "Lý do chênh lệch" của sản phẩm này.
  2. Nhấp nút **"Gửi duyệt cân bằng"**.
* **Kết quả mong đợi:**
  * Hệ thống chặn không cho gửi duyệt và đánh dấu đỏ ô Lý do: *"Vui lòng chọn hoặc nhập nguyên nhân chênh lệch cho sản phẩm này"*.
  * Khi chọn lý do: *"Hàng mẫu trầy xước chuyển phế phẩm"*, cảnh báo lỗi biến mất và nút gửi duyệt hoạt động bình thường.

---

### TC-AUDIT-06: Phê duyệt Cân bằng kho và cập nhật số tồn thực tế (Happy Path)
* **Tiền điều kiện:** Người dùng đăng nhập bằng tài khoản Quản lý Kho, phiếu kiểm kê đang ở trạng thái "Chờ duyệt cân bằng".
* **Các bước thực hiện:**
  1. Mở phiếu kiểm kê cần duyệt.
  2. Rà soát danh sách chênh lệch.
  3. Nhấp nút **"Cân bằng kho"** và chọn **"Xác nhận duyệt"** tại hộp thoại xác nhận.
* **Kết quả mong đợi:**
  * Hệ thống thông báo: *"Cân bằng kho thành công"*.
  * Trạng thái phiếu kiểm kê chuyển sang **"Đã hoàn tất"** (màu xanh lá cây).
  * Số tồn thực tế của *Bàn Trà Gỗ Sồi* tại Kho Showroom Q7 được điều chỉnh từ `10 chiếc` về đúng `8 chiếc`.
  * Các ô nhập số lượng bị khóa, không cho phép chỉnh sửa nữa.

---

### TC-AUDIT-07: Kiểm tra tự động phát sinh bút toán điều chỉnh vào Sổ cái biến động
* **Tiền điều kiện:** Vừa phê duyệt Cân bằng kho cho phiếu `PKK-2026-008`.
* **Các bước thực hiện:**
  1. Điều hướng sang màn hình Lịch sử biến động kho `/admin/inventory/history`.
  2. Tìm kiếm theo mã chứng từ `PKK-2026-008`.
* **Kết quả mong đợi:**
  * Xuất hiện ngay bút toán biến động tương ứng:
    * Loại biến động: **"Cân bằng kiểm kê"**.
    * Sản phẩm: *Bàn Trà Gỗ Sồi*.
    * Số lượng biến động: `-2`.
    * Tồn trước: `10`, Tồn sau: `8`.
    * Mã chứng từ liên kết: `PKK-2026-008`.

---

### TC-AUDIT-08: Phân quyền - Ngăn chặn Thủ kho tự ý phê duyệt Cân bằng kho
* **Tiền điều kiện:** Đăng nhập bằng tài khoản Thủ kho (chỉ có quyền kiểm đếm).
* **Các bước thực hiện:**
  1. Truy cập phiếu kiểm kê ở trạng thái "Chờ duyệt cân bằng".
  2. Quan sát các nút hành động.
* **Kết quả mong đợi:**
  * Nút "Cân bằng kho" bị ẩn hoàn toàn hoặc bị vô hiệu hóa (disabled), hiển thị chú thích: *"Chỉ Quản lý kho mới có quyền phê duyệt cân bằng"*.

---

### TC-AUDIT-09: Hủy bỏ đợt kiểm kê đang thực hiện có cảnh báo an toàn
* **Tiền điều kiện:** Phiếu kiểm kê đang ở trạng thái "Đang kiểm đếm".
* **Các bước thực hiện:**
  1. Nhấp nút **"Hủy đợt kiểm kê"**.
  2. Nhập lý do hủy (ví dụ: *Tạo nhầm kho kiểm kê*) và bấm Xác nhận.
* **Kết quả mong đợi:**
  * Trạng thái phiếu chuyển sang **"Đã hủy"**.
  * Toàn bộ số tồn kho trên hệ thống được giữ nguyên vẹn, không có bất kỳ sự thay đổi nào.

---

### TC-AUDIT-10: Xuất Biên bản kiểm kê kho ra tệp bảng tính / PDF in ấn
* **Tiền điều kiện:** Phiếu kiểm kê đã hoàn tất hoặc đang kiểm đếm.
* **Các bước thực hiện:**
  1. Nhấp nút **"In biên bản"** hoặc **"Xuất Excel"**.
* **Kết quả mong đợi:**
  * Tạo tệp biên bản kiểm kê chuẩn gồm: Quốc hiệu tiêu ngữ, Tên biên bản, Thành phần ban kiểm kê, Bảng kê chi tiết (Tồn sổ, Thực đếm, Chênh lệch, Lý do), Chữ ký của Thủ kho, Kế toán và Trưởng kho.

---

## 3. Kịch bản Kiểm thử Chi tiết Trường Hợp Biên (Edge Cases & Negative Scenarios)

### TC-AUDIT-11: Nhập số lượng thực đếm là số âm hoặc số thập phân lẻ
* **Tiền điều kiện:** Đang ở ô nhập số lượng đếm thực tế của 1 sản phẩm nội thất (đơn vị tính: chiếc).
* **Các bước thực hiện:**
  1. Nhập số âm: `-4`.
  2. Nhập số thập phân: `2.5`.
* **Kết quả mong đợi:**
  * Hệ thống chặn không cho nhập số âm: *"Số lượng đếm thực tế không được là số âm"*.
  * Sản phẩm nội thất nguyên chiếc không cho phép nhập số lẻ: *"Số lượng phải là số nguyên dương $\ge 0$"*.

---

### TC-AUDIT-12: Khởi tạo trùng lặp 2 đợt kiểm kê tại cùng 1 điểm kho cùng thời điểm
* **Tiền điều kiện:** Kho Showroom Q7 đang có phiếu `PKK-2026-008` ở trạng thái "Đang kiểm đếm".
* **Các bước thực hiện:**
  1. Một nhân viên khác tạo thêm một phiếu kiểm kê mới cũng chọn `Kho Showroom Q7` và phạm vi Toàn bộ kho.
  2. Nhấp nút Lưu.
* **Kết quả mong đợi:**
  * Hệ thống áp dụng cơ chế khóa kiểm kê (Audit Lock) và cảnh báo: *"Kho Showroom Q7 đang có một đợt kiểm kê chưa hoàn tất (PKK-2026-008). Vui lòng hoàn tất hoặc hủy đợt kiểm kê hiện tại trước khi tạo đợt mới để tránh xung đột số liệu tồn."*
