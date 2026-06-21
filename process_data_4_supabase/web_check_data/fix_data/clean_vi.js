const fs = require('fs');
const path = require('path');

const dataAutoPath = path.join(__dirname, '../data_auto.js');
let code = fs.readFileSync(dataAutoPath, 'utf8');

// Extract JSON
const jsonStr = code.replace(/^const\s+productsDataAuto\s*=\s*/, '').replace(/;\s*$/, '');
const data = JSON.parse(jsonStr);

function removeViKeys(obj) {
  if (Array.isArray(obj)) {
    obj.forEach(item => removeViKeys(item));
  } else if (typeof obj === 'object' && obj !== null) {
    for (const key in obj) {
      if (key.endsWith('_vi')) {
        delete obj[key];
      } else {
        removeViKeys(obj[key]);
      }
    }
  }
}

removeViKeys(data);

const newDataStr = `const productsDataAuto = ${JSON.stringify(data, null, 2)};`;
fs.writeFileSync(dataAutoPath, newDataStr, 'utf8');

console.log('Đã dọn dẹp xong các trường _vi trong data_auto.js!');
