const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  console.log("Cleaning up old products...");
  await prisma.product.deleteMany({});
  console.log("Reading data_auto_vi.js...");
  const dataAutoPath = path.join(__dirname, '../data_auto_vi.js');
  let code = fs.readFileSync(dataAutoPath, 'utf8');
  
  // Extract JSON from JS variable assignment
  const jsonStr = code.replace(/^const\s+productsDataAuto\s*=\s*/, '').replace(/;\s*$/, '');
  const data = JSON.parse(jsonStr);

  console.log(`Found ${data.length} products to seed.`);
  
  let successCount = 0;
  let errorCount = 0;

  for (const item of data) {
    try {
      // Clean up description if it's a string, make it an array. If it's an array, keep it.
      let description = item.description;
      if (typeof description === 'string') {
        description = [description];
      }

      await prisma.product.upsert({
        where: { id: item.product_id },
        update: {
          slug: item.slug,
          name: item.name,
          category: item.category || 'Uncategorized',
          description: description || null,
          basePrice: item.base_price || 0,
          images: item.images || [],
          configOptions: item.config_options || [],
          variants: item.variants || [],
          videos: item.videos || [],
          isBestSeller: item.is_best_seller || false,
          isNew: item.is_new || false,
          discountValue: null, // Reset discount logic 
          discountType: null,
          updatedAt: item.updated_at ? new Date(item.updated_at) : new Date()
        },
        create: {
          id: item.product_id,
          slug: item.slug,
          name: item.name,
          category: item.category || 'Uncategorized',
          description: description || null,
          basePrice: item.base_price || 0,
          images: item.images || [],
          configOptions: item.config_options || [],
          variants: item.variants || [],
          videos: item.videos || [],
          isBestSeller: item.is_best_seller || false,
          isNew: item.is_new || false,
          discountValue: null,
          discountType: null,
          createdAt: item.created_at ? new Date(item.created_at) : new Date(),
          updatedAt: item.updated_at ? new Date(item.updated_at) : new Date()
        }
      });
      successCount++;
      process.stdout.write(`\rProgress: ${successCount}/${data.length} products upserted...`);
    } catch (e) {
      console.error(`\nFailed to upsert product ${item.product_id}:`, e.message);
      errorCount++;
    }
  }

  console.log(`\n\nSeeding finished!`);
  console.log(`Successfully upserted: ${successCount}`);
  console.log(`Errors: ${errorCount}`);
}

main()
  .catch((e) => {
    console.error("Fatal error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
