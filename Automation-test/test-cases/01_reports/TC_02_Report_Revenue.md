# Bộ Test Case: Báo Cáo Doanh Thu & Dòng Tiền (Revenue Report)

* **Mã Phân hệ:** ADM-11-REV
* **Tên Màn hình:** Báo cáo Doanh thu & Dòng tiền (Revenue & Financial Report)
* **Đường dẫn (URL):** `/admin/reports/revenue`
* **Tài liệu tham chiếu:** FRD - [ADM-11] Admin Reports & Dashboard (User Story US-02)
* **Đối tượng sử dụng:** Giám đốc Tài chính, Kế toán trưởng, Quản trị viên, QC Tester
* **Môi trường áp dụng:** Local (`http://localhost:4200`) & Vercel Dev (`https://dcor-studio-dev.vercel.app`)

---

## 1. Ma trận Test Case Tổng hợp

| Mã Test Case | Tên Kịch bản Kiểm thử | Phân loại | Mức độ | Tiêu chí FRD |
| :--- | :--- | :--- | :--- | :--- |
| **TC-REV-01** | Kiểm tra hiển thị các thẻ KPI tài chính & dòng tiền | Chức năng (Functional) | P1 - Cao | Scenario 2.1 |
| **TC-REV-02** | Đối soát công thức toán học cấu thành Doanh thu thuần | Logic / Tính toán | P1 - Cao | Scenario 2.1 |
| **TC-REV-03** | Lọc dữ liệu theo Chi nhánh / Showroom thực tế | Bộ lọc (Filter) | P1 - Cao | Scenario 2.2 |
| **TC-REV-04** | Nút "Chi tiết đơn hàng" tại đầu bảng Top doanh thu cao | Điều hướng chuyên sâu | P1 - Cao | Scenario 2.2 |
| **TC-REV-05** | Nhấp vào Mã đơn hàng (ORD-xxxxx) trong bảng Top doanh thu | Điều hướng chuyên sâu | P1 - Cao | Scenario 2.3 |
| **TC-REV-06** | Kiểm tra Biểu đồ cơ cấu doanh thu theo Showroom & Kênh bán | Giao diện & Đồ họa | P2 - Trung bình | Mục 1.2.1 |
| **TC-REV-07** | Kiểm tra Biểu đồ tỷ trọng Phương thức thanh toán | Giao diện & Đồ họa | P2 - Trung bình | Mục 1.2.1 |
| **TC-REV-08** | Xuất báo cáo doanh thu ra tệp bảng tính Excel / CSV | Tiện ích (Export) | P2 - Trung bình | Mục 1.2.1 |
| **TC-REV-09** | Xử lý khi bộ lọc Chi nhánh không phát sinh doanh số | Trường hợp biên (Edge Case) | P2 - Trung bình | Scenario 2.2 |
| **TC-REV-10** | Khoảng ngày lọc tùy chọn bất hợp lý (Ngày bắt đầu > Ngày kết thúc) | Trường hợp biên (Edge Case) | P1 - Cao | Mục 1.2.1 |
| **TC-REV-11** | Tiền hoàn/hủy vượt quá doanh thu gộp (Doanh thu thuần âm) | Trường hợp biên (Edge Case) | P1 - Cao | Scenario 2.1 |
| **TC-REV-12** | Hiển thị giá trị doanh số cực lớn (hàng chục tỷ đồng) không tràn khung | Trường hợp biên (UI/UX) | P2 - Trung bình | Mục 1.2.1 |
| **TC-REV-13** | Thao tác nhấp chuột liên tục (Rapid Double/Spam Click) vào bộ lọc | Trường hợp biên (Debounce) | P2 - Trung bình | Mục 1.2.1 |
| **TC-REV-14** | Xuất báo cáo Excel khi tập dữ liệu hoàn toàn rỗng (0 dòng) | Trường hợp biên (Edge Case) | P3 - Thấp | Mục 1.2.1 |
| **TC-REV-15** | Mất kết nối mạng / Lỗi máy chủ API khi tải báo cáo doanh thu | Trường hợp biên (Network Error) | P1 - Cao | Mục 1.2.1 |

---

## 2. Kịch bản Kiểm thử Chi tiết (Happy Path & Chức Năng Cốt Lõi)

### TC-REV-01: Kiểm tra hiển thị các thẻ KPI tài chính & dòng tiền
* **Tiền điều kiện:** Người dùng đã đăng nhập hệ thống và truy cập trang Báo cáo Doanh thu `/admin/reports/revenue`.
* **Các bước thực hiện:**
  1. Chờ trang tải hoàn tất dữ liệu.
  2. Quan sát hàng thẻ chỉ số tài chính phía trên.
* **Kết quả mong đợi:**
  * Hiển thị đầy đủ 4 thẻ chỉ số:
    1. **Doanh thu thuần thực nhận** (Net Revenue).
    2. **Doanh thu gộp** (Gross Revenue trước giảm giá).
    3. **Tổng tiền chiết khấu & Voucher** (Discounts).
    4. **Tổng tiền hoàn / hủy đơn** (Refunds & Returns).
  * Tất cả các giá trị tiền tệ được định dạng VNĐ chuẩn xác, có dấu phân cách rõ ràng.

---

### TC-REV-02: Đối soát công thức toán học cấu thành Doanh thu thuần
* **Tiền điều kiện:** Trang Báo cáo Doanh thu đã hiển thị đầy đủ số liệu tài chính.
* **Các bước thực hiện:**
  1. Ghi nhận giá trị Doanh thu gộp ($A$).
  2. Ghi nhận giá trị Tổng chiết khấu voucher ($B$).
  3. Ghi nhận giá trị Hoàn/hủy đơn ($C$).
  4. Thực hiện phép tính: $A - B - C$.
  5. So sánh kết quả vừa tính với thẻ "Doanh thu thuần thực nhận" ($D$) trên giao diện.
* **Kết quả mong đợi:**
  * Giá trị hiển thị tại thẻ Doanh thu thuần phải khớp chính xác: $D = A - B - C$.
  * Không có sự chênh lệch số lẻ hoặc làm tròn sai.

---

### TC-REV-03: Lọc dữ liệu theo Chi nhánh / Showroom thực tế
* **Tiền điều kiện:** Đang ở trang Báo cáo Doanh thu với bộ lọc mặc định là "Tất cả chi nhánh".
* **Các bước thực hiện:**
  1. Nhấp vào bộ lọc thả xuống "Chi nhánh / Showroom".
  2. Chọn một chi nhánh cụ thể (ví dụ: **"Showroom Quận 7"** hoặc **"Showroom Quận 2"**).
  3. Quan sát sự thay đổi trên màn hình.
* **Kết quả mong đợi:**
  * Toàn bộ các thẻ KPI doanh thu cập nhật lại chỉ tính riêng cho Showroom được chọn.
  * Bảng Top đơn hàng doanh thu cao chỉ liệt kê các đơn phát sinh từ Showroom đó.
  * Tên chi nhánh được chọn hiển thị rõ ràng trên thanh tiêu đề hoặc thẻ lọc hoạt động.

---

### TC-REV-04: Nút "Chi tiết đơn hàng" tại đầu bảng Top doanh thu cao
* **Tiền điều kiện:** Đang chọn bộ lọc chi nhánh là "Showroom Quận 7" trên trang Báo cáo Doanh thu.
* **Các bước thực hiện:**
  1. Cuộn chuột đến bảng "Top đơn hàng doanh thu cao nhất".
  2. Tìm và nhấp chuột vào nút **"Chi tiết đơn hàng"** (nằm ở góc trên bên phải của bảng).
* **Kết quả mong đợi:**
  * Hệ thống mở sang trang Quản lý đơn hàng `/admin/orders`.
  * Bộ lọc chi nhánh trên trang Đơn hàng tự động lưu giữ giá trị **"Showroom Quận 7"**.
  * Cột "Tổng tiền" trong danh sách đơn hàng tự động được kích hoạt sắp xếp giảm dần (từ đơn giá trị cao nhất xuống thấp nhất).

---

### TC-REV-05: Nhấp vào Mã đơn hàng (ORD-xxxxx) trong bảng Top doanh thu
* **Tiền điều kiện:** Bảng Top đơn hàng hiển thị các mã đơn hàng cụ thể (ví dụ: `ORD-88992`).
* **Các bước thực hiện:**
  1. Nhấp chuột trực tiếp vào dòng chữ mã đơn hàng `ORD-88992`.
* **Kết quả mong đợi:**
  * Hệ thống mở màn hình Chi tiết đơn hàng tương ứng (hoặc chuyển sang `/admin/orders` và kích hoạt tìm kiếm chính xác mã đơn này).
  * Quản trị viên có thể xem ngay chi tiết sản phẩm trong đơn, trạng thái thanh toán và thông tin khách mua.

---

### TC-REV-06: Kiểm tra Biểu đồ cơ cấu doanh thu theo Showroom & Kênh bán
* **Tiền điều kiện:** Màn hình hiển thị biểu đồ phân bổ doanh số.
* **Các bước thực hiện:**
  1. Rà chuột (hover) qua từng cột/vùng trên biểu đồ doanh số theo Showroom.
* **Kết quả mong đợi:**
  * Tooltip hiển thị rõ tên Showroom, doanh số bằng tiền VNĐ và tỷ trọng phần trăm đóng góp.
  * Tổng phần trăm đóng góp của các Showroom cộng lại bằng 100%.

---

### TC-REV-07: Kiểm tra Biểu đồ tỷ trọng Phương thức thanh toán
* **Tiền điều kiện:** Biểu đồ tròn phương thức thanh toán đang hiển thị.
* **Các bước thực hiện:**
  1. Rà chuột qua các phần của biểu đồ: Chuyển khoản ngân hàng, Thẻ tín dụng/ATM (VNPAY), Ví điện tử, Thu hộ COD khi giao hàng.
* **Kết quả mong đợi:**
  * Hiển thị tỷ trọng phần trăm và số lượng đơn hàng tương ứng với từng hình thức.
  * Màu sắc các phần tách biệt rõ ràng, có chú giải tương ứng bên cạnh.

---

### TC-REV-08: Xuất báo cáo doanh thu ra tệp bảng tính Excel / CSV
* **Tiền điều kiện:** Đang xem báo cáo doanh thu với các điều kiện lọc đã chọn.
* **Các bước thực hiện:**
  1. Nhấp chuột vào nút **"Xuất báo cáo"** (hoặc biểu tượng Excel/Tải xuống) ở đầu trang.
* **Kết quả mong đợi:**
  * Trình duyệt tự động tải xuống tệp tin bảng tính (`Bao_cao_doanh_thu_DCOR_2026-11-04.xlsx`).
  * Nội dung tệp chứa đầy đủ các cột: Mã đơn, Thời gian, Showroom, Doanh thu gộp, Giảm giá, Doanh thu thuần, Phương thức thanh toán.
  * Tệp mở được bình thường, không bị lỗi font tiếng Việt.

---

## 3. Kịch bản Kiểm thử Chi tiết Trường Hợp Biên (Edge Cases & Negative Scenarios)

### TC-REV-09: Xử lý khi bộ lọc Chi nhánh không phát sinh doanh số (Empty State)
* **Tiền điều kiện:** Chọn một chi nhánh mới mở chưa phát sinh đơn hàng trong kỳ.
* **Các bước thực hiện:**
  1. Chọn chi nhánh này tại bộ lọc Showroom.
* **Kết quả mong đợi:**
  * Các thẻ doanh thu hiển thị `0 ₫`, chiết khấu `0 ₫`, hoàn tiền `0 ₫`.
  * Biểu đồ tròn hiển thị hình đĩa tròn màu xám mờ hoặc thông báo: *"Chưa có dữ liệu phương thức thanh toán"*.
  * Bảng Top đơn hàng hiển thị hình minh họa trạng thái rỗng: *"Chưa có đơn hàng nào phát sinh tại chi nhánh này"*.
  * Ứng dụng không bị đứng hình, không xuất hiện chữ `NaN ₫` hoặc lỗi script giao diện.

---

### TC-REV-10: Khoảng ngày lọc tùy chọn bất hợp lý (Ngày bắt đầu > Ngày kết thúc)
* **Tiền điều kiện:** Đang mở bộ chọn khoảng ngày tùy chỉnh (Custom Date Range Picker).
* **Các bước thực hiện:**
  1. Chọn "Từ ngày (Ngày bắt đầu)": `30/11/2026`.
  2. Chọn "Đến ngày (Ngày kết thúc)": `01/11/2026` (Ngày kết thúc đứng trước ngày bắt đầu).
  3. Nhấp nút **"Áp dụng bộ lọc"**.
* **Kết quả mong đợi:**
  * Hệ thống chặn hành động áp dụng, không gửi truy vấn sai lệch về máy chủ.
  * Hiển thị thông báo cảnh báo lỗi trực quan ngay dưới ô chọn ngày: *"Ngày bắt đầu không được lớn hơn Ngày kết thúc"*.
  * Hoặc hệ thống tự động hoán đổi ngày bắt đầu thành 01/11 và ngày kết thúc thành 30/11 một cách thông minh.

---

### TC-REV-11: Tiền hoàn/hủy vượt quá doanh thu gộp (Doanh thu thuần âm)
* **Tiền điều kiện:** Trong kỳ báo cáo chọn thời gian ngắn (ví dụ: ngày hôm nay), không có đơn bán mới ($A = 0$), nhưng kế toán xử lý hoàn tiền một đơn may đo lớn từ kỳ trước ($C = 25.000.000 ₫$).
* **Các bước thực hiện:**
  1. Lọc báo cáo vào ngày phát sinh giao dịch hoàn tiền này.
  2. Quan sát thẻ "Doanh thu thuần thực nhận".
* **Kết quả mong đợi:**
  * Hệ thống tính toán chính xác theo công thức: $D = 0 - 0 - 25.000.000 = -25.000.000 ₫$.
  * Thẻ Doanh thu thuần hiển thị rõ dấu âm `-25.000.000 ₫`, số tiền đổi sang màu đỏ cảnh báo dòng tiền âm.
  * Biểu đồ xu hướng vẽ điểm rơi dưới trục hoành 0 hoặc hiển thị ghi chú đối soát tài chính rõ ràng, không bị crash đồ họa.

---

### TC-REV-12: Hiển thị giá trị doanh số cực lớn (hàng chục tỷ đồng) không tràn khung
* **Tiền điều kiện:** Doanh số năm của toàn hệ thống đạt mức rất lớn: `128.750.000.000 ₫` (Một trăm hai mươi tám tỷ bảy trăm năm mươi triệu đồng).
* **Các bước thực hiện:**
  1. Chọn bộ lọc thời gian: **"Năm nay"**.
  2. Thu nhỏ cửa sổ trình duyệt (responsive test ở độ phân giải 1366x768 hoặc trên laptop).
* **Kết quả mong đợi:**
  * Chuỗi ký tự số tiền cực dài không bị tràn ra ngoài viền thẻ KPI (No overflow).
  * Chữ số tự động co giãn font (Auto-scaling) hoặc định dạng số rút gọn thông minh: `128,75 Tỷ ₫` kèm tooltip hiển thị đầy đủ số tiền chi tiết khi rà chuột.
  * Các biểu đồ cột tự động tính lại thang chia trục tung (Y-axis) theo đơn vị Tỷ/Triệu, không để các số 0 đè lên nhau.

---

### TC-REV-13: Thao tác nhấp chuột liên tục (Rapid Double/Spam Click) vào bộ lọc
* **Tiền điều kiện:** Đang ở trang Báo cáo Doanh thu.
* **Các bước thực hiện:**
  1. Nhấp liên tục và nhanh (4-5 lần trong vòng 1 giây) vào các nút chuyển chu kỳ: "Theo ngày", "Theo giờ", "Theo tuần".
  2. Nhấp liên tục vào các mục trong menu thả xuống chọn Chi nhánh.
* **Kết quả mong đợi:**
  * Hệ thống có cơ chế Debounce / Hủy request cũ (AbortController).
  * Biểu đồ không bị chập chờn hay vẽ chồng nhiều lớp dữ liệu (No chart flickering / canvas stacking).
  * Giao diện duy trì độ mượt mà và kết quả cuối cùng phản ánh chính xác cú nhấp chuột cuối cùng của người dùng.

---

### TC-REV-14: Xuất báo cáo Excel khi tập dữ liệu hoàn toàn rỗng (0 dòng)
* **Tiền điều kiện:** Đang ở bộ lọc không phát sinh bất kỳ đơn hàng nào (kết quả 0 đơn).
* **Các bước thực hiện:**
  1. Nhấp nút **"Xuất báo cáo"**.
* **Kết quả mong đợi:**
  * Hệ thống hiển thị thông báo nhắc nhở thân thiện: *"Không có dữ liệu trong khoảng thời gian này để xuất báo cáo"*.
  * Nút xuất báo cáo có thể ở trạng thái mờ (disabled) hoặc xuất tệp tin mẫu chỉ gồm tiêu đề cột mà không bị lỗi treo trình duyệt hay sinh tệp tin hỏng dung lượng 0 byte.

---

### TC-REV-15: Mất kết nối mạng / Lỗi máy chủ API khi tải báo cáo doanh thu
* **Tiền điều kiện:** Ngắt kết nối mạng internet hoặc giả lập API trả về mã lỗi HTTP 500 / 504 Gateway Timeout.
* **Các bước thực hiện:**
  1. Nhấp tải lại trang hoặc đổi bộ lọc thời gian trong tình trạng mất mạng.
* **Kết quả mong đợi:**
  * Màn hình **không bị trắng xóa** (No white screen of death) và không bị treo biểu tượng xoay vòng vô tận.
  * Hiển thị khối thông báo lỗi trực quan: *"Không thể tải dữ liệu báo cáo. Vui lòng kiểm tra kết nối mạng và thử lại"*.
  * Cung cấp nút bấm **"Thử lại (Retry)"** để người dùng bấm tải lại dữ liệu khi mạng hoạt động trở lại.
