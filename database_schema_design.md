# Thiết kế CSDL (Prisma Schema) - Bản Production-Ready

Bản cập nhật này tập trung xử lý các rủi ro vận hành trong môi trường thực tế (Production), bao gồm: chống tràn số với `BigInt` cho đơn hàng B2B, ngăn chặn xóa nhầm hóa đơn bằng `Restrict`, bổ sung hệ thống lưu phiên đăng nhập (`Session`/`OTP`), và xử lý trọn vẹn lưu trữ lựa chọn tùy biến của khách hàng (Custom Options).

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================================================
// 1. KHÁCH HÀNG & NHÂN SỰ (Bảo mật, Audit & Auth)
// ============================================================================
enum CustomerType {
  RETAIL
  B2B
}

model Customer {
  id              String       @id @default(uuid())
  type            CustomerType @default(RETAIL)
  phone           String       @unique
  email           String?      @unique
  fullName        String
  avatarUrl       String?
  isPhoneVerified Boolean      @default(false)
  
  companyName     String?
  taxCode         String?

  // Thống kê & Hạng thành viên
  rewardPoints    Int          @default(0) // Điểm tích lũy
  totalSpent      BigInt       @default(0) // Tổng giá trị mua hàng (Dùng BigInt)

  // Tăng cường bảo mật chống Brute-force
  failedLoginCount Int         @default(0)
  lockedUntil      DateTime?

  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt
  deletedAt       DateTime?    

  addresses       Address[]
  orders          Order[]
  cartItems       CartItem[]
  sessions        UserSession[]
  otpCodes        OtpCode[]
}

enum StaffRole {
  OWNER
  ADMIN
  SALES
  WAREHOUSE
  CONTENT
}

enum StaffStatus {
  PENDING_ACTIVATION // Vừa được tạo, chờ click link trong email
  ACTIVE
  INACTIVE
}

model StaffUser {
  id              String     @id @default(uuid())
  email           String     @unique
  phone           String?    @unique // Quản lý nhập SĐT
  passwordHash    String?    // Cho phép Null vì ban đầu chưa set pass
  fullName        String
  role            StaffRole
  status          StaffStatus @default(PENDING_ACTIVATION)
  
  // Link mời (Invite Link)
  invitationToken       String?   @unique
  invitationTokenExpiry DateTime?
  
  // 2FA & Tăng cường Bảo mật
  twoFactorEnabled Boolean   @default(false)
  twoFactorSecret  String?
  failedLoginCount Int       @default(0)
  lockedUntil      DateTime?
  lastLoginAt      DateTime?
  
  createdAt       DateTime   @default(now())
  updatedAt       DateTime   @updatedAt
  deletedAt       DateTime?  // Giữ lịch sử khi nhân viên nghỉ việc

  statusChanges   OrderStatusHistory[]
  sessions        UserSession[]
}

model UserSession {
  id           String    @id @default(uuid())
  refreshToken String    @unique
  expiresAt    DateTime
  
  customerId   String?
  customer     Customer? @relation(fields: [customerId], references: [id], onDelete: Cascade)
  
  staffId      String?
  staff        StaffUser? @relation(fields: [staffId], references: [id], onDelete: Cascade)

  ipAddress    String?
  userAgent    String?
  createdAt    DateTime  @default(now())

  @@index([customerId])
  @@index([staffId])
}

model OtpCode {
  id         String   @id @default(uuid())
  phone      String
  otpHash    String   // Lưu Hash để bảo mật
  attempts   Int      @default(0)
  expiresAt  DateTime
  
  customerId String?
  customer   Customer? @relation(fields: [customerId], references: [id], onDelete: Cascade)

  createdAt  DateTime @default(now())

  @@index([phone])
}

// ============================================================================
// 2. SỔ ĐỊA CHỈ (Chuẩn hóa Địa giới Hành chính mới)
// ============================================================================
model Address {
  id           String   @id @default(uuid())
  customerId   String
  customer     Customer @relation(fields: [customerId], references: [id], onDelete: Cascade)
  
  receiverName String
  phone        String
  
  province     String
  provinceCode String?
  district     String?  // Nullable đón đầu thay đổi sáp nhập quận/huyện
  districtCode String?
  ward         String?
  wardCode     String?
  detail       String
  isDefault    Boolean  @default(false) 

  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@index([customerId])
}

// ============================================================================
// 3. SẢN PHẨM & DANH MỤC (Tối ưu Composite Index)
// ============================================================================
model Category {
  id        String    @id @default(uuid())
  parentId  String?   
  parent    Category? @relation("CategoryHierarchy", fields: [parentId], references: [id])
  children  Category[] @relation("CategoryHierarchy")
  
  name      String
  slug      String    @unique
  sortOrder Int       @default(0)
  isActive  Boolean   @default(true)
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  products  Product[]
}

enum DiscountType {
  PERCENT
  AMOUNT
}

model Product {
  id             String   @id @default(uuid())
  slug           String   @unique
  name           String
  
  categoryId     String
  category       Category @relation(fields: [categoryId], references: [id], onDelete: Restrict)
  
  description    String?  @db.Text
  basePrice      Int      
  
  discountValue  Int?     
  discountType   DiscountType?
  
  images         Json     
  configOptions  Json?    
  
  isBestSeller   Boolean  @default(false)
  isNew          Boolean  @default(false)
  isActive       Boolean  @default(true)
  
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  deletedAt      DateTime? 

  // MỌI SẢN PHẨM PHẢI CÓ ÍT NHẤT 1 VARIANT MẶC ĐỊNH
  variants       ProductVariant[] 

  @@index([categoryId, isActive, deletedAt]) // Tối ưu lấy danh sách SP
  @@index([createdAt]) 
  @@index([isBestSeller])
}

model ProductVariant {
  id            String   @id @default(uuid())
  productId     String
  product       Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  
  sku           String   @unique
  name          String   
  price         Int      
  
  stock         Int      @default(0)
  reservedStock Int      @default(0) 
  
  optionValues  Json?    
  isActive      Boolean  @default(true) // Ẩn thay vì xóa cứng gây lỗi đơn cũ
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  cartItems     CartItem[]
  orderItems    OrderItem[]

  @@index([productId, isActive])
}

// ============================================================================
// 4. GIỎ HÀNG (Sửa lỗi NULL Unique & Lưu Options)
// ============================================================================
model CartItem {
  id             String   @id @default(uuid())
  customerId     String
  customer       Customer @relation(fields: [customerId], references: [id], onDelete: Cascade)
  
  // productId đã bị loại bỏ vì thừa. Mọi SP đều thông qua Variant
  variantId      String
  variant        ProductVariant @relation(fields: [variantId], references: [id], onDelete: Cascade)
  
  quantity       Int
  selectedOptions Json?   // Chứa các custom option (màu chân/bọc) của riêng khách
  
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  @@unique([customerId, variantId]) // Unique đã hoạt động hoàn hảo
  @@index([customerId])
  @@index([variantId])
}

// ============================================================================
// 5. ĐƠN HÀNG (BigInt cho B2B, Audit Mốc Thời Gian & Restrict Delete)
// ============================================================================
enum OrderStatus {
  PENDING
  CONFIRMED
  PROCESSING
  SHIPPED
  DELIVERED
  CANCELLED
  RETURNED
}

enum PaymentStatus {
  UNPAID
  PARTIAL
  PAID
}

enum PaymentMethod {
  COD
  VNPAY
  BANK_TRANSFER
  CREDIT_CARD
}

model Order {
  id               String   @id @default(uuid())
  orderNumber      String   @unique 
  
  customerId       String?  
  customer         Customer? @relation(fields: [customerId], references: [id], onDelete: SetNull)
  
  // SNAPSHOT ĐỊA CHỈ & HÓA ĐƠN B2B
  email            String?
  phone            String
  receiverName     String
  companyName      String?
  taxCode          String?
  province         String
  provinceCode     String?
  district         String?
  districtCode     String?
  ward             String?
  wardCode         String?
  detailAddress    String
  
  isGift           Boolean  @default(false)
  giftMessage      String?
  hideInvoicePrice Boolean  @default(false)
  
  // TÀI CHÍNH: Dùng BigInt chống tràn số (Quá 2.1 tỷ)
  subTotal         BigInt
  shippingFee      BigInt
  discountAmount   BigInt   @default(0)
  totalAmount      BigInt
  promoCode        String?  
  
  status           OrderStatus   @default(PENDING)
  paymentMethod    PaymentMethod 
  paymentStatus    PaymentStatus @default(UNPAID)
  
  notes            String?  @db.Text
  internalNotes    String?  @db.Text
  cancelReason     String?  @db.Text
  
  // Vận chuyển
  shippingProvider String?
  trackingCode     String?
  
  // Dòng đời Đơn hàng & Xử lý Tồn kho
  expiresAt        DateTime? // Hạn nhả tồn kho nếu khách bùng
  paidAt           DateTime?
  shippedAt        DateTime?
  deliveredAt      DateTime?
  cancelledAt      DateTime?
  
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  // RESTRICT: Hệ thống cấm xóa cứng Đơn hàng để bảo vệ dữ liệu tài chính
  items            OrderItem[]
  statusHistory    OrderStatusHistory[]
  payments         PaymentTransaction[]

  @@index([customerId])
  @@index([status, createdAt]) // Index phục vụ Admin query
  @@index([phone])             // Index tra cứu đơn bằng SĐT
}

model OrderItem {
  id                 String  @id @default(uuid())
  orderId            String
  order              Order   @relation(fields: [orderId], references: [id], onDelete: Restrict)
  
  productId          String
  variantId          String?
  variant            ProductVariant? @relation(fields: [variantId], references: [id], onDelete: SetNull)
  
  productName        String
  sku                String?
  imageUrl           String
  
  variantDescription String?
  selectedOptions    Json?   // Snapshot custom attributes
  
  quantity           Int
  price              Int     
  discountAmount     BigInt  @default(0)
  lineTotal          BigInt  
  
  @@index([orderId])
  @@index([productId])
  @@index([variantId])
}

model OrderStatusHistory {
  id         String      @id @default(uuid())
  orderId    String
  order      Order       @relation(fields: [orderId], references: [id], onDelete: Restrict)
  
  status       OrderStatus
  fromStatus   OrderStatus?
  actorType    String      // Phân biệt: 'CUSTOMER' tự hủy, hay 'STAFF' / 'SYSTEM'
  notes        String?     @db.Text
  
  staffId      String?
  staff        StaffUser?  @relation(fields: [staffId], references: [id], onDelete: SetNull)
  
  createdAt  DateTime    @default(now())

  @@index([orderId, createdAt])
  @@index([staffId])
}

// ============================================================================
// 6. GIAO DỊCH THANH TOÁN
// ============================================================================
enum TransactionStatus {
  PENDING
  SUCCESS
  FAILED
}

enum TransactionType {
  PAYMENT
  DEPOSIT
  REFUND
}

model PaymentTransaction {
  id              String   @id @default(uuid())
  orderId         String
  order           Order    @relation(fields: [orderId], references: [id], onDelete: Restrict)
  
  transactionCode String   
  gatewayRef      String?  
  
  amount          BigInt
  paymentMethod   PaymentMethod
  transactionType TransactionType @default(PAYMENT)
  status          TransactionStatus @default(PENDING)
  
  rawResponse     Json?    
  
  createdAt       DateTime @default(now())

  // Tránh đụng độ mã GD giữa các cổng thanh toán (VD: MOMO vs VNPAY)
  @@unique([paymentMethod, transactionCode])
  @@index([orderId])
  @@index([gatewayRef])
  @@index([status, createdAt])
}
```
