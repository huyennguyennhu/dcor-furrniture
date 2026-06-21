import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

function capitalizeWords(str: string) {
  return str.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
}

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });

    // 1. Tính toán Top 10 Bán chạy (Dynamic Best Sellers)
    const topSelling = await prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 10
    });
    const bestSellerIds = new Set(topSelling.map((item: any) => item.productId));

    // Mốc thời gian 1 tháng trước cho "Hàng Mới"
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const formattedProducts = products.map((p: any) => {
      let images: string[] = [];
      if (p.images && Array.isArray(p.images) && p.images.length > 0) {
        images = p.images as string[];
      } else if (p.variants && Array.isArray(p.variants) && p.variants.length > 0) {
        const firstVariant = p.variants[0] as any;
        if (firstVariant.images && Array.isArray(firstVariant.images)) {
          images = firstVariant.images;
        }
      }

      const basePrice = p.basePrice || 0;
      let finalPrice = basePrice;
      if (p.discountValue && p.discountValue > 0) {
        if (p.discountType === 'PERCENTAGE') {
          finalPrice = basePrice - (basePrice * p.discountValue / 100);
        } else if (p.discountType === 'FIXED_AMOUNT' || p.discountType === 'FIXED') {
          finalPrice = basePrice - p.discountValue;
        }
      }
      if (finalPrice < 0) finalPrice = 0;

      const formattedPrice = basePrice ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(basePrice) : 'Liên hệ';
      const formattedFinalPrice = finalPrice ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(finalPrice) : 'Liên hệ';

      const prices = [{ price: basePrice, formattedPrice, currency: 'VND' }];
      const lowestPrices = finalPrice < basePrice ? [{ price: finalPrice, formattedPrice: formattedFinalPrice, currency: 'VND' }] : prices;

      // Lấy màu sắc và chất liệu thực tế từ configOptions
      const materialSet = new Set<string>();
      const colorSet = new Set<string>();
      
      if (p.configOptions && Array.isArray(p.configOptions)) {
        p.configOptions.forEach((group: any) => {
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
              if (isColor && opt.image) {
                colorSet.add(normalizedName);
              } else if (isMaterial) {
                materialSet.add(normalizedName);
              }
            }
          });
        });
      }

      return {
        id: p.id,
        productId: p.slug, // p.slug stores the original product_id
        shortDescription: p.name,
        shortDescription_vi: p.name,
        category: p.category || 'Danish Design',
        variantUrl: `/products/${p.slug}`,
        images: images,
        refinementColors: Array.from(colorSet),
        refinementColors_vi: [],
        refinementMaterials: Array.from(materialSet),
        refinementMaterials_vi: [],
        prices: prices,
        lowestPrices: lowestPrices,
        isBestSeller: p.isBestSeller || bestSellerIds.has(p.id),
        isNew: p.isNew || (p.createdAt && new Date(p.createdAt) >= oneMonthAgo),
        createdAt: p.createdAt,
        discountValue: p.discountValue,
        discountType: p.discountType
      };
    });

    return NextResponse.json(formattedProducts);
  } catch (error: any) {
    console.error('Error fetching products from DB:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 }
    );
  }
}
