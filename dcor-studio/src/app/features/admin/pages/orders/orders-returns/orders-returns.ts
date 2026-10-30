import { Component, OnInit, HostListener, ChangeDetectorRef, NgZone, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { 
  LucideAngularModule, 
  Search, RotateCcw, AlertCircle, CheckCircle2, Clock, XCircle, Package,
  ArrowRightLeft, HelpCircle, ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, X,
  Check, Square, CheckSquare, RefreshCw, CornerDownLeft, Eye, Printer, Phone, MapPin, Truck,
  DollarSign, ShieldCheck, FileText, Calendar, Zap, Building2, User, AlertTriangle, ExternalLink
} from 'lucide-angular';
import { 
  OrdersReturnsMockService, 
  ReturnRequest, 
  ReturnStatus, 
  ReturnType 
} from './services/orders-returns-mock.service';
import { OrdersService } from '../services/orders.service';

@Component({
  selector: 'app-orders-returns',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LucideAngularModule],
  templateUrl: './orders-returns.html',
  styleUrls: ['./orders-returns.css']
})
export class OrdersReturnsComponent implements OnInit {

  onCustomerClick(req: ReturnRequest, event: MouseEvent): void {
    event.stopPropagation();
    if (req.customer?.phone) {
      this.router.navigate(['/admin/customers'], { queryParams: { q: req.customer.phone } });
    } else if (req.customer?.name) {
      this.router.navigate(['/admin/customers'], { queryParams: { q: req.customer.name } });
    } else {
      this.router.navigate(['/admin/customers']);
    }
  }

  onOrderClick(req: ReturnRequest, event: MouseEvent): void {
    event.stopPropagation();
    const orderKey = (req.orderNumber || req.orderId || '').replace(/^#/g, '').trim();
    this.router.navigate(['/admin/orders', orderKey]);
  }

  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);
  icons = { 
    Search, RotateCcw, AlertCircle, CheckCircle2, Clock, XCircle, Package,
    ArrowRightLeft, HelpCircle, ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, X,
    Check, Square, CheckSquare, RefreshCw, CornerDownLeft, Eye, Printer, Phone, MapPin, Truck,
    DollarSign, ShieldCheck, FileText, Calendar, Zap, Building2, User, AlertTriangle, ExternalLink
  };

  // Tab & Filters
  activeTab = 'ALL'; // ALL | STAGE_1 | STAGE_2 | STAGE_3 | STAGE_4 | REJECTED
  searchQuery = '';
  selectedType = 'ALL';
  selectedReason = 'ALL';
  selectedAssignee = 'ALL';
  selectedSort = 'date-desc';

  // Dropdown open states
  showTypeDropdown = false;
  showReasonDropdown = false;
  showAssigneeDropdown = false;
  showSortDropdown = false;

  // Checkbox selection state
  selectedIds = new Set<string>();

  // Pagination
  currentPage = 1;
  pageSize = 8;

  // Toast
  toastMessage = '';
  toastType: 'success' | 'info' | 'error' = 'success';
  showToast = false;
  private toastTimer: any = null;

  readonly typeOptions = [
    { label: 'Tất cả loại yêu cầu', value: 'ALL' },
    { label: 'Đổi hàng (EXCHANGE)', value: 'EXCHANGE' },
    { label: 'Trả hàng hoàn tiền (REFUND)', value: 'REFUND' }
  ];

  readonly reasonOptions = [
    { label: 'Tất cả lý do', value: 'ALL' },
    { label: 'Lỗi kỹ thuật / Hư hỏng', value: 'Lỗi kỹ thuật' },
    { label: 'Sai màu sắc / Mẫu mã', value: 'Sai màu sắc' },
    { label: 'Trầy xước vận chuyển', value: 'Trầy xước' },
    { label: 'Không vừa kích thước', value: 'Kích thước' },
    { label: 'Quá thời hạn 72h', value: 'Quá thời hạn' }
  ];

  readonly assigneeOptions = [
    { label: 'Tất cả người phụ trách', value: 'ALL' },
    { label: 'CSKH Kim Ngân', value: 'CSKH Kim Ngân' },
    { label: 'CSKH Minh Phúc', value: 'CSKH Minh Phúc' },
    { label: 'Kỹ thuật viên Trịnh Văn Bách', value: 'Kỹ thuật viên Trịnh Văn Bách' },
    { label: 'Thủ kho Hoàng Sơn', value: 'Thủ kho Hoàng Sơn' },
    { label: 'Kế toán Bích Ngọc', value: 'Kế toán Bích Ngọc' },
    { label: 'Chưa phân công', value: 'Chưa phân công' }
  ];

  readonly sortOptions = [
    { label: 'Mới nhất trước', value: 'date-desc' },
    { label: 'Cũ nhất trước', value: 'date-asc' },
    { label: 'Giá trị cao nhất', value: 'amount-desc' }
  ];

  constructor(
    private router: Router,
    public returnsService: OrdersReturnsMockService,
    private ordersService: OrdersService
  ) {}

  ngOnInit() {
    this.ordersService.orders$.subscribe(orders => {
      if (orders && orders.length > 0) {
        orders.forEach(order => {
          if (['RETURN_REQUESTED', 'RETURNING', 'RETURNED'].includes(order.status) || order.returnInfo) {
            this.returnsService.syncFromOrder(order);
          }
        });
        this.cdr.markForCheck();
      }
    });
  }

  @HostListener('document:mousedown', ['$event'])
  onGlobalClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.type-filter-wrapper')) this.showTypeDropdown = false;
    if (!target.closest('.reason-filter-wrapper')) this.showReasonDropdown = false;
    if (!target.closest('.assignee-filter-wrapper')) this.showAssigneeDropdown = false;
    if (!target.closest('.sort-filter-wrapper')) this.showSortDropdown = false;
  }

  toggleDropdown(name: 'type' | 'reason' | 'assignee' | 'sort', event: MouseEvent) {
    event.stopPropagation();
    if (name === 'type') {
      this.showTypeDropdown = !this.showTypeDropdown;
      this.showReasonDropdown = false;
      this.showAssigneeDropdown = false;
      this.showSortDropdown = false;
    } else if (name === 'reason') {
      this.showReasonDropdown = !this.showReasonDropdown;
      this.showTypeDropdown = false;
      this.showAssigneeDropdown = false;
      this.showSortDropdown = false;
    } else if (name === 'assignee') {
      this.showAssigneeDropdown = !this.showAssigneeDropdown;
      this.showTypeDropdown = false;
      this.showReasonDropdown = false;
      this.showSortDropdown = false;
    } else if (name === 'sort') {
      this.showSortDropdown = !this.showSortDropdown;
      this.showTypeDropdown = false;
      this.showReasonDropdown = false;
      this.showAssigneeDropdown = false;
    }
  }

  setTab(tab: string) {
    this.activeTab = tab;
    this.currentPage = 1;
  }

  formatTimeOnly(dateTimeStr: string): string {
    if (!dateTimeStr) return '';
    const parts = dateTimeStr.split(' ');
    return parts.length > 1 ? parts[1] : '';
  }

  formatDateOnly(dateTimeStr: string): string {
    if (!dateTimeStr) return '';
    const parts = dateTimeStr.split(' ');
    return parts[0] || dateTimeStr;
  }

  get returnsList(): ReturnRequest[] {
    return this.returnsService.getAll();
  }

  // --- STATS & COUNTERS ---
  get totalCount() { return this.returnsList.length; }
  get stage1Count() { return this.returnsList.filter(r => r.stage === 1 && r.status !== 'REJECTED').length; }
  get stage2Count() { return this.returnsList.filter(r => r.stage === 2).length; }
  get stage3Count() { return this.returnsList.filter(r => r.stage === 3).length; }
  get stage4Count() { return this.returnsList.filter(r => r.stage === 4).length; }
  get rejectedCount() { return this.returnsList.filter(r => r.status === 'REJECTED').length; }

  // --- CHECKBOX LOGIC (ĐỒNG BỘ CHUẨN TRANG TỔNG QUAN) ---
  get isAllSelected(): boolean {
    const currentItems = this.paginatedReturns;
    if (currentItems.length === 0) return false;
    return currentItems.every(r => this.selectedIds.has(r.id));
  }

  get isIndeterminate(): boolean {
    const currentItems = this.paginatedReturns;
    const selectedCount = currentItems.filter(r => this.selectedIds.has(r.id)).length;
    return selectedCount > 0 && selectedCount < currentItems.length;
  }

  toggleSelectItem(id: string): void {
    if (this.selectedIds.has(id)) {
      this.selectedIds.delete(id);
    } else {
      this.selectedIds.add(id);
    }
  }

  toggleSelectAll(): void {
    if (this.isAllSelected) {
      this.paginatedReturns.forEach(r => this.selectedIds.delete(r.id));
    } else {
      this.paginatedReturns.forEach(r => this.selectedIds.add(r.id));
    }
  }

  clearSelection(): void {
    this.selectedIds.clear();
  }

  // --- DROPDOWN SELECTION LABELS ---
  get selectedTypeLabel(): string {
    return this.typeOptions.find(o => o.value === this.selectedType)?.label || 'Loại yêu cầu';
  }
  get selectedReasonLabel(): string {
    return this.reasonOptions.find(o => o.value === this.selectedReason)?.label || 'Lý do đổi trả';
  }
  get selectedAssigneeLabel(): string {
    return this.assigneeOptions.find(o => o.value === this.selectedAssignee)?.label || 'Người phụ trách';
  }
  get selectedSortLabel(): string {
    return this.sortOptions.find(o => o.value === this.selectedSort)?.label || 'Sắp xếp';
  }

  // --- FILTERING & PAGINATION ---
  get filteredReturns(): ReturnRequest[] {
    const q = (this.searchQuery || '').trim().toLowerCase();
    let result = this.returnsList.filter(req => {
      // Tab Filter
      if (this.activeTab === 'STAGE_1' && (req.stage !== 1 || req.status === 'REJECTED')) return false;
      if (this.activeTab === 'STAGE_2' && req.stage !== 2) return false;
      if (this.activeTab === 'STAGE_3' && req.stage !== 3) return false;
      if (this.activeTab === 'STAGE_4' && req.stage !== 4) return false;
      if (this.activeTab === 'REJECTED' && req.status !== 'REJECTED') return false;

      // Type Filter
      if (this.selectedType !== 'ALL' && req.type !== this.selectedType) return false;

      // Reason Filter
      if (this.selectedReason !== 'ALL' && !req.reason.includes(this.selectedReason)) return false;

      // Assignee Filter
      if (this.selectedAssignee !== 'ALL' && req.assignee !== this.selectedAssignee) return false;

      // Search Query
      if (q) {
        const inId = req.id.toLowerCase().includes(q);
        const inOrder = req.orderNumber.toLowerCase().includes(q);
        const inCustomer = req.customer.name.toLowerCase().includes(q) || req.customer.phone.includes(q);
        const inProduct = req.item.name.toLowerCase().includes(q) || req.item.sku.toLowerCase().includes(q);
        if (!inId && !inOrder && !inCustomer && !inProduct) return false;
      }

      return true;
    });

    // Sorting
    result.sort((a, b) => {
      if (this.selectedSort === 'amount-desc') return b.item.price - a.item.price;
      return 0; // Default date
    });

    return result;
  }

  get totalPages(): number {
    return Math.ceil(this.filteredReturns.length / this.pageSize) || 1;
  }

  get paginatedReturns(): ReturnRequest[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredReturns.slice(start, start + this.pageSize);
  }

  getVisiblePages(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, this.currentPage - 2);
    let end = Math.min(this.totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages || page === this.currentPage) return;
    this.currentPage = page;
  }

  getStartIndex(): number {
    if (this.filteredReturns.length === 0) return 0;
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  getEndIndex(): number {
    return Math.min(this.currentPage * this.pageSize, this.filteredReturns.length);
  }

  resetFilters() {
    this.searchQuery = '';
    this.selectedType = 'ALL';
    this.selectedReason = 'ALL';
    this.selectedAssignee = 'ALL';
    this.selectedSort = 'date-desc';
    this.activeTab = 'ALL';
    this.currentPage = 1;
    this.clearSelection();
  }

  hasActiveFilters(): boolean {
    return (
      (this.searchQuery || '').trim() !== '' ||
      this.selectedType !== 'ALL' ||
      this.selectedReason !== 'ALL' ||
      this.selectedAssignee !== 'ALL' ||
      this.selectedSort !== 'date-desc' ||
      this.activeTab !== 'ALL'
    );
  }

  getStatusMeta(status: ReturnStatus, type: ReturnType = 'REFUND') {
    return this.returnsService.getStatusMeta(status, type);
  }

  formatVND(num: number): string {
    return this.returnsService.formatVND(num);
  }

  triggerToast(msg: string, type: 'success' | 'info' | 'error' = 'success', durationMs = 3500) {
    this.pauseToastTimer();
    this.toastMessage = msg;
    this.toastType = type;
    this.showToast = true;
    this.cdr.markForCheck();
    this.cdr.detectChanges();
    this.toastTimer = setTimeout(() => {
      this.ngZone.run(() => {
        this.closeToast();
      });
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
      this.ngZone.run(() => {
        this.closeToast();
      });
    }, 2000);
  }

  closeToast(): void {
    this.pauseToastTimer();
    this.showToast = false;
    this.cdr.markForCheck();
    this.cdr.detectChanges();
  }

  // Navigate to return detail page
  openDetail(req: ReturnRequest) {
    this.router.navigate(['/admin/orders/returns', req.id]);
  }

  // Batch action simulation
  batchApprove() {
    if (this.selectedIds.size === 0) return;
    const count = this.returnsService.batchApprove(this.selectedIds);
    this.triggerToast(`Đã duyệt chấp thuận ${count} yêu cầu đổi trả!`, 'success');
    this.clearSelection();
  }
}
