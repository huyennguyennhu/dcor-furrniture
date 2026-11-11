import { Response, NextFunction } from 'express';
import prisma, { withDbRetry } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth.middleware';

/**
 * Middleware xác thực token khách hàng (CUSTOMER) và kiểm tra khách hàng tồn tại trong database
 */
export const requireCustomer = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const user = req.user;
  if (!user || user.type !== 'CUSTOMER' || !user.userId) {
    res.status(403).json({ message: 'Quyền truy cập bị từ chối. Vui lòng đăng nhập bằng tài khoản khách hàng.' });
    return;
  }

  try {
    const customer = await withDbRetry<any>(() =>
      prisma.customer.findFirst({
        where: {
          id: user.userId,
          deletedAt: null
        },
        select: { id: true }
      })
    );

    if (!customer) {
      res.status(401).json({ message: 'Tài khoản khách hàng không tồn tại hoặc đã bị khóa.' });
      return;
    }

    next();
  } catch (err: any) {
    console.error('[ERROR] Lỗi kiểm tra khách hàng:', err);
    res.status(500).json({ message: 'Lỗi xác thực thông tin khách hàng từ hệ thống.' });
  }
};

// ============================================================================
// HÀM TIỆN ÍCH KIỂM TRA DỮ LIỆU ĐẦU VÀO (VALIDATION)
// ============================================================================

function isValidTitle(title: any): boolean {
  return typeof title === 'string' && title.trim().length > 0 && title.trim().length <= 100;
}

function isValidDimension(val: any): boolean {
  const num = Number(val);
  return !isNaN(num) && num >= 1 && num <= 30;
}

function isValidHeight(val: any): boolean {
  if (val === undefined || val === null) return true;
  const num = Number(val);
  return !isNaN(num) && num > 0 && num <= 30;
}

function isValidUrlOrAsset(url: any, required: boolean = true): boolean {
  if (!url) return !required;
  if (typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed) return !required;
  return trimmed.startsWith('https://') || trimmed.startsWith('/assets/');
}

function isValidBackgroundType(type: any): boolean {
  return type === 'TEMPLATE' || type === 'UPLOAD';
}

function isValidLayout(layout: any): boolean {
  return Array.isArray(layout) && layout.length <= 200;
}

function extractLayoutCount(layout: any): number {
  if (!layout) return 0;
  let parsed = layout;
  if (typeof parsed === 'string') {
    try {
      parsed = JSON.parse(parsed);
    } catch {
      return 0;
    }
  }
  if (Array.isArray(parsed)) return parsed.length;
  if (parsed && typeof parsed === 'object') {
    if (Array.isArray(parsed.objects)) return parsed.objects.length;
    if (Array.isArray(parsed.items)) return parsed.items.length;
    if (Array.isArray(parsed.layout)) return parsed.layout.length;
  }
  return 0;
}

// ============================================================================
// CONTROLLER THIẾT KẾ CỦA TÔI
// ============================================================================

export const myDesignController = {
  // 1. Tạo thiết kế mới (mặc định DRAFT)
  createDesign: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const customerId = req.user.userId;
      const {
        title,
        backgroundType,
        backgroundUrl,
        templateId,
        roomLength,
        roomWidth,
        roomHeight,
        layout,
        coverImageUrl
      } = req.body;

      if (!isValidTitle(title)) {
        res.status(400).json({ message: 'Tiêu đề thiết kế là bắt buộc và không được vượt quá 100 ký tự.' });
        return;
      }

      if (!isValidBackgroundType(backgroundType)) {
        res.status(400).json({ message: 'Loại hình nền không hợp lệ (hỗ trợ TEMPLATE hoặc UPLOAD).' });
        return;
      }

      if (!isValidUrlOrAsset(backgroundUrl, true)) {
        res.status(400).json({ message: 'Đường dẫn ảnh nền phải là URL https:// hoặc đường dẫn /assets/...' });
        return;
      }

      if (!isValidDimension(roomLength)) {
        res.status(400).json({ message: 'Chiều dài phòng phải từ 1m đến 30m.' });
        return;
      }

      if (!isValidDimension(roomWidth)) {
        res.status(400).json({ message: 'Chiều rộng phòng phải từ 1m đến 30m.' });
        return;
      }

      if (!isValidHeight(roomHeight)) {
        res.status(400).json({ message: 'Chiều cao phòng không hợp lệ (từ 0.1m đến 30m).' });
        return;
      }

      if (layout !== undefined && !isValidLayout(layout)) {
        res.status(400).json({ message: 'Bố cục layout phải là mảng không quá 200 phần tử.' });
        return;
      }

      if (coverImageUrl !== undefined && !isValidUrlOrAsset(coverImageUrl, false)) {
        res.status(400).json({ message: 'Ảnh bìa phải là URL https:// hoặc đường dẫn /assets/...' });
        return;
      }

      const design = await withDbRetry<any>(() =>
        (prisma as any).userDesign.create({
          data: {
            customerId,
            title: title.trim(),
            status: 'DRAFT',
            backgroundType,
            backgroundUrl: backgroundUrl.trim(),
            templateId: templateId ? String(templateId).trim() : null,
            roomLength: Number(roomLength),
            roomWidth: Number(roomWidth),
            roomHeight: roomHeight !== undefined && roomHeight !== null ? Number(roomHeight) : null,
            layout: Array.isArray(layout) ? layout : [],
            coverImageUrl: coverImageUrl ? String(coverImageUrl).trim() : null,
            lastEditedAt: new Date()
          }
        })
      );

      res.status(201).json(design);
    } catch (error: any) {
      console.error('[ERROR] Tạo thiết kế thất bại:', error);
      res.status(500).json({ message: 'Không thể tạo bản thiết kế.', error: error.message });
    }
  },

  // 2. Tự lưu nội dung thiết kế (chỉ chủ sở hữu, cập nhật lastEditedAt = now)
  updateDesign: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const customerId = req.user.userId;

      const existing: any = await withDbRetry<any>(() =>
        (prisma as any).userDesign.findUnique({
          where: { id }
        })
      );

      if (!existing) {
        res.status(404).json({ message: 'Không tìm thấy thiết kế.' });
        return;
      }

      if (existing.customerId !== customerId) {
        res.status(403).json({ message: 'Bạn không có quyền chỉnh sửa thiết kế này.' });
        return;
      }

      const {
        title,
        backgroundType,
        backgroundUrl,
        templateId,
        roomLength,
        roomWidth,
        roomHeight,
        layout,
        coverImageUrl
      } = req.body;

      if (title !== undefined && !isValidTitle(title)) {
        res.status(400).json({ message: 'Tiêu đề thiết kế không hợp lệ (tối đa 100 ký tự).' });
        return;
      }

      if (backgroundType !== undefined && !isValidBackgroundType(backgroundType)) {
        res.status(400).json({ message: 'Loại hình nền không hợp lệ (hỗ trợ TEMPLATE hoặc UPLOAD).' });
        return;
      }

      if (backgroundUrl !== undefined && !isValidUrlOrAsset(backgroundUrl, true)) {
        res.status(400).json({ message: 'Đường dẫn ảnh nền phải là URL https:// hoặc đường dẫn /assets/...' });
        return;
      }

      if (roomLength !== undefined && !isValidDimension(roomLength)) {
        res.status(400).json({ message: 'Chiều dài phòng phải từ 1m đến 30m.' });
        return;
      }

      if (roomWidth !== undefined && !isValidDimension(roomWidth)) {
        res.status(400).json({ message: 'Chiều rộng phòng phải từ 1m đến 30m.' });
        return;
      }

      if (roomHeight !== undefined && !isValidHeight(roomHeight)) {
        res.status(400).json({ message: 'Chiều cao phòng không hợp lệ (từ 0.1m đến 30m).' });
        return;
      }

      if (layout !== undefined && !isValidLayout(layout)) {
        res.status(400).json({ message: 'Bố cục layout phải là mảng không quá 200 phần tử.' });
        return;
      }

      if (coverImageUrl !== undefined && !isValidUrlOrAsset(coverImageUrl, false)) {
        res.status(400).json({ message: 'Ảnh bìa phải là URL https:// hoặc đường dẫn /assets/...' });
        return;
      }

      const updated = await withDbRetry<any>(() =>
        (prisma as any).userDesign.update({
          where: { id },
          data: {
            ...(title !== undefined && { title: title.trim() }),
            ...(backgroundType !== undefined && { backgroundType }),
            ...(backgroundUrl !== undefined && { backgroundUrl: backgroundUrl.trim() }),
            ...(templateId !== undefined && { templateId: templateId ? String(templateId).trim() : null }),
            ...(roomLength !== undefined && { roomLength: Number(roomLength) }),
            ...(roomWidth !== undefined && { roomWidth: Number(roomWidth) }),
            ...(roomHeight !== undefined && { roomHeight: roomHeight !== null ? Number(roomHeight) : null }),
            ...(layout !== undefined && { layout }),
            ...(coverImageUrl !== undefined && { coverImageUrl: coverImageUrl ? String(coverImageUrl).trim() : null }),
            lastEditedAt: new Date()
          }
        })
      );

      res.json(updated);
    } catch (error: any) {
      console.error('[ERROR] Lưu thiết kế thất bại:', error);
      res.status(500).json({ message: 'Không thể cập nhật thiết kế.', error: error.message });
    }
  },

  // 3. Chuyển trạng thái từ DRAFT sang SAVED (nhận title)
  saveDesign: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const customerId = req.user.userId;
      const { title, coverImageUrl, layout, roomLength, roomWidth, roomHeight } = req.body;

      const existing: any = await withDbRetry<any>(() =>
        (prisma as any).userDesign.findUnique({
          where: { id }
        })
      );

      if (!existing) {
        res.status(404).json({ message: 'Không tìm thấy thiết kế.' });
        return;
      }

      if (existing.customerId !== customerId) {
        res.status(403).json({ message: 'Bạn không có quyền lưu thiết kế này.' });
        return;
      }

      if (title !== undefined && !isValidTitle(title)) {
        res.status(400).json({ message: 'Tiêu đề thiết kế không hợp lệ (tối đa 100 ký tự).' });
        return;
      }

      if (coverImageUrl !== undefined && !isValidUrlOrAsset(coverImageUrl, false)) {
        res.status(400).json({ message: 'Ảnh bìa phải là URL https:// hoặc đường dẫn /assets/...' });
        return;
      }

      if (layout !== undefined && !isValidLayout(layout)) {
        res.status(400).json({ message: 'Bố cục layout phải là mảng không quá 200 phần tử.' });
        return;
      }

      const updated = await withDbRetry<any>(() =>
        (prisma as any).userDesign.update({
          where: { id },
          data: {
            status: 'SAVED',
            ...(title !== undefined && { title: title.trim() }),
            ...(coverImageUrl !== undefined && { coverImageUrl: coverImageUrl ? String(coverImageUrl).trim() : null }),
            ...(layout !== undefined && { layout: Array.isArray(layout) ? layout : [] }),
            ...(roomLength !== undefined && { roomLength: Number(roomLength) }),
            ...(roomWidth !== undefined && { roomWidth: Number(roomWidth) }),
            ...(roomHeight !== undefined && { roomHeight: roomHeight !== null ? Number(roomHeight) : null }),
            lastEditedAt: new Date()
          }
        })
      );

      res.json(updated);
    } catch (error: any) {
      console.error('[ERROR] Lưu chính thức thiết kế thất bại:', error);
      res.status(500).json({ message: 'Không thể chuyển trạng thái thiết kế sang Đã lưu.', error: error.message });
    }
  },

  // 4. Đổi tên thiết kế (rename)
  renameDesign: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const customerId = req.user.userId;
      const { title } = req.body;

      if (!isValidTitle(title)) {
        res.status(400).json({ message: 'Tiêu đề thiết kế là bắt buộc và không được vượt quá 100 ký tự.' });
        return;
      }

      const existing: any = await withDbRetry<any>(() =>
        (prisma as any).userDesign.findUnique({
          where: { id }
        })
      );

      if (!existing) {
        res.status(404).json({ message: 'Không tìm thấy thiết kế.' });
        return;
      }

      if (existing.customerId !== customerId) {
        res.status(403).json({ message: 'Bạn không có quyền đổi tên thiết kế này.' });
        return;
      }

      const updated = await withDbRetry<any>(() =>
        (prisma as any).userDesign.update({
          where: { id },
          data: {
            title: title.trim(),
            lastEditedAt: new Date()
          }
        })
      );

      res.json(updated);
    } catch (error: any) {
      console.error('[ERROR] Đổi tên thiết kế thất bại:', error);
      res.status(500).json({ message: 'Không thể đổi tên thiết kế.', error: error.message });
    }
  },

  // 5. Liên kết bài viết cộng đồng (link-post)
  linkPost: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const customerId = req.user.userId;
      const { postId } = req.body;

      if (!postId || typeof postId !== 'string' || !postId.trim()) {
        res.status(400).json({ message: 'Mã bài viết cộng đồng (postId) là bắt buộc.' });
        return;
      }

      const existing: any = await withDbRetry<any>(() =>
        (prisma as any).userDesign.findUnique({
          where: { id }
        })
      );

      if (!existing) {
        res.status(404).json({ message: 'Không tìm thấy thiết kế.' });
        return;
      }

      if (existing.customerId !== customerId) {
        res.status(403).json({ message: 'Bạn không có quyền thao tác trên thiết kế này.' });
        return;
      }

      const post = await withDbRetry<any>(() =>
        (prisma as any).designPost.findUnique({
          where: { id: postId.trim() },
          select: { id: true }
        })
      );

      if (!post) {
        res.status(404).json({ message: 'Không tìm thấy bài viết cộng đồng để liên kết.' });
        return;
      }

      const updated = await withDbRetry<any>(() =>
        (prisma as any).userDesign.update({
          where: { id },
          data: {
            postId: postId.trim()
          }
        })
      );

      res.json(updated);
    } catch (error: any) {
      console.error('[ERROR] Liên kết bài viết thất bại:', error);
      res.status(500).json({ message: 'Không thể liên kết bài viết cộng đồng.', error: error.message });
    }
  },

  // 6. Xóa thiết kế
  deleteDesign: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const customerId = req.user.userId;

      const existing: any = await withDbRetry<any>(() =>
        (prisma as any).userDesign.findUnique({
          where: { id }
        })
      );

      if (!existing) {
        res.status(404).json({ message: 'Không tìm thấy thiết kế.' });
        return;
      }

      if (existing.customerId !== customerId) {
        res.status(403).json({ message: 'Bạn không có quyền xóa thiết kế này.' });
        return;
      }

      await withDbRetry<any>(() =>
        (prisma as any).userDesign.delete({
          where: { id }
        })
      );

      res.json({ success: true, message: 'Đã xóa thiết kế thành công.' });
    } catch (error: any) {
      console.error('[ERROR] Xóa thiết kế thất bại:', error);
      res.status(500).json({ message: 'Không thể xóa thiết kế.', error: error.message });
    }
  },

  // 7. Lấy chi tiết một thiết kế (chỉ chủ sở hữu, trả đầy đủ layout)
  getDesignById: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const customerId = req.user.userId;

      const design: any = await withDbRetry<any>(() =>
        (prisma as any).userDesign.findUnique({
          where: { id }
        })
      );

      if (!design) {
        res.status(404).json({ message: 'Không tìm thấy thiết kế.' });
        return;
      }

      if (design.customerId !== customerId) {
        res.status(403).json({ message: 'Bạn không có quyền truy cập thiết kế này.' });
        return;
      }

      let daysLeft: number | undefined;
      if (design.status === 'DRAFT') {
        const expiresAt = new Date(design.lastEditedAt).getTime() + 7 * 24 * 60 * 60 * 1000;
        daysLeft = Math.max(0, Math.ceil((expiresAt - Date.now()) / (24 * 60 * 60 * 1000)));
      }

      res.json({
        ...design,
        ...(daysLeft !== undefined && { daysLeft })
      });
    } catch (error: any) {
      console.error('[ERROR] Lấy chi tiết thiết kế thất bại:', error);
      res.status(500).json({ message: 'Không thể lấy thông tin chi tiết thiết kế.', error: error.message });
    }
  },

  // 8. Lấy danh sách thiết kế theo tab (DRAFT | SAVED | LIKED)
  getDesignsList: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const customerId = req.user.userId;
      const rawTab = req.query.tab;
      const tab = (rawTab ? String(rawTab).toUpperCase() : 'DRAFT').trim();

      if (!['DRAFT', 'SAVED', 'LIKED', 'POSTS', 'MY_POSTS'].includes(tab)) {
        res.status(400).json({ message: 'Tham số tab không hợp lệ. Vui lòng chọn DRAFT, SAVED hoặc LIKED.' });
        return;
      }

      // Tab DRAFT: Xóa bản nháp quá 7 ngày của chính khách hàng, sau đó trả danh sách kèm daysLeft & layoutCount
      if (tab === 'DRAFT') {
        const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        await withDbRetry<any>(() =>
          (prisma as any).userDesign.deleteMany({
            where: {
              customerId,
              status: 'DRAFT',
              lastEditedAt: {
                lt: cutoff
              }
            }
          })
        );

        const drafts: any[] = await withDbRetry<any[]>(() =>
          (prisma as any).userDesign.findMany({
            where: {
              customerId,
              status: 'DRAFT'
            },
            orderBy: {
              lastEditedAt: 'desc'
            }
          })
        );

        const now = Date.now();
        const formatted = (Array.isArray(drafts) ? drafts : []).map((d: any) => {
          const { layout, ...rest } = d;
          const layoutCount = extractLayoutCount(layout);
          const expiresAt = new Date(d.lastEditedAt).getTime() + 7 * 24 * 60 * 60 * 1000;
          const daysLeft = Math.max(0, Math.ceil((expiresAt - now) / (24 * 60 * 60 * 1000)));

          return {
            ...rest,
            layoutCount,
            daysLeft
          };
        });

        // Fallback: nếu layoutCount === 0 nhưng có postId thì lấy từ taggedProducts của bài viết
        const missingDraftPostIds = formatted
          .filter((f: any) => f.layoutCount === 0 && f.postId)
          .map((f: any) => f.postId);
        if (missingDraftPostIds.length > 0) {
          const posts = await withDbRetry<any[]>(() =>
            (prisma as any).designPost.findMany({
              where: { id: { in: missingDraftPostIds } },
              select: { id: true, taggedProducts: true }
            })
          ).catch(() => []);
          const postCountMap = new Map<string, number>();
          for (const p of posts || []) {
            let count = 0;
            if (Array.isArray(p.taggedProducts)) {
              count = p.taggedProducts.length;
            } else if (typeof p.taggedProducts === 'string') {
              try { count = JSON.parse(p.taggedProducts).length; } catch {}
            }
            postCountMap.set(p.id, count);
          }
          for (const f of formatted) {
            if (f.layoutCount === 0 && f.postId && postCountMap.has(f.postId)) {
              f.layoutCount = postCountMap.get(f.postId) || 0;
            }
          }
        }

        res.json(formatted);
        return;
      }

      // Tab SAVED: Trả danh sách thiết kế đã lưu của khách hàng (không kèm layout để nhẹ; có layoutCount)
      if (tab === 'SAVED') {
        const saved: any[] = await withDbRetry<any[]>(() =>
          (prisma as any).userDesign.findMany({
            where: {
              customerId,
              status: 'SAVED'
            },
            orderBy: {
              lastEditedAt: 'desc'
            }
          })
        );

        const formatted = (Array.isArray(saved) ? saved : []).map((d: any) => {
          const { layout, ...rest } = d;
          const layoutCount = extractLayoutCount(layout);
          return {
            ...rest,
            layoutCount
          };
        });

        // Fallback: nếu layoutCount === 0 nhưng có postId thì lấy từ taggedProducts của bài viết
        const missingSavedPostIds = formatted
          .filter((f: any) => f.layoutCount === 0 && f.postId)
          .map((f: any) => f.postId);
        if (missingSavedPostIds.length > 0) {
          const posts = await withDbRetry<any[]>(() =>
            (prisma as any).designPost.findMany({
              where: { id: { in: missingSavedPostIds } },
              select: { id: true, taggedProducts: true }
            })
          ).catch(() => []);
          const postCountMap = new Map<string, number>();
          for (const p of posts || []) {
            let count = 0;
            if (Array.isArray(p.taggedProducts)) {
              count = p.taggedProducts.length;
            } else if (typeof p.taggedProducts === 'string') {
              try { count = JSON.parse(p.taggedProducts).length; } catch {}
            }
            postCountMap.set(p.id, count);
          }
          for (const f of formatted) {
            if (f.layoutCount === 0 && f.postId && postCountMap.has(f.postId)) {
              f.layoutCount = postCountMap.get(f.postId) || 0;
            }
          }
        }

        res.json(formatted);
        return;
      }

      // Tab LIKED: Trả các DesignPost có status PUBLISHED mà khách đã thích (bỏ authorEmail)
      if (tab === 'LIKED') {
        const likes: any[] = await withDbRetry<any[]>(() =>
          (prisma as any).designPostLike.findMany({
            where: { customerId },
            orderBy: { createdAt: 'desc' }
          })
        );

        if (!Array.isArray(likes) || likes.length === 0) {
          res.json([]);
          return;
        }

        const postIds = likes.map((l: any) => l.postId);

        const posts: any[] = await withDbRetry<any[]>(() =>
          (prisma as any).designPost.findMany({
            where: {
              id: { in: postIds },
              status: 'PUBLISHED'
            },
            select: {
              id: true,
              title: true,
              authorName: true,
              description: true,
              imageUrl: true,
              likesCount: true,
              createdAt: true
            }
          })
        );

        const postList = Array.isArray(posts) ? posts : [];
        const postMap = new Map(postList.map((p: any) => [p.id, p]));
        const result: any[] = [];

        for (const l of likes) {
          const p = postMap.get(l.postId);
          if (p) {
            result.push({
              id: p.id,
              title: p.title,
              authorName: p.authorName,
              description: p.description,
              imageUrl: p.imageUrl,
              likesCount: p.likesCount,
              createdAt: p.createdAt,
              likedAt: l.createdAt
            });
          }
        }

        res.json(result);
        return;
      }

      // Tab POSTS / MY_POSTS: Trả danh sách bài viết thiết kế cộng đồng do khách hàng này đăng
      if (tab === 'POSTS' || tab === 'MY_POSTS') {
        const customer = await withDbRetry<any>(() =>
          (prisma as any).customer.findUnique({
            where: { id: customerId },
            select: { email: true, phone: true, avatarUrl: true }
          })
        );

        const userDesignsWithPost = await withDbRetry<any[]>(() =>
          (prisma as any).userDesign.findMany({
            where: { customerId, postId: { not: null } },
            select: { postId: true }
          })
        );
        const linkedPostIds = Array.isArray(userDesignsWithPost)
          ? userDesignsWithPost.map((u: any) => u.postId).filter(Boolean)
          : [];

        const conditions: any[] = [];
        if (linkedPostIds.length > 0) {
          conditions.push({ id: { in: linkedPostIds } });
        }
        if (customer?.email) {
          conditions.push({ authorEmail: customer.email });
        }

        if (conditions.length === 0) {
          res.json([]);
          return;
        }

        const posts = await withDbRetry<any[]>(() =>
          (prisma as any).designPost.findMany({
            where: {
              OR: conditions
            },
            include: {
              comments: {
                orderBy: { createdAt: 'desc' }
              }
            },
            orderBy: { createdAt: 'desc' }
          })
        );

        const postsWithAvatar = (posts || []).map((p: any) => ({
          ...p,
          authorAvatar: customer?.avatarUrl || null
        }));

        res.json(postsWithAvatar);
        return;
      }
    } catch (error: any) {
      console.error('[ERROR] Lấy danh sách thiết kế thất bại:', error);
      res.status(500).json({ message: 'Không thể tải danh sách thiết kế.', error: error.message });
    }
  }
};
