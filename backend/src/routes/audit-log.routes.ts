import { Router } from 'express';
import { auditLogController } from '../controllers/audit-log.controller';

const router = Router();

router.get('/', auditLogController.getAuditLogs);
router.get('/:id', auditLogController.getAuditLogById);
router.post('/', auditLogController.createAuditLog);

export default router;
