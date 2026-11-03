import { Component, OnInit, HostListener, ElementRef, ViewChild, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { 
  LucideAngularModule, 
  Users, UserPlus, Star, Building2, Activity, Tag, Clock, Download, ChevronDown, Search, ArrowUpDown, ArrowUp, ArrowDown, X, RotateCcw, DollarSign, Check, Lock, ExternalLink, MoreHorizontal, ChevronsRight, ChevronRight, ChevronLeft, ChevronsLeft, Loader2 
} from 'lucide-angular';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

export interface BackendCustomer {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  type: string;
  companyName: string;
  totalSpent: string;
  rewardPoints: number;
  orderCount: number;
  lastPurchaseAt: string | null;
  isLocked: boolean;
  createdAt: string;
}

export interface Customer {
  id: string;
  displayId: string;
  name: string;
  phone: string;
  email: string;
  type: 'Cá nhân' | 'B2B';
  membership: 'Vàng' | 'Bạc' | 'Đồng' | 'B2B Partner';
  ordersCount: number;
  totalSpent: number;
  points: number;
  status: 'Hoạt động' | 'Khóa';
  createdAt: string;
  createdAtTimestamp: number;
  lastPurchaseAt: string;
  labels: string[];
}

@Component({
  selector: 'app-customers',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LucideAngularModule],
  templateUrl: './customers.html',
  styleUrls: ['./customers.css']
})
export class CustomersComponent implements OnInit {
  icons = { 
    Users, UserPlus, Star, Building2, Activity, Tag, Clock, Download, 
    ChevronDown, Search, ArrowUpDown, ArrowUp, ArrowDown, X, RotateCcw, 
    DollarSign, Check, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight, 
    MoreHorizontal, ExternalLink, Lock, Loader2 
  };

  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  isLoading = true;
  customers: Customer[] = [];
  search = '';
  activeCardFilter: 'ALL' | 'NEW' | 'B2B' | 'VIP' = 'ALL';

  kpi = {
    totalCustomers: 0,
    newCustomers: 0,
    b2bCustomers: 0,
    vipCustomers: 0
  };

  sortColumn: 'name' | 'createdAt' | 'totalSpent' = 'createdAt';
  sortDirection: 'asc' | 'desc' = 'desc';
  openColumnMenu: 'name' | 'createdAt' | 'totalSpent' | null = null;

  statusFilter = 'Tất cả trạng thái';
  showStatusDropdown = false;
  statuses = ['Tất cả trạng thái', 'Hoạt động', 'Khóa'];

  membershipFilter = 'Tất cả hạng thành viên';
  showMembershipDropdown = false;
  memberships = ['Tất cả hạng thành viên', 'Vàng', 'Bạc', 'Đồng', 'B2B Partner'];

  spendingFilter = 'Tổng chi tiêu';
  showSpendingDropdown = false;
  spendings = ['Tổng chi tiêu', '< 10 Triệu', '10 - 50 Triệu', '> 50 Triệu'];

  labelFilter = 'Nhãn nội bộ';
  showLabelDropdown = false;
  labels = ['Nhãn nội bộ', 'VIP', 'Khiếu nại', 'Khách sỉ'];

  filtered: Customer[] = [];
  sortedAndFiltered: Customer[] = [];

  activeActionMenu: string | null = null;

  @ViewChild('filterRef', { static: false }) filterRef!: ElementRef;

  // --- PAGINATION ---
  currentPage = 1;
  pageSize = 10;

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['sortBy'] === 'totalSpent' || params['sort'] === 'totalSpent' || params['sortBy'] === 'spending-desc') {
        this.sortColumn = 'totalSpent';
        this.sortDirection = 'desc';
      }
      if (params['filter']) {
        const f = params['filter'].toUpperCase();
        if (['ALL', 'NEW', 'B2B', 'VIP'].includes(f)) {
          this.activeCardFilter = f as any;
          if (f === 'NEW') {
            this.sortColumn = 'createdAt';
            this.sortDirection = 'desc';
          } else if (f === 'VIP') {
            this.labelFilter = 'VIP';
          } else if (f === 'B2B') {
            this.membershipFilter = 'B2B Partner';
          }
        }
      }
      if (params['spending']) {
        if (params['spending'] === 'high' || params['spending'] === '> 50 Triệu') {
          this.spendingFilter = '> 50 Triệu';
        } else if (params['spending'] === 'medium' || params['spending'] === '10 - 50 Triệu') {
          this.spendingFilter = '10 - 50 Triệu';
        } else if (params['spending'] === 'low' || params['spending'] === '< 10 Triệu') {
          this.spendingFilter = '< 10 Triệu';
        } else {
          this.spendingFilter = params['spending'];
        }
      }
      if (params['membership'] || params['tier']) {
        this.membershipFilter = params['membership'] || params['tier'];
      }
      if (params['q'] !== undefined || params['search'] !== undefined || params['id'] !== undefined) {
        this.search = params['q'] || params['search'] || params['id'] || '';
        this.applyFilters();
        this.cdr.markForCheck();
      }
    });
    this.loadCustomers();
  }

  loadCustomers(): void {
    this.isLoading = true;
    this.http.get<BackendCustomer[]>(`${environment.apiUrl}/admin/customers`).subscribe({
      next: (data: BackendCustomer[]) => {
        this.isLoading = false;
        if (data && Array.isArray(data)) {
          this.customers = data.map(c => this.mapBackendCustomer(c));
        }
        this.calculateKpi();
        this.applyFilters();
        this.cdr.markForCheck();
      },
      error: (err: any) => {
        console.error('Không thể tải danh sách khách hàng từ API:', err);
        this.isLoading = false;
        this.calculateKpi();
        this.applyFilters();
        this.cdr.markForCheck();
      }
    });
  }

  mapBackendCustomer(c: BackendCustomer): Customer {
    const spent = Number(c.totalSpent) || 0;
    
    // Tính phân hạng thành viên dựa trên loại & chi tiêu tích lũy
    let membership: 'Vàng' | 'Bạc' | 'Đồng' | 'B2B Partner' = 'Đồng';
    if (c.type === 'B2B' || (c.companyName && c.companyName.trim() !== '')) {
      membership = 'B2B Partner';
    } else if (spent >= 150000000) {
      membership = 'Vàng';
    } else if (spent >= 40000000) {
      membership = 'Bạc';
    } else {
      membership = 'Đồng';
    }

    // Điểm tích lũy (nếu DB chưa có thì quy đổi 1 điểm / 100.000đ)
    const points = c.rewardPoints || Math.floor(spent / 100000);

    // Gán nhãn nhận diện
    const labels: string[] = [];
    if (spent >= 100000000) labels.push('VIP');
    if (membership === 'B2B Partner') labels.push('Khách sỉ');
    if (c.isLocked) labels.push('Đã khóa');

    // Xử lý hiển thị SĐT (Google SSO hoặc SĐT thật)
    const phoneDisplay = c.phone?.startsWith('GOOG_') ? 'Đăng nhập Google' : (c.phone || 'Chưa cập nhật');

    // Mã hiển thị thân thiện: nếu có SĐT thật lấy 4 số cuối, nếu SSO lấy 6 ký tự ID
    const displayId = c.phone && !c.phone.startsWith('GOOG_') && c.phone.length >= 4
      ? `#KH-${c.phone.slice(-4)}`
      : `#KH-${c.id.slice(0, 6).toUpperCase()}`;

    // Format ngày tạo & timestamp
    let createdAtDisplay = '—';
    let createdAtTimestamp = 0;
    if (c.createdAt) {
      const d = new Date(c.createdAt);
      if (!isNaN(d.getTime())) {
        createdAtDisplay = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
        createdAtTimestamp = d.getTime();
      }
    }

    // Format ngày mua gần nhất
    let lastPurchaseDisplay = 'Chưa có đơn';
    if (c.lastPurchaseAt) {
      const lp = new Date(c.lastPurchaseAt);
      if (!isNaN(lp.getTime())) {
        lastPurchaseDisplay = `${lp.getDate().toString().padStart(2, '0')}/${(lp.getMonth() + 1).toString().padStart(2, '0')}/${lp.getFullYear()}`;
      }
    } else if (c.orderCount > 0 && c.createdAt) {
      const d = new Date(c.createdAt);
      lastPurchaseDisplay = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
    }

    return {
      id: c.id,
      displayId,
      name: c.fullName || 'Khách hàng',
      phone: phoneDisplay,
      email: c.email || '—',
      type: membership === 'B2B Partner' ? 'B2B' : 'Cá nhân',
      membership,
      ordersCount: c.orderCount || 0,
      totalSpent: spent,
      points,
      status: c.isLocked ? 'Khóa' : 'Hoạt động',
      createdAt: createdAtDisplay,
      createdAtTimestamp,
      lastPurchaseAt: lastPurchaseDisplay,
      labels
    };
  }

  calculateKpi(): void {
    const total = this.customers.length;
    // Khách hàng mới (trong 30 ngày qua)
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const newCount = this.customers.filter(c => c.createdAtTimestamp >= thirtyDaysAgo).length;

    const b2bCount = this.customers.filter(c => c.type === 'B2B' || c.membership === 'B2B Partner').length;
    const vipCount = this.customers.filter(c => c.labels.includes('VIP') || c.membership === 'Vàng' || c.membership === 'B2B Partner').length;

    this.kpi = {
      totalCustomers: total,
      newCustomers: newCount,
      b2bCustomers: b2bCount,
      vipCustomers: vipCount
    };
  }

  onCardFilter(type: 'ALL' | 'NEW' | 'B2B' | 'VIP'): void {
    if (this.activeCardFilter === type && type !== 'ALL') {
      this.activeCardFilter = 'ALL';
      this.membershipFilter = 'Tất cả hạng thành viên';
      this.labelFilter = 'Nhãn nội bộ';
    } else {
      this.activeCardFilter = type;
      if (type === 'ALL') {
        this.membershipFilter = 'Tất cả hạng thành viên';
        this.labelFilter = 'Nhãn nội bộ';
        this.statusFilter = 'Tất cả trạng thái';
        this.spendingFilter = 'Tổng chi tiêu';
        this.search = '';
      } else if (type === 'NEW') {
        this.sortColumn = 'createdAt';
        this.sortDirection = 'desc';
      } else if (type === 'B2B') {
        this.membershipFilter = 'B2B Partner';
      } else if (type === 'VIP') {
        this.labelFilter = 'VIP';
      }
    }
    this.applyFilters();
  }

  @HostListener('document:mousedown', ['$event'])
  onGlobalClick(event: MouseEvent) {
    if (this.filterRef && !this.filterRef.nativeElement.contains(event.target)) {
      this.showStatusDropdown = false;
      this.showMembershipDropdown = false;
      this.showSpendingDropdown = false;
      this.showLabelDropdown = false;
    }
    const target = event.target as HTMLElement;
    if (!target.closest('.action-menu-container')) {
      this.activeActionMenu = null;
    }
    if (!target.closest('.th-sort-wrapper')) {
      this.openColumnMenu = null;
    }
  }

  toggleDropdown(name: string, event: Event) {
    event.stopPropagation();
    this.showStatusDropdown = name === 'status' ? !this.showStatusDropdown : false;
    this.showMembershipDropdown = name === 'membership' ? !this.showMembershipDropdown : false;
    this.showSpendingDropdown = name === 'spending' ? !this.showSpendingDropdown : false;
    this.showLabelDropdown = name === 'label' ? !this.showLabelDropdown : false;
  }

  toggleColumnSort(column: 'name' | 'createdAt' | 'totalSpent'): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.openColumnMenu = null;
    this.applyFilters();
    this.cdr.markForCheck();
  }

  toggleColumnMenu(column: 'name' | 'createdAt' | 'totalSpent', event: Event): void {
    event.stopPropagation();
    this.openColumnMenu = this.openColumnMenu === column ? null : column;
  }

  setColumnSort(column: 'name' | 'createdAt' | 'totalSpent', direction: 'asc' | 'desc'): void {
    this.sortColumn = column;
    this.sortDirection = direction;
    this.openColumnMenu = null;
    this.applyFilters();
    this.cdr.markForCheck();
  }

  setDropdownValue(type: string, value: string) {
    if (type === 'status') { this.statusFilter = value; this.showStatusDropdown = false; }
    if (type === 'membership') { this.membershipFilter = value; this.showMembershipDropdown = false; }
    if (type === 'spending') { this.spendingFilter = value; this.showSpendingDropdown = false; }
    if (type === 'label') { this.labelFilter = value; this.showLabelDropdown = false; }
    this.applyFilters();
  }

  hasActiveFilters(): boolean {
    return !!(
      this.search ||
      this.statusFilter !== 'Tất cả trạng thái' ||
      this.membershipFilter !== 'Tất cả hạng thành viên' ||
      this.spendingFilter !== 'Tổng chi tiêu' ||
      this.activeCardFilter !== 'ALL' ||
      this.sortColumn !== 'createdAt' ||
      this.sortDirection !== 'desc'
    );
  }

  resetFilters(): void {
    this.search = '';
    this.sortColumn = 'createdAt';
    this.sortDirection = 'desc';
    this.openColumnMenu = null;
    this.statusFilter = 'Tất cả trạng thái';
    this.membershipFilter = 'Tất cả hạng thành viên';
    this.spendingFilter = 'Tổng chi tiêu';
    this.labelFilter = 'Nhãn nội bộ';
    this.activeCardFilter = 'ALL';
    this.showStatusDropdown = false;
    this.showMembershipDropdown = false;
    this.showSpendingDropdown = false;
    this.showLabelDropdown = false;
    this.applyFilters();
  }

  clearSearch(): void {
    this.search = '';
    this.onSearchChange();
  }

  onSearchChange() {
    this.applyFilters();
  }

  get totalPages(): number {
    return Math.ceil(this.sortedAndFiltered.length / this.pageSize) || 1;
  }

  get paginatedCustomers(): Customer[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.sortedAndFiltered.slice(start, start + this.pageSize);
  }

  goToPage(p: number) {
    if (p < 1 || p > this.totalPages || p === this.currentPage) return;
    this.currentPage = p;
  }

  getVisiblePages(): number[] {
    const pages: number[] = [];
    const total = this.totalPages;
    const current = this.currentPage;
    if (total <= 5) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      pages.push(1);
      let start = Math.max(2, current - 1);
      let end = Math.min(total - 1, current + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      pages.push(total);
    }
    return Array.from(new Set(pages)).sort((a, b) => a - b);
  }

  getStartIndex(): number {
    if (this.sortedAndFiltered.length === 0) return 0;
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  getEndIndex(): number {
    return Math.min(this.currentPage * this.pageSize, this.sortedAndFiltered.length);
  }

  applyFilters() {
    this.currentPage = 1;
    this.filtered = this.customers.filter(c => {
      const q = this.search.toLowerCase().trim();
      const matchSearch = !q || 
                          c.name.toLowerCase().includes(q) || 
                          c.phone.toLowerCase().includes(q) || 
                          c.email.toLowerCase().includes(q) || 
                          c.id.toLowerCase().includes(q) ||
                          c.displayId.toLowerCase().includes(q);
      const matchStatus = this.statusFilter === 'Tất cả trạng thái' || c.status === this.statusFilter;
      const matchMembership = this.membershipFilter === 'Tất cả hạng thành viên' || c.membership === this.membershipFilter;
      const matchLabel = this.labelFilter === 'Nhãn nội bộ' || c.labels.includes(this.labelFilter);
      
      let matchSpending = true;
      if (this.spendingFilter === '< 10 Triệu') matchSpending = c.totalSpent < 10000000;
      if (this.spendingFilter === '10 - 50 Triệu') matchSpending = c.totalSpent >= 10000000 && c.totalSpent <= 50000000;
      if (this.spendingFilter === '> 50 Triệu') matchSpending = c.totalSpent > 50000000;

      return matchSearch && matchStatus && matchMembership && matchLabel && matchSpending;
    });

    this.sortedAndFiltered = [...this.filtered].sort((a, b) => {
      let diff = 0;
      if (this.sortColumn === 'createdAt') {
        diff = b.createdAtTimestamp - a.createdAtTimestamp;
        return this.sortDirection === 'desc' ? diff : -diff;
      }
      if (this.sortColumn === 'totalSpent') {
        diff = b.totalSpent - a.totalSpent;
        return this.sortDirection === 'desc' ? diff : -diff;
      }
      if (this.sortColumn === 'name') {
        diff = a.name.localeCompare(b.name, 'vi', { sensitivity: 'base' });
        return this.sortDirection === 'asc' ? diff : -diff;
      }
      return 0;
    });
  }

  toggleActionMenu(id: string, event: Event) {
    event.stopPropagation();
    this.activeActionMenu = this.activeActionMenu === id ? null : id;
  }

  goToDetail(id: string) {
    this.router.navigate([`/admin/customers/${id}`]);
  }

  handleAction(action: string, id: string, event: Event) {
    event.stopPropagation();
    this.activeActionMenu = null;
    if (action === 'label') {
      alert('Tính năng gắn nhãn đang hoàn thiện!');
    } else if (action === 'toggleStatus') {
      const cust = this.customers.find(c => c.id === id);
      if (!cust) return;
      const willLock = cust.status === 'Hoạt động';
      const actionName = willLock ? 'khóa' : 'mở khóa';
      if (confirm(`Bạn có chắc chắn muốn ${actionName} tài khoản của khách hàng "${cust.name}"?`)) {
        this.http.patch<{ message: string }>(`${environment.apiUrl}/admin/customers/${id}/lock`, {
          lock: willLock,
          reason: willLock ? 'Khóa tài khoản bởi quản trị viên' : undefined
        }).subscribe({
          next: (res: any) => {
            cust.status = willLock ? 'Khóa' : 'Hoạt động';
            if (willLock && !cust.labels.includes('Đã khóa')) {
              cust.labels.push('Đã khóa');
            } else if (!willLock) {
              cust.labels = cust.labels.filter(l => l !== 'Đã khóa');
            }
            this.applyFilters();
            this.cdr.markForCheck();
            alert(res.message || `Đã ${actionName} tài khoản thành công!`);
          },
          error: (err: any) => {
            console.error('Lỗi khi thay đổi trạng thái:', err);
            alert('Không thể thay đổi trạng thái tài khoản. Vui lòng kiểm tra quyền hạn!');
          }
        });
      }
    }
  }

  exportData(): void {
    if (!this.sortedAndFiltered.length) {
      alert('Không có dữ liệu khách hàng để xuất!');
      return;
    }
    const headers = ['Mã KH', 'Tên khách hàng', 'Số điện thoại', 'Email', 'Loại', 'Hạng thành viên', 'Số đơn hàng', 'Tổng chi tiêu (VNĐ)', 'Điểm', 'Trạng thái', 'Ngày đăng ký', 'Mua gần nhất'];
    const rows = this.sortedAndFiltered.map(c => [
      `"${c.displayId}"`,
      `"${c.name}"`,
      `"${c.phone}"`,
      `"${c.email}"`,
      `"${c.type}"`,
      `"${c.membership}"`,
      c.ordersCount,
      c.totalSpent,
      c.points,
      `"${c.status}"`,
      `"${c.createdAt}"`,
      `"${c.lastPurchaseAt}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `danh_sach_khach_hang_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  getMembershipColor(membership: string) {
    if (membership === 'Kim Cương') return '#8B5CF6';
    if (membership === 'Vàng') return '#F59E0B';
    if (membership === 'Bạc') return '#9CA3AF';
    if (membership === 'Đồng') return '#D97706';
    return '#3B82F6';
  }
}
