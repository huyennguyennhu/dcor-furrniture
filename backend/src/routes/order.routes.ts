import { Router } from 'express';
import { orderController } from '../controllers/order.controller';

const router = Router();

router.post('/', orderController.createOrder);
router.get('/my-orders', orderController.getMyOrders);
router.get('/address-lookup', orderController.getAddressByPhone);

// Chi tiết đơn hàng và các thao tác của khách hàng
router.get('/:orderNumber', orderController.getOrderDetail);
router.post('/:orderNumber/cancel', orderController.cancelOrder);
router.post('/:orderNumber/confirm-received', orderController.confirmReceived);
router.post('/:orderNumber/return', orderController.requestReturn);
router.post('/:orderNumber/review', orderController.submitReview);

export default router;
