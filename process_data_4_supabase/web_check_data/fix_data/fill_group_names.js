const fs = require('fs');
const path = require('path');

const dataAutoPath = path.join(__dirname, 'data_auto.js');

let code = fs.readFileSync(dataAutoPath, 'utf8');
const prefix = 'const productsDataAuto = ';
const jsonStr = code.replace(/^const\s+productsDataAuto\s*=\s*/, '').replace(/;\s*$/, '');
let data = JSON.parse(jsonStr);

let updatedCount = 0;

data.forEach(p => {
    if (p.config_options) {
        p.config_options.forEach(config => {
            // Only update if groupName is missing or null
            if (!config.groupName || config.groupName === null) {
                if (config.groupId && config.groupId.startsWith('va')) {
                    // Remove 'va' prefix
                    let nameStr = config.groupId.substring(2);
                    // Add space before capital letters and trim
                    nameStr = nameStr.replace(/([A-Z])/g, ' $1').trim();
                    config.groupName = nameStr;
                    updatedCount++;
                }
            }
        });
    }
});

const newCode = `${prefix}${JSON.stringify(data, null, 2)};\n`;
fs.writeFileSync(dataAutoPath, newCode, 'utf8');

console.log(`Updated ${updatedCount} groupNames.`);
