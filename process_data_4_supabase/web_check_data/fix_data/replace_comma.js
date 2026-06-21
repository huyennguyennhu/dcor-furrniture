const fs = require('fs');
const path = require('path');

const dataAutoPath = path.join(__dirname, 'data_auto.js');

let code = fs.readFileSync(dataAutoPath, 'utf8');

// Perform a global string replacement for '2,5' -> '2.5'
const newCode = code.replace(/2,5/g, '2.5');

fs.writeFileSync(dataAutoPath, newCode, 'utf8');

console.log("Successfully replaced all '2,5' with '2.5' in data_auto.js.");
