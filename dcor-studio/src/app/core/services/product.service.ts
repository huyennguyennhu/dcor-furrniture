import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private productsCache: any[] | null = null;
  private productsCacheTime = 0;
  private readonly PRODUCTS_CACHE_TTL = 15000; // 15s TTL để đồng bộ tồn kho kịp thời
  private productsPromise: Promise<any[]> | null = null;
  private newestProductIds = new Set<string>();

  private categoriesCache: any[] | null = null;
  private categoriesCacheTime = 0;
  private readonly CATEGORIES_CACHE_TTL = 30000; // 30s TTL
  private categoriesPromise: Promise<any[]> | null = null;

  private productDetailCache = new Map<string, { data: any; timestamp: number }>();
  private readonly DETAIL_CACHE_TTL = 15000; // 15s TTL
  private productDetailPromises = new Map<string, Promise<any>>();

  /**
   * Đánh dấu tự động 5 sản phẩm được tạo gần nhất (isNew = true)
   */
  private applyNewestFlags(products: any[]): any[] {
    if (!Array.isArray(products) || products.length === 0) return products;
    const sorted = [...products]
      .map((p, idx) => ({ p, idx, ts: p.createdAt ? new Date(p.createdAt).getTime() : 0 }))
      .sort((a, b) => (b.ts - a.ts) || (a.idx - b.idx));
    const topFiveIds = new Set<string>(
      sorted.slice(0, 5).map(item => String(item.p.id || item.p.productId || '')).filter(Boolean)
    );
    this.newestProductIds = topFiveIds;
    return products.map(p => ({
      ...p,
      isNew: topFiveIds.has(String(p.id || p.productId || ''))
    }));
  }

  /**
   * Lấy danh sách toàn bộ sản phẩm với bộ nhớ đệm (client-side in-memory cache)
   * và khử trùng lặp yêu cầu gọi đồng thời (request deduplication)
   */
  async getProducts(forceRefresh = false): Promise<any[]> {
    const isFresh = this.productsCache && (Date.now() - this.productsCacheTime < this.PRODUCTS_CACHE_TTL);
    if (!forceRefresh && isFresh) {
      return this.productsCache!;
    }

    if (!forceRefresh && this.productsPromise) {
      return this.productsPromise;
    }

    this.productsPromise = (async () => {
      try {
        const res = await fetch(`${environment.apiUrl}/products`);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: Không thể tải danh sách sản phẩm`);
        }
        const data = await res.json();
        const rawProducts = Array.isArray(data) ? data : (data.data || data.products || []);
        const products = this.applyNewestFlags(rawProducts);
        this.productsCache = products;
        this.productsCacheTime = Date.now();
        return products;
      } catch (err) {
        throw err;
      } finally {
        this.productsPromise = null;
      }
    })();

    return this.productsPromise;
  }

  /**
   * Lấy danh mục sản phẩm có cache
   */
  async getCategories(forceRefresh = false): Promise<any[]> {
    const isFresh = this.categoriesCache && (Date.now() - this.categoriesCacheTime < this.CATEGORIES_CACHE_TTL);
    if (!forceRefresh && isFresh) {
      return this.categoriesCache!;
    }

    if (!forceRefresh && this.categoriesPromise) {
      return this.categoriesPromise;
    }

    this.categoriesPromise = (async () => {
      try {
        const res = await fetch(`${environment.apiUrl}/categories`);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: Không thể tải danh mục`);
        }
        const data = await res.json();
        const categories = Array.isArray(data) ? data : (data.data || []);
        this.categoriesCache = categories;
        this.categoriesCacheTime = Date.now();
        return categories;
      } catch (err) {
        throw err;
      } finally {
        this.categoriesPromise = null;
      }
    })();

    return this.categoriesPromise;
  }

  /**
   * Lấy chi tiết sản phẩm theo ID hoặc Slug có cache (TTL 15s)
   */
  async getProductById(id: string, forceRefresh = false): Promise<any> {
    const cachedEntry = this.productDetailCache.get(id);
    if (!forceRefresh && cachedEntry && (Date.now() - cachedEntry.timestamp < this.DETAIL_CACHE_TTL)) {
      return cachedEntry.data;
    }

    if (!forceRefresh && this.productDetailPromises.has(id)) {
      return this.productDetailPromises.get(id)!;
    }

    const promise = (async () => {
      try {
        const res = await fetch(`${environment.apiUrl}/products/${id}`);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: Không thể tải thông tin sản phẩm`);
        }
        const data = await res.json();
        if (this.newestProductIds.size > 0 && data) {
          data.isNew = this.newestProductIds.has(String(data.id || ''));
        }
        const entry = { data, timestamp: Date.now() };
        this.productDetailCache.set(id, entry);
        if (data.id) this.productDetailCache.set(data.id, entry);
        if (data.slug) this.productDetailCache.set(data.slug, entry);
        return data;
      } catch (err) {
        throw err;
      } finally {
        this.productDetailPromises.delete(id);
      }
    })();

    this.productDetailPromises.set(id, promise);
    return promise;
  }

  /**
   * Xóa cache khi cần làm mới dữ liệu
   */
  clearCache(): void {
    this.productsCache = null;
    this.productsCacheTime = 0;
    this.productsPromise = null;
    this.newestProductIds.clear();
    this.categoriesCache = null;
    this.categoriesCacheTime = 0;
    this.categoriesPromise = null;
    this.productDetailCache.clear();
    this.productDetailPromises.clear();
  }
}

// Backward compatibility alias
export { ProductService as Product };
