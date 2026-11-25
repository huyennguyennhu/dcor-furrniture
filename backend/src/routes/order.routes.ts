import { Router } from 'express';
import { orderController } from '../controllers/order.controller';
import { orderRateLimiter } from '../middleware/rate-limit.middleware';
import { reviewController } from '../controllers/review.controller';
import { optionalAuth } from '../middleware/auth.middleware';

const router = Router();

router.post('/', orderRateLimiter, optionalAuth, orderController.createOrder);
router.get('/my-orders', optionalAuth, orderController.getMyOrders);
router.get('/address-lookup', orderRateLimiter, orderController.getAddressByPhone);

// Chi tiết đơn hàng và các thao tác của khách hàng (Bảo vệ kiểm tra quyền sở hữu chống IDOR / BOLA)
router.get('/:orderNumber', optionalAuth, orderController.getOrderDetail);
router.post('/:orderNumber/cancel', optionalAuth, orderController.cancelOrder);
router.post('/:orderNumber/confirm-received', optionalAuth, orderController.confirmReceived);
router.post('/:orderNumber/return', optionalAuth, orderController.requestReturn);
router.post('/:orderNumber/review', optionalAuth, reviewController.submitOrderReviews);
router.post('/:orderNumber/reviews', optionalAuth, reviewController.submitOrderReviews);

// Thanh test đồng bộ trạng thái đơn hàng (Storefront & Admin Sync)
router.put('/:orderNumber/status', optionalAuth, orderController.updateAdminOrderStatus);
router.put('/:orderNumber/status-sync', optionalAuth, orderController.updateAdminOrderStatus);
router.put('/:id/status', optionalAuth, orderController.updateAdminOrderStatus);

export default router;
