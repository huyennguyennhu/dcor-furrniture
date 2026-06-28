import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Bắt đầu quét và xóa các biến thể chứa link boconcept trong Database...');
  const products = await prisma.product.findMany();
  
  let totalVariants = 0;
  let boconceptVariants = 0;
  let remainingVariants = 0;
  let productsUpdated = 0;

  for (const p of products) {
    let variants: any[] = [];
    if (typeof p.variants === 'string') {
        try { variants = JSON.parse(p.variants); } catch (e) {}
    } else if (Array.isArray(p.variants)) {
        variants = p.variants;
    }

    if (!variants || variants.length === 0) continue;

    totalVariants += variants.length;

    const filteredVariants = variants.filter((v: any) => {
      let hasBoconcept = false;
      if (v.images && Array.isArray(v.images)) {
        for (const img of v.images) {
          if (img.toLowerCase().includes('boconcept')) {
            hasBoconcept = true;
            break;
          }
        }
      }
      return !hasBoconcept;
    });

    const removedCount = variants.length - filteredVariants.length;
    boconceptVariants += removedCount;
    remainingVariants += filteredVariants.length;

    if (removedCount > 0) {
      await prisma.product.update({
        where: { id: p.id },
        data: {
          variants: filteredVariants
        }
      });
      productsUpdated++;
      console.log(`Đã cập nhật sản phẩm ${p.id}: Xóa ${removedCount} biến thể boconcept.`);
    }
  }
  
  console.log('--- KẾT QUẢ ---');
  console.log(`Tổng số sản phẩm đã cập nhật: ${productsUpdated}`);
  console.log(`Tổng số biến thể ban đầu: ${totalVariants}`);
  console.log(`Đã XÓA: ${boconceptVariants} biến thể chứa link boconcept`);
  console.log(`Giữ lại: ${remainingVariants} biến thể (ảnh Cloudinary/Supabase)`);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
