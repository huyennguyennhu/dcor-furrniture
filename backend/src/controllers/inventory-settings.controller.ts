import { Request, Response } from 'express';
import prisma, { withDbRetry } from '../lib/prisma';
import { initInventorySettingsDatabase } from '../lib/init-inventory-settings-db';

// Biến cờ bảo đảm DB được init ít nhất 1 lần
let isDbInitialized = false;
async function ensureDbInit() {
  if (!isDbInitialized) {
    try {
      await initInventorySettingsDatabase();
      isDbInitialized = true;
    } catch (e) {
      console.warn('[InventorySettings] Lỗi ensureDbInit:', e);
    }
  }
}

export const inventorySettingsController = {
  // =========================================================================
  // TAB 1: 🏬 ĐIỂM KHO & CHI NHÁNH (WAREHOUSES & LOCATIONS)
  // =========================================================================

  getWarehouses: async (req: Request, res: Response) => {
    try {
      await ensureDbInit();
      const warehouses = await withDbRetry(async () => {
        return await (prisma as any).warehouse.findMany({
          orderBy: { createdAt: 'asc' },
          include: {
            _count: {
              select: {
                sourceOrders: true,
                destOrders: true,
                audits: true,
                transactions: true,
                stocks: true
              }
            }
          }
        });
      });

      const formatted = warehouses.map((w: any) => {
        const totalTxCount = (w._count?.sourceOrders || 0) + 
                            (w._count?.destOrders || 0) + 
                            (w._count?.audits || 0) + 
                            (w._count?.transactions || 0);
        return {
          id: w.id,
          code: w.code,
          name: w.name,
          type: w.type,
          typeName: w.type === 'CENTRAL_WAREHOUSE' ? 'Kho tổng' : (w.type === 'REGIONAL_WAREHOUSE' ? 'Kho khu vực' : 'Showroom'),
          address: w.address,
          phone: w.phone || '',
          managerName: w.managerName || '',
          isActive: Boolean(w.isActive ?? true),
          isDefault: Boolean(w.isDefault ?? false),
          stockSkusCount: w._count?.stocks || 0,
          transactionCount: totalTxCount,
          hasTransactions: totalTxCount > 0,
          createdAt: w.createdAt,
          updatedAt: w.updatedAt
        };
      });

      const totalCount = formatted.length;
      const activeCount = formatted.filter((w: any) => w.isActive).length;
      const centralCount = formatted.filter((w: any) => w.type === 'CENTRAL_WAREHOUSE').length;
      const showroomCount = formatted.filter((w: any) => w.type === 'SHOWROOM').length;

      res.json({
        warehouses: formatted,
        summary: {
          totalCount,
          activeCount,
          inactiveCount: totalCount - activeCount,
          centralCount,
          showroomCount
        }
      });
    } catch (error) {
      console.error('Error in getWarehouses:', error);
      res.status(500).json({ error: 'Không thể tải danh sách điểm kho' });
    }
  },

  createWarehouse: async (req: Request, res: Response) => {
    try {
      await ensureDbInit();
      const { code, name, type, address, phone, managerName, isDefault } = req.body;

      if (!code || !code.trim()) {
        return res.status(400).json({ error: 'Mã kho không được để trống' });
      }
      if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Tên kho không được để trống' });
      }
      if (!address || !address.trim()) {
        return res.status(400).json({ error: 'Địa chỉ chi tiết không được để trống' });
      }

      const normCode = code.trim().toUpperCase().replace(/\s+/g, '_');
      const normType = ['CENTRAL_WAREHOUSE', 'REGIONAL_WAREHOUSE', 'SHOWROOM'].includes(type) ? type : 'REGIONAL_WAREHOUSE';
      const markDefault = Boolean(isDefault);

      // Kiểm tra trùng mã kho
      const existing = await (prisma as any).warehouse.findUnique({
        where: { code: normCode }
      });
      if (existing) {
        return res.status(400).json({ error: `Mã kho "${normCode}" đã tồn tại. Vui lòng chọn mã khác.` });
      }

      // Nếu đặt làm kho mặc định -> reset các kho khác
      if (markDefault) {
        await prisma.$executeRawUnsafe(`UPDATE "Warehouse" SET "isDefault" = FALSE`);
      }

      const newWh = await (prisma as any).warehouse.create({
        data: {
          code: normCode,
          name: name.trim(),
          type: normType,
          address: address.trim(),
          phone: (phone || '').trim() || null,
          managerName: (managerName || '').trim() || null,
          isActive: true,
          isDefault: markDefault
        }
      });

      res.json({
        success: true,
        message: 'Tạo điểm kho mới thành công!',
        warehouse: newWh
      });
    } catch (error: any) {
      console.error('Error in createWarehouse:', error);
      res.status(500).json({ error: error.message || 'Không thể tạo điểm kho mới' });
    }
  },

  updateWarehouse: async (req: Request, res: Response) => {
    try {
      await ensureDbInit();
      const { id } = req.params;
      const { code, name, type, address, phone, managerName, isDefault, isActive } = req.body;

      if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Tên kho không được để trống' });
      }

      const existing = await (prisma as any).warehouse.findUnique({ where: { id } });
      if (!existing) {
        return res.status(404).json({ error: 'Không tìm thấy điểm kho cần sửa' });
      }

      const normCode = code ? code.trim().toUpperCase().replace(/\s+/g, '_') : existing.code;
      if (normCode !== existing.code) {
        const codeExisted = await (prisma as any).warehouse.findUnique({ where: { code: normCode } });
        if (codeExisted) {
          return res.status(400).json({ error: `Mã kho "${normCode}" đã tồn tại.` });
        }
      }

      const markDefault = Boolean(isDefault);
      if (markDefault) {
        await prisma.$executeRawUnsafe(`UPDATE "Warehouse" SET "isDefault" = FALSE WHERE id <> $1`, id);
      }

      const updated = await (prisma as any).warehouse.update({
        where: { id },
        data: {
          code: normCode,
          name: name.trim(),
          type: type || existing.type,
          address: address ? address.trim() : existing.address,
          phone: phone !== undefined ? (phone ? phone.trim() : null) : existing.phone,
          managerName: managerName !== undefined ? (managerName ? managerName.trim() : null) : existing.managerName,
          isActive: isActive !== undefined ? Boolean(isActive) : existing.isActive,
          isDefault: markDefault
        }
      });

      res.json({
        success: true,
        message: 'Cập nhật điểm kho thành công!',
        warehouse: updated
      });
    } catch (error: any) {
      console.error('Error in updateWarehouse:', error);
      res.status(500).json({ error: error.message || 'Không thể cập nhật điểm kho' });
    }
  },

  toggleWarehouseActive: async (req: Request, res: Response) => {
    try {
      await ensureDbInit();
      const { id } = req.params;
      const wh = await (prisma as any).warehouse.findUnique({ where: { id } });
      if (!wh) {
        return res.status(404).json({ error: 'Không tìm thấy điểm kho' });
      }

      const newStatus = !wh.isActive;
      // Không cho tắt kho mặc định
      if (!newStatus && wh.isDefault) {
        return res.status(400).json({ error: 'Đây là Điểm kho Mặc định. Vui lòng đặt kho khác làm mặc định trước khi tắt kho này!' });
      }

      const updated = await (prisma as any).warehouse.update({
        where: { id },
        data: { isActive: newStatus }
      });

      res.json({
        success: true,
        message: `Đã ${newStatus ? 'kích hoạt' : 'tạm dừng'} điểm kho "${wh.name}"`,
        warehouse: updated
      });
    } catch (error: any) {
      console.error('Error in toggleWarehouseActive:', error);
      res.status(500).json({ error: 'Không thể thay đổi trạng thái điểm kho' });
    }
  },

  deleteWarehouse: async (req: Request, res: Response) => {
    try {
      await ensureDbInit();
      const { id } = req.params;
      const wh = await (prisma as any).warehouse.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              sourceOrders: true,
              destOrders: true,
              audits: true,
              transactions: true
            }
          }
        }
      });

      if (!wh) {
        return res.status(404).json({ error: 'Không tìm thấy điểm kho cần xóa' });
      }

      if (wh.isDefault) {
        return res.status(400).json({ error: 'Không thể xóa Kho mặc định của hệ thống. Hãy chỉ định một kho khác làm mặc định trước.' });
      }

      const totalTransactions = (wh._count?.sourceOrders || 0) + 
                                (wh._count?.destOrders || 0) + 
                                (wh._count?.audits || 0) + 
                                (wh._count?.transactions || 0);

      if (totalTransactions > 0) {
        return res.status(400).json({
          hasTransactions: true,
          error: `Điểm kho "${wh.name}" đã phát sinh ${totalTransactions} chứng từ/giao dịch trong lịch sử. Để bảo toàn số liệu kế toán, hệ thống không cho phép xóa vĩnh viễn. Vui lòng chuyển sang "Tạm dừng hoạt động".`
        });
      }

      // Xóa liên kết stocks nếu có
      await prisma.$executeRawUnsafe(`DELETE FROM "WarehouseStock" WHERE "warehouseId" = $1`, id);
      await (prisma as any).warehouse.delete({ where: { id } });

      res.json({
        success: true,
        message: `Đã xóa điểm kho "${wh.name}" thành công!`
      });
    } catch (error: any) {
      console.error('Error in deleteWarehouse:', error);
      res.status(500).json({ error: 'Không thể xóa điểm kho' });
    }
  },

  // =========================================================================
  // TAB 2, 3, 4: DANH MỤC LÝ DO XUẤT / NHẬP / KIỂM KÊ (INVENTORY REASONS)
  // =========================================================================

  getReasons: async (req: Request, res: Response) => {
    try {
      await ensureDbInit();
      const type = (req.query.type as string || '').toUpperCase().trim();
      let query = `SELECT id, type, reason, prefix, requires_partner as "requiresPartner", 
                          partner_label as "partnerLabel", is_active as "isActive", 
                          is_system as "isSystem", created_at as "createdAt"
                   FROM inventory_reasons `;
      const params: any[] = [];
      if (['EXPORT', 'IMPORT', 'AUDIT'].includes(type)) {
        query += `WHERE type = $1 `;
        params.push(type);
      }
      query += `ORDER BY is_system DESC, created_at ASC`;

      const reasons = await prisma.$queryRawUnsafe<any[]>(query, ...params);
      res.json({ reasons: reasons || [] });
    } catch (error) {
      console.error('Error in getReasons:', error);
      res.status(500).json({ error: 'Không thể lấy danh mục lý do kho' });
    }
  },

  createReason: async (req: Request, res: Response) => {
    try {
      await ensureDbInit();
      const { type, reason, prefix, requiresPartner, partnerLabel } = req.body;
      const normType = String(type || '').toUpperCase().trim();

      if (!['EXPORT', 'IMPORT', 'AUDIT'].includes(normType)) {
        return res.status(400).json({ error: 'Loại danh mục không hợp lệ (Phải là EXPORT, IMPORT hoặc AUDIT)' });
      }
      if (!reason || !reason.trim()) {
        return res.status(400).json({ error: 'Tên lý do không được để trống' });
      }
      if (!prefix || !prefix.trim()) {
        return res.status(400).json({ error: 'Tiền tố chứng từ (Prefix) không được để trống' });
      }

      const trimmedReason = reason.trim();
      const normPrefix = prefix.trim().toUpperCase().replace(/\s+/g, '-');
      const reqPartner = normType === 'AUDIT' ? false : Boolean(requiresPartner);
      const label = reqPartner ? ((partnerLabel && partnerLabel.trim()) ? partnerLabel.trim() : (normType === 'IMPORT' ? 'Nhà cung ứng' : 'Khách hàng')) : null;
      const id = normType.toLowerCase().slice(0, 3) + '_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);

      // Kiểm tra trùng
      const exists = await prisma.$queryRawUnsafe<any[]>(
        `SELECT id FROM inventory_reasons WHERE type = $1 AND reason = $2`,
        normType, trimmedReason
      );
      if (exists && exists.length > 0) {
        return res.status(400).json({ error: `Lý do "${trimmedReason}" đã tồn tại trong danh mục này.` });
      }

      await prisma.$executeRawUnsafe(
        `INSERT INTO inventory_reasons (id, type, reason, prefix, requires_partner, partner_label, is_active, is_system)
         VALUES ($1, $2, $3, $4, $5, $6, TRUE, FALSE)`,
        id, normType, trimmedReason, normPrefix, reqPartner, label
      );

      res.json({
        success: true,
        message: 'Thêm lý do mới thành công!',
        reason: {
          id,
          type: normType,
          reason: trimmedReason,
          prefix: normPrefix,
          requiresPartner: reqPartner,
          partnerLabel: label,
          isActive: true,
          isSystem: false
        }
      });
    } catch (error: any) {
      console.error('Error in createReason:', error);
      res.status(500).json({ error: error.message || 'Không thể tạo lý do mới' });
    }
  },

  updateReason: async (req: Request, res: Response) => {
    try {
      await ensureDbInit();
      const { id } = req.params;
      const { reason, prefix, requiresPartner, partnerLabel, isActive } = req.body;

      if (!reason || !reason.trim()) {
        return res.status(400).json({ error: 'Tên lý do không được để trống' });
      }
      if (!prefix || !prefix.trim()) {
        return res.status(400).json({ error: 'Tiền tố chứng từ (Prefix) không được để trống' });
      }

      const existing = await prisma.$queryRawUnsafe<any[]>(
        `SELECT * FROM inventory_reasons WHERE id = $1`, id
      );
      if (!existing || existing.length === 0) {
        return res.status(404).json({ error: 'Không tìm thấy lý do cần sửa' });
      }

      const trimmedReason = reason.trim();
      const normPrefix = prefix.trim().toUpperCase().replace(/\s+/g, '-');
      const reqPartner = Boolean(requiresPartner);
      const label = reqPartner ? ((partnerLabel && partnerLabel.trim()) ? partnerLabel.trim() : 'Đối tác') : null;
      const activeState = isActive !== undefined ? Boolean(isActive) : existing[0].is_active;

      await prisma.$executeRawUnsafe(
        `UPDATE inventory_reasons 
         SET reason = $1, prefix = $2, requires_partner = $3, partner_label = $4, is_active = $5, updated_at = NOW()
         WHERE id = $6`,
        trimmedReason, normPrefix, reqPartner, label, activeState, id
      );

      res.json({
        success: true,
        message: 'Cập nhật lý do thành công!'
      });
    } catch (error: any) {
      console.error('Error in updateReason:', error);
      res.status(500).json({ error: error.message || 'Không thể cập nhật lý do' });
    }
  },

  toggleReasonActive: async (req: Request, res: Response) => {
    try {
      await ensureDbInit();
      const { id } = req.params;
      const existing = await prisma.$queryRawUnsafe<any[]>(
        `SELECT id, reason, is_active as "isActive" FROM inventory_reasons WHERE id = $1`, id
      );
      if (!existing || existing.length === 0) {
        return res.status(404).json({ error: 'Không tìm thấy lý do' });
      }

      const newStatus = !existing[0].isActive;
      await prisma.$executeRawUnsafe(
        `UPDATE inventory_reasons SET is_active = $1, updated_at = NOW() WHERE id = $2`,
        newStatus, id
      );

      res.json({
        success: true,
        message: `Đã ${newStatus ? 'bật' : 'tắt'} lý do "${existing[0].reason}"`,
        isActive: newStatus
      });
    } catch (error: any) {
      console.error('Error in toggleReasonActive:', error);
      res.status(500).json({ error: 'Không thể đổi trạng thái lý do' });
    }
  },

  deleteReason: async (req: Request, res: Response) => {
    try {
      await ensureDbInit();
      const { id } = req.params;
      const existing = await prisma.$queryRawUnsafe<any[]>(
        `SELECT id, reason, is_system as "isSystem" FROM inventory_reasons WHERE id = $1`, id
      );
      if (!existing || existing.length === 0) {
        return res.status(404).json({ error: 'Không tìm thấy lý do cần xóa' });
      }

      if (existing[0].isSystem) {
        return res.status(400).json({
          error: `Lý do "${existing[0].reason}" là danh mục chuẩn của hệ thống, không thể xóa. Bạn có thể gạt công tắc "Tắt" để ẩn khỏi dropdown làm phiếu.`
        });
      }

      await prisma.$executeRawUnsafe(`DELETE FROM inventory_reasons WHERE id = $1`, id);
      res.json({
        success: true,
        message: `Đã xóa lý do "${existing[0].reason}" thành công!`
      });
    } catch (error: any) {
      console.error('Error in deleteReason:', error);
      res.status(500).json({ error: 'Không thể xóa lý do' });
    }
  },

  // =========================================================================
  // TAB 5: 💰 CẤU HÌNH THUẾ SUẤT VAT (TAX RATES)
  // =========================================================================

  getTaxRates: async (req: Request, res: Response) => {
    try {
      await ensureDbInit();
      const taxes = await prisma.$queryRawUnsafe<any[]>(
        `SELECT id, code, name, rate, description, is_default as "isDefault", 
                is_active as "isActive", created_at as "createdAt"
         FROM tax_rates 
         ORDER BY is_default DESC, rate ASC`
      );

      // Lấy cấu hình chung
      const general = await prisma.$queryRawUnsafe<any[]>(
        `SELECT key, value FROM inventory_settings`
      );
      const settingsMap: Record<string, string> = {};
      (general || []).forEach((g: any) => {
        settingsMap[g.key] = g.value;
      });

      res.json({
        taxRates: (taxes || []).map((t: any) => ({
          ...t,
          rate: Number(t.rate)
        })),
        settings: {
          pricingTaxMode: settingsMap['pricing_tax_mode'] || 'EXCLUSIVE',
          autoZeroTaxInternal: settingsMap['auto_zero_tax_internal'] === 'true'
        }
      });
    } catch (error) {
      console.error('Error in getTaxRates:', error);
      res.status(500).json({ error: 'Không thể lấy danh mục thuế VAT' });
    }
  },

  createTaxRate: async (req: Request, res: Response) => {
    try {
      await ensureDbInit();
      const { code, name, rate, description, isDefault } = req.body;

      if (!code || !code.trim()) {
        return res.status(400).json({ error: 'Mã mức thuế không được để trống' });
      }
      if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Tên hiển thị thuế không được để trống' });
      }
      const numRate = Number(rate);
      if (isNaN(numRate) || numRate < 0 || numRate > 100) {
        return res.status(400).json({ error: 'Thuế suất (%) phải là số từ 0 đến 100' });
      }

      const normCode = code.trim().toUpperCase().replace(/\s+/g, '_');
      const markDefault = Boolean(isDefault);
      const id = 'tax_' + normCode.toLowerCase();

      const exists = await prisma.$queryRawUnsafe<any[]>(
        `SELECT id FROM tax_rates WHERE code = $1`, normCode
      );
      if (exists && exists.length > 0) {
        return res.status(400).json({ error: `Mã thuế "${normCode}" đã tồn tại.` });
      }

      if (markDefault) {
        await prisma.$executeRawUnsafe(`UPDATE tax_rates SET is_default = FALSE`);
      }

      await prisma.$executeRawUnsafe(
        `INSERT INTO tax_rates (id, code, name, rate, description, is_default, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, TRUE)`,
        id, normCode, name.trim(), numRate, (description || '').trim() || null, markDefault
      );

      res.json({
        success: true,
        message: 'Thêm mức thuế VAT mới thành công!',
        taxRate: {
          id,
          code: normCode,
          name: name.trim(),
          rate: numRate,
          description: description || '',
          isDefault: markDefault,
          isActive: true
        }
      });
    } catch (error: any) {
      console.error('Error in createTaxRate:', error);
      res.status(500).json({ error: error.message || 'Không thể tạo mức thuế mới' });
    }
  },

  updateTaxRate: async (req: Request, res: Response) => {
    try {
      await ensureDbInit();
      const { id } = req.params;
      const { name, rate, description, isDefault, isActive } = req.body;

      if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Tên hiển thị thuế không được để trống' });
      }
      const numRate = Number(rate);
      if (isNaN(numRate) || numRate < 0 || numRate > 100) {
        return res.status(400).json({ error: 'Thuế suất (%) phải là số từ 0 đến 100' });
      }

      const existing = await prisma.$queryRawUnsafe<any[]>(
        `SELECT * FROM tax_rates WHERE id = $1`, id
      );
      if (!existing || existing.length === 0) {
        return res.status(404).json({ error: 'Không tìm thấy mức thuế cần sửa' });
      }

      const markDefault = Boolean(isDefault);
      if (markDefault) {
        await prisma.$executeRawUnsafe(`UPDATE tax_rates SET is_default = FALSE WHERE id <> $1`, id);
      }

      const activeState = isActive !== undefined ? Boolean(isActive) : existing[0].is_active;

      await prisma.$executeRawUnsafe(
        `UPDATE tax_rates 
         SET name = $1, rate = $2, description = $3, is_default = $4, is_active = $5, updated_at = NOW()
         WHERE id = $6`,
        name.trim(), numRate, (description || '').trim() || null, markDefault, activeState, id
      );

      res.json({
        success: true,
        message: 'Cập nhật mức thuế VAT thành công!'
      });
    } catch (error: any) {
      console.error('Error in updateTaxRate:', error);
      res.status(500).json({ error: error.message || 'Không thể cập nhật mức thuế' });
    }
  },

  toggleTaxRateActive: async (req: Request, res: Response) => {
    try {
      await ensureDbInit();
      const { id } = req.params;
      const existing = await prisma.$queryRawUnsafe<any[]>(
        `SELECT id, name, is_default as "isDefault", is_active as "isActive" FROM tax_rates WHERE id = $1`, id
      );
      if (!existing || existing.length === 0) {
        return res.status(404).json({ error: 'Không tìm thấy mức thuế' });
      }

      const newStatus = !existing[0].isActive;
      if (!newStatus && existing[0].isDefault) {
        return res.status(400).json({ error: 'Đây là Mức thuế suất Mặc định. Vui lòng đặt mức thuế khác làm mặc định trước khi tắt!' });
      }

      await prisma.$executeRawUnsafe(
        `UPDATE tax_rates SET is_active = $1, updated_at = NOW() WHERE id = $2`,
        newStatus, id
      );

      res.json({
        success: true,
        message: `Đã ${newStatus ? 'bật' : 'tắt'} mức thuế "${existing[0].name}"`,
        isActive: newStatus
      });
    } catch (error: any) {
      console.error('Error in toggleTaxRateActive:', error);
      res.status(500).json({ error: 'Không thể đổi trạng thái mức thuế' });
    }
  },

  setDefaultTaxRate: async (req: Request, res: Response) => {
    try {
      await ensureDbInit();
      const { id } = req.params;
      const existing = await prisma.$queryRawUnsafe<any[]>(
        `SELECT id, name FROM tax_rates WHERE id = $1`, id
      );
      if (!existing || existing.length === 0) {
        return res.status(404).json({ error: 'Không tìm thấy mức thuế' });
      }

      await prisma.$executeRawUnsafe(`UPDATE tax_rates SET is_default = FALSE`);
      await prisma.$executeRawUnsafe(`UPDATE tax_rates SET is_default = TRUE, is_active = TRUE, updated_at = NOW() WHERE id = $1`, id);

      res.json({
        success: true,
        message: `Đã đặt "${existing[0].name}" làm Thuế suất Mặc định của hệ thống!`
      });
    } catch (error: any) {
      console.error('Error in setDefaultTaxRate:', error);
      res.status(500).json({ error: 'Không thể đặt thuế suất mặc định' });
    }
  },

  deleteTaxRate: async (req: Request, res: Response) => {
    try {
      await ensureDbInit();
      const { id } = req.params;
      const existing = await prisma.$queryRawUnsafe<any[]>(
        `SELECT id, name, is_default as "isDefault" FROM tax_rates WHERE id = $1`, id
      );
      if (!existing || existing.length === 0) {
        return res.status(404).json({ error: 'Không tìm thấy mức thuế' });
      }

      if (existing[0].isDefault) {
        return res.status(400).json({ error: 'Không thể xóa mức thuế Mặc định. Hãy đặt mức khác làm mặc định trước.' });
      }

      await prisma.$executeRawUnsafe(`DELETE FROM tax_rates WHERE id = $1`, id);
      res.json({
        success: true,
        message: `Đã xóa mức thuế "${existing[0].name}" thành công!`
      });
    } catch (error: any) {
      console.error('Error in deleteTaxRate:', error);
      res.status(500).json({ error: 'Không thể xóa mức thuế' });
    }
  },

  // =========================================================================
  // CẤU HÌNH QUY TẮC CHUNG (GENERAL SETTINGS)
  // =========================================================================

  saveGeneralSettings: async (req: Request, res: Response) => {
    try {
      await ensureDbInit();
      const { pricingTaxMode, autoZeroTaxInternal } = req.body;

      if (pricingTaxMode) {
        await prisma.$executeRawUnsafe(`
          INSERT INTO inventory_settings (key, value, description, updated_at)
          VALUES ('pricing_tax_mode', $1, 'Cơ chế tính thuế: EXCLUSIVE | INCLUSIVE', NOW())
          ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();
        `, String(pricingTaxMode));
      }

      if (autoZeroTaxInternal !== undefined) {
        await prisma.$executeRawUnsafe(`
          INSERT INTO inventory_settings (key, value, description, updated_at)
          VALUES ('auto_zero_tax_internal', $1, 'Tự động 0% VAT cho phiếu nội bộ', NOW())
          ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();
        `, String(Boolean(autoZeroTaxInternal)));
      }

      res.json({
        success: true,
        message: 'Đã lưu cấu hình chung thành công!'
      });
    } catch (error: any) {
      console.error('Error in saveGeneralSettings:', error);
      res.status(500).json({ error: 'Không thể lưu cấu hình chung' });
    }
  }
};
