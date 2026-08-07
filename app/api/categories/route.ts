import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' }
    });
    
    const categoryData = await Promise.all(
      categories.map(async (cat) => {
        const count = await prisma.product.count({
          where: { category: cat.name }
        });
        return {
          ...cat,
          productsCount: count,
          status: 'Hiển thị',
          order: 1
        };
      })
    );
    
    return NextResponse.json(categoryData);
  } catch (error) {
    console.error('Lỗi khi lấy danh mục:', error);
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}
