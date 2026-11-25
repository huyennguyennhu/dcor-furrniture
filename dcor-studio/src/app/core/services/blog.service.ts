import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface BlogArticle {
  id: string;
  title: string;
  slug: string;
  coverImage: string;
  categoryId: string;
  categoryName: string;
  author: string;
  authorAvatar?: string;
  status: 'DRAFT' | 'PUBLISHED' | 'HIDDEN';
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  views: number;
  excerpt: string;
  content: string; // Rich text HTML
  tags: string[];
  seoTitle?: string;
  seoDescription?: string;
  relatedProductIds: string[];
}

export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  articleCount: number;
  status: 'ACTIVE' | 'HIDDEN';
  sortOrder: number;
}

export interface SimpleProduct {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  imageUrl: string;
  sku?: string;
  categoryName?: string;
}

export interface BlogActionResult<T = any> {
  ok: boolean;
  data?: T;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class BlogService {
  private readonly http = inject(HttpClient);
  private readonly adminApiUrl = `${environment.apiUrl}/admin/blog`;

  private articlesSubject = new BehaviorSubject<BlogArticle[]>([]);
  public articles$ = this.articlesSubject.asObservable();

  private categoriesSubject = new BehaviorSubject<BlogCategory[]>([]);
  public categories$ = this.categoriesSubject.asObservable();

  private productsSubject = new BehaviorSubject<SimpleProduct[]>([]);
  public products$ = this.productsSubject.asObservable();

  constructor() {
    this.initData();
  }

  getProducts(): SimpleProduct[] {
    return this.productsSubject.value;
  }

  private initData(): void {
    // 0. Khởi tạo sản phẩm mặc định phòng trường hợp mạng chưa sẵn sàng
    const initialProducts = this.getDefaultProducts();
    this.productsSubject.next(initialProducts);

    // 1. Tải danh mục và bài viết từ cơ sở dữ liệu PostgreSQL
    this.loadCategoriesFromBackend();
    this.loadArticlesFromBackend();

    // 2. Tải danh sách sản phẩm thực tế từ kho/cửa hàng
    this.loadRealProducts();
  }

  // ==========================================
  // TẢI DỮ LIỆU TỪ DATABASE POSTGRESQL (BACKEND)
  // ==========================================

  public async loadCategoriesFromBackend(): Promise<BlogCategory[]> {
    try {
      const data = await firstValueFrom(this.http.get<any[]>(`${this.adminApiUrl}/categories`));
      if (Array.isArray(data)) {
        const categories: BlogCategory[] = data.map(c => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          description: c.description || '',
          articleCount: c.postCount ?? c.articleCount ?? 0,
          status: c.status || (c.isActive ? 'ACTIVE' : 'HIDDEN'),
          sortOrder: c.sortOrder ?? 0
        }));
        this.categoriesSubject.next(categories);
        return categories;
      }
    } catch (err) {
      console.warn('[BlogService] Không thể tải danh mục từ backend, sử dụng danh mục mẫu:', err);
    }

    if (this.categoriesSubject.value.length === 0) {
      const defCats = this.getDefaultCategories();
      this.categoriesSubject.next(defCats);
      return defCats;
    }
    return this.categoriesSubject.value;
  }

  public async loadArticlesFromBackend(): Promise<BlogArticle[]> {
    try {
      const res = await firstValueFrom(this.http.get<any>(`${this.adminApiUrl}/posts?pageSize=100`));
      const items = res?.items || (Array.isArray(res) ? res : []);
      if (Array.isArray(items)) {
        const articles: BlogArticle[] = items.map(p => ({
          id: p.id,
          title: p.title,
          slug: p.slug,
          coverImage: p.coverImageUrl || p.coverImage || '',
          categoryId: p.categoryId,
          categoryName: p.category?.name || p.categoryName || '',
          author: p.authorName || p.author || 'Ban biên tập DCor',
          authorAvatar: p.authorAvatar || '/assets/favicon/logo.png',
          status: p.status === 'PUBLISHED' || p.status === 'HIDDEN' ? p.status : 'DRAFT',
          publishedAt: p.publishedAt,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
          views: p.viewsCount || p.views || 0,
          excerpt: p.excerpt || '',
          content: p.content || this.blocksToHtml(p.blocks),
          tags: p.tags || [],
          seoTitle: p.seoTitle || p.title,
          seoDescription: p.seoDescription || p.excerpt || '',
          relatedProductIds: p.productIds || p.relatedProductIds || []
        }));

        this.articlesSubject.next(articles);
        this.updateCategoryCounts(articles, this.categoriesSubject.value);
        return articles;
      }
    } catch (err) {
      console.warn('[BlogService] Không thể tải bài viết từ backend:', err);
    }
    return this.articlesSubject.value;
  }

  private async loadRealProducts(): Promise<void> {
    try {
      const prods = await this.fetchAvailableProducts();
      if (prods && prods.length > 0) {
        this.productsSubject.next(prods);
      }
    } catch (e) {
      console.warn('[BlogService] loadRealProducts warning:', e);
    }
  }

  // ==========================================
  // ARTICLE METHODS (KẾT NỐI DATABASE TRỰC TIẾP)
  // ==========================================

  getArticles(): BlogArticle[] {
    return this.articlesSubject.value;
  }

  getArticleById(id: string): BlogArticle | undefined {
    return this.articlesSubject.value.find(a => a.id === id);
  }

  getArticleBySlug(slug: string): BlogArticle | undefined {
    return this.articlesSubject.value.find(a => a.slug === slug);
  }

  private extractHttpError(err: any, fallback: string): string {
    return err?.error?.message || err?.error?.error || err?.message || fallback;
  }

  async saveArticle(article: Partial<BlogArticle>): Promise<BlogActionResult<BlogArticle>> {
    const now = new Date().toISOString();
    const isEdit = Boolean(article.id && !article.id.startsWith('temp-'));

    const blocks = article.content ? this.htmlToBlocks(article.content) : [];
    const payload: any = {
      title: article.title?.trim() || 'Bài viết mới',
      slug: article.slug?.trim() || this.generateSlug(article.title || 'bai-viet-moi'),
      excerpt: article.excerpt?.trim() || '',
      blocks,
      content: article.content || '',
      coverImageUrl: article.coverImage?.trim() || '/assets/room_img/phong_khach.jpg',
      coverImage: article.coverImage?.trim() || '/assets/room_img/phong_khach.jpg',
      categoryId: article.categoryId,
      tags: article.tags || [],
      seoDescription: article.seoDescription?.trim() || article.excerpt?.trim() || '',
      status: article.status || 'DRAFT',
      publishedAt: article.status === 'PUBLISHED' ? (article.publishedAt || now) : null,
      productIds: article.relatedProductIds || [],
      relatedProductIds: article.relatedProductIds || [],
      author: article.author?.trim() || 'Ban biên tập DCor'
    };

    try {
      const res: any = isEdit
        ? await firstValueFrom(this.http.put<any>(`${this.adminApiUrl}/posts/${article.id}`, payload))
        : await firstValueFrom(this.http.post<any>(`${this.adminApiUrl}/posts`, payload));

      const savedPost = res?.post || res;
      await Promise.all([this.loadArticlesFromBackend(), this.loadCategoriesFromBackend()]);
      const synced = this.articlesSubject.value.find(a => a.id === savedPost?.id);
      return { ok: true, data: synced || savedPost };
    } catch (err: any) {
      console.error('[BlogService] Lỗi khi lưu bài viết lên database:', err);
      return { ok: false, error: this.extractHttpError(err, 'Không thể lưu bài viết lên hệ thống.') };
    }
  }

  async deleteArticle(id: string): Promise<BlogActionResult> {
    if (id.startsWith('temp-')) {
      const current = this.articlesSubject.value.filter(a => a.id !== id);
      this.articlesSubject.next(current);
      this.updateCategoryCounts(current, this.categoriesSubject.value);
      return { ok: true };
    }

    try {
      await firstValueFrom(this.http.delete(`${this.adminApiUrl}/posts/${id}`));
      await Promise.all([this.loadArticlesFromBackend(), this.loadCategoriesFromBackend()]);
      return { ok: true };
    } catch (err: any) {
      console.error('[BlogService] Lỗi khi xóa bài viết khỏi database:', err);
      return { ok: false, error: this.extractHttpError(err, 'Không thể xóa bài viết.') };
    }
  }

  async toggleArticleStatus(id: string): Promise<BlogActionResult<BlogArticle>> {
    const art = this.articlesSubject.value.find(a => a.id === id);
    if (!art) return { ok: false, error: 'Không tìm thấy bài viết.' };

    const newStatus: 'PUBLISHED' | 'HIDDEN' = art.status === 'PUBLISHED' ? 'HIDDEN' : 'PUBLISHED';
    const publishedAt = newStatus === 'PUBLISHED' && !art.publishedAt ? new Date().toISOString() : art.publishedAt;

    try {
      await firstValueFrom(
        this.http.patch<any>(`${this.adminApiUrl}/posts/${id}/status`, {
          status: newStatus,
          publishedAt
        })
      );
      await Promise.all([this.loadArticlesFromBackend(), this.loadCategoriesFromBackend()]);
      const updated = this.articlesSubject.value.find(a => a.id === id);
      return { ok: true, data: updated || { ...art, status: newStatus, publishedAt } };
    } catch (err: any) {
      console.error('[BlogService] Lỗi khi cập nhật trạng thái bài viết:', err);
      return { ok: false, error: this.extractHttpError(err, 'Không thể cập nhật trạng thái bài viết.') };
    }
  }

  async bulkUpdateStatus(ids: string[], status: 'PUBLISHED' | 'HIDDEN' | 'DRAFT'): Promise<BlogActionResult> {
    const validIds = ids.filter(id => !id.startsWith('temp-'));
    try {
      await Promise.all(
        validIds.map(id =>
          firstValueFrom(this.http.patch(`${this.adminApiUrl}/posts/${id}/status`, { status }))
        )
      );
      await this.loadArticlesFromBackend();
      return { ok: true };
    } catch (err: any) {
      console.error('[BlogService] Lỗi cập nhật trạng thái hàng loạt:', err);
      await this.loadArticlesFromBackend();
      return { ok: false, error: this.extractHttpError(err, 'Một số bài viết không thể cập nhật trạng thái.') };
    }
  }

  async bulkDelete(ids: string[]): Promise<BlogActionResult> {
    const validIds = ids.filter(id => !id.startsWith('temp-'));
    try {
      await Promise.all(
        validIds.map(id => firstValueFrom(this.http.delete(`${this.adminApiUrl}/posts/${id}`)))
      );
      await Promise.all([this.loadArticlesFromBackend(), this.loadCategoriesFromBackend()]);
      return { ok: true };
    } catch (err: any) {
      console.error('[BlogService] Lỗi xóa bài viết hàng loạt:', err);
      await Promise.all([this.loadArticlesFromBackend(), this.loadCategoriesFromBackend()]);
      return { ok: false, error: this.extractHttpError(err, 'Một số bài viết không thể xóa.') };
    }
  }

  // ==========================================
  // CATEGORY METHODS (KẾT NỐI DATABASE TRỰC TIẾP)
  // ==========================================

  getCategories(): BlogCategory[] {
    return this.categoriesSubject.value;
  }

  async saveCategory(cat: Partial<BlogCategory>): Promise<BlogActionResult<BlogCategory>> {
    const isEdit = Boolean(cat.id && !cat.id.startsWith('temp-'));
    const status = cat.status || 'ACTIVE';
    const payload = {
      name: cat.name?.trim() || 'Chuyên mục mới',
      slug: cat.slug?.trim() || this.generateSlug(cat.name || 'chuyen-muc-moi'),
      sortOrder: Number(cat.sortOrder) || this.categoriesSubject.value.length + 1,
      status,
      isActive: status === 'ACTIVE'
    };

    try {
      const res: any = isEdit
        ? await firstValueFrom(this.http.put<any>(`${this.adminApiUrl}/categories/${cat.id}`, payload))
        : await firstValueFrom(this.http.post<any>(`${this.adminApiUrl}/categories`, payload));

      await this.loadCategoriesFromBackend();
      return { ok: true, data: res?.category || res };
    } catch (err: any) {
      console.error('[BlogService] Lỗi lưu danh mục:', err);
      return { ok: false, error: this.extractHttpError(err, 'Không thể lưu chuyên mục.') };
    }
  }

  async deleteCategory(id: string): Promise<BlogActionResult> {
    try {
      await firstValueFrom(this.http.delete(`${this.adminApiUrl}/categories/${id}`));
      await this.loadCategoriesFromBackend();
      return { ok: true };
    } catch (err: any) {
      console.error('[BlogService] Lỗi xóa danh mục:', err);
      return { ok: false, error: this.extractHttpError(err, 'Không thể xóa chuyên mục.') };
    }
  }

  async toggleCategoryStatus(id: string): Promise<BlogActionResult> {
    const cat = this.categoriesSubject.value.find(c => c.id === id);
    if (!cat) return { ok: false, error: 'Không tìm thấy chuyên mục.' };

    const newStatus = cat.status === 'ACTIVE' ? ('HIDDEN' as const) : ('ACTIVE' as const);
    try {
      await firstValueFrom(
        this.http.put(`${this.adminApiUrl}/categories/${id}`, {
          status: newStatus,
          isActive: newStatus === 'ACTIVE'
        })
      );
      await this.loadCategoriesFromBackend();
      return { ok: true };
    } catch (err: any) {
      console.error('[BlogService] Lỗi cập nhật trạng thái danh mục:', err);
      return { ok: false, error: this.extractHttpError(err, 'Không thể cập nhật trạng thái chuyên mục.') };
    }
  }

  // ==========================================
  // SẢN PHẨM & TÌM KIẾM SẢN PHẨM GẮN VÀO BÀI
  // ==========================================

  async fetchAvailableProducts(): Promise<SimpleProduct[]> {
    try {
      // 1. Tìm qua endpoint search sản phẩm của blog admin
      const res = await fetch(`${this.adminApiUrl}/products/search?q=`, {
        headers: this.getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        const raw = Array.isArray(data) ? data : (data.items || []);
        if (raw && raw.length > 0) {
          return raw.map((p: any) => ({
            id: p.id,
            name: p.name,
            price: Number(p.price || 0),
            originalPrice: Number(p.originalPrice || 0),
            imageUrl: p.image || p.imageUrl || '/assets/placeholder.png',
            sku: p.sku || `SKU-${p.id?.slice(0, 6)}`,
            categoryName: p.categoryName || 'Nội thất DCor'
          }));
        }
      }
    } catch (_) {}

    try {
      // 2. Thử endpoint kho hàng
      const res = await fetch(`${environment.apiUrl}/admin/inventory/products-options`, {
        headers: this.getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        const raw = Array.isArray(data) ? data : (data.data || data.items || []);
        if (raw && raw.length > 0) {
          return raw.map((p: any) => {
            const firstVariant = p.variants && p.variants.length > 0 ? p.variants[0] : null;
            return {
              id: p.id,
              name: p.name,
              price: Number(p.basePrice || (firstVariant ? firstVariant.price : 0) || 0),
              originalPrice: Number(p.originalPrice || 0),
              imageUrl: (p.images && p.images.length > 0) ? p.images[0] : (p.imageUrl || '/assets/placeholder.png'),
              sku: (firstVariant && firstVariant.sku) ? firstVariant.sku : (p.sku || `SKU-${p.id?.slice(0, 8).toUpperCase()}`),
              categoryName: p.categoryName || p.category?.name || 'Nội thất DCor'
            };
          });
        }
      }
    } catch (_) {}

    return this.getDefaultProducts();
  }

  private getAuthHeaders(): HeadersInit {
    const token = sessionStorage.getItem('dcor_admin_token') || localStorage.getItem('dcor_admin_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  // ==========================================
  // HELPERS: SLUG & CHUYỂN ĐỔI BLOCKS <-> HTML
  // ==========================================

  generateSlug(text: string): string {
    return (text || '')
      .toString()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[đĐ]/g, 'd')
      .replace(/[^a-z0-9 -]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  public htmlToBlocks(html: string): any[] {
    if (!html || !html.trim()) return [];

    if (typeof document !== 'undefined') {
      const container = document.createElement('div');
      container.innerHTML = html.trim();
      const blocks: any[] = [];

      const nodes = Array.from(container.children);
      if (nodes.length === 0) {
        const text = container.textContent?.trim();
        if (text) blocks.push({ type: 'paragraph', text });
        return blocks;
      }

      for (const node of nodes) {
        const tag = node.tagName.toLowerCase();
        if (tag === 'h2') {
          const text = node.textContent?.trim();
          if (text) blocks.push({ type: 'heading', level: 2, text });
        } else if (tag === 'h3' || tag === 'h4') {
          const text = node.textContent?.trim();
          if (text) blocks.push({ type: 'heading', level: 3, text });
        } else if (tag === 'blockquote') {
          const citeEl = node.querySelector('cite');
          const cite = citeEl?.textContent?.trim();
          if (citeEl) citeEl.remove();
          const text = node.textContent?.trim();
          if (text) blocks.push({ type: 'quote', text, ...(cite ? { cite } : {}) });
        } else if (tag === 'ul') {
          const items = Array.from(node.querySelectorAll('li'))
            .map(li => li.textContent?.trim() || '')
            .filter(Boolean);
          if (items.length > 0) blocks.push({ type: 'list', ordered: false, items });
        } else if (tag === 'ol') {
          const items = Array.from(node.querySelectorAll('li'))
            .map(li => li.textContent?.trim() || '')
            .filter(Boolean);
          if (items.length > 0) blocks.push({ type: 'list', ordered: true, items });
        } else if (tag === 'figure') {
          const img = node.querySelector('img');
          const url = img?.getAttribute('src') || '';
          const figcap = node.querySelector('figcaption');
          const caption = figcap?.textContent?.trim() || img?.getAttribute('alt') || '';
          if (url) blocks.push({ type: 'image', url, ...(caption ? { caption } : {}) });
        } else if (tag === 'img') {
          const url = (node as HTMLImageElement).src || node.getAttribute('src') || '';
          const caption = (node as HTMLImageElement).alt || '';
          if (url) blocks.push({ type: 'image', url, ...(caption ? { caption } : {}) });
        } else {
          const img = node.querySelector('img');
          if (img && !node.textContent?.trim()) {
            const url = img.getAttribute('src') || '';
            const caption = img.getAttribute('alt') || '';
            if (url) blocks.push({ type: 'image', url, ...(caption ? { caption } : {}) });
          } else {
            const text = node.textContent?.trim();
            if (text) blocks.push({ type: 'paragraph', text });
          }
        }
      }

      return blocks;
    }

    return [{ type: 'paragraph', text: html.replace(/<[^>]*>?/gm, '').trim() }];
  }

  public blocksToHtml(blocks: any): string {
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

  private updateCategoryCounts(articles: BlogArticle[], categories: BlogCategory[]): void {
    const updated = categories.map(cat => ({
      ...cat,
      articleCount: articles.filter(a => a.categoryId === cat.id).length
    }));
    this.categoriesSubject.next(updated);
  }

  private getDefaultCategories(): BlogCategory[] {
    return [
      { id: 'cat-1', name: 'Xu hướng', slug: 'xu-huong', description: 'Các phong cách thiết kế nội thất hiện đại, xu hướng luxury quốc tế.', articleCount: 0, status: 'ACTIVE', sortOrder: 1 },
      { id: 'cat-2', name: 'Mẹo không gian', slug: 'meo-khong-gian', description: 'Cẩm nang chọn lựa chất liệu, kết cấu gỗ, da bò, nỉ cao cấp.', articleCount: 0, status: 'ACTIVE', sortOrder: 2 },
      { id: 'cat-3', name: 'Cẩm nang chọn mua', slug: 'cam-nang-chon-mua', description: 'Nghệ thuật sắp đặt không gian sống, phong thủy tài lộc phòng khách.', articleCount: 0, status: 'ACTIVE', sortOrder: 3 },
      { id: 'cat-4', name: 'Chăm sóc nội thất', slug: 'cham-soc-noi-that', description: 'Quy trình chăm sóc, vệ sinh da thật và bề mặt gỗ sơn phủ.', articleCount: 0, status: 'ACTIVE', sortOrder: 4 }
    ];
  }

  private getDefaultProducts(): SimpleProduct[] {
    return [
      {
        id: 'cc96ae87-5ef3-4318-a963-2941fa0583f7',
        name: 'Sofa Da Bò Ý Carmo 3 Chỗ Phong Cách Bắc Âu',
        price: 2000000,
        originalPrice: 3500000,
        imageUrl: 'https://res.cloudinary.com/yqbkibfq/image/upload/v1793525289/dcor/products/zlzfwaill5zyvwhp78bh.webp',
        sku: 'SF-CARMO-01',
        categoryName: 'Sofa Phòng Khách'
      },
      {
        id: 'a6225c30-ccce-4c52-8aba-2da9d5a285ab',
        name: 'Sofa Góc L Bergamo Hiện Đại',
        price: 15000000,
        originalPrice: 18000000,
        imageUrl: 'https://res.cloudinary.com/yqbkibfq/image/upload/v1793525266/dcor/products/b4fbf8o366bjquflg8kx.webp',
        sku: 'SF-BERGAMO-02',
        categoryName: 'Sofa Góc L'
      },
      {
        id: '19ca8651-fff2-448e-a533-4d7eaa00f15a',
        name: 'Sofa Thư Giãn DCor Luxury Milano',
        price: 15000000,
        originalPrice: 19500000,
        imageUrl: '/assets/img/furniture-placeholder.svg',
        sku: 'SF-MILANO-03',
        categoryName: 'Sofa Thư Giãn'
      },
      {
        id: '5a578ef6-612c-437d-87ea-92409203dcd1',
        name: 'Ghế Bành Thư Giãn Imola Da Bò Thủ Công',
        price: 15000000,
        originalPrice: 17500000,
        imageUrl: '/assets/img/furniture-placeholder.svg',
        sku: 'CH-IMOLA-04',
        categoryName: 'Ghế Thư Giãn'
      }
    ];
  }
}
