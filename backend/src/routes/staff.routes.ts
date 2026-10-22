import { Router } from 'express';
import { staffController } from '../controllers/staff.controller';
import { authenticateJWT } from '../middleware/auth.middleware';

const router = Router();

// Toàn bộ các thao tác nghiệp vụ Quản lý nhân sự yêu cầu xác thực JWT và kiểm tra tài khoản ACTIVE trong DB
router.use(authenticateJWT);

// Lấy danh sách nhân sự
router.get('/', staffController.getAllStaff);

// Mời nhân sự mới & gửi email kích hoạt (User tự đặt mật khẩu)
router.post('/invite', staffController.inviteStaff);

// Soạn & gửi email bàn giao / bổ nhiệm độc lập
router.post('/dispatch-email', staffController.dispatchEmail);

// Gửi lại thư mời
router.post('/:id/resend-invite', staffController.resendInvite);

// Đổi vai trò
router.put('/:id/role', staffController.updateRole);

// Đổi trạng thái (khóa / kích hoạt)
router.put('/:id/status', staffController.updateStatus);

// Cập nhật phân quyền riêng theo nhân sự
router.put('/:id/permissions', staffController.updatePermissions);

// Xóa tài khoản nhân sự
router.delete('/:id', staffController.deleteStaff);

export default router;
