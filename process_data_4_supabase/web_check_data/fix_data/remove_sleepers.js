const fs = require('fs');
const path = require('path');

const dataAutoPath = path.join(__dirname, 'data_auto.js');

let code = fs.readFileSync(dataAutoPath, 'utf8');
const prefix = 'const productsDataAuto = ';
const jsonStr = code.replace(/^const\s+productsDataAuto\s*=\s*/, '').replace(/;\s*$/, '');
let data = JSON.parse(jsonStr);

const removeList = [
    "Southampton sleeper W140xL200cm",
    "Taylor sleeper W140xL200cm"
];

let removedCount = 0;
data = data.filter(p => {
    if (removeList.some(r => p.name.includes(r))) {
        removedCount++;
        return false;
    }
    return true;
});

const newCode = `${prefix}${JSON.stringify(data, null, 2)};\n`;
fs.writeFileSync(dataAutoPath, newCode, 'utf8');

console.log(`Removed ${removedCount} items.`);
