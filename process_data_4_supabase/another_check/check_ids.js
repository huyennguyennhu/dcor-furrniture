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

const CRAWL_PATH = 'd:\\00_LEARNING\\0_Study\\HocChinhUEL\\4_1_LapTrinhWebNangCao\\DoAn\\Dev\\Crawl_Data\\crawled_all_variants.json';

async function main() {
  const crawledData = JSON.parse(fs.readFileSync(CRAWL_PATH, 'utf8'));
  console.log('Sample crawled ID:', crawledData[0].productId, 'Category:', crawledData[0].category);

  const client = new Client(DB_CONFIG);
  await client.connect();
  const res = await client.query('SELECT product_id FROM products LIMIT 5');
  console.log('Sample DB IDs:', res.rows.map(r => r.product_id));
  await client.end();
}

main().catch(console.error);
