import { Router } from 'express';
import { staffController } from '../controllers/staff.controller';

const router = Router();

// Lấy danh sách nhân sự
router.get('/', staffController.getAllStaff);

// Mời nhân sự mới & gửi email
router.post('/invite', staffController.inviteStaff);

// Gửi lại thư mời
router.post('/:id/resend-invite', staffController.resendInvite);

// Đổi vai trò
router.put('/:id/role', staffController.updateRole);

// Đổi trạng thái (khóa / kích hoạt)
router.put('/:id/status', staffController.updateStatus);

export default router;
