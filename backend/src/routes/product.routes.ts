import { Router } from 'express';
import { productController } from '../controllers/product.controller';
import { authenticateJWT } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/iam.middleware';

const router = Router();

// Toàn bộ các thao tác quản trị sản phẩm yêu cầu JWT và kiểm tra quyền IAM
router.use(authenticateJWT);

// Lấy danh sách sản phẩm admin
router.get('/', requirePermission('products', 'view'), productController.getAllAdmin);

// Lấy chi tiết sản phẩm
router.get('/:id', requirePermission('products', 'view'), productController.getDetail);

// Tạo mới sản phẩm
router.post('/', requirePermission('products', 'create'), productController.createProduct);

// Cập nhật sản phẩm
router.put('/:id', requirePermission('products', 'edit'), productController.updateProduct);

// Bật / tắt trạng thái sản phẩm
router.patch('/:id/status', requirePermission('products', 'edit'), productController.toggleStatus);

// Xóa sản phẩm
router.delete('/:id', requirePermission('products', 'delete'), productController.deleteProduct);

export default router;
