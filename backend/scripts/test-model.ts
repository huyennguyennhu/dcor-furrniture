import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const hasWarehouseModel = typeof (prisma as any).warehouse !== 'undefined';
  console.log(`Has prisma.warehouse model: ${hasWarehouseModel}`);
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
