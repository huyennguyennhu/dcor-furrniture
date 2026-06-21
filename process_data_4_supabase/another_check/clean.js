const fs = require('fs');

async function checkImage(url) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 2000); // 2s timeout
  try {
    const res = await fetch(url, { method: 'HEAD', signal: controller.signal });
    clearTimeout(timeoutId);
    return res.ok;
  } catch (e) {
    clearTimeout(timeoutId);
    return false;
  }
}

async function run() {
  const file = 'lib/data/catalog.json';
  let data = JSON.parse(fs.readFileSync(file, 'utf8'));
  console.log(`Checking ${data.length} items...`);
  
  let validProducts = [];
  let removedCount = 0;

  // Process in chunks of 20 to avoid overwhelming network/memory
  const CHUNK_SIZE = 20;
  for (let i = 0; i < data.length; i += CHUNK_SIZE) {
    const chunk = data.slice(i, i + CHUNK_SIZE);
    
    // Process a chunk
    const results = await Promise.all(chunk.map(async (p) => {
      // Check all images for this product concurrently
      const imageResults = await Promise.all(p.images.map(async img => {
        const ok = await checkImage(img);
        return ok ? img : null;
      }));
      
      const validImages = imageResults.filter(img => img !== null);
      if (validImages.length > 0) {
        p.images = validImages;
        return p;
      } else {
        return null;
      }
    }));
    
    for (let j = 0; j < results.length; j++) {
      if (results[j]) {
        validProducts.push(results[j]);
      } else {
        removedCount++;
        console.log('Removed product:', chunk[j].shortDescription_vi || chunk[j].shortDescription);
      }
    }
  }

  fs.writeFileSync(file, JSON.stringify(validProducts, null, 2));
  console.log(`Cleaned up. Original: ${data.length}, Remaining: ${validProducts.length}, Removed: ${removedCount}`);
}

run();
