import prisma, { withDbRetry } from './prisma';

export async function initMyDesignsDatabase(): Promise<void> {
  try {
    await withDbRetry(async () => {
      // 1. Tạo bảng UserDesign
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "UserDesign" (
          "id" VARCHAR(64) PRIMARY KEY,
          "customerId" VARCHAR(64) NOT NULL,
          "title" VARCHAR(255) NOT NULL,
          "status" VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
          "backgroundType" VARCHAR(20) NOT NULL,
          "backgroundUrl" TEXT NOT NULL,
          "templateId" VARCHAR(64),
          "roomLength" DOUBLE PRECISION NOT NULL,
          "roomWidth" DOUBLE PRECISION NOT NULL,
          "roomHeight" DOUBLE PRECISION,
          "layout" JSONB NOT NULL DEFAULT '[]'::jsonb,
          "coverImageUrl" TEXT,
          "postId" VARCHAR(64),
          "lastEditedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "idx_userdesign_customer_status" ON "UserDesign"("customerId", "status")`);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "UserDesign_customerId_status_idx" ON "UserDesign"("customerId", "status")`);

      // 2. Tạo bảng DesignPostLike
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "DesignPostLike" (
          "id" VARCHAR(64) PRIMARY KEY,
          "postId" VARCHAR(64) NOT NULL,
          "customerId" VARCHAR(64) NOT NULL,
          "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `);
      await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "DesignPostLike_postId_customerId_key" ON "DesignPostLike"("postId", "customerId")`);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "idx_designpostlike_customerid" ON "DesignPostLike"("customerId")`);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "DesignPostLike_customerId_idx" ON "DesignPostLike"("customerId")`);
    });
    console.log('[INFO] My Designs & Community Likes database tables initialized successfully.');
  } catch (error) {
    console.error('[ERROR] Failed to initialize My Designs database:', error);
  }
}

