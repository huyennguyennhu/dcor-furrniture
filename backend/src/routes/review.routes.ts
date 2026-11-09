import { Router } from 'express';
import { reviewController } from '../controllers/review.controller';

const router = Router();

// Lấy danh sách đánh giá của khách hàng (2 tab: đã đánh giá & chưa đánh giá)
router.get('/my-reviews', reviewController.getMyReviews);

// Gửi đánh giá cho đơn hàng
router.post('/', reviewController.submitOrderReviews);
router.post('/:orderNumber', reviewController.submitOrderReviews);

export default router;

