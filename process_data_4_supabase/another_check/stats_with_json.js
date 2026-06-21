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
  // Read categories from crawled data
  let crawledData = [];
  try {
    crawledData = JSON.parse(fs.readFileSync(CRAWL_PATH, 'utf8'));
  } catch(e) {
    console.error('Could not read crawled_all_variants.json');
  }
  
  const categoryMap = {};
  crawledData.forEach(p => {
    categoryMap[p.productId] = p.category || 'Không xác định';
  });

  const client = new Client(DB_CONFIG);
  await client.connect();

  const res = await client.query('SELECT product_id, variants, "configOptions" FROM products');
  const products = res.rows;

  const stats = {};

  products.forEach(row => {
    const cat = categoryMap[row.product_id] || 'Không xác định';

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
