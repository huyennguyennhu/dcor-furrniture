import { Router } from 'express';
import { staffController } from '../controllers/staff.controller';
import { authenticateJWT } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/iam.middleware';

const router = Router();

// Toàn bộ các thao tác nghiệp vụ Quản lý nhân sự yêu cầu xác thực JWT và kiểm tra tài khoản ACTIVE trong DB
router.use(authenticateJWT);

// IAM Matrix & Roles routes (Role-based permissions)
router.get('/permissions/matrix', staffController.getPermissionsMatrix);
router.put('/permissions/matrix', requirePermission('staff', 'edit'), staffController.updatePermissionsMatrix);
router.get('/roles', requirePermission('staff', 'view'), staffController.getAllRoles);
router.post('/roles', requirePermission('staff', 'create'), staffController.createRole);
router.put('/roles/:id', requirePermission('staff', 'edit'), staffController.updateRoleDef);
router.delete('/roles/:id', requirePermission('staff', 'delete'), staffController.deleteRoleDef);

// Lấy danh sách nhân sự
router.get('/', requirePermission('staff', 'view'), staffController.getAllStaff);

// Mời nhân sự mới & gửi email kích hoạt (User tự đặt mật khẩu)
router.post('/invite', requirePermission('staff', 'create'), staffController.inviteStaff);

// Soạn & gửi email bàn giao / bổ nhiệm độc lập
router.post('/dispatch-email', requirePermission('staff', 'create'), staffController.dispatchEmail);

// Gửi lại thư mời
router.post('/:id/resend-invite', requirePermission('staff', 'create'), staffController.resendInvite);

// Đổi vai trò
router.put('/:id/role', requirePermission('staff', 'edit'), staffController.updateRole);

// Đổi trạng thái (khóa / kích hoạt)
router.put('/:id/status', requirePermission('staff', 'edit'), staffController.updateStatus);

// Cập nhật phân quyền riêng theo nhân sự (legacy/backward compatibility)
router.put('/:id/permissions', requirePermission('staff', 'edit'), staffController.updatePermissions);

// Xóa tài khoản nhân sự
router.delete('/:id', requirePermission('staff', 'delete'), staffController.deleteStaff);

export default router;
