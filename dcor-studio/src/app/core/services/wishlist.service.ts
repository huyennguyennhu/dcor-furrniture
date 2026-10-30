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

  private getInitialWishlist(): string[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private saveToStorage(list: string[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
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
