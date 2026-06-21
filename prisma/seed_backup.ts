import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('=== BẮT ĐẦU SEED DỮ LIỆU CƠ SỞ DỮ LIỆU ===');

  console.log('- Đang tạo các tài khoản mẫu...');
  const admin = await prisma.user.upsert({
    where: { phone: '0999999999' },
    update: {},
    create: {
      fullName: 'D\'Cor Administrator',
      phone: '0999999999',
      email: 'admin@dcor.vn',
      role: 'ADMIN'
    }
  });
  console.log(`  [OK] Tạo tài khoản Admin: ${admin.fullName} (${admin.phone})`);

  const customer = await prisma.user.upsert({
    where: { phone: '0901234567' },
    update: {},
    create: {
      fullName: 'Nguyễn Văn Minh',
      phone: '0901234567',
      email: 'minh.nguyen@gmail.com',
      role: 'CUSTOMER'
    }
  });
  console.log(`  [OK] Tạo tài khoản Khách hàng: ${customer.fullName} (${customer.phone})`);

  console.log('- Đang import danh sách sản phẩm từ catalog.json...');
  const catalogPath = path.join(__dirname, '../lib/data/catalog.json');
  const configPath = path.join(__dirname, '../lib/data/config.json');
  const pricesPath = path.join(__dirname, '../lib/data/prices.json');

  if (!fs.existsSync(catalogPath)) {
    console.log('  [Lỗi] Không tìm thấy file catalog.json tại: ' + catalogPath);
    return;
  }

  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'));
  const config = fs.existsSync(configPath) ? JSON.parse(fs.readFileSync(configPath, 'utf-8')) : null;
  const prices = fs.existsSync(pricesPath) ? JSON.parse(fs.readFileSync(pricesPath, 'utf-8')) : null;

  console.log('- Đang xóa toàn bộ sản phẩm cũ trong Database...');
  await prisma.product.deleteMany({});
  console.log('  [OK] Đã xóa xong.');

  for (const p of catalog) {
    const pid = p.id || p.productId; // handle both id and productId depending on json version
    // Đảm bảo slug là duy nhất bằng cách nối thêm ID (do có nhiều biến thể trùng slug)
    const pSlug = p.slug ? `${p.slug}-${pid}`.toLowerCase() : pid.toLowerCase();
    
    let success = false;
    let retries = 3;
    while (!success && retries > 0) {
      try {
        const product = await prisma.product.upsert({
          where: { id: pid },
          update: {
            name: p.shortDescription || p.name || 'Sản phẩm',
            description: [p.description || p.shortDescription || p.name || 'Mô tả đang cập nhật...'],
            configOptions: p.configOptions || [],
            variants: p.variants || [],
            videos: p.videos || []
          },
          create: {
            id: pid,
            slug: pSlug,
            name: p.shortDescription || p.name || 'Sản phẩm',
            description: [p.description || p.shortDescription || p.name || 'Mô tả đang cập nhật...'],
            basePrice: p.prices?.[0]?.price || p.basePrice || 0,
            configOptions: p.configOptions || [],
            variants: p.variants || [],
            videos: p.videos || []
          }
        });
        console.log(`  [OK] Đã import sản phẩm: ${product.name} (ID: ${product.id})`);
        success = true;
      } catch (err: any) {
        retries--;
        console.log(`  [Lỗi] Kết nối gián đoạn ở sản phẩm ${pid}. Thử lại... (còn ${retries} lần)`);
        await new Promise(r => setTimeout(r, 2000)); // Nghỉ 2s
      }
    }
  }

  console.log('=== HOÀN TẤT SEED DỮ LIỆU THÀNH CÔNG ===');
}

main()
  .catch((e) => {
    console.error('Lỗi khi chạy seed data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
