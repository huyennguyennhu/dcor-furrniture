import { Router } from 'express';
import { promotionController } from '../controllers/promotion.controller';

const router = Router();

// Phía Store: Dành cho Giỏ hàng & Thanh toán
router.get('/store/promotions', promotionController.getStorePromotions);
router.post('/store/promotions/verify', promotionController.verifyPromotion);

// Phía Admin: Quản lý Khuyến mãi & Vouchers
router.get('/admin/promotions/vouchers', promotionController.getAdminVouchers);
router.post('/admin/promotions/vouchers', promotionController.upsertAdminVoucher);
router.delete('/admin/promotions/vouchers/:code', promotionController.deleteAdminVoucher);

export default router;
