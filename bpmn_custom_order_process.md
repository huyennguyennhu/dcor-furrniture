# Bảng Mô Tả Quy Trình BPMN 2.0 - Quy Trình Đặt Mua & Tùy Biến Sản Phẩm Custom (Đầy Đủ UX, Phân Định Vai Trò & Hợp Đồng Điện Tử)

Tài liệu này chuẩn hóa toàn bộ **Quy trình Mua & Tùy Biến Sản Phẩm Custom**, phân định rõ vai trò trách nhiệm của từng bộ phận nội bộ DCOR (**Ban Quản lý / Admin**, **Bộ phận Thiết kế**, **Bộ phận Sales**, **Hệ thống**, **Xưởng/Kho**), bổ sung chi tiết cơ chế **Tự động điền thông tin người dùng (Autofill)**, **Phân nhánh OTP cho Khách đăng nhập vs Khách vãng lai**, và quy trình **Phê duyệt, Soạn thảo & Ký Hợp đồng Điện tử Custom 3 bước**.

---

## 🎯 Phân Định Trách Nhiệm Chi Tiết Nội Bộ DCOR Studio:

1. **Ban Quản lý / Admin (Manager / Admin):**
   - Tiếp nhận Yêu cầu Custom mới từ hệ thống (`design_requests`) ➔ **Phân công công việc** cho KTS Thiết kế và NV Sales.
   - **Kiểm tra & Phê duyệt (Approve)** Bản vẽ 3D + Báo giá + Draft Hợp đồng Điện tử do Thiết kế và Sales lập trước khi phát hành tới Khách hàng.
   - Bàn giao đơn hàng custom hoàn thiện cho Đội xe Logistics giao hàng.

2. **Bộ phận Thiết kế (KTS / Interior Designer):**
   - Xem chi tiết thuộc tính custom, ảnh minh họa & khoảng budget của Khách hàng.
   - **Lập Bản vẽ phối cảnh 3D** & Bóc tách thông số kỹ thuật (vật liệu, số lượng m2/m3, chi phí vật tư dự kiến).

3. **Bộ phận Sales (Tư vấn Bán hàng):**
   - Tiếp nhận thông số kỹ thuật từ KTS ➔ **Tính toán chi phí & Lập Bản Báo Giá chi tiết** (`design_proposals`).
   - Kiểm tra thông tin cá nhân/pháp lý của Khách ➔ **Soạn thảo Hợp đồng Điện tử Custom** (thời gian sản xuất, tiến độ cọc 30-50%, bảo hành, điều khoản chống hủy đơn).
   - Trao đổi, tư vấn & tiếp nhận yêu cầu điều chỉnh (feedback) từ Khách hàng.

---

## 🏗️ Cấu Trúc 4 Pools & Lanes Vận Hành (5 Lanes cho DCOR Enterprise)

1. **Pool: Khách hàng (Customer / Enterprise Representative)**
   - Lane: `Khách hàng (Customer / B2B Representative)`
2. **Pool: Doanh nghiệp DCOR Studio (Enterprise)** - 5 Lanes phân định rõ ràng:
   - `Hệ thống Storefront & Customizer Engine (System Service)`: Tự động Autofill profile, gửi OTP SMS/ZNS xác minh chính chủ, khởi tạo request, cập nhật status, tính tiền cọc, tạo đơn Snapshot.
   - `Ban Quản lý / Admin (Manager / Admin)`: Tiếp nhận yêu cầu, phân công công việc, phê duyệt Báo giá & Draft Hợp đồng, điều phối vận chuyển.
   - `Bộ phận Thiết kế (KTS / Interior Designer)`: Nghiên cứu phương án, vẽ phối cảnh 3D, lập thông số kỹ thuật vật liệu.
   - `Bộ phận Sales (Tư vấn Bán hàng)`: Lập Báo giá chi tiết, Soạn thảo Hợp đồng Điện tử đi kèm, tư vấn & xử lý feedback của Khách.
   - `Bộ phận Sản xuất & Quản lý Kho (Manufacturing & Warehouse)`: Gia công sản xuất theo hợp đồng custom, kiểm định QC tại xưởng, đóng gói bảo vệ.
3. **Pool: Cổng Thanh Toán & Xác Thực (VNPAY / Bank / OTP SMS Gateway)** - Xác thực OTP chính chủ & Thanh toán cọc (30-50%).
4. **Pool: Đối Tác Vận Chuyển & Lắp Đặt (Logistics & Assembly Team)** - Vận chuyển xe tải, lắp đặt tận nơi & Nghiệm thu.

---

## 📋 Bảng Chi Tiết Luồng Quy Trình BPMN 2.0 (Custom Furniture Contract & OTP Verification Flow)

| ID | Pool | Lane / Người thực hiện | Bước / Nội dung | Loại BPMN / Task Chi Tiết | Gateway Type | Điều kiện / Trigger | Input | Output | Luồng tiếp theo |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **E1** | Khách hàng | Khách hàng | Khách xem chi tiết sản phẩm nhưng thấy chưa hoàn toàn đáp ứng nhu cầu (cần điều chỉnh) | **Start Event (None)** | — | Khách xem sản phẩm nhưng thiếu/chưa ưng kích thước, màu sắc, chất liệu có sẵn | — | Nhu cầu điều chỉnh sản phẩm custom phát sinh | T1 |
| **T1** | Khách hàng | Khách hàng | Nhấn nút "Custom sản phẩm" trên trang Chi Tiết Sản Phẩm | **User Task 👤** | — | Bấm nút Custom sản phẩm | Product ID | Form / Modal tùy chỉnh hiển thị | T2 |
| **T2** | Khách hàng | Khách hàng | Lựa chọn Thuộc tính muốn chỉnh sửa (Bàn/Ghế/Khác) | **User Task 👤** | — | Mở Form Custom | Loại SP (Bàn: Chất liệu, Cao, Rộng / Ghế: Chân, Vải/Da / Khác) | Thuộc tính custom đã chọn | T3 |
| **T3** | Khách hàng | Khách hàng | Nhập Mô tả chi tiết, Khoảng giá chi trả & Upload Ảnh minh họa | **User Task 👤** | — | Nhập thông tin custom | Mô tả custom, Khoảng giá budget, Ảnh/Sơ đồ upload | Yêu cầu custom sơ bộ | G0.1 |
| **G0.1** | Doanh nghiệp DCOR Studio | Hệ thống Storefront & Customizer Engine (System Service) | Khách hàng đã đăng nhập hay là Khách vãng lai? | **Gateway** | **XOR (Exclusive)** | Đã đăng nhập / Khách vãng lai (Guest) | Token đăng nhập `users.id` | — | **Đã đăng nhập**: T3.5A<br>**Khách vãng lai**: T3.5B |
| **T3.5A** | Doanh nghiệp DCOR Studio | Hệ thống Storefront & Customizer Engine (System Service) | Tự động điền (Autofill) Thông tin cá nhân từ Hồ sơ `users` | **Service Task ⚙️ (Automated)** | — | Khách đã đăng nhập | Dữ liệu `users` profile (Họ tên, SĐT, Email, Địa chỉ) | Form điền sẵn thông tin | G0.2 |
| **G0.2** | Doanh nghiệp DCOR Studio | Hệ thống Storefront & Customizer Engine (System Service) | Khách có thay đổi Số điện thoại đăng ký không? | **Gateway** | **XOR (Exclusive)** | Giữ nguyên SĐT cũ / Thay đổi SĐT mới | SĐT trong Form vs `users.phone` | — | **Giữ nguyên SĐT**: T4<br>**Đổi SĐT mới**: T3.6 |
| **T3.5B** | Khách hàng | Khách hàng | Nhập đầy đủ Thông tin cá nhân / Pháp lý (Họ tên, SĐT, Email, CCCD/MST, Địa chỉ) | **User Task 👤** | — | Khách vãng lai mua hàng | Thông tin nhập tay | Dữ liệu thông tin cá nhân vãng lai | T3.6 |
| **T3.6** | Doanh nghiệp DCOR Studio | Hệ thống Storefront & Customizer Engine (System Service) | Gửi Mã OTP SMS / Zalo ZNS xác minh SĐT | **Service Task ⚙️ (Automated)** | — | Đổi SĐT mới hoặc Khách vãng lai | SĐT cần xác minh | Mã OTP 6 số gửi về máy Khách | M1.1 *(Message Flow)* |
| **M1.1** | Khách hàng | Khách hàng | Nhận Mã OTP trên điện thoại & Nhập xác nhận | **Message Catch Event 📥** | — | OTP gửi về máy | Mã OTP 6 số | Khách xác nhận OTP | G0 |
| **G0** | Doanh nghiệp DCOR Studio | Hệ thống Storefront & Customizer Engine (System Service) | Mã OTP xác minh SĐT có khớp không? | **Gateway** | **XOR (Exclusive)** | OTP Khớp / OTP Sai hoặc hết hạn | Mã OTP nhập | — | **OTP Khớp**: T4<br>**OTP Sai**: T3.6 |
| **T4** | Khách hàng | Khách hàng | Nhấn nút "Gửi Yêu Cầu Custom" | **User Task 👤** | — | SĐT đã xác thực thành công | Dữ liệu Form custom & Thông tin người gửi | Yêu cầu custom chính thức gửi Hệ thống | M1 *(Message Flow)* |
| **M1** | Doanh nghiệp DCOR Studio | Hệ thống Storefront & Customizer Engine (System Service) | Tiếp nhận Yêu cầu Custom chính thức từ Khách hàng | **Message Catch Event 📥** | — | Nhận Message từ Khách hàng | Yêu cầu custom từ PDP | Yêu cầu được ghi nhận | T5 |
| **T5** | Doanh nghiệp DCOR Studio | Hệ thống Storefront & Customizer Engine (System Service) | Tự động tạo Yêu cầu `design_requests` đính kèm Thông tin Khách hàng | **Service Task ⚙️ (Automated)** | — | — | Product ID, Attributes, Description, Budget, Images, Customer Info, SĐT Verified | Bản ghi `design_requests` (PENDING) & Bắn thông báo Admin Queue | M2 *(Message Flow)* |
| **T6** | Khách hàng | Khách hàng | Theo dõi Trạng thái yêu cầu trong mục "Quản lý Yêu cầu Custom" | **User Task 👤 & Service Task ⚙️** | — | Yêu cầu đã tạo | Trang `account/custom-requests` | Tiến độ xử lý yêu cầu hiển thị | (Theo dõi bất đồng bộ) |
| **M2** | Doanh nghiệp DCOR Studio | Ban Quản lý / Admin (Manager / Admin) | Bắn thông báo Yêu cầu Custom mới lên Admin Dashboard Queue | **Message Catch Event 📥** | — | `design_requests` mới tạo | Mã yêu cầu custom | Lệnh xử lý tư vấn | T7.1 |
| **T7.1** | Doanh nghiệp DCOR Studio | Ban Quản lý / Admin (Manager / Admin) | Admin tiếp nhận Yêu cầu Custom & Phân công công việc cho KTS + Sales | **User Task 👤 (Human Admin)** | — | Nhận yêu cầu custom mới | Thông tin Yêu cầu Custom | Phân công KTS vẽ 3D & Sales phụ trách tư vấn | T7.2 |
| **T7.2** | Doanh nghiệp DCOR Studio | Bộ phận Thiết kế (KTS / Interior Designer) | **KTS xem yêu cầu, Lập Bản vẽ Phối cảnh 3D & Bóc tách thông số kỹ thuật** | **User Task 👤 (Human KTS)** | — | Được Admin phân công | Yêu cầu custom, Ảnh minh họa, Khoảng budget | Bản vẽ 3D & Ma trận thông số kỹ thuật vật liệu | T8.1 |
| **T8.1** | Doanh nghiệp DCOR Studio | Bộ phận Sales (Tư vấn Bán hàng) | **Sales nhận thông số từ KTS ➔ Tính toán chi tiết & Lập Bản Báo Giá** | **User Task 👤 (Human Sales)** | — | KTS hoàn thành 3D | Bản vẽ 3D, Thông số vật liệu | Bản Báo giá chi tiết `design_proposals` (`items_detail` JSONB) | T8.2 |
| **T8.2** | Doanh nghiệp DCOR Studio | Bộ phận Sales (Tư vấn Bán hàng) | **Sales kiểm tra thông tin Khách ➔ Soạn thảo Draft Hợp đồng Điện tử Custom** | **User Task 👤 (Human Sales)** | — | Báo giá tạo xong | Thông tin Khách, Tổng giá trị đơn, Tiến độ cọc | Draft Hợp đồng Điện tử Custom (điều khoản, thời gian sản xuất) | G1.0 |
| **G1.0** | Doanh nghiệp DCOR Studio | Ban Quản lý / Admin (Manager / Admin) | Admin Kiểm tra & Phê duyệt Bản vẽ 3D, Báo giá & Draft Hợp đồng | **Gateway** | **XOR (Exclusive)** | Duyệt phát hành / Yêu cầu KTS/Sales sửa | 3D, Báo giá, Draft Hợp đồng | — | **Đã duyệt**: T9<br>**Yêu cầu sửa**: T7.2 |
| **T9** | Doanh nghiệp DCOR Studio | Hệ thống Storefront & Customizer Engine (System Service) | Tự động cập nhật `design_requests.status = QUOTED` & Gửi Email/SMS phát hành | **Send Task ✉️ (Automated)** | — | Admin đã duyệt proposal & Hợp đồng | Mã proposal, Email Khách, Link 3D & Hợp đồng | Email/SMS đính kèm link Báo giá & Draft Hợp đồng đã gửi | M3 *(Message Flow)* |
| **M3** | Khách hàng | Khách hàng | Nhận Báo giá & Draft Hợp đồng trong "Quản lý Yêu cầu Custom" | **Message Catch Event 📥** | — | Nhận Email / Thông báo ứng dụng | Báo giá, Bản vẽ 3D & Draft Hợp đồng | Khách xem Báo giá trong trang Account | G1 |
| **G1** | Khách hàng | Khách hàng | Khách hàng Đồng ý hay Yêu cầu chỉnh sửa Báo giá / 3D / Hợp đồng? | **Gateway** | **XOR (Exclusive)** | Đồng ý / Yêu cầu sửa / Hủy | Báo giá & Draft Hợp đồng | — | **Đồng ý**: T13.1<br>**Yêu cầu sửa**: T10<br>**Hủy đơn**: T11 |
| **T10** | Khách hàng | Khách hàng | Gửi yêu cầu điều chỉnh kích thước / chất liệu / điều khoản hợp đồng | **User Task 👤** | — | Muốn đổi phương án | Ghi chú yêu cầu sửa | Yêu cầu sửa gửi Sales & KTS | M4 *(Message Flow)* |
| **M4** | Doanh nghiệp DCOR Studio | Bộ phận Sales (Tư vấn Bán hàng) | Nhận phản hồi yêu cầu điều chỉnh từ Khách & Trao đổi với KTS | **Message Catch Event 📥** | — | Khách gửi feedback sửa | Yêu cầu sửa đổi | Lệnh chỉnh sửa bản vẽ / Hợp đồng | (Quay lại **T7.2**) |
| **T11** | Khách hàng | Khách hàng | Bấm nút "Hủy yêu cầu báo giá" | **User Task 👤** | — | Không muốn đặt hàng nữa | Lý do hủy | Yêu cầu hủy gửi Hệ thống | T12 |
| **T12** | Doanh nghiệp DCOR Studio | Hệ thống Storefront & Customizer Engine (System Service) | Tự động cập nhật `design_requests.status = CANCELLED` | **Service Task ⚙️ (Automated)** | — | Khách bấm Hủy | Mã yêu cầu | Yêu cầu đã đóng | E3 |
| **T13.1** | Khách hàng | Khách hàng | **[Bước 1] Bấm nút "Chấp Nhận Báo Giá"** | **User Task 👤** | — | Khách hài lòng với 3D & Báo giá | Mã proposal | Tín hiệu chấp nhận báo giá | T13.2 |
| **T13.2** | Khách hàng | Khách hàng | **[Bước 2] Xem & Kiểm tra Hợp Đồng Điện Tử Custom** | **User Task 👤** | — | Sau khi chấp nhận báo giá | Draft Hợp đồng điện tử, Điều khoản cọc 30-50% | Hợp đồng đã được xem | T13.3 |
| **T13.3** | Khách hàng | Khách hàng | **[Bước 3] Nhập OTP SMS & Bấm "Xác Nhận & Ký Hợp Đồng Custom"** | **User Task 👤 & Service Task ⚙️** | — | Khách đọc xong hợp đồng | Mã OTP xác nhận ký | Hợp đồng custom đã ký chính thức (`design_proposals.status = ACCEPTED`) | T14 |
| **T14** | Doanh nghiệp DCOR Studio | Hệ thống Storefront & Customizer Engine (System Service) | Tự động tính Số tiền Đặt cọc bắt buộc (Tối thiểu 30% - 50%) | **Service Task ⚙️ (Automated)** | — | Hợp đồng custom đã ký | Tổng tiền hợp đồng `total_estimated_price` | Tiền cọc bắt buộc (30% - 50%) & Mã giao dịch cọc | T15 |
| **T15** | Khách hàng | Khách hàng | Chọn PTTT Cọc (VNPAY / Bank Transfer) & Nhấn "Thanh toán Đặt cọc" | **User Task 👤** | — | Hợp đồng đã ký có hiệu lực | Phương thức cọc | Yêu cầu thanh toán cọc gửi Cổng thanh toán | M5 *(Message Flow)* |
| **M5** | Cổng Thanh Toán Trực Tuyến | VNPAY / MOMO / Bank Transfer | Tiếp nhận yêu cầu giao dịch thanh toán tiền cọc | **Message Catch Event 📥** | — | Chuyển hướng thanh toán | Mã đơn, Số tiền cọc | Yêu cầu giao dịch cọc | T16 |
| **T16** | Cổng Thanh Toán Trực Tuyến | VNPAY / MOMO / Bank Transfer | Xử lý giao dịch cọc với Ngân hàng | **Service Task ⚙️ (3rd Party Auto)** | — | — | Thông tin thẻ/QR Khách | Kết quả giao dịch cọc (Thành công/Thất bại) | M6 *(Message Flow)* |
| **M6** | Doanh nghiệp DCOR Studio | Hệ thống Storefront & Customizer Engine (System Service) | Nhận Webhook / Callback kết quả thanh toán cọc | **Message Catch Event 📥** | — | Cổng thanh toán callback | IPN Payload tiền cọc | Kết quả cọc đã xác minh | G2 |
| **G2** | Doanh nghiệp DCOR Studio | Hệ thống Storefront & Customizer Engine (System Service) | Giao dịch đặt cọc có thành công không? | **Gateway** | **XOR (Exclusive)** | Đã cọc thành công / Thất bại | Kết quả cọc | — | **Thành công**: T18<br>**Thất bại**: T17 |
| **T17** | Doanh nghiệp DCOR Studio | Hệ thống Storefront & Customizer Engine (System Service) | Tự động báo lỗi thanh toán cọc & Yêu cầu thử lại | **Service Task ⚙️ (Automated)** | — | Cọc thất bại | Mã giao dịch | Thông báo lỗi cọc gửi KH | (Quay lại **T15**) |
| **T18** | Doanh nghiệp DCOR Studio | Hệ thống Storefront & Customizer Engine (System Service) | Khởi tạo Đơn hàng Custom Snapshot (`orders` & `order_items`) | **Script Task 📜 (Automated)** | — | Đã cọc thành công | Customer Snapshot, Proposal Items JSONB, Hợp đồng đã ký | Tạo bản ghi `orders` (`status = CONFIRMED`, `payment_status = PARTIAL_PAID`) | M7 *(Message Flow)* |
| **M7** | Doanh nghiệp DCOR Studio | Bộ phận Sản xuất & Quản lý Kho | Bắn Lệnh sản xuất hàng Custom vào Xưởng | **Message Catch Event 📥** | — | Đơn hàng cọc thành công | Đơn custom CONFIRMED, Bản vẽ 3D, Hợp đồng | Lệnh sản xuất tại xưởng | T19 |
| **T19** | Doanh nghiệp DCOR Studio | Bộ phận Sản xuất & Quản lý Kho | Nhập vật liệu custom & Tiến hành gia công đóng bọc nội thất | **Manual Task ✋ (Human Worker)** | — | Nhận lệnh sản xuất | Gỗ sồi, Da bọc custom, Bản vẽ 3D | Sản phẩm mộc/thô đã gia công | T20 |
| **T20** | Doanh nghiệp DCOR Studio | Bộ phận Sản xuất & Quản lý Kho | Cập nhật tiến độ sản xuất (`PROCESSING`) & Đính kèm ảnh QC | **User Task 👤 & Service Task ⚙️** | — | Đang gia công tại xưởng | Tiến độ xưởng, Ảnh thực tế | Cập nhật `orders.status = PROCESSING` & Bắn ảnh tiến độ cho KH | G3 |
| **G3** | Doanh nghiệp DCOR Studio | Bộ phận Sản xuất & Quản lý Kho | Sản phẩm custom có đạt tiêu chuẩn kiểm định chất lượng (QC)? | **Gateway** | **XOR (Exclusive)** | Đạt QC / Không đạt QC (Lỗi đường may, sai màu da) | Kết quả kiểm định QC | — | **Đạt QC**: T22<br>**Không đạt QC**: T21 |
| **T21** | Doanh nghiệp DCOR Studio | Bộ phận Sản xuất & Quản lý Kho | Tiến hành chỉnh sửa / Bọc lại hàng bị lỗi tại xưởng | **Manual Task ✋ (Human Worker)** | — | Lỗi kiểm định QC | Biên bản lỗi QC | Sản phẩm đã khắc phục xong | (Quay lại **T20**) |
| **T22** | Doanh nghiệp DCOR Studio | Bộ phận Sản xuất & Quản lý Kho | Đóng gói chống sốc/bọc màng PE & Bấm "Sẵn sàng giao hàng" | **Manual ✋ & User Task 👤** | — | Đạt chuẩn QC | Sản phẩm custom hoàn thiện | Kiện hàng custom đóng gói, Bắn tín hiệu sẵn sàng giao | T23 |
| **T23** | Doanh nghiệp DCOR Studio | Ban Quản lý / Admin (Manager / Admin) | Bàn giao kiện hàng custom cho Đội xe & Lên lịch giao | **User Task 👤 (Human Admin)** | **User Task 👤 (Human Admin)** | Hàng đóng gói xong | Mã đơn custom, Địa chỉ Khách | Cập nhật `orders.status = SHIPPED` + Bắn Email lịch giao cho KH | M8 *(Message Flow)* |
| **M8** | Đối Tác Vận Chuyển & Lắp Đặt | Logistics & Assembly Team | Nhận kiện hàng custom & Sơ đồ vị trí lắp đặt từ DCOR | **Message Catch Event 📥** | — | Đơn chuyển SHIPPED | Kiện hàng custom, Bản vẽ 3D bố trí | Lệnh vận chuyển & lắp đặt tận nơi | T24 |
| **T24** | Đối Tác Vận Chuyển & Lắp Đặt | Logistics & Assembly Team | Vận chuyển tận nơi, đưa lên tầng & Lắp đặt hoàn thiện theo bản vẽ 3D | **Manual Task ✋ (Human 3rd/Fleet)** | — | Đến nhà Khách | Kiện hàng, Dụng cụ lắp đặt | Sản phẩm custom được lắp hoàn thiện tại phòng | T25 |
| **T25** | Khách hàng | Khách hàng | Khách cùng KTS/Shipper Kiểm tra & Nghiệm thu thực tế | **User Task 👤** | — | Lắp đặt xong | Sản phẩm đã lắp, Bản vẽ 3D, Hợp đồng | Biên bản nghiệm thu thực tế | G4 |
| **G4** | Khách hàng | Khách hàng | Sản phẩm custom lắp đặt có Đạt nghiệm thu không? | **Gateway** | **XOR (Exclusive)** | Đạt nghiệm thu / Không đạt (Trầy xước do vận chuyển) | Biên bản nghiệm thu | — | **Đạt**: T27<br>**Không đạt**: T26 |
| **T26** | Đối Tác Vận Chuyển & Lắp Đặt | Logistics & Assembly Team | Ghi nhận sự cố & Kích hoạt tiến trình khắc phục/bảo hành | **Manual ✋ & User Task 👤** | — | Khách không hài lòng | Biên bản sự cố | Yêu cầu xử lý sự cố gửi Xưởng | E3 |
| **T27** | Khách hàng | Khách hàng | Ký Biên bản nghiệm thu & Thanh toán nốt số tiền còn lại (50%-70%) | **User Task 👤** | — | Đạt nghiệm thu | Tiền nốt (COD / QR Bank) | Biên bản đã ký & Tiền nấc cuối đã trả | M9 *(Message Flow)* |
| **M9** | Doanh nghiệp DCOR Studio | Hệ thống Storefront & Customizer Engine (System Service) | Nhận xác nhận hoàn tất & Thanh toán nấc cuối từ Shipper | **Message Catch Event 📥** | — | Shipper báo đã thu đủ tiền | Xác nhận thu nấc cuối | Tín hiệu hoàn tất đơn custom | T28 |
| **T28** | Doanh nghiệp DCOR Studio | Hệ thống Storefront & Customizer Engine (System Service) | Tự động cập nhật `orders.status = DELIVERED`, `payment_status = PAID` | **Service Task ⚙️ (Automated)** | — | Đã nghiệm thu & thu đủ tiền | Mã đơn custom | Cập nhật đơn hoàn tất thành công | E2 |
| **E2** | Doanh nghiệp DCOR Studio | Hệ thống Storefront & Customizer Engine (System Service) | Quy trình đơn hàng custom hoàn tất thành công | **End Event (None)** | — | Giao hàng & Nghiệm thu xong | — | Đơn hàng custom hoàn tất | — |
| **E3** | Doanh nghiệp DCOR Studio | Hệ thống Storefront & Customizer Engine (System Service) | Quy trình dừng (Hủy yêu cầu / Lỗi cọc / Sự cố không khắc phục) | **End Event (None)** | — | Hủy hoặc Sự cố | — | Quy trình dừng | — |

---

## 🔄 Sơ Đồ Chi Tiết Luồng Tự Động Điền & Phân Nhánh Xác Thực OTP

```text
               +----------------------------------+
               | Khách chọn Custom SP trên PDP    |
               +----------------------------------+
                                |
                                v
               +----------------------------------+
               |  G0.1: Đã Đăng Nhập Hệ Thống?    |
               +----------------------------------+
                     /                      \
             Có (User)                     Không (Guest)
                   /                          \
  +-------------------------------+   +-------------------------------+
  | T3.5A: Autofill profile       |   | T3.5B: Nhập Họ tên, Email,   |
  | (Họ tên, SĐT, Email, Address) |   | SĐT, CCCD/MST, Địa chỉ        |
  +-------------------------------+   +-------------------------------+
                 |                                    |
                 v                                    |
  +-------------------------------+                   |
  | G0.2: Thay đổi SĐT cũ không?  |                   |
  +-------------------------------+                   |
      /                       \                       |
  Có (Đổi SĐT)           Không (Giữ SĐT)              |
    /                           \                     |
   v                             v                    v
+-----------------------------------+     +-----------------------------------+
| T3.6: Bắt buộc gửi mã OTP SMS/ZNS |     | T4: Cho phép nhấn nút             |
| & Khách nhập xác nhận thành công  | --> | "Gửi Yêu Cầu Custom"              |
+-----------------------------------+     +-----------------------------------+
                                                            |
                                                            v
                                          +-----------------------------------+
                                          | T5: Khởi tạo `design_requests`    |
                                          | status = PENDING                  |
                                          +-----------------------------------+
```
