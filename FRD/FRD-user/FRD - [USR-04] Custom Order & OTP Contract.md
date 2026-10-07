# 📄 FRD-USR-04: PHÂN HỆ TÙY BIẾN SẢN PHẨM & KÝ HỢP ĐỒNG ĐIỆN TỬ OTP (CUSTOMER CUSTOM ORDER & E-CONTRACT)

* **Mã Chức Năng:** `FRD-USR-04`
* **Phân Hệ:** Khách Hàng (Storefront Portal)
* **Phiên Bản:** 2.0 (Chuẩn Hóa BPMN 2.0 & Phân Nhánh OTP)
* **Trạng Thái:** Draft / Approved

---

## 🎯 1. MỤC TIÊU & PHẠM VI CHỨC NĂNG

### 1.1. Mục tiêu:
Cho phép Khách hàng phát sinh nhu cầu tùy biến sản phẩm nội thất (kích thước, chất liệu, màu sắc) ngay trên Trang Chi Tiết Sản Phẩm (PDP), xác thực thông tin chính chủ qua OTP SMS/ZNS, xem Báo giá 3D từ KTS và tiến hành **Ký Hợp đồng Điện tử Custom 3 bước bằng mã OTP** trước khi đặt cọc (30-50%).

### 1.2. Phạm vi:
- Form đăng ký Custom trên PDP (Bàn/Ghế/Sofa/Khác).
- Phân nhánh Tự động điền (Autofill) & Bắt buộc OTP SMS/ZNS xác minh SĐT.
- Trang Theo dõi Trạng thái Yêu cầu Custom (`/account/custom-requests`).
- Màn hình Xử lý Duyệt & Ký Hợp đồng Điện tử Custom 3 bước.
- Tích hợp Thanh toán Đặt cọc 30-50% qua Cổng VNPAY / Chuyển khoản Bank QR.

---

## 👤 2. CÁC VAI TRÒ THAM GIA (ACTORS)
- **Khách hàng đã đăng nhập (Logged-in Customer):** Được tự động điền thông tin profile.
- **Khách vãng lai (Guest Customer):** Yêu cầu nhập đầy đủ Họ tên, Email, SĐT, CCCD/MST và bắt buộc xác thực OTP.
- **Hệ thống Storefront (System Service):** Tự động gửi OTP, tính tiền cọc, chuyển trạng thái và tạo bản ghi Snapshot.

---

## 📋 3. BẢNG MÔ TẢ CHI TIẾT LUỒNG CHỨC NĂNG (FUNCTIONAL WORKFLOW)

| Mã Bước | Tên Bước | Tác Giả (Actor) | Hành Động & Xử Lý Hệ Thống | Dữ Liệu Input | Dữ Liệu Output |
| :---: | :--- | :--- | :--- | :--- | :--- |
| **UC04-01** | Bấm nút Custom sản phẩm | Khách hàng | Khách bấm nút "Custom sản phẩm" trên trang PDP. Modal/Form tùy biến hiển thị. | `product_id` | Form Customizer UI |
| **UC04-02** | Nhập thuộc tính Custom | Khách hàng | Khách chọn thuộc tính (Loại SP: Bàn/Ghế/Khác), nhập mô tả chi tiết, khoảng budget & upload ảnh minh họa. | Thuộc tính, Mô tả, Budget, File ảnh | Form dữ liệu custom sơ bộ |
| **UC04-03** | Phân nhánh Autofill / OTP | Hệ thống | • **Đã đăng nhập:** Autofill Họ tên, SĐT, Email từ `users`. Nếu đổi SĐT mới ➔ Yêu cầu xác thực OTP.<br>• **Khách vãng lai:** Bắt buộc điền thông tin & xác thực OTP SĐT. | Token / SĐT nhập | Mã OTP 6 số gửi SMS/ZNS |
| **UC04-04** | Nhập OTP xác thực SĐT | Khách hàng | Khách nhập mã OTP 6 số nhận trên điện thoại. Hệ thống kiểm tra tính hợp lệ. | Mã OTP 6 số | SĐT Verified (`phone_verified = true`) |
| **UC04-05** | Gửi Yêu cầu Custom | Khách hàng | Bấm nút "Gửi Yêu Cầu Custom". Hệ thống khởi tạo bản ghi `design_requests` (status = `PENDING`). | Dữ liệu Form & Customer Info | Record `design_requests` (PENDING) |
| **UC04-06** | Theo dõi Yêu cầu | Khách hàng | Khách vào mục "Quản lý Yêu cầu Custom" để theo dõi tiến độ xử lý từ KTS/Sales. | `request_id` | Trang danh sách & chi tiết request |
| **UC04-07** | Nhận Báo giá & 3D | Khách hàng | Hệ thống thông báo khi KTS/Sales hoàn thành Phối cảnh 3D & Báo giá (`design_requests.status = QUOTED`). | Notification / Email | Link Báo giá 3D & Draft Hợp đồng |
| **UC04-08** | **[Ký HĐ Step 1]** Chấp nhận Báo giá | Khách hàng | Khách xem bản vẽ 3D & Bảng phân tích chi phí. Khách bấm nút **"Chấp Nhận Báo Giá"**. | `proposal_id` | Chuyển sang màn hình Xem Hợp đồng |
| **UC04-09** | **[Ký HĐ Step 2]** Xem Hợp đồng | Khách hàng | Màn hình hiển thị Hợp đồng Điện tử Custom (Điều khoản cọc 30-50%, thời gian sản xuất, bảo hành). Khách đọc kỹ. | Draft Hợp đồng | Hợp đồng đã được xác nhận xem |
| **UC04-10** | **[Ký HĐ Step 3]** OTP Ký Hợp đồng | Khách hàng | Khách bấm "Ký Hợp Đồng Custom", nhập Mã OTP xác thực ký Hợp đồng. Hợp đồng có hiệu lực pháp lý (`ACCEPTED`). | Mã OTP xác nhận ký | Hợp đồng đã ký chính thức |
| **UC04-11** | Thanh toán Đặt cọc | Khách hàng | Hệ thống tính số tiền cọc (30-50%). Khách chọn VNPAY/Bank QR và hoàn tất giao dịch cọc. | Tiền cọc (30-50%) | Giao dịch cọc thành công ➔ Đơn chuyển `CONFIRMED` |

---

## 🔒 4. QUY RÀNG BUỘC NGHIỆP VỤ (BUSINESS RULES)

1. **Ràng buộc OTP SĐT:**
   - Mã OTP có hiệu lực trong 180 giây. Sai quá 5 lần sẽ khóa gửi OTP trong 15 phút.
   - SĐT đã xác thực thành công mới được bấm nút "Gửi Yêu Cầu Custom".
2. **Ràng buộc Hợp đồng Điện tử Custom:**
   - Hợp đồng bắt buộc phải qua đủ 3 bước: `Chấp nhận Báo giá` ➔ `Xem Hợp đồng` ➔ `Nhập OTP xác thực Ký`.
   - Sau khi ký bằng OTP, bản ghi `design_proposals` chuyển trạng thái `ACCEPTED` và đính kèm dấu thời gian `signed_at` + `signed_ip`.
3. **Ràng buộc Đặt cọc:**
   - Số tiền đặt cọc tối thiểu là 30% và tối đa 50% tổng giá trị hợp đồng custom (do Admin/Sales quy định trong báo giá).
   - Nếu thanh toán cọc không thành công sau 24h, yêu cầu custom giữ trạng thái chờ cọc hoặc tự động hủy.
