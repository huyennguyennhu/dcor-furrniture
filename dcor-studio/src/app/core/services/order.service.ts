import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

export interface OrderItemDetail {
  id: string;
  productId: string;
  variantId?: string | null;
  productName: string;
  sku?: string | null;
  imageUrl?: string;
  price: number;
  quantity: number;
  lineTotal: number;
  variantDescription?: string | null;
  selectedOptions?: any;
}

export interface OrderStatusHistoryItem {
  id: string;
  status: string;
  actorType: string;
  notes?: string | null;
  createdAt: string;
}

export interface PaymentTransactionItem {
  id: string;
  transactionCode: string;
  amount: number;
  paymentMethod: string;
  status: string;
  createdAt: string;
}

export interface OrderDetail {
  id: string;
  orderNumber: string;
  dbId?: string;
  createdAt: string;
  date?: string;
  totalAmount: number;
  subTotal: number;
  shippingFee: number;
  discountAmount: number;
  status: string;
  displayStatus: string;
  paymentMethod: string;
  paymentStatus: string;
  isHighValue: boolean;
  depositAmount: number;
  paidAmount?: number;
  remainingAmount?: number;
  receiverName: string;
  phone: string;
  email?: string | null;
  province: string;
  district?: string | null;
  ward?: string | null;
  detailAddress: string;
  notes?: string | null;
  cancelReason?: string | null;
  shippingProvider?: string | null;
  trackingCode?: string | null;
  expiresAt?: string | null;
  cancelledAt?: string | null;
  deliveredAt?: string | Date;
  isDeliveredWaitingConfirm?: boolean;
  remainingConfirmSeconds?: number;
  items: OrderItemDetail[];
  statusHistory: OrderStatusHistoryItem[];
  payments: PaymentTransactionItem[];
}

export interface OrderSummary {
  id: string;
  orderNumber: string;
  dbId?: string;
  date: string;
  createdAt: string;
  deliveredAt?: string | Date;
  updatedAt?: string;
  expiresAt?: string | null;
  cancelledAt?: string | null;
  isDeliveredWaitingConfirm?: boolean;
  remainingConfirmSeconds?: number;
  total: number;
  totalAmount: number;
  subTotal: number;
  shippingFee: number;
  discountAmount: number;
  status: string;
  displayStatus: string;
  paymentMethod: string;
  paymentStatus: string;
  isHighValue: boolean;
  depositAmount: number;
  items: number;
  firstItem?: {
    productName: string;
    sku?: string;
    imageUrl?: string;
    price: number;
    quantity: number;
    variantDescription?: string;
    selectedOptions?: any;
  } | null;
  allItems?: OrderItemDetail[];
  shippingInfo?: {
    receiverName: string;
    phone: string;
    email?: string | null;
    province: string;
    district?: string | null;
    ward?: string | null;
    detailAddress: string;
  };
  notes?: string | null;
  cancelReason?: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private readonly baseUrl = `${environment.apiUrl}/store/orders`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken() || '';
    const guestPhone = this.authService.getGuestPhone() || '';
    let headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    if (guestPhone) {
      headers = headers.set('X-Guest-Phone', guestPhone);
    }
    return headers;
  }

  // Lấy danh sách đơn hàng của khách hàng với bộ lọc tab và tìm kiếm (hỗ trợ cả khách vãng lai)
  getMyOrders(statusFilter = 'ALL', search = ''): Observable<OrderSummary[]> {
    let params = new HttpParams();
    if (statusFilter && statusFilter !== 'ALL') {
      params = params.set('status', statusFilter);
    }
    if (search && search.trim()) {
      params = params.set('search', search.trim());
    }
    const guestPhone = this.authService.getGuestPhone();
    if (guestPhone) {
      params = params.set('phone', guestPhone);
    }

    return this.http.get<OrderSummary[]>(`${this.baseUrl}/my-orders`, {
      headers: this.getHeaders(),
      params
    });
  }

  // Xem chi tiết đơn hàng
  getOrderDetail(orderNumber: string): Observable<OrderDetail> {
    return this.http.get<OrderDetail>(`${this.baseUrl}/${orderNumber}`, {
      headers: this.getHeaders()
    });
  }

  // Hủy đơn hàng
  cancelOrder(orderNumber: string, reason: string): Observable<{ message: string; orderNumber: string; status: string }> {
    return this.http.post<{ message: string; orderNumber: string; status: string }>(
      `${this.baseUrl}/${orderNumber}/cancel`,
      { reason },
      { headers: this.getHeaders() }
    );
  }

  // Xác nhận đã nhận hàng
  confirmReceived(orderNumber: string): Observable<{ message: string; orderNumber: string; status: string }> {
    return this.http.post<{ message: string; orderNumber: string; status: string }>(
      `${this.baseUrl}/${orderNumber}/confirm-received`,
      {},
      { headers: this.getHeaders() }
    );
  }

  // Yêu cầu đổi trả hàng
  requestReturn(orderNumber: string, payload: { reason: string; description?: string; images?: string[] }): Observable<{ message: string; status: string }> {
    return this.http.post<{ message: string; status: string }>(
      `${this.baseUrl}/${orderNumber}/return`,
      payload,
      { headers: this.getHeaders() }
    );
  }

  // Đánh giá sản phẩm đã mua
  submitReview(orderNumber: string, payload: { rating: number; comment?: string; itemId?: string }): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.baseUrl}/${orderNumber}/review`,
      payload,
      { headers: this.getHeaders() }
    );
  }

  // Cập nhật trạng thái đơn hàng (Đồng bộ trực tiếp với hệ thống Admin)
  updateOrderStatusSync(orderIdOrNumber: string, status: string, notes?: string): Observable<{ message: string; order: any }> {
    return this.http.put<{ message: string; order: any }>(
      `${environment.apiUrl}/admin/orders/${orderIdOrNumber}/status`,
      {
        status,
        notes: notes || `Chuyển trạng thái thử nghiệm đồng bộ Admin sang ${status}`,
        actorName: 'Khách hàng (Thanh Test Đồng Bộ)'
      },
      { headers: this.getHeaders() }
    );
  }
}

