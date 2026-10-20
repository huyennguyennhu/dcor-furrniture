import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, throwError, tap, of } from 'rxjs';
import { environment } from '../../../environments/environment';

const GUEST_CART_KEY = 'dcor_guest_cart';

export interface CartItem {
  id: string;
  productId: string;
  variantId: string;
  sku?: string;
  name: string;
  variantName?: string;
  image: string;
  price: number;
  originalPrice?: number;
  discountValue?: number;
  discountType?: 'PERCENT' | 'AMOUNT';
  quantity: number;
  stock?: number;
  reservedStock?: number;
  availableStock?: number;
  isActive?: boolean;
  isVariantActive?: boolean;
  isProductActive?: boolean;
  unavailableReason?: string;
  variantTags?: { label: string; value: string }[];
  selectedOptions?: any;
  leg?: any;
  upholstery?: any;
}

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private apiUrl = `${environment.apiUrl}/store/cart`;
  private cartSubject = new BehaviorSubject<CartItem[]>([]);
  public cart$ = this.cartSubject.asObservable();
  public isLoadingSubject = new BehaviorSubject<boolean>(false);
  public isLoading$ = this.isLoadingSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadCart();
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('dcor_customer_token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  get currentCart(): CartItem[] {
    return this.cartSubject.value;
  }

  /** Kiểm tra khách đã đăng nhập chưa */
  get isLoggedIn(): boolean {
    return !!localStorage.getItem('dcor_customer_token');
  }

  /** Lấy giỏ hàng guest từ localStorage */
  private loadGuestCart(): CartItem[] {
    try {
      const raw = localStorage.getItem(GUEST_CART_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  /** Lưu giỏ hàng guest vào localStorage */
  private saveGuestCart(items: CartItem[]): void {
    try {
      localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
    } catch {
      console.error('Không thể lưu giỏ hàng guest');
    }
  }

  /**
   * Load full cart from server (used on init and after variant changes)
   * Nếu chưa đăng nhập: tải từ localStorage
   */
  loadCart(): Observable<CartItem[]> {
    const token = localStorage.getItem('dcor_customer_token');
    if (!token) {
      // Guest: load từ localStorage
      const guestItems = this.loadGuestCart();
      this.cartSubject.next(guestItems);
      this.isLoadingSubject.next(false);
      return of(guestItems);
    }

    this.isLoadingSubject.next(true);
    return this.http.get<CartItem[]>(this.apiUrl, { headers: this.getHeaders() })
      .pipe(
        tap((items) => {
          this.cartSubject.next(items);
          this.isLoadingSubject.next(false);
        }),
        catchError((err) => {
          console.error('Lỗi tải giỏ hàng:', err);
          this.isLoadingSubject.next(false);
          return throwError(() => err);
        })
      );
  }

  /**
   * Add to cart.
   * - Đăng nhập: gửi lên server, server là nguồn chính xác
   * - Khách vãng lai: lưu vào localStorage với thông tin sản phẩm đã biết
   */
  addToCart(variantId: string, quantity: number, selectedOptions?: any, guestProductInfo?: Partial<CartItem>): Observable<any> {
    if (!this.isLoggedIn) {
      // Guest: thêm vào localStorage
      const guestItems = this.loadGuestCart();
      const existingIdx = guestItems.findIndex(i => i.variantId === variantId);
      let targetItem: CartItem;
      if (existingIdx >= 0) {
        guestItems[existingIdx].quantity += quantity;
        targetItem = guestItems[existingIdx];
      } else {
        const newItem: CartItem = {
          id: `guest-${variantId}-${Date.now()}`,
          productId: guestProductInfo?.productId || '',
          variantId,
          name: guestProductInfo?.name || 'Sản phẩm',
          variantName: guestProductInfo?.variantName,
          image: guestProductInfo?.image || '',
          price: guestProductInfo?.price || 0,
          originalPrice: guestProductInfo?.originalPrice,
          quantity,
          availableStock: guestProductInfo?.availableStock,
          isActive: true,
          variantTags: guestProductInfo?.variantTags,
          selectedOptions
        };
        guestItems.push(newItem);
        targetItem = newItem;
      }
      this.saveGuestCart(guestItems);
      this.cartSubject.next(guestItems);
      return of({ message: 'Đã thêm vào giỏ hàng', cartItem: targetItem });
    }
    return this.http.post<any>(this.apiUrl, { variantId, quantity, selectedOptions }, { headers: this.getHeaders() })
      .pipe(tap(() => this.loadCart().subscribe()));
  }

  /**
   * Merge giỏ hàng guest lên server sau khi đăng nhập
   * Gọi hàm này ngay sau khi khách hàng đăng nhập thành công
   */
  mergeGuestCartToServer(): void {
    const guestItems = this.loadGuestCart();
    if (guestItems.length === 0) return;

    const mergePromises = guestItems.map(item =>
      this.http.post<any>(this.apiUrl,
        { variantId: item.variantId, quantity: item.quantity, selectedOptions: item.selectedOptions },
        { headers: this.getHeaders() }
      ).toPromise().catch(() => null)
    );

    Promise.allSettled(mergePromises).then(() => {
      localStorage.removeItem(GUEST_CART_KEY);
      this.loadCart().subscribe();
    });
  }

  /**
   * Update quantity with OPTIMISTIC UPDATE:
   * - Guest: cập nhật localStorage ngay
   * - Đăng nhập: cập nhật local rồi gửi server
   */
  updateQuantity(id: string, quantity: number): Observable<any> {
    const previous = this.cartSubject.value;

    // Optimistic: update local cart immediately
    const optimistic = previous.map(item =>
      item.id === id ? { ...item, quantity } : item
    );
    this.cartSubject.next(optimistic);

    if (!this.isLoggedIn) {
      // Guest: chỉ cập nhật localStorage
      this.saveGuestCart(optimistic);
      return of({ message: 'Cập nhật số lượng thành công' });
    }

    return this.http.put<any>(`${this.apiUrl}/${id}`, { quantity }, { headers: this.getHeaders() })
      .pipe(
        catchError((err) => {
          // Rollback on failure
          this.cartSubject.next(previous);
          return throwError(() => err);
        })
      );
  }

  /**
   * Update variant — must reload cart because image/price/tags can change
   */
  updateVariant(id: string, variantId: string, quantity?: number, selectedOptions?: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, { variantId, quantity, selectedOptions }, { headers: this.getHeaders() })
      .pipe(tap(() => this.loadCart().subscribe()));
  }

  /**
   * Remove from cart with OPTIMISTIC UPDATE:
   * - Guest: xóa khỏi localStorage ngay
   * - Đăng nhập: xóa local rồi gửi DELETE
   */
  removeFromCart(id: string): Observable<any> {
    const previous = this.cartSubject.value;

    // Optimistic: remove from local state immediately
    const optimistic = previous.filter(item => item.id !== id);
    this.cartSubject.next(optimistic);

    if (!this.isLoggedIn) {
      // Guest: chỉ cập nhật localStorage
      this.saveGuestCart(optimistic);
      return of({ message: 'Đã xóa khỏi giỏ hàng' });
    }

    return this.http.delete<any>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() })
      .pipe(
        catchError((err) => {
          // Rollback on failure
          this.cartSubject.next(previous);
          return throwError(() => err);
        })
      );
  }

  /**
   * Remove multiple with OPTIMISTIC UPDATE
   * - Guest: xóa khỏi localStorage
   * - Đăng nhập: gửi batch-delete lên server
   */
  removeMultiple(ids: string[]): Observable<any> {
    const previous = this.cartSubject.value;
    const idSet = new Set(ids);

    // Optimistic: remove all targeted items immediately
    const optimistic = previous.filter(item => !idSet.has(item.id));
    this.cartSubject.next(optimistic);

    if (!this.isLoggedIn) {
      // Guest: chỉ cập nhật localStorage
      this.saveGuestCart(optimistic);
      return of({ message: 'Đã xóa các sản phẩm được chọn' });
    }

    return this.http.post<any>(`${this.apiUrl}/batch-delete`, { ids }, { headers: this.getHeaders() })
      .pipe(
        catchError((err) => {
          // Rollback on failure
          this.cartSubject.next(previous);
          return throwError(() => err);
        })
      );
  }
}
