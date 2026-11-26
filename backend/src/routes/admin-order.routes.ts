import { Router } from 'express';
import { adminOrderController } from '../controllers/admin-order.controller';
import { optionalAuth } from '../middleware/auth.middleware';

const router = Router();

// Hỗ trợ xác thực linh hoạt optionalAuth (tương thích cả Admin JWT token và dev session)
router.use(optionalAuth);

// 1. Danh sách đơn hàng
router.get('/', adminOrderController.getOrders);

// 2. Chi tiết đơn hàng theo ID hoặc OrderNumber
router.get('/:id', adminOrderController.getOrderDetail);

// 3. Các thao tác chuyển trạng thái đơn hàng (State machine actions) & chỉnh sửa
router.patch('/:id/confirm', adminOrderController.confirmOrder);
router.patch('/:id/start-processing', adminOrderController.startProcessing);
router.patch('/:id/qc', adminOrderController.updateQcAndReady);
router.patch('/:id/qc-checklist', adminOrderController.updateQcChecklistOnly);
router.patch('/:id/dispatch', adminOrderController.dispatchOrder);
router.patch('/:id/deliver', adminOrderController.markDelivered);
router.patch('/:id/delivery-failed', adminOrderController.markDeliveryFailed);
router.patch('/:id/reschedule', adminOrderController.rescheduleDelivery);
router.patch('/:id/complete', adminOrderController.completeOrder);
router.patch('/:id/cancel', adminOrderController.cancelOrder);
router.patch('/:id/deposit', adminOrderController.recordDeposit);
router.post('/:id/notes', adminOrderController.addInternalNote);

export default router;
