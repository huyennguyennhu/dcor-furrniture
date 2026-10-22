import { Request, Response } from 'express';
import prisma, { withDbRetry } from '../lib/prisma';
import { memoryCache, CACHE_KEYS } from '../lib/cache';

export const designController = {
  // =========================================================================
  // ROOM TEMPLATES (Bản mẫu không gian 3D)
  // =========================================================================

  // Lấy danh sách Room Templates (Được cache trong RAM phản hồi ~1ms)
  getTemplates: async (req: Request, res: Response): Promise<void> => {
    try {
      const { isActive, roomType } = req.query;
      const cacheKey = `designs_templates_${isActive ?? 'all'}_${roomType ?? 'all'}`;

      const cached = memoryCache.get<any[]>(cacheKey, 60000);
      if (cached) {
        res.json(cached);
        return;
      }

      const where: any = {};

      if (isActive !== undefined) {
        where.isActive = isActive === 'true' || isActive === '1';
      }

      if (roomType && typeof roomType === 'string') {
        where.roomType = roomType;
      }

      const templates = await withDbRetry(() =>
        (prisma as any).roomTemplate.findMany({
          where,
          orderBy: { createdAt: 'desc' }
        })
      );

      memoryCache.set(cacheKey, templates);
      res.json(templates);
    } catch (error: any) {
      console.error('[ERROR] Lấy danh sách RoomTemplate thất bại:', error);
      res.status(500).json({ message: 'Không thể lấy danh sách bản mẫu không gian.', error: error.message });
    }
  },

  // Tạo Room Template mới (Admin)
  createTemplate: async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        name,
        roomType,
        description,
        imageUrl,
        length,
        width,
        height,
        suggestedProducts,
        isActive
      } = req.body;

      if (!name || !roomType || !imageUrl || length === undefined || width === undefined) {
        res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ tên, loại phòng, ảnh đại diện, chiều dài và chiều rộng.' });
        return;
      }

      const template = await withDbRetry(() =>
        (prisma as any).roomTemplate.create({
          data: {
            name: String(name).trim(),
            roomType: String(roomType).trim(),
            description: description ? String(description).trim() : null,
            imageUrl: String(imageUrl).trim(),
            length: Number(length),
            width: Number(width),
            height: height !== undefined ? Number(height) : 2.8,
            suggestedProducts: suggestedProducts || null,
            isActive: isActive !== undefined ? !!isActive : true
          }
        })
      );

      memoryCache.clear();
      res.status(201).json(template);
    } catch (error: any) {
      console.error('[ERROR] Tạo RoomTemplate thất bại:', error);
      res.status(500).json({ message: 'Không thể tạo bản mẫu không gian.', error: error.message });
    }
  },

  // Chỉnh sửa / Ẩn hiện Room Template (Admin)
  updateTemplate: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const {
        name,
        roomType,
        description,
        imageUrl,
        length,
        width,
        height,
        suggestedProducts,
        isActive
      } = req.body;

      const existing = await withDbRetry(() => (prisma as any).roomTemplate.findUnique({ where: { id } }));
      if (!existing) {
        res.status(404).json({ message: 'Không tìm thấy bản mẫu không gian cần cập nhật.' });
        return;
      }

      const updateData: any = {};
      if (name) updateData.name = String(name).trim();
      if (roomType) updateData.roomType = String(roomType).trim();
      if (description !== undefined) updateData.description = description ? String(description).trim() : null;
      if (imageUrl) updateData.imageUrl = String(imageUrl).trim();
      if (length !== undefined) updateData.length = Number(length);
      if (width !== undefined) updateData.width = Number(width);
      if (height !== undefined) updateData.height = Number(height);
      if (suggestedProducts !== undefined) updateData.suggestedProducts = suggestedProducts;
      if (isActive !== undefined) updateData.isActive = !!isActive;

      const updated = await withDbRetry(() =>
        (prisma as any).roomTemplate.update({
          where: { id },
          data: updateData
        })
      );

      memoryCache.clear();
      res.json(updated);
    } catch (error: any) {
      console.error('[ERROR] Cập nhật RoomTemplate thất bại:', error);
      res.status(500).json({ message: 'Không thể cập nhật bản mẫu không gian.', error: error.message });
    }
  },

  // Xóa Room Template (Admin)
  deleteTemplate: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const existing = await withDbRetry(() => (prisma as any).roomTemplate.findUnique({ where: { id } }));
      if (!existing) {
        res.status(404).json({ message: 'Không tìm thấy bản mẫu để xóa.' });
        return;
      }

      await withDbRetry(() => (prisma as any).roomTemplate.delete({ where: { id } }));
      memoryCache.clear();
      res.json({ success: true, message: 'Đã xóa bản mẫu thành công.' });
    } catch (error: any) {
      console.error('[ERROR] Xóa RoomTemplate thất bại:', error);
      res.status(500).json({ message: 'Không thể xóa bản mẫu không gian.', error: error.message });
    }
  },

  // =========================================================================
  // COMMUNITY DESIGN POSTS & COMMENTS (Kiểm duyệt bài đăng & Bình luận)
  // =========================================================================

  // Lấy danh sách bài đăng thiết kế (Hỗ trợ lọc status, cache RAM phản hồi ~1ms)
  getPosts: async (req: Request, res: Response): Promise<void> => {
    try {
      const { status, search } = req.query;
      const cacheKey = `designs_posts_${status ?? 'all'}_${search ? String(search).trim() : 'none'}`;

      const cached = memoryCache.get<any[]>(cacheKey, 60000);
      if (cached) {
        res.json(cached);
        return;
      }

      const where: any = {};

      if (status && typeof status === 'string' && status !== 'ALL') {
        where.status = status;
      }

      if (search && typeof search === 'string') {
        where.OR = [
          { title: { contains: search.trim(), mode: 'insensitive' } },
          { authorName: { contains: search.trim(), mode: 'insensitive' } },
          { description: { contains: search.trim(), mode: 'insensitive' } }
        ];
      }

      const posts = await withDbRetry(() =>
        (prisma as any).designPost.findMany({
          where,
          include: {
            comments: {
              orderBy: { createdAt: 'desc' }
            }
          },
          orderBy: { createdAt: 'desc' }
        })
      );

      memoryCache.set(cacheKey, posts);
      res.json(posts);
    } catch (error: any) {
      console.error('[ERROR] Lấy danh sách bài đăng thiết kế thất bại:', error);
      res.status(500).json({ message: 'Không thể tải danh sách bài đăng.', error: error.message });
    }
  },

  // Đăng bài viết thiết kế mới
  createPost: async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        title,
        authorName,
        authorEmail,
        description,
        imageUrl,
        taggedProducts
      } = req.body;

      if (!title || !authorName || !imageUrl) {
        res.status(400).json({ message: 'Vui lòng cung cấp tiêu đề, tên tác giả và hình ảnh thiết kế.' });
        return;
      }

      const post = await withDbRetry(() =>
        (prisma as any).designPost.create({
          data: {
            title: String(title).trim(),
            authorName: String(authorName).trim(),
            authorEmail: authorEmail ? String(authorEmail).trim() : null,
            description: description ? String(description).trim() : null,
            imageUrl: String(imageUrl).trim(),
            taggedProducts: taggedProducts || null,
            status: 'PENDING',
            likesCount: 0
          }
        })
      );

      memoryCache.clear();
      res.status(201).json(post);
    } catch (error: any) {
      console.error('[ERROR] Tạo bài đăng thiết kế thất bại:', error);
      res.status(500).json({ message: 'Không thể tạo bài đăng thiết kế.', error: error.message });
    }
  },

  // Duyệt bài ('PUBLISHED') hoặc Từ chối ('REJECTED') hoặc Ẩn vi phạm (Admin)
  updatePostStatus: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { status, rejectionReason } = req.body;

      if (!status || !['PUBLISHED', 'REJECTED', 'PENDING'].includes(status)) {
        res.status(400).json({ message: 'Trạng thái duyệt bài không hợp lệ (hỗ trợ PUBLISHED, REJECTED, PENDING).' });
        return;
      }

      const existing = await withDbRetry(() => (prisma as any).designPost.findUnique({ where: { id } }));
      if (!existing) {
        res.status(404).json({ message: 'Không tìm thấy bài đăng thiết kế.' });
        return;
      }

      const updated = await withDbRetry(() =>
        (prisma as any).designPost.update({
          where: { id },
          data: {
            status,
            rejectionReason: rejectionReason ? String(rejectionReason).trim() : (status === 'PUBLISHED' ? null : (existing as any).rejectionReason)
          },
          include: {
            comments: true
          }
        })
      );

      memoryCache.clear();
      res.json(updated);
    } catch (error: any) {
      console.error('[ERROR] Cập nhật trạng thái bài đăng thất bại:', error);
      res.status(500).json({ message: 'Không thể cập nhật trạng thái bài đăng.', error: error.message });
    }
  },

  // Xóa bài viết thiết kế (Admin)
  deletePost: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const existing = await withDbRetry(() => (prisma as any).designPost.findUnique({ where: { id } }));
      if (!existing) {
        res.status(404).json({ message: 'Không tìm thấy bài đăng để xóa.' });
        return;
      }

      await withDbRetry(() => (prisma as any).designPost.delete({ where: { id } }));
      memoryCache.clear();
      res.json({ success: true, message: 'Đã xóa bài đăng thành công.' });
    } catch (error: any) {
      console.error('[ERROR] Xóa bài đăng thất bại:', error);
      res.status(500).json({ message: 'Không thể xóa bài đăng.', error: error.message });
    }
  },

  // Thêm bình luận cho bài đăng
  addComment: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params; // postId
      const { authorName, content } = req.body;

      if (!authorName || !content) {
        res.status(400).json({ message: 'Vui lòng cung cấp tên người bình luận và nội dung.' });
        return;
      }

      const post = await withDbRetry(() => (prisma as any).designPost.findUnique({ where: { id } }));
      if (!post) {
        res.status(404).json({ message: 'Bài viết không tồn tại.' });
        return;
      }

      const comment = await withDbRetry(() =>
        (prisma as any).designComment.create({
          data: {
            postId: id,
            authorName: String(authorName).trim(),
            content: String(content).trim(),
            status: 'VISIBLE'
          }
        })
      );

      memoryCache.clear();
      res.status(201).json(comment);
    } catch (error: any) {
      console.error('[ERROR] Thêm bình luận thất bại:', error);
      res.status(500).json({ message: 'Không thể thêm bình luận.', error: error.message });
    }
  },

  // Xóa bình luận vi phạm hoặc ẩn bình luận (Admin)
  deleteComment: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const existing = await withDbRetry(() => (prisma as any).designComment.findUnique({ where: { id } }));
      if (!existing) {
        res.status(404).json({ message: 'Không tìm thấy bình luận.' });
        return;
      }

      await withDbRetry(() => (prisma as any).designComment.delete({ where: { id } }));
      memoryCache.clear();
      res.json({ success: true, message: 'Đã xóa bình luận vi phạm thành công.' });
    } catch (error: any) {
      console.error('[ERROR] Xóa bình luận thất bại:', error);
      res.status(500).json({ message: 'Không thể xóa bình luận.', error: error.message });
    }
  }
};
