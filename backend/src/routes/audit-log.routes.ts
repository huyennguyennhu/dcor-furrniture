import { Router } from 'express';
import { auditLogController } from '../controllers/audit-log.controller';
import { authenticateJWT } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/iam.middleware';

const router = Router();

// Toàn bộ nhật ký kiểm toán yêu cầu xác thực JWT và quyền xem Audit Log trong Cài đặt hệ thống
router.use(authenticateJWT);
router.use(requirePermission('settings', 'audit_log'));

router.get('/', auditLogController.getAuditLogs);
router.get('/modules', auditLogController.getModules);
router.get('/:id', auditLogController.getAuditLogById);
router.post('/', auditLogController.createAuditLog);

export default router;
