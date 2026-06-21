const https = require('https');
const url = require('url');
const { Client } = require('pg');

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

const delay = (ms) => new Promise(r => setTimeout(r, ms));

function listFiles(prefix, offset = 0) {
  return new Promise((resolve, reject) => {
    const listUrl = `${SUPABASE_URL}/storage/v1/object/list/${BUCKET}`;
    const parsedUrl = url.parse(listUrl);
    
    const bodyData = JSON.stringify({
      prefix: prefix,
      limit: 1000,
      offset: offset,
      sortBy: { column: 'name', order: 'asc' }
    });

    const options = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.path,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'apikey': SUPABASE_KEY,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(bodyData)
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(body));
        } else {
          reject(new Error(`Failed ${res.statusCode}: ${body}`));
        }
      });
    });
    req.on('error', reject);
    req.write(bodyData);
    req.end();
  });
}

function deleteFiles(filePaths) {
  return new Promise((resolve, reject) => {
    const delUrl = `${SUPABASE_URL}/storage/v1/object/${BUCKET}`;
    const parsedUrl = url.parse(delUrl);
    
    const bodyData = JSON.stringify({
      prefixes: filePaths
    });

    const options = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.path,
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'apikey': SUPABASE_KEY,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(bodyData)
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(body));
        } else {
          reject(new Error(`Failed ${res.statusCode}: ${body}`));
        }
      });
    });
    req.on('error', reject);
    req.write(bodyData);
    req.end();
  });
}

async function main() {
  console.log('===== SUPABASE STORAGE CLEANUP =====');
  
  // 1. Fetch remaining products and whitelist images
  const client = new Client(DB_CONFIG);
  await client.connect();
  const res = await client.query('SELECT variants, "configOptions" FROM products');
  const products = res.rows;
  await client.end();

  const whitelist = new Set();
  
  products.forEach(row => {
    let variants = row.variants || [];
    if (typeof variants === 'string') {
      try { variants = JSON.parse(variants); } catch (e) { variants = []; }
    }
    
    let configOptions = row.configOptions || [];
    if (typeof configOptions === 'string') {
      try { configOptions = JSON.parse(configOptions); } catch (e) { configOptions = []; }
    }

    variants.forEach(v => {
      if (v.images && Array.isArray(v.images)) {
        v.images.forEach(img => {
          if (img && img.includes('/storage/v1/object/public/dcor/')) {
            const path = img.split('/storage/v1/object/public/dcor/')[1];
            whitelist.add(path);
          }
        });
      }
    });

    configOptions.forEach(opt => {
      if (opt.options && Array.isArray(opt.options)) {
        opt.options.forEach(o => {
          if (o.swatchImage && o.swatchImage.includes('/storage/v1/object/public/dcor/')) {
            const path = o.swatchImage.split('/storage/v1/object/public/dcor/')[1];
            whitelist.add(path);
          }
        });
      }
    });
  });

  console.log(`\nWhitelist: Found ${whitelist.size} storage images used by remaining products.`);

  // 2. Fetch all files from storage
  let allFiles = [];
  let offset = 0;
  const FOLDER = 'products';
  
  while (true) {
    const files = await listFiles(FOLDER + '/', offset);
    if (!files || files.length === 0) break;
    
    // Some files might be null if they are directories in this API return
    const validFiles = files.filter(f => f.name && f.id !== null);
    allFiles = allFiles.concat(validFiles.map(f => `${FOLDER}/${f.name}`));
    
    offset += files.length;
    if (files.length < 1000) break;
  }
  
  console.log(`Storage: Found ${allFiles.length} files currently stored in ${FOLDER}/.`);

  // 3. Find files to delete
  const toDelete = allFiles.filter(path => !whitelist.has(path));
  console.log(`Orphaned: Found ${toDelete.length} files to delete.`);

  // 4. Delete files in batches
  if (toDelete.length > 0) {
    console.log('\nDeleting orphaned files...');
    const BATCH_SIZE = 100;
    let deletedCount = 0;
    
    for (let i = 0; i < toDelete.length; i += BATCH_SIZE) {
      const batch = toDelete.slice(i, i + BATCH_SIZE);
      await deleteFiles(batch);
      deletedCount += batch.length;
      process.stdout.write(`\rDeleted ${deletedCount}/${toDelete.length} files...`);
      await delay(100); // Prevent rate limiting
    }
    console.log('\n✅ Storage cleanup complete!');
  } else {
    console.log('\n✅ No orphaned files to delete.');
  }
}

main().catch(console.error);
