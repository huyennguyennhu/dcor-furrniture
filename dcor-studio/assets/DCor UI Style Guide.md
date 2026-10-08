DCor UI

1. [1 · Hiện trạng](#hien-trang)
2. [2 · Nguyên tắc](#nguyen-tac)
3. [3 · Design tokens](#tokens)
4. [4 · Typography](#typography)
5. [5 · Spacing & shape](#spacing)
6. [6 · Nền tảng chung](#nen-tang)
7. [7 · Component](#component)
8. [8 · Responsive](#responsive)
9. [9 · CSS trong Angular](#angular)
10. [10 · Tailwind v4](#tailwind)

Design Your Core · User & Admin

# DCor UI Style Guide

Chuẩn hóa cách viết CSS cho hai ứng dụng **User** (storefront nội thất) và **Admin** (hệ thống quản trị). Đây là chuẩn đề xuất dựa trên nhận diện thương hiệu, không tự động ghi đè CSS đang chạy. Khi sửa màn hình cũ, migrate dần sang token và tránh đổi giao diện ngoài phạm vi ticket.

AngularPoppinsBội số 4px2 app build độc lập

**Nút chính #765337**Hover sáng lên thành #BC5F13

**Màu nhấn #BC5F13**Vừa là hover, vừa là Accent/Highlight

**Nền chính #FCF8F3**Beige ấm, toàn trang

**Nền phụ #FFF3E3**Sub-bg cho thẻ, banner, section ưu đãi

01

## Hiện trạng cần thống nhất

#### Màu

Palette đã xác định (xem mục 3), nhưng nhiều component ở cả hai app vẫn hard-code mã màu.

#### Font

**Poppins** là font chính thức cho Heading, Body và Controls. Cần bỏ sự không đồng nhất giữa Lexend, SF Pro, Inter và các bản Poppins tải rải rác.

#### Cỡ chữ & bo góc

Font-size tập trung ở 12–16px (body/control) và 18–32px (heading). Border-radius tập trung ở 4px, 8px, 12px và pill 999px.

#### Breakpoint

Đang dùng nhiều ngưỡng sát nhau: 767/768, 479/480, 600, 991/992, 1024px. Chọn một bộ thống nhất khi viết mới.

### Màu trung tính theo Design Palette

### Pattern cần tránh

- Selector global quá rộng (`*`, `div`)
- Màu nền áp lên toàn bộ phần tử
- `!important` để lấn CSS khác

02

## Nguyên tắc thiết kế chung

#### Nhận diện DCor

Dùng tone chủ đạo cho hành động chính, sắc sáng hơn làm điểm nhấn/hover. Nền Beige ấm `#FCF8F3` tôn vẻ mộc mạc, sang trọng của nội thất. Không biến mọi thành phần thành một màu.

#### Dễ đọc trước, trang trí sau

Nền kem nhẹ, chữ `#0A0A0A` / `#616161`, viền mảnh `#E0E0E0`. Shadow chỉ dùng rất nhẹ, gọn và tinh tế để phân lớp card sản phẩm: `0 1px 2px 0 rgb(0 0 0 / 5%)`.

#### Nhất quán giữa hai app

Chung palette, typography, radius, spacing và trạng thái tương tác. Khác biệt chỉ ở bố cục nghiệp vụ: User thiên về mua sắm, Admin thiên về dashboard, biểu mẫu, bảng.

#### CSS theo component

Selector giới hạn trong component/page. Không chỉnh toàn bộ `button`, `div`, `input` hoặc `body` từ CSS màn hình.

#### Responsive & accessibility là mặc định

Focus nhìn thấy được, không chỉ dùng màu để truyền đạt trạng thái, không làm mất nội dung hoặc thao tác trên màn hình hẹp.

03

## Design tokens đề xuất

Chuẩn cho CSS mới. Khai báo trong `:root` của cả `my-user/src/styles.css` và `my-admin/src/styles.css`. Bấm vào ô màu để copy mã hex.

Brand

Nền và bề mặt

Ngữ nghĩa

Chữ và viền

### Cách dùng từng nhóm màu

| Token | Dùng cho | Lưu ý |
| --- | --- | --- |
| `--color-page` #FCF8F3 | Main background toàn bộ User & Admin | Áp cho `body` và vùng nền bao phủ chung |
| `--color-primary` #765337 | Nút thao tác chính, tiêu đề chính, icon thương hiệu | Chữ trắng khi đủ tương phản; kiểm tra contrast với nền #FCF8F3 |
| `--color-primary-hover` #BC5F13 | Hover làm sáng nút chính | Tạo hiệu ứng tương tác trực quan |
| `--color-accent` #BC5F13 | Nút cần chú ý cao: Mua ngay, Đặt lịch ngay, Deal hot | Dùng tiết chế cho các CTA quan trọng nhất |
| `--color-sub-bg` #FFF3E3 | Thẻ đặc biệt, banner ưu đãi, highlight section | Đi với chữ đậm hoặc đen, không làm nền cho văn bản dài |
| `--color-warning` #F2BF3D | Cảnh báo, đơn chờ xử lý, đánh giá sao | Không dùng cho lỗi nghiêm trọng |
| `--color-danger` #C42326 | Lỗi, xóa sản phẩm, hủy đơn, thao tác phá hủy | Xác nhận trước thao tác không thể hoàn tác |
| `--color-info` #0023DD | Trạng thái đang giao hàng, hướng dẫn | Chỉ dùng khi trạng thái thực sự là thông tin |
| `--color-text*`, `--color-border`, `--color-surface*` | Nội dung và cấu trúc thẻ/card | Cùng ý nghĩa ở User và Admin |

### Badge trạng thái

Ánh xạ màu theo ý nghĩa nghiệp vụ (chờ, đang xử lý, hoàn thành, hủy), không gán theo thứ tự và không để mọi trạng thái cùng màu.

Chờ xử lý Đang giao hàng Hoàn thành Đã hủy

### Mã CSS

styles.css · :root

```
:root {
  /* Brand - DCor Color Palette */
  --color-primary: #765337;
  --color-primary-hover: #BC5F13;     /* hover sáng lên */
  --color-primary-pressed: #3F2C1B;   /* active */

  --color-accent: #BC5F13;            /* nút cần chú ý / badge hot */
  --color-accent-hover: #765337;

  --color-primary-subtle: #FFF3E3;     /* banner highlight */
  --color-primary-border: #BC5F13;

  /* Surfaces and Main Background */
  --color-page: #fcf8f3;              /* nền chính Beige ấm */
  --color-sub-bg: #FFF3E3;            /* thẻ đặc biệt / section ưu đãi */
  --color-surface: #ffffff;           /* card / modal */
  --color-surface-subtle: #f5f5f5;    /* Neutral 20 */
  --color-surface-muted: #ededed;     /* Neutral 30 */

  /* Semantic */
  --color-success: #00a30b;  --color-success-bg: #e9f8e9;
  --color-warning: #f2bf3d;  --color-warning-hover: #e8a909;  --color-warning-bg: #fff8e5;
  --color-danger: #c42326;   --color-danger-hover: #8c1f1f;   --color-danger-bg: #ffe8e8;
  --color-info: #0023dd;     --color-info-hover: #001db8;     --color-info-bg: #ebeeff;

  /* Neutral Text & Border */
  --color-text: #0a0a0a;
  --color-text-heading: #0a0a0a;
  --color-text-secondary: #616161;
  --color-text-muted: #757575;
  --color-border: #e0e0e0;
  --color-border-subtle: #ededed;

  /* Typography */
  --font-body: "Poppins", sans-serif;
  --font-heading: "Poppins", sans-serif;

  /* Shape and effects */
  --radius-control: 8px;
  --radius-card: 12px;
  --radius-modal: 16px;
  --radius-pill: 999px;
  --shadow-card: 0 1px 2px 0 rgb(0 0 0 / 5%);
  --shadow-overlay: 0 25px 50px -12px rgb(0 0 0 / 25%);
}
```

04

## Typography

Poppins là chuẩn chung cho nội dung, điều khiển và heading. Tránh khai báo font-family riêng trong từng component nếu không có yêu cầu thiết kế đặc biệt.

Aa Poppins

Regular 400Medium 500SemiBold 600Bold 700

**Heading trang · h1**28–32px · 600 · 1.2

Sofa gỗ sồi Bắc Âu

**Heading khu vực · h2**20–24px · 600 · 1.3

Bộ sưu tập phòng khách

**Card / dialog · h3**18–20px · 500 · 1.35

Bàn ăn mở rộng 6–8 chỗ

**Nội dung, form, button**14–16px · 400–500 · 1.5

Chất liệu gỗ tự nhiên, hoàn thiện thủ công, bảo hành 24 tháng.

**Nội dung phụ, bảng, label**12–14px · 400–500 · 1.4

Kích thước 2200 × 900 × 780 mm

**Caption / helper text**≥ 12px · 400 · 1.4

Giao hàng dự kiến trong 5–7 ngày làm việc

#### Quy tắc

- Không dùng cỡ chữ dưới 12px cho thông tin cần đọc hoặc thao tác
- Không phụ thuộc việc một app có `@import` font còn app kia không
- Dùng bản **Poppins việt hóa** (Vntype & FontZin, giấy phép OFL), tự host file `.woff2`. Bản trên Google Fonts không có dấu tiếng Việt

styles.css · nạp font tự host (Poppins việt hóa)

```
@font-face {
  font-family: "Poppins";
  font-weight: 400;
  font-style: normal;
  font-display: swap;
  src: url("/assets/fonts/poppins-vi-400.woff2") format("woff2");
}
@font-face {
  font-family: "Poppins";
  font-weight: 500;
  font-style: normal;
  font-display: swap;
  src: url("/assets/fonts/poppins-vi-500.woff2") format("woff2");
}
@font-face {
  font-family: "Poppins";
  font-weight: 600;
  font-style: normal;
  font-display: swap;
  src: url("/assets/fonts/poppins-vi-600.woff2") format("woff2");
}
@font-face {
  font-family: "Poppins";
  font-weight: 700;
  font-style: normal;
  font-display: swap;
  src: url("/assets/fonts/poppins-vi-700.woff2") format("woff2");
}
```

05

## Spacing, layout và shape

Dùng bội số 4px để giảm giá trị tùy ý. Dùng `gap` cho flex/grid thay vì margin chồng chéo.

### Bo góc

Control · 8px

Card · 12px

Modal · 16px

Chip/badge · 999px

### Bố cục

#### User

Nội dung sản phẩm/bộ sưu tập có max-width rõ ràng, căn giữa trên nền `--color-page`. Container chuẩn **1200px**.

#### Admin

Dành phần rộng cho bảng/dashboard, giữ khoảng đệm nhất quán, không để nội dung tràn khỏi vùng main cạnh sidebar.

Card sản phẩm dùng nền trắng hoặc nền phụ, viền `#E0E0E0`, radius 12px. Chỉ thêm shadow nhẹ khi cần phân lớp với nền.

06

## Nền tảng dùng chung

Các quy luật áp dụng cho mọi màn hình ở cả User và Admin: bo góc, đổ bóng, viền, focus, z-index, chuyển động, lưới, kích thước control, icon, ảnh, link.

Các giá trị trong mục này là mình đề xuất, chưa có trong guide gốc. Bạn duyệt và chỉnh trước khi áp dụng.

### Bo góc

`--radius-sm` · 4px\
Tag nhỏ, tooltip, checkbox

`--radius-control` · 8px\
Nút, input, dropdown, toast

`--radius-card` · 12px\
Card, bảng, khung ảnh

`--radius-modal` · 16px\
Modal, drawer

`--radius-pill`\
Badge, chip, avatar

Phần tử lồng nhau dùng bo góc nhỏ hơn phần tử bao ngoài (nút trong card dùng 8px, card 12px). Ảnh nằm trong card thì để card cắt ảnh (`overflow: hidden`), không bo riêng.

### Đổ bóng và độ nổi

Sáu mức. Rê chuột vào card thứ tư để xem hiệu ứng.

**Header**Thanh header dính khi cuộn.\
`--shadow-header`

**Input, control**Input, select, nút phụ.\
`--shadow-control`

**Card**Card sản phẩm lúc thường.\
`--shadow-card`

**Card hover**Card bấm được, nhấc lên 2px.\
`--shadow-hover`

**Dropdown, popover**Menu, bảng chọn, tooltip lớn.\
`--shadow-dropdown`

**Modal, drawer, toast**Lớp nổi trên cùng.\
`--shadow-overlay`

Bóng của header và input pha màu nâu thương hiệu (118 83 55) với độ mờ thấp, nên nhìn ấm và không bị xám. Từ card trở lên dùng đen trung tính theo thang Tailwind (sm, md, lg, 2xl). Spread âm giữ bóng gọn, không lan rộng ra hai bên.

### Viền và focus

#### Viền

- Mặc định `1px solid var(--color-border)`
- Nút outline và mục đang chọn: `2px` (`--border-width-strong`)
- Ô lỗi đổi viền sang `--color-danger`, kèm icon và chữ giải thích

#### Viền focus

Mọi phần tử bấm được dùng chung một kiểu, qua `:focus-visible`.

2px · offset 2px

Màu `--color-focus` (#BC5F13, cùng màu cam nhấn) đạt khoảng 4,1:1 trên nền Beige. Khoảng cách 2px giữa viền và nút giúp viền vẫn rõ khi nút nền cam hoặc nâu. Trên nền tối dùng cam sáng hơn.

### Phân tầng z-index

Component không tự đặt số riêng. Chỉ dùng các biến `--z-*`.

### Chuyển động

- **Nhanh 120ms:** đổi màu icon, checkbox, tooltip hiện ra
- **Mặc định 200ms:** hover nút, hover card, đổi màu viền
- **Chậm 320ms:** modal, drawer, bảng chọn trượt vào
- Đường cong chung: `cubic-bezier(0.2, 0, 0, 1)`. Chỉ chuyển `background-color`, `border-color`, `box-shadow`, `transform`, `opacity`; không chuyển `all`
- Người dùng bật "giảm chuyển động" thì cả ba thời gian về 0 (có trong khối mã bên dưới)

### Bố cục và lưới

| Màn hình | Lề hai bên | Số cột | Khoảng cách cột | Lưới sản phẩm (User) |
| --- | --- | --- | --- | --- |
| Dưới 768px | 16px | 4 | 16px | 2 cột |
| 768 – 1023px | 24px | 8 | 24px | 3 cột |
| Từ 1024px | 32px | 12 | 24px | 4 cột |

Container tối đa 1200px, căn giữa. Admin dùng toàn chiều rộng vùng main, giữ lề như bảng trên.

### Cỡ chữ và độ đậm dạng token

| Token | Giá trị | Dùng cho |
| --- | --- | --- |
| `--text-xs` | 12px | Caption, helper text, badge |
| `--text-sm` | 14px | Nội dung phụ, bảng, label |
| `--text-base` | 16px | Nội dung, form, nút |
| `--text-lg` · `--text-xl` | 18px · 20px | Heading card, dialog |
| `--text-2xl` | 24px | Heading khu vực (h2) |
| `--text-3xl` · `--text-4xl` | 28px · 32px | Heading trang (h1) |
| `--weight-*` | 400 · 500 · 600 | Chữ thường · nhấn nhẹ, nút · heading |

### Kích thước control

| Cỡ | Chiều cao | Dùng khi |
| --- | --- | --- |
| `--control-sm` | 36px | Chỉ Admin: nút trong hàng bảng, bộ lọc gọn. Không dùng cho thao tác chính ở User |
| `--control-md` | 44px | Mặc định cho nút, input, select |
| `--control-lg` | 48px | Form đăng nhập, thanh toán, nút CTA lớn |
| Badge | 24px | Chữ 12px, bo `--radius-pill` |

### Icon, ảnh và link

#### Icon

- Một bộ icon nét đường duy nhất cho cả hai app
- Cỡ 16 · 20 · 24px; 48px cho empty state
- Nét 1.5px, màu `currentColor`
- Icon đứng một mình phải có nhãn chữ cho trình đọc màn hình

#### Ảnh sản phẩm

- Card: tỉ lệ 4:5; ảnh nhỏ: 1:1; banner và blog: 16:9
- `object-fit: cover`, nền chờ `--color-surface-muted`
- Luôn khai báo `aspect-ratio` hoặc width/height để trang không bị nhảy

#### Link

- Màu `--color-primary`, trong đoạn văn luôn gạch chân
- Hover đổi sang `--color-primary-pressed` (nâu đậm), không dùng cam, vì chữ cam trên nền Beige chỉ đạt khoảng 4,1:1
- Focus dùng viền focus chung

### Trạng thái vô hiệu, overlay và loading

- **Vô hiệu:** nền `--color-surface-muted`, chữ `--color-text-muted`, con trỏ `not-allowed`, không có hover. Không dùng `opacity` để làm mờ
- **Overlay:** nền `rgb(10 10 10 / 48%)` (`--color-overlay`), bấm ra ngoài để đóng khi an toàn
- **Loading:** skeleton nền `--color-surface-muted` chuyển nhẹ sang `--color-surface-subtle`; nút đang tải giữ nguyên kích thước và hiện spinner

### Các thành phần còn lại

| Thành phần | Quy cách |
| --- | --- |
| Bảng (Admin) | Khung bo 12px, viền `--color-border`. Header nền `--color-surface-subtle`, chữ 12px viết hoa, `--color-text-muted`. Hàng cao 48px, ô padding 12px 16px, viền dưới `--color-border-subtle`, hover `--color-surface-subtle` |
| Toast | Bo 8px, bóng nổi, rộng tối đa 360px, tự đóng sau 5 giây. Nền theo màu semantic nhạt, icon theo màu semantic, kèm chữ. Admin: góc trên phải. User trên điện thoại: dưới giữa |
| Alert trong trang | Giống toast nhưng nằm trong luồng nội dung, padding 12px 16px, không tự đóng |
| Tab | Cao 44px, gạch chân 2px `--color-primary` cho tab đang chọn, chữ chuyển từ `--color-text-secondary` sang `--color-text` |
| Phân trang | Ô 40×40px, bo 8px; trang hiện tại nền `--color-primary`, chữ trắng |
| Breadcrumb | Chữ 14px `--color-text-muted`, phân cách bằng dấu "/", mục cuối đậm hơn và không bấm được |
| Dropdown, menu | Nền `--color-surface`, viền, bo 8px, bóng nổi, mục cao 40px, hover `--color-surface-subtle`, `z-index: var(--z-dropdown)` |
| Tooltip | Nền `--color-text`, chữ trắng 12px, bo 4px, padding 6px 10px, `z-index: var(--z-tooltip)` |
| Empty state | Căn giữa, padding 48px, icon 48px màu muted, tiêu đề h3, mô tả phụ, tối đa một nút chính |

### Mã CSS bổ sung cho :root

styles.css · thêm vào :root

```
:root {
  /* Spacing (bội số 4px) */
  --space-1: 4px;  --space-2: 8px;  --space-3: 12px;  --space-4: 16px;
  --space-6: 24px; --space-8: 32px; --space-12: 48px;

  /* Bo góc */
  --radius-sm: 4px;

  /* Độ nổi */
  --shadow-header: 0 1px 8px rgb(118 83 55 / 6%);
  --shadow-control: 0 2px 6px -1px rgb(118 83 55 / 4%);
  --shadow-hover: 0 4px 6px -1px rgb(0 0 0 / 10%), 0 2px 4px -2px rgb(0 0 0 / 10%);
  --shadow-dropdown: 0 10px 15px -3px rgb(0 0 0 / 10%), 0 4px 6px -4px rgb(0 0 0 / 10%);

  /* Viền, focus, overlay */
  --border-width: 1px;
  --border-width-strong: 2px;
  --color-focus: #bc5f13;
  --focus-ring: 2px solid var(--color-focus);
  --focus-offset: 2px;
  --color-overlay: rgb(10 10 10 / 48%);

  /* z-index */
  --z-base: 0;    --z-sticky: 100;  --z-dropdown: 200;
  --z-overlay: 300; --z-modal: 400;   --z-toast: 500;   --z-tooltip: 600;

  /* Chuyển động */
  --duration-fast: 120ms;
  --duration-base: 200ms;
  --duration-slow: 320ms;
  --ease-standard: cubic-bezier(0.2, 0, 0, 1);

  /* Cỡ chữ và độ đậm */
  --text-xs: 12px; --text-sm: 14px; --text-base: 16px; --text-lg: 18px;
  --text-xl: 20px; --text-2xl: 24px; --text-3xl: 28px; --text-4xl: 32px;
  --weight-regular: 400; --weight-medium: 500; --weight-semibold: 600;

  /* Bố cục và kích thước control */
  --container-max: 1200px;
  --gutter: 16px;
  --control-sm: 36px; --control-md: 44px; --control-lg: 48px;
}

@media (min-width: 768px)  { :root { --gutter: 24px; } }
@media (min-width: 1024px) { :root { --gutter: 32px; } }

/* Giảm chuyển động theo cài đặt của người dùng */
@media (prefers-reduced-motion: reduce) {
  :root { --duration-fast: 0ms; --duration-base: 0ms; --duration-slow: 0ms; }
}

/* Dùng chung */
:focus-visible { outline: var(--focus-ring); outline-offset: var(--focus-offset); }
```

07

## Component và trạng thái tương tác

### Button

Di chuột và nhấn giữ vào các nút bên dưới để xem trạng thái thật.

**Mặc định** · #765337 · chữ trắng

**Hover** · sáng lên #BC5F13

**Active** · sẫm lại #3F2C1B

**Accent** · #BC5F13 · chữ trắng

**Accent hover** · sẫm lại #765337

**Secondary** · viền và chữ primary

- Xử lý đủ: mặc định, `:hover`, `:active`, `:focus-visible`, `:disabled`, loading nếu có
- Vùng bấm tối thiểu 40–44px chiều cao; không chỉ biểu thị trạng thái bằng đổi màu
- Không style global cho mọi `button`; dùng class như `.btn-primary`, `.btn-accent` trong phạm vi phù hợp

button.css

```
.btn-primary {
  background-color: var(--color-primary);          /* #765337 */
  color: var(--color-surface);
  border: none;
  border-radius: var(--radius-control);
  padding: 10px 20px;
  font-family: var(--font-body);
  transition: background-color 0.2s ease;
}
.btn-primary:hover {
  background-color: var(--color-primary-hover);    /* sáng lên #BC5F13 */
}

/* Nút nhấn nổi bật */
.btn-accent {
  background-color: var(--color-accent);           /* #BC5F13 */
  color: var(--color-surface);
  border: none;
  border-radius: var(--radius-control);
  padding: 10px 20px;
  font-weight: 600;
  transition: background-color 0.2s ease;
}
.btn-accent:hover {
  background-color: var(--color-accent-hover);     /* #765337 */
}
```

### Form

Họ và tênTên hiển thị trên đơn hàng

Số điện thoại⚠ Số điện thoại cần đủ 10 chữ số

- Có label nhìn thấy được; placeholder không thay thế label
- Chiều cao control nhất quán, thường 44–48px, viền neutral `#E0E0E0`, focus ring rõ
- Error đặt gần field, có nội dung giải thích và icon/text ngoài màu viền
- Select, textarea, error, disabled cần style đồng bộ

### Card, bảng và danh sách

Ảnh sản phẩm

Ghế bành vải bố4.290.000 ₫Card trắng · viền #E0E0E0 · radius 12px

Ảnh ưu đãi

Combo phòng kháchGiảm 15%Nền phụ #FFF3E3 cho thẻ đặc biệt

#### Bảng Admin

Header phân biệt với body, hàng hover nhẹ, cột hành động không làm vỡ layout.

#### Danh sách User

Có cách hiển thị thay thế trên màn hình nhỏ: wrap, cuộn ngang có chủ đích hoặc chuyển thành card.

#### Empty / loading / error

Cần được thiết kế, không để vùng trắng trống khiến người dùng tưởng trang bị lỗi.

### Modal, drawer và overlay

- Phân cấp z-index thống nhất giữa header, dropdown, overlay, modal/drawer và toast; không để mỗi component tự đặt tùy ý
- Overlay đủ tương phản để phân biệt lớp nền; modal/drawer không tràn viewport trên mobile
- Thao tác đóng dễ tìm, hỗ trợ keyboard/focus theo khả năng của component hiện có

08

## Responsive

Dùng chung các mốc sau cho CSS mới; viết media query gắn với lúc layout thực sự cần đổi.

480pxĐiện thoại nhỏ

768pxĐiện thoại lớn / tablet dọc

1024pxTablet ngang / desktop hẹp

1200pxContainer desktop rộng

- Tránh nhiều breakpoint sát nhau (767 và 768px) nếu không giải quyết hai layout khác nhau
- Mobile-first khi component mới phù hợp; component legacy dùng `max-width` thì giữ pattern đó trong phạm vi component
- Kiểm tra ít nhất tại **375px, 768px, 1024px** và desktop rộng

09

## Quy ước tổ chức CSS trong Angular

my-user/src/styles.css # reset, font Poppins, tokens (:root), nền #FCF8F3 my-user/src/app/\<feature>/\<feature>.css # chỉ style feature/component đó my-admin/src/styles.css # reset, font Poppins, tokens (:root), nền #FCF8F3 my-admin/src/app/\<feature>/\<feature>.css

styles.css · base reset toàn cục

```
body {
  background-color: var(--color-page);  /* #FCF8F3 */
  color: var(--color-text);             /* #0A0A0A */
  font-family: var(--font-body);        /* Poppins */
}
```

### Nên và không nên

#### Nên

- Đặt style trong stylesheet riêng của component
- Khai báo token trong global styles của cả hai app (hai app build độc lập)
- Scope dưới class root: `.dcor-product-card`, `.dcor-orders-page .order-row`
- Đặt class theo vai trò: `.page-title`, `.form-field`, `.status-badge--pending`

#### Không nên

- Trông chờ selector trong component CSS tác động vào DOM nội bộ component khác (Angular cô lập style)
- Dùng `div`, `.btn`, `input`, `h1` không scope
- Phụ thuộc sâu vào cấu trúc HTML hoặc tên class của thư viện
- Dùng `!important` (chỉ giữ khi tích hợp thư viện, kèm comment giải thích)
- Đặt layout/reset/font toàn cục trong component CSS
- Áp `overflow: hidden` / `height: 100vh` lên `html`, `body`, app root khi không thực sự cần

User có luồng khóa scroll khi mở cart, Admin có layout viewport riêng. Giữ các hành vi đó ở đúng app/shell.

10

## Dùng với Tailwind v4

Token ở mục 3 đặt tên theo đúng quy ước `--color-*`, `--radius-*`, `--shadow-*`, `--font-*` của Tailwind v4. Khai báo một lần trong `@theme`, Tailwind tự sinh class tương ứng. Dùng class này thay cho CSS tự viết ở các mục 7 và 9.

### Cài đặt cho Angular

terminal + .postcssrc.json

```
npm install tailwindcss @tailwindcss/postcss postcss

// .postcssrc.json (cùng cấp package.json của từng app)
{
  "plugins": {
    "@tailwindcss/postcss": {}
  }
}
```

### Khai báo token trong styles.css

styles.css · @theme

```
@import "tailwindcss";

@theme {
  /* Màu: mỗi token sinh bg-*, text-*, border-*... */
  --color-primary: #765337;
  --color-primary-hover: #BC5F13;
  --color-primary-pressed: #3F2C1B;
  --color-accent: #BC5F13;
  --color-page: #FCF8F3;
  --color-sub-bg: #FFF3E3;
  --color-surface: #FFFFFF;
  --color-surface-subtle: #F5F5F5;
  --color-surface-muted: #EDEDED;
  --color-success: #00A30B;  --color-success-bg: #E9F8E9;
  --color-warning: #F2BF3D;  --color-warning-bg: #FFF8E5;
  --color-danger: #C42326;   --color-danger-bg: #FFE8E8;
  --color-info: #0023DD;     --color-info-bg: #EBEEFF;
  --color-text: #0A0A0A;
  --color-text-secondary: #616161;
  --color-text-muted: #757575;
  --color-border: #E0E0E0;
  --color-border-subtle: #EDEDED;

  /* Font, bo góc, đổ bóng */
  --font-sans: "Poppins", sans-serif;
  --radius-control: 8px;
  --radius-card: 12px;
  --radius-modal: 16px;
  --shadow-card: 0 1px 2px 0 rgb(0 0 0 / 5%);
  --shadow-overlay: 0 25px 50px -12px rgb(0 0 0 / 25%);

  /* Nền tảng dùng chung (mục 6) */
  --radius-sm: 4px;
  --shadow-header: 0 1px 8px rgb(118 83 55 / 6%);
  --shadow-control: 0 2px 6px -1px rgb(118 83 55 / 4%);
  --shadow-hover: 0 4px 6px -1px rgb(0 0 0 / 10%), 0 2px 4px -2px rgb(0 0 0 / 10%);
  --shadow-dropdown: 0 10px 15px -3px rgb(0 0 0 / 10%), 0 4px 6px -4px rgb(0 0 0 / 10%);
  --color-focus: #BC5F13;
  --color-overlay: rgb(10 10 10 / 48%);
  --ease-standard: cubic-bezier(0.2, 0, 0, 1);
  --default-transition-duration: 200ms;
  --text-3xl: 1.75rem;  /* 28px, mặc định Tailwind là 30px */
  --text-4xl: 2rem;     /* 32px, mặc định Tailwind là 36px */

  /* Breakpoint theo guide, thay bộ mặc định 640/768/1024/1280/1536 */
  --breakpoint-*: initial;
  --breakpoint-xs: 480px;
  --breakpoint-md: 768px;
  --breakpoint-lg: 1024px;
  --breakpoint-xl: 1200px;
}

@layer base {
  body { @apply bg-page text-text font-sans; }
}
```

z-index không có nhóm token trong Tailwind. Khai báo `--z-*` trong `:root` như mục 6 và dùng `z-(--z-modal)`. Cỡ chữ `text-sm`, `text-lg`, `text-xl`, `text-2xl` mặc định đã khớp guide, nên không cần khai báo lại.

Spacing không cần khai báo thêm. Thang mặc định của Tailwind là bội số 4px, nên `p-4` = 16px, `gap-6` = 24px, `py-12` = 48px, khớp bảng space-1…12 ở mục 5.

### Token sang class

| Token | Class Tailwind | Dùng cho |
| --- | --- | --- |
| `--color-primary` | `bg-primary` `text-primary` `border-primary` | Nút chính, icon, viền nút outline |
| `--color-primary-hover` | `hover:bg-primary-hover` | Hover sáng lên của nút chính |
| `--color-primary-pressed` | `active:bg-primary-pressed` | Nhấn giữ |
| `--color-accent` | `bg-accent` `hover:bg-primary` | Nút Mua ngay, badge hot |
| `--color-page` · `--color-sub-bg` | `bg-page` · `bg-sub-bg` | Nền trang · thẻ ưu đãi |
| `--color-surface` | `bg-surface` | Card, modal |
| `--color-text` · `-secondary` · `-muted` | `text-text` · `text-text-secondary` · `text-text-muted` | Chữ chính, phụ, caption |
| `--color-border` | `border-border` | Viền mặc định |
| `--radius-control` · `-card` · `-modal` | `rounded-control` · `rounded-card` · `rounded-modal` | Control 8px · card 12px · modal 16px |
| `--shadow-card` · `-hover` | `shadow-card` · `shadow-hover` | Card thường · card bấm được khi hover |
| `--shadow-header` · `-control` · `-dropdown` · `-overlay` | `shadow-header` · `shadow-control` · `shadow-dropdown` · `shadow-overlay` | Header · input · menu nổi · modal |
| Breakpoint | `xs:` `md:` `lg:` `xl:` | 480 · 768 · 1024 · 1200px, mobile-first |

### Nút bằng utility class

Angular template

```
<!-- Nút chính -->
<button class="min-h-11 rounded-control bg-primary px-5 py-2.5 font-medium text-surface
               transition-colors hover:bg-primary-hover active:bg-primary-pressed
               focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus
               disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-text-muted">
  Thêm vào giỏ
</button>

<!-- Nút nhấn nổi bật -->
<button class="min-h-11 rounded-control bg-accent px-5 py-2.5 font-semibold text-surface
               transition-colors hover:bg-primary">
  Mua ngay
</button>
```

`min-h-11` = 44px, đúng vùng bấm tối thiểu ở mục 7.

### Quy ước khi dùng Tailwind

#### Nên

- Chỉ dùng class sinh từ token: `bg-primary`, `rounded-card`, `p-4`
- Lặp lại một cụm class nhiều lần thì tách thành Angular component, không tạo class mới bằng `@apply`
- Khai báo `@theme` trong global styles của cả hai app (hai app build độc lập)
- Dùng `focus-visible:` cho viền focus, không chỉ đổi màu cho các trạng thái

#### Không nên

- Giá trị tùy ý như `bg-[#765337]`, `rounded-[10px]`, `text-[13px]`
- Dùng màu mặc định của Tailwind như `bg-amber-700`, ngoài palette DCor
- Dùng `!` (important) để lấn style khác
- Trộn media query tự viết với variant `md:` cho cùng một layout