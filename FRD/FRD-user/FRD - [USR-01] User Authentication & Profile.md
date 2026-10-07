# Lịch sử chỉnh sửa tài liệu (Document History)

| Phiên bản | Ngày | Tác giả | Nội dung thay đổi |
| --- | --- | --- | --- |
| 1.0 | 06 tháng 10, 2026 | BA Team DCOR Studio | Khởi tạo bản FRD chuẩn sản xuất cho Phân hệ FRD-USR-01 (User Authentication & Profile) |
| 2.0 | 06 tháng 10, 2026 | Team BA & System Architect | Chuẩn hóa theo kiến trúc Angular 17+ Standalone, Bổ sung Phân nhánh Autofill & Xác thực OTP SMS/ZNS |
| 3.0 | 06 tháng 10, 2026 | Team BA DCOR Studio | Bổ sung chi tiết 8 Yêu cầu Chức năng cụ thể (FR-01 đến FR-08) kèm Business Rules, Pre-conditions, Post-conditions, Use Case Specifications & UI Fields Matrices |

---

# 1. Tổng quan (Overview)

## 1.1. Mục đích (Purpose)
Tài liệu này định nghĩa chi tiết các yêu cầu nghiệp vụ và chức năng cho phân hệ **Xác thực & Quản lý Hồ sơ Khách hàng (User Authentication & Profile Management)** thuộc Hệ thống Thương mại Điện tử Nội thất **DCOR Studio**. Tính năng này cung cấp giải pháp định danh toàn diện cho Khách hàng cá nhân và Khách hàng Doanh nghiệp (B2B), hỗ trợ đăng ký, đăng nhập an toàn, xác thực OTP chính chủ qua viễn thông, quản lý hồ sơ pháp lý, sổ địa chỉ giao hàng đa kênh và tự động điền (Autofill) dữ liệu vào các luồng Đặt hàng Tiêu chuẩn & Yêu cầu Custom sản phẩm trên Storefront.

## 1.2. Phạm vi (Scope)

### 1.2.1. Tính năng thuộc phạm vi (In-Scope Features)
- **FR-01: Đăng ký Tài khoản Khách hàng Mới (Customer Registration):** Form đăng ký tài khoản mới hỗ trợ kiểm tra tính hợp lệ và chống trùng lặp Email/SĐT theo thời gian thực (Real-time Validation).
- **FR-02: Xác thực OTP SMS / Zalo ZNS Chính chủ (OTP Verification Engine):** Gửi mã OTP 6 số xác minh Số điện thoại khi đăng ký mới, khi khách hàng cập nhật SĐT cá nhân, hoặc khi Khách vãng lai (Guest) gửi Yêu cầu Custom sản phẩm trên PDP.
- **FR-03: Đăng nhập Hệ thống & Dual-Token JWT Management (Authentication & JWT):** Đăng nhập bằng Email/Mật khẩu mã hóa, duy trì phiên làm việc bằng Refresh Token JWT trong HttpOnly Cookie.
- **FR-04: Đăng nhập Nhanh qua OAuth2 Social Login (Google & Zalo OA):** Đăng nhập 1-click ủy quyền từ Google Identity Services và Zalo Official Account.
- **FR-05: Cơ chế Tự động Điền Hồ sơ (Autofill Profile Engine):** Tự động truy xuất thông tin người dùng đã đăng nhập (Họ tên, SĐT, Email, Địa chỉ mặc định) và điền sẵn vào Form Checkout tiêu chuẩn và Form Yêu cầu Custom PDP.
- **FR-06: Quản lý Hồ sơ Cá nhân & Doanh nghiệp B2B (Personal & B2B Profile Management):** Cho phép cập nhật thông tin cá nhân (Họ tên, Email, Số CCCD, Avatar) và thông tin đại diện Doanh nghiệp B2B (Mã số thuế - MST, Tên Công ty, Địa chỉ xuất hóa đơn VAT).
- **FR-07: Quản lý Sổ địa chỉ Giao nhận (Shipping Address Book Management):** Thêm mới, chỉnh sửa, xóa và thiết lập địa chỉ mặc định, tích hợp API Đơn vị Hành chính Việt Nam 3 cấp (Tỉnh/Thành phố, Quận/Huyện, Phường/Xã).
- **FR-08: Mật khẩu & Khôi phục Tài khoản (Password Management & Reset):** Đổi mật khẩu định kỳ trong trang cá nhân và luồng khôi phục mật khẩu qua Email OTP / Reset Link khi bị quên.
- **🙌 Đề xuất - Cấu hình Xác thực 2 Lớp (2FA Security):** Cho phép tài khoản VIP / Khách hàng Doanh nghiệp B2B bật/tắt OTP bắt buộc mỗi khi đăng nhập.
- **🙌 Đề xuất - Lịch sử Phiên Đăng nhập & Đăng xuất Từ xa (Active Sessions Management):** Hiển thị danh sách thiết bị/trình duyệt đang đăng nhập và hỗ trợ đăng xuất khỏi các thiết bị khác chỉ với 1-click.

### 1.2.2. Tính năng ngoài phạm vi (Out-Scope Features)
- Đăng nhập và phân quyền dành cho Quản trị viên Admin / KTS / Nhân viên Sales nội bộ (Do phân hệ **FRD-ADM-12 / Admin Login & RBAC** đảm nhiệm).
- Xử lý giao dịch thanh toán đặt cọc tiền mặt hoặc cổng thanh toán trực tuyến (Do phân hệ **FRD-USR-03** & **FRD-INT-13** đảm nhiệm).

---

# 2. User Story & Tiêu chí nghiệm thu (Acceptance Criteria)

## US-01: Đăng ký Tài khoản Khách hàng Mới
> *Với tư cách là **Khách hàng mới**, tôi muốn đăng ký tài khoản DCOR Studio bằng Email/SĐT và xác thực OTP, để có thể lưu trữ hồ sơ mua hàng và được tự động điền thông tin khi đặt hàng.*

### Tiêu chí nghiệm thu (Acceptance Criteria)
- **Scenario 1.1: Đăng ký Thành công với Thông tin Hợp lệ**
  - **Given:** Khách hàng ở màn hình Đăng ký (`/auth/register`).
  - **When:** Nhập Họ tên, Email hợp lệ, SĐT chưa tồn tại, Mật khẩu đạt chuẩn độ phức tạp (tối thiểu 8 ký tự, có chữ hoa, chữ thường và số), và bấm nút **"Đăng Ký"**.
  - **Then:** Hệ thống gửi mã OTP 6 số qua SMS / Zalo ZNS tới SĐT đã nhập và chuyển giao diện sang Pop-up "Xác thực OTP SĐT".
  - **And:** Khi nhập đúng mã OTP, hệ thống khởi tạo bản ghi `users` (status = `ACTIVE`, `phone_verified = true`), phát tín hiệu đăng ký thành công và tự động đăng nhập đưa người dùng về trang chủ.

- **Scenario 1.2: Báo lỗi khi Trùng Email hoặc Số điện thoại**
  - **Given:** Khách hàng nhập Email `khachhang@gmail.com` hoặc SĐT `0901234567` đã tồn tại trong CSDL.
  - **When:** Hệ thống thực hiện kiểm tra real-time khi con trỏ rời khỏi ô nhập (Blur Event) hoặc khi bấm nút Đăng ký.
  - **Then:** Ô nhập hiển thị đường viền đỏ kèm dòng cảnh báo đỏ bên dưới: *"Email/Số điện thoại này đã được đăng ký. Vui lòng đăng nhập hoặc dùng thông tin khác."*
  - **And:** Vẫn giữ nguyên trạng thái nút Đăng ký ở dạng vô hiệu hóa (Disabled).

- **Scenario 1.3: Xử lý Mã OTP Hết hạn hoặc Nhập Sai**
  - **Given:** Khách hàng đang ở Modal nhập OTP xác minh đăng ký.
  - **When:** Khách nhập sai mã OTP 3 lần liên tiếp hoặc nhập sau khi đếm ngược 180 giây kết thúc.
  - **Then:** Hệ thống hiển thị thông báo lỗi: *"Mã OTP không chính xác hoặc đã hết hạn. Vui lòng bấm 'Gửi lại mã'."*
  - **And:** Nút "Gửi lại mã OTP" mở khóa sau 60 giây Cooldown.

---

## US-02: Đăng nhập Hệ thống & Social Login
> *Với tư cách là **Khách hàng đã có tài khoản**, tôi muốn đăng nhập bằng Email/SĐT hoặc tài khoản Google/Zalo, để truy cập nhanh vào lịch sử đơn hàng và yêu cầu custom.*

### Tiêu chí nghiệm thu (Acceptance Criteria)
- **Scenario 2.1: Đăng nhập Thành công qua Email & Mật khẩu**
  - **Given:** Khách hàng ở trang Đăng nhập (`/auth/login`).
  - **When:** Nhập đúng Email/SĐT và Mật khẩu, rồi bấm **"Đăng Nhập"**.
  - **Then:** Hệ thống xác thực thông tin mã hóa Bcrypt thành công.
  - **And:** Trả về cặp Token bao gồm: **Access Token JWT** (lưu trên Memory/State, hết hạn sau 15 phút) và **Refresh Token JWT** (được lưu trong HttpOnly Cookie an toàn, hết hạn sau 30 ngày).
  - **And:** Cập nhật `last_login_at` và chuyển hướng người dùng về trang trước đó (hoặc `/account/profile`).

- **Scenario 2.2: Đăng nhập Nhanh qua Google OAuth2 / Zalo OA**
  - **Given:** Khách hàng bấm nút **"Đăng nhập bằng Google"** hoặc **"Đăng nhập bằng Zalo"**.
  - **When:** Ủy quyền thành công từ Google/Zalo Identity Provider.
  - **Then:** Hệ thống kiểm tra Email/Social ID:
    - *Nếu chưa có:* Tự động tạo bản ghi `users` mới với avatar và thông tin từ Google/Zalo.
    - *Nếu đã có:* Cập nhật thông tin và cấp phiên đăng nhập JWT.
  - **And:** Đưa người dùng về trạng thái đã đăng nhập thành công.

- **Scenario 2.3: Khóa Tài khoản Tạm thời khi Nhập sai Mật khẩu Quá 5 Lần**
  - **Given:** Người dùng nhập sai mật khẩu 5 lần liên tiếp cho cùng 1 tài khoản.
  - **When:** Lần thứ 5 bị thất bại.
  - **Then:** Hệ thống khóa tạm thời khả năng đăng nhập của tài khoản đó trong vòng 15 phút.
  - **And:** Hiển thị thông báo: *"Tài khoản tạm thời bị khóa do nhập sai mật khẩu quá 5 lần. Vui lòng thử lại sau 15 phút hoặc bấm 'Quên mật khẩu'."*

---

## US-03: Tự động Điền (Autofill) Profile & Quản lý Hồ sơ
> *Với tư cách là **Khách hàng**, tôi muốn hệ thống tự động điền thông tin của tôi khi tạo đơn và cho phép cập nhật thông tin cá nhân/doanh nghiệp B2B.*

### Tiêu chí nghiệm thu (Acceptance Criteria)
- **Scenario 3.1: Cơ chế Tự động Điền (Autofill) sang Form Mua hàng & Form Custom**
  - **Given:** Khách hàng đã đăng nhập thành công vào hệ thống.
  - **When:** Khách truy cập vào trang Checkout Đặt hàng hoặc mở Form "Custom sản phẩm" trên PDP.
  - **Then:** Hệ thống tự động điền (Autofill) 100% các trường: Họ tên (`users.full_name`), SĐT (`users.phone`), Email (`users.email`), Địa chỉ mặc định (`customer_addresses.default`).
  - **And:** Nếu Khách giữ nguyên SĐT cũ ➔ Cho phép bấm nút gửi ngay mà không cần xác thực lại OTP.

- **Scenario 3.2: Đổi Số điện thoại Bắt buộc Xác thực OTP Mới**
  - **Given:** Khách hàng đã đăng nhập thay đổi SĐT trong Form Profile hoặc Form Custom sang một SĐT mới (`phone_new != users.phone`).
  - **When:** Bấm nút "Lưu thay đổi" hoặc "Gửi yêu cầu".
  - **Then:** Hệ thống kích hoạt phân nhánh gửi mã OTP SMS/ZNS tới SĐT mới.
  - **And:** Chỉ sau khi nhập đúng OTP ➔ Hệ thống mới cập nhật `users.phone = phone_new` và đánh dấu `phone_verified = true`.

- **Scenario 3.3: Bổ sung Thông tin Pháp lý Doanh nghiệp B2B**
  - **Given:** Khách hàng đại diện Doanh nghiệp mua hàng cần xuất hóa đơn VAT.
  - **When:** Chuyển tab sang "Thông tin Doanh nghiệp B2B" trong Profile, nhập Tên Công ty, Mã số thuế (MST), và Địa chỉ đăng ký kinh doanh.
  - **Then:** Hệ thống kiểm tra cú pháp MST (10 hoặc 13 chữ số) và lưu vào cấu trúc JSONB `business_profile` trong `users`.

---

# 3. Yêu cầu Chức năng chi tiết (Functional Requirements)

## 3.1. Yêu cầu chung (Common Requirements)
- **Kiến trúc Token Security:** Sử dụng mô hình Dual-Token (JWT Access Token 15 phút + Refresh Token 30 ngày trong `HttpOnly`, `SameSite=Strict`, `Secure` Cookie).
- **Mã hóa Mật khẩu:** 100% mật khẩu người dùng phải được mã hóa bằng thuật toán Bcrypt với Salt Factor = 12 trước khi lưu vào CSDL.
- **Ràng buộc Gửi mã OTP:**
  - Mã OTP ngẫu nhiên gồm 6 chữ số (`000000` - `999999`).
  - Mã OTP có hiệu lực trong vòng **180 giây**.
  - Cooldown giữa 2 lần yêu cầu gửi OTP tối thiểu là **60 giây**.
  - Giới hạn tối đa **5 lần gửi OTP / 1 Số điện thoại / 1 giờ** để chống Spam/DDoS.

---

## 3.2. Yêu cầu Chức năng Chi tiết (Functional Requirements Details)

### FR-01: Đăng ký Tài khoản Khách hàng Mới (Customer Registration)

- **Description:** Cung cấp giao diện biểu mẫu đăng ký cho phép người dùng mới tạo tài khoản khách hàng cá nhân hoặc doanh nghiệp trên hệ thống DCOR Studio.
- **Business Rules:**
    - **Email Uniqueness:** Mỗi địa chỉ Email chỉ được đăng ký duy nhất một tài khoản `users`.
    - **Phone Uniqueness:** Mỗi Số điện thoại chỉ được gắn với một tài khoản duy nhất.
    - **Password Complexity:** Mật khẩu tối thiểu 8 ký tự, phải bao gồm ít nhất 1 chữ hoa (A-Z), 1 chữ thường (a-z) và 1 chữ số (0-9).
    - **Initial Account Status:** Tài khoản sau khi đăng ký thành công sẽ có `status = ACTIVE` và `role = CUSTOMER`.
- **Pre-conditions:** Khách hàng truy cập trang Đăng ký (`/auth/register`) và chưa có phiên đăng nhập trên hệ thống.
- **Use Case Specification:**

    | Action (Người dùng) | System Behavior (Hệ thống) |
    | --- | --- |
    | Truy cập trang `/auth/register` | Hệ thống hiển thị Form đăng ký gồm Họ tên, Email, SĐT, Mật khẩu và Xác nhận Mật khẩu. |
    | Nhập giá trị vào ô Email / SĐT | Hệ thống thực hiện validation real-time (Blur event). Kiểm tra trùng lặp CSDL bất đồng bộ. |
    | Nhấp nút **"Đăng Ký"** | 1. Hệ thống kiểm tra tính hợp lệ toàn bộ Form.<br>2. Tạo mã OTP 6 số và gửi tới SĐT via SMS Gateway / Zalo ZNS.<br>3. Mở Pop-up Modal "Xác thực OTP SĐT". |
    | Nhập đúng mã OTP 6 số | 1. Đánh dấu `phone_verified = true`.<br>2. Lưu bản ghi `users` vào CSDL.<br>3. Phát tín hiệu tạo tài khoản thành công & cấp token đăng nhập. |

- **Post-conditions:** Bản ghi `users` mới được lưu trữ trong CSDL PostgreSQL với `status = ACTIVE` và `phone_verified = true`. Cấp cặp Access Token & Refresh Token JWT, khởi tạo phiên làm việc của người dùng và chuyển hướng tự động về Trang chủ Storefront.
- **UI Fields Matrix:**

    | Field Name | UI Component | Data Type | Mandatory | Default | Constraints / Logic |
    | --- | --- | --- | --- | --- | --- |
    | Full Name | Text Input | String | Yes | Empty | Max 100 chars. Auto capitalize words. |
    | Email Address | Text Input | String | Yes | Empty | Valid email regex. Unique in DB. |
    | Phone Number | Text Input | String | Yes | Empty | Valid VN Phone regex (10 digits). Unique in DB. |
    | Password | Password Input | String | Yes | Empty | Min 8 chars, 1 uppercase, 1 lowercase, 1 digit. |
    | Confirm Password | Password Input | String | Yes | Empty | Must match Password field 100%. |

---

### FR-02: Xác thực OTP SMS / Zalo ZNS Chính chủ (OTP Verification Engine)

- **Description:** Xử lý khởi tạo, gửi, đếm ngược và xác minh mã OTP 6 số qua kênh SMS Brandname hoặc Zalo ZNS nhằm đảm bảo SĐT là chính chủ.
- **Business Rules:**
    - **OTP Generation:** Mã ngẫu nhiên 6 chữ số (`Math.floor(100000 + Math.random() * 900000)`).
    - **TTL (Time-To-Live):** Mã OTP có hiệu lực trong **180 giây**. Quá 180 giây mã tự hủy.
    - **Resend Cooldown:** Nút "Gửi lại mã OTP" bị vô hiệu hóa trong **60 giây** Cooldown kể từ khi gửi mã trước.
    - **Max Retry Limit:** Nếu nhập sai mã OTP 3 lần ➔ Khóa ô nhập mã, yêu cầu bấm "Gửi lại mã".
    - **Rate Limit:** Tối đa 5 lượt gửi OTP / SĐT / 60 phút.
- **Pre-conditions:** Hệ thống đã khởi tạo mã OTP 6 số trong Cache/Redis và kích hoạt Modal "Xác thực OTP SĐT" trên giao diện (từ luồng FR-01, FR-06, FR-05 hoặc Ký Hợp đồng OTP).
- **Use Case Specification:**

    | Action (Người dùng) | System Behavior (Hệ thống) |
    | --- | --- |
    | Hệ thống kích hoạt OTP Flow | Modal OTP hiển thị với 6 ô nhập chữ số, dòng chữ "Mã OTP đã được gửi tới SĐT 090***567" và đồng hồ đếm ngược 180s. |
    | Nhập đủ 6 chữ số OTP | Hệ thống gửi API xác thực. Nếu đúng: Đóng Modal, trả về callback `verified = true`. |
    | Nhập sai mã OTP | Hệ thống làm rung 6 ô nhập, báo đỏ text *"Mã OTP không đúng (Còn X/3 lần thử)"*, xóa trắng 6 ô. |
    | Bấm nút **"Gửi lại mã"** | Hệ thống kiểm tra Cooldown 60s & Rate Limit. Tạo OTP mới, gửi tin nhắn SMS/ZNS mới và reset đồng hồ 180s. |

- **Post-conditions:** Số điện thoại được đánh dấu xác thực thành công (`phone_verified = true`). Mã OTP đã dùng bị thu hồi khỏi Cache/Redis. Callback được gửi trả lại cho luồng gọi ban đầu (Đăng ký, Đổi SĐT, hoặc gửi Yêu cầu Custom PDP).

---

### FR-03: Đăng nhập Hệ thống & Dual-Token JWT Management (Authentication & JWT)

- **Description:** Xác thực danh tính người dùng bằng Email/SĐT và Mật khẩu, quản lý phiên làm việc bảo mật với mô hình Dual-Token JWT.
- **Business Rules:**
    - **Credential Check:** Kiểm tra Email/SĐT trong DB, so sánh hash password via Bcrypt Compare.
    - **Brute-Force Protection:** Nhập sai mật khẩu 5 lần liên tiếp ➔ Khóa tài khoản trong 15 phút (`lockout_until = NOW() + 15m`).
    - **Dual-Token Payload:**
        - **Access Token:** Chứa `user_id`, `role`, `email`, thời hạn 15 phút. Lưu trong Memory/RxJS State.
        - **Refresh Token:** Chứa `token_id`, `user_id`, thời hạn 30 ngày. Lưu trong Cookie `HttpOnly; Secure; SameSite=Strict`.
    - **Auto Token Refresh:** Angular HTTP Interceptor tự động bắt lỗi 401 Unauthorized và gửi Refresh Token để lấy Access Token mới mà không làm gián đoạn trải nghiệm người dùng.
- **Pre-conditions:** Người dùng ở trang Đăng nhập (`/auth/login`) và chưa có phiên làm việc (Token) hợp lệ.
- **Use Case Specification:**

    | Action (Người dùng) | System Behavior (Hệ thống) |
    | --- | --- |
    | Truy cập `/auth/login` | Hiển thị Form Đăng nhập (Email/SĐT + Password) & Các nút Social Login. |
    | Nhập tài khoản và bấm **"Đăng Nhập"** | Hệ thống kiểm tra thông tin. Nếu hợp lệ: Cấp Access Token + Refresh Cookie, cập nhật `last_login_at`, chuyển hướng về trang trước đó. |
    | Nhập sai thông tin | Hiển thị Toast thông báo đỏ: *"Email/SĐT hoặc Mật khẩu không chính xác"*. Tăng số lần thử sai. |
    | Nhấp nút **"Đăng xuất"** | Hệ thống xóa Access Token trong State, gọi API hủy Refresh Token Cookie và chuyển về trang chủ. |

- **Post-conditions:** Tạo Access Token JWT (15m) trên Client Memory/State và Cookie `HttpOnly` chứa Refresh Token JWT (30 ngày). Cập nhật mốc thời gian `last_login_at` trong CSDL, xóa đếm số lần nhập sai `login_attempts = 0`.

---

### FR-04: Đăng nhập Nhanh qua OAuth2 Social Login (Google & Zalo OA)

- **Description:** Cho phép người dùng đăng nhập 1-click thông qua tài khoản Google hoặc Zalo mà không cần khởi tạo mật khẩu thủ công.
- **Business Rules:**
    - **Identity Mapping:** Ánh xạ tài khoản qua `google_id` hoặc `zalo_id` trong DB.
    - **Auto Account Creation:** Nếu Email từ Google/Zalo chưa tồn tại trong `users` ➔ Tự động khởi tạo tài khoản mới với `status = ACTIVE`, `email_verified = true`, lấy avatar từ Profile Social.
    - **Existing Email Linking:** Nếu Email từ Social trùng với tài khoản đã đăng ký thủ công ➔ Tự động liên kết `google_id` vào tài khoản đó.
- **Pre-conditions:** Khách hàng nhấp nút "Đăng nhập bằng Google" hoặc "Đăng nhập bằng Zalo" và hoàn tất xác thực trên giao diện ủy quyền của Social Identity Provider.
- **Use Case Specification:**

    | Action (Người dùng) | System Behavior (Hệ thống) |
    | --- | --- |
    | Bấm **"Đăng nhập bằng Google"** | Mở Pop-up ủy quyền Google OAuth2 (`accounts.google.com`). |
    | Hoàn tất ủy quyền Google | Google trả về `id_token`. Backend DCOR verify `id_token` với Google API server-side. |
    | Backend xác thực thành công | Kiểm tra/tạo bản ghi `users`, cấp cặp JWT Token và đóng Pop-up social. |

- **Post-conditions:** Tài khoản người dùng được khởi tạo mới (nếu chưa có) hoặc liên kết Social ID (nếu đã có). Cấp cặp Token JWT đăng nhập, đóng Pop-up ủy quyền và đưa người dùng vào trạng thái Đăng nhập thành công.

---

### FR-05: Cơ chế Tự động Điền Profile (Autofill Profile Engine into Checkout & Custom Form)

- **Description:** Tự động điền dữ liệu hồ sơ cá nhân của người dùng đã đăng nhập vào Form Checkout mua sắm tiêu chuẩn và Form Yêu cầu Custom PDP.
- **Business Rules:**
    - **Autofill Trigger:** Khi Form được khởi tạo trên giao diện (Angular `ngOnInit`), hệ thống đọc thông tin từ `auth.service` state.
    - **Fields Mapped:**
        - `full_name` ➔ Điền vào ô Họ và tên.
        - `phone` ➔ Điền vào ô Số điện thoại.
        - `email` ➔ Điền vào ô Email.
        - `customer_addresses.default` ➔ Tự động chọn Địa chỉ giao hàng mặc định.
    - **Conditional OTP Verification:**
        - Nếu giữ nguyên SĐT cũ ➔ Cho phép gửi Form trực tiếp.
        - Nếu sửa SĐT sang số mới (`phone_new != users.phone`) hoặc là Khách vãng lai (`GUEST`) ➔ Bắt buộc kích hoạt FR-02 xác thực OTP.
- **Pre-conditions:** Người dùng đã đăng nhập hợp lệ và mở Form Checkout Đặt hàng hoặc Form Yêu cầu Custom PDP.
- **Use Case Specification:**

    | Action (Người dùng) | System Behavior (Hệ thống) |
    | --- | --- |
    | Khách đã đăng nhập mở Form Custom PDP | Hệ thống load sẵn 100% thông tin Họ tên, Email, SĐT vào Form. Khách chỉ cần nhập mô tả custom & budget. |
    | Khách giữ nguyên SĐT và bấm **"Gửi yêu cầu"** | Hệ thống tạo ngay bản ghi `design_requests` (PENDING) mà không hỏi OTP. |
    | Khách sửa SĐT sang số mới và bấm **"Gửi yêu cầu"** | Hệ thống giữ Form và kích hoạt Modal FR-02 bắt buộc xác thực OTP cho SĐT mới. |

- **Post-conditions:** 100% các trường thông tin Họ tên, Email, SĐT và Địa chỉ mặc định được điền sẵn chính xác. Form được gửi đi trực tiếp (nếu giữ nguyên SĐT) hoặc chuyển qua bước OTP FR-02 (nếu đổi SĐT mới).

---

### FR-06: Cập nhật Hồ sơ Cá nhân & Thông tin Doanh nghiệp B2B (Personal & B2B Profile Management)

- **Description:** Cho phép Khách hàng quản lý thông tin cá nhân (Avatar, Họ tên, Email, CCCD) và thông tin pháp lý Doanh nghiệp B2B để xuất hóa đơn GTGT (VAT).
- **Business Rules:**
    - **Identity Document (CCCD):** Số CCCD gồm 12 chữ số. Không bắt buộc với khách hàng cá nhân thông thường.
    - **B2B Tax Profile:** Lưu trữ trong cấu trúc JSONB `business_profile`:
        - `tax_id`: Mã số thuế 10 hoặc 13 chữ số.
        - `company_name`: Tên công ty đầy đủ theo giấy phép ĐKKD.
        - `billing_address`: Địa chỉ trụ sở ghi trên hóa đơn VAT.
- **Pre-conditions:** Khách hàng đã đăng nhập và đang ở trang Quản lý Hồ sơ (`/account/profile`).
- **Use Case Specification:**

    | Action (Người dùng) | System Behavior (Hệ thống) |
    | --- | --- |
    | Truy cập trang `/account/profile` | Hiển thị Form thông tin cá nhân và Tab "Thông tin Doanh nghiệp B2B". |
    | Nhập Tên Công ty, MST và bấm **"Lưu Hồ Sơ B2B"** | Hệ thống kiểm tra cú pháp MST (Regex `^[0-9]{10}([0-9]{3})?$`). Lưu vào `users.business_profile`. |
    | Thay đổi Ảnh đại diện (Avatar) | Bật hộp thoại chọn ảnh, upload lên Cloud Storage (PNG/JPG, max 5MB), cập nhật `avatar_url`. |

- **Post-conditions:** Dữ liệu cá nhân (`full_name`, `avatar_url`, `identity_card`) hoặc thông tin Doanh nghiệp B2B (`business_profile` JSONB) được cập nhật chính xác vào CSDL PostgreSQL. Ghi nhận sự kiện `PROFILE_UPDATED` trong Audit Log.
- **UI Fields Matrix:**

    | Field Name | UI Component | Data Type | Mandatory | Default | Constraints / Logic |
    | --- | --- | --- | --- | --- | --- |
    | Full Name | Text Input | String | Yes | Profile Val | Max 100 chars. |
    | Email | Text Input | String | Yes | Profile Val | Read-only hoặc cần xác minh nếu đổi. |
    | Phone | Text Input | String | Yes | Profile Val | Kích hoạt FR-02 OTP nếu thay đổi. |
    | Identity Card (CCCD) | Text Input | String | No | Empty | 12 numeric digits. |
    | Tax ID (MST) | Text Input | String | No | Empty | 10 or 13 numeric digits. |
    | Company Name | Text Input | String | No | Empty | Max 255 chars. |
    | Billing Address | Textarea | String | No | Empty | Max 255 chars. |

---

### FR-07: Quản lý Sổ địa chỉ Giao nhận 3 Cấp Hành chính (Shipping Address Book Management)

- **Description:** Cho phép Khách hàng lưu trữ nhiều địa chỉ giao hàng và quản lý danh mục địa chỉ hành chính 3 cấp (Tỉnh/Thành, Quận/Huyện, Phường/Xã).
- **Business Rules:**
    - **Max Addresses:** Tối đa 10 địa chỉ giao hàng / 1 tài khoản khách hàng.
    - **Default Address Single Constraint:** Trong danh sách địa chỉ của 1 user, chỉ duy nhất **01 địa chỉ** được mang giá trị `is_default = true`. Khi gán 1 địa chỉ thành mặc định, các địa chỉ còn lại tự động chuyển `is_default = false`.
    - **Cascading Dropdowns:**
        - Chọn Tỉnh/Thành ➔ Load danh sách Quận/Huyện tương ứng.
        - Chọn Quận/Huyện ➔ Load danh sách Phường/Xã tương ứng.
- **Pre-conditions:** Khách hàng đã đăng nhập và truy cập trang Sổ địa chỉ (`/account/addresses`).
- **Use Case Specification:**

    | Action (Người dùng) | System Behavior (Hệ thống) |
    | --- | --- |
    | Bấm **"+ Thêm địa chỉ mới"** | Mở Modal Form gồm Tên người nhận, SĐT, Tỉnh/Thành, Quận/Huyện, Phường/Xã, Số nhà và Checkbox Mặc định. |
    | Chọn Tỉnh "Thành phố Hồ Chí Minh" | Dropdown Quận/Huyện tự động reset và load danh sách các Quận/Huyện thuộc TP.HCM. |
    | Bấm **"Lưu Địa Chỉ"** | Lưu bản ghi vào bảng `customer_addresses`, cập nhật danh sách hiển thị trên UI. |
    | Bấm nút **"Xóa"** trên địa chỉ | Hiển thị Modal xác nhận xóa. Nếu đồng ý: Xóa bản ghi khỏi DB. |

- **Post-conditions:** Bản ghi địa chỉ mới/sửa/xóa được lưu trữ trong bảng `customer_addresses`. Đảm bảo quy tắc ràng buộc duy nhất 01 địa chỉ mang `is_default = true` cho tài khoản.

---

### FR-08: Mật khẩu & Khôi phục Tài khoản (Password Management & Reset)

- **Description:** Cung cấp tính năng đổi mật khẩu cho người dùng đã đăng nhập và luồng khôi phục mật khẩu an toàn qua Email Reset Link khi bị quên mật khẩu.
- **Business Rules:**
    - **Password Change Validation:** Bắt buộc nhập đúng "Mật khẩu hiện tại" trước khi cho phép nhập "Mật khẩu mới".
    - **Reset Token Expiry:** Link khôi phục mật khẩu gửi qua Email chứa `reset_token` ngẫu nhiên bảo mật, có thời hạn **15 phút**.
    - **One-time Use:** `reset_token` chỉ được sử dụng đúng **01 lần**. Sau khi reset thành công ➔ Token lập tức bị vô hiệu hóa trong DB.
- **Pre-conditions:** Người dùng chọn "Quên mật khẩu" tại trang Login (`/auth/login`) hoặc truy cập mục "Bảo mật" trong trang Account Profile.
- **Use Case Specification:**

    | Action (Người dùng) | System Behavior (Hệ thống) |
    | --- | --- |
    | Bấm **"Quên mật khẩu?"** trên trang Login | Chuyển sang màn hình `/auth/forgot-password`, yêu cầu nhập Email đã đăng ký. |
    | Nhập Email và bấm **"Gửi yêu cầu"** | Hệ thống tạo `reset_token` (hạn 15m), gửi Email chứa Link `dcor.vn/auth/reset-password?token=XXX`. |
    | Click Link trong Email | Mở màn hình Đặt lại mật khẩu. Hệ thống verify `token`. Nếu hợp lệ ➔ Cho nhập Mật khẩu mới. |
    | Nhập Mật khẩu mới và bấm **"Cập nhật"** | Mã hóa password mới via Bcrypt, lưu DB, xóa `reset_token`, báo thành công và chuyển về Login. |

- **Post-conditions:** Mật khẩu mới được mã hóa Bcrypt salt factor = 12 và lưu vào CSDL. Token khôi phục bị vô hiệu hóa. Đồng thời tự động đăng xuất tất cả các phiên làm việc hiện tại trên các thiết bị khác (Revoke Refresh Tokens).

---

## 3.3. Cảnh báo lỗi & Phản hồi hệ thống (Error Messages & System Feedback)

| Sự kiện / Điều kiện | Loại Phản hồi | Nội dung Thông báo | Thao tác Xử lý |
| --- | --- | --- | --- |
| Email đã Tồn tại | Inline Error | `"Email này đã được đăng ký. Vui lòng đăng nhập hoặc dùng Email khác."` | Viền đỏ ô Email. Chặn nút Đăng ký. |
| SĐT đã Tồn tại | Inline Error | `"Số điện thoại này đã được sử dụng."` | Viền đỏ ô SĐT. Chặn nút bấm. |
| Sai Mật khẩu / Email | Toast Error | `"Email/Số điện thoại hoặc Mật khẩu không chính xác."` | Toast màu đỏ góc trên phải. |
| Nhập Sai OTP | Modal Error | `"Mã OTP không đúng. Vui lòng kiểm tra lại tin nhắn."` | Viền đỏ các ô OTP, xóa trắng ô OTP. |
| Mã OTP Hết hạn | Modal Error | `"Mã OTP đã hết hạn (quá 3 phút). Vui lòng bấm 'Gửi lại mã'."` | Mở khóa nút Resend OTP. |
| Khóa Tài khoản 15 phút | Toast Error | `"Tài khoản bị tạm khóa 15 phút do thử sai mật khẩu 5 lần."` | Chặn đăng nhập phía Server API (HTTP 429). |
| Đăng ký Thành công | Toast Success | `"Đăng ký tài khoản thành công! Đang chuyển hướng..."` | Toast xanh lá, tự chuyển trang sau 1.5s. |
| Cập nhật Profile OK | Toast Success | `"Hồ sơ cá nhân đã được cập nhật thành công."` | Toast xanh lá, tự ẩn sau 3s. |

---

# 4. Yêu cầu Phi chức năng (Non-Functional Requirements)

- **Performance (Hiệu năng):**
  - Thời gian xử lý API Đăng nhập / Đăng ký: **< 200ms**.
  - Thời gian gửi & nhận mã OTP SMS / ZNS tới điện thoại khách: **< 3 giây**.
- **Security (Bảo mật):**
  - Chống tấn công Brute-Force: Giới hạn Rate Limiting 10 requests / phút / IP cho tất cả các endpoint thuộc nhóm `/api/v1/auth/*`.
  - Chống lỗ hổng XSS & CSRF: Refresh Token lưu trữ trong `HttpOnly` Cookie. Đạt chứng chỉ bảo mật OWASP Top 10.
- **Reliability (Độ tin cậy):**
  - Cổng gửi OTP có cơ chế Fallback tự động: Nếu Zalo ZNS thất bại ➔ Tự động chuyển hướng sang SMS Brandname.
- **Auditability (Khả năng truy vết):**
  - Ghi nhật ký Audit Log cho 100% các hành động liên quan đến bảo mật: Đăng nhập, Đổi mật khẩu, Xác thực OTP thành công/thất bại, Đổi SĐT.

---

# 5. Prototype & Tài liệu liên quan (Related Documents)

- **Sơ đồ CSDL liên quan:** Bảng `users`, `customer_profiles`, `customer_addresses`.
- **Tài liệu quy trình liên quan:**
  - [bpmn_purchase_process.md](file:///d:/00_LEARNING/0_Study/HocChinhUEL/4_1_LapTrinhWebNangCao/DoAn/Dev/dcor_Angular/bpmn_purchase_process.md)
  - [bpmn_custom_order_process.md](file:///d:/00_LEARNING/0_Study/HocChinhUEL/4_1_LapTrinhWebNangCao/DoAn/Dev/dcor_Angular/bpmn_custom_order_process.md)
  - [FRD - Custom Order & OTP Contract.md](file:///d:/00_LEARNING/0_Study/HocChinhUEL/4_1_LapTrinhWebNangCao/DoAn/Dev/dcor_Angular/FRD/FRD-user/FRD%20-%20Custom%20Order%20&%20OTP%20Contract.md)
