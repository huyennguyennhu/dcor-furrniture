const fs = require('fs');
const code = fs.readFileSync('data_auto.js', 'utf8');
const jsonStr = code.replace(/^const\s+productsDataAuto\s*=\s*/, '').replace(/;\s*$/, '');
try {
    const data = JSON.parse(jsonStr);
    let count = 0;
    data.forEach(product => {
        let hasImage = false;
        if (product.config_options) {
            product.config_options.forEach(group => {
                if (group.options) {
                    group.options.forEach(opt => {
                        if (opt.image) hasImage = true;
                    });
                }
            });
        }
        if (hasImage) count++;
    });
    console.log(`Found ${count} products with option images in data_auto.js`);
} catch (e) {
    console.error("Error parsing JSON:", e.message);
}
