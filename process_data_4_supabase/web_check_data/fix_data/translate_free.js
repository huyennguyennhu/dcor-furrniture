const fs = require('fs');
const path = require('path');

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function translateFree(text) {
  // Use public Google Translate API (No Key Required)
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
    console.error("Free Translation Error:", error.message);
    return text;
  }
}

async function main() {
  const dataAutoViPath = path.join(__dirname, '../data_auto_vi.js');
  const dictionaryPath = path.join(__dirname, 'dictionary.json');

  let code = fs.readFileSync(dataAutoViPath, 'utf8');
  const jsonStr = code.replace(/^const\s+productsDataAuto\s*=\s*/, '').replace(/;\s*$/, '');
  let data = JSON.parse(jsonStr);

  const keysToTranslate = [
    'designFeatures', 'importantFunctions', 'shape', 'composition', 
    'accessoryColour', 'careInstructions', 'backSideCoating', 
    'colourCord', 'lightSource', 'bulbIncluded', 'withOnOffSwitch', 
    'mattressIncluded'
  ];

  let dictionary = {};
  if (fs.existsSync(dictionaryPath)) {
    dictionary = JSON.parse(fs.readFileSync(dictionaryPath, 'utf8'));
  }

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
  const missingTexts = allTexts.filter(t => !dictionary.hasOwnProperty(t));
  
  console.log(`🚀 Bắt đầu dịch ${missingTexts.length} từ bằng API Miễn phí...`);

  for (let i = 0; i < missingTexts.length; i++) {
    const originalText = missingTexts[i];
    // Preserve '|' characters by splitting and translating separately
    if (originalText.includes('|')) {
      const parts = originalText.split('|');
      const translatedParts = [];
      for(let part of parts) {
         if(part.trim() === '') translatedParts.push('');
         else {
            const trans = await translateFree(part);
            translatedParts.push(trans);
            await delay(100);
         }
      }
      dictionary[originalText] = translatedParts.join('|');
    } else {
      dictionary[originalText] = await translateFree(originalText);
    }
    process.stdout.write(`\rĐã dịch: ${i+1}/${missingTexts.length}`);
    await delay(200); // 200ms delay to prevent rate limit on free API
  }

  fs.writeFileSync(dictionaryPath, JSON.stringify(dictionary, null, 2), 'utf8');
  
  console.log("\n✅ Hoàn tất dịch!");

  // Apply to data
  const translate = (str) => {
    if (typeof str === 'string' && dictionary[str]) {
       // Restore specific brand names that google translate might have butchered
       let res = dictionary[str];
       res = res.replace(/Indivi/gi, 'Indivi').replace(/Ottawa/gi, 'Ottawa').replace(/Fermo/gi, 'Fermo');
       return res;
    }
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

  const finalStr = `const productsDataAuto = ${JSON.stringify(data, null, 2)};`;
  fs.writeFileSync(dataAutoViPath, finalStr, 'utf8');

  console.log("🎉 Xong! Đã vá đầy đủ trường dữ liệu.");
}

main();
