const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Bắt đầu batch update Dashboard...');

  // Lấy id của 90 orders
  const orders = await prisma.order.findMany({
    select: { id: true, totalAmount: true, status: true },
    orderBy: { createdAt: 'asc' }
  });
  console.log(`📦 Tìm thấy ${orders.length} đơn hàng.`);

  const showrooms = [
    'Online Web Store',
    'Showroom Quận 1',
    'Showroom Thủ Đức'
  ];

  const shippingProviders = [
    'Đội xe Showroom (DCOR Express)',
    'Giao Hàng Nhanh',
    'Viettel Post'
  ];

  const cancelReasons = [
    'Khách hàng đổi ý, muốn đổi sang dòng sản phẩm khác',
    'Thời gian gia công theo yêu cầu dài hơn dự kiến',
    'Thay đổi địa chỉ giao hàng ngoài bán kính hỗ trợ lắp đặt',
    'Đặt trùng đơn hàng',
    'Khách hàng thay đổi kế hoạch thiết kế căn hộ'
  ];

  const now = new Date('2026-11-03T18:30:00.000Z');

  let depositCount = 0;
  let cancelIdx = 0;

  // Build mảng update promises với chunk 10 để tránh giữ lock
  const updates = orders.map((order, i) => {
    let showroom = showrooms[0];
    if (i % 10 >= 5 && i % 10 <= 7) showroom = showrooms[1];
    else if (i % 10 > 7) showroom = showrooms[2];

    const isHighValue = Number(order.totalAmount) >= 50000000;

    let isDepositRequired = false;
    if (order.status === 'PENDING' && depositCount < 5) {
      isDepositRequired = true;
      depositCount++;
    }

    let cancelReason = null;
    if (order.status === 'CANCELLED') {
      cancelReason = cancelReasons[cancelIdx % cancelReasons.length];
      cancelIdx++;
    }

    let shippingProvider = null;
    if (order.status === 'SHIPPED' || order.status === 'DELIVERED') {
      shippingProvider = shippingProviders[i % shippingProviders.length];
    }

    let newCreatedAt;
    if (i >= 85) {
      const hoursAgo = (89 - i) * 2;
      newCreatedAt = new Date(now.getTime() - hoursAgo * 3600 * 1000);
    } else if (i >= 65) {
      const dayOffset = (84 - i) % 6 + 1;
      newCreatedAt = new Date(now.getTime() - dayOffset * 24 * 3600 * 1000 - (i % 12) * 3600 * 1000);
    } else if (i >= 30) {
      const dayOffset = 7 + ((64 - i) % 13);
      newCreatedAt = new Date(now.getTime() - dayOffset * 24 * 3600 * 1000 - (i % 10) * 3600 * 1000);
    } else {
      const dayOffset = 20 + ((29 - i) % 14);
      newCreatedAt = new Date(now.getTime() - dayOffset * 24 * 3600 * 1000 - (i % 8) * 3600 * 1000);
    }

    return {
      id: order.id,
      showroom,
      isHighValue,
      isDepositRequired,
      cancelReason,
      shippingProvider,
      createdAt: newCreatedAt.toISOString()
    };
  });

  // Chạy theo chunks 15
  for (let c = 0; c < updates.length; c += 15) {
    const chunk = updates.slice(c, c + 15);
    await Promise.all(
      chunk.map(u => 
        prisma.$executeRawUnsafe(`
          UPDATE "Order"
          SET "showroom" = $1,
              "isHighValue" = $2,
              "isDepositRequired" = $3,
              "cancelReason" = COALESCE($4, "cancelReason"),
              "shippingProvider" = COALESCE($5, "shippingProvider"),
              "createdAt" = $6::timestamptz
          WHERE "id" = $7
        `, u.showroom, u.isHighValue, u.isDepositRequired, u.cancelReason, u.shippingProvider, u.createdAt, u.id)
      )
    );
    console.log(`Đã cập nhật ${Math.min(c + 15, updates.length)}/${updates.length} đơn hàng...`);
  }

  // Cập nhật 3 lịch hẹn showroom hôm nay
  try {
    const consultations = await prisma.$queryRawUnsafe(`SELECT id FROM "ShowroomConsultations" ORDER BY id ASC LIMIT 3`);
    for (let item of consultations) {
      await prisma.$executeRawUnsafe(`
        UPDATE "ShowroomConsultations"
        SET "consultationDate" = '2026-11-03', "status" = 'CONFIRMED'
        WHERE id = $1
      `, item.id);
    }
    console.log('✅ Cập nhật lịch hẹn thành công!');
  } catch (e) {
    console.warn('Bỏ qua ShowroomConsultations:', e.message);
  }

  console.log('🎉 Hoàn thành xuất sắc patch dữ liệu!');
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
