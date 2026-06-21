import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // 1. Tính toán Top 10 Bán chạy
    const topSelling = await prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 10
    });
    const bestSellerIds = new Set(topSelling.map((item: any) => item.productId));

    // Mốc thời gian 1 tháng
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const product = await prisma.product.findUnique({
      where: { slug: id } // Dùng slug để query vì frontend đang truyền slug lên URL
    });


    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const p = product as any;
    
    // Xử lý mảng description
    let descArray: string[] = [];
    if (p.description && Array.isArray(p.description)) {
      descArray = p.description;
    } else if (typeof p.description === 'string') {
      descArray = [p.description];
    }

    // Xử lý ảnh
    let images: string[] = [];
    if (p.images && Array.isArray(p.images) && p.images.length > 0) {
      images = p.images;
    } else if (p.variants && Array.isArray(p.variants) && p.variants.length > 0) {
      images = p.variants[0].images || [];
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

    const formattedProduct = {
      id: product.id,
      productId: product.slug, // Dùng slug làm productId cho frontend
      shortDescription: product.name,
      shortDescription_vi: product.name,
      description: descArray,
      category: p.category || 'Sản phẩm',
      variantUrl: `/kham-pha/${p.slug}`,
      images: images,
      prices: prices,
      lowestPrices: prices,
      configOptions: p.configOptions || [],
      variants: p.variants || [],
      refinementColors: [],
      refinementMaterials: [],
      isBestSeller: p.isBestSeller || bestSellerIds.has(product.id),
      isNew: p.isNew || (p.createdAt && new Date(p.createdAt) >= oneMonthAgo),
      discountValue: p.discountValue,
      discountType: p.discountType
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
