import { Component, OnInit, HostListener, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { environment } from '../../../../../../environments/environment';
import { 
  LucideAngularModule, 
  Search, Shield, ShieldCheck, ShieldAlert, ShieldX,
  Calendar, CalendarCheck, Clock, CheckCircle2, AlertCircle,
  ExternalLink, RotateCcw,
  ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  X, Package, Layers, User, Phone, Tag, Check, Sparkles
} from 'lucide-angular';

export interface WarrantyClaimItem {
  id: string;
  claimCode: string;
  orderNumber: string;
  productName: string;
  warrantyCode?: string | null;
  claimType: string;
  issueDescription: string;
  evidenceImages: string[];
  status: string;
  adminNote?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface WarrantyItem {
  id: string; // Mã thẻ / sổ bảo hành (VD: BH-1008)
  orderId?: string;
  orderNumber: string; // Mã đơn hàng gốc (VD: DCOR-ORD-1008)
  customerId?: string | null;
  customerName: string;
  phone: string;
  address: string;
  productId?: string;
  productName: string;
  sku: string;
  serialNumber: string;
  variant: string;
  category: 'SOFA' | 'CHAIR' | 'TABLE' | 'BED' | 'STORAGE' | 'LIGHTING' | 'DECOR';
  categoryLabel: string;
  image: string;
  price: number;
  purchaseDate: string; // Ngày mua / bàn giao
  activationDate: string; // Ngày bắt đầu tính bảo hành
  warrantyMonths: number; // Thời hạn cam kết từ cấu hình sản phẩm (tháng)
  expiryDate: string; // Ngày hết hạn
  daysRemaining: number; // >0: còn ngày, <=0: đã quá hạn
  status: 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED';
  coverageNotes: string[];
  termsNote: string;
  claims?: WarrantyClaimItem[];
}

@Component({
  selector: 'app-orders-warranty',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LucideAngularModule],
  templateUrl: './orders-warranty.html',
  styleUrls: ['./orders-warranty.css']
})
export class OrdersWarrantyComponent implements OnInit {
  icons = { 
    Search, Shield, ShieldCheck, ShieldAlert, ShieldX,
    Calendar, CalendarCheck, Clock, CheckCircle2, AlertCircle,
    ExternalLink, RotateCcw,
    ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
    X, Package, Layers, User, Phone, Tag, Check, Sparkles
  };

  database: WarrantyItem[] = [];
  isLoading = false;
  activeStatusTab: 'ALL' | 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED' | 'LONG_TERM' = 'ALL';

  // Search & Filter state
  searchQuery = '';
  selectedCategory = 'ALL';
  selectedPeriod = 'ALL';

  // Dropdown visibility
  showCategoryDropdown = false;
  showPeriodDropdown = false;

  // Pagination
  currentPage = 1;
  pageSize = 20;

  categoryOptions = [
    { label: 'Tất cả phân loại', value: 'ALL' },
    { label: 'Sofa & Ghế', value: 'SOFA_CHAIR' },
    { label: 'Bàn ăn & Bàn trà', value: 'TABLE' },
    { label: 'Giường ngủ', value: 'BED' },
    { label: 'Tủ & Kệ', value: 'STORAGE' },
    { label: 'Đèn & Trang trí', value: 'LIGHTING_DECOR' }
  ];

  periodOptions = [
    { label: 'Tất cả thời hạn', value: 'ALL' },
    { label: '12 tháng (1 năm)', value: '12' },
    { label: '24 tháng (2 năm)', value: '24' },
    { label: '36 tháng (3 năm)', value: '36' },
    { label: '60 tháng (5 năm)', value: '60' }
  ];

  private cdr = inject(ChangeDetectorRef);
  private http = inject(HttpClient);

  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['search']) {
        this.searchQuery = params['search'];
        this.currentPage = 1;
      }
    });

    this.loadWarrantiesFromApi();
  }

  // Tải danh sách bảo hành thực tế trực tiếp từ PostgreSQL (đơn đã giao/hoàn tất + cấu hình warrantyMonths của sản phẩm)
  private loadWarrantiesFromApi(): void {
    this.isLoading = true;
    this.http.get<{ warranties?: WarrantyItem[]; claims?: WarrantyClaimItem[] }>(`${environment.apiUrl}/admin/warranties`).subscribe({
      next: (res) => {
        this.database = Array.isArray(res?.warranties) ? res.warranties : [];
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('[Admin Warranty] Không thể tải danh sách bảo hành từ PostgreSQL:', err);
        this.database = [];
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  @HostListener('document:mousedown', ['$event'])
  onGlobalClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.category-filter-wrapper')) {
      this.showCategoryDropdown = false;
    }
    if (!target.closest('.period-filter-wrapper')) {
      this.showPeriodDropdown = false;
    }
  }

  // --- STAT COUNTERS ---
  get totalCount(): number {
    return this.database.length;
  }

  get activeCount(): number {
    return this.database.filter(i => i.status === 'ACTIVE').length;
  }

  get expiringSoonCount(): number {
    return this.database.filter(i => i.status === 'EXPIRING_SOON').length;
  }

  get expiredCount(): number {
    return this.database.filter(i => i.status === 'EXPIRED').length;
  }

  get longTermCount(): number {
    return this.database.filter(i => i.warrantyMonths >= 36 && i.status !== 'EXPIRED').length;
  }

  // --- LABELS ---
  get selectedCategoryLabel(): string {
    const found = this.categoryOptions.find(o => o.value === this.selectedCategory);
    return found ? found.label : 'Tất cả phân loại';
  }

  get selectedPeriodLabel(): string {
    const found = this.periodOptions.find(o => o.value === this.selectedPeriod);
    return found ? found.label : 'Tất cả thời hạn';
  }

  // --- FILTER ACTIONS ---
  setStatusTab(tab: 'ALL' | 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED' | 'LONG_TERM') {
    this.activeStatusTab = tab;
    this.currentPage = 1;
  }

  selectCategory(val: string) {
    this.selectedCategory = val;
    this.showCategoryDropdown = false;
    this.currentPage = 1;
  }

  selectPeriod(val: string) {
    this.selectedPeriod = val;
    this.showPeriodDropdown = false;
    this.currentPage = 1;
  }

  hasActiveFilters(): boolean {
    return (
      (this.searchQuery || '').trim() !== '' ||
      this.activeStatusTab !== 'ALL' ||
      this.selectedCategory !== 'ALL' ||
      this.selectedPeriod !== 'ALL'
    );
  }

  resetFilters() {
    this.searchQuery = '';
    this.activeStatusTab = 'ALL';
    this.selectedCategory = 'ALL';
    this.selectedPeriod = 'ALL';
    this.showCategoryDropdown = false;
    this.showPeriodDropdown = false;
    this.currentPage = 1;
  }

  // --- FILTERED LIST ---
  get filteredItems(): WarrantyItem[] {
    const q = (this.searchQuery || '').trim().toLowerCase();

    return this.database.filter(item => {
      // Tab Status filter
      if (this.activeStatusTab === 'ACTIVE' && item.status !== 'ACTIVE') return false;
      if (this.activeStatusTab === 'EXPIRING_SOON' && item.status !== 'EXPIRING_SOON') return false;
      if (this.activeStatusTab === 'EXPIRED' && item.status !== 'EXPIRED') return false;
      if (this.activeStatusTab === 'LONG_TERM') {
        if (item.warrantyMonths < 36 || item.status === 'EXPIRED') return false;
      }

      // Search Query filter (matches ID, order, name, phone, SKU, serial, product name)
      if (q) {
        const matchId = (item.id || '').toLowerCase().includes(q);
        const matchOrder = (item.orderNumber || '').toLowerCase().includes(q);
        const matchCustomer = (item.customerName || '').toLowerCase().includes(q);
        const matchPhone = (item.phone || '').toLowerCase().includes(q);
        const matchProduct = (item.productName || '').toLowerCase().includes(q);
        const matchSku = (item.sku || '').toLowerCase().includes(q);
        const matchSerial = (item.serialNumber || '').toLowerCase().includes(q);

        if (!matchId && !matchOrder && !matchCustomer && !matchPhone && !matchProduct && !matchSku && !matchSerial) {
          return false;
        }
      }

      // Category filter
      if (this.selectedCategory !== 'ALL') {
        if (this.selectedCategory === 'SOFA_CHAIR' && item.category !== 'SOFA' && item.category !== 'CHAIR') return false;
        if (this.selectedCategory === 'TABLE' && item.category !== 'TABLE') return false;
        if (this.selectedCategory === 'BED' && item.category !== 'BED') return false;
        if (this.selectedCategory === 'STORAGE' && item.category !== 'STORAGE') return false;
        if (this.selectedCategory === 'LIGHTING_DECOR' && item.category !== 'LIGHTING' && item.category !== 'DECOR') return false;
      }

      // Period filter
      if (this.selectedPeriod !== 'ALL') {
        if (item.warrantyMonths.toString() !== this.selectedPeriod) return false;
      }

      return true;
    });
  }

  // --- PAGINATION ---
  get totalPages(): number {
    return Math.ceil(this.filteredItems.length / this.pageSize) || 1;
  }

  get paginatedItems(): WarrantyItem[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredItems.slice(start, start + this.pageSize);
  }

  goToPage(p: number) {
    if (p < 1 || p > this.totalPages || p === this.currentPage) return;
    this.currentPage = p;
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
    if (this.filteredItems.length === 0) return 0;
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  getEndIndex(): number {
    return Math.min(this.currentPage * this.pageSize, this.filteredItems.length);
  }

  navigateToOrder(orderNumber: string, event?: MouseEvent) {
    if (event) {
      event.stopPropagation();
    }
    this.router.navigate(['/admin/orders', orderNumber]);
  }

  navigateToCustomer(item: WarrantyItem, event?: MouseEvent) {
    if (event) {
      event.stopPropagation();
    }
    this.router.navigate(['/admin/customers'], {
      queryParams: { q: item.phone || item.customerName }
    });
  }

  // --- FORMATTERS ---
  formatVND(value: number): string {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  }

  getRemainingBadgeLines(item: WarrantyItem): { main: string; sub?: string } {
    if (item.status === 'ACTIVE') {
      if (item.daysRemaining > 365) {
        const years = Math.floor(item.daysRemaining / 365);
        const months = Math.floor((item.daysRemaining % 365) / 30);
        return {
          main: `Còn ${years} năm ${months > 0 ? months + ' tháng' : ''}`.trim(),
          sub: `(${item.daysRemaining} ngày)`
        };
      } else if (item.daysRemaining > 30) {
        const months = Math.floor(item.daysRemaining / 30);
        return {
          main: `Còn ${months} tháng`,
          sub: `(${item.daysRemaining} ngày)`
        };
      } else {
        return {
          main: `Còn ${item.daysRemaining} ngày`
        };
      }
    } else if (item.status === 'EXPIRING_SOON') {
      return {
        main: `Chỉ còn ${item.daysRemaining} ngày`
      };
    } else {
      const overdue = Math.abs(item.daysRemaining);
      return {
        main: `Đã hết hạn`,
        sub: `(${overdue} ngày trước)`
      };
    }
  }

  getRemainingBadgeText(item: WarrantyItem): string {
    const lines = this.getRemainingBadgeLines(item);
    return lines.sub ? `${lines.main} ${lines.sub}` : lines.main;
  }
}
