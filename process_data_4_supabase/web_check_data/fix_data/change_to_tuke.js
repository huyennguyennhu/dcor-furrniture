const fs = require('fs');
const path = require('path');

const dataAutoPath = path.join(__dirname, 'data_auto.js');

let code = fs.readFileSync(dataAutoPath, 'utf8');
const prefix = 'const productsDataAuto = ';
const jsonStr = code.replace(/^const\s+productsDataAuto\s*=\s*/, '').replace(/;\s*$/, '');
let data = JSON.parse(jsonStr);

const toTuKeList = [
    "Sideboard with drawer section",
    "Sideboard with bar section",
    "Sideboard with drop-down section",
    "Lugano sideboard",
    "Fermo sideboard",
    "Lugano dresser, carved fronts",
    "Lugano double dresser, carved fronts",
    "Element dresser with 6 drawers",
    "Element dresser with 3 drawers",
    "Element dresser with 4 drawers"
];

let changedCount = 0;
data.forEach(p => {
    if (toTuKeList.includes(p.name)) {
        p.category = "Tủ kệ";
        changedCount++;
    }
});

const newCode = `${prefix}${JSON.stringify(data, null, 2)};\n`;
fs.writeFileSync(dataAutoPath, newCode, 'utf8');

console.log(`Changed ${changedCount} items to 'Tủ kệ'.`);
