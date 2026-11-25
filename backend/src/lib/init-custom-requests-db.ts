import prisma, { withDbRetry } from './prisma';

/**
 * Khởi tạo cấu trúc bảng và chỉ mục cho quy trình May đo Tùy biến (Custom Requests)
 * Tương thích PostgreSQL Supabase, an toàn khi khởi chạy lặp lại và tự động nạp dữ liệu mẫu ban đầu nếu bảng trống.
 */
export async function initCustomRequestDatabase(): Promise<void> {
  try {
    await withDbRetry(async () => {
      // 1. Tạo bảng CustomRequest
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "CustomRequest" (
          "id" VARCHAR(64) PRIMARY KEY,
          "code" VARCHAR(64) UNIQUE NOT NULL,
          "customerId" VARCHAR(64),
          "customerName" VARCHAR(255) NOT NULL,
          "customerPhone" VARCHAR(50) NOT NULL,
          "customerEmail" VARCHAR(255),
          "customerAddress" TEXT,
          "isPhoneVerified" BOOLEAN NOT NULL DEFAULT false,
          
          "productId" VARCHAR(64),
          "productName" VARCHAR(500) NOT NULL,
          "productSku" VARCHAR(100),
          "productImage" TEXT,
          "categoryName" VARCHAR(255),
          "basePrice" DECIMAL(15,2) DEFAULT 0,
          
          "hasDimensions" BOOLEAN NOT NULL DEFAULT true,
          "originalDimensions" VARCHAR(255),
          "requestedDimensions" VARCHAR(255),
          "customDimensionNote" TEXT,
          "length" DOUBLE PRECISION,
          "width" DOUBLE PRECISION,
          "height" DOUBLE PRECISION,
          
          "customizedAttributes" JSONB NOT NULL DEFAULT '[]'::jsonb,
          "colorName" VARCHAR(255),
          "colorHex" VARCHAR(50),
          "colorImage" TEXT,
          "material" VARCHAR(255),
          "legMaterial" VARCHAR(255),
          
          "notes" TEXT,
          "requirementDetails" TEXT,
          "budgetRange" VARCHAR(255),
          "estimatedBudget" VARCHAR(255),
          "preferredSurveyTime" VARCHAR(255),
          "expectedDeliveryDate" VARCHAR(255),
          "roomSpace" VARCHAR(255),
          
          "attachments" JSONB NOT NULL DEFAULT '[]'::jsonb,
          "referenceImages" JSONB NOT NULL DEFAULT '[]'::jsonb,
          
          "status" VARCHAR(50) NOT NULL DEFAULT 'PENDING_REVIEW',
          "assignedStaff" VARCHAR(255),
          "assignedStaffId" VARCHAR(64),
          "adminNotes" TEXT,
          
          "surveyNotes" TEXT,
          "surveyAttachment" JSONB,
          "surveyDate" TIMESTAMP WITH TIME ZONE,
          
          "drawing3dUrl" TEXT,
          "drawing3dUrls" JSONB NOT NULL DEFAULT '[]'::jsonb,
          
          "quotedPrice" DECIMAL(15,2) DEFAULT 0,
          "quotedDeposit" DECIMAL(15,2) DEFAULT 0,
          "quotedAt" TIMESTAMP WITH TIME ZONE,
          "estimatedProductionDays" INTEGER DEFAULT 15,
          
          "contractScanUrl" TEXT,
          "contractSignedAt" TIMESTAMP WITH TIME ZONE,
          "contractSignerName" VARCHAR(255),
          
          "depositProofImage" TEXT,
          "depositProofNote" TEXT,
          "depositPaidAt" TIMESTAMP WITH TIME ZONE,
          
          "cancelReason" TEXT,
          "cancelledAt" TIMESTAMP WITH TIME ZONE,
          "cancelledBy" VARCHAR(255),
          
          "qcPassedAt" TIMESTAMP WITH TIME ZONE,
          "qcInspector" VARCHAR(255),
          "qcChecklist" JSONB,
          
          "warrantyCode" VARCHAR(100),
          "warrantyMonths" INTEGER DEFAULT 24,
          "warrantyFrameYears" INTEGER DEFAULT 10,
          "warrantySurfaceYears" INTEGER DEFAULT 3,
          "warrantyPolicy" TEXT,
          "deliveredAt" TIMESTAMP WITH TIME ZONE,
          "finalPaymentReceived" BOOLEAN NOT NULL DEFAULT false,
          
          "generatedOrderNumber" VARCHAR(64),
          "orderId" VARCHAR(64),
          "workOrderCode" VARCHAR(64),
          "customVariantId" VARCHAR(64),
          "customVariant" JSONB,
          
          "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        );
      `);

      // 2. Tạo bảng CustomRequestTimeline
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "CustomRequestTimeline" (
          "id" VARCHAR(64) PRIMARY KEY,
          "requestId" VARCHAR(64) NOT NULL REFERENCES "CustomRequest"("id") ON DELETE CASCADE,
          "status" VARCHAR(50) NOT NULL,
          "title" VARCHAR(255) NOT NULL,
          "description" TEXT,
          "performedBy" VARCHAR(255),
          "actorType" VARCHAR(50) NOT NULL DEFAULT 'SYSTEM',
          "metadata" JSONB,
          "timestamp" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        );
      `);

      // 3. Tạo các chỉ mục tối ưu truy vấn
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "CustomRequest_code_idx" ON "CustomRequest"("code")`);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "CustomRequest_customerId_idx" ON "CustomRequest"("customerId")`);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "CustomRequest_customerPhone_idx" ON "CustomRequest"("customerPhone")`);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "CustomRequest_customerEmail_idx" ON "CustomRequest"("customerEmail")`);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "CustomRequest_status_idx" ON "CustomRequest"("status")`);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "CustomRequest_assignedStaffId_idx" ON "CustomRequest"("assignedStaffId")`);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "CustomRequest_createdAt_idx" ON "CustomRequest"("createdAt")`);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "CustomRequestTimeline_requestId_idx" ON "CustomRequestTimeline"("requestId")`);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "CustomRequestTimeline_createdAt_idx" ON "CustomRequestTimeline"("createdAt")`);

      // 4. Kiểm tra nạp dữ liệu mẫu ban đầu nếu bảng trống
      const countResult: any = await prisma.$queryRawUnsafe(`SELECT COUNT(*)::int as count FROM "CustomRequest"`);
      const total = Number(countResult[0]?.count || 0);

      if (total === 0) {
        console.log('[DB] Đang nạp bộ dữ liệu hạt giống CustomRequest mẫu vào PostgreSQL...');
        await seedInitialCustomRequests();
      }
    });

    console.log('[DB] Khởi tạo bảng CustomRequest và CustomRequestTimeline thành công.');
  } catch (error) {
    console.warn('[DB] Lưu ý khi tạo bảng CustomRequest (bỏ qua nếu đã tồn tại):', error);
  }
}

async function seedInitialCustomRequests(): Promise<void> {
  const seeds = [
    {
      id: 'cr-101',
      code: 'CR-0001',
      customerName: 'Hoàng Anh Tuấn',
      customerPhone: '0977889900',
      isPhoneVerified: true,
      customerEmail: 'anhtuan.hoang@gmail.com',
      customerAddress: 'Căn 2408 Tháp Aqua 1, Vinhomes Golden River, Q.1, TP.HCM',
      productId: 'prod-sofa-l',
      productName: 'Sofa Góc Chữ L Bọc Da Bò Mastrotto Ý',
      productSku: 'SF-CORNER-L',
      productImage: '/assets/img/furniture-placeholder.svg',
      categoryName: 'Sofa May Đo',
      hasDimensions: true,
      basePrice: 42000000,
      originalDimensions: '280 x 175 x 85 cm',
      requestedDimensions: '290 x 175 x 85 cm',
      customDimensionNote: 'Kéo dài thêm 10cm phần văng chính để vừa vặn mảng tường phòng khách',
      length: 290,
      width: 175,
      height: 85,
      colorName: 'Xám Khói Mờ (Smoky Grey)',
      colorHex: '#64748B',
      material: 'Da bò Ý Mastrotto Full Grain 1.6mm',
      legMaterial: 'Chân Inox 304 xước mạ Titan xám nòng súng',
      notes: 'Góc chữ L xoay bên phải nhìn ra ban công, thêm đệm bông lông vũ lớp trên để tựa lưng thật êm.',
      requirementDetails: 'Đặt tại phòng khách căn hộ chung cư lầu 24 Vinhomes Golden River. Thang máy tòa nhà cao 2.4m rộng 1.1m, góc chữ L xoay bên phải nhìn ra ban công sông Sài Gòn.',
      budgetRange: '22.000.000 đ - 26.000.000 đ',
      estimatedBudget: '25.000.000',
      preferredSurveyTime: 'Thứ 7 tuần này (09:00 - 11:30 sáng)',
      expectedDeliveryDate: 'Trước 25/11/2026 (khoảng 20 ngày)',
      roomSpace: 'Phòng khách căn hộ chung cư Vinhomes Golden River (85m²)',
      status: 'PENDING_REVIEW',
      timeline: [
        {
          id: 'ctl-101-1',
          status: 'PENDING_REVIEW',
          title: 'Khách hàng gửi yêu cầu custom',
          description: 'Khách gửi form tùy biến kích thước Sofa chữ L qua website.',
          performedBy: 'Hoàng Anh Tuấn',
          actorType: 'CUSTOMER'
        }
      ]
    },
    {
      id: 'cr-102',
      code: 'CR-0002',
      customerName: 'Nguyễn Văn Hùng',
      customerPhone: '0903123456',
      customerEmail: 'hung.nguyen@example.com',
      customerAddress: '124 Điện Biên Phủ, P. Đa Kao, Q.1, TP.HCM',
      productId: 'prod-armchair',
      productName: 'Ghế Bành Thư Giãn Da Bò Thật Milano',
      productSku: 'AC-MILANO-01',
      productImage: '/assets/img/furniture-placeholder.svg',
      categoryName: 'Ghế Bành & Thư Giãn',
      hasDimensions: true,
      basePrice: 18500000,
      originalDimensions: '95 x 90 x 98 cm',
      requestedDimensions: '100 x 95 x 102 cm',
      customDimensionNote: 'Nới rộng lòng ghế ngồi 5cm và nâng cao tựa đầu thêm 4cm',
      length: 100,
      width: 95,
      height: 102,
      colorName: 'Nâu Cognac Ý',
      colorHex: '#8B4513',
      material: 'Da bò Ý Top Grain',
      legMaterial: 'Gỗ óc chó Bắc Mỹ tự nhiên',
      status: 'CONSULTING',
      assignedStaff: 'KTS. Lê Quang Huy',
      assignedStaffId: 'staff-arch-01',
      surveyDate: new Date().toISOString(),
      surveyNotes: 'Đã hẹn khảo sát thực tế tại nhà khách chiều thứ 5 tuần này.',
      timeline: [
        {
          id: 'ctl-102-1',
          status: 'PENDING_REVIEW',
          title: 'Khách hàng gửi yêu cầu',
          description: 'Khách gửi yêu cầu tùy biến kích thước ghế bành Milano.',
          performedBy: 'Nguyễn Văn Hùng',
          actorType: 'CUSTOMER'
        },
        {
          id: 'ctl-102-2',
          status: 'CONSULTING',
          title: 'KTS tiếp nhận & lên lịch khảo sát',
          description: 'KTS. Lê Quang Huy đã tiếp nhận và liên hệ đặt lịch đo đạc thực tế.',
          performedBy: 'KTS. Lê Quang Huy',
          actorType: 'STAFF'
        }
      ]
    },
    {
      id: 'cr-103',
      code: 'CR-0003',
      customerName: 'Trần Thị Thu Hà',
      customerPhone: '0912345678',
      customerEmail: 'thuha.tran@example.com',
      customerAddress: 'Biệt thự BT-12 KĐT Sala Đại Quang Minh, TP. Thủ Đức, TP.HCM',
      productId: 'prod-table-oak',
      productName: 'Bàn Ăn Gỗ Tự Nhiên Bắc Mỹ Elegance',
      productSku: 'DT-OAK-01',
      productImage: '/assets/img/furniture-placeholder.svg',
      categoryName: 'Bàn Ăn',
      hasDimensions: true,
      basePrice: 28000000,
      originalDimensions: '200 x 90 x 75 cm',
      requestedDimensions: '240 x 100 x 76 cm',
      customDimensionNote: 'Kéo dài thành bàn 8 - 10 chỗ ngồi',
      length: 240,
      width: 100,
      height: 76,
      colorName: 'Gỗ Sồi Tự Nhiên Lau Dầu Hạt Dẻ',
      colorHex: '#A0522D',
      material: 'Gỗ Sồi Trắng Bắc Mỹ (White Oak)',
      legMaterial: 'Chân gỗ tự nhiên nguyên khối',
      status: 'QUOTED',
      assignedStaff: 'KTS. Trần Minh Đức',
      assignedStaffId: 'staff-arch-02',
      quotedPrice: 34500000,
      quotedDeposit: 10350000,
      quotedAt: new Date().toISOString(),
      estimatedProductionDays: 18,
      drawing3dUrl: '/assets/img/about_blueprint.jpg',
      timeline: [
        {
          id: 'ctl-103-1',
          status: 'QUOTED',
          title: 'Gửi bản vẽ 3D & Báo giá chi tiết',
          description: 'Đã hoàn thiện phối cảnh 3D và báo giá 34.500.000 đ, cọc 30% (10.350.000 đ).',
          performedBy: 'KTS. Trần Minh Đức',
          actorType: 'STAFF'
        }
      ]
    },
    {
      id: 'cr-104',
      code: 'CR-0004',
      customerName: 'Huyền Oauth Google',
      customerPhone: '0988776655',
      customerEmail: 'huyen.dcor@gmail.com',
      customerAddress: 'Landmark 81, Vinhomes Central Park, Bình Thạnh, TP.HCM',
      productName: 'Kệ Tủ Tivi & Tủ Rượu Module May Đo Phòng Khách',
      productSku: 'CUST-CABINET-04',
      productImage: '/assets/img/furniture-placeholder.svg',
      categoryName: 'Tủ Kệ May Đo Độc Bản',
      hasDimensions: true,
      basePrice: 55000000,
      originalDimensions: '320 x 45 x 220 cm',
      requestedDimensions: '360 x 50 x 260 cm',
      length: 360,
      width: 50,
      height: 260,
      colorName: 'Gỗ Óc Chó Kết Hợp Cánh Kính Khói Đèn LED',
      colorHex: '#3D2314',
      material: 'Gỗ Óc Chó Bắc Mỹ & Kính Cường Lực Khói 8mm',
      legMaterial: 'Hệ treo âm tường gia cố chịu lực',
      status: 'CONTRACT_SIGNED',
      assignedStaff: 'KTS. Lê Quang Huy',
      assignedStaffId: 'staff-arch-01',
      quotedPrice: 58000000,
      quotedDeposit: 17400000,
      contractSignedAt: new Date().toISOString(),
      contractSignerName: 'Huyền Oauth Google',
      timeline: [
        {
          id: 'ctl-104-1',
          status: 'CONTRACT_SIGNED',
          title: 'Khách hàng ký hợp đồng may đo kinh tế',
          description: 'Hợp đồng may đo đã được xác nhận ký điện tử thành công.',
          performedBy: 'Huyền Oauth Google',
          actorType: 'CUSTOMER'
        }
      ]
    }
  ];

  for (const s of seeds) {
    const { timeline, ...reqData } = s;
    await prisma.$executeRawUnsafe(`
      INSERT INTO "CustomRequest" (
        "id", "code", "customerName", "customerPhone", "customerEmail", "customerAddress", "isPhoneVerified",
        "productId", "productName", "productSku", "productImage", "categoryName", "basePrice",
        "hasDimensions", "originalDimensions", "requestedDimensions", "customDimensionNote",
        "length", "width", "height", "colorName", "colorHex", "material", "legMaterial",
        "notes", "requirementDetails", "budgetRange", "estimatedBudget", "preferredSurveyTime", "expectedDeliveryDate", "roomSpace",
        "status", "assignedStaff", "assignedStaffId", "quotedPrice", "quotedDeposit", "contractSignerName",
        "drawing3dUrl", "surveyNotes"
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        $8, $9, $10, $11, $12, $13,
        $14, $15, $16, $17,
        $18, $19, $20, $21, $22, $23, $24,
        $25, $26, $27, $28, $29, $30, $31,
        $32, $33, $34, $35, $36, $37,
        $38, $39
      ) ON CONFLICT ("id") DO NOTHING;
    `, 
      reqData.id, reqData.code, reqData.customerName, reqData.customerPhone, reqData.customerEmail, reqData.customerAddress, reqData.isPhoneVerified || false,
      reqData.productId || null, reqData.productName, reqData.productSku || null, reqData.productImage || null, reqData.categoryName || null, reqData.basePrice || 0,
      reqData.hasDimensions ?? true, reqData.originalDimensions || null, reqData.requestedDimensions || null, reqData.customDimensionNote || null,
      reqData.length || null, reqData.width || null, reqData.height || null, reqData.colorName || null, reqData.colorHex || null, reqData.material || null, reqData.legMaterial || null,
      reqData.notes || null, reqData.requirementDetails || null, reqData.budgetRange || null, reqData.estimatedBudget || null, reqData.preferredSurveyTime || null, reqData.expectedDeliveryDate || null, reqData.roomSpace || null,
      reqData.status, reqData.assignedStaff || null, reqData.assignedStaffId || null, reqData.quotedPrice || 0, reqData.quotedDeposit || 0, (reqData as any).contractSignerName || null,
      (reqData as any).drawing3dUrl || null, (reqData as any).surveyNotes || null
    );

    if (timeline && Array.isArray(timeline)) {
      for (const t of timeline) {
        await prisma.$executeRawUnsafe(`
          INSERT INTO "CustomRequestTimeline" (
            "id", "requestId", "status", "title", "description", "performedBy", "actorType"
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT ("id") DO NOTHING;
        `, t.id, reqData.id, t.status, t.title, t.description, t.performedBy, t.actorType || 'SYSTEM');
      }
    }
  }
}
