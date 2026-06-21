const fs = require('fs');

const CATALOG_PATH = 'd:\\00_LEARNING\\0_Study\\HocChinhUEL\\4_1_LapTrinhWebNangCao\\DoAn\\Dev\\dcor-studio\\lib\\data\\catalog.json';

async function main() {
  const data = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));
  console.log('Sample catalog item:', data[0].id, 'Category:', data[0].category);
}

main().catch(console.error);
