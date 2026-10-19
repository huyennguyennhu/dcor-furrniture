import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { 
  LucideAngularModule, 
  Search, Filter, Printer, Package, AlertCircle, CheckCircle2, FileText, Truck, CreditCard,
  RotateCcw, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ChevronDown, Building2, CircleDollarSign, X
} from 'lucide-angular';

interface OrderProduct {
  name: string;
  sku: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  customerName: string;
  phone: string;
  address: string;
  products: OrderProduct[];
  totalAmount: number;
  status: 'PENDING' | 'PROCESSING' | 'SHIPPING' | 'DELIVERED' | 'CANCELLED';
  paymentStatus: 'PAID' | 'UNPAID' | 'PARTIAL';
  paymentMethod: string;
  showroom: string;
  createdAt: string;
  isGift: boolean;
  giftMessage?: string;
  hidePrice: boolean;
  isHighValue?: boolean;
}

const mockOrders: Order[] = [
  {
    id: 'DCOR-ORD-001',
    customerName: 'Nguyễn Văn Minh',
    phone: '0901234567',
    address: '239 Hoàng Diệu, Phường 8, Quận 4, Tp. Hồ Chí Minh',
    products: [
      { name: 'Sofa Indivi 2,5 chỗ (Chân gỗ sồi, vải nỉ Copenhagen nâu)', sku: 'SF-IND-01', quantity: 1, price: 51290000 }
    ],
    totalAmount: 51290000,
    status: 'PENDING',
    paymentStatus: 'UNPAID',
    paymentMethod: 'Chuyển khoản',
    showroom: 'Showroom Quận 1',
    createdAt: '2026-06-14 10:30',
    isGift: false,
    hidePrice: false,
    isHighValue: false,
  },
  {
    id: 'DCOR-ORD-002',
    customerName: 'Lê Thu Trang',
    phone: '0912345678',
    address: 'Khu công nghệ cao, Quận 9, Tp. Hồ Chí Minh',
    products: [
      { name: 'Sofa Indivi 3 chỗ (Chân thép, da Napoli đen)', sku: 'SF-IND-02', quantity: 1, price: 80000000 },
      { name: 'Bàn trà Coda', sku: 'TB-CODA-01', quantity: 1, price: 10000000 }
    ],
    totalAmount: 90000000,
    status: 'PROCESSING',
    paymentStatus: 'PARTIAL',
    paymentMethod: 'Tiền mặt',
    showroom: 'Showroom Thủ Đức',
    createdAt: '2026-06-13 15:45',
    isGift: true,
    giftMessage: 'Chúc mừng tân gia em gái! Chúc gia đình luôn hạnh phúc.',
    hidePrice: true,
    isHighValue: true,
  },
  {
    id: 'DCOR-ORD-003',
    customerName: 'Trần Đại Quang',
    phone: '0933445566',
    address: '12 Nguyễn Huệ, Quận 1, Tp. Hồ Chí Minh',
    products: [
      { name: 'Bàn ăn 6 ghế Gỗ Sồi', sku: 'TB-OAK-06', quantity: 1, price: 25000000 }
    ],
    totalAmount: 25000000,
    status: 'SHIPPING',
    paymentStatus: 'PAID',
    paymentMethod: 'Thẻ tín dụng',
    showroom: 'Kho Tổng',
    createdAt: '2026-06-12 09:00',
    isGift: false,
    hidePrice: false,
    isHighValue: false,
  },
  {
    id: 'DCOR-ORD-004',
    customerName: 'Phạm Thị Hương',
    phone: '0988776655',
    address: '45 Lê Lợi, Quận 1, Tp. Hồ Chí Minh',
    products: [
      { name: 'Giường ngủ thông minh 1m8', sku: 'BD-SMART-18', quantity: 1, price: 125000000 }
    ],
    totalAmount: 125000000,
    status: 'PENDING',
    paymentStatus: 'UNPAID',
    paymentMethod: 'Trả góp',
    showroom: 'Showroom Quận 1',
    createdAt: '2026-06-15 14:20',
    isGift: false,
    hidePrice: false,
    isHighValue: true,
  }
];

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LucideAngularModule],
  templateUrl: './orders.html',
  styleUrls: ['./orders.css']
})
export class OrdersComponent implements OnInit {
  icons = { 
    Search, Filter, Printer, Package, AlertCircle, CheckCircle2, FileText, Truck, CreditCard,
    RotateCcw, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ChevronDown, Building2, CircleDollarSign, X
  };
  
  orders = mockOrders;
  activeStatus = 'ALL';
  activePrintOrder: Order | null = null;

  // Search & Filter State
  searchQuery = '';
  selectedShowroom = 'ALL';
  selectedPaymentStatus = 'ALL';
  selectedPaymentMethod = 'ALL';

  // Dropdown open states
  showShowroomDropdown = false;
  showPaymentStatusDropdown = false;
  showPaymentMethodDropdown = false;

  // Dropdown options
  showroomOptions = [
    { label: 'Tất cả Showroom', value: 'ALL' },
    { label: 'Showroom Quận 1', value: 'Showroom Quận 1' },
    { label: 'Showroom Thủ Đức', value: 'Showroom Thủ Đức' },
    { label: 'Kho Tổng', value: 'Kho Tổng' },
  ];

  paymentStatusOptions = [
    { label: 'Tất cả thanh toán', value: 'ALL', color: '' },
    { label: 'Đã thanh toán', value: 'PAID', color: '#22c55e' },
    { label: 'Đã cọc', value: 'PARTIAL', color: '#eab308' },
    { label: 'Chưa thanh toán', value: 'UNPAID', color: '#ef4444' },
  ];

  paymentMethodOptions = [
    { label: 'Tất cả phương thức', value: 'ALL' },
    { label: 'Tiền mặt', value: 'Tiền mặt' },
    { label: 'Chuyển khoản', value: 'Chuyển khoản' },
    { label: 'Thẻ tín dụng', value: 'Thẻ tín dụng' },
    { label: 'Trả góp', value: 'Trả góp' },
  ];

  // Pagination State (same as Inventory)
  currentPage = 1;
  pageSize = 10;

  constructor(private router: Router) {}

  ngOnInit() {}

  @HostListener('document:mousedown', ['$event'])
  onGlobalClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.showroom-filter-wrapper')) {
      this.showShowroomDropdown = false;
    }
    if (!target.closest('.payment-status-filter-wrapper')) {
      this.showPaymentStatusDropdown = false;
    }
    if (!target.closest('.payment-method-filter-wrapper')) {
      this.showPaymentMethodDropdown = false;
    }
  }

  get selectedShowroomLabel(): string {
    const found = this.showroomOptions.find(o => o.value === this.selectedShowroom);
    return found ? found.label : 'Tất cả Showroom';
  }

  get selectedPaymentStatusLabel(): string {
    const found = this.paymentStatusOptions.find(o => o.value === this.selectedPaymentStatus);
    return found ? found.label : 'Tất cả thanh toán';
  }

  get selectedPaymentMethodLabel(): string {
    const found = this.paymentMethodOptions.find(o => o.value === this.selectedPaymentMethod);
    return found ? found.label : 'Tất cả phương thức';
  }

  onSelectShowroom(value: string) {
    this.selectedShowroom = value;
    this.showShowroomDropdown = false;
    this.currentPage = 1;
  }

  onSelectPaymentStatus(value: string) {
    this.selectedPaymentStatus = value;
    this.showPaymentStatusDropdown = false;
    this.currentPage = 1;
  }

  onSelectPaymentMethod(value: string) {
    this.selectedPaymentMethod = value;
    this.showPaymentMethodDropdown = false;
    this.currentPage = 1;
  }

  get statusFilters() {
    return [
      { id: 'ALL', label: 'Tất cả' },
      { id: 'PENDING', label: 'Chờ xác nhận', count: this.orders.filter(o => o.status === 'PENDING').length },
      { id: 'PROCESSING', label: 'Đang xử lý', count: this.orders.filter(o => o.status === 'PROCESSING').length },
      { id: 'SHIPPING', label: 'Đang vận chuyển', count: this.orders.filter(o => o.status === 'SHIPPING').length },
      { id: 'DELIVERED', label: 'Hoàn tất' },
      { id: 'CANCELLED', label: 'Đã hủy' },
      { id: 'HIGH_VALUE', label: 'Đơn giá trị lớn', count: this.orders.filter(o => o.isHighValue).length }
    ];
  }

  get filteredOrders() {
    const q = (this.searchQuery || '').trim().toLowerCase();
    return this.orders.filter(order => {
      // 1. Status Pill Filter
      if (this.activeStatus === 'HIGH_VALUE' && !order.isHighValue) return false;
      if (this.activeStatus !== 'ALL' && this.activeStatus !== 'HIGH_VALUE' && order.status !== this.activeStatus) return false;

      // 2. Search Query (id, customer name, phone)
      if (q) {
        const matchId = (order.id || '').toLowerCase().includes(q);
        const matchCustomer = (order.customerName || '').toLowerCase().includes(q);
        const matchPhone = (order.phone || '').toLowerCase().includes(q);
        if (!matchId && !matchCustomer && !matchPhone) return false;
      }

      // 3. Showroom
      if (this.selectedShowroom !== 'ALL' && order.showroom !== this.selectedShowroom) return false;

      // 4. Payment status
      if (this.selectedPaymentStatus !== 'ALL' && order.paymentStatus !== this.selectedPaymentStatus) return false;

      // 5. Payment method
      if (this.selectedPaymentMethod !== 'ALL' && order.paymentMethod !== this.selectedPaymentMethod) return false;

      return true;
    });
  }

  // Pagination getters & methods
  get totalPages(): number {
    return Math.ceil(this.filteredOrders.length / this.pageSize) || 1;
  }

  get paginatedOrders(): Order[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.filteredOrders.slice(startIndex, startIndex + this.pageSize);
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
    if (this.filteredOrders.length === 0) return 0;
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  getEndIndex(): number {
    return Math.min(this.currentPage * this.pageSize, this.filteredOrders.length);
  }

  hasActiveFilters(): boolean {
    return (
      (this.searchQuery || '').trim() !== '' ||
      this.selectedShowroom !== 'ALL' ||
      this.selectedPaymentStatus !== 'ALL' ||
      this.selectedPaymentMethod !== 'ALL' ||
      this.activeStatus !== 'ALL'
    );
  }

  resetFilters() {
    this.searchQuery = '';
    this.selectedShowroom = 'ALL';
    this.selectedPaymentStatus = 'ALL';
    this.selectedPaymentMethod = 'ALL';
    this.activeStatus = 'ALL';
    this.showShowroomDropdown = false;
    this.showPaymentStatusDropdown = false;
    this.showPaymentMethodDropdown = false;
    this.currentPage = 1;
  }

  onFilterChange() {
    this.currentPage = 1;
  }

  onStatusFilterClick(statusId: string) {
    this.activeStatus = statusId;
    this.currentPage = 1;
  }

  formatVND(value: number) {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(value);
  }

  handlePrint(order: Order) {
    this.activePrintOrder = order;
    setTimeout(() => {
      window.print();
    }, 300);
  }

  getPendingCount() {
    return this.orders.filter(o => o.status === 'PENDING').length;
  }

  getShippingCount() {
    return this.orders.filter(o => o.status === 'SHIPPING').length;
  }

  getHighValueCount() {
    return this.orders.filter(o => o.isHighValue).length;
  }
}
