const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const { v2: cloudinary } = require('cloudinary');

cloudinary.config({
  cloud_name: 'dsasf753c',
  api_key: '998326735466354',
  api_secret: 'flwaYv1DKf79HkDvzDDCiZSE_yA'
});

const prisma = new PrismaClient();

async function run() {
  console.log('========================================================');
  console.log('🚀 BẮT ĐẦU QUY TRÌNH DỌN DẸP & TỐI ƯU HÓA CLOUDINARY');
  console.log('========================================================\n');

  // --------------------------------------------------------------------------
  // BƯỚC 1: BACKUP SNAPSHOT DATABASE
  // --------------------------------------------------------------------------
  console.log('📦 [BƯỚC 1] Đang sao lưu snapshot hình ảnh Database Supabase...');
  const products = await prisma.product.findMany({
    select: { id: true, name: true, slug: true, images: true, configOptions: true }
  });
  const variants = await prisma.productVariant.findMany({
    select: { id: true, productId: true, sku: true, optionValues: true }
  });

  const backupData = {
    createdAt: new Date().toISOString(),
    totalProducts: products.length,
    totalVariants: variants.length,
    products,
    variants
  };

  const backupPath = path.join(__dirname, 'backup_db_images_before_compression.json');
  fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2), 'utf8');
  console.log(`✅ Đã lưu file Backup an toàn: ${backupPath}`);
  console.log(`   (Gồm ${products.length} sản phẩm và ${variants.length} biến thể)\n`);

  await prisma.$disconnect();

  // --------------------------------------------------------------------------
  // BƯỚC 2: XÓA SẠCH FOLDER RÁC "room_img"
  // --------------------------------------------------------------------------
  console.log('🧹 [BƯỚC 2A] Đang dọn sạch folder rác: "room_img"...');
  try {
    const delRoomRes = await cloudinary.api.delete_resources_by_prefix('room_img');
    console.log('   Đã xóa ảnh trong room_img:', delRoomRes);
    try {
      await cloudinary.api.delete_folder('room_img');
      console.log('   ✅ Đã xóa hẳn thư mục "room_img".');
    } catch (e) {
      console.log('   (Thư mục room_img đã được làm trống)');
    }
  } catch (err) {
    console.error('   Lỗi khi xóa room_img:', err.message);
  }

  // --------------------------------------------------------------------------
  // BƯỚC 2B: XÓA SẠCH FOLDER RÁC "dcor-products" (5,449 ảnh cũ mồ côi)
  // --------------------------------------------------------------------------
  console.log('\n🧹 [BƯỚC 2B] Đang xóa toàn bộ 5,449 ảnh rác trong "dcor-products"...');
  let deletedTotal = 0;
  let hasMore = true;

  while (hasMore) {
    try {
      // delete_resources_by_prefix deletes in batches of up to 100
      const res = await cloudinary.api.delete_resources_by_prefix('dcor-products');
      const deletedKeys = Object.keys(res.deleted || {});
      const count = deletedKeys.length;

      if (count === 0) {
        hasMore = false;
        break;
      }

      deletedTotal += count;
      process.stdout.write(`\r   -> Đã xóa: ${deletedTotal} ảnh trong dcor-products...`);

      // If less than 100 returned, we are done
      if (count < 100) {
        hasMore = false;
      }
    } catch (err) {
      console.error('\n   Lỗi batch:', err.message);
      // Brief pause then retry
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  console.log(`\n✅ Hoàn tất xóa ${deletedTotal} ảnh rác trong "dcor-products"!`);

  try {
    await cloudinary.api.delete_folder('dcor-products');
    console.log('✅ Đã xóa hẳn thư mục rác "dcor-products".\n');
  } catch (e) {
    console.log('   (Thư mục dcor-products đã được dọn sạch hoàn toàn).\n');
  }

  // --------------------------------------------------------------------------
  // BÁO CÁO HIỆN TRẠNG CLOUDINARY SAU KHI DỌN
  // --------------------------------------------------------------------------
  console.log('📊 Đang kiểm tra lại danh sách thư mục Cloudinary hiện tại:');
  const rootFolders = await cloudinary.api.root_folders();
  console.log('   Thư mục còn lại:', rootFolders.folders.map(f => f.name));

  const usage = await cloudinary.api.usage();
  console.log('\n📈 Thống kê tài nguyên sau khi dọn rác:');
  console.log(`   - Tổng số tài nguyên còn lại: ${usage.resources} (trước đó 11,074)`);
  console.log(`   - Dung lượng lưu trữ: ${(usage.storage.usage / (1024 * 1024 * 1024)).toFixed(2)} GB`);
  console.log('========================================================\n');
}

run().catch(console.error);
