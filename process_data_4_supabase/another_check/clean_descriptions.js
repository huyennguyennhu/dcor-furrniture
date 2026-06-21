const fs = require('fs');
const path = require('path');

const filesToClean = [
    'final_170_products.json',
    'auto_filtered_170_products.json'
];

function isGarbage(text) {
    if (typeof text !== 'string') return true;
    if (text.trim().length < 10) return true;
    if (text.includes('http://') || text.includes('https://')) return true;
    if (text.includes('__') && text.includes('module')) return true; // CSS Modules
    if (text.includes('.css')) return true;
    if (text.includes('gtag') || text.includes('dataLayer') || text.includes('window.')) return true; // JS Code
    if (text.includes('Entering your phone number') || text.includes('technical issue') || text.includes('error')) return true;
    if (text.includes('Footer') || text.includes('Header') || text.includes('button')) return true;
    if (text.includes('SALE') || text.includes('invoice') || text.includes('delivery')) return true;
    if (text.includes('{') && text.includes('}')) return true; // templates like {title} | {productType}
    return false;
}

function cleanDescription(desc) {
    let arr = [];
    if (typeof desc === 'string') {
        try { arr = JSON.parse(desc); } catch(e) { return desc; }
    } else if (Array.isArray(desc)) {
        arr = desc;
    } else {
        return "[]";
    }

    if (!Array.isArray(arr)) return JSON.stringify(arr);

    const cleaned = arr.filter(t => !isGarbage(t));
    
    // Return a neat single string if we found valid descriptions, otherwise empty
    if (cleaned.length === 0) return "Chưa có mô tả chi tiết cho sản phẩm này.";
    
    // Deduplicate and join
    const unique = [...new Set(cleaned)];
    return unique.join(' ');
}

filesToClean.forEach(fileName => {
    const filePath = path.join(__dirname, fileName);
    if (fs.existsSync(filePath)) {
        let data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        data.forEach(p => {
            p.description = cleanDescription(p.description);
        });
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
        console.log(`Cleaned descriptions in ${fileName}`);
        
        // Also update the JS files for the web check
        if (fileName === 'final_170_products.json') {
            fs.writeFileSync(path.join(__dirname, 'web_check_data/data.js'), 'const productsData = ' + JSON.stringify(data) + ';', 'utf8');
        } else if (fileName === 'auto_filtered_170_products.json') {
            fs.writeFileSync(path.join(__dirname, 'web_check_data/data_auto.js'), 'const productsDataAuto = ' + JSON.stringify(data) + ';', 'utf8');
        }
    }
});
