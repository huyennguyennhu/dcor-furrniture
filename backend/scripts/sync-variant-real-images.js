const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { PrismaClient } = require('@prisma/client');

dotenv.config({ path: path.resolve(__dirname, '../.env') });
const prisma = new PrismaClient();

const RAW_DATA_PATH = 'C:\\hk1nam4\\WEB nâng cao\\ĐỒ ÁN\\Raw Data\\scratch_filtered_209_products.json';
const CACHE_PATH = 'C:\\hk1nam4\\WEB nâng cao\\ĐỒ ÁN\\Raw Data\\scratch_cloudinary_cache.json';
const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || 'yqbkibfq';

// Helper tạo URL Cloudinary Fetch chuẩn WebP
function getCloudinaryVariantUrl(origUrl) {
  if (!origUrl || typeof origUrl !== 'string') return null;
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/fetch/f_webp,q_auto:good/${origUrl.trim()}`;
}

function getCloudinarySwatchUrl(origUrl) {
  if (!origUrl || typeof origUrl !== 'string') return null;
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/fetch/w_100,h_100,c_fill,f_webp,q_auto:good/${origUrl.trim()}`;
}

// Pool thực thi đồng thời
async function mapConcurrent(items, concurrency, asyncFn) {
  const results = new Array(items.length);
  let currentIndex = 0;

  async function worker() {
    while (currentIndex < items.length) {
      const idx = currentIndex++;
      results[idx] = await asyncFn(items[idx], idx);
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

async function main() {
  console.log('================================================================');
  console.log(' BẮT ĐẦU CẬP NHẬT ẢNH THẬT RIÊNG BIỆT CHO TỪNG BIẾN THỂ & SWATCH');
  console.log(` Cloudinary: ${CLOUD_NAME}`);
  console.log('================================================================\n');

  if (!fs.existsSync(RAW_DATA_PATH) || !fs.existsSync(CACHE_PATH)) {
    console.error('Không tìm thấy file Raw Data hoặc Cache!');
    process.exit(1);
  }

  const rawProducts = JSON.parse(fs.readFileSync(RAW_DATA_PATH, 'utf8'));
  const cache = JSON.parse(fs.readFileSync(CACHE_PATH, 'utf8'));

  // Tạo map tra cứu dsasf753c -> link BoConcept gốc
  const cldToOrig = new Map();
  for (const [orig, cld] of Object.entries(cache)) {
    cldToOrig.set(cld.trim(), orig.trim());
  }
  console.log(`Đã nạp ${cldToOrig.size} ánh xạ swatch từ cache.`);

  // Tạo map tra cứu SKU -> originalImages từ raw data
  const skuToOrigImages = new Map();
  for (const p of rawProducts) {
    for (const v of (p.variants || [])) {
      if (v.sku && Array.isArray(v.originalImages) && v.originalImages.length > 0) {
        skuToOrigImages.set(v.sku.trim(), v.originalImages);
      }
    }
  }
  console.log(`Đã nạp ${skuToOrigImages.size} biến thể có ảnh gốc riêng biệt.`);

  // --------------------------------------------------------------------------
  // BƯỚC 1: CẬP NHẬT CONFIGOPTIONS CHO SẢN PHẨM (SWATCH MÀU & CHẤT LIỆU)
  // --------------------------------------------------------------------------
  console.log('\n>>> [1/2] Đang cập nhật configOptions (swatch màu/vải) cho các sản phẩm...');
  const dbProducts = await prisma.product.findMany({
    select: { id: true, slug: true, name: true, configOptions: true }
  });

  let updatedProducts = 0;
  for (const p of dbProducts) {
    if (!p.configOptions || typeof p.configOptions !== 'object') continue;
    let changed = false;
    const cfg = JSON.parse(JSON.stringify(p.configOptions));

    for (const attr of (cfg.attributes || [])) {
      for (const opt of (attr.options || [])) {
        if (opt.image && typeof opt.image === 'string' && opt.image.includes('dsasf753c')) {
          const origUrl = cldToOrig.get(opt.image.trim());
          if (origUrl) {
            opt.image = getCloudinarySwatchUrl(origUrl);
            changed = true;
          } else {
            // Nếu không tìm thấy ánh xạ, xóa link hỏng để hiển thị hexColor
            opt.image = null;
            changed = true;
          }
        }
      }
    }

    if (changed) {
      await prisma.product.update({
        where: { id: p.id },
        data: { configOptions: cfg }
      });
      updatedProducts++;
    }
  }
  console.log(` Đã cập nhật xong swatch màu cho ${updatedProducts} sản phẩm trong Database.`);

  // --------------------------------------------------------------------------
  // BƯỚC 2: CẬP NHẬT ẢNH RIÊNG CHO TỪNG BIẾN THỂ TRONG DATABASE
  // --------------------------------------------------------------------------
  console.log('\n>>> [2/2] Đang cập nhật ảnh riêng biệt cho từng biến thể...');
  const dbVariants = await prisma.productVariant.findMany({
    select: { id: true, sku: true, optionValues: true }
  });
  console.log(`Tìm thấy ${dbVariants.length} biến thể trong DB.`);

  let updatedVariants = 0;
  let skippedVariants = 0;

  // Lọc danh sách các biến thể có ảnh gốc
  const variantsToUpdate = [];
  for (const v of dbVariants) {
    const origImgs = skuToOrigImages.get(v.sku?.trim());
    if (origImgs && origImgs.length > 0) {
      const newUrls = origImgs.map(getCloudinaryVariantUrl).filter(Boolean);
      if (newUrls.length > 0) {
        variantsToUpdate.push({
          id: v.id,
          sku: v.sku,
          optionValues: v.optionValues,
          newUrls
        });
      }
    } else {
      skippedVariants++;
    }
  }

  console.log(`Số biến thể sẽ cập nhật ảnh riêng: ${variantsToUpdate.length} (Bỏ qua: ${skippedVariants})`);

  let progress = 0;
  await mapConcurrent(variantsToUpdate, 20, async (item) => {
    let opt = typeof item.optionValues === 'string'
      ? JSON.parse(item.optionValues)
      : (item.optionValues || {});

    opt.images = item.newUrls;

    await prisma.productVariant.update({
      where: { id: item.id },
      data: { optionValues: opt }
    });

    progress++;
    if (progress % 100 === 0 || progress === variantsToUpdate.length) {
      process.stdout.write(`\rTiến độ cập nhật biến thể: ${progress}/${variantsToUpdate.length} (${Math.round(progress * 100 / variantsToUpdate.length)}%)...`);
    }
  });

  console.log(`\n\n🎉 HOÀN THÀNH TOÀN BỘ QUY TRÌNH!`);
  console.log(`- Sản phẩm cập nhật swatch: ${updatedProducts}`);
  console.log(`- Biến thể cập nhật ảnh riêng biệt: ${variantsToUpdate.length}`);
  console.log(`Giờ đây khi đổi biến thể, hình ảnh sẽ lập tức thay đổi theo đúng mẫu mã!`);

  await prisma.$disconnect();
  process.exit(0);
}

main().catch(err => {
  console.error('Lỗi quy trình:', err);
  prisma.$disconnect();
  process.exit(1);
});

