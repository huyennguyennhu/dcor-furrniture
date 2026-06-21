import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

function capitalizeWords(str: string) {
  return str.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
}

export async function GET() {
  try {
    // 1. Fetch categories
    const categoriesDB = await prisma.category.findMany({
      orderBy: { name: 'asc' }
    });
    const categories = categoriesDB.map(c => capitalizeWords(c.name));

    // 2. Fetch all products to extract unique colors and materials
    const products = await prisma.product.findMany({
      select: { configOptions: true }
    });

    const materialSet = new Set<string>();
    const colorMap = new Map<string, any>();

    const FALLBACK_COLORS: Record<string, string> = {
      'Trắng': '#F5F5F5', 'Đen': '#222222', 'Nâu': '#8B4513', 'Xanh lá': '#4B6E50', 
      'Xanh dương': '#325A82', 'Vàng': '#FFD700', 'Xám': '#808080',
      'White': '#F5F5F5', 'Black': '#222222', 'Brown': '#8B4513', 'Green': '#4B6E50',
      'Blue': '#325A82', 'Yellow': '#FFD700', 'Grey': '#808080', 'Beige': '#D4C3A3'
    };

    products.forEach(p => {
      const configOptions: any = p.configOptions || [];
      if (!Array.isArray(configOptions)) return;

      configOptions.forEach((group: any) => {
        const k = group.groupId || '';
        const isMaterial = k.toLowerCase().includes('material') && 
                           !k.toLowerCase().includes('upholstery') && 
                           !k.toLowerCase().includes('legstyle') &&
                           !k.toLowerCase().includes('leg');
        const isColor = k === 'vaMaterialUpholstery';

        const options = group.options || [];
        options.forEach((opt: any) => {
          if (opt.name) {
            const normalizedName = capitalizeWords(opt.name);
            if (isColor) {
              // User request: Only keep colors that have fabric/texture images
              if (opt.image && !colorMap.has(normalizedName)) {
                let hex = opt.hexColor || FALLBACK_COLORS[normalizedName] || '#cccccc';
                colorMap.set(normalizedName, {
                  name: normalizedName,
                  hex: hex,
                  imageLink: opt.image
                });
              }
            } else if (isMaterial) {
              materialSet.add(normalizedName);
            }
          }
        });
      });
    });

    const CATEGORY_ORDER = ['Sofa', 'Bàn', 'Ghế', 'Tủ Kệ', 'Giường', 'Đèn', 'Thảm', 'Trang trí', 'Phụ Kiện'];
    
    const sortedCategories = categories.sort((a, b) => {
      const idxA = CATEGORY_ORDER.indexOf(capitalizeWords(a as string));
      const idxB = CATEGORY_ORDER.indexOf(capitalizeWords(b as string));
      if (idxA === -1 && idxB === -1) return (a as string).toLowerCase().localeCompare((b as string).toLowerCase());
      if (idxA === -1) return 1;
      if (idxB === -1) return -1;
      return idxA - idxB;
    });

    return NextResponse.json({
      categories: sortedCategories,
      materials: Array.from(materialSet).sort(),
      colors: Array.from(colorMap.values()).sort((a, b) => a.name.localeCompare(b.name))
    });
  } catch (error: any) {
    console.error('Error fetching filters:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
