import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { otpService, normalizePhone, isValidPassword, OtpPurpose } from '../services/otp.service';
import { getStaffMetadata, setStaffMetadata } from '../lib/staff-metadata';
import { iamService } from '../lib/iam.service';
import { calculateMemberTier } from './customer.controller';

const JWT_SECRET = process.env.JWT_SECRET || 'dcor_super_secret_key_2026';
const LOCK_DURATION_SECONDS = Number(process.env.LOGIN_LOCK_SECONDS) || 900;

function mapFromPrismaRole(role: string): string {
  switch (role) {
    case 'OWNER':
    case 'ADMIN':
      return 'Super Admin';
    case 'WAREHOUSE':
      return 'Quản lý kho';
    case 'CONTENT':
      return 'Quản lý sản phẩm';
    case 'SALES':
    default:
      return 'Sales';
  }
}

export const authController = {
  // Đăng nhập dành cho Admin / Staff
  adminLogin: async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ message: 'Vui lòng cung cấp email và mật khẩu.' });
        return;
      }

      const normalizedEmail = email.trim().toLowerCase();

      // 1. Tìm user trong bảng StaffUser
      const staff = await prisma.staffUser.findUnique({
        where: { email: normalizedEmail }
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
        res.status(403).json({ message: 'Tài khoản đã bị tạm khóa hoặc chưa được kích hoạt.' });
        return;
      }

      // Cập nhật thời điểm đăng nhập gần nhất
      await prisma.staffUser.update({
        where: { id: staff.id },
        data: { lastLoginAt: new Date(), failedLoginCount: 0 }
      });

      // Đọc metadata chính xác (bảo toàn vai trò động, quyền đa vai trò, chi nhánh)
      const metadata = getStaffMetadata(staff.email);
      let exactRoles = metadata?.roles && metadata.roles.length > 0 
        ? metadata.roles 
        : [mapFromPrismaRole(staff.role)];

      // KIỂM TRA TỒN TẠI VAI TRÒ (Chống lỗi vai trò đã bị xóa):
      const existingRoleNames = iamService.getAllRoles().map(r => r.name);
      exactRoles = exactRoles.filter(r => r === 'Super Admin' || existingRoleNames.includes(r));
      if (exactRoles.length === 0) {
        // Nếu toàn bộ role của tài khoản đã bị xóa -> tự động gán vai trò an toàn NV Kinh doanh
        exactRoles = ['NV Kinh doanh'];
        setStaffMetadata(staff.email, { roles: ['NV Kinh doanh'], role: 'NV Kinh doanh' });
      }

      const exactRole = metadata?.role && existingRoleNames.includes(metadata.role) 
        ? metadata.role 
        : exactRoles[0];
      const branchId = metadata?.branchId || 'ALL';
      const branchName = metadata?.branchName || 'Toàn hệ thống';
      const assignedBranches = metadata?.assignedBranches || [branchId];

      // 4. Sinh JWT Token
      const token = jwt.sign(
        { 
          userId: staff.id, 
          email: staff.email, 
          role: exactRole,
          roles: exactRoles,
          branchId,
          type: 'STAFF' 
        },
        JWT_SECRET,
        { expiresIn: '7d' } // Token sống 7 ngày (idle timeout 4 tiếng không thao tác sẽ do hệ thống kiểm soát)
      );

      const permissions = iamService.getEffectivePermissions(exactRoles);

      res.status(200).json({
        message: 'Đăng nhập thành công',
        token,
        permissions,
        user: {
          id: staff.id,
          fullName: staff.fullName,
          email: staff.email,
          role: exactRole,
          roles: exactRoles,
          branchId,
          branchName,
          assignedBranches,
          status: staff.status
        }
      });
    } catch (error) {
      console.error('Lỗi adminLogin:', error);
      res.status(500).json({ message: 'Lỗi server nội bộ' });
    }
  },

  // Setup mật khẩu mới từ link Invite & kích hoạt tài khoản
  acceptInvite: async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, token, password, fullName } = req.body;

      if ((!email && !token) || !password) {
        res.status(400).json({ message: 'Thiếu thông tin kích hoạt.' });
        return;
      }

      // Tìm user theo token hoặc email
      let staff = null;
      if (token) {
        staff = await prisma.staffUser.findFirst({
          where: { invitationToken: token }
        });
      }

      if (!staff && email) {
        staff = await prisma.staffUser.findUnique({
          where: { email: email.trim().toLowerCase() }
        });
      }

      if (!staff) {
        res.status(404).json({ message: 'Không tìm thấy thông tin tài khoản hoặc mã kích hoạt không hợp lệ.' });
        return;
      }

      // Kiểm tra thời hạn token nếu có
      if (staff.invitationTokenExpiry && staff.invitationTokenExpiry < new Date()) {
        res.status(400).json({ message: 'Liên kết kích hoạt tài khoản đã hết hạn. Vui lòng liên hệ Super Admin gửi lại thư mời mới.' });
        return;
      }

      // Mã hóa mật khẩu mới
      const hashedPassword = bcrypt.hashSync(password, 10);

      // Cập nhật trạng thái thành ACTIVE và xóa token mời
      const updatedStaff = await prisma.staffUser.update({
        where: { id: staff.id },
        data: { 
          passwordHash: hashedPassword,
          status: 'ACTIVE',
          invitationToken: null,
          invitationTokenExpiry: null,
          lastLoginAt: new Date(),
          fullName: fullName && fullName.trim() ? fullName.trim() : staff.fullName
        }
      });

      // Đọc metadata chính xác (bảo toàn vai trò động như IT, đa vai trò, chi nhánh)
      const metadata = getStaffMetadata(updatedStaff.email);
      const exactRoles = metadata?.roles && metadata.roles.length > 0 
        ? metadata.roles 
        : [mapFromPrismaRole(updatedStaff.role)];
      const exactRole = metadata?.role || exactRoles[0];
      const branchId = metadata?.branchId || 'ALL';
      const branchName = metadata?.branchName || 'Toàn hệ thống';
      const assignedBranches = metadata?.assignedBranches || [branchId];

      // Tự sinh token JWT đăng nhập luôn cho người dùng
      const authToken = jwt.sign(
        { 
          userId: updatedStaff.id, 
          email: updatedStaff.email, 
          role: exactRole,
          roles: exactRoles,
          branchId,
          type: 'STAFF' 
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.status(200).json({ 
        message: 'Kích hoạt tài khoản thành công.',
        token: authToken,
        user: {
          id: updatedStaff.id,
          fullName: updatedStaff.fullName,
          email: updatedStaff.email,
          role: exactRole,
          roles: exactRoles,
          branchId,
          branchName,
          assignedBranches
        }
      });
    } catch (error) {
      console.error('Lỗi acceptInvite:', error);
      res.status(500).json({ message: 'Lỗi server nội bộ' });
    }
  },

  // Quên mật khẩu Admin
  forgotPassword: async (req: Request, res: Response): Promise<void> => {
    try {
      const { email } = req.body;
      if (!email) {
        res.status(400).json({ message: 'Vui lòng cung cấp email.' });
        return;
      }

      const normalizedEmail = email.trim().toLowerCase();
      const staff = await prisma.staffUser.findUnique({
        where: { email: normalizedEmail }
      });

      if (!staff) {
        // Bảo mật: không báo chi tiết email có tồn tại hay không
        res.status(200).json({ message: `Nếu email ${normalizedEmail} tồn tại trong hệ thống, hướng dẫn khôi phục sẽ được gửi.` });
        return;
      }

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
      const resetToken = jwt.sign(
        { userId: staff.id, email: staff.email, type: 'PASSWORD_RESET' },
        JWT_SECRET,
        { expiresIn: '1h' }
      );

      const resetUrl = `${frontendUrl}/admin-invite?email=${encodeURIComponent(staff.email)}&token=${resetToken}`;
      const { emailService } = await import('../services/email.service');
      await emailService.sendPasswordResetEmail({
        to: staff.email,
        fullName: staff.fullName,
        resetUrl
      });

      res.status(200).json({
        message: `Đã gửi hướng dẫn khôi phục mật khẩu tới email ${normalizedEmail}. Vui lòng kiểm tra hộp thư!`,
        resetUrl // Trả về để tiện test nếu cần
      });
    } catch (error) {
      console.error('Lỗi forgotPassword:', error);
      res.status(500).json({ message: 'Lỗi máy chủ khi xử lý quên mật khẩu.' });
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

      const existingCustomer = await prisma.customer.findFirst({
        where: {
          OR: [
            { phone: normalizedPhone },
            { phone: normalizedPhone.startsWith('0') ? '84' + normalizedPhone.slice(1) : normalizedPhone },
            { phone: normalizedPhone.startsWith('0') ? '+84' + normalizedPhone.slice(1) : normalizedPhone }
          ]
        }
      });

      if (existingCustomer) {
        res.status(400).json({ message: 'Số điện thoại này đã tồn tại trong hệ thống. Vui lòng đăng nhập hoặc sử dụng số khác.' });
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

      const tierInfo = calculateMemberTier(customer.totalSpent);
      res.status(201).json({
        message: 'Đăng ký thành công',
        token,
        user: {
          id: customer.id,
          fullName: customer.fullName,
          phone: customer.phone,
          avatar: customer.avatarUrl,
          rewardPoints: customer.rewardPoints,
          totalSpent: Number(customer.totalSpent),
          memberTier: tierInfo.tier,
          memberBadge: tierInfo.badge
        }
      });
    } catch (error) {
      console.error('Lỗi customerRegister:', error);
      res.status(500).json({ message: 'Lỗi server nội bộ' });
    }
  },

  // 3. Đăng nhập bằng Số điện thoại & Mật khẩu (hoặc Mã OTP kích hoạt 111111)
  customerLogin: async (req: Request, res: Response): Promise<void> => {
    try {
      const { phone, password, otp, remember } = req.body;

      if (!phone) {
        res.status(400).json({ message: 'Vui lòng cung cấp số điện thoại.' });
        return;
      }

      if (!password && !otp) {
        res.status(400).json({ message: 'Vui lòng cung cấp mật khẩu hoặc mã OTP xác thực.' });
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

      if (!customer) {
        res.status(401).json({ message: 'Số điện thoại chưa được liên kết hoặc chưa lưu trong hồ sơ cá nhân.' });
        return;
      }

      let isAuthSuccess = false;

      // Đăng nhập qua OTP (mặc định 111111)
      if (otp) {
        const cleanOtp = String(otp).trim();
        if (cleanOtp === '111111') {
          isAuthSuccess = true;
        } else {
          const otpValidation = await otpService.verifyOtp(phone, cleanOtp);
          if (otpValidation.isValid) {
            isAuthSuccess = true;
          } else {
            res.status(401).json({ message: 'Mã OTP không chính xác. Mã mặc định là 111111.' });
            return;
          }
        }
      } else if (password) {
        if (!customer.passwordHash) {
          res.status(401).json({ message: 'Tài khoản chưa thiết lập mật khẩu. Bạn có thể đăng nhập bằng OTP (111111) hoặc thiết lập mật khẩu trong hồ sơ cá nhân.' });
          return;
        }
        isAuthSuccess = bcrypt.compareSync(password, customer.passwordHash);
      }

      if (!isAuthSuccess) {
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

      // Đăng nhập thành công -> Reset failedLoginCount & lockedUntil, cập nhật isPhoneVerified nếu đăng nhập qua OTP
      const dataReset: any = {};
      if (customer.failedLoginCount > 0 || customer.lockedUntil) {
        dataReset.failedLoginCount = 0;
        dataReset.lockedUntil = null;
      }
      if (otp && !customer.isPhoneVerified) {
        dataReset.isPhoneVerified = true;
      }
      if (Object.keys(dataReset).length > 0) {
        await prisma.customer.update({
          where: { id: customer.id },
          data: dataReset
        });
      }

      // remember = true -> 30 ngày, ngược lại 1 ngày
      const tokenExpiresIn = remember ? '30d' : '1d';
      const token = jwt.sign(
        { userId: customer.id, phone: customer.phone, type: 'CUSTOMER' },
        JWT_SECRET,
        { expiresIn: tokenExpiresIn }
      );

      const tierInfo = calculateMemberTier(customer.totalSpent);
      res.status(200).json({
        message: 'Đăng nhập thành công',
        token,
        user: {
          id: customer.id,
          fullName: customer.fullName,
          phone: customer.phone,
          avatar: customer.avatarUrl,
          rewardPoints: customer.rewardPoints,
          totalSpent: Number(customer.totalSpent),
          memberTier: tierInfo.tier,
          memberBadge: tierInfo.badge
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

      const tierInfo = calculateMemberTier(customer.totalSpent);
      res.status(200).json({
        message: 'Đăng nhập Google thành công',
        token,
        user: { 
          id: customer.id, 
          fullName: customer.fullName, 
          email: customer.email, 
          avatar: customer.avatarUrl,
          rewardPoints: customer.rewardPoints,
          totalSpent: Number(customer.totalSpent),
          memberTier: tierInfo.tier,
          memberBadge: tierInfo.badge
        }
      });
    } catch (error) {
      console.error('Lỗi customerGoogleLogin:', error);
      res.status(500).json({ message: 'Lỗi server nội bộ' });
    }
  },

  // Kiểm tra phiên làm việc Admin & Thu hồi ngay lập tức nếu tài khoản bị khóa
  verifyAdminSession: async (req: Request, res: Response): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ active: false, message: 'Chưa đăng nhập.' });
        return;
      }

      const token = authHeader.split(' ')[1];
      let decoded: any;
      try {
        decoded = jwt.verify(token, JWT_SECRET);
      } catch (err) {
        res.status(401).json({ active: false, message: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.' });
        return;
      }

      const email = (decoded.email || '').trim().toLowerCase();
      if (!email) {
        res.status(401).json({ active: false, message: 'Token không hợp lệ.' });
        return;
      }

      // Truy vấn trạng thái tài khoản trực tiếp trong cơ sở dữ liệu
      const staff = await prisma.staffUser.findUnique({
        where: { email }
      });

      if (!staff || staff.deletedAt !== null) {
        res.status(403).json({
          active: false,
          code: 'ACCOUNT_DELETED',
          message: 'Tài khoản nhân sự không tồn tại hoặc đã bị xóa.'
        });
        return;
      }

      if (staff.status !== 'ACTIVE') {
        res.status(403).json({
          active: false,
          code: 'ACCOUNT_LOCKED',
          message: 'Tài khoản của bạn đã bị tạm khóa. Vui lòng liên hệ quản trị viên.'
        });
        return;
      }

      const metadata = getStaffMetadata(staff.email);
      const exactRoles = metadata?.roles && metadata.roles.length > 0 
        ? metadata.roles 
        : [mapFromPrismaRole(staff.role)];
      const exactRole = metadata?.role || exactRoles[0];
      const permissions = iamService.getEffectivePermissions(exactRoles);

      const refreshedToken = jwt.sign(
        { userId: staff.id, email: staff.email, role: exactRole, roles: exactRoles, branchId: metadata?.branchId || 'ALL', type: 'STAFF' },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.status(200).json({
        active: true,
        token: refreshedToken,
        permissions,
        user: {
          id: staff.id,
          email: staff.email,
          fullName: staff.fullName,
          role: exactRole,
          roles: exactRoles,
          status: staff.status
        }
      });
    } catch (error: any) {
      console.error('Lỗi verifyAdminSession:', error);
      res.status(500).json({ active: false, message: 'Lỗi kiểm tra phiên làm việc: ' + error.message });
    }
  }
};
