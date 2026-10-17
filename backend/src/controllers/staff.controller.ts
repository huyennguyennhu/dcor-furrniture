import { Request, Response } from 'express';
import { PrismaClient, StaffRole, StaffStatus } from '@prisma/client';
import crypto from 'crypto';
import { emailService } from '../services/email.service';

const prisma = new PrismaClient();

function mapToPrismaRole(roleStr: string): StaffRole {
  const lower = (roleStr || '').toLowerCase();
  if (lower.includes('super') || lower.includes('owner') || lower === 'admin') return 'ADMIN';
  if (lower.includes('kho') || lower.includes('warehouse')) return 'WAREHOUSE';
  if (lower.includes('sản phẩm') || lower.includes('content') || lower.includes('marketing')) return 'CONTENT';
  return 'SALES';
}

function mapFromPrismaRole(role: StaffRole): string {
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

function formatStatus(status: StaffStatus): 'Đã kích hoạt' | 'Chờ kích hoạt' | 'Tạm khóa' {
  switch (status) {
    case 'ACTIVE':
      return 'Đã kích hoạt';
    case 'INACTIVE':
      return 'Tạm khóa';
    case 'PENDING_ACTIVATION':
    default:
      return 'Chờ kích hoạt';
  }
}

export const staffController = {
  // Lấy toàn bộ danh sách nhân viên từ Database
  getAllStaff: async (req: Request, res: Response): Promise<void> => {
    try {
      const staffList = await prisma.staffUser.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' }
      });

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';

      const formatted = staffList.map(s => {
        const inviteLink = s.status === 'PENDING_ACTIVATION' && s.invitationToken
          ? `${frontendUrl}/admin-invite?email=${encodeURIComponent(s.email)}&token=${s.invitationToken}`
          : undefined;

        let lastLoginStr = 'Chưa từng';
        if (s.lastLoginAt) {
          const diffMs = Date.now() - new Date(s.lastLoginAt).getTime();
          const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
          if (diffHours < 1) {
            lastLoginStr = 'Vừa xong';
          } else if (diffHours < 24) {
            lastLoginStr = `${diffHours} giờ trước`;
          } else {
            lastLoginStr = `${Math.floor(diffHours / 24)} ngày trước`;
          }
        }

        return {
          id: s.id,
          name: s.fullName,
          email: s.email,
          phone: s.phone || '',
          role: mapFromPrismaRole(s.role),
          status: formatStatus(s.status),
          rawStatus: s.status,
          rawRole: s.role,
          lastLogin: lastLoginStr,
          createdAt: s.createdAt.toLocaleDateString('vi-VN'),
          inviteLink
        };
      });

      res.status(200).json(formatted);
    } catch (error) {
      console.error('Lỗi getAllStaff:', error);
      res.status(500).json({ message: 'Lỗi tải danh sách nhân sự từ cơ sở dữ liệu' });
    }
  },

  // Mời nhân viên mới & gửi email kích hoạt
  inviteStaff: async (req: Request, res: Response): Promise<void> => {
    try {
      const { fullName, email, phone, role } = req.body;

      if (!fullName || !email) {
        res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ họ tên và email.' });
        return;
      }

      const normalizedEmail = email.trim().toLowerCase();

      // Kiểm tra trùng lặp email
      const existingEmail = await prisma.staffUser.findUnique({
        where: { email: normalizedEmail }
      });

      if (existingEmail) {
        res.status(400).json({ message: `Email ${normalizedEmail} đã tồn tại trong hệ thống quản trị.` });
        return;
      }

      // Kiểm tra trùng SĐT nếu có
      if (phone) {
        const existingPhone = await prisma.staffUser.findFirst({
          where: { phone: phone.trim() }
        });
        if (existingPhone) {
          res.status(400).json({ message: `Số điện thoại ${phone} đã được sử dụng bởi nhân sự khác.` });
          return;
        }
      }

      // Sinh token kích hoạt bảo mật
      const token = crypto.randomBytes(32).toString('hex');
      const tokenExpiry = new Date();
      tokenExpiry.setDate(tokenExpiry.getDate() + 7); // Hạn 7 ngày

      const prismaRole = mapToPrismaRole(role);

      // Tạo bản ghi nhân sự trong database
      const newStaff = await prisma.staffUser.create({
        data: {
          fullName: fullName.trim(),
          email: normalizedEmail,
          phone: phone ? phone.trim() : null,
          role: prismaRole,
          status: 'PENDING_ACTIVATION',
          invitationToken: token,
          invitationTokenExpiry: tokenExpiry
        }
      });

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
      const inviteUrl = `${frontendUrl}/admin-invite?email=${encodeURIComponent(normalizedEmail)}&token=${token}`;

      // Gửi email kích hoạt qua dịch vụ email
      const emailResult = await emailService.sendStaffInviteEmail({
        to: normalizedEmail,
        fullName: newStaff.fullName,
        roleName: role || mapFromPrismaRole(prismaRole),
        inviteUrl
      });

      res.status(201).json({
        message: emailResult.success
          ? `Đã tạo nhân sự và gửi email kích hoạt tới ${normalizedEmail}!`
          : `Đã tạo nhân sự trong CSDL. (Email lưu ý: ${emailResult.error})`,
        staff: {
          id: newStaff.id,
          name: newStaff.fullName,
          email: newStaff.email,
          phone: newStaff.phone || '',
          role: mapFromPrismaRole(newStaff.role),
          status: formatStatus(newStaff.status),
          lastLogin: 'Chưa từng',
          createdAt: newStaff.createdAt.toLocaleDateString('vi-VN'),
          inviteLink: inviteUrl
        },
        inviteLink: inviteUrl,
        emailSent: emailResult.success
      });
    } catch (error) {
      console.error('Lỗi inviteStaff:', error);
      res.status(500).json({ message: 'Không thể tạo nhân sự mới trên máy chủ' });
    }
  },

  // Gửi lại thư kích hoạt
  resendInvite: async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params.id as string;

      const staff = await prisma.staffUser.findUnique({ where: { id } });
      if (!staff) {
        res.status(404).json({ message: 'Không tìm thấy nhân viên.' });
        return;
      }

      if (staff.status === 'ACTIVE') {
        res.status(400).json({ message: 'Tài khoản này đã được kích hoạt trước đó.' });
        return;
      }

      // Cập nhật lại token mới
      const token = crypto.randomBytes(32).toString('hex');
      const tokenExpiry = new Date();
      tokenExpiry.setDate(tokenExpiry.getDate() + 7);

      const updated = await prisma.staffUser.update({
        where: { id },
        data: {
          invitationToken: token,
          invitationTokenExpiry: tokenExpiry,
          status: 'PENDING_ACTIVATION'
        }
      });

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
      const inviteUrl = `${frontendUrl}/admin-invite?email=${encodeURIComponent(updated.email)}&token=${token}`;

      const emailResult = await emailService.sendStaffInviteEmail({
        to: updated.email,
        fullName: updated.fullName,
        roleName: mapFromPrismaRole(updated.role),
        inviteUrl
      });

      res.status(200).json({
        message: `Đã cập nhật mã mời và gửi lại thư kích hoạt tới ${updated.email}!`,
        inviteLink: inviteUrl,
        emailSent: emailResult.success
      });
    } catch (error) {
      console.error('Lỗi resendInvite:', error);
      res.status(500).json({ message: 'Lỗi gửi lại thư mời' });
    }
  },

  // Đổi vai trò
  updateRole: async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params.id as string;
      const { role } = req.body;

      const prismaRole = mapToPrismaRole(role);
      const updated = await prisma.staffUser.update({
        where: { id },
        data: { role: prismaRole }
      });

      res.status(200).json({
        message: 'Cập nhật vai trò thành công',
        role: mapFromPrismaRole(updated.role)
      });
    } catch (error) {
      console.error('Lỗi updateRole:', error);
      res.status(500).json({ message: 'Lỗi cập nhật vai trò' });
    }
  },

  // Cập nhật trạng thái (Khóa / Mở khóa)
  updateStatus: async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params.id as string;
      const { status } = req.body; // 'ACTIVE' | 'INACTIVE'

      const updated = await prisma.staffUser.update({
        where: { id },
        data: { status: status as StaffStatus }
      });

      res.status(200).json({
        message: 'Cập nhật trạng thái thành công',
        status: formatStatus(updated.status)
      });
    } catch (error) {
      console.error('Lỗi updateStatus:', error);
      res.status(500).json({ message: 'Lỗi cập nhật trạng thái' });
    }
  }
};
