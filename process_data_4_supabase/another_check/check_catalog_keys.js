const fs = require('fs');

const CATALOG_PATH = 'd:\\00_LEARNING\\0_Study\\HocChinhUEL\\4_1_LapTrinhWebNangCao\\DoAn\\Dev\\dcor-studio\\lib\\data\\catalog.json';

async function main() {
  const data = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));
  console.log(Object.keys(data[0]));
}

main().catch(console.error);
