import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

export interface CustomerAddress {
  id: string;
  customerId?: string;
  receiverName: string;
  phone: string;
  province: string;
  provinceCode?: string | null;
  district?: string | null;
  districtCode?: string | null;
  ward?: string | null;
  wardCode?: string | null;
  detail: string;
  isDefault: boolean;
  addressType?: 'HOME' | 'OFFICE';
  createdAt?: string;
  updatedAt?: string;
}

export interface CustomerProfile {
  id: string;
  fullName: string;
  phone: string;
  email?: string | null;
  avatarUrl?: string | null;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  birthday?: string | null;
  type?: 'RETAIL' | 'B2B';
  companyName?: string | null;
  taxCode?: string | null;
  rewardPoints: number;
  totalSpent: number;
  memberTier: string;
  memberBadge: string;
  nextTierThreshold: number;
  orderCount: number;
  addresses: CustomerAddress[];
  trustedPhones?: string[];
  createdAt: string;
  hasPassword?: boolean;
  isPhoneVerified?: boolean;
}

export interface WarrantyItem {
  id: string;
  orderNumber: string;
  warrantyCode?: string;
  productId?: string;
  productName: string;
  sku?: string;
  imageUrl?: string;
  variantDescription?: string;
  variantName?: string;
  price?: number;
  quantity?: number;
  purchaseDate: string;
  deliveredDate: string;
  warrantyPeriodMonths: number;
  expiryDate: string;
  isExpired: boolean;
  daysLeft: number;
  progressPercent?: number;
  status: 'ACTIVE' | 'EXPIRED';
  statusLabel: string;
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  coverageTerms?: string[] | any;
}

export interface CustomerAppointment {
  id: string;
  appointmentCode?: string;
  customerId: string;
  customerName: string;
  phone: string;
  email?: string;
  appointmentType: 'SHOWROOM' | 'ONLINE_3D';
  showroomId?: string;
  showroomName?: string;
  showroomAddress?: string;
  date: string;
  timeSlot: string;
  productId?: string | null;
  productName?: string | null;
  staffName?: string | null;
  rejectionReason?: string | null;
  cancellationReason?: string | null;
  consultationResult?: string | null;
  spaceType?: string;
  budget?: string;
  notes?: string;
  status: 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED' | 'CANCELLED';
  createdAt: string;
  updatedAt?: string;
}

export interface CustomerReturnRequest {
  id: string;
  customerId: string;
  orderNumber: string;
  productName: string;
  sku?: string;
  imageUrl?: string;
  variantDescription?: string;
  quantity?: number;
  price?: number;
  reason: string;
  description: string;
  images: string[];
  status: 'PENDING' | 'PROCESSING' | 'PREPARING' | 'SHIPPED' | 'COMPLETED' | 'REJECTED';
  statusLabel: string;
  refundAmount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerNotification {
  id: string;
  title: string;
  message: string;
  type: 'ORDER' | 'WARRANTY' | 'APPOINTMENT' | 'RETURN' | 'PROMO';
  isRead: boolean;
  link?: string;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class CustomerService {
  private readonly baseUrl = `${environment.apiUrl}/customer`;
  private readonly CACHE_NOTIFICATIONS_KEY = 'dcor_cache_notifications';

  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$ = this.unreadCountSubject.asObservable();

  private notificationsSubject = new BehaviorSubject<CustomerNotification[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();

  get currentNotifications(): CustomerNotification[] {
    return this.notificationsSubject.value;
  }

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {
    this.initNotificationsFromCache();
  }

  private initNotificationsFromCache(): void {
    try {
      const cached = localStorage.getItem(this.CACHE_NOTIFICATIONS_KEY);
      if (cached) {
        const list: CustomerNotification[] = JSON.parse(cached);
        this.notificationsSubject.next(list);
        const unread = list.filter(n => !n.isRead).length;
        this.unreadCountSubject.next(unread);
      }
    } catch (_) {}
  }

  refreshNotifications(): void {
    const token = localStorage.getItem('dcor_customer_token');
    if (!token) {
      this.clearNotifications();
      return;
    }
    this.getNotifications().subscribe({
      next: () => {},
      error: () => {}
    });
  }

  clearNotifications(): void {
    this.notificationsSubject.next([]);
    this.unreadCountSubject.next(0);
    try {
      localStorage.removeItem(this.CACHE_NOTIFICATIONS_KEY);
    } catch (_) {}
  }

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

  // 1. Hồ sơ cá nhân
  getProfile(): Observable<CustomerProfile> {
    return this.http.get<CustomerProfile>(`${this.baseUrl}/profile`, { headers: this.getHeaders() });
  }

  updateProfile(data: { 
    fullName: string; 
    email?: string | null; 
    avatarUrl?: string | null; 
    companyName?: string; 
    taxCode?: string;
    phone?: string;
    otp?: string;
    newPassword?: string;
  }): Observable<any> {
    return this.http.put(`${this.baseUrl}/profile`, data, { headers: this.getHeaders() });
  }

  changePassword(payload: { currentPassword?: string; newPassword: string }): Observable<any> {
    return this.http.put(`${this.baseUrl}/change-password`, payload, { headers: this.getHeaders() });
  }

  changePhone(payload: { newPhone: string; otp: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}/change-phone`, payload, { headers: this.getHeaders() });
  }

  // 2. Sổ địa chỉ
  getAddresses(): Observable<CustomerAddress[]> {
    return this.http.get<CustomerAddress[]>(`${this.baseUrl}/addresses`, { headers: this.getHeaders() });
  }

  createAddress(payload: Partial<CustomerAddress>): Observable<{ message: string; address: CustomerAddress }> {
    return this.http.post<{ message: string; address: CustomerAddress }>(`${this.baseUrl}/addresses`, payload, { headers: this.getHeaders() });
  }

  updateAddress(id: string, payload: Partial<CustomerAddress>): Observable<{ message: string; address: CustomerAddress }> {
    return this.http.put<{ message: string; address: CustomerAddress }>(`${this.baseUrl}/addresses/${id}`, payload, { headers: this.getHeaders() });
  }

  setDefaultAddress(id: string): Observable<{ message: string; address: CustomerAddress }> {
    return this.http.put<{ message: string; address: CustomerAddress }>(`${this.baseUrl}/addresses/${id}/default`, {}, { headers: this.getHeaders() });
  }

  deleteAddress(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/addresses/${id}`, { headers: this.getHeaders() });
  }

  // 3. Bảo hành
  getWarranties(): Observable<WarrantyItem[]> {
    return this.http.get<WarrantyItem[]>(`${this.baseUrl}/warranties`, { headers: this.getHeaders() });
  }

  createWarrantyClaim(payload: { orderNumber: string; productName: string; issueDescription: string; claimType?: string; evidenceImages?: string[] }): Observable<any> {
    return this.http.post(`${this.baseUrl}/warranties`, payload, { headers: this.getHeaders() });
  }

  // 4. Lịch hẹn tư vấn
  getAppointments(): Observable<CustomerAppointment[]> {
    return this.http.get<CustomerAppointment[]>(`${this.baseUrl}/appointments`, { headers: this.getHeaders() });
  }

  getBookedSlots(params?: { date?: string; showroomId?: string; showroomAddress?: string; appointmentType?: string }): Observable<{ bookedSlots: string[]; isClosed?: boolean; closureReason?: string | null; slots?: any[]; allBookings?: any[] }> {
    let httpParams = new HttpParams();
    if (params?.date) httpParams = httpParams.set('date', params.date);
    if (params?.showroomId) httpParams = httpParams.set('showroomId', params.showroomId);
    if (params?.showroomAddress) httpParams = httpParams.set('showroomAddress', params.showroomAddress);
    if (params?.appointmentType) httpParams = httpParams.set('appointmentType', params.appointmentType);
    return this.http.get<{ bookedSlots: string[]; isClosed?: boolean; closureReason?: string | null; slots?: any[]; allBookings?: any[] }>(`${this.baseUrl}/appointments/booked-slots`, {
      headers: this.getHeaders(),
      params: httpParams
    });
  }

  createAppointment(payload: {
    customerName: string;
    phone: string;
    email?: string;
    appointmentType: 'SHOWROOM' | 'ONLINE_3D';
    showroomId?: string;
    showroomAddress?: string;
    date: string;
    timeSlot: string;
    spaceType?: string;
    budget?: string;
    notes?: string;
  }): Observable<any> {
    return this.http.post(`${this.baseUrl}/appointments`, payload, { headers: this.getHeaders() });
  }

  cancelAppointment(id: string, reason?: string): Observable<any> {
    return this.http.put(`${this.baseUrl}/appointments/${id}/cancel`, { reason }, { headers: this.getHeaders() });
  }

  rescheduleAppointment(id: string, payload: { date: string; timeSlot: string; notes?: string }): Observable<any> {
    return this.http.put(`${this.baseUrl}/appointments/${id}/reschedule`, payload, { headers: this.getHeaders() });
  }

  // 5. Đổi trả / Hoàn tiền
  getReturns(): Observable<CustomerReturnRequest[]> {
    return this.http.get<CustomerReturnRequest[]>(`${this.baseUrl}/returns`, { headers: this.getHeaders() });
  }

  createReturn(payload: { orderNumber: string; productName?: string; sku?: string; imageUrl?: string; reason: string; description?: string; images?: string[] }): Observable<any> {
    return this.http.post(`${this.baseUrl}/returns`, payload, { headers: this.getHeaders() });
  }

  updateReturnStatus(id: string, status: string, notes?: string): Observable<{ message: string; returnRequest: CustomerReturnRequest }> {
    return this.http.put<{ message: string; returnRequest: CustomerReturnRequest }>(
      `${this.baseUrl}/returns/${id}/status`,
      { status, notes },
      { headers: this.getHeaders() }
    );
  }

  // 6. Thông báo cá nhân
  getNotifications(): Observable<CustomerNotification[]> {
    return this.http.get<CustomerNotification[]>(`${this.baseUrl}/notifications`, { headers: this.getHeaders() }).pipe(
      tap((data) => {
        const list = data || [];
        this.notificationsSubject.next(list);
        const unread = list.filter(n => !n.isRead).length;
        this.unreadCountSubject.next(unread);
        try {
          localStorage.setItem(this.CACHE_NOTIFICATIONS_KEY, JSON.stringify(list));
        } catch (_) {}
      })
    );
  }

  markNotificationRead(id: string): Observable<any> {
    const currentList = this.notificationsSubject.value;
    const target = currentList.find(n => n.id === id);
    if (target && !target.isRead) {
      target.isRead = true;
      this.notificationsSubject.next([...currentList]);
      const unread = currentList.filter(n => !n.isRead).length;
      this.unreadCountSubject.next(unread);
      try {
        localStorage.setItem(this.CACHE_NOTIFICATIONS_KEY, JSON.stringify(currentList));
      } catch (_) {}
    }

    return this.http.put(`${this.baseUrl}/notifications/${id}/read`, {}, { headers: this.getHeaders() });
  }

  markAllNotificationsRead(ids?: string[]): Observable<any> {
    const currentList = this.notificationsSubject.value;
    currentList.forEach(n => {
      if (!ids || ids.length === 0 || ids.includes(n.id)) {
        n.isRead = true;
      }
    });
    this.notificationsSubject.next([...currentList]);
    const unread = currentList.filter(n => !n.isRead).length;
    this.unreadCountSubject.next(unread);
    try {
      localStorage.setItem(this.CACHE_NOTIFICATIONS_KEY, JSON.stringify(currentList));
    } catch (_) {}

    return this.http.put(`${this.baseUrl}/notifications/read-all`, { ids: ids || [] }, { headers: this.getHeaders() });
  }
}
