import { Router } from 'express';
import { designController } from '../controllers/design.controller';

const router = Router();

// Room Templates (Bản mẫu không gian 3D)
router.get('/templates', designController.getTemplates);
router.post('/templates', designController.createTemplate);
router.put('/templates/:id', designController.updateTemplate);
router.delete('/templates/:id', designController.deleteTemplate);

// Design Posts (Bài đăng thiết kế cộng đồng & Kiểm duyệt)
router.get('/posts', designController.getPosts);
router.post('/posts', designController.createPost);
router.put('/posts/:id/status', designController.updatePostStatus);
router.delete('/posts/:id', designController.deletePost);

// Comments (Bình luận & Xóa vi phạm)
router.post('/posts/:id/comments', designController.addComment);
router.delete('/comments/:id', designController.deleteComment);

export default router;
