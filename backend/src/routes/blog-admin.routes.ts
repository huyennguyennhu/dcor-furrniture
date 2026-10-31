import { Router, Response, NextFunction } from 'express';
import { authenticateJWT, AuthRequest } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/iam.middleware';
import { blogAdminController } from '../controllers/blog-admin.controller';

const router = Router();

// ============================================================================
// BẢO VỆ PHÂN HỆ QUẢN TRỊ BLOG (/api/admin/blog)
// ============================================================================

// 1. Xác thực JWT bắt buộc cho toàn bộ router quản trị
router.use(authenticateJWT);

// 2. Chặn tuyệt đối token khách hàng (CUSTOMER) truy cập phân hệ quản trị (trả mã 403)
router.use((req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.type === 'CUSTOMER') {
    res.status(403).json({
      code: 'PERMISSION_DENIED',
      module: 'content',
      message: 'Tài khoản khách hàng không có quyền truy cập phân hệ quản trị.'
    });
    return;
  }
  next();
});

// ============================================================================
// CÁC ENDPOINT QUẢN TRỊ BÀI VIẾT (POSTS)
// ============================================================================

// Danh sách bài viết quản trị (mọi trạng thái, tìm kiếm, phân trang)
router.get('/posts', requirePermission('content', 'view'), blogAdminController.getPosts);

// Chi tiết bài viết quản trị (kèm preview sản phẩm gắn thẻ)
router.get('/posts/:id', requirePermission('content', 'view'), blogAdminController.getPostById);

// Tạo bài viết mới (mặc định DRAFT, tự sinh slug duy nhất)
router.post('/posts', requirePermission('content', 'create'), blogAdminController.createPost);

// Cập nhật thông tin bài viết
router.put('/posts/:id', requirePermission('content', 'edit'), blogAdminController.updatePost);

// Cập nhật nhanh trạng thái bài viết (DRAFT | PUBLISHED | HIDDEN)
router.patch('/posts/:id/status', requirePermission('content', 'edit'), blogAdminController.updatePostStatus);

// Xóa bài viết (xóa cả bình luận và lượt thích)
router.delete('/posts/:id', requirePermission('content', 'delete'), blogAdminController.deletePost);

// ============================================================================
// CÁC ENDPOINT QUẢN TRỊ DANH MỤC BLOG (CATEGORIES)
// ============================================================================

// Danh sách danh mục
router.get('/categories', requirePermission('content', 'view'), blogAdminController.getCategories);

// Tạo danh mục mới
router.post('/categories', requirePermission('content', 'create'), blogAdminController.createCategory);

// Cập nhật danh mục
router.put('/categories/:id', requirePermission('content', 'edit'), blogAdminController.updateCategory);

// Xóa danh mục (chặn nếu còn bài viết)
router.delete('/categories/:id', requirePermission('content', 'delete'), blogAdminController.deleteCategory);

// ============================================================================
// CÁC ENDPOINT KIỂM DUYỆT BÌNH LUẬN (COMMENTS)
// ============================================================================

// Danh sách bình luận cần kiểm duyệt (lọc status, postId)
router.get('/comments', requirePermission('content', 'view'), blogAdminController.getComments);

// Cập nhật trạng thái bình luận (VISIBLE | HIDDEN)
router.patch('/comments/:id/status', requirePermission('content', 'edit'), blogAdminController.updateCommentStatus);

// ============================================================================
// TÌM KIẾM SẢN PHẨM GẮN THẺ (PRODUCTS FOR TAGGING)
// ============================================================================

// Tìm kiếm tối đa 20 sản phẩm đang bán để gắn vào bài viết
router.get('/products/search', requirePermission('content', 'view'), blogAdminController.searchProducts);

export default router;

