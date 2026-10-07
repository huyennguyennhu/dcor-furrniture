# 📚 TỔNG QUAN DANH MỤC FRD (FUNCTIONAL REQUIREMENTS DOCUMENT) - DCOR STUDIO

Tài liệu này tổng hợp toàn bộ danh mục **Tài liệu Yêu cầu Chức năng (FRD)** cho Hệ thống Thương mại Điện tử Nội thất & Tùy biến Sản phẩm Custom **DCOR Studio** (Angular 17+ Standalone & Node.js/PostgreSQL).

---

## 📌 BẢNG TỔNG HỢP 14 MODULE FRD CHUẨN HÓA

| STT | Mã Module | Tên Module FRD | Phân Nhóm | Đường Dẫn File Chuẩn | Trạng Thái | Phase Triển Khai |
| :---: | :--- | :--- | :--- | :--- | :---: | :---: |
| **01** | `FRD-USR-01` | Phân hệ Xác thực & Quản lý Hồ sơ Khách hàng | Khách hàng (User) | `FRD-user/FRD - [USR-01] User Authentication & Profile.md` | **Đã hoàn thành (v3.0)** | **Phase 1 (MVP)** |
| **02** | `FRD-USR-02` | Phân hệ Catalog & Tìm kiếm / Lọc Sản phẩm | Khách hàng (User) | `FRD-user/FRD - [USR-02] Product Catalog & Filter.md` | *Đang chuẩn bị* | **Phase 1 (MVP)** |
| **03A**| `FRD-USR-03A`| Phân hệ Quản lý Giỏ hàng | Khách hàng (User) | `FRD-user/FRD - [USR-03A] Customer Cart Management.md` | **Đã hoàn thành (v4.0)** | **Phase 1 (MVP)** |
| **03B**| `FRD-USR-03B`| Phân hệ Đặt hàng & Thanh toán Đơn tiêu chuẩn | Khách hàng (User) | `FRD-user/FRD - [USR-03B] Standard Checkout & Payment.md` | **Đã hoàn thành (v6.0)** | **Phase 1 (MVP)** |
| **04** | `FRD-USR-04` | Phân hệ Tùy biến Sản phẩm & Ký Hợp đồng OTP | Khách hàng (User) | `FRD-user/FRD - [USR-04] Custom Order & OTP Contract.md` | **Đã hoàn thành (v1.0)** | **Phase 2 (Core Custom)** |
| **05** | `FRD-USR-05` | Phân hệ Theo dõi Đơn hàng & Tiến độ Xưởng | Khách hàng (User) | `FRD-user/FRD - [USR-05] Customer Order Tracking.md` | *Chờ viết* | **Phase 2 (Core Custom)** |
| **06** | `FRD-ADM-06` | Phân hệ Quản lý & Báo giá Yêu cầu Custom | Quản trị (Admin) | `FRD-admin/FRD - [ADM-06] Custom Order Request Management.md` | **Đã hoàn thành (v1.0)** | **Phase 2 (Core Custom)** |
| **07** | `FRD-ADM-07` | Phân hệ Quản lý Danh mục & Ma trận Biến thể | Quản trị (Admin) | `FRD-admin/FRD - [ADM-07] Product & Customizer Management.md` | *Chờ viết* | **Phase 1 (MVP)** |
| **08** | `FRD-ADM-08` | Phân hệ Lệnh Sản xuất & Kiểm định Chất lượng QC | Quản trị (Admin) | `FRD-admin/FRD - [ADM-08] Factory Production & Quality Control.md` | **Đã hoàn thành (v1.0)** | **Phase 2 (Core Custom)** |
| **09** | `FRD-ADM-09` | Phân hệ Quản lý Kho & Tồn kho Vật tư Custom | Quản trị (Admin) | `FRD-admin/FRD - [ADM-09] Inventory & Materials Management.md` | *Chờ viết* | **Phase 3 (Enterprise)** |
| **10** | `FRD-ADM-10` | Phân hệ Khuyến mãi & Chăm sóc Khách hàng (CRM) | Quản trị (Admin) | `FRD-admin/FRD - [ADM-10] Promotions & Customer Management.md` | *Chờ viết* | **Phase 3 (Enterprise)** |
| **11** | `FRD-ADM-11` | Phân hệ Báo cáo Thống kê & Dashboards | Quản trị (Admin) | `FRD-admin/FRD - [ADM-11] Admin Reports Overview.md` | *Chờ viết* | **Phase 1 (MVP)** |
| **12** | `FRD-ADM-12` | Phân hệ Phân quyền RBAC & Quản trị Hệ thống | Quản trị (Admin) | `FRD-admin/FRD - [ADM-12] Admin Login & RBAC.md` | *Chờ viết* | **Phase 1 (MVP)** |
| **13** | `FRD-INT-13` | Phân hệ Tích hợp Cổng Thanh toán & OTP SMS/ZNS | Tích hợp (Service) | `FRD-reference/FRD - Payment & OTP Integration.md` | *Tham chiếu* | **Phase 1 (MVP)** |
| **14** | `FRD-INT-14` | Phân hệ Vận chuyển Logistics & Nghiệm thu Tận nơi | Tích hợp (Service) | `FRD-reference/FRD - Delivery & On-site Acceptance.md` | *Tham chiếu* | **Phase 2 (Core Custom)** |

---

## 🏗️ CẤU TRÚC PHÂN THƯ MỤC CHUẨN DỰ ÁN

```text
dcor_Angular/
└── FRD/
    ├── README.md                                                   # [FILE NÀY] Chỉ mục Master FRD
    ├── FRD-user/                                                   # Tài liệu FRD Phân hệ Khách hàng (Storefront)
    │   ├── FRD - [USR-01] User Authentication & Profile.md         # Xác thực & Profile Khách hàng
    │   ├── FRD - [USR-03A] Customer Cart Management.md             # Quản lý Giỏ hàng
    │   ├── FRD - [USR-03B] Standard Checkout & Payment.md          # Đặt hàng & Thanh toán Checkout
    │   └── FRD - [USR-04] Custom Order & OTP Contract.md           # PDP Custom & Ký Hợp đồng OTP 3 bước
    ├── FRD-admin/                                                  # Tài liệu FRD Phân hệ Quản trị Nội bộ (Admin Portal)
    │   ├── FRD - [ADM-06] Custom Order Request Management.md       # Admin phân công KTS 3D & Sales Báo giá
    │   └── FRD - [ADM-08] Factory Production & Quality Control.md  # Lệnh sản xuất & Kiểm định QC
    └── FRD-reference/                                              # Tài liệu Tham chiếu & Quy chuẩn Tích hợp
```
