const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const path = require('path');

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
    model: "gemini-flash-latest", 
    generationConfig: { responseMimeType: "application/json" } 
  });
}

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function translateChunk(textsChunk) {
  if (textsChunk.length === 0) return {};
  
  const prompt = `Bạn là chuyên gia nội thất. Dịch các chuỗi tiếng Anh sau sang tiếng Việt chuẩn văn phong sang trọng (BoConcept).
QUY TẮC QUAN TRỌNG:
1. BẮT BUỘC DỊCH CÁC TỪ VỰNG TIẾNG ANH (Ví dụ: "Yes" -> "Có", "No" -> "Không", "black" -> "đen", "steel" -> "thép").
2. NHỮNG TÊN RIÊNG (tên thiết kế, tên bộ sưu tập) GIỮ LẠI NGUYÊN BẢN.
3. TRẢ VỀ ĐÚNG JSON LÀ MỘT DICTIONARY map { "chuỗi gốc": "chuỗi dịch" }. KHÔNG thay đổi cấu trúc mảng nếu chuỗi gốc có ký tự đặc biệt như dấu |. Các đoạn ngăn cách bởi | hãy giữ nguyên dấu | và dịch từng đoạn nhỏ bên trong.

Input (Mảng các chuỗi cần dịch):
${JSON.stringify(textsChunk)}

Output JSON:`;

  const model = getGenerativeModel();
  try {
    const result = await model.generateContent(prompt);
    let responseText = result.response.text();
    if (responseText.startsWith('\`\`\`json')) {
      responseText = responseText.replace(/^\`\`\`json\n/, '').replace(/\n\`\`\`$/, '');
    }
    return JSON.parse(responseText);
  } catch (error) {
    console.error(" Lỗi dịch thuật API:", error.message);
    return null;
  }
}

async function main() {
  const dataAutoViPath = path.join(__dirname, '../data_auto_vi.js');
  const dictionaryPath = path.join(__dirname, 'dictionary.json');

  console.log("📥 Đọc dữ liệu từ data_auto_vi.js...");
  let code = fs.readFileSync(dataAutoViPath, 'utf8');
  const jsonStr = code.replace(/^const\s+productsDataAuto\s*=\s*/, '').replace(/;\s*$/, '');
  let data = JSON.parse(jsonStr);

  const keysToTranslate = [
    'designFeatures', 'importantFunctions', 'shape', 'composition', 
    'accessoryColour', 'careInstructions', 'backSideCoating', 
    'colourCord', 'lightSource', 'bulbIncluded', 'withOnOffSwitch', 
    'mattressIncluded'
  ];

  // 1. Trích xuất từ vựng
  const uniqueTexts = new Set();
  data.forEach(p => {
    p.variants?.forEach(vr => {
      if (vr.details) {
        keysToTranslate.forEach(k => {
          if (vr.details[k] && typeof vr.details[k] === 'string') {
            uniqueTexts.add(vr.details[k]);
          }
        });
      }
    });
  });

  const allTexts = Array.from(uniqueTexts).filter(t => t.trim() !== '' && /[a-zA-Z]/.test(t));
  console.log(`🔍 Tìm thấy ${allTexts.length} cụm từ tiếng Anh duy nhất cần dịch trong các trường details mở rộng.`);

  // 2. Load Dictionary
  let dictionary = {};
  if (fs.existsSync(dictionaryPath)) {
    dictionary = JSON.parse(fs.readFileSync(dictionaryPath, 'utf8'));
  }

  // 3. Lọc ra các từ chưa dịch
  const missingTexts = allTexts.filter(t => !dictionary.hasOwnProperty(t));
  console.log(`🚀 Còn ${missingTexts.length} từ cần dịch...`);

  // 4. Chia chunk
  const chunkSize = 20;
  for (let i = 0; i < missingTexts.length; i += chunkSize) {
    const chunk = missingTexts.slice(i, i + chunkSize);
    console.log(`⏳ Đang dịch chunk ${i/chunkSize + 1}/${Math.ceil(missingTexts.length/chunkSize)}...`);
    
    let chunkDict = null;
    while (!chunkDict) {
      chunkDict = await translateChunk(chunk);
      if (!chunkDict) {
        console.log("   Mạng yếu. Nghỉ 5s rồi thử lại...");
        await delay(5000);
      }
    }

    Object.assign(dictionary, chunkDict);
    fs.writeFileSync(dictionaryPath, JSON.stringify(dictionary, null, 2), 'utf8');
    await delay(1000); 
  }
  
  console.log("✅ Dịch toàn bộ Dictionary hoàn tất!");

  // 5. Áp dụng Dictionary vào Data
  const translate = (str) => {
    if (typeof str === 'string' && dictionary[str]) return dictionary[str];
    return str;
  };

  data.forEach(p => {
    p.variants?.forEach(vr => {
      if (vr.details) {
        keysToTranslate.forEach(k => {
          if (vr.details[k]) vr.details[k] = translate(vr.details[k]);
        });
      }
    });
  });

  // 6. Lưu file cuối cùng
  const finalStr = `const productsDataAuto = ${JSON.stringify(data, null, 2)};`;
  fs.writeFileSync(dataAutoViPath, finalStr, 'utf8');

  console.log("🎉 TẤT CẢ ĐÃ XONG! Đã bổ sung bản dịch cho các trường mở rộng!");
}

main();
