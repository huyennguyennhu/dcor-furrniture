# Đề xuất Cải tiến & Phân tích Chi tiết Phân hệ Roles & Permissions

> Tài liệu này tổng hợp toàn bộ các đề xuất phát triển, giải đáp thắc mắc nghiệp vụ và phân tích bất cập hiện tại trên Prototype của phân hệ **Roles & Permissions** thuộc hệ thống **XPERC License Management System**.
> Tất cả các mục được trình bày theo cấu trúc báo cáo tiêu chuẩn dành cho BA / QA / Dev.

---

# PHẦN 1: GIẢI ĐÁP & THẮC MẮC NGHIỆP VỤ

### 1.1. Hành vi người dùng khi không được cấp quyền xem (Missing Permission Behavior)
* **Câu hỏi**: Khi tạo role không chọn một quyền (ví dụ: Module Registry), người mang role đó sẽ không thấy tab đó hay vẫn thấy tab nhưng bấm vào thì báo "Không có quyền xem"?
* **Giải đáp chuẩn UX/Security**:
  * **Trên thanh điều hướng (Sidebar/Navigation)**: **Ẩn hoàn toàn tab/menu** đó. Điều này giúp giao diện quản trị gọn gàng, tránh gây rối cho người dùng và không làm rò rỉ cấu trúc tính năng nội bộ.
  * **Khi truy cập trực tiếp bằng URL (Direct Link/Bookmark)**: Nếu người dùng cố tình gõ URL (ví dụ: `/module-registry`), hệ thống kiểm tra Router Guard phía client và Server API Guard phía backend để chặn lại, hiển thị màn hình thông báo lỗi chuẩn **`403 Forbidden - Access Denied` (Bạn không có quyền truy cập tính năng này)**.

---

### 1.2. Giải thích Lập luận Đề xuất "Giới hạn Phạm vi Dữ liệu (Data Scope)"
* **Thắc mắc**: Role Permission này dùng cho Admin quản trị hệ thống, sao lại có "Công ty" ở đây?
* **Lập luận nghiệp vụ thuyết phục**:
  * Hiện tại trên Prototype, tất cả Admin đều dùng chung 1 vai trò Super Admin có toàn quyền trên mọi công ty.
  * Tuy nhiên, trong thực tế vận hành doanh nghiệp lớn (Enterprise SaaS), đội ngũ Admin nội bộ được chia thành nhiều nhóm phụ trách chuyên biệt:
    * *Đội CSKH thị trường Việt Nam*: Chỉ được phép hỗ trợ và thao tác trên các Công ty thuộc khu vực Việt Nam (`Region = VN`) hoặc loại công ty dùng thử (`Company Type = Beta`).
    * *Đội Admin phụ trách dòng sản phẩm Syrix.ai*: Chỉ được xem/chỉnh sửa gói License và Công ty sử dụng Syrix.ai, không được can thiệp vào các công ty thuộc `xcorp.app`.
  * **Kết luận**: Đề xuất Data Scope giúp **phân quyền quản lý giữa các nhóm Admin nội bộ với nhau**, bảo vệ dữ liệu khách hàng nhạy cảm giữa các thị trường/dòng sản phẩm.

---

### 1.3. Tình huống sử dụng Tính năng "Nhân bản Vai trò (Role Cloning)"
* **Thắc mắc**: Mỗi role là duy nhất, nhân bản 1-click có ý nghĩa gì và dùng trong tình huống nào?
* **Tình huống sử dụng thực tế**:
  * Khi Super Admin muốn tạo một vai trò mới có **80-90% quyền giống hệt** một vai trò sẵn có.
  * *Ví dụ*: Đã có vai trò *"Senior Support"* chứa 20 quyền. Giờ cần tạo vai trò *"Junior Support"* chứa 18 quyền (chỉ khác là bớt 2 quyền Delete).
  * Thay vì phải bấm `+ Create Role` và tìm tích lại 18/28 ô từ đầu, Admin chỉ cần bấm nút **"Duplicate"** trên thẻ `Senior Support`. Form Tạo mới tự động copy nguyên vẹn 20 quyền cũ, Admin chỉ việc bỏ tích 2 quyền rồi lưu với tên `Junior Support`. Nút bấm này giúp giảm 90% thao tác thừa và tránh sót quyền.

---

### 1.4. Ý nghĩa của "Bộ Mẫu Vai trò Hệ thống (Role Templates)"
* **Thắc mắc**: Có cần thiết không khi thực tế vẫn phải tinh chỉnh quyền?
* **Giá trị mang lại**:
  * Bộ mẫu vai trò đóng vai trò là **"Khung gợi ý chuẩn (Presets)"**.
  * Khi một Quản trị viên mới sử dụng hệ thống, họ không cần phải ngồi tự nghĩ xem một Kiểm toán viên (Auditor) hay Kế toán cước (Billing Manager) nên tích những ô nào trong 28 ô. Họ chọn Template *"Compliance Auditor"* $\rightarrow$ Hệ thống tự chọn sẵn 8 quyền `View`. Sau đó Admin vẫn hoàn toàn tinh chỉnh tùy ý trước khi bấm lưu.

---

### 1.5. Đề xuất Trạng thái Active/Inactive và Chuyển đổi Role hàng loạt
* **Trạng thái Active/Inactive cho Role**:
  * **Cần thiết**: Khi một vai trò chưa dùng đến hoặc đang rà soát bảo mật, việc Tắt (Inactive) giúp vai trò không xuất hiện trong danh sách chọn gán cho Admin mới mà vẫn giữ nguyên cấu hình đã cài đặt, thay vì phải xóa hẳn role.
* **Tính năng Chuyển Role (Reassign Admins)**:
  * Khi gán đơn lẻ từng Admin $\rightarrow$ Nằm ở module **Admin Management**.
  * Khi **Xóa một Role** (mà Role đó đang có 5 Admin đang sử dụng) $\rightarrow$ Ngay tại popup xác nhận xóa của **Role Management** phải cung cấp một Dropdown cho phép **chuyển hàng loạt 5 Admin đó sang Role B** để tránh việc tài khoản Admin bị mồ côi vai trò.

---

# PHẦN 2: DANH SÁCH ĐỀ XUẤT CẢI TIẾN CHI TIẾT (FORMAT BUG / IMPROVEMENT LOG)

---

### 📋 PROP-01: Tự động Bỏ chọn & Khóa các Quyền Thao tác Con khi Bỏ chọn Quyền Xem (`View`)

* **Context**: Cấu hình phân quyền phụ thuộc giữa quyền Xem (`View`) và các quyền Thao tác (`Create`, `Edit`, `Delete`).
* **Trạng thái hiện tại trên Prototype**:
  * Khi mở Modal Create/Edit Role, người dùng tích chọn đủ 4 quyền trong một danh mục (ví dụ: `View Licenses`, `Create License`, `Edit License`, `Deactivate License`).
  * Khi người dùng **bỏ tích chọn `View Licenses`**, 3 ô tích chọn `Create`, `Edit`, `Deactivate` **vẫn giữ nguyên trạng thái tích xanh** và không bị khóa.
* **Các bước thao tác (Steps)**:
  1. Vào trang Roles & Permissions $\rightarrow$ Bấm `+ Create Role`.
  2. Tại danh mục *License Management*, chọn `Select All` (Tích đủ 4/4 quyền).
  3. Bỏ tích chọn ô `View Licenses`.
  4. Quan sát 3 ô chọn còn lại (`Create License`, `Edit License`, `Deactivate License`).
* **Vấn đề / Bất cập (Friction Point)**:
  * Không hợp lý về mặt logic nghiệp vụ: Nếu một Admin không có quyền Xem danh sách/chi tiết License thì không thể mở giao diện để thực hiện hành động Tạo, Sửa hay Xóa. Việc giữ 3 quyền thao tác khi bỏ quyền Xem sẽ gây lỗi phân quyền bên dưới backend.
* **Kết quả mong đợi (Expected Behavior)**:
  * Khi người dùng bỏ tích `View`, hệ thống phải **tự động bỏ tích** và **khóa mờ (Disable)** các ô chọn `Create`, `Edit`, `Delete` của danh mục đó.
  * Ngược lại, khi tích chọn bất kỳ ô `Create`, `Edit`, hoặc `Delete`, hệ thống phải **tự động tích chọn** ô `View` tương ứng.
* **Lý do & Lập luận (Rationale)**: Đảm bảo tính nhất quán của ma trận phân quyền ($\text{Action} \implies \text{View}$) và ngăn chặn lỗi logic phân quyền trên giao diện.

---

### 📋 PROP-02: Bổ sung Biểu tượng Con Mắt (Xem chi tiết) cho tất cả Thẻ Vai trò trên Bảng điều khiển

* **Context**: Giao diện các Thẻ Vai trò (Role Cards) tại Bảng điều khiển trung tâm.
* **Trạng thái hiện tại trên Prototype**:
  * Thẻ `Super Admin` (Role hệ thống) chỉ hiển thị icon **Con mắt** (Xem chi tiết).
  * Các thẻ Vai trò Tùy chỉnh (Custom Roles) chỉ hiển thị icon **Cây bút** (Sửa) và icon **Thùng rác** (Xóa) ở góc trên bên phải, **không có icon Con mắt**. Người dùng phải nhấp vào vùng trống của thẻ mới mở được Modal Xem.
* **Các bước thao tác (Steps)**:
  1. Quan sát góc phải trên của các thẻ Role tùy chỉnh (ví dụ: `Operations Manager`, `Viewer`).
  2. Thấy chỉ có 2 icon Cây bút và Thùng rác.
* **Vấn đề / Bất cập (Friction Point)**:
  * Thiếu nhất quán về nhận diện UI: Người dùng không biết nhấp vào đâu trên thẻ để chỉ "Xem" danh sách quyền mà không lo bấm nhầm vào nút Sửa hay Xóa.
* **Kết quả mong đợi (Expected Behavior)**:
  * **Phương án A**: Bổ sung rõ icon **Con mắt** bên cạnh icon Cây bút và Thùng rác cho tất cả các thẻ Custom Role.
  * **Phương án B (Tối ưu UX)**: Cho phép nhấp vào bất kỳ đâu trên thân thẻ (Card body) để mở Modal Xem chi tiết (Read-only View). Trong Modal Xem chi tiết, cung cấp thêm nút **"Edit Role"** ở góc để chuyển nhanh từ chế độ Xem sang Sửa.
* **Lý do & Lập luận (Rationale)**: Tăng tính nhất quán giao diện và trải nghiệm thao tác an toàn cho Quản trị viên.

---

### 📋 PROP-03: Bổ sung Tùy chọn Chuyển đổi Vai trò Admin hàng loạt khi Xóa Vai trò (Reassign Admins on Role Deletion)

* **Context**: Thao tác xóa một Vai trò tùy chỉnh đang có tài khoản Admin gắn liền.
* **Trạng thái hiện tại trên Prototype**:
  * Khi bấm icon Thùng rác xóa role `Auditor` (đang có 2 Admin sử dụng), popup confirm hiển thị câu cảnh báo *"There are 2 admin(s) using this role. They will need to be reassigned."*.
  * Popup chỉ có 2 nút: `Cancel` và `Delete`. Khi bấm `Delete`, code tự động gán 2 Admin đó về vai trò đầu tiên tìm thấy trong danh sách mà người dùng không được lựa chọn.
* **Các bước thao tác (Steps)**:
  1. Bấm icon Thùng rác trên thẻ role đang có Admin sử dụng.
  2. Quan sát giao diện Popup xác nhận xóa.
* **Vấn đề / Bất cập (Friction Point)**:
  * Người dùng không biết 2 Admin đó sẽ bị chuyển đi đâu. Việc code tự động gán về role ngẫu nhiên mà không hỏi ý kiến người dùng có thể gây lọt quyền quản trị ngoài ý muốn.
* **Kết quả mong đợi (Expected Behavior)**:
  * Bổ sung một công tắc/ô chọn trên Modal Xóa: `[x] Reassign affected admins to another role`.
  * Khi bật option này, hiển thị một **Dropdown danh sách Vai trò đích** (ví dụ: chuyển sang `Viewer`).
  * Các nút bấm trong Modal sẽ gồm: **`[Cancel]`** và **`[Delete & Reassign]`**.
* **Lý do & Lập luận (Rationale)**: Đảm bảo tính minh bạch và chủ động kiểm soát quyền hạn khi giải thể một vai trò quản trị.

---

### 📋 PROP-04: Tích hợp Đẩy Sự kiện Thu hồi Quyền Thời gian thực (Real-Time Session Revocation)

* **Context**: Xử lý phiên làm việc của Admin khi Vai trò của họ bị chỉnh sửa hoặc xóa.
* **Trạng thái hiện tại trên Prototype**:
  * Khi Super Admin sửa vai trò `Billing Admin` (bỏ quyền xem Billing), Admin đang đăng nhập dưới vai trò `Billing Admin` vẫn thao tác bình thường cho đến khi họ tự đăng xuất hoặc hết hạn Token.
* **Vấn đề / Bất cập (Friction Point)**:
  * Lỗ hổng an ninh: Thu hồi quyền không có hiệu lực ngay lập tức.
* **Kết quả mong đợi (Expected Behavior)**:
  * Khi vai trò bị thay đổi, server gửi tín hiệu Server-Sent Events (SSE) tới client của Admin liên quan.
  * Nếu Admin đó đang đứng tại trang bị thu hồi quyền, hệ thống hiển thị thông báo Toast cảnh báo: *"Quyền truy cập của bạn vừa được cập nhật. Hệ thống đang chuyển hướng..."* và tự động đưa người dùng về trang Dashboard trong vòng 3 giây.
* **Lý do & Lập luận (Rationale)**: Đảm bảo tiêu chuẩn an toàn thông tin khắt khe cho hệ thống quản trị License.

---

### 📋 PROP-05: Quản lý Trạng thái Bật/Tắt (Active / Inactive) cho Vai trò Tùy chỉnh

* **Context**: Quản lý vòng đời hoạt động của các Vai trò tùy chỉnh trong danh mục.
* **Trạng thái hiện tại trên Prototype**:
  * Vai trò chỉ có 2 trạng thái: Tồn tại (Active) hoặc Xóa hẳn khỏi CSDL.
* **Vấn đề / Bất cập (Friction Point)**:
  * Khi một vai trò tạm thời chưa sử dụng (hoặc đang rà soát), Admin buộc phải xóa role (mất hết cấu hình cũ) hoặc để nguyên (dễ bị chọn nhầm khi cấp quyền cho Admin mới).
* **Kết quả mong đợi (Expected Behavior)**:
  * Thêm công tắc Toggle **Active / Inactive** trên form Sửa vai trò hoặc trên thẻ Role.
  * Vai trò ở trạng thái `Inactive` sẽ bị mờ đi trên Dashboard và không xuất hiện trong danh sách chọn khi cấp quyền cho Admin mới.
* **Lý do & Lập luận (Rationale)**: Giúp quản lý danh mục vai trò linh hoạt mà không làm mất dữ liệu lịch sử.
