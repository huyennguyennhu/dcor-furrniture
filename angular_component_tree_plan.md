# Kế Hoạch Tổ Chức Component Bằng Angular

Dựa trên cấu trúc thư mục hiện tại của dự án `dcor-studio` (chia thành hai mảng rõ rệt là Public Storefront và Admin Dashboard), khi chuyển sang Angular, chúng ta sẽ áp dụng mô hình kiến trúc tiêu chuẩn (Standard Architecture) của Angular: **Core, Shared, và Features**.

Với quy mô này, chúng ta nên sử dụng cơ chế **Lazy Loading** (tải module khi cần) để tối ưu hóa tốc độ tải trang ban đầu. Cấu trúc cây thư mục (Directory Tree) đề xuất cho thư mục `src/app/` như sau:

```text
src/
└── app/
    ├── core/                      # (1) CORE MODULE: Chỉ nạp 1 lần ở App. Chứa logic hệ thống
    │   ├── interceptors/          # Xử lý gắn token vào API, báo lỗi 401...
    │   │   └── auth.interceptor.ts
    │   ├── guards/                # Bảo vệ route (ví dụ: cấm vào /admin nếu không có quyền)
    │   │   └── admin.guard.ts
    │   └── services/              # Các Service gọi API backend
    │       ├── auth.service.ts    # Tương đương NextAuth logic
    │       ├── product.service.ts # Tương đương React Query fetch functions
    │       └── cart.service.ts
    │
    ├── shared/                    # (2) SHARED MODULE: Chứa các UI Component dùng chung (Dumb Components)
    │   ├── components/            # Các component tái sử dụng (lấy từ components/admin và components/ui)
    │   │   ├── data-table/        # Kế thừa từ DataTable.tsx
    │   │   ├── custom-select/     # Kế thừa từ CustomSelect.tsx
    │   │   ├── modal/             # Kế thừa từ Modal.tsx
    │   │   ├── stat-card/         # Kế thừa từ StatCard.tsx
    │   │   └── catalog-section/   # Kế thừa từ CatalogSection.tsx
    │   ├── pipes/                 # Hàm định dạng dữ liệu (ví dụ format tiền VNĐ)
    │   └── models/                # File định nghĩa Interface (Tái sử dụng 100% từ Prisma schema)
    │
    ├── features/                  # (3) FEATURE MODULES: Tách biệt các khu vực nghiệp vụ (Lazy Loaded)
    │   │
    │   ├── admin/                 # === PHẦN ADMIN DASHBOARD (Lấy từ app/admin) ===
    │   │   ├── components/        # Các UI nội bộ của Admin
    │   │   │   ├── admin-layout/  
    │   │   │   ├── admin-sidebar/ # Từ AdminSidebar.tsx
    │   │   │   └── admin-header/  # Từ AdminHeader.tsx
    │   │   ├── pages/             # Các trang con (Routes)
    │   │   │   ├── dashboard/     # Trang tổng quan
    │   │   │   ├── products/      # (Lấy từ app/admin/products)
    │   │   │   ├── orders/        # (Lấy từ app/admin/orders)
    │   │   │   ├── inventory/     # (Lấy từ app/admin/inventory)
    │   │   │   ├── promotions/    # (Lấy từ app/admin/promotions)
    │   │   │   └── reports/       # (Lấy từ app/admin/reports)
    │   │   ├── admin.module.ts
    │   │   └── admin-routing.module.ts
    │   │
    │   ├── store/                 # === PHẦN KHÁCH HÀNG / TRANG CHỦ ===
    │   │   ├── components/
    │   │   │   ├── store-layout/  
    │   │   │   ├── header/        # Lấy từ components/layout/Header.tsx
    │   │   │   └── footer/        # Lấy từ components/layout/Footer.tsx
    │   │   ├── pages/
    │   │   │   ├── home/          # Trang chủ (/)
    │   │   │   ├── kham-pha/      # (app/kham-pha)
    │   │   │   ├── product-detail/# Trang chi tiết sản phẩm
    │   │   │   ├── cart/          # (app/cart)
    │   │   │   ├── checkout/      # (app/checkout)
    │   │   │   ├── blog/          # (app/blog)
    │   │   │   └── thiet-ke/      # (app/thiet-ke)
    │   │   ├── store.module.ts
    │   │   └── store-routing.module.ts
    │   │
    │   └── account/               # === PHẦN TÀI KHOẢN NGƯỜI DÙNG ===
    │       ├── pages/
    │       │   ├── profile/       # (app/account/profile)
    │       │   ├── my-orders/     # (app/account/orders)
    │       │   └── wishlist/      # (app/account/wishlist)
    │       ├── account.module.ts
    │       └── account-routing.module.ts
    │
    ├── app.component.html         # Gốc (Root Outlet)
    ├── app.component.ts
    └── app-routing.module.ts      # Khai báo Lazy Load 3 Module: Admin, Store, Account
```

---

## 4 Lợi Ích Của Cấu Trúc Này

1. **Hiệu năng tải trang cực nhanh (Lazy Loading):** Khi người dùng vào trang chủ mua hàng (Module `store`), trình duyệt sẽ **không** tải một đoạn code nào của phần quản trị (Module `admin`). Điều này trái ngược hoàn toàn với các app SPA cơ bản nơi tất cả bị nhồi vào một cục.
2. **Quản lý UI dùng chung dễ dàng:** Toàn bộ `DataTable`, `CustomSelect`, `Modal` bạn đã cất công thiết kế ở React sẽ được gom hết vào thư mục `shared/components`. Mọi Module khác khi cần chỉ việc gọi `<app-data-table>` thay vì phải import nhiều lần.
3. **An ninh chặt chẽ:** Việc gắn thẻ `admin.guard.ts` (Bảo vệ đường dẫn) ở ngay cổng vào thư mục `features/admin/` đảm bảo hacker không thể tải được cả mã nguồn HTML của phần quản trị nếu chưa đăng nhập và được cấp quyền.
4. **Clean Code API:** Logic fetch API không còn nằm la liệt ở các Component như React. Tất cả sẽ được gọi tập trung qua thư mục `core/services/` thông qua HttpClient, giúp dễ dàng bảo trì và đổi đường dẫn Backend khi cần.
