import prisma, { withDbRetry } from './prisma';

export async function initAuditLogsDatabase() {
  try {
    await withDbRetry(async () => {
      // 0. Đảm bảo các cột liên quan đến Đặt cọc trong bảng Order tồn tại
      try {
        await prisma.$executeRawUnsafe(`ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "isDepositRequired" BOOLEAN DEFAULT false;`);
        await prisma.$executeRawUnsafe(`ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "depositRequired" BIGINT DEFAULT 0;`);
        await prisma.$executeRawUnsafe(`ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "depositPaid" BIGINT DEFAULT 0;`);
        await prisma.$executeRawUnsafe(`ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "paymentHoldReason" VARCHAR(50) DEFAULT 'NONE';`);
      } catch (alterErr) {
        console.warn('[WARN] Could not alter Order table columns for deposit:', alterErr);
      }

      // 1. Tạo bảng AuditLogs nếu chưa tồn tại
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "AuditLogs" (
          id VARCHAR(64) PRIMARY KEY,
          log_code VARCHAR(50) UNIQUE NOT NULL,
          timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          actor_id VARCHAR(64),
          actor_name VARCHAR(255) NOT NULL,
          actor_email VARCHAR(255),
          actor_role VARCHAR(50) NOT NULL,
          action VARCHAR(50) NOT NULL,
          action_label VARCHAR(255) NOT NULL,
          module VARCHAR(50) NOT NULL,
          module_label VARCHAR(255) NOT NULL,
          target_type VARCHAR(100),
          target_id VARCHAR(100),
          target_name VARCHAR(255),
          severity VARCHAR(20) NOT NULL DEFAULT 'INFO',
          description TEXT,
          ip_address VARCHAR(50),
          user_agent TEXT,
          old_value JSONB,
          new_value JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `);

      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_auditlogs_timestamp ON "AuditLogs"(timestamp DESC)`);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_auditlogs_module ON "AuditLogs"(module)`);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_auditlogs_action ON "AuditLogs"(action)`);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_auditlogs_severity ON "AuditLogs"(severity)`);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_auditlogs_actor_role ON "AuditLogs"(actor_role)`);

      // 2. Kiểm tra xem đã có dữ liệu mẫu chưa, nếu chưa thì seed dữ liệu thực tế phong phú
      const countRes: any = await prisma.$queryRawUnsafe(`SELECT COUNT(*)::int as count FROM "AuditLogs"`);
      const count = countRes?.[0]?.count || 0;

      if (count === 0) {
        // console.log('[INFO] Seeding initial rich AuditLogs data...');

        const sampleLogs = [
          {
            id: 'log-10293',
            log_code: '#LOG-10293',
            timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
            actor_id: '#NV-08',
            actor_name: 'Nguyễn Văn A',
            actor_email: 'vana.nguyen@dcor.vn',
            actor_role: 'WAREHOUSE',
            action: 'UPDATE',
            action_label: 'Cập nhật',
            module: 'INVENTORY',
            module_label: 'Quản lý Kho & Kiểm kê',
            target_type: 'STOCK_ORDER',
            target_id: '#XK-202610-091',
            target_name: 'Phiếu xuất kho #XK-202610-091',
            severity: 'INFO',
            description: 'Thủ kho xuất kho 02 Sofa da cho đơn hàng DCOR-EXP-88992',
            ip_address: '192.168.1.142',
            user_agent: 'Chrome 128.0 (Windows NT 10.0)',
            old_value: { status: 'PENDING_DISPATCH', shippedQty: 0 },
            new_value: { status: 'DISPATCHED', shippedQty: 2, trackingCode: 'DCOR-EXP-88992' }
          },
          {
            id: 'log-10292',
            log_code: '#LOG-10292',
            timestamp: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
            actor_id: '#NV-01',
            actor_name: 'Trần Minh Hoàng',
            actor_email: 'hoang.tran@dcor.vn',
            actor_role: 'ADMIN',
            action: 'APPROVE',
            action_label: 'Phê duyệt',
            module: 'ORDERS',
            module_label: 'Quản lý Đơn hàng',
            target_type: 'ORDER',
            target_id: '#DH-8821',
            target_name: 'Đơn hàng #DH-8821',
            severity: 'INFO',
            description: 'Duyệt đơn hàng vào kho sau khi kế toán xác nhận nhận cọc 30%',
            ip_address: '118.69.182.204',
            user_agent: 'Chrome 128.0 (macOS)',
            old_value: { status: 'PENDING', paymentStatus: 'UNPAID', canConfirm: false },
            new_value: { status: 'CONFIRMED', paymentStatus: 'PARTIAL', depositPaid: 26400000, canConfirm: true }
          },
          {
            id: 'log-10291',
            log_code: '#LOG-10291',
            timestamp: new Date(Date.now() - 42 * 60 * 1000).toISOString(),
            actor_id: '#NV-03',
            actor_name: 'Lê Thu Trang',
            actor_email: 'trang.le@dcor.vn',
            actor_role: 'ACCOUNTANT',
            action: 'UPDATE',
            action_label: 'Cập nhật',
            module: 'ORDERS',
            module_label: 'Quản lý Đơn hàng',
            target_type: 'ORDER',
            target_id: '#DH-8821',
            target_name: 'Đơn hàng #DH-8821',
            severity: 'INFO',
            description: 'Kế toán đối soát và ghi nhận thu cọc 30% qua chuyển khoản ngân hàng',
            ip_address: '192.168.1.105',
            user_agent: 'Firefox 130.0 (Windows NT 10.0)',
            old_value: { paymentHoldReason: 'AWAITING_DEPOSIT', depositPaid: 0 },
            new_value: { paymentHoldReason: 'NONE', depositPaid: 26400000, transactionRef: 'VCB-883921' }
          },
          {
            id: 'log-10290',
            log_code: '#LOG-10290',
            timestamp: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
            actor_id: '#NV-08',
            actor_name: 'Nguyễn Văn A',
            actor_email: 'vana.nguyen@dcor.vn',
            actor_role: 'WAREHOUSE',
            action: 'UPDATE',
            action_label: 'Cập nhật',
            module: 'INVENTORY',
            module_label: 'Quản lý Kho & Kiểm kê',
            target_type: 'STOCK_ADJUSTMENT',
            target_id: 'SKU-SOFA-MIN-01',
            target_name: 'Sản phẩm: Sofa Leather Minimalist (Màu Nâu Bò)',
            severity: 'WARNING',
            description: 'Cân bằng kho sau kiểm kê: Điều chỉnh giảm 01 chiếc do xước rách da trong kho',
            ip_address: '192.168.1.142',
            user_agent: 'Chrome 128.0 (Windows NT 10.0)',
            old_value: { systemQty: 12, availableQty: 10 },
            new_value: { systemQty: 11, availableQty: 9, defectQty: 1, reason: 'Rách da khi bốc xếp' }
          },
          {
            id: 'log-10289',
            log_code: '#LOG-10289',
            timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
            actor_id: '#NV-05',
            actor_name: 'Phạm Quốc Bảo',
            actor_email: 'bao.pham@dcor.vn',
            actor_role: 'SALES',
            action: 'CREATE',
            action_label: 'Tạo mới',
            module: 'CUSTOMERS',
            module_label: 'Quản lý Khách hàng',
            target_type: 'CUSTOMER',
            target_id: '#KH-0928',
            target_name: 'Khách hàng: Công ty TNHH Kiến Trúc Mộc Đức',
            severity: 'INFO',
            description: 'Tạo mới hồ sơ khách hàng doanh nghiệp B2B kèm hạn mức công nợ 200tr',
            ip_address: '14.161.22.88',
            user_agent: 'Chrome 127.0 (Windows NT 10.0)',
            old_value: null,
            new_value: { customerCode: 'KH-0928', type: 'B2B', creditLimit: 200000000, taxCode: '0318992011' }
          },
          {
            id: 'log-10288',
            log_code: '#LOG-10288',
            timestamp: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
            actor_id: '#NV-01',
            actor_name: 'Trần Minh Hoàng',
            actor_email: 'hoang.tran@dcor.vn',
            actor_role: 'ADMIN',
            action: 'DELETE',
            action_label: 'Xóa',
            module: 'PRODUCTS',
            module_label: 'Quản lý Sản phẩm',
            target_type: 'PRODUCT',
            target_id: 'PRD-LEGACY-09',
            target_name: 'Bàn Trà Kính Cũ (Ngừng kinh doanh)',
            severity: 'CRITICAL',
            description: 'Xóa vĩnh viễn danh mục sản phẩm mẫu cũ ngừng sản xuất',
            ip_address: '118.69.182.204',
            user_agent: 'Chrome 128.0 (macOS)',
            old_value: { id: 'PRD-LEGACY-09', name: 'Bàn Trà Kính Cũ', status: 'ACTIVE', variantsCount: 2 },
            new_value: null
          },
          {
            id: 'log-10287',
            log_code: '#LOG-10287',
            timestamp: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
            actor_id: 'SYSTEM',
            actor_name: 'Hệ thống Bảo mật DCOR',
            actor_email: 'security@dcor.vn',
            actor_role: 'ADMIN',
            action: 'AUTH',
            action_label: 'Đăng nhập',
            module: 'SYSTEM',
            module_label: 'Phân quyền & Hệ thống',
            target_type: 'USER_ACCOUNT',
            target_id: 'usr-guest-unknown',
            target_name: 'Tài khoản: admin@dcor.vn',
            severity: 'WARNING',
            description: 'Phát hiện nhập sai mật khẩu 3 lần liên tiếp từ IP lạ tại TP.HCM',
            ip_address: '113.161.78.9',
            user_agent: 'Unknown / Python-requests 2.31',
            old_value: { failedAttempts: 2 },
            new_value: { failedAttempts: 3, isCaptchaTriggered: true, lockedMinutes: 15 }
          },
          {
            id: 'log-10286',
            log_code: '#LOG-10286',
            timestamp: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
            actor_id: '#NV-01',
            actor_name: 'Trần Minh Hoàng',
            actor_email: 'hoang.tran@dcor.vn',
            actor_role: 'ADMIN',
            action: 'UPDATE',
            action_label: 'Cập nhật',
            module: 'SYSTEM',
            module_label: 'Phân quyền & Hệ thống',
            target_type: 'ROLE_PERMISSION',
            target_id: 'ROLE_WAREHOUSE',
            target_name: 'Phân quyền: Vai trò Thủ kho',
            severity: 'CRITICAL',
            description: 'Cập nhật quyền duyệt phiếu xuất kho và cân bằng số liệu tồn khả dụng',
            ip_address: '118.69.182.204',
            user_agent: 'Chrome 128.0 (macOS)',
            old_value: { canApproveStockOut: false, canAdjustInventory: false },
            new_value: { canApproveStockOut: true, canAdjustInventory: true, updatedBy: 'Trần Minh Hoàng' }
          },
          {
            id: 'log-10285',
            log_code: '#LOG-10285',
            timestamp: new Date(Date.now() - 7 * 3600 * 1000).toISOString(),
            actor_id: '#NV-02',
            actor_name: 'Hoàng Sơn',
            actor_email: 'son.hoang@dcor.vn',
            actor_role: 'WAREHOUSE',
            action: 'APPROVE',
            action_label: 'Phê duyệt',
            module: 'ORDERS',
            module_label: 'Quản lý Đơn hàng',
            target_type: 'QC_INSPECTION',
            target_id: '#DH-8819',
            target_name: 'Biên bản QC Đơn #DH-8819',
            severity: 'INFO',
            description: 'Thủ kho xác nhận đạt 4/4 tiêu chuẩn QC (Bề mặt gỗ, Kết cấu sườn, Đệm mút D40, Bọc PE 3 lớp)',
            ip_address: '192.168.1.144',
            user_agent: 'Chrome 128.0 (Windows NT 10.0)',
            old_value: { surfaceChecked: false, protectiveWrapDone: false },
            new_value: { surfaceChecked: true, structureChecked: true, cushionLeatherChecked: true, protectiveWrapDone: true }
          },
          {
            id: 'log-10284',
            log_code: '#LOG-10284',
            timestamp: new Date(Date.now() - 10 * 3600 * 1000).toISOString(),
            actor_id: '#NV-04',
            actor_name: 'Nguyễn Bích Ngọc',
            actor_email: 'ngoc.nguyen@dcor.vn',
            actor_role: 'CONTENT',
            action: 'CREATE',
            action_label: 'Tạo mới',
            module: 'PRODUCTS',
            module_label: 'Quản lý Sản phẩm',
            target_type: 'PRODUCT',
            target_id: 'PRD-SOFA-NORDIC',
            target_name: 'Sofa Vải Nỉ Phong Cách Bắc Âu Nordic',
            severity: 'INFO',
            description: 'Thêm mới mẫu sản phẩm vào Bộ sưu tập Thu Đông 2026 kèm 3 biến thể kích thước',
            ip_address: '192.168.1.118',
            user_agent: 'Chrome 128.0 (Windows NT 10.0)',
            old_value: null,
            new_value: { name: 'Sofa Vải Nỉ Nordic', category: 'Sofa phòng khách', price: 18500000, variants: ['1.8m', '2.2m', 'Góc L'] }
          },
          {
            id: 'log-10283',
            log_code: '#LOG-10283',
            timestamp: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
            actor_id: '#NV-01',
            actor_name: 'Trần Minh Hoàng',
            actor_email: 'hoang.tran@dcor.vn',
            actor_role: 'ADMIN',
            action: 'AUTH',
            action_label: 'Đăng nhập',
            module: 'SYSTEM',
            module_label: 'Phân quyền & Hệ thống',
            target_type: 'USER_SESSION',
            target_id: 'ses-99218',
            target_name: 'Đăng nhập Admin Dashboard',
            severity: 'INFO',
            description: 'Quản trị viên đăng nhập thành công xác thực 2 bước (2FA Google Authenticator)',
            ip_address: '118.69.182.204',
            user_agent: 'Chrome 128.0 (macOS)',
            old_value: null,
            new_value: { authType: 'PASSWORD_2FA', device: 'MacBook Pro Apple M3' }
          },
          {
            id: 'log-10282',
            log_code: '#LOG-10282',
            timestamp: new Date(Date.now() - 28 * 3600 * 1000).toISOString(),
            actor_id: '#NV-03',
            actor_name: 'Lê Thu Trang',
            actor_email: 'trang.le@dcor.vn',
            actor_role: 'ACCOUNTANT',
            action: 'APPROVE',
            action_label: 'Phê duyệt',
            module: 'ORDERS',
            module_label: 'Quản lý Đơn hàng',
            target_type: 'REFUND',
            target_id: '#DH-8790',
            target_name: 'Hồ sơ Hoàn tiền Đơn #DH-8790',
            severity: 'INFO',
            description: 'Duyệt lệnh hoàn tiền 100% qua cổng VNPAY cho khách hàng đổi trả hàng lỗi vận chuyển',
            ip_address: '192.168.1.105',
            user_agent: 'Firefox 130.0 (Windows NT 10.0)',
            old_value: { refundStatus: 'PENDING_APPROVAL', refundAmount: 0 },
            new_value: { refundStatus: 'APPROVED', refundAmount: 34500000, txCode: 'VNPAY-REF-992180' }
          },
          {
            id: 'log-10281',
            log_code: '#LOG-10281',
            timestamp: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
            actor_id: '#NV-01',
            actor_name: 'Trần Minh Hoàng',
            actor_email: 'hoang.tran@dcor.vn',
            actor_role: 'ADMIN',
            action: 'UPDATE',
            action_label: 'Cập nhật',
            module: 'CUSTOMERS',
            module_label: 'Quản lý Khách hàng',
            target_type: 'SETTING',
            target_id: 'SETTING_PAYMENT_GATEWAY',
            target_name: 'Cấu hình cổng thanh toán VNPAY & MoMo',
            severity: 'CRITICAL',
            description: 'Thay đổi Secret Key và Merchant ID môi trường Production của cổng VNPAY',
            ip_address: '118.69.182.204',
            user_agent: 'Chrome 128.0 (macOS)',
            old_value: { merchantId: 'DCOR_TEST_01', isSandbox: true },
            new_value: { merchantId: 'DCOR_PROD_LIVE_99', isSandbox: false }
          },
          {
            id: 'log-10280',
            log_code: '#LOG-10280',
            timestamp: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
            actor_id: '#NV-08',
            actor_name: 'Nguyễn Văn A',
            actor_email: 'vana.nguyen@dcor.vn',
            actor_role: 'WAREHOUSE',
            action: 'CREATE',
            action_label: 'Tạo mới',
            module: 'INVENTORY',
            module_label: 'Quản lý Kho & Kiểm kê',
            target_type: 'STOCK_AUDIT',
            target_id: 'PKK-202610-001',
            target_name: 'Phiếu kiểm kê định kỳ Kho Tổng Bình Dương',
            severity: 'INFO',
            description: 'Mở đợt kiểm kê toàn diện 142 danh mục bàn ghế sofa trước mùa cao điểm',
            ip_address: '192.168.1.142',
            user_agent: 'Chrome 128.0 (Windows NT 10.0)',
            old_value: null,
            new_value: { auditCode: 'PKK-202610-001', warehouse: 'Kho Tổng Bình Dương', totalItems: 142, status: 'IN_PROGRESS' }
          }
        ];

        for (const item of sampleLogs) {
          await prisma.$executeRawUnsafe(
            `INSERT INTO "AuditLogs" (
              id, log_code, timestamp, actor_id, actor_name, actor_email, actor_role,
              action, action_label, module, module_label, target_type, target_id, target_name,
              severity, description, ip_address, user_agent, old_value, new_value
            ) VALUES ($1, $2, $3::timestamptz, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19::jsonb, $20::jsonb)
            ON CONFLICT (id) DO NOTHING`,
            item.id,
            item.log_code,
            item.timestamp,
            item.actor_id,
            item.actor_name,
            item.actor_email,
            item.actor_role,
            item.action,
            item.action_label,
            item.module,
            item.module_label,
            item.target_type,
            item.target_id,
            item.target_name,
            item.severity,
            item.description,
            item.ip_address,
            item.user_agent,
            item.old_value ? JSON.stringify(item.old_value) : null,
            item.new_value ? JSON.stringify(item.new_value) : null
          );
        }
        // console.log('[INFO] Seeding AuditLogs completed successfully.');
      }
    });
  } catch (error) {
    console.error('[ERROR] Failed to initialize AuditLogs table:', error);
  }
}
