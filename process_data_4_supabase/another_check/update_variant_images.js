/**
 * update_variant_images.js
 * Cập nhật variant_prices trong DB để mỗi variant có ảnh riêng
 * từ dữ liệu crawled_all_variants.json
 * Chạy: node update_variant_images.js
 */

const { Client } = require('pg');
const fs = require('fs');

const DB_CONFIG = {
  host: 'aws-1-ap-northeast-2.pooler.supabase.com',
  port: 6543,
  user: 'postgres.ckkvyltbeinzqogjsfli',
  password: 'ProjectDCor2026',
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
};

const CRAWL_PATH = 'd:\\00_LEARNING\\0_Study\\HocChinhUEL\\4_1_LapTrinhWebNangCao\\DoAn\\Dev\\Crawl_Data\\crawled_all_variants.json';

async function main() {
  console.log('===== CẬP NHẬT ẢNH VARIANT VÀO DB =====\n');

  // 1. Đọc dữ liệu crawl và build map variantKey → images
  console.log('1. Đọc dữ liệu crawl...');
  const crawledData = JSON.parse(fs.readFileSync(CRAWL_PATH, 'utf8'));

  // productId → Map<variantKey, images[]>
  const variantImagesMap = {};
  // productId → Map<upholsteryId, firstVariantImages[]> (gom nhóm theo chất liệu)
  const upholsteryImageMap = {};

  crawledData.forEach(prod => {
    const pid = prod.productId;
    variantImagesMap[pid] = {};
    upholsteryImageMap[pid] = {};

    (prod.variants || []).forEach(v => {
      if (!v.variantKey || !v.images || v.images.length === 0) return;

      // Map trực tiếp variantKey → images
      variantImagesMap[pid][v.variantKey] = v.images;

      // Nhóm theo upholstery (vaMaterialUpholstery)
      const uphId = v.selections?.vaMaterialUpholstery;
      if (uphId && !upholsteryImageMap[pid][uphId]) {
        upholsteryImageMap[pid][uphId] = {
          images: v.images,
          finish: v.attributes?.finish || '',
          price: v.price?.value || 0,
          formattedPrice: v.price?.formatted || '',
        };
      }
    });
  });

  console.log(`   Đã build image map cho ${Object.keys(variantImagesMap).length} sản phẩm\n`);

  // 2. Kết nối DB
  const client = new Client(DB_CONFIG);
  await client.connect();
  console.log('2. Kết nối Supabase thành công\n');

  // 3. Lấy tất cả sản phẩm có variant_prices
  const { rows: products } = await client.query(`
    SELECT product_id, variant_prices
    FROM products
    WHERE variant_prices IS NOT NULL
      AND variant_prices::text != 'null'
      AND variant_prices::text != '[]'
    ORDER BY product_id
  `);
  console.log(`3. Sản phẩm có variant_prices: ${products.length}\n`);

  let updatedCount = 0;
  let skippedCount = 0;

  for (let i = 0; i < products.length; i++) {
    const prod = products[i];
    const pid = prod.product_id;
    let variantPrices = prod.variant_prices;

    if (!Array.isArray(variantPrices)) {
      try { variantPrices = JSON.parse(variantPrices); } catch { skippedCount++; continue; }
    }

    if (!variantImagesMap[pid]) {
      skippedCount++;
      continue;
    }

    const vkMap = variantImagesMap[pid];
    let changed = false;

    // Cập nhật images cho từng variant
    const updatedVariants = variantPrices.map(v => {
      const imgs = vkMap[v.variantKey];
      if (imgs && imgs.length > 0 && !v.images) {
        changed = true;
        return { ...v, images: imgs };
      }
      return v;
    });

    if (changed) {
      await client.query(
        'UPDATE products SET variant_prices = $1 WHERE product_id = $2',
        [JSON.stringify(updatedVariants), pid]
      );
      updatedCount++;
      process.stdout.write(`\r   [${i + 1}/${products.length}] ✓ Cập nhật: ${pid}                  `);
    } else {
      skippedCount++;
      process.stdout.write(`\r   [${i + 1}/${products.length}] - Bỏ qua: ${pid}                    `);
    }
  }

  console.log(`\n\n===== KẾT QUẢ =====`);
  console.log(`  ✅ Đã cập nhật: ${updatedCount} sản phẩm`);
  console.log(`  ⏭️  Bỏ qua:      ${skippedCount} sản phẩm`);

  await client.end();
  console.log('\n===== HOÀN THÀNH =====');
}

main().catch(err => {
  console.error('Lỗi:', err);
  process.exit(1);
});
