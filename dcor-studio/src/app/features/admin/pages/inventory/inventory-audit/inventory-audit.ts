import { IconComponent } from '../../../../../shared/components/icon/icon';
import { Component, OnInit, OnDestroy, HostListener, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { 
  LucideAngularModule, 
  ClipboardCheck, Plus, Search, Filter, CheckCircle2, FileText, X, Trash2, Loader2,
  ChevronDown, Check, CheckSquare, Square, Package, Download, Upload, Calendar, Building2, Layers, AlertCircle,
  ChevronRight, ChevronLeft, ChevronsLeft, ChevronsRight, Tag, Save, Clock, Lock, Play, XCircle, RotateCcw, Printer
} from 'lucide-angular';
import { environment } from '../../../../../../environments/environment';

export interface AuditItemRow {
  id: string;
  productId?: string;
  productName?: string;
  variantId: string;
  sku: string;
  variantName: string;
  unit: string;
  price: number;
  systemStock: number | '';
  actualStock: number | '';
  discrepancy: number | '';
  discrepancyAmount: number | '';
  reason: string;
  customReason?: string;
  productSearchTerm?: string;
  showProductDropdown?: boolean;
  showVariantDropdown?: boolean;
  showReasonDropdown?: boolean;
}
 
export interface AuditActionLog {
  id?: string;
  timestamp: string;
  operator: string;
  actionType: 'CREATE' | 'STATUS_CHANGE' | 'SAVE_PROGRESS' | 'CANCEL' | 'UPDATE';
  actionLabel?: string;
  fromStatus?: string;
  toStatus?: string;
  reason?: string;
  details?: string;
}

@Component({
  selector: 'app-inventory-audit',
  standalone: true,
  imports: [IconComponent, CommonModule, FormsModule, RouterModule, LucideAngularModule],
  templateUrl: './inventory-audit.html',
  styleUrls: ['./inventory-audit.css']
})
export class InventoryAuditComponent implements OnInit, OnDestroy {
  icons = { 
    ClipboardCheck, Plus, Search, Filter, CheckCircle2, FileText, X, Trash2, Loader2,
    ChevronDown, Check, CheckSquare, Square, Package, Download, Upload, Calendar, Building2, Layers, AlertCircle,
    ChevronRight, ChevronLeft, ChevronsLeft, ChevronsRight, Tag, Save, Clock, Lock, Play, XCircle, RotateCcw, Printer
  };

  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);

  data: any[] = [];
  rawAudits: any[] = [];
  warehouses: any[] = [];
  products: any[] = [];
  allVariants: {
    id: string;
    productId: string;
    sku: string;
    name: string;
    productName: string;
    categoryId?: string;
    categoryName?: string;
    categoryParentId?: string | null;
    unit: string;
    price: number;
    stock: number;
    warehouseStocks: any[];
  }[] = [];

  // Category Tree State for Nạp tồn kho
  categoriesTree: any[] = [];
  categorySearchTerm = '';
  expandedCategoryIds = new Set<string>();

  isLoading = true;
  selectedIds = new Set<string>();
  
  // Page Filters
  searchQuery = '';
  selectedWarehouseFilter = 'Tất cả chi nhánh';
  selectedStatusFilter = 'Tất cả trạng thái';
  showWarehouseFilterDropdown = false;
  showStatusFilterDropdown = false;
  statusFilterOptions = ['Tất cả trạng thái', 'Đã kiểm kê', 'Đang kiểm kê', 'Lên kế hoạch', 'Nháp', 'Đã hủy'];

  // Pagination (10 rows per page)
  currentPage = 1;
  pageSize = 10;

  get totalPages(): number {
    return Math.ceil(this.data.length / this.pageSize) || 1;
  }

  get paginatedData(): any[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.data.slice(startIndex, startIndex + this.pageSize);
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages || page === this.currentPage) return;
    this.currentPage = page;
    this.cdr.markForCheck();
  }

  getVisiblePages(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, this.currentPage - 2);
    let end = Math.min(this.totalPages, start + maxVisible - 1);
    
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  getStartIndex(): number {
    if (this.data.length === 0) return 0;
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  getEndIndex(): number {
    return Math.min(this.currentPage * this.pageSize, this.data.length);
  }

  get totalCount(): number {
    return this.rawAudits.length;
  }

  get completedCount(): number {
    return this.rawAudits.filter(a => a.status === 'Đã kiểm kê' || a.rawStatus === 'COMPLETED').length;
  }

  get inProgressCount(): number {
    return this.rawAudits.filter(a => a.status === 'Đang kiểm kê' || a.rawStatus === 'IN_PROGRESS').length;
  }

  get plannedCount(): number {
    return this.rawAudits.filter(a => a.status === 'Lên kế hoạch' || a.rawStatus === 'PLANNED' || a.rawStatus === 'PENDING').length;
  }

  get draftCount(): number {
    return this.rawAudits.filter(a => a.status === 'Nháp' || a.rawStatus === 'DRAFT').length;
  }

  get cancelledCount(): number {
    return this.rawAudits.filter(a => a.status === 'Đã hủy' || a.rawStatus === 'CANCELLED').length;
  }

  setCardStatusFilter(status: string) {
    if (this.selectedStatusFilter === status) {
      this.selectedStatusFilter = 'Tất cả trạng thái';
    } else {
      this.selectedStatusFilter = status;
    }
    this.filterData();
  }

  // Modal State
  showModal: boolean | any = false;
  currentAuditStatus: 'CREATE' | 'DRAFT' | 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' = 'CREATE';
  isEditingExistingDraft = false;
  existingDraftId = '';
  submittingAction: 'DRAFT' | 'PLAN' | 'START_AUDIT' | 'SAVE_PROGRESS' | 'COMPLETE' | null = null;
  get isSubmitting(): boolean {
    return this.submittingAction !== null;
  }
  set isSubmitting(val: boolean) {
    if (!val) {
      this.submittingAction = null;
    }
  }

  // Delete & Cancel Popups State
  showDeleteConfirmModal = false;
  isDeletingAudit = false;
  showCancelAuditModal = false;
  isCancellingAudit = false;
  cancelReasonInput = '';

  get canEditInitialFields(): boolean {
    return this.currentAuditStatus === 'CREATE' || this.currentAuditStatus === 'DRAFT';
  }

  get isCountingMode(): boolean {
    return this.currentAuditStatus === 'IN_PROGRESS' || this.currentAuditStatus === 'COMPLETED';
  }

  get isReadOnlyView(): boolean {
    return this.currentAuditStatus === 'COMPLETED' || this.currentAuditStatus === 'CANCELLED';
  }
  
  modalAuditCode = '';
  modalAuditDate = '';
  modalAuditScope = '';
  modalWarehouseId = '';
  modalLocation = '';
  modalNotes = '';
  modalCreator = 'Admin';
  actionLogs: AuditActionLog[] = [];

  getInitials(name: string): string {
    if (!name) return 'A';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  extractLogsFromNotes(notes: string | null | undefined): AuditActionLog[] | null {
    if (!notes) return null;
    const match = notes.match(/\[ACTION_LOGS:([\s\S]*?)\]/);
    if (match && match[1]) {
      try {
        const parsed = JSON.parse(match[1]);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return null;
  }

  cleanNotesForDisplay(notes: string | null | undefined): string {
    if (!notes) return '';
    return notes
      .replace(/\[ACTION_LOGS:[\s\S]*?\]/g, '')
      .replace(/\[STATUS:[^\]]+\]/g, '')
      .trim();
  }

  generateAuditBaselineLogs(item: any): AuditActionLog[] {
    const logs: AuditActionLog[] = [];
    const operator = item.creator?.fullName || item.creator || this.modalCreator || 'Admin Quản Trị';
    const createdAt = item.createdAt || new Date().toISOString();
    const rawStatus = item.rawStatus || item.status || 'DRAFT';

    if (rawStatus === 'DRAFT') {
      logs.push({
        timestamp: createdAt,
        operator,
        actionType: 'CREATE',
        toStatus: 'DRAFT',
        actionLabel: 'Tạo bản nháp'
      });
    } else {
      logs.push({
        timestamp: createdAt,
        operator,
        actionType: 'CREATE',
        toStatus: 'PLANNED',
        actionLabel: 'Tạo phiếu kiểm kê'
      });
    }

    if (rawStatus === 'IN_PROGRESS' || rawStatus === 'COMPLETED') {
      logs.push({
        timestamp: createdAt,
        operator,
        actionType: 'STATUS_CHANGE',
        fromStatus: 'PLANNED',
        toStatus: 'IN_PROGRESS'
      });
    }

    if (rawStatus === 'COMPLETED') {
      logs.push({
        timestamp: item.completedAt || item.updatedAt || createdAt,
        operator,
        actionType: 'STATUS_CHANGE',
        fromStatus: 'IN_PROGRESS',
        toStatus: 'COMPLETED'
      });
    }

    if (rawStatus === 'CANCELLED') {
      const reasonMatch = (item.notes || '').match(/\[Lý do hủy:\s*([^\]]+)\]/);
      logs.push({
        timestamp: item.updatedAt || createdAt,
        operator,
        actionType: 'CANCEL',
        fromStatus: 'PLANNED',
        toStatus: 'CANCELLED',
        reason: reasonMatch ? reasonMatch[1] : (this.cleanNotesForDisplay(item.notes) || 'Hủy theo kế hoạch')
      });
    }

    return logs;
  }
  
  showModalWarehouseDropdown = false;
  warehouseSelectorHighlighted = false;
  private warehouseHighlightTimeout: any = null;
  showModalScopeDropdown = false;
  showLoadStockDropdown = false;
  showClearConfirmModal = false;
  showDiscardConfirmModal = false;
  showLoadStockConfirmModal = false;
  isLoadingStock = false;
  loadedCategoryIds: Set<string> = new Set<string>();
  pendingLoadStockPayload: {
    categoryId: string;
    categoryName?: string;
    categoryObj?: any;
    parentCat?: any;
    displayName: string;
    targetVariants: any[];
  } | null = null;
  auditScopeOptions = [
    'Kiểm kê định kỳ',
    'Kiểm kê đột xuất',
    'Kiểm kê toàn bộ',
    'Kiểm kê theo nhóm hàng'
  ];

  predefinedReasons = [
    'Hàng hỏng/vỡ',
    'Nhầm SKU',
    'Thất thoát',
    'Quên nhập kho',
    'Khác'
  ];

  auditItems: AuditItemRow[] = [];
  activeActionMenu: string | null = null;

  // Toast Notification
  toastMessage = '';
  toastType: 'success' | 'warning' | 'error' | 'info' = 'success';
  showToast = false;
  toastTimer: any = null;

  triggerToast(message: string, type: 'success' | 'warning' | 'error' | 'info' = 'success', durationMs = 4500) {
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;
    this.cdr.markForCheck();
    this.toastTimer = setTimeout(() => {
      this.showToast = false;
      this.cdr.markForCheck();
    }, durationMs);
  }

  closeToast() {
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }
    this.showToast = false;
    this.cdr.markForCheck();
  }

  constructor(private router: Router) {}

  ngOnInit() {
    this.fetchWarehouses();
    this.fetchCategories();
    this.fetchProducts();
    this.fetchAudits();
  }

  ngOnDestroy() {
    if (this.warehouseHighlightTimeout) {
      clearTimeout(this.warehouseHighlightTimeout);
      this.warehouseHighlightTimeout = null;
    }
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
      this.toastTimer = null;
    }
  }

  fetchCategories() {
    this.http.get<any[]>(`${environment.apiUrl}/admin/inventory/categories`).subscribe({
      next: (cats) => {
        if (Array.isArray(cats)) {
          this.categoriesTree = cats;
          this.cdr.markForCheck();
        }
      },
      error: (err) => console.warn('Could not fetch categories tree:', err)
    });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target) return;

    // 1. Chi nhánh / Kho trong modal
    if (this.showModalWarehouseDropdown && !target.closest('.modal-warehouse-wrapper')) {
      this.showModalWarehouseDropdown = false;
    }

    // 2. Loại kiểm kê trong modal
    if (this.showModalScopeDropdown && !target.closest('.modal-scope-wrapper')) {
      this.showModalScopeDropdown = false;
    }

    // 3. Nạp tồn kho hiện tại trong modal
    if (this.showLoadStockDropdown && !target.closest('.load-stock-wrapper')) {
      this.showLoadStockDropdown = false;
    }

    // 4. Dropdown Sản phẩm & Biến thể trên từng dòng bảng
    this.auditItems.forEach(row => {
      if (row.showProductDropdown) {
        const prodEl = document.getElementById('prod_dropdown_' + row.id);
        if (!prodEl || !prodEl.contains(target)) {
          row.showProductDropdown = false;
        }
      }
      if (row.showVariantDropdown) {
        const varEl = document.getElementById('var_dropdown_' + row.id);
        if (!varEl || !varEl.contains(target)) {
          row.showVariantDropdown = false;
        }
      }
      if (row.showReasonDropdown) {
        const reasonEl = document.getElementById('reason_dropdown_' + row.id);
        if (!reasonEl || !reasonEl.contains(target)) {
          row.showReasonDropdown = false;
        }
      }
    });

    // 5. Dropdown bộ lọc ngoài trang chính
    if (this.showWarehouseFilterDropdown && !target.closest('.page-warehouse-filter-wrapper')) {
      this.showWarehouseFilterDropdown = false;
    }
    if (this.showStatusFilterDropdown && !target.closest('.page-status-filter-wrapper')) {
      this.showStatusFilterDropdown = false;
    }
    if (this.activeActionMenu && !target.closest('.action-menu-container')) {
      this.activeActionMenu = null;
    }

    this.cdr.markForCheck();
  }

  onBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      const hasOpenDropdown = this.showModalWarehouseDropdown || 
                              this.showModalScopeDropdown || 
                              this.showLoadStockDropdown || 
                              this.auditItems.some(r => r.showProductDropdown || r.showVariantDropdown);
      if (hasOpenDropdown) {
        this.showModalWarehouseDropdown = false;
        this.showModalScopeDropdown = false;
        this.showLoadStockDropdown = false;
        this.closeAllRowDropdowns();
        this.cdr.markForCheck();
        return;
      }
      this.closeModal(true);
    }
  }

  toggleModalWarehouseDropdown(event?: Event) {
    if (event) event.stopPropagation();
    this.showModalWarehouseDropdown = !this.showModalWarehouseDropdown;
    if (this.showModalWarehouseDropdown) {
      this.warehouseSelectorHighlighted = false;
      this.showModalScopeDropdown = false;
      this.showLoadStockDropdown = false;
      this.closeAllRowDropdowns();
    }
    this.cdr.markForCheck();
  }

  toggleModalScopeDropdown(event?: Event) {
    if (event) event.stopPropagation();
    this.showModalScopeDropdown = !this.showModalScopeDropdown;
    if (this.showModalScopeDropdown) {
      this.showModalWarehouseDropdown = false;
      this.showLoadStockDropdown = false;
      this.closeAllRowDropdowns();
    }
    this.cdr.markForCheck();
  }

  toggleLoadStockDropdown(event?: Event) {
    if (event) event.stopPropagation();
    if (!this.modalWarehouseId) {
      this.promptSelectWarehouse(event);
      return;
    }
    this.showLoadStockDropdown = !this.showLoadStockDropdown;
    if (this.showLoadStockDropdown) {
      this.showModalWarehouseDropdown = false;
      this.showModalScopeDropdown = false;
      this.closeAllRowDropdowns();
    }
    this.cdr.markForCheck();
  }

  promptSelectWarehouse(event?: Event) {
    if (event) event.stopPropagation();
    this.closeAllRowDropdowns();
    this.showLoadStockDropdown = false;
    this.showModalScopeDropdown = false;
    this.showModalWarehouseDropdown = true;

    this.warehouseSelectorHighlighted = true;
    if (this.warehouseHighlightTimeout) {
      clearTimeout(this.warehouseHighlightTimeout);
    }
    this.warehouseHighlightTimeout = setTimeout(() => {
      this.warehouseSelectorHighlighted = false;
      this.cdr.markForCheck();
    }, 2500);

    setTimeout(() => {
      const el = document.querySelector('.modal-warehouse-wrapper');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 50);

    this.cdr.markForCheck();
  }

  closeAllRowDropdowns() {
    this.auditItems.forEach(r => {
      r.showProductDropdown = false;
      r.showVariantDropdown = false;
      r.showReasonDropdown = false;
    });
  }

  fetchWarehouses() {
    this.http.get<any[]>(`${environment.apiUrl}/admin/inventory/warehouses`).subscribe({
      next: (res) => {
        this.warehouses = res || [];
        this.cdr.markForCheck();
      },
      error: (err) => console.error('Error fetching warehouses:', err)
    });
  }

  fetchProducts() {
    this.http.get<any[]>(`${environment.apiUrl}/admin/inventory/products-options`).subscribe({
      next: (res) => {
        this.products = res || [];
        const flatList: any[] = [];
        this.products.forEach(p => {
          (p.variants || []).forEach((v: any) => {
            flatList.push({
              id: v.id,
              productId: p.id,
              sku: v.sku || 'SKU-N/A',
              name: v.name || 'Tiêu chuẩn',
              productName: p.name,
              categoryId: p.category?.id || '',
              categoryName: p.category?.name || 'Khác',
              categoryParentId: p.category?.parentId || null,
              unit: p.unit || 'Cái',
              price: Number(v.price || p.basePrice || 0),
              stock: v.stock || 0,
              warehouseStocks: v.warehouseStocks || []
            });
          });
        });
        this.allVariants = flatList;
        this.cdr.markForCheck();
      },
      error: (err) => console.error('Error fetching products with options:', err)
    });
  }

  fetchAudits() {
    this.isLoading = true;
    this.http.get<any[]>(`${environment.apiUrl}/admin/inventory/audits`).subscribe({
      next: (res) => {
        const raw = res || [];
        this.rawAudits = raw.map((a: any) => {
          let statusText = 'Lên kế hoạch';
          if (a.status === 'COMPLETED') statusText = 'Đã kiểm kê';
          else if (a.status === 'IN_PROGRESS') statusText = 'Đang kiểm kê';
          else if (a.status === 'DRAFT') statusText = 'Nháp';
          else if (a.status === 'PLANNED' || a.status === 'PENDING') statusText = 'Lên kế hoạch';
          else if (a.status === 'CANCELLED') statusText = 'Đã hủy';

          return {
            id: a.auditCode || a.id,
            rawId: a.id,
            auditCode: a.auditCode || a.id,
            scope: a.scope || 'Kiểm kê định kỳ',
            createdAt: a.createdAt,
            date: a.createdAt ? this.formatDisplayDate(a.createdAt) : '',
            location: a.warehouse?.name || a.location || 'Kho Tổng (TP.HCM)',
            warehouseId: a.warehouseId,
            creator: a.creator?.fullName || 'Admin',
            totalItems: (a.items && a.items.length > 0) ? a.items.length : (a.totalItemsCount || 0),
            discrepancyItems: a.discrepancyCount || 0,
            status: statusText,
            rawStatus: a.status,
            notes: a.notes,
            items: a.items || []
          };
        });
        this.filterData();
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error fetching stock audits:', err);
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  filterData() {
    const q = (this.searchQuery || '').trim().toLowerCase();
    this.data = this.rawAudits.filter(item => {
      const matchQuery = !q || 
        item.id.toLowerCase().includes(q) ||
        item.location.toLowerCase().includes(q) ||
        item.creator.toLowerCase().includes(q);
      
      const matchWarehouse = this.selectedWarehouseFilter === 'Tất cả chi nhánh' || 
        item.location.toLowerCase().includes(this.selectedWarehouseFilter.toLowerCase());

      const matchStatus = this.selectedStatusFilter === 'Tất cả trạng thái' || 
        item.status === this.selectedStatusFilter;

      return matchQuery && matchWarehouse && matchStatus;
    });
    this.currentPage = 1;
    this.cdr.markForCheck();
  }

  hasActiveFilters(): boolean {
    return (
      (this.searchQuery || '').trim() !== '' ||
      this.selectedWarehouseFilter !== 'Tất cả chi nhánh' ||
      this.selectedStatusFilter !== 'Tất cả trạng thái'
    );
  }

  resetFilters() {
    this.searchQuery = '';
    this.selectedWarehouseFilter = 'Tất cả chi nhánh';
    this.selectedStatusFilter = 'Tất cả trạng thái';
    this.showWarehouseFilterDropdown = false;
    this.showStatusFilterDropdown = false;
    this.filterData();
  }

  onSelectWarehouseFilter(whName: string) {
    this.selectedWarehouseFilter = whName;
    this.showWarehouseFilterDropdown = false;
    this.filterData();
  }

  onSelectStatusFilter(st: string) {
    this.selectedStatusFilter = st;
    this.showStatusFilterDropdown = false;
    this.filterData();
  }

  // --- Modal Helpers & Business Logic ---

  generateAuditCode(): string {
    const now = new Date();
    const yearMonth = `${now.getFullYear().toString().slice(-2)}${(now.getMonth() + 1).toString().padStart(2, '0')}`;
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return `PKK-${yearMonth}-${randomNum}`;
  }

  getCurrentDateTimeLocal(): string {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
  }

  formatDateTimeLocal(dateInput: any): string {
    if (!dateInput) return this.getCurrentDateTimeLocal();
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return this.getCurrentDateTimeLocal();
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  formatDisplayDate(dateInput: any): string {
    if (!dateInput) return '';
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return String(dateInput);

    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    const year = d.getFullYear();

    let hours = d.getHours();
    const minutes = d.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const hoursStr = hours.toString().padStart(2, '0');

    return `${month}/${day}/${year} ${hoursStr}:${minutes} ${ampm}`;
  }

  openDatePicker(picker: any) {
    if (picker && typeof picker.showPicker === 'function') {
      try {
        picker.showPicker();
      } catch (e) {
        if (typeof picker.focus === 'function') {
          picker.focus();
        }
      }
    }
  }

  createEmptyRow(): AuditItemRow {
    return {
      id: `${Date.now()}_${Math.random()}`,
      productId: '',
      productName: '',
      variantId: '',
      sku: '',
      variantName: '',
      unit: 'Cái',
      price: 0,
      systemStock: '',
      actualStock: '',
      discrepancy: '',
      discrepancyAmount: '',
      reason: '',
      customReason: '',
      productSearchTerm: '',
      showProductDropdown: false,
      showVariantDropdown: false
    };
  }

  getSystemStockForWarehouse(variant: any, warehouseId: string): number {
    if (warehouseId && variant.warehouseStocks && variant.warehouseStocks.length > 0) {
      const ws = variant.warehouseStocks.find((w: any) => w.warehouseId === warehouseId);
      if (ws) return ws.physicalStock;
    }
    return variant.stock ?? 0;
  }

  onModalWarehouseSelect(w: any) {
    this.modalWarehouseId = w.id;
    this.modalLocation = w.name;
    this.showModalWarehouseDropdown = false;
    this.warehouseSelectorHighlighted = false;
    if (this.warehouseHighlightTimeout) {
      clearTimeout(this.warehouseHighlightTimeout);
      this.warehouseHighlightTimeout = null;
    }
    this.cdr.detectChanges();

    // Nếu đang là Kiểm kê toàn bộ và chưa có sản phẩm thì tự động nạp tất cả sản phẩm của kho này luôn
    if (this.modalAuditScope === 'Kiểm kê toàn bộ' && !this.hasActiveAuditItems) {
      this.isLoadingStock = true;
      this.cdr.detectChanges();
      setTimeout(() => {
        this.loadWarehouseStockByCategory('ALL', 'Tất cả sản phẩm');
        this.isLoadingStock = false;
        this.cdr.markForCheck();
      }, 50);
      return;
    } else {
      // Recalculate system stock for all rows currently loaded
      this.auditItems.forEach(row => {
        if (row.variantId) {
          const v = this.allVariants.find(p => p.id === row.variantId);
          if (v) {
            row.systemStock = this.getSystemStockForWarehouse(v, this.modalWarehouseId);
            this.recalcRow(row);
          }
        }
      });
    }
    this.cdr.markForCheck();
  }

  onModalScopeSelect(scope: string) {
    this.modalAuditScope = scope;
    this.showModalScopeDropdown = false;
    this.closeAllRowDropdowns();
    // Đóng ngay dropdown trên giao diện trước khi tải dữ liệu lớn
    this.cdr.detectChanges();

    // Nếu chọn 'Kiểm kê toàn bộ' và đã có kho nhưng chưa có sản phẩm: tự động nạp luôn
    if (scope === 'Kiểm kê toàn bộ' && this.modalWarehouseId && !this.hasActiveAuditItems) {
      this.isLoadingStock = true;
      this.cdr.detectChanges();
      setTimeout(() => {
        this.loadWarehouseStockByCategory('ALL', 'Tất cả sản phẩm');
        this.isLoadingStock = false;
        this.cdr.markForCheck();
      }, 50);
      return;
    }
    this.cdr.markForCheck();
  }

  openModal(item?: any) {
    if (!item) {
      // Create new audit
      this.currentAuditStatus = 'CREATE';
      this.isEditingExistingDraft = false;
      this.existingDraftId = '';
      this.modalAuditCode = this.generateAuditCode();
      this.modalAuditDate = this.getCurrentDateTimeLocal();
      this.modalAuditScope = '';
      
      const userStr = localStorage.getItem('user') || localStorage.getItem('currentUser');
      if (userStr) {
        try {
          const u = JSON.parse(userStr);
          this.modalCreator = u.fullName || u.name || u.username || 'Admin Quản Trị';
        } catch (e) {
          this.modalCreator = 'Admin Quản Trị';
        }
      } else {
        this.modalCreator = 'Admin Quản Trị';
      }

      this.modalWarehouseId = '';
      this.modalLocation = '';
      this.modalNotes = '';
      this.actionLogs = [];
      this.warehouseSelectorHighlighted = false;
      this.loadedCategoryIds.clear();
      this.showLoadStockConfirmModal = false;
      this.pendingLoadStockPayload = null;

      this.auditItems = [this.createEmptyRow()];
      this.showModal = true;
    } else {
      // View or Edit existing audit
      this.existingDraftId = item.rawId;
      this.modalAuditCode = item.auditCode || item.id;
      this.modalAuditDate = item.createdAt ? this.formatDateTimeLocal(item.createdAt) : this.getCurrentDateTimeLocal();
      this.modalAuditScope = item.scope || '';
      this.modalWarehouseId = item.warehouseId || '';
      this.modalLocation = item.location || '';
      this.modalCreator = item.creator || 'Admin';
      const existingLogs = this.extractLogsFromNotes(item.notes);
      this.actionLogs = existingLogs || this.generateAuditBaselineLogs(item);
      this.modalNotes = this.cleanNotesForDisplay(item.notes);

      const rawSt = item.rawStatus || 'PLANNED';
      if (rawSt === 'DRAFT') {
        this.currentAuditStatus = 'DRAFT';
      } else if (rawSt === 'PLANNED' || rawSt === 'PENDING') {
        this.currentAuditStatus = 'PLANNED';
      } else if (rawSt === 'IN_PROGRESS') {
        this.currentAuditStatus = 'IN_PROGRESS';
      } else if (rawSt === 'COMPLETED') {
        this.currentAuditStatus = 'COMPLETED';
      } else if (rawSt === 'CANCELLED') {
        this.currentAuditStatus = 'CANCELLED';
      } else {
        this.currentAuditStatus = 'PLANNED';
      }

      this.isEditingExistingDraft = (this.currentAuditStatus === 'DRAFT' || this.currentAuditStatus === 'IN_PROGRESS');

      this.auditItems = (item.items || []).map((it: any, index: number) => {
        const v = this.allVariants.find(p => p.id === it.variantId) || it.variant || {};
        const row: AuditItemRow = {
          id: `${Date.now()}_${index}`,
          productId: (v as any).productId || it.variant?.product?.id,
          productName: v.productName || it.variant?.product?.name || 'Sản phẩm',
          variantId: it.variantId,
          sku: v.sku || it.variant?.sku || '',
          variantName: v.name || it.variant?.name || 'Tiêu chuẩn',
          unit: (v as any).unit || 'Cái',
          price: v.price || it.variant?.price || (v as any).product?.basePrice || 0,
          systemStock: it.systemStock !== null && it.systemStock !== undefined ? it.systemStock : 0,
          actualStock: it.actualStock !== null && it.actualStock !== undefined ? it.actualStock : (this.currentAuditStatus === 'IN_PROGRESS' ? 0 : ''),
          discrepancy: it.discrepancy !== null && it.discrepancy !== undefined ? it.discrepancy : '',
          discrepancyAmount: '',
          reason: it.reason || (it.discrepancy === 0 ? 'Khớp' : ''),
          customReason: '',
          productSearchTerm: '',
          showProductDropdown: false,
          showVariantDropdown: false,
          showReasonDropdown: false
        };
        this.recalcRow(row);
        return row;
      });

      if (this.currentAuditStatus === 'DRAFT' && this.auditItems.length === 0) {
        this.auditItems = [this.createEmptyRow()];
      }

      this.showModal = true;
    }
    this.cdr.markForCheck();
  }

  closeModal(confirmDiscard: boolean = false) {
    if (confirmDiscard && this.isDirty()) {
      this.showDiscardConfirmModal = true;
      return;
    }
    this.showModal = false;
    this.currentAuditStatus = 'CREATE';
    this.submittingAction = null;
    this.warehouseSelectorHighlighted = false;
    this.showClearConfirmModal = false;
    this.showDiscardConfirmModal = false;
    this.showLoadStockConfirmModal = false;
    this.showDeleteConfirmModal = false;
    this.showCancelAuditModal = false;
    this.pendingLoadStockPayload = null;
    this.isLoadingStock = false;
    this.cdr.markForCheck();
  }

  cancelDiscard() {
    this.showDiscardConfirmModal = false;
  }

  confirmDiscard() {
    this.showDiscardConfirmModal = false;
    this.showModal = false;
    this.currentAuditStatus = 'CREATE';
    this.submittingAction = null;
    this.showClearConfirmModal = false;
    this.showLoadStockConfirmModal = false;
    this.showDeleteConfirmModal = false;
    this.showCancelAuditModal = false;
    this.pendingLoadStockPayload = null;
    this.isLoadingStock = false;
    this.cdr.markForCheck();
  }

  isDirty(): boolean {
    if (this.currentAuditStatus === 'CREATE') {
      return !!this.modalWarehouseId || (this.auditItems.length > 0 && !!this.auditItems[0].productId);
    }
    if (this.currentAuditStatus === 'DRAFT') {
      return true;
    }
    return false;
  }

  handleAddRow() {
    if (!this.modalWarehouseId) {
      this.promptSelectWarehouse();
      return;
    }
    this.auditItems.push(this.createEmptyRow());
  }

  handleRemoveRow(id: string) {
    if (this.auditItems.length > 1) {
      this.auditItems = this.auditItems.filter(item => item.id !== id);
    } else {
      this.auditItems = [this.createEmptyRow()];
    }
    this.cdr.markForCheck();
  }

  get canClearAllItems(): boolean {
    if (!this.modalWarehouseId) return false;
    if (this.modalAuditScope === 'Kiểm kê toàn bộ' || this.modalAuditScope === 'Kiểm kê theo nhóm hàng') {
      return this.auditItems.length > 0 && this.hasActiveAuditItems;
    }
    if (this.auditItems.length > 1) return true;
    if (this.auditItems.length === 1) {
      const it = this.auditItems[0];
      return !!it.variantId || !!it.productId || (it.actualStock !== '' && it.actualStock !== null);
    }
    return false;
  }

  handleClearAllItems() {
    if (!this.canClearAllItems) return;
    this.showClearConfirmModal = true;
    this.cdr.markForCheck();
  }

  confirmClearAllItems() {
    if (this.modalAuditScope === 'Kiểm kê toàn bộ' || this.modalAuditScope === 'Kiểm kê theo nhóm hàng') {
      this.auditItems = [];
    } else {
      this.auditItems = [this.createEmptyRow()];
    }
    this.loadedCategoryIds.clear();
    this.closeAllRowDropdowns();
    this.showLoadStockDropdown = false;
    this.showClearConfirmModal = false;
    this.showLoadStockConfirmModal = false;
    this.pendingLoadStockPayload = null;
    this.cdr.detectChanges();
  }

  cancelClearAllItems() {
    this.showClearConfirmModal = false;
    this.cdr.markForCheck();
  }

  // --- Dropdown Sản phẩm & Biến thể (giống phiếu nhập xuất kho) ---

  dropdownPositions: { [key: string]: 'up' | 'down' } = {};

  checkDropdownPosition(element: HTMLElement, key: string) {
    if (!element) return;
    const rect = element.getBoundingClientRect();
    const modalBody = element.closest('.audit-modal-body') || element.closest('.audit-modal-container');
    const containerBottom = modalBody ? modalBody.getBoundingClientRect().bottom : window.innerHeight;
    const containerTop = modalBody ? modalBody.getBoundingClientRect().top : 0;

    const spaceBelow = containerBottom - rect.bottom;
    const spaceAbove = rect.top - containerTop;

    // Chiều cao menu popup ~240px. Nếu không gian bên dưới < 240px và bên trên rộng hơn bên dưới -> xổ lên trên (up)
    if (spaceBelow < 240 && spaceAbove > spaceBelow) {
      this.dropdownPositions[key] = 'up';
    } else {
      this.dropdownPositions[key] = 'down';
    }
  }

  getFilteredProducts(row: AuditItemRow): any[] {
    const term = (row.productSearchTerm || '').trim().toLowerCase();
    if (!term) return this.products;
    return this.products.filter(p => 
      (p.name || '').toLowerCase().includes(term) ||
      (p.variants || []).some((v: any) => 
        (v.sku || '').toLowerCase().includes(term) || 
        (v.name || '').toLowerCase().includes(term)
      )
    );
  }

  toggleProductDropdown(row: AuditItemRow, event: Event) {
    event.stopPropagation();
    if (!this.modalWarehouseId) {
      this.promptSelectWarehouse(event);
      return;
    }
    const willOpen = !row.showProductDropdown;
    this.closeAllRowDropdowns();
    this.showModalWarehouseDropdown = false;
    this.showModalScopeDropdown = false;
    this.showLoadStockDropdown = false;

    row.showProductDropdown = willOpen;
    if (willOpen) {
      row.productSearchTerm = '';
      const target = (event.currentTarget as HTMLElement) || (event.target as HTMLElement);
      this.checkDropdownPosition(target, 'prod_' + row.id);
    }
    this.cdr.markForCheck();
  }

  selectProductForRow(row: AuditItemRow, product: any, event?: Event) {
    if (event) event.stopPropagation();
    if (!this.modalWarehouseId) {
      this.promptSelectWarehouse(event);
      return;
    }
    row.productId = product.id;
    row.productName = product.name;
    row.productSearchTerm = '';
    row.showProductDropdown = false;

    // Nếu sản phẩm chỉ có 1 biến thể, tự động chọn luôn biến thể đó
    if (product.variants && product.variants.length === 1) {
      this.selectVariantForRow(row, product.variants[0]);
    } else {
      // Reset biến thể và mở dropdown chọn biến thể
      row.variantId = '';
      row.sku = '';
      row.variantName = '';
      row.systemStock = '';
      row.actualStock = '';
      row.discrepancy = '';
      row.discrepancyAmount = '';
      row.reason = '';
      row.showVariantDropdown = true;
      setTimeout(() => {
        const varElem = document.getElementById('var_dropdown_' + row.id);
        if (varElem) {
          this.checkDropdownPosition(varElem, 'var_' + row.id);
          this.cdr.markForCheck();
        }
      });
    }
    this.cdr.markForCheck();
  }

  toggleVariantDropdown(row: AuditItemRow, event: Event) {
    event.stopPropagation();
    if (!this.modalWarehouseId) {
      this.promptSelectWarehouse(event);
      return;
    }
    if (!row.productId) return;
    const willOpen = !row.showVariantDropdown;
    this.closeAllRowDropdowns();
    this.showModalWarehouseDropdown = false;
    this.showModalScopeDropdown = false;
    this.showLoadStockDropdown = false;

    row.showVariantDropdown = willOpen;
    if (willOpen) {
      const target = (event.currentTarget as HTMLElement) || (event.target as HTMLElement);
      this.checkDropdownPosition(target, 'var_' + row.id);
    }
    this.cdr.markForCheck();
  }

  selectVariantForRow(row: AuditItemRow, v: any, event?: Event) {
    if (event) event.stopPropagation();
    if (!this.modalWarehouseId) {
      this.promptSelectWarehouse(event);
      return;
    }
    row.variantId = v.id;
    row.sku = v.sku || 'SKU-N/A';
    row.variantName = v.name || 'Tiêu chuẩn';
    row.unit = (v as any).unit || 'Cái';
    row.price = Number(v.price || 0);
    row.systemStock = this.getSystemStockForWarehouse(v, this.modalWarehouseId);
    row.showVariantDropdown = false;
    this.recalcRow(row);
    this.cdr.markForCheck();
  }

  getVariantsForProduct(productId?: string): any[] {
    if (!productId) return [];
    const prod = this.products.find(p => p.id === productId);
    return prod?.variants || [];
  }

  toggleReasonDropdown(row: AuditItemRow, event?: Event) {
    if (event) event.stopPropagation();
    const currentState = !!row.showReasonDropdown;
    this.closeAllRowDropdowns();
    this.showModalWarehouseDropdown = false;
    this.showModalScopeDropdown = false;
    this.showLoadStockDropdown = false;
    row.showReasonDropdown = !currentState;
    if (row.showReasonDropdown && event) {
      const target = (event.currentTarget || event.target) as HTMLElement;
      this.checkDropdownPosition(target, 'reason_' + row.id);
    }
    this.cdr.markForCheck();
  }

  selectReason(row: AuditItemRow, reason: string, event?: Event) {
    if (event) event.stopPropagation();
    row.reason = reason;
    row.showReasonDropdown = false;
    this.handleUpdateRow(row, 'reason', reason);
    this.cdr.markForCheck();
  }

  handleUpdateRow(row: AuditItemRow, field: 'actualStock' | 'reason' | 'customReason', value: any) {
    if (field === 'actualStock') {
      const sanitized = String(value ?? '').replace(/[^0-9]/g, '');
      row.actualStock = sanitized ? parseInt(sanitized, 10) : '';
      this.recalcRow(row);
    } else if (field === 'reason') {
      row.reason = value;
    } else if (field === 'customReason') {
      row.customReason = value;
    }
  }

  recalcRow(row: AuditItemRow) {
    if (row.actualStock !== '' && row.systemStock !== '') {
      row.discrepancy = Number(row.actualStock) - Number(row.systemStock);
      row.discrepancyAmount = row.discrepancy * (row.price || 0);

      if (row.discrepancy === 0) {
        row.reason = 'Khớp';
      } else if (!row.reason || row.reason === 'Khớp') {
        row.reason = '';
      }
    } else {
      row.discrepancy = '';
      row.discrepancyAmount = '';
    }
  }

  // --- Large Scale Audit Utilities: Nạp tồn kho theo danh mục cấp bậc hoặc toàn bộ ---

  get filteredCategories(): any[] {
    if (!this.categorySearchTerm.trim()) {
      return this.categoriesTree;
    }
    const term = this.removeVietnameseTones(this.categorySearchTerm.trim().toLowerCase());
    
    return this.categoriesTree
      .map(cat => {
        const catName = this.removeVietnameseTones(cat.name?.toLowerCase() || '');
        const parentMatches = catName.includes(term);
        
        const matchingChildren = (cat.children || []).filter((sub: any) => {
          const subName = this.removeVietnameseTones(sub.name?.toLowerCase() || '');
          return subName.includes(term);
        });

        if (parentMatches) {
          return {
            ...cat,
            children: matchingChildren.length > 0 ? matchingChildren : cat.children
          };
        } else if (matchingChildren.length > 0) {
          return {
            ...cat,
            children: matchingChildren
          };
        }
        return null;
      })
      .filter(Boolean);
  }

  isCategoryExpanded(cat: any): boolean {
    if (this.categorySearchTerm.trim()) {
      return true;
    }
    return this.expandedCategoryIds.has(cat.id);
  }

  toggleCategoryExpand(catId: string, event: Event) {
    event.stopPropagation();
    if (this.expandedCategoryIds.has(catId)) {
      this.expandedCategoryIds.delete(catId);
    } else {
      this.expandedCategoryIds.add(catId);
    }
    this.cdr.markForCheck();
  }

  removeVietnameseTones(str: string): string {
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D');
  }

  get hasActiveAuditItems(): boolean {
    return this.auditItems.some(it => !!it.variantId);
  }

  get totalActiveAuditItems(): number {
    return this.auditItems.filter(it => !!it.variantId).length;
  }

  isAllCategoriesChecked(): boolean {
    if (this.loadedCategoryIds.has('ALL')) return true;
    if (this.allVariants.length === 0) return false;
    const currentVariantIds = new Set(this.auditItems.map(it => it.variantId).filter(Boolean));
    return this.allVariants.length > 0 && currentVariantIds.size >= this.allVariants.length;
  }

  isCategoryChecked(catId: string, catObj?: any): boolean {
    if (this.loadedCategoryIds.has('ALL')) return true;
    if (this.loadedCategoryIds.has(catId)) return true;

    // Check if any product in current audit items belongs to this category or its subcategories
    const activeVariants = this.auditItems
      .map(it => it.variantId ? this.allVariants.find(v => v.id === it.variantId) : null)
      .filter((v): v is any => !!v);

    if (activeVariants.length === 0) return false;

    const childCatIds = new Set<string>();
    childCatIds.add(catId);
    if (catObj && Array.isArray(catObj.children)) {
      catObj.children.forEach((c: any) => {
        if (c.id) childCatIds.add(c.id);
      });
    }

    return activeVariants.some(v => 
      !!v && (
        (!!v.categoryId && childCatIds.has(v.categoryId)) || 
        (!!v.categoryParentId && childCatIds.has(v.categoryParentId))
      )
    );
  }

  handleLoadAllStockDirectly() {
    if (!this.modalWarehouseId) {
      this.promptSelectWarehouse();
      return;
    }
    this.isLoadingStock = true;
    this.cdr.detectChanges();
    setTimeout(() => {
      this.loadWarehouseStockByCategory('ALL', 'Tất cả sản phẩm');
      this.isLoadingStock = false;
      this.cdr.markForCheck();
    }, 50);
  }

  trackByRowId(index: number, row: AuditItemRow): string {
    return row.id;
  }

  loadWarehouseStockByCategory(categoryId: string, categoryName?: string, categoryObj?: any, parentCat?: any) {
    this.showLoadStockDropdown = false;
    this.categorySearchTerm = '';
    this.cdr.detectChanges();

    if (!this.modalWarehouseId) {
      this.promptSelectWarehouse();
      return;
    }

    const displayName = parentCat ? `${parentCat.name} > ${categoryName}` : (categoryName || (categoryId === 'ALL' ? 'Tất cả sản phẩm' : 'Danh mục'));

    // Lọc danh sách biến thể theo yêu cầu
    let targetVariants: any[] = [];
    if (categoryId === 'ALL') {
      targetVariants = this.allVariants;
    } else {
      const allowedCatIds = new Set<string>();
      const allowedCatNames = new Set<string>();

      allowedCatIds.add(categoryId);
      if (categoryName) allowedCatNames.add(categoryName.toLowerCase());

      if (categoryObj && Array.isArray(categoryObj.children)) {
        categoryObj.children.forEach((c: any) => {
          if (c.id) allowedCatIds.add(c.id);
          if (c.name) allowedCatNames.add(c.name.toLowerCase());
        });
      }

      targetVariants = this.allVariants.filter(v => {
        if (v.categoryId && allowedCatIds.has(v.categoryId)) return true;
        if (v.categoryParentId && allowedCatIds.has(v.categoryParentId)) return true;
        if (v.categoryName && allowedCatNames.has(v.categoryName.toLowerCase())) return true;
        return false;
      });
    }

    if (targetVariants.length === 0) {
      this.triggerToast(`Không có sản phẩm nào thuộc danh mục ${displayName}.`, 'warning');
      return;
    }

    // Nếu ĐÃ CÓ sản phẩm trong phiếu -> Mở modal popup 3 nút [Hủy] [Thay thế] [Thêm vào]
    if (this.hasActiveAuditItems) {
      this.pendingLoadStockPayload = {
        categoryId,
        categoryName,
        categoryObj,
        parentCat,
        displayName,
        targetVariants
      };
      this.showLoadStockConfirmModal = true;
      this.cdr.markForCheck();
      return;
    }

    // Nếu chưa có sản phẩm nào -> Nạp trực tiếp
    this.applyLoadStock(targetVariants, categoryId, displayName, 'REPLACE');
  }

  applyLoadStock(targetVariants: any[], categoryId: string, displayName: string, mode: 'REPLACE' | 'APPEND') {
    let variantsToLoad = targetVariants;

    if (mode === 'APPEND') {
      const existingVariantIds = new Set(this.auditItems.map(it => it.variantId).filter(Boolean));
      variantsToLoad = targetVariants.filter(v => !existingVariantIds.has(v.id));

      if (variantsToLoad.length === 0) {
        this.triggerToast(`Tất cả sản phẩm trong danh mục "${displayName}" đã có trong danh sách.`, 'info');
        return;
      }
    }

    // Cập nhật loại kiểm kê ở header nếu đang trống
    if (!this.modalAuditScope) {
      if (categoryId === 'ALL') {
        this.modalAuditScope = 'Kiểm kê toàn bộ';
      } else {
        this.modalAuditScope = 'Kiểm kê theo nhóm hàng';
      }
    }

    const newRows: AuditItemRow[] = variantsToLoad.map((v, index) => {
      const sysStock = this.getSystemStockForWarehouse(v, this.modalWarehouseId);
      return {
        id: `${Date.now()}_${index}_${Math.random().toString(36).substr(2, 4)}`,
        productId: v.productId,
        productName: v.productName,
        variantId: v.id,
        sku: v.sku,
        variantName: v.name,
        unit: v.unit || 'Cái',
        price: v.price || 0,
        systemStock: sysStock,
        actualStock: '',
        discrepancy: '',
        discrepancyAmount: '',
        reason: '',
        customReason: '',
        productSearchTerm: '',
        showProductDropdown: false,
        showVariantDropdown: false
      };
    });

    if (mode === 'REPLACE') {
      this.auditItems = newRows;
      this.loadedCategoryIds.clear();
      this.loadedCategoryIds.add(categoryId);
    } else {
      // Giữ các dòng hợp lệ đã có, loại bỏ dòng trống chưa chọn gì
      const validExisting = this.auditItems.filter(it => !!it.variantId);
      this.auditItems = [...validExisting, ...newRows];
      this.loadedCategoryIds.add(categoryId);
    }

    this.cdr.markForCheck();
  }

  confirmLoadStock(mode: 'REPLACE' | 'APPEND') {
    if (!this.pendingLoadStockPayload) return;
    const { targetVariants, categoryId, displayName } = this.pendingLoadStockPayload;
    this.showLoadStockConfirmModal = false;
    this.pendingLoadStockPayload = null;
    this.cdr.detectChanges();

    this.isLoadingStock = true;
    this.cdr.detectChanges();
    setTimeout(() => {
      this.applyLoadStock(targetVariants, categoryId, displayName, mode);
      this.isLoadingStock = false;
      this.cdr.markForCheck();
    }, 50);
  }

  cancelLoadStockConfirm() {
    this.showLoadStockConfirmModal = false;
    this.pendingLoadStockPayload = null;
    this.cdr.markForCheck();
  }

  loadAllWarehouseStock() {
    this.loadWarehouseStockByCategory('ALL', 'Tất cả sản phẩm');
  }


  // --- Calculations for Total Summary ---

  get totalAuditedItems(): number {
    return this.auditItems.filter(it => it.variantId && it.actualStock !== '').length;
  }

  get totalDiscrepancyItems(): number {
    return this.auditItems.filter(it => it.variantId && it.discrepancy !== '' && it.discrepancy !== 0).length;
  }

  get totalDiscrepancyAmount(): number {
    return this.auditItems.reduce((sum, it) => {
      if (it.variantId && typeof it.discrepancyAmount === 'number') {
        return sum + it.discrepancyAmount;
      }
      return sum;
    }, 0);
  }

  formatCurrency(val: number | '' | null): string {
    if (val === '' || val === null || val === undefined) return '-';
    const abs = Math.abs(val).toLocaleString('vi-VN');
    if (val > 0) return `+${abs} đ`;
    if (val < 0) return `-${abs} đ`;
    return '0 đ';
  }

  // --- Validation for Complete & Close Audit ---

  // --- Validation for Audit Lifecycle ---

  get canSaveDraftAudit(): boolean {
    if (!this.modalWarehouseId) return false;
    if (!this.auditItems || this.auditItems.length === 0) return false;
    return this.auditItems.some(it => !!it.variantId);
  }

  get canCreateOrPlanAudit(): boolean {
    if (!this.modalWarehouseId || !this.modalAuditScope) return false;
    if (!this.auditItems || this.auditItems.length === 0) return false;
    return this.auditItems.every(it => !!it.productId && !!it.variantId);
  }

  get canCompleteAudit(): boolean {
    if (!this.auditItems || this.auditItems.length === 0) {
      return false;
    }

    for (const it of this.auditItems) {
      // 1. Phải chọn sản phẩm và biến thể
      if (!it.productId || !it.variantId) {
        return false;
      }

      // 2. Phải nhập đầy đủ tồn đếm thực tế (hợp lệ >= 0)
      if (it.actualStock === '' || it.actualStock === null || it.actualStock === undefined) {
        return false;
      }
      const numActual = Number(it.actualStock);
      if (isNaN(numActual) || numActual < 0) {
        return false;
      }

      // 3. Nếu có chênh lệch thì phải có lý do chênh lệch
      if (it.discrepancy !== '' && it.discrepancy !== 0) {
        if (!it.reason || !it.reason.trim()) {
          return false;
        }
      }
    }

    return true;
  }

  getCompleteAuditButtonTitle(): string {
    if (this.isSubmitting) return 'Hệ thống đang xử lý lưu dữ liệu...';
    if (!this.auditItems || this.auditItems.length === 0) return 'Vui lòng thêm sản phẩm vào phiếu kiểm kê';
    
    for (const it of this.auditItems) {
      if (!it.productId || !it.variantId) {
        return 'Vui lòng chọn sản phẩm và biến thể cho tất cả các dòng';
      }
      if (it.actualStock === '' || it.actualStock === null || it.actualStock === undefined) {
        return 'Vui lòng nhập đầy đủ số lượng tồn đếm thực tế cho tất cả sản phẩm';
      }
      const numActual = Number(it.actualStock);
      if (isNaN(numActual) || numActual < 0) {
        return 'Số lượng tồn đếm thực tế phải là số không âm';
      }
      if (it.discrepancy !== '' && it.discrepancy !== 0) {
        if (!it.reason || !it.reason.trim()) {
          return 'Vui lòng nhập lý do chênh lệch cho các sản phẩm có chênh lệch';
        }
      }
    }
    return 'Lưu kết quả kiểm kê và chốt sổ tồn kho';
  }

  // --- Modal Helpers: Title, Label & Badge ---

  getModalTitle(): string {
    switch (this.currentAuditStatus) {
      case 'CREATE': return 'Tạo phiếu kiểm kê';
      case 'DRAFT': return `Phiếu kiểm kê (Nháp) - ${this.modalAuditCode}`;
      case 'PLANNED': return `Kế hoạch kiểm kê - ${this.modalAuditCode}`;
      case 'IN_PROGRESS': return `Đang kiểm kê thực tế - ${this.modalAuditCode}`;
      case 'COMPLETED': return `Chi tiết phiếu kiểm kê - ${this.modalAuditCode}`;
      case 'CANCELLED': return `Phiếu kiểm kê (Đã hủy) - ${this.modalAuditCode}`;
      default: return `Phiếu kiểm kê ${this.modalAuditCode}`;
    }
  }

  getStatusLabel(status?: string): string {
    if (!status) return '';
    switch (status) {
      case 'CREATE': return 'Tạo mới';
      case 'DRAFT': return 'Nháp';
      case 'PLANNED': return 'Lên kế hoạch';
      case 'IN_PROGRESS': return 'Đang kiểm kê';
      case 'COMPLETED': return 'Đã kiểm kê';
      case 'CANCELLED': return 'Đã hủy';
      default: return status;
    }
  }

  getStatusBadgeStyle(status?: string): any {
    if (!status) return {};
    switch (status) {
      case 'CREATE':
        return { 'background': 'rgba(245, 128, 37, 0.1)', 'color': 'var(--accent)', 'border': '1px solid rgba(245, 128, 37, 0.25)' };
      case 'DRAFT':
        return { 'background': 'rgba(217, 119, 6, 0.12)', 'color': '#d97706', 'border': '1px solid rgba(217, 119, 6, 0.25)' };
      case 'PLANNED':
      case 'PENDING':
        return { 'background': 'rgba(124, 58, 237, 0.12)', 'color': '#7c3aed', 'border': '1px solid rgba(124, 58, 237, 0.25)' };
      case 'IN_PROGRESS':
        return { 'background': 'rgba(37, 99, 235, 0.12)', 'color': '#2563eb', 'border': '1px solid rgba(37, 99, 235, 0.25)' };
      case 'COMPLETED':
        return { 'background': 'rgba(16, 185, 129, 0.12)', 'color': '#10b981', 'border': '1px solid rgba(16, 185, 129, 0.25)' };
      case 'CANCELLED':
        return { 'background': 'rgba(239, 68, 68, 0.12)', 'color': '#ef4444', 'border': '1px solid rgba(239, 68, 68, 0.25)' };
      default:
        return { 'background': 'rgba(107, 114, 128, 0.12)', 'color': '#6b7280', 'border': '1px solid rgba(107, 114, 128, 0.25)' };
    }
  }

  // --- Planned Audit -> In Progress Action ---

  startAuditExecution() {
    if (!this.existingDraftId) return;
    this.submittingAction = 'START_AUDIT';
    this.actionLogs.push({
      timestamp: new Date().toISOString(),
      operator: this.modalCreator || 'Admin Quản Trị',
      actionType: 'STATUS_CHANGE',
      fromStatus: 'PLANNED',
      toStatus: 'IN_PROGRESS'
    });
    const cleanNotes = this.cleanNotesForDisplay(this.modalNotes);
    const logsPayload = `[ACTION_LOGS:${JSON.stringify(this.actionLogs)}]`;
    const finalNotes = cleanNotes ? `${cleanNotes}\n${logsPayload}` : logsPayload;

    this.http.put<any>(`${environment.apiUrl}/admin/inventory/audits/${this.existingDraftId}`, {
      status: 'IN_PROGRESS',
      notes: finalNotes
    }).subscribe({
      next: (res) => {
        this.submittingAction = null;
        this.currentAuditStatus = 'IN_PROGRESS';
        // Initialize actualStock = 0 for counting if empty
        this.auditItems.forEach(row => {
          if (row.actualStock === '' || row.actualStock === null || row.actualStock === undefined) {
            row.actualStock = 0;
            this.recalcRow(row);
          }
        });
        this.fetchAudits();
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error starting audit execution:', err);
        this.submittingAction = null;
        this.triggerToast('Không thể bắt đầu kiểm kê. Vui lòng thử lại!', 'error');
        this.cdr.markForCheck();
      }
    });
  }

  // --- Draft Audit: Delete Action ---

  handleDeleteDraftAudit() {
    this.showDeleteConfirmModal = true;
  }

  cancelDeleteDraftAudit() {
    this.showDeleteConfirmModal = false;
  }

  confirmDeleteDraftAudit() {
    if (!this.existingDraftId) return;
    this.isDeletingAudit = true;
    this.http.delete<any>(`${environment.apiUrl}/admin/inventory/audits/${this.existingDraftId}`).subscribe({
      next: () => {
        this.isDeletingAudit = false;
        this.showDeleteConfirmModal = false;
        this.closeModal(false);
        this.fetchAudits();
      },
      error: (err) => {
        console.error('Error deleting audit:', err);
        this.isDeletingAudit = false;
        this.triggerToast('Không thể xóa phiếu kiểm kê. Vui lòng thử lại!', 'error');
        this.cdr.markForCheck();
      }
    });
  }

  // --- Planned Audit: Cancel Action ---

  handleCancelPlannedAudit() {
    this.cancelReasonInput = '';
    this.showCancelAuditModal = true;
  }

  cancelCancelAudit() {
    this.showCancelAuditModal = false;
    this.cancelReasonInput = '';
  }

  confirmCancelAudit() {
    if (!this.existingDraftId) return;
    const reason = (this.cancelReasonInput || '').trim();
    if (!reason) {
      this.triggerToast('Vui lòng nhập lý do hủy phiếu kiểm kê!', 'warning');
      return;
    }

    this.isCancellingAudit = true;
    this.actionLogs.push({
      timestamp: new Date().toISOString(),
      operator: this.modalCreator || 'Admin Quản Trị',
      actionType: 'CANCEL',
      fromStatus: 'PLANNED',
      toStatus: 'CANCELLED',
      reason
    });
    const cleanNotes = this.cleanNotesForDisplay(this.modalNotes);
    const logsPayload = `[ACTION_LOGS:${JSON.stringify(this.actionLogs)}]`;
    const updatedNotes = cleanNotes 
      ? `${cleanNotes}\n[Lý do hủy: ${reason}]\n${logsPayload}` 
      : `[Lý do hủy: ${reason}]\n${logsPayload}`;

    this.http.put<any>(`${environment.apiUrl}/admin/inventory/audits/${this.existingDraftId}`, {
      status: 'CANCELLED',
      notes: updatedNotes
    }).subscribe({
      next: () => {
        this.isCancellingAudit = false;
        this.showCancelAuditModal = false;
        this.modalNotes = updatedNotes;
        this.currentAuditStatus = 'CANCELLED';
        this.closeModal(false);
        this.triggerToast(`Phiếu kiểm kê ${this.modalAuditCode} đã được hủy thành công!`, 'info');
        this.fetchAudits();
      },
      error: (err) => {
        console.error('Error cancelling audit:', err);
        this.isCancellingAudit = false;
        this.triggerToast('Không thể hủy phiếu kiểm kê. Vui lòng thử lại!', 'error');
        this.cdr.markForCheck();
      }
    });
  }

  // --- Submit Audit (Draft, Planned, In Progress, Completed) ---

  handleSubmitAudit(targetStatus: 'DRAFT' | 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED') {
    const validItems = this.auditItems.filter(it => it.variantId);
    if (validItems.length === 0) {
      this.triggerToast('Vui lòng thêm ít nhất 1 sản phẩm vào phiếu kiểm kê!', 'warning');
      return;
    }

    if (targetStatus === 'PLANNED') {
      if (!this.modalWarehouseId) {
        this.triggerToast('Vui lòng chọn Chi nhánh / Kho kiểm kê!', 'warning');
        return;
      }
      if (!this.modalAuditScope) {
        this.triggerToast('Vui lòng chọn Loại kiểm kê!', 'warning');
        return;
      }
      for (const it of this.auditItems) {
        if (!it.productId || !it.variantId) {
          this.triggerToast('Vui lòng chọn đầy đủ sản phẩm và biến thể cho tất cả các dòng!', 'warning');
          return;
        }
      }
    }

    if (targetStatus === 'COMPLETED' && !this.canCompleteAudit) {
      this.triggerToast(this.getCompleteAuditButtonTitle(), 'warning');
      return;
    }

    const actionMap: Record<string, 'DRAFT' | 'PLAN' | 'SAVE_PROGRESS' | 'COMPLETE'> = {
      DRAFT: 'DRAFT',
      PLANNED: 'PLAN',
      IN_PROGRESS: 'SAVE_PROGRESS',
      COMPLETED: 'COMPLETE'
    };
    this.submittingAction = actionMap[targetStatus] || 'DRAFT';

    if (targetStatus === 'DRAFT') {
      if (!this.actionLogs.length) {
        this.actionLogs.push({
          timestamp: new Date().toISOString(),
          operator: this.modalCreator || 'Admin Quản Trị',
          actionType: 'CREATE',
          toStatus: 'DRAFT',
          actionLabel: 'Tạo bản nháp'
        });
      }
    } else if (targetStatus === 'PLANNED') {
      if (this.currentAuditStatus === 'DRAFT') {
        this.actionLogs.push({
          timestamp: new Date().toISOString(),
          operator: this.modalCreator || 'Admin Quản Trị',
          actionType: 'STATUS_CHANGE',
          fromStatus: 'DRAFT',
          toStatus: 'PLANNED'
        });
      } else if (!this.actionLogs.length) {
        this.actionLogs.push({
          timestamp: new Date().toISOString(),
          operator: this.modalCreator || 'Admin Quản Trị',
          actionType: 'CREATE',
          toStatus: 'PLANNED',
          actionLabel: 'Tạo phiếu kiểm kê'
        });
      }
    } else if (targetStatus === 'IN_PROGRESS') {
      this.actionLogs.push({
        timestamp: new Date().toISOString(),
        operator: this.modalCreator || 'Admin Quản Trị',
        actionType: 'SAVE_PROGRESS',
        details: `Đã kiểm ${validItems.filter(it => it.actualStock !== null && it.actualStock !== '').length}/${validItems.length} sản phẩm`
      });
    } else if (targetStatus === 'COMPLETED') {
      this.actionLogs.push({
        timestamp: new Date().toISOString(),
        operator: this.modalCreator || 'Admin Quản Trị',
        actionType: 'STATUS_CHANGE',
        fromStatus: 'IN_PROGRESS',
        toStatus: 'COMPLETED'
      });
    }

    const cleanNotes = this.cleanNotesForDisplay(this.modalNotes);
    const logsPayload = `[ACTION_LOGS:${JSON.stringify(this.actionLogs)}]`;
    const finalNotes = cleanNotes ? `${cleanNotes}\n${logsPayload}` : logsPayload;

    const payload = {
      auditCode: this.modalAuditCode,
      createdAt: this.modalAuditDate ? new Date(this.modalAuditDate).toISOString() : new Date().toISOString(),
      warehouseId: this.modalWarehouseId || null,
      location: this.modalLocation,
      scope: this.modalAuditScope,
      notes: finalNotes,
      status: targetStatus,
      items: validItems.map(it => ({
        variantId: it.variantId,
        systemStock: Number(it.systemStock) || 0,
        actualStock: it.actualStock !== '' && it.actualStock !== null && it.actualStock !== undefined ? Number(it.actualStock) : null,
        reason: it.reason || (it.discrepancy === 0 ? 'Khớp' : null)
      }))
    };

    const isUpdate = (this.currentAuditStatus === 'DRAFT' || this.currentAuditStatus === 'IN_PROGRESS' || this.currentAuditStatus === 'PLANNED') && !!this.existingDraftId;
    const request$ = isUpdate
      ? this.http.put<any>(`${environment.apiUrl}/admin/inventory/audits/${this.existingDraftId}`, payload)
      : this.http.post<any>(`${environment.apiUrl}/admin/inventory/audits`, payload);

    request$.subscribe({
      next: (res) => {
        this.isSubmitting = false;
        if (res?.id) {
          this.existingDraftId = res.id;
        }
        const auditCode = res?.auditCode || this.modalAuditCode || 'ADT-2410-002';
        if (targetStatus === 'COMPLETED') {
          this.closeModal(false);
          this.triggerToast(`Phiếu kiểm kê ${auditCode} đã hoàn tất và cân bằng tồn kho thành công!`, 'success');
        } else if (targetStatus === 'PLANNED') {
          this.closeModal(false);
          this.triggerToast(`Đã lưu phiếu kiểm kê ${auditCode} ở trạng thái Lên kế hoạch!`, 'info');
        } else if (targetStatus === 'DRAFT') {
          this.closeModal(false);
          this.triggerToast(`Đã lưu nháp phiếu kiểm kê ${auditCode}!`, 'info');
        } else if (targetStatus === 'IN_PROGRESS') {
          this.triggerToast('Đã lưu tiến độ kiểm đếm!', 'success');
        }
        this.fetchAudits();
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error saving audit:', err);
        this.isSubmitting = false;
        this.triggerToast('Có lỗi xảy ra khi lưu phiếu kiểm kê. Vui lòng thử lại!', 'error');
        this.cdr.markForCheck();
      }
    });
  }

  // --- Table Selection Checkboxes ---

  toggleSelection(id: string, event: Event) {
    event.stopPropagation();
    if (this.selectedIds.has(id)) {
      this.selectedIds.delete(id);
    } else {
      this.selectedIds.add(id);
    }
  }

  toggleSelectAll(event: Event) {
    event.stopPropagation();
    const currentList = this.paginatedData;
    const allSelectedOnPage = currentList.length > 0 && currentList.every(p => this.selectedIds.has(p.id));
    if (allSelectedOnPage) {
      currentList.forEach(p => this.selectedIds.delete(p.id));
    } else {
      currentList.forEach(p => this.selectedIds.add(p.id));
    }
  }

  isAllSelected() {
    const currentList = this.paginatedData;
    return currentList.length > 0 && currentList.every(p => this.selectedIds.has(p.id));
  }

  alert(msg: string) {
    window.alert(msg);
  }

  handlePrintAudit() {
    window.print();
  }
}
