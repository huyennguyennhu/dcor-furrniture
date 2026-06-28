const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('📦 Đang đếm tổng số lượng hình ảnh trên database (Supabase)...');
    const products = await prisma.product.findMany({
        select: { id: true, name: true, images: true, variants: true, configOptions: true }
    });

    let totalImages = 0;
    let mainImagesCount = 0;
    let configOptionImagesCount = 0;
    let variantImagesCount = 0;

    for (const p of products) {
        // 1. Ảnh chính
        const mainImgs = Array.isArray(p.images) ? p.images : [];
        mainImagesCount += mainImgs.length;

        // 2. Ảnh configOptions
        if (Array.isArray(p.configOptions)) {
            for (const group of p.configOptions) {
                if (Array.isArray(group.options)) {
                    for (const opt of group.options) {
                        if (opt.image) configOptionImagesCount++;
                    }
                }
            }
        }

        // 3. Ảnh biến thể
        if (Array.isArray(p.variants)) {
            for (const v of p.variants) {
                const varImgs = Array.isArray(v.images) ? v.images : [];
                variantImagesCount += varImgs.length;
            }
        }
    }

    totalImages = mainImagesCount + configOptionImagesCount + variantImagesCount;

    console.log(`\n📊 Kết quả đếm:`);
    console.log(`- Ảnh chính của sản phẩm: ${mainImagesCount}`);
    console.log(`- Ảnh tuỳ chọn chất liệu (Config Options): ${configOptionImagesCount}`);
    console.log(`- Ảnh của các biến thể (Variants): ${variantImagesCount}`);
    console.log(`-------------------------------------------------`);
    console.log(`=> TỔNG CỘNG SỐ ẢNH ĐANG LƯU TRÊN DB: ${totalImages} ảnh`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
