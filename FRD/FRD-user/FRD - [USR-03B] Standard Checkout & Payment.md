# Lịch sử chỉnh sửa tài liệu (Document History)

| Phiên bản | Ngày | Tác giả | Nội dung thay đổi |
| --- | --- | --- | --- |
| 1.0 | 05 tháng 10, 2026 | DCOR Team | Khởi tạo bản phác thảo Đặt hàng & Thanh toán (Standard Checkout & Payment). |
| 2.0 | 06 tháng 10, 2026 | Team BA DCOR Studio | Tách phân hệ `FRD-USR-03` thành 2 FRD độc lập (`FRD-USR-03A`: Quản lý Giỏ hàng & `FRD-USR-03B`: Đặt hàng Checkout). |
| 3.0 | 06 tháng 10, 2026 | Team BA & System Architect | Chuẩn hóa toàn bộ FRD-USR-03B chuẩn sản xuất với 8 FRs chi tiết, Pre/Post-conditions, Gherkin Scenarios & UI Fields Matrices. |
| 4.0 | 06 tháng 10, 2026 | Team BA & System Architect | Mở rộng siêu chi tiết: Checkout State Machine, Business Rules Matrices, DTO Schemas, Dialog Specs & Formulas. |
| 5.0 | 06 tháng 10, 2026 | Team BA & UX Specialist | Bổ sung Phân nhánh Xác thực OTP tại Checkout (In-Checkout OTP Engine) cho Khách vãng lai và Khách đăng nhập Google chưa có SĐT. |
| 6.0 | 07 tháng 10, 2026 | Team BA & Tax Specialist | **Mở rộng Siêu Chi Tiết Phân Hệ Xuất Hóa Đơn GTGT (VAT E-Invoice Engine - FR-05):** Thêm User Story `US-04`, Tích hợp API Tra cứu Mã số thuế Doanh nghiệp VN real-time, Công thức bóc tách thuế VAT 8%/10%, Cấu trúc Hóa đơn Điện tử Snapshot JSONB & Bảng UI Fields Matrix riêng cho VAT. |

---

# 1. Tổng quan (Overview)

## 1.1. Mục đích (Purpose)
Tài liệu này định nghĩa chi tiết các yêu cầu nghiệp vụ và chức năng cho **Phân hệ Đặt hàng & Thanh toán Đơn tiêu chuẩn (Standard Checkout & Payment)** dành cho khách hàng trên Storefront của **DCOR Studio**. Phân hệ này chốt danh sách sản phẩm tiêu chuẩn được chọn từ Giỏ hàng, xử lý tự động điền địa chỉ giao nhận (Autofill Profile), kích hoạt xác thực OTP SMS/Zalo ZNS ngay tại Checkout đối với Khách vãng lai (Guest) hoặc Khách đăng nhập Google chưa có SĐT, điền địa chỉ giao hàng 3 cấp hành chính, tính phí vận chuyển động theo khu vực, áp dụng mã khuyến mãi (Promotion/Voucher), **xử lý yêu cầu xuất Hóa đơn Tài chính GTGT (VAT E-Invoice Engine) bóc tách thuế cho doanh nghiệp B2B & cá nhân**, khởi tạo bản ghi đơn hàng đóng đóng băng giá (Snapshot Pattern), khóa tồn kho tạm thời (Stock Locking Guard) và tích hợp thanh toán đa cổng (VNPAY, Chuyển khoản QR Ngân hàng, COD).

## 1.2. Phạm vi (Scope)

### 1.2.1. Tính năng thuộc phạm vi (In-Scope Features)
- **FR-01: Xử lý Danh sách Sản phẩm Chốt mua từ Giỏ hàng (Checkout Items Initialization):** Đọc dữ liệu các mặt hàng `isSelected = true` từ Giỏ hàng, kiểm tra tính hợp lệ và đóng băng đơn giá tại thời điểm chốt đơn.
- **FR-02: Phân nhánh Điền Thông tin, Xác thực OTP SĐT & Điền Địa chỉ Giao hàng (In-Checkout OTP & Shipping Address Selector):**
  - **Khách đã đăng nhập có SĐT:** Autofill thông tin & Địa chỉ mặc định. Nếu đổi SĐT mới ➔ Bắt buộc xác thực OTP tại chỗ.
  - **Khách đăng nhập bằng Google (Chưa có SĐT):** Bắt buộc nhập SĐT ➔ Pop-up **Xác thực OTP SMS/ZNS ngay tại chỗ** ➔ Lưu SĐT verified vào `users.phone` ➔ Nhập địa chỉ giao hàng 3 cấp.
  - **Khách vãng lai (Guest):** Nhập Họ tên, Email, SĐT ➔ Pop-up **Xác thực OTP SMS/ZNS ngay tại chỗ** (`phone_verified = true`) ➔ Nhập địa chỉ giao hàng 3 cấp.
- **FR-03: Tính Phí Vận chuyển Động theo Khu vực & Mốc Freeship (Dynamic Shipping Fee Engine):** Tính phí giao hàng dựa trên Tỉnh/Thành phố nhận hàng và tổng Subtotal (Miễn phí vận chuyển cho đơn >= 30,000,000 ₫).
- **FR-04: Áp dụng Mã Giảm Giá / Coupon Khuyến Mãi (Voucher & Discount Engine):** Ô nhập mã Voucher, kiểm tra điều kiện áp dụng real-time (giảm %, giảm tiền cố định, giới hạn mức giảm tối đa, đơn hàng tối thiểu).
- **FR-05: Quản lý Yêu cầu Xuất Hóa đơn GTGT Doanh nghiệp B2B & Cá nhân (VAT E-Invoice Engine):** Tùy chọn yêu cầu xuất hóa đơn VAT tại Checkout, tra cứu MST tự động via VietQR Tax API, bóc tách thuế GTGT (8%/10%), Autofill thông tin từ `users.business_profile` và đóng băng Snapshot thông tin Hóa đơn Điện tử.
- **FR-06: Tích hợp Thanh toán Trực tuyến VNPAY & Chuyển khoản Bank QR (Online Payment Gateway Integration):** Tạo URL chuyển hướng thanh toán VNPAY, hiển thị Mã QR VietQR với cú pháp chuyển khoản tự động, xử lý Webhook/IPN cập nhật trạng thái đơn hàng tức thì.
- **FR-07: Thanh toán Khi Nhận Hàng (COD - Cash On Delivery Engine):** Xác nhận đặt đơn thanh toán COD cho các đơn hàng có tổng giá trị nằm trong hạn mức cho phép (< 50,000,000 ₫).
- **FR-08: Khởi tạo Đơn hàng Snapshot & Giữ hàng Tồn kho (Order Snapshot & Stock Locking Guard):** Tạo bản ghi `orders` và `order_items` lưu trữ thông tin cố định, giữ khóa tồn kho (Stock Lock) trong 15 phút đối với thanh toán online.
- **🙌 Đề xuất - Thanh toán Mua Trước Trả Sau (BNPL / Installment):** Tích hợp cổng trả góp qua thẻ tín dụng hoặc đối tác BNPL (Fundiin/Kredivo).
- **🙌 Đề xuất - Hẹn Giờ Giao Hàng Theo Yêu Cầu (Scheduled Delivery Window):** Cho phép khách chọn khung giờ giao hàng mong muốn (Sáng/Chiều/Tối hoặc ngày cuối tuần).

### 1.2.2. Tính năng ngoài phạm vi (Out-Scope Features)
- Luồng Thêm/Sửa/Xóa số lượng sản phẩm trong Giỏ hàng (Do phân hệ **FRD-USR-03A / Customer Cart Management** đảm nhiệm).
- Quy trình Tư vấn, Báo giá 3D và Ký Hợp đồng Điện tử OTP cho hàng Custom (Do phân hệ **FRD-USR-04 / Custom Order & OTP Contract** đảm nhiệm).
- Tích hợp phát hành hóa đơn điện tử trực tiếp với hệ thống Thuế VNPT/MISA (Do phân hệ Backend Kế toán Admin **FRD-ADM-08** quản lý).

---

# 2. User Story & Tiêu chí nghiệm thu (Acceptance Criteria)

## US-01: Điền Thông tin, Xác thực OTP SĐT tại Checkout & Địa chỉ Giao nhận
> *Với tư cách là **Khách hàng (Guest / Google Auth / Member)**, tôi muốn nhập SĐT và xác thực OTP ngay tại Checkout nếu chưa có SĐT, sau đó điền địa chỉ nhận hàng, để đơn hàng của tôi được bảo mật và giao chính xác.*

### Tiêu chí nghiệm thu (Acceptance Criteria)
- **Scenario 1.1: Tự động Điền (Autofill) cho Khách đã Đăng nhập có SĐT Verified**
  - **Given:** Khách hàng đã đăng nhập tài khoản thường (đã xác thực SĐT) và bấm "Tiến hành thanh toán" từ Giỏ hàng.
  - **When:** Màn hình `/checkout` tải thành công.
  - **Then:** Hệ thống tự động điền Họ tên, SĐT, Email và Địa chỉ giao hàng mặc định.
  - **And:** Không yêu cầu xác thực OTP SĐT lại (trừ khi khách chủ động bấm "Sửa SĐT").

- **Scenario 1.2: Checkout cho Khách Đăng nhập bằng Google (Chưa có SĐT)**
  - **Given:** Khách hàng đăng nhập nhanh bằng Google (chỉ có Email & Avatar, chưa có SĐT trong `users`).
  - **When:** Khách hàng mở trang `/checkout`.
  - **Then:** Khối thông tin người nhận hiển thị ô nhập Số điện thoại màu vàng cảnh báo kèm nút **"Gửi mã OTP xác nhận"**.
  - **And:** Ngay khi nhập SĐT và bấm "Gửi mã OTP" ➔ Hiển thị Modal nhập mã OTP 6 số SMS/ZNS.
  - **And:** Sau khi xác thực OTP thành công ➔ Hệ thống lưu SĐT vào `users.phone` với `phone_verified = true`, đồng thời mở khóa cho phép điền Địa chỉ giao hàng 3 cấp (Tỉnh/Thành ➔ Quận/Huyện ➔ Phường/Xã ➔ Số nhà).

- **Scenario 1.3: Checkout cho Khách vãng lai (Guest Customer)**
  - **Given:** Khách vãng lai chưa đăng nhập mở trang `/checkout`.
  - **When:** Khách nhập Họ tên, Email, và Số điện thoại `0901234567`.
  - **Then:** Hệ thống kích hoạt nút **"Xác thực OTP SĐT"**. Mở Pop-up đếm ngược 180s nhập mã OTP 6 số.
  - **And:** Khi OTP xác thực thành công ➔ Đánh dấu `phone_verified = true` trong phiên Checkout ➔ Cho phép chọn Tỉnh/Thành phố ➔ Quận/Huyện ➔ Phường/Xã ➔ Số nhà chi tiết.

---

## US-02: Áp dụng Mã Giảm Giá / Voucher Khuyến Mãi
> *Với tư cách là **Khách hàng**, tôi muốn nhập mã voucher giảm giá, để tôi được hưởng ưu đãi chiết khấu trực tiếp vào tổng tiền đơn hàng.*

### Tiêu chí nghiệm thu (Acceptance Criteria)
- **Scenario 2.1: Áp dụng Mã Voucher Hợp lệ**
  - **Given:** Khách hàng có mã Voucher `DCOR500K` (Giảm 500.000 ₫ cho đơn từ 10 triệu). Tổng Subtotal của đơn hàng đang là `15.000.000 ₫`.
  - **When:** Nhập `DCOR500K` vào ô "Mã giảm giá" và bấm nút **"Áp Dụng"**.
  - **Then:** Hệ thống trả về thông báo xanh: *"Áp dụng mã DCOR500K thành công!"*.
  - **And:** Khối Tóm tắt chi phí hiển thị dòng: `Giảm giá Voucher: -500.000 ₫`, đồng thời giảm `Final_Total` đi 500.000 ₫.

---

## US-03: Chọn Phương thức Thanh toán & Đặt hàng Snapshot
> *Với tư cách là **Khách hàng**, tôi muốn chọn phương thức thanh toán linh hoạt (VNPAY, Chuyển khoản QR, COD) và chốt đặt hàng, để hoàn tất giao dịch mua nội thất.*

### Tiêu chí nghiệm thu (Acceptance Criteria)
- **Scenario 3.1: Đặt hàng Thanh toán VNPAY / VietQR**
  - **Given:** Khách hàng đã xác thực OTP SĐT thành công, chọn Phương thức "Thanh toán qua VNPAY" và bấm nút **"Đặt Hàng & Thanh Toán"**.
  - **Then:** Hệ thống tạo bản ghi Đơn hàng Snapshot (`orders.status = PENDING`, `payment_status = UNPAID`), khóa kho sản phẩm 15 phút, và chuyển hướng trực tiếp sang cổng thanh toán VNPAY (`sandbox.vnpayment.vn`).

---

## US-04: Yêu cầu Xuất Hóa đơn Tài chính GTGT (VAT E-Invoice Request)
> *Với tư cách là **Khách hàng Doanh nghiệp B2B hoặc Cá nhân mua hàng**, tôi muốn tích chọn yêu cầu xuất hóa đơn GTGT (VAT) và điền Mã số thuế ngay tại Checkout, để công ty tôi được khấu trừ thuế theo đúng quy định pháp luật.*

### Tiêu chí nghiệm thu (Acceptance Criteria)
- **Scenario 4.1: Tự động Điền (Autofill) Thông tin VAT từ Hồ sơ B2B**
  - **Given:** Khách hàng đã lưu sẵn Hồ sơ Doanh nghiệp B2B trong `users.business_profile` (MST `0312345678`, Tên Công ty *"Công ty TNHH Kiến Trúc DCOR"*).
  - **When:** Khách hàng mở màn hình Checkout và tích chọn ô **"Yêu cầu xuất hóa đơn VAT"**.
  - **Then:** Hệ thống mở rộng khối Form Hóa đơn VAT và tự động điền (Autofill) 100% các trường: Mã số thuế, Tên Công ty, Địa chỉ đăng ký kinh doanh và Email nhận hóa đơn điện tử.

- **Scenario 4.2: Tra cứu Mã số thuế Doanh nghiệp Real-time (VietQR Tax Lookup API)**
  - **Given:** Khách hàng nhập Mã số thuế mới `0101234567` vào ô nhập MST.
  - **When:** Khi con trỏ rời khỏi ô MST (Blur Event) hoặc khi bấm nút **"Tra cứu MST"**.
  - **Then:** Hệ thống gọi API Tra cứu Thuế real-time:
    - *Nếu MST hợp lệ:* Tự động điền Tên Công ty và Địa chỉ đăng ký thuế chính thức từ CSDL Tổng cục Thuế vào các ô bên dưới (ở dạng cho phép chỉnh sửa nếu cần).
    - *Nếu MST không hợp lệ hoặc không tồn tại:* Ô MST hiển thị viền đỏ kèm dòng cảnh báo: *"Mã số thuế không tồn tại hoặc sai định dạng. Vui lòng kiểm tra lại."*.

- **Scenario 4.3: Nhập Email Nhận Hóa đơn Điện tử Riêng biệt**
  - **Given:** Khách hàng muốn nhận file Hóa đơn Điện tử (.pdf & .xml) qua Email của phòng Kế toán (`ketoan@dcor.vn`) khác với Email đặt hàng cá nhân.
  - **When:** Khách nhập `ketoan@dcor.vn` vào ô "Email nhận Hóa đơn VAT".
  - **Then:** Hệ thống validate định dạng Email và lưu thông tin này vào bản ghi Snapshot `vat_invoice_request`.

- **Scenario 4.4: Bóc tách Thuế GTGT (VAT 8% / 10%) Minh bạch trong Tóm tắt Đơn hàng**
  - **Given:** Tổng giá trị đơn hàng chốt mua `Final_Total = 44.000.000 ₫` (Giá niêm yết đã bao gồm thuế GTGT 10%).
  - **When:** Khách hàng tích chọn "Yêu cầu xuất hóa đơn VAT".
  - **Then:** Bảng Tóm tắt đơn hàng hiển thị dòng bóc tách thuế minh bạch:
    - *Tiền hàng trước thuế:* `40.000.000 ₫`
    - *Thuế GTGT (VAT 10%):* `4.000.000 ₫`
    - *Tổng thanh toán (Đã gồm VAT):* `44.000.000 ₫`

---

# 3. Yêu cầu Chức năng chi tiết (Functional Requirements)

## 3.1. Yêu cầu chung (Common Requirements)

### 3.1.1. Mô hình Đóng băng Giá Snapshot (Order Snapshot Pattern)
- Khi đơn hàng được khởi tạo, hệ thống **tự động copy toàn bộ dữ liệu** tại thời điểm chốt đơn vào CSDL `orders` và `order_items`:
  - `customer_snapshot` (JSONB): Họ tên, SĐT (đã OTP Verified), Email, Địa chỉ giao hàng 3 cấp.
  - `selected_options` (JSONB): Tên sản phẩm, Ảnh thumbnail, Màu sắc, Chất liệu, Kích thước, Đơn giá chốt mua.
  - `vat_invoice_request` (JSONB): Trạng thái yêu cầu (`require_vat_invoice = true/false`), Mã số thuế (`tax_id`), Tên đơn vị (`company_name`), Địa chỉ ĐKKD (`company_address`), Email nhận HĐ (`invoice_email`), Bóc tách giá trước thuế (`pre_tax_amount`), Tiền thuế (`vat_amount`), Tỷ lệ thuế (`vat_rate = 0.08` hoặc `0.10`).

### 3.1.2. Công thức Toán học Tính toán & Bóc tách Thuế VAT (VAT Calculation Formulas)
1. **Tổng tiền Tạm tính Sản phẩm (Checkout Subtotal):**
   $$\text{Subtotal} = \sum_{i=1}^{m} \left( \text{Item}_i.\text{unit\_price} \times \text{Item}_i.\text{quantity} \right)$$

2. **Công thức Bóc tách Tiền hàng Trước Thuế (Pre-Tax Amount):**
   $$\text{Pre\_Tax\_Amount} = \frac{\text{Subtotal} - \text{Discount\_Amount}}{1 + \text{VAT\_Rate}}$$

3. **Công thức Bóc tách Tiền Thuế GTGT (VAT Amount):**
   $$\text{VAT\_Amount} = (\text{Subtotal} - \text{Discount\_Amount}) - \text{Pre\_Tax\_Amount}$$

4. **Tổng số tiền Thanh toán Cuối cùng (Final Total - Đã bao gồm VAT & Phí ship):**
   $$\text{Final\_Total} = \max\left(0, \text{Subtotal} - \text{Discount\_Amount} + \text{Shipping\_Fee}\right)$$

---

## 3.2. Bảng Ma trận Logic Ràng buộc Nghiệp vụ (Business Rules Matrices)

### Ma trận 1: Loại Khách hàng × Trạng thái SĐT × Yêu cầu OTP tại Checkout × Logic Lưu trữ

| Loại Khách Hàng | Trạng Thái SĐT Hiện Tại | Hành Vi Tại Checkout | Yêu Cầu OTP SMS/ZNS Tại Checkout | Xử Lý Sau Khi OTP Thành Công |
| --- | --- | --- | --- | --- |
| **Guest (Vãng lai)** | Chưa có | Nhập Họ tên, Email, SĐT | **BẮT BUỘC OTP** | Đánh dấu `phone_verified = true` trong Session Checkout. |
| **Google Auth User** | Chưa có (`users.phone == null`) | Nhập SĐT mới | **BẮT BUỘC OTP** | Lưu `users.phone = phone_new`, `phone_verified = true` vào CSDL. |
| **Logged-in Member** | Đã có & Verified | Autofill SĐT cũ | **Không bắt OTP** | Cho phép gửi đơn trực tiếp. |

### Ma trận 2: Yêu cầu VAT × Trạng thái Mã Số Thuế × Quy định Hóa đơn Điện tử

| Checkbox Xuất VAT | Mã Số Thuế (Tax ID) | Kết Quả Tra Cứu API Thuế | Trạng Thái Form VAT | Trạng Thái Đơn Hàng | Xuất File HĐ Điện Tử (.PDF/.XML) |
| --- | --- | --- | --- | --- | --- |
| **Unchecked** | Không nhập | N/A | Ẩn Form | Mặc định (Khách không lấy HĐ) | Không xuất HĐ công ty |
| **Checked** | Nhập MST 10/13 số | **Hợp lệ (200 OK)** | Autofill Tên Cty + Địa chỉ ĐKKD | Cho phép Đặt Hàng | Đưa vào Queue xuất HĐ Kế toán |
| **Checked** | Sai định dạng / Không có | **Lỗi (404 Not Found)** | Viền đỏ ô MST + Text cảnh báo | **Chặn bấm Đặt Hàng** | Không cho tạo đơn |

---

## 3.3. Yêu cầu Chức năng Chi tiết (Functional Requirements Details)

### FR-01: Xử lý Danh sách Sản phẩm Chốt mua từ Giỏ hàng (Checkout Items Initialization)
*(Giữ nguyên chi tiết đã chuẩn hóa ở v5.0)*

---

### FR-02: Phân nhánh Điền Thông tin, Xác thực OTP SĐT & Điền Địa chỉ Giao hàng (In-Checkout OTP & Shipping Address Selector)
*(Giữ nguyên chi tiết đã chuẩn hóa ở v5.0)*

---

### FR-03: Tính Phí Vận chuyển Động theo Khu vực & Mốc Freeship (Dynamic Shipping Fee Engine)
*(Giữ nguyên chi tiết đã chuẩn hóa ở v5.0)*

---

### FR-04: Áp dụng Mã Giảm Giá / Coupon Khuyến Mãi (Voucher & Discount Engine)
*(Giữ nguyên chi tiết đã chuẩn hóa ở v5.0)*

---

### FR-05: Quản lý Yêu cầu Xuất Hóa đơn GTGT Doanh nghiệp B2B & Cá nhân (VAT E-Invoice Engine)

- **Description:** Cung cấp tính năng thu thập thông tin pháp lý doanh nghiệp, tra cứu mã số thuế tự động qua API Tổng cục Thuế, bóc tách tỷ lệ thuế GTGT (8% hoặc 10%) và đóng đóng băng Snapshot thông tin Hóa đơn Điện tử vào đơn hàng.
- **Business Rules:**
    - **Tax ID Format Rule:** Mã số thuế Doanh nghiệp Việt Nam gồm **10 chữ số** (Công ty/Tập đoàn chính) hoặc **13 chữ số** (Chi nhánh/Đơn vị phụ thuộc có dấu gạch nối dạng `XXXXXXXXXX-XXX`).
    - **Real-time Tax API Lookup:** Khi người dùng nhập đủ 10 hoặc 13 chữ số MST ➔ Hệ thống tự động kích hoạt API tra cứu thông tin thuế (`GET /api/v1/tax-lookup?tax_id=...` tích hợp dữ liệu VietQR Tax / Masothue Data API).
    - **Auto-Fill Legal Info:** Nếu API trả về kết quả hợp lệ ➔ Hệ thống tự động điền Tên Công ty chính thức và Địa chỉ đăng ký kinh doanh vào Form VAT.
    - **VAT Inclusivity Principle:** Tất cả giá sản phẩm niêm yết trên DCOR Studio **đã bao gồm thuế GTGT (VAT)** theo quy định hiện hành. Việc tích chọn xuất hóa đơn VAT không làm tăng hay giảm tổng số tiền thanh toán `Final_Total` của Khách hàng, chỉ bóc tách tỷ lệ thuế minh bạch trên giấy tờ.
    - **Timing Limit Constraint:** Yêu cầu xuất hóa đơn VAT **BẮT BUỘC phải được chọn ngay tại thời điểm Checkout**. Hệ thống từ chối tiếp nhận yêu cầu bổ sung hóa đơn GTGT sau khi đơn hàng đã chuyển trạng thái `PROCESSING` hoặc đã hoàn tất giao hàng quá 24h.
    - **E-Invoice Email Destination:** Mặc định gửi file hóa đơn điện tử (.PDF và .XML) về Email tài khoản. Nếu khách điền ô "Email nhận Hóa đơn VAT" riêng ➔ Hệ thống gửi về Email hóa đơn riêng đó.
- **Pre-conditions:** Khách hàng ở màn hình `/checkout`, tích chọn checkbox "Yêu cầu xuất hóa đơn VAT".
- **Use Case Specification:**

    | Action (Người dùng) | System Behavior (Hệ thống) |
    | --- | --- |
    | Tích chọn checkbox **"Yêu cầu xuất hóa đơn VAT"** | 1. Mở rộng khối Form Hóa đơn VAT bên dưới.<br>2. Nếu khách đã đăng nhập có `users.business_profile` ➔ Tự động điền MST, Tên Cty, Địa chỉ ĐKKD.<br>3. Bóc tách dòng hiển thị Thuế VAT trong bảng Tóm tắt đơn hàng. |
    | Nhập Mã số thuế `0312345678` | 1. Validate cú pháp regex MST.<br>2. Gọi API tra cứu thuế real-time `GET /api/v1/tax-lookup?tax_id=0312345678`.<br>3. Điền Tên Công ty *"CÔNG TY TNHH KIẾN TRÚC DCOR"* và Địa chỉ ĐKKD. |
    | Nhập MST sai `12345` | Viền đỏ ô nhập MST, hiển thị dòng text báo lỗi: *"Mã số thuế phải gồm 10 hoặc 13 chữ số."*. Khóa nút Đặt hàng. |
    | Bỏ tích chọn checkbox VAT | Ẩn khối Form Hóa đơn VAT, gán `require_vat_invoice = false`, ẩn dòng bóc tách thuế trong bảng Tóm tắt đơn hàng. |

- **Post-conditions:** Đơn hàng được gắn cờ `require_vat_invoice = true`. Bản ghi Snapshot `vat_invoice_request` được lưu cố định trong CSDL PostgreSQL (`orders.vat_invoice_request` JSONB), sẵn sàng cho Kế toán DCOR phát hành Hóa đơn Điện tử.
- **UI Fields Matrix (Dành riêng cho Khối Form Hóa đơn VAT):**

    | Field Name | UI Component | Data Type | Mandatory | Default | Constraints / Logic |
    | --- | --- | --- | --- | --- | --- |
    | Require VAT Checkbox | Checkbox | Boolean | No | False | Toggle ẩn/hHiện toàn bộ khối Form Hóa đơn VAT. |
    | Tax ID (Mã số thuế) | Text Input + Button Tra cứu | String | Yes (Khi bật VAT) | Profile Val / Empty | 10 hoặc 13 chữ số. Tích hợp API Tra cứu Thuế real-time. |
    | Company Name (Tên Đơn vị) | Text Input | String | Yes (Khi bật VAT) | Profile Val / Empty | Tên công ty theo ĐKKD. Auto-fill từ API Tra cứu Thuế. Max 255 chars. |
    | Registered Company Address | Textarea | String | Yes (Khi bật VAT) | Profile Val / Empty | Địa chỉ trụ sở theo đăng ký thuế. Max 255 chars. |
    | Invoice Email Address | Text Input | String | Yes (Khi bật VAT) | Account Email | Email nhận file HĐ Điện tử (.pdf & .xml). Default = Email mua hàng. |
    | VAT Rate Display | Badge Label | String | Read-only | "8% / 10%" | Tự động xác định theo danh mục mặt hàng. |

---

### FR-06: Tích hợp Thanh toán Trực tuyến VNPAY & Chuyển khoản Bank QR (Online Payment Gateway Integration)
*(Giữ nguyên chi tiết đã chuẩn hóa ở v5.0)*

---

### FR-07: Thanh toán Khi Nhận Hàng (COD - Cash On Delivery Engine)
*(Giữ nguyên chi tiết đã chuẩn hóa ở v5.0)*

---

### FR-08: Khởi tạo Đơn hàng Snapshot & Giữ hàng Tồn kho (Order Snapshot & Stock Locking Guard)
*(Giữ nguyên chi tiết đã chuẩn hóa ở v5.0)*

---

## 3.4. Bảng Quy Tả Pop-up Confirm Dialogs Specification

| Mã Dialog | Tiêu Đề Dialog | Nội Dung Hiển Thị | Nút Bấm Thao Tác | Hành Vi Khi Xác Nhận |
| --- | --- | --- | --- | --- |
| **DLG-CHK-01** | *"Hết hạn thanh toán"* | *"Thời gian giữ hàng thanh toán (15 phút) đã hết. Đơn hàng của bạn đã bị hủy."* | `[Về Giỏ Hàng]` \| `[Thử Lại]` | Chuyển hướng về Giỏ hàng để thực hiện lại. |
| **DLG-CHK-02** | *"Hạn mức COD"* | *"Đơn hàng từ 50.000.000 ₫ trở lên vui lòng thanh toán trực tuyến hoặc chuyển khoản."* | `[Đã Hiểu]` | Đóng Dialog và tự động chọn phương thức VNPAY. |
| **DLG-CHK-03** | *"Biến động tồn kho"* | *"Rất tiếc! Sản phẩm '[Tên SP]' vừa có khách khác mua hết. Vui lòng kiểm tra lại giỏ."* | `[Quay Về Giỏ]` | Hủy phiên Checkout và đưa người dùng về Giỏ hàng. |
| **DLG-CHK-04** | *"Xác thực OTP SĐT Checkout"* | *"Mã OTP 6 số đã được gửi tới SĐT [Phone]. Vui lòng nhập để tiếp tục đặt hàng."* | `[Gửi lại mã]` \| `[Xác nhận OTP]` | Đánh dấu `phone_verified = true` & Mở khóa ô địa chỉ. |
| **DLG-CHK-05** | *"Cảnh báo Mã số thuế"* | *"Mã số thuế [MST] không tìm thấy trong CSDL Tổng cục Thuế. Bạn có chắc muốn dùng MST này?"* | `[Kiểm Tra Lại]` \| `[Vẫn Dùng MST Này]` | Cho phép giữ thông tin MST nhập tay để gửi Kế toán đối soát. |

---

## 3.5. Quy Tả Cấu Trúc API Payload DTO (API Technical Payload Specifications)

### 1. API Khởi tạo Đơn hàng Checkout: `POST /api/v1/orders/checkout`
```json
// Request Payload (Đầy đủ thông tin VAT & SĐT OTP Verified):
{
  "payment_method": "VNPAY", // Options: "VNPAY", "VIETQR", "COD"
  "shipping_address": {
    "recipient_name": "Nguyễn Văn A",
    "phone": "0901234567",
    "phone_verified": true, // Verified via OTP at Checkout
    "email": "nguyenvana@gmail.com",
    "province_code": "79",
    "district_code": "769",
    "ward_code": "26830",
    "street_address": "Số 123 Đường Nguyễn Huệ, Phường Bến Nghé"
  },
  "voucher_code": "DCOR500K",
  "require_vat_invoice": true,
  "vat_invoice_request": {
    "tax_id": "0312345678",
    "company_name": "CÔNG TY TNHH KIẾN TRÚC DCOR",
    "company_address": "Tầng 5, Tòa nhà DCOR Tower, TP.HCM",
    "invoice_email": "ketoan@dcor.vn",
    "pre_tax_amount": 40462963,
    "vat_rate": 0.08,
    "vat_amount": 3237037
  },
  "customer_note": "Giao hàng vào giờ hành chính, gọi trước 30 phút."
}

// Response Payload (201 Created):
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "order_id": "ord_uuid_8819",
    "order_code": "ORD-20261006-8819",
    "status": "PENDING",
    "payment_status": "UNPAID",
    "final_total": 44200000,
    "payment_url": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=4420000000&vnp_Command=pay&...",
    "stock_lock_expires_at": "2026-10-06T18:35:00Z"
  }
}
```

### 2. API Tra cứu Mã số thuế Real-time: `GET /api/v1/tax-lookup?tax_id=0312345678`
```json
// Response Payload (200 OK):
{
  "success": true,
  "data": {
    "tax_id": "0312345678",
    "company_name": "CÔNG TY TNHH KIẾN TRÚC DCOR",
    "company_address": "Số 45 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh",
    "status": "ACTIVE"
  }
}
```

---

## 3.6. Cảnh báo lỗi & Phản hồi hệ thống (Error Messages & System Feedback)

| Sự kiện / Điều kiện | Loại Phản hồi | Nội dung Thông báo | Thao tác Xử lý |
| --- | --- | --- | --- |
| SĐT Chưa Verified OTP | Modal Error / Toast | `"Vui lòng bấm 'Xác thực OTP SĐT' để tiếp tục đặt hàng."` | Rung ô SĐT, bật Modal OTP SMS/ZNS. |
| MST Không Tồn Tại | Inline Error / Dialog | `"Mã số thuế không tồn tại trên hệ thống Thuế."` | Báo đỏ ô MST, bật Dialog `DLG-CHK-05`. |
| Thiếu Email Hóa đơn | Inline Error | `"Vui lòng nhập Email nhận Hóa đơn điện tử."` | Viền đỏ ô Email Hóa đơn. |
| Voucher Hết Hạn | Inline Error | `"Mã giảm giá đã hết hạn hoặc hết lượt sử dụng."` | Viền đỏ ô nhập Voucher. |
| COD Vượt Hạn Mức | Option Alert | `"Đơn hàng từ 50tr trở lên không hỗ trợ thanh toán COD."` | Làm mờ nút COD, tự đổi sang VNPAY. |
| Đặt Hàng Thành Công | Redirect Page | `"🎉 Cảm ơn bạn đã đặt hàng tại DCOR Studio!"` | Chuyển hướng sang trang `/checkout/success`. |

---

# 4. Yêu cầu Phi chức năng (Non-Functional Requirements)

- **Performance (Hiệu năng):**
  - Thời gian tra cứu Mã số thuế Doanh nghiệp via API: **< 300ms**.
  - Thời gian khởi tạo đơn hàng Snapshot: **< 250ms**.
  - Thời gian sinh URL VNPAY / VietQR API: **< 150ms**.
- **Security & Idempotency (Bảo mật & Tính độc bản):**
  - Cơ chế Chống thanh toán lặp (Idempotency Key): Ngăn chặn việc bấm nút Đặt hàng liên tiếp tạo ra nhiều đơn hàng trùng lặp.
  - Chữ ký bảo mật SHA256 checksum kiểm tra 100% dữ liệu Callback từ VNPAY / Ngân hàng.
- **Compliance & Auditability (Tuân thủ pháp luật & Truy vết):**
  - Đảm bảo định dạng dữ liệu hóa đơn điện tử tuân thủ Thông tư 78/2021/TT-BTC và Nghị định 123/2020/NĐ-CP của Bộ Tài chính về Hóa đơn điện tử.

---

# 5. Prototype & Tài liệu liên quan (Related Documents)

- **Sơ đồ CSDL liên quan:** Bảng `orders`, `order_items`, `payment_transactions`, `promotions`, `customer_addresses`, `users`.
- **Tài liệu quy trình liên quan:**
  - [FRD - [USR-03A] Customer Cart Management.md](file:///d:/00_LEARNING/0_Study/HocChinhUEL/4_1_LapTrinhWebNangCao/thucHanh/FRD%20-%20%5BUSR-03A%5D%20Customer%20Cart%20Management.md)
  - [FRD - [USR-01] User Authentication & Profile.md](file:///d:/00_LEARNING/0_Study/HocChinhUEL/4_1_LapTrinhWebNangCao/thucHanh/FRD%20-%20%5BUSR-01%5D%20User%20Authentication%20&%20Profile.md)
  - [bpmn_purchase_process.md](file:///d:/00_LEARNING/0_Study/HocChinhUEL/4_1_LapTrinhWebNangCao/DoAn/Dev/dcor_Angular/bpmn_purchase_process.md)
