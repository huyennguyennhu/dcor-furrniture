/**
 * check_and_delete_broken_images.js
 * Kiểm tra ảnh của từng sản phẩm trong Supabase:
 * - Nếu không có ảnh → xóa
 * - Nếu ảnh lỗi (không truy cập được) → xóa
 * Chạy: node check_and_delete_broken_images.js
 */

const { Client } = require('pg');
const https = require('https');
const http = require('http');

const DB_CONFIG = {
  host: 'aws-1-ap-northeast-2.pooler.supabase.com',
  port: 6543,
  user: 'postgres.ckkvyltbeinzqogjsfli',
  password: 'ProjectDCor2026',
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
};

// Kiểm tra 1 URL có truy cập được không (chỉ dùng HEAD request, không tải ảnh)
function checkUrl(url) {
  return new Promise((resolve) => {
    if (!url || typeof url !== 'string' || !url.startsWith('http')) {
      return resolve(false);
    }
    const mod = url.startsWith('https') ? https : http;
    try {
      const req = mod.request(url, { method: 'HEAD', timeout: 8000 }, (res) => {
        resolve(res.statusCode >= 200 && res.statusCode < 400);
      });
      req.on('error', () => resolve(false));
      req.on('timeout', () => { req.destroy(); resolve(false); });
      req.end();
    } catch {
      resolve(false);
    }
  });
}

// Chờ một khoảng thời gian (ms)
const delay = (ms) => new Promise(res => setTimeout(res, ms));

async function main() {
  console.log('===== KIỂM TRA ẢNH SẢN PHẨM TRONG SUPABASE =====\n');

  const client = new Client(DB_CONFIG);
  await client.connect();
  console.log('✓ Đã kết nối Supabase\n');

  // Lấy toàn bộ sản phẩm
  const { rows: products } = await client.query(
    'SELECT product_id, short_description_vi, images FROM products ORDER BY product_id'
  );
  console.log(`📦 Tổng số sản phẩm cần kiểm tra: ${products.length}\n`);

  const brokenIds = [];
  const okIds = [];
  const noImageIds = [];

  for (let i = 0; i < products.length; i++) {
    const prod = products[i];
    const pid = prod.product_id;
    const name = prod.short_description_vi || pid;
    let images = prod.images;

    // Parse nếu là chuỗi
    if (typeof images === 'string') {
      try { images = JSON.parse(images); } catch { images = []; }
    }

    // Không có ảnh
    if (!images || !Array.isArray(images) || images.length === 0) {
      noImageIds.push(pid);
      process.stdout.write(`\r[${i + 1}/${products.length}] ✗ Không có ảnh: ${pid}                    `);
      continue;
    }

    const firstImage = images[0];

    // Kiểm tra URL đầu tiên
    const ok = await checkUrl(firstImage);

    if (!ok) {
      brokenIds.push(pid);
      process.stdout.write(`\r[${i + 1}/${products.length}] ✗ Ảnh lỗi: ${pid} — ${firstImage.substring(0, 60)}...`);
    } else {
      okIds.push(pid);
      process.stdout.write(`\r[${i + 1}/${products.length}] ✓ OK: ${pid}                                          `);
    }

    // Tránh rate-limit khi gửi quá nhiều request
    await delay(50);
  }

  console.log('\n\n===== KẾT QUẢ KIỂM TRA =====');
  console.log(`  ✅ Ảnh OK:          ${okIds.length} sản phẩm`);
  console.log(`  ✗  Ảnh lỗi:         ${brokenIds.length} sản phẩm`);
  console.log(`  ✗  Không có ảnh:    ${noImageIds.length} sản phẩm`);

  const toDelete = [...brokenIds, ...noImageIds];
  console.log(`\n  🗑️  Sẽ xóa tổng cộng: ${toDelete.length} sản phẩm`);

  if (toDelete.length === 0) {
    console.log('\n  ✅ Tất cả sản phẩm đều có ảnh hợp lệ. Không cần xóa gì.');
    await client.end();
    return;
  }

  // In danh sách sẽ xóa
  if (brokenIds.length > 0) {
    console.log('\n  📋 Danh sách ảnh lỗi:');
    brokenIds.forEach(id => console.log(`     - ${id}`));
  }
  if (noImageIds.length > 0) {
    console.log('\n  📋 Danh sách không có ảnh:');
    noImageIds.forEach(id => console.log(`     - ${id}`));
  }

  // Xóa sản phẩm bị lỗi
  console.log('\n🗑️  Đang xóa các sản phẩm bị lỗi ảnh...');

  // Xóa từng batch 50 để tránh lỗi
  const batchSize = 50;
  let deletedCount = 0;
  for (let i = 0; i < toDelete.length; i += batchSize) {
    const batch = toDelete.slice(i, i + batchSize);
    const placeholders = batch.map((_, idx) => `$${idx + 1}`).join(', ');
    const result = await client.query(
      `DELETE FROM products WHERE product_id IN (${placeholders})`,
      batch
    );
    deletedCount += result.rowCount;
  }

  console.log(`  ✅ Đã xóa: ${deletedCount} sản phẩm`);

  // Thống kê sau xóa
  const countResult = await client.query('SELECT COUNT(*) as total FROM products');
  const catResult = await client.query(
    'SELECT category, COUNT(*) as count FROM products GROUP BY category ORDER BY count DESC'
  );
  console.log(`\n  📦 Còn lại trong Supabase: ${countResult.rows[0].total} sản phẩm`);
  console.log('\n  📊 Phân phối danh mục:');
  catResult.rows.forEach(r => console.log(`     ${r.category}: ${r.count}`));

  await client.end();
  console.log('\n===== HOÀN THÀNH =====');
}

main().catch(err => {
  console.error('Lỗi:', err);
  process.exit(1);
});
