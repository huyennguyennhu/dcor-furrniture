import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        slug: true,
        name: true,
        category: true,
        images: true,
      }
    });

    return NextResponse.json(products);
  } catch (error: any) {
    console.error('Error fetching admin products:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
