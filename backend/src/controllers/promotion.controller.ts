import { Request, Response } from 'express';

export interface PromotionRecord {
  code: string;
  name: string;
  discount: string;
  condition: string;
  expiry: string;
  status: 'Đang hoạt động' | 'Đã kết thúc';
  discountType: 'PERCENT' | 'AMOUNT';
  discountValue: number;
  minOrderValue: number;
  maxDiscountAmount?: number;
  isFreeShip?: boolean;
}

// Lưu trữ danh sách khuyến mãi / vouchers đồng bộ giữa Admin và Store
// Khởi tạo sẵn các mã thực tế của DCOR
let voucherStore: PromotionRecord[] = [
  {
    code: 'WELCOME10',
    name: 'Ưu đãi thành viên mới',
    discount: '10%',
    condition: 'Đơn đầu tiên từ 2.000.000₫ (Giảm tối đa 1.000.000₫)',
    expiry: '31/12/2026',
    status: 'Đang hoạt động',
    discountType: 'PERCENT',
    discountValue: 10,
    minOrderValue: 2000000,
    maxDiscountAmount: 1000000,
    isFreeShip: false
  },
  {
    code: 'DCOR500',
    name: 'Giảm trực tiếp 500k',
    discount: '500.000₫',
    condition: 'Đơn hàng từ 8.000.000₫',
    expiry: '30/11/2026',
    status: 'Đang hoạt động',
    discountType: 'AMOUNT',
    discountValue: 500000,
    minOrderValue: 8000000,
    isFreeShip: false
  },
  {
    code: 'FREESHIP',
    name: 'Miễn phí vận chuyển toàn quốc',
    discount: 'Miễn phí vận chuyển',
    condition: 'Đơn hàng từ 5.000.000₫ (Miễn phí 100% ship)',
    expiry: '31/12/2026',
    status: 'Đang hoạt động',
    discountType: 'AMOUNT',
    discountValue: 250000, // Tiêu chuẩn phí vận chuyển 250.000đ
    minOrderValue: 5000000,
    isFreeShip: true
  },
  {
    code: 'FREESHIP50',
    name: 'Hỗ trợ 50% phí vận chuyển',
    discount: 'Giảm 50% phí ship',
    condition: 'Đơn hàng từ 2.000.000₫ (Giảm 125.000₫ phí ship)',
    expiry: '31/12/2026',
    status: 'Đang hoạt động',
    discountType: 'AMOUNT',
    discountValue: 125000,
    minOrderValue: 2000000,
    isFreeShip: true
  },
  {
    code: 'VIP15',
    name: 'Đặc quyền khách hàng VIP',
    discount: '15%',
    condition: 'Đơn hàng từ 20.000.000₫ (Giảm tối đa 5.000.000₫)',
    expiry: '31/12/2026',
    status: 'Đang hoạt động',
    discountType: 'PERCENT',
    discountValue: 15,
    minOrderValue: 20000000,
    maxDiscountAmount: 5000000,
    isFreeShip: false
  }
];

export const promotionController = {
  // === DÀNH CHO STORE / GIỎ HÀNG / THANH TOÁN ===

  // GET /api/store/promotions - Lấy danh sách mã đang hoạt động
  getStorePromotions: (req: Request, res: Response) => {
    const activePromotions = voucherStore
      .filter(v => v.status === 'Đang hoạt động')
      .map(v => ({
        code: v.code,
        name: v.name,
        description: v.condition,
        discountType: v.discountType,
        discountValue: v.discountValue,
        minOrderValue: v.minOrderValue,
        maxDiscountAmount: v.maxDiscountAmount,
        expiry: v.expiry,
        isFreeShip: v.isFreeShip
      }));
    res.json(activePromotions);
  },

  // POST /api/store/promotions/verify - Xác minh mã ưu đãi nhập tay và tính số tiền giảm
  verifyPromotion: (req: Request, res: Response): void => {
    const { code, orderTotal } = req.body;
    if (!code) {
      res.status(400).json({ message: 'Vui lòng cung cấp mã ưu đãi.' });
      return;
    }

    const cleanCode = String(code).trim().toUpperCase();
    const total = Number(orderTotal) || 0;

    const voucher = voucherStore.find(v => v.code.toUpperCase() === cleanCode);
    if (!voucher) {
      res.status(404).json({ message: `Mã ưu đãi "${cleanCode}" không tồn tại trong hệ thống.` });
      return;
    }

    if (voucher.status !== 'Đang hoạt động') {
      res.status(400).json({ message: `Mã ưu đãi "${cleanCode}" đã hết hiệu lực áp dụng.` });
      return;
    }

    if (voucher.minOrderValue && total < voucher.minOrderValue) {
      res.status(400).json({
        message: `Mã "${cleanCode}" chỉ áp dụng cho đơn hàng từ ${voucher.minOrderValue.toLocaleString('vi-VN')} ₫. Giá trị đơn hiện tại của bạn là ${total.toLocaleString('vi-VN')} ₫.`
      });
      return;
    }

    let calculatedDiscount = 0;
    if (voucher.discountType === 'PERCENT') {
      calculatedDiscount = Math.round((total * voucher.discountValue) / 100);
      if (voucher.maxDiscountAmount) {
        calculatedDiscount = Math.min(calculatedDiscount, voucher.maxDiscountAmount);
      }
    } else {
      calculatedDiscount = voucher.discountValue;
    }

    calculatedDiscount = Math.min(calculatedDiscount, total);

    res.json({
      success: true,
      code: voucher.code,
      name: voucher.name,
      condition: voucher.condition,
      discountType: voucher.discountType,
      discountValue: voucher.discountValue,
      minOrderValue: voucher.minOrderValue,
      calculatedDiscount,
      isFreeShip: voucher.isFreeShip
    });
  },

  // === DÀNH CHO ADMIN / QUẢN LÝ KHUYẾN MÃI ===

  // GET /api/admin/promotions/vouchers - Lấy tất cả voucher của Admin
  getAdminVouchers: (req: Request, res: Response) => {
    res.json(voucherStore);
  },

  // POST /api/admin/promotions/vouchers - Thêm mới hoặc cập nhật voucher
  upsertAdminVoucher: (req: Request, res: Response): void => {
    const { code, name, discount, condition, expiry, status, discountType, discountValue, minOrderValue, maxDiscountAmount, isFreeShip } = req.body;
    if (!code || !condition) {
      res.status(400).json({ message: 'Vui lòng cung cấp mã và điều kiện khuyến mãi.' });
      return;
    }

    const cleanCode = String(code).trim().toUpperCase();
    const existingIdx = voucherStore.findIndex(v => v.code.toUpperCase() === cleanCode);

    const newVoucher: PromotionRecord = {
      code: cleanCode,
      name: name ? String(name).trim() : cleanCode,
      discount: discount ? String(discount).trim() : `${discountValue || 0}%`,
      condition: String(condition).trim(),
      expiry: expiry ? String(expiry).trim() : '31/12/2026',
      status: status === 'Đã kết thúc' ? 'Đã kết thúc' : 'Đang hoạt động',
      discountType: discountType === 'AMOUNT' ? 'AMOUNT' : 'PERCENT',
      discountValue: Number(discountValue) || 0,
      minOrderValue: Number(minOrderValue) || 0,
      maxDiscountAmount: maxDiscountAmount ? Number(maxDiscountAmount) : undefined,
      isFreeShip: !!isFreeShip || cleanCode === 'FREESHIP'
    };

    if (existingIdx >= 0) {
      voucherStore[existingIdx] = { ...voucherStore[existingIdx], ...newVoucher };
      res.json({ message: 'Cập nhật mã khuyến mãi thành công.', voucher: voucherStore[existingIdx] });
    } else {
      voucherStore.unshift(newVoucher);
      res.status(201).json({ message: 'Thêm mới mã khuyến mãi thành công.', voucher: newVoucher });
    }
  },

  // DELETE /api/admin/promotions/vouchers/:code - Xóa voucher
  deleteAdminVoucher: (req: Request, res: Response): void => {
    const { code } = req.params;
    const cleanCode = String(code).trim().toUpperCase();
    const initialLen = voucherStore.length;
    voucherStore = voucherStore.filter(v => v.code.toUpperCase() !== cleanCode);
    if (voucherStore.length === initialLen) {
      res.status(404).json({ message: 'Không tìm thấy mã khuyến mãi cần xóa.' });
      return;
    }
    res.json({ message: 'Đã xóa mã khuyến mãi thành công.' });
  },

  // Helper cho Backend kiểm tra voucher nội bộ
  calculateVoucherDiscount: (code: string | undefined | null, subTotal: number): { discount: number; isFreeShip: boolean } => {
    if (!code) return { discount: 0, isFreeShip: false };
    const cleanCode = code.trim().toUpperCase();
    const voucher = voucherStore.find(v => v.code.toUpperCase() === cleanCode && v.status === 'Đang hoạt động');
    if (!voucher) return { discount: 0, isFreeShip: false };
    if (voucher.minOrderValue && subTotal < voucher.minOrderValue) return { discount: 0, isFreeShip: false };

    let discount = 0;
    if (voucher.discountType === 'PERCENT') {
      discount = Math.round((subTotal * voucher.discountValue) / 100);
      if (voucher.maxDiscountAmount) {
        discount = Math.min(discount, voucher.maxDiscountAmount);
      }
    } else {
      discount = voucher.discountValue;
    }
    return {
      discount: Math.min(discount, subTotal),
      isFreeShip: !!voucher.isFreeShip
    };
  }
};
