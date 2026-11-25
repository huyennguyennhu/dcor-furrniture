import { Request, Response } from 'express';
import prisma from '../lib/prisma';

const VN_TZ_OFFSET_MS = 7 * 60 * 60 * 1000;

export function parseVoucherStartDate(raw: any): Date {
  if (!raw) return new Date();
  const str = String(raw).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return new Date(`${str}T00:00:00.000+07:00`);
  }
  const d = new Date(str);
  return isNaN(d.getTime()) ? new Date() : d;
}

export function parseVoucherEndDate(raw: any): Date {
  if (!raw) return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const str = String(raw).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return new Date(`${str}T23:59:59.999+07:00`);
  }
  const d = new Date(str);
  return isNaN(d.getTime()) ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : d;
}

function getVnDateString(d: Date): string {
  const vn = new Date(d.getTime() + VN_TZ_OFFSET_MS);
  const y = vn.getUTCFullYear();
  const m = String(vn.getUTCMonth() + 1).padStart(2, '0');
  const day = String(vn.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function getVoucherEffectiveRange(startDate: Date | string, endDate: Date | string): { start: Date; end: Date } {
  const s = new Date(startDate);
  const e = new Date(endDate);
  const startDay = getVnDateString(s);
  const endDay = getVnDateString(e);
  return {
    start: new Date(`${startDay}T00:00:00.000+07:00`),
    end: new Date(`${endDay}T23:59:59.999+07:00`)
  };
}

export function isFreeshipVoucher(code: string): boolean {
  return String(code || '').trim().toUpperCase().startsWith('FREESHIP');
}

function formatCurrencyVN(val: number): string {
  return new Intl.NumberFormat('vi-VN').format(val || 0) + '₫';
}

function formatDateVN(d: Date | string): string {
  const dt = new Date(d);
  const vn = new Date(dt.getTime() + VN_TZ_OFFSET_MS);
  const day = String(vn.getUTCDate()).padStart(2, '0');
  const month = String(vn.getUTCMonth() + 1).padStart(2, '0');
  const year = vn.getUTCFullYear();
  return `${day}/${month}/${year}`;
}

let voucherScopesTableReady = false;
async function ensureVoucherScopesTable(): Promise<void> {
  if (voucherScopesTableReady) return;
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "VoucherScopes" (
        voucher_id VARCHAR(100) PRIMARY KEY,
        scope VARCHAR(30) NOT NULL DEFAULT 'ALL',
        category_scope_name VARCHAR(255),
        product_ids JSONB DEFAULT '[]'::jsonb,
        product_names JSONB DEFAULT '[]'::jsonb,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "VoucherScopes" ADD COLUMN IF NOT EXISTS product_ids JSONB DEFAULT '[]'::jsonb;
    `).catch(() => {});
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "VoucherScopes" ADD COLUMN IF NOT EXISTS product_names JSONB DEFAULT '[]'::jsonb;
    `).catch(() => {});
    voucherScopesTableReady = true;
  } catch (err) {
    console.warn('[Voucher] Không thể khởi tạo bảng VoucherScopes:', err);
  }
}

interface VoucherScopeMeta {
  scope: 'ALL' | 'CATEGORY' | 'SPECIFIC_PRODUCTS';
  categoryScopeName: string | null;
  productIds: string[];
  productNames: string[];
}

async function getVoucherScopeMap(voucherIds: string[]): Promise<Map<string, VoucherScopeMeta>> {
  const map = new Map<string, VoucherScopeMeta>();
  if (!voucherIds.length) return map;
  try {
    await ensureVoucherScopesTable();
    const rows: any[] = await prisma.$queryRawUnsafe<any[]>(
      `SELECT voucher_id, scope, category_scope_name, product_ids, product_names FROM "VoucherScopes" WHERE voucher_id = ANY($1::text[]);`,
      voucherIds
    );
    for (const r of rows) {
      const rawScope = String(r.scope || 'ALL').toUpperCase();
      const scope: VoucherScopeMeta['scope'] =
        rawScope === 'CATEGORY'
          ? 'CATEGORY'
          : rawScope === 'SPECIFIC_PRODUCTS'
            ? 'SPECIFIC_PRODUCTS'
            : 'ALL';
      const productIds = Array.isArray(r.product_ids) ? r.product_ids.map((x: any) => String(x)).filter(Boolean) : [];
      const productNames = Array.isArray(r.product_names) ? r.product_names.map((x: any) => String(x)).filter(Boolean) : [];
      map.set(String(r.voucher_id), {
        scope,
        categoryScopeName: r.category_scope_name || null,
        productIds,
        productNames
      });
    }
  } catch (err) {
    console.warn('[Voucher] Lỗi đọc VoucherScopes:', err);
  }
  return map;
}

async function upsertVoucherScope(
  voucherId: string,
  scope?: string,
  categoryScopeName?: string | null,
  productIds?: any[],
  productNames?: any[]
): Promise<void> {
  try {
    await ensureVoucherScopesTable();
    const rawScope = String(scope || 'ALL').toUpperCase();
    const cleanScope: VoucherScopeMeta['scope'] =
      rawScope === 'CATEGORY'
        ? 'CATEGORY'
        : rawScope === 'SPECIFIC_PRODUCTS'
          ? 'SPECIFIC_PRODUCTS'
          : 'ALL';
    const cleanCat = cleanScope === 'CATEGORY' && categoryScopeName ? String(categoryScopeName).trim() : null;
    const cleanProdIds = cleanScope === 'SPECIFIC_PRODUCTS' && Array.isArray(productIds)
      ? Array.from(new Set(productIds.map(x => String(x || '').trim()).filter(Boolean)))
      : [];
    const cleanProdNames = cleanScope === 'SPECIFIC_PRODUCTS' && Array.isArray(productNames)
      ? productNames.map(x => String(x || '').trim()).filter(Boolean)
      : [];
    await prisma.$executeRawUnsafe(
      `INSERT INTO "VoucherScopes" (voucher_id, scope, category_scope_name, product_ids, product_names, updated_at)
       VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, NOW())
       ON CONFLICT (voucher_id) DO UPDATE
       SET scope = EXCLUDED.scope,
           category_scope_name = EXCLUDED.category_scope_name,
           product_ids = EXCLUDED.product_ids,
           product_names = EXCLUDED.product_names,
           updated_at = NOW();`,
      voucherId,
      cleanScope,
      cleanCat,
      JSON.stringify(cleanProdIds),
      JSON.stringify(cleanProdNames)
    );
  } catch (err) {
    console.warn('[Voucher] Lỗi lưu VoucherScopes:', err);
  }
}

function formatStoreVoucher(v: any) {
  const isFreeShip = isFreeshipVoucher(v.code);
  const minVal = Number(v.minOrderValue || 0);
  const discVal = Number(v.discountValue || 0);
  const capVal = v.maxDiscountCap ? Number(v.maxDiscountCap) : undefined;
  const productIds: string[] = Array.isArray(v.productIds) ? v.productIds : [];
  const productNames: string[] = Array.isArray(v.productNames) ? v.productNames : [];
  const scope: 'ALL' | 'CATEGORY' | 'SPECIFIC_PRODUCTS' =
    v.scope === 'SPECIFIC_PRODUCTS' && productIds.length > 0
      ? 'SPECIFIC_PRODUCTS'
      : v.scope === 'CATEGORY' && v.categoryScopeName
        ? 'CATEGORY'
        : 'ALL';
  const categoryScopeName = scope === 'CATEGORY' ? v.categoryScopeName : undefined;

  const scopeSuffix =
    scope === 'CATEGORY' && categoryScopeName
      ? `Danh mục ${categoryScopeName}`
      : scope === 'SPECIFIC_PRODUCTS'
        ? (productNames.length === 1
            ? `Sản phẩm ${productNames[0]}`
            : `Áp dụng cho ${productIds.length} sản phẩm chọn lọc`)
        : '';

  let name = '';
  let description = '';

  if (isFreeShip) {
    if (discVal >= 250000) {
      name = 'Miễn phí vận chuyển toàn quốc';
      description = minVal > 0
        ? `Đơn hàng từ ${formatCurrencyVN(minVal)} (Miễn phí 100% ship)`
        : 'Miễn phí 100% phí vận chuyển';
    } else {
      name = `Hỗ trợ phí vận chuyển ${formatCurrencyVN(discVal)}`;
      description = minVal > 0
        ? `Đơn hàng từ ${formatCurrencyVN(minVal)} (Giảm ${formatCurrencyVN(discVal)} phí ship)`
        : `Giảm ${formatCurrencyVN(discVal)} phí vận chuyển`;
    }
  } else if (v.discountType === 'PERCENT') {
    name = `Giảm ${discVal}% giá trị đơn hàng`;
    const parts: string[] = [];
    if (minVal > 0) parts.push(`Đơn hàng từ ${formatCurrencyVN(minVal)}`);
    else parts.push('Áp dụng cho mọi đơn hàng');
    if (capVal && capVal > 0) parts.push(`Giảm tối đa ${formatCurrencyVN(capVal)}`);
    if (scopeSuffix) parts.push(scopeSuffix);
    description = parts.join(' • ');
  } else {
    name = `Giảm trực tiếp ${formatCurrencyVN(discVal)}`;
    const parts: string[] = [];
    parts.push(minVal > 0 ? `Đơn hàng từ ${formatCurrencyVN(minVal)}` : 'Áp dụng cho mọi đơn hàng');
    if (scopeSuffix) parts.push(scopeSuffix);
    description = parts.join(' • ');
  }

  return {
    id: v.id,
    code: v.code,
    name,
    description,
    discountType: v.discountType === 'PERCENT' ? 'PERCENT' : 'AMOUNT',
    discountValue: discVal,
    minOrderValue: minVal,
    maxDiscountAmount: capVal,
    scope,
    categoryScopeName,
    productIds: scope === 'SPECIFIC_PRODUCTS' ? productIds : [],
    productNames: scope === 'SPECIFIC_PRODUCTS' ? productNames : [],
    startDate: getVnDateString(new Date(v.startDate)),
    endDate: getVnDateString(new Date(v.endDate)),
    expiry: formatDateVN(v.endDate),
    usageLimit: Number(v.usageLimit || 0),
    usedCount: Number(v.usedCount || 0),
    perCustomerLimit: Number(v.perCustomerLimit || 1),
    isStackableWithFlashSale: !!v.isStackableWithFlashSale,
    isActive: !!v.isActive,
    isFreeShip
  };
}

let freeshipSeeded = false;
export async function ensureDefaultFreeshipVouchers(): Promise<void> {
  if (freeshipSeeded) return;
  try {
    const defaults = [
      {
        code: 'FREESHIP',
        discountType: 'FIXED_AMOUNT',
        discountValue: 250000,
        maxDiscountCap: null,
        minOrderValue: 5000000,
        startDate: new Date('2026-01-01T00:00:00.000+07:00'),
        endDate: new Date('2026-12-31T23:59:59.999+07:00'),
        usageLimit: 500,
        usedCount: 0,
        perCustomerLimit: 5,
        isStackableWithFlashSale: true,
        isActive: true
      },
      {
        code: 'FREESHIP50',
        discountType: 'FIXED_AMOUNT',
        discountValue: 125000,
        maxDiscountCap: null,
        minOrderValue: 2000000,
        startDate: new Date('2026-01-01T00:00:00.000+07:00'),
        endDate: new Date('2026-12-31T23:59:59.999+07:00'),
        usageLimit: 500,
        usedCount: 0,
        perCustomerLimit: 5,
        isStackableWithFlashSale: true,
        isActive: true
      }
    ];

    for (const item of defaults) {
      const exists = await (prisma as any).voucher.findUnique({ where: { code: item.code } });
      if (!exists) {
        await (prisma as any).voucher.create({ data: item });
      }
    }
    freeshipSeeded = true;
  } catch (err) {
    console.warn('[Voucher] Không thể khởi tạo mã FREESHIP mặc định:', err);
  }
}

export const voucherController = {
  // Lấy danh sách voucher đang hoạt động cho Storefront (PostgreSQL thật, đồng bộ trực tiếp với Admin)
  getStorePromotions: async (req: Request, res: Response): Promise<void> => {
    try {
      await ensureDefaultFreeshipVouchers();
      const vouchers = await (prisma as any).voucher.findMany({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' }
      });

      const now = new Date();
      const scopeMap = await getVoucherScopeMap(vouchers.map((v: any) => v.id));
      const activeList = vouchers
        .filter((v: any) => {
          const { start, end } = getVoucherEffectiveRange(v.startDate, v.endDate);
          const isDateValid = start <= now && now <= end;
          const isQuotaValid = !v.usageLimit || v.usageLimit <= 0 || (v.usedCount || 0) < v.usageLimit;
          return isDateValid && isQuotaValid;
        })
        .map((v: any) => {
          const sc = scopeMap.get(v.id);
          return formatStoreVoucher({
            ...v,
            scope: sc?.scope || 'ALL',
            categoryScopeName: sc?.categoryScopeName || null,
            productIds: sc?.productIds || [],
            productNames: sc?.productNames || []
          });
        });

      res.json(activeList);
    } catch (error: any) {
      console.error('[ERROR] Lấy danh sách khuyến mãi Store thất bại:', error);
      res.status(500).json({ message: 'Không thể tải danh sách khuyến mãi.', error: error.message });
    }
  },

  // Lấy toàn bộ danh sách voucher (Admin)
  getVouchers: async (req: Request, res: Response): Promise<void> => {
    try {
      await ensureDefaultFreeshipVouchers();
      const { search, status } = req.query;
      const where: any = {};

      if (search && typeof search === 'string') {
        where.code = { contains: search.trim().toUpperCase(), mode: 'insensitive' };
      }

      if (status === 'ACTIVE') {
        where.isActive = true;
      } else if (status === 'INACTIVE') {
        where.isActive = false;
      }

      const vouchers = await (prisma as any).voucher.findMany({
        where,
        orderBy: { createdAt: 'desc' }
      });

      const scopeMap = await getVoucherScopeMap(vouchers.map((v: any) => v.id));
      const enriched = vouchers.map((v: any) => {
        const sc = scopeMap.get(v.id);
        return {
          ...v,
          scope: sc?.scope || 'ALL',
          categoryScopeName: sc?.categoryScopeName || null,
          productIds: sc?.productIds || [],
          productNames: sc?.productNames || []
        };
      });

      res.json(enriched);
    } catch (error: any) {
      console.error('[ERROR] Lấy danh sách voucher thất bại:', error);
      res.status(500).json({ message: 'Không thể tải danh sách voucher từ cơ sở dữ liệu.', error: error.message });
    }
  },

  // Tạo voucher mới (Admin)
  createVoucher: async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        code,
        discountType,
        discountValue,
        maxDiscountCap,
        minOrderValue,
        startDate,
        endDate,
        usageLimit,
        perCustomerLimit,
        isStackableWithFlashSale,
        isActive,
        scope,
        categoryScopeName,
        productIds,
        productNames
      } = req.body;

      if (!code || !discountType || discountValue === undefined) {
        res.status(400).json({ message: 'Vui lòng cung cấp mã voucher, loại giảm giá và mức giảm.' });
        return;
      }

      const cleanCode = String(code).trim().toUpperCase().replace(/\s+/g, '');
      const numDiscountValue = Number(discountValue);

      if (numDiscountValue <= 0) {
        res.status(400).json({ message: 'Mức giảm giá phải lớn hơn 0.' });
        return;
      }

      if (discountType === 'PERCENT' && numDiscountValue > 100) {
        res.status(400).json({ message: 'Phần trăm giảm không được vượt quá 100%.' });
        return;
      }

      // Kiểm tra trùng mã
      const existing = await (prisma as any).voucher.findUnique({
        where: { code: cleanCode }
      });
      if (existing) {
        res.status(409).json({ message: `Mã voucher "${cleanCode}" đã tồn tại trong hệ thống.` });
        return;
      }

      const parsedStart = parseVoucherStartDate(startDate);
      const parsedEnd = parseVoucherEndDate(endDate);

      const voucher = await (prisma as any).voucher.create({
        data: {
          code: cleanCode,
          discountType: discountType === 'PERCENT' ? 'PERCENT' : 'FIXED_AMOUNT',
          discountValue: numDiscountValue,
          maxDiscountCap: maxDiscountCap ? Number(maxDiscountCap) : null,
          minOrderValue: minOrderValue ? Number(minOrderValue) : 0,
          startDate: parsedStart,
          endDate: parsedEnd,
          usageLimit: usageLimit ? Number(usageLimit) : 100,
          usedCount: 0,
          perCustomerLimit: perCustomerLimit ? Number(perCustomerLimit) : 1,
          isStackableWithFlashSale: !!isStackableWithFlashSale,
          isActive: isActive !== undefined ? !!isActive : true
        }
      });

      await upsertVoucherScope(voucher.id, scope, categoryScopeName, productIds, productNames);
      const createdScopeMap = await getVoucherScopeMap([voucher.id]);
      const createdSc = createdScopeMap.get(voucher.id);

      res.status(201).json({
        ...voucher,
        scope: createdSc?.scope || 'ALL',
        categoryScopeName: createdSc?.categoryScopeName || null,
        productIds: createdSc?.productIds || [],
        productNames: createdSc?.productNames || []
      });
    } catch (error: any) {
      console.error('[ERROR] Tạo voucher thất bại:', error);
      res.status(500).json({ message: 'Không thể tạo voucher.', error: error.message });
    }
  },

  // Sửa voucher hoặc bật/tắt trạng thái (Admin)
  updateVoucher: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const {
        code,
        discountType,
        discountValue,
        maxDiscountCap,
        minOrderValue,
        startDate,
        endDate,
        usageLimit,
        usedCount,
        perCustomerLimit,
        isStackableWithFlashSale,
        isActive,
        scope,
        categoryScopeName,
        productIds,
        productNames
      } = req.body;

      const existing = await (prisma as any).voucher.findUnique({ where: { id } });
      if (!existing) {
        res.status(404).json({ message: 'Không tìm thấy voucher cần cập nhật.' });
        return;
      }

      const updateData: any = {};
      if (code) {
        const cleanCode = String(code).trim().toUpperCase().replace(/\s+/g, '');
        if (cleanCode !== existing.code) {
          const dup = await (prisma as any).voucher.findUnique({ where: { code: cleanCode } });
          if (dup) {
            res.status(409).json({ message: `Mã voucher "${cleanCode}" đã tồn tại trong hệ thống.` });
            return;
          }
        }
        updateData.code = cleanCode;
      }
      if (discountType) updateData.discountType = discountType === 'PERCENT' ? 'PERCENT' : 'FIXED_AMOUNT';
      if (discountValue !== undefined) updateData.discountValue = Number(discountValue);
      if (maxDiscountCap !== undefined) updateData.maxDiscountCap = maxDiscountCap ? Number(maxDiscountCap) : null;
      if (minOrderValue !== undefined) updateData.minOrderValue = Number(minOrderValue);
      if (startDate) updateData.startDate = parseVoucherStartDate(startDate);
      if (endDate) updateData.endDate = parseVoucherEndDate(endDate);
      if (usageLimit !== undefined) updateData.usageLimit = Number(usageLimit);
      if (usedCount !== undefined) updateData.usedCount = Number(usedCount);
      if (perCustomerLimit !== undefined) updateData.perCustomerLimit = Number(perCustomerLimit);
      if (isStackableWithFlashSale !== undefined) updateData.isStackableWithFlashSale = !!isStackableWithFlashSale;
      if (isActive !== undefined) updateData.isActive = !!isActive;

      const updated = await (prisma as any).voucher.update({
        where: { id },
        data: updateData
      });

      if (scope !== undefined || categoryScopeName !== undefined || productIds !== undefined || productNames !== undefined) {
        await upsertVoucherScope(updated.id, scope, categoryScopeName, productIds, productNames);
      }

      const scopeMap = await getVoucherScopeMap([updated.id]);
      const sc = scopeMap.get(updated.id);

      res.json({
        ...updated,
        scope: sc?.scope || 'ALL',
        categoryScopeName: sc?.categoryScopeName || null,
        productIds: sc?.productIds || [],
        productNames: sc?.productNames || []
      });
    } catch (error: any) {
      console.error('[ERROR] Cập nhật voucher thất bại:', error);
      res.status(500).json({ message: 'Không thể cập nhật voucher.', error: error.message });
    }
  },

  // Xóa voucher (Admin)
  deleteVoucher: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const existing = await (prisma as any).voucher.findUnique({ where: { id } });
      if (!existing) {
        res.status(404).json({ message: 'Không tìm thấy voucher để xóa.' });
        return;
      }

      await (prisma as any).voucher.delete({ where: { id } });
      await prisma.$executeRawUnsafe(`DELETE FROM "VoucherScopes" WHERE voucher_id = $1;`, id).catch(() => {});
      res.json({ success: true, message: `Đã xóa voucher ${existing.code} thành công.` });
    } catch (error: any) {
      console.error('[ERROR] Xóa voucher thất bại:', error);
      res.status(500).json({ message: 'Không thể xóa voucher.', error: error.message });
    }
  },

  // Kiểm tra mã voucher và tính số tiền giảm thực tế (Storefront Checkout)
  verifyVoucher: async (req: Request, res: Response): Promise<void> => {
    try {
      await ensureDefaultFreeshipVouchers();
      const { code, orderTotal, customerId, phone, items } = req.body;

      if (!code || typeof code !== 'string') {
        res.status(400).json({ valid: false, message: 'Vui lòng cung cấp mã voucher.' });
        return;
      }

      const cleanCode = code.trim().toUpperCase().replace(/\s+/g, '');
      const total = Number(orderTotal) || 0;

      const voucher = await (prisma as any).voucher.findUnique({
        where: { code: cleanCode }
      });

      if (!voucher) {
        res.json({ valid: false, message: `Mã giảm giá "${cleanCode}" không tồn tại trên hệ thống.` });
        return;
      }

      if (!voucher.isActive) {
        res.json({ valid: false, message: `Mã giảm giá "${cleanCode}" hiện đang tạm dừng hoặc không còn hiệu lực.` });
        return;
      }

      const now = new Date();
      const { start, end } = getVoucherEffectiveRange(voucher.startDate, voucher.endDate);
      if (start > now) {
        res.json({ valid: false, message: `Mã giảm giá "${cleanCode}" chưa đến ngày áp dụng (từ ${formatDateVN(voucher.startDate)}).` });
        return;
      }

      if (end < now) {
        res.json({ valid: false, message: `Mã giảm giá "${cleanCode}" đã hết hạn sử dụng.` });
        return;
      }

      if (voucher.usageLimit > 0 && voucher.usedCount >= voucher.usageLimit) {
        res.json({ valid: false, message: `Mã giảm giá "${cleanCode}" đã hết lượt sử dụng trên toàn sàn.` });
        return;
      }

      // Kiểm tra giới hạn lượt dùng trên mỗi khách hàng nếu có thông tin khách hàng
      if (voucher.perCustomerLimit > 0 && (customerId || phone)) {
        const customerUsedCount = await prisma.order.count({
          where: {
            status: { not: 'CANCELLED' },
            promoCode: { contains: voucher.code },
            ...(customerId ? { customerId: String(customerId) } : { phone: String(phone).trim() })
          }
        }).catch(() => 0);

        if (customerUsedCount >= voucher.perCustomerLimit) {
          res.json({
            valid: false,
            message: `Bạn đã sử dụng hết lượt cho phép (${voucher.perCustomerLimit} lượt) của mã "${cleanCode}".`
          });
          return;
        }
      }

      if (voucher.minOrderValue > 0 && total < voucher.minOrderValue) {
        const formattedMin = formatCurrencyVN(voucher.minOrderValue);
        res.json({
          valid: false,
          message: `Mã "${cleanCode}" yêu cầu giá trị đơn hàng tối thiểu từ ${formattedMin} (Đơn hiện tại: ${formatCurrencyVN(total)}).`
        });
        return;
      }

      const isFreeShip = isFreeshipVoucher(voucher.code);
      const scopeMap = await getVoucherScopeMap([voucher.id]);
      const sc = scopeMap.get(voucher.id);
      const voucherScope = sc?.scope || 'ALL';
      const voucherCategoryScope = sc?.categoryScopeName || null;
      const voucherProductIds = sc?.productIds || [];
      const voucherProductNames = sc?.productNames || [];

      // Kiểm tra phạm vi áp dụng (theo danh mục hoặc theo sản phẩm cụ thể) nếu giỏ hàng gửi kèm danh sách items
      let eligibleTotal = total;
      const cartItems: any[] = Array.isArray(items) ? items : [];

      if (voucherScope === 'SPECIFIC_PRODUCTS' && voucherProductIds.length > 0 && cartItems.length > 0) {
        const idSet = new Set(voucherProductIds.map(x => String(x).trim()));
        const nameSet = new Set(voucherProductNames.map(x => String(x).trim().toLowerCase()));
        const matchedItems = cartItems.filter(it => {
          const pid = String(it.productId || it.id || '').trim();
          const pname = String(it.productName || it.name || '').trim().toLowerCase();
          return (pid && idSet.has(pid)) || (pname && nameSet.has(pname));
        });

        if (matchedItems.length === 0) {
          res.json({
            valid: false,
            message: `Mã "${cleanCode}" chỉ áp dụng cho các sản phẩm chọn lọc, không áp dụng cho sản phẩm trong giỏ hàng hiện tại.`
          });
          return;
        }

        const matchedSubtotal = matchedItems.reduce(
          (sum, it) => sum + (Number(it.price || 0) * Math.max(1, Number(it.quantity || 1))),
          0
        );
        if (matchedSubtotal > 0) {
          eligibleTotal = matchedSubtotal;
        }
      } else if (voucherScope === 'CATEGORY' && voucherCategoryScope && cartItems.length > 0) {
        const targetCat = voucherCategoryScope.trim().toLowerCase();
        const itemProductIds = Array.from(
          new Set(cartItems.map(it => String(it.productId || it.id || '').trim()).filter(Boolean))
        );
        const dbProducts = itemProductIds.length > 0
          ? await prisma.product.findMany({
              where: { id: { in: itemProductIds } },
              select: {
                id: true,
                category: {
                  select: {
                    name: true,
                    parent: { select: { name: true } }
                  }
                }
              }
            }).catch(() => [])
          : [];

        const prodCatMap = new Map<string, string[]>();
        for (const p of dbProducts) {
          const names: string[] = [];
          if (p.category?.name) names.push(p.category.name.trim().toLowerCase());
          if (p.category?.parent?.name) names.push(p.category.parent.name.trim().toLowerCase());
          prodCatMap.set(p.id, names);
        }

        const matchedItems = cartItems.filter(it => {
          const pid = String(it.productId || it.id || '').trim();
          const dbCats = prodCatMap.get(pid) || [];
          const rawCat = String(it.categoryName || it.category || '').trim().toLowerCase();
          return dbCats.includes(targetCat) || rawCat === targetCat;
        });

        if (matchedItems.length === 0) {
          res.json({
            valid: false,
            message: `Mã "${cleanCode}" chỉ áp dụng cho sản phẩm thuộc danh mục "${voucherCategoryScope}".`
          });
          return;
        }

        const matchedSubtotal = matchedItems.reduce(
          (sum, it) => sum + (Number(it.price || 0) * Math.max(1, Number(it.quantity || 1))),
          0
        );
        if (matchedSubtotal > 0) {
          eligibleTotal = matchedSubtotal;
        }
      }

      // Tính mức chiết khấu dựa trên giá trị phần sản phẩm hợp lệ
      let discountAmount = 0;
      if (voucher.discountType === 'PERCENT') {
        discountAmount = Math.round((eligibleTotal * voucher.discountValue) / 100);
        if (voucher.maxDiscountCap && voucher.maxDiscountCap > 0) {
          discountAmount = Math.min(discountAmount, voucher.maxDiscountCap);
        }
      } else {
        // FIXED_AMOUNT
        discountAmount = isFreeShip
          ? voucher.discountValue
          : Math.min(voucher.discountValue, eligibleTotal);
      }

      const storeFormatted = formatStoreVoucher({
        ...voucher,
        scope: voucherScope,
        categoryScopeName: voucherCategoryScope,
        productIds: voucherProductIds,
        productNames: voucherProductNames
      });

      res.json({
        valid: true,
        success: true,
        code: voucher.code,
        name: storeFormatted.name,
        description: storeFormatted.description,
        discountType: voucher.discountType === 'PERCENT' ? 'PERCENT' : 'AMOUNT',
        discountValue: voucher.discountValue,
        maxDiscountAmount: voucher.maxDiscountCap || undefined,
        minOrderValue: voucher.minOrderValue,
        scope: storeFormatted.scope,
        categoryScopeName: storeFormatted.categoryScopeName,
        productIds: storeFormatted.productIds,
        productNames: storeFormatted.productNames,
        discountAmount,
        calculatedDiscount: discountAmount,
        isFreeShip,
        message: isFreeShip
          ? `Áp dụng mã ${voucher.code} thành công! Hỗ trợ ${formatCurrencyVN(discountAmount)} phí vận chuyển.`
          : `Áp dụng mã ${voucher.code} thành công! Tiết kiệm ${formatCurrencyVN(discountAmount)}.`,
        voucher: {
          id: voucher.id,
          code: voucher.code,
          name: storeFormatted.name,
          discountType: voucher.discountType,
          discountValue: voucher.discountValue,
          maxDiscountCap: voucher.maxDiscountCap,
          maxDiscountAmount: voucher.maxDiscountCap || undefined,
          minOrderValue: voucher.minOrderValue,
          scope: storeFormatted.scope,
          categoryScopeName: storeFormatted.categoryScopeName,
          productIds: storeFormatted.productIds,
          productNames: storeFormatted.productNames,
          isFreeShip,
          isStackableWithFlashSale: voucher.isStackableWithFlashSale
        }
      });
    } catch (error: any) {
      console.error('[ERROR] Xác thực voucher thất bại:', error);
      res.status(500).json({ valid: false, message: 'Lỗi hệ thống khi kiểm tra mã voucher.', error: error.message });
    }
  }
};
