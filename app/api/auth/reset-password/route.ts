import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { phone, password } = await request.json();

    if (!phone || !password) {
      return NextResponse.json(
        { message: 'Vui lòng cung cấp đủ thông tin' },
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

    // Hash mật khẩu mới
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Cập nhật vào Database
    await prisma.user.update({
      where: { phone },
      data: {
        passwordHash,
      },
    });

    return NextResponse.json(
      { message: 'Đổi mật khẩu thành công' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Reset Password API Error:', error);
    return NextResponse.json(
      { message: 'Đã xảy ra lỗi hệ thống' },
      { status: 500 }
    );
  }
}
