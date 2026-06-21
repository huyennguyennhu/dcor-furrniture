const { Client } = require('pg');

const DB_CONFIG = {
  host: 'aws-1-ap-northeast-2.pooler.supabase.com',
  port: 6543,
  user: 'postgres.ckkvyltbeinzqogjsfli',
  password: 'ProjectDCor2026',
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
};

async function main() {
  const client = new Client(DB_CONFIG);
  await client.connect();

  const res = await client.query('SELECT product_id, name, slug, variants, "configOptions" FROM products');
  const products = res.rows;

  const stats = {};

  products.forEach(row => {
    let name = (row.name || row.slug || '').toLowerCase();
    let cat = 'Phụ kiện'; // Default
    
    if (name.includes('sofa')) cat = 'Sofa';
    else if (name.includes('chair') || name.includes('stool') || name.includes('bench')) cat = 'Ghế';
    else if (name.includes('table') || name.includes('desk')) cat = 'Bàn';
    else if (name.includes('bed')) cat = 'Giường';
    else if (name.includes('rug')) cat = 'Thảm';
    else if (name.includes('lamp') || name.includes('pendant')) cat = 'Đèn';
    else if (name.includes('cabinet') || name.includes('board') || name.includes('shelf') || name.includes('bookcase')) cat = 'Tủ & Kệ';

    if (!stats[cat]) {
      stats[cat] = { productCount: 0, imageUrls: new Set() };
    }

    stats[cat].productCount++;

    // Parse variants
    let variants = row.variants || [];
    if (typeof variants === 'string') {
      try { variants = JSON.parse(variants); } catch (e) { variants = []; }
    }
    
    // Parse configOptions
    let configOptions = row.configOptions || [];
    if (typeof configOptions === 'string') {
      try { configOptions = JSON.parse(configOptions); } catch (e) { configOptions = []; }
    }

    // Collect images
    variants.forEach(v => {
      if (v.images && Array.isArray(v.images)) {
        v.images.forEach(img => {
          if (img) stats[cat].imageUrls.add(img);
        });
      }
    });

    configOptions.forEach(opt => {
      if (opt.options && Array.isArray(opt.options)) {
        opt.options.forEach(o => {
          if (o.swatchImage) stats[cat].imageUrls.add(o.swatchImage);
        });
      }
    });
  });

  console.log('===== THỐNG KÊ SẢN PHẨM & HÌNH ẢNH THEO DANH MỤC =====\n');
  let totalProducts = 0;
  let totalImages = 0;

  Object.keys(stats).sort((a, b) => stats[b].productCount - stats[a].productCount).forEach(cat => {
    const pCount = stats[cat].productCount;
    const iCount = stats[cat].imageUrls.size;
    totalProducts += pCount;
    totalImages += iCount;
    console.log(`Danh mục: ${cat}`);
    console.log(`  - Số lượng sản phẩm: ${pCount}`);
    console.log(`  - Số lượng hình ảnh (unique): ${iCount}\n`);
  });

  console.log(`=> TỔNG CỘNG: ${totalProducts} sản phẩm, ${totalImages} hình ảnh (unique).`);

  await client.end();
}

main().catch(console.error);
