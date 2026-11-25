import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import prisma from '../lib/prisma';
import { memoryCache } from '../lib/cache';

const CAMPAIGNS_DATA_PATH = path.resolve(__dirname, '../data/campaigns-store.json');

let onCampaignsMutated: (() => void) | null = null;
export function registerCampaignCacheInvalidator(fn: () => void) {
  onCampaignsMutated = fn;
}

function getLocalTodayString(): string {
  const vnNow = new Date(Date.now() + 7 * 60 * 60 * 1000);
  const y = vnNow.getUTCFullYear();
  const m = String(vnNow.getUTCMonth() + 1).padStart(2, '0');
  const d = String(vnNow.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

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
const DEFAULT_CAMPAIGN_STORE: BackendCampaignItem[] = [
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

function loadCampaignStoreFromDisk(): BackendCampaignItem[] {
  try {
    if (fs.existsSync(CAMPAIGNS_DATA_PATH)) {
      const raw = fs.readFileSync(CAMPAIGNS_DATA_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[Promotion] Không thể đọc campaigns-store.json, dùng danh sách mặc định:', err);
  }
  return [...DEFAULT_CAMPAIGN_STORE];
}

function persistCampaignStoreToDisk(store: BackendCampaignItem[]): void {
  try {
    const dir = path.dirname(CAMPAIGNS_DATA_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(CAMPAIGNS_DATA_PATH, JSON.stringify(store, null, 2), 'utf-8');
  } catch (err) {
    console.error('[Promotion] Không thể ghi campaigns-store.json:', err);
  }
}

let campaignStore: BackendCampaignItem[] = loadCampaignStoreFromDisk();
let campaignsTableInitialized = false;

function mapCampaignRow(row: any): BackendCampaignItem {
  const items = Array.isArray(row.items)
    ? row.items
    : (typeof row.items === 'string' ? (() => { try { return JSON.parse(row.items); } catch { return []; } })() : []);
  const targets = Array.isArray(row.showroom_targets)
    ? row.showroom_targets
    : (typeof row.showroom_targets === 'string' ? (() => { try { return JSON.parse(row.showroom_targets); } catch { return []; } })() : []);
  return {
    id: String(row.id),
    name: String(row.name || ''),
    description: row.description || '',
    channel: (row.channel || 'TOÀN HỆ THỐNG') as any,
    showroomTargets: targets,
    discountType: row.discount_type === 'FIXED' ? 'FIXED' : 'PERCENT',
    discountValue: Number(row.discount_value || 0),
    startDateTime: String(row.start_date_time || ''),
    endDateTime: String(row.end_date_time || ''),
    status: String(row.status || 'Ongoing'),
    productsCount: Number(row.products_count ?? items.length),
    totalRevenue: Number(row.total_revenue || 0),
    items
  };
}

export async function ensureCampaignsTable(): Promise<void> {
  if (campaignsTableInitialized) return;
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "PromotionCampaigns" (
        id VARCHAR(100) PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        channel VARCHAR(50) DEFAULT 'TOÀN HỆ THỐNG',
        showroom_targets JSONB DEFAULT '[]'::jsonb,
        discount_type VARCHAR(20) DEFAULT 'PERCENT',
        discount_value INTEGER DEFAULT 0,
        start_date_time VARCHAR(30),
        end_date_time VARCHAR(30),
        status VARCHAR(30) DEFAULT 'Ongoing',
        products_count INTEGER DEFAULT 0,
        total_revenue BIGINT DEFAULT 0,
        items JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    const countRes = await prisma.$queryRawUnsafe<any[]>(`SELECT COUNT(*)::int AS cnt FROM "PromotionCampaigns"`);
    const count = Number(countRes?.[0]?.cnt || 0);
    if (count === 0) {
      const seedSource = loadCampaignStoreFromDisk();
      for (const c of seedSource) {
        await prisma.$executeRawUnsafe(
          `INSERT INTO "PromotionCampaigns"
            (id, name, description, channel, showroom_targets, discount_type, discount_value, start_date_time, end_date_time, status, products_count, total_revenue, items)
           VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7, $8, $9, $10, $11, $12, $13::jsonb)
           ON CONFLICT (id) DO NOTHING`,
          c.id,
          c.name,
          c.description || '',
          c.channel || 'TOÀN HỆ THỐNG',
          JSON.stringify(c.showroomTargets || []),
          c.discountType === 'FIXED' ? 'FIXED' : 'PERCENT',
          Math.round(Number(c.discountValue) || 0),
          c.startDateTime || '',
          c.endDateTime || '',
          c.status || 'Ongoing',
          Array.isArray(c.items) ? c.items.length : (c.productsCount || 0),
          Math.round(Number(c.totalRevenue) || 0),
          JSON.stringify(c.items || [])
        );
      }
    }

    await refreshCampaignStoreFromDb();
    campaignsTableInitialized = true;
  } catch (err) {
    console.error('[Promotion] Không thể khởi tạo bảng PromotionCampaigns:', err);
  }
}

async function refreshCampaignStoreFromDb(): Promise<BackendCampaignItem[]> {
  try {
    const rows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM "PromotionCampaigns" ORDER BY created_at DESC, id ASC`
    );
    campaignStore = rows.map(mapCampaignRow);
    return campaignStore;
  } catch (err) {
    console.warn('[Promotion] Lỗi đọc PromotionCampaigns từ DB:', err);
    return campaignStore;
  }
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
  },

  // === DÀNH CHO CHIẾN DỊCH GIẢM GIÁ (CAMPAIGNS - POSTGRESQL) ===

  // GET /api/store/campaigns - Lấy danh sách chiến dịch đang diễn ra cho Store khách hàng
  getStoreCampaigns: async (req: Request, res: Response) => {
    try {
      await ensureCampaignsTable();
      const list = await refreshCampaignStoreFromDb();
      const today = getLocalTodayString();
      const active = list.filter(c => {
        const isStatusActive = c.status === 'Ongoing' || c.status === 'Active' || c.status === 'Đang diễn ra' || c.status === 'Đang hoạt động';
        const startDay = c.startDateTime ? String(c.startDateTime).slice(0, 10) : '';
        const endDay = c.endDateTime ? String(c.endDateTime).slice(0, 10) : '';
        const isNotExpired = !endDay || endDay >= today;
        const isStarted = !startDay || startDay <= today;
        return isStatusActive && isNotExpired && isStarted;
      });
      res.json(active);
    } catch (error: any) {
      console.error('[Promotion] Lỗi lấy danh sách chiến dịch Store:', error);
      res.status(500).json({ message: 'Không thể tải danh sách chiến dịch khuyến mãi.' });
    }
  },

  // GET /api/admin/promotions/campaigns - Lấy toàn bộ danh sách chiến dịch cho Admin
  getAdminCampaigns: async (req: Request, res: Response) => {
    try {
      await ensureCampaignsTable();
      const list = await refreshCampaignStoreFromDb();
      res.json(list);
    } catch (error: any) {
      console.error('[Promotion] Lỗi lấy danh sách chiến dịch Admin:', error);
      res.status(500).json({ message: 'Không thể tải danh sách chiến dịch từ cơ sở dữ liệu.' });
    }
  },

  // POST /api/admin/promotions/campaigns - Thêm mới hoặc cập nhật chiến dịch trong PostgreSQL
  upsertAdminCampaign: async (req: Request, res: Response): Promise<void> => {
    try {
      await ensureCampaignsTable();
      const campaignData: BackendCampaignItem = req.body;
      if (!campaignData || !campaignData.name || !String(campaignData.name).trim()) {
        res.status(400).json({ message: 'Dữ liệu chiến dịch không hợp lệ.' });
        return;
      }

      const id = campaignData.id ? String(campaignData.id).trim() : `CAMP-${Date.now().toString().slice(-6)}`;
      const items = Array.isArray(campaignData.items) ? campaignData.items : [];
      const showroomTargets = Array.isArray(campaignData.showroomTargets) ? campaignData.showroomTargets : [];
      const discountType = campaignData.discountType === 'FIXED' ? 'FIXED' : 'PERCENT';
      const discountValue = Math.round(Number(campaignData.discountValue) || 0);
      const productsCount = items.length || Number(campaignData.productsCount) || 0;
      const totalRevenue = Math.round(Number(campaignData.totalRevenue) || 0);

      const existingRows = await prisma.$queryRawUnsafe<any[]>(
        `SELECT id FROM "PromotionCampaigns" WHERE id = $1`,
        id
      );
      const isUpdate = existingRows.length > 0;

      await prisma.$executeRawUnsafe(
        `INSERT INTO "PromotionCampaigns"
          (id, name, description, channel, showroom_targets, discount_type, discount_value, start_date_time, end_date_time, status, products_count, total_revenue, items, updated_at)
         VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7, $8, $9, $10, $11, $12, $13::jsonb, NOW())
         ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          channel = EXCLUDED.channel,
          showroom_targets = EXCLUDED.showroom_targets,
          discount_type = EXCLUDED.discount_type,
          discount_value = EXCLUDED.discount_value,
          start_date_time = EXCLUDED.start_date_time,
          end_date_time = EXCLUDED.end_date_time,
          status = EXCLUDED.status,
          products_count = EXCLUDED.products_count,
          total_revenue = EXCLUDED.total_revenue,
          items = EXCLUDED.items,
          updated_at = NOW()`,
        id,
        String(campaignData.name).trim(),
        campaignData.description ? String(campaignData.description).trim() : '',
        campaignData.channel || 'TOÀN HỆ THỐNG',
        JSON.stringify(showroomTargets),
        discountType,
        discountValue,
        campaignData.startDateTime || '',
        campaignData.endDateTime || '',
        campaignData.status || 'Ongoing',
        productsCount,
        totalRevenue,
        JSON.stringify(items)
      );

      const updatedList = await refreshCampaignStoreFromDb();
      persistCampaignStoreToDisk(updatedList);
      memoryCache.clear();
      onCampaignsMutated?.();

      const saved = updatedList.find(c => c.id === id) || { ...campaignData, id };
      res.status(isUpdate ? 200 : 201).json({
        message: isUpdate ? 'Cập nhật chiến dịch thành công.' : 'Tạo chiến dịch mới thành công.',
        campaign: saved
      });
    } catch (error: any) {
      console.error('[Promotion] Lỗi lưu chiến dịch:', error);
      res.status(500).json({ message: 'Không thể lưu chiến dịch vào cơ sở dữ liệu.', error: error?.message });
    }
  },

  // DELETE /api/admin/promotions/campaigns/:id - Xóa chiến dịch khỏi PostgreSQL
  deleteAdminCampaign: async (req: Request, res: Response): Promise<void> => {
    try {
      await ensureCampaignsTable();
      const id = String(req.params.id || '').trim();
      const existingRows = await prisma.$queryRawUnsafe<any[]>(
        `SELECT id FROM "PromotionCampaigns" WHERE id = $1`,
        id
      );
      if (existingRows.length === 0) {
        res.status(404).json({ message: 'Không tìm thấy chiến dịch cần xóa.' });
        return;
      }

      await prisma.$executeRawUnsafe(`DELETE FROM "PromotionCampaigns" WHERE id = $1`, id);
      const updatedList = await refreshCampaignStoreFromDb();
      persistCampaignStoreToDisk(updatedList);
      memoryCache.clear();
      onCampaignsMutated?.();
      res.json({ success: true, message: 'Đã xóa chiến dịch thành công.' });
    } catch (error: any) {
      console.error('[Promotion] Lỗi xóa chiến dịch:', error);
      res.status(500).json({ message: 'Không thể xóa chiến dịch khỏi cơ sở dữ liệu.', error: error?.message });
    }
  },

  // Helper trả về danh sách chiến dịch đang hiệu lực cho backend (dùng ở server.ts)
  getActiveCampaignsHelper: (): BackendCampaignItem[] => {
    const today = getLocalTodayString();
    return campaignStore.filter(c => {
      const isStatusActive = c.status === 'Ongoing' || c.status === 'Active' || c.status === 'Đang diễn ra' || c.status === 'Đang hoạt động';
      const startDay = c.startDateTime ? String(c.startDateTime).slice(0, 10) : '';
      const endDay = c.endDateTime ? String(c.endDateTime).slice(0, 10) : '';
      const isNotExpired = !endDay || endDay >= today;
      const isStarted = !startDay || startDay <= today;
      return isStatusActive && isNotExpired && isStarted;
    });
  }
};
