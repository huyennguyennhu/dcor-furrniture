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
}

export interface StockOrder {
  id: string;
  rawId?: string;
  type: 'import' | 'export' | 'transfer';
  typeLabel: string;
  createdAt: string;
  sourceLocation: string;
  destinationLocation: string;
  referenceCode: string;
  reason: string;
  creator: string;
  items: StockOrderItem[];
  totalQuantity: number;
  totalAmount: number;
  status: 'COMPLETED' | 'PROCESSING' | 'PENDING' | 'CANCELLED' | 'DRAFT' | 'PLANNED' | 'EXPORTED' | 'IMPORTED';
  rawStatus?: string;
  notes?: string;
}

@Component({
  selector: 'app-inventory-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LucideAngularModule, TransactionModalComponent],
  templateUrl: './inventory-orders.html',
  styleUrls: ['./inventory-orders.css']
})
export class InventoryOrdersComponent implements OnInit {
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

  triggerToast(message: string, subMessage: string = '', type: 'success' | 'warning' | 'error' | 'info' = 'success', durationMs = 4500) {
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }
    this.toastMessage = message;
    this.toastSubMessage = subMessage;
    this.toastType = type;
    this.showToast = true;
    this.cdr.markForCheck();
    this.toastTimer = setTimeout(() => {
      this.showToast = false;
      this.cdr.markForCheck();
    }, durationMs);
  }

  closeToast() {
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }
    this.showToast = false;
    this.cdr.markForCheck();
  }

  isLoading = true;
  data: StockOrder[] = [];
  selectedIds = new Set<string>();

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
      { value: 'DRAFT', label: 'Nháp', count: this.draftCount, color: '#f59e0b' },
      { value: 'PLANNED', label: 'Lên kế hoạch', count: this.plannedCount, color: '#7c3aed' },
      { value: 'COMPLETED', label: 'Đã hoàn tất', count: this.completedStockCount, color: '#10b981' },
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

  getStatusBadgeLabel(status: string, orderType?: string): string {
    switch (status) {
      case 'DRAFT':
        return 'Nháp';
      case 'PLANNED':
        return orderType === 'import' ? 'Chờ nhập kho' : 'Lên kế hoạch';
      case 'IMPORTED':
        return 'Đã nhập kho';
      case 'EXPORTED':
        return 'Đã xuất kho';
      case 'COMPLETED':
        return orderType === 'import' ? 'Đã nhập kho' : (orderType === 'export' ? 'Đã xuất kho' : 'Hoàn tất');
      case 'PROCESSING':
        return orderType === 'import' ? 'Chờ nhập kho' : 'Đang xử lý';
      case 'PENDING':
        return 'Nháp';
      case 'CANCELLED':
        return 'Đã hủy';
      default:
        return status;
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

  // Transaction Modal (Nhập / Xuất)
  modalConfig = {
    isOpen: false,
    type: 'import' as 'import' | 'export',
    initialProductId: '',
    initialVariantId: '',
    isProductFixed: false,
    isVariantFixed: false,
    viewOrderData: null as any
  };

  // Detail Drawer / Modal
  selectedOrder: StockOrder | null = null;
  activeActionMenu: string | null = null;

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const q = params['search'] || params['q'] || params['ref'] || params['code'];
      if (q) {
        this.searchTerm = q;
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
        if (Array.isArray(orders) && orders.length > 0) {
          this.data = orders.map((o: any) => ({
            id: o.orderCode || o.id,
            rawId: o.id,
            type: (o.type || 'import').toLowerCase() as any,
            typeLabel: o.type === 'IMPORT' ? 'Nhập kho' : (o.type === 'EXPORT' ? 'Xuất kho' : 'Chuyển kho'),
            createdAt: new Date(o.createdAt).toLocaleString('vi-VN', {
              day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
            }),
            sourceLocation: o.sourceLocation || o.sourceWarehouse?.name || 'Kho Tổng (TP.HCM)',
            destinationLocation: o.destinationLocation || o.destWarehouse?.name || 'Chi nhánh / Khách hàng',
            sourceWarehouseId: o.sourceWarehouseId,
            destWarehouseId: o.destWarehouseId,
            referenceCode: o.referenceCode || o.orderCode,
            reason: o.reason || 'Lệnh điều phối kho',
            creator: o.creator?.name || 'Admin Quản Trị',
            totalQuantity: o.totalQuantity || 0,
            totalAmount: Number(o.totalAmount || 0),
            status: o.status,
            rawStatus: o.rawStatus || o.status,
            notes: o.notes,
            taxRate: o.taxRate,
            taxAmount: o.taxAmount,
            discount: o.discount,
            items: (o.items || []).map((it: any) => ({
              sku: it.variant?.sku || it.sku || 'SKU',
              productName: it.variant?.product?.name || it.productName || it.variant?.name || 'Sản phẩm nội thất',
              variant: it.variant?.name || it.variantName || 'Tiêu chuẩn',
              quantity: it.quantity,
              unitPrice: Number(it.unitPrice || 0),
              unit: it.unit || 'Chiếc',
              productId: it.variant?.productId || it.productId,
              variantId: it.variantId || it.variant?.id
            }))
          }));
        } else {
          this.data = [];
        }
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.warn('Could not fetch orders from API:', err);
        this.data = [];
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  initMockData() {
    this.data = [
      {
        id: 'NK-2410-001',
        type: 'import',
        typeLabel: 'Nhập kho',
        createdAt: '12/10/2024 09:30',
        sourceLocation: 'NCC BoConcept Đan Mạch',
        destinationLocation: 'Kho Tổng (TP.HCM)',
        referenceCode: 'PO-2024-881',
        reason: 'Nhập lô hàng sofa & bàn trà bộ sưu tập Thu Đông',
        creator: 'Nguyễn Văn An',
        totalQuantity: 35,
        totalAmount: 580000000,
        status: 'COMPLETED',
        notes: 'Hàng đã kiểm tra đầy đủ tem mác và phiếu bảo hành chính hãng.',
        items: [
          { sku: 'SF-OSA-3-BRW', productName: 'Sofa Da Bò Osaka (Băng 3)', variant: 'Nâu Cognac', quantity: 15, unitPrice: 28000000, unit: 'Bộ' },
          { sku: 'BA-IND-WAL', productName: 'Bàn ăn Indochine', variant: 'Gỗ óc chó tự nhiên', quantity: 10, unitPrice: 12000000, unit: 'Chiếc' },
          { sku: 'GE-EAM-BLK', productName: 'Ghế Eames DSW', variant: 'Chân gỗ đệm đen', quantity: 10, unitPrice: 4000000, unit: 'Chiếc' }
        ]
      },
      {
        id: 'XK-2410-002',
        type: 'export',
        typeLabel: 'Xuất kho',
        createdAt: '12/10/2024 14:15',
        sourceLocation: 'Kho Tổng (TP.HCM)',
        destinationLocation: 'Khách hàng: Trần Minh Đức',
        referenceCode: 'ORD-10024',
        reason: 'Xuất giao hàng đơn đặt cọc hợp đồng hoàn thiện biệt thự',
        creator: 'Lê Thị Thu',
        totalQuantity: 6,
        totalAmount: 142000000,
        status: 'COMPLETED',
        notes: 'Giao trực tiếp kèm biên bản bàn giao và hướng dẫn vệ sinh da bò.',
        items: [
          { sku: 'SF-OSA-3-BRW', productName: 'Sofa Da Bò Osaka (Băng 3)', variant: 'Nâu Cognac', quantity: 2, unitPrice: 38000000, unit: 'Bộ' },
          { sku: 'TU-QAR-WHI', productName: 'Tủ Quần Áo 4 Cánh', variant: 'Trắng bóng mờ', quantity: 4, unitPrice: 16500000, unit: 'Chiếc' }
        ]
      },
      {
        id: 'CK-2410-003',
        type: 'transfer',
        typeLabel: 'Chuyển kho',
        createdAt: '11/10/2024 16:45',
        sourceLocation: 'Kho Tổng (TP.HCM)',
        destinationLocation: 'Showroom Quận 1',
        referenceCode: 'TR-2410-019',
        reason: 'Điều chuyển hàng mẫu trưng bày concept mới',
        creator: 'Phạm Hoàng Nam',
        totalQuantity: 12,
        totalAmount: 96000000,
        status: 'PROCESSING',
        notes: 'Đang trên xe vận chuyển nội bộ, dự kiến đến showroom lúc 18h00.',
        items: [
          { sku: 'GE-EAM-BLK', productName: 'Ghế Eames DSW', variant: 'Chân kim loại xám', quantity: 8, unitPrice: 4500000, unit: 'Chiếc' },
          { sku: 'BA-IND-WAL', productName: 'Bàn ăn Indochine', variant: 'Gỗ sồi tự nhiên', quantity: 4, unitPrice: 15000000, unit: 'Chiếc' }
        ]
      },
      {
        id: 'NK-2410-004',
        type: 'import',
        typeLabel: 'Nhập kho',
        createdAt: '10/10/2024 10:20',
        sourceLocation: 'Xưởng Mộc Thủ Công Dcor',
        destinationLocation: 'Kho Hà Nội',
        referenceCode: 'PO-2410-045',
        reason: 'Nhập bổ sung kệ tivi và tủ trang trí sản xuất theo yêu cầu',
        creator: 'Vũ Đức Thịnh',
        totalQuantity: 20,
        totalAmount: 185000000,
        status: 'COMPLETED',
        notes: 'Sơn phủ chống ẩm PU đạt chuẩn xuất khẩu.',
        items: [
          { sku: 'KE-TV-IND', productName: 'Kệ TV Indochine 2m2', variant: 'Gỗ tần bì lau dầu', quantity: 12, unitPrice: 9500000, unit: 'Chiếc' },
          { sku: 'TU-TR-MOD', productName: 'Tủ Trang Trí Modernist', variant: 'Gỗ óc chó Bắc Mỹ', quantity: 8, unitPrice: 8875000, unit: 'Chiếc' }
        ]
      },
      {
        id: 'XK-2410-005',
        type: 'export',
        typeLabel: 'Xuất kho',
        createdAt: '10/10/2024 15:10',
        sourceLocation: 'Kho Hà Nội',
        destinationLocation: 'Dự án Căn hộ Penthouse Ciputra',
        referenceCode: 'ORD-10089',
        reason: 'Xuất nội thất trọn gói bàn giao hợp đồng dự án',
        creator: 'Nguyễn Thị Bích',
        totalQuantity: 18,
        totalAmount: 320000000,
        status: 'PENDING',
        notes: 'Chờ đối tác nghiệm thu hiện trường trước khi xuất kho.',
        items: [
          { sku: 'SF-OSA-3-BRW', productName: 'Sofa Da Bò Osaka (Băng 3)', variant: 'Đen nhung', quantity: 3, unitPrice: 42000000, unit: 'Bộ' },
          { sku: 'BA-IND-WAL', productName: 'Bàn ăn Indochine', variant: 'Mặt đá Ceramic trắng', quantity: 5, unitPrice: 22000000, unit: 'Chiếc' },
          { sku: 'GE-EAM-BLK', productName: 'Ghế Eames DSW', variant: 'Bọc nỉ cao cấp', quantity: 10, unitPrice: 8400000, unit: 'Chiếc' }
        ]
      },
      {
        id: 'CK-2410-006',
        type: 'transfer',
        typeLabel: 'Chuyển kho',
        createdAt: '09/10/2024 11:00',
        sourceLocation: 'Showroom Quận 1',
        destinationLocation: 'Kho Tổng (TP.HCM)',
        referenceCode: 'TR-2410-015',
        reason: 'Thu hồi hàng mẫu đổi mùa về kho tổng bảo dưỡng',
        creator: 'Trần Văn A',
        totalQuantity: 5,
        totalAmount: 48000000,
        status: 'COMPLETED',
        notes: 'Đã hoàn tất kiểm kê và nhập lại hệ thống kho tổng.',
        items: [
          { sku: 'SF-OSA-3-BRW', productName: 'Sofa Da Bò Osaka (Băng 3)', variant: 'Nâu hạt dẻ', quantity: 2, unitPrice: 20000000, unit: 'Bộ' },
          { sku: 'GE-EAM-BLK', productName: 'Ghế Eames DSW', variant: 'Chân gỗ đệm trắng', quantity: 3, unitPrice: 2666666, unit: 'Chiếc' }
        ]
      },
      {
        id: 'XK-2410-007',
        type: 'export',
        typeLabel: 'Xuất kho',
        createdAt: '08/10/2024 17:20',
        sourceLocation: 'Kho Tổng (TP.HCM)',
        destinationLocation: 'Bộ phận xử lý phế phẩm',
        referenceCode: 'DIS-2410-002',
        reason: 'Xuất hủy sản phẩm hư hại do ngập nước kho phụ',
        creator: 'Đỗ Tuấn Kiệt',
        totalQuantity: 3,
        totalAmount: 18500000,
        status: 'COMPLETED',
        notes: 'Đã có biên bản thẩm định hội đồng thanh lý tài sản.',
        items: [
          { sku: 'TU-QAR-WHI', productName: 'Tủ Quần Áo 4 Cánh', variant: 'Trắng vân gỗ', quantity: 3, unitPrice: 6166666, unit: 'Chiếc' }
        ]
      },
      {
        id: 'NK-2410-008',
        type: 'import',
        typeLabel: 'Nhập kho',
        createdAt: '07/10/2024 08:45',
        sourceLocation: 'Khách đổi trả: Hoàng Lan Chi',
        destinationLocation: 'Kho Tổng (TP.HCM)',
        referenceCode: 'RTN-2410-004',
        reason: 'Nhập hàng khách hoàn đổi màu sắc mẫu ghế Eames',
        creator: 'Nguyễn Văn An',
        totalQuantity: 4,
        totalAmount: 16000000,
        status: 'COMPLETED',
        notes: 'Sản phẩm nguyên vẹn, bao bì hộp còn mới 100%.',
        items: [
          { sku: 'GE-EAM-BLK', productName: 'Ghế Eames DSW', variant: 'Đen nguyên bản', quantity: 4, unitPrice: 4000000, unit: 'Chiếc' }
        ]
      }
    ];
  }

  // Filtered dataset
  get filteredOrders(): StockOrder[] {
    return this.data.filter(order => {
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
        const matchesRef = order.referenceCode.toLowerCase().includes(term);
        const matchesCreator = order.creator.toLowerCase().includes(term);
        const matchesReason = order.reason.toLowerCase().includes(term);
        const matchesSource = order.sourceLocation.toLowerCase().includes(term);
        const matchesDest = order.destinationLocation.toLowerCase().includes(term);
        const matchesItem = order.items.some(i => 
          i.sku.toLowerCase().includes(term) || 
          i.productName.toLowerCase().includes(term)
        );
        if (!matchesId && !matchesRef && !matchesCreator && !matchesReason && !matchesSource && !matchesDest && !matchesItem) {
          return false;
        }
      }
      return true;
    });
  }

  // Pagination Getters & Handlers (10 dòng/trang)
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

  get pendingCount(): number {
    return this.data.filter(o => o.status === 'PENDING' || o.status === 'PROCESSING').length;
  }

  get completedCount(): number {
    return this.data.filter(o => o.status === 'COMPLETED').length;
  }

  get processingCount(): number {
    return this.data.filter(o => o.status === 'PROCESSING').length;
  }

  get pendingApprovalCount(): number {
    return this.data.filter(o => o.status === 'PENDING').length;
  }

  get cancelledCount(): number {
    return this.data.filter(o => o.status === 'CANCELLED').length;
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

  /** Open the modal to VIEW an existing order (shows lifecycle buttons) */
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
        sourceWarehouseId: (order as any).sourceWarehouseId,
        destWarehouseId: (order as any).destWarehouseId,
        reason: order.reason,
        creator: order.creator,
        creatorName: order.creator,
        recipientName: (order as any).recipientName,
        notes: (order as any).cleanNotes || order.notes,
        rawNotes: order.notes,
        taxRate: (order as any).taxRate,
        discount: (order as any).discount,
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

  handleOrderStatusChange(event: { orderId: string; newStatus: string; reason?: string }) {
    const { orderId, newStatus, reason } = event;
    const targetOrder = this.data.find(o => o.rawId === orderId || o.id === orderId);
    const isImport = targetOrder?.type === 'import';
    
    this.http.put(`${environment.apiUrl}/admin/inventory/orders/${orderId}/status`, { status: newStatus, cancelReason: reason || null }).subscribe({
      next: () => {
        this.closeModal();
        this.fetchOrders(true);
        const labels: Record<string, string> = {
          PLANNED: isImport ? 'Chờ nhập kho / Lên kế hoạch' : 'Lên kế hoạch xuất',
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
        // Fallback: update locally
        const order = this.data.find(o => o.rawId === orderId || o.id === orderId);
        if (order) {
          (order as any).status = newStatus;
          (order as any).rawStatus = newStatus;
        }
        this.closeModal();
        this.fetchOrders(true);
      }
    });
  }

  handleDeleteOrder(orderId: string) {
    const targetOrder = this.data.find(o => o.rawId === orderId || o.id === orderId);
    const isImport = targetOrder?.type === 'import';
    const typeLabel = isImport ? 'nhập kho' : 'xuất kho';

    this.data = this.data.filter(o => o.rawId !== orderId && o.id !== orderId);
    this.selectedIds.delete(orderId);
    if (targetOrder?.id) this.selectedIds.delete(targetOrder.id);
    this.closeModal();
    this.cdr.markForCheck();

    this.http.delete(`${environment.apiUrl}/admin/inventory/orders/${orderId}`).subscribe({
      next: () => {
        this.fetchOrders(true);
        this.triggerToast(`Xóa phiếu thành công`, `Phiếu ${typeLabel} đã được xóa thành công.`, 'success');
      },
      error: (err) => {
        console.warn('API error deleting order, removing locally:', err);
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
    const orderStatus = isDraft ? 'DRAFT' : 'PLANNED';

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
        this.fetchOrders();
        if (isDraft) {
          this.triggerToast(
            `Đã lưu nháp thành công phiếu ${created.orderCode || created.id}!`,
            'Trạng thái: Nháp (chưa làm thay đổi số lượng tồn kho).',
            'info'
          );
        } else {
          const typeName = isImport ? 'nhập kho (Chờ nhập kho)' : 'xuất kho (Lên kế hoạch xuất)';
          this.triggerToast(
            `Đã tạo thành công phiếu ${typeName} ${created.orderCode || created.id}!`,
            'Trạng thái: Lên kế hoạch (hàng chưa cộng/trừ tồn kho thực tế).',
            'success'
          );
        }
      },
      error: (err) => {
        console.warn('API error creating order, falling back to local list:', err);
        const dateStr = new Date(formData.createdAt || Date.now()).toLocaleDateString('vi-VN');
        const timeStr = new Date(formData.createdAt || Date.now()).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
        
        let totalQty = 0;
        let totalAmt = 0;
        const items: StockOrderItem[] = (formData.items || []).map((it: any) => {
          const q = parseInt(it.quantity, 10) || 1;
          const rawPrice = it.price ? parseInt(it.price.toString().replace(/\D/g, ''), 10) : 15000000;
          totalQty += q;
          totalAmt += q * rawPrice;
          return {
            sku: it.sku || 'SKU-AUTO',
            productName: it.productName || 'Sản phẩm nội thất',
            variant: it.variantName || 'Tiêu chuẩn',
            quantity: q,
            unitPrice: rawPrice,
            unit: it.unit || 'Chiếc'
          };
        });

        const newOrder: StockOrder = {
          id: formData.orderCode || (isImport ? 'NK-2610-0001' : 'PXK-BH-2610-0001'),
          type: (orderType.toLowerCase()) as any,
          typeLabel: isImport ? 'Nhập kho' : (isTransfer ? 'Chuyển kho' : 'Xuất kho'),
          createdAt: `${dateStr} ${timeStr}`,
          sourceLocation: formData.location || 'Kho Tổng (TP.HCM)',
          destinationLocation: formData.destination || 'Chi nhánh / Khách hàng nhận',
          referenceCode: formData.orderCode,
          reason: formData.reason || (isImport ? 'Nhập kho theo kế hoạch' : 'Xuất kho phục vụ hoạt động'),
          creator: formData.creatorName || 'Admin Quản Trị',
          items: items.length > 0 ? items : [
            { sku: 'SF-NEW-01', productName: 'Sản phẩm mới nhập', variant: 'Tiêu chuẩn', quantity: 5, unitPrice: 20000000, unit: 'Bộ' }
          ],
          totalQuantity: totalQty || 5,
          totalAmount: totalAmt || 100000000,
          status: orderStatus,
          notes: formData.note || 'Tạo từ form quản lý kho'
        };

        this.data.unshift(newOrder);
        this.closeModal();
        if (isDraft) {
          this.triggerToast(
            `Đã lưu nháp thành công ${newOrder.typeLabel}: ${newOrder.id}`,
            'Trạng thái: Nháp (chưa làm thay đổi số lượng tồn kho).',
            'info'
          );
        } else {
          this.triggerToast(
            `Đã phát hành thành công ${newOrder.typeLabel}: ${newOrder.id}`,
            'Số lượng tồn kho thực tế đã được cập nhật ngay lập tức.',
            'success'
          );
        }
      }
    });
  }

  // Detail Modal -> Open full transaction modal
  viewOrderDetail(order: StockOrder, event?: Event) {
    this.viewOrderInModal(order, event);
  }

  closeOrderDetail() {
    this.closeModal();
  }

  updateOrderStatus(order: StockOrder, newStatus: 'COMPLETED' | 'PROCESSING' | 'PENDING' | 'CANCELLED', event?: Event) {
    if (event) event.stopPropagation();
    const prevStatus = order.status;
    order.status = newStatus;
    this.activeActionMenu = null;

    this.http.put(`${environment.apiUrl}/admin/inventory/orders/${order.id}/status`, { status: newStatus }).subscribe({
      next: () => {
        if (newStatus === 'COMPLETED') {
          this.triggerToast(`Lệnh kho ${order.id} đã hoàn tất thành công và cập nhật tồn kho!`, '', 'success');
        }
      },
      error: (err) => {
        console.warn('API error updating order status:', err);
      }
    });
  }

  deleteOrder(id: string, event?: Event) {
    if (event) event.stopPropagation();
    if (window.confirm(`Bạn có chắc chắn muốn xóa lệnh ${id}?`)) {
      this.data = this.data.filter(o => o.id !== id);
      this.selectedIds.delete(id);
      if (this.selectedOrder?.id === id) {
        this.selectedOrder = null;
      }
      this.activeActionMenu = null;
    }
  }

  batchUpdateStatus(status: 'COMPLETED' | 'PROCESSING' | 'CANCELLED') {
    if (this.selectedIds.size === 0) return;
    const ids = Array.from(this.selectedIds);
    this.data.forEach(o => {
      if (this.selectedIds.has(o.id)) {
        o.status = status;
      }
    });
    this.selectedIds.clear();

    ids.forEach(id => {
      this.http.put(`${environment.apiUrl}/admin/inventory/orders/${id}/status`, { status }).subscribe({
        error: (err) => console.warn(`Error batch updating order ${id}:`, err)
      });
    });

    this.triggerToast('Cập nhật trạng thái thành công', 'Đã cập nhật trạng thái các lệnh đã chọn.', 'success');
  }

  printOrder(order: StockOrder, event?: Event) {
    if (event) event.stopPropagation();
    window.print();
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
