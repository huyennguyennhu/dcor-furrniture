import { Response, NextFunction } from 'express';
import prisma, { withDbRetry } from '../lib/prisma';
import { AuthRequest, authenticateJWT } from '../middleware/auth.middleware';

// ============================================================================
// HÀM TIỆN ÍCH LÀM SẠCH VÀ VALIDATION
// ============================================================================

export function stripHtml(input: any): string {
  if (typeof input !== 'string') return '';
  return input.replace(/<[^>]*>?/gm, '').trim();
}

export function isValidImageUrl(url: any): boolean {
  if (typeof url !== 'string') return false;
  const trimmed = url.trim();
  return trimmed.startsWith('https://') || trimmed.startsWith('/assets/');
}

export function generateSlug(text: string): string {
  return (text || '')
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}
export function calculateReadingMinutes(excerpt: string, blocks: any): number {
  let fullText = excerpt || '';
  if (Array.isArray(blocks)) {
    for (const b of blocks) {
      if (b && typeof b === 'object') {
        if (b.type === 'heading' || b.type === 'paragraph' || b.type === 'quote') {
          fullText += ' ' + (b.text || '');
        } else if (b.type === 'list' && Array.isArray(b.items)) {
          fullText += ' ' + b.items.join(' ');
        }
      }
    }
  }
  const wordCount = fullText.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(wordCount / 200));
}

// ============================================================================
// MIDDLEWARE XÁC THỰC DÀNH CHO BLOG CÔNG KHAI
// ============================================================================

/**
 * optionalCustomerAuth:
 * - Không có header Authorization -> tiếp tục bình thường (req.user = undefined).
 * - Có header Authorization -> gọi authenticateJWT; chỉ giữ req.user nếu là token CUSTOMER.
 */
export const optionalCustomerAuth = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  await authenticateJWT(req, res, () => {
    if (req.user && req.user.type !== 'CUSTOMER') {
      req.user = undefined;
    }
    next();
  });
};

/**
 * requireCustomerAuth:
 * - Bắt buộc phải có token hợp lệ.
 * - Token phải là của tài khoản khách hàng (type: 'CUSTOMER').
 */
export const requireCustomerAuth = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  await authenticateJWT(req, res, () => {
    if (!req.user || req.user.type !== 'CUSTOMER' || !req.user.userId) {
      res.status(403).json({
        message: 'Quyền truy cập bị từ chối. Vui lòng đăng nhập bằng tài khoản khách hàng.'
      });
      return;
    }
    next();
  });
};

// ============================================================================
// CONTROLLER BLOG CÔNG KHAI (/api/blog)
// ============================================================================

export const blogController = {
  // 1. Danh sách danh mục công khai kèm số bài viết công khai
  getCategories: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const now = new Date();
      const categories = await withDbRetry(() =>
        prisma.blogCategory.findMany({
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
          include: {
            _count: {
              select: {
                posts: {
                  where: {
                    status: 'PUBLISHED',
                    publishedAt: { lte: now }
                  }
                }
              }
            }
          }
        })
      );

      const result = categories.map(c => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        sortOrder: c.sortOrder,
        isActive: c.isActive,
        postCount: c._count.posts
      }));

      res.json(result);
    } catch (error) {
      console.error('[ERROR] Lỗi getCategories:', error);
      res.status(500).json({ message: 'Không thể tải danh mục blog.' });
    }
  },

  // 2. Danh sách bài viết công khai có lọc, tìm kiếm, phân trang
  getPosts: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { q, category, tag } = req.query;
      const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
      const pageSize = Math.min(24, Math.max(1, parseInt(req.query.pageSize as string, 10) || 10));
      const skip = (page - 1) * pageSize;

      const now = new Date();
      const where: any = {
        status: 'PUBLISHED',
        publishedAt: { lte: now }
      };

      if (category && typeof category === 'string' && category.trim()) {
        where.category = { slug: category.trim() };
      }

      if (tag && typeof tag === 'string' && tag.trim()) {
        where.tags = { has: tag.trim() };
      }

      if (q && typeof q === 'string' && q.trim()) {
        const queryTerm = q.trim();
        where.OR = [
          { title: { contains: queryTerm, mode: 'insensitive' } },
          { excerpt: { contains: queryTerm, mode: 'insensitive' } },
          { tags: { has: queryTerm } }
        ];
      }

      const [total, posts] = await withDbRetry(() =>
        Promise.all([
          prisma.blogPost.count({ where }),
          prisma.blogPost.findMany({
            where,
            orderBy: { publishedAt: 'desc' },
            skip,
            take: pageSize,
            include: {
              category: {
                select: {
                  name: true,
                  slug: true
                }
              },
              _count: {
                select: {
                  comments: {
                    where: { status: 'VISIBLE' }
                  }
                }
              }
            }
          })
        ])
      );

      const items = posts.map(p => ({
        id: p.id,
        slug: p.slug,
        title: p.title,
        excerpt: p.excerpt,
        coverImageUrl: p.coverImageUrl,
        category: p.category,
        tags: p.tags,
        authorName: p.authorName,
        publishedAt: p.publishedAt,
        likesCount: p.likesCount,
        commentCount: p._count.comments,
        readingMinutes: calculateReadingMinutes(p.excerpt, p.blocks)
      }));

      res.json({
        items,
        total,
        page,
        pageSize
      });
    } catch (error) {
      console.error('[ERROR] Lỗi getPosts:', error);
      res.status(500).json({ message: 'Không thể tải danh sách bài viết.' });
    }
  },

  // 3. Chi tiết bài viết theo slug
  getPostBySlug: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const slug = String(req.params.slug || '').trim();
      const now = new Date();

      const post = await withDbRetry(() =>
        prisma.blogPost.findUnique({
          where: { slug },
          include: {
            category: {
              select: {
                id: true,
                name: true,
                slug: true
              }
            }
          }
        })
      );

      // Nếu không tồn tại, nháp, ẩn hoặc chưa đến giờ xuất bản -> 404 kèm suggestions
      if (!post || post.status !== 'PUBLISHED' || !post.publishedAt || post.publishedAt > now) {
        const suggestions = await withDbRetry(() =>
          prisma.blogPost.findMany({
            where: {
              status: 'PUBLISHED',
              publishedAt: { lte: now }
            },
            select: {
              id: true,
              slug: true,
              title: true,
              excerpt: true,
              coverImageUrl: true,
              publishedAt: true
            },
            orderBy: { publishedAt: 'desc' },
            take: 3
          })
        );

        res.status(404).json({
          message: 'Bài viết không tồn tại hoặc chưa được công khai.',
          suggestions
        });
        return;
      }

      // Tăng viewsCount bất đồng bộ (không để lỗi tăng view làm hỏng phản hồi)
      prisma.blogPost
        .update({
          where: { id: post.id },
          data: { viewsCount: { increment: 1 } }
        })
        .catch(err => {
          console.error('[WARN] Lỗi cập nhật viewsCount:', err);
        });

      // Lấy danh sách sản phẩm thật gắn trong bài viết
      let orderedProducts: any[] = [];
      if (Array.isArray(post.productIds) && post.productIds.length > 0) {
        const products = await withDbRetry(() =>
          prisma.product.findMany({
            where: {
              id: { in: post.productIds },
              isActive: true,
              deletedAt: null
            },
            include: {
              variants: {
                where: { isActive: true },
                select: { price: true }
              }
            }
          })
        );

        const productMap = new Map(products.map(p => [p.id, p]));
        orderedProducts = post.productIds
          .map(id => productMap.get(id))
          .filter(Boolean)
          .map(p => {
            const prod = p!;
            const lowestPrice =
              prod.variants.length > 0
                ? Math.min(...prod.variants.map((v: any) => v.price))
                : prod.basePrice;
            const firstImage =
              Array.isArray(prod.images) && prod.images.length > 0
                ? typeof prod.images[0] === 'string'
                  ? prod.images[0]
                  : (prod.images[0] as any)?.url || ''
                : '';

            return {
              id: prod.id,
              name: prod.name,
              image: firstImage,
              price: lowestPrice
            };
          });
      }

      // Lấy số bình luận hữu hiệu và trạng thái đã like của người xem
      const [commentCount, viewerLiked, relatedPosts] = await withDbRetry(() =>
        Promise.all([
          prisma.blogComment.count({
            where: {
              postId: post.id,
              status: 'VISIBLE'
            }
          }),
          req.user?.userId
            ? prisma.blogLike.findUnique({
                where: {
                  postId_customerId: {
                    postId: post.id,
                    customerId: req.user.userId
                  }
                }
              })
            : Promise.resolve(null),
          prisma.blogPost.findMany({
            where: {
              categoryId: post.categoryId,
              id: { not: post.id },
              status: 'PUBLISHED',
              publishedAt: { lte: now }
            },
            select: {
              id: true,
              slug: true,
              title: true,
              excerpt: true,
              coverImageUrl: true,
              publishedAt: true
            },
            orderBy: { publishedAt: 'desc' },
            take: 3
          })
        ])
      );

      res.json({
        id: post.id,
        slug: post.slug,
        title: post.title,
        excerpt: post.excerpt,
        blocks: post.blocks,
        coverImageUrl: post.coverImageUrl,
        category: post.category,
        tags: post.tags,
        seoDescription: post.seoDescription,
        authorName: post.authorName,
        publishedAt: post.publishedAt,
        likesCount: post.likesCount,
        viewsCount: post.viewsCount + 1,
        commentCount,
        readingMinutes: calculateReadingMinutes(post.excerpt, post.blocks),
        products: orderedProducts,
        viewer: {
          liked: Boolean(viewerLiked)
        },
        related: relatedPosts
      });
    } catch (error) {
      console.error('[ERROR] Lỗi getPostBySlug:', error);
      res.status(500).json({ message: 'Không thể tải chi tiết bài viết.' });
    }
  },

  // 4. Like / Unlike bài viết (Toggle trong 1 transaction, không âm likesCount)
  likePost: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const slug = String(req.params.slug || '').trim();
      const customerId = req.user.userId;
      const now = new Date();

      const post = await withDbRetry(() =>
        prisma.blogPost.findUnique({
          where: { slug },
          select: { id: true, status: true, publishedAt: true }
        })
      );

      if (!post || post.status !== 'PUBLISHED' || !post.publishedAt || post.publishedAt > now) {
        res.status(404).json({ message: 'Bài viết không tồn tại hoặc chưa được công khai.' });
        return;
      }

      const result = await prisma.$transaction(async tx => {
        const existingLike = await tx.blogLike.findUnique({
          where: {
            postId_customerId: {
              postId: post.id,
              customerId
            }
          }
        });

        if (existingLike) {
          await tx.blogLike.delete({
            where: { id: existingLike.id }
          });
          const currentPost = await tx.blogPost.findUnique({
            where: { id: post.id },
            select: { likesCount: true }
          });
          const newLikes = Math.max(0, (currentPost?.likesCount || 1) - 1);
          const updated = await tx.blogPost.update({
            where: { id: post.id },
            data: { likesCount: newLikes },
            select: { likesCount: true }
          });
          return { liked: false, likesCount: updated.likesCount };
        } else {
          await tx.blogLike.create({
            data: {
              postId: post.id,
              customerId
            }
          });
          const updated = await tx.blogPost.update({
            where: { id: post.id },
            data: { likesCount: { increment: 1 } },
            select: { likesCount: true }
          });
          return { liked: true, likesCount: updated.likesCount };
        }
      });

      res.json(result);
    } catch (error) {
      console.error('[ERROR] Lỗi likePost:', error);
      res.status(500).json({ message: 'Không thể thực hiện thao tác thích bài viết.' });
    }
  },

  // 5. Danh sách bình luận của bài viết (chỉ VISIBLE, mới nhất trước, cờ isMine)
  getComments: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const slug = String(req.params.slug || '').trim();
      const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
      const pageSize = Math.min(50, Math.max(1, parseInt(req.query.pageSize as string, 10) || 10));
      const skip = (page - 1) * pageSize;

      const post = await withDbRetry(() =>
        prisma.blogPost.findUnique({
          where: { slug },
          select: { id: true, status: true, publishedAt: true }
        })
      );

      if (!post) {
        res.status(404).json({ message: 'Bài viết không tồn tại.' });
        return;
      }

      const where = {
        postId: post.id,
        status: 'VISIBLE'
      };

      const [total, comments] = await withDbRetry(() =>
        Promise.all([
          prisma.blogComment.count({ where }),
          prisma.blogComment.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip,
            take: pageSize,
            select: {
              id: true,
              postId: true,
              customerId: true,
              authorName: true,
              content: true,
              createdAt: true
            }
          })
        ])
      );

      const currentCustomerId = req.user?.userId;
      const items = comments.map(c => ({
        id: c.id,
        postId: c.postId,
        authorName: c.authorName,
        content: c.content,
        createdAt: c.createdAt,
        isMine: Boolean(currentCustomerId && c.customerId === currentCustomerId)
      }));

      res.json({
        items,
        total,
        page,
        pageSize
      });
    } catch (error) {
      console.error('[ERROR] Lỗi getComments:', error);
      res.status(500).json({ message: 'Không thể tải bình luận.' });
    }
  },

  // 6. Gửi bình luận mới (Token khách, tối đa 500 ký tự, giới hạn 10 bình luận/phút)
  createComment: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const slug = String(req.params.slug || '').trim();
      const customerId = req.user.userId;
      const { content } = req.body;

      // Validate nội dung bình luận
      const cleanedContent = stripHtml(content);
      if (!cleanedContent || cleanedContent.length > 500) {
        res.status(400).json({
          message: 'Nội dung bình luận không được để trống và không vượt quá 500 ký tự.'
        });
        return;
      }

      // Kiểm tra bài viết
      const post = await withDbRetry(() =>
        prisma.blogPost.findUnique({
          where: { slug },
          select: { id: true, status: true, publishedAt: true }
        })
      );

      if (!post || post.status !== 'PUBLISHED') {
        res.status(404).json({ message: 'Bài viết không tồn tại hoặc chưa được xuất bản.' });
        return;
      }

      // Giới hạn tần suất: tối đa 10 bình luận trong 1 phút mỗi khách hàng
      const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
      const recentCommentCount = await withDbRetry(() =>
        prisma.blogComment.count({
          where: {
            customerId,
            createdAt: { gte: oneMinuteAgo }
          }
        })
      );

      if (recentCommentCount >= 10) {
        res.status(429).json({
          message: 'Bạn đang thao tác quá nhanh. Vui lòng thử lại sau 1 phút.'
        });
        return;
      }

      // Lấy tên tác giả từ hồ sơ khách hàng
      const customer = await withDbRetry(() =>
        prisma.customer.findUnique({
          where: { id: customerId },
          select: { fullName: true }
        })
      );

      const authorName = customer?.fullName?.trim() || req.user.fullName || 'Khách hàng';

      const comment = await withDbRetry(() =>
        prisma.blogComment.create({
          data: {
            postId: post.id,
            customerId,
            authorName,
            content: cleanedContent,
            status: 'VISIBLE'
          },
          select: {
            id: true,
            postId: true,
            authorName: true,
            content: true,
            createdAt: true
          }
        })
      );

      res.status(201).json({
        message: 'Gửi bình luận thành công.',
        comment: {
          ...comment,
          isMine: true
        }
      });
    } catch (error) {
      console.error('[ERROR] Lỗi createComment:', error);
      res.status(500).json({ message: 'Không thể gửi bình luận.' });
    }
  },

  // 7. Xóa bình luận (chỉ chính chủ bình luận, hard delete)
  deleteComment: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const commentId = String(req.params.id || '').trim();
      const customerId = req.user.userId;

      const comment = await withDbRetry(() =>
        prisma.blogComment.findUnique({
          where: { id: commentId }
        })
      );

      if (!comment) {
        res.status(404).json({ message: 'Bình luận không tồn tại.' });
        return;
      }

      if (comment.customerId !== customerId) {
        res.status(403).json({ message: 'Bạn không có quyền xóa bình luận của người khác.' });
        return;
      }

      await withDbRetry(() =>
        prisma.blogComment.delete({
          where: { id: commentId }
        })
      );

      res.json({ message: 'Đã xóa bình luận thành công.' });
    } catch (error) {
      console.error('[ERROR] Lỗi deleteComment:', error);
      res.status(500).json({ message: 'Không thể xóa bình luận.' });
    }
  }
};
