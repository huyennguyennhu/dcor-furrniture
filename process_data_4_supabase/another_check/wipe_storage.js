const https = require('https');
const url = require('url');

const SUPABASE_URL = 'https://ckkvyltbeinzqogjsfli.supabase.co';
const SUPABASE_KEY = 'sb_secret_1orpEZ5r_asBUGluQzv5fQ_m6x1FRmg';
const BUCKET = 'dcor';

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
  console.log('===== WIPING ALL SUPABASE STORAGE =====');
  
  let allFiles = [];
  let offset = 0;
  // We will list files from root or empty prefix
  const FOLDER = '';
  
  while (true) {
    const files = await listFiles(FOLDER, offset);
    if (!files || files.length === 0) break;
    
    const validFiles = files.filter(f => f.name && f.id !== null);
    allFiles = allFiles.concat(validFiles.map(f => f.name));
    
    offset += files.length;
    if (files.length < 1000) break;
  }
  
  console.log(`Found ${allFiles.length} files to delete in bucket ${BUCKET}.`);

  if (allFiles.length > 0) {
    console.log('\nDeleting files...');
    const BATCH_SIZE = 100;
    let deletedCount = 0;
    
    for (let i = 0; i < allFiles.length; i += BATCH_SIZE) {
      const batch = allFiles.slice(i, i + BATCH_SIZE);
      await deleteFiles(batch);
      deletedCount += batch.length;
      process.stdout.write(`\rDeleted ${deletedCount}/${allFiles.length} files...`);
      await delay(100);
    }
    console.log('\n✅ Storage wipe complete!');
  } else {
    console.log('\n✅ Storage is already empty.');
  }
}

main().catch(console.error);
