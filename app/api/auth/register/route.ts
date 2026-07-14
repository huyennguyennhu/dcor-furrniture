import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { phone, password, fullName } = await request.json();

    if (!phone || !password || !fullName) {
      return NextResponse.json(
        { message: 'Vui lòng cung cấp đủ thông tin' },
        { status: 400 }
      );
    }

    // Kiểm tra xem số điện thoại đã tồn tại chưa
    const existingUser = await prisma.user.findUnique({
      where: { phone },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: 'Số điện thoại này đã được đăng ký' },
        { status: 409 }
      );
    }

    // Hash mật khẩu
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Tạo user mới
    const newUser = await prisma.user.create({
      data: {
        phone,
        fullName,
        passwordHash,
        role: 'CUSTOMER',
      },
    });

    return NextResponse.json(
      { message: 'Đăng ký thành công', userId: newUser.id },
      { status: 201 }
    );
  } catch (error) {
    console.error('Register API Error:', error);
    return NextResponse.json(
      { message: 'Đã xảy ra lỗi hệ thống' },
      { status: 500 }
    );
  }
}
