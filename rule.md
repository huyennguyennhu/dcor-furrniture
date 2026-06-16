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
