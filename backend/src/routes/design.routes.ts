import { Router } from 'express';
import { designController } from '../controllers/design.controller';
import { authenticateJWT } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/iam.middleware';

const router = Router();

// Room Templates (Bản mẫu không gian 3D)
// Storefront public browse khi isActive=true, quản trị admin yêu cầu quyền view
router.get('/templates', (req, res, next) => {
  if (req.query.isActive === 'true' && !req.headers.authorization) {
    return designController.getTemplates(req, res);
  }
  return authenticateJWT(req, res, () => {
    requirePermission('designs', 'view')(req, res, () => designController.getTemplates(req, res));
  });
});
router.post('/templates', authenticateJWT, requirePermission('designs', 'config'), designController.createTemplate);
router.put('/templates/:id', authenticateJWT, requirePermission('designs', 'config'), designController.updateTemplate);
router.delete('/templates/:id', authenticateJWT, requirePermission('designs', 'delete'), designController.deleteTemplate);

// Design Posts (Bài đăng thiết kế cộng đồng & Kiểm duyệt)
// Storefront public xem danh sách bài viết đã duyệt (status=PUBLISHED)
router.get('/posts', (req, res, next) => {
  if (req.query.status === 'PUBLISHED') {
    return designController.getPosts(req, res);
  }
  return authenticateJWT(req, res, () => {
    requirePermission('designs', 'view')(req, res, () => designController.getPosts(req, res));
  });
});
// Khách hàng hoặc Admin đã đăng nhập đều có thể gửi bài đăng thiết kế mới (trạng thái khởi tạo PENDING chờ duyệt)
router.post('/posts', authenticateJWT, designController.createPost);
router.put('/posts/:id/status', authenticateJWT, requirePermission('designs', 'approve'), designController.updatePostStatus);
router.delete('/posts/:id', authenticateJWT, requirePermission('designs', 'delete'), designController.deletePost);

// Comments (Bình luận & Xóa vi phạm)
router.post('/posts/:id/comments', authenticateJWT, designController.addComment);
router.delete('/comments/:id', authenticateJWT, requirePermission('designs', 'delete'), designController.deleteComment);

export default router;
