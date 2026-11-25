import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { memoryCache, CACHE_KEYS } from '../lib/cache';
import { notifyAdminPendingConsultations } from '../controllers/consultation.controller';
import { authenticateJWT } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/iam.middleware';

const router = Router();

// Toàn bộ API Quản trị Lịch tư vấn Showroom yêu cầu xác thực JWT
router.use(authenticateJWT);

// 1. Danh sách lịch hẹn tư vấn
router.get('/', requirePermission('appointments', 'view'), async (req: Request, res: Response) => {
  try {
    const records: any[] = await prisma.$queryRawUnsafe(`
      SELECT *
      FROM "ShowroomConsultations"
      ORDER BY created_at DESC;
    `);
    res.json(records);
  } catch (error) {
    console.error('[Admin Appointments] Lỗi lấy danh sách lịch hẹn:', error);
    res.status(500).json({ message: 'Không thể tải danh sách lịch tư vấn.' });
  }
});

// 2. Cập nhật trạng thái cuộc hẹn (Xác nhận, Đã tư vấn, Hủy lịch)
router.patch('/:id/status', requirePermission('appointments', 'update'), async (req: Request, res: Response) => {
  try {
    const { status, notes } = req.body;
    await prisma.$executeRawUnsafe(`
      UPDATE "ShowroomConsultations"
      SET status = $1, notes = COALESCE($2, notes), updated_at = NOW()
      WHERE id = $3;
    `, String(status), notes ? String(notes) : null, req.params.id);

    memoryCache.invalidatePrefix(CACHE_KEYS.CONSULTATIONS_ADMIN_PREFIX);
    memoryCache.invalidatePrefix('showroom_slots_');
    notifyAdminPendingConsultations().catch(() => {});

    res.json({ success: true, message: 'Đã cập nhật trạng thái lịch tư vấn.' });
  } catch (error) {
    console.error('[Admin Appointments] Lỗi cập nhật trạng thái:', error);
    res.status(500).json({ message: 'Lỗi cập nhật lịch tư vấn.' });
  }
});

// 3. Phân công nhân viên tư vấn Showroom phụ trách cuộc hẹn
router.patch('/:id/assign', requirePermission('appointments', 'assign'), async (req: Request, res: Response) => {
  try {
    const { staffId, staffName } = req.body;
    await prisma.$executeRawUnsafe(`
      UPDATE "ShowroomConsultations"
      SET staff_id = $1, staff_name = $2, updated_at = NOW()
      WHERE id = $3;
    `, staffId ? String(staffId).trim() : null, staffName ? String(staffName).trim() : null, req.params.id);

    memoryCache.invalidatePrefix(CACHE_KEYS.CONSULTATIONS_ADMIN_PREFIX);
    memoryCache.invalidatePrefix('showroom_slots_');
    notifyAdminPendingConsultations().catch(() => {});

    res.json({ success: true, message: `Đã phân công nhân sự ${staffName} phụ trách cuộc hẹn.` });
  } catch (error) {
    console.error('[Admin Appointments] Lỗi phân công:', error);
    res.status(500).json({ message: 'Lỗi phân công nhân sự tư vấn.' });
  }
});

export default router;
