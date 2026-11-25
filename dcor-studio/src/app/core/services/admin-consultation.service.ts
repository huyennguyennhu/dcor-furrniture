import { Injectable, signal, inject, DestroyRef } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ChatUnreadService } from '../../features/admin/pages/chat/services/chat-unread.service';

export type ConsultationStatus = 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED' | 'CANCELLED';

export interface ConsultationHistoryItem {
  action: string;
  title: string;
  timestamp: string;
  actor?: string;
  staffName?: string;
  reason?: string;
  result?: string;
  note?: string;
  preferredDate?: string;
  preferredTime?: string;
}

export interface ConsultationItem {
  id: string;
  appointment_code: string;
  showroom_id: string;
  showroom_name: string;
  showroom_address?: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  preferred_date: string;
  preferred_time: string;
  notes?: string;
  product_id?: string;
  product_name?: string;
  variant_id?: string;
  status: ConsultationStatus;
  staff_id?: string;
  staff_name?: string;
  rejection_reason?: string;
  cancellation_reason?: string;
  consultation_result?: string;
  history?: ConsultationHistoryItem[];
  created_at: string;
  updated_at: string;
}

export interface ConsultationStats {
  total: number;
  pending: number;
  confirmed: number;
  inProgress: number;
  completed: number;
  rejected: number;
  cancelled: number;
}

export interface AdminConsultationResponse {
  success: boolean;
  consultations: ConsultationItem[];
  stats: ConsultationStats;
}

export interface StaffItem {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
}

export interface ShowroomItem {
  id: string;
  code: string;
  name: string;
  address?: string;
  phone?: string;
}

export interface SlotConfigItem {
  time: string;
  period: string;
  maxCapacity: number;
  startTime?: string;
  endTime?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdminConsultationService {
  private apiUrl = `${environment.apiUrl}/consultations`;
  private destroyRef = inject(DestroyRef, { optional: true });
  private chatUnreadService = inject(ChatUnreadService);

  public readonly pendingCount = signal<number>(0);

  private isBadgeSyncStarted = false;
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private boundSocket: any = null;
  private focusHandler = () => this.refreshPendingCount();

  constructor(private http: HttpClient) {
    if (this.destroyRef) {
      this.destroyRef.onDestroy(() => {
        if (this.pollTimer) {
          clearInterval(this.pollTimer);
          this.pollTimer = null;
        }
        if (typeof window !== 'undefined') {
          window.removeEventListener('focus', this.focusHandler);
        }
      });
    }
  }

  startBadgeSync(): void {
    this.attachSocketListener();
    this.refreshPendingCount();

    if (this.isBadgeSyncStarted) return;
    this.isBadgeSyncStarted = true;

    if (typeof window !== 'undefined') {
      window.addEventListener('focus', this.focusHandler);
      this.pollTimer = setInterval(() => {
        this.attachSocketListener();
        this.refreshPendingCount();
      }, 30000);
    }
  }

  private attachSocketListener(): void {
    const socket = this.chatUnreadService.getSocket();
    if (!socket || this.boundSocket === socket) return;
    this.boundSocket = socket;
    socket.on('admin:consultations_pending', (data: { pending?: number }) => {
      if (typeof data?.pending === 'number') {
        this.pendingCount.set(Math.max(0, data.pending));
      }
    });
  }

  refreshPendingCount(): void {
    if (typeof window === 'undefined') return;
    this.http.get<{ success?: boolean; pending?: number }>(`${this.apiUrl}/admin/pending-count`).subscribe({
      next: (res) => {
        if (typeof res?.pending === 'number') {
          this.pendingCount.set(Math.max(0, res.pending));
        }
      },
      error: () => {
        // Fallback nếu server chưa khởi động lại để nhận route /admin/pending-count
        this.http.get<AdminConsultationResponse>(`${this.apiUrl}/admin/list`, {
          params: new HttpParams().set('tab', 'requests')
        }).subscribe({
          next: (res) => {
            if (typeof res?.stats?.pending === 'number') {
              this.pendingCount.set(Math.max(0, res.stats.pending));
            }
          },
          error: () => {}
        });
      }
    });
  }

  getAdminConsultations(filters: {
    tab?: 'requests' | 'calendar' | 'all';
    status?: string;
    showroomId?: string;
    staffId?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
  } = {}): Observable<AdminConsultationResponse> {
    let params = new HttpParams();
    Object.keys(filters).forEach(key => {
      const val = (filters as any)[key];
      if (val !== undefined && val !== null && val !== '') {
        params = params.set(key, val);
      }
    });
    return this.http.get<AdminConsultationResponse>(`${this.apiUrl}/admin/list`, { params }).pipe(
      tap(res => {
        if (typeof res?.stats?.pending === 'number') {
          this.pendingCount.set(Math.max(0, res.stats.pending));
        }
      })
    );
  }

  getStaffList(): Observable<StaffItem[]> {
    return this.http.get<StaffItem[]>(`${this.apiUrl}/admin/staff-list`);
  }

  getShowrooms(): Observable<ShowroomItem[]> {
    return this.http.get<ShowroomItem[]>(`${this.apiUrl}/showrooms`);
  }

  approveConsultation(payload: {
    id: string;
    staffId: string;
    staffName: string;
    preferredDate?: string;
    preferredTime?: string;
    adminNote?: string;
  }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/admin/approve`, payload).pipe(
      tap(() => this.refreshPendingCount())
    );
  }

  rejectConsultation(payload: {
    id: string;
    rejectionReason: string;
  }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/admin/reject`, payload).pipe(
      tap(() => this.refreshPendingCount())
    );
  }

  completeConsultation(payload: {
    id: string;
    consultationResult: string;
  }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/admin/complete`, payload).pipe(
      tap(() => this.refreshPendingCount())
    );
  }

  rescheduleConsultation(payload: {
    id: string;
    newDate: string;
    newTime: string;
    reason?: string;
  }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/admin/reschedule`, payload);
  }

  cancelConsultation(payload: {
    id: string;
    cancellationReason: string;
  }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/admin/cancel`, payload).pipe(
      tap(() => this.refreshPendingCount())
    );
  }

  updateStatusConsultation(payload: {
    id: string;
    status: ConsultationStatus;
    note?: string;
  }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/admin/update-status`, payload).pipe(
      tap(() => this.refreshPendingCount())
    );
  }

  getSlotConfig(showroomId: string): Observable<{ showroomId: string; slots: SlotConfigItem[]; maintenanceDates: string[] }> {
    const params = new HttpParams().set('showroomId', showroomId);
    return this.http.get<any>(`${this.apiUrl}/admin/slot-config`, { params });
  }

  saveSlotConfig(payload: {
    showroomId: string;
    slots: SlotConfigItem[];
    maintenanceDates: string[];
  }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/admin/slot-config`, payload);
  }
}
