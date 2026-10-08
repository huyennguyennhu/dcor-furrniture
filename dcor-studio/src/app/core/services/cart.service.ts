import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface CartItem {
  id: string;
  productId: string;
  variantId: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
  variantTags?: {label: string, value: string}[];
  selectedOptions?: any;
  leg?: any;
  upholstery?: any;
}
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private apiUrl = `${environment.apiUrl}/store/cart`;
  private cartSubject = new BehaviorSubject<CartItem[]>([]);
  public cart$ = this.cartSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadCart(); // Auto load khi khởi tạo app
  }

  private getHeaders() {
    const token = localStorage.getItem('dcor_customer_token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  loadCart() {
    const token = localStorage.getItem('dcor_customer_token');
    if (!token) {
      this.cartSubject.next([]);
      return;
    }

    this.http.get<CartItem[]>(this.apiUrl, { headers: this.getHeaders() })
      .subscribe({
        next: (items) => this.cartSubject.next(items),
        error: (err) => console.error('Lỗi tải giỏ hàng', err)
      });
  }

  addToCart(variantId: string, quantity: number, selectedOptions?: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, { variantId, quantity, selectedOptions }, { headers: this.getHeaders() })
      .pipe(tap(() => this.loadCart())); // Tải lại giỏ hàng sau khi thêm
  }

  updateQuantity(id: string, quantity: number): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, { quantity }, { headers: this.getHeaders() })
      .pipe(tap(() => this.loadCart()));
  }

  removeFromCart(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() })
      .pipe(tap(() => this.loadCart()));
  }
}
