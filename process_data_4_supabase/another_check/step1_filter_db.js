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

const ALLOCATIONS = {
  'Phụ kiện': 30,
  'Ghế': 25,
  'Bàn': 25,
  'Sofa': 20,
  'Tủ & Kệ': 20,
  'Giường': 10,
  'Thảm': 10,
  'Đèn': 10
};

function getCategory(nameStr) {
  const name = nameStr.toLowerCase();
  if (name.includes('sofa')) return 'Sofa';
  if (name.includes('chair') || name.includes('stool') || name.includes('bench')) return 'Ghế';
  if (name.includes('table') || name.includes('desk')) return 'Bàn';
  if (name.includes('bed')) return 'Giường';
  if (name.includes('rug')) return 'Thảm';
  if (name.includes('lamp') || name.includes('pendant')) return 'Đèn';
  if (name.includes('cabinet') || name.includes('board') || name.includes('shelf') || name.includes('bookcase')) return 'Tủ & Kệ';
  return 'Phụ kiện';
}

async function main() {
  const client = new Client(DB_CONFIG);
  await client.connect();

  console.log('Fetching products from database...');
  const res = await client.query('SELECT * FROM products');
  const products = res.rows;

  console.log(`Saving backup of ${products.length} products to backup_products.json...`);
  fs.writeFileSync('backup_products.json', JSON.stringify(products, null, 2));

  // Group by category
  const categorized = {};
  products.forEach(p => {
    const cat = getCategory(p.name || p.slug || '');
    if (!categorized[cat]) categorized[cat] = [];
    categorized[cat].push(p);
  });

  const keepIds = new Set();

  for (const cat of Object.keys(ALLOCATIONS)) {
    const limit = ALLOCATIONS[cat];
    let items = categorized[cat] || [];

    // Sort: isBestSeller true first, then isNew true first
    items.sort((a, b) => {
      if (a.isBestSeller && !b.isBestSeller) return -1;
      if (!a.isBestSeller && b.isBestSeller) return 1;
      if (a.isNew && !b.isNew) return -1;
      if (!a.isNew && b.isNew) return 1;
      return 0;
    });

    // To ensure diversity, let's keep only 1 item per "base name" (e.g. "Indivi sofa")
    const selected = [];
    const seenNames = new Set();
    
    for (const item of items) {
      if (selected.length >= limit) break;
      
      // Simple base name heuristic: first 2-3 words
      const nameParts = (item.name || '').split(' ');
      const baseName = nameParts.slice(0, 3).join(' ').toLowerCase();
      
      if (!seenNames.has(baseName)) {
        selected.push(item);
        seenNames.add(baseName);
      }
    }

    // If we haven't reached limit, add others we skipped
    for (const item of items) {
      if (selected.length >= limit) break;
      if (!selected.includes(item)) {
        selected.push(item);
      }
    }

    selected.forEach(s => keepIds.add(s.product_id));
    console.log(`Category [${cat}]: Keeping ${selected.length} / ${items.length} products.`);
  }

  const deleteIds = products.map(p => p.product_id).filter(id => !keepIds.has(id));
  console.log(`\nTotal products to keep: ${keepIds.size}`);
  console.log(`Total products to delete: ${deleteIds.length}`);

  if (deleteIds.length > 0) {
    console.log('Deleting unselected products in batches...');
    const BATCH_SIZE = 50;
    for (let i = 0; i < deleteIds.length; i += BATCH_SIZE) {
      const batch = deleteIds.slice(i, i + BATCH_SIZE);
      const placeholders = batch.map((_, idx) => `$${idx + 1}`).join(',');
      await client.query(`DELETE FROM products WHERE product_id IN (${placeholders})`, batch);
      console.log(` - Deleted batch of ${batch.length}`);
    }
    console.log('Database cleanup completed!');
  } else {
    console.log('No products to delete.');
  }

  await client.end();
}

main().catch(console.error);
