import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map } from 'rxjs';

export interface WishlistItem {
  id?: string;
  productId?: string;
  name?: string;
  price?: number;
  originalPrice?: number;
  image?: string;
  images?: string[];
  cardImages?: string[];
  categoryName?: string;
  category?: any;
  variantId?: string;
  inStock?: boolean;
  [key: string]: any;
}

const STORAGE_KEY = 'dcor_wishlist';

@Injectable({
  providedIn: 'root'
})
export class WishlistService {
  private wishlistSubject = new BehaviorSubject<any[]>(this.getInitialWishlist());
  public wishlist$: Observable<any[]> = this.wishlistSubject.asObservable();
  public count$: Observable<number> = this.wishlist$.pipe(map(list => list.length));

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (event: StorageEvent) => {
        if (event.key === STORAGE_KEY) {
          this.wishlistSubject.next(this.getInitialWishlist());
        }
      });
    }
  }

  private getInitialWishlist(): any[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private saveToStorage(list: any[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (err) {
      console.error('Lỗi lưu danh sách yêu thích:', err);
    }
  }

  public getId(item: any): string {
    if (!item) return '';
    return typeof item === 'string' ? item : (item.id || item.productId || '');
  }

  public get currentWishlist(): any[] {
    return this.wishlistSubject.value || [];
  }

  public isWishlisted(productId: string): boolean {
    if (!productId) return false;
    return this.currentWishlist.some(item => this.getId(item) === productId);
  }

  public isInWishlist(productId: string): boolean {
    return this.isWishlisted(productId);
  }

  public toggle(productOrId: any): boolean {
    if (!productOrId) return false;
    const pid = this.getId(productOrId);
    if (!pid) return false;

    let list = [...this.currentWishlist];
    let added = false;

    if (this.isWishlisted(pid)) {
      list = list.filter(item => this.getId(item) !== pid);
      added = false;
    } else {
      // Lưu trọn vẹn thông tin sản phẩm (nếu là object) để các trang như Wishlist có đủ dữ liệu render ngay
      const itemToSave = typeof productOrId === 'object' ? { ...productOrId, id: pid, productId: pid } : pid;
      list.push(itemToSave);
      added = true;
    }

    this.saveToStorage(list);
    this.wishlistSubject.next(list);
    return added;
  }

  public add(item: any): void {
    const pid = this.getId(item);
    if (!pid || this.isWishlisted(pid)) return;
    const itemToSave = typeof item === 'object' ? { ...item, id: pid, productId: pid } : pid;
    const list = [...this.currentWishlist, itemToSave];
    this.saveToStorage(list);
    this.wishlistSubject.next(list);
  }

  public addToWishlist(item: any): void {
    this.add(item);
  }

  public remove(productId: string): void {
    if (!productId) return;
    const list = this.currentWishlist.filter(item => this.getId(item) !== productId);
    this.saveToStorage(list);
    this.wishlistSubject.next(list);
  }

  public removeFromWishlist(productId: string): void {
    this.remove(productId);
  }

  public clear(): void {
    this.saveToStorage([]);
    this.wishlistSubject.next([]);
  }
}
