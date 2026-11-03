import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import {
  LucideAngularModule,
  Building2,
  Warehouse,
  ArrowUpRight,
  ArrowDownRight,
  ClipboardList,
  Percent,
  Plus,
  Pencil,
  Trash2,
  Search,
  Check,
  CheckCircle2,
  AlertCircle,
  X,
  ChevronDown,
  Star,
  SlidersHorizontal,
  FileText,
  ShieldAlert,
  Info,
  RotateCcw,
  Layers,
  ArrowLeft,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  Square,
  CheckSquare,
  Loader2
} from 'lucide-angular';
import { environment } from '../../../../../../environments/environment';

export interface WarehouseItem {
  id: string;
  code: string;
  name: string;
  type: 'CENTRAL_WAREHOUSE' | 'REGIONAL_WAREHOUSE' | 'SHOWROOM';
  typeName?: string;
  address: string;
  phone?: string;
  managerName?: string;
  isActive: boolean;
  isDefault: boolean;
  stockSkusCount?: number;
  transactionCount?: number;
  hasTransactions?: boolean;
}

export interface ReasonItem {
  id: string;
  type: 'EXPORT' | 'IMPORT' | 'AUDIT';
  reason: string;
  prefix: string;
  requiresPartner: boolean;
  partnerLabel?: string | null;
  isActive: boolean;
  isSystem: boolean;
}

export interface TaxRateItem {
  id: string;
  code: string;
  name: string;
  rate: number;
  description?: string;
  isDefault: boolean;
  isActive: boolean;
}

@Component({
  selector: 'app-inventory-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LucideAngularModule],
  templateUrl: './inventory-settings.html',
  styleUrls: ['./inventory-settings.css']
})
export class InventorySettingsComponent implements OnInit {
  icons = {
    Building2,
    Warehouse,
    ArrowUpRight,
    ArrowDownRight,
    ClipboardList,
    Percent,
    Plus,
    Pencil,
    Trash2,
    Search,
    Check,
    CheckCircle2,
    AlertCircle,
    X,
    ChevronDown,
    Star,
    SlidersHorizontal,
    FileText,
    ShieldAlert,
    Info,
    RotateCcw,
    Layers,
    ArrowLeft,
    ChevronsLeft,
    ChevronLeft,
    ChevronRight,
    ChevronsRight,
    Square,
    CheckSquare,
    Loader2
  };

  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // Tab hiện tại: 1 (Kho), 2 (Lý do Xuất), 3 (Lý do Nhập), 4 (Lý do Kiểm kê), 5 (VAT)
  activeTab: 1 | 2 | 3 | 4 | 5 = 1;
  isLoading = true;

  // Search filter
  searchTerm = '';

  // Pagination (10 hàng mỗi trang)
  readonly pageSize = 10;
  whCurrentPage = 1;
  reasonCurrentPage = 1;
  vatCurrentPage = 1;
  whSortColumn: string = '';
  whSortDirection: 'asc' | 'desc' = 'asc';

  // Data
  warehouses: WarehouseItem[] = [];
  warehouseSummary = {
    totalCount: 0,
    activeCount: 0,
    inactiveCount: 0,
    centralCount: 0,
    showroomCount: 0
  };

  reasons: ReasonItem[] = [];
  taxRates: TaxRateItem[] = [];
  generalSettings = {
    pricingTaxMode: 'EXCLUSIVE',
    autoZeroTaxInternal: true
  };
  isSavingGeneralSettings = false;

  // Trạng thái đang khóa và tải toggle switch cho từng hàng
  togglingItemIds = new Set<string>();

  isItemToggling(id: string): boolean {
    return this.togglingItemIds.has(id);
  }

  // Toast notification
  toastMessage = '';
  toastSubMessage = '';
  toastType: 'success' | 'warning' | 'error' | 'info' = 'success';
  showToast = false;
  toastTimer: any = null;

  triggerToast(message: string, subMessage: string = '', type: 'success' | 'warning' | 'error' | 'info' = 'success', durationMs = 3000) {
    this.pauseToastTimer();
    this.toastMessage = message;
    this.toastSubMessage = subMessage;
    this.toastType = type;
    this.showToast = true;
    this.cdr.markForCheck();
    this.toastTimer = setTimeout(() => {
      this.closeToast();
    }, durationMs);
  }

  pauseToastTimer(): void {
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
      this.toastTimer = null;
    }
  }

  resumeToastTimer(): void {
    if (!this.showToast) return;
    this.pauseToastTimer();
    this.toastTimer = setTimeout(() => {
      this.closeToast();
    }, 3000);
  }

  closeToast() {
    this.pauseToastTimer();
    this.showToast = false;
    this.cdr.markForCheck();
  }

  ngOnInit(): void {
    // 1. Phục hồi tab đang đứng từ URL query param (?tab=...) hoặc localStorage
    const queryTab = Number(this.route.snapshot.queryParams['tab']);
    let initialTab: 1 | 2 | 3 | 4 | 5 = 1;

    if ([1, 2, 3, 4, 5].includes(queryTab)) {
      initialTab = queryTab as 1 | 2 | 3 | 4 | 5;
    } else {
      try {
        const savedTab = Number(localStorage.getItem('dcor_inventory_settings_active_tab'));
        if ([1, 2, 3, 4, 5].includes(savedTab)) {
          initialTab = savedTab as 1 | 2 | 3 | 4 | 5;
        }
      } catch (e) {}
    }

    this.activeTab = initialTab;

    // Đồng bộ tab lên URL nếu chưa có
    if (!this.route.snapshot.queryParams['tab'] && initialTab !== 1) {
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { tab: initialTab },
        queryParamsHandling: 'merge',
        replaceUrl: true
      });
    }

    // Lắng nghe thay đổi queryParams khi user ấn Back / Forward
    this.route.queryParams.subscribe(params => {
      const tab = Number(params['tab']);
      if ([1, 2, 3, 4, 5].includes(tab) && tab !== this.activeTab) {
        this.activeTab = tab as 1 | 2 | 3 | 4 | 5;
        try {
          localStorage.setItem('dcor_inventory_settings_active_tab', String(tab));
        } catch (e) {}
        this.cdr.markForCheck();
      }
    });

    this.loadAllData();
  }

  setTab(tab: 1 | 2 | 3 | 4 | 5) {
    this.activeTab = tab;
    try {
      localStorage.setItem('dcor_inventory_settings_active_tab', String(tab));
    } catch (e) {}

    // Lưu vào query param URL để khi F5 hoặc chia sẻ link vẫn giữ nguyên tab
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab },
      queryParamsHandling: 'merge',
      replaceUrl: true
    });

    this.searchTerm = '';
    this.whCurrentPage = 1;
    this.reasonCurrentPage = 1;
    this.vatCurrentPage = 1;
    this.cdr.markForCheck();
  }

  onSearchChange() {
    this.whCurrentPage = 1;
    this.reasonCurrentPage = 1;
    this.vatCurrentPage = 1;
    this.cdr.markForCheck();
  }

  loadAllData() {
    this.isLoading = true;
    this.cdr.markForCheck();

    forkJoin({
      warehouses: this.http.get<any>(`${environment.apiUrl}/admin/inventory/settings/warehouses`),
      reasons: this.http.get<any>(`${environment.apiUrl}/admin/inventory/settings/reasons`),
      taxRates: this.http.get<any>(`${environment.apiUrl}/admin/inventory/settings/tax-rates`)
    }).subscribe({
      next: (res) => {
        if (res.warehouses && res.warehouses.warehouses) {
          this.warehouses = res.warehouses.warehouses;
          this.warehouseSummary = res.warehouses.summary || this.warehouseSummary;
        }
        if (res.reasons && res.reasons.reasons) {
          this.reasons = res.reasons.reasons;
        }
        if (res.taxRates && res.taxRates.taxRates) {
          this.taxRates = res.taxRates.taxRates;
        }
        if (res.taxRates && res.taxRates.settings) {
          this.generalSettings = {
            pricingTaxMode: res.taxRates.settings.pricingTaxMode || 'EXCLUSIVE',
            autoZeroTaxInternal: Boolean(res.taxRates.settings.autoZeroTaxInternal)
          };
        }
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading inventory settings:', err);
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  // =========================================================================
  // TAB 1: 🏬 WAREHOUSES
  // =========================================================================
  showWarehouseModal = false;
  isEditWarehouse = false;
  editingWarehouseId = '';
  isSavingWarehouse = false;
  isDeletingWarehouse = false;
  isUpdatingDefaultWh = false;

  warehouseForm = {
    code: '',
    name: '',
    type: 'REGIONAL_WAREHOUSE' as 'CENTRAL_WAREHOUSE' | 'REGIONAL_WAREHOUSE' | 'SHOWROOM',
    address: '',
    phone: '',
    managerName: '',
    isDefault: false
  };

  showDeleteWarehouseWarningModal = false;
  deleteWarningWh: WarehouseItem | null = null;
  deleteWarningMessage = '';

  showDeleteWarehouseConfirmModal = false;
  deleteConfirmWh: WarehouseItem | null = null;

  showWarehouseTypeDropdown = false;
  warehouseTypeOptions: { value: 'CENTRAL_WAREHOUSE' | 'REGIONAL_WAREHOUSE' | 'SHOWROOM'; label: string }[] = [
    { value: 'CENTRAL_WAREHOUSE', label: 'Kho tổng (Trung tâm điều phối chính)' },
    { value: 'REGIONAL_WAREHOUSE', label: 'Kho khu vực (Kho vệ tinh các tỉnh/vùng)' },
    { value: 'SHOWROOM', label: 'Showroom (Cửa hàng trưng bày & bán lẻ)' }
  ];

  getWarehouseTypeLabel(type: string): string {
    const opt = this.warehouseTypeOptions.find(o => o.value === type);
    return opt ? opt.label : 'Chọn phân loại kho';
  }

  selectWarehouseType(type: 'CENTRAL_WAREHOUSE' | 'REGIONAL_WAREHOUSE' | 'SHOWROOM') {
    this.warehouseForm.type = type;
    this.showWarehouseTypeDropdown = false;
    this.cdr.markForCheck();
  }

  openAddWarehouseModal() {
    this.isEditWarehouse = false;
    this.editingWarehouseId = '';
    this.showWarehouseTypeDropdown = false;
    this.isSavingWarehouse = false;
    this.warehouseForm = {
      code: '',
      name: '',
      type: 'REGIONAL_WAREHOUSE',
      address: '',
      phone: '',
      managerName: '',
      isDefault: this.warehouses.length === 0
    };
    this.showWarehouseModal = true;
    this.cdr.markForCheck();
  }

  openEditWarehouseModal(wh: WarehouseItem) {
    this.isEditWarehouse = true;
    this.editingWarehouseId = wh.id;
    this.showWarehouseTypeDropdown = false;
    this.isSavingWarehouse = false;
    this.warehouseForm = {
      code: wh.code,
      name: wh.name,
      type: wh.type,
      address: wh.address,
      phone: wh.phone || '',
      managerName: wh.managerName || '',
      isDefault: wh.isDefault
    };
    this.showWarehouseModal = true;
    this.cdr.markForCheck();
  }

  closeWarehouseModal() {
    this.showWarehouseModal = false;
    this.showWarehouseTypeDropdown = false;
    this.isSavingWarehouse = false;
    this.cdr.markForCheck();
  }

  saveWarehouse() {
    if (this.isSavingWarehouse) return;

    if (!this.warehouseForm.code.trim()) {
      return this.triggerToast('Vui lòng nhập Mã kho', '', 'warning');
    }
    if (!this.warehouseForm.name.trim()) {
      return this.triggerToast('Vui lòng nhập Tên kho', '', 'warning');
    }
    if (!this.warehouseForm.address.trim()) {
      return this.triggerToast('Vui lòng nhập Địa chỉ chi tiết', '', 'warning');
    }

    this.isSavingWarehouse = true;
    this.cdr.markForCheck();

    const payload = {
      ...this.warehouseForm,
      code: this.warehouseForm.code.trim().toUpperCase().replace(/\s+/g, '_'),
      name: this.warehouseForm.name.trim(),
      address: this.warehouseForm.address.trim(),
      phone: this.warehouseForm.phone.trim(),
      managerName: this.warehouseForm.managerName.trim()
    };

    if (this.isEditWarehouse) {
      this.http.put<any>(`${environment.apiUrl}/admin/inventory/settings/warehouses/${this.editingWarehouseId}`, payload).subscribe({
        next: (res) => {
          this.isSavingWarehouse = false;
          this.triggerToast('Cập nhật điểm kho thành công!', '', 'success');
          this.closeWarehouseModal();
          this.loadAllData();
        },
        error: (err) => {
          this.isSavingWarehouse = false;
          this.triggerToast('Lỗi khi cập nhật kho', err.error?.error || err.message, 'error');
          this.cdr.markForCheck();
        }
      });
    } else {
      this.http.post<any>(`${environment.apiUrl}/admin/inventory/settings/warehouses`, payload).subscribe({
        next: (res) => {
          this.isSavingWarehouse = false;
          this.triggerToast('Thêm điểm kho mới thành công!', '', 'success');
          this.closeWarehouseModal();
          this.loadAllData();
        },
        error: (err) => {
          this.isSavingWarehouse = false;
          this.triggerToast('Lỗi khi tạo kho mới', err.error?.error || err.message, 'error');
          this.cdr.markForCheck();
        }
      });
    }
  }

  toggleWarehouseActive(wh: WarehouseItem) {
    if (this.togglingItemIds.has(wh.id)) return;

    if (wh.isDefault && wh.isActive) {
      return this.triggerToast(
        'Không thể tắt Kho Mặc Định',
        'Vui lòng đặt kho khác làm mặc định trước khi tắt kho này!',
        'warning'
      );
    }

    this.togglingItemIds.add(wh.id);
    // Optimistic toggle: đổi ngay trên UI để công tắc không bị bật ngược lại
    wh.isActive = !wh.isActive;
    this.warehouseSummary.activeCount += wh.isActive ? 1 : -1;
    this.warehouseSummary.inactiveCount = this.warehouseSummary.totalCount - this.warehouseSummary.activeCount;
    this.cdr.markForCheck();

    this.http.patch<any>(`${environment.apiUrl}/admin/inventory/settings/warehouses/${wh.id}/toggle`, {}).subscribe({
      next: (res) => {
        this.togglingItemIds.delete(wh.id);
        if (res.warehouse && typeof res.warehouse.isActive === 'boolean') {
          wh.isActive = res.warehouse.isActive;
        }
        this.triggerToast(res.message || 'Thay đổi trạng thái kho thành công!', '', 'success');
        this.cdr.markForCheck();
      },
      error: (err) => {
        // Rollback nếu có lỗi
        wh.isActive = !wh.isActive;
        this.warehouseSummary.activeCount += wh.isActive ? 1 : -1;
        this.warehouseSummary.inactiveCount = this.warehouseSummary.totalCount - this.warehouseSummary.activeCount;
        this.togglingItemIds.delete(wh.id);
        this.triggerToast('Không thể đổi trạng thái kho', err.error?.error || err.message, 'error');
        this.cdr.markForCheck();
      }
    });
  }

  setWarehouseAsDefault(wh: WarehouseItem) {
    if (wh.isDefault || this.isUpdatingDefaultWh) return;
    this.isUpdatingDefaultWh = true;
    this.cdr.markForCheck();
    this.http.put<any>(`${environment.apiUrl}/admin/inventory/settings/warehouses/${wh.id}`, {
      ...wh,
      isDefault: true
    }).subscribe({
      next: () => {
        this.isUpdatingDefaultWh = false;
        this.warehouses.forEach(w => w.isDefault = (w.id === wh.id));
        this.triggerToast(`Đã đặt "${wh.name}" làm Kho Mặc Định!`, '', 'success');
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.isUpdatingDefaultWh = false;
        this.triggerToast('Lỗi khi đặt kho mặc định', err.error?.error || err.message, 'error');
        this.cdr.markForCheck();
      }
    });
  }

  handleDeleteWarehouse(wh: WarehouseItem) {
    if (wh.isDefault) {
      return this.triggerToast('Không thể xóa Kho Mặc Định', 'Vui lòng chỉ định một kho khác làm mặc định trước.', 'warning');
    }

    if (wh.hasTransactions || (wh.transactionCount && wh.transactionCount > 0)) {
      this.deleteWarningWh = wh;
      this.deleteWarningMessage = `Kho "${wh.name}" (${wh.code}) đã phát sinh ${wh.transactionCount} chứng từ/giao dịch trong hệ thống. Để bảo toàn số liệu kế toán và lịch sử kho bãi, không thể xóa vĩnh viễn. Bạn có thể chuyển sang trạng thái "Tạm dừng hoạt động" để ẩn kho này khỏi các form làm phiếu.`;
      this.showDeleteWarehouseWarningModal = true;
      this.cdr.markForCheck();
      return;
    }

    this.deleteConfirmWh = wh;
    this.showDeleteWarehouseConfirmModal = true;
    this.cdr.markForCheck();
  }

  confirmSafeDeactivateWh() {
    if (!this.deleteWarningWh || this.isDeletingWarehouse) return;
    this.isDeletingWarehouse = true;
    this.cdr.markForCheck();
    const wh = this.deleteWarningWh;
    if (wh.isActive) {
      this.toggleWarehouseActive(wh);
    }
    setTimeout(() => {
      this.isDeletingWarehouse = false;
      this.showDeleteWarehouseWarningModal = false;
      this.deleteWarningWh = null;
      this.cdr.markForCheck();
    }, 400);
  }

  confirmDeleteWarehouse() {
    if (!this.deleteConfirmWh || this.isDeletingWarehouse) return;
    this.isDeletingWarehouse = true;
    this.cdr.markForCheck();
    const whId = this.deleteConfirmWh.id;
    this.http.delete<any>(`${environment.apiUrl}/admin/inventory/settings/warehouses/${whId}`).subscribe({
      next: (res) => {
        this.isDeletingWarehouse = false;
        this.showDeleteWarehouseConfirmModal = false;
        this.deleteConfirmWh = null;
        this.triggerToast(res.message || 'Xóa điểm kho thành công!', '', 'success');
        this.loadAllData();
      },
      error: (err) => {
        this.isDeletingWarehouse = false;
        this.showDeleteWarehouseConfirmModal = false;
        this.triggerToast('Lỗi khi xóa kho', err.error?.error || err.message, 'error');
        this.cdr.markForCheck();
      }
    });
  }

  toggleWhSort(column: string): void {
    if (this.whSortColumn === column) {
      this.whSortDirection = this.whSortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.whSortColumn = column;
      this.whSortDirection = 'asc';
    }
    this.whCurrentPage = 1;
    this.cdr.markForCheck();
  }

  getFilteredWarehouses(): WarehouseItem[] {
    let list = this.warehouses;
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase().trim();
      list = this.warehouses.filter(w =>
        w.name.toLowerCase().includes(term) ||
        w.code.toLowerCase().includes(term) ||
        (w.address && w.address.toLowerCase().includes(term)) ||
        (w.managerName && w.managerName.toLowerCase().includes(term)) ||
        (w.phone && w.phone.includes(term))
      );
    }
    if (!this.whSortColumn) return list;
    return [...list].sort((a, b) => {
      let diff = 0;
      if (this.whSortColumn === 'code') {
        diff = a.code.localeCompare(b.code, 'vi');
      } else if (this.whSortColumn === 'name') {
        diff = a.name.localeCompare(b.name, 'vi');
      } else if (this.whSortColumn === 'type') {
        diff = a.type.localeCompare(b.type, 'vi');
      } else if (this.whSortColumn === 'address') {
        diff = (a.address || '').localeCompare(b.address || '', 'vi');
      } else if (this.whSortColumn === 'manager') {
        diff = (a.managerName || '').localeCompare(b.managerName || '', 'vi');
      } else if (this.whSortColumn === 'status') {
        diff = (a.isActive ? 1 : 0) - (b.isActive ? 1 : 0);
      }
      return this.whSortDirection === 'asc' ? diff : -diff;
    });

  }

  // Phân trang Kho (Tab 1)
  get whTotalPages(): number {
    return Math.ceil(this.getFilteredWarehouses().length / this.pageSize) || 1;
  }

  getPaginatedWarehouses(): WarehouseItem[] {
    if (this.whCurrentPage > this.whTotalPages) {
      this.whCurrentPage = this.whTotalPages;
    }
    const start = (this.whCurrentPage - 1) * this.pageSize;
    return this.getFilteredWarehouses().slice(start, start + this.pageSize);
  }

  goToWhPage(page: number) {
    if (page < 1 || page > this.whTotalPages || page === this.whCurrentPage) return;
    this.whCurrentPage = page;
    this.cdr.markForCheck();
  }

  getWhVisiblePages(): number[] {
    return this.calculateVisiblePages(this.whCurrentPage, this.whTotalPages);
  }

  getWhStartIndex(): number {
    if (this.getFilteredWarehouses().length === 0) return 0;
    return (this.whCurrentPage - 1) * this.pageSize + 1;
  }

  getWhEndIndex(): number {
    return Math.min(this.whCurrentPage * this.pageSize, this.getFilteredWarehouses().length);
  }

  // =========================================================================
  // TABS 2, 3, 4: REASONS (EXPORT, IMPORT, AUDIT)
  // =========================================================================
  showReasonModal = false;
  isEditReason = false;
  editingReasonId = '';
  isSavingReason = false;
  isDeletingReason = false;

  reasonForm = {
    type: 'EXPORT' as 'EXPORT' | 'IMPORT' | 'AUDIT',
    reason: '',
    prefix: '',
    requiresPartner: false,
    partnerLabel: 'Khách hàng'
  };

  showDeleteReasonModal = false;
  deleteReasonTarget: ReasonItem | null = null;

  getCurrentTabReasonType(): 'EXPORT' | 'IMPORT' | 'AUDIT' {
    if (this.activeTab === 2) return 'EXPORT';
    if (this.activeTab === 3) return 'IMPORT';
    return 'AUDIT';
  }

  getCurrentReasons(): ReasonItem[] {
    const t = this.getCurrentTabReasonType();
    let list = this.reasons.filter(r => r.type === t);
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase().trim();
      list = list.filter(r =>
        r.reason.toLowerCase().includes(term) ||
        r.prefix.toLowerCase().includes(term) ||
        (r.partnerLabel && r.partnerLabel.toLowerCase().includes(term))
      );
    }
    return list;
  }

  // Phân trang Lý do (Tabs 2, 3, 4)
  get reasonTotalPages(): number {
    return Math.ceil(this.getCurrentReasons().length / this.pageSize) || 1;
  }

  getPaginatedReasons(): ReasonItem[] {
    if (this.reasonCurrentPage > this.reasonTotalPages) {
      this.reasonCurrentPage = this.reasonTotalPages;
    }
    const start = (this.reasonCurrentPage - 1) * this.pageSize;
    return this.getCurrentReasons().slice(start, start + this.pageSize);
  }

  goToReasonPage(page: number) {
    if (page < 1 || page > this.reasonTotalPages || page === this.reasonCurrentPage) return;
    this.reasonCurrentPage = page;
    this.cdr.markForCheck();
  }

  getReasonVisiblePages(): number[] {
    return this.calculateVisiblePages(this.reasonCurrentPage, this.reasonTotalPages);
  }

  getReasonStartIndex(): number {
    if (this.getCurrentReasons().length === 0) return 0;
    return (this.reasonCurrentPage - 1) * this.pageSize + 1;
  }

  getReasonEndIndex(): number {
    return Math.min(this.reasonCurrentPage * this.pageSize, this.getCurrentReasons().length);
  }

  getReasonCount(type: 'EXPORT' | 'IMPORT' | 'AUDIT'): number {
    return this.reasons.filter(r => r.type === type).length;
  }

  getActiveReasonCount(type: 'EXPORT' | 'IMPORT' | 'AUDIT'): number {
    return this.reasons.filter(r => r.type === type && r.isActive).length;
  }

  getPartnerReasonCount(type: 'EXPORT' | 'IMPORT' | 'AUDIT'): number {
    return this.reasons.filter(r => r.type === type && r.requiresPartner).length;
  }

  getActiveTaxCount(): number {
    return this.taxRates.filter(t => t.isActive).length;
  }

  openAddReasonModal() {
    const t = this.getCurrentTabReasonType();
    this.isEditReason = false;
    this.editingReasonId = '';
    this.isSavingReason = false;
    let defaultPrefix = 'PXK-';
    let defaultLabel = 'Khách hàng';
    if (t === 'IMPORT') {
      defaultPrefix = 'PNK-';
      defaultLabel = 'Nhà cung cấp';
    } else if (t === 'AUDIT') {
      defaultPrefix = 'PKK-';
      defaultLabel = '';
    }

    this.reasonForm = {
      type: t,
      reason: '',
      prefix: defaultPrefix,
      requiresPartner: t === 'EXPORT' || t === 'IMPORT',
      partnerLabel: defaultLabel
    };
    this.showReasonModal = true;
    this.cdr.markForCheck();
  }

  openEditReasonModal(r: ReasonItem) {
    this.isEditReason = true;
    this.editingReasonId = r.id;
    this.isSavingReason = false;
    this.reasonForm = {
      type: r.type,
      reason: r.reason,
      prefix: r.prefix,
      requiresPartner: r.requiresPartner,
      partnerLabel: r.partnerLabel || (r.type === 'IMPORT' ? 'Nhà cung cấp' : 'Khách hàng')
    };
    this.showReasonModal = true;
    this.cdr.markForCheck();
  }

  closeReasonModal() {
    this.showReasonModal = false;
    this.isSavingReason = false;
    this.cdr.markForCheck();
  }

  saveReason() {
    if (this.isSavingReason) return;

    if (!this.reasonForm.reason.trim()) {
      return this.triggerToast('Vui lòng nhập Tên lý do', '', 'warning');
    }
    if (!this.reasonForm.prefix.trim()) {
      return this.triggerToast('Vui lòng nhập Tiền tố mã chứng từ (Prefix)', '', 'warning');
    }

    this.isSavingReason = true;
    this.cdr.markForCheck();

    const payload = {
      type: this.reasonForm.type,
      reason: this.reasonForm.reason.trim(),
      prefix: this.reasonForm.prefix.trim().toUpperCase().replace(/\s+/g, '-'),
      requiresPartner: this.reasonForm.type === 'AUDIT' ? false : this.reasonForm.requiresPartner,
      partnerLabel: this.reasonForm.requiresPartner ? (this.reasonForm.partnerLabel || '').trim() : null
    };

    if (this.isEditReason) {
      this.http.put<any>(`${environment.apiUrl}/admin/inventory/settings/reasons/${this.editingReasonId}`, payload).subscribe({
        next: (res) => {
          this.isSavingReason = false;
          this.triggerToast('Cập nhật lý do thành công!', '', 'success');
          this.closeReasonModal();
          this.loadAllData();
        },
        error: (err) => {
          this.isSavingReason = false;
          this.triggerToast('Lỗi khi cập nhật lý do', err.error?.error || err.message, 'error');
          this.cdr.markForCheck();
        }
      });
    } else {
      this.http.post<any>(`${environment.apiUrl}/admin/inventory/settings/reasons`, payload).subscribe({
        next: (res) => {
          this.isSavingReason = false;
          this.triggerToast('Thêm lý do mới thành công!', '', 'success');
          this.closeReasonModal();
          this.loadAllData();
        },
        error: (err) => {
          this.isSavingReason = false;
          this.triggerToast('Lỗi khi tạo lý do', err.error?.error || err.message, 'error');
          this.cdr.markForCheck();
        }
      });
    }
  }

  toggleReasonActive(r: ReasonItem) {
    if (this.togglingItemIds.has(r.id)) return;
    this.togglingItemIds.add(r.id);

    // Optimistic toggle
    r.isActive = !r.isActive;
    this.cdr.markForCheck();

    this.http.patch<any>(`${environment.apiUrl}/admin/inventory/settings/reasons/${r.id}/toggle`, {}).subscribe({
      next: (res) => {
        this.togglingItemIds.delete(r.id);
        if (typeof res.isActive === 'boolean') {
          r.isActive = res.isActive;
        }
        this.triggerToast(res.message || 'Thay đổi trạng thái thành công!', '', 'success');
        this.cdr.markForCheck();
      },
      error: (err) => {
        // Rollback nếu có lỗi
        r.isActive = !r.isActive;
        this.togglingItemIds.delete(r.id);
        this.triggerToast('Không thể đổi trạng thái', err.error?.error || err.message, 'error');
        this.cdr.markForCheck();
      }
    });
  }

  handleDeleteReason(r: ReasonItem) {
    if (r.isSystem) {
      return this.triggerToast(
        'Lý do chuẩn của hệ thống không thể xóa',
        'Bạn có thể gạt công tắc "Tắt" để ẩn khỏi dropdown khi làm phiếu.',
        'warning'
      );
    }
    this.deleteReasonTarget = r;
    this.showDeleteReasonModal = true;
    this.cdr.markForCheck();
  }

  confirmDeleteReason() {
    if (!this.deleteReasonTarget || this.isDeletingReason) return;
    this.isDeletingReason = true;
    this.cdr.markForCheck();
    const rId = this.deleteReasonTarget.id;
    this.http.delete<any>(`${environment.apiUrl}/admin/inventory/settings/reasons/${rId}`).subscribe({
      next: (res) => {
        this.isDeletingReason = false;
        this.showDeleteReasonModal = false;
        this.deleteReasonTarget = null;
        this.triggerToast(res.message || 'Đã xóa lý do thành công!', '', 'success');
        this.loadAllData();
      },
      error: (err) => {
        this.isDeletingReason = false;
        this.showDeleteReasonModal = false;
        this.triggerToast('Lỗi khi xóa lý do', err.error?.error || err.message, 'error');
        this.cdr.markForCheck();
      }
    });
  }

  // =========================================================================
  // TAB 5: 💰 VAT & TAX RATES
  // =========================================================================
  showTaxModal = false;
  isEditTax = false;
  editingTaxId = '';
  isSavingTax = false;
  isDeletingTax = false;
  isUpdatingDefaultTax = false;

  taxForm = {
    code: '',
    name: '',
    rate: 10,
    isKct: false,
    description: '',
    isDefault: false
  };

  showDeleteTaxModal = false;
  deleteTaxTarget: TaxRateItem | null = null;

  openAddTaxModal() {
    this.isEditTax = false;
    this.editingTaxId = '';
    this.isSavingTax = false;
    this.taxForm = {
      code: '',
      name: '',
      rate: 10,
      isKct: false,
      description: '',
      isDefault: this.taxRates.length === 0
    };
    this.showTaxModal = true;
    this.cdr.markForCheck();
  }

  openEditTaxModal(t: TaxRateItem) {
    this.isEditTax = true;
    this.editingTaxId = t.id;
    this.isSavingTax = false;
    this.taxForm = {
      code: t.code,
      name: t.name,
      rate: t.rate,
      isKct: t.code === 'VAT_KCT',
      description: t.description || '',
      isDefault: t.isDefault
    };
    this.showTaxModal = true;
    this.cdr.markForCheck();
  }

  closeTaxModal() {
    this.showTaxModal = false;
    this.isSavingTax = false;
    this.cdr.markForCheck();
  }

  onTaxKctChange() {
    if (this.taxForm.isKct) {
      this.taxForm.rate = 0;
      if (!this.taxForm.code) this.taxForm.code = 'VAT_KCT';
      if (!this.taxForm.name) this.taxForm.name = 'Không chịu thuế (KCT)';
    }
  }

  saveTaxRate() {
    if (this.isSavingTax) return;

    if (!this.taxForm.code.trim()) {
      return this.triggerToast('Vui lòng nhập Mã mức thuế', '', 'warning');
    }
    if (!this.taxForm.name.trim()) {
      return this.triggerToast('Vui lòng nhập Tên hiển thị mức thuế', '', 'warning');
    }
    const rateNum = this.taxForm.isKct ? 0 : Number(this.taxForm.rate);
    if (isNaN(rateNum) || rateNum < 0 || rateNum > 100) {
      return this.triggerToast('Thuế suất phải từ 0% đến 100%', '', 'warning');
    }

    this.isSavingTax = true;
    this.cdr.markForCheck();

    const payload = {
      code: this.taxForm.code.trim().toUpperCase().replace(/\s+/g, '_'),
      name: this.taxForm.name.trim(),
      rate: rateNum,
      description: this.taxForm.description.trim(),
      isDefault: this.taxForm.isDefault
    };

    if (this.isEditTax) {
      this.http.put<any>(`${environment.apiUrl}/admin/inventory/settings/tax-rates/${this.editingTaxId}`, payload).subscribe({
        next: (res) => {
          this.isSavingTax = false;
          this.triggerToast('Cập nhật mức thuế VAT thành công!', '', 'success');
          this.closeTaxModal();
          this.loadAllData();
        },
        error: (err) => {
          this.isSavingTax = false;
          this.triggerToast('Lỗi khi cập nhật mức thuế', err.error?.error || err.message, 'error');
          this.cdr.markForCheck();
        }
      });
    } else {
      this.http.post<any>(`${environment.apiUrl}/admin/inventory/settings/tax-rates`, payload).subscribe({
        next: (res) => {
          this.isSavingTax = false;
          this.triggerToast('Thêm mức thuế VAT mới thành công!', '', 'success');
          this.closeTaxModal();
          this.loadAllData();
        },
        error: (err) => {
          this.isSavingTax = false;
          this.triggerToast('Lỗi khi tạo mức thuế', err.error?.error || err.message, 'error');
          this.cdr.markForCheck();
        }
      });
    }
  }

  setTaxRateAsDefault(t: TaxRateItem) {
    if (t.isDefault || this.isUpdatingDefaultTax) return;
    this.isUpdatingDefaultTax = true;
    this.cdr.markForCheck();
    this.http.patch<any>(`${environment.apiUrl}/admin/inventory/settings/tax-rates/${t.id}/default`, {}).subscribe({
      next: (res) => {
        this.isUpdatingDefaultTax = false;
        this.taxRates.forEach(item => item.isDefault = (item.id === t.id));
        this.triggerToast(res.message || `Đã đặt "${t.name}" làm Thuế suất Mặc định!`, '', 'success');
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.isUpdatingDefaultTax = false;
        this.triggerToast('Lỗi khi đặt thuế mặc định', err.error?.error || err.message, 'error');
        this.cdr.markForCheck();
      }
    });
  }

  toggleTaxRateActive(t: TaxRateItem) {
    if (this.togglingItemIds.has(t.id)) return;

    if (t.isDefault && t.isActive) {
      return this.triggerToast(
        'Không thể tắt Thuế suất Mặc định',
        'Vui lòng đặt mức thuế khác làm mặc định trước khi tắt mức này!',
        'warning'
      );
    }

    this.togglingItemIds.add(t.id);
    // Optimistic toggle
    t.isActive = !t.isActive;
    this.cdr.markForCheck();

    this.http.patch<any>(`${environment.apiUrl}/admin/inventory/settings/tax-rates/${t.id}/toggle`, {}).subscribe({
      next: (res) => {
        this.togglingItemIds.delete(t.id);
        if (typeof res.isActive === 'boolean') {
          t.isActive = res.isActive;
        }
        this.triggerToast(res.message || 'Thay đổi trạng thái thuế thành công!', '', 'success');
        this.cdr.markForCheck();
      },
      error: (err) => {
        // Rollback nếu lỗi
        t.isActive = !t.isActive;
        this.togglingItemIds.delete(t.id);
        this.triggerToast('Không thể đổi trạng thái thuế', err.error?.error || err.message, 'error');
        this.cdr.markForCheck();
      }
    });
  }

  handleDeleteTaxRate(t: TaxRateItem) {
    if (t.isDefault) {
      return this.triggerToast(
        'Không thể xóa Mức thuế Mặc định',
        'Vui lòng chỉ định một mức thuế khác làm mặc định trước.',
        'warning'
      );
    }
    this.deleteTaxTarget = t;
    this.showDeleteTaxModal = true;
    this.cdr.markForCheck();
  }

  confirmDeleteTaxRate() {
    if (!this.deleteTaxTarget || this.isDeletingTax) return;
    this.isDeletingTax = true;
    this.cdr.markForCheck();
    const tId = this.deleteTaxTarget.id;
    this.http.delete<any>(`${environment.apiUrl}/admin/inventory/settings/tax-rates/${tId}`).subscribe({
      next: (res) => {
        this.isDeletingTax = false;
        this.showDeleteTaxModal = false;
        this.deleteTaxTarget = null;
        this.triggerToast(res.message || 'Đã xóa mức thuế VAT thành công!', '', 'success');
        this.loadAllData();
      },
      error: (err) => {
        this.isDeletingTax = false;
        this.showDeleteTaxModal = false;
        this.triggerToast('Lỗi khi xóa mức thuế', err.error?.error || err.message, 'error');
        this.cdr.markForCheck();
      }
    });
  }

  saveGeneralSettingsForm() {
    this.isSavingGeneralSettings = true;
    this.http.post<any>(`${environment.apiUrl}/admin/inventory/settings/general`, this.generalSettings).subscribe({
      next: (res) => {
        this.isSavingGeneralSettings = false;
        this.triggerToast('Đã lưu cấu hình quy tắc thuế & kho!', '', 'success');
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.isSavingGeneralSettings = false;
        this.triggerToast('Lỗi khi lưu cấu hình', err.error?.error || err.message, 'error');
        this.cdr.markForCheck();
      }
    });
  }

  getFilteredTaxRates(): TaxRateItem[] {
    if (!this.searchTerm.trim()) return this.taxRates;
    const term = this.searchTerm.toLowerCase().trim();
    return this.taxRates.filter(t =>
      t.name.toLowerCase().includes(term) ||
      t.code.toLowerCase().includes(term) ||
      (t.description && t.description.toLowerCase().includes(term)) ||
      String(t.rate).includes(term)
    );
  }

  // Phân trang Thuế VAT (Tab 5)
  get vatTotalPages(): number {
    return Math.ceil(this.getFilteredTaxRates().length / this.pageSize) || 1;
  }

  getPaginatedTaxRates(): TaxRateItem[] {
    if (this.vatCurrentPage > this.vatTotalPages) {
      this.vatCurrentPage = this.vatTotalPages;
    }
    const start = (this.vatCurrentPage - 1) * this.pageSize;
    return this.getFilteredTaxRates().slice(start, start + this.pageSize);
  }

  goToVatPage(page: number) {
    if (page < 1 || page > this.vatTotalPages || page === this.vatCurrentPage) return;
    this.vatCurrentPage = page;
    this.cdr.markForCheck();
  }

  getVatVisiblePages(): number[] {
    return this.calculateVisiblePages(this.vatCurrentPage, this.vatTotalPages);
  }

  getVatStartIndex(): number {
    if (this.getFilteredTaxRates().length === 0) return 0;
    return (this.vatCurrentPage - 1) * this.pageSize + 1;
  }

  getVatEndIndex(): number {
    return Math.min(this.vatCurrentPage * this.pageSize, this.getFilteredTaxRates().length);
  }

  // Helper tính toán các nút trang hiển thị
  private calculateVisiblePages(current: number, total: number): number[] {
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

  getDefaultTaxRate(): TaxRateItem | undefined {
    return this.taxRates.find(t => t.isDefault);
  }
}
