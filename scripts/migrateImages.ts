import { PrismaClient } from '@prisma/client';
import puppeteer from 'puppeteer';
import { v2 as cloudinary } from 'cloudinary';

// 1. Cấu hình Cloudinary
cloudinary.config({ 
  cloud_name: 'YOUR_CLOUD_NAME', // <-- Điền Cloud Name
  api_key: 'YOUR_API_KEY',       // <-- Điền API Key
  api_secret: 'YOUR_API_SECRET'  // <-- Điền API Secret
});

const prisma = new PrismaClient();

async function downloadImageWithPuppeteer(page: puppeteer.Page, url: string): Promise<string | null> {
    try {
        console.log('  🌐 Đang truy cập:', url);
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 });
        
        await page.waitForSelector('img', { timeout: 30000 }).catch(() => {});
        
        const dataUrl = await page.evaluate(async (imgUrl) => {
            const img = document.querySelector('img');
            if (!img) return null;
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext('2d');
            if (!ctx) return null;
            ctx.drawImage(img, 0, 0);
            return canvas.toDataURL('image/png');
        }, url);
        
        return dataUrl;
    } catch (e) {
        console.error('  ❌ Lỗi khi tải ảnh:', url, (e as Error).message);
        return null;
    }
}

async function uploadToCloudinary(dataUrl: string, folder: string): Promise<string | null> {
    try {
        const result = await cloudinary.uploader.upload(dataUrl, {
            folder: folder,
            resource_type: 'image'
        });
        return result.secure_url;
    } catch (error) {
        console.error('  ❌ Lỗi upload Cloudinary:', error);
        return null;
    }
}

async function main() {
    console.log('🚀 Khởi động trình duyệt...');
    const browser = await puppeteer.launch({ headless: false }); 
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    const products = await prisma.product.findMany();
    console.log(`📦 Tìm thấy tổng cộng ${products.length} sản phẩm cần xử lý.`);

    for (let i = 0; i < products.length; i++) {
        const p = products[i];
        console.log(`\n[${i + 1}/${products.length}] Đang xử lý sản phẩm: ${p.name}`);
        
        let updated = false;
        const newImages: string[] = [];
        const oldImages = Array.isArray(p.images) ? p.images : [];
        
        for (const imgUrl of oldImages as string[]) {
            if (imgUrl.includes('assets.boconcept.com')) {
                const dataUrl = await downloadImageWithPuppeteer(page, imgUrl);
                if (dataUrl) {
                    console.log('  ⏳ Đang upload lên Cloudinary...');
                    const cUrl = await uploadToCloudinary(dataUrl, `dcor-studio/products`);
                    if (cUrl) {
                        console.log('  ✅ Đã thay thế thành công:', cUrl);
                        newImages.push(cUrl);
                        updated = true;
                        continue;
                    }
                }
            }
            newImages.push(imgUrl);
        }
        
        const variants = Array.isArray(p.variants) ? p.variants : [];
        const newVariants = [];
        for (const variant of variants as any[]) {
            const newVarImages = [];
            const oldVarImages = Array.isArray(variant.images) ? variant.images : [];
            for (const imgUrl of oldVarImages as string[]) {
                if (imgUrl.includes('assets.boconcept.com')) {
                    const dataUrl = await downloadImageWithPuppeteer(page, imgUrl);
                    if (dataUrl) {
                        const cUrl = await uploadToCloudinary(dataUrl, `dcor-studio/variants`);
                        if (cUrl) {
                            console.log('  ✅ Đã thay thế ảnh biến thể thành công:', cUrl);
                            newVarImages.push(cUrl);
                            updated = true;
                            continue;
                        }
                    }
                }
                newVarImages.push(imgUrl);
            }
            newVariants.push({ ...variant, images: newVarImages });
        }
        
        if (updated) {
            await prisma.product.update({
                where: { id: p.id },
                data: {
                    images: newImages,
                    variants: newVariants
                }
            });
            console.log(`💾 Đã lưu sản phẩm "${p.name}" vào Database.`);
        } else {
            console.log(`⏭️ Không có thay đổi nào cho sản phẩm "${p.name}". Bỏ qua.`);
        }
    }

    console.log('🎉 Đã hoàn tất toàn bộ tiến trình!');
    await browser.close();
}

main().catch(console.error).finally(() => prisma.$disconnect());
