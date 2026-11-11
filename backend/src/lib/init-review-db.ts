import prisma, { withDbRetry } from './prisma';

/**
 * Khởi tạo cấu trúc bảng và chỉ mục cho hệ thống Đánh giá sản phẩm DCor Furniture
 * Đảm bảo tương thích hoàn toàn với Prisma Schema và an toàn khi khởi chạy lặp lại
 */
export async function initReviewDatabase(): Promise<void> {
  try {
    await withDbRetry(async () => {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "Review" (
          "id" VARCHAR(64) PRIMARY KEY,
          "orderId" VARCHAR(64) NOT NULL,
          "orderItemId" VARCHAR(64),
          "productId" VARCHAR(64) NOT NULL,
          "productName" VARCHAR(500),
          "productImage" TEXT,
          "variantDescription" VARCHAR(500),
          "customerId" VARCHAR(64),
          "customerName" VARCHAR(255) NOT NULL,
          "customerPhone" VARCHAR(50),
          "rating" INTEGER NOT NULL DEFAULT 5,
          "comment" TEXT NOT NULL,
          "images" JSONB NOT NULL DEFAULT '[]'::jsonb,
          "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
          "reply" TEXT,
          "replyAt" TIMESTAMP WITH TIME ZONE,
          "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        )
      `);

      // Các chỉ mục tăng tốc truy vấn
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Review_orderId_idx" ON "Review"("orderId")`);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Review_orderItemId_idx" ON "Review"("orderItemId")`);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Review_productId_idx" ON "Review"("productId")`);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Review_customerId_idx" ON "Review"("customerId")`);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Review_customerPhone_idx" ON "Review"("customerPhone")`);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Review_createdAt_idx" ON "Review"("createdAt")`);
    });
    console.log('[DB] Khởi tạo bảng Review và chỉ mục thành công.');
  } catch (error) {
    console.warn('[DB] Lưu ý khi tạo bảng Review (bỏ qua nếu đã tồn tại):', error);
  }
}

