const fs = require('fs');
const path = require('path');

const dataAutoPath = path.join(__dirname, 'data_auto.js');
const dataManualPath = path.join(__dirname, 'data.js');

// Parse data_auto.js
let codeAuto = fs.readFileSync(dataAutoPath, 'utf8');
const prefixAuto = 'const productsDataAuto = ';
const jsonStrAuto = codeAuto.replace(/^const\s+productsDataAuto\s*=\s*/, '').replace(/;\s*$/, '');
let dataAuto = JSON.parse(jsonStrAuto);

// Parse data.js
let codeManual = fs.readFileSync(dataManualPath, 'utf8');
const jsonStrManual = codeManual.replace(/^const\s+productsData\s*=\s*/, '').replace(/;\s*$/, '');
let dataManual = JSON.parse(jsonStrManual);

// Remove the items I accidentally just string-renamed previously
dataAuto = dataAuto.filter(p => {
    if (p.name.includes("REMS bedspread") || p.name.includes("Element bed, wall-mounted headboard")) {
        return false;
    }
    return true;
});

// Fetch the full real products from data.js
const realRems = dataManual.find(p => p.name.includes("REMS bedspread"));
const realElement = dataManual.find(p => p.name.includes("Element bed, wall-mounted headboard"));

if (realRems) dataAuto.push(realRems);
if (realElement) dataAuto.push(realElement);

// Write back
const newCode = `${prefixAuto}${JSON.stringify(dataAuto, null, 2)};\n`;
fs.writeFileSync(dataAutoPath, newCode, 'utf8');

console.log(`Replaced completely! Added REMS: ${!!realRems}, Added Element: ${!!realElement}`);
