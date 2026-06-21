/**
 * upload_boconcept_to_storage.js
 * Tìm tất cả sản phẩm có ảnh từ BoConcept CDN,
 * upload lên Supabase Storage và cập nhật URL trong DB.
 * Chạy: node upload_boconcept_to_storage.js
 */

const { Client } = require('pg');
const https = require('https');
const http = require('http');
const path = require('path');
const url = require('url');

// ===== CẤU HÌNH =====
const SUPABASE_URL = 'https://ckkvyltbeinzqogjsfli.supabase.co';
const SUPABASE_KEY = 'sb_secret_1orpEZ5r_asBUGluQzv5fQ_m6x1FRmg';
const BUCKET = 'dcor';

const DB_CONFIG = {
  host: 'aws-1-ap-northeast-2.pooler.supabase.com',
  port: 6543,
  user: 'postgres.ckkvyltbeinzqogjsfli',
  password: 'ProjectDCor2026',
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
};

// Mapping danh mục → folder trong Storage
const CATEGORY_FOLDER = {
  'Sofa':      'sofas',
  'Ghế':       'chairs',
  'Bàn':       'tables',
  'Tủ & Kệ':  'storage',
  'Giường':    'beds',
  'Đèn':       'lighting',
  'Thảm':      'rugs',
  'Phụ kiện':  'accessories',
};

const delay = (ms) => new Promise(r => setTimeout(r, ms));

// ===== TẢI ẢNH VỀ BUFFER =====
function downloadImage(imageUrl) {
  return new Promise((resolve, reject) => {
    // Giải mã rồi encode lại URL chuẩn để tránh lỗi
    const decodedUrl = decodeURI(imageUrl);
    const parsedUrl = url.parse(decodedUrl);
    const encodedPath = parsedUrl.pathname
      .split('/')
      .map(seg => encodeURIComponent(decodeURIComponent(seg)))
      .join('/');
    const safeUrl = `${parsedUrl.protocol}//${parsedUrl.host}${encodedPath}`;

    const mod = safeUrl.startsWith('https') ? https : http;
    const req = mod.get(safeUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
      },
      timeout: 20000
    }, (res) => {
      // Theo redirect (max 3 lần)
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadImage(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode < 200 || res.statusCode >= 400) {
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve({
        buffer: Buffer.concat(chunks),
        contentType: res.headers['content-type'] || 'image/png'
      }));
      res.on('error', reject);
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

// ===== UPLOAD LÊN SUPABASE STORAGE =====
function uploadToSupabase(buffer, contentType, storagePath) {
  return new Promise((resolve, reject) => {
    const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${storagePath}`;
    const uploadUrlParsed = url.parse(uploadUrl);

    const options = {
      hostname: uploadUrlParsed.hostname,
      path: uploadUrlParsed.path,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'apikey': SUPABASE_KEY,
        'Content-Type': contentType,
        'Content-Length': buffer.length,
        'x-upsert': 'true'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${storagePath}`;
          resolve(publicUrl);
        } else {
          reject(new Error(`Upload failed ${res.statusCode}: ${body}`));
        }
      });
    });
    req.on('error', reject);
    req.write(buffer);
    req.end();
  });
}

// ===== LẤY TÊN FILE SẠCH TỪ URL =====
function getFilename(imageUrl, productId, index) {
  try {
    const parsed = url.parse(decodeURIComponent(imageUrl));
    const basename = path.basename(parsed.pathname)
      .replace(/\s+/g, '')
      .replace(/[^a-zA-Z0-9._-]/g, '_');
    return basename || `${productId}_img${index}.png`;
  } catch {
    return `${productId}_img${index}.png`;
  }
}

// ===== XỬ LÝ 1 URL ẢNH =====
async function processImageUrl(imageUrl, productId, category, index) {
  if (!imageUrl || !imageUrl.includes('boconcept.com')) {
    return imageUrl; // Giữ nguyên nếu không phải BoConcept
  }

  const folder = CATEGORY_FOLDER[category] || 'accessories';
  const filename = getFilename(imageUrl, productId, index);
  const storagePath = `${folder}/${productId}_${filename}`;

  try {
    // 1. Tải ảnh
    const { buffer, contentType } = await downloadImage(imageUrl);

    // 2. Upload lên Supabase Storage
    const supabaseUrl = await uploadToSupabase(buffer, contentType, storagePath);
    return supabaseUrl;
  } catch (err) {
    // Nếu lỗi, giữ nguyên URL gốc và ghi nhận
    return null; // null = thất bại
  }
}

// ===== MAIN =====
async function main() {
  console.log('===== UPLOAD ẢNH BOCONCEPT → SUPABASE STORAGE =====\n');

  const client = new Client(DB_CONFIG);
  await client.connect();
  console.log('✓ Kết nối Supabase thành công\n');

  // Lấy tất cả sản phẩm có ảnh BoConcept
  const { rows: products } = await client.query(`
    SELECT product_id, category, images
    FROM products
    WHERE images::text LIKE '%boconcept.com%'
    ORDER BY product_id
  `);

  console.log(`📦 Số sản phẩm có ảnh BoConcept cần xử lý: ${products.length}\n`);

  let totalSuccess = 0;
  let totalFailed = 0;
  let totalSkipped = 0;
  const failedProducts = [];

  for (let i = 0; i < products.length; i++) {
    const prod = products[i];
    const pid = prod.product_id;
    const category = prod.category || 'Phụ kiện';
    let images = prod.images;

    if (typeof images === 'string') {
      try { images = JSON.parse(images); } catch { images = []; }
    }
    if (!Array.isArray(images) || images.length === 0) {
      totalSkipped++;
      continue;
    }

    process.stdout.write(`\r[${i + 1}/${products.length}] Đang xử lý: ${pid} (${category})...         `);

    // Xử lý từng ảnh của sản phẩm
    const newImages = [];
    let productHadError = false;

    for (let j = 0; j < images.length; j++) {
      const imgUrl = images[j];

      if (!imgUrl.includes('boconcept.com')) {
        newImages.push(imgUrl); // Ảnh đã trên Supabase, giữ nguyên
        continue;
      }

      const newUrl = await processImageUrl(imgUrl, pid, category, j);
      if (newUrl) {
        newImages.push(newUrl);
        totalSuccess++;
      } else {
        // Ảnh lỗi: bỏ qua (không thêm vào mảng mới)
        totalFailed++;
        productHadError = true;
      }

      await delay(200); // Giữa mỗi ảnh
    }

    // Cập nhật DB với URL mới
    if (newImages.length > 0) {
      await client.query(
        'UPDATE products SET images = $1 WHERE product_id = $2',
        [JSON.stringify(newImages), pid]
      );
    } else {
      // Không còn ảnh nào hợp lệ → xóa sản phẩm
      await client.query('DELETE FROM products WHERE product_id = $1', [pid]);
      failedProducts.push(pid);
      console.log(`\n  ⚠️  Xóa sản phẩm ${pid} vì không có ảnh hợp lệ`);
    }

    await delay(100); // Giữa mỗi sản phẩm
  }

  console.log('\n\n===== KẾT QUẢ =====');
  console.log(`  ✅ Ảnh upload thành công:  ${totalSuccess}`);
  console.log(`  ❌ Ảnh thất bại:           ${totalFailed}`);
  console.log(`  ⏭️  Ảnh bỏ qua (đã OK):    ${totalSkipped}`);
  if (failedProducts.length > 0) {
    console.log(`  🗑️  Sản phẩm bị xóa (0 ảnh): ${failedProducts.join(', ')}`);
  }

  // Thống kê cuối
  const countResult = await client.query('SELECT COUNT(*) as total FROM products');
  const catResult = await client.query(
    'SELECT category, COUNT(*) as count FROM products GROUP BY category ORDER BY count DESC'
  );
  console.log(`\n  📦 Tổng sản phẩm trong Supabase: ${countResult.rows[0].total}`);
  console.log('\n  📊 Phân phối danh mục:');
  catResult.rows.forEach(r => console.log(`     ${r.category}: ${r.count}`));

  await client.end();
  console.log('\n===== HOÀN THÀNH =====');
}

main().catch(err => {
  console.error('\nLỗi nghiêm trọng:', err);
  process.exit(1);
});
