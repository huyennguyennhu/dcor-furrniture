const fs = require('fs');
const path = require('path');

const dataAutoPath = path.join(__dirname, '../data_auto.js');

let code = fs.readFileSync(dataAutoPath, 'utf8');
const jsonStr = code.replace(/^const\s+productsDataAuto\s*=\s*/, '').replace(/;\s*$/, '');
const data = JSON.parse(jsonStr);

let uniqueImages = new Set();
let configImages = 0;
let variantImages = 0;
let productImagesCount = 0;

data.forEach(p => {
    // 1. Product main images
    if (p.images && Array.isArray(p.images)) {
        p.images.forEach(img => {
            if (img) {
                uniqueImages.add(img);
                productImagesCount++;
            }
        });
    }

    // 2. Config option images
    if (p.config_options && Array.isArray(p.config_options)) {
        p.config_options.forEach(config => {
            if (config.options && Array.isArray(config.options)) {
                config.options.forEach(opt => {
                    if (opt.image) {
                        uniqueImages.add(opt.image);
                        configImages++;
                    }
                });
            }
        });
    }

    // 3. Variant images
    if (p.variants && Array.isArray(p.variants)) {
        p.variants.forEach(v => {
            if (v.images && Array.isArray(v.images)) {
                v.images.forEach(img => {
                    if (img) {
                        uniqueImages.add(img);
                        variantImages++;
                    }
                });
            }
        });
    }
});

console.log("Total unique images:", uniqueImages.size);
console.log("Details (includes duplicates across products/variants):");
console.log(" - Default product images:", productImagesCount);
console.log(" - Config option images (materials, legs, etc):", configImages);
console.log(" - Variant images:", variantImages);
