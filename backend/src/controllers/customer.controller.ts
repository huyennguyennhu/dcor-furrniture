import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth.middleware';
import { otpService } from '../services/otp.service';
import { ensureConsultationTable, notifyAdminPendingConsultations } from './consultation.controller';
import { memoryCache, CACHE_KEYS } from '../lib/cache';
import { DEFAULT_WARRANTY_MONTHS, parseWarrantyMonths } from './product.controller';
import { calculateMemberTier, calculateRewardPoints } from '../lib/member-tier';
export { calculateMemberTier, calculateRewardPoints };

const normalizePhone = (phone: string): string => {
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('84')) {
    cleaned = '0' + cleaned.slice(2);
  }
  return cleaned;
};

const isValidPassword = (password: string): boolean => {
  if (!password || password.length < 8) return false;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  return hasLetter && hasNumber;
};

// calculateMemberTier được dùng chung từ ../lib/member-tier (Thành viên < 30tr | Bạc >= 30tr | Vàng >= 80tr | Kim Cương >= 200tr)

// Chuẩn cấu trúc lịch hẹn tư vấn đồng bộ trực tiếp với bảng PostgreSQL "ShowroomConsultations"
interface CustomerAppointment {
  id: string;
  appointmentCode?: string;
  customerId: string;
  customerName: string;
  phone: string;
  email?: string;
  appointmentType: 'SHOWROOM' | 'ONLINE_3D';
  showroomId?: string;
  showroomName?: string;
  showroomAddress?: string;
  date: string;
  timeSlot: string;
  productId?: string | null;
  productName?: string | null;
  staffName?: string | null;
  rejectionReason?: string | null;
  cancellationReason?: string | null;
  consultationResult?: string | null;
  notes?: string;
  status: 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED' | 'CANCELLED';
  createdAt: string;
  updatedAt?: string;
}

const STANDARD_CONSULTATION_SLOTS = [
  { time: '09:00 - 10:30', period: 'Ca sáng', maxCapacity: 3 },
  { time: '10:30 - 12:00', period: 'Ca sáng', maxCapacity: 3 },
  { time: '14:00 - 15:30', period: 'Ca chiều', maxCapacity: 3 },
  { time: '16:00 - 17:30', period: 'Ca chiều', maxCapacity: 3 },
  { time: '18:30 - 20:00', period: 'Ca tối', maxCapacity: 2 }
];

const mapConsultationRowToAppointment = (row: any, customerId = 'guest'): CustomerAppointment => ({
  id: row.id,
  appointmentCode: row.appointment_code || row.id,
  customerId,
  customerName: row.customer_name || '',
  phone: row.customer_phone || '',
  email: row.customer_email || '',
  appointmentType: 'SHOWROOM',
  showroomId: row.showroom_id || '',
  showroomName: row.showroom_name || 'Showroom DCor',
  showroomAddress: row.showroom_address || row.showroom_name || '',
  date: row.preferred_date || '',
  timeSlot: row.preferred_time || '',
  productId: row.product_id || null,
  productName: row.product_name || null,
  staffName: row.staff_name || null,
  rejectionReason: row.rejection_reason || null,
  cancellationReason: row.cancellation_reason || null,
  consultationResult: row.consultation_result || null,
  notes: row.notes || '',
  status: (row.status || 'PENDING') as CustomerAppointment['status'],
  createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
  updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : undefined
});

const getLocalTodayStr = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

const getShowroomSlotConfig = async (showroomId: string) => {
  let slots = STANDARD_CONSULTATION_SLOTS;
  let maintenanceDates = ['2026-12-25', '2026-01-01', '2026-04-30', '2026-05-01'];
  try {
    const configRes: any[] = await prisma.$queryRawUnsafe(`
      SELECT slots, maintenance_dates FROM "ShowroomSlotConfigs" WHERE showroom_id = $1 LIMIT 1;
    `, String(showroomId));
    if (configRes && configRes.length > 0) {
      if (Array.isArray(configRes[0].slots) && configRes[0].slots.length > 0) {
        slots = configRes[0].slots;
      }
      if (Array.isArray(configRes[0].maintenance_dates)) {
        maintenanceDates = configRes[0].maintenance_dates;
      }
    }
  } catch (_) {}
  return { slots, maintenanceDates };
};

const resolveCustomerIdentifiers = async (req: AuthRequest): Promise<{ customerId: string; phones: string[]; emails: string[] }> => {
  const customerId = req.user?.userId || '';
  const phoneSet = new Set<string>();
  const emailSet = new Set<string>();

  const addPhone = (p?: string | null) => {
    if (!p) return;
    const norm = normalizePhone(String(p));
    if (norm) phoneSet.add(norm);
  };
  const addEmail = (e?: string | null) => {
    if (!e) return;
    const clean = String(e).trim().toLowerCase();
    if (clean) emailSet.add(clean);
  };

  if (customerId) {
    addPhone(req.user?.phone);
    addEmail(req.user?.email);
    try {
      const dbCustomer = await prisma.customer.findUnique({
        where: { id: customerId },
        select: { phone: true, email: true }
      });
      if (dbCustomer) {
        addPhone(dbCustomer.phone);
        addEmail(dbCustomer.email);
      }
    } catch (_) {}
  } else {
    // Khách vãng lai: chỉ lấy qua header x-guest-phone từ phiên làm việc đã xác thực
    addPhone(req.headers['x-guest-phone'] as string);
    addPhone(req.user?.phone);
    addEmail(req.user?.email);
  }

  return {
    customerId: customerId || 'guest',
    phones: Array.from(phoneSet),
    emails: Array.from(emailSet)
  };
};

export interface CustomerReturnRequest {
  id: string;
  returnCode?: string;
  returnType?: string;
  customerId: string;
  orderNumber: string;
  productName: string;
  sku?: string;
  imageUrl?: string;
  variantDescription?: string;
  quantity?: number;
  price?: number;
  reason: string;
  description: string;
  images: string[];
  status: 'PENDING' | 'APPROVED' | 'RETURNING' | 'RECEIVED' | 'EXCHANGING' | 'REFUNDING' | 'PROCESSING' | 'PREPARING' | 'SHIPPED' | 'COMPLETED' | 'REJECTED' | string;
  statusLabel: string;
  refundAmount?: number;
  createdAt: string;
  updatedAt: string;
}

export const inMemoryReturns: CustomerReturnRequest[] = [];

let warrantyClaimsTableReady = false;
export const ensureWarrantyClaimsTable = async (): Promise<void> => {
  if (warrantyClaimsTableReady) return;
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "WarrantyClaims" (
        id VARCHAR(100) PRIMARY KEY,
        claim_code VARCHAR(50) NOT NULL UNIQUE,
        customer_id VARCHAR(100),
        order_id VARCHAR(100),
        order_number VARCHAR(100) NOT NULL,
        product_name VARCHAR(255) NOT NULL,
        warranty_code VARCHAR(100),
        claim_type VARCHAR(100) DEFAULT 'Tại nhà',
        issue_description TEXT NOT NULL,
        evidence_images JSONB DEFAULT '[]'::jsonb,
        status VARCHAR(30) DEFAULT 'PENDING',
        admin_note TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    warrantyClaimsTableReady = true;
  } catch (err) {
    console.error('[WarrantyClaims] Lỗi khởi tạo bảng WarrantyClaims:', err);
  }
};

let notificationReadsTableReady = false;
export const ensureNotificationReadsTable = async (): Promise<void> => {
  if (notificationReadsTableReady) return;
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "CustomerNotificationReads" (
        customer_id VARCHAR(100) NOT NULL,
        notification_id VARCHAR(255) NOT NULL,
        read_at TIMESTAMPTZ DEFAULT NOW(),
        PRIMARY KEY (customer_id, notification_id)
      );
    `);
    notificationReadsTableReady = true;
  } catch (err) {
    console.error('[NotificationReads] Lỗi khởi tạo bảng CustomerNotificationReads:', err);
  }
};

const isAppointmentOwnedByCaller = (
  appt: any,
  identifiers: { customerId: string; phones: string[]; emails: string[] }
): boolean => {
  const apptPhone = appt.customer_phone ? normalizePhone(String(appt.customer_phone)) : '';
  const apptEmail = appt.customer_email ? String(appt.customer_email).trim().toLowerCase() : '';

  if (apptPhone && identifiers.phones.some(p => normalizePhone(p) === apptPhone)) {
    return true;
  }
  if (apptEmail && identifiers.emails.some(e => e.toLowerCase() === apptEmail)) {
    return true;
  }
  return false;
};

export const customerController = {
  // 1. LẤY HỒ SƠ KHÁCH HÀNG
  getProfile: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const customerId = req.user?.userId;
      const guestPhone = req.user?.phone || (req.headers['x-guest-phone'] as string);

      if (!customerId) {
        if (!guestPhone) {
          res.status(401).json({ message: 'Vui lòng đăng nhập để tiếp tục.' });
          return;
        }

        const cleanPhone = normalizePhone(guestPhone);

        // 1. Tìm trong bảng Customer xem đã có tài khoản theo SĐT này chưa
        const customer = await prisma.customer.findFirst({
          where: { phone: cleanPhone },
          include: {
            addresses: {
              orderBy: [
                { isDefault: 'desc' },
                { createdAt: 'desc' }
              ]
            },
            _count: {
              select: { orders: true }
            }
          }
        });

        if (customer) {
          const tierInfo = calculateMemberTier(customer.totalSpent);
          res.json({
            id: customer.id,
            fullName: customer.fullName,
            phone: customer.phone && !customer.phone.startsWith('GOOG_') ? customer.phone : cleanPhone,
            email: customer.email,
            avatarUrl: customer.avatarUrl,
            type: customer.type,
            companyName: customer.companyName,
            taxCode: customer.taxCode,
            rewardPoints: customer.rewardPoints,
            totalSpent: Number(customer.totalSpent),
            memberTier: tierInfo.tier,
            memberBadge: tierInfo.badge,
            nextTierThreshold: tierInfo.nextTierThreshold,
            orderCount: customer._count.orders,
            addresses: customer.addresses,
            createdAt: customer.createdAt,
            isGuest: true
          });
          return;
        }

        // 2. Nếu chưa đăng ký tài khoản, tìm kiếm lịch sử đơn hàng của số điện thoại này
        const orders = await prisma.order.findMany({
          where: { phone: cleanPhone },
          select: {
            id: true,
            orderNumber: true,
            totalAmount: true,
            status: true,
            receiverName: true,
            detailAddress: true,
            ward: true,
            district: true,
            province: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' }
        });

        const latestOrder = orders[0];
        const totalSpent = orders
          .filter(o => o.status === 'DELIVERED' || o.status === 'COMPLETED')
          .reduce((sum, o) => sum + Number(o.totalAmount), 0);

        const guestTier = calculateMemberTier(totalSpent);

        res.json({
          id: 'guest-' + cleanPhone,
          fullName: latestOrder?.receiverName || 'Khách vãng lai',
          phone: cleanPhone,
          email: null,
          avatarUrl: null,
          type: 'RETAIL',
          companyName: null,
          taxCode: null,
          rewardPoints: calculateRewardPoints(totalSpent),
          totalSpent,
          memberTier: guestTier.tier,
          memberBadge: guestTier.badge,
          nextTierThreshold: guestTier.nextTierThreshold,
          orderCount: orders.length,
          addresses: latestOrder ? [{
            id: 'addr-guest-1',
            receiverName: latestOrder.receiverName,
            phone: cleanPhone,
            province: latestOrder.province || '',
            district: latestOrder.district || '',
            ward: latestOrder.ward || '',
            detail: latestOrder.detailAddress || '',
            isDefault: true,
            addressType: 'HOME'
          }] : [],
          createdAt: latestOrder ? latestOrder.createdAt.toISOString() : new Date().toISOString(),
          isGuest: true
        });
        return;
      }

      const customer = await prisma.customer.findUnique({
        where: { id: customerId },
        include: {
          addresses: {
            orderBy: [
              { isDefault: 'desc' },
              { createdAt: 'desc' }
            ]
          },
          _count: {
            select: { orders: true }
          }
        }
      });

      if (!customer) {
        res.status(404).json({ message: 'Không tìm thấy thông tin khách hàng.' });
        return;
      }

      const tierInfo = calculateMemberTier(customer.totalSpent);
      const trustedPhones = Array.from(new Set(
        (customer.addresses || [])
          .map(a => normalizePhone(a.phone))
          .filter(Boolean)
      ));

      res.json({
        id: customer.id,
        fullName: customer.fullName,
        phone: customer.phone && !customer.phone.startsWith('GOOG_') ? customer.phone : '',
        email: customer.email,
        avatarUrl: customer.avatarUrl,
        type: customer.type,
        companyName: customer.companyName,
        taxCode: customer.taxCode,
        rewardPoints: customer.rewardPoints,
        totalSpent: Number(customer.totalSpent),
        memberTier: tierInfo.tier,
        memberBadge: tierInfo.badge,
        nextTierThreshold: tierInfo.nextTierThreshold,
        orderCount: customer._count.orders,
        addresses: customer.addresses,
        trustedPhones,
        createdAt: customer.createdAt,
        isGuest: false,
        hasPassword: !!customer.passwordHash,
        isPhoneVerified: !!customer.isPhoneVerified
      });
    } catch (error) {
      console.error('Lỗi getProfile:', error);
      res.status(500).json({ message: 'Lỗi máy chủ nội bộ khi lấy thông tin hồ sơ.' });
    }
  },

  // 2. CẬP NHẬT HỒ SƠ
  updateProfile: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const customerId = req.user?.userId;
      if (!customerId) {
        res.status(401).json({ message: 'Vui lòng đăng nhập để tiếp tục.' });
        return;
      }

      const { fullName, email, avatarUrl, companyName, taxCode, phone, otp, newPassword } = req.body;

      if (!fullName || !fullName.trim()) {
        res.status(400).json({ message: 'Họ và tên không được để trống.' });
        return;
      }

      // Lấy thông tin khách hàng hiện tại kèm sổ địa chỉ
      const currentCustomer = await prisma.customer.findUnique({
        where: { id: customerId },
        include: { addresses: true }
      });

      if (!currentCustomer) {
        res.status(404).json({ message: 'Không tìm thấy thông tin tài khoản.' });
        return;
      }

      // Kiểm tra email nếu có thay đổi
      if (email && email.trim()) {
        const normalizedEmail = email.trim().toLowerCase();
        const existingEmail = await prisma.customer.findFirst({
          where: {
            email: normalizedEmail,
            id: { not: customerId }
          }
        });
        if (existingEmail) {
          res.status(400).json({ message: 'Email này đã được sử dụng bởi một tài khoản khác.' });
          return;
        }
      }

      const dataToUpdate: any = {
        fullName: fullName.trim()
      };

      // Chỉ cập nhật những trường thực sự được gửi lên (tránh xóa trắng email/avatar khi gọi partial update)
      if (email !== undefined) {
        dataToUpdate.email = email && email.trim() ? email.trim().toLowerCase() : null;
      }
      if (avatarUrl !== undefined) {
        dataToUpdate.avatarUrl = avatarUrl || null;
      }
      if (companyName !== undefined) {
        dataToUpdate.companyName = companyName ? companyName.trim() : null;
      }
      if (taxCode !== undefined) {
        dataToUpdate.taxCode = taxCode ? taxCode.trim() : null;
      }

      // Xử lý cập nhật / thêm số điện thoại cá nhân
      if (phone && phone.trim()) {
        const cleanPhone = normalizePhone(phone);
        const currentPhone = currentCustomer.phone && !currentCustomer.phone.startsWith('GOOG_') 
          ? normalizePhone(currentCustomer.phone) 
          : '';

        // Danh sách số điện thoại trong sổ địa chỉ của tài khoản
        const addressPhones = (currentCustomer.addresses || []).map(a => normalizePhone(a.phone)).filter(Boolean);

        // RÀNG BUỘC THEO QUY ĐỊNH:
        // 1. Số điện thoại hiện tại của tài khoản đã xác thực OTP: không cần xác thực nữa
        const isCurrentPhoneVerified = (cleanPhone === currentPhone && !!currentCustomer.isPhoneVerified);

        // 2. Nếu người dùng lấy số điện thoại trong sổ địa chỉ điền vào hồ sơ: không cần xác thực
        const isFromAddressBook = addressPhones.includes(cleanPhone);

        const isExemptFromOtp = isCurrentPhoneVerified || isFromAddressBook;

        // Nếu số điện thoại thay đổi so với SĐT hiện tại của hồ sơ cá nhân
        if (cleanPhone !== currentPhone) {
          // Kiểm tra xem số điện thoại này đã được tài khoản khác sử dụng chưa
          const existingPhoneAccount = await prisma.customer.findFirst({
            where: {
              OR: [
                { phone: cleanPhone },
                { phone: cleanPhone.startsWith('0') ? '84' + cleanPhone.slice(1) : cleanPhone },
                { phone: cleanPhone.startsWith('0') ? '+84' + cleanPhone.slice(1) : cleanPhone }
              ],
              id: { not: customerId }
            }
          });

          if (existingPhoneAccount) {
            res.status(400).json({ message: 'Số điện thoại này đã tồn tại trong hệ thống. Vui lòng sử dụng số điện thoại khác.' });
            return;
          }

          // NẾU KHÔNG THUỘC DIỆN MIỄN XÁC THỰC (Số mới hoàn toàn, không có trong sổ địa chỉ): BẮT BUỘC OTP
          if (!isExemptFromOtp) {
            const otpCode = otp ? String(otp).trim() : '';
            if (!otpCode) {
              res.status(400).json({ message: 'Số điện thoại mới chưa có trong sổ địa chỉ. Vui lòng nhập mã OTP để xác thực (Mã mặc định: 111111).' });
              return;
            }

            if (otpCode === '111111') {
              // Hợp lệ theo chuẩn OTP mặc định
            } else {
              const otpValidation = await otpService.verifyOtp(phone, otpCode);
              if (!otpValidation.isValid) {
                res.status(400).json({ message: otpValidation.message || 'Mã OTP không chính xác. Mã mặc định là 111111.' });
                return;
              }
            }
          }

          dataToUpdate.phone = cleanPhone;
          dataToUpdate.isPhoneVerified = true;
        } else if (isFromAddressBook && !currentCustomer.isPhoneVerified) {
          // Nếu giữ nguyên số nhưng số đó nằm trong sổ địa chỉ mà trước đó chưa đánh dấu verified
          dataToUpdate.isPhoneVerified = true;
        }
      }

      // Nếu khách hàng muốn thiết lập mật khẩu mới (dành cho tài khoản Google chưa có pass)
      if (newPassword && !currentCustomer.passwordHash) {
        if (!isValidPassword(newPassword)) {
          res.status(400).json({ message: 'Mật khẩu phải có tối thiểu 8 ký tự, bao gồm cả chữ cái và chữ số.' });
          return;
        }
        dataToUpdate.passwordHash = bcrypt.hashSync(newPassword, 10);
      }

      const updated = await prisma.customer.update({
        where: { id: customerId },
        data: dataToUpdate
      });

      res.json({
        message: 'Cập nhật hồ sơ thành công.',
        user: {
          id: updated.id,
          fullName: updated.fullName,
          phone: updated.phone && !updated.phone.startsWith('GOOG_') ? updated.phone : '',
          email: updated.email,
          avatarUrl: updated.avatarUrl,
          hasPassword: !!updated.passwordHash,
          isPhoneVerified: !!updated.isPhoneVerified
        }
      });
    } catch (error: any) {
      if (error?.code === 'P2002' || error?.message?.includes('Unique constraint')) {
        res.status(400).json({ message: 'Số điện thoại này đã tồn tại trong hệ thống. Vui lòng sử dụng số điện thoại khác.' });
        return;
      }
      console.error('Lỗi updateProfile:', error);
      res.status(500).json({ message: 'Lỗi khi cập nhật hồ sơ.' });
    }
  },

  // 3. ĐỔI MẬT KHẨU
  changePassword: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const customerId = req.user?.userId;
      if (!customerId) {
        res.status(401).json({ message: 'Vui lòng đăng nhập để tiếp tục.' });
        return;
      }

      const { currentPassword, newPassword } = req.body;

      if (!newPassword) {
        res.status(400).json({ message: 'Vui lòng cung cấp mật khẩu mới.' });
        return;
      }

      if (!isValidPassword(newPassword)) {
        res.status(400).json({ message: 'Mật khẩu mới phải có tối thiểu 8 ký tự, bao gồm cả chữ cái và chữ số.' });
        return;
      }

      const customer = await prisma.customer.findUnique({
        where: { id: customerId }
      });

      if (!customer) {
        res.status(404).json({ message: 'Không tìm thấy thông tin tài khoản.' });
        return;
      }

      // Nếu đã có mật khẩu thì bắt buộc phải kiểm tra mật khẩu hiện tại
      if (customer.passwordHash) {
        if (!currentPassword) {
          res.status(400).json({ message: 'Vui lòng nhập mật khẩu hiện tại.' });
          return;
        }

        const isMatch = bcrypt.compareSync(currentPassword, customer.passwordHash);
        if (!isMatch) {
          res.status(400).json({ message: 'Mật khẩu hiện tại không chính xác.' });
          return;
        }
      }

      const newHash = bcrypt.hashSync(newPassword, 10);
      await prisma.customer.update({
        where: { id: customerId },
        data: { passwordHash: newHash }
      });

      res.json({ message: customer.passwordHash ? 'Đổi mật khẩu thành công.' : 'Thiết lập mật khẩu đăng nhập thành công.' });
    } catch (error) {
      console.error('Lỗi changePassword:', error);
      res.status(500).json({ message: 'Lỗi khi đổi mật khẩu.' });
    }
  },

  // 4. ĐỔI SỐ ĐIỆN THOẠI KÈM XÁC MINH OTP
  changePhone: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const customerId = req.user?.userId;
      if (!customerId) {
        res.status(401).json({ message: 'Vui lòng đăng nhập để tiếp tục.' });
        return;
      }

      const { newPhone, otp } = req.body;

      if (!newPhone) {
        res.status(400).json({ message: 'Vui lòng cung cấp số điện thoại mới.' });
        return;
      }

      const normalizedNewPhone = normalizePhone(newPhone);

      // Kiểm tra SĐT mới đã thuộc tài khoản khác chưa
      const existing = await prisma.customer.findFirst({
        where: {
          OR: [
            { phone: normalizedNewPhone },
            { phone: normalizedNewPhone.startsWith('0') ? '84' + normalizedNewPhone.slice(1) : normalizedNewPhone },
            { phone: normalizedNewPhone.startsWith('0') ? '+84' + normalizedNewPhone.slice(1) : normalizedNewPhone }
          ],
          id: { not: customerId }
        }
      });

      if (existing) {
        res.status(400).json({ message: 'Số điện thoại này đã tồn tại trong hệ thống. Vui lòng sử dụng số điện thoại khác.' });
        return;
      }

      // Kiểm tra xem số này có trong sổ địa chỉ của tài khoản không
      const addresses = await prisma.address.findMany({
        where: { customerId },
        select: { phone: true }
      });
      const isFromAddressBook = addresses.some(a => normalizePhone(a.phone) === normalizedNewPhone);

      if (!isFromAddressBook) {
        if (!otp) {
          res.status(400).json({ message: 'Số điện thoại này chưa có trong sổ địa chỉ. Vui lòng nhập mã OTP để xác thực (Mã mặc định: 111111).' });
          return;
        }

        // Xác thực OTP (111111 hoặc qua otpService)
        if (otp === '111111') {
          // Hợp lệ theo chuẩn test dev
        } else {
          const otpValidation = await otpService.verifyOtp(newPhone, otp);
          if (!otpValidation.isValid) {
            res.status(otpValidation.status).json({ message: otpValidation.message });
            return;
          }
        }
      }

      await prisma.customer.update({
        where: { id: customerId },
        data: {
          phone: normalizedNewPhone,
          isPhoneVerified: true
        }
      });

      res.json({ message: 'Cập nhật số điện thoại thành công.', phone: normalizedNewPhone });
    } catch (error) {
      console.error('Lỗi changePhone:', error);
      res.status(500).json({ message: 'Lỗi khi đổi số điện thoại.' });
    }
  },

  // ==========================================
  // SỔ ĐỊA CHỈ (ADDRESS BOOK)
  // ==========================================

  // 5. LẤY DANH SÁCH ĐỊA CHỈ
  getAddresses: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const customerId = req.user?.userId;
      if (!customerId) {
        res.status(401).json({ message: 'Vui lòng đăng nhập để tiếp tục.' });
        return;
      }

      const addresses = await prisma.address.findMany({
        where: { customerId },
        orderBy: [
          { isDefault: 'desc' },
          { createdAt: 'desc' }
        ]
      });

      res.json(addresses);
    } catch (error) {
      console.error('Lỗi getAddresses:', error);
      res.status(500).json({ message: 'Lỗi khi lấy sổ địa chỉ.' });
    }
  },

  // 6. THÊM ĐỊA CHỈ MỚI
  createAddress: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const customerId = req.user?.userId;
      if (!customerId) {
        res.status(401).json({ message: 'Vui lòng đăng nhập để tiếp tục.' });
        return;
      }

      const {
        receiverName,
        phone,
        province,
        provinceCode,
        district,
        districtCode,
        ward,
        wardCode,
        detail,
        isDefault
      } = req.body;

      if (!receiverName || !phone || !province || !detail) {
        res.status(400).json({ message: 'Vui lòng điền đầy đủ họ tên người nhận, số điện thoại, tỉnh/thành và địa chỉ chi tiết.' });
        return;
      }

      const cleanPhone = phone.trim();

      // Kiểm tra xem khách đã có địa chỉ nào chưa để set mặc định
      const existingFirst = await prisma.address.findFirst({
        where: { customerId },
        select: { id: true }
      });

      const shouldBeDefault = !existingFirst || !!isDefault;

      if (shouldBeDefault && existingFirst) {
        await prisma.address.updateMany({
          where: { customerId },
          data: { isDefault: false }
        });
      }

      const address = await prisma.address.create({
        data: {
          customerId,
          receiverName: receiverName.trim(),
          phone: cleanPhone,
          province: province.trim(),
          provinceCode: provinceCode ? String(provinceCode) : null,
          district: district ? String(district).trim() : null,
          districtCode: districtCode ? String(districtCode) : null,
          ward: ward ? String(ward).trim() : null,
          wardCode: wardCode ? String(wardCode) : null,
          detail: detail.trim(),
          isDefault: shouldBeDefault
        }
      });

      res.status(201).json({
        message: 'Thêm địa chỉ mới thành công.',
        address
      });
    } catch (error) {
      console.error('Lỗi createAddress:', error);
      res.status(500).json({ message: 'Lỗi khi thêm địa chỉ.' });
    }
  },

  // 7. CẬP NHẬT ĐỊA CHỈ
  updateAddress: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const customerId = req.user?.userId;
      const id = String(req.params.id);

      if (!customerId) {
        res.status(401).json({ message: 'Vui lòng đăng nhập để tiếp tục.' });
        return;
      }

      const existing = await prisma.address.findFirst({
        where: { id, customerId }
      });

      if (!existing) {
        res.status(404).json({ message: 'Không tìm thấy địa chỉ hoặc bạn không có quyền sửa địa chỉ này.' });
        return;
      }

      const {
        receiverName,
        phone,
        province,
        provinceCode,
        district,
        districtCode,
        ward,
        wardCode,
        detail,
        isDefault
      } = req.body;

      if (isDefault && !existing.isDefault) {
        // Đặt làm mặc định -> reset các địa chỉ khác
        await prisma.address.updateMany({
          where: { customerId },
          data: { isDefault: false }
        });
      }

      const updated = await prisma.address.update({
        where: { id },
        data: {
          receiverName: receiverName ? receiverName.trim() : existing.receiverName,
          phone: phone ? phone.trim() : existing.phone,
          province: province ? province.trim() : existing.province,
          provinceCode: provinceCode !== undefined ? provinceCode : existing.provinceCode,
          district: district !== undefined ? district : existing.district,
          districtCode: districtCode !== undefined ? districtCode : existing.districtCode,
          ward: ward !== undefined ? ward : existing.ward,
          wardCode: wardCode !== undefined ? wardCode : existing.wardCode,
          detail: detail ? detail.trim() : existing.detail,
          isDefault: isDefault !== undefined ? !!isDefault : existing.isDefault
        }
      });

      res.json({
        message: 'Cập nhật địa chỉ thành công.',
        address: updated
      });
    } catch (error) {
      console.error('Lỗi updateAddress:', error);
      res.status(500).json({ message: 'Lỗi khi cập nhật địa chỉ.' });
    }
  },

  // 8. ĐẶT ĐỊA CHỈ LÀM MẶC ĐỊNH
  setDefaultAddress: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const customerId = req.user?.userId;
      const id = String(req.params.id);

      if (!customerId) {
        res.status(401).json({ message: 'Vui lòng đăng nhập để tiếp tục.' });
        return;
      }

      const address = await prisma.address.findFirst({
        where: { id, customerId }
      });

      if (!address) {
        res.status(404).json({ message: 'Không tìm thấy địa chỉ.' });
        return;
      }

      await prisma.address.updateMany({
        where: { customerId },
        data: { isDefault: false }
      });

      const updated = await prisma.address.update({
        where: { id },
        data: { isDefault: true }
      });

      res.json({
        message: 'Đã đặt làm địa chỉ mặc định.',
        address: updated
      });
    } catch (error) {
      console.error('Lỗi setDefaultAddress:', error);
      res.status(500).json({ message: 'Lỗi khi đặt địa chỉ mặc định.' });
    }
  },

  // 9. XÓA ĐỊA CHỈ
  deleteAddress: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const customerId = req.user?.userId;
      const id = String(req.params.id);

      if (!customerId) {
        res.status(401).json({ message: 'Vui lòng đăng nhập để tiếp tục.' });
        return;
      }

      const target = await prisma.address.findFirst({
        where: { id, customerId }
      });

      if (!target) {
        res.status(404).json({ message: 'Không tìm thấy địa chỉ để xóa.' });
        return;
      }

      await prisma.address.delete({
        where: { id }
      });

      // Nếu địa chỉ vừa xóa là mặc định, chuyển địa chỉ gần nhất còn lại làm mặc định
      if (target.isDefault) {
        const nextDefault = await prisma.address.findFirst({
          where: { customerId },
          orderBy: { createdAt: 'desc' }
        });
        if (nextDefault) {
          await prisma.address.update({
            where: { id: nextDefault.id },
            data: { isDefault: true }
          });
        }
      }

      res.json({ message: 'Đã xóa địa chỉ thành công.' });
    } catch (error) {
      console.error('Lỗi deleteAddress:', error);
      res.status(500).json({ message: 'Lỗi khi xóa địa chỉ.' });
    }
  },

  // ==========================================
  // BẢO HÀNH (WARRANTY) & ĐỔI TRẢ (RETURNS)
  // ==========================================

  // 10. DANH SÁCH BẢO HÀNH
  getWarranties: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const customerId = req.user?.userId;
      const customerPhone = req.user?.phone || (req.headers['x-guest-phone'] as string);
      if (!customerId && !customerPhone) {
        res.status(401).json({ message: 'Vui lòng đăng nhập hoặc xác thực số điện thoại để tiếp tục.' });
        return;
      }

      const orConditions: any[] = [];
      if (customerId) orConditions.push({ customerId });
      if (customerPhone) orConditions.push({ phone: customerPhone.trim() });

      // Lấy tất cả các đơn hàng đã giao thành công hoặc hoàn tất (DELIVERED hoặc COMPLETED)
      const orders = await prisma.order.findMany({
        where: {
          OR: orConditions,
          status: { in: ['DELIVERED', 'COMPLETED'] }
        },
        include: {
          items: true
        },
        orderBy: { deliveredAt: 'desc' }
      });

      // Thu thập productId / variantId / productName để tra cứu thời hạn bảo hành & ảnh sạch theo từng sản phẩm trong 1 batch query
      const productIdSet = new Set<string>();
      const variantIdSet = new Set<string>();
      const productNameSet = new Set<string>();
      for (const order of orders) {
        for (const item of order.items) {
          if (item.productId) productIdSet.add(item.productId);
          if (item.variantId) variantIdSet.add(item.variantId);
          if (item.productName) productNameSet.add(item.productName);
        }
      }

      const [dbProducts, dbVariants, dbProductsByName] = await Promise.all([
        productIdSet.size > 0
          ? prisma.product.findMany({
              where: { id: { in: Array.from(productIdSet) } },
              select: { id: true, name: true, images: true, configOptions: true }
            }).catch(() => [])
          : Promise.resolve([]),
        variantIdSet.size > 0
          ? prisma.productVariant.findMany({
              where: { id: { in: Array.from(variantIdSet) } },
              select: {
                id: true,
                productId: true,
                optionValues: true,
                product: { select: { id: true, name: true, images: true, configOptions: true } }
              }
            }).catch(() => [])
          : Promise.resolve([]),
        productNameSet.size > 0
          ? prisma.product.findMany({
              where: { name: { in: Array.from(productNameSet) } },
              select: { id: true, name: true, images: true, configOptions: true }
            }).catch(() => [])
          : Promise.resolve([])
      ]);

      const productMap = new Map<string, { configOptions: any; images: any }>();
      const productByNameMap = new Map<string, { configOptions: any; images: any }>();
      for (const p of dbProducts) {
        productMap.set(p.id, { configOptions: p.configOptions, images: p.images });
        if (p.name) productByNameMap.set(p.name.trim().toLowerCase(), { configOptions: p.configOptions, images: p.images });
      }
      for (const p of dbProductsByName) {
        if (!productMap.has(p.id)) {
          productMap.set(p.id, { configOptions: p.configOptions, images: p.images });
        }
        if (p.name && !productByNameMap.has(p.name.trim().toLowerCase())) {
          productByNameMap.set(p.name.trim().toLowerCase(), { configOptions: p.configOptions, images: p.images });
        }
      }
      const variantMap = new Map<string, { optionValues: any; product: { configOptions: any; images: any } | null }>();
      for (const v of dbVariants) {
        const prodData = v.product ? { configOptions: v.product.configOptions, images: v.product.images } : null;
        variantMap.set(v.id, { optionValues: v.optionValues, product: prodData });
        if (v.product && !productMap.has(v.product.id)) {
          productMap.set(v.product.id, prodData!);
        }
      }

      const isCleanImageUrl = (u: any): u is string =>
        typeof u === 'string' && u.trim().length > 0 && !u.includes('dsasf753c');

      const extractFirstCleanImage = (imagesField: any): string => {
        if (Array.isArray(imagesField)) {
          for (const entry of imagesField) {
            const url = typeof entry === 'string' ? entry : entry?.url;
            if (isCleanImageUrl(url)) return url;
          }
        } else if (isCleanImageUrl(imagesField)) {
          return imagesField;
        }
        return '';
      };

      const warrantyItems: any[] = [];
      const now = new Date();

      await ensureWarrantyClaimsTable();
      const orderNumbers = orders.map(o => o.orderNumber).filter(Boolean);
      const claimRows: any[] = orderNumbers.length > 0
        ? await prisma.$queryRawUnsafe<any[]>(
            `SELECT * FROM "WarrantyClaims" WHERE order_number = ANY($1::text[]) ORDER BY created_at DESC;`,
            orderNumbers
          ).catch(() => [])
        : [];

      const claimsByOrder = new Map<string, any[]>();
      for (const c of claimRows) {
        const key = String(c.order_number || '').trim();
        if (!claimsByOrder.has(key)) claimsByOrder.set(key, []);
        claimsByOrder.get(key)!.push({
          id: c.id,
          claimCode: c.claim_code,
          orderNumber: c.order_number,
          productName: c.product_name,
          warrantyCode: c.warranty_code,
          claimType: c.claim_type,
          issueDescription: c.issue_description,
          evidenceImages: Array.isArray(c.evidence_images) ? c.evidence_images : [],
          status: c.status,
          adminNote: c.admin_note,
          createdAt: c.created_at,
          updatedAt: c.updated_at
        });
      }

      orders.forEach(order => {
        const startDate = order.deliveredAt || order.createdAt;
        const startMs = new Date(startDate).getTime();

        const cleanOrderDigits = (order.orderNumber || '').replace(/[^0-9]/g, '');
        const defaultWarrantyCode = 'BH-' + (cleanOrderDigits.slice(-6) || '883921');
        const baseWarrantyCode = (order as any).warrantyCode || defaultWarrantyCode;

        const customerAddress = [
          order.detailAddress,
          order.ward,
          order.district,
          order.province
        ].filter(Boolean).join(', ');

        // Sắp xếp ổn định để mã bảo hành từng sản phẩm trong cùng đơn luôn nhất quán và không trùng nhau
        const sortedItems = [...order.items].sort((a, b) => String(a.id).localeCompare(String(b.id)));

        sortedItems.forEach((item, idx) => {
          const itemWarrantyCode =
            (item.selectedOptions as any)?.warrantyCode ||
            (sortedItems.length > 1
              ? `${baseWarrantyCode}-${String(idx + 1).padStart(2, '0')}`
              : baseWarrantyCode);
          const variantEntry = item.variantId ? variantMap.get(item.variantId) : undefined;
          const prodEntry =
            (item.productId ? productMap.get(item.productId) : undefined) ??
            variantEntry?.product ??
            (item.productName ? productByNameMap.get(item.productName.trim().toLowerCase()) : undefined);

          // Ưu tiên ảnh sạch: item.imageUrl (nếu không phải bucket cũ dsasf753c) -> ảnh sản phẩm live -> ảnh biến thể live
          let resolvedImageUrl = isCleanImageUrl(item.imageUrl) ? item.imageUrl : '';
          if (!resolvedImageUrl && prodEntry) {
            resolvedImageUrl = extractFirstCleanImage(prodEntry.images);
          }
          if (!resolvedImageUrl && variantEntry?.optionValues) {
            const vOpt = typeof variantEntry.optionValues === 'string'
              ? (() => { try { return JSON.parse(variantEntry.optionValues); } catch { return {}; } })()
              : variantEntry.optionValues;
            resolvedImageUrl = extractFirstCleanImage(vOpt?.images) || (isCleanImageUrl(vOpt?.image) ? vOpt.image : '');
          }

          // Ưu tiên thời hạn bảo hành cấu hình trực tiếp trên sản phẩm -> snapshot lúc mua -> mặc định 24 tháng
          const liveConfig = prodEntry?.configOptions;
          const liveWarranty = parseWarrantyMonths(liveConfig?.specs?.warrantyMonths ?? liveConfig?.warrantyMonths);
          const snapshotWarranty = parseWarrantyMonths((item.selectedOptions as any)?.warrantyMonths);
          const warrantyPeriodMonths = liveWarranty ?? snapshotWarranty ?? DEFAULT_WARRANTY_MONTHS;

          const expiryDate = new Date(startDate);
          expiryDate.setMonth(expiryDate.getMonth() + warrantyPeriodMonths);

          const isExpired = warrantyPeriodMonths <= 0 || now > expiryDate;
          const daysLeft = isExpired
            ? 0
            : Math.max(0, Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
          const totalDurationMs = expiryDate.getTime() - startMs;
          const elapsedMs = Math.max(0, now.getTime() - startMs);
          const progressPercent = totalDurationMs > 0
            ? Math.min(100, Math.max(0, Math.round((elapsedMs / totalDurationMs) * 100)))
            : 100;

          const coverageTerms = warrantyPeriodMonths > 0
            ? [
                `Bảo hành chính hãng ${warrantyPeriodMonths} tháng kể từ ngày giao hàng thành công theo chính sách riêng của sản phẩm.`,
                'Bảo hành kết cấu chịu lực, mối mọt, cong vênh, gãy sập khung sườn do lỗi kỹ thuật từ nhà sản xuất.',
                'Bảo hành bề mặt hoàn thiện, đệm mút, lò xo đàn hồi và phụ kiện cơ khí (ray trượt, bản lề giảm chấn) theo tiêu chuẩn DCor.',
                'Hỗ trợ tư vấn kỹ thuật và bảo dưỡng sản phẩm qua Hotline 1900 1234.'
              ]
            : [
                'Sản phẩm không áp dụng thời hạn bảo hành tiêu chuẩn theo cấu hình của cửa hàng.',
                'Quý khách vẫn được hỗ trợ tư vấn bảo dưỡng và sửa chữa dịch vụ qua Hotline 1900 1234.'
              ];

          const orderClaims = claimsByOrder.get(order.orderNumber) || [];
          const matchedClaims = orderClaims.filter(
            c =>
              (c.warrantyCode && c.warrantyCode === itemWarrantyCode) ||
              (c.productName && item.productName && c.productName.trim().toLowerCase() === item.productName.trim().toLowerCase())
          );

          warrantyItems.push({
            id: `WAR-${item.id}`,
            orderNumber: order.orderNumber,
            warrantyCode: itemWarrantyCode,
            productId: (item as any).productId || '',
            productName: item.productName,
            sku: item.sku || 'DCOR-' + (item.id || '').slice(0, 6).toUpperCase(),
            imageUrl: resolvedImageUrl,
            variantDescription: item.variantDescription,
            price: Number(item.price) || 0,
            quantity: item.quantity || 1,
            purchaseDate: order.createdAt,
            deliveredDate: startDate,
            warrantyPeriodMonths,
            expiryDate: expiryDate.toISOString(),
            isExpired,
            daysLeft,
            progressPercent,
            status: isExpired ? 'EXPIRED' : 'ACTIVE',
            statusLabel: warrantyPeriodMonths <= 0
              ? 'Không áp dụng bảo hành'
              : (isExpired ? 'Hết hạn bảo hành' : 'Còn hiệu lực bảo hành'),
            customerName: order.receiverName || 'Khách hàng',
            customerPhone: order.phone,
            customerAddress: customerAddress || 'Hồ Chí Minh, Việt Nam',
            coverageTerms,
            claims: matchedClaims
          });
        });
      });

      res.json(warrantyItems);
    } catch (error) {
      console.error('Lỗi getWarranties:', error);
      res.status(500).json({ message: 'Lỗi khi tải thông tin bảo hành.' });
    }
  },

  // 11. TẠO PHIẾU YÊU CẦU BẢO HÀNH (LƯU TRỰC TIẾP VÀO POSTGRESQL "WarrantyClaims")
  createWarrantyClaim: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      await ensureWarrantyClaimsTable();
      const customerId = req.user?.userId || null;
      const { orderNumber, productName, warrantyCode, issueDescription, claimType, evidenceImages } = req.body;

      if (!orderNumber || !productName || !issueDescription) {
        res.status(400).json({ message: 'Vui lòng cung cấp mã đơn hàng, tên sản phẩm và mô tả sự cố.' });
        return;
      }

      const order = await prisma.order.findFirst({
        where: customerId
          ? { orderNumber: String(orderNumber).trim(), customerId }
          : { orderNumber: String(orderNumber).trim() }
      });

      const claimId = `claim-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const claimCode = `CLM-${Date.now().toString().slice(-6)}`;
      const cleanClaimType = String(claimType || 'Tại nhà').trim();
      const cleanIssue = String(issueDescription).trim();
      const cleanImages = Array.isArray(evidenceImages) ? evidenceImages.filter(Boolean) : [];

      await prisma.$executeRawUnsafe(
        `INSERT INTO "WarrantyClaims" (
          id, claim_code, customer_id, order_id, order_number,
          product_name, warranty_code, claim_type, issue_description,
          evidence_images, status, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5,
          $6, $7, $8, $9,
          $10::jsonb, 'PENDING', NOW(), NOW()
        );`,
        claimId,
        claimCode,
        customerId,
        order?.id || null,
        String(orderNumber).trim(),
        String(productName).trim(),
        warrantyCode ? String(warrantyCode).trim() : null,
        cleanClaimType,
        cleanIssue,
        JSON.stringify(cleanImages)
      );

      if (order) {
        await prisma.orderStatusHistory.create({
          data: {
            orderId: order.id,
            status: order.status,
            actorType: 'CUSTOMER',
            notes: `[Yêu cầu bảo hành ${claimCode}] Sản phẩm: ${productName}. Loại: ${cleanClaimType}. Chi tiết: ${cleanIssue}. Ảnh: ${cleanImages.join(', ')}`
          }
        });
      }

      res.status(201).json({
        message: 'Gửi yêu cầu bảo hành thành công. Kỹ thuật viên Dcor sẽ liên hệ với bạn trong vòng 24 giờ.',
        claimId: claimCode,
        claim: {
          id: claimId,
          claimCode,
          orderNumber: String(orderNumber).trim(),
          productName: String(productName).trim(),
          warrantyCode: warrantyCode ? String(warrantyCode).trim() : null,
          claimType: cleanClaimType,
          issueDescription: cleanIssue,
          evidenceImages: cleanImages,
          status: 'PENDING',
          createdAt: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Lỗi createWarrantyClaim:', error);
      res.status(500).json({ message: 'Lỗi khi tạo yêu cầu bảo hành.' });
    }
  },

  // 12. DANH SÁCH LỊCH HẸN TƯ VẤN (ĐỒNG BỘ TRỰC TIẾP BẢNG "ShowroomConsultations")
  getAppointments: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      await ensureConsultationTable();
      const { customerId, phones, emails } = await resolveCustomerIdentifiers(req);

      if (phones.length === 0 && emails.length === 0) {
        res.json([]);
        return;
      }

      const conditions: string[] = [];
      const params: any[] = [];
      let pIdx = 1;

      if (phones.length > 0) {
        const phoneVariants = new Set<string>();
        for (const p of phones) {
          phoneVariants.add(p);
          if (p.startsWith('0')) phoneVariants.add('84' + p.slice(1));
        }
        conditions.push(`regexp_replace(COALESCE(customer_phone, ''), '[^0-9]', '', 'g') = ANY($${pIdx}::text[])`);
        params.push(Array.from(phoneVariants));
        pIdx++;
      }

      if (emails.length > 0) {
        conditions.push(`LOWER(COALESCE(customer_email, '')) = ANY($${pIdx}::text[])`);
        params.push(emails);
        pIdx++;
      }

      const rows: any[] = await prisma.$queryRawUnsafe(`
        SELECT *
        FROM "ShowroomConsultations"
        WHERE ${conditions.join(' OR ')}
        ORDER BY created_at DESC
        LIMIT 50;
      `, ...params);

      res.json(rows.map(r => mapConsultationRowToAppointment(r, customerId)));
    } catch (error) {
      console.error('Lỗi getAppointments:', error);
      res.status(500).json({ message: 'Lỗi khi lấy danh sách lịch hẹn.' });
    }
  },

  // 12.1. LẤY DANH SÁCH KHUNG GIỜ ĐÃ KÍN CHỖ (ĐỒNG BỘ THEO BẢNG "ShowroomConsultations" & "ShowroomSlotConfigs")
  getBookedAppointmentSlots: async (req: Request, res: Response): Promise<void> => {
    try {
      await ensureConsultationTable();
      const { date, showroomId } = req.query as {
        date?: string;
        showroomId?: string;
      };

      const dateStr = date ? String(date).trim() : '';
      let targetShowroomId = showroomId ? String(showroomId).trim() : '';

      if (!targetShowroomId) {
        const defaultSr = await prisma.warehouse.findFirst({
          where: { type: 'SHOWROOM', isActive: true },
          select: { id: true },
          orderBy: { name: 'asc' }
        });
        targetShowroomId = defaultSr?.id || 'sr-q1';
      }

      const { slots: configuredSlots, maintenanceDates } = await getShowroomSlotConfig(targetShowroomId);
      const bookedSlots: string[] = [];

      if (dateStr && maintenanceDates.includes(dateStr)) {
        res.json({
          bookedSlots: configuredSlots.map(s => s.time),
          isClosed: true,
          closureReason: 'Showroom tạm ngừng đón tiếp khách vào ngày này. Quý khách vui lòng chọn ngày hẹn khác.',
          slots: []
        });
        return;
      }

      const existingBookings: any[] = dateStr
        ? await prisma.$queryRawUnsafe(`
            SELECT preferred_time, COUNT(*)::int as booked_count
            FROM "ShowroomConsultations"
            WHERE showroom_id = $1
              AND preferred_date = $2
              AND status NOT IN ('CANCELLED', 'REJECTED')
            GROUP BY preferred_time;
          `, targetShowroomId, dateStr)
        : [];

      const bookingMap: Record<string, number> = {};
      for (const row of existingBookings) {
        bookingMap[row.preferred_time] = Number(row.booked_count);
      }

      const now = new Date();
      const todayStr = getLocalTodayStr();
      const currentH = now.getHours();
      const currentM = now.getMinutes();

      const slotDetails = configuredSlots.map(slot => {
        const booked = bookingMap[slot.time] || 0;
        const remaining = Math.max(0, slot.maxCapacity - booked);
        let isPastSlot = false;
        if (dateStr && dateStr < todayStr) {
          isPastSlot = true;
        } else if (dateStr && dateStr === todayStr) {
          const [startPart] = slot.time.split(' - ');
          if (startPart) {
            const [h, m] = startPart.split(':').map(Number);
            if (h < currentH || (h === currentH && m <= currentM)) {
              isPastSlot = true;
            }
          }
        }
        if (remaining === 0 || isPastSlot) {
          bookedSlots.push(slot.time);
        }
        return {
          time: slot.time,
          period: slot.period || 'Ca tư vấn',
          maxCapacity: slot.maxCapacity,
          bookedCount: booked,
          remainingSlots: remaining,
          isAvailable: remaining > 0 && !isPastSlot,
          isPastSlot,
          statusLabel: isPastSlot ? 'Đã qua giờ' : (remaining === 0 ? 'Hết chỗ' : `Còn ${remaining} slot trống`)
        };
      });

      res.json({
        bookedSlots,
        isClosed: false,
        closureReason: null,
        slots: slotDetails
      });
    } catch (error) {
      console.error('Lỗi getBookedAppointmentSlots:', error);
      res.status(500).json({ message: 'Lỗi khi kiểm tra khung giờ đã đặt.' });
    }
  },

  // 13. ĐẶT LỊCH HẸN TƯ VẤN (GHI TRỰC TIẾP VÀO BẢNG "ShowroomConsultations")
  createAppointment: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      await ensureConsultationTable();
      const customerId = req.user?.userId || 'guest';
      const { customerName, phone, email, showroomId, date, timeSlot, notes, productId, productName, variantId } = req.body;

      if (!customerName || !phone || !date || !timeSlot) {
        res.status(400).json({ message: 'Vui lòng cung cấp họ tên, số điện thoại, ngày hẹn và khung giờ tư vấn.' });
        return;
      }

      const cleanPhone = normalizePhone(String(phone));
      const phoneRegex = /^(0)(3[2-9]|5[2689]|7[06-9]|8[1-9]|9[0-9])[0-9]{7}$/;
      if (!phoneRegex.test(cleanPhone)) {
        res.status(400).json({ message: 'Số điện thoại không đúng định dạng di động Việt Nam (10 chữ số).' });
        return;
      }

      const dateStr = String(date).trim();
      const timeStr = String(timeSlot).trim();
      const now = new Date();
      const todayStr = getLocalTodayStr();

      if (dateStr < todayStr) {
        res.status(400).json({ message: 'Không thể đặt lịch hẹn vào ngày trong quá khứ.' });
        return;
      }
      if (dateStr === todayStr) {
        const [startPart] = timeStr.split(' - ');
        if (startPart) {
          const [h, m] = startPart.split(':').map(Number);
          if (h < now.getHours() || (h === now.getHours() && m <= now.getMinutes())) {
            res.status(400).json({ message: `Khung giờ ${timeStr} hôm nay đã trôi qua. Vui lòng chọn khung giờ khác hoặc ngày tiếp theo.` });
            return;
          }
        }
      }

      let showroom = showroomId
        ? await prisma.warehouse.findUnique({ where: { id: String(showroomId) } })
        : null;
      if (!showroom) {
        showroom = await prisma.warehouse.findFirst({
          where: { type: 'SHOWROOM', isActive: true },
          orderBy: { name: 'asc' }
        });
      }

      const targetShowroomId = showroom?.id || 'sr-q1';
      const showroomName = showroom?.name || 'Showroom DCOR Studio';
      const showroomAddress = showroom?.address || '128 Hai Bà Trưng, P. Đa Kao, Quận 1, TP.HCM';

      const { slots: configuredSlots, maintenanceDates } = await getShowroomSlotConfig(targetShowroomId);
      if (maintenanceDates.includes(dateStr)) {
        res.status(400).json({ message: 'Showroom tạm ngừng đón tiếp khách vào ngày này. Quý khách vui lòng chọn ngày hẹn khác.' });
        return;
      }

      const existingCountResult: any[] = await prisma.$queryRawUnsafe(`
        SELECT COUNT(*)::int as count
        FROM "ShowroomConsultations"
        WHERE showroom_id = $1
          AND preferred_date = $2
          AND preferred_time = $3
          AND status NOT IN ('CANCELLED', 'REJECTED');
      `, targetShowroomId, dateStr, timeStr);

      const matchedSlot = configuredSlots.find(s => s.time === timeStr);
      const maxCap = matchedSlot ? matchedSlot.maxCapacity : 3;
      if (Number(existingCountResult[0]?.count || 0) >= maxCap) {
        res.status(409).json({
          message: `Khung giờ ${timeStr} ngày ${dateStr} tại ${showroomName} đã kín chỗ. Quý khách vui lòng chọn khung giờ khác.`
        });
        return;
      }

      const datePart = todayStr.replace(/-/g, '');
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const appointmentCode = `REQ-${datePart}-${randomSuffix}`;
      const id = `consult-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      const initialHistory = JSON.stringify([
        {
          action: 'CREATED',
          title: 'Khách hàng gửi yêu cầu đặt lịch từ trang Tài khoản',
          timestamp: now.toISOString(),
          actor: String(customerName).trim(),
          note: notes ? String(notes).trim() : 'Yêu cầu chờ ban quản trị phân công nhân sự và phê duyệt'
        }
      ]);

      await prisma.$executeRawUnsafe(`
        INSERT INTO "ShowroomConsultations" (
          id, appointment_code, showroom_id, showroom_name, showroom_address,
          customer_name, customer_phone, customer_email, preferred_date, preferred_time,
          notes, product_id, product_name, variant_id, status, history, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5,
          $6, $7, $8, $9, $10,
          $11, $12, $13, $14, 'PENDING', $15::jsonb, NOW(), NOW()
        );
      `,
        id,
        appointmentCode,
        targetShowroomId,
        showroomName,
        showroomAddress,
        String(customerName).trim(),
        cleanPhone,
        email ? String(email).trim() : (req.user?.email || null),
        dateStr,
        timeStr,
        notes ? String(notes).trim() : null,
        productId ? String(productId) : null,
        productName ? String(productName) : null,
        variantId ? String(variantId) : null,
        initialHistory
      );

      memoryCache.invalidatePrefix(CACHE_KEYS.CONSULTATIONS_ADMIN_PREFIX);
      memoryCache.invalidatePrefix('showroom_slots_');
      notifyAdminPendingConsultations().catch(() => {});

      const createdRows: any[] = await prisma.$queryRawUnsafe(`
        SELECT * FROM "ShowroomConsultations" WHERE id = $1 LIMIT 1;
      `, id);

      res.status(201).json({
        message: 'Đặt lịch hẹn tư vấn thành công. Chuyên viên DCor sẽ liên hệ xác nhận với bạn sớm nhất.',
        appointment: createdRows[0] ? mapConsultationRowToAppointment(createdRows[0], customerId) : null
      });
    } catch (error) {
      console.error('Lỗi createAppointment:', error);
      res.status(500).json({ message: 'Lỗi khi tạo lịch hẹn.' });
    }
  },

  // 14. HỦY LỊCH HẸN (CẬP NHẬT TRỰC TIẾP BẢNG "ShowroomConsultations" - Chỉ khi PENDING)
  cancelAppointment: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      await ensureConsultationTable();
      const id = String(req.params.id);
      const reason = req.body?.reason ? String(req.body.reason).trim() : 'Khách hàng chủ động hủy lịch hẹn';

      const rows: any[] = await prisma.$queryRawUnsafe(`
        SELECT * FROM "ShowroomConsultations" WHERE id = $1 OR appointment_code = $1 LIMIT 1;
      `, id);

      if (!rows || rows.length === 0) {
        res.status(404).json({ message: 'Không tìm thấy lịch hẹn.' });
        return;
      }

      const appt = rows[0];
      const identifiers = await resolveCustomerIdentifiers(req);
      if (!isAppointmentOwnedByCaller(appt, identifiers)) {
        res.status(403).json({ message: 'Bạn không có quyền hủy lịch hẹn này.' });
        return;
      }
      if (appt.status === 'CANCELLED') {
        res.status(400).json({ message: 'Lịch hẹn này đã bị hủy trước đó.' });
        return;
      }
      if (appt.status !== 'PENDING') {
        res.status(400).json({
          message: 'Lịch hẹn đã được xử lý hoặc xác nhận. Quý khách vui lòng liên hệ Hotline 1900 1234 để được hỗ trợ điều chỉnh hoặc hủy hẹn.'
        });
        return;
      }

      const existingHistory = Array.isArray(appt.history) ? appt.history : [];
      const updatedHistory = [
        ...existingHistory,
        {
          action: 'CANCELLED',
          title: 'Khách hàng hủy lịch hẹn trực tuyến',
          timestamp: new Date().toISOString(),
          actor: appt.customer_name || 'Khách hàng',
          reason
        }
      ];

      await prisma.$executeRawUnsafe(`
        UPDATE "ShowroomConsultations"
        SET status = 'CANCELLED',
            cancellation_reason = $1,
            history = $2::jsonb,
            updated_at = NOW()
        WHERE id = $3;
      `, reason, JSON.stringify(updatedHistory), appt.id);

      memoryCache.invalidatePrefix(CACHE_KEYS.CONSULTATIONS_ADMIN_PREFIX);
      memoryCache.invalidatePrefix('showroom_slots_');
      notifyAdminPendingConsultations().catch(() => {});

      const updatedRows: any[] = await prisma.$queryRawUnsafe(`
        SELECT * FROM "ShowroomConsultations" WHERE id = $1 LIMIT 1;
      `, appt.id);

      res.json({
        message: 'Hủy lịch hẹn thành công.',
        appointment: updatedRows[0] ? mapConsultationRowToAppointment(updatedRows[0], req.user?.userId || 'guest') : null
      });
    } catch (error) {
      console.error('Lỗi cancelAppointment:', error);
      res.status(500).json({ message: 'Lỗi khi hủy lịch hẹn.' });
    }
  },

  // 14.1. ĐỔI GIỜ LỊCH HẸN (CẬP NHẬT TRỰC TIẾP BẢNG "ShowroomConsultations" - Chỉ khi PENDING)
  rescheduleAppointment: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      await ensureConsultationTable();
      const id = String(req.params.id);
      const { date, timeSlot, notes } = req.body;

      if (!date || !timeSlot) {
        res.status(400).json({ message: 'Vui lòng chọn ngày và khung giờ mới.' });
        return;
      }

      const rows: any[] = await prisma.$queryRawUnsafe(`
        SELECT * FROM "ShowroomConsultations" WHERE id = $1 OR appointment_code = $1 LIMIT 1;
      `, id);

      if (!rows || rows.length === 0) {
        res.status(404).json({ message: 'Không tìm thấy lịch hẹn.' });
        return;
      }

      const appt = rows[0];
      const identifiers = await resolveCustomerIdentifiers(req);
      if (!isAppointmentOwnedByCaller(appt, identifiers)) {
        res.status(403).json({ message: 'Bạn không có quyền thay đổi lịch hẹn này.' });
        return;
      }
      if (appt.status !== 'PENDING') {
        res.status(400).json({
          message: 'Lịch hẹn đã được duyệt hoặc không ở trạng thái Chờ xác nhận. Quý khách vui lòng liên hệ Hotline 1900 1234 nếu cần đổi thời gian.'
        });
        return;
      }

      const dateStr = String(date).trim();
      const timeStr = String(timeSlot).trim();
      const now = new Date();
      const todayStr = getLocalTodayStr();

      if (dateStr < todayStr) {
        res.status(400).json({ message: 'Không thể dời lịch hẹn về ngày trong quá khứ.' });
        return;
      }
      if (dateStr === todayStr) {
        const [startPart] = timeStr.split(' - ');
        if (startPart) {
          const [h, m] = startPart.split(':').map(Number);
          if (h < now.getHours() || (h === now.getHours() && m <= now.getMinutes())) {
            res.status(400).json({
              message: `Khung giờ ${timeStr} hôm nay đã trôi qua. Vui lòng chọn khung giờ khác hoặc ngày tiếp theo.`
            });
            return;
          }
        }
      }

      const { slots: configuredSlots, maintenanceDates } = await getShowroomSlotConfig(appt.showroom_id);
      if (maintenanceDates.includes(dateStr)) {
        res.status(400).json({ message: 'Showroom tạm ngừng đón tiếp khách vào ngày này. Vui lòng chọn ngày khác.' });
        return;
      }

      const existingCountResult: any[] = await prisma.$queryRawUnsafe(`
        SELECT COUNT(*)::int as count
        FROM "ShowroomConsultations"
        WHERE showroom_id = $1
          AND preferred_date = $2
          AND preferred_time = $3
          AND id <> $4
          AND status NOT IN ('CANCELLED', 'REJECTED');
      `, appt.showroom_id, dateStr, timeStr, appt.id);

      const matchedSlot = configuredSlots.find(s => s.time === timeStr);
      const maxCap = matchedSlot ? matchedSlot.maxCapacity : 3;
      if (Number(existingCountResult[0]?.count || 0) >= maxCap) {
        res.status(409).json({
          message: `Khung giờ ${timeStr} ngày ${dateStr} tại ${appt.showroom_name || 'Showroom'} đã kín chỗ. Vui lòng chọn khung giờ khác.`
        });
        return;
      }

      const existingHistory = Array.isArray(appt.history) ? appt.history : [];
      const updatedHistory = [
        ...existingHistory,
        {
          action: 'RESCHEDULED',
          title: 'Khách hàng thay đổi thời gian hẹn',
          timestamp: now.toISOString(),
          actor: appt.customer_name || 'Khách hàng',
          note: `Dời từ ${appt.preferred_date} (${appt.preferred_time}) sang ${dateStr} (${timeStr})`
        }
      ];

      await prisma.$executeRawUnsafe(`
        UPDATE "ShowroomConsultations"
        SET preferred_date = $1,
            preferred_time = $2,
            notes = COALESCE($3, notes),
            history = $4::jsonb,
            updated_at = NOW()
        WHERE id = $5;
      `, dateStr, timeStr, notes !== undefined ? String(notes).trim() : null, JSON.stringify(updatedHistory), appt.id);

      memoryCache.invalidatePrefix(CACHE_KEYS.CONSULTATIONS_ADMIN_PREFIX);
      memoryCache.invalidatePrefix('showroom_slots_');
      notifyAdminPendingConsultations().catch(() => {});

      const updatedRows: any[] = await prisma.$queryRawUnsafe(`
        SELECT * FROM "ShowroomConsultations" WHERE id = $1 LIMIT 1;
      `, appt.id);

      res.json({
        message: 'Đổi giờ lịch hẹn thành công. Hệ thống đã cập nhật thời gian mới.',
        appointment: updatedRows[0] ? mapConsultationRowToAppointment(updatedRows[0], req.user?.userId || 'guest') : null
      });
    } catch (error) {
      console.error('Lỗi rescheduleAppointment:', error);
      res.status(500).json({ message: 'Lỗi khi đổi giờ lịch hẹn.' });
    }
  },

  // ==========================================
  // ĐỔI TRẢ / HOÀN TIỀN (RETURNS & REFUNDS)
  // ==========================================

  // 15. DANH SÁCH YÊU CẦU ĐỔI TRẢ
  getReturns: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const customerId = req.user?.userId;
      const customerPhone = req.user?.phone || (req.headers['x-guest-phone'] as string);
      if (!customerId && !customerPhone) {
        res.status(401).json({ message: 'Vui lòng đăng nhập hoặc xác thực số điện thoại để tiếp tục.' });
        return;
      }

      const orConditions: any[] = [];
      if (customerId) orConditions.push({ customerId });
      if (customerPhone) orConditions.push({ phone: customerPhone.trim() });

      // Lấy từ inMemoryReturns
      const list = inMemoryReturns.filter(r => (customerId && r.customerId === customerId));

      // Lấy dữ liệu đổi trả thực tế từ bảng OrderReturn (PostgreSQL)
      try {
        const condParts: string[] = [];
        if (customerId) condParts.push(`r."customerId" = '${customerId.replace(/'/g, "''")}'`);
        if (customerPhone) condParts.push(`r."customerPhone" = '${customerPhone.trim().replace(/'/g, "''")}'`);

        if (condParts.length > 0) {
          const dbReturns: any[] = await prisma.$queryRawUnsafe(`
            SELECT r.*,
                   COALESCE(
                     json_agg(
                       json_build_object(
                         'id', i.id,
                         'orderItemId', i."orderItemId",
                         'productId', i."productId",
                         'productName', i."productName",
                         'productSku', i."productSku",
                         'variantName', i."variantName",
                         'quantity', i.quantity,
                         'unitPrice', i."unitPrice",
                         'totalPrice', i."totalPrice",
                         'productImage', i."productImage"
                       )
                     ) FILTER (WHERE i.id IS NOT NULL), '[]'
                   ) as items
            FROM "OrderReturn" r
            LEFT JOIN "OrderReturnItem" i ON r.id = i."returnId"
            WHERE ${condParts.join(' OR ')}
            GROUP BY r.id
            ORDER BY r."createdAt" DESC
          `);

          const statusLabelsMap: Record<string, string> = {
            'PENDING': 'Chờ duyệt',
            'APPROVED': 'Đã duyệt (Gửi hàng về)',
            'RETURNING': 'Đang gửi hàng về DCOR',
            'RECEIVED': 'DCOR đã nhận & Đang QC',
            'EXCHANGING': 'Đang chuẩn bị hàng mới',
            'REFUNDING': 'Đang hoàn tiền',
            'COMPLETED': 'Hoàn tất đổi trả',
            'REJECTED': 'Đã từ chối'
          };

          for (const row of dbReturns) {
            const item = (row.items && row.items.length > 0) ? row.items[0] : null;
            let parsedImages: string[] = [];
            if (Array.isArray(row.proofImages)) {
              parsedImages = row.proofImages;
            } else if (typeof row.proofImages === 'string') {
              try { parsedImages = JSON.parse(row.proofImages); } catch (_) { parsedImages = [row.proofImages]; }
            }

            list.unshift({
              id: row.returnCode || row.id,
              returnCode: row.returnCode || row.id,
              returnType: row.returnType || 'EXCHANGE',
              customerId: row.customerId || customerId || 'guest',
              orderNumber: row.orderNumber,
              productName: item?.productName || 'Sản phẩm đổi trả DCor',
              sku: item?.productSku || '',
              imageUrl: item?.productImage || '',
              variantDescription: item?.variantName || '',
              quantity: item?.quantity || 1,
              price: Number(item?.unitPrice || 0),
              reason: row.reason || 'Sản phẩm lỗi kỹ thuật',
              description: row.detailedReason || '',
              images: parsedImages,
              status: row.status,
              statusLabel: statusLabelsMap[row.status] || row.status,
              refundAmount: Number(row.refundAmount || 0),
              createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : new Date().toISOString(),
              updatedAt: row.updatedAt ? new Date(row.updatedAt).toISOString() : new Date().toISOString()
            });
          }
        }
      } catch (dbErr: any) {
        // Nếu bảng OrderReturn chưa tồn tại trong PostgreSQL, kích hoạt khởi tạo ngầm an toàn và không làm gián đoạn request
        if (dbErr?.code === 'P2010' && (dbErr?.meta?.code === '42P01' || String(dbErr?.message).includes('42P01') || String(dbErr?.message).includes('does not exist'))) {
          import('../lib/init-order-returns-db').then(m => m.initOrderReturnDatabase()).catch(() => {});
        } else {
          console.warn('Lỗi đọc bảng OrderReturn:', dbErr?.message || dbErr);
        }
      }

      // Đồng thời tìm trong database các đơn có status RETURNED hoặc lịch sử đổi trả
      const returnedOrders = await prisma.order.findMany({
        where: {
          OR: orConditions,
          status: { in: ['RETURNED'] }
        },
        include: { items: true, statusHistory: true }
      });

      const statusLabels: Record<string, string> = {
        'PENDING': 'Chờ duyệt',
        'PROCESSING': 'Đang xử lý (Gửi hàng về)',
        'PREPARING': 'Đang chuẩn bị hàng mới',
        'SHIPPED': 'Đang giao hàng',
        'COMPLETED': 'Hoàn tất đổi trả',
        'REJECTED': 'Đã từ chối'
      };

      for (const order of returnedOrders) {
        if (!list.some(r => r.orderNumber === order.orderNumber)) {
          const firstItem = order.items[0];
          const returnHistory = order.statusHistory.find((h: any) => h.notes?.includes('[Yêu cầu đổi trả]'));
          
          let parsedReason = 'Sản phẩm lỗi kỹ thuật do nhà sản xuất';
          let parsedDesc = '';
          let parsedImages: string[] = [];

          if (returnHistory?.notes) {
            const notes = returnHistory.notes;
            const reasonMatch = notes.match(/Lý do:\s*([^.\n]+)/);
            if (reasonMatch && reasonMatch[1]) {
              parsedReason = reasonMatch[1].trim();
            }
            const descMatch = notes.match(/Chi tiết:\s*([^.\n]+)/);
            if (descMatch && descMatch[1] && descMatch[1].trim() !== 'Không có mô tả') {
              parsedDesc = descMatch[1].trim();
            }
            const imgMatch = notes.match(/Ảnh đính kèm:\s*(.*)/);
            if (imgMatch && imgMatch[1]) {
              parsedImages = imgMatch[1].split(',').map((s: string) => s.trim()).filter(Boolean);
            }
          }

          // Kiểm tra xem đơn hàng đã được cập nhật trạng thái đổi trả mới nhất chưa
          const updateHistories = order.statusHistory.filter((h: any) => h.notes?.includes('[Cập nhật đổi trả] Trạng thái:'));
          let currentStatus: any = 'PENDING';
          if (updateHistories.length > 0) {
            const latestHistory = updateHistories[updateHistories.length - 1];
            const statusMatch = latestHistory.notes ? latestHistory.notes.match(/Trạng thái:\s*([A-Z_]+)/) : null;
            if (statusMatch && statusMatch[1]) {
              currentStatus = statusMatch[1];
            }
          }

          const returnItem: CustomerReturnRequest = {
            id: `RET-${order.orderNumber.replace('ORD-', '')}`,
            customerId: customerId || order.customerId || 'guest',
            orderNumber: order.orderNumber,
            productName: firstItem ? firstItem.productName : 'Sản phẩm trong đơn',
            sku: firstItem?.sku || '',
            imageUrl: firstItem?.imageUrl || '',
            variantDescription: firstItem?.variantDescription || '',
            quantity: firstItem?.quantity || 1,
            price: firstItem ? Number(firstItem.price) : Number(order.totalAmount),
            reason: parsedReason,
            description: parsedDesc,
            images: parsedImages,
            status: currentStatus,
            statusLabel: statusLabels[currentStatus] || currentStatus,
            refundAmount: Number(order.totalAmount),
            createdAt: order.updatedAt.toISOString(),
            updatedAt: order.updatedAt.toISOString()
          };

          list.push(returnItem);

          // Đồng bộ luôn vào inMemoryReturns để đảm bảo updateReturnStatus luôn tìm thấy
          const memIdx = inMemoryReturns.findIndex(r => r.id === returnItem.id || r.orderNumber === returnItem.orderNumber);
          if (memIdx >= 0) {
            inMemoryReturns[memIdx] = returnItem;
          } else {
            inMemoryReturns.push(returnItem);
          }
        }
      }

      res.json(list);
    } catch (error) {
      console.error('Lỗi getReturns:', error);
      res.status(500).json({ message: 'Lỗi khi lấy danh sách đổi trả.' });
    }
  },

  // 16. TẠO YÊU CẦU ĐỔI TRẢ MỚI
  createReturn: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const customerId = req.user?.userId;
      if (!customerId) {
        res.status(401).json({ message: 'Vui lòng đăng nhập để tiếp tục.' });
        return;
      }

      const { orderNumber, productName, sku, imageUrl, reason, description, images } = req.body;

      if (!orderNumber || !reason) {
        res.status(400).json({ message: 'Vui lòng cung cấp mã đơn hàng và lý do đổi trả.' });
        return;
      }

      const newReturn: CustomerReturnRequest = {
        id: `RET-${Date.now().toString().slice(-6)}`,
        customerId,
        orderNumber: orderNumber.trim(),
        productName: productName || 'Sản phẩm nội thất',
        sku: sku || '',
        imageUrl: imageUrl || '',
        reason: reason.trim(),
        description: description ? description.trim() : '',
        images: Array.isArray(images) ? images : [],
        status: 'PENDING',
        statusLabel: 'Chờ duyệt',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      inMemoryReturns.unshift(newReturn);

      // Cập nhật trạng thái đơn hàng nếu tìm thấy trong DB
      const order = await prisma.order.findFirst({
        where: { orderNumber, customerId },
        include: { items: true }
      });

      if (order) {
        await prisma.orderStatusHistory.create({
          data: {
            orderId: order.id,
            status: order.status,
            actorType: 'CUSTOMER',
            notes: `[Tạo yêu cầu đổi trả ${newReturn.id}] Lý do: ${reason}. Mô tả: ${description || ''}`
          }
        });

        // Lưu đồng bộ trực tiếp vào bảng OrderReturn và OrderReturnItem trong PostgreSQL
        try {
          const retCode = `RMA-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${order.orderNumber.replace(/[^0-9]/g, '').slice(-4) || '1001'}`;
          const retId = `ret_${Date.now()}`;
          const customerName = (order as any).receiverName || (order as any).customerName || 'Khách hàng';
          const customerPhone = order.phone || (order as any).receiverPhone || '';
          const customerEmail = order.email || '';
          const customerAddress = (order as any).detailAddress || (order as any).shippingAddress || '';
          const firstItem = order.items && order.items.length > 0 ? order.items[0] : null;

          await prisma.$executeRawUnsafe(`
            INSERT INTO "OrderReturn" (
              "id", "returnCode", "orderId", "orderNumber", "customerId", "customerName", "customerPhone",
              "customerEmail", "customerAddress", "returnType", "status", "reason", "detailedReason",
              "proofImages", "refundAmount", "createdAt", "updatedAt"
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7,
              $8, $9, 'REFUND', 'PENDING', $10, $11,
              $12::jsonb, $13, NOW(), NOW()
            ) ON CONFLICT DO NOTHING;
          `,
            retId, retCode, order.id, order.orderNumber, customerId, customerName, customerPhone,
            customerEmail, customerAddress, reason, description || '',
            JSON.stringify(Array.isArray(images) ? images : []), Number(order.totalAmount || 0)
          );

          if (firstItem) {
            await prisma.$executeRawUnsafe(`
              INSERT INTO "OrderReturnItem" (
                "id", "returnId", "orderItemId", "productId", "productName", "productSku",
                "variantName", "quantity", "unitPrice", "totalPrice", "productImage", "createdAt"
              ) VALUES (
                $1, $2, $3, $4, $5, $6,
                $7, $8, $9, $10, $11, NOW()
              ) ON CONFLICT DO NOTHING;
            `,
              `ret_item_${Date.now()}`, retId, firstItem.id, firstItem.productId,
              productName || firstItem.productName, sku || firstItem.sku || null, firstItem.variantDescription || null,
              1, Number(firstItem.price || 0), Number(firstItem.price || 0), imageUrl || firstItem.imageUrl || null
            );
          }
        } catch (dbErr) {
          console.warn('Lỗi ghi OrderReturn vào DB từ customerController.createReturn:', dbErr);
        }
      }

      res.status(201).json({
        message: 'Gửi yêu cầu đổi trả thành công. Chuyên viên chăm sóc khách hàng Dcor sẽ thẩm định trong vòng 24h làm việc.',
        returnRequest: newReturn
      });
    } catch (error) {
      console.error('Lỗi createReturn:', error);
      res.status(500).json({ message: 'Lỗi khi gửi yêu cầu đổi trả.' });
    }
  },

  // 16.1. CẬP NHẬT TRẠNG THÁI YÊU CẦU ĐỔI TRẢ (ADMIN & TEST TRỰC TIẾP)
  updateReturnStatus: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const rawId = String(req.params.id).trim();
      const { status, notes } = req.body;

      // Tìm trong inMemoryReturns trước
      let ret = inMemoryReturns.find(r => 
        r.id === rawId || 
        r.orderNumber === rawId || 
        r.id === `RET-${rawId}` || 
        rawId.endsWith(r.orderNumber)
      );

      // Nếu chưa có trong RAM, tự động tìm đơn hàng trong DB
      const cleanOrderNumber = rawId.replace(/^RET-/, '');
      const dbOrder = await prisma.order.findFirst({
        where: {
          OR: [
            { orderNumber: rawId },
            { orderNumber: cleanOrderNumber },
            { orderNumber: `DC-${cleanOrderNumber}` },
            { orderNumber: cleanOrderNumber.replace(/^DC-/, '') }
          ]
        },
        include: { items: true, statusHistory: true }
      });

      if (!ret && dbOrder) {
        const firstItem = dbOrder.items[0];
        ret = {
          id: `RET-${dbOrder.orderNumber.replace('ORD-', '')}`,
          customerId: dbOrder.customerId || 'guest',
          orderNumber: dbOrder.orderNumber,
          productName: firstItem ? firstItem.productName : 'Sản phẩm nội thất',
          sku: firstItem?.sku || '',
          imageUrl: firstItem?.imageUrl || '',
          variantDescription: firstItem?.variantDescription || '',
          quantity: firstItem?.quantity || 1,
          price: firstItem ? Number(firstItem.price) : Number(dbOrder.totalAmount),
          reason: 'Sản phẩm lỗi kỹ thuật do nhà sản xuất',
          description: '',
          images: [],
          status: 'PENDING',
          statusLabel: 'Chờ duyệt',
          refundAmount: Number(dbOrder.totalAmount),
          createdAt: dbOrder.updatedAt.toISOString(),
          updatedAt: dbOrder.updatedAt.toISOString()
        };
        inMemoryReturns.push(ret);
      }

      if (!ret) {
        res.status(404).json({ message: `Không tìm thấy yêu cầu đổi trả cho mã "${rawId}".` });
        return;
      }

      ret.status = status;
      ret.updatedAt = new Date().toISOString();
      switch (status) {
        case 'PENDING': ret.statusLabel = 'Chờ duyệt'; break;
        case 'PROCESSING': ret.statusLabel = 'Đang xử lý (Gửi hàng về)'; break;
        case 'PREPARING': ret.statusLabel = 'Đang chuẩn bị hàng mới'; break;
        case 'SHIPPED': ret.statusLabel = 'Đang giao hàng'; break;
        case 'COMPLETED': ret.statusLabel = 'Hoàn tất đổi trả'; break;
        case 'REJECTED': ret.statusLabel = 'Đã từ chối'; break;
        default: ret.statusLabel = status;
      }

      if (notes) {
        ret.description = (ret.description ? ret.description + '\n' : '') + `[Cập nhật ${ret.statusLabel}]: ${notes}`;
      }

      // Lưu lịch sử biến động vào cơ sở dữ liệu để đồng bộ vĩnh viễn
      if (dbOrder) {
        await prisma.orderStatusHistory.create({
          data: {
            orderId: dbOrder.id,
            status: 'RETURNED',
            actorType: 'STAFF',
            notes: `[Cập nhật đổi trả] Trạng thái: ${status}. Ghi chú: ${notes || 'Chuyển trạng thái qua thanh test'}`
          }
        });
      }

      res.json({ message: `Đã chuyển trạng thái sang "${ret.statusLabel}" thành công.`, returnRequest: ret });
    } catch (error) {
      console.error('Lỗi updateReturnStatus:', error);
      res.status(500).json({ message: 'Lỗi khi cập nhật trạng thái đổi trả.' });
    }
  },

  // ==========================================
  // THÔNG BÁO CÁ NHÂN (NOTIFICATIONS)
  // ==========================================

  // 17. LẤY DANH SÁCH THÔNG BÁO THỰC TẾ
  getNotifications: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const customerId = req.user?.userId;
      if (!customerId) {
        res.status(401).json({ message: 'Vui lòng đăng nhập để tiếp tục.' });
        return;
      }

      await ensureNotificationReadsTable();
      const readRows: any[] = await prisma.$queryRawUnsafe<any[]>(
        `SELECT notification_id FROM "CustomerNotificationReads" WHERE customer_id = $1;`,
        customerId
      ).catch(() => []);
      const customerReadSet = new Set<string>(readRows.map(r => String(r.notification_id)));

      const notifications: any[] = [];

      // 1. Thông báo từ các đơn hàng gần đây
      const orders = await prisma.order.findMany({
        where: { customerId },
        orderBy: { updatedAt: 'desc' },
        take: 10
      });

      orders.forEach(order => {
        let title = `Đơn hàng #${order.orderNumber}`;
        let message = `Đơn hàng của bạn đang ở trạng thái: ${order.status}`;
        let type = 'ORDER';

        switch (order.status) {
          case 'PENDING':
            message = `Đơn hàng #${order.orderNumber} đã được ghi nhận. Vui lòng hoàn tất thanh toán hoặc chờ nhân viên Dcor gọi xác nhận.`;
            break;
          case 'CONFIRMED':
            message = `Đơn hàng #${order.orderNumber} đã được xác nhận thành công và đang chuyển sang xưởng gia công.`;
            break;
          case 'PROCESSING':
            message = `Đơn hàng #${order.orderNumber} đang trong quá trình gia công đóng gói hoàn thiện.`;
            break;
          case 'SHIPPED':
            message = `Đơn hàng #${order.orderNumber} đang trên đường giao đến bạn bởi đội ngũ vận chuyển chuyên nghiệp Dcor.`;
            break;
          case 'DELIVERED':
            message = `Đơn hàng #${order.orderNumber} đã được giao thành công. Vui lòng kiểm tra và gửi đánh giá để nhận 100 điểm thưởng!`;
            break;
          case 'CANCELLED':
            message = `Đơn hàng #${order.orderNumber} đã bị hủy. Nếu có thắc mắc xin vui lòng liên hệ hotline 1900 1234.`;
            break;
          case 'RETURNED':
            message = `Yêu cầu đổi trả cho đơn hàng #${order.orderNumber} đang được bộ phận kỹ thuật xử lý.`;
            break;
        }

        const notifId = `notif-order-${order.id}-${order.status}`;
        notifications.push({
          id: notifId,
          title,
          message,
          type,
          isRead: customerReadSet.has(notifId),
          link: `/account/orders?orderNumber=${order.orderNumber}`,
          createdAt: order.updatedAt.toISOString()
        });
      });

      // 2. Thông báo từ lịch hẹn tư vấn (từ bảng PostgreSQL "ShowroomConsultations")
      try {
        await ensureConsultationTable();
        const { phones, emails } = await resolveCustomerIdentifiers(req);
        if (phones.length > 0 || emails.length > 0) {
          const conds: string[] = [];
          const qParams: any[] = [];
          let idx = 1;
          if (phones.length > 0) {
            const pVariants = new Set<string>();
            for (const p of phones) {
              pVariants.add(p);
              if (p.startsWith('0')) pVariants.add('84' + p.slice(1));
            }
            conds.push(`regexp_replace(COALESCE(customer_phone, ''), '[^0-9]', '', 'g') = ANY($${idx}::text[])`);
            qParams.push(Array.from(pVariants));
            idx++;
          }
          if (emails.length > 0) {
            conds.push(`LOWER(COALESCE(customer_email, '')) = ANY($${idx}::text[])`);
            qParams.push(emails);
            idx++;
          }
          const consultRows: any[] = await prisma.$queryRawUnsafe(`
            SELECT id, appointment_code, showroom_name, preferred_date, preferred_time, status, created_at, updated_at
            FROM "ShowroomConsultations"
            WHERE ${conds.join(' OR ')}
            ORDER BY updated_at DESC
            LIMIT 10;
          `, ...qParams);

          const statusMap: Record<string, string> = {
            PENDING: 'Chờ xác nhận',
            CONFIRMED: 'Đã xác nhận',
            IN_PROGRESS: 'Đang tư vấn',
            COMPLETED: 'Đã hoàn tất',
            REJECTED: 'Đã từ chối',
            CANCELLED: 'Đã hủy'
          };

          consultRows.forEach(row => {
            const code = row.appointment_code || row.id;
            const notifId = `notif-apt-${row.id}-${row.status}`;
            notifications.push({
              id: notifId,
              title: `Lịch hẹn tư vấn #${code}`,
              message: `Lịch hẹn tại ${row.showroom_name || 'Showroom DCor'} vào ${row.preferred_date} (${row.preferred_time}) hiện ở trạng thái: ${statusMap[row.status] || row.status}.`,
              type: 'APPOINTMENT',
              isRead: customerReadSet.has(notifId),
              link: '/account/appointments',
              createdAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString()
            });
          });
        }
      } catch (consultNotifErr) {
        console.warn('Không thể tải thông báo lịch hẹn:', consultNotifErr);
      }

      // 3. Thông báo đổi trả
      const returns = inMemoryReturns.filter(r => r.customerId === customerId);
      returns.forEach(ret => {
        const notifId = `notif-ret-${ret.id}-${ret.status}`;
        notifications.push({
          id: notifId,
          title: `Yêu cầu đổi trả #${ret.id}`,
          message: `Yêu cầu đổi trả cho đơn hàng ${ret.orderNumber} hiện tại: ${ret.statusLabel}.`,
          type: 'RETURN',
          isRead: customerReadSet.has(notifId),
          link: '/account/returns',
          createdAt: ret.updatedAt
        });
      });

      // 4. Ưu đãi khuyến mãi từ voucher hệ thống
      try {
        const vouchers = await (prisma as any).voucher?.findMany({
          where: { isActive: true },
          take: 3,
          orderBy: { createdAt: 'desc' }
        }) || [];
        vouchers.forEach((v: any) => {
          const notifId = `notif-voucher-${v.id}`;
          notifications.push({
            id: notifId,
            title: `Mã ưu đãi mới: ${v.code}`,
            message: `Nhận ngay ưu đãi khi mua sắm tại DCor với mã ${v.code}. Khám phá bộ sưu tập ngay!`,
            type: 'PROMO',
            isRead: customerReadSet.has(notifId),
            link: '/explore',
            createdAt: v.createdAt.toISOString()
          });
        });
      } catch (e) {}

      // 5. Thông báo chào mừng thành viên
      const welcomeId = `notif-welcome-${customerId}`;
      notifications.push({
        id: welcomeId,
        title: 'Chào mừng bạn đến với DCor Furniture!',
        message: 'Cảm ơn bạn đã lựa chọn DCor. Trải nghiệm không gian sống đẳng cấp cùng các sản phẩm nội thất tinh tế.',
        type: 'PROMO',
        isRead: customerReadSet.has(welcomeId),
        link: '/explore',
        createdAt: new Date('2026-01-01T00:00:00Z').toISOString()
      });

      // Sắp xếp giảm dần theo thời gian
      notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      res.json(notifications);
    } catch (error) {
      console.error('Lỗi getNotifications:', error);
      res.status(500).json({ message: 'Lỗi khi tải thông báo.' });
    }
  },

  // 18. ĐÁNH DẤU THÔNG BÁO ĐÃ ĐỌC (LƯU THEO TỪNG KHÁCH HÀNG TRONG POSTGRESQL)
  markNotificationRead: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const customerId = req.user?.userId;
      if (!customerId) {
        res.status(401).json({ message: 'Vui lòng đăng nhập để tiếp tục.' });
        return;
      }
      const id = String(req.params.id || '').trim();
      if (!id) {
        res.status(400).json({ message: 'Thiếu mã thông báo.' });
        return;
      }
      await ensureNotificationReadsTable();
      await prisma.$executeRawUnsafe(
        `INSERT INTO "CustomerNotificationReads" (customer_id, notification_id, read_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (customer_id, notification_id) DO NOTHING;`,
        customerId,
        id
      );
      res.json({ message: 'Đã đánh dấu đã đọc.', id });
    } catch (error) {
      console.error('Lỗi markNotificationRead:', error);
      res.status(500).json({ message: 'Lỗi khi cập nhật trạng thái thông báo.' });
    }
  },

  // 19. ĐÁNH DẤU TẤT CẢ THÔNG BÁO ĐÃ ĐỌC (LƯU THEO TỪNG KHÁCH HÀNG TRONG POSTGRESQL)
  markAllNotificationsRead: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const customerId = req.user?.userId;
      if (!customerId) {
        res.status(401).json({ message: 'Vui lòng đăng nhập để tiếp tục.' });
        return;
      }
      const { ids } = req.body;
      if (Array.isArray(ids) && ids.length > 0) {
        await ensureNotificationReadsTable();
        const cleanIds = ids.map(i => String(i || '').trim()).filter(Boolean);
        if (cleanIds.length > 0) {
          await prisma.$executeRawUnsafe(
            `INSERT INTO "CustomerNotificationReads" (customer_id, notification_id, read_at)
             SELECT $1, unnest($2::text[]), NOW()
             ON CONFLICT (customer_id, notification_id) DO NOTHING;`,
            customerId,
            cleanIds
          );
        }
      }
      res.json({ message: 'Đã đánh dấu tất cả thông báo là đã đọc.' });
    } catch (error) {
      console.error('Lỗi markAllNotificationsRead:', error);
      res.status(500).json({ message: 'Lỗi khi cập nhật thông báo.' });
    }
  },

  // === DÀNH CHO ADMIN: QUẢN LÝ KHÁCH HÀNG ===

  // GET /api/admin/customers - Lấy danh sách khách hàng phía Admin
  getAdminCustomers: async (req: Request, res: Response): Promise<void> => {
    try {
      const { search } = req.query;
      const where: any = {};

      if (search && typeof search === 'string' && search.trim()) {
        const query = search.trim();
        where.OR = [
          { fullName: { contains: query, mode: 'insensitive' } },
          { phone: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } }
        ];
      }

      const customers = await prisma.customer.findMany({
        where,
        include: {
          orders: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { createdAt: true }
          },
          _count: {
            select: { orders: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      const formatted = customers.map(c => {
        const spent = Number(c.totalSpent);
        const tier = calculateMemberTier(c.totalSpent).tier;
        const isLocked = c.lockedUntil && new Date(c.lockedUntil) > new Date();
        const lastPurchase = c.orders?.[0]?.createdAt 
          ? c.orders[0].createdAt.toISOString().split('T')[0]
          : c.createdAt.toISOString().split('T')[0];

        const labels: string[] = [];
        if (spent >= 50000000) labels.push('VIP');
        if (c.type === 'B2B') labels.push('Khách sỉ');

        return {
          id: c.id,
          name: c.fullName,
          phone: c.phone && !c.phone.startsWith('GOOG_') ? c.phone : '',
          email: c.email || '',
          type: c.type === 'B2B' ? 'B2B' : 'Cá nhân',
          membership: c.type === 'B2B' ? 'B2B Partner' : tier,
          ordersCount: c._count.orders,
          totalSpent: spent,
          points: c.rewardPoints,
          status: isLocked ? 'Khóa' : 'Hoạt động',
          createdAt: c.createdAt.toISOString().split('T')[0],
          lastPurchaseAt: lastPurchase,
          labels
        };
      });

      res.json(formatted);
    } catch (error) {
      console.error('Lỗi getAdminCustomers:', error);
      res.status(500).json({ message: 'Lỗi tải danh sách khách hàng.' });
    }
  },

  // GET /api/admin/customers/:id - Chi tiết khách hàng
  getAdminCustomerDetail: async (req: Request, res: Response): Promise<void> => {
    try {
      const id = String(req.params.id);
      const customer = await prisma.customer.findUnique({
        where: { id },
        include: {
          addresses: {
            orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }]
          },
          orders: {
            orderBy: { createdAt: 'desc' },
            include: {
              items: true
            }
          }
        }
      });

      if (!customer) {
        res.status(404).json({ message: 'Không tìm thấy khách hàng.' });
        return;
      }

      const spent = Number(customer.totalSpent);
      const tierInfo = calculateMemberTier(customer.totalSpent);
      const isLocked = customer.lockedUntil && new Date(customer.lockedUntil) > new Date();

      res.json({
        id: customer.id,
        name: customer.fullName,
        fullName: customer.fullName,
        phone: customer.phone && !customer.phone.startsWith('GOOG_') ? customer.phone : '',
        email: customer.email || '',
        avatarUrl: customer.avatarUrl,
        type: customer.type === 'B2B' ? 'B2B' : 'Cá nhân',
        membership: customer.type === 'B2B' ? 'B2B Partner' : tierInfo.tier,
        memberBadge: tierInfo.badge,
        companyName: customer.companyName,
        taxCode: customer.taxCode,
        rewardPoints: customer.rewardPoints,
        totalSpent: spent,
        status: isLocked ? 'Khóa' : 'Hoạt động',
        createdAt: customer.createdAt.toISOString().split('T')[0],
        ordersCount: customer.orders.length,
        addresses: customer.addresses,
        orders: customer.orders.map(o => ({
          id: o.orderNumber,
          orderNumber: o.orderNumber,
          totalAmount: Number(o.totalAmount),
          status: o.status,
          paymentStatus: o.paymentStatus,
          createdAt: o.createdAt.toISOString().replace('T', ' ').substring(0, 16),
          itemsCount: o.items.length
        }))
      });
    } catch (error) {
      console.error('Lỗi getAdminCustomerDetail:', error);
      res.status(500).json({ message: 'Lỗi lấy chi tiết khách hàng.' });
    }
  },

  // PUT /api/admin/customers/:id/status - Khóa / Mở khóa tài khoản khách hàng
  updateAdminCustomerStatus: async (req: Request, res: Response): Promise<void> => {
    try {
      const id = String(req.params.id);
      const { status } = req.body;

      const lockedUntil = status === 'Khóa' ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) : null;

      await prisma.customer.update({
        where: { id },
        data: { lockedUntil }
      });

      res.json({
        message: status === 'Khóa' ? 'Đã khóa tài khoản khách hàng.' : 'Đã mở khóa tài khoản.',
        status: lockedUntil ? 'Khóa' : 'Hoạt động'
      });
    } catch (error) {
      console.error('Lỗi updateAdminCustomerStatus:', error);
      res.status(500).json({ message: 'Không thể cập nhật trạng thái khách hàng.' });
    }
  }
};
