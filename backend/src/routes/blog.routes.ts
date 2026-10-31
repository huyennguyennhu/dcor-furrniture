import { Router } from 'express';
import {
  blogController,
  optionalCustomerAuth,
  requireCustomerAuth
} from '../controllers/blog.controller';

const router = Router();

// ============================================================================
// API CÔNG KHAI BLOG DCOR (/api/blog)
// ============================================================================

// 1. Danh sách danh mục công khai
router.get('/categories', blogController.getCategories);

// 2. Danh sách bài viết công khai (lọc category, tag, q, phân trang)
router.get('/posts', blogController.getPosts);

// 3. Chi tiết bài viết công khai (kèm viewer.liked nếu đăng nhập, tăng viewsCount)
router.get('/posts/:slug', optionalCustomerAuth, blogController.getPostBySlug);

// 4. Like / Unlike bài viết (Token khách, toggle)
router.post('/posts/:slug/like', requireCustomerAuth, blogController.likePost);

// 5. Danh sách bình luận công khai (chỉ VISIBLE, cờ isMine nếu đăng nhập)
router.get('/posts/:slug/comments', optionalCustomerAuth, blogController.getComments);

// 6. Gửi bình luận mới (Token khách, <= 500 ký tự, max 10/phút)
router.post('/posts/:slug/comments', requireCustomerAuth, blogController.createComment);

// 7. Xóa bình luận (Token khách, chỉ chính chủ bình luận)
router.delete('/comments/:id', requireCustomerAuth, blogController.deleteComment);

export default router;

