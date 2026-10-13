import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- BẮT ĐẦU SEED DỮ LIỆU PHÂN HỆ QUẢN LÝ TỒN KHO TRÊN SUPABASE ---');

  // 1. SEED KHO / CHI NHÁNH (WAREHOUSES)
  console.log('1. Đang tạo các Kho / Chi nhánh (Warehouses)...');
  const warehousesData = [
    {
      code: 'KHO_TONG_HCM',
      name: 'Kho Tổng (TP.HCM)',
      type: 'CENTRAL_WAREHOUSE' as const,
      address: 'Lô C3, Đường số 2, KCN Tân Bình, P. Tây Thạnh, Q. Tân Phú, TP.HCM',
      phone: '028 3816 8899',
      managerName: 'Nguyễn Văn An'
    },
    {
      code: 'KHO_HN',
      name: 'Kho Hà Nội',
      type: 'REGIONAL_WAREHOUSE' as const,
      address: 'Lô 12, KCN Đài Tư, 386 Nguyễn Văn Linh, P. Sài Đồng, Q. Long Biên, Hà Nội',
      phone: '024 3987 6655',
      managerName: 'Vũ Đức Thịnh'
    },
    {
      code: 'SR_Q1',
      name: 'Showroom Quận 1',
      type: 'SHOWROOM' as const,
      address: '128 Hai Bà Trưng, P. Đa Kao, Quận 1, TP.HCM',
      phone: '028 3822 5588',
      managerName: 'Trần Thị Bích'
    },
    {
      code: 'SR_THU_DUC',
      name: 'Showroom Thủ Đức',
      type: 'SHOWROOM' as const,
      address: '45 Song Hành, P. An Phú, TP. Thủ Đức, TP.HCM',
      phone: '028 7300 9922',
      managerName: 'Lê Hoàng Long'
    }
  ];

  const warehouses: any[] = [];
  for (const wh of warehousesData) {
    const record = await (prisma as any).warehouse.upsert({
      where: { code: wh.code },
      update: wh,
      create: wh
    });
    warehouses.push(record);
    console.log(`  + Đã tạo/cập nhật Kho: [${record.code}] ${record.name}`);
  }

  // 2. TẠO DEFAULT VARIANT CHO CÁC SẢN PHẨM CHƯA CÓ BIẾN THỂ
  console.log('2. Đang kiểm tra và tạo biến thể mặc định cho các sản phẩm chưa có biến thể...');
  const productsWithoutVariants = await prisma.product.findMany({
    where: {
      variants: {
        none: {}
      }
    }
  });

  console.log(`  -> Tìm thấy ${productsWithoutVariants.length} sản phẩm chưa có biến thể. Đang khởi tạo...`);
  let createdVariantsCount = 0;
  for (const p of productsWithoutVariants) {
    // Generate clean SKU
    const cleanId = p.id.replace(/-/g, '').substring(0, 8).toUpperCase();
    const sku = `SKU-${cleanId}`;

    await prisma.productVariant.create({
      data: {
        productId: p.id,
        sku: sku,
        name: `${p.name} (Tiêu chuẩn)`,
        price: p.basePrice || 15000000,
        stock: Math.floor(Math.random() * 30) + 10, // 10 - 40 chiếc
        reservedStock: 0,
        isActive: true
      }
    });
    createdVariantsCount++;
  }
  console.log(`  + Đã bổ sung thành công ${createdVariantsCount} biến thể mặc định.`);

  // 3. SEED WAREHOUSE STOCK (PHÂN BỔ TỒN KHO THỰC TẾ THEO TỪNG KHO)
  console.log('3. Đang thiết lập bảng tồn kho phân bổ theo từng Kho (WarehouseStock)...');
  const sampleVariants = await prisma.productVariant.findMany({
    take: 50,
    select: { id: true, stock: true }
  });

  const hcmWh = warehouses.find(w => w.code === 'KHO_TONG_HCM');
  const hnWh = warehouses.find(w => w.code === 'KHO_HN');
  const q1Wh = warehouses.find(w => w.code === 'SR_Q1');
  const tdWh = warehouses.find(w => w.code === 'SR_THU_DUC');

  let stockRecordsCount = 0;
  for (const v of sampleVariants) {
    const total = v.stock || 20;
    const hcmStock = Math.max(2, Math.floor(total * 0.5));
    const hnStock = Math.max(1, Math.floor(total * 0.25));
    const q1Stock = Math.max(1, Math.floor(total * 0.15));
    const tdStock = Math.max(0, total - hcmStock - hnStock - q1Stock);

    const allocations = [
      { whId: hcmWh.id, qty: hcmStock, shelf: 'Dãy A - Kệ 01' },
      { whId: hnWh.id, qty: hnStock, shelf: 'Kệ B - Tầng 2' },
      { whId: q1Wh.id, qty: q1Stock, shelf: 'Trưng bày Showroom Q1' },
      { whId: tdWh.id, qty: tdStock, shelf: 'Trưng bày Showroom TĐ' },
    ];

    for (const alloc of allocations) {
      await (prisma as any).warehouseStock.upsert({
        where: {
          warehouseId_variantId: {
            warehouseId: alloc.whId,
            variantId: v.id
          }
        },
        update: {
          physicalStock: alloc.qty,
          reservedStock: 0,
          safetyThreshold: 5,
          shelfLocation: alloc.shelf
        },
        create: {
          warehouseId: alloc.whId,
          variantId: v.id,
          physicalStock: alloc.qty,
          reservedStock: 0,
          safetyThreshold: 5,
          shelfLocation: alloc.shelf
        }
      });
      stockRecordsCount++;
    }
  }
  console.log(`  + Đã tạo ${stockRecordsCount} bản ghi phân bổ tồn kho (WarehouseStock).`);

  // 4. SEED LỆNH XUẤT - NHẬP KHO (STOCK ORDERS - TAB 3)
  console.log('4. Đang seed các Lệnh xuất - nhập kho (Stock Orders)...');
  const firstVariant = sampleVariants[0];
  const secondVariant = sampleVariants[1];

  const stockOrdersData = [
    {
      orderCode: 'NK-2410-001',
      type: 'IMPORT' as const,
      status: 'COMPLETED' as const,
      sourceLocation: 'NCC BoConcept Đan Mạch',
      destinationLocation: 'Kho Tổng (TP.HCM)',
      sourceWarehouseId: null,
      destWarehouseId: hcmWh.id,
      referenceCode: 'PO-2024-881',
      reason: 'Nhập lô hàng sofa bộ sưu tập Thu Đông',
      totalQuantity: 25,
      totalAmount: BigInt(450000000),
      notes: 'Hàng đã kiểm tra đầy đủ tem mác và phiếu bảo hành chính hãng.',
      items: [
        { variantId: firstVariant.id, quantity: 15, unitPrice: 20000000, lineTotal: BigInt(300000000), actualQty: 15 },
        { variantId: secondVariant.id, quantity: 10, unitPrice: 15000000, lineTotal: BigInt(150000000), actualQty: 10 }
      ]
    },
    {
      orderCode: 'XK-2410-002',
      type: 'EXPORT' as const,
      status: 'COMPLETED' as const,
      sourceLocation: 'Kho Tổng (TP.HCM)',
      destinationLocation: 'Khách hàng: Trần Minh Đức',
      sourceWarehouseId: hcmWh.id,
      destWarehouseId: null,
      referenceCode: 'ORD-10024',
      reason: 'Xuất giao hàng đơn đặt cọc hoàn thiện biệt thự',
      totalQuantity: 5,
      totalAmount: BigInt(95000000),
      notes: 'Kèm biên bản bàn giao sản phẩm.',
      items: [
        { variantId: firstVariant.id, quantity: 5, unitPrice: 19000000, lineTotal: BigInt(95000000), actualQty: 5 }
      ]
    },
    {
      orderCode: 'CK-2410-003',
      type: 'TRANSFER' as const,
      status: 'PROCESSING' as const,
      sourceLocation: 'Kho Tổng (TP.HCM)',
      destinationLocation: 'Showroom Quận 1',
      sourceWarehouseId: hcmWh.id,
      destWarehouseId: q1Wh.id,
      referenceCode: 'TR-2410-019',
      reason: 'Điều chuyển hàng mẫu trưng bày concept mới',
      totalQuantity: 8,
      totalAmount: BigInt(120000000),
      notes: 'Đang vận chuyển trên xe tải nội bộ số 51C-88291.',
      items: [
        { variantId: secondVariant.id, quantity: 8, unitPrice: 15000000, lineTotal: BigInt(120000000), actualQty: null }
      ]
    },
    {
      orderCode: 'NK-2410-004',
      type: 'IMPORT' as const,
      status: 'PENDING' as const, // Chưa thực hiện
      sourceLocation: 'Xưởng Mộc Thủ Công Dcor',
      destinationLocation: 'Kho Hà Nội',
      sourceWarehouseId: null,
      destWarehouseId: hnWh.id,
      referenceCode: 'PO-2410-045',
      reason: 'Lệnh nhập bổ sung kệ trang trí theo kế hoạch quý',
      totalQuantity: 12,
      totalAmount: BigInt(96000000),
      notes: 'Chờ xưởng nghiệm thu xong đợt sơn PU.',
      items: [
        { variantId: firstVariant.id, quantity: 12, unitPrice: 8000000, lineTotal: BigInt(96000000), actualQty: null }
      ]
    },
    {
      orderCode: 'XK-2410-005',
      type: 'EXPORT' as const,
      status: 'PENDING' as const, // Chưa thực hiện
      sourceLocation: 'Kho Hà Nội',
      destinationLocation: 'Dự án Căn hộ Penthouse Ciputra',
      sourceWarehouseId: hnWh.id,
      destWarehouseId: null,
      referenceCode: 'ORD-10089',
      reason: 'Lệnh xuất nội thất bàn giao căn hộ mẫu',
      totalQuantity: 6,
      totalAmount: BigInt(110000000),
      notes: 'Chờ giám sát công trình báo ngày lắp đặt.',
      items: [
        { variantId: secondVariant.id, quantity: 6, unitPrice: 18333333, lineTotal: BigInt(110000000), actualQty: null }
      ]
    }
  ];

  for (const so of stockOrdersData) {
    const existing = await (prisma as any).stockOrder.findUnique({ where: { orderCode: so.orderCode } });
    if (!existing) {
      await (prisma as any).stockOrder.create({
        data: {
          orderCode: so.orderCode,
          type: so.type,
          status: so.status,
          sourceLocation: so.sourceLocation,
          destinationLocation: so.destinationLocation,
          sourceWarehouseId: so.sourceWarehouseId,
          destWarehouseId: so.destWarehouseId,
          referenceCode: so.referenceCode,
          reason: so.reason,
          totalQuantity: so.totalQuantity,
          totalAmount: so.totalAmount,
          notes: so.notes,
          items: {
            create: so.items
          }
        }
      });
      console.log(`  + Đã tạo Lệnh kho: [${so.orderCode}] ${so.type} - ${so.status}`);
    }
  }

  // 5. SEED PHIẾU KIỂM KÊ KHO (STOCK AUDITS - TAB 2)
  console.log('5. Đang seed các Phiếu kiểm kê kho (Stock Audits)...');
  const auditsData = [
    {
      auditCode: 'ADT-2410-001',
      location: 'Kho Tổng (TP.HCM)',
      warehouseId: hcmWh.id,
      status: 'PENDING' as const, // Đơn yêu cầu kiểm kê CHƯA thực hiện!
      scope: 'ALL',
      totalItemsCount: 45,
      discrepancyCount: 0,
      notes: 'Yêu cầu kiểm kê định kỳ cuối tháng 10. Chưa bắt đầu kiểm đếm.',
      targetDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      items: [
        { variantId: firstVariant.id, systemStock: 25, actualStock: null, discrepancy: null, reason: null },
        { variantId: secondVariant.id, systemStock: 18, actualStock: null, discrepancy: null, reason: null }
      ]
    },
    {
      auditCode: 'ADT-2410-002',
      location: 'Showroom Quận 1',
      warehouseId: q1Wh.id,
      status: 'IN_PROGRESS' as const, // Đang đếm
      scope: 'CATEGORY',
      totalItemsCount: 15,
      discrepancyCount: 0,
      notes: 'Đang đếm thực tế danh mục Ghế Sofa tại showroom.',
      targetDate: new Date(),
      items: [
        { variantId: firstVariant.id, systemStock: 5, actualStock: 5, discrepancy: 0, reason: 'Khớp' },
        { variantId: secondVariant.id, systemStock: 8, actualStock: 7, discrepancy: -1, reason: 'Chờ xác minh' }
      ]
    },
    {
      auditCode: 'ADT-2410-003',
      location: 'Kho Hà Nội',
      warehouseId: hnWh.id,
      status: 'COMPLETED' as const, // Đã hoàn tất và cân bằng
      scope: 'ALL',
      totalItemsCount: 30,
      discrepancyCount: 1,
      notes: 'Đã hoàn tất đối chiếu và cân bằng kho.',
      completedAt: new Date(),
      items: [
        { variantId: firstVariant.id, systemStock: 10, actualStock: 10, discrepancy: 0, reason: 'Khớp số liệu' },
        { variantId: secondVariant.id, systemStock: 12, actualStock: 11, discrepancy: -1, reason: 'Hư hỏng 1 chiếc do trầy xước vỏ thùng' }
      ]
    }
  ];

  for (const aud of auditsData) {
    const existing = await (prisma as any).stockAudit.findUnique({ where: { auditCode: aud.auditCode } });
    if (!existing) {
      await (prisma as any).stockAudit.create({
        data: {
          auditCode: aud.auditCode,
          location: aud.location,
          warehouseId: aud.warehouseId,
          status: aud.status,
          scope: aud.scope,
          totalItemsCount: aud.totalItemsCount,
          discrepancyCount: aud.discrepancyCount,
          notes: aud.notes,
          targetDate: aud.targetDate,
          completedAt: (aud as any).completedAt || null,
          items: {
            create: aud.items
          }
        }
      });
      console.log(`  + Đã tạo Phiếu kiểm kê: [${aud.auditCode}] Status: ${aud.status}`);
    }
  }

  // 6. SEED SỔ CÁI BIẾN ĐỘNG (STOCK TRANSACTIONS - TAB 4)
  console.log('6. Đang seed Sổ cái biến động kho (Stock Transactions)...');
  const transactionsData = [
    {
      txCode: 'TX-2410-001',
      type: 'IMPORT_RECEIPT' as const,
      variantId: firstVariant.id,
      location: 'Kho Tổng (TP.HCM)',
      warehouseId: hcmWh.id,
      stockBefore: 10,
      quantityChange: 15,
      stockAfter: 25,
      referenceCode: 'NK-2410-001',
      notes: 'Nhập kho lô hàng từ BoConcept Đan Mạch'
    },
    {
      txCode: 'TX-2410-002',
      type: 'SALES_DISPATCH' as const,
      variantId: firstVariant.id,
      location: 'Kho Tổng (TP.HCM)',
      warehouseId: hcmWh.id,
      stockBefore: 25,
      quantityChange: -5,
      stockAfter: 20,
      referenceCode: 'ORD-10024',
      notes: 'Xuất kho giao đơn hàng #ORD-10024'
    },
    {
      txCode: 'TX-2410-003',
      type: 'AUDIT_DECREASE' as const,
      variantId: secondVariant.id,
      location: 'Kho Hà Nội',
      warehouseId: hnWh.id,
      stockBefore: 12,
      quantityChange: -1,
      stockAfter: 11,
      referenceCode: 'ADT-2410-003',
      notes: 'Điều chỉnh giảm tồn kho sau kiểm kê ADT-2410-003 (Hàng trầy xước)'
    }
  ];

  for (const tx of transactionsData) {
    const existing = await (prisma as any).stockTransaction.findUnique({ where: { txCode: tx.txCode } });
    if (!existing) {
      await (prisma as any).stockTransaction.create({
        data: tx
      });
      console.log(`  + Đã tạo Giao dịch sổ cái: [${tx.txCode}] ${tx.type} (${tx.quantityChange})`);
    }
  }

  console.log('--- HOÀN TẤT SEEDING TOÀN BỘ PHÂN HỆ QUẢN LÝ KHO THÀNH CÔNG 100%! ---');
}

main()
  .catch((e) => {
    console.error('Lỗi khi seed dữ liệu:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
