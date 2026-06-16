import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      orderBy: {
        id: 'asc'
      }
    });

    // Map database fields to the frontend CatalogProduct format
    const formattedProducts = products.map((p) => ({
      productId: p.id,
      shortDescription: p.name, // mapped to short_description
      shortDescription_vi: p.description, // mapped to short_description_vi
      category: p.category || 'Sofas',
      variantUrl: p.variantUrl || '',
      images: p.images || [],
      refinementColors: p.refinementColors || [],
      refinementColors_vi: p.refinementColorsVi || [],
      refinementMaterials: p.refinementMaterials || [],
      refinementMaterials_vi: p.refinementMaterialsVi || [],
      prices: p.prices || [],
      lowestPrices: p.lowestPrices || []
    }));

    return NextResponse.json(formattedProducts);
  } catch (error: any) {
    console.error('Error fetching products from DB:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 }
    );
  }
}
