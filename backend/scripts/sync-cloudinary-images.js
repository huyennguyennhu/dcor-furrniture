/**
 * Script nén WebP và nạp ảnh gốc BoConcept lên Cloudinary mới,
 * sau đó tự động cập nhật URL vào cơ sở dữ liệu PostgreSQL Supabase.
 * 
 * Sử dụng:
 *   node backend/scripts/sync-cloudinary-images.js --products-only  (Đồng bộ ảnh đại diện 209 sản phẩm, siêu tốc ~1.5 phút)
 *   node backend/scripts/sync-cloudinary-images.js                 (Đồng bộ toàn bộ sản phẩm + 2.128 biến thể)
 */

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

const RAW_DATA_PATH = 'C:\\hk1nam4\\WEB nâng cao\\ĐỒ ÁN\\Raw Data\\scratch_filtered_209_products.json';
const CACHE_FILE = path.resolve(__dirname, 'cloudinary-cache.json');

// Khởi tạo hoặc đọc cache đã upload để không bao giờ bị upload trùng
let urlCache = {};
if (fs.existsSync(CACHE_FILE)) {
  try {
    urlCache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
    console.log(`[Cache] Đã nạp ${Object.keys(urlCache).length} link ảnh đã upload trước đó.`);
  } catch (e) {
    urlCache = {};
  }
}

function saveCache() {
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(urlCache, null, 2), 'utf8');
  } catch (e) {
    console.error('Không thể lưu file cache:', e.message);
  }
}

// Upload 1 ảnh BoConcept lên Cloudinary mới (Nén WebP + Giới hạn chiều rộng 1200px)
async function uploadToCloudinary(boconceptUrl, retries = 3) {
  if (!boconceptUrl || typeof boconceptUrl !== 'string') return null;

  if (urlCache[boconceptUrl]) {
    return urlCache[boconceptUrl];
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await cloudinary.uploader.upload(boconceptUrl, {
        folder: 'dcor/products',
        format: 'webp',
        transformation: [
          { width: 1200, crop: 'limit' },
          { quality: 'auto:good' }
        ]
      });

      const newUrl = res.secure_url;
      urlCache[boconceptUrl] = newUrl;
      return newUrl;
    } catch (err) {
      if (attempt === retries) {
        console.warn(`\n[Bỏ qua] Lỗi upload ảnh: ${err.message}`);
        return null;
      }
      await new Promise(r => setTimeout(r, 1000 * attempt));
    }
  }
  return null;
}

// Queue xử lý đồng thời với số worker giới hạn (Concurrency pool)
async function mapConcurrent(items, concurrency, asyncFn) {
  const results = new Array(items.length);
  let currentIndex = 0;

  async function worker() {
    while (currentIndex < items.length) {
      const index = currentIndex++;
      results[index] = await asyncFn(items[index], index);
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

async function main() {
  const isProductsOnly = process.argv.includes('--products-only');

  console.log('================================================================');
  console.log(' BẮT ĐẦU ĐỒNG BỘ ẢNH LÊN CLOUDINARY MỚI & CẬP NHẬT DATABASE');
  console.log(` Cloudinary: ${process.env.CLOUDINARY_CLOUD_NAME}`);
  console.log(` Chế độ: ${isProductsOnly ? 'Chỉ cập nhật ảnh đại diện sản phẩm (--products-only)' : 'Cập nhật toàn bộ (Sản phẩm + Biến thể)'}`);
  console.log('================================================================\n');

  if (!fs.existsSync(RAW_DATA_PATH)) {
    console.error(`Không tìm thấy file dữ liệu tại: ${RAW_DATA_PATH}`);
    process.exit(1);
  }

  const rawProducts = JSON.parse(fs.readFileSync(RAW_DATA_PATH, 'utf8'));
  console.log(`Đã đọc ${rawProducts.length} sản phẩm từ file Raw Data.\n`);

  // ==========================================================================
  // GIAI ĐOẠN 1: ĐỒNG BỘ ẢNH ĐẠI DIỆN CHÍNH CHO TẤT CẢ 209 SẢN PHẨM
  // ==========================================================================
  console.log('>>> [Giai đoạn 1]: Thu thập danh sách ảnh đại diện của 209 sản phẩm...');
  const primaryUrlsSet = new Set();
  const productImgsMap = new Map(); // slug -> [url1, url2]

  for (const rawProd of rawProducts) {
    const firstVar = rawProd.variants?.[0];
    const originalImgs = (firstVar?.originalImages || []).slice(0, 3);
    if (originalImgs.length > 0) {
      productImgsMap.set(rawProd.slug, originalImgs);
      originalImgs.forEach(u => primaryUrlsSet.add(u));
    }
  }

  const uniquePrimaryUrls = Array.from(primaryUrlsSet);
  const needUploadPrimary = uniquePrimaryUrls.filter(u => !urlCache[u]);
  console.log(`- Tổng số ảnh đại diện duy nhất: ${uniquePrimaryUrls.length}`);
  console.log(`- Đã có sẵn trong cache: ${uniquePrimaryUrls.length - needUploadPrimary.length}`);
  console.log(`- Cần upload mới lên Cloudinary: ${needUploadPrimary.length}\n`);

  if (needUploadPrimary.length > 0) {
    console.log(`Đang upload song song (5 luồng) ${needUploadPrimary.length} ảnh lên Cloudinary...`);
    let uploadedCount = 0;
    await mapConcurrent(needUploadPrimary, 5, async (url) => {
      const newUrl = await uploadToCloudinary(url);
      uploadedCount++;
      if (uploadedCount % 10 === 0 || uploadedCount === needUploadPrimary.length) {
        saveCache();
        process.stdout.write(`\r[Upload ảnh đại diện] Tiến độ: ${uploadedCount}/${needUploadPrimary.length} (${Math.round(uploadedCount * 100 / needUploadPrimary.length)}%)...`);
      }
      return newUrl;
    });
    saveCache();
    console.log('\n Upload hoàn tất tất cả ảnh đại diện lên Cloudinary!\n');
  }

  // Cập nhật Database cho 209 sản phẩm
  console.log('Đang cập nhật link ảnh mới vào Database PostgreSQL...');
  let updatedProductsCount = 0;
  for (const [slug, origUrls] of productImgsMap.entries()) {
    const newImgs = origUrls.map(u => urlCache[u]).filter(Boolean);
    if (newImgs.length > 0) {
      try {
        await prisma.product.updateMany({
          where: { slug },
          data: { images: newImgs }
        });
        updatedProductsCount++;
      } catch (err) {
        console.error(`Lỗi cập nhật sản phẩm ${slug}:`, err.message);
      }
    }
  }

  console.log(`\n Hoàn tất Giai đoạn 1: Đã cập nhật ảnh thật thành công cho ${updatedProductsCount} sản phẩm trong Database!\n`);

  if (isProductsOnly) {
    console.log(' Đã hoàn tất chế độ --products-only.');
    console.log(' Bây giờ toàn bộ Trang chủ, Danh mục, Khám phá và Card sản phẩm đã có ảnh thật!');
    await prisma.$disconnect();
    return;
  }

  // ==========================================================================
  // GIAI ĐOẠN 2: ĐỒNG BỘ ẢNH CHI TIẾT CHO 2.128 BIẾN THỂ
  // ==========================================================================
  console.log('>>> [Giai đoạn 2]: Bắt đầu upload và gắn ảnh cho toàn bộ 2.128 biến thể...');
  const allVariantUrlsSet = new Set();
  for (const p of rawProducts) {
    for (const v of (p.variants || [])) {
      (v.originalImages || []).forEach(u => allVariantUrlsSet.add(u));
    }
  }

  const allVariantUrls = Array.from(allVariantUrlsSet);
  const needUploadVariants = allVariantUrls.filter(u => !urlCache[u]);
  console.log(`- Tổng số ảnh biến thể duy nhất: ${allVariantUrls.length}`);
  console.log(`- Đã có sẵn trong cache: ${allVariantUrls.length - needUploadVariants.length}`);
  console.log(`- Cần upload thêm lên Cloudinary: ${needUploadVariants.length}\n`);

  if (needUploadVariants.length > 0) {
    console.log(`Đang upload song song (6 luồng) ${needUploadVariants.length} ảnh biến thể lên Cloudinary...`);
    let upCount = 0;
    await mapConcurrent(needUploadVariants, 6, async (url) => {
      const newUrl = await uploadToCloudinary(url);
      upCount++;
      if (upCount % 20 === 0 || upCount === needUploadVariants.length) {
        saveCache();
        process.stdout.write(`\r[Upload biến thể] Tiến độ: ${upCount}/${needUploadVariants.length} (${Math.round(upCount * 100 / needUploadVariants.length)}%)...`);
      }
      return newUrl;
    });
    saveCache();
    console.log('\n Upload hoàn tất tất cả ảnh biến thể lên Cloudinary!\n');
  }

  // Cập nhật Database cho toàn bộ biến thể
  console.log('Đang cập nhật optionValues.images cho các biến thể trong Database...');
  let totalVariants = 0;
  rawProducts.forEach(p => totalVariants += (p.variants?.length || 0));

  let processedVars = 0;
  let updatedVarsInDb = 0;

  for (const rawProd of rawProducts) {
    for (const v of (rawProd.variants || [])) {
      processedVars++;
      const origImgs = v.originalImages || [];
      if (origImgs.length === 0) continue;

      const newVarImages = origImgs.map(u => urlCache[u]).filter(Boolean);
      if (newVarImages.length > 0) {
        try {
          const dbVar = await prisma.productVariant.findUnique({
            where: { sku: v.sku },
            select: { id: true, optionValues: true }
          });

          if (dbVar) {
            const currentOpt = typeof dbVar.optionValues === 'string'
              ? JSON.parse(dbVar.optionValues)
              : (dbVar.optionValues || {});

            currentOpt.images = newVarImages;

            await prisma.productVariant.update({
              where: { id: dbVar.id },
              data: { optionValues: currentOpt }
            });
            updatedVarsInDb++;
          }
        } catch (e) {
          // Bỏ qua lỗi lẻ
        }
      }

      if (processedVars % 50 === 0 || processedVars === totalVariants) {
        process.stdout.write(`\r[Cập nhật DB] Tiến độ: ${processedVars}/${totalVariants} biến thể (${updatedVarsInDb} đã cập nhật)...`);
      }
    }
  }

  console.log(`\n\n🎉 TẤT CẢ ĐÃ HOÀN TẤT!`);
  console.log(`- Sản phẩm đã cập nhật ảnh chính: ${updatedProductsCount}`);
  console.log(`- Biến thể đã cập nhật ảnh chi tiết: ${updatedVarsInDb}`);
  console.log(`- Tổng số ảnh trên Cloudinary mới: ${Object.keys(urlCache).length}`);

  await prisma.$disconnect();
}

main().catch(err => {
  console.error('\nLỗi nghiêm trọng:', err);
  prisma.$disconnect();
  process.exit(1);
});
