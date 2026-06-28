const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('📦 Đang truy vấn dữ liệu từ Supabase...');
    const products = await prisma.product.findMany({
        select: { id: true, name: true, category: true, images: true, variants: true }
    });

    let unmigratedProducts = [];
    let noImageProducts = [];
    let fullyMigratedCount = 0;
    
    // Thống kê theo danh mục
    let categoryStats = {};

    for (const p of products) {
        let hasCloudinary = false;
        let hasBoconcept = false;
        let hasImages = false;

        const mainImages = Array.isArray(p.images) ? p.images : [];
        if (mainImages.length > 0) hasImages = true;

        mainImages.forEach(url => {
            if (url.includes('res.cloudinary.com')) hasCloudinary = true;
            if (url.includes('assets.boconcept.com')) hasBoconcept = true;
        });

        if (Array.isArray(p.variants)) {
            p.variants.forEach(v => {
                const varImages = Array.isArray(v.images) ? v.images : [];
                if (varImages.length > 0) hasImages = true;
                varImages.forEach(url => {
                    if (url.includes('res.cloudinary.com')) hasCloudinary = true;
                    if (url.includes('assets.boconcept.com')) hasBoconcept = true;
                });
            });
        }

        if (!hasImages) {
            noImageProducts.push(p.name);
        } else if (!hasCloudinary) {
            // Không hề có cloudinary -> chưa đụng tới hoặc chạy lỗi hoàn toàn
            unmigratedProducts.push({ name: p.name, hasBoconcept });
            
            // Đếm theo danh mục
            const cat = p.category || 'Không xác định';
            if (!categoryStats[cat]) {
                categoryStats[cat] = { total: 0, unmigrated: 0 };
            }
            categoryStats[cat].unmigrated++;
        } else {
            // Có cloudinary
            fullyMigratedCount++;
        }
        
        // Đếm tổng số lượng sản phẩm mỗi danh mục
        const cat = p.category || 'Không xác định';
        if (!categoryStats[cat]) {
            categoryStats[cat] = { total: 0, unmigrated: 0 };
        }
        categoryStats[cat].total++;
    }

    console.log(`\n📊 Kết quả thống kê:`);
    console.log(`- Tổng số sản phẩm: ${products.length}`);
    console.log(`- Đã có link Cloudinary: ${fullyMigratedCount}`);
    console.log(`- Không có ảnh nào: ${noImageProducts.length}`);
    console.log(`- CHƯA HỀ CÓ link Cloudinary (Còn nguyên Boconcept): ${unmigratedProducts.length}`);
    
    console.log(`\n📦 Thống kê "Sản phẩm chưa có Cloudinary" theo Danh mục:`);
    for (const [cat, data] of Object.entries(categoryStats)) {
        console.log(`  - ${cat}: ${data.unmigrated} / ${data.total} sản phẩm chưa chuyển`);
    }
    
    if (unmigratedProducts.length > 0) {
        console.log(`\n📋 Danh sách 10 sản phẩm chưa có Cloudinary (Mẫu):`);
        unmigratedProducts.slice(0, 10).forEach((p, i) => {
            console.log(`  ${i + 1}. ${p.name}`);
        });
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
