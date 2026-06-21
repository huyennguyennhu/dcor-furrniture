const fs = require('fs');
const path = require('path');

const dataAutoPath = path.join(__dirname, 'data_auto.js');
const rawDataPath = path.join(__dirname, '..', '..', '..', 'Crawl_Data', 'file_har', 'new_crawl', 'crawled_v2_final.json');

// Read data_auto.js
let code = fs.readFileSync(dataAutoPath, 'utf8');
const prefix = 'const productsDataAuto = ';
const jsonStr = code.replace(/^const\s+productsDataAuto\s*=\s*/, '').replace(/;\s*$/, '');
let data = JSON.parse(jsonStr);

// 1. Categories update map
const catMap = {
    "Bordeaux console table": "Tủ kệ",
    "Stockholm table lamp": "Đèn",
    "Tilburg recliner with swivel function": "Ghế",
    "Carmo pouffe": "Ghế",
    "Aarhus pouffe": "Ghế",
    "Bellagio pouffe": "Ghế",
    "Milano pouffe": "Ghế",
    "Sweet Art pouffe": "Ghế",
    "Southampton pouffe on wheels with storage": "Ghế",
    "Carmo 1-seater, no armrests": "Sofa",
    "Bolzano 2.5-seater": "Sofa",
    "Southampton sleeper W140xL200cm": "Sofa",
    "Taylor sleeper W140xL200cm": "Sofa",
    "Southampton sleeper W160xL200cm": "Sofa",
    "Taylor sleeper W160xL200cm": "Sofa",
    "London large bench with cushion": "Bàn",
    "Princeton bench": "Bàn",
    "Bolzano bench": "Bàn",
    "Sideboard with drawer section": "Bàn",
    "Sideboard with bar section": "Bàn",
    "Sideboard with drop-down section": "Bàn",
    "Lugano sideboard": "Bàn",
    "Fermo sideboard": "Bàn",
    "Lugano dresser, carved fronts": "Bàn",
    "Lugano double dresser, carved fronts": "Bàn",
    "Element dresser with 6 drawers": "Bàn",
    "Element dresser with 3 drawers": "Bàn",
    "Element dresser with 4 drawers": "Bàn",
    "Headrest": "Phụ kiện",
    "Indivi headrest": "Phụ kiện",
    "Salamanca cushion": "Phụ kiện",
    "Bergamo deco cushions": "Phụ kiện"
};

const deleteList = [
    "Hampton corner sofa with adjustable back and lounging unit",
    "Hampton sofa with adjustable back and resting unit left side",
    "Hampton sofa with adjustable back, resting unit and storage left side",
    "Hampton sofa with adjustable back and lounging unit left side, armrest right",
    "Hampton corner sofa with adjustable back"
];

const renameMap = {
    "Element bed, wall-mounted headboard, with slats, excl. mattress": "REMS bedspread",
    "Bolzano bed - W140xL200cm": "Element bed, wall-mounted headboard, with slats, excl. mattress"
};

// Filter out deleted items
data = data.filter(p => !deleteList.includes(p.name));

// Apply renames and categories
data.forEach(p => {
    // Categorize based on ORIGINAL name
    if (catMap[p.name]) {
        p.category = catMap[p.name];
    }

    // Rename
    if (renameMap[p.name]) {
        p.name = renameMap[p.name];
        if (p.variants) {
            p.variants.forEach(v => {
                if (v.name === p.name || true) {
                    v.name = p.name; // match main product name
                }
            });
        }
    }
});

// Add 5 lamps if available
try {
    if (fs.existsSync(rawDataPath)) {
        const rawData = JSON.parse(fs.readFileSync(rawDataPath, 'utf8'));
        let addedLamps = 0;
        
        // Find existing product IDs to avoid duplicates
        const existingIds = new Set(data.map(p => p.product_id));

        for (let item of rawData) {
            if (item.name.toLowerCase().includes('lamp') && !existingIds.has(item.id)) {
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
                    category: "Đèn"
                });
                addedLamps++;
                existingIds.add(item.id);
                if (addedLamps >= 5) break;
            }
        }
        console.log(`Added ${addedLamps} lamp products.`);
    } else {
        console.warn("Raw data file not found, skipping adding lamps.");
    }
} catch (e) {
    console.error("Error reading/adding lamps:", e.message);
}

// Write back
const newCode = `${prefix}${JSON.stringify(data, null, 2)};\n`;
fs.writeFileSync(dataAutoPath, newCode, 'utf8');

console.log("Modifications completed successfully.");
