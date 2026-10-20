import { Router } from 'express';
import { orderController } from '../controllers/order.controller';

const router = Router();

router.post('/', orderController.createOrder);
router.get('/my-orders', orderController.getMyOrders);
router.get('/address-lookup', orderController.getAddressByPhone);

export default router;
