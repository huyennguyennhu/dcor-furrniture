import { Component, OnInit, OnDestroy, HostListener, ElementRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { 
  LucideAngularModule,
  Activity, Search, Calendar, Filter, SlidersHorizontal, RotateCcw, Download,
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
    Activity, Search, Calendar, Filter, SlidersHorizontal, RotateCcw, Download,
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
  showDateDropdown = false;
  showModuleDropdown = false;
  showActionDropdown = false;
  showRoleDropdown = false;
  showSeverityDropdown = false;
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

  // Danh mục Options Phân hệ thực tế (không kèm tiếng Anh trong ngoặc đơn)
  moduleOptions: ModuleOption[] = [
    { key: 'ALL', label: 'Tất cả phân hệ', iconName: 'Layers' },
    { key: 'ORDERS', label: 'Quản lý Đơn hàng', iconName: 'ShoppingCart' },
    { key: 'PRODUCTS', label: 'Quản lý Sản phẩm', iconName: 'Package' },
    { key: 'INVENTORY', label: 'Quản lý Kho & Kiểm kê', iconName: 'Warehouse' },
    { key: 'CUSTOMERS', label: 'Quản lý Khách hàng', iconName: 'Users' },
    { key: 'SYSTEM', label: 'Phân quyền & Hệ thống', iconName: 'ShieldCheck' }
  ];

  get MODULE_OPTIONS(): ModuleOption[] {
    return this.moduleOptions;
  }

  readonly ACTION_OPTIONS: ActionOption[] = [
    { key: 'ALL', label: 'Tất cả hành động', badgeClass: 'badge-gray' },
    { key: 'CREATE', label: 'Tạo mới', badgeClass: 'badge-emerald' },
    { key: 'UPDATE', label: 'Cập nhật', badgeClass: 'badge-blue' },
    { key: 'DELETE', label: 'Xóa', badgeClass: 'badge-rose' },
    { key: 'AUTH', label: 'Đăng nhập / Đăng xuất', badgeClass: 'badge-purple' },
    { key: 'APPROVE', label: 'Phê duyệt', badgeClass: 'badge-amber' }
  ];

  readonly ROLE_OPTIONS: RoleOption[] = [
    { key: 'ALL', label: 'Tất cả vai trò' },
    { key: 'ADMIN', label: 'Quản trị viên' },
    { key: 'WAREHOUSE', label: 'Thủ kho' },
    { key: 'SALES', label: 'Nhân viên Sale' },
    { key: 'ACCOUNTANT', label: 'Kế toán' },
    { key: 'CONTENT', label: 'Biên tập viên' }
  ];

  readonly SEVERITY_OPTIONS: SeverityOption[] = [
    { key: 'ALL', label: 'Tất cả mức độ', badgeClass: 'badge-gray' },
    { key: 'INFO', label: 'Thông thường', desc: 'Đăng nhập, xem báo cáo, tra cứu dữ liệu', badgeClass: 'badge-info' },
    { key: 'WARNING', label: 'Cảnh báo', desc: 'Nhập sai mật khẩu 3 lần, xuất kho vượt tồn khả dụng', badgeClass: 'badge-warning' },
    { key: 'CRITICAL', label: 'Nguy hiểm', desc: 'Xóa sản phẩm, sửa cấu hình thanh toán, sửa tồn trực tiếp', badgeClass: 'badge-danger' }
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

    this.loadModules();
    this.loadAuditLogs();
  }

  // Tải danh sách phân hệ thực tế từ backend
  loadModules(): void {
    this.auditLogService.getAuditLogModules().subscribe({
      next: (res) => {
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          this.applyLoadedModules(res.data);
        }
      },
      error: (err) => {
        console.warn('Không thể tải danh sách phân hệ động, dùng danh sách mặc định:', err);
      }
    });
  }

  // Áp dụng danh sách phân hệ thực tế vào bộ lọc (lấy đúng tên, không có tiếng Anh trong ngoặc)
  applyLoadedModules(data: { key: string; label: string; count?: number }[]): void {
    const list: ModuleOption[] = [
      { key: 'ALL', label: 'Tất cả phân hệ', iconName: 'Layers' }
    ];

    for (const item of data) {
      if (!item.key || item.key === 'ALL') continue;
      const clean = this.cleanLabelText(item.label || item.key);
      list.push({
        key: item.key,
        label: clean,
        iconName: this.getIconNameForModule(item.key)
      });
    }

    this.moduleOptions = list;
  }

  // Tiện ích làm sạch tên nhãn phân hệ (bỏ hoàn toàn tiếng Anh hoặc dấu ngoặc thừa)
  cleanLabelText(text: string): string {
    if (!text) return '';
    let cleaned = text.replace(/\s*\([^)]*\)/g, '').trim();
    cleaned = cleaned.replace(/\s*\/\s*Nội thất/gi, '');
    cleaned = cleaned.replace(/\s*\/\s*Cấu hình/gi, '');
    return cleaned || text;
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
      this.closeAllDropdowns();
    } else {
      if (!target.closest('.date-dropdown-wrapper')) this.showDateDropdown = false;
      if (!target.closest('.module-dropdown-wrapper')) this.showModuleDropdown = false;
      if (!target.closest('.action-dropdown-wrapper')) this.showActionDropdown = false;
      if (!target.closest('.role-dropdown-wrapper')) this.showRoleDropdown = false;
      if (!target.closest('.severity-dropdown-wrapper')) this.showSeverityDropdown = false;
    }
  }

  closeAllDropdowns(): void {
    this.showDateDropdown = false;
    this.showModuleDropdown = false;
    this.showActionDropdown = false;
    this.showRoleDropdown = false;
    this.showSeverityDropdown = false;
  }

  toggleDropdown(name: 'date' | 'module' | 'action' | 'role' | 'severity', event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    const current = {
      date: this.showDateDropdown,
      module: this.showModuleDropdown,
      action: this.showActionDropdown,
      role: this.showRoleDropdown,
      severity: this.showSeverityDropdown
    };
    this.closeAllDropdowns();
    if (name === 'date') this.showDateDropdown = !current.date;
    if (name === 'module') this.showModuleDropdown = !current.module;
    if (name === 'action') this.showActionDropdown = !current.action;
    if (name === 'role') this.showRoleDropdown = !current.role;
    if (name === 'severity') this.showSeverityDropdown = !current.severity;
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
          if (res.modules && Array.isArray(res.modules) && res.modules.length > 0) {
            this.applyLoadedModules(res.modules);
          }
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
  toggleModuleDropdown(event?: Event): void {
    this.toggleDropdown('module', event);
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

  // Xử lý bộ lọc Action (Loại hành động)
  selectAction(actKey: AuditAction): void {
    this.filters.actionType = actKey;
    this.filters.page = 1;
    this.showActionDropdown = false;
    this.loadAuditLogs();
  }

  getSelectedActionLabel(): string {
    const found = this.ACTION_OPTIONS.find(a => a.key === this.filters.actionType);
    return found ? found.label : 'Tất cả hành động';
  }

  // Xử lý bộ lọc Role (Vai trò)
  selectRole(roleKey: AuditRole): void {
    this.filters.role = roleKey;
    this.filters.page = 1;
    this.showRoleDropdown = false;
    this.loadAuditLogs();
  }

  getSelectedRoleLabel(): string {
    const found = this.ROLE_OPTIONS.find(r => r.key === this.filters.role);
    return found ? found.label : 'Tất cả vai trò';
  }

  // Xử lý bộ lọc Severity (Mức độ nghiêm trọng)
  selectSeverity(sevKey: AuditSeverity | 'ALL'): void {
    this.filters.severity = sevKey;
    this.filters.page = 1;
    this.showSeverityDropdown = false;
    this.loadAuditLogs();
  }

  getSelectedSeverityLabel(): string {
    const found = this.SEVERITY_OPTIONS.find(s => s.key === this.filters.severity);
    return found ? found.label : 'Tất cả mức độ';
  }

  // Xử lý bộ lọc Date Range
  toggleDateDropdown(event?: Event): void {
    this.toggleDropdown('date', event);
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
    if (this.filters.severity !== 'ALL') count++;
    if (this.filters.staffName.trim()) count++;
    return count;
  }

  get hasActiveFilters(): boolean {
    return !!(
      (this.filters.search && this.filters.search.trim()) ||
      this.filters.datePreset !== 'ALL' ||
      this.filters.module !== 'ALL' ||
      this.filters.actionType !== 'ALL' ||
      this.filters.role !== 'ALL' ||
      this.filters.severity !== 'ALL' ||
      (this.filters.staffName && this.filters.staffName.trim())
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
    this.closeAllDropdowns();
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
    if (mod.includes('ORDER') || mod.includes('ĐƠN')) return this.icons.ShoppingCart;
    if (mod.includes('PRODUCT') || mod.includes('SẢN PHẨM')) return this.icons.Package;
    if (mod.includes('INVENTORY') || mod.includes('KHO')) return this.icons.Warehouse;
    if (mod.includes('CUSTOMER') || mod.includes('KHÁCH')) return this.icons.Users;
    if (mod.includes('SYSTEM') || mod.includes('HỆ THỐNG')) return this.icons.ShieldCheck;
    if (mod.includes('STAFF') || mod.includes('NHÂN SỰ')) return this.icons.User;
    if (mod.includes('REPORT') || mod.includes('BÁO CÁO')) return this.icons.FileText;
    return this.icons.Layers;
  }

  getIconNameForModule(module: string): string {
    const mod = (module || '').toUpperCase();
    if (mod.includes('ORDER') || mod.includes('ĐƠN')) return 'ShoppingCart';
    if (mod.includes('PRODUCT') || mod.includes('SẢN PHẨM')) return 'Package';
    if (mod.includes('INVENTORY') || mod.includes('KHO')) return 'Warehouse';
    if (mod.includes('CUSTOMER') || mod.includes('KHÁCH')) return 'Users';
    if (mod.includes('SYSTEM') || mod.includes('HỆ THỐNG')) return 'ShieldCheck';
    if (mod.includes('STAFF') || mod.includes('NHÂN SỰ')) return 'User';
    if (mod.includes('REPORT') || mod.includes('BÁO CÁO')) return 'FileText';
    return 'Layers';
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
