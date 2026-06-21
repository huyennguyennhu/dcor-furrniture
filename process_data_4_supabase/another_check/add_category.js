const fs = require('fs');
const path = require('path');

const filesToUpdate = [
    'final_170_products.json',
    'auto_filtered_170_products.json',
    'backup_products.json'
];

function guessCategory(name) {
    name = name.toLowerCase();
    if (name.includes('sofa')) return 'Sofa';
    if (name.includes('chair') || name.includes('stool')) return 'Ghế';
    if (name.includes('table') || name.includes('desk')) return 'Bàn';
    if (name.includes('bed')) return 'Giường';
    if (name.includes('cabinet') || name.includes('storage') || name.includes('bookcase')) return 'Tủ Kệ';
    if (name.includes('rug')) return 'Thảm';
    if (name.includes('lamp')) return 'Đèn';
    return 'Phụ kiện / Khác';
}

filesToUpdate.forEach(fileName => {
    const filePath = path.join(__dirname, fileName);
    if (fs.existsSync(filePath)) {
        console.log(`Processing ${fileName}...`);
        try {
            const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            data.forEach(p => {
                if (!p.category) {
                    p.category = guessCategory(p.name);
                }
            });
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
            console.log(`Updated ${fileName} with category field.`);
        } catch (err) {
            console.error(`Error processing ${fileName}:`, err);
        }
    }
});

// Also update web_check_data files
const webFiles = [
    { name: 'data.js', jsonPath: 'final_170_products.json', varName: 'productsData' },
    { name: 'data_auto.js', jsonPath: 'auto_filtered_170_products.json', varName: 'productsDataAuto' }
];

webFiles.forEach(wf => {
    const jsPath = path.join(__dirname, 'web_check_data', wf.name);
    const jsonPath = path.join(__dirname, wf.jsonPath);
    if (fs.existsSync(jsPath) && fs.existsSync(jsonPath)) {
        console.log(`Updating ${wf.name}...`);
        try {
            const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
            const jsContent = `const ${wf.varName} = ${JSON.stringify(data, null, 2)};`;
            fs.writeFileSync(jsPath, jsContent, 'utf8');
            console.log(`Updated ${wf.name}.`);
        } catch (err) {
            console.error(`Error updating ${wf.name}:`, err);
        }
    }
});
