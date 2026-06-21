const fs = require('fs');
const path = require('path');

const dataAutoPath = path.join(__dirname, 'data_auto.js');

let code = fs.readFileSync(dataAutoPath, 'utf8');
const prefix = 'const productsDataAuto = ';
const jsonStr = code.replace(/^const\s+productsDataAuto\s*=\s*/, '').replace(/;\s*$/, '');
let data = JSON.parse(jsonStr);

let removedHeadrests = 0;
let removedPhuKien = 0;
let syncedTuKe = 0;

data = data.filter(p => {
    // Remove if name has "headrest"
    if (p.name.toLowerCase().includes('headrest')) {
        removedHeadrests++;
        return false;
    }

    // Determine effective category
    let cat = p.category || 'Phụ kiện / Khác';
    if (cat.includes('Phụ kiện') || cat.includes('Khác')) {
        removedPhuKien++;
        return false; // Remove them
    }

    return true;
});

data.forEach(p => {
    if (p.category && p.category.toLowerCase() === 'tủ kệ') {
        if (p.category !== 'Tủ kệ') {
            p.category = 'Tủ kệ';
            syncedTuKe++;
        }
    }
});

const newCode = `${prefix}${JSON.stringify(data, null, 2)};\n`;
fs.writeFileSync(dataAutoPath, newCode, 'utf8');

console.log(`Removed ${removedHeadrests} headrest items.`);
console.log(`Removed ${removedPhuKien} Phụ kiện/Khác items.`);
console.log(`Synced ${syncedTuKe} Tủ Kệ to 'Tủ kệ'.`);
