import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth.middleware';
import { otpService } from '../services/otp.service';

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

const calculateMemberTier = (totalSpent: bigint | number): { tier: string; badge: string; minPoints: number; nextTierThreshold: number } => {
  const spent = typeof totalSpent === 'bigint' ? Number(totalSpent) : totalSpent;
  if (spent >= 100000000) {
    return { tier: 'Kim Cương', badge: 'DIAMOND', minPoints: 10000, nextTierThreshold: 100000000 };
  }
  if (spent >= 50000000) {
    return { tier: 'Vàng', badge: 'GOLD', minPoints: 5000, nextTierThreshold: 100000000 };
  }
  if (spent >= 15000000) {
    return { tier: 'Bạc', badge: 'SILVER', minPoints: 1500, nextTierThreshold: 50000000 };
  }
  return { tier: 'Đồng', badge: 'BRONZE', minPoints: 0, nextTierThreshold: 15000000 };
};

// Lưu trữ lịch hẹn tư vấn và yêu cầu bảo hành/đổi trả trong bộ nhớ an toàn (đồng bộ với DB orders)
interface CustomerAppointment {
  id: string;
  customerId: string;
  customerName: string;
  phone: string;
  email?: string;
  appointmentType: 'SHOWROOM' | 'ONLINE_3D';
  showroomAddress?: string;
  date: string;
  timeSlot: string;
  spaceType?: string;
  budget?: string;
  notes?: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  createdAt: string;
  updatedAt?: string;
}

const inMemoryAppointments: CustomerAppointment[] = [];

export interface CustomerReturnRequest {
  id: string;
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
  status: 'PENDING' | 'PROCESSING' | 'PREPARING' | 'SHIPPED' | 'COMPLETED' | 'REJECTED';
  statusLabel: string;
  refundAmount?: number;
  createdAt: string;
  updatedAt: string;
}

export const inMemoryReturns: CustomerReturnRequest[] = [];

const readNotificationIds = new Set<string>();

export const customerController = {
  // 1. LẤY HỒ SƠ KHÁCH HÀNG
  getProfile: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const customerId = req.user?.userId;
      const guestPhone = req.user?.phone || (req.headers['x-guest-phone'] as string) || (req.query.phone as string);

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
          .filter(o => o.status !== 'CANCELLED')
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
          rewardPoints: Math.floor(totalSpent / 100000),
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
        fullName: fullName.trim(),
        email: email && email.trim() ? email.trim().toLowerCase() : null,
        avatarUrl: avatarUrl || null,
        companyName: companyName ? companyName.trim() : null,
        taxCode: taxCode ? taxCode.trim() : null
      };

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
      const customerPhone = req.user?.phone || (req.headers['x-guest-phone'] as string) || (req.query.phone as string);
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

      const warrantyItems: any[] = [];
      const now = new Date();

      orders.forEach(order => {
        const startDate = order.deliveredAt || order.createdAt;
        // Bảo hành mặc định 24 tháng đối với nội thất chính hãng Dcor
        const expiryDate = new Date(startDate);
        expiryDate.setMonth(expiryDate.getMonth() + 24);

        const isExpired = now > expiryDate;
        const daysLeft = Math.max(0, Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
        const totalDurationMs = expiryDate.getTime() - new Date(startDate).getTime();
        const elapsedMs = Math.max(0, now.getTime() - new Date(startDate).getTime());
        const progressPercent = Math.min(100, Math.max(0, Math.round((elapsedMs / totalDurationMs) * 100)));

        const cleanOrderDigits = (order.orderNumber || '').replace(/[^0-9]/g, '');
        const defaultWarrantyCode = 'BH-' + (cleanOrderDigits.slice(-6) || '883921');
        const warrantyCode = (order as any).warrantyCode || defaultWarrantyCode;

        const customerAddress = [
          order.detailAddress,
          order.ward,
          order.district,
          order.province
        ].filter(Boolean).join(', ');

        order.items.forEach(item => {
          warrantyItems.push({
            id: `WAR-${item.id}`,
            orderNumber: order.orderNumber,
            warrantyCode,
            productId: (item as any).productId || '',
            productName: item.productName,
            sku: item.sku || 'DCOR-' + (item.id || '').slice(0, 6).toUpperCase(),
            imageUrl: item.imageUrl,
            variantDescription: item.variantDescription,
            price: Number(item.price) || 0,
            quantity: item.quantity || 1,
            purchaseDate: order.createdAt,
            deliveredDate: startDate,
            warrantyPeriodMonths: 24,
            expiryDate: expiryDate.toISOString(),
            isExpired,
            daysLeft,
            progressPercent,
            status: isExpired ? 'EXPIRED' : 'ACTIVE',
            statusLabel: isExpired ? 'Hết hạn bảo hành' : 'Còn hiệu lực bảo hành',
            customerName: order.receiverName || 'Khách hàng',
            customerPhone: order.phone,
            customerAddress: customerAddress || 'Hồ Chí Minh, Việt Nam',
            coverageTerms: [
              'Bảo hành 24 - 36 tháng đối với khung xương gỗ tự nhiên và cấu trúc kim loại chịu lực.',
              'Bảo hành 24 tháng đối với đệm mút và hệ thống lò xo đàn hồi chống lún sụt.',
              'Bảo hành 12 - 24 tháng đối với bề mặt da cao cấp, vải nỉ và phụ kiện cơ học (ray trượt, bản lề giảm chấn).',
              'Bảo dưỡng định kỳ miễn phí và hỗ trợ kỹ thuật tại nhà trọn đời.'
            ]
          });
        });
      });

      res.json(warrantyItems);
    } catch (error) {
      console.error('Lỗi getWarranties:', error);
      res.status(500).json({ message: 'Lỗi khi tải thông tin bảo hành.' });
    }
  },

  // 11. TẠO PHIẾU YÊU CẦU BẢO HÀNH
  createWarrantyClaim: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const customerId = req.user?.userId;
      const { orderNumber, productName, issueDescription, claimType, evidenceImages } = req.body;

      if (!orderNumber || !productName || !issueDescription) {
        res.status(400).json({ message: 'Vui lòng cung cấp mã đơn hàng, tên sản phẩm và mô tả sự cố.' });
        return;
      }

      // Ghi nhận vào OrderStatusHistory để theo dõi
      const order = await prisma.order.findFirst({
        where: { orderNumber, customerId }
      });

      if (order) {
        await prisma.orderStatusHistory.create({
          data: {
            orderId: order.id,
            status: order.status,
            actorType: 'CUSTOMER',
            notes: `[Yêu cầu bảo hành] Sản phẩm: ${productName}. Loại: ${claimType || 'Tại nhà'}. Chi tiết: ${issueDescription}. Ảnh: ${(evidenceImages || []).join(', ')}`
          }
        });
      }

      res.status(201).json({
        message: 'Gửi yêu cầu bảo hành thành công. Kỹ thuật viên Dcor sẽ liên hệ với bạn trong vòng 24 giờ.',
        claimId: `CLM-${Date.now().toString().slice(-6)}`
      });
    } catch (error) {
      console.error('Lỗi createWarrantyClaim:', error);
      res.status(500).json({ message: 'Lỗi khi tạo yêu cầu bảo hành.' });
    }
  },

  // 12. DANH SÁCH LỊCH HẸN TƯ VẤN (APPOINTMENTS)
  getAppointments: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const customerId = req.user?.userId;
      const customerPhone = req.user?.phone || (req.headers['x-guest-phone'] as string) || (req.query.phone as string);
      if (!customerId && !customerPhone) {
        res.json([]);
        return;
      }

      const cleanPhone = customerPhone ? normalizePhone(customerPhone) : '';
      const list = inMemoryAppointments.filter(a => 
        (customerId && a.customerId === customerId) || 
        (cleanPhone && normalizePhone(a.phone) === cleanPhone)
      );
      res.json(list);
    } catch (error) {
      console.error('Lỗi getAppointments:', error);
      res.status(500).json({ message: 'Lỗi khi lấy danh sách lịch hẹn.' });
    }
  },

  // 12.1. LẤY DANH SÁCH KHUNG GIỜ ĐÃ ĐƯỢC ĐẶT (ĐỂ ẨN TRÊN DROPDOWN TRÁNH TRÙNG LỊCH)
  getBookedAppointmentSlots: async (req: Request, res: Response): Promise<void> => {
    try {
      const { date, showroomAddress, appointmentType } = req.query as {
        date?: string;
        showroomAddress?: string;
        appointmentType?: string;
      };

      let queryList = inMemoryAppointments.filter(a => a.status !== 'CANCELLED');

      if (date) {
        queryList = queryList.filter(a => a.date === date);
      }

      // Khóa tất cả các khung giờ đã có khách hàng đặt trong ngày (dù là showroom hay online)
      const bookedSlots = Array.from(new Set(queryList.map(a => a.timeSlot)));

      // RÀNG BUỘC THỜI GIAN THỰC: Nếu ngày tra cứu là hôm nay hoặc quá khứ, tự động khóa các khung giờ đã trôi qua
      const now = new Date();
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      if (date && date <= todayStr) {
        const masterSlots = ['09:00 - 10:30', '10:30 - 12:00', '14:00 - 15:30', '16:00 - 17:30', '19:00 - 20:30'];
        const currentH = now.getHours();
        const currentM = now.getMinutes();
        for (const slot of masterSlots) {
          if (date < todayStr) {
            if (!bookedSlots.includes(slot)) bookedSlots.push(slot);
          } else {
            const [startPart] = slot.split(' - ');
            const [h, m] = startPart.split(':').map(Number);
            if (h < currentH || (h === currentH && m <= currentM)) {
              if (!bookedSlots.includes(slot)) bookedSlots.push(slot);
            }
          }
        }
      }

      const allActiveBookings = inMemoryAppointments
        .filter(a => a.status !== 'CANCELLED')
        .map(a => ({
          date: a.date,
          appointmentType: a.appointmentType,
          showroomAddress: a.showroomAddress,
          timeSlot: a.timeSlot
        }));

      res.json({
        bookedSlots,
        allBookings: allActiveBookings
      });
    } catch (error) {
      console.error('Lỗi getBookedAppointmentSlots:', error);
      res.status(500).json({ message: 'Lỗi khi kiểm tra khung giờ đã đặt.' });
    }
  },

  // 13. ĐẶT LỊCH HẸN TƯ VẤN (CÓ RÀNG BUỘC CHẶT CHẼ)
  createAppointment: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const customerId = req.user?.userId;
      const { customerName, phone, email, appointmentType, showroomAddress, date, timeSlot, spaceType, budget, notes } = req.body;

      if (!customerName || !phone || !date || !timeSlot) {
        res.status(400).json({ message: 'Vui lòng cung cấp họ tên, số điện thoại, ngày hẹn và khung giờ tư vấn.' });
        return;
      }

      const cleanPhone = normalizePhone(phone);
      const isShowroom = appointmentType !== 'ONLINE_3D';
      const selectedShowroom = isShowroom ? (showroomAddress || 'Showroom Dcor Quận 1 - 120 Hai Bà Trưng, P. Đa Kao, Q.1, TP.HCM') : undefined;

      // RÀNG BUỘC THỜI GIAN THỰC: Không cho phép đặt lịch vào ngày hoặc khung giờ đã trôi qua
      const now = new Date();
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      if (date < todayStr) {
        res.status(400).json({ message: 'Không thể đặt lịch hẹn vào ngày trong quá khứ.' });
        return;
      }
      if (date === todayStr) {
        const [startPart] = timeSlot.split(' - ');
        if (startPart) {
          const [h, m] = startPart.split(':').map(Number);
          const currentH = now.getHours();
          const currentM = now.getMinutes();
          if (h < currentH || (h === currentH && m <= currentM)) {
            res.status(400).json({
              message: `Khung giờ ${timeSlot} hôm nay đã trôi qua so với thời gian hiện tại. Vui lòng chọn khung giờ khác hoặc ngày tiếp theo.`
            });
            return;
          }
        }
      }

      // RÀNG BUỘC 1: Mỗi khách hàng chỉ được đặt tối đa 1 khung giờ trong 1 ngày
      const customerAlreadyBooked = inMemoryAppointments.some(a => 
        a.status !== 'CANCELLED' &&
        a.date === date &&
        ((customerId && a.customerId === customerId) || (cleanPhone && normalizePhone(a.phone) === cleanPhone))
      );

      if (customerAlreadyBooked) {
        res.status(400).json({ 
          message: `Bạn đã có một lịch hẹn vào ngày ${date}. Quy định hệ thống: Mỗi khách hàng chỉ được đặt tối đa 1 khung giờ trong 1 ngày.` 
        });
        return;
      }

      // RÀNG BUỘC 2: Tại một showroom và tại một khung giờ chỉ có 1 khách hàng được đặt
      const slotAlreadyTaken = inMemoryAppointments.some(a => {
        if (a.status === 'CANCELLED' || a.date !== date || a.timeSlot !== timeSlot) return false;
        if (isShowroom) {
          return a.appointmentType === 'SHOWROOM' && a.showroomAddress === selectedShowroom;
        } else {
          return a.appointmentType === 'ONLINE_3D';
        }
      });

      if (slotAlreadyTaken) {
        res.status(400).json({
          message: `Khung giờ ${timeSlot} ngày ${date} tại địa điểm này đã có khách hàng đặt trước. Vui lòng chọn khung giờ khác.`
        });
        return;
      }

      const newAppt: CustomerAppointment = {
        id: `APT-${Date.now().toString().slice(-6)}`,
        customerId: customerId || 'guest',
        customerName: customerName.trim(),
        phone: phone.trim(),
        email: email ? email.trim() : (req.user?.email || ''),
        appointmentType: isShowroom ? 'SHOWROOM' : 'ONLINE_3D',
        showroomAddress: isShowroom ? selectedShowroom : 'Tư vấn trực tuyến qua Google Meet 3D',
        date,
        timeSlot,
        spaceType: spaceType ? spaceType.trim() : 'Không gian chung',
        budget: budget ? budget.trim() : 'Linh hoạt',
        notes: notes ? notes.trim() : '',
        status: 'PENDING',
        createdAt: new Date().toISOString()
      };

      inMemoryAppointments.unshift(newAppt);

      res.status(201).json({
        message: 'Đặt lịch hẹn tư vấn thành công. Chuyên viên thiết kế Dcor sẽ liên hệ xác nhận lịch với bạn qua điện thoại & SMS.',
        appointment: newAppt
      });
    } catch (error) {
      console.error('Lỗi createAppointment:', error);
      res.status(500).json({ message: 'Lỗi khi tạo lịch hẹn.' });
    }
  },

  // 14. HỦY LỊCH HẸN (Chỉ hủy được trước khi admin duyệt - trạng thái PENDING)
  cancelAppointment: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const appt = inMemoryAppointments.find(a => a.id === id);
      if (!appt) {
        res.status(404).json({ message: 'Không tìm thấy lịch hẹn.' });
        return;
      }

      if (appt.status === 'CANCELLED') {
        res.status(400).json({ message: 'Lịch hẹn này đã bị hủy trước đó.' });
        return;
      }

      if (appt.status === 'CONFIRMED') {
        res.status(400).json({ 
          message: 'Lịch hẹn đã được quản trị viên duyệt xác nhận. Quý khách vui lòng liên hệ Hotline 1900 8888 để được hỗ trợ điều chỉnh hoặc hủy hẹn.' 
        });
        return;
      }

      if (appt.status === 'COMPLETED') {
        res.status(400).json({ message: 'Lịch hẹn đã hoàn tất, không thể hủy.' });
        return;
      }

      appt.status = 'CANCELLED';
      appt.updatedAt = new Date().toISOString();
      res.json({ message: 'Hủy lịch hẹn thành công.', appointment: appt });
    } catch (error) {
      console.error('Lỗi cancelAppointment:', error);
      res.status(500).json({ message: 'Lỗi khi hủy lịch hẹn.' });
    }
  },

  // 14.1. ĐỔI GIỜ LỊCH HẸN (Chỉ đổi được trước khi admin duyệt - trạng thái PENDING)
  rescheduleAppointment: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { date, timeSlot, notes } = req.body;

      if (!date || !timeSlot) {
        res.status(400).json({ message: 'Vui lòng chọn ngày và khung giờ mới.' });
        return;
      }

      const appt = inMemoryAppointments.find(a => a.id === id);
      if (!appt) {
        res.status(404).json({ message: 'Không tìm thấy lịch hẹn.' });
        return;
      }

      if (appt.status !== 'PENDING') {
        res.status(400).json({ 
          message: 'Lịch hẹn đã được duyệt hoặc không ở trạng thái Chờ xác nhận. Quý khách vui lòng liên hệ Hotline 1900 8888 nếu cần đổi thời gian.' 
        });
        return;
      }

      // RÀNG BUỘC THỜI GIAN THỰC: Không cho phép đổi sang ngày hoặc khung giờ đã trôi qua
      const now = new Date();
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      if (date < todayStr) {
        res.status(400).json({ message: 'Không thể dời lịch hẹn về ngày trong quá khứ.' });
        return;
      }
      if (date === todayStr) {
        const [startPart] = timeSlot.split(' - ');
        if (startPart) {
          const [h, m] = startPart.split(':').map(Number);
          const currentH = now.getHours();
          const currentM = now.getMinutes();
          if (h < currentH || (h === currentH && m <= currentM)) {
            res.status(400).json({
              message: `Khung giờ ${timeSlot} hôm nay đã trôi qua so với thời gian hiện tại. Vui lòng chọn khung giờ khác hoặc ngày tiếp theo.`
            });
            return;
          }
        }
      }

      // Kiểm tra xem khách đã có lịch hẹn khác vào ngày mới này chưa
      const customerId = req.user?.userId;
      const cleanPhone = normalizePhone(appt.phone);
      const customerAlreadyBooked = inMemoryAppointments.some(a => 
        a.id !== id &&
        a.status !== 'CANCELLED' &&
        a.date === date &&
        ((customerId && a.customerId === customerId) || (cleanPhone && normalizePhone(a.phone) === cleanPhone))
      );

      if (customerAlreadyBooked) {
        res.status(400).json({ 
          message: `Bạn đã có một lịch hẹn khác vào ngày ${date}. Mỗi khách hàng chỉ được đặt tối đa 1 khung giờ trong 1 ngày.` 
        });
        return;
      }

      // Kiểm tra khung giờ mới tại showroom đó đã có ai đặt chưa
      const isShowroom = appt.appointmentType !== 'ONLINE_3D';
      const slotAlreadyTaken = inMemoryAppointments.some(a => {
        if (a.id === id || a.status === 'CANCELLED' || a.date !== date || a.timeSlot !== timeSlot) return false;
        if (isShowroom) {
          return a.appointmentType === 'SHOWROOM' && a.showroomAddress === appt.showroomAddress;
        } else {
          return a.appointmentType === 'ONLINE_3D';
        }
      });

      if (slotAlreadyTaken) {
        res.status(400).json({
          message: `Khung giờ ${timeSlot} ngày ${date} tại địa điểm này đã có khách hàng đặt trước. Vui lòng chọn khung giờ khác.`
        });
        return;
      }

      appt.date = date;
      appt.timeSlot = timeSlot;
      if (notes !== undefined) {
        appt.notes = notes;
      }
      appt.updatedAt = new Date().toISOString();

      res.json({
        message: 'Đổi giờ lịch hẹn thành công. Hệ thống đã cập nhật thời gian mới.',
        appointment: appt
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
      const customerPhone = req.user?.phone || (req.headers['x-guest-phone'] as string) || (req.query.phone as string);
      if (!customerId && !customerPhone) {
        res.status(401).json({ message: 'Vui lòng đăng nhập hoặc xác thực số điện thoại để tiếp tục.' });
        return;
      }

      const orConditions: any[] = [];
      if (customerId) orConditions.push({ customerId });
      if (customerPhone) orConditions.push({ phone: customerPhone.trim() });

      // Lấy từ inMemoryReturns
      const list = inMemoryReturns.filter(r => (customerId && r.customerId === customerId));

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
        where: { orderNumber, customerId }
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
            message = `Đơn hàng #${order.orderNumber} đã bị hủy. Nếu có thắc mắc xin vui lòng liên hệ hotline 1900 8888.`;
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
          isRead: readNotificationIds.has(notifId),
          link: `/account/orders?orderNumber=${order.orderNumber}`,
          createdAt: order.updatedAt.toISOString()
        });
      });

      // 2. Thông báo từ lịch hẹn
      const appts = inMemoryAppointments.filter(a => a.customerId === customerId);
      appts.forEach(apt => {
        const notifId = `notif-apt-${apt.id}-${apt.status}`;
        notifications.push({
          id: notifId,
          title: `Lịch hẹn tư vấn #${apt.id}`,
          message: `Lịch hẹn ${apt.appointmentType === 'SHOWROOM' ? 'tại Showroom' : 'Online 3D'} vào ${apt.date} (${apt.timeSlot}) đang ở trạng thái: ${apt.status === 'CONFIRMED' ? 'Đã xác nhận' : apt.status === 'CANCELLED' ? 'Đã hủy' : 'Chờ xác nhận'}.`,
          type: 'APPOINTMENT',
          isRead: readNotificationIds.has(notifId),
          link: '/account/appointments',
          createdAt: apt.createdAt
        });
      });

      // 3. Thông báo đổi trả
      const returns = inMemoryReturns.filter(r => r.customerId === customerId);
      returns.forEach(ret => {
        const notifId = `notif-ret-${ret.id}-${ret.status}`;
        notifications.push({
          id: notifId,
          title: `Yêu cầu đổi trả #${ret.id}`,
          message: `Yêu cầu đổi trả cho đơn hàng ${ret.orderNumber} hiện tại: ${ret.statusLabel}.`,
          type: 'RETURN',
          isRead: readNotificationIds.has(notifId),
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
            isRead: readNotificationIds.has(notifId),
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
        isRead: readNotificationIds.has(welcomeId),
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

  // 18. ĐÁNH DẤU THÔNG BÁO ĐÃ ĐỌC
  markNotificationRead: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const id = String(req.params.id);
      readNotificationIds.add(id);
      res.json({ message: 'Đã đánh dấu đã đọc.', id });
    } catch (error) {
      console.error('Lỗi markNotificationRead:', error);
      res.status(500).json({ message: 'Lỗi khi cập nhật trạng thái thông báo.' });
    }
  },

  // 19. ĐÁNH DẤU TẤT CẢ THÔNG BÁO ĐÃ ĐỌC
  markAllNotificationsRead: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { ids } = req.body;
      if (Array.isArray(ids)) {
        ids.forEach(id => readNotificationIds.add(id));
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
