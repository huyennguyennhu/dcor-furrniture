const fs = require('fs');
const path = require('path');

const dataAutoPath = path.join(__dirname, 'data_auto.js');

let code = fs.readFileSync(dataAutoPath, 'utf8');
const prefix = 'const productsDataAuto = ';
const jsonStr = code.replace(/^const\s+productsDataAuto\s*=\s*/, '').replace(/;\s*$/, '');
let data = JSON.parse(jsonStr);

const toGheList = [
    "London large bench with cushion",
    "Princeton bench",
    "Bolzano bench"
];

let changedCount = 0;
data.forEach(p => {
    if (toGheList.includes(p.name)) {
        p.category = "Ghế";
        changedCount++;
    }
});

const newCode = `${prefix}${JSON.stringify(data, null, 2)};\n`;
fs.writeFileSync(dataAutoPath, newCode, 'utf8');

console.log(`Changed ${changedCount} items to 'Ghế'.`);
