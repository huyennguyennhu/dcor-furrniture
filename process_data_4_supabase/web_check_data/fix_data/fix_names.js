const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const keys = [
  "AIzaSyA2mtNIZNk9gXV4eCOWT8Nd30jckT59rv4",
  "AIzaSyBmuF8KaEVEmcDTsw3fXb8-IBTqSAT_jNw",
  "AQ.Ab8RN6LRhjd5l8nzPE4q5rXTDwSkV8K3nlXOND5xjW4lYn8xBA",
  "AQ.Ab8RN6KZWsxtTr01YPJViYIXdGPj1CYkWtPrpDnxocHNgs_LSw",
  "AQ.Ab8RN6JXWm3TexyZNY_St9Lf5Lk-o7y4G8InetjQlp9OQ-7cTg"
];
let keyIndex = 0;

function getGenerativeModel() {
  const key = keys[keyIndex];
  keyIndex = (keyIndex + 1) % keys.length;
  const genAI = new GoogleGenerativeAI(key);
  return genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash", 
    generationConfig: { responseMimeType: "application/json" } 
  });
}

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  const dataAutoViPath = path.join(__dirname, '../data_auto_vi.js');
  let code = fs.readFileSync(dataAutoViPath, 'utf8');
  const jsonStr = code.replace(/^const\s+productsDataAuto\s*=\s*/, '').replace(/;\s*$/, '');
  let data = JSON.parse(jsonStr);

  const longNames = [];
  data.forEach(p => {
    if (p.name.split(' ').length > 6) {
      longNames.push(p.name);
    }
  });

  console.log(`Tìm thấy ${longNames.length} tên sản phẩm vi phạm quy tắc dài hơn 6 chữ.`);
  
  if(longNames.length === 0) {
      console.log("Không có tên nào vi phạm!");
      return;
  }

  const prompt = `Bạn là chuyên gia về nội thất Đan Mạch (BoConcept).
Dưới đây là mảng các tên sản phẩm bị quá dài (chứa mô tả cấu hình như trái/phải, ngăn kéo, tựa lưng...).
Nhiệm vụ của bạn là rút gọn tên sản phẩm lại thành tên gốc (tối đa 5-6 chữ).
Chỉ giữ lại "Loại sản phẩm" + "Tên Bộ sưu tập".
KHÔNG giữ lại các chi tiết cấu hình rườm rà.

Ví dụ:
- "Sofa Hampton với lưng tựa điều chỉnh và đơn vị thư giãn bên phải" -> "Sofa góc Hampton" hoặc "Sofa Hampton"
- "Giường Element, đầu giường gắn liền, kèm dát giường, không bao gồm nệm" -> "Giường Element"
- "Bàn trà đa năng có ngăn chứa đồ Chiva" -> "Bàn trà đa năng Chiva"
- "Ghế ăn Adelaide có chức năng xoay" -> "Ghế ăn Adelaide"

Đầu vào:
${JSON.stringify(longNames)}

Trả về đúng một JSON Object (Dictionary) dạng: { "Tên cũ dài": "Tên mới rút gọn" }`;

  const model = getGenerativeModel();
  let resultDict = {};
  
  try {
    const result = await model.generateContent(prompt);
    let text = result.response.text();
    text = text.replace(/^\`\`\`json\n/, '').replace(/\n\`\`\`$/, '');
    resultDict = JSON.parse(text);
    console.log("Dịch thành công:\n", resultDict);
  } catch(e) {
    console.error("Lỗi API Gemini:", e.message);
    return;
  }

  // Áp dụng tên mới
  data.forEach(p => {
    if (resultDict[p.name]) {
      p.name = resultDict[p.name];
    }
  });

  const finalStr = `const productsDataAuto = ${JSON.stringify(data, null, 2)};`;
  fs.writeFileSync(dataAutoViPath, finalStr, 'utf8');

  console.log("✅ Đã cập nhật xong tên sản phẩm!");
}

main();
