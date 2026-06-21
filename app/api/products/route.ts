import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      orderBy: {
        id: 'asc'
      }
    });

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
      const formattedPrice = basePrice ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(basePrice) : 'Liên hệ';
      const prices = [{ price: basePrice, formattedPrice, currency: 'VND' }];

      return {
        productId: p.slug, // p.slug stores the original product_id
        shortDescription: p.name,
        shortDescription_vi: p.name,
        category: p.category || 'Danish Design',
        variantUrl: `/products/${p.slug}`,
        images: images,
        refinementColors: [],
        refinementColors_vi: [],
        refinementMaterials: [],
        refinementMaterials_vi: [],
        prices: prices,
        lowestPrices: prices,
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
