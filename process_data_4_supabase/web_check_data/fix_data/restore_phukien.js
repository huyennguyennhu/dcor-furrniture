const fs = require('fs');
const path = require('path');

const dataAutoPath = path.join(__dirname, 'data_auto.js');
const rawDataPath = path.join(__dirname, '..', '..', '..', 'Crawl_Data', 'file_har', 'new_crawl', 'crawled_v2_final.json');

// Read data_auto.js
let code = fs.readFileSync(dataAutoPath, 'utf8');
const prefix = 'const productsDataAuto = ';
const jsonStr = code.replace(/^const\s+productsDataAuto\s*=\s*/, '').replace(/;\s*$/, '');
let data = JSON.parse(jsonStr);

// Read raw data
const rawData = JSON.parse(fs.readFileSync(rawDataPath, 'utf8'));
const namesToRestore = ["Salamanca cushion", "Bergamo deco cushions"];

const existingNames = new Set(data.map(p => p.name));
const toRestore = rawData.filter(item => namesToRestore.includes(item.name) && !existingNames.has(item.name));

toRestore.forEach(item => {
    data.push({
        product_id: item.id,
        created_at: new Date().toISOString(),
        base_price: item.basePrice || 0,
        config_options: item.configOptions || [],
        description: item.description || item.name,
        is_best_seller: false,
        is_new: true,
        name: item.name,
        slug: item.slug || item.id,
        updated_at: new Date().toISOString(),
        variants: item.variants || [],
        videos: [],
        category: "Phụ kiện"
    });
});

const newCode = `${prefix}${JSON.stringify(data, null, 2)};\n`;
fs.writeFileSync(dataAutoPath, newCode, 'utf8');

console.log(`Restored ${toRestore.length} items to Phụ kiện.`);
