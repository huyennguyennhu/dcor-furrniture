import { Router } from 'express';
import { orderReturnController } from '../controllers/order-return.controller';
import { authenticateJWT } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/iam.middleware';

const router = Router();

// =========================================================================
// ROUTE KHÁCH HÀNG (STOREFRONT)
// =========================================================================
router.post('/bulk-request', orderReturnController.createBulkReturnRequest);
router.get('/my-returns', orderReturnController.getMyReturns);
router.get('/detail/:id', orderReturnController.getReturnDetail);

// =========================================================================
// ROUTE QUẢN TRỊ VIÊN (ADMIN PORTAL)
// =========================================================================
router.get('/admin/all', orderReturnController.adminGetReturns);
router.get('/admin/detail/:id', orderReturnController.getReturnDetail);
router.put('/admin/:id/approve', orderReturnController.adminApproveReturn);
router.put('/admin/:id/reject', orderReturnController.adminRejectReturn);
router.put('/admin/:id/dispatch-pickup', orderReturnController.adminDispatchPickup);
router.put('/admin/:id/qc-inspection', orderReturnController.adminQcInspection);
router.post('/admin/:id/execute-exchange', orderReturnController.adminExecuteExchange);
router.post('/admin/:id/execute-refund', orderReturnController.adminExecuteRefund);
router.put('/admin/:id/complete', orderReturnController.adminCompleteReturn);

export default router;
