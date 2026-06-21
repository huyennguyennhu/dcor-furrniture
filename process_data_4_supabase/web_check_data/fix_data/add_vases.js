const fs = require('fs');
const path = require('path');

const dataAutoPath = path.join(__dirname, 'data_auto.js');
const rawPath = path.join(__dirname, '..', '..', '..', 'Crawl_Data', 'file_har', 'new_crawl', 'crawled_v2_final.json');

let code = fs.readFileSync(dataAutoPath, 'utf8');
const prefix = 'const productsDataAuto = ';
const jsonStr = code.replace(/^const\s+productsDataAuto\s*=\s*/, '').replace(/;\s*$/, '');
let data = JSON.parse(jsonStr);

const raw = JSON.parse(fs.readFileSync(rawPath, 'utf8'));

const keywords = ['vase', 'planter', 'pot'];
const existingIds = new Set(data.map(p => p.product_id));
let addedCount = 0;

for (const p of raw) {
    const n = p.name.toLowerCase();
    if (keywords.some(k => n.includes(k)) && !n.includes("spot")) {
        if (!existingIds.has(p.id)) {
            data.push({
                product_id: p.id,
                created_at: new Date().toISOString(),
                base_price: p.basePrice || 0,
                config_options: p.configOptions || [],
                description: p.description || p.name,
                is_best_seller: false,
                is_new: true,
                name: p.name,
                slug: p.slug || p.id,
                updated_at: new Date().toISOString(),
                variants: p.variants || [],
                videos: [],
                category: "Phụ kiện"
            });
            existingIds.add(p.id);
            addedCount++;
        }
    }
}

const newCode = `${prefix}${JSON.stringify(data, null, 2)};\n`;
fs.writeFileSync(dataAutoPath, newCode, 'utf8');

console.log(`Added ${addedCount} vases/pots to Phụ kiện.`);
