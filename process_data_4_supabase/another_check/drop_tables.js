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
  try {
    await client.connect();
    console.log('Connected to Supabase DB...');
    
    // Drop the public schema entirely, which drops all tables, views, etc.
    await client.query('DROP SCHEMA IF EXISTS public CASCADE;');
    console.log('✅ Dropped schema public and ALL its tables.');
    
    // Recreate an empty public schema
    await client.query('CREATE SCHEMA public;');
    // Grant standard permissions (optional but good practice for Supabase)
    await client.query('GRANT ALL ON SCHEMA public TO postgres;');
    await client.query('GRANT ALL ON SCHEMA public TO public;');
    
    console.log('✅ Recreated an empty public schema. No tables exist now.');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

main();
