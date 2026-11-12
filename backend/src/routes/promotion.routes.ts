import { Router } from 'express';
import { promotionController } from '../controllers/promotion.controller';

const router = Router();

// Phía Store: Dành cho Giỏ hàng & Thanh toán & Chiến dịch
router.get('/store/promotions', promotionController.getStorePromotions);
router.post('/store/promotions/verify', promotionController.verifyPromotion);
router.get('/store/campaigns', promotionController.getStoreCampaigns);

// Phía Admin: Quản lý Khuyến mãi, Vouchers & Campaigns
router.get('/admin/promotions/vouchers', promotionController.getAdminVouchers);
router.post('/admin/promotions/vouchers', promotionController.upsertAdminVoucher);
router.delete('/admin/promotions/vouchers/:code', promotionController.deleteAdminVoucher);
router.get('/admin/promotions/campaigns', promotionController.getAdminCampaigns);
router.post('/admin/promotions/campaigns', promotionController.upsertAdminCampaign);
router.delete('/admin/promotions/campaigns/:id', promotionController.deleteAdminCampaign);

export default router;
