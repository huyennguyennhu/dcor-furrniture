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
  status: 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'HIDDEN';
  publishedAt?: string;
  scheduledAt?: string;
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

export interface MarketingBanner {
  id: string;
  title: string;
  position: 'HOME_HERO' | 'BLOG_SIDEBAR' | 'COLLECTION_BANNER';
  imageUrl: string;
  linkUrl: string;
  status: 'ACTIVE' | 'INACTIVE';
  startDate?: string;
  endDate?: string;
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

const STORAGE_BANNERS_KEY = 'dcor_marketing_banners';

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

  private bannersSubject = new BehaviorSubject<MarketingBanner[]>([]);
  public banners$ = this.bannersSubject.asObservable();

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

    // 2. Khởi tạo Banner quảng cáo (marketing)
    let banners: MarketingBanner[] = [];
    try {
      const storedBanners = localStorage.getItem(STORAGE_BANNERS_KEY);
      if (storedBanners) {
        banners = JSON.parse(storedBanners);
      }
    } catch (_) {}

    if (!banners || banners.length === 0) {
      banners = this.getDefaultBanners();
      this.saveBannersToStorage(banners);
    }
    this.bannersSubject.next(banners);

    // 3. Tải danh sách sản phẩm thực tế từ kho/cửa hàng
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
          authorAvatar: p.authorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
          status: p.status,
          publishedAt: p.publishedAt,
          scheduledAt: p.scheduledAt,
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

  saveArticle(article: Partial<BlogArticle>): BlogArticle {
    const current = [...this.articlesSubject.value];
    const now = new Date().toISOString();

    const isEdit = Boolean(article.id && !article.id.startsWith('temp-'));
    let savedItem: BlogArticle;

    if (isEdit) {
      const index = current.findIndex(a => a.id === article.id);
      if (index >= 0) {
        savedItem = {
          ...current[index],
          ...article,
          updatedAt: now
        } as BlogArticle;
        current[index] = savedItem;
      } else {
        savedItem = this.createArticleObject(article, now);
        current.unshift(savedItem);
      }
    } else {
      savedItem = this.createArticleObject(article, now);
      current.unshift(savedItem);
    }

    // Cập nhật State tức thì trên giao diện (Optimistic UI)
    this.articlesSubject.next(current);
    this.updateCategoryCounts(current, this.categoriesSubject.value);

    // Chuẩn bị payload gửi lên PostgreSQL Backend
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
      scheduledAt: article.status === 'SCHEDULED' ? article.scheduledAt : null,
      productIds: article.relatedProductIds || [],
      relatedProductIds: article.relatedProductIds || [],
      author: article.author?.trim() || 'Ban biên tập DCor'
    };

    if (isEdit) {
      // Gửi PUT cập nhật tới Backend
      this.http.put<any>(`${this.adminApiUrl}/posts/${article.id}`, payload).subscribe({
        next: (res) => {
          const updatedPost = res.post || res;
          if (updatedPost && updatedPost.id) {
            const list = [...this.articlesSubject.value];
            const idx = list.findIndex(a => a.id === updatedPost.id);
            if (idx >= 0) {
              list[idx] = {
                ...list[idx],
                ...updatedPost,
                coverImage: updatedPost.coverImageUrl || updatedPost.coverImage || list[idx].coverImage,
                categoryName: updatedPost.category?.name || list[idx].categoryName,
                author: updatedPost.authorName || list[idx].author,
                views: updatedPost.viewsCount ?? list[idx].views,
                relatedProductIds: updatedPost.productIds || list[idx].relatedProductIds,
                content: updatedPost.content || list[idx].content
              };
              this.articlesSubject.next(list);
              this.updateCategoryCounts(list, this.categoriesSubject.value);
            }
          }
        },
        error: (err) => {
          console.error('[BlogService] Lỗi khi cập nhật bài viết lên database:', err);
        }
      });
    } else {
      // Gửi POST tạo mới tới Backend
      this.http.post<any>(`${this.adminApiUrl}/posts`, payload).subscribe({
        next: (res) => {
          const createdPost = res.post || res;
          if (createdPost && createdPost.id) {
            const list = [...this.articlesSubject.value];
            const idx = list.findIndex(a => a.id === savedItem.id);
            const realArticle: BlogArticle = {
              id: createdPost.id,
              title: createdPost.title,
              slug: createdPost.slug,
              coverImage: createdPost.coverImageUrl || createdPost.coverImage || savedItem.coverImage,
              categoryId: createdPost.categoryId,
              categoryName: createdPost.category?.name || savedItem.categoryName,
              author: createdPost.authorName || createdPost.author || savedItem.author,
              authorAvatar: savedItem.authorAvatar,
              status: createdPost.status,
              publishedAt: createdPost.publishedAt,
              scheduledAt: createdPost.scheduledAt,
              createdAt: createdPost.createdAt,
              updatedAt: createdPost.updatedAt,
              views: createdPost.viewsCount || 0,
              excerpt: createdPost.excerpt,
              content: createdPost.content || savedItem.content,
              tags: createdPost.tags || [],
              seoTitle: savedItem.seoTitle,
              seoDescription: createdPost.seoDescription || savedItem.seoDescription,
              relatedProductIds: createdPost.productIds || savedItem.relatedProductIds
            };

            if (idx >= 0) {
              list[idx] = realArticle;
            } else {
              list.unshift(realArticle);
            }
            this.articlesSubject.next(list);
            this.loadCategoriesFromBackend();
          }
        },
        error: (err) => {
          console.error('[BlogService] Lỗi khi tạo bài viết mới trên database:', err);
        }
      });
    }

    return savedItem;
  }

  private createArticleObject(article: Partial<BlogArticle>, now: string): BlogArticle {
    const id = 'temp-' + Date.now();
    const slug = article.slug || this.generateSlug(article.title || 'bai-viet-moi');
    return {
      id,
      title: article.title || 'Tiêu đề bài viết',
      slug,
      coverImage: article.coverImage || '/assets/room_img/phong_khach.jpg',
      categoryId: article.categoryId || '',
      categoryName: article.categoryName || '',
      author: article.author || 'Ban biên tập DCor',
      authorAvatar: article.authorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      status: article.status || 'DRAFT',
      publishedAt: article.status === 'PUBLISHED' ? (article.publishedAt || now) : undefined,
      scheduledAt: article.status === 'SCHEDULED' ? article.scheduledAt : undefined,
      createdAt: article.createdAt || now,
      updatedAt: now,
      views: article.views || 0,
      excerpt: article.excerpt || '',
      content: article.content || '',
      tags: article.tags || [],
      seoTitle: article.seoTitle || article.title,
      seoDescription: article.seoDescription || article.excerpt,
      relatedProductIds: article.relatedProductIds || []
    };
  }

  deleteArticle(id: string): void {
    const current = this.articlesSubject.value.filter(a => a.id !== id);
    this.articlesSubject.next(current);
    this.updateCategoryCounts(current, this.categoriesSubject.value);

    if (!id.startsWith('temp-')) {
      this.http.delete(`${this.adminApiUrl}/posts/${id}`).subscribe({
        next: () => {
          this.loadCategoriesFromBackend();
        },
        error: (err) => {
          console.error('[BlogService] Lỗi khi xóa bài viết khỏi database:', err);
        }
      });
    }
  }

  toggleArticleStatus(id: string): BlogArticle | undefined {
    const current = [...this.articlesSubject.value];
    const index = current.findIndex(a => a.id === id);
    if (index >= 0) {
      const art = current[index];
      const newStatus = art.status === 'PUBLISHED' ? 'HIDDEN' : 'PUBLISHED';
      const updatedItem: BlogArticle = {
        ...art,
        status: newStatus,
        publishedAt: newStatus === 'PUBLISHED' && !art.publishedAt ? new Date().toISOString() : art.publishedAt,
        updatedAt: new Date().toISOString()
      };
      current[index] = updatedItem;
      this.articlesSubject.next(current);

      if (!id.startsWith('temp-')) {
        this.http.patch<any>(`${this.adminApiUrl}/posts/${id}/status`, {
          status: newStatus,
          publishedAt: updatedItem.publishedAt
        }).subscribe({
          next: () => {
            this.loadCategoriesFromBackend();
          },
          error: (err) => {
            console.error('[BlogService] Lỗi khi cập nhật trạng thái bài viết:', err);
          }
        });
      }

      return updatedItem;
    }
    return undefined;
  }

  bulkUpdateStatus(ids: string[], status: 'PUBLISHED' | 'HIDDEN' | 'DRAFT'): void {
    const current = this.articlesSubject.value.map(a => {
      if (ids.includes(a.id)) {
        return {
          ...a,
          status,
          updatedAt: new Date().toISOString()
        };
      }
      return a;
    });
    this.articlesSubject.next(current);

    ids.forEach(id => {
      if (!id.startsWith('temp-')) {
        this.http.patch(`${this.adminApiUrl}/posts/${id}/status`, { status }).subscribe({
          error: (e) => console.error(`[BlogService] Lỗi cập nhật status bài ${id}:`, e)
        });
      }
    });
  }

  bulkDelete(ids: string[]): void {
    const current = this.articlesSubject.value.filter(a => !ids.includes(a.id));
    this.articlesSubject.next(current);
    this.updateCategoryCounts(current, this.categoriesSubject.value);

    ids.forEach(id => {
      if (!id.startsWith('temp-')) {
        this.http.delete(`${this.adminApiUrl}/posts/${id}`).subscribe({
          next: () => this.loadCategoriesFromBackend(),
          error: (e) => console.error(`[BlogService] Lỗi xóa bài ${id}:`, e)
        });
      }
    });
  }

  // ==========================================
  // CATEGORY METHODS (KẾT NỐI DATABASE TRỰC TIẾP)
  // ==========================================

  getCategories(): BlogCategory[] {
    return this.categoriesSubject.value;
  }

  saveCategory(cat: Partial<BlogCategory>): BlogCategory {
    const current = [...this.categoriesSubject.value];
    let savedItem: BlogCategory;
    const isEdit = Boolean(cat.id && !cat.id.startsWith('temp-'));

    if (isEdit) {
      const index = current.findIndex(c => c.id === cat.id);
      if (index >= 0) {
        savedItem = {
          ...current[index],
          ...cat
        } as BlogCategory;
        current[index] = savedItem;
      } else {
        savedItem = {
          id: cat.id!,
          name: cat.name || 'Chuyên mục mới',
          slug: cat.slug || this.generateSlug(cat.name || 'chuyen-muc-moi'),
          description: cat.description || '',
          articleCount: cat.articleCount || 0,
          status: cat.status || 'ACTIVE',
          sortOrder: cat.sortOrder || current.length + 1
        };
        current.push(savedItem);
      }
    } else {
      savedItem = {
        id: 'temp-' + Date.now(),
        name: cat.name || 'Chuyên mục mới',
        slug: cat.slug || this.generateSlug(cat.name || 'chuyen-muc-moi'),
        description: cat.description || '',
        articleCount: 0,
        status: cat.status || 'ACTIVE',
        sortOrder: cat.sortOrder || current.length + 1
      };
      current.push(savedItem);
    }

    this.categoriesSubject.next(current);

    const payload = {
      name: savedItem.name,
      slug: savedItem.slug,
      sortOrder: savedItem.sortOrder,
      status: savedItem.status,
      isActive: savedItem.status === 'ACTIVE'
    };

    if (isEdit) {
      this.http.put<any>(`${this.adminApiUrl}/categories/${cat.id}`, payload).subscribe({
        next: () => this.loadCategoriesFromBackend(),
        error: (err) => console.error('[BlogService] Lỗi cập nhật danh mục:', err)
      });
    } else {
      this.http.post<any>(`${this.adminApiUrl}/categories`, payload).subscribe({
        next: () => this.loadCategoriesFromBackend(),
        error: (err) => console.error('[BlogService] Lỗi tạo danh mục:', err)
      });
    }

    return savedItem;
  }

  deleteCategory(id: string): void {
    const current = this.categoriesSubject.value.filter(c => c.id !== id);
    this.categoriesSubject.next(current);

    if (!id.startsWith('temp-')) {
      this.http.delete(`${this.adminApiUrl}/categories/${id}`).subscribe({
        next: () => this.loadCategoriesFromBackend(),
        error: (err) => console.error('[BlogService] Lỗi xóa danh mục:', err)
      });
    }
  }

  toggleCategoryStatus(id: string): void {
    const current = [...this.categoriesSubject.value];
    const cat = current.find(c => c.id === id);
    if (!cat) return;

    const newStatus = cat.status === 'ACTIVE' ? ('HIDDEN' as const) : ('ACTIVE' as const);
    cat.status = newStatus;
    this.categoriesSubject.next(current);

    if (!id.startsWith('temp-')) {
      this.http.put(`${this.adminApiUrl}/categories/${id}`, {
        status: newStatus,
        isActive: newStatus === 'ACTIVE'
      }).subscribe({
        next: () => this.loadCategoriesFromBackend(),
        error: (err) => console.error('[BlogService] Lỗi cập nhật trạng thái danh mục:', err)
      });
    }
  }

  // ==========================================
  // MARKETING BANNERS
  // ==========================================

  getBanners(): MarketingBanner[] {
    return this.bannersSubject.value;
  }

  saveBanner(banner: Partial<MarketingBanner>): MarketingBanner {
    const current = [...this.bannersSubject.value];
    let saved: MarketingBanner;

    if (banner.id) {
      const idx = current.findIndex(b => b.id === banner.id);
      if (idx >= 0) {
        saved = { ...current[idx], ...banner } as MarketingBanner;
        current[idx] = saved;
      } else {
        saved = {
          id: 'ban-' + Date.now(),
          title: banner.title || 'Banner mới',
          position: banner.position || 'HOME_HERO',
          imageUrl: banner.imageUrl || '/assets/room_img/phong_khach.jpg',
          linkUrl: banner.linkUrl || '/explore',
          status: banner.status || 'ACTIVE',
          startDate: banner.startDate,
          endDate: banner.endDate
        };
        current.push(saved);
      }
    } else {
      saved = {
        id: 'ban-' + Date.now(),
        title: banner.title || 'Banner mới',
        position: banner.position || 'HOME_HERO',
        imageUrl: banner.imageUrl || '/assets/room_img/phong_khach.jpg',
        linkUrl: banner.linkUrl || '/explore',
        status: banner.status || 'ACTIVE',
        startDate: banner.startDate,
        endDate: banner.endDate
      };
      current.push(saved);
    }

    this.saveBannersToStorage(current);
    this.bannersSubject.next(current);
    return saved;
  }

  deleteBanner(id: string): void {
    const current = this.bannersSubject.value.filter(b => b.id !== id);
    this.saveBannersToStorage(current);
    this.bannersSubject.next(current);
  }

  toggleBannerStatus(id: string): void {
    const current = this.bannersSubject.value.map(b => {
      if (b.id === id) {
        return {
          ...b,
          status: b.status === 'ACTIVE' ? ('INACTIVE' as const) : ('ACTIVE' as const)
        };
      }
      return b;
    });
    this.saveBannersToStorage(current);
    this.bannersSubject.next(current);
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

  private saveBannersToStorage(items: MarketingBanner[]): void {
    try {
      localStorage.setItem(STORAGE_BANNERS_KEY, JSON.stringify(items));
    } catch (_) {}
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

  private getDefaultBanners(): MarketingBanner[] {
    return [
      {
        id: 'ban-1',
        title: 'Bộ sưu tập Thu - Đông 2026: Kiệt tác da bò Ý',
        position: 'HOME_HERO',
        imageUrl: '/assets/room_img/phong_khach.jpg',
        linkUrl: '/explore?category=sofa',
        status: 'ACTIVE',
        startDate: '2026-10-01',
        endDate: '2026-12-31'
      },
      {
        id: 'ban-2',
        title: 'Tư vấn thiết kế không gian 3D miễn phí cùng Kiến Trúc Sư DCor',
        position: 'BLOG_SIDEBAR',
        imageUrl: '/assets/room_img/phong_lam_viec.jpg',
        linkUrl: '/account/appointments',
        status: 'ACTIVE',
        startDate: '2026-10-15',
        endDate: '2026-11-30'
      },
      {
        id: 'ban-3',
        title: 'Ưu đãi đặt cọc may đo sofa: Tặng gói bảo dưỡng chuyên sâu 2 năm',
        position: 'COLLECTION_BANNER',
        imageUrl: '/assets/room_img/phong_ngu.jpg',
        linkUrl: '/custom-design',
        status: 'ACTIVE'
      }
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
        imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80',
        sku: 'SF-MILANO-03',
        categoryName: 'Sofa Thư Giãn'
      },
      {
        id: '5a578ef6-612c-437d-87ea-92409203dcd1',
        name: 'Ghế Bành Thư Giãn Imola Da Bò Thủ Công',
        price: 15000000,
        originalPrice: 17500000,
        imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80',
        sku: 'CH-IMOLA-04',
        categoryName: 'Ghế Thư Giãn'
      }
    ];
  }
}
