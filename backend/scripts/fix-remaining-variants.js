const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });
const prisma = new PrismaClient();

const FALLBACK_IMAGE = 'https://res.cloudinary.com/yqbkibfq/image/upload/v1793525289/dcor/products/zlzfwaill5zyvwhp78bh.webp';

async function main() {
  const variants = await prisma.productVariant.findMany({
    include: {
      product: {
        select: {
          id: true,
          name: true,
          images: true
        }
      }
    }
  });

  const badVariants = variants.filter(v => JSON.stringify(v.optionValues || {}).includes('dsasf753c'));
  console.log(`Tìm thấy ${badVariants.length} biến thể còn chứa dsasf753c`);

  for (const v of badVariants) {
    console.log(`Product: ${v.product?.name} (id: ${v.productId}), Variant SKU: ${v.sku}`);
    let opt = typeof v.optionValues === 'string' ? JSON.parse(v.optionValues) : (v.optionValues || {});
    let str = JSON.stringify(opt);
    
    // Thay thế toàn bộ chuỗi dsasf753c hoặc link hỏng bằng fallback
    const prodImgs = Array.isArray(v.product?.images) && v.product.images.length > 0
      ? v.product.images
      : [FALLBACK_IMAGE];

    // Làm sạch mảng images trong opt
    if (Array.isArray(opt.images)) {
      opt.images = opt.images.map(img => {
        if (typeof img === 'string' && img.includes('dsasf753c')) {
          return prodImgs[0];
        }
        return img;
      });
    } else {
      opt.images = prodImgs;
    }

    // Làm sạch cả các field khác nếu có link dsasf753c (ví dụ swatch image)
    const cleanObject = (obj) => {
      for (const k in obj) {
        if (typeof obj[k] === 'string' && obj[k].includes('dsasf753c')) {
          obj[k] = FALLBACK_IMAGE;
        } else if (typeof obj[k] === 'object' && obj[k] !== null) {
          cleanObject(obj[k]);
        }
      }
    };
    cleanObject(opt);

    // Cập nhật lại sản phẩm cha nếu cha chưa có ảnh
    if (!v.product?.images || v.product.images.length === 0) {
      await prisma.product.update({
        where: { id: v.productId },
        data: { images: [FALLBACK_IMAGE] }
      });
      console.log(`  -> Đã cập nhật ảnh fallback cho sản phẩm cha: ${v.product?.name}`);
    }

    await prisma.productVariant.update({
      where: { id: v.id },
      data: { optionValues: opt }
    });
    console.log(`  -> Đã làm sạch biến thể ${v.sku}`);
  }

  console.log('Hoàn thành xử lý toàn bộ biến thể tồn đọng!');
  await prisma.$disconnect();
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  prisma.$disconnect();
  process.exit(1);
});

