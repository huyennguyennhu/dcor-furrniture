# Lịch sử chỉnh sửa tài liệu (Document History)

| Phiên bản | Ngày | Tác giả | Nội dung thay đổi |
| --- | --- | --- | --- |
| 1.0 | 05 tháng 10, 2026 | DCOR Team | Khởi tạo bản phác thảo Giỏ hàng (User Cart Drawer) trên Storefront. |
| 2.0 | 06 tháng 10, 2026 | Team BA DCOR Studio | Tách phân hệ `FRD-USR-03` thành 2 FRD độc lập (`FRD-USR-03A`: Quản lý Giỏ hàng & `FRD-USR-03B`: Đặt hàng Checkout). |
| 3.0 | 06 tháng 10, 2026 | Team BA & System Architect | Chuẩn hóa toàn bộ FRD-USR-03A chuẩn sản xuất (Production-Grade) với 8 Yêu cầu Chức năng chi tiết (FR-01 đến FR-08), Pre/Post-conditions, Gherkin Scenarios & UI Fields Matrices. |
| 4.0 | 06 tháng 10, 2026 | Team BA & System Architect | **Mở rộng siêu chi tiết (Exhaustive Enterprise Specification):** Bổ sung Sơ đồ chuyển trạng thái Cart State Machine (ASCII), 3 Bảng Ma trận Logic Ràng buộc Tồn kho & Đăng nhập, Chi tiết Payload DTO API Endpoints, Quy tả Pop-up Confirm Dialogs & Công thức Toán học Tính giá / Freeship. |

---

# 1. Tổng quan (Overview)

## 1.1. Mục đích (Purpose)
Tài liệu này định nghĩa chi tiết các yêu cầu nghiệp vụ và chức năng cho **Phân hệ Quản lý Giỏ hàng (Customer Cart Management - Cart Drawer & Cart Page)** dành cho khách hàng trên Storefront của **DCOR Studio**. Giỏ hàng là trung tâm điều phối sản phẩm mua sắm, hỗ trợ lưu giữ sản phẩm cho cả Khách vãng lai (Guest) và Khách đã đăng nhập (Member), tích hợp cơ chế đồng bộ giỏ hàng (Cart Merge Engine), đổi biến thể sản phẩm nhanh tại chỗ, thanh tiến trình Miễn phí giao hàng (Freeship Progress Bar), gợi ý mua kèm (Cross-sell) và tự động lọc sản phẩm hết hàng nhằm tối ưu hóa tỷ lệ chuyển đổi (Conversion Rate).

## 1.2. Phạm vi (Scope)

### 1.2.1. Tính năng thuộc phạm vi (In-Scope Features)
- **FR-01: Thêm Sản phẩm vào Giỏ hàng (Add to Cart Engine):** Thêm sản phẩm tiêu chuẩn từ trang PDP hoặc Quick View Drawer, xử lý chọn biến thể (kích thước, chất liệu, màu sắc).
- **FR-02: Giao diện Giỏ hàng Trượt & Trang Giỏ hàng (Cart Drawer & Cart Page):** Hiển thị danh sách sản phẩm dạng Drawer trượt bên phải hoặc Trang giỏ hàng đầy đủ (`/cart`), tích hợp Checkbox chọn/bỏ chọn từng item (Select All / Deselect).
- **FR-03: Cập nhật Số lượng & Kiểm tra Tồn kho Real-time (Quantity Control & Stock Guard):** Tăng/Giảm số lượng `[+]` `[-]`, nhập số lượng trực tiếp, kiểm tra mốc tồn kho tối đa khả dụng (`available_stock`).
- **FR-04: Đổi Tùy chọn Biến thể Nhanh Ngay Trong Giỏ (In-Cart Variant Switcher):** Cho phép đổi màu sắc, chất liệu, kích thước trực tiếp tại dòng sản phẩm trong giỏ mà không cần quay lại trang PDP.
- **FR-05: Đồng bộ Giỏ hàng Guest sang Member khi Đăng nhập (Cart Merge Engine):** Tự động hợp nhất danh sách sản phẩm lưu tạm ở LocalStorage của Khách vãng lai vào CSDL `carts` / `cart_items` của User ngay khi đăng nhập.
- **FR-06: Thanh Tiến trình Freeship & Tính toán Chi phí Minh bạch (Freeship Bar & Dynamic Calculator):** Thanh tiến trình Freeship cập nhật real-time theo Subtotal của các mục **ĐƯỢC TICK CHỌN**, tự động tính tổng tiền tạm tính.
- **FR-07: Gợi ý Sản phẩm Mua kèm & Mua Cùng Nhau (Cross-sell & Frequently Bought Together):** Khối gợi ý sản phẩm phụ kiện (Nệm sofa, gối bọc, dung dịch bảo dưỡng da) ngay dưới chân Cart Drawer kèm nút bấm 1-click "Thêm vào giỏ".
- **FR-08: Xử lý Trạng thái Giỏ trống & Sản phẩm Hết hàng/Thay đổi Giá (Empty State & Stale Item Protection):** Giao diện Giỏ rỗng gợi ý mua sắm, tự động mờ (Greyed out) và vô hiệu hóa checkbox với các sản phẩm hết hàng hoặc bị thay đổi giá.
- **🙌 Đề xuất - Khôi phục Giỏ hàng Bị Bỏ quên (Abandoned Cart Recovery):** Bắn thông báo Reminder Email / Web Push khi khách để hàng trong giỏ quá 24h mà chưa Checkout.
- **🙌 Đề xuất - Đánh dấu Lưu lại Mua sau (Save for Later):** Cho phép chuyển sản phẩm từ giỏ hàng vào danh sách "Yêu thích / Lưu mua sau".

### 1.2.2. Tính năng ngoài phạm vi (Out-Scope Features)
- Luồng Điền địa chỉ giao hàng, Chọn Voucher giảm giá & Nhấn nút Đặt hàng chốt đơn (Do phân hệ **FRD-USR-03B / Standard Checkout & Payment** đảm nhiệm).
- Luồng gửi Yêu cầu Custom sản phẩm nội thất từ PDP (Do phân hệ **FRD-USR-04 / Custom Order & OTP Contract** đảm nhiệm).

---

# 2. User Story & Tiêu chí nghiệm thu (Acceptance Criteria)

## US-01: Thêm và Quản lý Danh sách Sản phẩm trong Giỏ
> *Với tư cách là **Khách hàng**, tôi muốn xem danh sách các sản phẩm nội thất đã chọn, điều chỉnh số lượng hoặc chọn/bỏ chọn từng món, để tôi chốt danh sách trước khi thanh toán.*

### Tiêu chí nghiệm thu (Acceptance Criteria)
- **Scenario 1.1: Mở Giỏ hàng có Sản phẩm**
  - **Given:** Giỏ hàng đang chứa ít nhất 01 sản phẩm.
  - **When:** Người dùng bấm vào Icon Giỏ hàng trên Header hoặc bấm nút "Thêm vào giỏ" trên PDP.
  - **Then:** Mở Cart Drawer trượt mượt mà từ bên phải màn hình.
  - **And:** Hiển thị danh sách sản phẩm gồm: Checkbox (mặc định được tích chọn `isSelected = true`), Ảnh thumbnail, Tên sản phẩm, Tùy chọn biến thể (Màu/Chất liệu/Kích thước), Đơn giá, Bộ đếm số lượng `[-] [Qty] [+]` và nút Xóa (Icon thùng rác).

- **Scenario 1.2: Chọn/Bỏ chọn Sản phẩm để Thanh toán (Tick Checkbox)**
  - **Given:** Giỏ hàng có 3 sản phẩm A, B, C.
  - **When:** Người dùng bỏ tick (uncheck) Sản phẩm C.
  - **Then:** Sản phẩm C lập tức bị loại khỏi **Tổng tiền tạm tính (Subtotal)** và **Thanh tiến trình Freeship**.
  - **And:** Nút "Tiến hành thanh toán" chỉ tính số lượng và tổng tiền của các sản phẩm đang được tick chọn (A và B).

- **Scenario 1.3: Đổi Phân loại Biến thể Trực tiếp tại Giỏ**
  - **Given:** Sản phẩm "Sofa Da Ý" trong giỏ đang là `Biến thể: Màu Nâu / Khung Sồi`.
  - **When:** Người dùng nhấp vào khung thông số biến thể trên dòng sản phẩm.
  - **Then:** Mở một Popup Dropdown nhỏ cho phép đổi sang `Màu Xám / Khung Sồi`.
  - **And:** Khi bấm xác nhận ➔ Hệ thống tự động cập nhật lại Đơn giá, Ảnh thumbnail và Tồn kho của biến thể mới ngay trong giỏ.

- **Scenario 1.4: Cảnh báo Tồn kho Tối đa và Giới hạn Số lượng**
  - **Given:** Biến thể "Bàn Ăn Gỗ Sồi 1.8m" chỉ còn tồn kho 3 cái trong hệ thống.
  - **When (TH1):** Người dùng bấm nút `[+]` khi số lượng đang là 3.
  - **Then (TH1):** Nút `[+]` lập tức bị vô hiệu hóa (Disabled), hiển thị dòng text đỏ nhỏ bên dưới: *"Chỉ còn tối đa 3 sản phẩm trong kho."*
  - **When (TH2):** Người dùng gõ phím số `10` vào ô số lượng.
  - **Then (TH2):** Khi con trỏ rời khỏi ô nhập (Blur Event), hệ thống tự động trả số lượng về mức tồn kho tối đa là `3`, đồng thời hiển thị cảnh báo lỗi.

---

## US-02: Đồng bộ Giỏ hàng Guest sang Member khi Đăng nhập
> *Với tư cách là **Khách hàng vãng lai**, tôi muốn các sản phẩm tôi đã thêm vào giỏ trước khi đăng nhập không bị mất đi sau khi tôi Đăng nhập/Đăng ký tài khoản.*

### Tiêu chí nghiệm thu (Acceptance Criteria)
- **Scenario 2.1: Đồng bộ Hợp nhất Giỏ hàng (Cart Merge)**
  - **Given:** Khách vãng lai thêm Sản phẩm X vào giỏ (dữ liệu lưu trong LocalStorage `dcor_guest_cart`). Trong CSDL tài khoản của Khách đã có sẵn Sản phẩm Y.
  - **When:** Khách hàng thực hiện Đăng nhập thành công.
  - **Then:** Hệ thống kích hoạt API Cart Merge (`POST /api/v1/cart/merge`), tự động hợp nhất Sản phẩm X vào CSDL `cart_items` của tài khoản.
  - **And:** Xóa dữ liệu tạm `dcor_guest_cart` trong LocalStorage và hiển thị Giỏ hàng đã đồng bộ chứa cả Sản phẩm X và Y.

- **Scenario 2.2: Trùng Sản phẩm khi Đồng bộ**
  - **Given:** Cả trong LocalStorage và trong CSDL đều có Sản phẩm X (cùng SKU/Biến thể), với số lượng lần lượt là 2 và 3.
  - **When:** Đăng nhập thành công.
  - **Then:** Hệ thống cộng gộp số lượng `2 + 3 = 5` (nếu tổng số lượng 5 <= tồn kho khả dụng). Nếu vượt quá tồn kho 4, hệ thống gán số lượng = 4 và báo thông báo điều chỉnh.

---

## US-03: Thanh Tiến trình Freeship & Khối Gợi ý Cross-sell
> *Với tư cách là **Khách hàng**, tôi muốn nhìn thấy số tiền cần mua thêm để đạt mốc Freeship và xem gợi ý phụ kiện mua kèm, để tôi dễ dàng thêm hàng vào giỏ.*

### Tiêu chí nghiệm thu (Acceptance Criteria)
- **Scenario 3.1: Thanh Tiến trình Freeship Động**
  - **Given:** Chính sách DCOR miễn phí giao hàng cho đơn từ `30,000,000 ₫`. Tổng Subtotal của các mục ĐƯỢC TICK CHỌN đang là `22,000,000 ₫`.
  - **When:** Mở Giỏ hàng.
  - **Then:** Thanh Freeship Progress Bar hiển thị mức 73,3% màu xanh dương.
  - **And:** Dòng chữ thông báo: *"Mua thêm **8,000,000 ₫** để được MIỄN PHÍ GIAO HÀNG!"*.

- **Scenario 3.2: Đạt Mốc Miễn phí Giao hàng**
  - **Given:** Tổng Subtotal các mục được chọn đạt `35,000,000 ₫` (>= 30 triệu).
  - **Then:** Thanh Progress Bar đầy 100% màu xanh lá cây (`bg-emerald-500`). Text đổi thành: *"🎉 Tuyệt vời! Đơn hàng của bạn đã được MIỄN PHÍ GIAO HÀNG."*

- **Scenario 3.3: Thêm Nhanh Sản phẩm Gợi ý Mua kèm (Cross-sell)**
  - **Given:** Khách hàng đang xem giỏ chứa "Sofa Da". Phía dưới chân Cart Drawer hiển thị Khối "Thường được mua cùng": *Chai xịt dưỡng da Sofa (250.000 ₫)*.
  - **When:** Bấm nút **"+ Thêm ngay"** trên sản phẩm gợi ý.
  - **Then:** Chai xịt dưỡng da lập tức được thêm vào giỏ hàng với số lượng 1, tự động tính lại Subtotal & Freeship Bar.

---

# 3. Yêu cầu Chức năng chi tiết (Functional Requirements)

## 3.1. Yêu cầu chung (Common Requirements)

### 3.1.1. Kiến trúc Lưu trữ Đa tầng (Hybrid Cart Storage Architecture)
- **Guest Cart (Khách vãng lai):** 
  - Lưu trữ dưới dạng mảng JSON trong LocalStorage (`dcor_guest_cart`).
  - Cấu trúc bản ghi: `[{ variant_id: string, quantity: number, selected: boolean, added_at: timestamp }]`.
  - Giới hạn thời gian lưu trữ trong LocalStorage: **30 ngày**.
- **Member Cart (Khách đã đăng nhập):**
  - Lưu trữ persistent trong PostgreSQL (Bảng `carts` và `cart_items`).
  - Mỗi tài khoản `users` chỉ liên kết duy nhất với **01 bản ghi `carts` active**.

### 3.1.2. Sơ đồ Chuyển Trạng thái Giỏ hàng & Item (State Machine Diagram)

```text
               +----------------------------------+
               |  EMPTY CART (Giỏ hàng trống)     |
               +----------------------------------+
                                |
                   Thêm sản phẩm thành công
                                |
                                v
               +----------------------------------+
               |  ACTIVE CART (Giỏ hàng có hàng)  |
               +----------------------------------+
                     /                      \
      Đăng nhập (Guest Cart)          User thay đổi Checkbox / Qty
                   /                          \
  +-------------------------------+   +-------------------------------+
  | CART MERGE ENGINE             |   | DYNAMIC CALCULATOR            |
  | Gộp LocalStorage vào DB      |   | Recalculate Subtotal &        |
  | Clear `dcor_guest_cart`       |   | Freeship Progress Bar         |
  +-------------------------------+   +-------------------------------+
                 \                          /
                  v                        v
               +----------------------------------+
               | READY FOR CHECKOUT               |
               | (Khách bấm Tiến hành thanh toán) |
               +----------------------------------+
```

### 3.1.3. Công thức Toán học & Algorithmic Logic
1. **Tổng tiền Tạm tính (Subtotal):**
   $$\text{Subtotal} = \sum_{i=1}^{n} \left( \text{Item}_i.\text{unit\_price} \times \text{Item}_i.\text{quantity} \right) \quad \text{với } \text{Item}_i.\text{isSelected} = \text{true} \text{ và } \text{Item}_i.\text{in\_stock} = \text{true}$$

2. **Khoảng cách Miễn phí Giao hàng (Freeship Deficit):**
   $$\text{Freeship\_Deficit} = \max\left(0, \text{Freeship\_Threshold} - \text{Subtotal}\right)$$

3. **Tỷ lệ Thanh Tiến trình Freeship (Freeship Percentage):**
   $$\text{Freeship\_Percentage} = \min\left(100\%, \left(\frac{\text{Subtotal}}{\text{Freeship\_Threshold}}\right) \times 100\%\right)$$

4. **Tổng Số lượng Sản phẩm được Chọn (Cart Badge Count):**
   $$\text{Selected\_Items\_Count} = \sum_{i=1}^{n} \text{Item}_i.\text{quantity} \quad \text{với } \text{Item}_i.\text{isSelected} = \text{true}$$

---

## 3.2. Bảng Ma trận Logic Ràng buộc Nghiệp vụ (Business Rules Matrices)

### Ma trận 1: Loại Người dùng × Phương thức Lưu trữ × Logic Đồng bộ

| Loại Người Dùng | Nơi Lưu Trữ Bản Bằng Giỏ | Tự Động Lưu DB | Hành Vi Khi Đăng Nhập | Hạn Tồn Tại |
| --- | --- | --- | --- | --- |
| **Guest (Vãng lai)** | LocalStorage (`dcor_guest_cart`) | Không | Kích hoạt API Cart Merge (`POST /merge`) ➔ Gộp vào DB | 30 ngày |
| **Member (Đã đăng nhập)** | PostgreSQL DB (`cart_items`) | Có (Real-time) | Load giỏ từ CSDL `cart_items` của `user_id` | Vĩnh viễn |

### Ma trận 2: Trạng thái Tồn kho Khả dụng (`available_stock`) × Hành vi UI

| Trạng thái Tồn kho | Giá trị `available_stock` | Nút `[+]` | Nút `[-]` | Ô Nhập tay (Blur Clamp) | Trạng thái Checkbox | Opacity Dòng SP | Nút Checkout |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **Còn nhiều** | `> quantity` | Enabled | Enabled | Cho nhập `<= stock` | Editable | 100% | Enabled |
| **Chạm mốc max** | `== quantity` | **Disabled** + Text đỏ | Enabled | Tự Clamp về `stock` | Editable | 100% | Enabled |
| **Hết hàng** | `0` | **Disabled** | **Disabled** | Khóa (Disabled) | **Unchecked & Disabled** | **50% (Greyed out)** | **Disabled** (Nếu chỉ có SP hết hàng) |

---

## 3.3. Yêu cầu Chức năng Chi tiết (Functional Requirements Details)

### FR-01: Thêm Sản phẩm vào Giỏ hàng (Add to Cart Engine)

- **Description:** Cung cấp cơ chế cho phép người dùng thêm sản phẩm tiêu chuẩn từ trang PDP hoặc Quick View Drawer vào giỏ hàng với các biến thể đã chọn.
- **Business Rules:**
    - **Variant Selection Requirement:** Bắt buộc chọn đủ các thuộc tính biến thể bắt buộc (Màu sắc, Chất liệu, Kích thước) trước khi bấm "Thêm vào giỏ".
    - **Stock Validation:** Kiểm tra số lượng thêm `qty_add + qty_existing <= available_stock`. Nếu vượt quá ➔ Báo lỗi và không cho thêm.
    - **Max Cart Limit:** Tối đa 50 mặt hàng khác nhau (unique SKUs) trong 1 giỏ hàng.
- **Pre-conditions:** Người dùng ở trang PDP (`/products/:slug`) hoặc Modal Quick View, sản phẩm còn tồn kho (`available_stock > 0`).
- **Use Case Specification:**

    | Action (Người dùng) | System Behavior (Hệ thống) |
    | --- | --- |
    | Chọn biến thể (Màu Xám, Size L) và bấm **"Thêm Vào Giỏ"** | 1. Hệ thống kiểm tra tồn kho biến thể.<br>2. Nếu là Guest: Lưu vào LocalStorage.<br>3. Nếu là Member: Gọi API `POST /api/v1/cart/items`. |
    | Hệ thống xử lý xong | 1. Tự động mở Cart Drawer từ bên phải.<br>2. Hiển thị thông báo Toast: *"Đã thêm [Tên SP] vào giỏ hàng"*. |
    | Chưa chọn biến thể mà bấm nút | Rung khung chọn biến thể, viền đỏ thuộc tính còn thiếu kèm text: *"Vui lòng chọn Màu sắc và Kích thước"*. |

- **Post-conditions:** Sản phẩm được thêm mới hoặc cộng dồn số lượng vào giỏ hàng. Badge đếm số lượng giỏ hàng trên Header Top Bar tăng lên tương ứng.
- **UI Fields Matrix:**

    | Field Name | UI Component | Data Type | Mandatory | Default | Constraints / Logic |
    | --- | --- | --- | --- | --- | --- |
    | Product ID | Hidden Field | String (UUID) | Yes | N/A | ID sản phẩm tiêu chuẩn. |
    | Variant ID | Radio / Swatch | String (UUID) | Yes | Selected | ID biến thể đã chọn (Màu/Size/Chất liệu). |
    | Quantity | Counter `[-] [+]` | Integer | Yes | 1 | Min 1, Max `available_stock`. |

---

### FR-02: Giao diện Giỏ hàng Trượt & Trang Giỏ hàng (Cart Drawer & Cart Page)

- **Description:** Hiển thị danh sách sản phẩm trong giỏ hàng dưới dạng Drawer trượt cạnh phải hoặc Trang `/cart` đầy đủ, cho phép quản lý trạng thái chọn/bỏ chọn từng mặt hàng.
- **Business Rules:**
    - **Select All Checkbox:** Tích chọn "Chọn tất cả" ➔ Chuyển toàn bộ sản phẩm hợp lệ sang `isSelected = true`. Bỏ tích ➔ Chuyển toàn bộ sang `isSelected = false`.
    - **Default Selection State:** Sản phẩm mới được thêm vào giỏ mặc định ở trạng thái `isSelected = true`.
    - **Persisted State:** Trạng thái tick chọn `isSelected` được lưu giữ trong phiên làm việc.
- **Pre-conditions:** Người dùng bấm Icon Giỏ hàng hoặc thực hiện hành động Thêm vào giỏ.
- **Use Case Specification:**

    | Action (Người dùng) | System Behavior (Hệ thống) |
    | --- | --- |
    | Bấm Icon Giỏ hàng trên Header | Hiển thị Backdrop làm mờ màn hình và trượt Cart Drawer ra từ bên phải. |
    | Bỏ tick Checkbox của 1 sản phẩm | 1. Đổi `isSelected = false` cho sản phẩm đó.<br>2. Tính toán lại Subtotal & Freeship Bar loại trừ sản phẩm đó. |
    | Bấm nút "Xóa" (Icon Thùng rác) | Hiển thị Modal xác nhận nhỏ *"Bạn có chắc muốn xóa sản phẩm này?"*. Bấm Đồng ý ➔ Xóa dòng sản phẩm khỏi giỏ. |

- **Post-conditions:** Giao diện hiển thị chính xác danh sách sản phẩm, Subtotal và trạng thái checkbox.

---

### FR-03: Cập nhật Số lượng & Kiểm tra Tồn kho Real-time (Quantity Control & Stock Guard)

- **Description:** Cho phép người dùng tăng/giảm hoặc nhập trực tiếp số lượng sản phẩm trong giỏ, đồng thời tự động kiểm soát mốc tồn kho tối đa.
- **Business Rules:**
    - **Min Quantity:** Số lượng tối thiểu là `1`. Bấm nút `[-]` khi số lượng = 1 ➔ Kích hoạt hội thoại xác nhận xóa sản phẩm.
    - **Max Quantity Constraint:** Số lượng không được vượt quá `min(available_stock, max_purchase_limit)`.
    - **Blur Validation:** Khi người dùng nhập tay số lượng vào Input ➔ Kiểm tra validation khi con trỏ rời ô (Blur event). Nếu nhập chuỗi không phải số hoặc <= 0 ➔ Tự reset về `1`. Nếu nhập > tồn kho ➔ Tự reset về `available_stock`.
- **Pre-conditions:** Giỏ hàng có sản phẩm, người dùng tương tác với bộ đếm số lượng.
- **Use Case Specification:**

    | Action (Người dùng) | System Behavior (Hệ thống) |
    | --- | --- |
    | Bấm nút `[+]` | 1. Kiểm tra `current_qty + 1 <= available_stock`.<br>2. Nếu hợp lệ: Cập nhật `qty = qty + 1` & tính lại giá.<br>3. Nếu đạt mốc max: Vô hiệu hóa nút `[+]`, báo text đỏ. |
    | Gõ trực tiếp số `999` vào ô nhập | Khi Blur event kích hoạt: Kiểm tra tồn kho (VD: kho còn 5) ➔ Tự động sửa số `999` thành `5`, báo Toast warning. |

- **Post-conditions:** Số lượng sản phẩm trong giỏ được cập nhật vào CSDL/LocalStorage. Tổng tiền tạm tính tự động tính lại.

---

### FR-04: Đổi Tùy chọn Biến thể Nhanh Ngay Trong Giỏ (In-Cart Variant Switcher)

- **Description:** Cho phép người dùng thay đổi tùy chọn biến thể (màu sắc, chất liệu, kích thước) trực tiếp trên dòng sản phẩm trong giỏ hàng mà không cần chuyển hướng trang.
- **Business Rules:**
    - **In-place Modal/Dropdown:** Bấm vào khung thông tin biến thể ➔ Mở Popover hiển thị các thuộc tính biến thể khả dụng của sản phẩm đó.
    - **Price Adjustment:** Nếu biến thể mới có giá khác biến thể cũ ➔ Cập nhật lại đơn giá dòng sản phẩm và Subtotal giỏ.
    - **Merge On Switch:** Nếu biến thể mới được chọn trùng với một sản phẩm đã có sẵn trong giỏ ➔ Hệ thống tự động gộp 2 dòng sản phẩm thành 1 và cộng dồn số lượng.
- **Pre-conditions:** Sản phẩm trong giỏ có từ 2 biến thể trở lên.
- **Use Case Specification:**

    | Action (Người dùng) | System Behavior (Hệ thống) |
    | --- | --- |
    | Bấm vào chữ "Biến thể: Màu Nâu / Sồi" | Hiển thị Popover cho chọn Màu sắc (Nâu/Xám/Đen) và Khung gỗ. |
    | Chọn "Màu Xám" và bấm **"Cập nhật"** | 1. Hệ thống tìm `variant_sku` tương ứng.<br>2. Cập nhật `item.variant_id`, đơn giá & ảnh thumbnail mới.<br>3. Nếu bị trùng sản phẩm sẵn có ➔ Tự động gộp dòng. |

- **Post-conditions:** Biến thể sản phẩm trong giỏ được thay đổi thành công. CSDL/LocalStorage ghi nhận `variant_id` mới.

---

### FR-05: Đồng bộ Giỏ hàng Guest sang Member khi Đăng nhập (Cart Merge Engine)

- **Description:** Xử lý hợp nhất tự động danh sách sản phẩm tạm thời của Khách vãng lai (lưu trong LocalStorage) vào tài khoản CSDL ngay khi khách Đăng nhập/Đăng ký.
- **Business Rules:**
    - **Merge Trigger:** Kích hoạt ngay sau khi API Auth trả về kết quả Đăng nhập thành công và có dữ liệu trong LocalStorage `dcor_guest_cart`.
    - **Merge Logic:**
        - Với item trong Guest Cart chưa có trong Member Cart ➔ Thêm mới vào CSDL `cart_items`.
        - Với item trong Guest Cart đã có trong Member Cart ➔ Cộng dồn số lượng `qty_member + qty_guest`. Nếu `sum_qty > available_stock` ➔ Gán `qty = available_stock`.
    - **Cleanup:** Sau khi API Merge thành công ➔ Xóa trắng key `dcor_guest_cart` trong LocalStorage.
- **Pre-conditions:** Khách vãng lai có sản phẩm trong LocalStorage và tiến hành Đăng nhập thành công.
- **Use Case Specification:**

    | Action (Người dùng) | System Behavior (Hệ thống) |
    | --- | --- |
    | Hoàn tất Đăng nhập | 1. Angular Auth Guard phát hiện có `dcor_guest_cart`.<br>2. Gửi API `POST /api/v1/cart/merge` đính kèm Guest Cart payload.<br>3. Backend xử lý gộp DB và trả về Cart hoàn chỉnh. |
    | Nhận phản hồi API Merge | 1. Xóa `dcor_guest_cart` khỏi LocalStorage.<br>2. Cập nhật state giỏ hàng mới lên UI và mở Cart Drawer. |

- **Post-conditions:** Dữ liệu giỏ hàng được hợp nhất an toàn trong CSDL PostgreSQL. LocalStorage của Guest được làm sạch.

---

### FR-06: Thanh Tiến trình Freeship & Tính toán Chi phí Minh bạch (Freeship Bar & Dynamic Calculator)

- **Description:** Hiển thị thanh tiến trình trực quan đo lường khoảng cách đến mốc Miễn phí giao hàng và tính toán minh bạch chi phí tạm tính.
- **Business Rules:**
    - **Threshold Parameter:** Mốc Freeship được cấu hình động từ hệ thống (Mặc định: `30,000,000 ₫`).
    - **Calculation Scope:** `Freeship_Progress` = `(Selected_Subtotal / Threshold) * 100%`. Chỉ tính trên các mặt hàng có `isSelected == true`.
    - **Visual States:**
        - `Progress < 100%`: Thanh progress bar màu xanh dương (`bg-blue-500`), hiển thị text *"Mua thêm [Threshold - Subtotal] ₫ để được MIỄN PHÍ GIAO HÀNG!"*.
        - `Progress >= 100%`: Thanh progress bar đầy 100% màu xanh lá (`bg-emerald-500`), hiển thị text *"🎉 Tuyệt vời! Đơn hàng của bạn đã được MIỄN PHÍ GIAO HÀNG."*.
- **Pre-conditions:** Giỏ hàng hiển thị trên UI.
- **Use Case Specification:**

    | Action (Người dùng) | System Behavior (Hệ thống) |
    | --- | --- |
    | Tăng số lượng hoặc tích chọn thêm SP | 1. Hệ thống tính lại `Selected_Subtotal`.<br>2. Cập nhật % độ dài thanh Freeship Bar với animation mượt mà.<br>3. Cập nhật số tiền còn thiếu thời gian thực. |

- **Post-conditions:** Thanh tiến trình Freeship và số tiền tạm tính được hiển thị chính xác theo lựa chọn hiện tại.

---

### FR-07: Gợi ý Sản phẩm Mua kèm & Mua Cùng Nhau (Cross-sell & Frequently Bought Together)

- **Description:** Hiển thị khối gợi ý các sản phẩm phụ kiện nội thất phù hợp với các sản phẩm đang có trong giỏ hàng để kích thích mua thêm.
- **Business Rules:**
    - **Recommendation Logic:** Dựa theo danh mục sản phẩm trong giỏ (Ví dụ: Giỏ có Sofa ➔ Gợi ý Bàn trà, Chai xịt da, Gối tựa; Giỏ có Bàn ăn ➔ Gợi ý Khăn trải bàn, Bộ ly).
    - **Quick Add Action:** Bấm nút "+ Thêm ngay" ➔ Thêm sản phẩm gợi ý vào giỏ với số lượng 1 (sử dụng biến thể mặc định) mà không chuyển trang.
- **Pre-conditions:** Giỏ hàng đang chứa sản phẩm.
- **Use Case Specification:**

    | Action (Người dùng) | System Behavior (Hệ thống) |
    | --- | --- |
    | Cuộn xuống chân Cart Drawer | Hiển thị Slider / Khối "Thường được mua cùng" chứa 2-4 sản phẩm phụ kiện kèm giá và nút "+ Thêm ngay". |
    | Bấm nút **"+ Thêm ngay"** trên SP gợi ý | Thêm ngay phụ kiện vào giỏ hàng, cập nhật Subtotal và Freeship Bar ngay lập tức. |

- **Post-conditions:** Sản phẩm phụ kiện mua kèm được thêm vào giỏ hàng thành công.

---

### FR-08: Xử lý Trạng thái Giỏ trống & Sản phẩm Hết hàng/Thay đổi Giá (Empty State & Stale Item Protection)

- **Description:** Xử lý giao diện thân thiện khi giỏ hàng chưa có sản phẩm và bảo vệ đơn hàng trước các sản phẩm bị hết hàng hoặc thay đổi giá đột ngột.
- **Business Rules:**
    - **Empty State UI:** Khi giỏ rỗng (`items.length == 0`) ➔ Hiển thị ảnh minh họa Giỏ rỗng, dòng chữ *"Giỏ hàng của bạn đang trống"* và nút bấm **"Khám phá Sản phẩm"** (chuyển hướng về `/products`).
    - **Out-of-Stock Protection:** Nếu 1 sản phẩm trong giỏ bị hết hàng trong kho (`available_stock == 0`):
        - Dòng sản phẩm bị làm mờ (Opacity 50%, Greyed out).
        - Hiển thị nhãn Badge màu đỏ: *"Tạm hết hàng"*.
        - Vô hiệu hóa checkbox tích chọn `isSelected = false` và khóa không cho tính vào Subtotal.
    - **Checkout Disabling:** Nút "Tiến hành thanh toán" bị vô hiệu hóa (Disabled) nếu (1) Không có sản phẩm nào được chọn, HOẶC (2) Có sản phẩm được chọn đang trong trạng thái lỗi/hết hàng.
- **Pre-conditions:** Mở giỏ hàng khi rỗng hoặc khi có biến động tồn kho trong CSDL.
- **Use Case Specification:**

    | Action (Người dùng) | System Behavior (Hệ thống) |
    | --- | --- |
    | Mở giỏ hàng khi không có SP | Hiển thị giao diện Empty State kèm nút "Khám phá Sản phẩm". |
    | Có 1 SP trong giỏ vừa hết hàng | 1. Hệ thống tự động bỏ tích chọn checkbox SP đó.<br>2. Hiển thị nhãn đỏ "Tạm hết hàng", làm mờ dòng SP.<br>3. Hiển thị thông báo cảnh báo: *"Một số sản phẩm trong giỏ đã hết hàng."* |

- **Post-conditions:** Đảm bảo giỏ hàng luôn ở trạng thái dữ liệu an toàn và hợp lệ trước khi cho phép chuyển sang bước Checkout.

---

## 3.4. Bảng Quy Tả Pop-up Confirm Dialogs Specification

| Mã Dialog | Tiêu Đề Dialog | Nội Dung Hiển Thị | Nút Bấm Thao Tác | Hành Vi Khi Xác Nhận |
| --- | --- | --- | --- | --- |
| **DLG-CART-01** | *"Xóa sản phẩm khỏi giỏ"* | *"Bạn có chắc chắn muốn xóa sản phẩm '[Tên SP]' ra khỏi giỏ hàng không?"* | `[Hủy]` \| `[Xóa sản phẩm]` (Đỏ) | Xóa bản ghi dòng sản phẩm khỏi giỏ. |
| **DLG-CART-02** | *"Đồng bộ giỏ hàng"* | *"Hệ thống phát hiện giỏ hàng vãng lai. Bạn có muốn gộp vào giỏ hàng tài khoản không?"* | `[Bỏ qua]` \| `[Gộp giỏ hàng]` (Xanh) | Chạy API Merge `POST /api/v1/cart/merge`. |
| **DLG-CART-03** | *"Đổi tùy chọn biến thể"* | *"Tùy chọn mới có giá khác tùy chọn cũ ([Giá mới] ₫ vs [Giá cũ] ₫). Tiếp tục?"* | `[Hủy]` \| `[Đồng ý đổi]` | Cập nhật lại đơn giá và Subtotal giỏ. |

---

## 3.5. Quy Tả Cấu Trúc API Payload DTO (API Technical Payload Specifications)

### 1. API Thêm vào Giỏ: `POST /api/v1/cart/items`
```json
// Request Payload:
{
  "variant_id": "var_sofa_oak_gray_001",
  "quantity": 1,
  "is_selected": true
}

// Response Payload (200 OK):
{
  "success": true,
  "message": "Item added to cart successfully",
  "data": {
    "cart_id": "cart_usr_9981",
    "total_items": 3,
    "selected_subtotal": 45000000,
    "freeship_qualified": true
  }
}
```

### 2. API Gộp Giỏ hàng Guest: `POST /api/v1/cart/merge`
```json
// Request Payload:
{
  "guest_cart_items": [
    { "variant_id": "var_table_oak_01", "quantity": 1, "is_selected": true },
    { "variant_id": "var_chair_velvet_02", "quantity": 4, "is_selected": true }
  ]
}

// Response Payload (200 OK):
{
  "success": true,
  "merged_count": 2,
  "data": { "cart_id": "cart_usr_9981", "total_items": 5 }
}
```

---

## 3.6. Cảnh báo lỗi & Phản hồi hệ thống (Error Messages & System Feedback)

| Sự kiện / Điều kiện | Loại Phản hồi | Nội dung Thông báo | Thao tác Xử lý |
| --- | --- | --- | --- |
| Vượt Tồn kho Tối đa | Inline Error / Toast | `"Chỉ còn tối đa [X] sản phẩm trong kho."` | Vô hiệu hóa nút `[+]`, reset số lượng về `X`. |
| Sản phẩm Hết hàng | Item Badge / Toast | `"Sản phẩm [Tên SP] vừa hết hàng."` | Làm mờ dòng SP, bỏ tick `isSelected`, khóa Checkout. |
| Chưa chọn SP Thanh toán | Tooltip / Disabled | `"Vui lòng chọn ít nhất 1 sản phẩm để thanh toán."` | Vô hiệu hóa nút "Tiến hành thanh toán" (Màu xám). |
| Đổi Biến thể Thành công | Toast Success | `"Đã cập nhật tùy chọn biến thể mới."` | Toast xanh lá, tự ẩn sau 2s. |
| Thêm vào Giỏ OK | Toast Success | `"Đã thêm [Tên SP] vào giỏ hàng!"` | Toast xanh lá + Tự động mở Cart Drawer. |
| Gộp Giỏ thành công | Toast Notice | `"Đã đồng bộ giỏ hàng của bạn."` | Toast thông báo sau khi đăng nhập. |

---

# 4. Yêu cầu Phi chức năng (Non-Functional Requirements)

- **Performance (Hiệu năng):**
  - Thời gian mở Cart Drawer: **< 50ms** (Animation mượt mà 60fps).
  - Thời gian xử lý API Cập nhật số lượng / Thêm vào giỏ: **< 150ms**.
  - Tính toán lại Subtotal & Freeship Bar trên Frontend: **0ms** (Reactivity via Angular Signals / RxJS).
- **Usability & UX (Độ khả dụng):**
  - Cart Drawer hỗ trợ đóng bằng phím `ESC` hoặc click ra ngoài vùng mờ (Backdrop overlay).
  - Hỗ trợ đầy đủ thao tác vuốt (Swipe to dismiss) trên giao diện Mobile Web.
- **Reliability & Persistence (Độ tin cậy):**
  - Đồng bộ giỏ hàng an toàn, không bị mất dữ liệu khi F5 Reload trình duyệt hoặc khi chuyển đổi mạng.

---

# 5. Prototype & Tài liệu liên quan (Related Documents)

- **Sơ đồ CSDL liên quan:** Bảng `carts`, `cart_items`, `products`, `product_variants`.
- **Tài liệu quy trình liên quan:**
  - [FRD - [USR-01] User Authentication & Profile.md](file:///d:/00_LEARNING/0_Study/HocChinhUEL/4_1_LapTrinhWebNangCao/thucHanh/FRD%20-%20%5BUSR-01%5D%20User%20Authentication%20&%20Profile.md)
  - [bpmn_purchase_process.md](file:///d:/00_LEARNING/0_Study/HocChinhUEL/4_1_LapTrinhWebNangCao/DoAn/Dev/dcor_Angular/bpmn_purchase_process.md)
  - `FRD-USR-03B: Standard Checkout & Payment` (Tài liệu Đặt hàng độc lập).
