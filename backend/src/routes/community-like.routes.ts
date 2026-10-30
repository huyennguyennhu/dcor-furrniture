import { Router } from 'express';
import { authenticateJWT } from '../middleware/auth.middleware';
import { communityLikeController } from '../controllers/community-like.controller';
import { requireCustomer } from '../controllers/my-design.controller';

const router = Router();

// Yêu cầu xác thực tài khoản khách hàng hợp lệ
router.use(authenticateJWT);
router.use(requireCustomer);

// Lấy danh sách ID các bài viết đã thích (đặt trước /:id/like để tránh xung đột param)
router.get('/likes/mine', communityLikeController.getMyLikes);

// Thích hoặc bỏ thích bài viết thiết kế cộng đồng
router.post('/:id/like', communityLikeController.toggleLike);

export default router;

