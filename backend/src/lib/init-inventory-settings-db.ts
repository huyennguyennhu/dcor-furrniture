import prisma, { withDbRetry } from './prisma';

export async function initInventorySettingsDatabase() {
  try {
    // console.log('[DB-INIT] Đang kiểm tra và khởi tạo bảng cấu hình tồn kho & VAT...');

    await withDbRetry(async () => {
      // 1. Cập nhật bảng Warehouse: thêm cột isDefault nếu chưa có
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "Warehouse" ADD COLUMN IF NOT EXISTS "isDefault" BOOLEAN DEFAULT FALSE;
      `);

      // 2. Bảng inventory_reasons (Tab 2: Xuất, Tab 3: Nhập, Tab 4: Kiểm kê)
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS inventory_reasons (
          id VARCHAR(64) PRIMARY KEY,
          type VARCHAR(20) NOT NULL,
          reason VARCHAR(255) NOT NULL,
          prefix VARCHAR(50) NOT NULL,
          requires_partner BOOLEAN DEFAULT FALSE,
          partner_label VARCHAR(100),
          is_active BOOLEAN DEFAULT TRUE,
          is_system BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          CONSTRAINT uq_inventory_reasons_type_reason UNIQUE (type, reason)
        );
      `);

      // 3. Bảng tax_rates (Tab 5: Thuế suất VAT)
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS tax_rates (
          id VARCHAR(64) PRIMARY KEY,
          code VARCHAR(50) UNIQUE NOT NULL,
          name VARCHAR(255) NOT NULL,
          rate NUMERIC(5, 2) NOT NULL,
          description TEXT,
          is_default BOOLEAN DEFAULT FALSE,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);

      // 4. Bảng inventory_settings (Cấu hình chung)
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS inventory_settings (
          key VARCHAR(100) PRIMARY KEY,
          value TEXT NOT NULL,
          description TEXT,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);

      // 5. SEED DỮ LIỆU MẪU KHO MẶC ĐỊNH
      // Đặt KHO_TONG_HCM làm kho mặc định nếu chưa kho nào có isDefault = true
      const defaultWhCount = await prisma.$queryRawUnsafe<any[]>(`
        SELECT COUNT(*) as count FROM "Warehouse" WHERE "isDefault" = TRUE
      `);
      if (Number(defaultWhCount[0]?.count || 0) === 0) {
        await prisma.$executeRawUnsafe(`
          UPDATE "Warehouse" SET "isDefault" = TRUE 
          WHERE code = 'KHO_TONG_HCM' 
             OR id = (SELECT id FROM "Warehouse" ORDER BY "createdAt" ASC LIMIT 1);
        `);
      }

      // 6. SEED DỮ LIỆU LÝ DO XUẤT (Tab 2)
      const exportReasons = [
        { reason: 'Xuất bán lẻ / Showroom', prefix: 'PXK-BL', requiresPartner: true, partnerLabel: 'Khách hàng' },
        { reason: 'Xuất bán buôn / Dự án', prefix: 'PXK-DA', requiresPartner: true, partnerLabel: 'Khách hàng / Doanh nghiệp' },
        { reason: 'Chuyển kho nội bộ', prefix: 'PXK-CK', requiresPartner: false, partnerLabel: 'Kho đích' },
        { reason: 'Xuất trả Nhà cung cấp', prefix: 'PXK-NCC', requiresPartner: true, partnerLabel: 'Nhà cung cấp' },
        { reason: 'Hủy hàng hỏng / Hết hạn', prefix: 'PXK-HUY', requiresPartner: false, partnerLabel: null },
        { reason: 'Trưng bày / Hàng mẫu', prefix: 'PXK-TB', requiresPartner: false, partnerLabel: 'Showroom' }
      ];

      for (let i = 0; i < exportReasons.length; i++) {
        const r = exportReasons[i];
        const id = 'exp_' + (i + 1).toString().padStart(3, '0') + '_' + Math.random().toString(36).substring(2, 7);
        await prisma.$executeRawUnsafe(`
          INSERT INTO inventory_reasons (id, type, reason, prefix, requires_partner, partner_label, is_active, is_system)
          VALUES ($1, 'EXPORT', $2, $3, $4, $5, TRUE, TRUE)
          ON CONFLICT (type, reason) DO UPDATE 
          SET prefix = EXCLUDED.prefix, requires_partner = EXCLUDED.requires_partner, partner_label = EXCLUDED.partner_label, is_active = TRUE;
        `, id, r.reason, r.prefix, r.requiresPartner, r.partnerLabel);
      }

      // 7. SEED DỮ LIỆU LÝ DO NHẬP (Tab 3)
      const importReasons = [
        { reason: 'Nhập mua từ Nhà cung ứng', prefix: 'PNK-NCC', requiresPartner: true, partnerLabel: 'Nhà cung cấp' },
        { reason: 'Khách hàng trả lại hàng', prefix: 'PNK-TH', requiresPartner: true, partnerLabel: 'Khách hàng' },
        { reason: 'Nhận chuyển kho từ chi nhánh khác', prefix: 'PNK-CK', requiresPartner: false, partnerLabel: 'Kho nguồn' },
        { reason: 'Nhập bảo hành / Sửa chữa', prefix: 'PNK-BH', requiresPartner: true, partnerLabel: 'Khách hàng / NCC' },
        { reason: 'Nhập cân bằng thừa sau kiểm kê', prefix: 'PNK-KK', requiresPartner: false, partnerLabel: null }
      ];

      for (let i = 0; i < importReasons.length; i++) {
        const r = importReasons[i];
        const id = 'imp_' + (i + 1).toString().padStart(3, '0') + '_' + Math.random().toString(36).substring(2, 7);
        await prisma.$executeRawUnsafe(`
          INSERT INTO inventory_reasons (id, type, reason, prefix, requires_partner, partner_label, is_active, is_system)
          VALUES ($1, 'IMPORT', $2, $3, $4, $5, TRUE, TRUE)
          ON CONFLICT (type, reason) DO UPDATE 
          SET prefix = EXCLUDED.prefix, requires_partner = EXCLUDED.requires_partner, partner_label = EXCLUDED.partner_label, is_active = TRUE;
        `, id, r.reason, r.prefix, r.requiresPartner, r.partnerLabel);
      }

      // 8. SEED DỮ LIỆU LÝ DO KIỂM KÊ (Tab 4)
      const auditReasons = [
        { reason: 'Kiểm kê định kỳ tháng/quý', prefix: 'PKK-DK' },
        { reason: 'Kiểm kê đột xuất', prefix: 'PKK-DX' },
        { reason: 'Kiểm kê bàn giao ca', prefix: 'PKK-BG' },
        { reason: 'Kiểm kê xử lý chênh lệch', prefix: 'PKK-CL' }
      ];

      for (let i = 0; i < auditReasons.length; i++) {
        const r = auditReasons[i];
        const id = 'aud_' + (i + 1).toString().padStart(3, '0') + '_' + Math.random().toString(36).substring(2, 7);
        await prisma.$executeRawUnsafe(`
          INSERT INTO inventory_reasons (id, type, reason, prefix, requires_partner, partner_label, is_active, is_system)
          VALUES ($1, 'AUDIT', $2, $3, FALSE, NULL, TRUE, TRUE)
          ON CONFLICT (type, reason) DO UPDATE 
          SET prefix = EXCLUDED.prefix, is_active = TRUE;
        `, id, r.reason, r.prefix);
      }

      // 9. SEED DỮ LIỆU THUẾ SUẤT VAT (Tab 5)
      const taxRates = [
        { code: 'VAT_10', name: 'Thuế GTGT 10% (Chuẩn)', rate: 10, isDefault: true, description: 'Thuế suất chuẩn áp dụng cho sản phẩm nội thất & dịch vụ' },
        { code: 'VAT_08', name: 'Thuế GTGT 8% (Nghị quyết ưu đãi)', rate: 8, isDefault: false, description: 'Chính sách giảm thuế GTGT kích cầu tiêu dùng' },
        { code: 'VAT_00', name: 'Thuế GTGT 0% (Xuất khẩu / Miễn thuế)', rate: 0, isDefault: false, description: 'Áp dụng cho đơn hàng xuất khẩu hoặc dự án miễn thuế' },
        { code: 'VAT_KCT', name: 'Không chịu thuế (KCT)', rate: 0, isDefault: false, description: 'Hàng hóa / Dịch vụ thuộc diện không chịu thuế GTGT' }
      ];

      for (const t of taxRates) {
        const id = 'tax_' + t.code.toLowerCase();
        await prisma.$executeRawUnsafe(`
          INSERT INTO tax_rates (id, code, name, rate, description, is_default, is_active)
          VALUES ($1, $2, $3, $4, $5, $6, TRUE)
          ON CONFLICT (code) DO UPDATE 
          SET name = EXCLUDED.name, rate = EXCLUDED.rate, description = EXCLUDED.description, is_active = TRUE;
        `, id, t.code, t.name, t.rate, t.description, t.isDefault);
      }

      // 10. SEED CẤU HÌNH CHUNG
      const settings = [
        { key: 'pricing_tax_mode', value: 'EXCLUSIVE', description: 'Cơ chế tính thuế: EXCLUSIVE (Chưa gồm VAT) | INCLUSIVE (Đã gồm VAT)' },
        { key: 'auto_zero_tax_internal', value: 'true', description: 'Tự động áp dụng 0% VAT cho phiếu xuất chuyển kho, xuất hủy' }
      ];

      for (const s of settings) {
        await prisma.$executeRawUnsafe(`
          INSERT INTO inventory_settings (key, value, description, updated_at)
          VALUES ($1, $2, $3, NOW())
          ON CONFLICT (key) DO NOTHING;
        `, s.key, s.value, s.description);
      }
    });

    // console.log('[DB-INIT] ✅ Khởi tạo bảng và dữ liệu mẫu cấu hình tồn kho & VAT thành công!');
    return true;
  } catch (error) {
    console.error('[DB-INIT] ❌ Lỗi khi khởi tạo database cấu hình kho & VAT:', error);
    return false;
  }
}
