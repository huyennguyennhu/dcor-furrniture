const fs = require('fs');
const path = require('path');

function replaceInDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        if (file === 'node_modules' || file === '.next' || file === '.git') continue;
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            replaceInDir(fullPath);
        } else {
            if (!fullPath.match(/\.(tsx|ts|css|md|js)$/)) continue;
            let content = fs.readFileSync(fullPath, 'utf8');
            let newContent = content.replace(/DCor/g, 'DCor').replace(/DCOR/g, 'DCOR');
            if (content !== newContent) {
                fs.writeFileSync(fullPath, newContent, 'utf8');
                console.log(`Updated: ${fullPath}`);
            }
        }
    }
}

replaceInDir(__dirname);
console.log("Done replacing DCor to DCor");
