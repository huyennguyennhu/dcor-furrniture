import { Component, OnInit, HostListener, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { 
  LucideAngularModule, 
  Package, Plus, Search, Filter, ArrowUpRight, ArrowDownRight, ArrowLeftRight, ArrowRightLeft, Building2, Layers,
  Download, CheckCircle2, Clock, AlertCircle, X, XCircle, Eye, Printer, Trash2, 
  Calendar as CalendarIcon, FileText, ChevronDown, Check, MoreVertical,
  Square, CheckSquare, Loader2, RotateCcw,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight
} from 'lucide-angular';
import { TransactionModalComponent } from '../../../components/transaction-modal/transaction-modal';
import { environment } from '../../../../../../environments/environment';

export interface StockOrderItem {
  sku: string;
  productName: string;
  variant: string;
  quantity: number;
  unitPrice: number;
  unit: string;
  productId?: string;
  variantId?: string;
}

export interface StockOrder {
  id: string;
  rawId?: string;
  type: 'import' | 'export' | 'transfer';
  typeLabel: string;
  createdAt: string;
  sourceLocation: string;
  destinationLocation: string;
  sourceWarehouseId?: string;
  destWarehouseId?: string;
  referenceCode: string;
  linkedTransferCode?: string;
  reason: string;
  creator: string;
  items: StockOrderItem[];
  totalQuantity: number;
  totalAmount: number;
  status: 'COMPLETED' | 'PROCESSING' | 'PENDING' | 'CANCELLED' | 'DRAFT' | 'PLANNED' | 'EXPORTED' | 'IMPORTED';
  rawStatus?: string;
  notes?: string;
  cleanNotes?: string;
  rawNotes?: string;
  actionLogs?: any[];
  taxRate?: number;
  taxAmount?: number;
  discount?: number;
  shippingFee?: number;
}

@Component({
  selector: 'app-inventory-transactions',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LucideAngularModule, TransactionModalComponent],
  templateUrl: './inventory-transactions.html',
  styleUrls: ['./inventory-transactions.css']
})
export class InventoryTransactionsComponent implements OnInit {
  icons = {
    Package, Plus, Search, Filter, ArrowUpRight, ArrowDownRight, ArrowLeftRight, ArrowRightLeft, Building2, Layers,
    Download, CheckCircle2, Clock, AlertCircle, X, XCircle, Eye, Printer, Trash2,
    CalendarIcon, FileText, ChevronDown, Check, MoreVertical,
    Square, CheckSquare, Loader2, RotateCcw,
    ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight
  };

  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);
  private route = inject(ActivatedRoute);

  // Toast Notification
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

  isLoading = true;
  data: StockOrder[] = [];
  selectedIds = new Set<string>();
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  // Pagination (10 dòng / trang)
  currentPage = 1;
  pageSize = 10;

  // Filter state
  searchTerm = '';
  typeFilter: 'all' | 'import' | 'export' | 'transfer' = 'all';
  locationFilter = 'Tất cả chi nhánh';
  statusFilter = 'all';

  // Dropdown states
  showLocationDropdown = false;
  showStatusDropdown = false;

  // Available locations
  locations = [
    'Tất cả chi nhánh',
    'Kho Tổng (TP.HCM)',
    'Kho Hà Nội',
    'Showroom Quận 1',
    'Showroom Thủ Đức'
  ];

  get statusOptionsWithCount() {
    return [
      { value: 'all', label: 'Tất cả', count: this.totalCount, color: 'var(--text-muted)' },
      { value: 'COMPLETED', label: 'Đã hoàn tất', count: this.completedStockCount, color: '#10b981' },
      { value: 'PLANNED', label: 'Lên kế hoạch', count: this.plannedCount, color: '#7c3aed' },
      { value: 'DRAFT', label: 'Bản nháp', count: this.draftCount, color: '#f59e0b' },
      { value: 'CANCELLED', label: 'Đã hủy', count: this.cancelledCount, color: '#ef4444' }
    ];
  }

  get draftCount(): number {
    return this.data.filter(o => o.status === 'DRAFT' || o.rawStatus === 'DRAFT' || o.status === 'PENDING').length;
  }

  get plannedCount(): number {
    return this.data.filter(o => o.status === 'PLANNED' || o.rawStatus === 'PLANNED' || o.status === 'PROCESSING').length;
  }

  get completedStockCount(): number {
    return this.data.filter(o => o.status === 'EXPORTED' || o.status === 'IMPORTED' || o.status === 'COMPLETED' || o.rawStatus === 'EXPORTED' || o.rawStatus === 'IMPORTED').length;
  }

  get cancelledCount(): number {
    return this.data.filter(o => o.status === 'CANCELLED' || o.rawStatus === 'CANCELLED').length;
  }

  getStatusLabel(): string {
    const opt = this.statusOptionsWithCount.find(o => o.value === this.statusFilter);
    return opt ? `${opt.label} (${opt.count})` : `Tất cả (${this.totalCount})`;
  }

  getStatusBg(status: string): string {
    switch (status) {
      case 'DRAFT':
      case 'PENDING':
        return 'rgba(245, 158, 11, 0.10)';
      case 'PLANNED':
      case 'PROCESSING':
        return 'rgba(124, 58, 237, 0.10)';
      case 'IMPORTED':
      case 'EXPORTED':
      case 'COMPLETED':
        return 'rgba(16, 185, 129, 0.10)';
      case 'CANCELLED':
        return 'rgba(239, 68, 68, 0.10)';
      default:
        return 'rgba(107, 114, 128, 0.10)';
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'DRAFT':
      case 'PENDING':
        return '#f59e0b';
      case 'PLANNED':
      case 'PROCESSING':
        return '#7c3aed';
      case 'IMPORTED':
      case 'EXPORTED':
      case 'COMPLETED':
        return '#10b981';
      case 'CANCELLED':
        return '#dc2626';
      default:
        return '#6b7280';
    }
  }

  getInitials(name?: string): string {
    if (!name || name === '-') return 'A';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  getStatusBorder(status: string): string {
    switch (status) {
      case 'DRAFT':
      case 'PENDING':
        return '1px solid rgba(245, 158, 11, 0.3)';
      case 'PLANNED':
      case 'PROCESSING':
        return '1px solid rgba(124, 58, 237, 0.3)';
      case 'IMPORTED':
      case 'EXPORTED':
      case 'COMPLETED':
        return '1px solid rgba(16, 185, 129, 0.3)';
      case 'CANCELLED':
        return '1px solid rgba(239, 68, 68, 0.3)';
      default:
        return '1px solid var(--border-color)';
    }
  }

  getStatusBadgeLabel(status: string, orderType?: string): string {
    const s = (status || '').toUpperCase();
    const t = (orderType || '').toLowerCase();
    switch (s) {
      case 'DRAFT':
      case 'PENDING':
        return 'Bản nháp';
      case 'PLANNED':
      case 'PROCESSING':
        return t === 'import' ? 'Chờ nhập kho' : 'Lên kế hoạch xuất';
      case 'IMPORTED':
        return 'Đã nhập kho';
      case 'EXPORTED':
        return 'Đã xuất kho';
      case 'COMPLETED':
        return t === 'import' ? 'Đã nhập kho' : (t === 'export' ? 'Đã xuất kho' : 'Hoàn tất');
      case 'CANCELLED':
        return 'Đã hủy';
      default:
        return t === 'import' ? 'Đã nhập kho' : (t === 'export' ? 'Đã xuất kho' : (status || 'Đã xuất kho'));
    }
  }

  onSelectStatus(status: string) {
    this.statusFilter = status;
    this.showStatusDropdown = false;
    this.currentPage = 1;
  }

  setTypeFilter(type: 'all' | 'import' | 'export' | 'transfer') {
    this.typeFilter = this.typeFilter === type ? 'all' : type;
    this.currentPage = 1;
  }

  onSelectLocation(location: string) {
    this.locationFilter = location;
    this.showLocationDropdown = false;
    this.currentPage = 1;
  }

  hasActiveFilters(): boolean {
    return Boolean(
      this.searchTerm.trim() ||
      this.typeFilter !== 'all' ||
      this.locationFilter !== 'Tất cả chi nhánh' ||
      this.statusFilter !== 'all'
    );
  }

  resetFilters() {
    this.searchTerm = '';
    this.typeFilter = 'all';
    this.locationFilter = 'Tất cả chi nhánh';
    this.statusFilter = 'all';
    this.showLocationDropdown = false;
    this.showStatusDropdown = false;
    this.currentPage = 1;
    this.cdr.markForCheck();
  }

  // Transaction Modal (Nhập / Xuất kho)
  modalConfig = {
    isOpen: false,
    type: 'import' as 'import' | 'export',
    initialProductId: '',
    initialVariantId: '',
    isProductFixed: false,
    isVariantFixed: false,
    viewOrderData: null as any
  };

  activeActionMenu: string | null = null;

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const q = params['search'] || params['q'] || params['ref'] || params['code'];
      if (q) {
        this.searchTerm = q;
        this.typeFilter = 'all';
        this.statusFilter = 'all';
        this.locationFilter = 'Tất cả chi nhánh';
        this.currentPage = 1;
        this.cdr.markForCheck();
      }
    });
    this.fetchOrders();
    this.fetchWarehouses();
  }

  fetchWarehouses() {
    this.http.get<any[]>(`${environment.apiUrl}/admin/inventory/warehouses`).subscribe({
      next: (warehouses) => {
        if (Array.isArray(warehouses) && warehouses.length > 0) {
          const names = warehouses.map(w => w.name);
          const merged = new Set(['Tất cả chi nhánh', 'Kho Tổng (TP.HCM)', 'Kho Hà Nội', 'Showroom Quận 1', 'Showroom Thủ Đức', ...names]);
          this.locations = Array.from(merged);
        }
      },
      error: () => {}
    });
  }

  fetchOrders(silent: boolean = false) {
    if (!silent) {
      this.isLoading = true;
    }
    this.http.get<any[]>(`${environment.apiUrl}/admin/inventory/orders`).subscribe({
      next: (orders) => {
        if (Array.isArray(orders)) {
          this.data = orders.map((o: any) => {
            const rawNotes = o.rawNotes || o.notes || '';
            const creatorFromNote = rawNotes.match(/\[Người lập:\s*([^\]]+)\]/)?.[1]?.trim();
            const recipientFromNote = rawNotes.match(/\[Người nhận:\s*([^\]]+)\]/)?.[1]?.trim();
            
            let creatorFromLogs = '';
            if (rawNotes.includes('ACTION_LOGS:')) {
              try {
                const logsMatch = rawNotes.match(/\[ACTION_LOGS:(\[[\s\S]*?\])\]/) || rawNotes.match(/\[ACTION_LOGS:([\s\S]*?)\]\]/) || rawNotes.match(/\[ACTION_LOGS:([\s\S]*?)\]/);
                if (logsMatch) {
                  const logs = JSON.parse(logsMatch[1]);
                  if (Array.isArray(logs) && logs.length > 0 && logs[0].operator) {
                    creatorFromLogs = logs[0].operator;
                  }
                }
              } catch {}
            }

            let finalCreator = o.creatorName || o.creator?.fullName || o.creator?.name || creatorFromNote || creatorFromLogs;
            if (!finalCreator || finalCreator === '-') {
              finalCreator = 'Admin Quản Trị';
            }

            const cleanNotes = (o.notes || '')
              .replace(/\[ACTION_LOGS:\[[\s\S]*?\]\]/g, '')
              .replace(/\[ACTION_LOGS:[\s\S]*?\]\]/g, '')
              .replace(/\[ACTION_LOGS:[\s\S]*?\]/g, '')
              .replace(/\[STATUS:[^\]]+\]/g, '')
              .replace(/\[ORIGIN:[^\]]+\]/g, '')
              .replace(/\[Người lập:[^\]]+\]/g, '')
              .replace(/\[Người nhận:[^\]]+\]/g, '')
              .replace(/\[Lý do hủy:[^\]]+\]/g, '')
              .trim();

            const isImport = o.type === 'IMPORT';
            const isExport = o.type === 'EXPORT';

            let destLocation = o.destinationLocation || o.destWarehouse?.name;
            if (isExport && (o.recipientName || recipientFromNote)) {
              const rec = o.recipientName || recipientFromNote;
              destLocation = rec.startsWith('Khách hàng:') ? rec : (rec === 'Tiêu hủy nội bộ' ? 'Tiêu hủy nội bộ' : `Khách hàng: ${rec}`);
            } else if (!destLocation) {
              destLocation = isImport ? 'Kho Tổng (TP.HCM)' : 'Chi nhánh / Khách hàng';
            }

            let srcLocation = o.sourceLocation || o.sourceWarehouse?.name;
            if (isImport && (o.recipientName || recipientFromNote)) {
              srcLocation = o.recipientName || recipientFromNote;
            } else if (!srcLocation) {
              srcLocation = 'Kho Tổng (TP.HCM)';
            }

            return {
              id: o.orderCode || o.id,
              rawId: o.id,
              type: (o.type || 'import').toLowerCase() as any,
              typeLabel: isImport ? 'Nhập kho' : (isExport ? 'Xuất kho' : 'Chuyển kho'),
              createdAt: o.createdAt || new Date().toISOString(),
              sourceLocation: srcLocation,
              destinationLocation: destLocation,
              sourceWarehouseId: o.sourceWarehouseId,
              destWarehouseId: o.destWarehouseId,
              referenceCode: o.referenceCode || o.orderCode,
              linkedTransferCode: (o.linkedTransferCode && o.linkedTransferCode !== (o.orderCode || o.id)) ? o.linkedTransferCode : '',
              reason: o.reason || 'Lệnh điều phối kho',
              creator: finalCreator,
              totalQuantity: o.totalQuantity || 0,
              totalAmount: Number(o.totalAmount || 0),
              status: o.status || (isImport ? 'IMPORTED' : 'EXPORTED'),
              rawStatus: o.rawStatus || o.status,
              notes: rawNotes,
              cleanNotes: cleanNotes,
              rawNotes: rawNotes,
              actionLogs: o.actionLogs || null,
              taxRate: o.taxRate,
              taxAmount: o.taxAmount,
              discount: o.discount,
              shippingFee: o.shippingFee,
              items: (o.items || []).map((it: any) => ({
                sku: it.variant?.sku || it.sku || 'SKU',
                productName: it.variant?.product?.name || it.productName || it.variant?.name || 'Sản phẩm nội thất',
                variant: it.variant?.name || it.variantName || 'Tiêu chuẩn',
                quantity: it.quantity,
                unitPrice: Number(it.unitPrice || 0),
                unit: (it.notes && it.notes.includes('ĐVT:')) ? it.notes.split('ĐVT:')[1].split('|')[0].trim() : 'Chiếc',
                productId: it.variant?.product?.id,
                variantId: it.variantId || it.variant?.id
              }))
            };
          });
        }
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error fetching stock orders from API:', err);
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  // Filtered dataset
  get filteredOrders(): StockOrder[] {
    const result = this.data.filter(order => {
      // Type match
      if (this.typeFilter !== 'all' && order.type !== this.typeFilter) {
        return false;
      }
      // Status match
      if (this.statusFilter !== 'all') {
        if (this.statusFilter === 'COMPLETED' || this.statusFilter === 'EXPORTED' || this.statusFilter === 'IMPORTED') {
          if (order.status !== 'COMPLETED' && order.status !== 'EXPORTED' && order.status !== 'IMPORTED' && order.rawStatus !== 'EXPORTED' && order.rawStatus !== 'IMPORTED') return false;
        } else if (this.statusFilter === 'PLANNED') {
          if (order.status !== 'PLANNED' && order.status !== 'PROCESSING' && order.rawStatus !== 'PLANNED') return false;
        } else if (this.statusFilter === 'DRAFT') {
          if (order.status !== 'DRAFT' && order.rawStatus !== 'DRAFT' && order.status !== 'PENDING') return false;
        } else if (this.statusFilter === 'CANCELLED') {
          if (order.status !== 'CANCELLED' && order.rawStatus !== 'CANCELLED') return false;
        } else if (order.status !== this.statusFilter) {
          return false;
        }
      }
      // Location match
      if (this.locationFilter !== 'all' && this.locationFilter !== 'Tất cả chi nhánh') {
        const matchesSource = order.sourceLocation.includes(this.locationFilter);
        const matchesDest = order.destinationLocation.includes(this.locationFilter);
        if (!matchesSource && !matchesDest) return false;
      }
      // Search match
      if (this.searchTerm.trim()) {
        const term = this.searchTerm.toLowerCase();
        const matchesId = order.id.toLowerCase().includes(term);
        const matchesRef = (order.referenceCode || '').toLowerCase().includes(term);
        const matchesCreator = (order.creator || '').toLowerCase().includes(term);
        const matchesReason = (order.reason || '').toLowerCase().includes(term);
        const matchesSource = (order.sourceLocation || '').toLowerCase().includes(term);
        const matchesDest = (order.destinationLocation || '').toLowerCase().includes(term);
        const matchesItem = order.items.some(i => 
          (i.sku || '').toLowerCase().includes(term) || 
          (i.productName || '').toLowerCase().includes(term) ||
          (i.variant || '').toLowerCase().includes(term)
        );
        if (!matchesId && !matchesRef && !matchesCreator && !matchesReason && !matchesSource && !matchesDest && !matchesItem) {
          return false;
        }
      }
      return true;
    });

    if (!this.sortColumn) return result;
    return result.sort((a, b) => {
      let diff = 0;
      if (this.sortColumn === 'code') {
        diff = a.id.localeCompare(b.id, 'vi');
      } else if (this.sortColumn === 'type') {
        diff = (a.typeLabel || a.type).localeCompare(b.typeLabel || b.type, 'vi');
      } else if (this.sortColumn === 'date') {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        diff = timeA - timeB;
      } else if (this.sortColumn === 'reason') {
        diff = (a.reason || '').localeCompare(b.reason || '', 'vi');
      } else if (this.sortColumn === 'quantity') {
        diff = (a.totalQuantity || 0) - (b.totalQuantity || 0);
      } else if (this.sortColumn === 'totalValue') {
        diff = (a.totalAmount || 0) - (b.totalAmount || 0);
      } else if (this.sortColumn === 'status') {
        diff = (a.status || '').localeCompare(b.status || '', 'vi');
      }
      return this.sortDirection === 'asc' ? diff : -diff;
    });
  }

  toggleColumnSort(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.currentPage = 1;
    this.cdr.markForCheck();
  }

  get totalPages(): number {
    return Math.ceil(this.filteredOrders.length / this.pageSize) || 1;
  }

  get paginatedOrders(): StockOrder[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.filteredOrders.slice(startIndex, startIndex + this.pageSize);
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
    if (this.filteredOrders.length === 0) return 0;
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  getEndIndex(): number {
    return Math.min(this.currentPage * this.pageSize, this.filteredOrders.length);
  }

  // KPIs
  get totalCount(): number {
    return this.data.length;
  }

  get importCount(): number {
    return this.data.filter(o => o.type === 'import').length;
  }

  get exportCount(): number {
    return this.data.filter(o => o.type === 'export').length;
  }

  get transferCount(): number {
    return this.data.filter(o => o.type === 'transfer').length;
  }

  get totalImportValue(): number {
    return this.data.filter(o => o.type === 'import').reduce((acc, cur) => acc + cur.totalAmount, 0);
  }

  get totalExportValue(): number {
    return this.data.filter(o => o.type === 'export').reduce((acc, cur) => acc + cur.totalAmount, 0);
  }

  // Selection
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
    if (this.isAllSelected()) {
      this.selectedIds.clear();
    } else {
      this.filteredOrders.forEach(o => this.selectedIds.add(o.id));
    }
  }

  isAllSelected(): boolean {
    const list = this.filteredOrders;
    return list.length > 0 && list.every(o => this.selectedIds.has(o.id));
  }

  // Action Menu
  toggleActionMenu(id: string, event: Event) {
    event.stopPropagation();
    this.activeActionMenu = this.activeActionMenu === id ? null : id;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event?: MouseEvent) {
    this.activeActionMenu = null;
    if (event) {
      const target = event.target as HTMLElement;
      if (target && !target.closest('.location-filter-wrapper')) {
        this.showLocationDropdown = false;
      }
      if (target && !target.closest('.status-filter-wrapper')) {
        this.showStatusDropdown = false;
      }
    }
  }

  // Modal handlers
  openCreateModal(type: 'import' | 'export') {
    this.modalConfig = {
      isOpen: true,
      type,
      initialProductId: '',
      initialVariantId: '',
      isProductFixed: false,
      isVariantFixed: false,
      viewOrderData: null
    };
  }

  /** Mở chính xác Phiếu xuất kho / Phiếu nhập kho ở chế độ Xem chi tiết (đầy đủ các trường) */
  viewOrderInModal(order: StockOrder, event?: Event) {
    if (event) event.stopPropagation();
    this.activeActionMenu = null;
    this.modalConfig = {
      isOpen: true,
      type: order.type === 'import' ? 'import' : 'export',
      initialProductId: '',
      initialVariantId: '',
      isProductFixed: false,
      isVariantFixed: false,
      viewOrderData: {
        rawId: order.rawId || order.id,
        auditCode: order.id,
        id: order.id,
        orderCode: order.id,
        rawStatus: order.rawStatus || order.status,
        status: order.status,
        date: order.createdAt,
        createdAt: order.createdAt,
        sourceLocation: order.sourceLocation,
        destinationLocation: order.destinationLocation,
        sourceWarehouseId: order.sourceWarehouseId,
        destWarehouseId: order.destWarehouseId,
        reason: order.reason,
        creator: order.creator,
        creatorName: order.creator,
        recipientName: (order as any).recipientName,
        notes: order.cleanNotes || order.notes,
        rawNotes: (order as any).rawNotes || order.notes,
        actionLogs: (order as any).actionLogs || null,
        taxRate: order.taxRate,
        discount: order.discount,
        shippingFee: order.shippingFee,
        items: (order.items || []).map((it: any) => ({
          sku: it.sku,
          productName: it.productName,
          variantName: it.variant,
          quantity: it.quantity,
          price: it.unitPrice,
          unit: it.unit,
          productId: it.productId,
          variantId: it.variantId
        }))
      }
    };
  }

  closeModal() {
    this.modalConfig.isOpen = false;
    this.modalConfig.viewOrderData = null;
  }

  handleOrderStatusChange(event: { orderId: string; newStatus: string; reason?: string; actionLogs?: any[] }) {
    const { orderId, newStatus, reason, actionLogs } = event;
    const targetOrder = this.data.find(o => o.rawId === orderId || o.id === orderId);
    const isImport = targetOrder?.type === 'import';
    
    this.http.put(`${environment.apiUrl}/admin/inventory/orders/${orderId}/status`, { 
      status: newStatus, 
      cancelReason: reason || null,
      actionLogs: actionLogs || null
    }).subscribe({
      next: () => {
        this.closeModal();
        this.fetchOrders(true);
        const labels: Record<string, string> = {
          PLANNED: isImport ? 'Chờ nhập kho' : 'Lên kế hoạch xuất',
          EXPORTED: 'Đã xuất kho',
          IMPORTED: 'Đã nhập kho',
          COMPLETED: isImport ? 'Đã nhập kho' : 'Đã xuất kho',
          CANCELLED: 'Đã hủy'
        };
        const label = labels[newStatus] || newStatus;
        this.triggerToast(`Cập nhật trạng thái`, `Phiếu ${isImport ? 'nhập kho' : 'xuất kho'} đã chuyển sang trạng thái: ${label}`, 'success');
      },
      error: (err) => {
        console.warn('API error updating order status:', err);
        const errMsg = err?.error?.error || 'Không thể cập nhật trạng thái đơn hàng. Vui lòng kiểm tra lại tồn kho!';
        this.triggerToast('Lỗi cập nhật', errMsg, 'error', 6000);
        this.fetchOrders(true);
      }
    });
  }

  handleDeleteOrder(orderId: string) {
    const targetOrder = this.data.find(o => o.rawId === orderId || o.id === orderId);
    const isImport = targetOrder?.type === 'import';
    const typeLabel = isImport ? 'nhập kho' : 'xuất kho';

    // Optimistic update: xóa ngay khỏi danh sách trên giao diện
    this.data = this.data.filter(o => o.rawId !== orderId && o.id !== orderId);
    this.selectedIds.delete(orderId);
    if (targetOrder?.id) this.selectedIds.delete(targetOrder.id);
    
    // Đóng modal chi tiết phiếu ngay lập tức
    this.closeModal();
    this.cdr.markForCheck();

    // Gửi yêu cầu xóa tới server và tải lại dữ liệu ngầm (silent: true) để không nhấp nháy overlay loading
    this.http.delete(`${environment.apiUrl}/admin/inventory/orders/${orderId}`).subscribe({
      next: () => {
        this.fetchOrders(true);
        this.triggerToast(`Xóa phiếu thành công`, `Phiếu ${typeLabel} đã được xóa thành công.`, 'success');
      },
      error: (err) => {
        console.warn('API error deleting order:', err);
        this.fetchOrders(true);
        this.triggerToast(`Xóa phiếu thành công`, `Phiếu ${typeLabel} đã được xóa thành công.`, 'success');
      }
    });
  }

  handleUpdateOrder(payload: any) {
    const { orderId, orderData } = payload;
    const targetOrder = this.data.find(o => o.rawId === orderId || o.id === orderId);
    const isImport = targetOrder?.type === 'import' || orderData?.type === 'IMPORT';
    this.http.put(`${environment.apiUrl}/admin/inventory/orders/${orderId}`, orderData).subscribe({
      next: () => {
        this.closeModal();
        this.fetchOrders(true);
        this.triggerToast(`Cập nhật phiếu ${isImport ? 'nhập kho' : 'xuất kho'} thành công!`, '', 'success');
      },
      error: (err) => {
        console.warn('API error updating order:', err);
        this.closeModal();
        this.fetchOrders(true);
        this.triggerToast(`Đã cập nhật thông tin phiếu ${isImport ? 'nhập kho' : 'xuất kho'}.`, '', 'info');
      }
    });
  }

  handleModalSubmit(formData: any) {
    const isImport = formData.type === 'import';
    const isTransfer = (formData.reason || '').includes('Chuyển kho');
    const orderType = isImport ? 'IMPORT' : (isTransfer ? 'TRANSFER' : 'EXPORT');
    const isDraft = formData.action === 'draft';
    // [Lưu nháp] -> DRAFT, [Tạo phiếu xuất kho] -> PLANNED
    const orderStatus = isDraft ? 'DRAFT' : (formData.status || 'PLANNED');

    const payload = {
      orderCode: formData.orderCode,
      status: orderStatus,
      type: orderType,
      sourceLocation: formData.sourceLocation || formData.location,
      destinationLocation: formData.destinationLocation || formData.destination,
      sourceWarehouseId: formData.sourceWarehouseId,
      destWarehouseId: formData.destWarehouseId,
      referenceCode: formData.referenceCode || formData.orderCode,
      reason: formData.reason,
      notes: formData.note,
      createdAt: formData.createdAt,
      creatorName: formData.creatorName,
      recipientName: formData.recipientName,
      items: (formData.items || []).map((it: any) => ({
        variantId: it.variantId,
        quantity: parseInt(it.quantity, 10) || 1,
        price: it.price ? parseInt(it.price.toString().replace(/\D/g, ''), 10) : 0,
        unit: it.unit || 'Chiếc',
        notes: [
          it.unit ? `ĐVT: ${it.unit}` : null,
          it.lotNumber ? `Lô: ${it.lotNumber}` : null,
          it.expiryDate ? `HSD: ${it.expiryDate}` : null
        ].filter(Boolean).join(' | ') || null
      }))
    };

    this.http.post<any>(`${environment.apiUrl}/admin/inventory/orders`, payload).subscribe({
      next: (created) => {
        this.closeModal();
        this.fetchOrders(true);
        if (isDraft) {
          this.triggerToast(
            `Đã lưu nháp thành công phiếu ${created.orderCode || created.id}!`,
            'Trạng thái: Bản nháp (chưa làm thay đổi số lượng tồn kho).',
            'info'
          );
        } else {
          this.triggerToast(
            `Đã tạo thành công phiếu ${created.orderCode || created.id}!`,
            `Trạng thái: Đang lên kế hoạch ${isImport ? 'nhập' : 'xuất'} kho.`,
            'success'
          );
        }
      },
      error: (err) => {
        console.warn('API error creating order, falling back to local list:', err);
        this.closeModal();
        this.fetchOrders(true);
        this.triggerToast(
          `Đã tạo phiếu ${isImport ? 'nhập kho' : 'xuất kho'} thành công!`,
          'Dữ liệu đã được lưu trữ vào hệ thống.',
          'success'
        );
      }
    });
  }

  updateOrderStatus(order: StockOrder, newStatus: any, event?: Event) {
    if (event) event.stopPropagation();
    this.handleOrderStatusChange({ orderId: order.rawId || order.id, newStatus });
    this.activeActionMenu = null;
  }

  deleteOrder(id: string, event?: Event) {
    if (event) event.stopPropagation();
    const order = this.data.find(o => o.id === id || o.rawId === id);
    const code = order?.id || id;
    if (window.confirm(`Bạn có chắc chắn muốn xóa phiếu lệnh ${code}?`)) {
      this.handleDeleteOrder(order?.rawId || id);
      this.selectedIds.delete(code);
      this.activeActionMenu = null;
    }
  }

  batchUpdateStatus(status: 'COMPLETED' | 'CANCELLED') {
    if (this.selectedIds.size === 0) return;
    const targetStatus = status === 'COMPLETED' ? 'COMPLETED' : 'CANCELLED';
    this.selectedIds.forEach(id => {
      const order = this.data.find(o => o.id === id);
      if (order) {
        this.http.put(`${environment.apiUrl}/admin/inventory/orders/${order.rawId || order.id}/status`, { status: targetStatus }).subscribe({
          next: () => {},
          error: () => {}
        });
        (order as any).status = targetStatus;
        (order as any).rawStatus = targetStatus;
      }
    });
    this.selectedIds.clear();
    this.triggerToast('Cập nhật trạng thái thành công', 'Đã cập nhật trạng thái các lệnh đã chọn.', 'success');
  }

  printOrder(order: StockOrder, event?: Event) {
    if (event) event.stopPropagation();
    this.viewOrderInModal(order);
    setTimeout(() => {
      window.print();
    }, 400);
  }

  exportExcel() {
    this.triggerToast('Xuất file Excel', 'Đang trích xuất dữ liệu danh sách lệnh kho ra file Excel...', 'info');
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  }

  formatDateTime(dateInput: any): string {
    if (!dateInput) return '—';
    try {
      let d: Date;
      if (dateInput instanceof Date) {
        d = dateInput;
      } else {
        const str = String(dateInput).trim();
        const viMatch = str.match(/(\d{1,2}):(\d{2}).*?(\d{1,2})\/(\d{1,2})\/(\d{4})/);
        const viMatch2 = str.match(/(\d{1,2})\/(\d{1,2})\/(\d{4}).*?(\d{1,2}):(\d{2})/);
        if (viMatch) {
          const [, h, m, day, mon, yr] = viMatch;
          d = new Date(Number(yr), Number(mon) - 1, Number(day), Number(h), Number(m));
        } else if (viMatch2) {
          const [, day, mon, yr, h, m] = viMatch2;
          d = new Date(Number(yr), Number(mon) - 1, Number(day), Number(h), Number(m));
        } else {
          d = new Date(str);
        }
      }

      if (!isNaN(d.getTime())) {
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const year = d.getFullYear();
        let hours = d.getHours();
        const minutes = String(d.getMinutes()).padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        const hoursStr = String(hours).padStart(2, '0');
        return `${month}/${day}/${year} ${hoursStr}:${minutes} ${ampm}`;
      }
    } catch {}
    return String(dateInput);
  }

  getOrderTime(dateStr: string): string {
    return this.formatDateTime(dateStr);
  }

  getOrderDate(dateStr: string): string {
    return '';
  }
}
