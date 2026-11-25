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
    this.cleanStaleTokens();
    this.loadCart();
    if (typeof window !== 'undefined') {
      window.addEventListener('dcor-auth-logout', () => {
        this.resetCartOnLogout();
      });
      window.addEventListener('dcor-auth-login', () => {
        this.loadCart().subscribe();
      });
      window.addEventListener('storage', (event: StorageEvent) => {
        if (event.key === 'dcor_customer_token') {
          if (!event.newValue) {
            this.resetCartOnLogout();
          } else {
            this.loadCart().subscribe();
          }
        }
      });
    }
  }

  /** Xóa token rác hoặc token guest nếu lỡ bị lưu vào dcor_customer_token */
  private cleanStaleTokens(): void {
    try {
      // Khách vãng lai không lưu giỏ hàng vào localStorage để khi đóng web vào lại không bị lưu
      localStorage.removeItem(GUEST_CART_KEY);
      const token = localStorage.getItem('dcor_customer_token');
      if (token) {
        if (token.startsWith('guest-')) {
          localStorage.removeItem('dcor_customer_token');
        } else {
          const parts = token.split('.');
          if (parts.length === 3) {
            const payload = JSON.parse(atob(parts[1]));
            if (!payload.userId || payload.isGuest) {
              localStorage.removeItem('dcor_customer_token');
            }
          }
        }
      }
    } catch {
      // Bỏ qua nếu môi trường không có localStorage
    }
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

  /**
   * Reset giỏ hàng khi người dùng đăng xuất
   */
  public resetCartOnLogout(): void {
    try {
      sessionStorage.removeItem(GUEST_CART_KEY);
      localStorage.removeItem(GUEST_CART_KEY);
    } catch {}
    this.cartSubject.next([]);
    this.isLoadingSubject.next(false);
  }

  /** Kiểm tra khách đã đăng nhập chưa (yêu cầu tài khoản thành viên thật, không dùng token tạm của guest) */
  get isLoggedIn(): boolean {
    const token = localStorage.getItem('dcor_customer_token');
    if (!token || token.startsWith('guest-')) return false;

    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        if (!payload.userId || payload.isGuest) {
          return false;
        }
      }
    } catch {
      return false;
    }

    const userStr = localStorage.getItem('dcor_customer') || localStorage.getItem('dcor_customer_user') || localStorage.getItem('dcor_user');
    if (!userStr) return false;

    try {
      const user = JSON.parse(userStr);
      return !!(user && user.id && !String(user.id).startsWith('guest-'));
    } catch {
      return false;
    }
  }

  /** Lấy giỏ hàng guest từ sessionStorage (không lưu qua phiên trình duyệt) */
  private loadGuestCart(): CartItem[] {
    try {
      // Dọn dẹp localStorage nếu trước đó có lỡ lưu
      localStorage.removeItem(GUEST_CART_KEY);
      const raw = sessionStorage.getItem(GUEST_CART_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  /** Lưu giỏ hàng guest vào sessionStorage */
  private saveGuestCart(items: CartItem[]): void {
    try {
      localStorage.removeItem(GUEST_CART_KEY);
      sessionStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
    } catch {
      console.error('Không thể lưu giỏ hàng guest');
    }
  }

  /** Thêm item vào giỏ hàng guest (localStorage) */
  private addGuestItem(variantId: string, quantity: number, selectedOptions?: any, guestProductInfo?: Partial<CartItem>): CartItem[] {
    const guestItems = this.loadGuestCart();
    const existingIdx = guestItems.findIndex(i => i.variantId === variantId);
    if (existingIdx >= 0) {
      guestItems[existingIdx].quantity += quantity;
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
    }
    this.saveGuestCart(guestItems);
    this.cartSubject.next(guestItems);
    return guestItems;
  }

  /**
   * Load full cart from server (used on init and after variant changes)
   * Nếu chưa đăng nhập: tải từ localStorage
   */
  loadCart(): Observable<CartItem[]> {
    if (!this.isLoggedIn) {
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
          if (err.status === 401 || err.status === 403) {
            // Token hết hạn hoặc không hợp lệ -> fallback giỏ hàng guest
            const guestItems = this.loadGuestCart();
            this.cartSubject.next(guestItems);
            return of(guestItems);
          }
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
      const guestItems = this.addGuestItem(variantId, quantity, selectedOptions, guestProductInfo);
      const targetItem = guestItems.find(i => i.variantId === variantId);
      return of({ message: 'Đã thêm vào giỏ hàng', cartItem: targetItem });
    }

    return this.http.post<any>(this.apiUrl, { variantId, quantity, selectedOptions }, { headers: this.getHeaders() })
      .pipe(
        tap(() => this.loadCart().subscribe()),
        catchError((err) => {
          // Khi phiên đăng nhập hết hạn, không có quyền, hoặc biến thể không tồn tại trên server:
          // tự động fallback lưu vào giỏ hàng cục bộ để không bao giờ làm mất sản phẩm của người dùng
          console.warn('Lỗi khi thêm giỏ hàng online, tự động lưu vào giỏ hàng offline/guest:', err);
          this.addGuestItem(variantId, quantity, selectedOptions, guestProductInfo);
          return of({ message: 'Đã thêm vào giỏ hàng' });
        })
      );
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
      sessionStorage.removeItem(GUEST_CART_KEY);
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
  updateVariant(
    id: string,
    variantId: string,
    quantity?: number,
    selectedOptions?: any,
    updatedGuestInfo?: Partial<CartItem>
  ): Observable<any> {
    if (!this.isLoggedIn) {
      const guestItems = this.loadGuestCart();
      const idx = guestItems.findIndex(i => i.id === id);
      if (idx >= 0) {
        const current = guestItems[idx];
        const targetQuantity = quantity !== undefined ? quantity : current.quantity;
        const sameVariantIdx = guestItems.findIndex(i => i.variantId === variantId && i.id !== id);

        if (sameVariantIdx >= 0) {
          guestItems[sameVariantIdx] = {
            ...guestItems[sameVariantIdx],
            ...(updatedGuestInfo || {}),
            quantity: guestItems[sameVariantIdx].quantity + targetQuantity,
            selectedOptions: selectedOptions !== undefined ? selectedOptions : guestItems[sameVariantIdx].selectedOptions
          };
          guestItems.splice(idx, 1);
          this.saveGuestCart(guestItems);
          this.cartSubject.next(guestItems);
          return of({ message: 'Đã gộp vào sản phẩm cùng biến thể đã có trong giỏ hàng', merged: true });
        }

        guestItems[idx] = {
          ...current,
          ...(updatedGuestInfo || {}),
          variantId,
          quantity: targetQuantity,
          selectedOptions: selectedOptions !== undefined ? selectedOptions : {}
        };
        this.saveGuestCart(guestItems);
        this.cartSubject.next(guestItems);
      }
      return of({ message: 'Cập nhật biến thể thành công' });
    }
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
