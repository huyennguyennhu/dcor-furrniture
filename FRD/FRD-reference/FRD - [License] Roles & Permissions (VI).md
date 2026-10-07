# Lịch sử chỉnh sửa tài liệu (Document History)

| Phiên bản | Ngày | Tác giả | Nội dung thay đổi |
| --- | --- | --- | --- |
| 1.0 | 05 tháng 10, 2026 | HANH NGUYEN / Team BA XPERC | Khởi tạo bản FRD chuẩn sản xuất cho module Roles & Permissions |
| 2.0 | 05 tháng 10, 2026 | Team BA XPERC | Mở rộng Tiêu chí nghiệm thu (AC), Bảng quy tả UI, Cảnh báo lỗi, Ràng buộc phụ thuộc quyền và Đa ngôn ngữ |
| 3.0 | 05 tháng 10, 2026 | Team BA XPERC | Cập nhật điều chỉnh theo thực tế Prototype ✏️ và bổ sung các User Story đề xuất mới 🙌 |

---

# 1. Tổng quan (Overview)

## 1.1. Mục đích (Purpose)
Tài liệu này định nghĩa chi tiết các yêu cầu nghiệp vụ và chức năng cho phân hệ **Phân quyền & Vai trò (Roles & Permissions)** thuộc **Hệ thống Quản lý License XPERC**. Tính năng này cung cấp cho Quản trị viên hệ thống (System Administrator) một công cụ quản lý truy cập phân cấp (RBAC - Role-Based Access Control) tập trung, giúp thiết lập vai trò, phân quyền truy cập chi tiết đến từng hành động nghiệp vụ, đảm bảo an toàn bảo mật và theo dõi trách nhiệm vận hành trên toàn bộ các phân hệ của nền tảng (Modules, Licenses, Companies, Billing, Audit Logs, Admins, và Roles).

## 1.2. Phạm vi (Scope)

### 1.2.1. Tính năng thuộc phạm vi (In-Scope Features)
- **Bảng điều khiển Phân quyền (Roles Dashboard Cockpit):** Khối thẻ KPI đo lường thời gian thực (Tổng số vai trò, Tổng số quyền hạn, Số danh mục quyền) và lưới danh sách hiển thị tất cả các Vai trò Hệ thống & Vai trò Tùy chỉnh.
- **Tìm kiếm & Lọc Vai trò (🙌 Đề xuất - Chưa có trên prototype):** Ô tìm kiếm theo tên/mô tả vai trò và tab lọc theo loại vai trò (`All`, `System`, `Custom`).
- **Xem chi tiết quyền của Vai trò (View Role Details Modal):** Cửa sổ Modal hiển thị cây phân quyền chi tiết dưới dạng chỉ đọc (Read-only) khi nhấp vào thân thẻ role (Card body) hoặc icon Con mắt.
- **Tạo mới Vai trò Tùy chỉnh (Create Role Modal & Form):** Trình tạo vai trò tương tác hỗ trợ nhập tên (kiểm tra trùng lặp), mô tả, các thao tác chọn/bỏ chọn nhanh thông minh `Select All` / `Deselect All` theo từng danh mục.
- **Chỉnh sửa Vai trò Tùy chỉnh (Edit Role Modal & Form):** Cập nhật thông tin vai trò và phân bổ quyền hạn via nút `Update Role` ✏️, tự động áp dụng cho tất cả các quản trị viên đang gắn liền với vai trò đó.
- **Xóa Vai trò Tùy chỉnh (Delete Role Execution):** Xóa vai trò tùy chỉnh ra khỏi hệ thống kèm theo cơ chế kiểm tra ràng buộc số lượng quản trị viên đang sử dụng và hiển thị cảnh báo chuyển đổi.
- **Bật/Tắt Trạng thái Active/Inactive cho Vai trò (🙌 Đề xuất - Chưa có trên prototype):** Cho phép ẩn vai trò chưa sử dụng khỏi danh sách cấp quyền mà không mất dữ liệu.
- **Cơ chế Phụ thuộc Quyền (Permission Dependency) (🙌 Đề xuất - Chưa có trên prototype):** Ràng buộc tự động hành động phụ thuộc (Khi bỏ chọn quyền `View`, hệ thống tự động bỏ chọn và khóa mờ 3 quyền `Create`/`Edit`/`Delete` tương ứng).
- **Giới hạn Phạm vi Dữ liệu (🙌 Đề xuất - Chưa có trên prototype):** Cấu hình phân quyền chi tiết theo Loại công ty, Domain sản phẩm, và Khu vực địa lý cho các nhóm Admin nội bộ.
- **Tính năng Nhân bản Vai trò (🙌 Đề xuất - Chưa có trên prototype):** Sao chép vai trò có sẵn chỉ với 1-click.
- **Bộ Mẫu Vai trò Hệ thống (🙌 Đề xuất - Chưa có trên prototype):** Cung cấp sẵn các mẫu vai trò chuẩn (Kiểm toán, Kế toán cước, Hỗ trợ kỹ thuật).

### 1.2.2. Tính năng ngoài phạm vi (Out-Scope Features)
- Luồng gán đơn lẻ tài khoản Quản trị viên vào Vai trò cụ thể (Do phân hệ **Quản lý Admin - Admin Management** đảm nhiệm).
- Luồng gán quyền cho người dùng cuối thuộc nội bộ từng công ty khách hàng (Do phân hệ **Companies / User Assignment** đảm nhiệm).
- Logic kiểm tra phân quyền thời gian thực bên dưới Middleware (Engine kiểm tra Entitlement Guard).

---

# 2. User Story & Tiêu chí nghiệm thu (Acceptance Criteria)

## US-01: Quản lý và Xem Bảng điều khiển Vai trò & Phân quyền
> *Với tư cách là **Super Admin**, tôi muốn xem bảng điều khiển tổng quan về tất cả các vai trò hệ thống và vai trò tùy chỉnh kèm các chỉ số tổng hợp, để có thể nhanh chóng đánh giá sự phân bổ quyền hạn quản trị trong hệ thống.*

### Tiêu chí nghiệm thu (Acceptance Criteria)
- **Scenario 1.1: Khởi tạo Bảng điều khiển & Hiển thị Chỉ số KPI ✏️**
  - **Given:** Super Admin truy cập vào menu "Roles & Permissions" từ thanh điều hướng bên trái.
  - **When:** Màn hình tải thành công.
  - **Then:** Hệ thống hiển thị 3 khối thẻ chỉ số KPI tổng hợp:
    1. **Total Roles (Tổng số vai trò):** Tổng số vai trò đang hoạt động trong CSDL, bao gồm Vai trò Hệ thống (Role mặc định như `Super Admin` với thuộc tính `isSystem = true`) + Các Vai trò Tùy chỉnh do Admin tạo (`isSystem = false`). ✏️
    2. **Total Permissions (Tổng số quyền):** Tổng số quyền kỹ thuật đang có trong hệ thống (28 quyền). ✏️
    3. **Permission Categories (Danh mục quyền):** Tổng số danh mục quyền cố định (8 danh mục). ✏️
  - **And:** Hiển thị lưới các Thẻ Vai trò (Role Cards) tương ứng.

- **Scenario 1.2: Hiển thị Thẻ Vai trò Hệ thống & Nút Thao tác ✏️**
  - **Given:** Người dùng quan sát thẻ vai trò `Super Admin` (`isSystem = true`).
  - **When:** Xem các nút thao tác trên header của thẻ.
  - **Then:** Thẻ hiển thị nhãn **SYSTEM** màu vàng hổ phách ✏️ (`bg-amber-100 text-amber-700`).
  - **And:** Trên thẻ `Super Admin`, hệ thống hiển thị duy nhất biểu tượng **Con mắt (View Permissions)** ✏️ ở góc phải trên. Nút "Chỉnh sửa" (cây bút) và "Xóa" (thùng rác) bị ẩn hoàn toàn để bảo vệ vai trò hệ thống. ✏️
  - **And:** Đối với các Vai trò Tùy chỉnh (`isSystem = false`), header của thẻ hiển thị icon **Cây bút (Edit Role)** ✏️ và icon **Thùng rác (Delete Role)** ✏️. Nhấp vào bất kỳ đâu trên thân thẻ (Card body) sẽ kích hoạt Modal Xem chi tiết (Read-only View). ✏️

- **Scenario 1.3: Hiển thị Thông tin Chi tiết trên từng Card Role ✏️**
  - **Given:** Super Admin xem danh sách thẻ vai trò trên Bảng điều khiển.
  - **Then:** Mỗi thẻ vai trò phải hiển thị đầy đủ 5 khối thông tin:
    1. **Header Card:** Icon Shield/Crown, Tên Role, Nhãn `System` (nếu là role hệ thống), Mô tả ngắn. ✏️
    2. **Action Icons:** Icon Con mắt (đối với System Role) hoặc Icon Cây bút + Thùng rác (đối với Custom Role). ✏️
    3. **Permissions Progress:** Tỷ lệ quyền được chọn trên tổng số quyền (ví dụ: `16 / 28`). ✏️
    4. **Category Badges:** Các nhãn tròn liệt kê từng danh mục có quyền kèm số lượng chọn (ví dụ: `📦 Module: 4/4`, `💳 Billing: 2/4`...). Nếu đạt 4/4 hiển thị màu xanh lá (`bg-emerald-100`), nếu chọn 1-3/4 hiển thị màu xanh dương (`bg-blue-50`). ✏️
    5. **Footer Card:** Đếm số lượng Admin đang được gán vai trò này (`Admins with this role: X`). ✏️

- **Scenario 1.4: Tìm kiếm và Lọc Danh sách Vai trò (🙌 Đề xuất - Chưa có trên prototype)**
  - **Given:** Super Admin đang ở Bảng điều khiển Vai trò có nhiều vai trò tùy chỉnh.
  - **When:** Nhập từ khóa vào ô "Search roles..." hoặc bấm chọn các tab lọc (`All`, `System Roles`, `Custom Roles`).
  - **Then:** Hệ thống thực hiện lọc và hiển thị danh sách thẻ vai trò tương ứng theo thời gian thực.

---

## US-02: Xem Chi tiết Phân bổ Quyền của Vai trò
> *Với tư cách là **Quản trị viên**, tôi muốn kiểm tra chính xác cây phân quyền của bất kỳ vai trò nào ở chế độ chỉ đọc, để có thể đối soát quyền hạn mà không làm thay đổi dữ liệu.*

### Tiêu chí nghiệm thu (Acceptance Criteria)
- **Scenario 2.1: Mở Modal Xem Chi tiết Phân quyền Chỉ đọc ✏️**
  - **Given:** Quản trị viên đang ở Bảng điều khiển Phân quyền.
  - **When:** Bấm vào icon "Con mắt" (trên thẻ Super Admin) hoặc nhấp trực tiếp vào thân thẻ vai trò (Card body) của vai trò tùy chỉnh. ✏️
  - **Then:** Hệ thống bật cửa sổ Modal "Role Permission Details" (`[Role Name] — Permissions`) hiển thị:
    - Tên vai trò, Nhãn System/Custom, và đoạn Mô tả.
    - Thanh tiến trình theo từng danh mục (ví dụ: `Module Management: 4/4`).
    - Danh sách các quyền ở dạng chỉ đọc: Hiện icon tích xanh (`check-circle`) cho quyền được bật trên nền xanh mờ (`bg-emerald-50`), icon `x-circle` mờ cho quyền không được chọn. ✏️
    - **Tên quyền & Mô tả nghiệp vụ:** Hiển thị Tên quyền (ví dụ: "View Licenses") và dòng mô tả ngắn bên dưới. Không hiển thị các mã kỹ thuật dạng `module.view` trong modal này để giữ giao diện thân thiện với người dùng. ✏️

---

## US-03: Tạo mới Vai trò Quản trị Tùy chỉnh
> *Với tư cách là **Super Admin**, tôi muốn tạo các vai trò vận hành tùy chỉnh với tập hợp quyền hạn phù hợp, để có thể ủy quyền vận hành an toàn theo nguyên tắc quyền hạn tối thiểu (Principle of Least Privilege).*

### Tiêu chí nghiệm thu (Acceptance Criteria)
- **Scenario 3.1: Mở Form Tạo mới & Khởi tạo Trạng thái Ban đầu ✏️**
  - **Given:** Super Admin đang ở Bảng điều khiển Vai trò.
  - **When:** Nhấp vào nút **"+ Create Role"** trên thanh công cụ top bar.
  - **Then:** Hệ thống hiển thị Modal "Create Role" với:
    - Ô nhập "Role Name" (Bắt buộc, **ràng buộc duy nhất không trùng lặp**). ✏️
    - Ô nhập "Description" (Tùy chọn).
    - Tất cả 28 ô tích quyền đều ở trạng thái chưa chọn (`0 selected`).
    - Các liên kết thao tác nhanh toàn cục: "Select All" (Chọn tất cả) và "Clear" (Xóa tất cả). ✏️
    - Các nút chuyển đổi thông minh theo từng danh mục: Tự động đổi giữa **`Select All`** (khi chưa chọn đủ) và **`Deselect All`** (khi đã chọn đủ 4/4 quyền). ✏️

- **Scenario 3.2: Ràng buộc Quy tắc Phụ thuộc Quyền (Permission Dependency) (🙌 Đề xuất - Chưa có trên prototype)**
  - **Given:** Quản trị viên đang cấu hình quyền trên Modal Tạo/Sửa vai trò.
  - **When:** Quyền `Xem (View)` của một danh mục (ví dụ: `View Licenses`) **bị bỏ chọn (Unchecked)**.
  - **Then:** Hệ thống tự động bỏ chọn và **khóa mờ (Disable)** các ô tích quyền `Create License`, `Edit License`, và `Deactivate License` tương ứng. (🙌)
  - **When:** Quản trị viên tích chọn bất kỳ quyền thao tác nào (`Create`, `Edit`, hoặc `Deactivate`), hệ thống tự động tích chọn quyền `View` tương ứng. (🙌)

- **Scenario 3.3: Lưu Thành công Vai trò Tùy chỉnh Mới ✏️**
  - **Given:** Quản trị viên đã nhập Tên vai trò hợp lệ không trùng lặp ("Support Specialist"), nhập Mô tả, và chọn danh sách các quyền mong muốn. ✏️
  - **When:** Nhấp vào nút **"Create Role"** ✏️ (ở góc dưới bên phải Modal).
  - **Then:** Hệ thống kiểm tra dữ liệu hợp lệ (tên không trống, đã chọn ít nhất 1 quyền), lưu vai trò mới vào CSDL, **ghi nhật ký Audit Log** ✏️, hiển thị thông báo thành công Toast ("Role 'Support Specialist' created"), tăng chỉ số KPI "Total Roles" lên 1, và thêm thẻ mới vào Bảng điều khiển.

---

## US-04: Chỉnh sửa Vai trò Tùy chỉnh Đang Hoạt động
> *Với tư cách là **Super Admin**, tôi muốn cập nhật tên, mô tả và phân bổ lại quyền cho vai trò tùy chỉnh hiện có, để quyền hạn quản trị linh hoạt thay đổi theo nhu cầu vận hành.*

### Tiêu chí nghiệm thu (Acceptance Criteria)
- **Scenario 4.1: Điền sẵn Dữ liệu Vai trò Hiện tại lên Form ✏️**
  - **Given:** Super Admin bấm vào icon "Chỉnh sửa" (cây bút) ở góc phải trên thẻ vai trò tùy chỉnh (ví dụ: `Billing Admin`). ✏️
  - **When:** Modal "Edit Role" hiển thị.
  - **Then:** Điền sẵn Tên vai trò, Mô tả, và đánh dấu chính xác các ô quyền hiện tại.
  - **And:** Bên phải mỗi dòng quyền trong form chỉnh sửa có hiển thị mã key kỹ thuật dạng font-mono mờ (ví dụ: `license.view`, `license.create`) dành cho Admin kỹ thuật tham khảo. ✏️

- **Scenario 4.2: Lưu Thay đổi và Áp dụng Tức thì ✏️**
  - **Given:** Quản trị viên điều chỉnh phân bổ quyền (ví dụ: bỏ quyền `license.delete`) và nhấp nút **"Update Role"** ✏️.
  - **When:** Dữ liệu hợp lệ.
  - **Then:** Hệ thống lưu thay đổi vào CSDL, cập nhật chỉ số trên thẻ (ví dụ: `12 / 28`), ghi nhật ký Audit Log ✏️ chi tiết các quyền bị thay đổi, và áp dụng quyền mới ngay lập tức cho tất cả các Admin đang mang vai trò này.

- **Scenario 4.3: Phát Tín hiệu Thu hồi Quyền Phiên làm việc Thời gian thực (🙌 Đề xuất - Chưa có trên prototype)**
  - **Given:** Một Admin đang đăng nhập và thao tác thuộc vai trò `Billing Admin`.
  - **When:** Super Admin chỉnh sửa vai trò `Billing Admin` và bỏ bớt quyền hạn.
  - **Then:** Hệ thống phát sự kiện SSE thu hồi quyền tới phiên đăng nhập của Admin đó trong vòng **< 1 giây**, hiển thị thông báo Toast cảnh báo: *"Quyền truy cập của bạn vừa được Quản trị viên cập nhật. Hệ thống đang chuyển hướng..."* và tự động đưa người dùng về trang Dashboard nếu họ đang đứng ở trang bị tước quyền. (🙌)

---

## US-05: Xóa Vai trò Quản trị Tùy chỉnh
> *Với tư cách là **Super Admin**, tôi muốn xóa các vai trò tùy chỉnh không còn sử dụng kèm theo cơ chế xác nhận an toàn, để danh mục vai trò luôn gọn gàng mà không làm gián đoạn tài khoản Admin đang hoạt động.*

### Tiêu chí nghiệm thu (Acceptance Criteria)
- **Scenario 5.1: Chặn Xóa Trực tiếp khi Vai trò Đang có Admin Sử dụng ✏️**
  - **Given:** Vai trò `Auditor` hiện đang được gán cho 2 tài khoản Admin (`Admins with this role: 2`).
  - **When:** Super Admin bấm vào icon "Xóa" (thùng rác) ở góc phải trên thẻ `Auditor`. ✏️
  - **Then:** Hệ thống chặn lại và hiển thị Modal Xác nhận Cảnh báo ("Delete Role"):
    > *"Are you sure you want to delete the role 'Auditor'? There are 2 admin(s) using this role. They will need to be reassigned."*
  - **And:** Cung cấp 2 nút bấm: **[Cancel]** (Hủy) và **[Delete]** (Nút nguy hiểm màu đỏ). ✏️

- **Scenario 5.2: Thực thi Xóa Vai trò ✏️**
  - **Given:** Super Admin nhấp nút **[Delete]** ✏️ trong modal xác nhận.
  - **When:** Yêu cầu xử lý thành công.
  - **Then:** Hệ thống xóa bản ghi vai trò khỏi CSDL, hủy gán vai trò ở các tài khoản Admin liên quan (tự động chuyển về vai trò khả dụng đầu tiên trong hệ thống), ghi nhật ký Audit Log ✏️, hiển thị Toast thông báo thành công ("Role 'Auditor' deleted"), giảm KPI "Total Roles" đi 1, và xóa thẻ khỏi Bảng điều khiển.

- **Scenario 5.3: Chuyển đổi Vai trò Admin Trước khi Xóa (🙌 Đề xuất - Chưa có trên prototype)**
  - **Given:** Super Admin đang xem Modal Cảnh báo xóa vai trò đang có 2 Admin sử dụng.
  - **When:** Người dùng bật tùy chọn tích chọn `[x] Reassign affected admins to another role (🙌)`.
  - **Then:** Xuất hiện Dropdown chọn Vai trò đích (ví dụ: `Viewer`). Các nút bấm chuyển thành **`[Cancel]`** và **`[Delete & Reassign] (🙌)`**. Khi bấm `Delete & Reassign`, hệ thống tự động chuyển 2 Admin sang vai trò `Viewer` ngay khi xóa vai trò cũ.

---

## US-06: Cấu hình Phạm vi Dữ liệu cho Vai trò (🙌 Đề xuất - Chưa có trên prototype)
> *Với tư cách là **Super Admin**, tôi muốn giới hạn vai trò tùy chỉnh theo Phạm vi Dữ liệu (Loại công ty, Domain sản phẩm, Khu vực địa lý), để quản trị viên nội bộ chỉ được phép thao tác dữ liệu thuộc phạm vi phụ trách.*

### Tiêu chí nghiệm thu (Acceptance Criteria)
- **Scenario 6.1: Định nghĩa Giới hạn Phạm vi Dữ liệu**
  - **Given:** Super Admin đang tạo hoặc sửa vai trò tùy chỉnh (ví dụ: "Vietnam Beta Support").
  - **When:** Mở rộng khối **"Data Scope Settings (🙌)"** trên form.
  - **Then:** Chọn `Company Type = Beta`, `Domain = xcorp.app`, và `Region = VN`.
  - **When:** Bấm lưu vai trò.
  - **Then:** Hệ thống lưu thông số cấu hình phạm vi dữ liệu vào CSDL.

- **Scenario 6.2: Kiểm soát Phạm vi Dữ liệu Phía Server-side**
  - **Given:** Admin mang vai trò "Vietnam Beta Support" cố gắng xem chi tiết một công ty loại External hoặc công ty thuộc khu vực US.
  - **When:** Thực thi yêu cầu API hoặc truy cập giao diện.
  - **Then:** Hệ thống kiểm tra scope và chặn truy cập kèm thông báo lỗi 403: *"Access Restricted: Data is outside your assigned Role Scope."*

---

## US-07: Nhân bản Vai trò Hiện có (🙌 Đề xuất - Chưa có trên prototype)
> *Với tư cách là **Super Admin**, tôi muốn nhân bản vai trò có sẵn với 1-click, để tạo nhanh các vai trò tương tự mà không cần tích chọn lại 28 quyền từ đầu.*

### Tiêu chí nghiệm thu (Acceptance Criteria)
- **Scenario 7.1: Sao chép Cây Phân quyền của Vai trò**
  - **Given:** Super Admin đang ở Bảng điều khiển Vai trò.
  - **When:** Bấm vào nút **"Duplicate" (Icon sao chép) (🙌)** trên thẻ `Operations Manager`.
  - **Then:** Hệ thống hiển thị Modal Create Role điền sẵn Tên `"Copy of Operations Manager"` và điền sẵn 100% các ô tích quyền giống hệt vai trò gốc.
  - **When:** Admin chỉnh sửa lại tên và bấm Save.
  - **Then:** Tạo ra vai trò tùy chỉnh độc lập mới trong CSDL.

---

## US-08: Khởi tạo Vai trò từ Bộ Mẫu Hệ thống (🙌 Đề xuất - Chưa có trên prototype)
> *Với tư cách là **Super Admin**, tôi muốn chọn các Vai trò Mẫu có sẵn khi tạo vai trò mới, để áp dụng nhanh các vai trò vận hành tiêu chuẩn theo thông lệ tốt nhất.*

### Tiêu chí nghiệm thu (Acceptance Criteria)
- **Scenario 8.1: Chọn Mẫu Vai trò Hệ thống**
  - **Given:** Admin bấm nút "+ Create Role".
  - **When:** Bấm chọn dropdown **"Load from Template (🙌)"** trên đầu form.
  - **Then:** Hiển thị danh sách mẫu: *Compliance Auditor*, *Billing Operations*, *Product Support Specialist*.
  - **When:** Admin chọn mẫu *Compliance Auditor*.
  - **Then:** Hệ thống tự động tích chọn toàn bộ 8 quyền `View` và giữ nguyên bỏ chọn tất cả các quyền `Create/Edit/Delete`.

---

## US-09: Cấp quyền Quản trị Tạm thời có Thời hạn (🙌 Đề xuất - Chưa có trên prototype)
> *Với tư cách là **Super Admin**, tôi muốn cấp vai trò nâng cao có đặt bộ đếm thời gian tự động hết hạn, để cấp quyền xử lý sự cố khẩn cấp mà tự động thu hồi khi hết giờ.*

### Tiêu chí nghiệm thu (Acceptance Criteria)
- **Scenario 9.1: Cấu hình Thời gian Cấp quyền Tạm thời**
  - **Given:** Super Admin đang gán vai trò cho tài khoản Admin trong phân hệ Admin Management.
  - **When:** Bật nút **"Temporary Access (🙌)"** và chọn thời điểm hết hạn (ví dụ: sau 4 tiếng nữa).
  - **Then:** Hệ thống lưu mốc thời gian `expires_at` vào liên kết gán vai trò.

- **Scenario 9.2: Tự động Thu hồi Quyền khi Hết hạn**
  - **Given:** Quyền tạm thời chạm mốc thời gian hết hạn.
  - **When:** Tiến trình chạy ngầm kiểm tra hệ thống.
  - **Then:** Hệ thống tự động gỡ bỏ vai trò tạm thời, trả Admin về vai trò mặc định ban đầu, và ghi log `TEMP_ACCESS_EXPIRED` vào Audit Trail.

---

# 3. Yêu cầu Chức năng chi tiết (Functional Requirements)

## 3.1. Yêu cầu chung (Common Requirements)
- **Xác thực & Phân quyền:** Truy cập module bị giới hạn nghiêm ngặt cho người dùng có quyền `Super Admin` hoặc có các quyền kỹ thuật `role.view`, `role.create`, `role.edit`, `role.delete`.
- **Ghi nhật ký Audit Log ✏️:** Mọi thao tác thay đổi dữ liệu (Tạo mới, Chỉnh sửa, Xóa vai trò, Thay đổi danh sách quyền) BẮT BUỘC phải được ghi lại vĩnh viễn trong Audit Log (Thời gian, User ID, Loại hành động, Target Role ID, Dữ liệu cũ, Dữ liệu mới).
- **Danh mục 28 Quyền Cố định:** Hệ thống duy trì danh mục cố định gồm **8 Danh mục Quyền** chứa **28 Quyền Chi tiết**:

| # | Danh mục Quyền (Category) | Mã Key Kỹ thuật | Danh sách Quyền Chi tiết |
|---|---|---|---|
| 1 | **Module Management** | `module` | `module.view`, `module.create`, `module.edit`, `module.delete` |
| 2 | **License Management** | `license` | `license.view`, `license.create`, `license.edit`, `license.delete` |
| 3 | **Company Management** | `company` | `company.view`, `company.create`, `company.edit`, `company.delete` |
| 4 | **User Management** | `user` | `user.view`, `user.create`, `user.edit`, `user.delete` |
| 5 | **Billing Management** | `billing` | `billing.view`, `billing.create`, `billing.edit`, `billing.delete` |
| 6 | **Audit Logs Management** | `audit` | `audit.view`, `audit.create`, `audit.edit`, `audit.delete` |
| 7 | **Admin Management** | `admin` | `admin.view`, `admin.create`, `admin.edit`, `admin.delete` |
| 8 | **Role Management** | `role` | `role.view`, `role.create`, `role.edit`, `role.delete` |

---

## 3.2. Bảng Mô tả Trường Giao diện (UI Fields Specification Matrix)

| Tên trường (Field Name) | Thành phần UI | Kiểu dữ liệu | Bắt buộc | Mặc định | Ràng buộc & Logic Nghiệp vụ |
| --- | --- | --- | --- | --- | --- |
| **Role Name** | Text Input | String | Có | Trống | Tối đa 50 ký tự. **Phải là duy nhất không trùng lặp** ✏️. |
| **Description** | Textarea | String | Không | Trống | Tối đa 255 ký tự. Mô tả phạm vi vận hành của vai trò. |
| **System Role Flag** | Badge Pill | Boolean | System | False | `True` cho Super Admin (`bg-amber-100 text-amber-700` ✏️). Ẩn nút Sửa/Xóa. |
| **Category Select All / Deselect All ✏️** | Button Toggle | Action | Không | N/A | Tự động chuyển đổi giữa `Select All` và `Deselect All` theo trạng thái chọn ✏️. |
| **Granular Permission** | Checkbox | Boolean | Không | False | Tương ứng với mã key kỹ thuật. Ràng buộc theo quyền View 🙌. |
| **Search Roles Input (🙌)** | Text Search | String | Không | Trống | Lọc thời gian thực danh sách thẻ vai trò trên Dashboard. |
| **Company Type Scope (🙌)** | Multi-Select | Enum List | Không | `All` | Tùy chọn: `All`, `External`, `Beta`, `Internal`. |
| **Product Domain Scope (🙌)** | Multi-Select | Enum List | Không | `All` | Tùy chọn: `All`, `xcorp.app`, `syrix.ai`. |
| **Geographic Region Scope (🙌)** | Dropdown | Enum | Không | `Global` | Tùy chọn: `Global`, `VN`, `US`. |
| **Reassign Role Selector (🙌)** | Dropdown | String (ID) | Không | `None` | Sử dụng khi xóa vai trò có Admin đang gắn liền. |
| **Temporary Access Expiry (🙌)** | DateTime Picker | ISO Timestamp | Không | `Null` | Thời điểm tự động hết hạn quyền quản trị tạm thời. |

---

## 3.3. Cảnh báo lỗi & Phản hồi hệ thống (Error Messages & System Feedback)

| Sự kiện / Điều kiện | Loại Phản hồi | Nội dung Thông báo | Thao tác Xử lý |
| --- | --- | --- | --- |
| Trùng Tên Vai trò | Inline Error / Toast ✏️ | `"Role name '[Name]' already exists. Please choose a unique name."` | Viền đỏ ô nhập. Chặn nút bấm Save/Create. |
| Tên Vai trò Trống | Toast Error ✏️ | `"Role name is required"` ✏️ | Hiển thị Toast lỗi màu đỏ ✏️. |
| Chưa chọn Quyền | Toast Error ✏️ | `"Please select at least one permission"` ✏️ | Hiển thị Toast lỗi màu đỏ khi lưu ✏️. |
| Thao tác trên System Role | Toast Error | `"System-defined roles cannot be modified or deleted."` | Hủy thao tác, ghi log bảo mật. |
| Cảnh báo Xóa Vai trò | Warning Modal | `"Are you sure you want to delete the role '[Name]'? [X] admin(s) using this role..."` | Cung cấp nút `[Cancel]` và `[Delete]`. ✏️ |
| Vi phạm Scope Dữ liệu (🙌) | Banner Alert | `"Access Restricted: Data is outside your assigned Role Scope."` | Màn hình lỗi HTTP 403 Forbidden. |
| Tạo mới Thành công | Toast Notice ✏️ | `"Role '[Name]' created"` ✏️ | Toast xanh lá, tự ẩn sau 3 giây. |
| Cập nhật Thành công | Toast Notice ✏️ | `"Role '[Name]' updated"` ✏️ | Toast xanh lá, tự ẩn sau 3 giây. |
| Xóa Thành công | Toast Notice ✏️ | `"Role '[Name]' deleted"` ✏️ | Toast vàng cảnh báo ✏️. |

---

# 4. Yêu cầu Phi chức năng (Non-Functional Requirements)

- **Performance (Hiệu năng):** Cập nhật phân quyền phải được đồng bộ sang Token JWT hoặc Cache trong thời gian **< 100ms**.
- **Độ trễ Thu hồi Quyền (🙌 Đề xuất - Chưa có trên prototype):** Tín hiệu SSE thu hồi quyền gửi tới các phiên làm việc active trong thời gian **< 500ms**.
- **Security (Bảo mật):** Kiểm tra phân quyền & Scope dữ liệu chặt chẽ phía Server-side. Lọc và làm sạch dữ liệu đầu vào chống các lỗ hổng OWASP Top 10.
- **Auditability (Khả năng truy vết):** 100% các thao tác thay đổi vai trò/quyền hạn phải được lưu trữ diff payload JSON đầy đủ trong Audit Log.
- **Usability (Độ khả dụng):** Giao diện Modal đáp ứng tốt, nhãn badge độ tương phản cao, hỗ trợ điều hướng phím (ESC để đóng modal, TAB chuyển focus).

---

# 5. Prototype & Tài liệu liên quan (Related Documents)

- **Prototype UI:** https://prototype-admin-a272b.web.app/roles-permissions
- **Tài liệu liên quan:**
  - [Proposals_and_Improvements_Roles_Permissions.md](file:///D:/03_WORK/XPERC/Task/License/documents/FRD/Proposals_and_Improvements_Roles_Permissions.md)
  - [FRD - [License] Companies.md](file:///D:/03_WORK/XPERC/Task/License/documents/FRD/FRD%20-%20%5BLicense%5D%20Companies.md)
  - [FRD - [License] Module Registry.md](file:///D:/03_WORK/XPERC/Task/License/documents/FRD/FRD%20-%20%5BLicense%5D%20Module%20Registry.md)
  - [FRD - [License] License Packages.md](file:///D:/03_WORK/XPERC/Task/License/documents/FRD/FRD%20-%20%5BLicense%5D%20License%20Packages.md)
