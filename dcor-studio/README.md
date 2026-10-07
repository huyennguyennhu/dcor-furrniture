# Hướng Dẫn Chạy Dự Án DCor Studio (Angular)

Dự án này là phiên bản Frontend sử dụng **Angular 19**. Dưới đây là các bước cơ bản để khởi động và xử lý lỗi thường gặp (như kẹt cổng).

## 1. Mở Dự Án Lên Trình Duyệt

1. Mở **Command Prompt (CMD)** hoặc **PowerShell** hoặc **Terminal** trong VSCode.
2. Trỏ đường dẫn vào thư mục dự án:
   ```bash
   cd dcor-studio
   ```
3. Cài đặt các gói thư viện (nếu bạn chưa cài hoặc vừa clone về):
   ```bash
   npm install
   ```
4. Khởi động dự án:
   ```bash
   npm start
   # hoặc: ng serve
   ```
5. Mở trình duyệt (Chrome, Edge, Safari...) và truy cập:
   - **Trang dành cho Khách hàng:** [http://localhost:4200](http://localhost:4200)
   - **Trang dành cho Quản trị (Admin):** [http://localhost:4200/admin](http://localhost:4200/admin)

---

## 2. Xử Lý Lỗi "Cổng 4200 Đã Bị Sử Dụng" (Kill Port)

Nếu bạn chạy `npm start` mà gặp lỗi **"Port 4200 is already in use"**, tức là bạn đã có một terminal khác đang chạy hoặc ứng dụng bị treo mà chưa tắt.

Bạn có thể sửa lỗi này bằng cách tắt (kill) tiến trình đang chiếm cổng 4200.

### Trên Windows
1. Mở **PowerShell** (hoặc CMD) với quyền Administrator (nếu cần).
2. Chạy lệnh sau để tìm xem tiến trình nào đang dùng cổng 4200:
   ```cmd
   netstat -ano | findstr :4200
   ```
   > Kết quả trả về sẽ có 1 con số (PID) ở cột cuối cùng. Ví dụ: `TCP 0.0.0.0:4200 ... LISTENING 12345` (số 12345 là PID).
3. Chạy lệnh tắt (kill) tiến trình đó (thay `12345` bằng số PID bạn vừa tìm thấy):
   ```cmd
   taskkill /PID 12345 /F
   ```
4. Quay lại chạy `npm start`.

### Cách Nhanh Hơn Bằng PowerShell
Chỉ cần dán 1 dòng lệnh này vào PowerShell, nó sẽ tự động tìm và tắt cổng 4200 ngay lập tức:
```powershell
Stop-Process -Id (Get-NetTCPConnection -LocalPort 4200).OwningProcess -Force
```

---

## 3. Chạy Server Bằng Một Cổng Khác (Tùy Chọn)
Nếu bạn không muốn tắt ứng dụng cũ, bạn có thể bảo Angular chạy ứng dụng này trên một cổng khác (ví dụ 4201):
```bash
ng serve --port 4201
```
Khi đó, truy cập bằng đường link: `http://localhost:4201`.

---

## 4. Cấu Trúc Cây Thư Mục Dự Án (Project Structure)

Dự án được tổ chức theo kiến trúc **Feature-based** (dựa trên tính năng), giúp mã nguồn gọn gàng và dễ bảo trì. Dưới đây là ý nghĩa của các file và thư mục quan trọng:

```text
dcor-studio/
├── src/
│   ├── app/
│   │   ├── features/          # Chứa các trang & tính năng chính của ứng dụng
│   │   │   ├── admin/         # Giao diện quản trị viên (Dashboard, Products, Orders...)
│   │   │   ├── auth/          # Giao diện xác thực (Đăng nhập, Đăng ký...)
│   │   │   ├── account/       # Giao diện tài khoản người dùng (Hồ sơ, Lịch sử mua hàng...)
│   │   │   └── store/         # Giao diện cửa hàng (Trang chủ, Chi tiết sản phẩm, Giỏ hàng...)
│   │   ├── shared/            # Chứa các thành phần dùng chung ở nhiều nơi
│   │   │   ├── components/    # UI Components tái sử dụng (Bảng, Modal, Slider...)
│   │   │   └── models/        # Định nghĩa kiểu dữ liệu TypeScript (Interfaces, Types)
│   │   ├── core/              # Chứa các service cốt lõi (Nếu có - vd: API service, Config...)
│   │   └── app.routes.ts      # File cấu hình Routing (điều hướng URL) cho toàn bộ ứng dụng
│   ├── assets/                # Chứa tài nguyên tĩnh (hình ảnh, fonts, icons...)
│   ├── dcor-styles.css        # File cấu hình CSS toàn cục (đã tích hợp Tailwind v4)
│   ├── index.html             # File HTML gốc (entry HTML)
│   └── main.ts                # File khởi chạy ứng dụng Angular
├── public/                    # Chứa các tệp public như favicon, logo
├── angular.json               # Cấu hình chính của Angular Workspace
├── package.json               # Danh sách thư viện và các script (npm start, build...)
└── tsconfig.json              # Cấu hình TypeScript cho dự án
```
