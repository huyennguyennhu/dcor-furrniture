const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
require('dotenv').config();

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: (process.env.DATABASE_URL || '') + '&connection_limit=1'
    }
  }
});

function detectColor(text) {
  const lower = (text || '').toLowerCase();
  if (lower.includes('green') || lower.includes('xanh lá') || lower.includes('olive')) return { name: 'Xanh lá', hex: '#3B5E45' };
  if (lower.includes('sky blue') || lower.includes('blue') || lower.includes('xanh dương') || lower.includes('navy')) return { name: 'Xanh dương', hex: '#2B4C7E' };
  if (lower.includes('yellow') || lower.includes('vàng') || lower.includes('ochre')) return { name: 'Vàng', hex: '#E6B800' };
  if (/\brose\b/i.test(lower) || lower.includes('pink') || lower.includes('hồng')) return { name: 'Hồng', hex: '#EC4899' };
  if (/\bred\b/i.test(lower) || lower.includes('đỏ')) return { name: 'Đỏ', hex: '#991B1B' };
  if (lower.includes('cognac') || lower.includes('camel') || lower.includes('amber') || lower.includes('cam')) return { name: 'Cam đất', hex: '#9A461E' };
  if (lower.includes('beige') || lower.includes('sand') || lower.includes('cream') || lower.includes('taupe') || lower.includes('be')) return { name: 'Be sữa', hex: '#D8C8B8' };
  if (lower.includes('dark grey') || lower.includes('charcoal')) return { name: 'Xám than', hex: '#374151' };
  if (lower.includes('light grey') || lower.includes('grey') || lower.includes('gray') || lower.includes('xám') || lower.includes('ash')) return { name: 'Xám khói', hex: '#9CA3AF' };
  if (lower.includes('white') || lower.includes('trắng')) return { name: 'Trắng sứ', hex: '#F3F4F6' };
  if (lower.includes('black') || lower.includes('đen')) return { name: 'Đen nhám', hex: '#18181B' };
  if (lower.includes('oak') || lower.includes('sồi')) return { name: 'Gỗ sồi tự nhiên', hex: '#C4A482' };
  if (lower.includes('brown') || lower.includes('walnut') || lower.includes('nâu')) return { name: 'Nâu Walnut', hex: '#6B4423' };
  if (lower.includes('terracotta') || lower.includes('rust')) return { name: 'Đỏ đất', hex: '#A84332' };

  const earthTones = ['#78716c', '#a8a29e', '#d6d3d1', '#737373', '#525252'];
  const hash = (text || '').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return { name: text || 'Tiêu chuẩn', hex: earthTones[hash % earthTones.length] };
}

async function main() {
  const rawPath = 'C:\\hk1nam4\\WEB nâng cao\\ĐỒ ÁN\\Raw Data\\scratch_filtered_209_products.json';
  const cachePath = 'C:\\hk1nam4\\WEB nâng cao\\ĐỒ ÁN\\Raw Data\\scratch_cloudinary_cache.json';

  const rawProducts = JSON.parse(fs.readFileSync(rawPath, 'utf8'));
  const cache = JSON.parse(fs.readFileSync(cachePath, 'utf8'));

  const revCache = new Map();
  for (const [orig, cld] of Object.entries(cache)) {
    revCache.set(cld.trim(), orig.trim());
  }

  // Build name/slug -> rawProduct map
  const rawMap = new Map();
  for (const p of rawProducts) {
    if (p.name) rawMap.set(p.name.trim().toLowerCase(), p);
    if (p.slug) rawMap.set(p.slug.trim().toLowerCase(), p);
  }

  const dbProducts = await prisma.product.findMany();
  console.log(`Checking ${dbProducts.length} products in database...`);

  let updatedCount = 0;
  let totalRestoredSwatches = 0;

  for (const dbP of dbProducts) {
    const rawP = rawMap.get(dbP.name.trim().toLowerCase()) || (dbP.slug ? rawMap.get(dbP.slug.trim().toLowerCase()) : null);
    if (!rawP || !rawP.configOptions || !rawP.configOptions.attributes) continue;

    const newCfg = JSON.parse(JSON.stringify(rawP.configOptions));
    let hasRestored = false;

    for (const attr of (newCfg.attributes || [])) {
      for (const opt of (attr.options || [])) {
        const rawImg = opt.image;
        if (rawImg && typeof rawImg === 'string') {
          const trimmed = rawImg.trim();
          let origUrl = revCache.get(trimmed);
          if (origUrl) {
            opt.image = `https://res.cloudinary.com/yqbkibfq/image/fetch/w_100,h_100,c_fill,f_auto,q_auto:good/${origUrl}`;
            totalRestoredSwatches++;
            hasRestored = true;
          } else if (trimmed.includes('boconcept.com') || trimmed.includes('aprimocdn.net')) {
            opt.image = `https://res.cloudinary.com/yqbkibfq/image/fetch/w_100,h_100,c_fill,f_auto,q_auto:good/${trimmed}`;
            totalRestoredSwatches++;
            hasRestored = true;
          }
        }
        if (!opt.hexColor) {
          opt.hexColor = detectColor(opt.name).hex;
        }
      }
    }

    if (hasRestored) {
      await prisma.product.update({
        where: { id: dbP.id },
        data: { configOptions: newCfg }
      });
      updatedCount++;
    }
  }

  console.log(`\n Hoàn tất khôi phục swatch!`);
  console.log(`- Đã cập nhật ${updatedCount} sản phẩm.`);
  console.log(`- Đã phục hồi ${totalRestoredSwatches} mẫu swatch ảnh chất liệu/vải cho các lựa chọn.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());

