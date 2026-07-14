import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Thời gian sẽ được cấu hình xử lý ở múi giờ GMT+7 khi hiển thị
    const cartItems = await prisma.cartItem.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(cartItems);
  } catch (error: any) {
    console.error('Lỗi GET Cart:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;
    const data = await request.json();

    // Hỗ trợ gộp (Sync) nhiều sản phẩm cùng lúc khi khách vãng lai đăng nhập
    if (Array.isArray(data)) {
      for (const item of data) {
        const existing = await prisma.cartItem.findFirst({
          where: { userId, variantKey: item.variantKey, productId: item.productId }
        });
        if (existing) {
          await prisma.cartItem.update({
            where: { id: existing.id },
            data: { quantity: existing.quantity + (item.quantity || 1) }
          });
        } else {
          await prisma.cartItem.create({
            data: {
              userId,
              productId: item.productId,
              name: item.name,
              image: item.image,
              price: item.price,
              quantity: item.quantity || 1,
              variantKey: item.variantKey,
              variantTags: item.variantTags || null,
              legId: item.legId,
              upholsteryId: item.upholsteryId
            }
          });
        }
      }
      return NextResponse.json({ success: true });
    }

    // Thêm 1 sản phẩm
    const existing = await prisma.cartItem.findFirst({
      where: { userId, variantKey: data.variantKey, productId: data.productId }
    });

    if (existing) {
      const updated = await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + (data.quantity || 1) }
      });
      return NextResponse.json(updated);
    }

    const newItem = await prisma.cartItem.create({
      data: {
        userId,
        productId: data.productId,
        name: data.name,
        image: data.image,
        price: data.price,
        quantity: data.quantity || 1,
        variantKey: data.variantKey,
        variantTags: data.variantTags || null,
        legId: data.legId,
        upholsteryId: data.upholsteryId
      }
    });

    return NextResponse.json(newItem);
  } catch (error: any) {
    console.error('Lỗi POST Cart:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;
    const data = await request.json();
    const { id, quantity, variantKey, variantTags, legId, upholsteryId, price, image } = data;

    // Đảm bảo chỉ được sửa giỏ hàng của chính mình
    const existing = await prisma.cartItem.findFirst({ where: { id, userId } });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const updated = await prisma.cartItem.update({
      where: { id },
      data: { quantity, variantKey, variantTags, legId, upholsteryId, price, image }
    });
    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Lỗi PUT Cart:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (id) {
      await prisma.cartItem.deleteMany({ where: { id, userId } });
    } else {
      // Clear toàn bộ giỏ hàng
      await prisma.cartItem.deleteMany({ where: { userId } });
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Lỗi DELETE Cart:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
