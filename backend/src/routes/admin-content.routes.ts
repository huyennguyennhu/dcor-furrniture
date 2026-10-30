import { Router, Request, Response } from 'express';
import { authenticateJWT } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/iam.middleware';

const router = Router();

// In-memory / mock blog data storage
let articles: any[] = [
  {
    id: 'post-1',
    title: 'Xu hướng thiết kế nội thất tối giản phong cách Bắc Âu 2026',
    slug: 'xu-huong-thiet-ke-noi-that-toi-gian-bac-au-2026',
    category: 'Xu hướng',
    author: 'Ban Biên Tập DCOR',
    status: 'PUBLISHED',
    views: 1240,
    createdAt: '2026-02-15'
  },
  {
    id: 'post-2',
    title: 'Bí quyết bảo quản sofa da thật luôn bền đẹp như mới',
    slug: 'bi-quyet-bao-quan-sofa-da-that-ben-dep',
    category: 'Mẹo không gian',
    author: 'Chuyên gia Nội thất',
    status: 'PUBLISHED',
    views: 890,
    createdAt: '2026-03-01'
  }
];

// Bảo vệ toàn bộ phân hệ Content Blog bằng JWT
router.use(authenticateJWT);

// 1. Danh sách bài viết
router.get('/', requirePermission('content', 'view'), (req: Request, res: Response) => {
  res.json(articles);
});

// 2. Tạo bài viết mới
router.post('/', requirePermission('content', 'create'), (req: Request, res: Response) => {
  const { title, category, content, status } = req.body;
  if (!title) {
    res.status(400).json({ message: 'Tiêu đề bài viết không được để trống.' });
    return;
  }

  const newPost = {
    id: 'post-' + Date.now(),
    title: String(title).trim(),
    slug: String(title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    category: category || 'Kiến thức',
    content: content || '',
    author: (req as any).user?.fullName || 'Admin',
    status: status || 'DRAFT',
    views: 0,
    createdAt: new Date().toISOString().split('T')[0]
  };

  articles.unshift(newPost);
  res.status(201).json({ message: 'Tạo bài viết thành công.', article: newPost });
});

// 3. Sửa bài viết
router.put('/:id', requirePermission('content', 'edit'), (req: Request, res: Response) => {
  const post = articles.find(a => a.id === req.params.id);
  if (!post) {
    res.status(404).json({ message: 'Không tìm thấy bài viết.' });
    return;
  }

  Object.assign(post, req.body);
  res.json({ message: 'Cập nhật bài viết thành công.', article: post });
});

// 4. Xóa bài viết
router.delete('/:id', requirePermission('content', 'delete'), (req: Request, res: Response) => {
  const idx = articles.findIndex(a => a.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ message: 'Không tìm thấy bài viết.' });
    return;
  }

  articles.splice(idx, 1);
  res.json({ message: 'Đã xóa bài viết thành công.' });
});

export default router;
