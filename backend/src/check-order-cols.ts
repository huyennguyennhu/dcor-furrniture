import prisma from './lib/prisma';

async function main() {
  const orders = await prisma.order.findMany({
    take: 5,
    include: {
      items: {
        include: {
          variant: {
            include: {
              product: {
                include: {
                  category: {
                    include: { parent: true }
                  }
                }
              }
            }
          }
        }
      },
      customer: true
    }
  });
  console.log('Successfully fetched orders count:', orders.length);
  if (orders.length > 0) {
    console.log('Sample order isDepositRequired:', orders[0].isDepositRequired);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
