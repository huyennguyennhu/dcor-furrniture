const fs = require('fs');
const path = require('path');

const dataAutoPath = path.join(__dirname, 'data_auto.js');

let code = fs.readFileSync(dataAutoPath, 'utf8');
const prefix = 'const productsDataAuto = ';
const jsonStr = code.replace(/^const\s+productsDataAuto\s*=\s*/, '').replace(/;\s*$/, '');
let data = JSON.parse(jsonStr);

// Find vases by checking if the name contains 'vase'
let vases = data.filter(p => p.name.toLowerCase().includes('vase'));
console.log(`Found ${vases.length} vases.`);

if (vases.length >= 5) {
    // Pick the first 5 vases to remove
    let vasesToRemove = vases.slice(0, 5).map(v => v.product_id);
    
    console.log("Removing the following 5 vases:");
    vases.slice(0, 5).forEach(v => console.log(` - ${v.name} (ID: ${v.product_id})`));
    
    data = data.filter(p => !vasesToRemove.includes(p.product_id));
    
    const newCode = `${prefix}${JSON.stringify(data, null, 2)};\n`;
    fs.writeFileSync(dataAutoPath, newCode, 'utf8');
    console.log(`Successfully removed 5 vases. New total products: ${data.length}`);
} else if (vases.length > 0) {
    console.log(`Only found ${vases.length} vases, removing all of them.`);
    let vasesToRemove = vases.map(v => v.product_id);
    vases.forEach(v => console.log(` - ${v.name} (ID: ${v.product_id})`));
    data = data.filter(p => !vasesToRemove.includes(p.product_id));
    
    const newCode = `${prefix}${JSON.stringify(data, null, 2)};\n`;
    fs.writeFileSync(dataAutoPath, newCode, 'utf8');
    console.log(`Successfully removed ${vases.length} vases. New total products: ${data.length}`);
} else {
    console.log(`No vases found.`);
}
