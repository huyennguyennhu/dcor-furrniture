import { PrismaClient } from '@prisma/client';
import puppeteer from 'puppeteer';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';

// Cấu hình Cloudinary (Đã điền tự động)
cloudinary.config({ 
  cloud_name: 'dsasf753c', 
  api_key: '998326735466354', 
  api_secret: 'flwaYv1DKf79HkDvzDDCiZSE_yA' 
});

const prisma = new PrismaClient();

const TEMP_FILE_PATH = path.join(__dirname, 'temp', 'temp_img.webp');
const MATERIALS_MAP_FILE = path.join(__dirname, 'materials_map.json');
let materialsMap: Record<string, string> = {};
if (fs.existsSync(MATERIALS_MAP_FILE)) {
    materialsMap = JSON.parse(fs.readFileSync(MATERIALS_MAP_FILE, 'utf-8'));
}

function saveMaterialsMap() {
    fs.writeFileSync(MATERIALS_MAP_FILE, JSON.stringify(materialsMap, null, 2), 'utf-8');
}

async function downloadImageWithPuppeteer(page: puppeteer.Page, url: string): Promise<string | null> {
    try {
        console.log('  🌐 Đang truy cập:', url);
        try {
            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
        } catch (gotoErr) {
            console.log('  ⚠️ Tải trang hơi lâu (timeout), nhưng sẽ tiếp tục kiểm tra ảnh...');
        }
        
        const isCloudflare = await page.evaluate(() => {
            return document.title.includes('Just a moment') || document.body.innerText.includes('bảo mật') || document.body.innerText.includes('bot');
        });

        if (isCloudflare) {
            console.log('  ⚠️ Cloudflare bắt xác minh! Cậu hãy qua cửa sổ Chrome bấm xác nhận nhé, Script sẽ đợi cậu...');
            // Chờ vô hạn cho đến khi Cloudflare mất và ảnh thật (width > 0) load xong
            await page.waitForFunction(() => {
                const img = document.querySelector('img');
                return img && img.complete && img.naturalWidth > 0 && !document.body.innerText.includes('bảo mật');
            }, { timeout: 0 });
            console.log('  ✅ Đã vượt qua bảo mật, tiếp tục tải ảnh!');
        } else {
            // Chờ tối đa 10 giây để ảnh load xong hoàn toàn
            await page.waitForFunction(() => {
                const img = document.querySelector('img');
                return img && img.complete && img.naturalWidth > 0;
            }, { timeout: 10000 }).catch(() => {});
        }
        
        const dataUrl = await page.evaluate(async (imgUrl) => {
            const img = document.querySelector('img');
            if (!img) return null;
            if (img.naturalWidth === 0 || img.naturalHeight === 0) return null; // Ảnh bị lỗi hoặc bị chặn
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext('2d');
            if (!ctx) return null;
            ctx.drawImage(img, 0, 0);
            // Đổi sang WEBP để giảm 90% dung lượng so với PNG!
            return canvas.toDataURL('image/webp', 0.8);
        }, url);
        
        if (!dataUrl || dataUrl === 'data:,') {
            console.error('  ⚠️ Ảnh trống hoặc bị chặn bởi Cloudflare');
            return null;
        }
        
        // Lưu vào file vật lý
        const base64Data = dataUrl.replace(/^data:image\/webp;base64,/, "");
        fs.writeFileSync(TEMP_FILE_PATH, base64Data, 'base64');
        return TEMP_FILE_PATH;
    } catch (e) {
        console.error('  ❌ Lỗi khi tải ảnh:', url, (e as Error).message);
        return null;
    }
}

async function uploadToCloudinary(filePath: string, folder: string): Promise<string | null> {
    try {
        const result = await cloudinary.uploader.upload(filePath, {
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
    console.log('🚀 Đang kết nối tới trình duyệt Chrome gốc (Port 9222)...');
    
    let browser;
    try {
        browser = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222', defaultViewport: null }); 
    } catch (error) {
        console.error('❌ Không thể kết nối tới Chrome. Chắc chắn rằng cậu đã bật Chrome với lệnh --remote-debugging-port=9222');
        return;
    }
    
    console.log('📦 Đang lấy danh sách sản phẩm từ Database...');
    let productIds: { id: string, name: string }[] = [];
    try {
        productIds = await prisma.product.findMany({
            select: { id: true, name: true }
        });
    } catch (err: any) {
        console.error('❌ Lỗi kết nối Database khi lấy danh sách (P1017). Thử kết nối lại...', err.message);
        // Thử kết nối lại 1 lần
        await prisma.$disconnect();
        await prisma.$connect();
        productIds = await prisma.product.findMany({ select: { id: true, name: true } });
    }

    console.log(`📦 Tìm thấy tổng cộng ${productIds.length} sản phẩm cần xử lý.`);

    const page = await browser.newPage();

    for (let i = 0; i < productIds.length; i++) {
        const p = await prisma.product.findUnique({ where: { id: productIds[i].id } });
        if (!p) continue;
        
        console.log(`\n[${i + 1}/${productIds.length}] Đang xử lý sản phẩm: ${p.name}`);
        
        const folderName = `dcor-products/${p.slug}`;
        let updated = false;

        // Hàm helper xử lý nhanh 1 URL
        const processUrl = async (imgUrl: string, typeName: string, customFolder?: string): Promise<string> => {
            if (!imgUrl || !imgUrl.includes('assets.boconcept.com')) return imgUrl;
            
            if (customFolder && materialsMap[imgUrl]) {
                console.log(`  ⚡ Tái sử dụng ảnh chung (0s): ${materialsMap[imgUrl]}`);
                return materialsMap[imgUrl];
            }

            const filePath = await downloadImageWithPuppeteer(page, imgUrl);
            if (!filePath) return imgUrl;
            
            const uploadFolder = customFolder || folderName;
            console.log(`  ⏳ Đang upload ${typeName} lên Cloudinary từ ổ cứng...`);
            
            const cUrl = await uploadToCloudinary(filePath, uploadFolder);
            
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath); // Dọn rác
            }

            if (cUrl) {
                console.log(`  ✅ Đã thay thế xong: ${cUrl}`);
                updated = true;
                if (customFolder) {
                    materialsMap[imgUrl] = cUrl;
                    saveMaterialsMap(); // Lưu ngay vào file json
                }
                return cUrl;
            }
            return imgUrl;
        };

        // 1. Ảnh chính
        const oldImages = Array.isArray(p.images) ? p.images as string[] : [];
        const newImages: string[] = [];
        for (const imgUrl of oldImages) {
            newImages.push(await processUrl(imgUrl, 'Ảnh chính'));
        }

        // 2. Ảnh chất liệu / vải (Sắp xếp Alphabet rồi lấy tối đa 5 chất liệu mỗi nhóm)
        const configOptions = Array.isArray(p.configOptions) ? p.configOptions as any[] : [];
        const newConfigOptions = [];
        const validOptionIds = new Set<string>(); // Lưu lại các ID được giữ

        for (const group of configOptions) {
            const newOptions = [];
            const groupOptions = (group.options || []) as any[];
            groupOptions.sort((a, b) => (a.text || '').localeCompare(b.text || ''));

            // Tự động chia thư mục nhỏ dựa trên groupId (vd: vaMaterialLeg -> materialleg)
            let folderSuffix = 'others';
            if (group.groupId) {
                folderSuffix = group.groupId.replace(/^va/, '').toLowerCase(); // Cắt chữ 'va' ở đầu
            }
            const matFolder = `dcor-materials/${folderSuffix}`;

            for (const opt of groupOptions.slice(0, 5)) {
                const newImg = await processUrl(opt.image, 'Ảnh phân loại chất liệu', matFolder);
                newOptions.push({ ...opt, image: newImg });
                if (opt.id) validOptionIds.add(opt.id);
            }
            newConfigOptions.push({ ...group, options: newOptions });
        }

        // 3. Ảnh biến thể (Chỉ giữ lại các biến thể mà cấu hình của nó nằm trong danh sách 5 màu vải/chân phía trên)
        const oldVariants = Array.isArray(p.variants) ? p.variants as any[] : [];
        const newVariants = [];
        for (const variant of oldVariants) {
            // Kiểm tra xem biến thể này có dùng màu vải/chân nào bị cắt bỏ không?
            let isValid = true;
            if (variant.selections) {
                for (const key of Object.keys(variant.selections)) {
                    if (!validOptionIds.has(variant.selections[key])) {
                        isValid = false;
                        break;
                    }
                }
            }
            
            // Nếu hợp lệ (nằm trong top 5 màu) thì giữ lại và tải ảnh
            if (isValid) {
                const oldVarImages = Array.isArray(variant.images) ? variant.images as string[] : [];
                const newVarImages: string[] = [];
                for (const imgUrl of oldVarImages) {
                    newVarImages.push(await processUrl(imgUrl, 'Ảnh biến thể'));
                }
                newVariants.push({ ...variant, images: newVarImages });
            }
        }
        
        // --- 4. Lưu vào DB ---
        if (updated) {
            await prisma.product.update({
                where: { id: p.id },
                data: {
                    images: newImages,
                    variants: newVariants,
                    configOptions: newConfigOptions
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
