import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

export interface ProductReviewItem {
  id: string;
  orderId: string;
  orderNumber: string;
  orderItemId?: string;
  productId: string;
  productName?: string;
  productImage?: string;
  variantDescription?: string;
  customerName?: string;
  rating: number; // 1 -> 5
  comment: string;
  images: string[];
  isAnonymous?: boolean;
  reply?: string | null;
  replyAt?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface PendingReviewItem {
  orderId: string;
  orderNumber: string;
  orderDate: string;
  orderCompletedAt?: string;
  orderItemId: string;
  productId: string;
  productName: string;
  productImage?: string;
  variantDescription?: string;
  price: number;
  quantity: number;
  lineTotal: number;
}

export interface ReviewListResponse {
  reviewed: ProductReviewItem[];
  unreviewed: PendingReviewItem[];
}

export interface ProductReviewInput {
  orderItemId?: string;
  productId: string;
  productName?: string;
  productImage?: string;
  variantDescription?: string;
  rating: number;
  comment: string;
  images: string[];
}

@Injectable({
  providedIn: 'root'
})
export class ReviewService {
  private readonly baseUrl = `${environment.apiUrl}/store/reviews`;
  private readonly uploadUrl = `${environment.apiUrl}/upload/image`;
  private readonly CACHE_UNREVIEWED_COUNT_KEY = 'dcor_unreviewed_count';

  private getInitialUnreviewedCount(): number {
    try {
      const cached = localStorage.getItem(this.CACHE_UNREVIEWED_COUNT_KEY);
      if (cached !== null && !isNaN(Number(cached))) {
        return Math.max(0, Number(cached));
      }
    } catch (_) {}
    return 0;
  }

  private unreviewedCountSubject = new BehaviorSubject<number>(this.getInitialUnreviewedCount());
  public unreviewedCount$: Observable<number> = this.unreviewedCountSubject.asObservable();

  public get currentUnreviewedCount(): number {
    return this.unreviewedCountSubject.value;
  }

  public updateUnreviewedCount(count: number): void {
    const safeCount = Math.max(0, count);
    this.unreviewedCountSubject.next(safeCount);
    try {
      localStorage.setItem(this.CACHE_UNREVIEWED_COUNT_KEY, String(safeCount));
    } catch (_) {}
  }

  private isRefreshingCount = false;
  public refreshUnreviewedCount(): void {
    if (this.isRefreshingCount) return;
    const hasAuth = this.authService.isAuthenticated() || !!this.authService.getGuestPhone();
    if (!hasAuth) {
      this.updateUnreviewedCount(0);
      return;
    }

    this.isRefreshingCount = true;
    this.getMyReviews().subscribe({
      next: (res) => {
        this.isRefreshingCount = false;
        const count = res?.unreviewed?.length || 0;
        this.updateUnreviewedCount(count);
      },
      error: () => {
        this.isRefreshingCount = false;
        // Giữ nguyên số lượng cache hiện tại, không reset về 0 khi có lỗi mạng tạm thời
      }
    });
  }

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken() || '';
    const guestPhone = this.authService.getGuestPhone() || '';
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    if (guestPhone) {
      headers = headers.set('X-Guest-Phone', guestPhone);
    }
    return headers;
  }

  /**
   * Lấy danh sách đánh giá của khách hàng (gồm cả 2 tab: Đã đánh giá & Chưa đánh giá)
   */
  getMyReviews(): Observable<ReviewListResponse> {
    const guestPhone = this.authService.getGuestPhone();
    let params = new HttpParams();
    if (guestPhone) {
      params = params.set('phone', guestPhone);
    }

    return this.http.get<ReviewListResponse>(`${this.baseUrl}/my-reviews`, {
      headers: this.getHeaders(),
      params
    }).pipe(
      tap((res) => {
        const count = res?.unreviewed?.length || 0;
        this.updateUnreviewedCount(count);
      })
    );
  }

  /**
   * Gửi đánh giá cho các sản phẩm trong đơn hàng
   */
  submitOrderReviews(
    orderNumber: string,
    reviews: ProductReviewInput[],
    isAnonymous: boolean = false
  ): Observable<{ message: string; reviews: any[] }> {
    const payload = {
      orderNumber,
      reviews,
      isAnonymous
    };

    return this.http.post<{ message: string; reviews: any[] }>(
      `${this.baseUrl}/${orderNumber}`,
      payload,
      { headers: this.getHeaders() }
    ).pipe(
      tap(() => {
        this.refreshUnreviewedCount();
      })
    );
  }

  /**
   * Tải ảnh lên máy chủ (Cloudinary)
   */
  uploadImage(file: File | Blob): Observable<{ url: string }> {
    const formData = new FormData();
    formData.append('file', file, 'review-image.webp');
    return this.http.post<{ url: string }>(this.uploadUrl, formData);
  }

  /**
   * Tải ảnh qua chuỗi Base64
   */
  uploadBase64Image(base64: string): Observable<{ url: string }> {
    return this.http.post<{ url: string }>(
      this.uploadUrl,
      { image: base64 },
      { headers: new HttpHeaders({ 'Content-Type': 'application/json' }) }
    );
  }
}

