// In-memory cache module cho các dữ liệu catalog/danh mục
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class MemoryCache {
  private store = new Map<string, CacheEntry<any>>();

  get<T>(key: string, ttlMs: number): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > ttlMs) {
      this.store.delete(key);
      return null;
    }
    return entry.data as T;
  }

  set<T>(key: string, data: T): void {
    this.store.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  invalidate(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}

export const memoryCache = new MemoryCache();

export const CACHE_KEYS = {
  PRODUCTS_CATALOG: 'products_catalog',
  CATEGORIES_LIST: 'categories_list',
  STAFF_LIST: 'staff_list',
  DESIGN_TEMPLATES: 'design_templates',
  DESIGN_POSTS: 'design_posts'
};
