import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map } from 'rxjs';

const STORAGE_KEY = 'dcor_wishlist';

@Injectable({
  providedIn: 'root'
})
export class WishlistService {
  private wishlistSubject = new BehaviorSubject<string[]>(this.getInitialWishlist());
  public wishlist$: Observable<string[]> = this.wishlistSubject.asObservable();
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

  public get currentWishlist(): string[] {
    return this.wishlistSubject.value;
  }

  public isWishlisted(productId: string): boolean {
    if (!productId) return false;
    return this.currentWishlist.includes(productId);
  }

  public toggle(productId: string): boolean {
    if (!productId) return false;
    let list = [...this.currentWishlist];
    let added = false;

    if (list.includes(productId)) {
      list = list.filter(id => id !== productId);
      added = false;
    } else {
      list.push(productId);
      added = true;
    }

    this.saveToStorage(list);
    this.wishlistSubject.next(list);
    return added;
  }

  public add(productId: string): void {
    if (!productId || this.isWishlisted(productId)) return;
    const list = [...this.currentWishlist, productId];
    this.saveToStorage(list);
    this.wishlistSubject.next(list);
  }

  public remove(productId: string): void {
    if (!productId) return;
    const list = this.currentWishlist.filter(id => id !== productId);
    this.saveToStorage(list);
    this.wishlistSubject.next(list);
  }

  public clear(): void {
    this.saveToStorage([]);
    this.wishlistSubject.next([]);
  }
}
