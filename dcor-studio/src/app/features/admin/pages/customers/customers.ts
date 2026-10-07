import { Component, OnInit, HostListener, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { 
  LucideAngularModule, 
  Users, UserPlus, Star, Activity, Tag, Clock, Download, ChevronDown, Search, ArrowUpDown, ArrowUp, ArrowDown 
} from 'lucide-angular';

interface Customer {
  id: string;
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
  lastPurchaseAt: string;
  labels: string[];
}

const SAMPLE_CUSTOMERS: Customer[] = [
  { id: 'DC-KH-101', name: 'Nguyễn Văn A', phone: '0901234567', email: 'vana@gmail.com', type: 'Cá nhân', membership: 'Vàng', ordersCount: 5, totalSpent: 185490000, points: 1850, status: 'Hoạt động', createdAt: '2023-01-15', lastPurchaseAt: '2026-08-01', labels: ['VIP'] },
  { id: 'DC-KH-102', name: 'Công ty Kiến trúc X', phone: '0987654321', email: 'contact@xdesign.vn', type: 'B2B', membership: 'B2B Partner', ordersCount: 12, totalSpent: 1420000000, points: 14200, status: 'Hoạt động', createdAt: '2023-03-22', lastPurchaseAt: '2026-07-28', labels: ['Khách sỉ', 'VIP'] },
  { id: 'DC-KH-103', name: 'Lê Hoàng Yến', phone: '0911223344', email: 'hoangyen@gmail.com', type: 'Cá nhân', membership: 'Bạc', ordersCount: 2, totalSpent: 48600000, points: 486, status: 'Khóa', createdAt: '2023-06-10', lastPurchaseAt: '2023-07-05', labels: ['Khiếu nại'] },
  { id: 'DC-KH-104', name: 'Trần Văn B', phone: '0933445566', email: 'tranvanb@gmail.com', type: 'Cá nhân', membership: 'Đồng', ordersCount: 1, totalSpent: 5200000, points: 52, status: 'Hoạt động', createdAt: '2026-07-15', lastPurchaseAt: '2026-07-16', labels: [] },
  { id: 'DC-KH-105', name: 'Phạm Thị C', phone: '0977889900', email: 'phamthic@gmail.com', type: 'Cá nhân', membership: 'Vàng', ordersCount: 8, totalSpent: 210000000, points: 2100, status: 'Hoạt động', createdAt: '2024-11-20', lastPurchaseAt: '2026-08-02', labels: ['VIP'] },
];

const SORT_LABELS: Record<string, string> = {
  'newest': 'Mới đăng ký nhất',
  'recent_purchase': 'Mới mua gần đây',
  'spent': 'Theo chi tiêu',
  'a_z': 'Theo bảng chữ cái'
};

@Component({
  selector: 'app-customers',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LucideAngularModule],
  templateUrl: './customers.html',
  styleUrls: ['./customers.css']
})
export class CustomersComponent implements OnInit {
  icons = { Users, UserPlus, Star, Activity, Tag, Clock, Download, ChevronDown, Search, ArrowUpDown, ArrowUp, ArrowDown };

  customers = SAMPLE_CUSTOMERS;
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

  constructor(private router: Router) {}

  ngOnInit() {
    this.applyFilters();
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
    // Close action menu when clicking outside
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
      const matchSearch = c.name.toLowerCase().includes(this.search.toLowerCase()) || 
                          c.phone.includes(this.search) || 
                          c.email.toLowerCase().includes(this.search.toLowerCase()) || 
                          c.id.toLowerCase().includes(this.search.toLowerCase());
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
      let result = 0;
      if (this.activeSort === 'newest') result = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (this.activeSort === 'recent_purchase') result = new Date(b.lastPurchaseAt).getTime() - new Date(a.lastPurchaseAt).getTime();
      if (this.activeSort === 'spent') result = b.totalSpent - a.totalSpent;
      if (this.activeSort === 'a_z') result = a.name.localeCompare(b.name);
      
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
    if (action === 'label') {
      alert('Tính năng gắn nhãn đang phát triển!');
    } else if (action === 'toggleStatus') {
      // Logic for toggle status could be here
    }
  }

  getMembershipColor(membership: string) {
    if (membership === 'Vàng') return '#F59E0B';
    if (membership === 'Bạc') return '#9CA3AF';
    if (membership === 'Đồng') return '#D97706';
    return '#3B82F6';
  }
}
