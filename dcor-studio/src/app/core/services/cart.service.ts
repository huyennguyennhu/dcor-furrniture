import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, throwError, tap, of } from 'rxjs';
import { environment } from '../../../environments/environment';

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

  /**
   * Load full cart from server (used on init and after variant changes)
   */
  loadCart(): Observable<CartItem[]> {
    const token = localStorage.getItem('dcor_customer_token');
    if (!token) {
      this.cartSubject.next([]);
      this.isLoadingSubject.next(false);
      return new BehaviorSubject<CartItem[]>([]).asObservable();
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
   * Add to cart — server always authoritative (stock check), then reload
   */
  addToCart(variantId: string, quantity: number, selectedOptions?: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, { variantId, quantity, selectedOptions }, { headers: this.getHeaders() })
      .pipe(tap(() => this.loadCart().subscribe()));
  }

  /**
   * Update quantity with OPTIMISTIC UPDATE:
   * - Immediately update local state so UI feels instant
   * - Send PUT request in background
   * - On error: rollback to previous state and surface the error
   */
  updateQuantity(id: string, quantity: number): Observable<any> {
    const previous = this.cartSubject.value;

    // Optimistic: update local cart immediately
    const optimistic = previous.map(item =>
      item.id === id ? { ...item, quantity } : item
    );
    this.cartSubject.next(optimistic);

    return this.http.put<any>(`${this.apiUrl}/${id}`, { quantity }, { headers: this.getHeaders() })
      .pipe(
        // No server reload needed — server confirmed the change matches our optimistic state
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
   * - Immediately remove from local state
   * - Send DELETE in background
   * - On error: rollback
   */
  removeFromCart(id: string): Observable<any> {
    const previous = this.cartSubject.value;

    // Optimistic: remove from local state immediately
    const optimistic = previous.filter(item => item.id !== id);
    this.cartSubject.next(optimistic);

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
   */
  removeMultiple(ids: string[]): Observable<any> {
    const previous = this.cartSubject.value;
    const idSet = new Set(ids);

    // Optimistic: remove all targeted items immediately
    const optimistic = previous.filter(item => !idSet.has(item.id));
    this.cartSubject.next(optimistic);

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
