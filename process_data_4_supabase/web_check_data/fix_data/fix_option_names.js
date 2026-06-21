const fs = require('fs');
const path = require('path');

const dataAutoViPath = path.join(__dirname, '../data_auto_vi.js');
let code = fs.readFileSync(dataAutoViPath, 'utf8');
const jsonStr = code.replace(/^const\s+productsDataAuto\s*=\s*/, '').replace(/;\s*$/, '');
let data = JSON.parse(jsonStr);

let count = 0;
data.forEach(p => {
  if (p.config_options) {
    p.config_options.forEach(group => {
      if (group.options) {
        group.options.forEach(opt => {
          if (opt.name && opt.name.split(' ').length > 6) {
            const oldName = opt.name;
            let newName = opt.name;
            
            // Xử lý bằng cách cắt bỏ các phần rườm rà
            const separators = [' với ', ' kèm ', ' tích hợp ', ',', ' - ', ' có '];
            let firstIndex = newName.length;
            for (const sep of separators) {
                const idx = newName.toLowerCase().indexOf(sep);
                if (idx !== -1 && idx < firstIndex) {
                    firstIndex = idx;
                }
            }
            
            if (firstIndex < newName.length) {
                newName = newName.substring(0, firstIndex).trim();
            }
            
            // Nếu vẫn > 6 chữ, ép cắt lấy 6 chữ đầu tiên
            const words = newName.split(' ');
            if (words.length > 6) {
                newName = words.slice(0, 6).join(' ');
            }
            
            if (oldName !== newName) {
                console.log(`[CŨ] ${oldName}\n[MỚI] ${newName}\n`);
                opt.name = newName;
                count++;
            }
          }
        });
      }
    });
  }
});

console.log(`✅ Đã cắt ngắn thành công ${count} tên option!`);

const finalStr = `const productsDataAuto = ${JSON.stringify(data, null, 2)};`;
fs.writeFileSync(dataAutoViPath, finalStr, 'utf8');
