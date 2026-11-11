import prisma, { withDbRetry } from './prisma';

/**
 * Khởi tạo cấu trúc bảng và chỉ mục cho hệ thống Blog DCor
 * Sử dụng CREATE TABLE IF NOT EXISTS và CREATE INDEX IF NOT EXISTS qua raw SQL
 * Đảm bảo tương thích hoàn toàn với Prisma Schema và an toàn khi khởi chạy lặp lại
 */
export async function initBlogDatabase(): Promise<void> {
  try {
    await withDbRetry(async () => {
      // 1. Tạo bảng BlogCategory
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "BlogCategory" (
          "id" VARCHAR(64) PRIMARY KEY,
          "name" VARCHAR(255) NOT NULL,
          "slug" VARCHAR(255) NOT NULL,
          "sortOrder" INTEGER NOT NULL DEFAULT 0,
          "isActive" BOOLEAN NOT NULL DEFAULT true,
          "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        )
      `);
      await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "BlogCategory_slug_key" ON "BlogCategory"("slug")`);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "idx_blogcategory_isactive_sortorder" ON "BlogCategory"("isActive", "sortOrder")`);

      // 2. Tạo bảng BlogPost
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "BlogPost" (
          "id" VARCHAR(64) PRIMARY KEY,
          "slug" VARCHAR(255) NOT NULL,
          "title" VARCHAR(500) NOT NULL,
          "excerpt" TEXT NOT NULL,
          "blocks" JSONB NOT NULL DEFAULT '[]'::jsonb,
          "coverImageUrl" TEXT,
          "categoryId" VARCHAR(64) NOT NULL,
          "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
          "seoDescription" TEXT,
          "authorName" VARCHAR(255) NOT NULL,
          "status" VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
          "publishedAt" TIMESTAMP WITH TIME ZONE,
          "productIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
          "likesCount" INTEGER NOT NULL DEFAULT 0,
          "viewsCount" INTEGER NOT NULL DEFAULT 0,
          "createdBy" VARCHAR(255),
          "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        )
      `);
      await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "BlogPost_slug_key" ON "BlogPost"("slug")`);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "BlogPost_status_publishedAt_idx" ON "BlogPost"("status", "publishedAt")`);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "BlogPost_categoryId_idx" ON "BlogPost"("categoryId")`);

      // 3. Tạo bảng BlogComment
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "BlogComment" (
          "id" VARCHAR(64) PRIMARY KEY,
          "postId" VARCHAR(64) NOT NULL,
          "customerId" VARCHAR(64) NOT NULL,
          "authorName" VARCHAR(255) NOT NULL,
          "content" TEXT NOT NULL,
          "status" VARCHAR(20) NOT NULL DEFAULT 'VISIBLE',
          "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        )
      `);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "BlogComment_postId_createdAt_idx" ON "BlogComment"("postId", "createdAt")`);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "idx_blogcomment_status" ON "BlogComment"("status")`);

      // 4. Tạo bảng BlogLike
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "BlogLike" (
          "id" VARCHAR(64) PRIMARY KEY,
          "postId" VARCHAR(64) NOT NULL,
          "customerId" VARCHAR(64) NOT NULL,
          "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        )
      `);
      await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "BlogLike_postId_customerId_key" ON "BlogLike"("postId", "customerId")`);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "idx_bloglike_customerid" ON "BlogLike"("customerId")`);

      // 5. Cập nhật đường dẫn ảnh bìa các bài viết mẫu từ .png sang .jpg nếu còn tồn tại
      await prisma.$executeRawUnsafe(`
        UPDATE "BlogPost" 
        SET "coverImageUrl" = '/assets/room_img/phong_khach.jpg' 
        WHERE "coverImageUrl" LIKE '%phong_khach.png'
      `);
      await prisma.$executeRawUnsafe(`
        UPDATE "BlogPost" 
        SET "coverImageUrl" = '/assets/room_img/phong_ngu.jpg' 
        WHERE "coverImageUrl" LIKE '%phong_ngu.png'
      `);
      await prisma.$executeRawUnsafe(`
        UPDATE "BlogPost" 
        SET "coverImageUrl" = '/assets/room_img/phong_lam_viec.jpg' 
        WHERE "coverImageUrl" LIKE '%phong_an.png'
      `);
    });
    console.log('[INFO] Blog database tables and image paths initialized successfully.');
  } catch (error) {
    console.error('[ERROR] Failed to initialize Blog database:', error);
  }
}

