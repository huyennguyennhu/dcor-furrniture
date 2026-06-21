# D'Cor Typography & Design System

## 1. Font chữ chính thức

### Heading (Tiêu đề)
```css
font-family: "Libre Baskerville", Georgia, "Times New Roman", serif;
```
**Dùng cho:**
* Hero Banner
* Tiêu đề section
* Tiêu đề bài blog
* Tiêu đề popup lớn

### Body (Nội dung)
```css
font-family: "Inter", "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
```
**Dùng cho:**
* Menu
* Nội dung
* Card sản phẩm
* Form
* Bảng dữ liệu
* Dashboard

---

## 2. Font Weight

**Heading:**
| Mức | Weight |
| --- | --- |
| Hero | 700 |
| Section Title | 700 |
| Product Title | 600 |

**Body:**
| Loại | Weight |
| --- | --- |
| Normal | 400 |
| Medium | 500 |
| Button | 600 |
| Menu | 500 |

---

## 3. Typography Scale

### Desktop (≥1440px)
- **Hero:** 72px, 700, 110%
- **H1:** 56px, 700, 120%
- **H2:** 48px, 700, 120%
- **H3:** 36px, 600, 130%
- **H4:** 28px, 600, 130%
- **Product Card Title:** 20px, 600, 140%
- **Body Large:** 18px, 400, 160%
- **Body:** 16px, 400, 160%
- **Small Text:** 14px, 400, 150%
- **Caption:** 12px, 400, 150%

### Tablet (768px - 1024px)
- **Hero:** 56px
- **H1:** 48px
- **H2:** 40px
- **H3:** 32px
- **H4:** 24px
- **Product Card:** 18px
- **Body:** 16px
- **Small:** 14px

### Mobile (<768px)
- **Hero:** 40px
- **H1:** 32px
- **H2:** 28px
- **H3:** 24px
- **H4:** 20px
- **Product Card:** 18px
- **Body:** 16px (Không nên giảm xuống 14px)
- **Small:** 14px
- **Caption:** 12px

---

## 4. Header Typography

**Desktop:**
- Menu: 16px, 500, letter-spacing: 0.2px
- Logo: 28px, 700 (D'Cor)
- Icon: 24px

**Tablet:**
- Menu: 15px
- Logo: 24px

**Mobile:**
- Logo: 22px
- Menu trong Drawer: 18px

---

## 5. Button & Search Typography

**Button:**
- Primary Button: 16px, 600
- Secondary Button: 15px, 500

**Search:**
- Placeholder: 16px, 400
- Search Result Title: 16px, 500
- Search Category: 14px, 400

---

## 6. Khoảng cách (Spacing) & Grid

### Spacing (Header Height / Section Spacing / Card Gap)
- **Desktop:** 80px / 120px / 32px
- **Tablet:** 72px / 80px / 24px
- **Mobile:** 64px / 64px / 16px

### Grid System
- **Desktop:** 12 Columns, Max Width: 1440px, Padding: 80px
- **Tablet:** 8 Columns, Padding: 40px
- **Mobile:** 4 Columns, Padding: 20px

---

## 7. UI Components chuẩn của hệ thống

**Custom Select Dropdown (`components/ui/CustomSelect.tsx`)**
- Tránh sử dụng thẻ `<select>` mặc định của hệ điều hành/trình duyệt vì thiết kế không nhất quán và khó custom.
- Sử dụng component `CustomSelect` cho mọi tính năng dạng Dropdown (như Sắp xếp, Chọn biến thể...).
- CSS classes định nghĩa sẵn tại `app/styles.css`: `.custom-select-container`, `.custom-select-trigger`, `.custom-select-dropdown`, `.custom-select-option`.
- Hiệu ứng: Dropdown có animation fade-in nhẹ từ dưới lên (`dropdownFadeIn`), các option có hiệu ứng hover mượt mà với nền màu tertiary.
- **Không được dùng các icon emoji** (như 🛋️, 🛒...) trong giao diện web. Thay vào đó, bắt buộc sử dụng bộ icon chuẩn từ thư viện `lucide-react` (hoặc SVG tương đương) để đảm bảo tính đồng bộ, nét vẽ tối giản và chuyên nghiệp cho một trang web nội thất.

---

## 8. Hình ảnh, Naming Convention & Hiển thị Biến thể

**Quy tắc đặt tên (Naming Convention)**
- **Tên Sản phẩm (Product Name) & Tên Lựa chọn (Option Name):** Tuyệt đối không được chứa các mô tả cấu hình rườm rà (như "với lưng tựa...", "với công nghệ...", "kèm nan giường..."). 
- **Tối đa 6 chữ:** Tên phải được rút gọn tối đa 5-6 chữ (chỉ giữ lại Loại sản phẩm + Tên Bộ sưu tập / Tên chất liệu + màu sắc cơ bản). Ví dụ: *"vải Frisco màu xám nhạt với công nghệ aquaclean 2063"* -> *"vải Frisco màu xám nhạt"*.


**Hình ảnh sản phẩm (Images) & Nguồn lấy ảnh**
- **Không có ảnh mặc định cấp Sản phẩm:** Toàn bộ dữ liệu sản phẩm `Product.images` là mảng rỗng `[]`. Hình ảnh thực chất thuộc về từng Biến thể (Variant) cụ thể.
- **Logic lấy ảnh mặc định (Default Image):** Khi load trang chi tiết sản phẩm hoặc hiển thị ở dạng Danh sách (Card), Frontend phải tự động trỏ vào biến thể đầu tiên (`variants[0]`) để lấy mảng `images` làm ảnh đại diện.
- **Logic cập nhật ảnh:** Khi người dùng thay đổi tùy chọn cấu hình (`config_options`), Frontend tìm biến thể tương ứng và nạp mảng `images` của biến thể đó vào Slider chính.
- Hình ảnh luôn phải được căn chỉnh nằm gọn trong khung (ví dụ: dùng `object-fit: contain;`, background màu trắng/xám nhạt và thêm padding) để tránh việc ảnh bị méo mó hay cắt xén.
- Luôn sử dụng thuộc tính `loading="lazy"` để tối ưu hiệu suất tải trang.

**Hiển thị khi không có hình ảnh (No Image Logic)**
- **Tuyệt đối không** hiển thị các hình ảnh lỗi (broken image), hình chứa thẻ alt lỗi, text `undefined`, hoặc hình placeholder mặc định vô nghĩa khi sản phẩm/biến thể không có hình ảnh.
- **Logic chuẩn:** Nếu một sản phẩm hoặc biến thể không có hình ảnh hợp lệ (ví dụ: *Bordeaux console table*), hệ thống phải hiển thị một khối `div` (thường có nền màu xám nhạt `background: #f3f4f6`), bên trong hiển thị text ghi rõ **Tên của sản phẩm** hoặc **Tên biến thể** đó ở ngay giữa khu vực lẽ ra dành cho ảnh. Điều này giúp giao diện mượt mà, trực quan và người dùng vẫn biết họ đang xem mục nào.

**Hiển thị Tùy chọn Cấu hình (Config Options)**
- **Tên nhóm tùy chọn (Group Title):** Ưu tiên lấy từ trường `groupId` (nếu có) hoặc `groupName`.
- **Lựa chọn (Option) không có ảnh:** Nếu một option không chứa hình ảnh (`image: null`), hãy lấy **trường `name`** của option đó để hiển thị trực tiếp vào trong khối lựa chọn (giống một dạng text button hoặc thẻ tag) thay vì hiển thị hình ảnh trống/lỗi. Điền tên option vào giúp giao diện không bị gián đoạn và người dùng vẫn thao tác dễ dàng.

---

## 9. Cấu trúc và Logic Render JSON Data (config_options & variants)

**Xử lý `config_options` (Tùy chọn cấu hình động):**
- Dữ liệu trả về là Mảng (Array) các nhóm thuộc tính.
- Bước 1: `map()` qua mảng `config_options`, mỗi phần tử đại diện cho 1 Nhóm (Ví dụ: Chân ghế, Vật liệu bọc). Render tiêu đề nhóm bằng `groupName` hoặc `groupId`.
- Bước 2: Bên trong mỗi Nhóm, tiếp tục `map()` qua mảng `options`. Mỗi phần tử option sẽ có `id`, `name`, `image`, `hexColor`.
- Bước 3 (UI): Render các lựa chọn này. Nếu có `image`, hiển thị hình swatch (hình vuông/tròn nhỏ). Nếu `image` là null, hiển thị text `name` có border bao quanh.
- Cập nhật State: Khi người dùng click chọn, lưu lại mảng các ID đang được chọn (VD: `selectedOptions = ["3063", "435_Sofalegs"]`).

**Xử lý `variants` (Chi tiết Biến thể):**
- Là Mảng chứa tất cả các tổ hợp cấu hình có thể có của sản phẩm. Mỗi biến thể chứa `price`, `images` lớn, và mảng `config_combination` (chứa các Option ID).
- **Logic cập nhật giao diện (Real-time):** Mỗi khi người dùng thay đổi lựa chọn ở phần `config_options`, frontend phải kích hoạt hàm `useEffect` (hoặc watch) để dò tìm trong mảng `variants`:
  - Lọc ra biến thể (Variant) có mảng `config_combination` chứa đủ các ID trùng khớp với state `selectedOptions` hiện tại.
  - **Khi tìm thấy (Match):** Lấy `price` của biến thể này để đè lên giá `base_price` hiển thị trên màn hình. Lấy mảng `images` của biến thể này để render lại Carousel (Slider) ảnh lớn của sản phẩm.
  - **Khi không tìm thấy:** Có thể disable nút "Thêm vào giỏ hàng" hoặc hiển thị thông báo "Phiên bản này không khả dụng".

---

## 10. Logic Xử Lý Giá Giảm (Discount / Sale Price)

Thay vì lưu giá giảm trực tiếp vào từng biến thể, hệ thống cung cấp 2 trường trên Product để tự động hóa: `discount_value` và `discount_type`. Frontend cần xử lý tính toán giá trực tiếp (Client-side):

- **Trạng thái 1 (Không có giảm giá):** Nếu `discount_value` là null hoặc 0 -> Hiển thị bình thường (chỉ hiện giá `base_price` hoặc giá của `variants` đang chọn).
- **Trạng thái 2 (Có giảm giá):**
  - **Giảm tiền mặt (`discount_type === 'FIXED'`):** 
    - `Giá Hiện Tại = Giá gốc - discount_value`. 
    - Hiển thị Giá Hiện Tại to rõ, kèm Giá gốc bị gạch ngang nhỏ hơn ở dưới/bên cạnh.
  - **Giảm phần trăm (`discount_type === 'PERCENT'`):** 
    - `Giá Hiện Tại = Giá gốc * (100 - discount_value) / 100`. 
    - Hiển thị thêm Tag "Giảm [discount_value]%" màu đỏ ở góc ảnh. Hiển thị Giá Hiện Tại to rõ, Giá gốc bị gạch ngang.

*(Lưu ý: "Giá gốc" ở trên sẽ tự động lấy theo `base_price` hoặc giá `price` của biến thể con đang chọn, giúp mức giảm giá luôn chính xác trên bất kỳ phiên bản nào của sản phẩm!)*

---

## 12. Định dạng Dữ liệu & Thời gian (Data & Time Formats)
- Các trường dữ liệu thời gian (như created_at, updated_at) khi xử lý, hiển thị hoặc lưu trữ phải luôn tuân thủ và sử dụng định dạng **GMT+7 (Giờ Hồ Chí Minh)**. Ví dụ format chuẩn ISO với timezone: YYYY-MM-DDTHH:mm:ss.SSS+07:00.
