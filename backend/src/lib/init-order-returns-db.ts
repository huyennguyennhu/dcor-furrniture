import prisma, { withDbRetry } from './prisma';

/**
 * Khởi tạo cấu trúc bảng và chỉ mục cho phân hệ Đổi trả hàng (Order Returns)
 * Tương thích PostgreSQL Supabase, an toàn khi khởi chạy lặp lại và tự động nạp dữ liệu mẫu ban đầu nếu bảng trống.
 */
export async function initOrderReturnDatabase(): Promise<void> {
  try {
    await withDbRetry(async () => {
      // 1. Tạo bảng OrderReturn
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "OrderReturn" (
          "id" VARCHAR(64) PRIMARY KEY,
          "returnCode" VARCHAR(64) UNIQUE NOT NULL,
          "orderId" VARCHAR(64) NOT NULL,
          "orderNumber" VARCHAR(100) NOT NULL,
          "customerId" VARCHAR(64),
          "customerName" VARCHAR(255) NOT NULL,
          "customerPhone" VARCHAR(50) NOT NULL,
          "customerEmail" VARCHAR(255),
          "customerAddress" TEXT,

          "returnType" VARCHAR(50) NOT NULL DEFAULT 'EXCHANGE',
          "status" VARCHAR(50) NOT NULL DEFAULT 'PENDING',
          "reason" VARCHAR(500) NOT NULL,
          "detailedReason" TEXT,
          "proofImages" JSONB NOT NULL DEFAULT '[]'::jsonb,

          -- Thông tin thu hồi hàng (Logistics)
          "shippingProvider" VARCHAR(255),
          "trackingNumber" VARCHAR(100),
          "driverName" VARCHAR(255),
          "driverPhone" VARCHAR(50),
          "pickupDate" TIMESTAMP WITH TIME ZONE,
          "pickupAddress" TEXT,

          -- Nghiệm thu QC (Kho)
          "qcPassed" BOOLEAN,
          "qcGrade" VARCHAR(20),
          "qcChecklist" JSONB DEFAULT '{}'::jsonb,
          "qcNotes" TEXT,
          "inspectorName" VARCHAR(255),

          -- Hoàn tiền (Financials)
          "refundAmount" DECIMAL(15,2) DEFAULT 0,
          "refundBankName" VARCHAR(255),
          "refundAccountNumber" VARCHAR(100),
          "refundAccountHolder" VARCHAR(255),
          "refundProofImage" TEXT,
          "refundedAt" TIMESTAMP WITH TIME ZONE,

          -- Đơn hàng đổi mới vật lý (Exchange)
          "replacementOrderId" VARCHAR(64),
          "replacementOrderNumber" VARCHAR(100),

          -- Từ chối
          "rejectReason" TEXT,
          "rejectedAt" TIMESTAMP WITH TIME ZONE,

          "completedAt" TIMESTAMP WITH TIME ZONE,
          "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        );
      `);

      // 2. Tạo bảng OrderReturnItem
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "OrderReturnItem" (
          "id" VARCHAR(64) PRIMARY KEY,
          "returnId" VARCHAR(64) NOT NULL REFERENCES "OrderReturn"("id") ON DELETE CASCADE,
          "orderItemId" VARCHAR(64) NOT NULL,
          "productId" VARCHAR(64),
          "productName" VARCHAR(500) NOT NULL,
          "productSku" VARCHAR(100),
          "variantName" VARCHAR(255),
          "quantity" INTEGER NOT NULL DEFAULT 1,
          "unitPrice" DECIMAL(15,2) NOT NULL DEFAULT 0,
          "totalPrice" DECIMAL(15,2) NOT NULL DEFAULT 0,
          "productImage" TEXT,
          "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        );
      `);

      // 3. Tạo bảng OrderReturnTimeline
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "OrderReturnTimeline" (
          "id" VARCHAR(64) PRIMARY KEY,
          "returnId" VARCHAR(64) NOT NULL REFERENCES "OrderReturn"("id") ON DELETE CASCADE,
          "status" VARCHAR(50) NOT NULL,
          "title" VARCHAR(255) NOT NULL,
          "description" TEXT,
          "performedBy" VARCHAR(255),
          "actorType" VARCHAR(50) NOT NULL DEFAULT 'SYSTEM',
          "metadata" JSONB,
          "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        );
      `);

      // 4. Tạo các chỉ mục (mỗi lệnh 1 query riêng để tương thích prepared statement PostgreSQL)
      const indexQueries = [
        'CREATE INDEX IF NOT EXISTS "idx_order_return_code" ON "OrderReturn"("returnCode")',
        'CREATE INDEX IF NOT EXISTS "idx_order_return_order" ON "OrderReturn"("orderNumber")',
        'CREATE INDEX IF NOT EXISTS "idx_order_return_customer" ON "OrderReturn"("customerId")',
        'CREATE INDEX IF NOT EXISTS "idx_order_return_phone" ON "OrderReturn"("customerPhone")',
        'CREATE INDEX IF NOT EXISTS "idx_order_return_status" ON "OrderReturn"("status")',
        'CREATE INDEX IF NOT EXISTS "idx_order_return_item_return" ON "OrderReturnItem"("returnId")',
        'CREATE INDEX IF NOT EXISTS "idx_order_return_timeline_return" ON "OrderReturnTimeline"("returnId")'
      ];
      for (const idxSql of indexQueries) {
        await prisma.$executeRawUnsafe(idxSql);
      }

      // 5. Kiểm tra nếu chưa có bản ghi nào thì seed 2 bản ghi mẫu ban đầu
      const countRes: any = await prisma.$queryRawUnsafe(`SELECT COUNT(*)::int as count FROM "OrderReturn";`);
      const count = countRes && countRes[0] ? Number(countRes[0].count) : 0;

      if (count === 0) {
        console.log('[initOrderReturnDatabase] Đang nạp dữ liệu mẫu ban đầu cho OrderReturn...');
        
        // Bản ghi 1: RMA-202611-0001 (Đổi hàng - Sofa Nawabari bị lỗi chân gỗ)
        const id1 = 'ret-seed-001';
        const code1 = 'RMA-202611-0001';
        await prisma.$executeRawUnsafe(`
          INSERT INTO "OrderReturn" (
            "id", "returnCode", "orderId", "orderNumber", "customerId", "customerName", "customerPhone", 
            "customerEmail", "customerAddress", "returnType", "status", "reason", "detailedReason",
            "proofImages", "shippingProvider", "driverName", "driverPhone", "qcPassed", "qcGrade", "qcNotes",
            "refundAmount", "createdAt", "updatedAt"
          ) VALUES (
            $1, $2, 'ord-seed-001', 'ORD-202611-1002', 'cust-huyen', 'Nguyễn Như Huyền', '0901234567',
            'huyen.nguyen@gmail.com', '669 QL1A, P. Linh Trung, TP. Thủ Đức, TP. HCM', 'EXCHANGE', 'PENDING',
            'Sản phẩm lỗi kỹ thuật do nhà sản xuất', 'Chân gỗ sofa bị rạn nứt nhỏ khi lắp ráp tại nhà',
            $3::jsonb, 'Đội xe nội bộ DCor Express', 'Trần Văn Vận', '0912345678', NULL, NULL, NULL,
            0, NOW() - INTERVAL '2 hours', NOW()
          );
        `, id1, code1, JSON.stringify([
          'https://res.cloudinary.com/yqbkibfq/image/upload/v1793525512/dcor/products/ezu8fkq9vqkruufrcek3.webp'
        ]));

        await prisma.$executeRawUnsafe(`
          INSERT INTO "OrderReturnItem" (
            "id", "returnId", "orderItemId", "productName", "productSku", "variantName", "quantity", "unitPrice", "totalPrice", "productImage"
          ) VALUES (
            'ret-item-001', $1, 'item-sofa-001', 'Nawabari 2 seater sofa, wooden leg', 'SOFA-NAWA-01', 'Gỗ sồi tự nhiên / Nỉ xám',
            1, 24500000, 24500000, 'https://res.cloudinary.com/yqbkibfq/image/upload/v1793525512/dcor/products/ezu8fkq9vqkruufrcek3.webp'
          );
        `, id1);

        await prisma.$executeRawUnsafe(`
          INSERT INTO "OrderReturnTimeline" (
            "id", "returnId", "status", "title", "description", "performedBy", "actorType", "createdAt"
          ) VALUES (
            'ret-tl-001', $1, 'PENDING', 'Khách hàng gửi yêu cầu đổi trả', 'Lý do: Sản phẩm lỗi kỹ thuật do nhà sản xuất. Khách đề xuất đổi sản phẩm mới.',
            'Nguyễn Như Huyền', 'CUSTOMER', NOW() - INTERVAL '2 hours'
          );
        `, id1);

        // Bản ghi 2: RMA-202611-0002 (Hoàn tiền - Ghế đôn Madrid)
        const id2 = 'ret-seed-002';
        const code2 = 'RMA-202611-0002';
        await prisma.$executeRawUnsafe(`
          INSERT INTO "OrderReturn" (
            "id", "returnCode", "orderId", "orderNumber", "customerId", "customerName", "customerPhone", 
            "customerEmail", "customerAddress", "returnType", "status", "reason", "detailedReason",
            "proofImages", "qcPassed", "qcGrade", "qcNotes", "refundAmount", "refundBankName", "refundAccountNumber", "refundAccountHolder",
            "createdAt", "updatedAt"
          ) VALUES (
            $1, $2, 'ord-seed-002', 'ORD-202611-1003', 'cust-huyen', 'Nguyễn Như Huyền', '0901234567',
            'huyen.nguyen@gmail.com', 'Tòa Landmark 81, Vinhomes Central Park, Bình Thạnh', 'REFUND', 'APPROVED',
            'Giao sai màu sắc so với đơn đặt hàng', 'Khách đặt màu Nâu Cognac nhưng giao nhầm màu Đen tuyền',
            $3::jsonb, NULL, NULL, NULL, 6800000, 'Ngân hàng Quân Đội (MB Bank)', '0901234567', 'NGUYEN NHU HUYEN',
            NOW() - INTERVAL '1 day', NOW()
          );
        `, id2, code2, JSON.stringify([
          'https://res.cloudinary.com/yqbkibfq/image/upload/v1793525512/dcor/products/ezu8fkq9vqkruufrcek3.webp'
        ]));

        await prisma.$executeRawUnsafe(`
          INSERT INTO "OrderReturnItem" (
            "id", "returnId", "orderItemId", "productName", "productSku", "variantName", "quantity", "unitPrice", "totalPrice", "productImage"
          ) VALUES (
            'ret-item-002', $1, 'item-madrid-002', 'Ghế đôn thư giãn Madrid', 'MADRID-ST-02', 'Da thật Cognac Ý',
            1, 6800000, 6800000, 'https://res.cloudinary.com/yqbkibfq/image/upload/v1793525512/dcor/products/ezu8fkq9vqkruufrcek3.webp'
          );
        `, id2);

        await prisma.$executeRawUnsafe(`
          INSERT INTO "OrderReturnTimeline" (
            "id", "returnId", "status", "title", "description", "performedBy", "actorType", "createdAt"
          ) VALUES 
            ('ret-tl-002a', $1, 'PENDING', 'Khách hàng gửi yêu cầu hoàn tiền', 'Khách yêu cầu trả hàng và hoàn tiền vào tài khoản ngân hàng.', 'Nguyễn Như Huyền', 'CUSTOMER', NOW() - INTERVAL '1 day'),
            ('ret-tl-002b', $1, 'APPROVED', 'CSKH đã duyệt yêu cầu thu hồi', 'Đã liên hệ khách và điều phối xe tải thu hồi hàng về kho.', 'Trần CSKH DCor', 'STAFF', NOW() - INTERVAL '20 hours');
        `, id2);

        console.log('[initOrderReturnDatabase] Đã khởi tạo bảng và 2 bản ghi seed thành công!');
      }
    });
  } catch (err) {
    console.warn('[initOrderReturnDatabase] Lưu ý khi tạo bảng OrderReturn (có thể bảng đã tồn tại):', err);
  }
}
