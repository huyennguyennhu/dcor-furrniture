const fs = require('fs');
const path = require('path');

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function translateFree(text) {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&q=${encodeURIComponent(text)}`;
  try {
    const response = await fetch(url);
    const json = await response.json();
    let translated = "";
    if (json && json[0]) {
      for (let i = 0; i < json[0].length; i++) {
        if (json[0][i][0]) translated += json[0][i][0];
      }
    }
    return translated || text;
  } catch (error) {
    return text;
  }
}

function isEnglish(text) {
  // Simple heuristic: if it doesn't contain Vietnamese diacritics, it's likely English
  const vietnameseChars = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ]/;
  return !vietnameseChars.test(text);
}

function cleanDescription(descStr) {
  if (!descStr) return [];
  
  // 1. Tách câu dựa trên dấu chấm
  let sentences = descStr.split(/\.\s+/);
  
  // 2. Lọc bỏ câu rác
  sentences = sentences.filter(s => {
    const lower = s.toLowerCase();
    if (s.length < 15) return false; // Quá ngắn
    if (lower.includes('/en-vn/')) return false; // Links
    if (lower.includes('telephone=')) return false; // Code rác
    if (lower.includes('cart could not be loaded')) return false;
    if (lower.includes('please try again')) return false;
    if (lower.includes('103 vo nguyen giap')) return false;
    if (lower.includes('add comment to your sample order')) return false;
    if (lower.includes('privacy policy')) return false;
    if (lower.includes('all prices are recommended retail prices')) return false;
    if (lower.includes('fileformat not supported')) return false;
    if (lower.includes('you will receive an e-mail')) return false;
    if (lower.includes('too many files selected')) return false;
    if (lower.includes('no results found')) return false;
    if (lower.includes('to help us process your claim')) return false;
    if (lower.includes('your address could not be saved')) return false;
    if (lower.includes('we are unfortunately unable')) return false;
    if (lower.includes('3rd floor, sun plaza')) return false;
    if (lower.includes('i consent to be contacted')) return false;
    if (lower.includes('your cart is saved')) return false;
    if (lower.includes('we are currently processing your case')) return false;
    if (lower.includes('page you are looking for doesn')) return false;
    if (lower.includes('get me the latest news')) return false;
    if (lower.includes('lean back and relax')) return false;
    if (lower.includes('the samples will be sent')) return false;
    if (lower.includes('default description')) return false;
    if (lower.includes('you have not typed a correct email')) return false;
    if (lower.includes('we’ve pre-selected your closest store')) return false;
    if (lower.includes('you will receive a welcome mail')) return false;
    if (lower.includes('file is too large')) return false;
    if (lower.includes('your question has been sent')) return false;
    if (lower.includes('discover the beauty of our timeless danish furniture')) return false;
    return true;
  });

  // 3. Giữ lại 3-5 câu hay nhất
  return sentences.slice(0, 4).map(s => s.trim() + (s.endsWith('.') ? '' : '.'));
}

async function main() {
  const dataAutoViPath = path.join(__dirname, '../data_auto_vi.js');
  let code = fs.readFileSync(dataAutoViPath, 'utf8');
  const jsonStr = code.replace(/^const\s+productsDataAuto\s*=\s*/, '').replace(/;\s*$/, '');
  let data = JSON.parse(jsonStr);

  console.log("🚀 Bắt đầu làm sạch và dịch description...");
  let count = 0;

  for (let i = 0; i < data.length; i++) {
    const p = data[i];
    if (typeof p.description === 'string') {
      const cleanArray = cleanDescription(p.description);
      
      const translatedArray = [];
      for (const sentence of cleanArray) {
        if (isEnglish(sentence)) {
          const trans = await translateFree(sentence);
          translatedArray.push(trans);
          await delay(200);
        } else {
          translatedArray.push(sentence);
        }
      }
      
      p.description = translatedArray;
      count++;
      process.stdout.write(`\rĐã xử lý: ${count}/${data.length} sản phẩm`);
    }
  }

  const finalStr = `const productsDataAuto = ${JSON.stringify(data, null, 2)};`;
  fs.writeFileSync(dataAutoViPath, finalStr, 'utf8');

  console.log("\n🎉 Hoàn tất quá trình làm sạch và dịch description thành Array!");
}

main();
