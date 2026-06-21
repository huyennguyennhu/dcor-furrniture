const fs = require('fs');
const path = require('path');
const rawPath = path.join(__dirname, '..', '..', '..', 'Crawl_Data', 'file_har', 'new_crawl', 'crawled_v2_final.json');

const raw = JSON.parse(fs.readFileSync(rawPath, 'utf8'));

const keywords = ['rug', 'mirror', 'clock', 'vase', 'throw ', 'tray', 'sculpture', 'cushion', 'blanket', 'planter', 'pot', 'gallery'];
const suggestions = [];

for (const p of raw) {
    const n = p.name.toLowerCase();
    if (keywords.some(k => n.includes(k))) {
        if (!p.name.includes("sofa") && !p.name.includes("chair") && !p.name.includes("bed") && !p.name.includes("table")) {
            suggestions.push({
                name: p.name,
                price: p.basePrice
            });
        }
    }
}

const unique = [];
const seen = new Set();
for (const s of suggestions) {
    if (!seen.has(s.name)) {
        seen.add(s.name);
        unique.push(s);
    }
}

// Print some diverse suggestions
console.log(JSON.stringify(unique.slice(0, 15), null, 2));
