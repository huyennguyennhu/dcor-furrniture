This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Sitemap D'Cor Studio

Dưới đây là sơ đồ cấu trúc trang web (Sitemap) của D'Cor Studio:

```mermaid
mindmap
  root(("D'Cor Studio"))
    main("Trang chính")
      home("/ (Trang chủ)")
      explore("/kham-pha (Khám phá)")
        product("/kham-pha/[id] (Chi tiết SP)")
      design("/thiet-ke (Thiết kế)")
        planner("/thiet-ke/room-planner (Room Planner)")
      community("/community (Cộng đồng)")
        post("/community/[postId] (Bài viết)")
        newPost("/community/new (Đăng bài)")
      blog("/blog (Blog)")
        blogDetail("/blog/[slug] (Chi tiết Blog)")
    
    shopping("Mua sắm & Đơn hàng")
      cart("/cart (Giỏ hàng)")
      checkout("/checkout (Thanh toán)")
      success("/order-success/[orderId] (Đặt hàng thành công)")
      compare("/compare (So sánh)")
      track("/track-order (Theo dõi đơn hàng)")

    account("Tài khoản Khách hàng")
      accOverview("/account (Tổng quan)")
      accProfile("/account/profile (Hồ sơ)")
      accOrders("/account/orders (Đơn hàng)")
        accOrderDetail("/account/orders/[id] (Chi tiết đơn)")
      accAddr("/account/addresses (Sổ địa chỉ)")
      accWish("/account/wishlist (Yêu thích)")
      accReviews("/account/reviews (Đánh giá)")
      accReturn("/account/returns (Đổi trả)")
      accDesign("/account/room-designs (Thiết kế của tôi)")
      accPosts("/account/posts (Bài đăng cộng đồng)")

    auth("Xác thực")
      login("/login (Đăng nhập)")
      register("/register (Đăng ký)")
      forgot("/forgot-password (Quên mật khẩu)")

    admin("Quản trị Admin")
      admDashboard("/admin (Dashboard)")
      admOrders("/admin/orders (Quản lý Đơn hàng)")
      admProducts("/admin/products (Quản lý Sản phẩm)")
      admCustomers("/admin/customers (Quản lý Khách hàng)")
      admCommunity("/admin/community (Duyệt Cộng đồng)")
      admContent("/admin/content (Quản lý Nội dung)")
      admPromo("/admin/promotions (Khuyến mãi)")
      admReport("/admin/reports (Báo cáo doanh thu)")
      admPrice("/admin/price-proposals (Báo giá sỉ)")

    info("Thông tin & Chính sách")
      about("/about (Về chúng tôi)")
      contact("/contact (Liên hệ)")
      business("/business (Dành cho Doanh nghiệp)")
      terms("/terms (Điều khoản dịch vụ)")
      shipping("/shipping-policy (Chính sách giao hàng)")
      returns("/return-policy (Chính sách đổi trả)")
      notfound("/_not-found (Trang 404)")
```
