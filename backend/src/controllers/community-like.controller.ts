import { Response } from 'express';
import prisma, { withDbRetry } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth.middleware';
import { memoryCache } from '../lib/cache';

export const communityLikeController = {
  // 1. Thích / Bỏ thích bài viết thiết kế cộng đồng (Toggle trong transaction)
  toggleLike: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params; // postId
      const customerId = req.user.userId;

      if (!id || typeof id !== 'string' || !id.trim()) {
        res.status(400).json({ message: 'Mã bài viết thiết kế không hợp lệ.' });
        return;
      }

      const post: any = await withDbRetry<any>(() =>
        (prisma as any).designPost.findUnique({
          where: { id: id.trim() }
        })
      );

      if (!post) {
        res.status(404).json({ message: 'Không tìm thấy bài viết thiết kế.' });
        return;
      }

      if (post.status !== 'PUBLISHED') {
        res.status(400).json({ message: 'Chỉ có thể thích bài viết đã được công khai.' });
        return;
      }

      const result = await withDbRetry<any>(() =>
        prisma.$transaction(async (tx: any) => {
          const existingLike = await tx.designPostLike.findUnique({
            where: {
              postId_customerId: {
                postId: id.trim(),
                customerId
              }
            }
          });

          if (existingLike) {
            // Đã thích -> Bỏ thích
            await tx.designPostLike.delete({
              where: { id: existingLike.id }
            });

            const current = await tx.designPost.findUnique({
              where: { id: id.trim() },
              select: { likesCount: true }
            });

            const newLikesCount = Math.max(0, (current?.likesCount ?? 1) - 1);

            const updatedPost = await tx.designPost.update({
              where: { id: id.trim() },
              data: { likesCount: newLikesCount },
              select: { likesCount: true }
            });

            return { liked: false, likesCount: updatedPost.likesCount };
          } else {
            // Chưa thích -> Thích
            await tx.designPostLike.create({
              data: {
                postId: id.trim(),
                customerId
              }
            });

            const updatedPost = await tx.designPost.update({
              where: { id: id.trim() },
              data: {
                likesCount: { increment: 1 }
              },
              select: { likesCount: true }
            });

            return { liked: true, likesCount: updatedPost.likesCount };
          }
        })
      );

      // Xóa cache RAM để danh sách bài viết cộng đồng lập tức cập nhật số like mới
      memoryCache.clear();

      res.json(result);
    } catch (error: any) {
      console.error('[ERROR] Thao tác thích bài viết thất bại:', error);
      res.status(500).json({ message: 'Không thể cập nhật lượt thích bài viết.', error: error.message });
    }
  },

  // 2. Lấy danh sách ID các bài viết cộng đồng khách hàng đã thích (để tô màu tim)
  getMyLikes: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const customerId = req.user.userId;

      const likes: any = await withDbRetry<any>(() =>
        (prisma as any).designPostLike.findMany({
          where: { customerId },
          select: { postId: true }
        })
      );

      const postIds = Array.isArray(likes) ? likes.map((l: any) => l.postId) : [];
      res.json(postIds);
    } catch (error: any) {
      console.error('[ERROR] Lấy danh sách thích của tôi thất bại:', error);
      res.status(500).json({ message: 'Không thể tải danh sách bài viết đã thích.', error: error.message });
    }
  }
};
