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

// Convert UTC timestamp to GMT+7 string format
function toGMT7(dateString) {
  if (!dateString) return dateString;
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  const gmt7Time = date.getTime() + (7 * 60 * 60 * 1000);
  const localDate = new Date(gmt7Time);
  return localDate.toISOString().replace('Z', '+07:00');
}

async function translateChunk(textsChunk) {
  if (textsChunk.length === 0) return {};
  
  const prompt = `Bạn là chuyên gia nội thất. Dịch các chuỗi tiếng Anh sau sang tiếng Việt chuẩn văn phong sang trọng (BoConcept).
QUY TẮC QUAN TRỌNG:
1. BẮT BUỘC DỊCH CÁC TỪ VỰNG TIẾNG ANH (Ví dụ: "dining chair" -> "ghế ăn", "vase" -> "lọ hoa", "sofa" -> "sofa", "fabric" -> "vải bọc", "leg" -> "chân đế", "oak" -> "gỗ sồi", "walnut" -> "gỗ óc chó", "armrest" -> "tựa tay").
2. NHƯNG NHỮNG TÊN RIÊNG (Ví dụ: tên thương hiệu, tên Collection như Ottawa, Indivi, Amsterdam, Fermo, Salamanca, Carmo) THÌ BẮT BUỘC PHẢI GIỮ LẠI NGUYÊN BẢN TIẾNG ANH, không được dịch ra. Ví dụ: "Ottawa dining chair" -> "Ghế ăn Ottawa", "Indivi corner sofa" -> "Sofa góc Indivi".
3. TRẢ VỀ ĐÚNG JSON LÀ MỘT DICTIONARY map { "chuỗi gốc": "chuỗi dịch" }. Không thay đổi cấu trúc mảng nếu chuỗi gốc có ký tự đặc biệt như |.

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
  const dataAutoPath = path.join(__dirname, '../data_auto.js');
  const dataAutoViPath = path.join(__dirname, '../data_auto_vi.js');
  const dictionaryPath = path.join(__dirname, 'dictionary.json');

  console.log("📥 Đọc dữ liệu gốc từ data_auto.js...");
  const code = fs.readFileSync(dataAutoPath, 'utf8');
  const jsonStr = code.replace(/^const\s+productsDataAuto\s*=\s*/, '').replace(/;\s*$/, '');
  let data;
  try {
    data = JSON.parse(jsonStr);
  } catch(e) {
    console.error("Lỗi parse file json", e);
    process.exit(1);
  }

  // 1. Trích xuất toàn bộ từ vựng unique
  const uniqueTexts = new Set();
  data.forEach(p => {
    if (p.name) uniqueTexts.add(p.name);
    if (p.category) uniqueTexts.add(p.category);
    if (Array.isArray(p.description)) {
      p.description.forEach(d => uniqueTexts.add(d));
    } else if (p.description) {
      uniqueTexts.add(p.description);
    }
    p.config_options?.forEach(opt => {
      if (opt.name) uniqueTexts.add(opt.name);
      opt.options?.forEach(sub => {
         if (sub.name) uniqueTexts.add(sub.name);
      });
    });
    p.variants?.forEach(vr => {
      if (vr.name) uniqueTexts.add(vr.name);
      if (vr.details) {
        if (vr.details.finish) uniqueTexts.add(vr.details.finish);
        if (vr.details.productSpecification) uniqueTexts.add(vr.details.productSpecification);
        if (vr.details.upholsteryComposition) uniqueTexts.add(vr.details.upholsteryComposition);
      }
    });
  });

  const allTexts = Array.from(uniqueTexts).filter(t => typeof t === 'string' && t.trim() !== '' && /[a-zA-Z]/.test(t));
  console.log(`🔍 Tìm thấy ${allTexts.length} cụm từ tiếng Anh duy nhất cần dịch.`);

  // 2. Load Dictionary
  let dictionary = {};
  if (fs.existsSync(dictionaryPath)) {
    dictionary = JSON.parse(fs.readFileSync(dictionaryPath, 'utf8'));
    console.log(`📖 Đã load ${Object.keys(dictionary).length} từ đã dịch từ dictionary.json`);
  }

  // 3. Lọc ra các từ chưa dịch
  const missingTexts = allTexts.filter(t => !dictionary.hasOwnProperty(t));
  console.log(`🚀 Còn ${missingTexts.length} từ cần dịch...`);

  // 4. Chia chunk và dịch vét (Infinite Retry chống rớt mạng)
  const chunkSize = 40;
  for (let i = 0; i < missingTexts.length; i += chunkSize) {
    const chunk = missingTexts.slice(i, i + chunkSize);
    console.log(`⏳ Đang dịch chunk ${i/chunkSize + 1}/${Math.ceil(missingTexts.length/chunkSize)}...`);
    
    let chunkDict = null;
    while (!chunkDict) {
      chunkDict = await translateChunk(chunk);
      if (!chunkDict) {
        console.log("   Mạng yếu hoặc API Limit. Nghỉ 10s rồi thử lại ngay...");
        await delay(10000);
      }
    }

    // Gộp kết quả
    Object.assign(dictionary, chunkDict);
    // Lưu tạm vào ổ cứng để chống mất mạng
    fs.writeFileSync(dictionaryPath, JSON.stringify(dictionary, null, 2), 'utf8');
    await delay(2000); // Ngủ một chút giữa các chunk
  }
  
  console.log("✅ Dịch toàn bộ Dictionary hoàn tất!");

  // 5. Áp dụng Dictionary vào Data và Format các trường
  console.log("⚙️ Đang ép từ điển vào dữ liệu và Format base_price, GMT+7...");
  const translatedData = JSON.parse(JSON.stringify(data)); // Deep clone
  
  const translate = (str) => {
    if (typeof str === 'string' && dictionary[str]) return dictionary[str];
    return str;
  };

  translatedData.forEach(p => {
    p.name = translate(p.name);
    p.category = translate(p.category);
    
    if (Array.isArray(p.description)) {
      p.description = p.description.map(translate);
    } else {
      p.description = translate(p.description);
    }

    p.config_options?.forEach(opt => {
      opt.name = translate(opt.name);
      opt.options?.forEach(sub => {
         sub.name = translate(sub.name);
      });
    });

    // Calculate base_price
    let minPrice = Infinity;
    p.variants?.forEach(vr => {
      vr.name = translate(vr.name);
      if (vr.details) {
        vr.details.finish = translate(vr.details.finish);
        vr.details.productSpecification = translate(vr.details.productSpecification);
        vr.details.upholsteryComposition = translate(vr.details.upholsteryComposition);
      }
      if (vr.price && vr.price < minPrice) {
        minPrice = vr.price;
      }
    });

    if (minPrice !== Infinity) {
      p.base_price = minPrice; // Sửa lỗi base_price = 0
    }

    // Format Thời gian GMT+7
    if (p.created_at) p.created_at = toGMT7(p.created_at);
    if (p.updated_at) p.updated_at = toGMT7(p.updated_at);
  });

  // 6. Lưu file cuối cùng
  const finalStr = `const productsDataAuto = ${JSON.stringify(translatedData, null, 2)};`;
  fs.writeFileSync(dataAutoViPath, finalStr, 'utf8');

  console.log("🎉 TẤT CẢ ĐÃ XONG! Đã tạo file data_auto_vi.js mới cứng mượt mà!");
}

main();
