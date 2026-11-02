const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

async function main() {
  console.log('>>> Bắt đầu làm sạch toàn bộ ảnh biến thể trong Database...');
  
  // Lấy tất cả sản phẩm kèm biến thể
  const products = await prisma.product.findMany({
    select: {
      id: true,
      name: true,
      images: true,
      variants: {
        select: {
          id: true,
          sku: true,
          optionValues: true
        }
      }
    }
  });

  console.log(`Tìm thấy ${products.length} sản phẩm.`);

  let totalUpdated = 0;

  for (const p of products) {
    const prodImages = Array.isArray(p.images) && p.images.length > 0 ? p.images : [];
    if (prodImages.length === 0) continue;

    for (const v of p.variants) {
      const opt = typeof v.optionValues === 'string'
        ? JSON.parse(v.optionValues)
        : (v.optionValues || {});

      const currentImgs = Array.isArray(opt.images) ? opt.images : [];
      const hasOldCloud = currentImgs.some(u => typeof u === 'string' && u.includes('dsasf753c'));

      if (hasOldCloud || currentImgs.length === 0) {
        // Lọc bỏ dsasf753c
        const validImgs = currentImgs.filter(u => typeof u === 'string' && !u.includes('dsasf753c') && !u.includes('assets.boconcept.com'));
        
        // Nếu không còn ảnh nào hợp lệ, gán bằng ảnh của sản phẩm cha
        opt.images = validImgs.length > 0 ? validImgs : prodImages;

        await prisma.productVariant.update({
          where: { id: v.id },
          data: { optionValues: opt }
        });
        totalUpdated++;
      }
    }
  }

  console.log(`\n🎉 Đã cập nhật thành công ${totalUpdated} biến thể sang link ảnh mới sạch 100%!`);
  await prisma.$disconnect();
}

main().catch(err => {
  console.error('Lỗi:', err);
  prisma.$disconnect();
  process.exit(1);
});

