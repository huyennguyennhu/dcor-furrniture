import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
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
    });
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

