import { OtpCode } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import prisma from '../lib/prisma';
import { smsService } from './sms.service';


export type OtpPurpose = 'REGISTER' | 'RESET_PASSWORD';

export interface SendOtpResult {
  status: number;
  message: string;
  expiresIn?: number;
  resendAfter?: number;
  retryAfter?: number;
  devOtp?: string;
}

export interface VerifyOtpResult {
  isValid: boolean;
  status: number;
  message: string;
  otpRecord?: OtpCode;
}

export const normalizePhone = (rawPhone: string): string => {
  let phone = rawPhone.trim().replace(/[\s.-]/g, '');
  if (phone.startsWith('+84')) {
    phone = '0' + phone.slice(3);
  }
  return phone;
};

export const isValidVietnamPhone = (phone: string): boolean => {
  const normalized = normalizePhone(phone);
  // Số điện thoại Việt Nam chuẩn: 10 chữ số, bắt đầu bằng 03, 05, 07, 08, 09
  return /^0[35789]\d{8}$/.test(normalized);
};

export const isValidPassword = (password: string): boolean => {
  if (!password || password.length < 8) {
    return false;
  }
  // Tối thiểu 8 ký tự, gồm ít nhất 1 chữ cái và 1 chữ số
  return /^(?=.*[A-Za-z])(?=.*\d)/.test(password);
};

export const generateOtp = (): string => {
  return crypto.randomInt(100000, 1000000).toString();
};

export class OtpService {
  /**
   * Xử lý gửi OTP cho số điện thoại theo mục đích REGISTER hoặc RESET_PASSWORD
   */
  async sendOtp(rawPhone: string, purpose: OtpPurpose): Promise<SendOtpResult> {
    if (!rawPhone || !isValidVietnamPhone(rawPhone)) {
      return {
        status: 400,
        message: 'Số điện thoại không hợp lệ. Vui lòng nhập 10 chữ số bắt đầu bằng 0 hoặc +84.'
      };
    }

    const phone = normalizePhone(rawPhone);

    // Kiểm tra tài khoản theo purpose
    const existingCustomer = await prisma.customer.findUnique({
      where: { phone }
    });

    if (purpose === 'REGISTER' && existingCustomer) {
      return {
        status: 400,
        message: 'Số điện thoại đã được đăng ký.'
      };
    }

    // Nếu RESET_PASSWORD mà tài khoản không tồn tại, trả 200 chung chung để tránh lộ thông tin
    if (purpose === 'RESET_PASSWORD' && !existingCustomer) {
      return {
        status: 200,
        message: 'Mã xác thực đã được gửi đến số điện thoại của bạn.',
        expiresIn: 90,
        resendAfter: 60
      };
    }

    // Chặn gửi lại trong 60s tính theo createdAt của OtpCode gần nhất
    const latestOtp = await prisma.otpCode.findFirst({
      where: { phone },
      orderBy: { createdAt: 'desc' }
    });

    if (latestOtp) {
      const elapsedSeconds = Math.floor((Date.now() - latestOtp.createdAt.getTime()) / 1000);
      if (elapsedSeconds < 60) {
        const retryAfter = 60 - elapsedSeconds;
        return {
          status: 429,
          message: 'Vui lòng đợi trước khi yêu cầu mã mới.',
          retryAfter
        };
      }
    }

    // Sinh OTP 6 số ngẫu nhiên
    const otp = generateOtp();
    const otpHash = bcrypt.hashSync(otp, 10);
    const expiresAt = new Date(Date.now() + 90 * 1000); // 90 giây

    await prisma.otpCode.create({
      data: {
        phone,
        otpHash,
        attempts: 0,
        expiresAt,
        customerId: existingCustomer?.id || null
      }
    });

    const exposeDevOtp = process.env.EXPOSE_DEV_OTP === 'true';

    // Chỉ log OTP ra console khi process.env.EXPOSE_DEV_OTP === 'true'
    if (exposeDevOtp) {
      if (process.env.NODE_ENV === 'production') {
        console.log(`[SMS Dev - ${phone}] Mã OTP xác thực DCor của bạn là: ${otp}. Mã có hiệu lực trong 90 giây.`);
      }
      await smsService.sendOtp(phone, otp);
    } else if (process.env.SMS_PROVIDER && process.env.SMS_PROVIDER.toUpperCase() !== 'CONSOLE') {
      await smsService.sendOtp(phone, otp);
    }

    return {
      status: 200,
      message: 'Mã xác thực đã được gửi đến số điện thoại của bạn.',
      expiresIn: 90,
      resendAfter: 60,
      ...(exposeDevOtp ? { devOtp: otp } : {})
    };
  }

  /**
   * Kiểm tra OTP hợp lệ: còn hạn, attempts < 5, đúng hash
   */
  async verifyOtp(rawPhone: string, otp: string): Promise<VerifyOtpResult> {
    if (!rawPhone || !isValidVietnamPhone(rawPhone)) {
      return {
        isValid: false,
        status: 400,
        message: 'Số điện thoại không hợp lệ.'
      };
    }

    if (!otp || otp.trim().length === 0) {
      return {
        isValid: false,
        status: 400,
        message: 'Vui lòng cung cấp mã OTP.'
      };
    }

    const phone = normalizePhone(rawPhone);

    const latestOtp = await prisma.otpCode.findFirst({
      where: { phone },
      orderBy: { createdAt: 'desc' }
    });

    if (!latestOtp) {
      return {
        isValid: false,
        status: 400,
        message: 'Mã OTP không hợp lệ hoặc đã hết hạn.'
      };
    }

    if (latestOtp.attempts >= 5) {
      return {
        isValid: false,
        status: 400,
        message: 'Bạn đã nhập sai mã OTP quá 5 lần. Vui lòng yêu cầu mã mới.'
      };
    }

    if (new Date() > latestOtp.expiresAt) {
      return {
        isValid: false,
        status: 400,
        message: 'Mã OTP đã hết hạn. Vui lòng gửi lại mã mới.'
      };
    }

    const isMatch = bcrypt.compareSync(otp.trim(), latestOtp.otpHash);
    if (!isMatch) {
      await prisma.otpCode.update({
        where: { id: latestOtp.id },
        data: { attempts: { increment: 1 } }
      });

      return {
        isValid: false,
        status: 400,
        message: 'Mã OTP không chính xác.'
      };
    }

    return {
      isValid: true,
      status: 200,
      message: 'Xác thực OTP thành công.',
      otpRecord: latestOtp
    };
  }

  /**
   * Xóa toàn bộ OTP đã lưu của số điện thoại sau khi đăng ký hoặc đổi mật khẩu thành công
   */
  async clearOtpsForPhone(rawPhone: string): Promise<void> {
    const phone = normalizePhone(rawPhone);
    await prisma.otpCode.deleteMany({
      where: { phone }
    });
  }
}

export const otpService = new OtpService();
