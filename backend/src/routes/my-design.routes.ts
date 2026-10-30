import express, { Router } from 'express';
import { authenticateJWT } from '../middleware/auth.middleware';
import { myDesignController, requireCustomer } from '../controllers/my-design.controller';

const router = Router();

// Giới hạn dung lượng tải lên 1MB riêng cho các thiết kế phòng 3D
router.use(express.json({ limit: '1mb' }));

// Yêu cầu xác thực tài khoản khách hàng hợp lệ
router.use(authenticateJWT);
router.use(requireCustomer);

// Danh sách & chi tiết thiết kế
router.get('/', myDesignController.getDesignsList);
router.post('/', myDesignController.createDesign);
router.get('/:id', myDesignController.getDesignById);

// Cập nhật, lưu và xóa thiết kế
router.put('/:id', myDesignController.updateDesign);
router.patch('/:id/save', myDesignController.saveDesign);
router.patch('/:id/rename', myDesignController.renameDesign);
router.patch('/:id/link-post', myDesignController.linkPost);
router.delete('/:id', myDesignController.deleteDesign);

export default router;

