import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { 
  LucideAngularModule, 
  Search, AlertCircle, CheckCircle2, Clock, Wrench, ArrowRightLeft, AlertOctagon,
  RotateCcw, Building2, Layers, Calendar, ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, X, Package
} from 'lucide-angular';

interface WarrantyRequest {
  id: string;
  createdAt: string;
  customerName: string;
  phone: string;
  orderId: string;
  productName: string;
  variant: string;
  sku: string;
  reason: string;
  purchaseDate: string;
  warrantyExpiry: string;
  status: 'PENDING' | 'INSPECTING' | 'PROCESSING' | 'REPAIRING' | 'REPLACING' | 'COMPLETED' | 'REJECTED';
  assignee: string;
  isExpiringSoon: boolean;
}

const mockWarranties: WarrantyRequest[] = [
  {
    id: 'WAR-000125',
    createdAt: '01/09/2026 09:30',
    customerName: 'Nguyễn Như Huyền',
    phone: '0901234567',
    orderId: 'ORD-001025',
    productName: 'Sofa Luna (3 chỗ)',
    variant: 'Da thật màu Nâu',
    sku: 'SF-LUN-03',
    reason: 'Lỗi nệm mút',
    purchaseDate: '15/05/2026',
    warrantyExpiry: '15/05/2028',
    status: 'PENDING',
    assignee: 'Chưa phân công',
    isExpiringSoon: false,
  },
  {
    id: 'WAR-000126',
    createdAt: '30/08/2026 14:15',
    customerName: 'Trần Văn Kiên',
    phone: '0912345678',
    orderId: 'ORD-001012',
    productName: 'Bàn ăn Gỗ Sồi nguyên khối',
    variant: '1m6 - Tự nhiên',
    sku: 'TB-OAK-01',
    reason: 'Lỗi nứt vỡ/Cong vênh',
    purchaseDate: '20/01/2026',
    warrantyExpiry: '20/01/2028',
    status: 'INSPECTING',
    assignee: 'KTV Hoàng Sơn',
    isExpiringSoon: false,
  },
  {
    id: 'WAR-000127',
    createdAt: '28/08/2026 10:20',
    customerName: 'Lê Thu Trang',
    phone: '0988776655',
    orderId: 'ORD-000850',
    productName: 'Giường ngủ thông minh 1m8',
    variant: 'Xám đậm',
    sku: 'BD-SMART-18',
    reason: 'Lỗi phụ kiện/Bản lề',
    purchaseDate: '10/09/2024',
    warrantyExpiry: '10/09/2026',
    status: 'REPAIRING',
    assignee: 'KTV Minh Quân',
    isExpiringSoon: true,
  },
  {
    id: 'WAR-000128',
    createdAt: '25/08/2026 08:45',
    customerName: 'Phạm Hương',
    phone: '0933445566',
    orderId: 'ORD-000720',
    productName: 'Tủ quần áo cánh kính 4 buồng',
    variant: 'Trắng/Kính cường lực',
    sku: 'CB-GLS-04',
    reason: 'Lỗi bề mặt/Trầy xước',
    purchaseDate: '05/03/2025',
    warrantyExpiry: '05/03/2027',
    status: 'COMPLETED',
    assignee: 'KTV Hoàng Sơn',
    isExpiringSoon: false,
  }
];

@Component({
  selector: 'app-orders-warranty',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LucideAngularModule],
  templateUrl: './orders-warranty.html',
  styleUrls: ['./orders-warranty.css']
})
export class OrdersWarrantyComponent implements OnInit {
  icons = { 
    Search, AlertCircle, CheckCircle2, Clock, Wrench, ArrowRightLeft, AlertOctagon,
    RotateCcw, Building2, Layers, Calendar, ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, X, Package
  };

  mockWarranties = mockWarranties;
  activeStatus = 'ALL';

  // Search & Filters
  searchQuery = '';
  selectedTime = 'ALL';
  selectedCategory = 'ALL';
  selectedShowroom = 'ALL';

  // Dropdown states
  showTimeDropdown = false;
  showCategoryDropdown = false;
  showShowroomDropdown = false;

  timeOptions = [
    { label: 'Tất cả thời gian', value: 'ALL' },
    { label: 'Hôm nay', value: 'today' },
    { label: '7 ngày qua', value: '7days' },
    { label: 'Tháng này', value: 'this_month' }
  ];

  categoryOptions = [
    { label: 'Tất cả phân loại', value: 'ALL' },
    { label: 'Sofa', value: 'SOFA' },
    { label: 'Bàn ghế', value: 'TABLE' },
    { label: 'Giường', value: 'BED' }
  ];

  showroomOptions = [
    { label: 'Kho/Showroom phụ trách', value: 'ALL' },
    { label: 'Showroom Quận 1', value: 'Showroom Quận 1' },
    { label: 'Kho Tổng', value: 'Kho Tổng' }
  ];

  // Pagination
  currentPage = 1;
  pageSize = 10;

  constructor(private router: Router) {}

  ngOnInit() {}

  @HostListener('document:mousedown', ['$event'])
  onGlobalClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.time-filter-wrapper')) {
      this.showTimeDropdown = false;
    }
    if (!target.closest('.category-filter-wrapper')) {
      this.showCategoryDropdown = false;
    }
    if (!target.closest('.showroom-filter-wrapper')) {
      this.showShowroomDropdown = false;
    }
  }

  get selectedTimeLabel(): string {
    const found = this.timeOptions.find(o => o.value === this.selectedTime);
    return found ? found.label : 'Tất cả thời gian';
  }

  get selectedCategoryLabel(): string {
    const found = this.categoryOptions.find(o => o.value === this.selectedCategory);
    return found ? found.label : 'Tất cả phân loại';
  }

  get selectedShowroomLabel(): string {
    const found = this.showroomOptions.find(o => o.value === this.selectedShowroom);
    return found ? found.label : 'Kho/Showroom phụ trách';
  }

  onSelectTime(value: string) {
    this.selectedTime = value;
    this.showTimeDropdown = false;
    this.currentPage = 1;
  }

  onSelectCategory(value: string) {
    this.selectedCategory = value;
    this.showCategoryDropdown = false;
    this.currentPage = 1;
  }

  onSelectShowroom(value: string) {
    this.selectedShowroom = value;
    this.showShowroomDropdown = false;
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
      this.selectedTime !== 'ALL' ||
      this.selectedCategory !== 'ALL' ||
      this.selectedShowroom !== 'ALL' ||
      this.activeStatus !== 'ALL'
    );
  }

  resetFilters() {
    this.searchQuery = '';
    this.selectedTime = 'ALL';
    this.selectedCategory = 'ALL';
    this.selectedShowroom = 'ALL';
    this.activeStatus = 'ALL';
    this.showTimeDropdown = false;
    this.showCategoryDropdown = false;
    this.showShowroomDropdown = false;
    this.currentPage = 1;
  }

  get statusFilters() {
    return [
      { id: 'ALL', label: 'Tất cả' },
      { id: 'PENDING', label: 'Chờ tiếp nhận', count: this.mockWarranties.filter(r => r.status === 'PENDING').length },
      { id: 'INSPECTING', label: 'Đang kiểm tra', count: this.mockWarranties.filter(r => r.status === 'INSPECTING').length },
      { id: 'PROCESSING', label: 'Chờ xử lý', count: this.mockWarranties.filter(r => r.status === 'PROCESSING').length },
      { id: 'REPAIRING', label: 'Đang sửa chữa', count: this.mockWarranties.filter(r => r.status === 'REPAIRING').length },
      { id: 'REPLACING', label: 'Đang thay thế', count: this.mockWarranties.filter(r => r.status === 'REPLACING').length },
      { id: 'COMPLETED', label: 'Hoàn tất' }
    ];
  }

  get filteredWarranties(): WarrantyRequest[] {
    const q = (this.searchQuery || '').trim().toLowerCase();
    return this.mockWarranties.filter(req => {
      // Status
      if (this.activeStatus !== 'ALL' && req.status !== this.activeStatus) return false;

      // Search Query
      if (q) {
        const matchId = (req.id || '').toLowerCase().includes(q);
        const matchOrderId = (req.orderId || '').toLowerCase().includes(q);
        const matchCustomer = (req.customerName || '').toLowerCase().includes(q);
        const matchSku = (req.sku || '').toLowerCase().includes(q);
        const matchProduct = (req.productName || '').toLowerCase().includes(q);
        if (!matchId && !matchOrderId && !matchCustomer && !matchSku && !matchProduct) return false;
      }

      // Category
      if (this.selectedCategory !== 'ALL') {
        if (this.selectedCategory === 'SOFA' && !req.productName.toLowerCase().includes('sofa')) return false;
        if (this.selectedCategory === 'TABLE' && !req.productName.toLowerCase().includes('bàn') && !req.productName.toLowerCase().includes('ghế')) return false;
        if (this.selectedCategory === 'BED' && !req.productName.toLowerCase().includes('giường')) return false;
      }

      return true;
    });
  }

  get totalPages(): number {
    return Math.ceil(this.filteredWarranties.length / this.pageSize) || 1;
  }

  get paginatedWarranties(): WarrantyRequest[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.filteredWarranties.slice(startIndex, startIndex + this.pageSize);
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
    if (this.filteredWarranties.length === 0) return 0;
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  getEndIndex(): number {
    return Math.min(this.currentPage * this.pageSize, this.filteredWarranties.length);
  }

  getPendingCount() {
    return this.mockWarranties.filter(r => r.status === 'PENDING').length;
  }

  getRepairingCount() {
    return this.mockWarranties.filter(r => r.status === 'REPAIRING').length;
  }

  getExpiringSoonCount() {
    return this.mockWarranties.filter(r => r.isExpiringSoon).length;
  }

  getCompletedCount() {
    return this.mockWarranties.filter(r => r.status === 'COMPLETED').length;
  }
}
