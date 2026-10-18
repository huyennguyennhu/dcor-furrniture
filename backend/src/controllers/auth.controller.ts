import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { otpService, normalizePhone, isValidPassword, OtpPurpose } from '../services/otp.service';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'dcor_super_secret_key_2026';
const LOCK_DURATION_SECONDS = Number(process.env.LOGIN_LOCK_SECONDS) || 900;

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

  // 1. Gửi OTP qua SMS (Đăng ký hoặc Quên mật khẩu)
  customerSendOtp: async (req: Request, res: Response): Promise<void> => {
    try {
      const { phone, purpose } = req.body;

      if (!phone || !purpose) {
        res.status(400).json({ message: 'Vui lòng cung cấp số điện thoại và mục đích yêu cầu OTP.' });
        return;
      }

      if (purpose !== 'REGISTER' && purpose !== 'RESET_PASSWORD') {
        res.status(400).json({ message: 'Mục đích không hợp lệ (chỉ chấp nhận REGISTER hoặc RESET_PASSWORD).' });
        return;
      }

      const result = await otpService.sendOtp(phone, purpose as OtpPurpose);

      if (result.status === 429) {
        res.status(429).json({
          message: result.message,
          retryAfter: result.retryAfter
        });
        return;
      }

      if (result.status !== 200) {
        res.status(result.status).json({ message: result.message });
        return;
      }

      res.status(200).json({
        message: result.message,
        expiresIn: result.expiresIn,
        resendAfter: result.resendAfter,
        ...(result.devOtp ? { devOtp: result.devOtp } : {})
      });
    } catch (error) {
      console.error('Lỗi customerSendOtp:', error);
      res.status(500).json({ message: 'Lỗi server nội bộ' });
    }
  },

  // 2. Đăng ký tài khoản (Khách hàng)
  customerRegister: async (req: Request, res: Response): Promise<void> => {
    try {
      const { fullName, phone, password, otp } = req.body;

      if (!fullName || !phone || !password || !otp) {
        res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ họ tên, số điện thoại, mật khẩu và mã OTP.' });
        return;
      }

      if (!isValidPassword(password)) {
        res.status(400).json({ message: 'Mật khẩu phải có tối thiểu 8 ký tự, bao gồm cả chữ cái và số.' });
        return;
      }

      const normalizedPhone = normalizePhone(phone);

      const existingCustomer = await prisma.customer.findUnique({
        where: { phone: normalizedPhone }
      });

      if (existingCustomer) {
        res.status(400).json({ message: 'Số điện thoại này đã được đăng ký.' });
        return;
      }

      // Xác thực OTP
      const otpValidation = await otpService.verifyOtp(phone, otp);
      if (!otpValidation.isValid) {
        res.status(otpValidation.status).json({ message: otpValidation.message });
        return;
      }

      const hashedPassword = bcrypt.hashSync(password, 10);

      // Tạo Customer (email = null, KHÔNG dùng email giả)
      const customer = await prisma.customer.create({
        data: {
          fullName: fullName.trim(),
          phone: normalizedPhone,
          passwordHash: hashedPassword,
          email: null,
          isPhoneVerified: true
        }
      });

      // Xóa OtpCode của SĐT đó
      await otpService.clearOtpsForPhone(normalizedPhone);

      // Sinh JWT thời hạn 30 ngày
      const token = jwt.sign(
        { userId: customer.id, phone: customer.phone, type: 'CUSTOMER' },
        JWT_SECRET,
        { expiresIn: '30d' }
      );

      res.status(201).json({
        message: 'Đăng ký thành công',
        token,
        user: {
          id: customer.id,
          fullName: customer.fullName,
          phone: customer.phone,
          avatar: customer.avatarUrl
        }
      });
    } catch (error) {
      console.error('Lỗi customerRegister:', error);
      res.status(500).json({ message: 'Lỗi server nội bộ' });
    }
  },

  // 3. Đăng nhập bằng Số điện thoại & Mật khẩu
  customerLogin: async (req: Request, res: Response): Promise<void> => {
    try {
      const { phone, password, remember } = req.body;

      if (!phone || !password) {
        res.status(400).json({ message: 'Vui lòng cung cấp số điện thoại và mật khẩu.' });
        return;
      }

      const normalizedPhone = normalizePhone(phone);
      let customer = await prisma.customer.findUnique({
        where: { phone: normalizedPhone }
      });

      // Kiểm tra tài khoản đang bị khóa tạm thời
      if (customer && customer.lockedUntil) {
        const now = new Date();
        if (customer.lockedUntil > now) {
          const remainingSeconds = Math.ceil((customer.lockedUntil.getTime() - now.getTime()) / 1000);
          res.status(423).json({
            message: 'Tài khoản tạm thời bị khóa do nhập sai mật khẩu quá 5 lần liên tiếp.',
            remainingSeconds
          });
          return;
        } else {
          // lockedUntil đã qua -> coi failedLoginCount = 0 (và reset trong DB) trước khi xử lý lần đăng nhập này
          customer = await prisma.customer.update({
            where: { id: customer.id },
            data: {
              failedLoginCount: 0,
              lockedUntil: null
            }
          });
        }
      }

      // Thông báo lỗi chung chung không lộ tài khoản có tồn tại hay không
      if (!customer || !customer.passwordHash) {
        res.status(401).json({ message: 'Số điện thoại hoặc mật khẩu không chính xác.' });
        return;
      }

      const isPasswordValid = bcrypt.compareSync(password, customer.passwordHash);

      if (!isPasswordValid) {
        const updatedCustomer = await prisma.customer.update({
          where: { id: customer.id },
          data: {
            failedLoginCount: { increment: 1 }
          }
        });

        if (updatedCustomer.failedLoginCount >= 5) {
          const lockDurationSeconds = Number(process.env.LOGIN_LOCK_SECONDS) || LOCK_DURATION_SECONDS;
          const lockedUntil = new Date(Date.now() + lockDurationSeconds * 1000);

          await prisma.customer.update({
            where: { id: customer.id },
            data: {
              lockedUntil
            }
          });

          res.status(423).json({
            message: 'Tài khoản tạm thời bị khóa do nhập sai mật khẩu quá 5 lần liên tiếp.',
            remainingSeconds: lockDurationSeconds
          });
          return;
        }

        res.status(401).json({ message: 'Số điện thoại hoặc mật khẩu không chính xác.' });
        return;
      }

      // Đăng nhập thành công -> Reset failedLoginCount & lockedUntil
      if (customer.failedLoginCount > 0 || customer.lockedUntil) {
        await prisma.customer.update({
          where: { id: customer.id },
          data: {
            failedLoginCount: 0,
            lockedUntil: null
          }
        });
      }

      // remember = true -> 30 ngày, ngược lại 1 ngày
      const tokenExpiresIn = remember ? '30d' : '1d';
      const token = jwt.sign(
        { userId: customer.id, phone: customer.phone, type: 'CUSTOMER' },
        JWT_SECRET,
        { expiresIn: tokenExpiresIn }
      );

      res.status(200).json({
        message: 'Đăng nhập thành công',
        token,
        user: {
          id: customer.id,
          fullName: customer.fullName,
          phone: customer.phone,
          avatar: customer.avatarUrl
        }
      });
    } catch (error) {
      console.error('Lỗi customerLogin:', error);
      res.status(500).json({ message: 'Lỗi server nội bộ' });
    }
  },

  // 4. Quên mật khẩu: Xác thực OTP để nhận Reset Token
  customerVerifyForgotOtp: async (req: Request, res: Response): Promise<void> => {
    try {
      const { phone, otp } = req.body;

      if (!phone || !otp) {
        res.status(400).json({ message: 'Vui lòng cung cấp số điện thoại và mã OTP.' });
        return;
      }

      const normalizedPhone = normalizePhone(phone);

      const otpValidation = await otpService.verifyOtp(phone, otp);
      if (!otpValidation.isValid) {
        res.status(otpValidation.status).json({ message: otpValidation.message });
        return;
      }

      // OTP hợp lệ -> Xóa toàn bộ OTP của số điện thoại để chỉ dùng được một lần
      await otpService.clearOtpsForPhone(normalizedPhone);

      // Sinh resetToken có thời hạn 10 phút, payload { phone, type: "RESET" }
      const resetToken = jwt.sign(
        { phone: normalizedPhone, type: 'RESET' },
        JWT_SECRET,
        { expiresIn: '10m' }
      );

      res.status(200).json({
        message: 'Xác thực OTP thành công.',
        resetToken
      });
    } catch (error) {
      console.error('Lỗi customerVerifyForgotOtp:', error);
      res.status(500).json({ message: 'Lỗi server nội bộ' });
    }
  },

  // 5. Quên mật khẩu: Đặt lại mật khẩu mới bằng Reset Token
  customerResetPassword: async (req: Request, res: Response): Promise<void> => {
    try {
      const { resetToken, newPassword } = req.body;

      if (!resetToken || !newPassword) {
        res.status(400).json({ message: 'Vui lòng cung cấp mã xác nhận đặt lại mật khẩu và mật khẩu mới.' });
        return;
      }

      // Xác thực resetToken
      let payload: any;
      try {
        payload = jwt.verify(resetToken, JWT_SECRET);
      } catch (err) {
        res.status(400).json({ message: 'Mã xác nhận đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.' });
        return;
      }

      if (!payload || payload.type !== 'RESET' || !payload.phone) {
        res.status(400).json({ message: 'Mã xác nhận đặt lại mật khẩu không hợp lệ.' });
        return;
      }

      // Validate mật khẩu mới
      if (!isValidPassword(newPassword)) {
        res.status(400).json({ message: 'Mật khẩu phải có tối thiểu 8 ký tự, bao gồm cả chữ cái và số.' });
        return;
      }

      const customer = await prisma.customer.findUnique({
        where: { phone: payload.phone }
      });

      if (!customer) {
        res.status(404).json({ message: 'Không tìm thấy tài khoản người dùng tương ứng.' });
        return;
      }

      const passwordHash = bcrypt.hashSync(newPassword, 10);

      // Cập nhật mật khẩu, mở khóa và reset số lần đăng nhập sai
      await prisma.customer.update({
        where: { id: customer.id },
        data: {
          passwordHash,
          failedLoginCount: 0,
          lockedUntil: null
        }
      });

      // Xóa OtpCode của SĐT đó
      await otpService.clearOtpsForPhone(payload.phone);

      res.status(200).json({
        message: 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập bằng mật khẩu mới.'
      });
    } catch (error) {
      console.error('Lỗi customerResetPassword:', error);
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
            phone: 'GOOG_' + email, // Fake phone do Google login không cấp phone
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
