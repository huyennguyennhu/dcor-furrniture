# Bộ Test Case: Báo Cáo Vận Hành Đơn Hàng (Orders Report)

* **Mã Phân hệ:** ADM-11-ORD
* **Tên Màn hình:** Báo cáo Vận hành Đơn hàng & Logistics (Order Operations Report)
* **Đường dẫn (URL):** `/admin/reports/orders`
* **Tài liệu tham chiếu:** FRD - [ADM-11] Admin Reports & Dashboard (User Story US-03)
* **Đối tượng sử dụng:** Trưởng phòng Vận hành Logistics, Quản lý Kho, Đội điều phối, QC Tester
* **Môi trường áp dụng:** Local (`http://localhost:4200`) & Vercel Dev (`https://dcor-studio-dev.vercel.app`)

---

## 1. Ma trận Test Case Tổng hợp

| Mã Test Case | Tên Kịch bản Kiểm thử | Phân loại | Mức độ | Tiêu chí FRD |
| :--- | :--- | :--- | :--- | :--- |
| **TC-ORD-01** | Kiểm tra hiển thị các thẻ KPI vận hành & logistics cốt lõi | Chức năng (Functional) | P1 - Cao | Mục 1.2.1 |
| **TC-ORD-02** | Điều hướng từ Thẻ KPI "Tỷ lệ hủy đơn" sang danh sách đơn hủy | Điều hướng chuyên sâu | P1 - Cao | Scenario 3.2 |
| **TC-ORD-03** | Điều hướng từ Thẻ KPI "Đổi trả & Giao lại" sang trang Đổi trả | Điều hướng chuyên sâu | P1 - Cao | Scenario 3.2 |
| **TC-ORD-04** | Nhấp tương tác các bước trong Thác nước vòng đời đơn hàng | Điều hướng chuyên sâu | P1 - Cao | Scenario 3.1 |
| **TC-ORD-05** | Điều hướng Nút "Chi tiết đơn hàng" kèm bộ lọc kết hợp đa chiều | Điều hướng chuyên sâu | P1 - Cao | Scenario 3.3 |
| **TC-ORD-06** | Kiểm tra bảng Đánh giá hiệu suất các Đối tác giao vận | Chức năng / Hiển thị | P2 - Trung bình | Mục 1.2.1 |
| **TC-ORD-07** | Lọc báo cáo đơn hàng theo khoảng thời gian và Showroom | Bộ lọc (Filter) | P1 - Cao | Mục 1.2.1 |
| **TC-ORD-08** | Kiểm tra hiển thị thời gian giao hàng trung bình (Lead Time) | Logic / Hiển thị | P2 - Trung bình | Mục 1.2.1 |
| **TC-ORD-09** | Thác nước vòng đời khi 100% đơn hàng dồn vào 1 trạng thái duy nhất | Trường hợp biên (Edge Case) | P2 - Trung bình | Scenario 3.1 |
| **TC-ORD-10** | Tỷ lệ hủy đơn đạt 100% (khi chỉ có 1 đơn phát sinh và bị hủy) | Trường hợp biên (Edge Case) | P2 - Trung bình | Scenario 3.2 |
| **TC-ORD-11** | Đối tác giao vận mới kết nối chưa có lịch sử đơn giao | Trường hợp biên (Edge Case) | P3 - Thấp | Mục 1.2.1 |
| **TC-ORD-12** | Điều hướng mang theo tham số Showroom hoặc Trạng thái không hợp lệ | Trường hợp biên (Edge Case) | P2 - Trung bình | Scenario 3.3 |

---

## 2. Kịch bản Kiểm thử Chi tiết (Happy Path & Chức Năng Cốt Lõi)

### TC-ORD-01: Kiểm tra hiển thị các thẻ KPI vận hành & logistics cốt lõi
* **Tiền điều kiện:** Người dùng truy cập trang Báo cáo Đơn hàng `/admin/reports/orders`.
* **Các bước thực hiện:**
  1. Chờ dữ liệu trang nạp hoàn tất.
  2. Quan sát 4 thẻ KPI vận hành đầu trang.
* **Kết quả mong đợi:**
  * Hiển thị đầy đủ 4 thẻ:
    1. **Tổng đơn hàng:** Số lượng đơn phát sinh trong chu kỳ.
    2. **Tỷ lệ giao hàng thành công:** Tỷ lệ phần trăm đơn hoàn tất trên tổng số đơn cần giao.
    3. **Tỷ lệ hủy đơn:** Tỷ lệ phần trăm đơn bị hủy và số lượng đơn hủy cụ thể.
    4. **Đổi trả & Giao lại:** Số ca phát sinh yêu cầu đổi trả, bảo hành hoặc giao lại lần 2.
  * Các thẻ có màu sắc cảnh báo trực quan (xanh cho tỷ lệ hoàn tất cao, đỏ/cam cho tỷ lệ hủy/đổi trả).

---

### TC-ORD-02: Điều hướng từ Thẻ KPI "Tỷ lệ hủy đơn" sang danh sách đơn hủy
* **Tiền điều kiện:** Thẻ KPI "Tỷ lệ hủy đơn" đang hiển thị trên màn hình.
* **Các bước thực hiện:**
  1. Nhấp chuột trực tiếp vào thẻ KPI **"Tỷ lệ hủy đơn"** (hoặc nút **"Xem chi tiết đơn hủy"** trên thẻ).
* **Kết quả mong đợi:**
  * Hệ thống chuyển hướng sang trang Quản lý đơn hàng `/admin/orders`.
  * Bộ lọc trạng thái đơn hàng tự động kích hoạt trạng thái **"Đã hủy"** (tham số đường dẫn `status=cancelled`).
  * Danh sách hiển thị đúng các đơn hàng bị hủy để quản lý kiểm tra lý do hủy.

---

### TC-ORD-03: Điều hướng từ Thẻ KPI "Đổi trả & Giao lại" sang trang Đổi trả
* **Tiền điều kiện:** Thẻ KPI "Đổi trả & Giao lại" đang hiển thị.
* **Các bước thực hiện:**
  1. Nhấp chuột vào thẻ KPI **"Đổi trả & Giao lại"**.
* **Kết quả mong đợi:**
  * Hệ thống điều hướng ngay sang trang Quản trị Yêu cầu đổi trả `/admin/orders/returns`.
  * Hiển thị danh sách các biên bản yêu cầu thu hồi hoặc đổi mới sản phẩm cho khách hàng.

---

### TC-ORD-04: Nhấp tương tác các bước trong Thác nước vòng đời đơn hàng
* **Tiền điều kiện:** Khối "Thác nước trạng thái vòng đời đơn hàng" (Order Waterfall Lifecycle) hiển thị chuỗi 6 bước: Chờ xác nhận -> Đã duyệt -> Đang gia công -> Đã xuất kho -> Đang giao hàng -> Hoàn tất.
* **Các bước thực hiện:**
  1. Di chuột vào khối **"Bước 3: Đang gia công"**.
  2. Nhấp chuột vào ô này.
* **Kết quả mong đợi:**
  * Hệ thống chuyển hướng sang trang Quản lý đơn hàng `/admin/orders`.
  * Tab trạng thái đơn hàng được chọn sẵn là **"Đang gia công"** (hoặc `status=processing`).
  * Thực hiện tương tự khi nhấp vào **"Đang giao hàng"** -> trang Đơn hàng chuyển sang tab **"Đang giao"** (`status=shipping`).

---

### TC-ORD-05: Điều hướng Nút "Chi tiết đơn hàng" kèm bộ lọc kết hợp đa chiều
* **Tiền điều kiện:** Trên trang Báo cáo Đơn hàng, người dùng đang chọn:
  * Chi nhánh: **"Showroom Quận 2"**
  * Trạng thái quan tâm: **"Đang giao hàng"**
* **Các bước thực hiện:**
  1. Cuộn đến khu vực bảng Danh sách điều phối đơn hàng.
  2. Nhấp chuột vào nút **"Chi tiết đơn hàng"** ở đầu bảng.
* **Kết quả mong đợi:**
  * Hệ thống chuyển hướng sang trang Quản lý đơn hàng `/admin/orders`.
  * Trang tiếp nhận và áp dụng **đồng thời cả 2 điều kiện lọc**: Chi nhánh là Showroom Quận 2 và Trạng thái là Đang giao.
  * Danh sách được tự động sắp xếp theo thời gian đặt mới nhất lên đầu.

---

### TC-ORD-06: Kiểm tra bảng Đánh giá hiệu suất các Đối tác giao vận
* **Tiền điều kiện:** Màn hình hiển thị bảng đối soát đối tác vận chuyển (GHTK, GHN, Viettel Post, Đội xe DCOR).
* **Các bước thực hiện:**
  1. Quan sát bảng số liệu của từng đơn vị vận chuyển.
* **Kết quả mong đợi:**
  * Hiển thị rõ các cột: Tên đối tác, Tổng số đơn tiếp nhận, Tỷ lệ giao đúng hạn (%), Thời gian giao trung bình (giờ/ngày), Số ca khiếu nại / hư hại hàng hóa.
  * Đơn vị giao vận có tỷ lệ giao trễ cao được làm nổi bật màu cảnh báo để đội Logistics có phương án điều phối lại.

---

### TC-ORD-07: Lọc báo cáo đơn hàng theo khoảng thời gian và Showroom
* **Tiền điều kiện:** Đang ở trang Báo cáo Đơn hàng.
* **Các bước thực hiện:**
  1. Thay đổi bộ lọc thời gian sang **"Tháng này"**.
  2. Thay đổi bộ lọc Showroom sang **"Showroom Hà Nội"**.
* **Kết quả mong đợi:**
  * Thác nước vòng đời đơn hàng cập nhật lại số lượng đơn ở từng bước ứng với Showroom Hà Nội trong tháng này.
  * Các biểu đồ và danh sách điều phối hiển thị thông tin nhất quán, chính xác.

---

### TC-ORD-08: Kiểm tra hiển thị thời gian giao hàng trung bình (Lead Time)
* **Tiền điều kiện:** Báo cáo đã nạp xong số liệu.
* **Các bước thực hiện:**
  1. Kiểm tra chỉ số Thời gian xử lý trung bình và Thời gian giao hàng trung bình.
* **Kết quả mong đợi:**
  * Hiển thị đơn vị rõ ràng (ví dụ: `2.4 ngày` hoặc `18 giờ`).
  * Có so sánh tăng/giảm thời gian so với chu kỳ trước (thời gian giao hàng giảm được hiển thị màu xanh mang nghĩa tích cực).

---

## 3. Kịch bản Kiểm thử Chi tiết Trường Hợp Biên (Edge Cases & Negative Scenarios)

### TC-ORD-09: Thác nước vòng đời khi 100% đơn hàng dồn vào 1 trạng thái duy nhất
* **Tiền điều kiện:** Trong kỳ lọc, toàn bộ 25 đơn hàng phát sinh đều đã hoàn tất (100% Hoàn tất), các bước khác (Chờ duyệt, Đang gia công...) đều bằng 0.
* **Các bước thực hiện:**
  1. Quan sát đồ thị Thác nước vòng đời đơn hàng.
* **Kết quả mong đợi:**
  * Đồ thị hiển thị thanh Hoàn tất đầy 100%, các thanh bước khác hiển thị mốc 0 đơn (0%).
  * Giao diện không bị méo lệch cột hoặc lỗi chia tỷ lệ đồ họa.
  * Nhấp vào ô bước có 0 đơn hàng -> chuyển sang trang `/admin/orders` và hiển thị bảng rỗng thông báo: *"Không có đơn hàng nào ở trạng thái này"*.

---

### TC-ORD-10: Tỷ lệ hủy đơn đạt 100% (khi chỉ có 1 đơn phát sinh và bị hủy)
* **Tiền điều kiện:** Chọn lọc theo 1 showroom mới mở chỉ phát sinh duy nhất 1 đơn hàng và đơn hàng đó đã bị hủy.
* **Các bước thực hiện:**
  1. Quan sát thẻ KPI "Tỷ lệ hủy đơn".
* **Kết quả mong đợi:**
  * Tỷ lệ hủy đơn hiển thị chính xác `100% (1/1 đơn)` với màu đỏ cảnh báo.
  * Tỷ lệ hoàn tất hiển thị `0%`.
  * Không phát sinh lỗi logic toán học.

---

### TC-ORD-11: Đối tác giao vận mới kết nối chưa có lịch sử đơn giao
* **Tiền điều kiện:** Hệ thống mới tích hợp thêm một đơn vị vận chuyển (ví dụ: *Ninja Van*) nhưng chưa bàn giao đơn nào.
* **Các bước thực hiện:**
  1. Quan sát bảng Đánh giá hiệu suất các Đối tác giao vận.
* **Kết quả mong đợi:**
  * Dòng của *Ninja Van* hiển thị số đơn tiếp nhận là `0`.
  * Các cột Tỷ lệ đúng hạn và Thời gian trung bình hiển thị dấu gạch ngang `-` hoặc nhãn `Chưa có dữ liệu`, **tuyệt đối không hiển thị `NaN%` hoặc `0 giờ`**.

---

### TC-ORD-12: Điều hướng mang theo tham số Showroom hoặc Trạng thái không hợp lệ
* **Tiền điều kiện:** Người dùng tự gõ vào thanh URL một tham số không tồn tại: `/admin/orders?status=invalid_status_xyz&showroom=UnknownShowroom`.
* **Các bước thực hiện:**
  1. Truy cập URL với tham số sai lệch trên.
* **Kết quả mong đợi:**
  * Trang Quản lý đơn hàng tiếp nhận an toàn, không bị crash ứng dụng.
  * Tự động đưa bộ lọc về trạng thái an toàn (Fallback về tab "Tất cả") hoặc hiển thị thông báo: *"Không tìm thấy bộ lọc phù hợp, hiển thị tất cả đơn hàng"*.
