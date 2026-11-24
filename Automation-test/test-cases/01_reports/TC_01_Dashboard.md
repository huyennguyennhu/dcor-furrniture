# Bộ Test Case: Bảng Điều Khiển Tổng Quan (Dashboard)

* **Mã Phân hệ:** ADM-11-DASH
* **Tên Màn hình:** Bảng điều khiển Tổng quan (Executive Overview Dashboard)
* **Đường dẫn (URL):** `/admin/dashboard`
* **Tài liệu tham chiếu:** FRD - [ADM-11] Admin Reports & Dashboard (User Story US-01)
* **Đối tượng sử dụng:** Ban Giám đốc, Super Admin, Trưởng bộ phận Vận hành, QC/QA Tester
* **Môi trường áp dụng:** Local (`http://localhost:4200`) & Vercel Dev (`https://dcor-studio-dev.vercel.app`)

---

## 1. Ma trận Test Case Tổng hợp

| Mã Test Case | Tên Kịch bản Kiểm thử | Phân loại | Mức độ | Tiêu chí FRD |
| :--- | :--- | :--- | :--- | :--- |
| **TC-DASH-01** | Kiểm tra hiển thị đầy đủ 4 Thẻ chỉ số KPI cốt lõi | Chức năng (Functional) | P1 - Cao | Scenario 1.1 |
| **TC-DASH-02** | Kiểm tra logic tính toán tỷ lệ tăng trưởng % & màu sắc huy hiệu | Logic / Hiển thị | P2 - Trung bình | Scenario 1.1 |
| **TC-DASH-03** | Tác nghiệp thẻ Cảnh báo khẩn cấp: Đơn cọc chờ duyệt | Điều hướng (Navigation) | P1 - Cao | Scenario 1.2 |
| **TC-DASH-04** | Tác nghiệp thẻ Cảnh báo khẩn cấp: Tồn kho chạm ngưỡng an toàn | Điều hướng (Navigation) | P1 - Cao | Scenario 1.2 |
| **TC-DASH-05** | Tác nghiệp thẻ Cảnh báo khẩn cấp: Lịch hẹn trải nghiệm Showroom | Điều hướng (Navigation) | P2 - Trung bình | Scenario 1.2 |
| **TC-DASH-06** | Thay đổi chu kỳ Biểu đồ xu hướng doanh thu độc lập (Theo ngày/giờ) | Giao diện / Tải dữ liệu | P1 - Cao | Scenario 1.5 |
| **TC-DASH-07** | Điều hướng từ Chú giải Biểu đồ cơ cấu trạng thái đơn hàng | Điều hướng chuyên sâu | P1 - Cao | Scenario 1.3 |
| **TC-DASH-08** | Điều hướng từ Bảng Top 5 Khách hàng: Nhấp vào tên khách hàng | Điều hướng chuyên sâu | P1 - Cao | Scenario 1.4 |
| **TC-DASH-09** | Điều hướng từ Bảng Top 5 Khách hàng: Nhấp vào số lượng đơn hàng | Điều hướng chuyên sâu | P1 - Cao | Scenario 1.4 |
| **TC-DASH-10** | Lọc dữ liệu toàn cục theo mốc thời gian (7 ngày, 30 ngày, Quý, Năm) | Bộ lọc (Filter) | P1 - Cao | Mục 1.2.1 |
| **TC-DASH-11** | Kiểm tra hiển thị khi hệ thống không có dữ liệu (Empty State) | Trường hợp biên (Edge Case) | P2 - Trung bình | Scenario 1.1 |
| **TC-DASH-12** | Tính tỷ lệ tăng trưởng % khi chu kỳ trước bằng 0 (Tránh lỗi chia cho 0) | Trường hợp biên (Edge Case) | P1 - Cao | Scenario 1.1 |
| **TC-DASH-13** | Khối cảnh báo tác nghiệp khi toàn bộ chỉ số đều bằng 0 (All Clean State) | Trường hợp biên (Edge Case) | P3 - Thấp | Scenario 1.2 |
| **TC-DASH-14** | Dữ liệu chuỗi thời gian biểu đồ có các ngày rỗng xen kẽ (Gaps in Time Series) | Trường hợp biên (Edge Case) | P2 - Trung bình | Scenario 1.5 |
| **TC-DASH-15** | Mất kết nối mạng / Lỗi máy chủ API khi tải trang Dashboard | Trường hợp biên (Network Error) | P1 - Cao | Scenario 1.1 |

---

## 2. Kịch bản Kiểm thử Chi tiết (Happy Path & Chức Năng Cốt Lõi)

### TC-DASH-01: Kiểm tra hiển thị đầy đủ 4 Thẻ chỉ số KPI cốt lõi
* **Tiền điều kiện:** Người dùng đã đăng nhập hệ thống với quyền Quản trị viên và đang ở trang Bảng điều khiển Tổng quan.
* **Các bước thực hiện:**
  1. Truy cập vào trang Dashboard theo đường dẫn `/admin/dashboard`.
  2. Chờ trang tải hoàn tất dữ liệu.
  3. Quan sát hàng thẻ chỉ số KPI đầu trang.
* **Dữ liệu đầu vào:** Mặc định (Bộ lọc thời gian 30 ngày qua).
* **Kết quả mong đợi:**
  * Hiển thị đủ 4 thẻ:
    1. **Doanh thu thuần:** Hiển thị số tiền định dạng tiền tệ Việt Nam (VNĐ), có dấu phân cách hàng nghìn.
    2. **Tổng đơn hàng & Tỷ lệ hoàn tất:** Hiển thị tổng số lượng đơn và tỷ lệ hoàn tất dạng phần trăm (%).
    3. **Giá trị đơn trung bình (AOV):** Hiển thị số tiền VNĐ trung bình trên mỗi đơn hoàn tất.
    4. **Khách hàng hệ thống & VIP:** Hiển thị tổng số khách hàng đăng ký và số lượng hội viên đạt hạng VIP.
  * Không xuất hiện giá trị lỗi (NaN, null, undefined) hoặc biểu tượng tải xoay vòng vô tận.

---

### TC-DASH-02: Kiểm tra logic tính toán tỷ lệ tăng trưởng % & màu sắc huy hiệu
* **Tiền điều kiện:** Trang Dashboard đã tải đầy đủ số liệu KPI.
* **Các bước thực hiện:**
  1. Quan sát huy hiệu tăng/giảm phần trăm bên cạnh giá trị chính tại các thẻ KPI.
  2. So sánh giá trị kỳ này với chu kỳ liền kề trước đó.
* **Kết quả mong đợi:**
  * Nếu giá trị kỳ này cao hơn kỳ trước: Huy hiệu hiển thị màu xanh lá cây kèm dấu cộng `+` và mũi tên hướng lên (▲).
  * Nếu giá trị kỳ này thấp hơn kỳ trước: Huy hiệu hiển thị màu đỏ kèm dấu trừ `-` và mũi tên hướng xuống (▼).
  * Nếu giá trị không đổi (0%): Hiển thị màu xám trung tính.

---

### TC-DASH-03: Tác nghiệp thẻ Cảnh báo khẩn cấp - Đơn cọc chờ duyệt
* **Tiền điều kiện:** Hệ thống có ít nhất 1 đơn hàng may đo hoặc giá trị cao đang ở trạng thái Chờ duyệt cọc 30%.
* **Các bước thực hiện:**
  1. Tại khối Cảnh báo tác nghiệp khẩn cấp trên trang Dashboard, tìm thẻ cảnh báo có viền/nền vàng (Cảnh báo đơn đặt cọc).
  2. Nhấp chuột vào nút **"Xử lý đơn cọc"** (hoặc **"Xem ngay"**).
* **Kết quả mong đợi:**
  * Trình duyệt chuyển hướng ngay sang trang Quản lý đơn hàng `/admin/orders`.
  * Bộ lọc trạng thái thanh toán trên trang Đơn hàng tự động được kích hoạt là **"Chờ duyệt cọc"** (hoặc tham số đường dẫn chứa `paymentStatus=deposit_pending`).
  * Danh sách hiển thị đúng các đơn hàng cần duyệt cọc, không hiển thị các đơn đã thanh toán xong.

---

### TC-DASH-04: Tác nghiệp thẻ Cảnh báo khẩn cấp - Tồn kho chạm ngưỡng an toàn
* **Tiền điều kiện:** Hệ thống có các mặt hàng có số lượng tồn kho thực tế nhỏ hơn hoặc bằng mức tồn tối thiểu an toàn.
* **Các bước thực hiện:**
  1. Tìm thẻ cảnh báo màu đỏ (Cảnh báo tồn kho chạm ngưỡng) tại khối Cảnh báo tác nghiệp.
  2. Nhấp chuột vào nút **"Kiểm kho ngay"**.
* **Kết quả mong đợi:**
  * Trình duyệt chuyển hướng ngay sang trang Tổng quan Kho `/admin/inventory`.
  * Danh sách sản phẩm được tự động lọc theo trạng thái cảnh báo tồn kho thấp (hoặc tab cảnh báo tồn kho được kích hoạt).

---

### TC-DASH-05: Tác nghiệp thẻ Cảnh báo khẩn cấp - Lịch hẹn trải nghiệm Showroom
* **Tiền điều kiện:** Có lịch hẹn tư vấn không gian mẫu phát sinh trong ngày tại Showroom.
* **Các bước thực hiện:**
  1. Tìm thẻ cảnh báo màu xanh dương (Lịch hẹn Showroom hôm nay).
  2. Nhấp chuột vào nút **"Xem lịch hẹn"**.
* **Kết quả mong đợi:**
  * Trình duyệt mở danh sách lịch hẹn hoặc chuyển hướng đến chuyên mục Quản lý lịch hẹn trải nghiệm của Showroom.

---

### TC-DASH-06: Thay đổi chu kỳ Biểu đồ xu hướng doanh thu độc lập (Theo ngày/giờ)
* **Tiền điều kiện:** Trang Dashboard đang hiển thị đầy đủ biểu đồ và các khối nội dung.
* **Các bước thực hiện:**
  1. Quan sát góc trên bên phải của khung "Biểu đồ xu hướng doanh thu thuần".
  2. Nhấp chuột vào bộ chọn chu kỳ hiển thị và chuyển từ **"Theo ngày"** sang **"Theo giờ"** (hoặc **"Theo tuần"**).
* **Kết quả mong đợi:**
  * Duy nhất khung Biểu đồ xu hướng thực hiện làm mới dữ liệu và vẽ lại trục thời gian tương ứng.
  * Trục hoành (trục ngang) của biểu đồ hiển thị các mốc giờ (0h, 4h, 8h...) thay vì các ngày trong tháng.
  * Các thẻ KPI phía trên, các biểu đồ khác và bảng số liệu xung quanh **giữ nguyên vẹn trạng thái**, không bị tải lại hoặc giật màn hình.

---

### TC-DASH-07: Điều hướng từ Chú giải Biểu đồ cơ cấu trạng thái đơn hàng
* **Tiền điều kiện:** Biểu đồ tròn cơ cấu trạng thái đơn hàng hiển thị các phân khúc: Chờ duyệt, Đang gia công, Đang giao, Hoàn tất, Đã hủy.
* **Các bước thực hiện:**
  1. Di chuột vào danh sách chú giải bên dưới hoặc bên cạnh biểu đồ tròn.
  2. Nhấp chuột trực tiếp vào dòng chữ **"Đang giao"** (hoặc **"Hoàn tất"**).
* **Kết quả mong đợi:**
  * Hệ thống chuyển hướng sang trang Quản lý đơn hàng `/admin/orders`.
  * Tab hoặc bộ lọc trạng thái đơn trên trang Đơn hàng tự động chọn đúng trạng thái **"Đang giao hàng"** (hoặc tham số `status=shipping`).

---

### TC-DASH-08: Điều hướng từ Bảng Top 5 Khách hàng - Nhấp vào tên khách hàng
* **Tiền điều kiện:** Bảng "Top 5 khách hàng thân thiết" trên Dashboard hiển thị danh sách khách hàng có chi tiêu cao nhất.
* **Các bước thực hiện:**
  1. Di chuột vào cột "Tên khách hàng" của dòng đầu tiên.
  2. Nhấp chuột vào tên khách hàng (ví dụ: *Nguyễn Văn A*).
* **Kết quả mong đợi:**
  * Hệ thống mở màn hình Chi tiết khách hàng (hoặc mở cửa sổ Modal thông tin chi tiết) với đúng mã định danh của khách hàng đó.
  * Hiển thị đầy đủ thông tin: Họ tên, số điện thoại, hạng thành viên, tổng chi tiêu.

---

### TC-DASH-09: Điều hướng từ Bảng Top 5 Khách hàng - Nhấp vào số lượng đơn hàng
* **Tiền điều kiện:** Bảng "Top 5 khách hàng thân thiết" hiển thị huy hiệu số đơn hàng (ví dụ: `12 đơn`).
* **Các bước thực hiện:**
  1. Di chuột vào huy hiệu số đơn hàng của khách hàng bất kỳ.
  2. Nhấp chuột vào huy hiệu đó.
* **Kết quả mong đợi:**
  * Hệ thống chuyển hướng sang trang Danh sách đơn hàng `/admin/orders`.
  * Ô tìm kiếm hoặc bộ lọc khách hàng tự động được điền số điện thoại hoặc tên của khách hàng này.
  * Danh sách đơn hàng bên dưới chỉ hiển thị chính xác các đơn do khách hàng đó đã đặt.

---

### TC-DASH-10: Lọc dữ liệu toàn cục theo mốc thời gian
* **Tiền điều kiện:** Đang ở trang Dashboard.
* **Các bước thực hiện:**
  1. Nhấp vào bộ lọc thời gian toàn cục ở góc trên trang.
  2. Chọn lần lượt: **"7 ngày qua"**, **"Tháng này"**, **"Năm nay"**.
* **Kết quả mong đợi:**
  * Toàn bộ 4 thẻ KPI, biểu đồ doanh thu và các bảng xếp hạng đều tự động tính toán lại số liệu tương ứng với khung thời gian được chọn.
  * Không phát sinh lỗi trắng màn hình hoặc số liệu bị âm bất thường.

---

## 3. Kịch bản Kiểm thử Chi tiết Trường Hợp Biên (Edge Cases & Negative Scenarios)

### TC-DASH-11: Kiểm tra hiển thị khi hệ thống không có dữ liệu (Empty State)
* **Tiền điều kiện:** Chọn một khoảng ngày trong quá khứ hoặc tương lai hoàn toàn không phát sinh đơn hàng hay doanh thu.
* **Các bước thực hiện:**
  1. Chọn bộ lọc ngày tùy chỉnh vào khoảng thời gian trống số liệu.
* **Kết quả mong đợi:**
  * Thẻ doanh thu hiển thị `0 ₫`, tổng đơn hiển thị `0`, AOV hiển thị `0 ₫`.
  * Biểu đồ hiển thị thông báo thân thiện: *"Không có dữ liệu trong khoảng thời gian này"*.
  * Giao diện giữ nguyên bố cục ngay ngắn, không bị vỡ khung.

---

### TC-DASH-12: Tính tỷ lệ tăng trưởng % khi chu kỳ trước bằng 0 (Tránh lỗi chia cho 0)
* **Tiền điều kiện:** Tháng trước doanh thu bằng `0 ₫` (hệ thống mới khởi chạy), tháng này phát sinh doanh thu `50.000.000 ₫`.
* **Các bước thực hiện:**
  1. Xem thẻ chỉ số Doanh thu thuần của tháng này.
  2. Quan sát huy hiệu phần trăm tăng trưởng.
* **Kết quả mong đợi:**
  * Hệ thống xử lý ngoại lệ chia cho 0 ($\frac{X - 0}{0}$) một cách an toàn.
  * **Tuyệt đối không hiển thị `+Infinity%` hay `NaN%`**.
  * Hiển thị chuẩn mực: `+100%` hoặc hiển thị nhãn `Mới` với màu xanh lá cây tích cực.

---

### TC-DASH-13: Khối cảnh báo tác nghiệp khi toàn bộ chỉ số đều bằng 0 (All Clean State)
* **Tiền điều kiện:** Không có đơn hàng nào chờ duyệt cọc (0), không có sản phẩm nào chạm ngưỡng tồn kho thấp (0), và không có lịch hẹn nào bị trễ.
* **Các bước thực hiện:**
  1. Quan sát khu vực khối Cảnh báo tác nghiệp khẩn cấp.
* **Kết quả mong đợi:**
  * Không để trống trơn giao diện hay để khung cảnh báo màu đỏ/vàng vô nghĩa.
  * Hiển thị trạng thái an toàn thân thiện: *"Tuyệt vời! Hiện tại không có cảnh báo tác nghiệp khẩn cấp nào cần xử lý"* kèm biểu tượng tích xanh an tâm cho Ban Giám đốc.

---

### TC-DASH-14: Dữ liệu chuỗi thời gian biểu đồ có các ngày rỗng xen kẽ (Gaps in Time Series)
* **Tiền điều kiện:** Trong 30 ngày qua, chỉ có ngày 01, 10, 15, 28 phát sinh đơn hàng, các ngày còn lại không có giao dịch.
* **Các bước thực hiện:**
  1. Quan sát đường biểu diễn doanh thu trên biểu đồ xu hướng.
* **Kết quả mong đợi:**
  * Trục thời gian vẫn hiển thị liên tục và đầy đủ các ngày trong tháng.
  * Tại các ngày không có đơn hàng, đường biểu đồ vẽ chạm mốc `0 ₫` mượt mà, không bị đứt đoạn gãy nét hoặc gây lỗi thư viện đồ họa (Chart.js / ApexCharts).
  * Rà chuột vào các ngày trống hiển thị tooltip: `0 ₫ - 0 đơn hàng`.

---

### TC-DASH-15: Mất kết nối mạng / Lỗi máy chủ API khi tải trang Dashboard
* **Tiền điều kiện:** Ngắt kết nối mạng hoặc máy chủ trả về mã lỗi HTTP 500 khi người dùng truy cập Dashboard.
* **Các bước thực hiện:**
  1. Truy cập trang `/admin/dashboard` trong tình trạng mạng lỗi.
* **Kết quả mong đợi:**
  * Hệ thống kích hoạt khối hiển thị lỗi an toàn (Error Fallback UI).
  * Thông báo: *"Không thể tải dữ liệu chỉ số điều hành. Vui lòng kiểm tra lại đường truyền mạng."*
  * Cung cấp nút **"Tải lại dữ liệu"**, không làm đơ toàn bộ ứng dụng hay mất thanh menu điều hướng.
