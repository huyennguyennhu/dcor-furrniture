# Bộ Test Case: Yêu Cầu Đổi Trả (Order Returns)

* **Mã Phân hệ:** ADM-ORD-RETURNS
* **Tên Màn hình:** Quản lý Yêu Cầu Đổi Trả Hàng (Order Returns & QC Inspection)
* **Đường dẫn (URL):** `/admin/orders/returns`
* **Tài liệu tham chiếu:** FRD - [ADM-Master] Order, Custom Request, Return & Warranty Management (User Story US-03)
* **Đối tượng sử dụng:** Chuyên viên CSKH, Kỹ sư QC Xưởng, Kế toán, QC Tester
* **Môi trường áp dụng:** Local (`http://localhost:4200`) & Vercel Dev (`https://dcor-studio-dev.vercel.app`)

---

## 1. Ma trận Test Case Tổng hợp

| Mã Test Case | Tên Kịch bản Kiểm thử | Phân loại | Mức độ | Tiêu chí FRD |
| :--- | :--- | :--- | :--- | :--- |
| **TC-RET-01** | Kiểm tra hiển thị danh sách yêu cầu đổi trả và các tab quy trình | Chức năng (Functional) | P1 - Cao | Mục 1.2.1 |
| **TC-RET-02** | Tạo yêu cầu đổi trả hợp lệ trong thời hạn 72 giờ sau khi giao hàng | Nghiệp vụ cốt lõi | P1 - Cao | Scenario 3.1 |
| **TC-RET-03** | Ràng buộc chính sách: Chặn tạo yêu cầu đổi trả khi quá hạn 72 giờ | Ràng buộc nghiệp vụ | P1 - Cao | Scenario 3.2 |
| **TC-RET-04** | Tiếp nhận hình ảnh hiện trường sản phẩm lỗi và phân loại lý do | Chức năng chi tiết | P1 - Cao | Scenario 3.1 |
| **TC-RET-05** | Điều phối lệnh thu hồi hàng hóa và bàn giao về xưởng kiểm định | Nghiệp vụ vận chuyển | P1 - Cao | Mục 1.2.1 |
| **TC-RET-06** | Lập Biên bản kiểm định chất lượng QC hàng hoàn (Return QC Report) | Nghiệp vụ xưởng | P1 - Cao | Scenario 3.3 |
| **TC-RET-07** | Phê duyệt phương án xử lý: Đổi mới sản phẩm hoặc Hoàn tiền | Nghiệp vụ tài chính | P1 - Cao | Scenario 3.3 |
| **TC-RET-08** | Sắp xếp danh sách đổi trả theo cột dọc (▲ Tăng dần / ▼ Giảm dần) | Giao diện & Sắp xếp | P1 - Cao | Mục 1.2.1 |
| **TC-RET-09** | Từ chối yêu cầu đổi trả do lỗi phát sinh từ phía người sử dụng | Nghiệp vụ / An toàn | P2 - Trung bình | Mục 3.1.2 |
| **TC-RET-10** | Tạo yêu cầu đổi trả tại thời điểm sát nút hạn chót (71 giờ 59 phút) | Trường hợp biên (Edge Case) | P1 - Cao | Scenario 3.1 |
| **TC-RET-11** | Yêu cầu đổi trả đối với sản phẩm may đo Custom theo kích thước phòng | Trường hợp biên (Chính sách) | P1 - Cao | Scenario 3.2 |

---

## 2. Kịch bản Kiểm thử Chi tiết (Happy Path & Chức Năng Cốt Lõi)

### TC-RET-01: Kiểm tra hiển thị danh sách yêu cầu đổi trả và các tab quy trình
* **Tiền điều kiện:** Người dùng truy cập trang `/admin/orders/returns`.
* **Các bước thực hiện:**
  1. Chờ trang nạp hoàn tất dữ liệu.
  2. Quan sát hàng tab trạng thái đổi trả.
* **Kết quả mong đợi:**
  * Hiển thị đầy đủ các tab: **Tất cả**, **Chờ tiếp nhận**, **Đang thu hồi hàng**, **Đang kiểm định QC xưởng**, **Đã duyệt đổi/hoàn tiền**, **Đã từ chối**.
  * Bảng hiển thị các cột: Mã phiếu đổi trả (RET-xxxxx), Mã đơn gốc (ORD-xxxxx), Khách hàng (Tên & SĐT), Sản phẩm yêu cầu đổi, Lý do, Ngày gửi, Trạng thái, Thao tác.

---

### TC-RET-02: Tạo yêu cầu đổi trả hợp lệ trong thời hạn 72 giờ sau khi giao hàng
* **Tiền điều kiện:** Đơn hàng `ORD-77665` được ký nhận bàn giao cách đây 20 giờ (đồng hồ 72 giờ còn hơn 50 giờ).
* **Các bước thực hiện:**
  1. Nhấp nút **"Tạo yêu cầu đổi trả"**.
  2. Chọn đơn hàng `ORD-77665`.
  3. Chọn sản phẩm cần đổi: *Sofa Văng 3 Chỗ Florence*.
  4. Chọn Lý do: `Lỗi nhà sản xuất (Rách da bọc mặt bên)`.
  5. Tải lên 2 ảnh chụp vị trí da rách.
  6. Nhấp **"Gửi yêu cầu đổi trả"**.
* **Kết quả mong đợi:**
  * Hệ thống cho phép tạo thành công phiếu `RET-2026-004`.
  * Trạng thái phiếu là **"Chờ tiếp nhận"** (màu vàng).
  * Nhật ký đơn hàng gốc tự động ghi nhận thông tin có phát sinh yêu cầu đổi trả.

---

### TC-RET-03: Ràng buộc chính sách - Chặn tạo yêu cầu đổi trả khi quá hạn 72 giờ
* **Tiền điều kiện:** Đơn hàng đã giao thành công được 5 ngày (vượt quá 120 giờ).
* **Các bước thực hiện:**
  1. Thử tạo yêu cầu đổi trả liên kết với đơn hàng đã giao quá 5 ngày này.
* **Kết quả mong đợi:**
  * Hệ thống từ chối và hiển thị cảnh báo đỏ rõ ràng: *"Đơn hàng này đã quá thời hạn 72 giờ hỗ trợ đổi trả theo chính sách. Vui lòng chuyển sang Phân hệ Bảo hành để được hỗ trợ sửa chữa nếu sản phẩm gặp sự cố kỹ thuật."*
  * Nút "Xác nhận tạo phiếu" bị khóa.

---

### TC-RET-04: Tiếp nhận hình ảnh hiện trường sản phẩm lỗi và phân loại lý do
* **Tiền điều kiện:** Đang mở chi tiết phiếu đổi trả `RET-2026-004`.
* **Các bước thực hiện:**
  1. Kiểm tra khối "Hình ảnh khách cung cấp".
  2. Nhấp chuột vào ảnh để phóng to kiểm tra vết rách.
* **Kết quả mong đợi:**
  * Ảnh tải lên sắc nét, có nút phóng to / thu nhỏ.
  * Phân loại lý do hiển thị rõ: *Lỗi kỹ thuật nhà sản xuất* (đủ điều kiện miễn phí vận chuyển thu hồi).

---

### TC-RET-05: Điều phối lệnh thu hồi hàng hóa và bàn giao về xưởng kiểm định
* **Tiền điều kiện:** Phiếu đổi trả đã được CSKH tiếp nhận.
* **Các bước thực hiện:**
  1. Nhấp nút **"Điều xe thu hồi hàng"**.
  2. Chọn đội xe DCOR và hẹn ngày thu hồi tại nhà khách hàng.
  3. Nhấp Lưu điều phối.
* **Kết quả mong đợi:**
  * Trạng thái phiếu chuyển sang **"Đang thu hồi hàng"** (màu xanh dương).
  * Tài xế nhận thông báo địa chỉ lấy hàng và số điện thoại khách hàng.

---

### TC-RET-06: Lập Biên bản kiểm định chất lượng QC hàng hoàn (Return QC Report)
* **Tiền điều kiện:** Hàng đã được tài xế chở về tới xưởng mộc DCOR.
* **Các bước thực hiện:**
  1. Kỹ sư QC mở phiếu đổi trả, nhấp nút **"Bắt đầu kiểm định QC"**.
  2. Đánh giá tình trạng thực tế:
     * Tiêu chí 1: Khung sườn nguyên vẹn (Đạt).
     * Tiêu chí 2: Vết rách da do lỗi đường may xuất xưởng (Xác nhận lỗi NSX).
  3. Kết luận: `Đủ điều kiện đổi mới 100%`.
  4. Nhấp **"Lưu biên bản kiểm định QC"**.
* **Kết quả mong đợi:**
  * Biên bản QC được lưu vào hệ thống kèm chữ ký số của Kỹ sư QC.
  * Trạng thái phiếu chuyển sang **"Chờ duyệt xử lý đổi/hoàn tiền"**.

---

### TC-RET-07: Phê duyệt phương án xử lý: Đổi mới sản phẩm hoặc Hoàn tiền
* **Tiền điều kiện:** Biên bản QC đã kết luận Đạt điều kiện đổi trả.
* **Các bước thực hiện:**
  1. Trưởng bộ phận mở phiếu, chọn Phương án: **"Đổi mới sản phẩm tương đương"**.
  2. Nhấp nút **"Phê duyệt đổi hàng"**.
* **Kết quả mong đợi:**
  * Hệ thống thông báo duyệt thành công.
  * Trạng thái phiếu chuyển thành **"Đã chấp thuận đổi trả"** (màu xanh lá cây).
  * **Hệ thống tự động phát sinh Lệnh xuất kho mới** để chuẩn bị chiếc sofa thay thế giao tận nhà cho khách hàng.

---

### TC-RET-08: Sắp xếp danh sách đổi trả theo cột dọc (▲ Tăng dần / ▼ Giảm dần)
* **Tiền điều kiện:** Đang xem bảng đổi trả.
* **Các bước thực hiện:**
  1. Nhấp chuột lần 1 vào tiêu đề cột **"Ngày gửi"**.
  2. Nhấp chuột lần 2 vào tiêu đề cột **"Ngày gửi"**.
* **Kết quả mong đợi:**
  * Nhấp lần 1: Sắp xếp từ phiếu cũ nhất đến mới nhất. Cụm nút hiển thị **chỉ duy nhất mũi tên hướng lên (▲)** màu xanh đậm, ẩn mũi tên xuống.
  * Nhấp lần 2: Đảo chiều từ mới nhất đến cũ nhất. Cụm nút hiển thị **chỉ duy nhất mũi tên hướng xuống (▼)** màu xanh đậm, ẩn mũi tên lên.

---

### TC-RET-09: Từ chối yêu cầu đổi trả do lỗi phát sinh từ phía người sử dụng
* **Tiền điều kiện:** Khách hàng làm cháy xém mặt bàn do đặt nồi lẩu nóng trực tiếp không lót đế.
* **Các bước thực hiện:**
  1. Kỹ sư QC kiểm tra và kết luận: `Lỗi do tác động nhiệt ngoại cảnh của người dùng, không thuộc lỗi sản xuất`.
  2. Chọn phương án **"Từ chối đổi trả"**, đính kèm ảnh kiểm định và nhập văn bản giải thích.
  3. Nhấp Xác nhận từ chối.
* **Kết quả mong đợi:**
  * Trạng thái phiếu chuyển sang **"Đã từ chối"** (màu đỏ).
  * Hệ thống cung cấp tùy chọn chuyển sang hỗ trợ đánh bóng phục hồi tính phí cho khách hàng.

---

## 3. Kịch bản Kiểm thử Chi tiết Trường Hợp Biên (Edge Cases & Negative Scenarios)

### TC-RET-10: Tạo yêu cầu đổi trả tại thời điểm sát nút hạn chót (71 giờ 59 phút)
* **Tiền điều kiện:** Đồng hồ đếm ngược 72 giờ của đơn hàng đang hiển thị: `00:00:45` (còn 45 giây là chạm mốc 72 giờ).
* **Các bước thực hiện:**
  1. Khách hàng submit form yêu cầu đổi trả trước khi đồng hồ chuyển về 0.
* **Kết quả mong đợi:**
  * Hệ thống ghi nhận dấu mốc thời gian (Server Timestamp) chính xác.
  * Vì thời điểm nhận yêu cầu $< 72$ giờ, hệ thống chấp thuận khởi tạo phiếu đổi trả hợp lệ.
  * Sau khi gửi xong, đồng hồ hết hạn, nút tạo yêu cầu ẩn đi, không cho tạo thêm lần thứ hai.

---

### TC-RET-11: Yêu cầu đổi trả đối với sản phẩm may đo Custom theo kích thước phòng
* **Tiền điều kiện:** Đơn hàng là sản phẩm may đo riêng theo bản vẽ (`ORD-CUSTOM-09`). Khách hàng yêu cầu đổi trả vì muốn đổi mẫu thiết kế khác.
* **Các bước thực hiện:**
  1. Thử tạo yêu cầu đổi trả với lý do: *"Khách muốn đổi sang kiểu dáng khác"*.
* **Kết quả mong đợi:**
  * Hệ thống hiển thị điều khoản loại trừ trong chính sách may đo: *"Sản phẩm may đo riêng theo kích thước không gian nhà khách hàng không áp dụng chính sách đổi trả do thay đổi nhu cầu cá nhân. Chỉ tiếp nhận hỗ trợ nếu sản phẩm có lỗi sai lệch kích thước so với bản vẽ hợp đồng đã ký."*
