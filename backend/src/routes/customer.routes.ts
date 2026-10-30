import { Router } from 'express';
import { customerController } from '../controllers/customer.controller';
import { authenticateJWT, optionalAuth } from '../middleware/auth.middleware';

const router = Router();

// ==========================================
// LỊCH HẸN TƯ VẤN (Công khai & Khách vãng lai & Thành viên)
// ==========================================
router.get('/appointments/booked-slots', customerController.getBookedAppointmentSlots);
router.post('/appointments', optionalAuth, customerController.createAppointment);
router.get('/appointments', optionalAuth, customerController.getAppointments);
router.put('/appointments/:id/cancel', optionalAuth, customerController.cancelAppointment);
router.put('/appointments/:id/reschedule', optionalAuth, customerController.rescheduleAppointment);

// ==========================================
// CÁC ROUTE YÊU CẦU XÁC THỰC (JWT HOẶC GUEST PHONE)
// ==========================================
router.use(authenticateJWT);

// Hồ sơ & Tài khoản
router.get('/profile', customerController.getProfile);
router.put('/profile', customerController.updateProfile);
router.put('/change-password', customerController.changePassword);
router.post('/change-phone', customerController.changePhone);

// Sổ địa chỉ (Address Book)
router.get('/addresses', customerController.getAddresses);
router.post('/addresses', customerController.createAddress);
router.put('/addresses/:id', customerController.updateAddress);
router.put('/addresses/:id/default', customerController.setDefaultAddress);
router.delete('/addresses/:id', customerController.deleteAddress);

// Bảo hành
router.get('/warranties', customerController.getWarranties);
router.post('/warranties', customerController.createWarrantyClaim);

// Đổi trả / Hoàn tiền
router.get('/returns', customerController.getReturns);
router.post('/returns', customerController.createReturn);
router.put('/returns/:id/status', customerController.updateReturnStatus);

// Thông báo cá nhân
router.get('/notifications', customerController.getNotifications);
router.put('/notifications/:id/read', customerController.markNotificationRead);
router.put('/notifications/read-all', customerController.markAllNotificationsRead);

export default router;
