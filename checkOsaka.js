const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const prod = await prisma.product.findFirst({
    where: { name: { contains: 'Osaka' } }
  });
  console.log("Osaka Sofa:");
  console.log("prod.images:", prod.images);
  
  const variants = prod.variants || [];
  const variantImgs = variants.flatMap(v => v.images || []).filter(Boolean);
  console.log("variant images count:", variantImgs.length);
  
  let allImages = prod.images || [];
  if (prod.variants) {
    allImages = Array.from(new Set([...allImages, ...variantImgs]));
  }
  allImages = allImages.slice(0, 6);
  console.log("Final allImages:", allImages);
}

main().finally(() => prisma.$disconnect());
