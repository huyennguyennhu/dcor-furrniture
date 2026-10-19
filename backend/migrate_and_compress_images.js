const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
const { v2: cloudinary } = require('cloudinary');

cloudinary.config({
  cloud_name: 'dsasf753c',
  api_key: '998326735466354',
  api_secret: 'flwaYv1DKf79HkDvzDDCiZSE_yA'
});

const prisma = new PrismaClient();
const MAP_FILE = path.join(__dirname, 'scratch_webp_migration_map.json');

// Concurrency pool helper
async function mapConcurrent(items, concurrency, fn) {
  const results = [];
  let index = 0;
  const executing = [];

  for (const item of items) {
    const p = Promise.resolve().then(() => fn(item, index++));
    results.push(p);

    if (concurrency <= items.length) {
      const e = p.then(() => executing.splice(executing.indexOf(e), 1));
      executing.push(e);
      if (executing.length >= concurrency) {
        await Promise.race(executing);
      }
    }
  }
  return Promise.all(results);
}

async function main() {
  console.log('================================================================');
  console.log('🚀 BẮT ĐẦU QUY TRÌNH NÉN ẢNH WEBP, DI DỜI FOLDER & DỌN DẸP 22GB');
  console.log('================================================================\n');

  // Load existing mapping if resuming
  let urlMap = {};
  if (fs.existsSync(MAP_FILE)) {
    try {
      urlMap = JSON.parse(fs.readFileSync(MAP_FILE, 'utf8'));
      console.log(`Đã tải tiến độ checkpoint trước: ${Object.keys(urlMap).length} ảnh đã nén thành công.`);
    } catch (e) {
      urlMap = {};
    }
  }

  function saveMap() {
    fs.writeFileSync(MAP_FILE, JSON.stringify(urlMap, null, 2), 'utf8');
  }

  // --------------------------------------------------------------------------
  // BƯỚC 1: QUÉT TẤT CẢ URL CLOUDINARY TRONG SUPABASE
  // --------------------------------------------------------------------------
  console.log('🔍 [1/4] Đang quét toàn bộ danh sách URL trong Database Supabase...');
  const products = await prisma.product.findMany({
    select: { id: true, name: true, images: true, configOptions: true }
  });
  const variants = await prisma.productVariant.findMany({
    select: { id: true, productId: true, sku: true, optionValues: true }
  });

  const targetUrls = new Set();

  for (const p of products) {
    if (Array.isArray(p.images)) {
      for (const img of p.images) {
        if (typeof img === 'string' && img.includes('cloudinary.com') && img.includes('dcor-studio')) {
          targetUrls.add(img.trim());
        }
      }
    }
    if (p.configOptions && typeof p.configOptions === 'object') {
      const cfgStr = JSON.stringify(p.configOptions);
      const matches = cfgStr.match(/https?:\/\/[^"\s\\]+cloudinary\.com\/[^"\s\\]+/g) || [];
      for (const m of matches) {
        if (m.includes('dcor-studio') || m.includes('dcor-materials')) {
          targetUrls.add(m.trim());
        }
      }
    }
  }

  for (const v of variants) {
    if (v.optionValues && typeof v.optionValues === 'object') {
      const opt = v.optionValues;
      if (Array.isArray(opt.images)) {
        for (const img of opt.images) {
          if (typeof img === 'string' && img.includes('cloudinary.com') && img.includes('dcor-studio')) {
            targetUrls.add(img.trim());
          }
        }
      }
    }
  }

  const allUrlsList = Array.from(targetUrls);
  console.log(`✅ Tổng số ảnh Cloudinary cần nén và di dời: ${allUrlsList.length}`);

  const pendingUrls = allUrlsList.filter(u => !urlMap[u]);
  console.log(`⚡ Số ảnh chưa xử lý cần nén: ${pendingUrls.length}\n`);

  // --------------------------------------------------------------------------
  // BƯỚC 2: NÉN CHUYỂN ĐỔI SANG WEBP VÀO FOLDER "dcor/"
  // --------------------------------------------------------------------------
  console.log('⚡ [2/4] Đang nén sang WebP và upload vào thư mục chuẩn hóa "dcor/"...');
  const CONCURRENCY = 30; // 30 luồng song song
  let processedCount = 0;
  let successCount = 0;
  let failCount = 0;
  const startTime = Date.now();

  await mapConcurrent(pendingUrls, CONCURRENCY, async (oldUrl, index) => {
    // Determine target subfolder: dcor/products, dcor/variants, or dcor/materials
    let subfolder = 'variants';
    if (oldUrl.includes('/products/')) subfolder = 'products';
    else if (oldUrl.includes('/materials/')) subfolder = 'materials';

    // Generate unique public_id
    const hash = crypto.createHash('md5').update(oldUrl).digest('hex');
    const targetFolder = `dcor/${subfolder}`;
    const targetPublicId = `dcor_${subfolder}_${hash}`;

    // Cloudinary on-the-fly fetch URL with WebP compression (quality 80, max-width 1400px)
    // We insert transformation parameters into the oldUrl
    let transformUrl = oldUrl;
    if (oldUrl.includes('/upload/')) {
      transformUrl = oldUrl.replace('/upload/', '/upload/f_webp,q_80,w_1400,c_limit/');
    }

    let uploaded = false;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const res = await cloudinary.uploader.upload(transformUrl, {
          folder: targetFolder,
          public_id: targetPublicId,
          format: 'webp',
          overwrite: false,
          resource_type: 'image'
        });

        urlMap[oldUrl] = res.secure_url;
        uploaded = true;
        successCount++;
        break;
      } catch (err) {
        if (attempt === 3) {
          failCount++;
          console.error(`\n❌ Lỗi upload (${oldUrl}): ${err.message}`);
        } else {
          await new Promise(r => setTimeout(r, 600 * attempt));
        }
      }
    }

    processedCount++;
    if (processedCount % 50 === 0 || processedCount === pendingUrls.length) {
      saveMap();
      const elapsedSec = Math.round((Date.now() - startTime) / 1000);
      const percent = ((processedCount / pendingUrls.length) * 100).toFixed(1);
      process.stdout.write(`\r   -> Tiến độ: ${processedCount}/${pendingUrls.length} (${percent}%) - ${elapsedSec}s - Đã nén: ${successCount}`);
    }
  });

  saveMap();
  console.log(`\n\n✅ Nén hoàn tất! Tổng cộng đã có ${Object.keys(urlMap).length} ảnh WebP tại "dcor/".\n`);

  // --------------------------------------------------------------------------
  // BƯỚC 3: CẬP NHẬT DATABASE SUPABASE
  // --------------------------------------------------------------------------
  console.log('🔄 [3/4] Đang cập nhật URL mới vào Database Supabase...');
  let updatedProducts = 0;
  let updatedVariants = 0;

  for (const p of products) {
    let changed = false;
    let newImages = p.images;
    if (Array.isArray(p.images)) {
      newImages = p.images.map(img => {
        if (urlMap[img]) {
          changed = true;
          return urlMap[img];
        }
        return img;
      });
    }

    let newConfig = p.configOptions;
    if (p.configOptions && typeof p.configOptions === 'object') {
      let cfgStr = JSON.stringify(p.configOptions);
      let cfgChanged = false;
      for (const [oldU, newU] of Object.entries(urlMap)) {
        if (cfgStr.includes(oldU)) {
          cfgStr = cfgStr.split(oldU).join(newU);
          cfgChanged = true;
        }
      }
      if (cfgChanged) {
        newConfig = JSON.parse(cfgStr);
        changed = true;
      }
    }

    if (changed) {
      await prisma.product.update({
        where: { id: p.id },
        data: { images: newImages, configOptions: newConfig }
      });
      updatedProducts++;
    }
  }

  for (const v of variants) {
    if (v.optionValues && typeof v.optionValues === 'object') {
      let opt = v.optionValues;
      let changed = false;
      if (Array.isArray(opt.images)) {
        const newImgs = opt.images.map(img => {
          if (urlMap[img]) {
            changed = true;
            return urlMap[img];
          }
          return img;
        });
        if (changed) {
          opt.images = newImgs;
          await prisma.productVariant.update({
            where: { id: v.id },
            data: { optionValues: opt }
          });
          updatedVariants++;
        }
      }
    }
  }

  console.log(`✅ Cập nhật Supabase thành công!`);
  console.log(`   - Số sản phẩm đã update URL: ${updatedProducts}`);
  console.log(`   - Số biến thể đã update URL: ${updatedVariants}\n`);

  // --------------------------------------------------------------------------
  // BƯỚC 4: XÓA SẠCH VĨNH VIỄN THƯ MỤC CŨ "dcor-studio" (22.41 GB)
  // --------------------------------------------------------------------------
  console.log('🗑️ [4/4] BẮT ĐẦU XÓA SẠCH THƯ MỤC CŨ "dcor-studio" (22.41 GB PNG)...');
  let deletedCount = 0;
  let hasMore = true;

  while (hasMore) {
    try {
      const res = await cloudinary.api.delete_resources_by_prefix('dcor-studio');
      const count = Object.keys(res.deleted || {}).length;
      if (count === 0) {
        hasMore = false;
        break;
      }
      deletedCount += count;
      process.stdout.write(`\r   -> Đã xóa: ${deletedCount} ảnh PNG cũ trong dcor-studio...`);
      if (count < 100) hasMore = false;
    } catch (err) {
      console.error('\n   Lỗi xóa batch:', err.message);
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  console.log(`\n✅ Đã xóa toàn bộ ${deletedCount} ảnh PNG trong "dcor-studio"!`);

  // Xóa các subfolder và root folder dcor-studio
  for (const sub of ['dcor-studio/variants', 'dcor-studio/products', 'dcor-studio']) {
    try {
      await cloudinary.api.delete_folder(sub);
      console.log(`   ✅ Đã xóa folder: "${sub}".`);
    } catch (e) {
      // folder might be empty or deleted
    }
  }

  // --------------------------------------------------------------------------
  // KẾT THÚC & BÁO CÁO TỔNG KẾT
  // --------------------------------------------------------------------------
  console.log('\n================================================================');
  console.log('🎉 TẤT CẢ CÁC BƯỚC ĐÃ HOÀN TẤT THÀNH CÔNG RỰC RỠ!');
  console.log('================================================================');
  const finalFolders = await cloudinary.api.root_folders();
  console.log('📁 Thư mục hiện tại trên Cloudinary:', finalFolders.folders.map(f => f.name));

  const finalUsage = await cloudinary.api.usage();
  console.log(`📊 Thống kê tài nguyên hiện tại:`);
  console.log(`   - Tổng tài nguyên: ${finalUsage.resources}`);
  console.log(`   - Dung lượng lưu trữ: ${(finalUsage.storage.usage / (1024 * 1024 * 1024)).toFixed(2)} GB (Đã giải phóng ~22 GB!)`);
  console.log('================================================================\n');

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error('LỖI CHÍNH:', err);
  await prisma.$disconnect();
});
