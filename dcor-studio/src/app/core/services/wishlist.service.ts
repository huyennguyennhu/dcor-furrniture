import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map } from 'rxjs';

export interface WishlistItem {
  id?: string;
  productId: string;
  name: string;
  price: number;
  originalPrice?: number;
  image?: string;
  categoryName?: string;
  variantId?: string;
  inStock?: boolean;
}

const LEGACY_STORAGE_KEY = 'dcor_wishlist';
const GUEST_STORAGE_KEY = 'dcor_wishlist_guest';

@Injectable({
  providedIn: 'root'
})
export class WishlistService {
  private wishlistSubject = new BehaviorSubject<any[]>(this.getInitialWishlist());
  public wishlist$: Observable<any[]> = this.wishlistSubject.asObservable();
  public count$: Observable<number> = this.wishlist$.pipe(map(list => list.length));

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', () => {
        this.reloadWishlist();
      });
      window.addEventListener('dcor-auth-logout', () => {
        this.resetWishlistOnLogout();
      });
      window.addEventListener('dcor-auth-login', () => {
        this.reloadWishlist();
      });
      window.addEventListener('dcor-user-updated', () => {
        this.reloadWishlist();
      });
    }
  }

  private getUserId(): string | null {
    try {
      const userStr = localStorage.getItem('dcor_customer') || 
                      localStorage.getItem('dcor_customer_user') || 
                      localStorage.getItem('dcor_user');
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user && user.id && !String(user.id).startsWith('guest-')) {
          return String(user.id);
        }
      }
    } catch {}
    return null;
  }

  private getStorageKey(): string {
    const userId = this.getUserId();
    if (userId) {
      return `dcor_wishlist_${userId}`;
    }
    return GUEST_STORAGE_KEY;
  }

  public reloadWishlist(): void {
    this.wishlistSubject.next(this.getInitialWishlist());
  }

  public resetWishlistOnLogout(): void {
    try {
      sessionStorage.removeItem(GUEST_STORAGE_KEY);
      localStorage.removeItem(GUEST_STORAGE_KEY);
      localStorage.removeItem(LEGACY_STORAGE_KEY);
    } catch {}
    this.wishlistSubject.next([]);
  }

  private getInitialWishlist(): any[] {
    try {
      const userId = this.getUserId();
      const currentKey = this.getStorageKey();

      if (userId) {
        // Đã đăng nhập: Lưu vĩnh viễn theo tài khoản trong localStorage
        const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
        if (legacy && !localStorage.getItem(currentKey)) {
          localStorage.setItem(currentKey, legacy);
          localStorage.removeItem(LEGACY_STORAGE_KEY);
        }
        const data = localStorage.getItem(currentKey);
        return data ? JSON.parse(data) : [];
      } else {
        // Khách vãng lai: Lưu vào sessionStorage (out khỏi web vô lại là mất)
        try {
          localStorage.removeItem(GUEST_STORAGE_KEY);
          localStorage.removeItem(LEGACY_STORAGE_KEY);
        } catch {}
        const data = sessionStorage.getItem(currentKey);
        return data ? JSON.parse(data) : [];
      }
    } catch {
      return [];
    }
  }

  private saveToStorage(list: any[]): void {
    try {
      const userId = this.getUserId();
      const key = this.getStorageKey();
      if (userId) {
        localStorage.setItem(key, JSON.stringify(list));
      } else {
        // Khách vãng lai: chỉ lưu sessionStorage
        sessionStorage.setItem(key, JSON.stringify(list));
        localStorage.removeItem(key);
      }
    } catch (err) {
      console.error('Lỗi lưu danh sách yêu thích:', err);
    }
  }

  private getId(item: any): string {
    return typeof item === 'string' ? item : item?.productId || item?.id || '';
  }

  public get currentWishlist(): any[] {
    return this.wishlistSubject.value;
  }

  public isWishlisted(productId: string): boolean {
    if (!productId) return false;
    return this.currentWishlist.some(item => this.getId(item) === productId);
  }

  public isInWishlist(productId: string): boolean {
    return this.isWishlisted(productId);
  }

  public toggle(productId: string): boolean {
    if (!productId) return false;
    let list = [...this.currentWishlist];
    let added = false;

    if (this.isWishlisted(productId)) {
      list = list.filter(item => this.getId(item) !== productId);
      added = false;
    } else {
      list.push(productId);
      added = true;
    }

    this.saveToStorage(list);
    this.wishlistSubject.next(list);
    return added;
  }

  public add(item: any): void {
    const pid = this.getId(item);
    if (!pid || this.isWishlisted(pid)) return;
    const list = [...this.currentWishlist, item];
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
