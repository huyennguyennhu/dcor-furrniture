import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('📦 Đang kết nối Database để dọn dẹp biến thể lỗi...');
    const products = await prisma.product.findMany({
        select: { id: true, name: true, variants: true }
    });

    console.log(`🔍 Tìm thấy ${products.length} sản phẩm. Đang bắt đầu kiểm tra...`);
    let totalRemovedVariants = 0;
    let updatedProductsCount = 0;

    for (const p of products) {
        if (!p.variants || !Array.isArray(p.variants)) continue;

        const oldVariants = p.variants as any[];
        const newVariants = [];
        let removedCount = 0;

        for (const variant of oldVariants) {
            const images = Array.isArray(variant.images) ? variant.images as string[] : [];
            const hasBoconcept = images.some(url => url.includes('assets.boconcept.com'));

            if (hasBoconcept) {
                removedCount++;
            } else {
                newVariants.push(variant);
            }
        }

        if (removedCount > 0) {
            console.log(`  - Sản phẩm "${p.name}": Đã xóa ${removedCount} biến thể chứa link boconcept.`);
            await prisma.product.update({
                where: { id: p.id },
                data: { variants: newVariants }
            });
            totalRemovedVariants += removedCount;
            updatedProductsCount++;
        }
    }

    console.log('\n✅ QUÁ TRÌNH DỌN DẸP HOÀN TẤT!');
    console.log(`📊 Tổng kết: Xóa ${totalRemovedVariants} biến thể lỗi từ ${updatedProductsCount} sản phẩm.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
