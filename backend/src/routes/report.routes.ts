import { Router } from 'express';
import { reportController } from '../controllers/report.controller';

const router = Router();

// 1. Báo cáo doanh thu
router.get('/revenue', reportController.getRevenueReport);

// 2. Báo cáo đơn hàng
router.get('/orders', reportController.getOrdersReport);

// 3. Báo cáo sản phẩm
router.get('/products', reportController.getProductsReport);

// 4. Báo cáo khách hàng
router.get('/customers', reportController.getCustomersReport);

export default router;
