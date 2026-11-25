import { Response } from 'express';
import prisma, { withDbRetry } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth.middleware';
import {
  stripHtml,
  isValidImageUrl,
  generateSlug
} from './blog.controller';

// ============================================================================
// HÀM TIỆN ÍCH VALIDATE KHỐI NỘI DUNG (BLOCKS)
// ============================================================================

export interface BlockValidationResult {
  isValid: boolean;
  error?: string;
  sanitizedBlocks?: any[];
}

export function validateAndSanitizeBlocks(blocks: any): BlockValidationResult {
  if (blocks === undefined || blocks === null) {
    return { isValid: true, sanitizedBlocks: [] };
  }

  if (!Array.isArray(blocks)) {
    return { isValid: false, error: 'Danh sách khối nội dung (blocks) phải là một mảng.' };
  }

  if (blocks.length > 200) {
    return { isValid: false, error: 'Bài viết không được vượt quá 200 khối nội dung.' };
  }

  const sanitized: any[] = [];

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    if (!block || typeof block !== 'object') {
      return { isValid: false, error: `Khối thứ ${i + 1} không hợp lệ.` };
    }

    switch (block.type) {
      case 'heading': {
        const level = Number(block.level);
        if (level !== 2 && level !== 3) {
          return { isValid: false, error: `Khối ${i + 1} (heading): Cấp độ tiêu đề (level) chỉ được là 2 hoặc 3.` };
        }
        const text = stripHtml(block.text);
        if (!text) {
          return { isValid: false, error: `Khối ${i + 1} (heading): Nội dung tiêu đề không được để trống.` };
        }
        if (text.length > 5000) {
          return { isValid: false, error: `Khối ${i + 1} (heading): Nội dung vượt quá 5000 ký tự.` };
        }
        sanitized.push({ type: 'heading', level, text });
        break;
      }

      case 'paragraph': {
        const text = stripHtml(block.text);
        if (text.length > 5000) {
          return { isValid: false, error: `Khối ${i + 1} (paragraph): Đoạn văn vượt quá 5000 ký tự.` };
        }
        sanitized.push({ type: 'paragraph', text });
        break;
      }

      case 'image': {
        const url = typeof block.url === 'string' ? block.url.trim() : '';
        if (!isValidImageUrl(url)) {
          return {
            isValid: false,
            error: `Khối ${i + 1} (image): URL hình ảnh phải bắt đầu bằng https://, /assets/... hoặc data:image/`
          };
        }
        const caption = block.caption !== undefined ? stripHtml(block.caption) : undefined;
        if (caption && caption.length > 5000) {
          return { isValid: false, error: `Khối ${i + 1} (image): Chú thích ảnh vượt quá 5000 ký tự.` };
        }
        const cleanBlock: any = { type: 'image', url };
        if (caption) cleanBlock.caption = caption;
        sanitized.push(cleanBlock);
        break;
      }

      case 'quote': {
        const text = stripHtml(block.text);
        if (text.length > 5000) {
          return { isValid: false, error: `Khối ${i + 1} (quote): Trích dẫn vượt quá 5000 ký tự.` };
        }
        const cite = block.cite !== undefined ? stripHtml(block.cite) : undefined;
        if (cite && cite.length > 5000) {
          return { isValid: false, error: `Khối ${i + 1} (quote): Nguồn trích dẫn vượt quá 5000 ký tự.` };
        }
        const cleanBlock: any = { type: 'quote', text };
        if (cite) cleanBlock.cite = cite;
        sanitized.push(cleanBlock);
        break;
      }

      case 'list': {
        const ordered = Boolean(block.ordered);
        if (!Array.isArray(block.items)) {
          return { isValid: false, error: `Khối ${i + 1} (list): Danh sách các mục (items) phải là một mảng.` };
        }
        const cleanItems: string[] = [];
        for (const it of block.items) {
          const itemText = stripHtml(it);
          if (itemText.length > 5000) {
            return { isValid: false, error: `Khối ${i + 1} (list): Mục danh sách vượt quá 5000 ký tự.` };
          }
          cleanItems.push(itemText);
        }
        sanitized.push({ type: 'list', ordered, items: cleanItems });
        break;
      }

      case 'products': {
        const title = block.title !== undefined ? stripHtml(block.title) : undefined;
        if (title && title.length > 5000) {
          return { isValid: false, error: `Khối ${i + 1} (products): Tiêu đề vượt quá 5000 ký tự.` };
        }
        if (!Array.isArray(block.productIds)) {
          return { isValid: false, error: `Khối ${i + 1} (products): productIds phải là một mảng ID chuỗi.` };
        }
        const productIds = block.productIds.map((id: any) => String(id).trim()).filter(Boolean);
        const cleanBlock: any = { type: 'products', productIds };
        if (title) cleanBlock.title = title;
        sanitized.push(cleanBlock);
        break;
      }

      default:
        return {
          isValid: false,
          error: `Khối ${i + 1}: Loại khối '${block.type}' không hợp lệ. Chỉ chấp nhận heading, paragraph, image, quote, list, products.`
        };
    }
  }

  return { isValid: true, sanitizedBlocks: sanitized };
}

// ============================================================================
// HÀM CHUYỂN ĐỔI 2 CHIỀU BLOCKS <-> HTML (HỖ TRỢ WYSIWYG EDITOR)
// ============================================================================

export function blocksToHtml(blocks: any): string {
  if (!Array.isArray(blocks) || blocks.length === 0) return '';
  return blocks
    .map(b => {
      if (!b || typeof b !== 'object') return '';
      switch (b.type) {
        case 'heading': {
          const level = b.level === 3 ? 3 : 2;
          return `<h${level}>${b.text || ''}</h${level}>`;
        }
        case 'paragraph': {
          return `<p>${b.text || ''}</p>`;
        }
        case 'quote': {
          const cite = b.cite ? `<cite style="display:block;margin-top:6px;font-size:13px;color:#71717a;">${b.cite}</cite>` : '';
          return `<blockquote style="border-left: 3px solid #8b5cf6; padding-left: 14px; margin: 16px 0; color: #4b5563; font-style: italic;"><p>${b.text || ''}</p>${cite}</blockquote>`;
        }
        case 'list': {
          const tag = b.ordered ? 'ol' : 'ul';
          const items = Array.isArray(b.items)
            ? b.items.map((it: string) => `<li>${it}</li>`).join('')
            : '';
          return `<${tag}>${items}</${tag}>`;
        }
        case 'image': {
          const caption = b.caption
            ? `<figcaption style="text-align:center;font-size:13px;color:#71717a;margin-top:8px;font-style:italic;">${b.caption}</figcaption>`
            : '';
          return `<figure class="article-embed-figure" style="margin: 20px 0; text-align: center;"><img src="${b.url}" alt="${b.caption || ''}" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 14px rgba(0,0,0,0.08);" />${caption}</figure>`;
        }
        default:
          return '';
      }
    })
    .filter(Boolean)
    .join('\n');
}

export function htmlToBlocks(html: string): any[] {
  if (!html || typeof html !== 'string') return [];
  const trimmed = html.trim();
  if (!trimmed) return [];

  const blocks: any[] = [];
  const elementRegex = /<(h[2-4]|blockquote|ul|ol|figure|p|div)([^>]*)>([\s\S]*?)<\/\1>|<img([^>]+)\/?>/gi;
  let match;

  while ((match = elementRegex.exec(trimmed)) !== null) {
    if (match[1]) {
      const tag = match[1].toLowerCase();
      const inner = match[3];

      if (tag === 'h2') {
        const text = stripHtml(inner);
        if (text) blocks.push({ type: 'heading', level: 2, text });
      } else if (tag === 'h3' || tag === 'h4') {
        const text = stripHtml(inner);
        if (text) blocks.push({ type: 'heading', level: 3, text });
      } else if (tag === 'blockquote') {
        const citeMatch = inner.match(/<cite[^>]*>([\s\S]*?)<\/cite>/i);
        const cite = citeMatch ? stripHtml(citeMatch[1]) : undefined;
        const text = stripHtml(inner.replace(/<cite[^>]*>[\s\S]*?<\/cite>/gi, ''));
        if (text) {
          const q: any = { type: 'quote', text };
          if (cite) q.cite = cite;
          blocks.push(q);
        }
      } else if (tag === 'ul' || tag === 'ol') {
        const liRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
        let liMatch;
        const items: string[] = [];
        while ((liMatch = liRegex.exec(inner)) !== null) {
          const itemText = stripHtml(liMatch[1]);
          if (itemText) items.push(itemText);
        }
        if (items.length > 0) {
          blocks.push({ type: 'list', ordered: tag === 'ol', items });
        }
      } else if (tag === 'figure') {
        const srcMatch = inner.match(/src=["']([^"']+)["']/i);
        const figcapMatch = inner.match(/<figcaption[^>]*>([\s\S]*?)<\/figcaption>/i);
        const altMatch = inner.match(/alt=["']([^"']*)["']/i);
        if (srcMatch && srcMatch[1]) {
          const url = srcMatch[1].trim();
          const caption = figcapMatch ? stripHtml(figcapMatch[1]) : (altMatch ? altMatch[1] : undefined);
          const imgBlock: any = { type: 'image', url };
          if (caption) imgBlock.caption = caption;
          blocks.push(imgBlock);
        }
      } else {
        const imgMatch = inner.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/i);
        if (imgMatch && imgMatch[1]) {
          const url = imgMatch[1].trim();
          const altMatch = imgMatch[0].match(/alt=["']([^"']*)["']/i);
          const caption = altMatch ? altMatch[1] : undefined;
          const imgBlock: any = { type: 'image', url };
          if (caption) imgBlock.caption = caption;
          blocks.push(imgBlock);
        }
        const text = stripHtml(inner);
        if (text) {
          blocks.push({ type: 'paragraph', text });
        }
      }
    } else if (match[4]) {
      const imgAttrs = match[4];
      const srcMatch = imgAttrs.match(/src=["']([^"']+)["']/i);
      const altMatch = imgAttrs.match(/alt=["']([^"']*)["']/i);
      if (srcMatch && srcMatch[1]) {
        const url = srcMatch[1].trim();
        const caption = altMatch ? altMatch[1] : undefined;
        const imgBlock: any = { type: 'image', url };
        if (caption) imgBlock.caption = caption;
        blocks.push(imgBlock);
      }
    }
  }

  if (blocks.length === 0) {
    const text = stripHtml(trimmed);
    if (text) {
      blocks.push({ type: 'paragraph', text });
    }
  }

  return blocks;
}

async function findUniquePostSlug(baseSlug: string, excludeId?: string): Promise<string> {
  let uniqueSlug = baseSlug;
  let counter = 1;
  while (true) {
    const existing = await prisma.blogPost.findUnique({
      where: { slug: uniqueSlug },
      select: { id: true }
    });
    if (!existing || (excludeId && existing.id === excludeId)) {
      return uniqueSlug;
    }
    uniqueSlug = `${baseSlug}-${counter}`;
    counter++;
  }
}

async function findUniqueCategorySlug(baseSlug: string, excludeId?: string): Promise<string> {
  let uniqueSlug = baseSlug;
  let counter = 1;
  while (true) {
    const existing = await prisma.blogCategory.findUnique({
      where: { slug: uniqueSlug },
      select: { id: true }
    });
    if (!existing || (excludeId && existing.id === excludeId)) {
      return uniqueSlug;
    }
    uniqueSlug = `${baseSlug}-${counter}`;
    counter++;
  }
}

// ============================================================================
// CONTROLLER QUẢN TRỊ BLOG (/api/admin/blog)
// ============================================================================

export const blogAdminController = {
  // 1. Lấy danh sách bài viết quản trị (mọi trạng thái, kèm viewsCount, likesCount, commentCount)
  getPosts: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { status, category, q } = req.query;
      const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
      const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string, 10) || 10));
      const skip = (page - 1) * pageSize;

      const where: any = {};

      if (status && typeof status === 'string' && status.trim()) {
        where.status = status.trim().toUpperCase();
      }

      if (category && typeof category === 'string' && category.trim()) {
        where.OR = [
          { categoryId: category.trim() },
          { category: { slug: category.trim() } }
        ];
      }

      if (q && typeof q === 'string' && q.trim()) {
        const queryTerm = q.trim();
        const searchCondition = [
          { title: { contains: queryTerm, mode: 'insensitive' } },
          { excerpt: { contains: queryTerm, mode: 'insensitive' } }
        ];
        if (where.OR) {
          where.AND = [{ OR: where.OR }, { OR: searchCondition }];
          delete where.OR;
        } else {
          where.OR = searchCondition;
        }
      }

      const [total, posts] = await withDbRetry(() =>
        Promise.all([
          prisma.blogPost.count({ where }),
          prisma.blogPost.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip,
            take: pageSize,
            include: {
              category: {
                select: {
                  id: true,
                  name: true,
                  slug: true
                }
              },
              _count: {
                select: {
                  comments: true
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
        coverImage: p.coverImageUrl || '',
        categoryId: p.categoryId,
        category: p.category,
        categoryName: p.category?.name || '',
        tags: p.tags,
        authorName: p.authorName,
        author: p.authorName,
        status: p.status,
        publishedAt: p.publishedAt,
        likesCount: p.likesCount,
        viewsCount: p.viewsCount,
        views: p.viewsCount,
        commentCount: p._count.comments,
        blocks: p.blocks,
        content: blocksToHtml(p.blocks),
        productIds: p.productIds,
        relatedProductIds: p.productIds,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt
      }));

      res.json({
        items,
        total,
        page,
        pageSize
      });
    } catch (error) {
      console.error('[ERROR] Lỗi admin getPosts:', error);
      res.status(500).json({ message: 'Không thể tải danh sách bài viết quản trị.' });
    }
  },

  // 2. Chi tiết bài viết quản trị
  getPostById: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const id = String(req.params.id || '').trim();

      let post = await withDbRetry(() =>
        prisma.blogPost.findUnique({
          where: { id },
          include: {
            category: {
              select: {
                id: true,
                name: true,
                slug: true
              }
            },
            _count: {
              select: {
                comments: true,
                likes: true
              }
            }
          }
        })
      );

      if (!post) {
        post = await withDbRetry(() =>
          prisma.blogPost.findUnique({
            where: { slug: id },
            include: {
              category: {
                select: {
                  id: true,
                  name: true,
                  slug: true
                }
              },
              _count: {
                select: {
                  comments: true,
                  likes: true
                }
              }
            }
          })
        );
      }

      if (!post) {
        res.status(404).json({ message: 'Không tìm thấy bài viết.' });
        return;
      }

      // Đính kèm thông tin sản phẩm đã gắn để admin xem trực quan
      let taggedProducts: any[] = [];
      if (Array.isArray(post.productIds) && post.productIds.length > 0) {
        const prods = await withDbRetry(() =>
          prisma.product.findMany({
            where: { id: { in: post!.productIds }, deletedAt: null },
            include: {
              variants: {
                where: { isActive: true },
                select: { price: true }
              }
            }
          })
        );
        const prodMap = new Map(prods.map(p => [p.id, p]));
        taggedProducts = post.productIds
          .map(pid => prodMap.get(pid))
          .filter(Boolean)
          .map(p => {
            const pr = p!;
            const lowestPrice =
              pr.variants.length > 0
                ? Math.min(...pr.variants.map((v: any) => v.price))
                : pr.basePrice;
            const firstImage =
              Array.isArray(pr.images) && pr.images.length > 0
                ? typeof pr.images[0] === 'string'
                  ? pr.images[0]
                  : (pr.images[0] as any)?.url || ''
                : '';

            return {
              id: pr.id,
              name: pr.name,
              image: firstImage,
              price: lowestPrice,
              isActive: pr.isActive
            };
          });
      }

      res.json({
        ...post,
        coverImage: post.coverImageUrl,
        categoryName: post.category?.name || '',
        author: post.authorName,
        views: post.viewsCount,
        relatedProductIds: post.productIds,
        content: blocksToHtml(post.blocks),
        commentCount: post._count.comments,
        likesCount: post.likesCount,
        taggedProducts
      });
    } catch (error) {
      console.error('[ERROR] Lỗi admin getPostById:', error);
      res.status(500).json({ message: 'Không thể tải thông tin bài viết.' });
    }
  },

  // 3. Tạo bài viết mới (mặc định DRAFT, tự sinh slug duy nhất từ tiêu đề)
  createPost: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const {
        title,
        excerpt,
        blocks,
        content,
        coverImageUrl,
        coverImage,
        categoryId,
        tags,
        seoDescription,
        seoTitle,
        status,
        publishedAt,
        productIds,
        relatedProductIds
      } = req.body;

      // Validate tiêu đề
      const cleanTitle = stripHtml(title);
      if (!cleanTitle) {
        res.status(400).json({ message: 'Tiêu đề bài viết không được để trống.' });
        return;
      }

      const cleanExcerpt = stripHtml(excerpt);
      const cleanCover = typeof coverImageUrl === 'string' && coverImageUrl.trim()
        ? coverImageUrl.trim()
        : (typeof coverImage === 'string' && coverImage.trim() ? coverImage.trim() : null);

      const targetStatus = status === 'PUBLISHED'
        ? 'PUBLISHED'
        : status === 'HIDDEN'
          ? 'HIDDEN'
          : 'DRAFT';

      // Parse blocks from content if blocks not provided
      let inputBlocks = blocks;
      if ((!inputBlocks || !Array.isArray(inputBlocks) || inputBlocks.length === 0) && content) {
        inputBlocks = htmlToBlocks(content);
      }

      // Validate blocks
      const blockValidation = validateAndSanitizeBlocks(inputBlocks);
      if (!blockValidation.isValid) {
        res.status(400).json({ message: blockValidation.error });
        return;
      }
      let sanitizedBlocks = blockValidation.sanitizedBlocks || [];
      if (sanitizedBlocks.length === 0 && cleanExcerpt) {
        sanitizedBlocks = [{ type: 'paragraph', text: cleanExcerpt }];
      }

      // Kiểm tra danh mục
      if (!categoryId) {
        res.status(400).json({ message: 'Vui lòng chọn danh mục cho bài viết.' });
        return;
      }

      const categoryExists = await withDbRetry(() =>
        prisma.blogCategory.findUnique({
          where: { id: String(categoryId).trim() }
        })
      );

      if (!categoryExists) {
        res.status(400).json({ message: 'Danh mục bài viết không tồn tại.' });
        return;
      }

      // Kiểm tra bắt buộc trước khi xuất bản
      let finalPublishedAt: Date | null = publishedAt ? new Date(publishedAt) : null;

      if (targetStatus === 'PUBLISHED') {
        if (!cleanTitle || !cleanCover || !categoryId) {
          res.status(400).json({
            message: 'Không thể xuất bản: Bài viết cần có đầy đủ tiêu đề, ảnh bìa và danh mục.'
          });
          return;
        }
        if (!finalPublishedAt) {
          finalPublishedAt = new Date();
        }
      }

      // Sinh slug tự động và đảm bảo tính duy nhất
      const baseSlug = generateSlug(req.body.slug || cleanTitle) || 'bai-viet';
      const uniqueSlug = await findUniquePostSlug(baseSlug);

      const cleanTags = Array.isArray(tags)
        ? tags.map((t: any) => stripHtml(t)).filter(Boolean)
        : [];
      const cleanProductIds = Array.isArray(productIds)
        ? productIds.map((id: any) => String(id).trim()).filter(Boolean)
        : (Array.isArray(relatedProductIds) ? relatedProductIds.map((id: any) => String(id).trim()).filter(Boolean) : []);

      const authorName =
        (req.body.author && String(req.body.author).trim()) ||
        (req.user?.fullName && String(req.user.fullName).trim()) ||
        req.user?.email ||
        'Ban biên tập DCor';
      const createdBy = req.user?.userId || req.user?.id || req.user?.email || 'admin';

      const post = await withDbRetry(() =>
        prisma.blogPost.create({
          data: {
            title: cleanTitle,
            slug: uniqueSlug,
            excerpt: cleanExcerpt,
            blocks: sanitizedBlocks,
            coverImageUrl: cleanCover,
            categoryId: categoryExists.id,
            tags: cleanTags,
            seoDescription: stripHtml(seoDescription || seoTitle) || null,
            authorName,
            status: targetStatus,
            publishedAt: finalPublishedAt,
            productIds: cleanProductIds,
            createdBy,
            likesCount: 0,
            viewsCount: 0
          },
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

      res.status(201).json({
        message: 'Tạo bài viết thành công.',
        post
      });
    } catch (error) {
      console.error('[ERROR] Lỗi admin createPost:', error);
      res.status(500).json({ message: 'Không thể tạo bài viết.' });
    }
  },

  // 4. Cập nhật bài viết
  updatePost: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const id = String(req.params.id || '').trim();

      const existingPost = await withDbRetry(() =>
        prisma.blogPost.findUnique({
          where: { id }
        })
      );

      if (!existingPost) {
        res.status(404).json({ message: 'Không tìm thấy bài viết.' });
        return;
      }

      const {
        title,
        slug,
        excerpt,
        blocks,
        content,
        coverImageUrl,
        coverImage,
        categoryId,
        tags,
        seoDescription,
        seoTitle,
        status,
        publishedAt,
        productIds,
        relatedProductIds,
        author
      } = req.body;

      const dataToUpdate: any = {};

      if (title !== undefined) {
        const cleanTitle = stripHtml(title);
        if (!cleanTitle) {
          res.status(400).json({ message: 'Tiêu đề bài viết không được để trống.' });
          return;
        }
        dataToUpdate.title = cleanTitle;
      }

      if (slug !== undefined) {
        const cleanSlug = generateSlug(slug);
        if (!cleanSlug) {
          res.status(400).json({ message: 'Slug không hợp lệ.' });
          return;
        }
        dataToUpdate.slug = await findUniquePostSlug(cleanSlug, id);
      }

      if (excerpt !== undefined) {
        dataToUpdate.excerpt = stripHtml(excerpt);
      }

      if (coverImageUrl !== undefined) {
        dataToUpdate.coverImageUrl = typeof coverImageUrl === 'string' ? coverImageUrl.trim() : null;
      } else if (coverImage !== undefined) {
        dataToUpdate.coverImageUrl = typeof coverImage === 'string' ? coverImage.trim() : null;
      }

      if (categoryId !== undefined) {
        const cat = await withDbRetry(() =>
          prisma.blogCategory.findUnique({
            where: { id: String(categoryId).trim() }
          })
        );
        if (!cat) {
          res.status(400).json({ message: 'Danh mục không tồn tại.' });
          return;
        }
        dataToUpdate.categoryId = cat.id;
      }

      if (blocks !== undefined) {
        const blockValidation = validateAndSanitizeBlocks(blocks);
        if (!blockValidation.isValid) {
          res.status(400).json({ message: blockValidation.error });
          return;
        }
        dataToUpdate.blocks = blockValidation.sanitizedBlocks || [];
      } else if (content !== undefined) {
        dataToUpdate.blocks = htmlToBlocks(content);
      }

      if (tags !== undefined) {
        dataToUpdate.tags = Array.isArray(tags)
          ? tags.map((t: any) => stripHtml(t)).filter(Boolean)
          : [];
      }

      if (productIds !== undefined) {
        dataToUpdate.productIds = Array.isArray(productIds)
          ? productIds.map((pid: any) => String(pid).trim()).filter(Boolean)
          : [];
      } else if (relatedProductIds !== undefined) {
        dataToUpdate.productIds = Array.isArray(relatedProductIds)
          ? relatedProductIds.map((pid: any) => String(pid).trim()).filter(Boolean)
          : [];
      }

      if (author !== undefined) {
        dataToUpdate.authorName = stripHtml(author) || 'Ban biên tập DCor';
      }

      if (seoDescription !== undefined || seoTitle !== undefined) {
        dataToUpdate.seoDescription = stripHtml(seoDescription || seoTitle) || null;
      }

      if (status !== undefined) {
        const targetStatus = String(status).toUpperCase();
        if (!['DRAFT', 'PUBLISHED', 'HIDDEN'].includes(targetStatus)) {
          res.status(400).json({ message: 'Trạng thái bài viết không hợp lệ. Chỉ chấp nhận DRAFT, PUBLISHED hoặc HIDDEN.' });
          return;
        }
        dataToUpdate.status = targetStatus;
      }

      if (publishedAt !== undefined) {
        dataToUpdate.publishedAt = publishedAt ? new Date(publishedAt) : null;
      }

      // Kiểm tra tính hợp lệ trước khi xuất bản nếu trạng thái cuối cùng là PUBLISHED
      const effectiveStatus = dataToUpdate.status || existingPost.status;
      if (effectiveStatus === 'PUBLISHED') {
        const effectiveTitle = dataToUpdate.title ?? existingPost.title;
        const effectiveCover = dataToUpdate.coverImageUrl ?? existingPost.coverImageUrl;
        const effectiveCategory = dataToUpdate.categoryId ?? existingPost.categoryId;
        let effectiveBlocks = dataToUpdate.blocks ?? existingPost.blocks;

        if (!Array.isArray(effectiveBlocks) || effectiveBlocks.length < 1) {
          const excerptText = dataToUpdate.excerpt ?? existingPost.excerpt;
          if (excerptText) {
            effectiveBlocks = [{ type: 'paragraph', text: excerptText }];
            dataToUpdate.blocks = effectiveBlocks;
          }
        }

        if (
          !effectiveTitle ||
          !effectiveCover ||
          !effectiveCategory
        ) {
          res.status(400).json({
            message: 'Không thể xuất bản: Bài viết cần có đầy đủ tiêu đề, ảnh bìa và danh mục.'
          });
          return;
        }

        if (!dataToUpdate.publishedAt && !existingPost.publishedAt) {
          dataToUpdate.publishedAt = new Date();
        }
      }

      const updated = await withDbRetry(() =>
        prisma.blogPost.update({
          where: { id },
          data: dataToUpdate,
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

      res.json({
        message: 'Cập nhật bài viết thành công.',
        post: updated
      });
    } catch (error) {
      console.error('[ERROR] Lỗi admin updatePost:', error);
      res.status(500).json({ message: 'Không thể cập nhật bài viết.' });
    }
  },

  // 5. Cập nhật nhanh trạng thái bài viết (DRAFT | PUBLISHED | HIDDEN)
  updatePostStatus: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const id = String(req.params.id || '').trim();
      const { status, publishedAt } = req.body;

      const targetStatus = String(status || '').toUpperCase();
      if (!['DRAFT', 'PUBLISHED', 'HIDDEN'].includes(targetStatus)) {
        res.status(400).json({
          message: 'Trạng thái không hợp lệ. Chỉ chấp nhận DRAFT, PUBLISHED, HIDDEN.'
        });
        return;
      }

      const post = await withDbRetry(() =>
        prisma.blogPost.findUnique({
          where: { id }
        })
      );

      if (!post) {
        res.status(404).json({ message: 'Không tìm thấy bài viết.' });
        return;
      }

      let finalPublishedAt: Date | null = publishedAt
        ? new Date(publishedAt)
        : post.publishedAt;

      if (targetStatus === 'PUBLISHED') {
        // Kiểm tra bắt buộc trước khi xuất bản: tiêu đề, tóm tắt, ảnh bìa, danh mục, >= 1 khối
        const hasTitle = Boolean(post.title && post.title.trim());
        const hasExcerpt = Boolean(post.excerpt && post.excerpt.trim());
        const hasCover = Boolean(post.coverImageUrl && post.coverImageUrl.trim());
        const hasCategory = Boolean(post.categoryId);
        const hasBlocks = Array.isArray(post.blocks) && post.blocks.length >= 1;

        if (!hasTitle || !hasExcerpt || !hasCover || !hasCategory || !hasBlocks) {
          res.status(400).json({
            message: 'Không thể xuất bản: Bài viết cần có đầy đủ tiêu đề, tóm tắt, ảnh bìa, danh mục và ít nhất 1 khối nội dung.'
          });
          return;
        }

        // PUBLISHED mà không có publishedAt thì = now
        if (!finalPublishedAt) {
          finalPublishedAt = new Date();
        }
      }

      const updated = await withDbRetry(() =>
        prisma.blogPost.update({
          where: { id },
          data: {
            status: targetStatus,
            publishedAt: finalPublishedAt
          },
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

      res.json({
        message: 'Cập nhật trạng thái bài viết thành công.',
        post: updated
      });
    } catch (error) {
      console.error('[ERROR] Lỗi admin updatePostStatus:', error);
      res.status(500).json({ message: 'Không thể cập nhật trạng thái bài viết.' });
    }
  },

  // 6. Xóa bài viết (xóa cả bình luận và lượt thích)
  deletePost: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const id = String(req.params.id || '').trim();

      const post = await withDbRetry(() =>
        prisma.blogPost.findUnique({
          where: { id },
          select: { id: true }
        })
      );

      if (!post) {
        res.status(404).json({ message: 'Không tìm thấy bài viết.' });
        return;
      }

      await prisma.$transaction([
        prisma.blogComment.deleteMany({ where: { postId: id } }),
        prisma.blogLike.deleteMany({ where: { postId: id } }),
        prisma.blogPost.delete({ where: { id } })
      ]);

      res.json({ message: 'Đã xóa bài viết cùng toàn bộ bình luận và lượt thích.' });
    } catch (error) {
      console.error('[ERROR] Lỗi admin deletePost:', error);
      res.status(500).json({ message: 'Không thể xóa bài viết.' });
    }
  },

  // 7. Danh mục Blog: Danh sách
  getCategories: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const categories = await withDbRetry(() =>
        prisma.blogCategory.findMany({
          orderBy: { sortOrder: 'asc' },
          include: {
            _count: {
              select: {
                posts: true
              }
            }
          }
        })
      );

      const items = categories.map(c => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        sortOrder: c.sortOrder,
        isActive: c.isActive,
        status: c.isActive ? 'ACTIVE' : 'HIDDEN',
        postCount: c._count.posts,
        articleCount: c._count.posts,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt
      }));

      res.json(items);
    } catch (error) {
      console.error('[ERROR] Lỗi admin getCategories:', error);
      res.status(500).json({ message: 'Không thể tải danh mục blog.' });
    }
  },

  // 8. Danh mục Blog: Tạo mới
  createCategory: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { name, slug, sortOrder, isActive, status } = req.body;

      const cleanName = stripHtml(name);
      if (!cleanName) {
        res.status(400).json({ message: 'Tên danh mục không được để trống.' });
        return;
      }

      const baseSlug = generateSlug(slug || cleanName) || 'danh-muc';
      const uniqueSlug = await findUniqueCategorySlug(baseSlug);

      const isCatActive = status !== undefined
        ? status === 'ACTIVE'
        : (isActive !== undefined ? Boolean(isActive) : true);

      const category = await withDbRetry(() =>
        prisma.blogCategory.create({
          data: {
            name: cleanName,
            slug: uniqueSlug,
            sortOrder: Number(sortOrder) || 0,
            isActive: isCatActive
          }
        })
      );

      res.status(201).json({
        message: 'Tạo danh mục thành công.',
        category: {
          ...category,
          status: category.isActive ? 'ACTIVE' : 'HIDDEN',
          articleCount: 0,
          postCount: 0
        }
      });
    } catch (error) {
      console.error('[ERROR] Lỗi admin createCategory:', error);
      res.status(500).json({ message: 'Không thể tạo danh mục blog.' });
    }
  },

  // 9. Danh mục Blog: Sửa
  updateCategory: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const id = String(req.params.id || '').trim();

      const existing = await withDbRetry(() =>
        prisma.blogCategory.findUnique({
          where: { id }
        })
      );

      if (!existing) {
        res.status(404).json({ message: 'Danh mục không tồn tại.' });
        return;
      }

      const { name, slug, sortOrder, isActive, status } = req.body;
      const dataToUpdate: any = {};

      if (name !== undefined) {
        const cleanName = stripHtml(name);
        if (!cleanName) {
          res.status(400).json({ message: 'Tên danh mục không được để trống.' });
          return;
        }
        dataToUpdate.name = cleanName;
      }

      if (slug !== undefined) {
        const cleanSlug = generateSlug(slug);
        if (!cleanSlug) {
          res.status(400).json({ message: 'Slug danh mục không hợp lệ.' });
          return;
        }
        dataToUpdate.slug = await findUniqueCategorySlug(cleanSlug, id);
      }

      if (sortOrder !== undefined) {
        dataToUpdate.sortOrder = Number(sortOrder) || 0;
      }

      if (status !== undefined) {
        dataToUpdate.isActive = status === 'ACTIVE';
      } else if (isActive !== undefined) {
        dataToUpdate.isActive = Boolean(isActive);
      }

      const updated = await withDbRetry(() =>
        prisma.blogCategory.update({
          where: { id },
          data: dataToUpdate
        })
      );

      res.json({
        message: 'Cập nhật danh mục thành công.',
        category: {
          ...updated,
          status: updated.isActive ? 'ACTIVE' : 'HIDDEN'
        }
      });
    } catch (error) {
      console.error('[ERROR] Lỗi admin updateCategory:', error);
      res.status(500).json({ message: 'Không thể cập nhật danh mục.' });
    }
  },

  // 10. Danh mục Blog: Xóa (không xóa khi còn bài)
  deleteCategory: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const id = String(req.params.id || '').trim();

      const existing = await withDbRetry(() =>
        prisma.blogCategory.findUnique({
          where: { id }
        })
      );

      if (!existing) {
        res.status(404).json({ message: 'Danh mục không tồn tại.' });
        return;
      }

      const postCount = await withDbRetry(() =>
        prisma.blogPost.count({
          where: { categoryId: id }
        })
      );

      if (postCount > 0) {
        res.status(400).json({
          message: `Không thể xóa danh mục đang có ${postCount} bài viết. Vui lòng chuyển hoặc xóa các bài viết trước.`
        });
        return;
      }

      await withDbRetry(() =>
        prisma.blogCategory.delete({
          where: { id }
        })
      );

      res.json({ message: 'Đã xóa danh mục thành công.' });
    } catch (error) {
      console.error('[ERROR] Lỗi admin deleteCategory:', error);
      res.status(500).json({ message: 'Không thể xóa danh mục.' });
    }
  },

  // 11. Kiểm duyệt bình luận: Danh sách
  getComments: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { status, postId } = req.query;
      const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
      const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string, 10) || 20));
      const skip = (page - 1) * pageSize;

      const where: any = {};
      if (status && typeof status === 'string' && status.trim()) {
        where.status = status.trim().toUpperCase();
      }

      if (postId && typeof postId === 'string' && postId.trim()) {
        where.postId = postId.trim();
      }

      const [total, comments] = await withDbRetry(() =>
        Promise.all([
          prisma.blogComment.count({ where }),
          prisma.blogComment.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip,
            take: pageSize,
            include: {
              post: {
                select: {
                  id: true,
                  title: true,
                  slug: true
                }
              }
            }
          })
        ])
      );

      res.json({
        items: comments,
        total,
        page,
        pageSize
      });
    } catch (error) {
      console.error('[ERROR] Lỗi admin getComments:', error);
      res.status(500).json({ message: 'Không thể tải danh sách bình luận.' });
    }
  },

  // 12. Kiểm duyệt bình luận: Cập nhật trạng thái ('VISIBLE' | 'HIDDEN')
  updateCommentStatus: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const id = String(req.params.id || '').trim();
      const { status } = req.body;

      const targetStatus = String(status || '').toUpperCase();
      if (!['VISIBLE', 'HIDDEN'].includes(targetStatus)) {
        res.status(400).json({
          message: 'Trạng thái bình luận không hợp lệ. Chỉ chấp nhận VISIBLE hoặc HIDDEN.'
        });
        return;
      }

      const comment = await withDbRetry(() =>
        prisma.blogComment.findUnique({
          where: { id }
        })
      );

      if (!comment) {
        res.status(404).json({ message: 'Bình luận không tồn tại.' });
        return;
      }

      const updated = await withDbRetry(() =>
        prisma.blogComment.update({
          where: { id },
          data: { status: targetStatus }
        })
      );

      res.json({
        message: 'Cập nhật trạng thái bình luận thành công.',
        comment: updated
      });
    } catch (error) {
      console.error('[ERROR] Lỗi admin updateCommentStatus:', error);
      res.status(500).json({ message: 'Không thể cập nhật trạng thái bình luận.' });
    }
  },

  // 13. Tìm kiếm sản phẩm để gắn thẻ vào bài viết (tối đa 20 sản phẩm đang bán)
  searchProducts: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';

      const where: any = {
        isActive: true,
        deletedAt: null
      };

      if (q) {
        where.OR = [
          { name: { contains: q, mode: 'insensitive' } },
          { slug: { contains: q, mode: 'insensitive' } }
        ];
      }

      const products = await withDbRetry(() =>
        prisma.product.findMany({
          where,
          take: 20,
          orderBy: { createdAt: 'desc' },
          include: {
            variants: {
              where: { isActive: true },
              select: { price: true }
            }
          }
        })
      );

      const items = products.map(p => {
        const lowestPrice =
          p.variants.length > 0
            ? Math.min(...p.variants.map((v: any) => v.price))
            : p.basePrice;
        const firstImage =
          Array.isArray(p.images) && p.images.length > 0
            ? typeof p.images[0] === 'string'
              ? p.images[0]
              : (p.images[0] as any)?.url || ''
            : '';

        return {
          id: p.id,
          name: p.name,
          image: firstImage,
          price: lowestPrice
        };
      });

      res.json({ products: items });
    } catch (error) {
      console.error('[ERROR] Lỗi admin searchProducts:', error);
      res.status(500).json({ message: 'Không thể tìm kiếm sản phẩm.' });
    }
  }
};

