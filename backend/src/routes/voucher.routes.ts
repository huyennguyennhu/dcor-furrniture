import { Router } from 'express';
import { voucherController } from '../controllers/voucher.controller';
import { authenticateJWT } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/iam.middleware';

const router = Router();

// Storefront & Verification (Public cho khách mua hàng áp dụng mã)
router.post('/verify', voucherController.verifyVoucher);

// Admin CRUD - Phân hệ Khuyến mãi & Voucher
router.get('/', authenticateJWT, requirePermission('promotions', 'view'), voucherController.getVouchers);
router.post('/', authenticateJWT, requirePermission('promotions', 'create'), voucherController.createVoucher);
router.put('/:id', authenticateJWT, requirePermission('promotions', 'edit'), voucherController.updateVoucher);
router.delete('/:id', authenticateJWT, requirePermission('promotions', 'delete'), voucherController.deleteVoucher);

export default router;
