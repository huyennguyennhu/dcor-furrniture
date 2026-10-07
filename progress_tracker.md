# Báo cáo Tiến độ Dự án DCOR Studio (Project Progress Tracker)
*Cập nhật lần cuối: 06/10/2026*

Tài liệu này tổng hợp tình trạng hiện tại của dự án, những công việc đã hoàn thành (Done), những công việc đang dở dang (In Progress), và những hạng mục chưa bắt đầu (To-do) ở cả hai phía Frontend và Backend.

---

## 1. Tình trạng Backend (Node.js / NestJS)

**Trạng thái chung:** 🟡 **Giai đoạn khởi tạo & Thiết kế Data** (Rất sơ khai, chưa có code logic API).

### ✅ Đã làm (Done)
- **Thiết kế Database Schema (`schema.prisma`):** Đã chốt cấu trúc cơ sở dữ liệu rất chi tiết và chuẩn production, bao gồm:
  - Bảng `Product`, `ProductVariant`, `Category`, `Collection`, `Brand`.
  - Bảng `Customer`, `StaffUser` (Phân quyền Role rõ ràng).
  - Bảng `Order`, `OrderItem`, `OrderStatusHistory`, `Address`, `Payment`.
  - Bảng `Cart`, `CartItem`.
  - Các bảng hỗ trợ tính năng khác (Review, Discount, B2B Company, Appointment, Chat).
- Cập nhật chuẩn các kiểu dữ liệu tiền tệ (`BigInt`), thiết lập quan hệ FK chuẩn xác.

### ❌ Chưa làm (To-do)
- Chưa Setup các Module, Controller, Service cơ bản của NestJS/Express.
- Chưa kết nối Prisma Client để thực thi thao tác CRUD với Database.
- Chưa làm hệ thống Xác thực và Phân quyền (Authentication & Authorization) bằng JWT.
- Chưa có bất kỳ API Endpoint nào (API Giỏ hàng, API Đơn hàng, API Sản phẩm, API Báo cáo...).
- Chưa xử lý các logic nghiệp vụ phức tạp:
  - Trừ/Cộng tồn kho khi đặt hàng (Inventory Atomic transaction).
  - Tích hợp Cổng thanh toán (Payment Gateway).

---

## 2. Tình trạng Frontend - Hệ thống Quản trị (Admin Portal)

**Trạng thái chung:** 🔵 **Đã có giao diện Prototype & Tài liệu FRD một phần** (Chưa gắn API, chưa có logic thật).

### ✅ Đã làm (Done)
- **Xây dựng UI Prototype tĩnh (HTML/CSS):** Đã dựng khung layout và các trang (Dashboard, Products, Orders, Customers, Promotions, Settings, Reports...). Giao diện nhìn chuyên nghiệp, hiện đại.
- **Tài liệu Yêu cầu (FRD):** Đã viết tài liệu phân tích nghiệp vụ cực kỳ chi tiết cho:
  - Luồng Mời nhân viên (Invite Staff Workflow).
  - Trang Đăng nhập Admin (Admin Login).
  - Phân hệ Báo cáo (Reports): Đã làm đủ 5 tab (Tổng quan, Doanh thu, Đơn hàng, Sản phẩm, Khách hàng). Đã quy định rõ các rule như vô hiệu hóa (disable) nút bấm khi form sai.

### ❌ Chưa làm (To-do)
- Chưa viết FRD cho các Module vận hành cốt lõi: Quản lý Sản phẩm (Tạo/Sửa), Quản lý Đơn hàng (Cập nhật trạng thái), Quản lý Khách hàng.
- UI đang là dữ liệu giả (Mock data), chưa kết nối API Backend.
- Chưa xử lý Routing Guards (Chặn người dùng chưa đăng nhập không cho vào `/admin`).
- Các biểu đồ trong Reports mới là tĩnh (ng2-charts mock), chưa filter được dữ liệu thực.

---

## 3. Tình trạng Frontend - Cửa hàng (User Storefront)

**Trạng thái chung:** 🔵 **Đã có giao diện Prototype** (Chưa gắn API).

### ✅ Đã làm (Done)
- **Xây dựng UI Prototype tĩnh:** Đã dựng các trang Home, Khám phá (Sản phẩm), Chi tiết sản phẩm, Thiết kế, Blog.
- **Tính năng Giỏ hàng (Cart Drawer):**
  - Đã có UI trượt từ phải sang (Drawer).
  - Đã làm giao diện tăng giảm số lượng, hiển thị tạm tính.
  - **Tài liệu FRD:** Đã viết FRD rất chi tiết cho Giỏ hàng (Tính năng Tick chọn SP, đổi biến thể ngay trong giỏ, thanh Freeship Progress, cảnh báo hết tồn kho).

### ❌ Chưa làm (To-do)
- Chưa viết FRD cho trang Home, Chi tiết sản phẩm, và quan trọng nhất là trang **Thanh toán (Checkout)**.
- Chưa có luồng Đăng nhập / Đăng ký dành cho Khách hàng (User Account).
- Chưa có logic giỏ hàng thật (Lưu LocalStorage cho Guest hoặc gọi API cho User).
- Bộ lọc sản phẩm (Filter/Search) ở trang Khám phá chưa hoạt động.

---

## 4. Tổng kết & Đề xuất bước tiếp theo (Next Steps)

Hiện tại, team đang tập trung làm rất tốt khâu **Phân tích nghiệp vụ (FRD)** và **Thiết kế UI/DB**. 

**Để tiến tới có một sản phẩm chạy được (Playable/MVP), bạn có thể chọn 1 trong 2 hướng:**
1. **Hướng Phân tích (Đi hết FRD rồi code):** Tiếp tục viết nốt FRD cho trang **Thanh toán (Checkout)**, luồng **Quản lý Sản phẩm (Admin)**, luồng **Quản lý Đơn hàng (Admin)**.
2. **Hướng Thực thi (Vào code Backend):** Chuyển sang khởi tạo Backend (NestJS), setup Prisma Client, và viết các API CRUD cơ bản (ví dụ: API Đăng nhập, API Lấy danh sách sản phẩm) để Frontend bắt đầu có dữ liệu thật mà gọi.
