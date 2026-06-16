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

    const formattedProduct = {
      productId: product.id,
      shortDescription: product.name,
      shortDescription_vi: product.description,
      category: product.category || 'Sofas',
      variantUrl: product.variantUrl || '',
      images: product.images || [],
      refinementColors: product.refinementColors || [],
      refinementColors_vi: product.refinementColorsVi || [],
      refinementMaterials: product.refinementMaterials || [],
      refinementMaterials_vi: product.refinementMaterialsVi || [],
      prices: product.prices || [],
      lowestPrices: product.lowestPrices || [],
      config: product.config || null,
      variantPrices: product.variantPrices || []
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
