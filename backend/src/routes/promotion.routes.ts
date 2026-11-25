import { Router } from 'express';
import { promotionController } from '../controllers/promotion.controller';
import { voucherController } from '../controllers/voucher.controller';
import { authenticateJWT } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/iam.middleware';

const router = Router();

// Phía Store: Dành cho Giỏ hàng & Thanh toán & Chiến dịch (đồng bộ trực tiếp từ PostgreSQL)
router.get('/store/promotions', voucherController.getStorePromotions);
router.post('/store/promotions/verify', voucherController.verifyVoucher);
router.get('/store/campaigns', promotionController.getStoreCampaigns);

// Phía Admin: Quản lý Khuyến mãi, Vouchers & Campaigns (yêu cầu JWT & quyền IAM)
router.get('/admin/promotions/vouchers', authenticateJWT, requirePermission('promotions', 'view'), voucherController.getVouchers);
router.post('/admin/promotions/vouchers', authenticateJWT, requirePermission('promotions', 'create'), voucherController.createVoucher);
router.delete('/admin/promotions/vouchers/:id', authenticateJWT, requirePermission('promotions', 'delete'), voucherController.deleteVoucher);

router.get('/admin/promotions/campaigns', authenticateJWT, requirePermission('promotions', 'view'), promotionController.getAdminCampaigns);
router.post('/admin/promotions/campaigns', authenticateJWT, requirePermission('promotions', 'edit'), promotionController.upsertAdminCampaign);
router.delete('/admin/promotions/campaigns/:id', authenticateJWT, requirePermission('promotions', 'delete'), promotionController.deleteAdminCampaign);

export default router;
