import { Router } from 'express';
import { consultationController } from '../controllers/consultation.controller';
import { authenticateJWT } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/iam.middleware';

const router = Router();

// --- Client Endpoints ---
router.get('/showrooms', consultationController.getShowrooms);
router.get('/availability', consultationController.getAvailability);
router.post('/', consultationController.createConsultation);
router.get('/my-appointments', consultationController.getMyAppointments);

// --- Admin Endpoints (bảo vệ bằng JWT & phân quyền IAM appointments) ---
router.get('/admin/pending-count', authenticateJWT, requirePermission('appointments', 'view'), consultationController.getPendingCount);
router.get('/admin/list', authenticateJWT, requirePermission('appointments', 'view'), consultationController.getAdminConsultations);
router.get('/admin/staff-list', authenticateJWT, requirePermission('appointments', 'view'), consultationController.getStaffList);
router.post('/admin/approve', authenticateJWT, requirePermission('appointments', 'update'), consultationController.approveConsultation);
router.post('/admin/reject', authenticateJWT, requirePermission('appointments', 'update'), consultationController.rejectConsultation);
router.post('/admin/complete', authenticateJWT, requirePermission('appointments', 'update'), consultationController.completeConsultation);
router.post('/admin/reschedule', authenticateJWT, requirePermission('appointments', 'update'), consultationController.rescheduleConsultation);
router.post('/admin/cancel', authenticateJWT, requirePermission('appointments', 'update'), consultationController.cancelConsultation);
router.post('/admin/update-status', authenticateJWT, requirePermission('appointments', 'update'), consultationController.updateStatusConsultation);
router.get('/admin/slot-config', authenticateJWT, requirePermission('appointments', 'view'), consultationController.getSlotConfig);
router.post('/admin/slot-config', authenticateJWT, requirePermission('appointments', 'update'), consultationController.saveSlotConfig);

export default router;
