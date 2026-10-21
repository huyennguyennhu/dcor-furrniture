import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { 
  LucideAngularModule, 
  Search, RotateCcw, AlertCircle, CheckCircle2, Clock, XCircle, Package,
  ArrowRightLeft, HelpCircle, ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, X
} from 'lucide-angular';

interface ReturnRequest {
  id: string;
  orderId: string;
  customerName: string;
  productName: string;
  type: 'REFUND' | 'EXCHANGE' | 'RETURN';
  reason: string;
  status: 'PENDING' | 'REVIEWING' | 'APPROVED' | 'RETURNING' | 'RECEIVED' | 'REFUNDING' | 'COMPLETED' | 'REJECTED';
  assignee: string;
  createdAt: string;
}

const mockReturns: ReturnRequest[] = [
  {
    id: 'RET-000125',
    orderId: 'ORD-001025',
    customerName: 'Nguyễn Như Huyền',
    productName: 'Sofa Luna',
    type: 'RETURN',
    reason: 'Sản phẩm lỗi/hư hỏng',
    status: 'REVIEWING',
    assignee: 'Admin Tran',
    createdAt: '01/09/2026 09:30',
  },
  {
    id: 'RET-000126',
    orderId: 'ORD-001026',
    customerName: 'Trần Văn Kiên',
    productName: 'Bàn trà Coda',
    type: 'EXCHANGE',
    reason: 'Sai sản phẩm',
    status: 'PENDING',
    assignee: 'Chưa phân công',
    createdAt: '01/09/2026 10:15',
  },
  {
    id: 'RET-000127',
    orderId: 'ORD-001022',
    customerName: 'Lê Thu Trang',
    productName: 'Giường ngủ thông minh',
    type: 'REFUND',
    reason: 'Không đúng mô tả',
    status: 'APPROVED',
    assignee: 'Admin Tran',
    createdAt: '30/08/2026 14:20',
  },
  {
    id: 'RET-000128',
    orderId: 'ORD-001015',
    customerName: 'Phạm Hương',
    productName: 'Ghế ăn Gỗ Sồi (x4)',
    type: 'RETURN',
    reason: 'Khách không còn nhu cầu',
    status: 'REJECTED',
    assignee: 'Manager',
    createdAt: '29/08/2026 08:45',
  }
];

@Component({
  selector: 'app-orders-returns',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LucideAngularModule],
  templateUrl: './orders-returns.html',
  styleUrls: ['./orders-returns.css']
})
export class OrdersReturnsComponent implements OnInit {
  icons = { 
    Search, RotateCcw, AlertCircle, CheckCircle2, Clock, XCircle, Package,
    ArrowRightLeft, HelpCircle, ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, X
  };

  mockReturns = mockReturns;
  activeStatus = 'ALL';

  // Search & Filters
  searchQuery = '';
  selectedType = 'ALL';
  selectedReason = 'ALL';

  // Dropdown states
  showTypeDropdown = false;
  showReasonDropdown = false;

  typeOptions = [
    { label: 'Tất cả loại yêu cầu', value: 'ALL' },
    { label: 'Đổi sản phẩm', value: 'EXCHANGE' },
    { label: 'Trả sản phẩm', value: 'RETURN' },
    { label: 'Hoàn tiền', value: 'REFUND' }
  ];

  reasonOptions = [
    { label: 'Tất cả lý do', value: 'ALL' },
    { label: 'Sản phẩm lỗi/hư hỏng', value: 'DEFECTIVE' },
    { label: 'Sai sản phẩm', value: 'WRONG_ITEM' },
    { label: 'Không đúng mô tả', value: 'NOT_AS_DESCRIBED' },
    { label: 'Khách không còn nhu cầu', value: 'NO_LONGER_NEEDED' }
  ];

  // Pagination
  currentPage = 1;
  pageSize = 10;

  constructor(private router: Router) {}

  ngOnInit() {}

  @HostListener('document:mousedown', ['$event'])
  onGlobalClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.type-filter-wrapper')) {
      this.showTypeDropdown = false;
    }
    if (!target.closest('.reason-filter-wrapper')) {
      this.showReasonDropdown = false;
    }
  }

  get selectedTypeLabel(): string {
    const found = this.typeOptions.find(o => o.value === this.selectedType);
    return found ? found.label : 'Tất cả loại yêu cầu';
  }

  get selectedReasonLabel(): string {
    const found = this.reasonOptions.find(o => o.value === this.selectedReason);
    return found ? found.label : 'Tất cả lý do';
  }

  onSelectType(value: string) {
    this.selectedType = value;
    this.showTypeDropdown = false;
    this.currentPage = 1;
  }

  onSelectReason(value: string) {
    this.selectedReason = value;
    this.showReasonDropdown = false;
    this.currentPage = 1;
  }

  onFilterChange() {
    this.currentPage = 1;
  }

  onStatusFilterClick(statusId: string) {
    this.activeStatus = statusId;
    this.currentPage = 1;
  }

  hasActiveFilters(): boolean {
    return (
      (this.searchQuery || '').trim() !== '' ||
      this.selectedType !== 'ALL' ||
      this.selectedReason !== 'ALL' ||
      this.activeStatus !== 'ALL'
    );
  }

  resetFilters() {
    this.searchQuery = '';
    this.selectedType = 'ALL';
    this.selectedReason = 'ALL';
    this.activeStatus = 'ALL';
    this.showTypeDropdown = false;
    this.showReasonDropdown = false;
    this.currentPage = 1;
  }

  get statusFilters() {
    return [
      { id: 'ALL', label: 'Tất cả' },
      { id: 'PENDING', label: 'Chờ xử lý', count: this.mockReturns.filter(r => r.status === 'PENDING').length },
      { id: 'REVIEWING', label: 'Đang xem xét', count: this.mockReturns.filter(r => r.status === 'REVIEWING').length },
      { id: 'APPROVED', label: 'Đã duyệt' },
      { id: 'COMPLETED', label: 'Đã hoàn tất' },
      { id: 'REJECTED', label: 'Đã từ chối' }
    ];
  }

  get filteredReturns(): ReturnRequest[] {
    const q = (this.searchQuery || '').trim().toLowerCase();
    return this.mockReturns.filter(req => {
      // Status
      if (this.activeStatus !== 'ALL' && req.status !== this.activeStatus) return false;

      // Search Query
      if (q) {
        const matchId = (req.id || '').toLowerCase().includes(q);
        const matchOrderId = (req.orderId || '').toLowerCase().includes(q);
        const matchCustomer = (req.customerName || '').toLowerCase().includes(q);
        const matchProduct = (req.productName || '').toLowerCase().includes(q);
        if (!matchId && !matchOrderId && !matchCustomer && !matchProduct) return false;
      }

      // Type
      if (this.selectedType !== 'ALL' && req.type !== this.selectedType) return false;

      // Reason
      if (this.selectedReason !== 'ALL') {
        const reasonMap: Record<string, string> = {
          DEFECTIVE: 'Sản phẩm lỗi/hư hỏng',
          WRONG_ITEM: 'Sai sản phẩm',
          NOT_AS_DESCRIBED: 'Không đúng mô tả',
          NO_LONGER_NEEDED: 'Khách không còn nhu cầu'
        };
        if (req.reason !== reasonMap[this.selectedReason]) return false;
      }

      return true;
    });
  }

  get totalPages(): number {
    return Math.ceil(this.filteredReturns.length / this.pageSize) || 1;
  }

  get paginatedReturns(): ReturnRequest[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.filteredReturns.slice(startIndex, startIndex + this.pageSize);
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages || page === this.currentPage) return;
    this.currentPage = page;
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
    if (this.filteredReturns.length === 0) return 0;
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  getEndIndex(): number {
    return Math.min(this.currentPage * this.pageSize, this.filteredReturns.length);
  }

  getTypeBadgeText(type: string) {
    switch(type) {
      case 'RETURN': return 'Trả sản phẩm';
      case 'EXCHANGE': return 'Đổi sản phẩm';
      case 'REFUND': return 'Hoàn tiền';
      default: return type;
    }
  }

  getPendingCount() {
    return this.mockReturns.filter(r => r.status === 'PENDING').length;
  }

  getProcessingCount() {
    return this.mockReturns.filter(r => ['REVIEWING', 'RETURNING', 'RECEIVED', 'REFUNDING'].includes(r.status)).length;
  }

  getApprovedCount() {
    return this.mockReturns.filter(r => r.status === 'APPROVED').length;
  }

  getCompletedCount() {
    return this.mockReturns.filter(r => r.status === 'COMPLETED').length;
  }

  getRejectedCount() {
    return this.mockReturns.filter(r => r.status === 'REJECTED').length;
  }
}
