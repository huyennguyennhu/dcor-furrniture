# Bộ Test Case: Quản Trị Khách Hàng (Customers Management)

* **Mã Phân hệ:** ADM-CUST
* **Tên Màn hình:** Quản trị Khách hàng (Customers Management)
* **Đường dẫn (URL):** `/admin/customers`
* **Tài liệu tham chiếu:** FRD - [ADM-Master] Product, Inventory & Customer Management (User Story US-01)
* **Đối tượng sử dụng:** Quản trị viên, CSKH, Sales Showroom, QC/QA Tester
* **Môi trường áp dụng:** Local (`http://localhost:4200`) & Vercel Dev (`https://dcor-studio-dev.vercel.app`)

---

## 1. Ma trận Test Case Tổng hợp

| Mã Test Case | Tên Kịch bản Kiểm thử | Phân loại | Mức độ | Tiêu chí FRD |
| :--- | :--- | :--- | :--- | :--- |
| **TC-CUST-01** | Kiểm tra hiển thị danh sách khách hàng và các thẻ KPI tổng quan | Chức năng (Functional) | P1 - Cao | Mục 1.2.1 |
| **TC-CUST-02** | Tìm kiếm khách hàng theo Tên, Số điện thoại và Email | Tìm kiếm (Search) | P1 - Cao | Scenario 1.1 |
| **TC-CUST-03** | Lọc khách hàng theo Hạng thẻ hội viên (Đồng, Bạc, Vàng, B2B) | Bộ lọc (Filter) | P1 - Cao | Scenario 1.1 |
| **TC-CUST-04** | Lọc kết hợp đa điều kiện (Hạng thẻ + Mức chi tiêu + Trạng thái) | Bộ lọc kết hợp | P1 - Cao | Scenario 1.1 |
| **TC-CUST-05** | Tiếp nhận bộ lọc từ đường dẫn Query Params (`?phone=`, `?group=vip`, `?filter=new`) | Tích hợp điều hướng | P1 - Cao | Scenario 1.1 |
| **TC-CUST-06** | Sắp xếp danh sách theo cột dọc (▲ Tăng dần / ▼ Giảm dần) | Giao diện & Sắp xếp | P1 - Cao | Scenario 1.2 |
| **TC-CUST-07** | Xem Modal Chi tiết hồ sơ và lịch sử mua sắm của khách hàng | Chi tiết dữ liệu | P1 - Cao | Mục 1.2.1 |
| **TC-CUST-08** | Khóa tài khoản khách hàng kèm hộp thoại xác nhận an toàn | Nghiệp vụ / Bảo mật | P1 - Cao | Scenario 1.3 |
| **TC-CUST-09** | Mở khóa tài khoản khách hàng đã bị khóa | Nghiệp vụ / Phục hồi | P2 - Trung bình | Scenario 1.3 |
| **TC-CUST-10** | Xuất danh sách khách hàng ra tệp bảng tính Excel / CSV | Tiện ích (Export) | P2 - Trung bình | Mục 1.2.1 |
| **TC-CUST-11** | Phân trang danh sách khách hàng (Pagination) | Giao diện / Dữ liệu lớn | P2 - Trung bình | Mục 1.2.1 |
| **TC-CUST-12** | Tìm kiếm không tìm thấy kết quả phù hợp (No Results State) | Trường hợp biên (Edge Case) | P3 - Thấp | Scenario 1.1 |
| **TC-CUST-13** | Khóa tài khoản của khách hàng đang có đơn hàng đang giao trên đường | Trường hợp biên (Edge Case) | P1 - Cao | Scenario 1.3 |
| **TC-CUST-14** | Nhập số điện thoại sai định dạng chuẩn Việt Nam (chứa chữ cái, < 10 số) | Trường hợp biên (Validation) | P1 - Cao | Mục 1.2.1 |
| **TC-CUST-15** | Tìm kiếm khách hàng chứa chuỗi tấn công SQL Injection hoặc ký tự lạ | Trường hợp biên (Bảo mật) | P1 - Cao | Mục 1.2.1 |

---

## 2. Kịch bản Kiểm thử Chi tiết (Happy Path & Chức Năng Cốt Lõi)

### TC-CUST-01: Kiểm tra hiển thị danh sách khách hàng và các thẻ KPI tổng quan
* **Tiền điều kiện:** Người dùng đã đăng nhập với vai trò Quản trị viên và đang ở trang Quản lý Khách hàng `/admin/customers`.
* **Các bước thực hiện:**
  1. Chờ trang tải hoàn tất dữ liệu.
  2. Quan sát các thẻ chỉ số KPI ở đầu trang.
  3. Quan sát các cột trong bảng danh sách khách hàng.
* **Kết quả mong đợi:**
  * Hiển thị đầy đủ các thẻ chỉ số tổng quan: Tổng khách hàng, Khách hàng mới trong tháng, Hội viên VIP, Tỷ lệ khách mua lặp lại.
  * Bảng dữ liệu hiển thị rõ các cột: Khách hàng (Avatar, Họ tên, Mã KH), Thông tin liên hệ (Email, Số điện thoại), Hạng thành viên (Badge màu tương ứng), Tổng số đơn, Tổng chi tiêu (VNĐ có định dạng), Ngày tạo tài khoản, Trạng thái (Hoạt động / Đã khóa), Thao tác.
  * Không xuất hiện lỗi hiển thị hoặc chữ bị tràn dòng mất thẩm mỹ.

---

### TC-CUST-02: Tìm kiếm khách hàng theo Tên, Số điện thoại và Email
* **Tiền điều kiện:** Danh sách khách hàng có nhiều bản ghi với các tên và số điện thoại khác nhau.
* **Các bước thực hiện:**
  1. Nhập số điện thoại cụ thể vào ô tìm kiếm (ví dụ: `0901234567`).
  2. Xóa ô tìm kiếm, nhập tiếp một phần tên khách hàng (ví dụ: `Nguyễn Văn`).
  3. Xóa ô tìm kiếm, nhập địa chỉ email (ví dụ: `@gmail.com`).
* **Kết quả mong đợi:**
  * Khi nhập SĐT: Bảng chỉ hiển thị đúng khách hàng sở hữu số điện thoại đó.
  * Khi nhập Tên: Bảng hiển thị tất cả các khách hàng có chứa chuỗi ký tự tên tìm kiếm (không phân biệt chữ hoa, chữ thường, hỗ trợ gõ tiếng Việt có dấu).
  * Khi nhập Email: Bảng hiển thị các khách hàng có email khớp với từ khóa.

---

### TC-CUST-03: Lọc khách hàng theo Hạng thẻ hội viên
* **Tiền điều kiện:** Đang ở bảng danh sách khách hàng.
* **Các bước thực hiện:**
  1. Nhấp vào bộ lọc Hạng thành viên (hoặc thanh Tab phân nhóm).
  2. Chọn lần lượt: **"Đồng"**, **"Bạc"**, **"Vàng"**, **"B2B Partner"**.
* **Kết quả mong đợi:**
  * Danh sách lọc chính xác các khách hàng đạt tiêu chuẩn hạng thẻ đã chọn.
  * Huy hiệu hạng thành viên trên mỗi dòng hiển thị đúng màu nhận diện (Vàng: vàng kim, Bạc: xám bạc, B2B: tím than).

---

### TC-CUST-04: Lọc kết hợp đa điều kiện (Hạng thẻ + Mức chi tiêu + Trạng thái)
* **Tiền điều kiện:** Hệ thống có tập dữ liệu khách hàng phong phú.
* **Các bước thực hiện:**
  1. Chọn Hạng thành viên: **"Vàng"**.
  2. Chọn Mức chi tiêu: **"> 50 Triệu VNĐ"**.
  3. Chọn Trạng thái: **"Đang hoạt động"**.
* **Kết quả mong đợi:**
  * Hệ thống kết hợp đồng thời (điều kiện VÀ) cả 3 tiêu chí lọc.
  * Bảng chỉ hiển thị các khách hàng thỏa mãn toàn bộ 3 điều kiện trên.
  * Hiển thị số lượng kết quả tìm thấy tương ứng.

---

### TC-CUST-05: Tiếp nhận bộ lọc từ đường dẫn Query Params
* **Tiền điều kiện:** Người dùng điều hướng từ trang Báo cáo sang hoặc dán trực tiếp đường dẫn có tham số vào trình duyệt.
* **Các bước thực hiện:**
  1. Truy cập URL: `/admin/customers?phone=0901234567`.
  2. Kiểm tra ô tìm kiếm và danh sách kết quả.
  3. Truy cập URL: `/admin/customers?group=vip`.
  4. Truy cập URL: `/admin/customers?filter=new`.
* **Kết quả mong đợi:**
  * Với `?phone=0901234567`: Ô tìm kiếm tự động điền số điện thoại này và bảng tự lọc ngay dòng khách hàng đó mà người dùng không cần gõ phím.
  * Với `?group=vip`: Bộ lọc phân nhóm tự động chuyển sang tab/bộ lọc VIP.
  * Với `?filter=new`: Danh sách tự động sắp xếp theo ngày tạo mới nhất lên đầu trang.

---

### TC-CUST-06: Sắp xếp danh sách theo cột dọc (▲ Tăng dần / ▼ Giảm dần)
* **Tiền điều kiện:** Đang xem bảng khách hàng.
* **Các bước thực hiện:**
  1. Nhấp chuột lần 1 vào tiêu đề cột **"Tổng chi tiêu"**.
  2. Quan sát thứ tự hiển thị và cụm nút mũi tên tại tiêu đề cột.
  3. Nhấp chuột lần 2 vào tiêu đề cột **"Tổng chi tiêu"**.
  4. Quan sát lại thứ tự và cụm nút mũi tên.
* **Kết quả mong đợi:**
  * Sau lần nhấp 1: Danh sách được sắp xếp từ thấp đến cao (Tăng dần). Cụm nút chuyển sang hiển thị **chỉ duy nhất mũi tên hướng lên (▲)** có màu xanh đậm nổi bật, mũi tên hướng xuống bị ẩn.
  * Sau lần nhấp 2: Danh sách đảo chiều từ cao xuống thấp (Giảm dần). Cụm nút chuyển sang hiển thị **chỉ duy nhất mũi tên hướng xuống (▼)** có màu xanh đậm, mũi tên hướng lên bị ẩn.
  * Cụm nút nằm ngay ngắn theo cột dọc bên cạnh chữ tiêu đề, không bị lệch hàng.

---

### TC-CUST-07: Xem Modal Chi tiết hồ sơ và lịch sử mua sắm của khách hàng
* **Tiền điều kiện:** Bảng danh sách đang hiển thị các khách hàng.
* **Các bước thực hiện:**
  1. Nhấp chuột vào tên khách hàng hoặc nút **"Xem chi tiết"** tại cột Thao tác.
* **Kết quả mong đợi:**
  * Cửa sổ Modal (hoặc màn hình chi tiết) mở lên mượt mà.
  * Hiển thị đầy đủ thông tin: Ảnh đại diện, Họ tên, Mã định danh, SĐT, Email, Địa chỉ giao hàng mặc định, Tổng điểm tích lũy.
  * Hiển thị tab "Lịch sử đơn hàng" liệt kê tất cả các đơn khách này từng đặt, đi kèm ngày đặt, tổng tiền và trạng thái đơn.

---

### TC-CUST-08: Khóa tài khoản khách hàng kèm hộp thoại xác nhận an toàn
* **Tiền điều kiện:** Khách hàng đang ở trạng thái "Hoạt động".
* **Các bước thực hiện:**
  1. Nhấp vào biểu tượng menu hành động `...` ở cuối dòng và chọn **"Khóa tài khoản"**.
  2. Quan sát hộp thoại xác nhận bật lên.
  3. Nhấp nút **"Hủy bỏ"**.
  4. Mở lại và nhấp nút **"Xác nhận khóa"**.
* **Kết quả mong đợi:**
  * Khi nhấp "Hủy bỏ": Hộp thoại đóng lại, trạng thái khách hàng giữ nguyên là "Hoạt động".
  * Khi nhấp "Xác nhận khóa": Hệ thống hiển thị thông báo thành công; nhãn trạng thái của khách hàng chuyển ngay sang **"Đã khóa"** với màu nền đỏ/xám cảnh báo.

---

### TC-CUST-09: Mở khóa tài khoản khách hàng đã bị khóa
* **Tiền điều kiện:** Khách hàng đang có trạng thái "Đã khóa".
* **Các bước thực hiện:**
  1. Nhấp chọn thao tác **"Mở khóa tài khoản"**.
  2. Xác nhận tại hộp thoại bật lên.
* **Kết quả mong đợi:**
  * Tài khoản được khôi phục trạng thái **"Hoạt động"**, nhãn trạng thái chuyển lại màu xanh lá cây.

---

### TC-CUST-10: Xuất danh sách khách hàng ra tệp bảng tính Excel / CSV
* **Tiền điều kiện:** Đang áp dụng một bộ lọc khách hàng (ví dụ: Khách VIP).
* **Các bước thực hiện:**
  1. Nhấp nút **"Xuất danh sách"** (Export) ở thanh công cụ.
* **Kết quả mong đợi:**
  * Trình duyệt tải xuống file bảng tính `.xlsx` hoặc `.csv`.
  * Danh sách trong tệp chứa đúng các khách hàng theo bộ lọc đang chọn, không bị thiếu cột và hiển thị chuẩn font tiếng Việt có dấu.

---

### TC-CUST-11: Phân trang danh sách khách hàng (Pagination)
* **Tiền điều kiện:** Tổng số khách hàng trong hệ thống vượt quá số dòng tối đa trên 1 trang (ví dụ: > 10 hoặc 20 dòng).
* **Các bước thực hiện:**
  1. Cuộn xuống chân bảng, kiểm tra thanh phân trang.
  2. Nhấp chuyển sang **"Trang 2"**, sau đó nhấp nút **"Tiếp theo (Next)"** và **"Quay lại (Previous)"**.
* **Kết quả mong đợi:**
  * Dữ liệu tải trang mới nhanh chóng, thông tin số trang hiện tại hiển thị chính xác (ví dụ: *Hiển thị 11-20 trên tổng số 85 khách hàng*).
  * Vị trí cuộn trang được tự động đưa về đầu bảng một cách tiện lợi.

---

## 3. Kịch bản Kiểm thử Chi tiết Trường Hợp Biên (Edge Cases & Negative Scenarios)

### TC-CUST-12: Tìm kiếm không tìm thấy kết quả phù hợp (No Results State)
* **Tiền điều kiện:** Đang ở ô tìm kiếm.
* **Các bước thực hiện:**
  1. Nhập một chuỗi ký tự ngẫu nhiên không tồn tại (ví dụ: `xyz999999999`).
* **Kết quả mong đợi:**
  * Bảng không bị vỡ bố cục, hiển thị trạng thái rỗng thân thiện: *"Không tìm thấy khách hàng nào khớp với từ khóa tìm kiếm"*.
  * Có nút bấm hỗ trợ: *"Xóa bộ lọc"* để đưa bảng quay về trạng thái ban đầu chỉ bằng 1 thao tác.

---

### TC-CUST-13: Khóa tài khoản của khách hàng đang có đơn hàng đang giao trên đường
* **Tiền điều kiện:** Khách hàng *Lê Văn C* đang có 1 đơn hàng ở trạng thái "Đang giao hàng" (Shipped).
* **Các bước thực hiện:**
  1. Quản trị viên thực hiện thao tác Khóa tài khoản khách hàng *Lê Văn C*.
  2. Quan sát thông báo của hệ thống.
* **Kết quả mong đợi:**
  * Hệ thống hiển thị hộp thoại cảnh báo rõ ràng: *"Khách hàng này đang có 1 đơn hàng đang vận chuyển (ORD-12345). Việc khóa tài khoản sẽ chặn khách đặt đơn hàng mới, đơn hàng cũ vẫn tiếp tục được giao bình thường. Bạn có chắc chắn muốn khóa?"*
  * Sau khi xác nhận: Tài khoản bị khóa quyền đăng nhập/mua hàng mới, nhưng đơn hàng cũ không bị hủy đột ngột.

---

### TC-CUST-14: Nhập số điện thoại sai định dạng chuẩn Việt Nam
* **Tiền điều kiện:** Đang ở form thêm hoặc sửa thông tin khách hàng.
* **Các bước thực hiện:**
  1. Nhập số điện thoại chỉ có 5 chữ số: `09012`.
  2. Nhập số điện thoại chứa chữ cái: `090abc1234`.
  3. Nhập số điện thoại bắt đầu bằng đầu số lạ: `1122334455`.
* **Kết quả mong đợi:**
  * Hệ thống bắt lỗi hợp lệ (Validation Error) ngay lập tức: *"Số điện thoại không hợp lệ. Vui lòng nhập số điện thoại Việt Nam gồm 10 chữ số (bắt đầu bằng 03, 05, 07, 08, 09)"*.
  * Nút Lưu bị khóa, không cho phép lưu dữ liệu rác vào cơ sở dữ liệu.

---

### TC-CUST-15: Tìm kiếm khách hàng chứa chuỗi tấn công SQL Injection hoặc ký tự lạ
* **Tiền điều kiện:** Đang ở ô tìm kiếm khách hàng.
* **Các bước thực hiện:**
  1. Nhập chuỗi tấn công cơ sở dữ liệu: `' OR '1'='1' --`.
  2. Nhập chuỗi ký tự Unicode đặc biệt: `𝓝𝓰𝓾𝔂𝓮𝓷 𝓥𝓪𝓷 𝓐`.
* **Kết quả mong đợi:**
  * Hệ thống xử lý an toàn (Parametrized queries), **tuyệt đối không làm lộ lỗi cú pháp cơ sở dữ liệu (Database Error)**.
  * Ứng dụng không bị đứng hay dump dữ liệu toàn bộ người dùng.
  * Hiển thị bảng rỗng an toàn vì không có khách hàng nào có tên là chuỗi ký tự trên.
