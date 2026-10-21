import { Router } from 'express';
import { adminOrderController } from '../controllers/admin-order.controller';

const router = Router();

// 1. Danh sách đơn hàng
router.get('/', adminOrderController.getOrders);

// 2. Chi tiết đơn hàng theo ID hoặc OrderNumber
router.get('/:id', adminOrderController.getOrderDetail);

// 3. Các thao tác chuyển trạng thái đơn hàng (State machine actions)
router.patch('/:id/confirm', adminOrderController.confirmOrder);
router.patch('/:id/qc', adminOrderController.updateQcAndReady);
router.patch('/:id/dispatch', adminOrderController.dispatchOrder);
router.patch('/:id/deliver', adminOrderController.markDelivered);
router.patch('/:id/delivery-failed', adminOrderController.markDeliveryFailed);
router.patch('/:id/reschedule', adminOrderController.rescheduleDelivery);
router.patch('/:id/complete', adminOrderController.completeOrder);
router.patch('/:id/cancel', adminOrderController.cancelOrder);
router.patch('/:id/deposit', adminOrderController.recordDeposit);
router.post('/:id/notes', adminOrderController.addInternalNote);

export default router;
