const fs = require('fs');
const { Client } = require('pg');

const DB_CONFIG = {
  host: 'aws-1-ap-northeast-2.pooler.supabase.com',
  port: 6543,
  user: 'postgres.ckkvyltbeinzqogjsfli',
  password: 'ProjectDCor2026',
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
};

const MD_PATH = 'd:\\00_LEARNING\\0_Study\\HocChinhUEL\\4_1_LapTrinhWebNangCao\\DoAn\\Dev\\Crawl_Data\\file_har\\new_crawl\\products_to_remove.md';

async function main() {
  // 1. Read and parse IDs
  const mdContent = fs.readFileSync(MD_PATH, 'utf8');
  // Regex to match: (`ID`)
  const regex = /\(`([^`]+)`\)/g;
  const deleteIds = [];
  let match;
  while ((match = regex.exec(mdContent)) !== null) {
    deleteIds.push(match[1]);
  }

  console.log(`Found ${deleteIds.length} product IDs to delete from markdown.`);
  
  if (deleteIds.length === 0) {
    console.log("No IDs found. Aborting.");
    return;
  }

  const client = new Client(DB_CONFIG);
  await client.connect();

  // 2. Backup database before deleting
  console.log('Fetching products for backup...');
  const res = await client.query('SELECT * FROM products');
  fs.writeFileSync('d:\\00_LEARNING\\0_Study\\HocChinhUEL\\4_1_LapTrinhWebNangCao\\DoAn\\Dev\\dcor-studio\\backup_products.json', JSON.stringify(res.rows, null, 2));
  console.log(`Backed up ${res.rows.length} products.`);

  // 3. Delete in batches
  console.log('Deleting products...');
  let deletedCount = 0;
  const BATCH_SIZE = 50;
  
  for (let i = 0; i < deleteIds.length; i += BATCH_SIZE) {
    const batch = deleteIds.slice(i, i + BATCH_SIZE);
    const placeholders = batch.map((_, idx) => `$${idx + 1}`).join(',');
    const delRes = await client.query(`DELETE FROM products WHERE product_id IN (${placeholders})`, batch);
    deletedCount += delRes.rowCount;
    console.log(` - Batch deleted ${delRes.rowCount} rows. (Total so far: ${deletedCount})`);
  }

  // 4. Verify remaining
  const remainRes = await client.query('SELECT COUNT(*) as total FROM products');
  console.log(`\nDeletion complete! Total products deleted: ${deletedCount}`);
  console.log(`Remaining products in database: ${remainRes.rows[0].total}`);

  await client.end();
}

main().catch(console.error);
