import { Router } from 'express';
import { productController } from '../controllers/product.controller';

const router = Router();

// Lấy danh sách sản phẩm admin
router.get('/', productController.getAllAdmin);

// Lấy chi tiết sản phẩm
router.get('/:id', productController.getDetail);

// Tạo mới sản phẩm
router.post('/', productController.createProduct);

// Cập nhật sản phẩm
router.put('/:id', productController.updateProduct);

// Xóa sản phẩm
router.delete('/:id', productController.deleteProduct);

export default router;
