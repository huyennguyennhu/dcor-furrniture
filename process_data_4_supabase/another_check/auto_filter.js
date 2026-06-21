const fs = require('fs');
const path = require('path');

const backupPath = path.join(__dirname, 'backup_products.json');
const outPath = path.join(__dirname, 'auto_filtered_170_products.json');
const dataJsPath = path.join(__dirname, 'web_check_data/data_auto.js');

const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));

// Heuristic for category guessing
function guessCategory(p) {
    const name = p.name.toLowerCase();
    if (name.includes('sofa')) return 'Sofa';
    if (name.includes('chair') || name.includes('stool')) return 'Ghế';
    if (name.includes('table') || name.includes('desk')) return 'Bàn';
    if (name.includes('bed') || name.includes('sleeper')) return 'Giường';
    if (name.includes('cabinet') || name.includes('storage') || name.includes('bookcase') || name.includes('sideboard') || name.includes('dresser')) return 'Tủ Kệ';
    if (name.includes('rug')) return 'Thảm';
    if (name.includes('lamp')) return 'Đèn';
    return 'Phụ kiện';
}

// 1. Deduplication by name
const uniqueMap = new Map();
backupData.forEach(p => {
    if (!uniqueMap.has(p.name)) {
        uniqueMap.set(p.name, []);
    }
    uniqueMap.get(p.name).push(p);
});

// 2. For each unique name, pick the one with the highest score (variants + config)
const uniqueBestProducts = [];
uniqueMap.forEach((productsArray) => {
    let bestProduct = productsArray[0];
    let maxScore = -1;
    productsArray.forEach(p => {
        const vCount = typeof p.variants === 'string' ? (JSON.parse(p.variants).length || 0) : (p.variants?.length || 0);
        const cCount = typeof p.configOptions === 'string' ? (JSON.parse(p.configOptions).length || 0) : (p.configOptions?.length || 0);
        const score = vCount + cCount;
        
        // Bonus for having images
        let hasImage = false;
        try {
            const v = typeof p.variants === 'string' ? JSON.parse(p.variants) : p.variants;
            if (v && v.length > 0 && v[0].images && v[0].images.length > 0) hasImage = true;
        } catch(e){}

        const finalScore = hasImage ? score + 100 : score;

        if (finalScore > maxScore) {
            maxScore = finalScore;
            bestProduct = p;
        }
    });
    
    const vCountFinal = typeof bestProduct.variants === 'string' ? (JSON.parse(bestProduct.variants).length || 0) : (bestProduct.variants?.length || 0);
    const cCountFinal = typeof bestProduct.configOptions === 'string' ? (JSON.parse(bestProduct.configOptions).length || 0) : (bestProduct.configOptions?.length || 0);
    
    bestProduct.calc_score = maxScore;
    bestProduct.cat_guess = guessCategory(bestProduct);
    uniqueBestProducts.push(bestProduct);
});

// 3. Category balancing (we want 170 total)
// Let's first group by category
const catGroups = {};
uniqueBestProducts.forEach(p => {
    if (!catGroups[p.cat_guess]) catGroups[p.cat_guess] = [];
    catGroups[p.cat_guess].push(p);
});

// Sort each category by score descending
Object.keys(catGroups).forEach(cat => {
    catGroups[cat].sort((a,b) => b.calc_score - a.calc_score);
});

// We want to pick up to a certain max per category, then fill the rest with top remaining
const TARGET = 170;
let selected = [];

// Base quota per category to ensure diversity (if available)
const quotas = {
    'Sofa': 40,
    'Ghế': 30,
    'Bàn': 25,
    'Tủ Kệ': 30,
    'Giường': 10,
    'Đèn': 10,
    'Thảm': 10,
    'Phụ kiện': 15
};

Object.keys(catGroups).forEach(cat => {
    const quota = quotas[cat] || 10;
    const taken = catGroups[cat].splice(0, quota);
    selected.push(...taken);
});

// If we need more to reach 170, take from the remaining, sorted globally by score
if (selected.length < TARGET) {
    let remaining = [];
    Object.keys(catGroups).forEach(cat => {
        remaining.push(...catGroups[cat]);
    });
    remaining.sort((a,b) => b.calc_score - a.calc_score);
    const need = TARGET - selected.length;
    selected.push(...remaining.splice(0, need));
} else if (selected.length > TARGET) {
    // Should not happen with these quotas as sum is 170, but just in case
    selected.sort((a,b) => b.calc_score - a.calc_score);
    selected = selected.slice(0, TARGET);
}

// 4. Map to snake_case and add flags
const finalProducts = selected.map(p => {
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

// 5. Randomly assign flags
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
fs.writeFileSync(dataJsPath, 'const productsDataAuto = ' + JSON.stringify(finalProducts) + ';', 'utf8');

console.log(`Auto-filtered to ${finalProducts.length} products. Wrote to JSON and JS.`);
