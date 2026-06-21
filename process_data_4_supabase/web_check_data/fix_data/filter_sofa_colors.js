const fs = require('fs');
const path = require('path');

const dataAutoPath = path.join(__dirname, 'data_auto.js');

let code = fs.readFileSync(dataAutoPath, 'utf8');
const prefix = 'const productsDataAuto = ';
const jsonStr = code.replace(/^const\s+productsDataAuto\s*=\s*/, '').replace(/;\s*$/, '');
let data = JSON.parse(jsonStr);

const priorityColors = [
    "light grey Frisco fabric with aquaclean 2063",
    "dark blue Frisco fabric with aquaclean 2065",
    "sand-coloured Nani fabric 2110",
    "dark grey Nani fabric 2111",
    "stone grey Frisco fabric with aquaclean 2067",
    "taupe Napoli fabric 2251",
    "golden beige Napoli fabric 2252",
    "turquoise Napoli fabric 2253",
    "dark blue Napoli fabric 2257",
    "beige Bristol fabric 3063"
].map(c => c.toLowerCase());

let updatedCount = 0;

data.forEach(p => {
    if (p.category === "Sofa") {
        if (p.config_options && Array.isArray(p.config_options)) {
            // Find the config option group with max options. In sofas, this is almost always the Material/Color group
            let largestGroupIndex = -1;
            let maxOptions = 0;
            
            p.config_options.forEach((group, idx) => {
                if (group.options && group.options.length > maxOptions) {
                    maxOptions = group.options.length;
                    largestGroupIndex = idx;
                }
            });

            if (maxOptions > 10) {
                let group = p.config_options[largestGroupIndex];
                
                // Separate options into priority and others
                let priorityOpts = [];
                let otherOpts = [];
                
                group.options.forEach(opt => {
                    let optNameStr = (opt.name || "").toLowerCase();
                    // Check if it exactly matches or includes the priority color
                    let isPriority = priorityColors.some(pc => optNameStr.includes(pc));
                    if (isPriority) {
                        priorityOpts.push(opt);
                    } else {
                        otherOpts.push(opt);
                    }
                });
                
                let newOptions = [];
                // Add priority options first
                priorityOpts.forEach(opt => {
                    if (newOptions.length < 10) newOptions.push(opt);
                });
                // Fill up to 10 with others
                otherOpts.forEach(opt => {
                    if (newOptions.length < 10) newOptions.push(opt);
                });
                
                // Removed IDs
                let keptIds = new Set(newOptions.map(o => o.id));
                let allIds = new Set(group.options.map(o => o.id));
                let removedIds = [...allIds].filter(id => !keptIds.has(id));
                
                group.options = newOptions;
                
                // Filter the variants array
                if (p.variants && Array.isArray(p.variants)) {
                    p.variants = p.variants.filter(v => {
                        if (v.config_combination && Array.isArray(v.config_combination)) {
                            for (let id of removedIds) {
                                if (v.config_combination.includes(id)) {
                                    return false; // Uses a removed color option, so discard
                                }
                            }
                        }
                        return true;
                    });
                }
                
                updatedCount++;
            }
        }
    }
});

const newCode = `${prefix}${JSON.stringify(data, null, 2)};\n`;
fs.writeFileSync(dataAutoPath, newCode, 'utf8');
console.log(`Updated ${updatedCount} Sofa products by trimming color variants to 10.`);
