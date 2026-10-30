import { IconComponent } from '../../../../shared/components/icon/icon';
import { Component, OnInit, HostListener, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { 
  LucideAngularModule, 
  Users, UserPlus, Star, Activity, Tag, Clock, Download, ChevronDown, Search, ArrowUpDown, ArrowUp, ArrowDown 
} from 'lucide-angular';
import { environment } from '../../../../../environments/environment';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  type: 'Cá nhân' | 'B2B';
  membership: 'Kim Cương' | 'Vàng' | 'Bạc' | 'Đồng' | 'B2B Partner';
  ordersCount: number;
  totalSpent: number;
  points: number;
  status: 'Hoạt động' | 'Khóa';
  createdAt: string;
  lastPurchaseAt: string;
  labels: string[];
}

const SORT_LABELS: Record<string, string> = {
  'newest': 'Mới đăng ký nhất',
  'recent_purchase': 'Mới mua gần đây',
  'spent': 'Theo chi tiêu',
  'a_z': 'Theo bảng chữ cái'
};

@Component({
  selector: 'app-customers',
  standalone: true,
  imports: [IconComponent, CommonModule, FormsModule, RouterModule, LucideAngularModule],
  templateUrl: './customers.html',
  styleUrls: ['./customers.css']
})
export class CustomersComponent implements OnInit {
  icons = { Users, UserPlus, Star, Activity, Tag, Clock, Download, ChevronDown, Search, ArrowUpDown, ArrowUp, ArrowDown };

  customers: Customer[] = [];
  isLoading = false;
  search = '';

  activeSort = 'newest';
  sortDirection: 'desc' | 'asc' = 'desc';
  showSortDropdown = false;
  SORT_LABELS = SORT_LABELS;
  sortLabelKeys = Object.keys(SORT_LABELS);

  statusFilter = 'Tất cả trạng thái';
  showStatusDropdown = false;
  statuses = ['Tất cả trạng thái', 'Hoạt động', 'Khóa'];

  membershipFilter = 'Tất cả hạng thành viên';
  showMembershipDropdown = false;
  memberships = ['Tất cả hạng thành viên', 'Kim Cương', 'Vàng', 'Bạc', 'Đồng', 'B2B Partner'];

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

  constructor(private router: Router, private http: HttpClient) {}

  ngOnInit() {
    this.loadCustomers();
  }

  loadCustomers() {
    this.isLoading = true;
    this.http.get<Customer[]>(`${environment.apiUrl}/admin/customers`).subscribe({
      next: (data) => {
        this.customers = data;
        this.isLoading = false;
        this.applyFilters();
      },
      error: (err) => {
        console.error('Lỗi tải danh sách khách hàng:', err);
        this.isLoading = false;
        this.applyFilters();
      }
    });
  }

  @HostListener('document:mousedown', ['$event'])
  onGlobalClick(event: MouseEvent) {
    if (this.filterRef && !this.filterRef.nativeElement.contains(event.target)) {
      this.showSortDropdown = false;
      this.showStatusDropdown = false;
      this.showMembershipDropdown = false;
      this.showSpendingDropdown = false;
      this.showLabelDropdown = false;
    }
    const target = event.target as HTMLElement;
    if (!target.closest('.action-menu-container')) {
      this.activeActionMenu = null;
    }
  }

  toggleDropdown(name: string, event: Event) {
    event.stopPropagation();
    this.showSortDropdown = name === 'sort' ? !this.showSortDropdown : false;
    this.showStatusDropdown = name === 'status' ? !this.showStatusDropdown : false;
    this.showMembershipDropdown = name === 'membership' ? !this.showMembershipDropdown : false;
    this.showSpendingDropdown = name === 'spending' ? !this.showSpendingDropdown : false;
    this.showLabelDropdown = name === 'label' ? !this.showLabelDropdown : false;
  }

  toggleSortDirection() {
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    this.applyFilters();
  }

  setDropdownValue(type: string, value: string) {
    if (type === 'sort') { this.activeSort = value; this.showSortDropdown = false; }
    if (type === 'status') { this.statusFilter = value; this.showStatusDropdown = false; }
    if (type === 'membership') { this.membershipFilter = value; this.showMembershipDropdown = false; }
    if (type === 'spending') { this.spendingFilter = value; this.showSpendingDropdown = false; }
    if (type === 'label') { this.labelFilter = value; this.showLabelDropdown = false; }
    this.applyFilters();
  }

  onSearchChange() {
    this.applyFilters();
  }

  applyFilters() {
    this.filtered = this.customers.filter(c => {
      const matchSearch = (c.name || '').toLowerCase().includes(this.search.toLowerCase()) || 
                          (c.phone || '').includes(this.search) || 
                          (c.email || '').toLowerCase().includes(this.search.toLowerCase()) || 
                          (c.id || '').toLowerCase().includes(this.search.toLowerCase());
      const matchStatus = this.statusFilter === 'Tất cả trạng thái' || c.status === this.statusFilter;
      const matchMembership = this.membershipFilter === 'Tất cả hạng thành viên' || c.membership === this.membershipFilter;
      const matchLabel = this.labelFilter === 'Nhãn nội bộ' || (c.labels && c.labels.includes(this.labelFilter));
      
      let matchSpending = true;
      if (this.spendingFilter === '< 10 Triệu') matchSpending = c.totalSpent < 10000000;
      if (this.spendingFilter === '10 - 50 Triệu') matchSpending = c.totalSpent >= 10000000 && c.totalSpent <= 50000000;
      if (this.spendingFilter === '> 50 Triệu') matchSpending = c.totalSpent > 50000000;

      return matchSearch && matchStatus && matchMembership && matchLabel && matchSpending;
    });

    this.sortedAndFiltered = [...this.filtered].sort((a, b) => {
      let result = 0;
      if (this.activeSort === 'newest') result = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (this.activeSort === 'recent_purchase') result = new Date(b.lastPurchaseAt).getTime() - new Date(a.lastPurchaseAt).getTime();
      if (this.activeSort === 'spent') result = b.totalSpent - a.totalSpent;
      if (this.activeSort === 'a_z') result = (a.name || '').localeCompare(b.name || '');
      
      return this.sortDirection === 'asc' ? -result : result;
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
    const customer = this.customers.find(c => c.id === id);
    if (!customer) return;

    if (action === 'toggleStatus') {
      const newStatus = customer.status === 'Khóa' ? 'Hoạt động' : 'Khóa';
      if (confirm(`Bạn có muốn chuyển trạng thái tài khoản của "${customer.name}" sang "${newStatus}" không?`)) {
        this.http.put(`${environment.apiUrl}/admin/customers/${id}/status`, { status: newStatus }).subscribe({
          next: () => {
            this.loadCustomers();
          },
          error: (err) => {
            alert(err.error?.message || 'Không thể cập nhật trạng thái.');
          }
        });
      }
    } else if (action === 'label') {
      const newLabel = prompt('Nhập nhãn gắn cho khách hàng (VD: VIP, Khách sỉ, Khiếu nại):', customer.labels?.[0] || 'VIP');
      if (newLabel && newLabel.trim()) {
        if (!customer.labels) customer.labels = [];
        if (!customer.labels.includes(newLabel.trim())) {
          customer.labels.push(newLabel.trim());
          this.applyFilters();
        }
      }
    }
  }

  getMembershipColor(membership: string) {
    if (membership === 'Kim Cương') return '#8B5CF6';
    if (membership === 'Vàng') return '#F59E0B';
    if (membership === 'Bạc') return '#9CA3AF';
    if (membership === 'Đồng') return '#D97706';
    return '#3B82F6';
  }
}
