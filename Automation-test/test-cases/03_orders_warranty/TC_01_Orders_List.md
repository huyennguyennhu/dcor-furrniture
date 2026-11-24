# Bộ Test Case: Danh Sách Đơn Hàng (Orders Management)

* **Mã Phân hệ:** ADM-ORD-LIST
* **Tên Màn hình:** Danh sách Đơn hàng & Đường ống 7 Chặng (Orders Pipeline Governance)
* **Đường dẫn (URL):** `/admin/orders`
* **Tài liệu tham chiếu:** FRD - [ADM-Master] Order, Custom Request, Return & Warranty Management (User Story US-01)
* **Đối tượng sử dụng:** Nhân viên Điều phối Đơn hàng, Kỹ sư QC, Quản trị viên, QC Tester
* **Môi trường áp dụng:** Local (`http://localhost:4200`) & Vercel Dev (`https://dcor-studio-dev.vercel.app`)

---

## 1. Ma trận Test Case Tổng hợp

| Mã Test Case | Tên Kịch bản Kiểm thử | Phân loại | Mức độ | Tiêu chí FRD |
| :--- | :--- | :--- | :--- | :--- |
| **TC-ORD-01** | Kiểm tra hiển thị danh sách đơn hàng và 10 Tab trạng thái | Chức năng (Functional) | P1 - Cao | Mục 1.2.1 |
| **TC-ORD-02** | Lọc đơn hàng theo Tab trạng thái vòng đời 7 chặng | Bộ lọc (Filter) | P1 - Cao | Scenario 1.1 |
| **TC-ORD-03** | Tìm kiếm đơn hàng theo Mã đơn, SĐT và Tên khách hàng | Tìm kiếm (Search) | P1 - Cao | Mục 1.2.1 |
| **TC-ORD-04** | Tiếp nhận điều hướng chuyên sâu từ Báo cáo (`?status=`, `?showroom=`, `?paymentStatus=`) | Tích hợp điều hướng | P1 - Cao | Mục 1.2.1 |
| **TC-ORD-05** | Duyệt xác nhận đơn hàng có tiền đặt cọc 30% hợp lệ | Nghiệp vụ cốt lõi | P1 - Cao | Scenario 1.1 |
| **TC-ORD-06** | Chặn chuyển trạng thái "Sẵn sàng xuất" khi chưa đạt Checklist 4 tiêu chuẩn QC | Ràng buộc chất lượng | P1 - Cao | Scenario 1.2 |
| **TC-ORD-07** | Đánh dấu đạt 4 tiêu chuẩn QC và cập nhật Mã vận đơn giao hàng | Nghiệp vụ xuất kho | P1 - Cao | Scenario 1.3 |
| **TC-ORD-08** | Khách ký nhận hàng và kích hoạt đồng hồ đếm ngược 72 giờ đổi trả | Nghiệp vụ giao vận | P1 - Cao | Scenario 1.4 |
| **TC-ORD-09** | Hủy đơn hàng và bắt buộc ghi nhận Lý do hủy | Nghiệp vụ / An toàn | P1 - Cao | Scenario 1.5 |
| **TC-ORD-10** | Sắp xếp danh sách đơn hàng theo cột dọc (▲ Tăng dần / ▼ Giảm dần) | Giao diện & Sắp xếp | P1 - Cao | Mục 1.2.1 |
| **TC-ORD-11** | In Phiếu đơn hàng / Tem dán kiện hàng tiêu chuẩn | Tiện ích (Print) | P2 - Trung bình | Scenario 1.3 |
| **TC-ORD-12** | Xuất danh sách đơn hàng ra tệp bảng tính Excel / CSV | Tiện ích (Export) | P2 - Trung bình | Mục 1.2.1 |
| **TC-ORD-13** | Duyệt cọc khi số tiền chuyển khoản nhỏ hơn 30% mức cọc quy định | Trường hợp biên (Tài chính) | P1 - Cao | Scenario 1.1 |
| **TC-ORD-14** | Yêu cầu hủy đơn khi hàng đang ở trên xe tải giao (Shipped) | Trường hợp biên (Vận hành) | P1 - Cao | Scenario 1.5 |
| **TC-ORD-15** | Đơn hàng nội thất có địa chỉ giao ở hải đảo hoặc vùng sâu xa | Trường hợp biên (Logistics) | P2 - Trung bình | Mục 1.2.1 |

---

## 2. Kịch bản Kiểm thử Chi tiết (Happy Path & Chức Năng Cốt Lõi)

### TC-ORD-01: Kiểm tra hiển thị danh sách đơn hàng và 10 Tab trạng thái
* **Tiền điều kiện:** Người dùng đăng nhập hệ thống và vào trang Danh sách đơn hàng `/admin/orders`.
* **Các bước thực hiện:**
  1. Chờ trang tải hoàn tất dữ liệu.
  2. Quan sát hàng thanh Tab trạng thái phía trên.
  3. Quan sát các cột trong bảng danh sách đơn hàng.
* **Kết quả mong đợi:**
  * Hiển thị đầy đủ 10 tab trạng thái: **Tất cả**, **Cần duyệt cọc**, **Chờ xác nhận**, **Đã xác nhận**, **Đang gia công**, **Sẵn sàng xuất kho**, **Đang giao hàng**, **Đã giao hàng**, **Hoàn tất**, **Đã hủy**.
  * Bảng hiển thị các cột: Mã đơn hàng (ORD-xxxxx), Ngày đặt, Khách hàng (Tên & SĐT), Showroom xuất phát, Tổng tiền (VNĐ), Trạng thái thanh toán, Trạng thái vận hành, Thao tác.
  * Mỗi trạng thái có nhãn màu sắc trực quan (Đang giao: xanh dương, Hoàn tất: xanh lá, Chờ cọc: vàng cam, Hủy: đỏ).

---

### TC-ORD-02: Lọc đơn hàng theo Tab trạng thái vòng đời 7 chặng
* **Tiền điều kiện:** Bảng đang ở tab "Tất cả".
* **Các bước thực hiện:**
  1. Nhấp lần lượt vào các tab: **"Đang gia công"**, **"Đang giao hàng"**, **"Hoàn tất"**.
* **Kết quả mong đợi:**
  * Bảng cập nhật tức thì và chỉ hiển thị các đơn hàng có trạng thái tương ứng với tab được chọn.
  * Huy hiệu đếm số lượng trên mỗi tab hiển thị đúng số dòng thực tế.

---

### TC-ORD-03: Tìm kiếm đơn hàng theo Mã đơn, SĐT và Tên khách hàng
* **Tiền điều kiện:** Có nhiều đơn hàng trong danh sách.
* **Các bước thực hiện:**
  1. Nhập mã đơn cụ thể vào ô tìm kiếm: `ORD-88992`.
  2. Xóa ô tìm kiếm, nhập số điện thoại: `0901234567`.
  3. Xóa ô tìm kiếm, nhập tên khách hàng tiếng Việt: `Trần Thị Mai`.
* **Kết quả mong đợi:**
  * Khi nhập mã đơn: Lọc ra chính xác đơn hàng đó.
  * Khi nhập SĐT hoặc Tên: Lọc ra toàn bộ các đơn do khách hàng đó đã đặt.

---

### TC-ORD-04: Tiếp nhận điều hướng chuyên sâu từ Báo cáo
* **Tiền điều kiện:** Người dùng điều hướng từ Dashboard hoặc các trang Báo cáo sang.
* **Các bước thực hiện:**
  1. Truy cập URL: `/admin/orders?paymentStatus=deposit_pending`.
  2. Kiểm tra tab và danh sách.
  3. Truy cập URL: `/admin/orders?status=shipping&showroom=Showroom+Quận+7`.
* **Kết quả mong đợi:**
  * Với `deposit_pending`: Tab "Cần duyệt cọc" tự động được chọn, danh sách chỉ hiển thị các đơn chờ duyệt tiền cọc.
  * Với `status=shipping&showroom=...`: Bộ lọc áp dụng đồng thời trạng thái Đang giao và chi nhánh Showroom Quận 7.

---

### TC-ORD-05: Duyệt xác nhận đơn hàng có tiền đặt cọc 30% hợp lệ
* **Tiền điều kiện:** Đơn hàng đang ở trạng thái "Chờ xác nhận" và khách đã chuyển khoản cọc 30%.
* **Các bước thực hiện:**
  1. Mở chi tiết đơn hàng hoặc nhấp nút thao tác nhanh **"Duyệt đơn"**.
  2. Kiểm tra biên lai đặt cọc.
  3. Nhấp nút **"Xác nhận đơn hàng"**.
* **Kết quả mong đợi:**
  * Trạng thái đơn hàng chuyển sang **"Đã xác nhận"** (Confirmed).
  * Nhật ký đơn hàng ghi nhận mốc thời gian và tên nhân viên duyệt.
  * Tồn cam kết của các sản phẩm trong đơn được hệ thống ghi nhận.

---

### TC-ORD-06: Chặn chuyển trạng thái "Sẵn sàng xuất" khi chưa đạt Checklist 4 tiêu chuẩn QC
* **Tiền điều kiện:** Đơn hàng đang ở trạng thái "Đang gia công / Chuẩn bị" tại xưởng.
* **Các bước thực hiện:**
  1. Mở chi tiết đơn hàng.
  2. Tìm khối "Bảng kiểm định chất lượng xuất xưởng (QC Checklist)".
  3. Đánh dấu Đạt cho 3 tiêu chí đầu (Bề mặt, Kết cấu, Đệm mút), **để trống tiêu chí 4 (Đóng gói bảo vệ 4 góc)**.
  4. Nhấp nút **"Chuyển sang Sẵn sàng xuất kho"**.
* **Kết quả mong đợi:**
  * Hệ thống từ chối chuyển trạng thái và hiển thị thông báo lỗi màu đỏ: *"Vui lòng hoàn tất kiểm tra đầy đủ cả 4 tiêu chuẩn kiểm định QC trước khi cho phép xuất kho."*
  * Trạng thái đơn hàng giữ nguyên là "Đang chuẩn bị gia công".

---

### TC-ORD-07: Đánh dấu đạt 4 tiêu chuẩn QC và cập nhật Mã vận đơn giao hàng
* **Tiền điều kiện:** Kỹ sư QC đã kiểm định xong toàn bộ sản phẩm.
* **Các bước thực hiện:**
  1. Đánh dấu Đạt cho toàn bộ 4 tiêu chí QC.
  2. Chọn Đơn vị vận chuyển: `Đội xe DCOR Delivery`.
  3. Nhập Mã vận đơn / Tên tài xế phụ trách và SĐT tài xế.
  4. Nhấp nút **"Xác nhận sẵn sàng xuất kho"**.
* **Kết quả mong đợi:**
  * Đơn hàng chuyển sang trạng thái **"Sẵn sàng xuất kho"** (Ready to Ship).
  * Hiển thị nút in Phiếu xuất kho và tem nhãn kiện hàng.

---

### TC-ORD-08: Khách ký nhận hàng và kích hoạt đồng hồ đếm ngược 72 giờ đổi trả
* **Tiền điều kiện:** Đơn hàng đang ở trạng thái "Đang giao hàng" (Shipped).
* **Các bước thực hiện:**
  1. Tài xế hoặc điều phối viên xác nhận giao hàng thành công và tải lên ảnh chữ ký nhận của khách.
  2. Nhấp nút **"Xác nhận đã giao hàng"**.
* **Kết quả mong đợi:**
  * Trạng thái đơn hàng chuyển thành **"Đã giao hàng"** (Delivered).
  * Tại trang chi tiết đơn hàng, khối **"Chính sách Đổi trả trong 72 giờ"** lập tức kích hoạt đồng hồ đếm ngược chạy lùi từ `72:00:00` về `00:00:00`.
  * Nút "Tạo yêu cầu đổi trả" ở trạng thái sẵn sàng sử dụng.

---

### TC-ORD-09: Hủy đơn hàng và bắt buộc ghi nhận Lý do hủy
* **Tiền điều kiện:** Đơn hàng đang ở trạng thái "Chờ xác nhận" hoặc "Đã xác nhận".
* **Các bước thực hiện:**
  1. Nhấp nút **"Hủy đơn hàng"**.
  2. Quan sát hộp thoại bật lên.
  3. Không chọn lý do, bấm Xác nhận -> Quan sát lỗi.
  4. Chọn lý do: *"Khách hàng đổi ý / Thay đổi kích thước phòng"*, bấm **"Xác nhận hủy"**.
* **Kết quả mong đợi:**
  * Khi không chọn lý do: Hệ thống báo lỗi bắt buộc chọn lý do hủy.
  * Khi xác nhận có lý do: Đơn hàng chuyển sang trạng thái **"Đã hủy"** (màu đỏ).
  * Toàn bộ sản phẩm được hoàn trả lại số tồn khả dụng và lý do hủy được lưu vào nhật ký đơn.

---

### TC-ORD-10: Sắp xếp danh sách đơn hàng theo cột dọc (▲ Tăng dần / ▼ Giảm dần)
* **Tiền điều kiện:** Đang xem bảng đơn hàng.
* **Các bước thực hiện:**
  1. Nhấp chuột lần 1 vào tiêu đề cột **"Tổng tiền"**.
  2. Nhấp chuột lần 2 vào tiêu đề cột **"Tổng tiền"**.
* **Kết quả mong đợi:**
  * Nhấp lần 1: Sắp xếp tổng tiền từ thấp đến cao (Tăng dần). Cụm nút chuyển sang hiển thị **chỉ duy nhất mũi tên hướng lên (▲)** màu xanh đậm, ẩn mũi tên xuống.
  * Nhấp lần 2: Đảo chiều từ cao đến thấp (Giảm dần). Cụm nút chuyển sang hiển thị **chỉ duy nhất mũi tên hướng xuống (▼)** màu xanh đậm, ẩn mũi tên lên.
  * Thực hiện tương tự thành công trên cột **"Ngày đặt"** và **"Khách hàng"**.

---

### TC-ORD-11: In Phiếu đơn hàng / Tem dán kiện hàng tiêu chuẩn
* **Tiền điều kiện:** Đơn hàng đã xác nhận hoặc sẵn sàng xuất.
* **Các bước thực hiện:**
  1. Nhấp nút **"In đơn hàng"** hoặc **"In tem kiện"**.
* **Kết quả mong đợi:**
  * Mở cửa sổ xem trước bản in khổ A4 (với đơn hàng) hoặc khổ tem nhãn nhiệt (với tem kiện hàng dán góc thùng xốp).
  * Hiển thị mã vạch/mã QR của đơn, danh sách sản phẩm và thông tin người nhận rõ ràng.

---

### TC-ORD-12: Xuất danh sách đơn hàng ra tệp bảng tính Excel / CSV
* **Tiền điều kiện:** Đang lọc đơn hàng theo tháng hiện tại.
* **Các bước thực hiện:**
  1. Nhấp nút **"Xuất danh sách"**.
* **Kết quả mong đợi:**
  * Tải xuống file `.xlsx` đầy đủ thông tin: Mã đơn, Khách hàng, SĐT, Địa chỉ, Danh sách món, Tổng tiền, Trạng thái thanh toán, Trạng thái giao hàng.
  * Mở file kiểm tra số liệu chuẩn xác, không lỗi font tiếng Việt.

---

## 3. Kịch bản Kiểm thử Chi tiết Trường Hợp Biên (Edge Cases & Negative Scenarios)

### TC-ORD-13: Duyệt cọc khi số tiền chuyển khoản nhỏ hơn 30% mức cọc quy định
* **Tiền điều kiện:** Đơn hàng có tổng giá trị `20.000.000 ₫`, mức cọc 30% bắt buộc là `6.000.000 ₫`. Khách chỉ mới chuyển `2.000.000 ₫`.
* **Các bước thực hiện:**
  1. Nhân viên kiểm tra và nhập số tiền cọc thực nhận là `2.000.000 ₫`.
  2. Nhấp nút Duyệt xác nhận đơn hàng.
* **Kết quả mong đợi:**
  * Hệ thống cảnh báo màu vàng: *"Số tiền cọc thực nhận (2.000.000 ₫) nhỏ hơn mức cọc tối thiểu 30% (6.000.000 ₫)"*.
  * Yêu cầu nhập lý do đặc cách hoặc giữ trạng thái là **"Cọc thiếu - Chờ bổ sung"**, không tự động chuyển thẳng sang Đã duyệt gia công xưởng.

---

### TC-ORD-14: Yêu cầu hủy đơn khi hàng đang ở trên xe tải giao (Shipped)
* **Tiền điều kiện:** Đơn hàng đang ở trạng thái "Đang giao hàng" (Shipped) và tài xế đang trên đường tới nhà khách. Khách gọi báo gấp muốn hủy đơn.
* **Các bước thực hiện:**
  1. Thao tác Hủy đơn trên hệ thống tại trạng thái Đang giao.
* **Kết quả mong đợi:**
  * Hệ thống không cho phép hủy ngang làm mất vết hàng trên xe, mà chuyển sang trạng thái: **"Yêu cầu hủy - Đang thu hồi quay đầu"**.
  * Cảnh báo phí vận chuyển phát sinh và thông báo tài xế mang hàng quay trở về kho.

---

### TC-ORD-15: Đơn hàng nội thất có địa chỉ giao ở hải đảo hoặc vùng sâu xa
* **Tiền điều kiện:** Khách hàng đặt mua ghế sofa cồng kềnh với địa chỉ giao hàng tại Huyện đảo Phú Quốc hoặc Côn Đảo.
* **Các bước thực hiện:**
  1. Tạo hoặc kiểm tra đơn hàng có địa chỉ hải đảo này.
* **Kết quả mong đợi:**
  * Hệ thống tự động phát hiện khu vực giao hàng đặc thù.
  * Không áp dụng gói vận chuyển xe máy hoặc giao hỏa tốc 24h.
  * Tự động hiển thị ghi chú: *"Đơn hàng yêu cầu vận chuyển đường thủy / chành xe biển, thời gian giao dự kiến 5-7 ngày làm việc"*.
