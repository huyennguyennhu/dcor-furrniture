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

  const res = await client.query(`
    SELECT table_schema, table_name 
    FROM information_schema.tables 
    WHERE table_name = 'products'
  `);
  console.log(res.rows);

  await client.end();
}

main().catch(console.error);
