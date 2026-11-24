# Bộ Test Case: Báo Cáo Khách Hàng & Hội Viên (Customers Report)

* **Mã Phân hệ:** ADM-11-CUST
* **Tên Màn hình:** Báo cáo Khách hàng & Hội viên (Customer Growth & Retention Report)
* **Đường dẫn (URL):** `/admin/reports/customers`
* **Tài liệu tham chiếu:** FRD - [ADM-11] Admin Reports & Dashboard (User Story US-05)
* **Đối tượng sử dụng:** Giám đốc Trải nghiệm Khách hàng (CXM), Quản lý Showroom, CSKH, QC Tester
* **Môi trường áp dụng:** Local (`http://localhost:4200`) & Vercel Dev (`https://dcor-studio-dev.vercel.app`)

---

## 1. Ma trận Test Case Tổng hợp

| Mã Test Case | Tên Kịch bản Kiểm thử | Phân loại | Mức độ | Tiêu chí FRD |
| :--- | :--- | :--- | :--- | :--- |
| **TC-CUST-01** | Kiểm tra hiển thị các thẻ KPI tăng trưởng & giá trị khách hàng | Chức năng (Functional) | P1 - Cao | Mục 1.2.1 |
| **TC-CUST-02** | Điều hướng từ Thẻ KPI "Khách hàng mới" sang danh sách Khách hàng | Điều hướng chuyên sâu | P1 - Cao | Scenario 5.1 |
| **TC-CUST-03** | Điều hướng từ Thẻ KPI "Doanh thu nhóm VIP" sang danh sách VIP | Điều hướng chuyên sâu | P1 - Cao | Scenario 5.1 |
| **TC-CUST-04** | Bảng Top khách hàng chi tiêu cao: Nhấp vào tên khách hàng | Điều hướng chuyên sâu | P1 - Cao | Scenario 5.2 |
| **TC-CUST-05** | Bảng Top khách hàng chi tiêu cao: Nhấp vào số lượng đơn hàng | Điều hướng chuyên sâu | P1 - Cao | Scenario 5.2 |
| **TC-CUST-06** | Bảng Top khách hàng mua nhiều đơn nhất: Nhấp vào tên & số đơn | Điều hướng chuyên sâu | P1 - Cao | Scenario 5.2 |
| **TC-CUST-07** | Kiểm tra Ma trận nhiệt (Heatmap) Mật độ lịch hẹn tại Showroom | Chức năng / Hiển thị | P1 - Cao | Mục 1.2.1 |
| **TC-CUST-08** | Kiểm tra Biểu đồ tròn cơ cấu Phân tầng Hội viên (Tier Distribution) | Giao diện & Đồ họa | P2 - Trung bình | Mục 1.2.1 |
| **TC-CUST-09** | Xuất báo cáo danh sách khách hàng thân thiết ra Excel / CSV | Tiện ích (Export) | P2 - Trung bình | Mục 1.2.1 |
| **TC-CUST-10** | Ma trận nhiệt (Heatmap) khi toàn bộ các khung giờ đều có 0 lượt hẹn | Trường hợp biên (Edge Case) | P2 - Trung bình | Mục 1.2.1 |
| **TC-CUST-11** | Tính Tỷ lệ mua lặp lại (Repeat Rate) khi Tổng số khách hàng bằng 0 | Trường hợp biên (Edge Case) | P2 - Trung bình | Mục 1.2.1 |
| **TC-CUST-12** | Khách hàng có 2 số điện thoại hoặc tên chứa khoảng trắng thừa (Leading/Trailing spaces) | Trường hợp biên (Dữ liệu) | P2 - Trung bình | Scenario 5.2 |

---

## 2. Kịch bản Kiểm thử Chi tiết (Happy Path & Chức Năng Cốt Lõi)

### TC-CUST-01: Kiểm tra hiển thị các thẻ KPI tăng trưởng & giá trị khách hàng
* **Tiền điều kiện:** Người dùng đăng nhập hệ thống và vào trang Báo cáo Khách hàng `/admin/reports/customers`.
* **Các bước thực hiện:**
  1. Chờ dữ liệu tải xong.
  2. Quan sát hàng thẻ chỉ số phía trên.
* **Kết quả mong đợi:**
  * Hiển thị đủ 4 thẻ:
    1. **Tổng khách hàng hệ thống:** Số lượng tài khoản và hồ sơ khách hàng.
    2. **Khách hàng mới trong kỳ:** Số lượng khách đăng ký hoặc phát sinh đơn đầu tiên.
    3. **Tỷ lệ mua hàng lặp lại (Repeat Purchase Rate):** Tỷ lệ phần trăm khách có từ 2 đơn trở lên.
    4. **Doanh thu nhóm Hội viên VIP:** Tổng tiền đóng góp từ các hạng Vàng, Bạch Kim, Kim Cương.

---

### TC-CUST-02: Điều hướng từ Thẻ KPI "Khách hàng mới" sang danh sách Khách hàng
* **Tiền điều kiện:** Thẻ KPI "Khách hàng mới" đang hiển thị trên màn hình.
* **Các bước thực hiện:**
  1. Nhấp chuột trực tiếp vào thẻ KPI **"Khách hàng mới"** (hoặc nút liên kết trên thẻ).
* **Kết quả mong đợi:**
  * Hệ thống chuyển hướng sang trang Quản lý khách hàng `/admin/customers`.
  * Bộ lọc nhóm khách hàng tự động chọn **"Khách mới"** (hoặc tham số `filter=new`).
  * Danh sách được tự động sắp xếp theo ngày đăng ký mới nhất lên trên đầu.

---

### TC-CUST-03: Điều hướng từ Thẻ KPI "Doanh thu nhóm VIP" sang danh sách VIP
* **Tiền điều kiện:** Thẻ KPI "Doanh thu nhóm VIP" đang hiển thị.
* **Các bước thực hiện:**
  1. Nhấp chuột vào thẻ KPI **"Doanh thu nhóm VIP"**.
* **Kết quả mong đợi:**
  * Hệ thống điều hướng sang trang Quản lý khách hàng `/admin/customers`.
  * Bộ lọc phân hạng hội viên tự động chọn các hạng **VIP (Vàng / Kim Cương)** (tham số `group=vip`).
  * Danh sách khách hàng chỉ hiển thị các tài khoản VIP kèm tổng chi tiêu lũy kế.

---

### TC-CUST-04: Bảng Top khách hàng chi tiêu cao - Nhấp vào tên khách hàng
* **Tiền điều kiện:** Bảng "Top khách hàng chi tiêu cao nhất" đang hiển thị danh sách khách hàng chi tiêu lớn (ví dụ: dòng đầu là khách hàng *Trần Thị Mai*).
* **Các bước thực hiện:**
  1. Nhấp chuột vào dòng chữ tên khách hàng *Trần Thị Mai*.
* **Kết quả mong đợi:**
  * Hệ thống mở màn hình Chi tiết khách hàng (hoặc cửa sổ Modal hồ sơ) với mã định danh của khách hàng đó.
  * Hiển thị lịch sử mua hàng, địa chỉ Showroom thường ghé, tổng tích lũy điểm thưởng.

---

### TC-CUST-05: Bảng Top khách hàng chi tiêu cao - Nhấp vào số lượng đơn hàng
* **Tiền điều kiện:** Bảng Top chi tiêu hiển thị cột "Số đơn" có kèm huy hiệu (ví dụ: `8 đơn`).
* **Các bước thực hiện:**
  1. Nhấp chuột vào huy hiệu số đơn `8 đơn` của khách hàng *Trần Thị Mai*.
* **Kết quả mong đợi:**
  * Hệ thống chuyển hướng sang trang Quản lý đơn hàng `/admin/orders`.
  * Ô tìm kiếm hoặc tham số URL được tự động điền số điện thoại hoặc tên khách hàng: `phone=090xxxxxxx`.
  * Danh sách kết quả chỉ hiển thị chính xác 8 đơn hàng do khách này đã đặt mua.

---

### TC-CUST-06: Bảng Top khách hàng mua nhiều đơn nhất - Nhấp vào tên & số đơn
* **Tiền điều kiện:** Quan sát bảng "Top khách hàng có tần suất mua lớn nhất" kế bên.
* **Các bước thực hiện:**
  1. Nhấp chuột vào tên khách hàng đứng đầu danh sách mua nhiều đơn nhất.
  2. Quay lại trang báo cáo, nhấp chuột vào huy hiệu số lượng đơn của khách đó.
* **Kết quả mong đợi:**
  * Khi nhấp tên: Chuyển hướng chính xác đến hồ sơ chi tiết khách hàng.
  * Khi nhấp số đơn: Chuyển hướng sang danh sách đơn hàng đã lọc tự động theo khách hàng đó.

---

### TC-CUST-07: Kiểm tra Ma trận nhiệt (Heatmap) Mật độ lịch hẹn tại Showroom
* **Tiền điều kiện:** Khối "Ma trận nhiệt Mật độ khách đặt lịch hẹn trải nghiệm" đang hiển thị.
* **Các bước thực hiện:**
  1. Quan sát trục ngày trong tuần (Thứ 2 đến Chủ nhật) và trục các khung giờ (Sáng: 9h-12h, Chiều: 14h-17h, Tối: 18h-21h).
  2. Rà chuột qua các ô có màu cam/nâu đậm (khung giờ cao điểm).
* **Kết quả mong đợi:**
  * Tooltip hiển thị số lượng khách hẹn (ví dụ: `18 lượt hẹn - Chiều Thứ 7`).
  * Ô có mật độ hẹn càng đông thì màu nền càng đậm, ô không có lịch hẹn hiển thị màu nhạt hoặc `0`.
  * Giúp Showroom bố trí đủ nhân viên tư vấn vào các khung giờ cao điểm.

---

### TC-CUST-08: Kiểm tra Biểu đồ tròn cơ cấu Phân tầng Hội viên
* **Tiền điều kiện:** Biểu đồ tròn tỷ lệ hội viên (Đồng, Bạc, Vàng, Kim Cương) hiển thị.
* **Các bước thực hiện:**
  1. Rà chuột qua từng phân khúc hội viên trên biểu đồ.
* **Kết quả mong đợi:**
  * Hiển thị số lượng hội viên và tỷ lệ phần trăm tương ứng với từng hạng.
  * Màu sắc của từng hạng thể hiện trực quan (Đồng: nâu đồng, Bạc: xám bạc, Vàng: vàng kim, Kim Cương: xanh ngọc/tím).

---

### TC-CUST-09: Xuất báo cáo danh sách khách hàng thân thiết ra Excel / CSV
* **Tiền điều kiện:** Đang xem báo cáo khách hàng.
* **Các bước thực hiện:**
  1. Nhấp chuột vào nút **"Xuất danh sách"** ở đầu bảng.
* **Kết quả mong đợi:**
  * Trình duyệt tải xuống tệp tin chứa thông tin: Tên khách hàng, Số điện thoại, Email, Hạng hội viên, Tổng số đơn, Tổng chi tiêu trọn đời (CLV), Ngày mua gần nhất.
  * Tệp định dạng chuẩn, không bị lỗi font tiếng Việt.

---

## 3. Kịch bản Kiểm thử Chi tiết Trường Hợp Biên (Edge Cases & Negative Scenarios)

### TC-CUST-10: Ma trận nhiệt (Heatmap) khi toàn bộ các khung giờ đều có 0 lượt hẹn
* **Tiền điều kiện:** Trong tuần nghỉ lễ Tết Nguyên Đán, Showroom tạm đóng cửa không tiếp nhận lịch hẹn (tất cả 21 ô ma trận đều = 0).
* **Các bước thực hiện:**
  1. Lọc báo cáo vào tuần nghỉ lễ này.
  2. Quan sát ma trận nhiệt.
* **Kết quả mong đợi:**
  * Toàn bộ 21 ô hiển thị màu xám nhạt đồng nhất với giá trị `0`.
  * Không ô nào bị bôi màu cam/nâu bất thường.
  * Xuất hiện thông báo: *"Không có lượt hẹn nào được ghi nhận trong tuần này"*.

---

### TC-CUST-11: Tính Tỷ lệ mua lặp lại (Repeat Rate) khi Tổng số khách hàng bằng 0
* **Tiền điều kiện:** Mới mở một Showroom ở tỉnh mới chưa có khách hàng nào đăng ký hay mua sắm (Tổng khách = 0).
* **Các bước thực hiện:**
  1. Lọc báo cáo theo Showroom mới này.
  2. Quan sát thẻ "Tỷ lệ mua hàng lặp lại".
* **Kết quả mong đợi:**
  * Hệ thống xử lý phép tính $\frac{0}{0}$ an toàn.
  * Hiển thị tỷ lệ `0%`, không hiển thị `NaN%`.

---

### TC-CUST-12: Khách hàng có tên chứa khoảng trắng thừa (Leading/Trailing spaces)
* **Tiền điều kiện:** Khách hàng đăng ký tên có khoảng trắng thừa: `"   Nguyễn   Văn   Bình   "`.
* **Các bước thực hiện:**
  1. Quan sát cách hiển thị tên khách hàng này trong bảng Top khách hàng.
* **Kết quả mong đợi:**
  * Hệ thống tự động cắt tỉa (Trim) khoảng trắng thừa ở đầu, cuối và giữa các từ.
  * Hiển thị chuẩn xác: `Nguyễn Văn Bình`.
  * Khi nhấp vào liên kết sang trang đơn hàng, tham số URL được mã hóa chuẩn (`phone=...` hoặc `customer=Nguyen+Van+Binh`), không làm hỏng URL.
