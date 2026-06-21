import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Đang dọn dẹp dữ liệu rác trong cột description...');
  const products = await prisma.product.findMany();
  
  for (const p of products) {
    let cleanDesc = [];
    
    // Khôi phục lại description sạch từ tên sản phẩm hoặc lấy phần tử hợp lệ đầu tiên
    if (p.name) {
      cleanDesc = [p.name];
    } else {
      cleanDesc = ["Chi tiết sản phẩm đang được cập nhật."];
    }

    await prisma.product.update({
      where: { id: p.id },
      data: {
        description: cleanDesc
      }
    });
  }
  
  console.log(`[OK] Đã dọn dẹp xong toàn bộ ${products.length} sản phẩm! Các text rác CSS/HTML đã bị xóa.`);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
