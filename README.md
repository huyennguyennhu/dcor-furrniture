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


## Dưới đây là sơ đồ cấu trúc trang web (Sitemap) của DCor Studio:
```mermaid
%%{init: {"layout": "elk"}}%%
flowchart TD
  classDef section stroke:#818cf8,fill:#eef2ff
  classDef page stroke:#38bdf8,fill:#f0f9ff

  root["DCor Studio"]:::section

  root --> main["Trang chính"]:::section
  main --> home["/ (Trang chủ)"]:::page
  main --> explore["/kham-pha (Khám phá)"]:::page
  explore --> product["/kham-pha/[id] (Chi tiết SP)"]:::page
  main --> design["/thiet-ke (Thiết kế)"]:::page
  design --> planner["/thiet-ke/room-planner (Room Planner)"]:::page
  main --> community["/community (Cộng đồng)"]:::page
  community --> post["/community/[postId] (Bài viết)"]:::page
  community --> newPost["/community/new (Đăng bài)"]:::page
  main --> blog["/blog (Blog)"]:::page
  blog --> blogDetail["/blog/[slug] (Chi tiết Blog)"]:::page

  root --> shop["Mua sắm & Đơn hàng"]:::section
  shop --> cart["/cart (Giỏ hàng)"]:::page
  shop --> checkout["/checkout (Thanh toán)"]:::page
  shop --> success["/order-success/[orderId] (Đặt hàng thành công)"]:::page
  shop --> compare["/compare (So sánh)"]:::page
  shop --> track["/track-order (Theo dõi đơn hàng)"]:::page

  root --> account["Tài khoản Khách hàng"]:::section
  account --> accOverview["/account (Tổng quan)"]:::page
  account --> accProfile["/account/profile (Hồ sơ)"]:::page
  account --> accOrders["/account/orders (Đơn hàng)"]:::page
  accOrders --> accOrderDetail["/account/orders/[id] (Chi tiết đơn)"]:::page
  account --> accAddr["/account/addresses (Sổ địa chỉ)"]:::page
  account --> accWish["/account/wishlist (Yêu thích)"]:::page
  account --> accReviews["/account/reviews (Đánh giá)"]:::page
  account --> accReturn["/account/returns (Đổi trả)"]:::page
  account --> accDesign["/account/room-designs (Thiết kế của tôi)"]:::page
  account --> accPosts["/account/posts (Bài đăng cộng đồng)"]:::page

  root --> auth["Xác thực"]:::section
  auth --> login["/login (Đăng nhập)"]:::page
  auth --> register["/register (Đăng ký)"]:::page
  auth --> forgot["/forgot-password (Quên mật khẩu)"]:::page

  root --> admin["Quản trị Admin"]:::section
  admin --> admDashboard["/admin (Dashboard)"]:::page
  admin --> admOrders["/admin/orders (QL Đơn hàng)"]:::page
  admin --> admProducts["/admin/products (QL Sản phẩm)"]:::page
  admin --> admCustomers["/admin/customers (QL Khách hàng)"]:::page
  admin --> admCommunity["/admin/community (Duyệt Cộng đồng)"]:::page
  admin --> admContent["/admin/content (QL Nội dung)"]:::page
  admin --> admPromo["/admin/promotions (Khuyến mãi)"]:::page
  admin --> admReport["/admin/reports (Báo cáo doanh thu)"]:::page
  admin --> admPrice["/admin/price-proposals (Báo giá sỉ)"]:::page

  root --> info["Thông tin & Chính sách"]:::section
  info --> about["/about (Về chúng tôi)"]:::page
  info --> contact["/contact (Liên hệ)"]:::page
  info --> business["/business (Dành cho Doanh nghiệp)"]:::page
  info --> terms["/terms (Điều khoản dịch vụ)"]:::page
  info --> shipping["/shipping-policy (Chính sách giao hàng)"]:::page
  info --> returns["/return-policy (Chính sách đổi trả)"]:::page
  info --> notfound["/_not-found (Trang 404)"]:::page
  ```