import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const reviews = await prisma.review.findMany({
      where: { productId: id, isApproved: true },
      include: { user: { select: { fullName: true, avatarUrl: true } } },
      orderBy: { createdAt: 'desc' }
    });
    
    return NextResponse.json(reviews);
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
