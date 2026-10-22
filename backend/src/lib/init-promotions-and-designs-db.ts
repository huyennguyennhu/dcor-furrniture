import prisma, { withDbRetry } from './prisma';

export async function initPromotionsAndDesignsDatabase() {
  try {
    await withDbRetry(async () => {
      // 1. Tạo bảng Voucher
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "Voucher" (
          "id" VARCHAR(64) PRIMARY KEY,
          "code" VARCHAR(50) UNIQUE NOT NULL,
          "discountType" VARCHAR(20) NOT NULL,
          "discountValue" INTEGER NOT NULL,
          "maxDiscountCap" INTEGER,
          "minOrderValue" INTEGER NOT NULL DEFAULT 0,
          "startDate" TIMESTAMP WITH TIME ZONE NOT NULL,
          "endDate" TIMESTAMP WITH TIME ZONE NOT NULL,
          "usageLimit" INTEGER NOT NULL DEFAULT 100,
          "usedCount" INTEGER NOT NULL DEFAULT 0,
          "perCustomerLimit" INTEGER NOT NULL DEFAULT 1,
          "isStackableWithFlashSale" BOOLEAN NOT NULL DEFAULT false,
          "isActive" BOOLEAN NOT NULL DEFAULT true,
          "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "idx_voucher_code" ON "Voucher"("code")`);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "idx_voucher_isactive" ON "Voucher"("isActive")`);

      // 2. Tạo bảng RoomTemplate
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "RoomTemplate" (
          "id" VARCHAR(64) PRIMARY KEY,
          "name" VARCHAR(255) NOT NULL,
          "roomType" VARCHAR(50) NOT NULL,
          "description" TEXT,
          "imageUrl" TEXT NOT NULL,
          "length" DOUBLE PRECISION NOT NULL,
          "width" DOUBLE PRECISION NOT NULL,
          "height" DOUBLE PRECISION NOT NULL DEFAULT 2.8,
          "suggestedProducts" JSONB,
          "isActive" BOOLEAN NOT NULL DEFAULT true,
          "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "idx_roomtemplate_roomtype" ON "RoomTemplate"("roomType")`);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "idx_roomtemplate_isactive" ON "RoomTemplate"("isActive")`);

      // 3. Tạo bảng DesignPost
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "DesignPost" (
          "id" VARCHAR(64) PRIMARY KEY,
          "title" VARCHAR(255) NOT NULL,
          "authorName" VARCHAR(255) NOT NULL,
          "authorEmail" VARCHAR(255),
          "description" TEXT,
          "imageUrl" TEXT NOT NULL,
          "taggedProducts" JSONB,
          "likesCount" INTEGER NOT NULL DEFAULT 0,
          "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
          "rejectionReason" TEXT,
          "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "idx_designpost_status" ON "DesignPost"("status")`);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "idx_designpost_createdat" ON "DesignPost"("createdAt" DESC)`);

      // 4. Tạo bảng DesignComment
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "DesignComment" (
          "id" VARCHAR(64) PRIMARY KEY,
          "postId" VARCHAR(64) NOT NULL,
          "authorName" VARCHAR(255) NOT NULL,
          "content" TEXT NOT NULL,
          "status" VARCHAR(20) NOT NULL DEFAULT 'VISIBLE',
          "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "idx_designcomment_postid" ON "DesignComment"("postId")`);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "idx_designcomment_status" ON "DesignComment"("status")`);

      // 5. Seed dữ liệu mẫu cho Voucher nếu rỗng
      const voucherCountRes: any = await prisma.$queryRawUnsafe(`SELECT COUNT(*)::int as count FROM "Voucher"`);
      if ((voucherCountRes?.[0]?.count || 0) === 0) {
        console.log('[INFO] Seeding initial Voucher data into PostgreSQL...');
        const vouchers = [
          {
            id: 'VOUCHER-001',
            code: 'WELCOME10',
            discountType: 'PERCENT',
            discountValue: 10,
            maxDiscountCap: 1500000,
            minOrderValue: 2000000,
            startDate: new Date('2026-01-01'),
            endDate: new Date('2026-12-31'),
            usageLimit: 500,
            usedCount: 38,
            perCustomerLimit: 1,
            isStackableWithFlashSale: false,
            isActive: true
          },
          {
            id: 'VOUCHER-002',
            code: 'DCOR_VIP2026',
            discountType: 'PERCENT',
            discountValue: 15,
            maxDiscountCap: 3000000,
            minOrderValue: 15000000,
            startDate: new Date('2026-02-01'),
            endDate: new Date('2026-12-31'),
            usageLimit: 150,
            usedCount: 24,
            perCustomerLimit: 1,
            isStackableWithFlashSale: true,
            isActive: true
          },
          {
            id: 'VOUCHER-003',
            code: 'DCOR500K',
            discountType: 'FIXED_AMOUNT',
            discountValue: 500000,
            maxDiscountCap: null,
            minOrderValue: 8000000,
            startDate: new Date('2026-03-01'),
            endDate: new Date('2026-11-30'),
            usageLimit: 200,
            usedCount: 65,
            perCustomerLimit: 1,
            isStackableWithFlashSale: true,
            isActive: true
          },
          {
            id: 'VOUCHER-004',
            code: 'DCOR1TRIEU',
            discountType: 'FIXED_AMOUNT',
            discountValue: 1000000,
            maxDiscountCap: null,
            minOrderValue: 20000000,
            startDate: new Date('2026-01-01'),
            endDate: new Date('2026-12-31'),
            usageLimit: 100,
            usedCount: 12,
            perCustomerLimit: 1,
            isStackableWithFlashSale: false,
            isActive: true
          }
        ];

        for (const v of vouchers) {
          await (prisma as any).voucher.create({ data: v }).catch((err: any) => console.warn('Seed voucher error:', err.message));
        }
      }

      // 6. Seed dữ liệu mẫu cho RoomTemplate
      const templates = [
        {
          id: 'TMPL-LIVING-01',
          name: 'Phòng khách Bắc Âu Hiện đại',
          roomType: 'Phòng khách',
          description: 'Không gian mở ngập tràn ánh sáng với sàn gỗ ấm áp, lý tưởng để bài trí sofa góc, bàn trà và kệ tivi.',
          imageUrl: '/assets/room_img/phong_khach.png',
          length: 5.5,
          width: 4.2,
          height: 2.8,
          suggestedProducts: ['Sofa Góc Chữ L DCor Nordic', 'Bàn Trà Mặt Đá Ceramic DCor Elegance'],
          isActive: true
        },
        {
          id: 'TMPL-BEDROOM-02',
          name: 'Phòng ngủ Master Thư giãn',
          roomType: 'Phòng ngủ',
          description: 'Tone màu trung tính nhã nhặn mang lại cảm giác bình yên, phù hợp bố trí giường đôi, tủ đầu giường và tủ quần áo.',
          imageUrl: '/assets/room_img/phong_ngu.png',
          length: 4.5,
          width: 3.8,
          height: 2.7,
          suggestedProducts: ['Giường Ngủ Bọc Nệm DCor King Bed', 'Đèn Ngủ Glow Brass'],
          isActive: true
        },
        {
          id: 'TMPL-DINING-03',
          name: 'Phòng ăn & Bếp Gia đình',
          roomType: 'Phòng ăn',
          description: 'Mặt bằng vuông vắn ấm cúng, tối ưu cho bộ bàn ghế ăn 6-8 người cùng tủ đồ hoặc đảo bếp phong cách Nordic.',
          imageUrl: '/assets/room_img/phong_an.png',
          length: 4.2,
          width: 3.6,
          height: 2.8,
          suggestedProducts: ['Bộ Bàn Ghế Ăn DCor Walnut 6 Ghế', 'Tủ Bếp DCor Nordic'],
          isActive: true
        }
      ];

      const templateCountRes: any = await prisma.$queryRawUnsafe(`SELECT COUNT(*)::int as count FROM "RoomTemplate"`);
      if ((templateCountRes?.[0]?.count || 0) === 0) {
        console.log('[INFO] Seeding initial RoomTemplate data into PostgreSQL...');
        for (const t of templates) {
          await (prisma as any).roomTemplate.create({ data: t }).catch((err: any) => console.warn('Seed template error:', err.message));
        }
      } else {
        // Đồng bộ cập nhật thông tin chuẩn hình ảnh mặt bằng thực tế
        for (const t of templates) {
          await prisma.$executeRawUnsafe(`
            UPDATE "RoomTemplate"
            SET "name" = $1, "roomType" = $2, "description" = $3, "imageUrl" = $4,
                "length" = $5, "width" = $6, "height" = $7, "suggestedProducts" = $8::jsonb, "isActive" = true
            WHERE "id" = $9
          `, t.name, t.roomType, t.description, t.imageUrl, t.length, t.width, t.height, JSON.stringify(t.suggestedProducts), t.id).catch(() => null);
        }
      }

      // 7. Seed dữ liệu mẫu cho DesignPost & Comment nếu rỗng
      const postCountRes: any = await prisma.$queryRawUnsafe(`SELECT COUNT(*)::int as count FROM "DesignPost"`);
      if ((postCountRes?.[0]?.count || 0) === 0) {
        console.log('[INFO] Seeding initial DesignPost data into PostgreSQL...');
        const posts = [
          {
            id: 'POST-001',
            title: 'Cải tạo phòng khách căn hộ 70m2 Vinhomes Grand Park',
            authorName: 'Hoàng Minh Khôi',
            authorEmail: 'khoi.hm@gmail.com',
            description: 'Phối cảnh phòng khách tone màu be ấm áp kết hợp bộ sofa góc DCor Nordic và bàn trà đá ceramic. Rất ưng ý với chất lượng hoàn thiện của DCor!',
            imageUrl: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800&auto=format&fit=crop&q=80',
            taggedProducts: [
              { x: 42, y: 58, name: 'Sofa Góc Chữ L DCor Nordic', price: 18500000 },
              { x: 55, y: 72, name: 'Bàn Trà Mặt Đá Ceramic DCor Elegance', price: 6200000 }
            ],
            likesCount: 42,
            status: 'PUBLISHED',
            rejectionReason: null
          },
          {
            id: 'POST-002',
            title: 'Phòng ngủ tối giản phong cách Wabi-Sabi mộc mạc',
            authorName: 'Trần Phương Thảo',
            authorEmail: 'thao.tp@gmail.com',
            description: 'Góc nghỉ ngơi thư thái sau ngày làm việc mệt mỏi. Giường bọc nệm êm ái cùng hệ ánh sáng vàng ấm 3000K.',
            imageUrl: 'https://images.unsplash.com/photo-1540518614846-7ede433c4550?w=800&auto=format&fit=crop&q=80',
            taggedProducts: [
              { x: 50, y: 65, name: 'Giường Ngủ Bọc Nệm DCor King Bed', price: 21000000 }
            ],
            likesCount: 18,
            status: 'PENDING',
            rejectionReason: null
          },
          {
            id: 'POST-003',
            title: 'Không gian bàn ăn gỗ óc chó 6 ghế ấm cúng',
            authorName: 'Lê Văn Nam',
            authorEmail: 'nam.le@yahoo.com',
            description: 'Bài viết chia sẻ thiết kế phòng ăn kết hợp quầy bar nhỏ.',
            imageUrl: 'https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?w=800&auto=format&fit=crop&q=80',
            taggedProducts: [
              { x: 48, y: 60, name: 'Bộ Bàn Ghế Ăn DCor Walnut 6 Ghế', price: 28000000 }
            ],
            likesCount: 9,
            status: 'PENDING',
            rejectionReason: null
          }
        ];

        for (const p of posts) {
          const created = await (prisma as any).designPost.create({ data: p }).catch((err: any) => console.warn('Seed post error:', err.message));
          if (created && created.id === 'POST-001') {
            await (prisma as any).designComment.create({
              data: {
                id: 'CMT-001',
                postId: created.id,
                authorName: 'Vũ Đức Thịnh',
                content: 'Tone màu đẹp quá anh ơi, bộ sofa nỉ màu be này ngồi êm và dễ vệ sinh không ạ?',
                status: 'VISIBLE'
              }
            }).catch(() => null);
            await (prisma as any).designComment.create({
              data: {
                id: 'CMT-002',
                postId: created.id,
                authorName: 'DCor Consultant',
                content: 'Cảm ơn anh Khôi đã tin tưởng nội thất DCor. Chúc anh và gia đình có nhiều khoảnh khắc tuyệt vời trong không gian mới!',
                status: 'VISIBLE'
              }
            }).catch(() => null);
          }
        }
      }
    });
    console.log('[INFO] Promotions and Designs database tables initialized successfully.');
  } catch (error) {
    console.error('[ERROR] Failed to initialize Promotions and Designs database:', error);
  }
}
