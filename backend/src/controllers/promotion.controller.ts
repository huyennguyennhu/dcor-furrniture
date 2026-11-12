import { Request, Response } from 'express';
import { memoryCache } from '../lib/cache';

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

export interface BackendCampaignProductItem {
  productId: string;
  productName: string;
  variantName?: string;
  originalPrice: number;
  salePrice: number;
  discountPercent: number;
}

export interface BackendCampaignItem {
  id: string;
  name: string;
  description?: string;
  channel: 'TOÀN HỆ THỐNG' | 'ONLINE' | 'TẠI SHOWROOM';
  showroomTargets: string[];
  discountType: 'PERCENT' | 'FIXED';
  discountValue: number;
  startDateTime: string;
  endDateTime: string;
  status: string;
  productsCount: number;
  totalRevenue: number;
  items: BackendCampaignProductItem[];
}

// Lưu trữ các chiến dịch / đợt giảm giá khuyến mãi thực tế của DCOR (khớp với sản phẩm thật trong DB)
let campaignStore: BackendCampaignItem[] = [
  {
    id: 'CAMP-001',
    name: 'Đại Tiệc Mùa Hè',
    description: 'Giảm 30% toàn bộ bộ sưu tập Sofa & Bàn trà',
    channel: 'TOÀN HỆ THỐNG',
    showroomTargets: [],
    discountType: 'PERCENT',
    discountValue: 30,
    startDateTime: '2026-10-01',
    endDateTime: '2026-12-31',
    status: 'Ongoing',
    productsCount: 8,
    totalRevenue: 345000000,
    items: [
      {
        productId: '0ac754a3-6ae2-4d1f-8443-f26a2abd67b6',
        productName: 'Modena sofa with resting unit',
        variantName: 'Vải Nỉ Be Xám Cao Cấp',
        originalPrice: 42900000,
        salePrice: 30030000,
        discountPercent: 30
      },
      {
        productId: 'dc89e306-17aa-4384-9482-56d299cda075',
        productName: 'Indivi sofa with chaise longue left',
        variantName: 'Vải Nỉ Xám Chuẩn Đan Mạch',
        originalPrice: 38900000,
        salePrice: 27230000,
        discountPercent: 30
      },
      {
        productId: '5925064e-e082-433c-bbc3-666330ac4e44',
        productName: 'Santiago extendable dining table',
        variantName: 'Mặt Gỗ Sồi Dark Oak Tự Nhiên',
        originalPrice: 32500000,
        salePrice: 22750000,
        discountPercent: 30
      },
      {
        productId: '9134eb25-b351-4bfe-af5f-29e103536a47',
        productName: 'Expose side table',
        variantName: 'Kim Loại Matt Black Sơn Tĩnh Điện',
        originalPrice: 12500000,
        salePrice: 8750000,
        discountPercent: 30
      },
      {
        productId: 'd1faee79-dfef-48b6-8efa-8d9d85224a16',
        productName: 'Madrid coffee table',
        variantName: 'Mặt Bàn Ceramic Cao Cấp',
        originalPrice: 21290000,
        salePrice: 14903000,
        discountPercent: 30
      },
      {
        productId: '3dd3ea15-db17-448a-8ba0-2d46cc96c6a9',
        productName: 'Bolzano 3-seater',
        variantName: 'Vải Nỉ Sang Trọng',
        originalPrice: 36000000,
        salePrice: 25200000,
        discountPercent: 30
      },
      {
        productId: 'cfcd7eef-bcf4-4265-bbcd-e3bf26ae3b4c',
        productName: 'Carmo corner sofa',
        variantName: 'Module Góc Chữ L Hiện Đại',
        originalPrice: 49000000,
        salePrice: 34300000,
        discountPercent: 30
      },
      {
        productId: 'da5d42bf-9ed4-4f7c-a6ce-095241145aae',
        productName: 'Expose coffee table',
        variantName: 'Bàn Trà Kính & Gỗ',
        originalPrice: 15500000,
        salePrice: 10850000,
        discountPercent: 30
      }
    ]
  },
  {
    id: 'CAMP-002',
    name: 'Khai Trương Showroom',
    description: 'Ưu đãi 20% bàn ghế ăn & phòng bếp',
    channel: 'TẠI SHOWROOM',
    showroomTargets: [
      'Showroom Q1 TP.HCM (Hai Bà Trưng)',
      'Showroom Thủ Đức TP.HCM (Võ Văn Ngân)'
    ],
    discountType: 'PERCENT',
    discountValue: 20,
    startDateTime: '2026-10-01',
    endDateTime: '2026-12-31',
    status: 'Ongoing',
    productsCount: 4,
    totalRevenue: 512000000,
    items: [
      {
        productId: 'a280e186-e170-4ad1-acc6-967426bb2b7e',
        productName: 'Hamilton dining chair',
        variantName: 'Chân Kim Loại Đen Mờ',
        originalPrice: 8500000,
        salePrice: 6800000,
        discountPercent: 20
      },
      {
        productId: 'e436fd65-b60b-4f7a-abdc-2dd384bec890',
        productName: 'Princeton dining chair',
        variantName: 'Nệm Êm Vải Cao Cấp',
        originalPrice: 9200000,
        salePrice: 7360000,
        discountPercent: 20
      },
      {
        productId: 'a7b41332-c263-4f0d-b708-530f75d19517',
        productName: 'Imola armchair with swivel function',
        variantName: 'Chân Xoay Da Bò Ý Thượng Hạng',
        originalPrice: 25000000,
        salePrice: 20000000,
        discountPercent: 20
      },
      {
        productId: '3b0023d3-815e-487a-b3e1-4493c78a9cd3',
        productName: 'Adelaide barstool',
        variantName: 'Ghế Quầy Bar Bắc Âu',
        originalPrice: 7800000,
        salePrice: 6240000,
        discountPercent: 20
      }
    ]
  },
  {
    id: 'CAMP-003',
    name: 'Tri Ân Khách Hàng Online',
    description: 'Giảm 15% giường ngủ & tủ kệ cao cấp',
    channel: 'ONLINE',
    showroomTargets: [],
    discountType: 'PERCENT',
    discountValue: 15,
    startDateTime: '2026-11-01',
    endDateTime: '2026-12-31',
    status: 'Ongoing',
    productsCount: 2,
    totalRevenue: 0,
    items: [
      {
        productId: 'f2d1fc04-8036-4e62-862e-7a302109cdc7',
        productName: 'Taylor sleeper W160xL200cm',
        variantName: 'Giường Sofa Đa Năng 1m6 x 2m',
        originalPrice: 31000000,
        salePrice: 26350000,
        discountPercent: 15
      },
      {
        productId: 'a6167ea5-8422-4caa-84cc-032b6b24ac97',
        productName: 'Calgary storage with drawer',
        variantName: 'Tủ Kệ Trang Trí Gỗ Tự Nhiên',
        originalPrice: 44990000,
        salePrice: 38241500,
        discountPercent: 15
      }
    ]
  }
];

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
  },

  // === DÀNH CHO CHIẾN DỊCH GIẢM GIÁ (CAMPAIGNS) ===

  // GET /api/store/campaigns - Lấy danh sách chiến dịch đang diễn ra cho Store khách hàng
  getStoreCampaigns: (req: Request, res: Response) => {
    const today = new Date().toISOString().split('T')[0];
    const active = campaignStore.filter(c => {
      const isStatusActive = c.status === 'Ongoing' || c.status === 'Active' || c.status === 'Đang diễn ra';
      const isNotExpired = !c.endDateTime || c.endDateTime >= today;
      const isStarted = !c.startDateTime || c.startDateTime <= today;
      return isStatusActive && isNotExpired && isStarted;
    });
    res.json(active);
  },

  // GET /api/admin/promotions/campaigns - Lấy toàn bộ danh sách chiến dịch cho Admin
  getAdminCampaigns: (req: Request, res: Response) => {
    res.json(campaignStore);
  },

  // POST /api/admin/promotions/campaigns - Thêm mới hoặc cập nhật chiến dịch
  upsertAdminCampaign: (req: Request, res: Response): void => {
    const campaignData: BackendCampaignItem = req.body;
    if (!campaignData || !campaignData.name) {
      res.status(400).json({ message: 'Dữ liệu chiến dịch không hợp lệ.' });
      return;
    }

    const id = campaignData.id || `CAMP-${Date.now().toString().slice(-4)}`;
    const idx = campaignStore.findIndex(c => c.id === id);

    if (idx >= 0) {
      campaignStore[idx] = { ...campaignStore[idx], ...campaignData, id };
      memoryCache.clear();
      res.json({ message: 'Cập nhật chiến dịch thành công.', campaign: campaignStore[idx] });
    } else {
      campaignStore.unshift({ ...campaignData, id });
      memoryCache.clear();
      res.status(201).json({ message: 'Tạo chiến dịch mới thành công.', campaign: campaignStore[0] });
    }
  },

  // DELETE /api/admin/promotions/campaigns/:id - Xóa chiến dịch
  deleteAdminCampaign: (req: Request, res: Response): void => {
    const { id } = req.params;
    const initialLen = campaignStore.length;
    campaignStore = campaignStore.filter(c => c.id !== id);
    if (campaignStore.length === initialLen) {
      res.status(404).json({ message: 'Không tìm thấy chiến dịch cần xóa.' });
      return;
    }
    memoryCache.clear();
    res.json({ message: 'Đã xóa chiến dịch thành công.' });
  },

  // Helper trả về danh sách chiến dịch đang hiệu lực cho backend (dùng ở server.ts)
  getActiveCampaignsHelper: (): BackendCampaignItem[] => {
    const today = new Date().toISOString().split('T')[0];
    return campaignStore.filter(c => {
      const isStatusActive = c.status === 'Ongoing' || c.status === 'Active' || c.status === 'Đang diễn ra';
      const isNotExpired = !c.endDateTime || c.endDateTime >= today;
      const isStarted = !c.startDateTime || c.startDateTime <= today;
      return isStatusActive && isNotExpired && isStarted;
    });
  }
};
