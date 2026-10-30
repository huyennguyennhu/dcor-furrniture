import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { 
  AuditLogItem, 
  AuditLogPagination, 
  AuditLogStats, 
  AuditLogFilterState,
  AuditModuleItem
} from './audit-log.model';

export interface AuditLogResponse {
  success: boolean;
  data: AuditLogItem[];
  modules?: AuditModuleItem[];
  pagination: AuditLogPagination;
  stats: AuditLogStats;
}

@Injectable({
  providedIn: 'root'
})
export class AuditLogService {
  private readonly apiUrl = `${environment.apiUrl}/admin/audit-logs`;

  constructor(private http: HttpClient) {}

  getAuditLogModules(): Observable<{ success: boolean; data: AuditModuleItem[] }> {
    return this.http.get<{ success: boolean; data: AuditModuleItem[] }>(`${this.apiUrl}/modules`);
  }

  getAuditLogs(filters: Partial<AuditLogFilterState>): Observable<AuditLogResponse> {
    let params = new HttpParams();

    if (filters.search) {
      params = params.set('search', filters.search.trim());
    }
    if (filters.module && filters.module !== 'ALL') {
      params = params.set('module', filters.module);
    }
    if (filters.actionType && filters.actionType !== 'ALL') {
      params = params.set('actionType', filters.actionType);
    }
    if (filters.role && filters.role !== 'ALL') {
      params = params.set('role', filters.role);
    }
    if (filters.staffName) {
      params = params.set('staffName', filters.staffName.trim());
    }
    if (filters.severity && filters.severity !== 'ALL') {
      params = params.set('severity', filters.severity);
    }
    if (filters.startDate) {
      params = params.set('startDate', filters.startDate);
    }
    if (filters.endDate) {
      params = params.set('endDate', filters.endDate);
    }
    if (filters.page) {
      params = params.set('page', filters.page.toString());
    }
    if (filters.limit) {
      params = params.set('limit', filters.limit.toString());
    }

    return this.http.get<AuditLogResponse>(this.apiUrl, { params });
  }

  getAuditLogById(id: string): Observable<{ success: boolean; data: AuditLogItem }> {
    return this.http.get<{ success: boolean; data: AuditLogItem }>(`${this.apiUrl}/${id}`);
  }
}
