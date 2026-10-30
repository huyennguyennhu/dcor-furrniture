import { Router } from 'express';
import { consultationController } from '../controllers/consultation.controller';

const router = Router();

// --- Client Endpoints ---
router.get('/showrooms', consultationController.getShowrooms);
router.get('/availability', consultationController.getAvailability);
router.post('/', consultationController.createConsultation);
router.get('/my-appointments', consultationController.getMyAppointments);

// --- Admin Endpoints ---
router.get('/admin/list', consultationController.getAdminConsultations);
router.get('/admin/staff-list', consultationController.getStaffList);
router.post('/admin/approve', consultationController.approveConsultation);
router.post('/admin/reject', consultationController.rejectConsultation);
router.post('/admin/complete', consultationController.completeConsultation);
router.post('/admin/reschedule', consultationController.rescheduleConsultation);
router.post('/admin/cancel', consultationController.cancelConsultation);
router.post('/admin/update-status', consultationController.updateStatusConsultation);
router.get('/admin/slot-config', consultationController.getSlotConfig);
router.post('/admin/slot-config', consultationController.saveSlotConfig);

export default router;
