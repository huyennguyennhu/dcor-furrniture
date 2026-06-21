const fs = require('fs');
const path = require('path');

const dataAutoViPath = path.join(__dirname, '../data_auto_vi.js');
let code = fs.readFileSync(dataAutoViPath, 'utf8');
const jsonStr = code.replace(/^const\s+productsDataAuto\s*=\s*/, '').replace(/;\s*$/, '');
let data = JSON.parse(jsonStr);

let count = 0;
data.forEach(p => {
  if (p.name.split(' ').length > 6) {
    const oldName = p.name;
    // Tách theo các từ nối thường dùng để chỉ định cấu hình dài dòng
    const separators = [' với ', ' kèm ', ' có ', ' cho ', ' tích hợp ', ',', ' - '];
    let newName = p.name;
    
    // Tìm vị trí của từ nối đầu tiên xuất hiện
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
    
    // Bổ sung xử lý đặc biệt cho một số tên
    if (newName === 'Mô-đun 2.5 chỗ ngồi Amsterdam') newName = 'Sofa Amsterdam';
    if (newName === 'Mô-đun thư giãn Amsterdam') newName = 'Sofa thư giãn Amsterdam';
    if (newName === 'Khung tủ dưới Lugano') newName = 'Tủ Lugano';
    
    console.log(`[CŨ] ${oldName}\n[MỚI] ${newName}\n`);
    p.name = newName;
    count++;
  }
});

console.log(`✅ Đã cắt ngắn thành công ${count} tên sản phẩm!`);

const finalStr = `const productsDataAuto = ${JSON.stringify(data, null, 2)};`;
fs.writeFileSync(dataAutoViPath, finalStr, 'utf8');
