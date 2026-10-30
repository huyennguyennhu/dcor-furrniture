import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

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

  constructor(private http: HttpClient) {}

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
    return this.http.get<AdminConsultationResponse>(`${this.apiUrl}/admin/list`, { params });
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
    return this.http.post<any>(`${this.apiUrl}/admin/approve`, payload);
  }

  rejectConsultation(payload: {
    id: string;
    rejectionReason: string;
  }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/admin/reject`, payload);
  }

  completeConsultation(payload: {
    id: string;
    consultationResult: string;
  }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/admin/complete`, payload);
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
    return this.http.post<any>(`${this.apiUrl}/admin/cancel`, payload);
  }

  updateStatusConsultation(payload: {
    id: string;
    status: ConsultationStatus;
    note?: string;
  }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/admin/update-status`, payload);
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
