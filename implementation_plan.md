# Kế Hoạch Chuyển Đổi Mã Nguồn (Next.js sang Angular)

Quá trình chuyển đổi toàn bộ giao diện và logic từ Next.js sang Angular là một quá trình lớn. Để tránh bị lỗi chồng chéo và dễ dàng kiểm soát, chúng ta sẽ thực hiện theo từng giai đoạn (Phase) từ dưới lên trên.

Tuân thủ nguyên tắc: **Tôi (AI) sẽ viết code logic và giao diện cho các file đã có sẵn. Nếu phát sinh Component mới cần tạo, tôi sẽ cung cấp lệnh để bạn chạy trên Terminal.**

---

## Các Giai Đoạn Chuyển Đổi (Phases)

### Phase 1: Cấu hình nền tảng (Global Setup)
- Cài đặt và cấu hình **Tailwind CSS** cho dự án Angular (vì dự án Next.js của bạn dùng Tailwind rất nhiều).
- Di chuyển các CSS dùng chung từ `app/globals.css` sang `src/styles.scss`.
- Bố trí các file ảnh/assets từ thư mục `public` của Next.js sang `public` của Angular.

### Phase 2: Kế thừa Kiểu Dữ Liệu (Interfaces/Models)
- Tạo thư mục `shared/models` và chuyển đổi các TypeScript Interfaces, Enums từ `prisma/schema.prisma` và `lib/data.ts` sang. Bước này rất quan trọng để các Component phía sau không bị báo lỗi đỏ (Type Error).

### Phase 3: Chuyển Đổi Shared Components (Thành phần dùng chung)
Tiến hành chuyển đổi các Component UI không chứa logic routing (Dumb Components) đã được tạo sẵn bằng CLI:
1. `CatalogSection`
2. `CustomSelect`
3. `Modal`
4. `StatCard`
5. `DataTable`

*(Cách làm: Bóc tách mã HTML sang file `.html`, chuyển Typescript logic sang file `.ts`, giữ nguyên class của Tailwind).*

### Phase 4: Chuyển Đổi Layouts (Bộ khung giao diện)
1. **Admin Layout:** Chuyển `AdminSidebar`, `AdminHeader`, `AdminPageTabs`, `AdminLayout`.
2. **Store Layout:** Chuyển `Header`, `Footer`, `StoreLayout`.
3. Định cấu hình `router-outlet` trong các layout này để hiển thị các trang con.

### Phase 5: Cấu hình Bản đồ đường dẫn (Routing)
- Viết code cho các file `app.routes.ts`, `admin-routing.module.ts`, `store-routing.module.ts` để gán đúng URL vào đúng Component. Thiết lập cấu hình Lazy Loading hoàn chỉnh.

### Phase 6: Chuyển Đổi Pages (Các trang chức năng cụ thể)
Chuyển đổi các trang phức tạp (có chứa logic gọi Service):
- [x] **Store Pages**:
  - `home`: Bố cục Hero, Sections (giống `app/page.tsx`).
  - `kham-pha`: Bộ lọc (filter), lưới sản phẩm (giống `app/kham-pha/page.tsx`).
  - `product-detail`: Thư viện ảnh, mô tả, thêm vào giỏ (giống `app/kham-pha/[id]/page.tsx`).
  - `cart`: Tóm tắt giỏ hàng, tính phí giao hàng (giống `app/cart/page.tsx`).
  - `checkout`: Form thanh toán, phương thức giao hàng, trạng thái (giống `app/checkout/page.tsx`).
  - `blog`: Danh sách tin tức thiết kế (giống `app/blog/page.tsx`).
  - `thiet-ke`: Công cụ 3D Planner hoặc Placeholder (giống `app/thiet-ke/page.tsx`).
- [x] **Auth Pages**:
  - `login`, `register`, `admin-login`: Form đăng nhập / đăng ký và quản trị.
- [x] **Account Pages**:
  - `profile`, `my-orders`, `wishlist`: Quản lý thông tin tài khoản người dùng.
- [x] **Admin Pages**:
  - `reports`, `dashboard`, `products`, `orders`, `inventory`, `promotions`: Quản lý hệ thống admin.

---

## 🚨 Yêu Cầu Đánh Giá (User Review Required)

- **Cấu hình Tailwind:** Dự án Angular hiện tại chưa được cài đặt Tailwind CSS. Trong **Phase 1**, tôi sẽ cung cấp cho bạn 2 lệnh npm để cài đặt Tailwind. Bạn có đồng ý bắt đầu với Phase 1 không?
- **Quy trình làm việc:** Ở mỗi bước nhỏ, tôi sẽ viết lại code của Next.js (file `.tsx`) tách thành 2 file của Angular (file `.ts` và `.html`) và ghi đè trực tiếp vào thư mục `dcor_Angular` của bạn. Sau mỗi file hoàn tất, tôi sẽ thông báo để bạn kiểm tra. Bạn có thấy quy trình này ổn không?

Hãy bấm **Proceed** hoặc trả lời "Đồng ý" để chúng ta chính thức bắt tay vào **Phase 1: Cài đặt Tailwind và Global CSS**!
