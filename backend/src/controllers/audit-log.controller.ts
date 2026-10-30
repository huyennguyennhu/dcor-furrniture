import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const auditLogController = {
  // Lấy danh sách audit logs với đầy đủ bộ lọc
  getAuditLogs: async (req: Request, res: Response) => {
    try {
      const {
        search,
        module,
        actionType,
        role,
        severity,
        startDate,
        endDate,
        staffName,
        page = '1',
        limit = '15'
      } = req.query;

      const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
      const limitNum = Math.max(1, Math.min(100, parseInt(String(limit), 10) || 15));
      const offset = (pageNum - 1) * limitNum;

      // Xây dựng điều kiện WHERE động
      const conditions: string[] = ['1=1'];
      const params: any[] = [];
      let paramIndex = 1;

      // 1. Tìm kiếm từ khóa (Search Bar)
      // Tìm theo: Mã đối tượng (Mã đơn, Mã SKU, Mã phiếu kho), Tên nhân viên, Email, Mã log
      if (search && String(search).trim()) {
        const s = `%${String(search).trim()}%`;
        conditions.push(`(
          log_code ILIKE $${paramIndex} OR
          actor_name ILIKE $${paramIndex} OR
          actor_email ILIKE $${paramIndex} OR
          actor_id ILIKE $${paramIndex} OR
          target_id ILIKE $${paramIndex} OR
          target_name ILIKE $${paramIndex} OR
          description ILIKE $${paramIndex}
        )`);
        params.push(s);
        paramIndex++;
      }

      // 2. Phân hệ / Module
      if (module && String(module) !== 'ALL') {
        conditions.push(`module = $${paramIndex}`);
        params.push(String(module).toUpperCase());
        paramIndex++;
      }

      // 3. Loại hành động (Action Type)
      if (actionType && String(actionType) !== 'ALL') {
        conditions.push(`action = $${paramIndex}`);
        params.push(String(actionType).toUpperCase());
        paramIndex++;
      }

      // 4. Vai trò (Role)
      if (role && String(role) !== 'ALL') {
        conditions.push(`actor_role = $${paramIndex}`);
        params.push(String(role).toUpperCase());
        paramIndex++;
      }

      // 5. Tên nhân viên cụ thể
      if (staffName && String(staffName).trim()) {
        conditions.push(`actor_name ILIKE $${paramIndex}`);
        params.push(`%${String(staffName).trim()}%`);
        paramIndex++;
      }

      // 6. Mức độ nghiêm trọng (Severity Level)
      if (severity && String(severity) !== 'ALL') {
        conditions.push(`severity = $${paramIndex}`);
        params.push(String(severity).toUpperCase());
        paramIndex++;
      }

      // 7. Khoảng thời gian (Date Range)
      if (startDate) {
        conditions.push(`timestamp >= $${paramIndex}::timestamptz`);
        params.push(new Date(String(startDate)).toISOString());
        paramIndex++;
      }
      if (endDate) {
        // Cho đến cuối ngày của endDate
        const endDateTime = new Date(String(endDate));
        endDateTime.setHours(23, 59, 59, 999);
        conditions.push(`timestamp <= $${paramIndex}::timestamptz`);
        params.push(endDateTime.toISOString());
        paramIndex++;
      }

      const whereClause = conditions.join(' AND ');

      // Query tổng số bản ghi
      const countSql = `SELECT COUNT(*)::int as total FROM "AuditLogs" WHERE ${whereClause}`;
      const countRes: any = await prisma.$queryRawUnsafe(countSql, ...params);
      const total = countRes?.[0]?.total || 0;

      // Query danh sách dữ liệu có phân trang và sắp xếp giảm dần từ mới nhất
      const dataSql = `
        SELECT 
          id, log_code, timestamp, actor_id, actor_name, actor_email, actor_role,
          action, action_label, module, module_label, target_type, target_id, target_name,
          severity, description, ip_address, user_agent, old_value, new_value, created_at
        FROM "AuditLogs" 
        WHERE ${whereClause}
        ORDER BY timestamp DESC
        LIMIT ${limitNum} OFFSET ${offset}
      `;
      const logs: any = await prisma.$queryRawUnsafe(dataSql, ...params);

      // Thống kê nhanh KPI
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const statsSql = `
        SELECT
          COUNT(*)::int as total_all,
          COUNT(CASE WHEN timestamp >= $1::timestamptz THEN 1 END)::int as today_count,
          COUNT(CASE WHEN severity = 'WARNING' THEN 1 END)::int as warning_count,
          COUNT(CASE WHEN severity = 'CRITICAL' THEN 1 END)::int as critical_count,
          COUNT(DISTINCT actor_name)::int as total_actors
        FROM "AuditLogs"
      `;
      const statsRes: any = await prisma.$queryRawUnsafe(statsSql, todayStart.toISOString());
      const stats = statsRes?.[0] || {
        total_all: total,
        today_count: 0,
        warning_count: 0,
        critical_count: 0,
        total_actors: 0
      };

      // Danh sách các phân hệ thực tế có trong hệ thống Audit Logs
      const modulesRes: any = await prisma.$queryRawUnsafe(`
        SELECT module as key, module_label as label, COUNT(*)::int as count
        FROM "AuditLogs"
        WHERE module IS NOT NULL AND module != ''
        GROUP BY module, module_label
        ORDER BY module ASC
      `);
      const modules = (modulesRes || []).map((m: any) => ({
        key: m.key,
        label: (m.label || '').replace(/\s*\([^)]*\)/g, '').trim() || m.key,
        count: m.count
      }));

      res.json({
        success: true,
        data: logs,
        modules,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum) || 1
        },
        stats: {
          totalLogs: stats.total_all,
          todayLogs: stats.today_count,
          warningLogs: stats.warning_count,
          criticalLogs: stats.critical_count,
          activeActors: stats.total_actors
        }
      });
    } catch (error: any) {
      console.error('Lỗi lấy danh sách Audit Logs:', error);
      res.status(500).json({ success: false, message: 'Lỗi máy chủ khi truy xuất nhật ký hoạt động.', error: error.message });
    }
  },

  // Lấy danh sách các phân hệ thực tế có trong hệ thống Audit Logs
  getModules: async (req: Request, res: Response) => {
    try {
      const modulesRes: any = await prisma.$queryRawUnsafe(`
        SELECT module as key, module_label as label, COUNT(*)::int as count
        FROM "AuditLogs"
        WHERE module IS NOT NULL AND module != ''
        GROUP BY module, module_label
        ORDER BY module ASC
      `);
      const modules = (modulesRes || []).map((m: any) => ({
        key: m.key,
        label: (m.label || '').replace(/\s*\([^)]*\)/g, '').trim() || m.key,
        count: m.count
      }));
      res.json({ success: true, data: modules });
    } catch (error: any) {
      console.error('Lỗi khi lấy danh sách phân hệ:', error);
      res.status(500).json({ success: false, message: 'Lỗi máy chủ khi lấy danh mục phân hệ.', error: error.message });
    }
  },

  // Lấy chi tiết 1 audit log theo ID
  getAuditLogById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const resData: any = await prisma.$queryRawUnsafe(
        `SELECT * FROM "AuditLogs" WHERE id = $1 OR log_code = $1 LIMIT 1`,
        id
      );
      if (!resData || resData.length === 0) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy dòng nhật ký hoạt động này.' });
      }
      res.json({ success: true, data: resData[0] });
    } catch (error: any) {
      console.error('Lỗi lấy chi tiết Audit Log:', error);
      res.status(500).json({ success: false, message: 'Lỗi truy xuất chi tiết.', error: error.message });
    }
  },

  // Tạo mới audit log (cho các phân hệ khác hoặc client gọi)
  createAuditLog: async (req: Request, res: Response) => {
    try {
      const {
        actorId = '#NV-01',
        actorName = 'Admin',
        actorEmail = 'admin@dcor.vn',
        actorRole = 'ADMIN',
        action = 'UPDATE',
        actionLabel = 'Cập nhật',
        module = 'SYSTEM',
        moduleLabel = 'Hệ thống',
        targetType = 'GENERAL',
        targetId = '',
        targetName = '',
        severity = 'INFO',
        description = '',
        oldValue = null,
        newValue = null
      } = req.body;

      const randomNum = Math.floor(10000 + Math.random() * 90000);
      const logCode = `#LOG-${randomNum}`;
      const id = `log-${Date.now()}-${randomNum}`;
      const ipAddress = req.ip || req.socket.remoteAddress || '127.0.0.1';
      const userAgent = req.headers['user-agent'] || 'Unknown Client';

      await prisma.$executeRawUnsafe(
        `INSERT INTO "AuditLogs" (
          id, log_code, timestamp, actor_id, actor_name, actor_email, actor_role,
          action, action_label, module, module_label, target_type, target_id, target_name,
          severity, description, ip_address, user_agent, old_value, new_value
        ) VALUES ($1, $2, NOW(), $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18::jsonb, $19::jsonb)`,
        id,
        logCode,
        actorId,
        actorName,
        actorEmail,
        actorRole,
        action,
        actionLabel,
        module,
        moduleLabel,
        targetType,
        targetId,
        targetName,
        severity,
        description,
        ipAddress,
        userAgent,
        oldValue ? JSON.stringify(oldValue) : null,
        newValue ? JSON.stringify(newValue) : null
      );

      res.status(201).json({ success: true, message: 'Ghi nhật ký hoạt động thành công.', id, logCode });
    } catch (error: any) {
      console.error('Lỗi tạo Audit Log:', error);
      res.status(500).json({ success: false, message: 'Không thể ghi nhận nhật ký.', error: error.message });
    }
  }
};
