import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const product = await prisma.product.findUnique({
      where: { id: id }
    });


    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const p = product as any;
    const formattedProduct = {
      productId: product.id,
      shortDescription: product.name,
      shortDescription_vi: product.description,
      category: p.category || 'Sofas',
      variantUrl: p.variantUrl || '',
      images: p.images || [],
      refinementColors: p.refinementColors || [],
      refinementColors_vi: p.refinementColorsVi || [],
      refinementMaterials: p.refinementMaterials || [],
      refinementMaterials_vi: p.refinementMaterialsVi || [],
      prices: p.prices || [],
      lowestPrices: p.lowestPrices || [],
      config: p.config || null,
      variantPrices: p.variantPrices || []
    };

    return NextResponse.json(formattedProduct);
  } catch (error: any) {
    console.error('Error fetching product detail:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 }
    );
  }
}
