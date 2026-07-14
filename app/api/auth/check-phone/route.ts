import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { phone } = await request.json();

    if (!phone) {
      return NextResponse.json(
        { message: 'Vui lòng cung cấp số điện thoại' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { phone },
    });

    if (!user) {
      return NextResponse.json(
        { message: 'Không tìm thấy tài khoản với số điện thoại này' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: 'Số điện thoại hợp lệ', exists: true },
      { status: 200 }
    );
  } catch (error) {
    console.error('Check Phone API Error:', error);
    return NextResponse.json(
      { message: 'Đã xảy ra lỗi hệ thống' },
      { status: 500 }
    );
  }
}
