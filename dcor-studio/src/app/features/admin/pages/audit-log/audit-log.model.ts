export type AuditSeverity = 'INFO' | 'WARNING' | 'CRITICAL';

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'AUTH' | 'APPROVE' | 'ALL';

export type AuditModule = 'ORDERS' | 'PRODUCTS' | 'INVENTORY' | 'CUSTOMERS' | 'SYSTEM' | 'ALL' | string;

export interface AuditModuleItem {
  key: string;
  label: string;
  count?: number;
}

export type AuditRole = 'ADMIN' | 'WAREHOUSE' | 'SALES' | 'ACCOUNTANT' | 'CONTENT' | 'ALL';

export interface AuditLogItem {
  id: string;
  log_code: string;
  timestamp: string;
  actor_id?: string;
  actor_name: string;
  actor_email?: string;
  actor_role: string;
  action: string;
  action_label: string;
  module: string;
  module_label: string;
  target_type?: string;
  target_id?: string;
  target_name?: string;
  severity: AuditSeverity;
  description?: string;
  ip_address?: string;
  user_agent?: string;
  old_value?: any;
  new_value?: any;
  created_at?: string;
}

export interface AuditLogPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AuditLogStats {
  totalLogs: number;
  todayLogs: number;
  warningLogs: number;
  criticalLogs: number;
  activeActors: number;
}

export interface AuditLogFilterState {
  search: string;
  datePreset: 'TODAY' | 'LAST_7_DAYS' | 'LAST_30_DAYS' | 'THIS_MONTH' | 'CUSTOM' | 'ALL';
  startDate: string;
  endDate: string;
  module: AuditModule;
  actionType: AuditAction;
  role: AuditRole;
  staffName: string;
  severity: AuditSeverity | 'ALL';
  page: number;
  limit: number;
}
