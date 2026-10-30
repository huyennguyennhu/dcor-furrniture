import { Router } from 'express';
import { reportController } from '../controllers/report.controller';
import { authenticateJWT } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/iam.middleware';

const router = Router();

// Phân hệ Báo cáo & Thống kê yêu cầu quyền xem báo cáo
router.use(authenticateJWT);
router.use(requirePermission('reports', 'view'));

// 1. Báo cáo doanh thu
router.get('/revenue', reportController.getRevenueReport);

// 2. Báo cáo đơn hàng
router.get('/orders', reportController.getOrdersReport);

// 3. Báo cáo sản phẩm
router.get('/products', reportController.getProductsReport);

// 4. Báo cáo khách hàng
router.get('/customers', reportController.getCustomersReport);

// 5. Báo cáo tổng quan
router.get('/overview', reportController.getOverviewReport);

export default router;
