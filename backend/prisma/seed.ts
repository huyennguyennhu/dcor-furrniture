import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const DATA_DIR = 'd:/00_LEARNING/0_Study/HocChinhUEL/4_1_LapTrinhWebNangCao/DoAn/Data/Code/Data';

// Hàm đọc JSON
function readJson(filename: string) {
  const filePath = path.join(DATA_DIR, filename);
  if (fs.existsSync(filePath)) {
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  }
  return [];
}

// Chuyển Slug từ URL thành dạng text gạch nối
function extractSlug(url: string) {
  if (!url) return 'slug-' + Date.now();
  const parts = url.split('/').filter(p => p.trim() !== '');
  return parts[parts.length - 1] || 'slug-' + Date.now();
}

async function main() {
  console.log('Bắt đầu xóa dữ liệu cũ...');
  // Xóa theo thứ tự để không bị lỗi khóa ngoại (Foreign Key)
  await prisma.cartItem.deleteMany();
  await prisma.orderStatusHistory.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.paymentTransaction.deleteMany();
  await prisma.order.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.staffUser.deleteMany();
  
  console.log('Đã xóa xong. Bắt đầu Seed dữ liệu...');

  // 1. Seed Categories (Root)
  const rawCategories = readJson('CATEGORIES.json');
  console.log(`Tìm thấy ${rawCategories.length} Categories gốc.`);
  
  // Lưu trữ map ID cũ (trong JSON) với ID mới (UUID trong DB)
  const categoryIdMap = new Map<number, string>();
  
  for (const rc of rawCategories) {
    const slug = extractSlug(rc.slug) + '-' + rc.category_id;
    const cat = await prisma.category.create({
      data: {
        name: rc.name,
        slug: slug,
      }
    });
    categoryIdMap.set(rc.category_id, cat.id);
  }

  // 2. Seed Subcategories
  const rawSubcategories = readJson('SUBCATEGORIES.json');
  console.log(`Tìm thấy ${rawSubcategories.length} Subcategories.`);
  const subcategoryIdMap = new Map<number, string>();

  for (const rsc of rawSubcategories) {
    const parentId = categoryIdMap.get(rsc.category_id);
    if (parentId) {
      const slug = extractSlug(rsc.slug) + '-sub-' + rsc.subcategory_id;
      const subcat = await prisma.category.create({
        data: {
          name: rsc.name,
          slug: slug,
          parentId: parentId
        }
      });
      subcategoryIdMap.set(rsc.subcategory_id, subcat.id);
    }
  }

  // 3. Seed Products (Giới hạn 5 SP mỗi Subcategory)
  const rawProducts = readJson('PRODUCTS.json');
  const rawVariants = readJson('PRODUCT_VARIANTS.json'); // Lấy biến thể luôn

  const productsBySubcat = new Map<number, any[]>();
  for (const rp of rawProducts) {
    if (!productsBySubcat.has(rp.subcategory_id)) {
      productsBySubcat.set(rp.subcategory_id, []);
    }
    productsBySubcat.get(rp.subcategory_id)?.push(rp);
  }

  console.log('Đang Seed Products và Variants (Tối đa 5 SP/SubCategory)...');
  let productCount = 0;
  for (const [subcatId, prods] of Array.from(productsBySubcat.entries())) {
    const dbCategoryId = subcategoryIdMap.get(subcatId);
    if (!dbCategoryId) continue;

    // Lấy tối đa 5 sản phẩm đầu tiên
    const selectedProds = prods.slice(0, 5);
    for (const rp of selectedProds) {
      // Tìm danh sách variants của SP này
      const prodVariants = rawVariants.filter((v: any) => v.product_id === rp.product_id);
      
      const slug = extractSlug(rp.slug) + '-p' + rp.product_id;
      
      const dbProduct = await prisma.product.create({
        data: {
          name: rp.name,
          slug: slug,
          categoryId: dbCategoryId,
          basePrice: rp.base_price || 0,
          description: rp.material,
          images: rp.image ? [rp.image] : [],
        }
      });
      productCount++;

      // Seed Variants cho SP này (tối đa 3 variant cho nhẹ)
      const selectedVariants = prodVariants.slice(0, 3);
      for (const rv of selectedVariants) {
        await prisma.productVariant.create({
          data: {
            productId: dbProduct.id,
            sku: 'SKU-' + rv.variant_id,
            price: rv.price || dbProduct.basePrice,
            stock: Math.floor(Math.random() * 50) + 5, // Random 5-54 cái
            name: rv.name || 'Phân loại mặc định',
          }
        });
      }
    }
  }
  console.log(`Đã seed ${productCount} Products cùng các Variants.`);

  // 4. Seed Khách hàng (Customers) theo yêu cầu
  console.log('Đang tạo tài khoản Khách hàng (Users)...');

  // a. Đã đăng ký (Tạo xong có sdt và mật khẩu)
  // Mật khẩu được mã hóa bằng bcrypt với salt = 10 vòng
  const hashedPassword = bcrypt.hashSync('123456aA@', 10);
  
  const regUser = await prisma.customer.create({
    data: {
      fullName: 'Nguyễn Văn Đã Đăng Ký',
      email: 'khachhang@dcor.vn',
      phone: '0901234567',
      passwordHash: hashedPassword,
      isPhoneVerified: true,
    }
  });

  // b. Đăng nhập bằng Gmail (Google OAuth)
  await prisma.customer.create({
    data: {
      fullName: 'Huyền Oauth Google',
      email: 'huyennn23406@st.uel.edu.vn',
      // Khi login Google thường ko có pass, SĐT sẽ để trống hoặc nhập sau (tạm fake 1 số)
      phone: '0999999999',
    }
  });

  // c. Khách mua hàng khi chưa đăng nhập (Guest) 
  // - Guest ko có password, nhưng để lại SDT lúc thanh toán
  await prisma.customer.create({
    data: {
      fullName: 'Khách Vãng Lai',
      email: 'guest_9999@guest.com', // Fake email để hệ thống bắt buộc có
      phone: '0988777666',          // <--- SĐT của khách Guest
      passwordHash: null,
    }
  });

  // 5. Seed StaffUser (10 Nhân viên)
  console.log('Đang tạo 10 Nhân viên...');
  for (let i = 1; i <= 10; i++) {
    await prisma.staffUser.create({
      data: {
        fullName: i === 1 ? 'Admin Dcor' : `Nhân viên ${i}`,
        email: i === 1 ? 'admin@dcor.vn' : `staff${i}@dcor.vn`,
        phone: `09888888${i.toString().padStart(2, '0')}`,
        passwordHash: hashedPassword,
        role: i === 1 ? 'ADMIN' : (i % 2 === 0 ? 'SALES' : 'CONTENT'),
        status: 'ACTIVE',
      }
    });
  }

  // 6. Địa chỉ giao hàng (10 Địa chỉ ảo cho Customer)
  console.log('Đang tạo 10 Địa chỉ ảo...');
  for (let i = 1; i <= 10; i++) {
    await prisma.address.create({
      data: {
        customerId: regUser.id,
        receiverName: `${regUser.fullName} (Địa chỉ ${i})`,
        phone: `09012345${i.toString().padStart(2, '0')}`,
        province: i % 2 === 0 ? 'Hồ Chí Minh' : 'Hà Nội',
        district: i % 2 === 0 ? 'Quận 1' : 'Quận Đống Đa',
        ward: i % 2 === 0 ? 'Phường Bến Nghé' : 'Phường Ô Chợ Dừa',
        detail: `Số ${i} Đường XYZ`,
        isDefault: i === 1,
      }
    });
  }

  // Lấy vài biến thể sản phẩm để tạo Giỏ hàng & Đơn hàng
  const variants = await prisma.productVariant.findMany({ take: 20, include: { product: true } });

  if (variants.length >= 10) {
    // 7. Giỏ hàng (10 CartItems ảo cho regUser)
    console.log('Đang tạo 10 Giỏ hàng ảo...');
    for (let i = 0; i < 10; i++) {
      await prisma.cartItem.create({
        data: {
          customerId: regUser.id,
          variantId: variants[i].id,
          quantity: Math.floor(Math.random() * 5) + 1,
          selectedOptions: i % 2 === 0 ? {
            leg: { id: 'leg-1', name: 'Gỗ sồi tự nhiên', price: 0 },
            upholstery: { id: 'fab-1', name: 'Vải Frisco màu xám nhạt', price: 1500000 }
          } : {}
        }
      });
    }

    // 8. Đơn hàng (10 Đơn hàng)
    console.log('Đang tạo 10 Đơn hàng ảo...');
    const orderStatuses: any[] = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
    
    for (let i = 0; i < 10; i++) {
      const v1 = variants[i];
      const v2 = variants[19 - i];
      const qty1 = Math.floor(Math.random() * 3) + 1;
      const qty2 = Math.floor(Math.random() * 2) + 1;
      const subTotal = v1.price * qty1 + v2.price * qty2;
      const orderStatus = orderStatuses[i % orderStatuses.length];

      const order = await prisma.order.create({
        data: {
          orderNumber: `ORD-${Date.now()}-${i}`,
          customerId: regUser.id,
          phone: regUser.phone,
          receiverName: regUser.fullName,
          province: 'Hồ Chí Minh',
          detailAddress: `Số ${i} Lê Duẩn`,
          subTotal: BigInt(subTotal),
          shippingFee: BigInt(30000),
          totalAmount: BigInt(subTotal + 30000),
          paymentMethod: i % 2 === 0 ? 'COD' : 'VNPAY',
          status: orderStatus,
          items: {
            create: [
              {
                productId: v1.productId,
                variantId: v1.id,
                productName: v1.product.name,
                imageUrl: 'fake-url.png', 
                quantity: qty1,
                price: v1.price,
                lineTotal: BigInt(v1.price * qty1),
              },
              {
                productId: v2.productId,
                variantId: v2.id,
                productName: v2.product.name,
                imageUrl: 'fake-url.png', 
                quantity: qty2,
                price: v2.price,
                lineTotal: BigInt(v2.price * qty2),
              }
            ]
          },
          statusHistory: {
            create: [
              {
                status: 'PENDING',
                actorType: 'CUSTOMER',
                notes: 'Khách hàng vừa đặt đơn'
              }
            ]
          }
        }
      });

      await prisma.paymentTransaction.create({
        data: {
          orderId: order.id,
          transactionCode: `TXN-${Date.now()}-${i}`,
          amount: order.totalAmount,
          paymentMethod: order.paymentMethod,
          status: order.paymentMethod === 'VNPAY' ? 'SUCCESS' : 'PENDING'
        }
      });
    }
  }

  console.log('----------------------------------------------------');
  console.log('🚀 ĐÃ SEED DỮ LIỆU THÀNH CÔNG!');
  console.log('--- THÔNG TIN TEST ---');
  console.log('1. Khách ĐÃ ĐĂNG KÝ: SĐT: 0901234567 | Pass: 123456aA@');
  console.log('2. Khách GMAIL OAUTH: Email: huyennn23406@st.uel.edu.vn (Login qua Google)');
  console.log('3. Khách GUEST (Chưa đăng nhập): SĐT: 0988777666');
  console.log('----------------------------------------------------');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
