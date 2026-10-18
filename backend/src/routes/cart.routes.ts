import { Router } from 'express';
import { cartController } from '../controllers/cart.controller';
import { authenticateJWT } from '../middleware/auth.middleware';

const router = Router();

// Yêu cầu đăng nhập mới được thao tác giỏ hàng
router.use(authenticateJWT);

router.get('/', cartController.getCart);
router.post('/', cartController.addToCart);
router.post('/batch-delete', cartController.removeMultiple);
router.put('/:id', cartController.updateCartItem);
router.delete('/:id', cartController.removeCartItem);

export default router;
