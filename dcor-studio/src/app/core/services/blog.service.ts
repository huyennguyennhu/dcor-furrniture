import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
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

const STORAGE_ARTICLES_KEY = 'dcor_blog_articles';
const STORAGE_CATEGORIES_KEY = 'dcor_blog_categories';
const STORAGE_BANNERS_KEY = 'dcor_marketing_banners';

@Injectable({
  providedIn: 'root'
})
export class BlogService {
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
    // 0. Seed products immediately so availableProducts is never empty
    const initialProducts = this.getDefaultProducts();
    this.productsSubject.next(initialProducts);

    // 1. Categories
    let categories: BlogCategory[] = [];
    try {
      const storedCats = localStorage.getItem(STORAGE_CATEGORIES_KEY);
      if (storedCats) {
        categories = JSON.parse(storedCats);
      }
    } catch (_) {}

    if (!categories || categories.length === 0) {
      categories = this.getDefaultCategories();
      this.saveCategoriesToStorage(categories);
    }
    this.categoriesSubject.next(categories);

    // 2. Articles
    let articles: BlogArticle[] = [];
    try {
      const storedArts = localStorage.getItem(STORAGE_ARTICLES_KEY);
      if (storedArts) {
        const parsed = JSON.parse(storedArts);
        if (Array.isArray(parsed)) {
          // Remove seed mock articles (art-1, art-2, art-3, art-4)
          articles = parsed.filter((a: BlogArticle) => !['art-1', 'art-2', 'art-3', 'art-4'].includes(a.id));
        }
      }
    } catch (_) {}

    this.saveArticlesToStorage(articles);
    this.updateCategoryCounts(articles, categories);
    this.articlesSubject.next(articles);

    // 3. Banners
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

    // 4. Fetch real products from backend and sync article IDs
    this.loadRealProducts();
  }

  private async loadRealProducts(): Promise<void> {
    try {
      const prods = await this.fetchAvailableProducts();
      if (prods && prods.length > 0) {
        this.productsSubject.next(prods);

        // Check and sync articles to ensure they point to real products
        const currentArticles = [...this.articlesSubject.value];
        const realIds = prods.slice(0, 4).map(p => p.id);
        let updatedAny = false;

        const updatedArticles = currentArticles.map(art => {
          const hasValid = art.relatedProductIds?.some(id => prods.some(p => p.id === id));
          if (!hasValid && realIds.length > 0) {
            updatedAny = true;
            return {
              ...art,
              relatedProductIds: [...realIds.slice(0, 3)]
            };
          }
          return art;
        });

        if (updatedAny) {
          this.saveArticlesToStorage(updatedArticles);
          this.articlesSubject.next(updatedArticles);
        }
      }
    } catch (e) {
      console.warn('loadRealProducts warning:', e);
    }
  }

  // ==========================================
  // ARTICLE METHODS (FR8-A-01, FR8-A-02)
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

    let savedItem: BlogArticle;
    if (article.id) {
      // Edit
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
      // Create new
      savedItem = this.createArticleObject(article, now);
      current.unshift(savedItem);
    }

    this.saveArticlesToStorage(current);
    this.articlesSubject.next(current);
    this.updateCategoryCounts(current, this.categoriesSubject.value);

    return savedItem;
  }

  private createArticleObject(article: Partial<BlogArticle>, now: string): BlogArticle {
    const id = 'art-' + Date.now();
    const slug = article.slug || this.generateSlug(article.title || 'bai-viet-moi');
    return {
      id,
      title: article.title || 'Tiêu đề bài viết',
      slug,
      coverImage: article.coverImage || 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=80',
      categoryId: article.categoryId || 'cat-1',
      categoryName: article.categoryName || 'Xu hướng thiết kế',
      author: article.author || 'KTS. DCor Studio',
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
    this.saveArticlesToStorage(current);
    this.articlesSubject.next(current);
    this.updateCategoryCounts(current, this.categoriesSubject.value);
  }

  toggleArticleStatus(id: string): BlogArticle | undefined {
    const current = [...this.articlesSubject.value];
    const index = current.findIndex(a => a.id === id);
    if (index >= 0) {
      const art = current[index];
      const newStatus = art.status === 'PUBLISHED' ? 'HIDDEN' : 'PUBLISHED';
      current[index] = {
        ...art,
        status: newStatus,
        publishedAt: newStatus === 'PUBLISHED' && !art.publishedAt ? new Date().toISOString() : art.publishedAt,
        updatedAt: new Date().toISOString()
      };
      this.saveArticlesToStorage(current);
      this.articlesSubject.next(current);
      return current[index];
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
    this.saveArticlesToStorage(current);
    this.articlesSubject.next(current);
  }

  bulkDelete(ids: string[]): void {
    const current = this.articlesSubject.value.filter(a => !ids.includes(a.id));
    this.saveArticlesToStorage(current);
    this.articlesSubject.next(current);
    this.updateCategoryCounts(current, this.categoriesSubject.value);
  }

  // ==========================================
  // CATEGORY METHODS
  // ==========================================

  getCategories(): BlogCategory[] {
    return this.categoriesSubject.value;
  }

  saveCategory(cat: Partial<BlogCategory>): BlogCategory {
    const current = [...this.categoriesSubject.value];
    let savedItem: BlogCategory;

    if (cat.id) {
      const index = current.findIndex(c => c.id === cat.id);
      if (index >= 0) {
        savedItem = {
          ...current[index],
          ...cat
        } as BlogCategory;
        current[index] = savedItem;
      } else {
        savedItem = {
          id: 'cat-' + Date.now(),
          name: cat.name || 'Chuyên mục mới',
          slug: cat.slug || this.generateSlug(cat.name || 'chuyen-muc-moi'),
          description: cat.description || '',
          articleCount: 0,
          status: cat.status || 'ACTIVE',
          sortOrder: cat.sortOrder || current.length + 1
        };
        current.push(savedItem);
      }
    } else {
      savedItem = {
        id: 'cat-' + Date.now(),
        name: cat.name || 'Chuyên mục mới',
        slug: cat.slug || this.generateSlug(cat.name || 'chuyen-muc-moi'),
        description: cat.description || '',
        articleCount: 0,
        status: cat.status || 'ACTIVE',
        sortOrder: cat.sortOrder || current.length + 1
      };
      current.push(savedItem);
    }

    this.saveCategoriesToStorage(current);
    this.categoriesSubject.next(current);
    return savedItem;
  }

  deleteCategory(id: string): void {
    const current = this.categoriesSubject.value.filter(c => c.id !== id);
    this.saveCategoriesToStorage(current);
    this.categoriesSubject.next(current);
  }

  toggleCategoryStatus(id: string): void {
    const current = this.categoriesSubject.value.map(c => {
      if (c.id === id) {
        return {
          ...c,
          status: c.status === 'ACTIVE' ? ('HIDDEN' as const) : ('ACTIVE' as const)
        };
      }
      return c;
    });
    this.saveCategoriesToStorage(current);
    this.categoriesSubject.next(current);
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
          imageUrl: banner.imageUrl || 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1200&q=80',
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
        imageUrl: banner.imageUrl || 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1200&q=80',
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
  // REAL PRODUCT FETCHING & SEARCH
  // ==========================================

  async fetchAvailableProducts(): Promise<SimpleProduct[]> {
    try {
      // 1. First try admin inventory products-options which returns full variants with SKUs
      const res = await fetch(`${environment.apiUrl}/admin/inventory/products-options`);
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
              imageUrl: (p.images && p.images.length > 0) ? p.images[0] : (p.imageUrl || 'assets/placeholder.png'),
              sku: (firstVariant && firstVariant.sku) ? firstVariant.sku : (p.sku || `SKU-${p.id?.slice(0, 8).toUpperCase()}`),
              categoryName: p.categoryName || p.category?.name || 'Nội thất DCor'
            };
          });
        }
      }
    } catch (_) {}

    try {
      // 2. Try generic products endpoint
      const res = await fetch(`${environment.apiUrl}/products`);
      if (res.ok) {
        const data = await res.json();
        const raw = Array.isArray(data) ? data : (data.data || data.items || []);
        if (raw && raw.length > 0) {
          return raw.map((p: any) => ({
            id: p.id,
            name: p.name,
            price: Number(p.basePrice || p.price || 0),
            originalPrice: Number(p.originalPrice || 0),
            imageUrl: p.images && p.images.length > 0 ? p.images[0] : (p.imageUrl || 'assets/placeholder.png'),
            sku: p.sku || (p.variants && p.variants[0]?.sku) || `SKU-${p.id?.slice(0, 6)}`,
            categoryName: p.category?.name || 'Nội thất DCor'
          }));
        }
      }
    } catch (_) {}

    // Fallback sample products if backend offline
    return this.getDefaultProducts();
  }

  // ==========================================
  // HELPERS & STORAGE
  // ==========================================

  generateSlug(text: string): string {
    return text
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

  private saveArticlesToStorage(items: BlogArticle[]): void {
    try {
      localStorage.setItem(STORAGE_ARTICLES_KEY, JSON.stringify(items));
    } catch (_) {}
  }

  private saveCategoriesToStorage(items: BlogCategory[]): void {
    try {
      localStorage.setItem(STORAGE_CATEGORIES_KEY, JSON.stringify(items));
    } catch (_) {}
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
    this.saveCategoriesToStorage(updated);
    this.categoriesSubject.next(updated);
  }

  // ==========================================
  // INITIAL SEED DATA
  // ==========================================

  private getDefaultCategories(): BlogCategory[] {
    return [
      { id: 'cat-1', name: 'Xu hướng thiết kế', slug: 'xu-huong-thiet-ke', description: 'Các phong cách thiết kế nội thất hiện đại, xu hướng luxury quốc tế.', articleCount: 0, status: 'ACTIVE', sortOrder: 1 },
      { id: 'cat-2', name: 'Kiến thức nội thất', slug: 'kien-thuc-noi-that', description: 'Cẩm nang chọn lựa chất liệu, kết cấu gỗ, da bò, nỉ cao cấp.', articleCount: 0, status: 'ACTIVE', sortOrder: 2 },
      { id: 'cat-3', name: 'Cẩm nang bài trí & Phong thủy', slug: 'cam-nang-bai-tri', description: 'Nghệ thuật sắp đặt không gian sống, phong thủy tài lộc phòng khách.', articleCount: 0, status: 'ACTIVE', sortOrder: 3 },
      { id: 'cat-4', name: 'Chất liệu & Bảo dưỡng', slug: 'chat-lieu-bao-duong', description: 'Quy trình chăm sóc, vệ sinh da thật và bề mặt gỗ sơn phủ.', articleCount: 0, status: 'ACTIVE', sortOrder: 4 },
      { id: 'cat-5', name: 'Tin tức & Sự kiện DCor', slug: 'tin-tuc-su-kien', description: 'Cập nhật bộ sưu tập mới, triển lãm nội thất và ưu đãi độc quyền.', articleCount: 0, status: 'ACTIVE', sortOrder: 5 }
    ];
  }

  clearAllArticles(): void {
    this.saveArticlesToStorage([]);
    this.articlesSubject.next([]);
    this.updateCategoryCounts([], this.categoriesSubject.value);
  }

  private getDefaultArticles(): BlogArticle[] {
    return [];
  }

  private getDefaultBanners(): MarketingBanner[] {
    return [
      {
        id: 'ban-1',
        title: 'Bộ sưu tập Thu - Đông 2026: Kiệt tác da bò Ý',
        position: 'HOME_HERO',
        imageUrl: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1400&q=80',
        linkUrl: '/explore?category=sofa',
        status: 'ACTIVE',
        startDate: '2026-10-01',
        endDate: '2026-12-31'
      },
      {
        id: 'ban-2',
        title: 'Tư vấn thiết kế không gian 3D miễn phí cùng Kiến Trúc Sư DCor',
        position: 'BLOG_SIDEBAR',
        imageUrl: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=800&q=80',
        linkUrl: '/account/appointments',
        status: 'ACTIVE',
        startDate: '2026-10-15',
        endDate: '2026-11-30'
      },
      {
        id: 'ban-3',
        title: 'Ưu đãi đặt cọc may đo sofa: Tặng gói bảo dưỡng chuyên sâu 2 năm',
        position: 'COLLECTION_BANNER',
        imageUrl: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=80',
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
      },
      {
        id: 'prod-sofa-1',
        name: 'Sofa Da Bò Ý Carmo 3 Chỗ Phong Cách Bắc Âu',
        price: 45000000,
        originalPrice: 52000000,
        imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80',
        sku: 'SF-CARMO-01',
        categoryName: 'Sofa Phòng Khách'
      },
      {
        id: 'prod-table-1',
        name: 'Bàn Trà Mặt Đá Cẩm Thạch Calacatta Chân Kim Loại',
        price: 18500000,
        originalPrice: 22000000,
        imageUrl: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=600&q=80',
        sku: 'BT-CALA-02',
        categoryName: 'Bàn Trà & Bàn Góc'
      },
      {
        id: 'prod-chair-1',
        name: 'Ghế Thư Giãn Imola Bọc Da Bò Thủ Công',
        price: 28000000,
        originalPrice: 31000000,
        imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=600&q=80',
        sku: 'CH-IMOLA-03',
        categoryName: 'Ghế Thư Giãn'
      },
      {
        id: 'prod-bed-1',
        name: 'Giường Ngủ Bọc Nỉ Sang Trọng Lugano Master 1m8',
        price: 36000000,
        originalPrice: 40000000,
        imageUrl: 'https://images.unsplash.com/photo-1540518614846-7ede433c4ef7?auto=format&fit=crop&w=600&q=80',
        sku: 'BD-LUGANO-04',
        categoryName: 'Giường Ngủ'
      }
    ];
  }
}
