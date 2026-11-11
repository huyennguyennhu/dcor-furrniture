import { Router } from 'express';
import { orderController } from '../controllers/order.controller';
import { orderRateLimiter } from '../middleware/rate-limit.middleware';
import { reviewController } from '../controllers/review.controller';

const router = Router();

router.post('/', orderRateLimiter, orderController.createOrder);
router.get('/my-orders', orderController.getMyOrders);
router.get('/address-lookup', orderController.getAddressByPhone);

// Chi tiết đơn hàng và các thao tác của khách hàng
router.get('/:orderNumber', orderController.getOrderDetail);
router.post('/:orderNumber/cancel', orderController.cancelOrder);
router.post('/:orderNumber/confirm-received', orderController.confirmReceived);
router.post('/:orderNumber/return', orderController.requestReturn);
router.post('/:orderNumber/review', reviewController.submitOrderReviews);
router.post('/:orderNumber/reviews', reviewController.submitOrderReviews);

// Thanh test đồng bộ trạng thái đơn hàng (Storefront & Admin Sync)
router.put('/:orderNumber/status', orderController.updateAdminOrderStatus);
router.put('/:orderNumber/status-sync', orderController.updateAdminOrderStatus);
router.put('/:id/status', orderController.updateAdminOrderStatus);

export default router;
