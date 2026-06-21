const fs = require('fs');
const path = require('path');

const mdPath = path.join(__dirname, '../../Crawl_Data/file_har/new_crawl/products_to_remove.md');
const backupPath = path.join(__dirname, 'backup_products.json');
const outPath = path.join(__dirname, 'final_170_products.json');

const mdContent = fs.readFileSync(mdPath, 'utf8');
const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));

// Extract IDs to remove
const toRemove = new Set();
const regex = /\(`([^`]+)`\)/g;
let match;
while ((match = regex.exec(mdContent)) !== null) {
  toRemove.add(match[1]);
}

console.log(`Found ${toRemove.size} IDs to remove in products_to_remove.md`);

// Filter data
const keptProducts = backupData.filter(p => !toRemove.has(p.product_id));
console.log(`Remaining products after filter: ${keptProducts.length}`);

// Add flags and convert to snake_case
const finalProducts = keptProducts.map(p => {
  return {
    product_id: p.product_id,
    created_at: p.createdAt || p.created_at || new Date().toISOString(),
    base_price: p.basePrice || p.base_price || 0,
    config_options: p.configOptions || p.config_options || "[]",
    description: p.description || "[]",
    is_best_seller: false,
    is_new: false,
    name: p.name,
    slug: p.slug,
    updated_at: p.updatedAt || p.updated_at || new Date().toISOString(),
    variants: p.variants || "[]",
    videos: p.videos || "[]"
  };
});

// Randomly assign is_best_seller and is_new to 17 items each (about 10% of 170)
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
  }
}

const indices = Array.from({length: finalProducts.length}, (_, i) => i);
shuffleArray(indices);

for (let i = 0; i < 17; i++) {
  if (indices[i] !== undefined) finalProducts[indices[i]].is_best_seller = true;
}

shuffleArray(indices);
for (let i = 0; i < 17; i++) {
  if (indices[i] !== undefined) finalProducts[indices[i]].is_new = true;
}

fs.writeFileSync(outPath, JSON.stringify(finalProducts, null, 2), 'utf8');
console.log(`Successfully wrote ${finalProducts.length} products to ${outPath}`);
