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
  ChevronRight, ChevronLeft, ChevronsLeft, ChevronsRight, Tag, Save, Clock
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

@Component({
  selector: 'app-inventory-audit',
  standalone: true,
  imports: [IconComponent, CommonModule, FormsModule, RouterModule, LucideAngularModule],
  templateUrl: './inventory-audit.html',
  styleUrls: ['./inventory-audit.css']
})
export class InventoryAuditComponent implements OnInit {
  icons = { 
    ClipboardCheck, Plus, Search, Filter, CheckCircle2, FileText, X, Trash2, Loader2,
    ChevronDown, Check, CheckSquare, Square, Package, Download, Upload, Calendar, Building2, Layers, AlertCircle,
    ChevronRight, ChevronLeft, ChevronsLeft, ChevronsRight, Tag, Save, Clock
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
  isSubmitting = false;
  selectedIds = new Set<string>();
  
  // Page Filters
  searchQuery = '';
  selectedWarehouseFilter = 'Tất cả chi nhánh';
  selectedStatusFilter = 'Tất cả trạng thái';
  showWarehouseFilterDropdown = false;
  showStatusFilterDropdown = false;
  statusFilterOptions = ['Tất cả trạng thái', 'Hoàn tất', 'Đang kiểm', 'Chờ kiểm', 'Đã hủy'];

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
    return this.rawAudits.filter(a => a.status === 'Hoàn tất' || a.rawStatus === 'COMPLETED').length;
  }

  get inProgressCount(): number {
    return this.rawAudits.filter(a => a.status === 'Đang kiểm' || a.rawStatus === 'IN_PROGRESS').length;
  }

  get pendingCount(): number {
    return this.rawAudits.filter(a => a.status === 'Chờ kiểm' || a.rawStatus === 'DRAFT' || a.rawStatus === 'PENDING').length;
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
  isEditingExistingDraft = false;
  existingDraftId = '';
  
  modalAuditCode = '';
  modalAuditDate = '';
  modalAuditScope = '';
  modalWarehouseId = '';
  modalLocation = '';
  modalNotes = '';
  modalCreator = 'Admin';
  
  showModalWarehouseDropdown = false;
  showModalScopeDropdown = false;
  showLoadStockDropdown = false;
  showClearConfirmModal = false;
  showDiscardConfirmModal = false;
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

  constructor(private router: Router) {}

  ngOnInit() {
    this.fetchWarehouses();
    this.fetchCategories();
    this.fetchProducts();
    this.fetchAudits();
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
    this.showLoadStockDropdown = !this.showLoadStockDropdown;
    if (this.showLoadStockDropdown) {
      this.showModalWarehouseDropdown = false;
      this.showModalScopeDropdown = false;
      this.closeAllRowDropdowns();
    }
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
          let statusText = 'Chờ kiểm';
          if (a.status === 'COMPLETED') statusText = 'Hoàn tất';
          else if (a.status === 'IN_PROGRESS') statusText = 'Đang kiểm';
          else if (a.status === 'CANCELLED') statusText = 'Đã hủy';

          return {
            id: a.auditCode || a.id,
            rawId: a.id,
            auditCode: a.auditCode || a.id,
            scope: a.scope || 'Kiểm kê định kỳ',
            createdAt: a.createdAt,
            date: a.createdAt ? new Date(a.createdAt).toLocaleString('vi-VN') : '',
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

  onModalScopeSelect(scope: string) {
    this.modalAuditScope = scope;
    this.showModalScopeDropdown = false;
  }

  openModal(item?: any) {
    if (!item) {
      // Create new audit
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

      this.auditItems = [this.createEmptyRow()];
      this.showModal = true;
    } else {
      // View or Edit existing audit
      if (item.rawStatus === 'IN_PROGRESS') {
        // Can resume draft audit
        this.isEditingExistingDraft = true;
        this.existingDraftId = item.rawId;
        this.modalAuditCode = item.auditCode || item.id;
        this.modalAuditDate = item.createdAt ? new Date(item.createdAt).toISOString().slice(0, 16) : this.getCurrentDateTimeLocal();
        this.modalAuditScope = item.scope || '';
        this.modalWarehouseId = item.warehouseId || '';
        this.modalLocation = item.location || '';
        this.modalCreator = item.creator || 'Admin';
        this.modalNotes = item.notes || '';

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
            price: v.price || it.variant?.price || 0,
            systemStock: it.systemStock,
            actualStock: it.actualStock !== null ? it.actualStock : '',
            discrepancy: it.discrepancy !== null ? it.discrepancy : '',
            discrepancyAmount: '',
            reason: it.reason || '',
            customReason: '',
            productSearchTerm: '',
            showProductDropdown: false,
            showVariantDropdown: false
          };
          this.recalcRow(row);
          return row;
        });

        if (this.auditItems.length === 0) {
          this.auditItems = [this.createEmptyRow()];
        }
        this.showModal = true;
      } else {
        // Completed: read-only modal view
        this.isEditingExistingDraft = false;
        this.showModal = item;
      }
    }
  }

  closeModal(confirmDiscard: boolean = false) {
    if (confirmDiscard && this.isDirty()) {
      this.showDiscardConfirmModal = true;
      return;
    }
    this.showModal = false;
    this.showClearConfirmModal = false;
    this.showDiscardConfirmModal = false;
  }

  cancelDiscard() {
    this.showDiscardConfirmModal = false;
  }

  confirmDiscard() {
    this.showDiscardConfirmModal = false;
    this.showModal = false;
    this.showClearConfirmModal = false;
  }

  isDirty(): boolean {
    return this.showModal === true && (
      !!this.modalWarehouseId || 
      !!this.modalAuditScope || 
      this.auditItems.some(it => !!it.variantId || it.actualStock !== '' || !!it.productId)
    );
  }

  handleAddRow() {
    this.auditItems.push(this.createEmptyRow());
  }

  handleRemoveRow(id: string) {
    if (this.auditItems.length > 1) {
      this.auditItems = this.auditItems.filter(item => item.id !== id);
    }
  }

  get canClearAllItems(): boolean {
    return this.auditItems.length > 1 || this.auditItems.some(it => !!it.variantId || !!it.productId || it.actualStock !== '');
  }

  handleClearAllItems() {
    if (!this.canClearAllItems) return;
    this.showClearConfirmModal = true;
    this.cdr.markForCheck();
  }

  confirmClearAllItems() {
    this.auditItems = [this.createEmptyRow()];
    this.closeAllRowDropdowns();
    this.showLoadStockDropdown = false;
    this.showClearConfirmModal = false;
    this.cdr.markForCheck();
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

  loadWarehouseStockByCategory(categoryId: string, categoryName?: string, categoryObj?: any, parentCat?: any) {
    this.showLoadStockDropdown = false;
    this.categorySearchTerm = '';

    if (!this.modalWarehouseId) {
      alert('Vui lòng chọn Chi nhánh / Kho trước khi nạp tồn kho.');
      return;
    }

    const displayName = parentCat ? `${parentCat.name} > ${categoryName}` : (categoryName || 'Tất cả sản phẩm');

    if (this.auditItems.some(it => it.variantId)) {
      const confirmMsg = categoryId === 'ALL'
        ? 'Nạp tất cả sản phẩm sẽ thay thế danh sách sản phẩm hiện tại trong phiếu. Bạn có muốn tiếp tục?'
        : `Nạp tồn kho danh mục "${displayName}" sẽ thay thế danh sách sản phẩm hiện tại trong phiếu. Bạn có muốn tiếp tục?`;
      if (!confirm(confirmMsg)) {
        return;
      }
    }

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
      alert(`Không có sản phẩm nào thuộc danh mục ${displayName}.`);
      return;
    }

    // Cập nhật loại kiểm kê ở header
    if (categoryId === 'ALL') {
      this.modalAuditScope = 'Kiểm kê toàn bộ';
    } else {
      this.modalAuditScope = `Kiểm kê theo nhóm: ${displayName}`;
    }

    const items: AuditItemRow[] = [];
    targetVariants.forEach((v, index) => {
      const sysStock = this.getSystemStockForWarehouse(v, this.modalWarehouseId);
      items.push({
        id: `${Date.now()}_${index}`,
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
      });
    });

    this.auditItems = items;
    this.cdr.markForCheck();
  }

  loadAllWarehouseStock() {
    this.loadWarehouseStockByCategory('ALL');
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

  get canSaveDraftAudit(): boolean {
    return !!this.modalWarehouseId && this.auditItems.length > 0 && this.auditItems.some(it => !!it.productId || !!it.variantId);
  }

  get canCompleteAudit(): boolean {
    if (!this.modalAuditCode || !this.modalAuditDate || !this.modalWarehouseId || !this.modalAuditScope) {
      return false;
    }

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
        if (it.reason === 'Khác' && (!it.customReason || !it.customReason.trim())) {
          return false;
        }
      }
    }

    return true;
  }

  getCompleteAuditButtonTitle(): string {
    if (this.isSubmitting) return 'Hệ thống đang xử lý lưu dữ liệu...';
    if (!this.modalWarehouseId) return 'Vui lòng chọn chi nhánh/kho kiểm kê';
    if (!this.modalAuditScope) return 'Vui lòng chọn loại kiểm kê';
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
          return 'Vui lòng chọn lý do chênh lệch cho các sản phẩm có chênh lệch';
        }
        if (it.reason === 'Khác' && (!it.customReason || !it.customReason.trim())) {
          return 'Vui lòng ghi rõ lý do chênh lệch cụ thể';
        }
      }
    }
    return 'Hoàn tất kiểm kê và cập nhật số liệu tồn kho';
  }

  // --- Submit Audit (Draft vs Completed) ---

  handleSubmitAudit(status: 'IN_PROGRESS' | 'COMPLETED') {
    const validItems = this.auditItems.filter(it => it.variantId);
    if (validItems.length === 0) {
      alert('Vui lòng thêm ít nhất 1 sản phẩm vào phiếu kiểm kê!');
      return;
    }

    if (status === 'COMPLETED' && !this.canCompleteAudit) {
      alert(this.getCompleteAuditButtonTitle());
      return;
    }

    this.isSubmitting = true;
    const payload = {
      auditCode: this.modalAuditCode,
      createdAt: this.modalAuditDate ? new Date(this.modalAuditDate).toISOString() : new Date().toISOString(),
      warehouseId: this.modalWarehouseId || null,
      location: this.modalLocation,
      scope: this.modalAuditScope,
      notes: this.modalNotes || null,
      status,
      items: validItems.map(it => ({
        variantId: it.variantId,
        systemStock: Number(it.systemStock) || 0,
        actualStock: it.actualStock !== '' ? Number(it.actualStock) : null,
        reason: it.reason === 'Khác' && it.customReason ? it.customReason : it.reason
      }))
    };

    const request$ = this.isEditingExistingDraft && this.existingDraftId
      ? this.http.put<any>(`${environment.apiUrl}/admin/inventory/audits/${this.existingDraftId}`, payload)
      : this.http.post<any>(`${environment.apiUrl}/admin/inventory/audits`, payload);

    request$.subscribe({
      next: (res) => {
        this.isSubmitting = false;
        if (status === 'COMPLETED') {
          alert(`Phiếu kiểm kê ${res.auditCode || this.modalAuditCode} đã hoàn tất và cân bằng tồn kho thành công!`);
        } else {
          alert(`Đã lưu nháp phiếu kiểm kê ${res.auditCode || this.modalAuditCode}!`);
        }
        this.closeModal();
        this.fetchAudits();
      },
      error: (err) => {
        console.error('Error saving audit:', err);
        this.isSubmitting = false;
        alert('Có lỗi xảy ra khi lưu phiếu kiểm kê. Vui lòng thử lại!');
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
}
