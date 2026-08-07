# Tài Liệu Cấu Trúc Cơ Sở Dữ Liệu (Database Schema)

Dưới đây là chi tiết cấu trúc các bảng trong cơ sở dữ liệu của dự án DCor Studio, được sinh ra từ file `schema.prisma`.

---

## 1. Bảng `users`
- **Mục đích:** Lưu trữ thông tin tài khoản người dùng, bao gồm cả khách hàng và quản trị viên, dùng cho việc xác thực và phân quyền.

| Tên trường | Loại dữ liệu | Mục đích |
|---|---|---|
| `id` | String (UUID) | Khóa chính, định danh duy nhất cho mỗi người dùng. |
| `email` | String (Unique) | Địa chỉ email của người dùng (tùy chọn). |
| `phone` | String (Unique) | Số điện thoại đăng nhập, phương thức định danh chính. |
| `password_hash` | String | Lưu mật khẩu đã được mã hóa (bcrypt). |
| `full_name` | String | Tên đầy đủ của người dùng. |
| `avatar_url` | String | Đường dẫn ảnh đại diện của người dùng. |
| `role` | Enum `Role` | Vai trò (CUSTOMER, B2B, STAFF, ADMIN). Mặc định là CUSTOMER. |
| `deleted_at` | DateTime | Đánh dấu thời gian tài khoản bị xóa mềm (vô hiệu hóa). |
| `created_at` | DateTime | Thời gian tạo tài khoản. |
| `updated_at` | DateTime | Thời gian cập nhật tài khoản gần nhất. |

---

## 2. Bảng `addresses`
- **Mục đích:** Quản lý sổ địa chỉ giao hàng của người dùng. Một người dùng có thể có nhiều địa chỉ.

| Tên trường | Loại dữ liệu | Mục đích |
|---|---|---|
| `id` | String (UUID) | Khóa chính của địa chỉ. |
| `user_id` | String (FK) | Khóa ngoại liên kết tới bảng `users`. |
| `receiver_name` | String | Tên người nhận hàng. |
| `phone` | String | Số điện thoại người nhận. |
| `province` | String | Tỉnh/Thành phố. |
| `district` | String | Quận/Huyện. |
| `ward` | String | Phường/Xã. |
| `detail` | String | Địa chỉ chi tiết (số nhà, đường). |
| `is_default` | Boolean | Đánh dấu đây có phải là địa chỉ mặc định không. |
| `created_at` | DateTime | Thời gian tạo địa chỉ. |
| `updated_at` | DateTime | Thời gian cập nhật địa chỉ. |

---

## 3. Bảng `categories`
- **Mục đích:** Lưu trữ các danh mục sản phẩm.

| Tên trường | Loại dữ liệu | Mục đích |
|---|---|---|
| `id` | String (UUID) | Khóa chính của danh mục. |
| `name` | String (Unique) | Tên danh mục (lưu dạng chữ thường). |
| `slug` | String (Unique) | Chuỗi định danh URL thân thiện (vd: `sofa-phong-khach`). |
| `created_at` | DateTime | Thời gian tạo. |
| `updated_at` | DateTime | Thời gian cập nhật. |

---

## 4. Bảng `products`
- **Mục đích:** Lưu trữ thông tin chi tiết về sản phẩm nội thất được bán trên hệ thống.

| Tên trường | Loại dữ liệu | Mục đích |
|---|---|---|
| `product_id` | String (PK) | Mã sản phẩm (ví dụ: SM42250021). |
| `slug` | String (Unique) | Chuỗi URL thân thiện của sản phẩm. |
| `name` | String | Tên sản phẩm. |
| `category` | String | Tên danh mục (lưu chuỗi trực tiếp, không dùng FK). |
| `description` | Json | Mảng các đoạn văn mô tả PR/Marketing dài. |
| `base_price` | Float | Giá niêm yết cơ bản. |
| `discount_value`| Float | Giá trị giảm giá (nếu có). |
| `discount_type` | String | Loại giảm giá (phần trăm hoặc tiền mặt). |
| `images` | Json | Mảng URL chứa danh sách hình ảnh sản phẩm. |
| `config_options`| Json | Các tùy chọn cấu hình (ví dụ: loại vải, chân đế). |
| `variants` | Json | Danh sách biến thể (tổ hợp cấu hình kèm giá thay đổi). |
| `videos` | Json | Danh sách link video (nếu có). |
| `is_best_seller`| Boolean | Cờ đánh dấu sản phẩm bán chạy. |
| `is_new` | Boolean | Cờ đánh dấu sản phẩm mới. |
| `is_active` | Boolean | Trạng thái hiển thị sản phẩm (bật/tắt bán). |
| `inactive_reason`| String | Lý do tắt hiển thị sản phẩm (nếu có). |
| `created_at` | DateTime | Thời gian tạo sản phẩm. |
| `updated_at` | DateTime | Thời gian cập nhật sản phẩm. |

---

## 5. Bảng `wishlists`
- **Mục đích:** Lưu danh sách sản phẩm yêu thích của từng người dùng.

| Tên trường | Loại dữ liệu | Mục đích |
|---|---|---|
| `id` | String (UUID) | Khóa chính của bản ghi. |
| `user_id` | String (FK) | Liên kết tới bảng `users`. |
| `product_id` | String (FK) | Liên kết tới bảng `products`. |
| `created_at` | DateTime | Thời gian thêm vào wishlist. |

---

## 6. Bảng `orders` & `order_items`
- **Mục đích bảng `orders`:** Quản lý hóa đơn đặt hàng chung của khách hàng (bao gồm cả Guest và quà tặng).
- **Mục đích bảng `order_items`:** Lưu chi tiết các sản phẩm bên trong một hóa đơn.

**Bảng `orders`:**
| Tên trường | Loại dữ liệu | Mục đích |
|---|---|---|
| `id` | String (UUID) | Mã đơn hàng. |
| `user_id` | String (FK) | Liên kết người dùng (có thể Null nếu khách vãng lai). |
| `email` | String | Email liên hệ. |
| `phone` | String | Số điện thoại liên hệ đặt hàng. |
| `receiver_name` | String | Tên người nhận hàng. |
| `address` | String | Địa chỉ giao hàng đầy đủ. |
| `is_gift` | Boolean | Cờ đánh dấu mua tặng người khác. |
| `gift_message` | String | Lời nhắn gửi kèm quà tặng. |
| `hide_invoice_price`| Boolean| Ẩn giá trên biên lai giao hàng. |
| `sub_total` | Decimal | Tổng tiền hàng chưa giảm giá/ship. |
| `shipping_fee` | Decimal | Phí vận chuyển. |
| `discount_amount`| Decimal | Số tiền được giảm giá (mã KM). |
| `total_amount` | Decimal | Tổng thanh toán cuối cùng. |
| `promo_code` | String | Mã khuyến mãi đã áp dụng. |
| `status` | Enum | Trạng thái đơn (PENDING, SHIPPED, DELIVERED...). |
| `payment_method`| String | Phương thức thanh toán (COD, Chuyển khoản, Thẻ...). |
| `payment_status`| String | Tình trạng thanh toán (UNPAID, PAID). |
| `notes` | String | Ghi chú của khách. |
| `internal_notes`| String | Ghi chú nội bộ của nhân viên kho. |

**Bảng `order_items`:**
| Tên trường | Loại dữ liệu | Mục đích |
|---|---|---|
| `id` | String (UUID) | Khóa chính chi tiết đơn. |
| `order_id` | String (FK) | Liên kết tới bảng `orders`. |
| `product_id` | String | Mã sản phẩm. |
| `product_name` | String | Tên sản phẩm lưu lúc đặt (tránh đổi tên sau này). |
| `variant_key` | String | Khóa định danh biến thể khách đã chọn. |
| `variant_description`| String | Mô tả cấu hình khách đã chọn (chân sắt, nỉ xám...). |
| `image_url` | String | Ảnh thumbnail sản phẩm. |
| `quantity` | Int | Số lượng đặt mua. |
| `price` | Decimal | Giá mua tại thời điểm chốt đơn (tránh đổi giá sau này). |

---

## 7. Bảng `price_proposals`
- **Mục đích:** Xử lý tính năng mặc cả / thương lượng giá (Price Negotiation).

| Tên trường | Loại dữ liệu | Mục đích |
|---|---|---|
| `id` | String (UUID) | Khóa chính. |
| `user_id` | String (FK) | Liên kết tới `users`. |
| `product_id` | String (FK) | Liên kết tới `products`. |
| `proposed_price`| Decimal | Mức giá khách hàng mong muốn. |
| `reason` | String | Lý do xin giảm giá. |
| `phone` | String | Số điện thoại liên hệ thương lượng. |
| `status` | Enum | Trạng thái (PENDING, ACCEPTED, COUNTERED, REJECTED). |
| `counter_price` | Decimal | Mức giá deal ngược lại từ cửa hàng. |
| `promo_code_id` | String | Mã giảm giá được cấp riêng nếu cửa hàng chấp thuận. |

---

## 8. Bảng `community_posts`
- **Mục đích:** Tính năng mạng xã hội, chia sẻ hình ảnh không gian nội thất của khách hàng có gắn tag sản phẩm (như Pinterest).

| Tên trường | Loại dữ liệu | Mục đích |
|---|---|---|
| `id` | String (UUID) | Khóa chính bài post. |
| `user_id` | String (FK) | Liên kết người đăng (`users`). |
| `description` | String | Trạng thái mô tả bài đăng. |
| `images` | Json | Danh sách (tối đa 5) ảnh thực tế. |
| `tags` | Json | Mảng tọa độ các chấm tag gắn link sản phẩm trên ảnh. |
| `style` | String | Phân loại phong cách thiết kế (Modern, Minimalist...). |
| `room_type` | String | Loại phòng (Phòng ngủ, Phòng khách...). |
| `likes_count` | Int | Số lượt thả tim. |
| `is_approved` | Boolean | Trạng thái kiểm duyệt bài viết (Admin duyệt). |

---

## 9. Bảng `reviews`
- **Mục đích:** Đánh giá sản phẩm.

| Tên trường | Loại dữ liệu | Mục đích |
|---|---|---|
| `id` | String (UUID) | Khóa chính đánh giá. |
| `user_id` | String (FK) | Người đánh giá. |
| `product_id` | String (FK) | Sản phẩm được đánh giá. |
| `rating` | Int | Mức độ hài lòng (1 đến 5 sao). |
| `comment` | String | Nội dung đánh giá. |
| `images` | Json | Ảnh đính kèm review. |
| `is_approved` | Boolean | Trạng thái duyệt của admin. |

---

## 10. Bảng `room_designs`
- **Mục đích:** Lưu trữ các bản vẽ 2D Room Planner của khách hàng trên tính năng Thiết Kế.

| Tên trường | Loại dữ liệu | Mục đích |
|---|---|---|
| `id` | String (UUID) | Khóa chính. |
| `user_id` | String (FK) | Chủ sở hữu bản vẽ (`users`). |
| `name` | String | Tên bản thiết kế. |
| `background_image`| String| Hình nền sơ đồ phòng (nếu có tải lên). |
| `canvas_state` | Json | Chuỗi JSON Canvas (chứa tất cả object, vị trí, tọa độ, tỷ lệ). |
| `is_published` | Boolean | Trạng thái có chia sẻ bản vẽ ra cộng đồng không. |

---

## 11. Bảng `cart_items`
- **Mục đích:** Quản lý giỏ hàng lưu trữ Database cho những người dùng đã đăng nhập (hỗ trợ lưu giỏ hàng đa thiết bị).

| Tên trường | Loại dữ liệu | Mục đích |
|---|---|---|
| `id` | String (UUID) | Khóa chính. |
| `user_id` | String | Liên kết tới `users` (dùng String không ràng buộc khóa cứng để xử lý đồng bộ cache dễ hơn hoặc Guest merge). |
| `product_id` | String (FK) | Sản phẩm mua. |
| `name` | String | Tên sản phẩm. |
| `image` | String | Hình ảnh thu nhỏ. |
| `price` | Decimal | Giá bán hiện tại. |
| `quantity` | Int | Số lượng trong giỏ. |
| `variant_key` | String | Khóa cấu hình kết hợp. |
| `variant_tags` | Json | Dữ liệu tag (màu sắc/chất liệu) được chọn. |
| `leg_id` | String | Mã tùy chọn chân đế (nếu có). |
| `upholstery_id` | String | Mã tùy chọn bọc ngoài (nếu có). |
