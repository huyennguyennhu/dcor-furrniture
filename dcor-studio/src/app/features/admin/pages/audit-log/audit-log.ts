import { Component, OnInit, OnDestroy, HostListener, ElementRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { 
  LucideAngularModule,
  Search, Calendar, Filter, SlidersHorizontal, RotateCcw, Download,
  ChevronDown, ChevronLeft, ChevronRight, Eye, Copy, Check, X,
  AlertTriangle, ShieldAlert, Info, CheckCircle2, User, Clock,
  Layers, Package, ShoppingCart, Warehouse, Settings, Users,
  KeyRound, ShieldCheck, FileText, Laptop, Globe, ArrowUpDown,
  RefreshCw, CheckCircle, Database
} from 'lucide-angular';
import { 
  AuditLogItem, 
  AuditLogPagination, 
  AuditLogStats, 
  AuditLogFilterState,
  AuditModule,
  AuditAction,
  AuditRole,
  AuditSeverity
} from './audit-log.model';
import { AuditLogService } from './audit-log.service';

interface ModuleOption {
  key: AuditModule;
  label: string;
  iconName: string;
}

interface ActionOption {
  key: AuditAction;
  label: string;
  badgeClass: string;
}

interface RoleOption {
  key: AuditRole;
  label: string;
}

interface SeverityOption {
  key: AuditSeverity | 'ALL';
  label: string;
  desc?: string;
  badgeClass: string;
}

@Component({
  selector: 'app-audit-log',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    RouterModule, 
    LucideAngularModule
  ],
  providers: [DatePipe],
  templateUrl: './audit-log.html',
  styleUrls: ['./audit-log.css']
})
export class AuditLogComponent implements OnInit, OnDestroy {
  // Lucide Icons Map
  icons = {
    Search, Calendar, Filter, SlidersHorizontal, RotateCcw, Download,
    ChevronDown, ChevronLeft, ChevronRight, Eye, Copy, Check, X,
    AlertTriangle, ShieldAlert, Info, CheckCircle2, User, Clock,
    Layers, Package, ShoppingCart, Warehouse, Settings, Users,
    KeyRound, ShieldCheck, FileText, Laptop, Globe, ArrowUpDown,
    RefreshCw, CheckCircle, Database
  };

  // State Dữ liệu
  logs: AuditLogItem[] = [];
  isLoading = true;
  errorMessage = '';

  // Phân trang & KPI Stats
  pagination: AuditLogPagination = {
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1
  };

  stats: AuditLogStats = {
    totalLogs: 0,
    todayLogs: 0,
    warningLogs: 0,
    criticalLogs: 0,
    activeActors: 0
  };

  // Bộ lọc
  filters: AuditLogFilterState = {
    search: '',
    datePreset: 'ALL',
    startDate: '',
    endDate: '',
    module: 'ALL',
    actionType: 'ALL',
    role: 'ALL',
    staffName: '',
    severity: 'ALL',
    page: 1,
    limit: 10
  };

  // Dropdown UI states
  showModuleDropdown = false;
  showDateDropdown = false;
  showAdvancedFilters = false;

  // Custom date picker inputs inside date dropdown
  customStartDate = '';
  customEndDate = '';

  // Copy feedback state
  copiedLogCode: string | null = null;

  // Detail Modal state
  showDetailModal = false;
  selectedLog: AuditLogItem | null = null;
  detailViewMode: 'visual' | 'raw' = 'visual';

  // Search debounce
  private searchSubject = new Subject<string>();
  private searchSubscription?: Subscription;

  // Danh mục Options
  readonly MODULE_OPTIONS: ModuleOption[] = [
    { key: 'ALL', label: 'Tất cả phân hệ', iconName: 'Layers' },
    { key: 'ORDERS', label: 'Quản lý Đơn hàng (Order Management)', iconName: 'ShoppingCart' },
    { key: 'PRODUCTS', label: 'Quản lý Sản phẩm / Nội thất (Catalog/Product)', iconName: 'Package' },
    { key: 'INVENTORY', label: 'Quản lý Kho & Kiểm kê (Inventory/WMS)', iconName: 'Warehouse' },
    { key: 'CUSTOMERS', label: 'Quản lý Khách hàng / Cấu hình (CRM/Settings)', iconName: 'Users' },
    { key: 'SYSTEM', label: 'Phân quyền & Hệ thống (User/Role)', iconName: 'ShieldCheck' }
  ];

  readonly ACTION_OPTIONS: ActionOption[] = [
    { key: 'ALL', label: 'Tất cả hành động', badgeClass: 'badge-gray' },
    { key: 'CREATE', label: 'Tạo mới (Create)', badgeClass: 'badge-emerald' },
    { key: 'UPDATE', label: 'Cập nhật (Update)', badgeClass: 'badge-blue' },
    { key: 'DELETE', label: 'Xóa (Delete)', badgeClass: 'badge-rose' },
    { key: 'AUTH', label: 'Đăng nhập / Đăng xuất (Auth)', badgeClass: 'badge-purple' },
    { key: 'APPROVE', label: 'Phê duyệt (Approve)', badgeClass: 'badge-amber' }
  ];

  readonly ROLE_OPTIONS: RoleOption[] = [
    { key: 'ALL', label: 'Tất cả vai trò' },
    { key: 'ADMIN', label: 'Quản trị viên (Admin)' },
    { key: 'WAREHOUSE', label: 'Thủ kho (Warehouse Keeper)' },
    { key: 'SALES', label: 'Nhân viên Sale (Sales)' },
    { key: 'ACCOUNTANT', label: 'Kế toán (Accountant)' },
    { key: 'CONTENT', label: 'Biên tập viên (Content)' }
  ];

  readonly SEVERITY_OPTIONS: SeverityOption[] = [
    { key: 'ALL', label: 'Tất cả mức độ', badgeClass: 'badge-gray' },
    { key: 'INFO', label: 'Info (Thông thường)', desc: 'Đăng nhập, xem báo cáo, tra cứu dữ liệu', badgeClass: 'badge-info' },
    { key: 'WARNING', label: 'Warning (Cảnh báo)', desc: 'Nhập sai pass 3 lần, xuất kho vượt tồn khả dụng', badgeClass: 'badge-warning' },
    { key: 'CRITICAL', label: 'Critical / Danger (Nguy hiểm)', desc: 'Xóa sản phẩm, sửa cấu hình thanh toán, sửa tồn trực tiếp', badgeClass: 'badge-danger' }
  ];

  constructor(
    private auditLogService: AuditLogService,
    private datePipe: DatePipe,
    private elementRef: ElementRef
  ) {}

  ngOnInit(): void {
    // Setup debounce search
    this.searchSubscription = this.searchSubject.pipe(
      debounceTime(350),
      distinctUntilChanged()
    ).subscribe(searchTerm => {
      this.filters.search = searchTerm;
      this.filters.page = 1;
      this.loadAuditLogs();
    });

    this.loadAuditLogs();
  }

  ngOnDestroy(): void {
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }
  }

  // Lắng nghe click outside để đóng các popup dropdown
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const clickedInside = this.elementRef.nativeElement.contains(target);
    if (!clickedInside) {
      this.showModuleDropdown = false;
      this.showDateDropdown = false;
    } else {
      // Đóng dropdown nếu click ra ngoài nút trigger/popup tương ứng
      if (!target.closest('.module-dropdown-wrapper')) {
        this.showModuleDropdown = false;
      }
      if (!target.closest('.date-dropdown-wrapper')) {
        this.showDateDropdown = false;
      }
    }
  }

  // Tải danh sách Audit Logs từ API
  loadAuditLogs(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.auditLogService.getAuditLogs(this.filters).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success) {
          this.logs = res.data || [];
          this.pagination = res.pagination || this.pagination;
          this.stats = res.stats || this.stats;
        } else {
          this.logs = [];
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Lỗi khi tải Audit Logs:', err);
        this.errorMessage = 'Không thể kết nối đến máy chủ. Đang hiển thị nhật ký cục bộ.';
      }
    });
  }

  // Tìm kiếm từ khóa
  onSearchInput(value: string): void {
    this.searchSubject.next(value);
  }

  clearSearch(): void {
    this.filters.search = '';
    this.filters.page = 1;
    this.loadAuditLogs();
  }

  // Xử lý bộ lọc Module
  toggleModuleDropdown(): void {
    this.showModuleDropdown = !this.showModuleDropdown;
    if (this.showModuleDropdown) {
      this.showDateDropdown = false;
    }
  }

  selectModule(modKey: AuditModule): void {
    this.filters.module = modKey;
    this.filters.page = 1;
    this.showModuleDropdown = false;
    this.loadAuditLogs();
  }

  getSelectedModuleLabel(): string {
    const found = this.MODULE_OPTIONS.find(m => m.key === this.filters.module);
    return found ? found.label : 'Tất cả phân hệ';
  }

  // Xử lý bộ lọc Date Range
  toggleDateDropdown(): void {
    this.showDateDropdown = !this.showDateDropdown;
    if (this.showDateDropdown) {
      this.showModuleDropdown = false;
    }
  }

  selectDatePreset(preset: 'TODAY' | 'LAST_7_DAYS' | 'LAST_30_DAYS' | 'THIS_MONTH' | 'ALL'): void {
    this.filters.datePreset = preset;
    const now = new Date();
    const todayStr = this.formatDateIso(now);

    if (preset === 'TODAY') {
      this.filters.startDate = todayStr;
      this.filters.endDate = todayStr;
    } else if (preset === 'LAST_7_DAYS') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      this.filters.startDate = this.formatDateIso(d);
      this.filters.endDate = todayStr;
    } else if (preset === 'LAST_30_DAYS') {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      this.filters.startDate = this.formatDateIso(d);
      this.filters.endDate = todayStr;
    } else if (preset === 'THIS_MONTH') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      this.filters.startDate = this.formatDateIso(startOfMonth);
      this.filters.endDate = todayStr;
    } else if (preset === 'ALL') {
      this.filters.startDate = '';
      this.filters.endDate = '';
    }

    this.customStartDate = this.filters.startDate;
    this.customEndDate = this.filters.endDate;
    this.filters.page = 1;
    this.showDateDropdown = false;
    this.loadAuditLogs();
  }

  applyCustomDate(): void {
    if (this.customStartDate && this.customEndDate) {
      if (new Date(this.customStartDate) > new Date(this.customEndDate)) {
        alert('Ngày bắt đầu không được lớn hơn ngày kết thúc!');
        return;
      }
    }
    this.filters.datePreset = 'CUSTOM';
    this.filters.startDate = this.customStartDate;
    this.filters.endDate = this.customEndDate;
    this.filters.page = 1;
    this.showDateDropdown = false;
    this.loadAuditLogs();
  }

  getDateFilterLabel(): string {
    switch (this.filters.datePreset) {
      case 'TODAY': return 'Hôm nay';
      case 'LAST_7_DAYS': return '7 ngày qua';
      case 'LAST_30_DAYS': return '30 ngày qua';
      case 'THIS_MONTH': return 'Tháng này';
      case 'CUSTOM':
        if (this.filters.startDate && this.filters.endDate) {
          return `${this.formatDisplayDate(this.filters.startDate)} - ${this.formatDisplayDate(this.filters.endDate)}`;
        }
        return 'Tùy chỉnh ngày';
      default: return 'Tất cả thời gian';
    }
  }

  // Bộ lọc nâng cao Toggle
  toggleAdvancedFilters(): void {
    this.showAdvancedFilters = !this.showAdvancedFilters;
  }

  get activeAdvancedFilterCount(): number {
    let count = 0;
    if (this.filters.actionType !== 'ALL') count++;
    if (this.filters.role !== 'ALL') count++;
    if (this.filters.staffName.trim()) count++;
    if (this.filters.severity !== 'ALL') count++;
    return count;
  }

  get hasActiveFilters(): boolean {
    return !!(
      (this.filters.search && this.filters.search.trim()) ||
      this.filters.datePreset !== 'ALL' ||
      this.filters.module !== 'ALL' ||
      this.activeAdvancedFilterCount > 0
    );
  }

  onCardSeverityFilter(sev: AuditSeverity): void {
    if (this.filters.severity === sev) {
      this.filters.severity = 'ALL';
    } else {
      this.filters.severity = sev;
    }
    this.filters.page = 1;
    this.loadAuditLogs();
  }

  applyAdvancedFilters(): void {
    this.filters.page = 1;
    this.loadAuditLogs();
  }

  resetAllFilters(): void {
    this.filters = {
      search: '',
      datePreset: 'ALL',
      startDate: '',
      endDate: '',
      module: 'ALL',
      actionType: 'ALL',
      role: 'ALL',
      staffName: '',
      severity: 'ALL',
      page: 1,
      limit: 10
    };
    this.customStartDate = '';
    this.customEndDate = '';
    this.loadAuditLogs();
  }

  // Phân trang
  goToPage(p: number): void {
    if (p < 1 || p > this.pagination.totalPages || p === this.pagination.page) return;
    this.filters.page = p;
    this.loadAuditLogs();
  }

  onLimitChange(newLimit: number): void {
    this.filters.limit = Number(newLimit);
    this.filters.page = 1;
    this.loadAuditLogs();
  }

  get pagesArray(): number[] {
    const total = this.pagination.totalPages;
    const current = this.pagination.page;
    const pages: number[] = [];
    const maxVisible = 5;

    let start = Math.max(1, current - 2);
    let end = Math.min(total, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  // Xem chi tiết Log Modal
  openDetailModal(log: AuditLogItem): void {
    this.selectedLog = log;
    this.detailViewMode = 'visual';
    this.showDetailModal = true;
  }

  closeDetailModal(): void {
    this.showDetailModal = false;
    this.selectedLog = null;
  }

  copyLogCode(code: string, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    navigator.clipboard.writeText(code).then(() => {
      this.copiedLogCode = code;
      setTimeout(() => {
        if (this.copiedLogCode === code) {
          this.copiedLogCode = null;
        }
      }, 2000);
    });
  }

  // Helper render badge CSS class
  getActionBadgeClass(action: string): string {
    const act = (action || '').toUpperCase();
    if (act.includes('CREATE') || act.includes('TẠO')) return 'badge-action-create';
    if (act.includes('UPDATE') || act.includes('CẬP NHẬT')) return 'badge-action-update';
    if (act.includes('DELETE') || act.includes('XÓA')) return 'badge-action-delete';
    if (act.includes('APPROVE') || act.includes('DUYỆT')) return 'badge-action-approve';
    if (act.includes('AUTH') || act.includes('LOGIN') || act.includes('LOGOUT') || act.includes('ĐĂNG')) return 'badge-action-auth';
    return 'badge-action-default';
  }

  getSeverityBadgeClass(severity: string): string {
    const sev = (severity || '').toUpperCase();
    if (sev === 'CRITICAL' || sev === 'DANGER') return 'badge-severity-critical';
    if (sev === 'WARNING') return 'badge-severity-warning';
    return 'badge-severity-info';
  }

  getSeverityIcon(severity: string): any {
    const sev = (severity || '').toUpperCase();
    if (sev === 'CRITICAL') return this.icons.ShieldAlert;
    if (sev === 'WARNING') return this.icons.AlertTriangle;
    return this.icons.Info;
  }

  getModuleIcon(module: string): any {
    const mod = (module || '').toUpperCase();
    if (mod.includes('ORDER')) return this.icons.ShoppingCart;
    if (mod.includes('PRODUCT')) return this.icons.Package;
    if (mod.includes('INVENTORY')) return this.icons.Warehouse;
    if (mod.includes('CUSTOMER')) return this.icons.Users;
    if (mod.includes('SYSTEM')) return this.icons.ShieldCheck;
    return this.icons.Layers;
  }

  getActorRoleBadgeClass(role: string): string {
    const r = (role || '').toUpperCase();
    if (r.includes('ADMIN')) return 'role-badge-admin';
    if (r.includes('WAREHOUSE') || r.includes('KHO')) return 'role-badge-warehouse';
    if (r.includes('SALE')) return 'role-badge-sale';
    if (r.includes('ACCOUNT') || r.includes('TOÁN')) return 'role-badge-accountant';
    return 'role-badge-default';
  }

  getRoleLabel(role: string): string {
    const r = (role || '').toUpperCase();
    if (r.includes('ADMIN')) return 'Quản trị viên';
    if (r.includes('WAREHOUSE') || r.includes('KHO')) return 'Thủ kho';
    if (r.includes('SALE')) return 'Nhân viên Sale';
    if (r.includes('ACCOUNT') || r.includes('TOÁN')) return 'Kế toán';
    if (r.includes('CONTENT')) return 'Biên tập viên';
    return role || 'Nhân viên';
  }

  formatTimestamp(ts: string): string {
    if (!ts) return '—';
    try {
      const d = new Date(ts);
      if (isNaN(d.getTime())) return ts;
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      const seconds = String(d.getSeconds()).padStart(2, '0');
      return `${day}/${month}/${year} - ${hours}:${minutes}:${seconds}`;
    } catch {
      return ts;
    }
  }

  getActorInitial(name: string): string {
    if (!name) return 'U';
    const words = name.trim().split(/\s+/);
    if (words.length === 1) return words[0].charAt(0).toUpperCase();
    return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
  }

  // Parse Diff các trường thay đổi giữa old_value và new_value
  getDiffEntries(oldVal: any, newVal: any): Array<{ key: string; label: string; oldStr: string; newStr: string; isChanged: boolean }> {
    const results: Array<{ key: string; label: string; oldStr: string; newStr: string; isChanged: boolean }> = [];
    const oldObj = (oldVal && typeof oldVal === 'object') ? oldVal : {};
    const newObj = (newVal && typeof newVal === 'object') ? newVal : {};

    const allKeys = Array.from(new Set([...Object.keys(oldObj), ...Object.keys(newObj)]));

    if (allKeys.length === 0) {
      if (oldVal !== undefined || newVal !== undefined) {
        results.push({
          key: 'value',
          label: 'Giá trị',
          oldStr: oldVal !== undefined ? JSON.stringify(oldVal) : '(Trống)',
          newStr: newVal !== undefined ? JSON.stringify(newVal) : '(Trống)',
          isChanged: oldVal !== newVal
        });
      }
      return results;
    }

    for (const key of allKeys) {
      const vOld = oldObj[key];
      const vNew = newObj[key];
      const strOld = vOld !== undefined ? (typeof vOld === 'object' ? JSON.stringify(vOld) : String(vOld)) : '—';
      const strNew = vNew !== undefined ? (typeof vNew === 'object' ? JSON.stringify(vNew) : String(vNew)) : '—';
      const isChanged = strOld !== strNew;

      results.push({
        key,
        label: this.formatFieldLabel(key),
        oldStr: strOld,
        newStr: strNew,
        isChanged
      });
    }

    return results;
  }

  formatFieldLabel(key: string): string {
    const map: Record<string, string> = {
      status: 'Trạng thái',
      old_status: 'Trạng thái cũ',
      new_status: 'Trạng thái mới',
      carrier: 'Đơn vị vận chuyển',
      tracking_number: 'Mã vận đơn',
      reason: 'Lý do thao tác',
      price: 'Giá bán',
      stock: 'Số lượng tồn kho',
      notes: 'Ghi chú',
      action: 'Hành động',
      deposit_amount: 'Tiền đặt cọc',
      total_amount: 'Tổng tiền',
      ip: 'Địa chỉ IP',
      role: 'Vai trò'
    };
    return map[key] || key;
  }

  formatJson(obj: any): string {
    try {
      return JSON.stringify(obj, null, 2);
    } catch {
      return String(obj);
    }
  }

  // Export CSV
  exportToCsv(): void {
    if (!this.logs || this.logs.length === 0) {
      alert('Không có dữ liệu audit log để xuất file!');
      return;
    }

    const headers = ['Mã Sự Kiện', 'Thời Gian', 'Người Thực Hiện', 'Mã NV', 'Vai Trò', 'Hành Động', 'Phân Hệ', 'Đối Tượng', 'Mức Độ', 'Mô Tả', 'IP'];
    const rows = this.logs.map(log => [
      `"${log.log_code || log.id}"`,
      `"${log.timestamp}"`,
      `"${log.actor_name}"`,
      `"${log.actor_id || ''}"`,
      `"${log.actor_role}"`,
      `"${log.action_label || log.action}"`,
      `"${log.module_label || log.module}"`,
      `"${log.target_name || log.target_id || ''}"`,
      `"${log.severity}"`,
      `"${(log.description || '').replace(/"/g, '""')}"`,
      `"${log.ip_address || ''}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `DCOR_Audit_Logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  private formatDateIso(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private formatDisplayDate(dateStr: string): string {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  }
}

export { AuditLogComponent as ActivityComponent };
