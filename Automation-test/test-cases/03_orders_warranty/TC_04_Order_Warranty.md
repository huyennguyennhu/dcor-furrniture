# Bộ Test Case: Hồ Sơ Bảo Hành Điện Tử (Warranty Management)

* **Mã Phân hệ:** ADM-ORD-WARRANTY
* **Tên Màn hình:** Quản lý Hồ Sơ Bảo Hành Điện Tử & Sửa Chữa (E-Warranty Management)
* **Đường dẫn (URL):** `/admin/orders/warranty`
* **Tài liệu tham chiếu:** FRD - [ADM-Master] Order, Custom Request, Return & Warranty Management (User Story US-04)
* **Đối tượng sử dụng:** Trưởng bộ phận Kỹ thuật, CSKH, Kỹ thuật viên bảo hành, QC Tester
* **Môi trường áp dụng:** Local (`http://localhost:4200`) & Vercel Dev (`https://dcor-studio-dev.vercel.app`)

---

## 1. Ma trận Test Case Tổng hợp

| Mã Test Case | Tên Kịch bản Kiểm thử | Phân loại | Mức độ | Tiêu chí FRD |
| :--- | :--- | :--- | :--- | :--- |
| **TC-WAR-01** | Kiểm tra hiển thị danh sách thẻ bảo hành và các trạng thái hiệu lực | Chức năng (Functional) | P1 - Cao | Mục 1.2.1 |
| **TC-WAR-02** | Tra cứu thẻ bảo hành theo Số điện thoại và Tên khách hàng | Tìm kiếm (Search) | P1 - Cao | Scenario 4.1 |
| **TC-WAR-03** | Đối soát phân tầng thời hạn bảo hành theo từng cấu phần nội thất | Logic nghiệp vụ | P1 - Cao | Scenario 4.1 |
| **TC-WAR-04** | Tiếp nhận yêu cầu bảo hành và phân công Kỹ thuật viên tại nhà | Nghiệp vụ cốt lõi | P1 - Cao | Scenario 4.2 |
| **TC-WAR-05** | Nghiệm thu hoàn tất ca bảo hành có biên bản và ảnh sửa chữa | Nghiệp vụ hoàn tất | P1 - Cao | Scenario 4.3 |
| **TC-WAR-06** | Xử lý yêu cầu sửa chữa đối với sản phẩm đã Hết hạn bảo hành | Nghiệp vụ tính phí | P2 - Trung bình | Mục 1.2.1 |
| **TC-WAR-07** | Sắp xếp danh sách theo cột dọc (▲ Tăng dần / ▼ Giảm dần) | Giao diện & Sắp xếp | P1 - Cao | Mục 1.2.1 |
| **TC-WAR-08** | Lọc danh sách theo Trạng thái (Còn hạn, Đang xử lý, Hết hạn) | Bộ lọc (Filter) | P1 - Cao | Mục 1.2.1 |
| **TC-WAR-09** | Xuất sổ theo dõi bảo hành ra tệp bảng tính Excel | Tiện ích (Export) | P2 - Trung bình | Mục 1.2.1 |
| **TC-WAR-10** | Yêu cầu bảo hành đối với hư hại do ngập lụt / thiên tai / hỏa hoạn | Trường hợp biên (Chính sách) | P2 - Trung bình | Scenario 4.1 |
| **TC-WAR-11** | Tra cứu bảo hành khi khách hàng đổi số điện thoại mới | Trường hợp biên (Xác minh) | P2 - Trung bình | Scenario 4.1 |

---

## 2. Kịch bản Kiểm thử Chi tiết (Happy Path & Chức Năng Cốt Lõi)

### TC-WAR-01: Kiểm tra hiển thị danh sách thẻ bảo hành và các trạng thái hiệu lực
* **Tiền điều kiện:** Người dùng truy cập trang `/admin/orders/warranty`.
* **Các bước thực hiện:**
  1. Chờ trang nạp hoàn tất dữ liệu.
  2. Quan sát bảng danh sách hồ sơ bảo hành.
* **Kết quả mong đợi:**
  * Bảng hiển thị các cột: Mã thẻ bảo hành (WAR-xxxxx), Khách hàng (Họ tên & SĐT), Mã đơn hàng liên kết, Sản phẩm được bảo hành, Ngày kích hoạt, Hạn bảo hành, Trạng thái (Còn hiệu lực / Hết hạn / Đang sửa chữa), Thao tác.
  * Các trạng thái hiển thị huy hiệu màu sắc rõ ràng (Còn hạn: xanh lá, Đang sửa: vàng cam, Hết hạn: xám).

---

### TC-WAR-02: Tra cứu thẻ bảo hành theo Số điện thoại và Tên khách hàng
* **Tiền điều kiện:** Khách hàng liên hệ tổng đài báo sản phẩm bàn ăn bị lỏng ốc vít.
* **Các bước thực hiện:**
  1. Nhập số điện thoại khách hàng vào ô tìm kiếm: `0912345678`.
* **Kết quả mong đợi:**
  * Bảng lọc ra chính xác tất cả các sản phẩm khách hàng này từng mua còn hoặc hết hạn bảo hành.
  * Hiển thị đầy đủ lịch sử các lần bảo hành trước đó (nếu có).

---

### TC-WAR-03: Đối soát phân tầng thời hạn bảo hành theo từng cấu phần nội thất
* **Tiền điều kiện:** Mở chi tiết hồ sơ bảo hành của sản phẩm *Sofa Góc Chữ L Florence*.
* **Các bước thực hiện:**
  1. Quan sát bảng bóc tách thời hạn bảo hành của sản phẩm.
* **Kết quả mong đợi:**
  * Hệ thống phân chia chuẩn xác 3 hạn mức bảo hành độc lập:
    1. **Khung sườn gỗ sồi & Chân thép:** Bảo hành **36 tháng** kể từ ngày giao.
    2. **Đệm mút D40 & Bề mặt da bò Ý:** Bảo hành **24 tháng**.
    3. **Phụ kiện bản lề & Khớp nâng:** Bảo hành **12 tháng**.
  * Hiển thị số ngày còn lại (Countdown) cho từng cấu phần.

---

### TC-WAR-04: Tiếp nhận yêu cầu bảo hành và phân công Kỹ thuật viên tại nhà
* **Tiền điều kiện:** Sản phẩm còn thời hạn bảo hành hợp lệ.
* **Các bước thực hiện:**
  1. Nhấp nút **"Tạo ca bảo hành"**.
  2. Nhập mô tả sự cố: `Chân bàn ăn bị rơ lỏng mộng kết nối`.
  3. Chọn Ngày hẹn kiểm tra tận nhà: `06/11/2026 - Buổi chiều (14h-17h)`.
  4. Phân công Kỹ thuật viên: `Nguyễn Văn Thợ`.
  5. Nhấp **"Lên lịch bảo hành"**.
* **Kết quả mong đợi:**
  * Ca bảo hành mới được khởi tạo ở trạng thái **"Đã lên lịch sửa chữa"**.
  * Hệ thống tự động gửi thông báo lịch hẹn, địa chỉ nhà và số điện thoại khách hàng đến tài khoản của kỹ thuật viên.

---

### TC-WAR-05: Nghiệm thu hoàn tất ca bảo hành có biên bản và ảnh sửa chữa
* **Tiền điều kiện:** Kỹ thuật viên đã đến nhà khách hàng khắc phục xong sự cố.
* **Các bước thực hiện:**
  1. Mở ca bảo hành.
  2. Tải lên 2 ảnh chụp vị trí chân bàn sau khi đã gia cố mộng gỗ chắc chắn.
  3. Tải lên ảnh biên bản nghiệm thu có chữ ký xác nhận hài lòng của khách hàng.
  4. Nhấp nút **"Nghiệm thu hoàn tất ca bảo hành"**.
* **Kết quả mong đợi:**
  * Trạng thái ca bảo hành chuyển sang **"Hoàn tất xử lý"** (màu xanh lá cây).
  * Lịch sử bảo hành được ghi nhận vĩnh viễn vào hồ sơ của sản phẩm, không thể chỉnh sửa hay làm sai lệch.

---

### TC-WAR-06: Xử lý yêu cầu sửa chữa đối với sản phẩm đã Hết hạn bảo hành
* **Tiền điều kiện:** Khách hàng sử dụng ghế sofa đã 4 năm (hết hạn 36 tháng).
* **Các bước thực hiện:**
  1. Tạo ca hỗ trợ sửa chữa cho sản phẩm hết hạn này.
  2. Chọn chế độ: **"Dịch vụ bảo dưỡng & Sửa chữa tính phí"**.
  3. Nhập bảng dự toán chi phí thay đệm mới.
* **Kết quả mong đợi:**
  * Hệ thống cho phép ghi nhận ca dịch vụ tính phí, không từ chối khách hàng.
  * Trạng thái hiển thị rõ nhãn: *"Dịch vụ tính phí ngoài bảo hành"*.

---

### TC-WAR-07: Sắp xếp danh sách theo cột dọc (▲ Tăng dần / ▼ Giảm dần)
* **Tiền điều kiện:** Đang xem bảng bảo hành.
* **Các bước thực hiện:**
  1. Nhấp chuột lần 1 vào tiêu đề cột **"Hạn bảo hành"**.
  2. Nhấp chuột lần 2 vào tiêu đề cột **"Hạn bảo hành"**.
* **Kết quả mong đợi:**
  * Nhấp lần 1: Sắp xếp theo hạn bảo hành gần nhất lên đầu (những sản phẩm sắp hết hạn nổi lên trước). Cụm nút hiển thị **chỉ duy nhất mũi tên hướng lên (▲)** màu xanh đậm.
  * Nhấp lần 2: Đảo chiều hạn bảo hành xa nhất lên đầu. Cụm nút hiển thị **chỉ duy nhất mũi tên hướng xuống (▼)** màu xanh đậm.

---

### TC-WAR-08: Lọc danh sách theo Trạng thái
* **Tiền điều kiện:** Đang ở bảng bảo hành.
* **Các bước thực hiện:**
  1. Lọc theo trạng thái: Chọn **"Đang sửa chữa"**.
* **Kết quả mong đợi:**
  * Bảng chỉ hiển thị các ca bảo hành đang trong quá trình điều phối thợ kỹ thuật xử lý.

---

### TC-WAR-09: Xuất sổ theo dõi bảo hành ra tệp bảng tính Excel
* **Tiền điều kiện:** Đã chọn các điều kiện lọc.
* **Các bước thực hiện:**
  1. Nhấp nút **"Xuất Excel"**.
* **Kết quả mong đợi:**
  * Tải xuống tệp tin danh sách bảo hành đầy đủ: Khách hàng, Sản phẩm, Ngày mua, Ngày hết hạn, Số lần đã bảo dưỡng.

---

## 3. Kịch bản Kiểm thử Chi tiết Trường Hợp Biên (Edge Cases & Negative Scenarios)

### TC-WAR-10: Yêu cầu bảo hành đối với hư hại do ngập lụt / thiên tai / hỏa hoạn
* **Tiền điều kiện:** Khách hàng yêu cầu bảo hành bàn gỗ bị ngâm nước lũ nhiều ngày làm phồng rộp biến dạng hoàn toàn.
* **Các bước thực hiện:**
  1. Kỹ thuật viên kiểm tra nguyên nhân sự cố.
* **Kết quả mong đợi:**
  * Hệ thống áp dụng điều khoản loại trừ bảo hành: *"Không bảo hành miễn phí cho các hư hại do ngâm nước lũ, thiên tai, hỏa hoạn hoặc va đập ngoại lực sau khi nhận hàng."*
  * Cung cấp tùy chọn hỗ trợ khách hàng thay thế linh kiện theo giá gốc ưu đãi.

---

### TC-WAR-11: Tra cứu bảo hành khi khách hàng đổi số điện thoại mới
* **Tiền điều kiện:** Khách hàng đã đổi số điện thoại và không nhớ số cũ dùng khi mua hàng.
* **Các bước thực hiện:**
  1. Sử dụng tính năng tra cứu phụ bằng: **Địa chỉ Email** hoặc **Địa chỉ nhà nhận hàng** hoặc **Mã hợp đồng đơn hàng**.
* **Kết quả mong đợi:**
  * Hệ thống cho phép tìm ra đúng hồ sơ bảo hành của khách hàng.
  * Quản trị viên có thể cập nhật số điện thoại mới vào hồ sơ sau khi thực hiện xác minh danh tính an toàn.
