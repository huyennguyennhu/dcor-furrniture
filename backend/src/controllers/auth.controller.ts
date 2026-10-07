import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'dcor_super_secret_key_2026';

export const authController = {
  // Đăng nhập dành cho Admin / Staff
  adminLogin: async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ message: 'Vui lòng cung cấp email và mật khẩu.' });
        return;
      }

      // 1. Tìm user trong bảng StaffUser
      const staff = await prisma.staffUser.findUnique({
        where: { email }
      });

      if (!staff) {
        res.status(401).json({ message: 'Email hoặc mật khẩu không chính xác.' });
        return;
      }

      // 2. Kiểm tra mật khẩu (nếu có pass, hoặc ném lỗi nếu tài khoản chưa setup pass)
      if (!staff.passwordHash) {
        res.status(403).json({ message: 'Tài khoản chưa được thiết lập mật khẩu. Vui lòng kiểm tra email thư mời.' });
        return;
      }

      const isPasswordValid = bcrypt.compareSync(password, staff.passwordHash);
      if (!isPasswordValid) {
        res.status(401).json({ message: 'Email hoặc mật khẩu không chính xác.' });
        return;
      }

      // 3. Kiểm tra trạng thái tài khoản
      if (staff.status !== 'ACTIVE') {
        res.status(403).json({ message: 'Tài khoản đã bị khóa hoặc chưa kích hoạt.' });
        return;
      }

      // 4. Sinh JWT Token
      const token = jwt.sign(
        { 
          userId: staff.id, 
          email: staff.email, 
          role: staff.role,
          type: 'STAFF' 
        },
        JWT_SECRET,
        { expiresIn: '1d' } // Token hết hạn sau 1 ngày
      );

      res.status(200).json({
        message: 'Đăng nhập thành công',
        token,
        user: {
          id: staff.id,
          fullName: staff.fullName,
          email: staff.email,
          role: staff.role
        }
      });
    } catch (error) {
      console.error('Lỗi adminLogin:', error);
      res.status(500).json({ message: 'Lỗi server nội bộ' });
    }
  },

  // Setup mật khẩu mới từ link Invite
  acceptInvite: async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ message: 'Thiếu thông tin.' });
        return;
      }

      // Giả lập check email có tồn tại không
      const staff = await prisma.staffUser.findUnique({ where: { email } });
      if (!staff) {
        res.status(404).json({ message: 'Không tìm thấy tài khoản.' });
        return;
      }

      // Mã hóa mật khẩu mới
      const hashedPassword = bcrypt.hashSync(password, 10);

      // Cập nhật pass
      await prisma.staffUser.update({
        where: { email },
        data: { 
          passwordHash: hashedPassword,
          status: 'ACTIVE'
        }
      });

      res.status(200).json({ message: 'Kích hoạt tài khoản thành công.' });
    } catch (error) {
      console.error('Lỗi acceptInvite:', error);
      res.status(500).json({ message: 'Lỗi server nội bộ' });
    }
  },

  // ----------------------------------------
  // CUSTOMER AUTH (KHÁCH HÀNG)
  // ----------------------------------------
  
  // Đăng nhập bằng Số điện thoại & Mật khẩu
  customerLogin: async (req: Request, res: Response): Promise<void> => {
    try {
      const { phone, password } = req.body;

      if (!phone || !password) {
        res.status(400).json({ message: 'Vui lòng cung cấp số điện thoại và mật khẩu.' });
        return;
      }

      const customer = await prisma.customer.findUnique({ where: { phone } });
      if (!customer) {
        res.status(401).json({ message: 'Số điện thoại hoặc mật khẩu không chính xác.' });
        return;
      }

      if (!customer.passwordHash) {
        res.status(403).json({ message: 'Tài khoản này chưa có mật khẩu. Vui lòng đăng nhập bằng Google hoặc đăng ký.' });
        return;
      }

      const isPasswordValid = bcrypt.compareSync(password, customer.passwordHash);
      if (!isPasswordValid) {
        res.status(401).json({ message: 'Số điện thoại hoặc mật khẩu không chính xác.' });
        return;
      }

      const token = jwt.sign(
        { userId: customer.id, phone: customer.phone, type: 'CUSTOMER' },
        JWT_SECRET,
        { expiresIn: '30d' }
      );

      res.status(200).json({
        message: 'Đăng nhập thành công',
        token,
        user: { id: customer.id, fullName: customer.fullName, phone: customer.phone, avatar: customer.avatarUrl }
      });
    } catch (error) {
      console.error('Lỗi customerLogin:', error);
      res.status(500).json({ message: 'Lỗi server nội bộ' });
    }
  },

  // Đăng ký tài khoản (Khách hàng)
  customerRegister: async (req: Request, res: Response): Promise<void> => {
    try {
      const { fullName, phone, password } = req.body;
      if (!fullName || !phone || !password) {
        res.status(400).json({ message: 'Thiếu thông tin đăng ký.' });
        return;
      }

      const existingCustomer = await prisma.customer.findFirst({ where: { phone } });
      if (existingCustomer) {
        res.status(400).json({ message: 'Số điện thoại này đã được đăng ký.' });
        return;
      }

      const hashedPassword = bcrypt.hashSync(password, 10);

      const customer = await prisma.customer.create({
        data: {
          fullName,
          phone,
          passwordHash: hashedPassword,
          // Fake email for schema compliance if needed
          email: `user_${Date.now()}@dcor.vn`,
          isPhoneVerified: true
        }
      });

      const token = jwt.sign(
        { userId: customer.id, phone: customer.phone, type: 'CUSTOMER' },
        JWT_SECRET,
        { expiresIn: '30d' }
      );

      res.status(201).json({
        message: 'Đăng ký thành công',
        token,
        user: { id: customer.id, fullName: customer.fullName, phone: customer.phone, avatar: customer.avatarUrl }
      });
    } catch (error) {
      console.error('Lỗi customerRegister:', error);
      res.status(500).json({ message: 'Lỗi server nội bộ' });
    }
  },

  // Đăng nhập bằng Google (Nhận Email/thông tin từ Frontend Firebase/Google Auth)
  customerGoogleLogin: async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, fullName, avatarUrl } = req.body;

      if (!email) {
        res.status(400).json({ message: 'Không lấy được email từ Google.' });
        return;
      }

      // Tìm user theo email
      let customer = await prisma.customer.findUnique({ where: { email } });

      // Nếu chưa có, tự động tạo tài khoản (Không cần mật khẩu, vì login bằng Google)
      if (!customer) {
        customer = await prisma.customer.create({
          data: {
            email,
            fullName: fullName || 'Khách hàng Google',
            avatarUrl: avatarUrl || null,
            isPhoneVerified: false
          }
        });
      }

      const token = jwt.sign(
        { userId: customer.id, email: customer.email, type: 'CUSTOMER' },
        JWT_SECRET,
        { expiresIn: '30d' }
      );

      res.status(200).json({
        message: 'Đăng nhập Google thành công',
        token,
        user: { id: customer.id, fullName: customer.fullName, email: customer.email, avatar: customer.avatarUrl }
      });
    } catch (error) {
      console.error('Lỗi customerGoogleLogin:', error);
      res.status(500).json({ message: 'Lỗi server nội bộ' });
    }
  }
};
