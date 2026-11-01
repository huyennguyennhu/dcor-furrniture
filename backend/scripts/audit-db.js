const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });
const prisma = new PrismaClient();

async function check() {
  const badVariants = await prisma.$queryRaw`SELECT count(*) FROM "ProductVariant" WHERE "optionValues"::text LIKE '%dsasf753c%'`;
  const badProducts = await prisma.$queryRaw`SELECT count(*) FROM "Product" WHERE "images"::text LIKE '%dsasf753c%'`;
  console.log('=== KẾT QUẢ KIỂM TRA DATABASE ===');
  console.log('Số biến thể còn dính dsasf753c:', badVariants);
  console.log('Số sản phẩm còn dính dsasf753c:', badProducts);
  await prisma.$disconnect();
  process.exit(0);
}

check().catch(e => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
