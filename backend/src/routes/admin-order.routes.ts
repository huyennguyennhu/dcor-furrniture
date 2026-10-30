import { Router } from 'express';
import { adminOrderController } from '../controllers/admin-order.controller';
import { authenticateJWT } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/iam.middleware';

const router = Router();

// Toàn bộ các API Quản lý Đơn hàng yêu cầu xác thực JWT hợp lệ của nhân viên
router.use(authenticateJWT);

// 1. Danh sách đơn hàng
router.get('/', requirePermission('orders', 'view'), adminOrderController.getOrders);

// 2. Chi tiết đơn hàng theo ID hoặc OrderNumber
router.get('/:id', requirePermission('orders', 'view'), adminOrderController.getOrderDetail);

// 3. Các thao tác chuyển trạng thái đơn hàng (State machine actions) & chỉnh sửa
router.patch('/:id/confirm', requirePermission('orders', 'edit'), adminOrderController.confirmOrder);
router.patch('/:id/qc', requirePermission('orders', 'edit'), adminOrderController.updateQcAndReady);
router.patch('/:id/dispatch', requirePermission('orders', 'edit'), adminOrderController.dispatchOrder);
router.patch('/:id/deliver', requirePermission('orders', 'edit'), adminOrderController.markDelivered);
router.patch('/:id/delivery-failed', requirePermission('orders', 'edit'), adminOrderController.markDeliveryFailed);
router.patch('/:id/reschedule', requirePermission('orders', 'edit'), adminOrderController.rescheduleDelivery);
router.patch('/:id/complete', requirePermission('orders', 'edit'), adminOrderController.completeOrder);
router.patch('/:id/cancel', requirePermission('orders', 'cancel'), adminOrderController.cancelOrder);
router.patch('/:id/deposit', requirePermission('orders', 'edit'), adminOrderController.recordDeposit);
router.post('/:id/notes', requirePermission('orders', 'edit'), adminOrderController.addInternalNote);

export default router;
