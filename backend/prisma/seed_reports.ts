import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SAMPLE_CUSTOMERS = [
  { fullName: 'Nguyễn Văn An', phone: '0903111222', email: 'an.nguyen@gmail.com', province: 'Hồ Chí Minh', points: 450 },
  { fullName: 'Trần Thị Mai', phone: '0903222333', email: 'mai.tran@gmail.com', province: 'Hà Nội', points: 820 },
  { fullName: 'Lê Hoàng Long', phone: '0903333444', email: 'long.le@gmail.com', province: 'Hồ Chí Minh', points: 1500 },
  { fullName: 'Phạm Thu Hà', phone: '0903444555', email: 'ha.pham@gmail.com', province: 'Đà Nẵng', points: 300 },
  { fullName: 'Vũ Đức Thắng', phone: '0903555666', email: 'thang.vu@gmail.com', province: 'Bình Dương', points: 950 },
  { fullName: 'Đặng Minh Tâm', phone: '0903666777', email: 'tam.dang@gmail.com', province: 'Hồ Chí Minh', points: 2100 },
  { fullName: 'Bùi Thị Lan', phone: '0903777888', email: 'lan.bui@gmail.com', province: 'Đồng Nai', points: 120 },
  { fullName: 'Đỗ Quốc Hùng', phone: '0903888999', email: 'hung.do@gmail.com', province: 'Hà Nội', points: 640 },
  { fullName: 'Hoàng Yến Nhi', phone: '0903999000', email: 'nhi.hoang@gmail.com', province: 'Hồ Chí Minh', points: 1800 },
  { fullName: 'Ngô Văn Khoa', phone: '0912111333', email: 'khoa.ngo@gmail.com', province: 'Cần Thơ', points: 250 },
  { fullName: 'Dương Mỹ Linh', phone: '0912222444', email: 'linh.duong@gmail.com', province: 'Hà Nội', points: 1100 },
  { fullName: 'Tạ Minh Tuấn', phone: '0912333555', email: 'tuan.ta@gmail.com', province: 'Hồ Chí Minh', points: 400 },
  { fullName: 'Võ Thanh Trúc', phone: '0912444666', email: 'truc.vo@gmail.com', province: 'Đà Nẵng', points: 750 },
  { fullName: 'Lý Gia Bảo', phone: '0912555777', email: 'bao.ly@gmail.com', province: 'Hồ Chí Minh', points: 2600 },
  { fullName: 'Phan Kim Ngân', phone: '0912666888', email: 'ngan.phan@gmail.com', province: 'Bình Dương', points: 520 }
];

async function seedReportsData() {
  console.log('=== BẮT ĐẦU SEED DỮ LIỆU BÁO CÁO & THỐNG KÊ ===');

  const existingOrderCount = await prisma.order.count();
  console.log(`Số đơn hàng hiện tại trong DB: ${existingOrderCount}`);

  // 1. Tạo hoặc cập nhật Customers
  const createdCustomers: any[] = [];
  for (const c of SAMPLE_CUSTOMERS) {
    const existing = await prisma.customer.findUnique({ where: { phone: c.phone } });
    if (!existing) {
      const cust = await prisma.customer.create({
        data: {
          fullName: c.fullName,
          phone: c.phone,
          email: c.email,
          rewardPoints: c.points,
          totalSpent: BigInt(0),
          createdAt: new Date(Date.now() - Math.floor(Math.random() * 30 * 86400000))
        }
      });
      createdCustomers.push(cust);
    } else {
      createdCustomers.push(existing);
    }
  }

  // Lấy tất cả khách hàng
  const allCustomers = await prisma.customer.findMany();
  console.log(`Tổng khách hàng sẵn sàng: ${allCustomers.length}`);

  // 2. Lấy danh sách Variants có kèm Product để tạo Order Items
  const variants = await prisma.productVariant.findMany({
    take: 50,
    include: { product: true }
  });

  if (variants.length === 0) {
    console.error('Không tìm thấy biến thể sản phẩm nào trong DB!');
    return;
  }

  console.log(`Tìm thấy ${variants.length} biến thể sản phẩm để tạo đơn hàng.`);

  // 3. Tạo các đơn hàng phân bổ theo thời gian (Hôm nay, 7 ngày qua, 30 ngày qua)
  const now = new Date();
  const orderStatuses = [
    'DELIVERED', 'DELIVERED', 'DELIVERED', 'DELIVERED', 
    'SHIPPED', 'PROCESSING', 'CONFIRMED', 'PENDING', 'CANCELLED'
  ];
  const paymentMethods: any[] = ['COD', 'VNPAY', 'BANK_TRANSFER', 'COD', 'VNPAY'];
  const provinces = ['Hồ Chí Minh', 'Hồ Chí Minh', 'Hà Nội', 'Hà Nội', 'Đà Nẵng', 'Bình Dương', 'Đồng Nai'];

  // Tạo 60 đơn hàng trải dài 30 ngày
  let createdCount = 0;
  for (let i = 0; i < 60; i++) {
    // Phân bổ thời gian:
    // 10 đơn hôm nay
    // 25 đơn trong 7 ngày qua
    // 25 đơn trong 30 ngày qua
    let orderDate: Date;
    if (i < 10) {
      // Hôm nay: từ 0h đến giờ hiện tại
      const hoursAgo = Math.floor(Math.random() * (now.getHours() || 1));
      const minsAgo = Math.floor(Math.random() * 59);
      orderDate = new Date(now.getTime() - (hoursAgo * 3600000 + minsAgo * 60000));
    } else if (i < 35) {
      // 1 đến 7 ngày trước
      const daysAgo = Math.floor(Math.random() * 6) + 1;
      const hours = Math.floor(Math.random() * 23);
      orderDate = new Date(now.getTime() - (daysAgo * 86400000 + hours * 3600000));
    } else {
      // 8 đến 30 ngày trước
      const daysAgo = Math.floor(Math.random() * 22) + 8;
      const hours = Math.floor(Math.random() * 23);
      orderDate = new Date(now.getTime() - (daysAgo * 86400000 + hours * 3600000));
    }

    const customer = allCustomers[i % allCustomers.length];
    const status = orderStatuses[i % orderStatuses.length] as any;
    const paymentMethod = paymentMethods[i % paymentMethods.length];
    const province = provinces[i % provinces.length];

    // Chọn ngẫu nhiên 1 đến 3 sản phẩm
    const numItems = Math.floor(Math.random() * 3) + 1;
    const selectedVariants: any[] = [];
    for (let j = 0; j < numItems; j++) {
      const randomVariant = variants[Math.floor(Math.random() * variants.length)];
      selectedVariants.push(randomVariant);
    }

    let subTotal = 0;
    const orderItemsData = selectedVariants.map(v => {
      const qty = Math.floor(Math.random() * 2) + 1;
      const lineTotal = v.price * qty;
      subTotal += lineTotal;
      return {
        productId: v.productId,
        variantId: v.id,
        productName: v.product?.name || v.name,
        sku: v.sku,
        imageUrl: (Array.isArray(v.product?.images) && v.product.images[0]) || '/assets/placeholder.jpg',
        quantity: qty,
        price: v.price,
        lineTotal: BigInt(lineTotal)
      };
    });

    const shippingFee = 35000;
    const totalAmount = subTotal + shippingFee;

    const orderNumber = `ORD-${orderDate.getFullYear()}${(orderDate.getMonth() + 1).toString().padStart(2, '0')}${orderDate.getDate().toString().padStart(2, '0')}-${1000 + i}`;

    try {
      const order = await prisma.order.create({
        data: {
          orderNumber,
          customerId: customer.id,
          phone: customer.phone,
          receiverName: customer.fullName,
          province,
          detailAddress: `Số ${i + 12} Đường Lê Lợi`,
          subTotal: BigInt(subTotal),
          shippingFee: BigInt(shippingFee),
          totalAmount: BigInt(totalAmount),
          paymentMethod,
          paymentStatus: status === 'DELIVERED' || paymentMethod === 'VNPAY' ? 'PAID' : 'UNPAID',
          status,
          createdAt: orderDate,
          updatedAt: orderDate,
          items: {
            create: orderItemsData
          },
          statusHistory: {
            create: [
              {
                status: 'PENDING',
                actorType: 'CUSTOMER',
                notes: 'Khách hàng đặt đơn',
                createdAt: orderDate
              }
            ]
          }
        }
      });

      // Nếu đơn thành công, cộng dồn totalSpent cho customer
      if (status === 'DELIVERED') {
        await prisma.customer.update({
          where: { id: customer.id },
          data: {
            totalSpent: {
              increment: BigInt(totalAmount)
            }
          }
        });
      }

      createdCount++;
    } catch (err: any) {
      console.warn(`Bỏ qua đơn trùng hoặc lỗi:`, err.message);
    }
  }

  console.log(`✅ Đã tạo thành công ${createdCount} đơn hàng mới phân bổ qua 30 ngày.`);
  console.log('=== HOÀN TẤT SEED DỮ LIỆU BÁO CÁO ===');
}

seedReportsData()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
