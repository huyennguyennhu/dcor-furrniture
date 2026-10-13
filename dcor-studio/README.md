# Hướng Dẫn Chạy Dự Án DCor Studio (Angular)

Dự án này là phiên bản Frontend sử dụng **Angular 21**. Dưới đây là các bước cơ bản để khởi động và xử lý lỗi thường gặp (như kẹt cổng).

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

Frontend được tổ chức theo kiến trúc **Feature-based**: mỗi khu vực nghiệp vụ nằm trong `features`, phần dùng chung ở `shared`, còn dịch vụ và xử lý xác thực dùng chung nằm trong `core`.

```text
dcor-studio/
├── src/
│   ├── app/
│   │   ├── app.config.ts                 # Cấu hình providers của ứng dụng
│   │   ├── app.routes.ts                 # Routing cấp ứng dụng
│   │   ├── app.ts / app.html / app.css   # Component gốc
│   │   ├── app.spec.ts                   # Test component gốc
│   │   ├── core/
│   │   │   ├── guards/
│   │   │   │   ├── admin.guard.ts        # Bảo vệ các route quản trị
│   │   │   │   └── admin.guard.spec.ts
│   │   │   ├── interceptors/
│   │   │   │   ├── auth-interceptor.ts
│   │   │   │   ├── auth-interceptor.spec.ts
│   │   │   │   └── auth.interceptor.ts   # Interceptor xác thực
│   │   │   └── services/
│   │   │       ├── auth.service.ts       # Đăng nhập và trạng thái xác thực
│   │   │       ├── auth.service.spec.ts
│   │   │       ├── cart.service.ts       # Trạng thái và thao tác giỏ hàng
│   │   │       ├── cart.service.spec.ts
│   │   │       ├── custom-order.ts       # Dữ liệu/logic đơn hàng thiết kế riêng
│   │   │       ├── product.service.ts    # Truy xuất dữ liệu sản phẩm
│   │   │       └── product.service.spec.ts
│   │   ├── features/
│   │   │   ├── account/
│   │   │   │   ├── account-module.ts
│   │   │   │   ├── account-routing-module.ts
│   │   │   │   └── pages/
│   │   │   │       ├── custom-requests/  # Yêu cầu thiết kế riêng
│   │   │   │       ├── my-orders/        # Đơn hàng của khách hàng
│   │   │   │       ├── profile/          # Hồ sơ cá nhân
│   │   │   │       └── wishlist/         # Sản phẩm yêu thích
│   │   │   ├── admin/
│   │   │   │   ├── admin-module.ts
│   │   │   │   ├── admin-routing-module.ts
│   │   │   │   ├── components/
│   │   │   │   │   ├── admin-header/
│   │   │   │   │   ├── admin-layout/
│   │   │   │   │   ├── admin-page-tabs/
│   │   │   │   │   ├── admin-sidebar/
│   │   │   │   │   └── transaction-modal/
│   │   │   │   └── pages/
│   │   │   │       ├── admin-landing/    # Trang bắt đầu khu vực admin
│   │   │   │       ├── appointments/     # Lịch hẹn
│   │   │   │       │   ├── appointment-requests/ # Yêu cầu tư vấn
│   │   │   │       │   └── appointment-schedule/ # Lịch tư vấn
│   │   │   │       ├── chat/             # Chat/hỗ trợ khách hàng
│   │   │   │       ├── content/          # Quản lý nội dung
│   │   │   │       ├── custom-requests/  # Yêu cầu thiết kế riêng
│   │   │   │       ├── customers/
│   │   │   │       │   └── customer-detail/
│   │   │   │       ├── dashboard/
│   │   │   │       ├── designs/          # Thiết kế
│   │   │   │       │   ├── design-posts/  # Bài viết cộng đồng
│   │   │   │       │   └── design-settings/ # Cấu hình cộng đồng thiết kế
│   │   │   │       ├── inventory/
│   │   │   │       │   ├── inventory-audit/
│   │   │   │       │   ├── inventory-history/
│   │   │   │       │   ├── inventory-product-detail/
│   │   │   │       │   └── inventory-transactions/ # Lệnh xuất-nhập kho
│   │   │   │       ├── orders/
│   │   │   │       │   ├── order-detail/
│   │   │   │       │   ├── orders-returns/
│   │   │   │       │   └── orders-warranty/
│   │   │   │       ├── product-categories/
│   │   │   │       ├── products/
│   │   │   │       │   └── product-form/
│   │   │   │       ├── promotions/
│   │   │   │       │   ├── campaigns/       # Chiến dịch khuyến mãi
│   │   │   │       │   └── vouchers/        # Mã giảm giá
│   │   │   │       ├── reports/
│   │   │   │       │   ├── customers-report/
│   │   │   │       │   ├── orders/
│   │   │   │       │   ├── products-report/
│   │   │   │       │   └── revenue/
│   │   │   │       ├── settings/
│   │   │   │       └── staff/
│   │   │   │           ├── staff-accounts/ # Tài khoản nhân sự
│   │   │   │           └── staff-permissions/ # Ma trận phân quyền
│   │   │   ├── auth/
│   │   │   │   ├── auth-module.ts
│   │   │   │   ├── auth-routing-module.ts
│   │   │   │   └── pages/
│   │   │   │       ├── admin-invite-accept/ # Chấp nhận lời mời admin
│   │   │   │       ├── admin-login/         # Đăng nhập quản trị
│   │   │   │       ├── admin-logout/        # Đăng xuất quản trị
│   │   │   │       ├── login/               # Đăng nhập khách hàng
│   │   │   │       └── register/            # Đăng ký tài khoản
│   │   │   └── store/
│   │   │   │   ├── store-module.ts
│   │   │   │   ├── store-routing-module.ts
│   │   │   │   ├── components/
│   │   │   │   │   ├── footer/
│   │   │   │   │   ├── header/
│   │   │   │   │   └── store-layout/
│   │   │   │   └── pages/
│   │   │   │       ├── blog/
│   │   │   │       ├── cart/
│   │   │   │       ├── checkout/
│   │   │   │       ├── custom-design/   # Gửi yêu cầu thiết kế riêng
│   │   │   │       ├── explore/         # Khám phá/danh mục sản phẩm
│   │   │   │       ├── home/
│   │   │   │       └── product-detail/
│   │   └── shared/
│   │       ├── shared-module.ts
│   │       ├── components/               # Component UI tái sử dụng
│   │       │   ├── cart-drawer/
│   │       │   ├── catalog-section/
│   │       │   ├── contract-modal/
│   │       │   ├── custom-select/
│   │       │   ├── data-table/
│   │       │   ├── hover-image-slider/
│   │       │   ├── icon/
│   │       │   ├── modal/
│   │       │   ├── otp-modal/
│   │       │   ├── quick-view-drawer/
│   │       │   ├── sidebar-filter/
│   │       │   ├── stat-card/
│   │       │   └── variant-edit-modal/
│   │       └── models/
│   │           ├── catalog.model.ts       # Kiểu dữ liệu danh mục/sản phẩm
│   │           └── prisma.model.ts        # Kiểu dữ liệu tương ứng Prisma
│   ├── environments/
│   │   ├── environment.ts                 # Cấu hình môi trường phát triển
│   │   └── environment.production.ts      # Cấu hình môi trường production
│   ├── dcor-styles.css                    # Theme và cấu hình Tailwind CSS v4
│   ├── styles.css                         # CSS toàn cục
│   ├── index.html                         # HTML entry point
│   └── main.ts                            # Khởi chạy ứng dụng Angular
├── public/
│   ├── favicon.ico
│   └── assets/
│       ├── favicon.png
│       ├── dcor-poppins-viet-hoa/
│       │   └── dcor-fonts/
│       │       ├── dcor-fonts.css
│       │       ├── README.txt
│       │       └── poppins-vi-{400,500,600,700}.woff2
│       └── room_img/
│           ├── phong_an.png
│           ├── phong_khach.png
│           └── phong_ngu.png
├── assets/
│   ├── DCor UI Style Guide.html           # Tài liệu giao diện
│   └── DCor UI Style Guide.md
├── angular.json                           # Cấu hình Angular workspace/build
├── package.json                           # Dependencies và scripts npm
├── package-lock.json                      # Khóa phiên bản dependencies
├── tsconfig.json                          # Cấu hình TypeScript chung
├── tsconfig.app.json                      # Cấu hình TypeScript cho ứng dụng
├── tsconfig.spec.json                     # Cấu hình TypeScript cho tests
├── .editorconfig
├── .gitignore
└── .prettierrc                             # Cấu hình định dạng code
```

> Trong từng thư mục màn hình/component, các file `.ts`, `.html`, `.css` và `.spec.ts` được tạo tùy theo phần đã triển khai; không phải thư mục nào cũng có đủ cả bốn loại file. Các file `*.spec.ts` là unit tests.

### Vai trò các khu vực chính

- `app/core`: guard, interceptor và service dùng chung xuyên suốt ứng dụng.
- `app/features`: nhóm màn hình theo nghiệp vụ; mỗi feature có module/routing riêng.
- `app/shared`: component và model có thể dùng lại giữa nhiều feature.
- `environments`: cấu hình theo môi trường chạy.
- `public/assets`: tài nguyên tĩnh được truy cập trực tiếp, như font, ảnh phòng và favicon.
- `assets`: tài liệu hướng dẫn UI của dự án; đây không phải thư mục `src/assets`.
- `dcor-styles.css` và `styles.css`: lần lượt là cấu hình/theme Tailwind và stylesheet toàn cục.
