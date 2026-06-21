const fs = require('fs');
const path = require('path');
const dataAutoPath = path.join(__dirname, 'data_auto.js');
let code = fs.readFileSync(dataAutoPath, 'utf8');
const prefix = 'const productsDataAuto = ';
const jsonStr = code.replace(/^const\s+productsDataAuto\s*=\s*/, '').replace(/;\s*$/, '');
let data = JSON.parse(jsonStr);

let renamed = 0;
data.forEach(p => {
    // Clean name for matching
    const cleanName = p.name.replace(/\s+/g, ' ').trim();

    if (cleanName === "Bolzano bed - W140xL200cm") {
        p.name = "Element bed, wall-mounted headboard, with slats, excl. mattress";
        if (p.variants) {
            p.variants.forEach(v => {
                v.name = p.name;
            });
        }
        renamed++;
    }
});

const newCode = `${prefix}${JSON.stringify(data, null, 2)};\n`;
fs.writeFileSync(dataAutoPath, newCode, 'utf8');
console.log(`Renamed ${renamed} Bolzano bed product(s).`);
