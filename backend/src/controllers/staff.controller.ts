import { Request, Response } from 'express';
import { StaffRole, StaffStatus } from '@prisma/client';
import crypto from 'crypto';
import { emailService } from '../services/email.service';
import { getAllStaffMetadata, getStaffMetadata, setStaffMetadata, deleteStaffMetadata } from '../lib/staff-metadata';
import prisma, { withDbRetry } from '../lib/prisma';
import { memoryCache, CACHE_KEYS } from '../lib/cache';
import { AuthRequest } from '../middleware/auth.middleware';

function isRequesterSuperAdmin(user?: any): boolean {
  if (!user) return false;
  const role = (user.role || '').toString().toLowerCase();
  if (role.includes('super') || role === 'admin' || role === 'owner') return true;
  if (Array.isArray(user.roles)) {
    return user.roles.some((r: string) => {
      const lower = (r || '').toString().toLowerCase();
      return lower.includes('super') || lower === 'admin' || lower === 'owner';
    });
  }
  return false;
}

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
  // Lấy toàn bộ danh sách nhân viên từ Database kết hợp Metadata (với Cache siêu tốc)
  getAllStaff: async (req: Request, res: Response): Promise<void> => {
    try {
      // 1. Kiểm tra cache trong bộ nhớ trước (phản hồi ~1ms)
      const cached = memoryCache.get<any[]>(CACHE_KEYS.STAFF_LIST, 30000);
      if (cached) {
        res.status(200).json(cached);
        return;
      }

      // 2. Truy vấn DB với cơ chế retry thông minh
      const staffList = await withDbRetry(() =>
        prisma.staffUser.findMany({
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' }
        })
      );

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
      // Đọc metadata một lần duy nhất từ RAM thay vì đọc file sync theo từng nhân sự
      const allMetadata = getAllStaffMetadata();

      const formatted = staffList.map(s => {
        const lowerEmail = s.email.trim().toLowerCase();
        const metadata = allMetadata[lowerEmail] || allMetadata[s.email] || null;

        const inviteLink = s.invitationToken
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

        // Ưu tiên lấy vai trò động chính xác (ví dụ: IT) từ metadata nếu có
        const exactRoles = metadata?.roles && metadata.roles.length > 0 
          ? metadata.roles 
          : [mapFromPrismaRole(s.role)];

        const exactRole = metadata?.role || exactRoles.join(', ');
        const branchId = metadata?.branchId || 'ALL';
        const branchName = metadata?.branchName || 'Toàn hệ thống';
        const assignedBranches = metadata?.assignedBranches || [branchId];

        return {
          id: s.id,
          name: s.fullName,
          email: s.email,
          phone: s.phone || '',
          role: exactRole,
          roles: exactRoles,
          branchId,
          branchName,
          assignedBranches,
          customPermissions: metadata?.customPermissions || null,
          status: formatStatus(s.status),
          rawStatus: s.status,
          rawRole: s.role,
          lastLogin: lastLoginStr,
          createdAt: s.createdAt.toLocaleDateString('vi-VN'),
          inviteLink
        };
      });

      // Lưu cache 30s
      memoryCache.set(CACHE_KEYS.STAFF_LIST, formatted);

      res.status(200).json(formatted);
    } catch (error) {
      console.error('Lỗi getAllStaff:', error);
      res.status(500).json({ message: 'Lỗi tải danh sách nhân sự từ cơ sở dữ liệu' });
    }
  },

  // Mời nhân viên mới (Khởi tạo tài khoản, KHÔNG TẠO MẬT KHẨU, lưu metadata vai trò động)
  inviteStaff: async (req: Request, res: Response): Promise<void> => {
    try {
      const { 
        fullName, 
        email, 
        phone, 
        role, 
        roles, 
        branchName, 
        branchId, 
        assignedBranches,
        sendEmailImmediately = false
      } = req.body;

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

      const selectedRoles: string[] = Array.isArray(roles) && roles.length > 0 
        ? roles 
        : [role || 'Sales'];

      const primaryRole = selectedRoles[0];
      const prismaRole = mapToPrismaRole(primaryRole);

      // Lưu trữ Metadata (Lưu vai trò động chính xác như IT, Quản lý kho, v.v.)
      setStaffMetadata(normalizedEmail, {
        roles: selectedRoles,
        role: primaryRole,
        branchId: branchId || 'ALL',
        branchName: branchName || 'Toàn hệ thống',
        assignedBranches: Array.isArray(assignedBranches) ? assignedBranches : [branchId || 'ALL']
      });

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

      let emailSent = false;
      if (sendEmailImmediately) {
        const emailResult = await emailService.sendStaffOnboardingEmail({
          to: normalizedEmail,
          fullName: newStaff.fullName,
          roles: selectedRoles,
          branchName: branchName || 'Toàn hệ thống',
          inviteUrl
        });
        emailSent = emailResult.success;
      }

      memoryCache.invalidate(CACHE_KEYS.STAFF_LIST);

      res.status(201).json({
        message: `Đã khởi tạo tài khoản cho ${fullName}. Mở modal để cấu hình và gửi email!`,
        staff: {
          id: newStaff.id,
          name: newStaff.fullName,
          email: newStaff.email,
          phone: newStaff.phone || '',
          role: selectedRoles.join(', '),
          roles: selectedRoles,
          branchId: branchId || 'ALL',
          branchName: branchName || 'Toàn hệ thống',
          assignedBranches: Array.isArray(assignedBranches) ? assignedBranches : [branchId || 'ALL'],
          status: formatStatus(newStaff.status),
          lastLogin: 'Chưa từng',
          createdAt: newStaff.createdAt.toLocaleDateString('vi-VN'),
          inviteLink: inviteUrl
        },
        inviteLink: inviteUrl,
        emailSent
      });
    } catch (error) {
      console.error('Lỗi inviteStaff:', error);
      res.status(500).json({ message: 'Không thể tạo nhân sự mới trên máy chủ' });
    }
  },

  // Gửi email bàn giao & kích hoạt độc lập (Email Dispatch Modal)
  dispatchEmail: async (req: Request, res: Response): Promise<void> => {
    try {
      const { 
        email, 
        fullName, 
        roles, 
        branchName, 
        branchAddress, 
        branchPhone, 
        branchManager, 
        adminNote, 
        subject 
      } = req.body;

      if (!email || !fullName) {
        res.status(400).json({ message: 'Thiếu thông tin người nhận email.' });
        return;
      }

      const normalizedEmail = email.trim().toLowerCase();
      
      let token = crypto.randomBytes(32).toString('hex');
      const staff = await prisma.staffUser.findUnique({ where: { email: normalizedEmail } });
      
      if (staff) {
        if (!staff.invitationToken) {
          const tokenExpiry = new Date();
          tokenExpiry.setDate(tokenExpiry.getDate() + 7);
          await prisma.staffUser.update({
            where: { id: staff.id },
            data: { invitationToken: token, invitationTokenExpiry: tokenExpiry }
          });
        } else {
          token = staff.invitationToken;
        }
      }

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
      const inviteUrl = `${frontendUrl}/admin-invite?email=${encodeURIComponent(normalizedEmail)}&token=${token}`;

      const roleList: string[] = Array.isArray(roles) && roles.length > 0 ? roles : ['Sales'];

      // Cập nhật metadata vai trò
      setStaffMetadata(normalizedEmail, {
        roles: roleList,
        role: roleList[0],
        branchName: branchName || 'Toàn hệ thống'
      });

      const emailResult = await emailService.sendStaffOnboardingEmail({
        to: normalizedEmail,
        fullName,
        roles: roleList,
        branchName: branchName || 'Toàn hệ thống',
        branchAddress,
        branchPhone,
        branchManager,
        inviteUrl,
        subject,
        adminNote
      });

      if (emailResult.success) {
        res.status(200).json({
          message: `Đã gửi email bàn giao & kích hoạt tài khoản thành công tới ${normalizedEmail}!`,
          inviteUrl,
          emailSent: true
        });
      } else {
        res.status(500).json({
          message: `Lỗi gửi email tới ${normalizedEmail}: ${emailResult.error}`,
          error: emailResult.error,
          inviteUrl,
          emailSent: false
        });
      }
    } catch (error: any) {
      console.error('Lỗi dispatchEmail:', error);
      res.status(500).json({ message: 'Lỗi máy chủ khi gửi email: ' + error.message });
    }
  },

  // Xóa tài khoản nhân sự
  deleteStaff: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!isRequesterSuperAdmin(req.user)) {
        res.status(403).json({ message: 'Chỉ Super Admin mới có quyền xóa tài khoản nhân sự.' });
        return;
      }

      const id = req.params.id as string;
      const target = await prisma.staffUser.findUnique({ where: { id } });
      if (!target) {
        res.status(404).json({ message: 'Không tìm thấy tài khoản nhân sự cần xóa.' });
        return;
      }

      if (req.user?.email && target.email.toLowerCase() === req.user.email.toLowerCase()) {
        res.status(400).json({ message: 'Bạn không thể tự xóa tài khoản của chính mình.' });
        return;
      }

      if (target.role === 'ADMIN' || target.role === 'OWNER' || target.email.toLowerCase().includes('admin@dcor.vn')) {
        res.status(403).json({ message: 'Không được phép xóa tài khoản Super Admin hệ thống.' });
        return;
      }

      // Xóa metadata
      deleteStaffMetadata(target.email);
      deleteStaffMetadata(target.id);

      // Xóa bản ghi nhân sự
      await prisma.staffUser.delete({ where: { id } });

      memoryCache.invalidate(CACHE_KEYS.STAFF_LIST);

      console.log(`[STAFF DELETE] Đã xóa nhân sự: ${target.fullName} (${target.email})`);
      res.status(200).json({ message: `Đã xóa nhân sự "${target.fullName}" khỏi hệ thống thành công!` });
    } catch (error: any) {
      console.error('Lỗi deleteStaff:', error);
      res.status(500).json({ message: 'Lỗi khi xóa nhân sự: ' + error.message });
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

      memoryCache.invalidate(CACHE_KEYS.STAFF_LIST);

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
      const inviteUrl = `${frontendUrl}/admin-invite?email=${encodeURIComponent(updated.email)}&token=${token}`;

      const metadata = getStaffMetadata(updated.email);
      const rolesList = metadata?.roles || [mapFromPrismaRole(updated.role)];

      const emailResult = await emailService.sendStaffOnboardingEmail({
        to: updated.email,
        fullName: updated.fullName,
        roles: rolesList,
        branchName: metadata?.branchName || 'Toàn hệ thống',
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
  updateRole: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!isRequesterSuperAdmin(req.user)) {
        res.status(403).json({ message: 'Chỉ Super Admin mới có quyền thay đổi vai trò nhân sự.' });
        return;
      }

      const id = req.params.id as string;
      const { role, roles } = req.body;

      const rolesArray = Array.isArray(roles) && roles.length > 0 ? roles : [role || 'Sales'];
      const prismaRole = mapToPrismaRole(rolesArray[0]);

      const updated = await prisma.staffUser.update({
        where: { id },
        data: { role: prismaRole }
      });

      setStaffMetadata(updated.email, {
        roles: rolesArray,
        role: rolesArray[0]
      });

      memoryCache.invalidate(CACHE_KEYS.STAFF_LIST);

      res.status(200).json({
        message: 'Cập nhật vai trò thành công',
        role: rolesArray[0],
        roles: rolesArray
      });
    } catch (error) {
      console.error('Lỗi updateRole:', error);
      res.status(500).json({ message: 'Lỗi cập nhật vai trò' });
    }
  },

  // Cập nhật trạng thái (Khóa / Mở khóa)
  updateStatus: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!isRequesterSuperAdmin(req.user)) {
        res.status(403).json({ message: 'Chỉ Super Admin mới có quyền khóa hoặc mở khóa tài khoản nhân sự.' });
        return;
      }

      const id = req.params.id as string;
      const target = await prisma.staffUser.findUnique({ where: { id } });
      if (!target) {
        res.status(404).json({ message: 'Không tìm thấy tài khoản nhân sự.' });
        return;
      }

      // Không cho phép tự khóa hoặc tự mở khóa tài khoản của chính mình
      if (req.user?.email && target.email.toLowerCase() === req.user.email.toLowerCase()) {
        res.status(400).json({ message: 'Bạn không thể tự khóa hoặc mở khóa tài khoản của chính mình.' });
        return;
      }

      const { status } = req.body;

      const updated = await prisma.staffUser.update({
        where: { id },
        data: { status: status as StaffStatus }
      });

      memoryCache.invalidate(CACHE_KEYS.STAFF_LIST);

      res.status(200).json({
        message: 'Cập nhật trạng thái thành công',
        status: formatStatus(updated.status)
      });
    } catch (error) {
      console.error('Lỗi updateStatus:', error);
      res.status(500).json({ message: 'Lỗi cập nhật trạng thái' });
    }
  },

  // Cập nhật ma trận phân quyền riêng cho từng nhân viên (Staff Custom Permissions)
  updatePermissions: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!isRequesterSuperAdmin(req.user)) {
        res.status(403).json({ message: 'Chỉ Super Admin mới có quyền tùy chỉnh phân quyền nhân sự.' });
        return;
      }

      const id = req.params.id as string;
      const { email, customPermissions } = req.body;

      const staff = await prisma.staffUser.findFirst({
        where: {
          OR: [
            { id },
            { email: email ? String(email).trim().toLowerCase() : '' }
          ]
        }
      });

      if (!staff) {
        res.status(404).json({ message: 'Không tìm thấy tài khoản nhân sự cần cập nhật quyền.' });
        return;
      }

      // Lưu quyền tùy chỉnh vào metadata
      setStaffMetadata(staff.email, { customPermissions });
      setStaffMetadata(staff.id, { customPermissions });

      memoryCache.invalidate(CACHE_KEYS.STAFF_LIST);

      res.status(200).json({
        success: true,
        message: `Đã lưu cấu hình phân quyền riêng cho nhân sự "${staff.fullName}" thành công!`,
        customPermissions
      });
    } catch (error: any) {
      console.error('Lỗi updatePermissions:', error);
      res.status(500).json({ message: 'Lỗi khi cập nhật phân quyền nhân sự: ' + error.message });
    }
  }
};
