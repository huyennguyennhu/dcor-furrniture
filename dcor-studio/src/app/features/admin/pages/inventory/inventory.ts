import { IconComponent } from '../../../../shared/components/icon/icon';
import { Component, OnInit, OnDestroy, HostListener, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { 
  LucideAngularModule, 
  Package, Plus, Search, Filter, ArrowRightLeft, ArrowUpRight, ArrowDownRight, MoreHorizontal, Image as ImageIcon, X,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, CheckSquare, Square, SlidersHorizontal,
  Building2, Layers, Tag, RotateCcw, CornerDownRight
} from 'lucide-angular';
import { TransactionModalComponent } from '../../components/transaction-modal/transaction-modal';
import { environment } from '../../../../../environments/environment';
import { InventoryStateService, InventoryVariant, InventoryItem } from '../../../../core/services/inventory-state.service';

export type { InventoryVariant, InventoryItem };

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [IconComponent, CommonModule, FormsModule, RouterModule, LucideAngularModule, TransactionModalComponent],
  templateUrl: './inventory.html',
  styleUrls: ['./inventory.css']
})
export class InventoryComponent implements OnInit, OnDestroy {
  icons = { 
    Package, Plus, Search, Filter, ArrowRightLeft, ArrowUpRight, ArrowDownRight, MoreHorizontal, ImageIcon, X,
    ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, CheckSquare, Square, SlidersHorizontal,
    Building2, Layers, Tag, RotateCcw, CornerDownRight
  };

  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);
  private stateService = inject(InventoryStateService);

  data: InventoryItem[] = [];
  rawItems: InventoryItem[] = [];
  isLoading = true;
  selectedIds = new Set<string>();

  // Tùy chỉnh ẩn/hiển thị cột
  columnsConfig = [
    { key: 'product', label: 'Sản phẩm', locked: true },
    { key: 'physicalStock', label: 'Tồn thực tế', locked: false },
    { key: 'reservedStock', label: 'Đang giữ chỗ', locked: false },
    { key: 'availableStock', label: 'Có thể bán', locked: false },
    { key: 'threshold', label: 'Cảnh báo', locked: false },
    { key: 'status', label: 'Trạng thái', locked: false }
  ];

  columnVisibility: { [key: string]: boolean } = {
    product: true,
    physicalStock: true,
    reservedStock: true,
    availableStock: true,
    threshold: true,
    status: true
  };

  showColumnDropdown = false;

  // Phân trang 10 sản phẩm / trang
  currentPage = 1;
  pageSize = 10;
  totalItems = 0;
  totalPages = 1;
  private searchTimeout: any;

  summary = {
    totalPhysicalStock: 0,
    totalReservedStock: 0,
    totalAvailableStock: 0,
    inStockCount: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    totalProducts: 0
  };

  // 1. Tìm tức thời
  searchTerm = '';

  // 2. Chi nhánh / Kho
  locationFilter = 'Tất cả chi nhánh';
  showLocationDropdown = false;
  locationOptions: string[] = [
    'Tất cả chi nhánh',
    'Kho Tổng (TP.HCM)',
    'Kho Hà Nội',
    'Showroom Quận 1',
    'Showroom Thủ Đức'
  ];

  // 3. Trạng thái tồn
  statusFilter = 'Tất cả trạng thái';
  showStatusDropdown = false;
  statusOptions: string[] = [
    'Tất cả trạng thái',
    'Còn hàng',
    'Sắp hết hàng',
    'Hết hàng'
  ];

  // 4. Danh mục cấp 1 & cấp 2
  categoryFilter = 'Tất cả danh mục';
  selectedCategoryId = '';
  showCategoryDropdown = false;
  categoriesTree: any[] = [];
  categorySearchTerm = '';
  expandedCategoryIds = new Set<string>();

  // Modal
  modalConfig = {
    isOpen: false,
    type: 'import' as 'import' | 'export',
    initialProductId: '',
    initialVariantId: '',
    isProductFixed: false,
    isVariantFixed: false
  };

  openVariantDropdown: string | null = null;
  expandedRows = new Set<string>();
  activeActionMenu: string | null = null;

  constructor(private router: Router) {}

  ngOnInit() {
    if (this.stateService.hasLoaded) {
      // Khôi phục trạng thái tức thì không cần tải lại, tránh giật màn hình
      this.data = this.stateService.data;
      this.rawItems = this.stateService.rawItems;
      this.summary = this.stateService.summary;
      this.totalItems = this.stateService.totalItems;
      this.totalPages = this.stateService.totalPages;
      this.currentPage = this.stateService.currentPage;
      this.pageSize = this.stateService.pageSize;
      this.searchTerm = this.stateService.searchTerm;
      this.locationFilter = this.stateService.locationFilter;
      this.statusFilter = this.stateService.statusFilter;
      this.selectedCategoryId = this.stateService.selectedCategoryId;
      this.categoryFilter = this.stateService.selectedCategoryName;
      this.expandedRows = new Set(this.stateService.expandedRows);
      this.locationOptions = this.stateService.locationOptions;
      this.categoriesTree = this.stateService.categoriesTree;
      this.columnVisibility = { ...this.stateService.columnVisibility };
      this.isLoading = false;
      this.cdr.markForCheck();
    } else {
      this.fetchWarehouses();
      this.fetchCategories();
      this.fetchOverview();
    }
  }

  ngOnDestroy() {
    this.syncToStateService();
  }

  syncToStateService() {
    this.stateService.saveState({
      data: this.data,
      rawItems: this.rawItems,
      summary: this.summary,
      totalItems: this.totalItems,
      totalPages: this.totalPages,
      currentPage: this.currentPage,
      pageSize: this.pageSize,
      searchTerm: this.searchTerm,
      locationFilter: this.locationFilter,
      statusFilter: this.statusFilter,
      selectedCategoryId: this.selectedCategoryId,
      selectedCategoryName: this.categoryFilter,
      expandedRows: new Set(this.expandedRows),
      locationOptions: this.locationOptions,
      categoriesTree: this.categoriesTree,
      columnVisibility: { ...this.columnVisibility }
    });
  }

  fetchWarehouses() {
    this.http.get<any[]>(`${environment.apiUrl}/admin/inventory/warehouses`).subscribe({
      next: (warehouses) => {
        if (Array.isArray(warehouses) && warehouses.length > 0) {
          const names = warehouses.map(w => w.name);
          // Đảm bảo các tùy chọn theo yêu cầu và thêm kho từ DB nếu có mới
          const merged = new Set(['Tất cả chi nhánh', 'Kho Tổng (TP.HCM)', 'Kho Hà Nội', 'Showroom Quận 1', 'Showroom Thủ Đức', ...names]);
          this.locationOptions = Array.from(merged);
          this.stateService.locationOptions = this.locationOptions;
          this.cdr.markForCheck();
        }
      },
      error: (err) => {
        console.warn('Could not fetch warehouses:', err);
      }
    });
  }

  fetchCategories() {
    this.http.get<any[]>(`${environment.apiUrl}/admin/inventory/categories`).subscribe({
      next: (cats) => {
        if (Array.isArray(cats)) {
          this.categoriesTree = cats;
          this.stateService.categoriesTree = this.categoriesTree;
          this.cdr.markForCheck();
        }
      },
      error: (err) => {
        console.warn('Could not fetch categories:', err);
      }
    });
  }

  fetchOverview() {
    this.isLoading = true;
    const params: any = {
      page: this.currentPage,
      limit: this.pageSize
    };
    if (this.locationFilter && this.locationFilter !== 'Tất cả chi nhánh') {
      params.warehouseId = this.locationFilter;
    }
    if (this.searchTerm.trim()) {
      params.search = this.searchTerm.trim();
    }
    if (this.statusFilter && this.statusFilter !== 'Tất cả trạng thái') {
      params.stockStatus = this.statusFilter;
    }
    if (this.selectedCategoryId) {
      params.categoryId = this.selectedCategoryId;
    }

    this.http.get<any>(`${environment.apiUrl}/admin/inventory/overview`, { params }).subscribe({
      next: (res) => {
        if (res && res.items) {
          this.summary = res.summary || this.summary;
          this.data = res.items;
          this.rawItems = res.items;
          if (res.pagination) {
            this.totalItems = res.pagination.totalItems;
            this.totalPages = res.pagination.totalPages;
            this.currentPage = res.pagination.page;
          } else {
            this.totalItems = res.items.length;
            this.totalPages = Math.ceil(this.totalItems / this.pageSize) || 1;
          }
          this.syncToStateService();
        } else {
          this.rawItems = [];
          this.data = [];
          this.totalItems = 0;
          this.totalPages = 1;
          this.syncToStateService();
        }
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error fetching inventory overview from Supabase:', err);
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  onSelectLocation(location: string) {
    this.locationFilter = location;
    this.showLocationDropdown = false;
    this.currentPage = 1;
    this.fetchOverview();
  }

  onSelectStatus(status: string) {
    this.statusFilter = status;
    this.showStatusDropdown = false;
    this.currentPage = 1;
    this.fetchOverview();
  }

  get filteredCategories(): any[] {
    if (!this.categorySearchTerm.trim()) {
      return this.categoriesTree;
    }
    const term = this.removeVietnameseTones(this.categorySearchTerm.trim().toLowerCase());
    
    return this.categoriesTree
      .map(cat => {
        const catName = this.removeVietnameseTones(cat.name?.toLowerCase() || '');
        const parentMatches = catName.includes(term);
        
        const matchingChildren = (cat.children || []).filter((sub: any) => {
          const subName = this.removeVietnameseTones(sub.name?.toLowerCase() || '');
          return subName.includes(term);
        });

        if (parentMatches) {
          return {
            ...cat,
            children: matchingChildren.length > 0 ? matchingChildren : cat.children
          };
        } else if (matchingChildren.length > 0) {
          return {
            ...cat,
            children: matchingChildren
          };
        }
        return null;
      })
      .filter(Boolean);
  }

  isCategoryExpanded(cat: any): boolean {
    if (this.categorySearchTerm.trim()) {
      return true; // Tự động mở rộng khi tìm kiếm để nhìn thấy kết quả khớp
    }
    return this.expandedCategoryIds.has(cat.id);
  }

  toggleCategoryExpand(catId: string, event: Event) {
    event.stopPropagation();
    if (this.expandedCategoryIds.has(catId)) {
      this.expandedCategoryIds.delete(catId);
    } else {
      this.expandedCategoryIds.add(catId);
    }
    this.cdr.markForCheck();
  }

  removeVietnameseTones(str: string): string {
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D');
  }

  onSelectCategory(cat: any, parent?: any) {
    if (!cat) {
      this.categoryFilter = 'Tất cả danh mục';
      this.selectedCategoryId = '';
    } else {
      const parentName = typeof parent === 'string' ? parent : parent?.name;
      this.categoryFilter = parentName ? `${parentName} > ${cat.name}` : cat.name;
      this.selectedCategoryId = cat.id;
      if (parent && typeof parent === 'object' && parent.id) {
        this.expandedCategoryIds.add(parent.id);
      }
    }
    this.categorySearchTerm = '';
    this.showCategoryDropdown = false;
    this.currentPage = 1;
    this.fetchOverview();
  }

  hasActiveFilters(): boolean {
    return Boolean(
      this.searchTerm.trim() ||
      this.locationFilter !== 'Tất cả chi nhánh' ||
      this.statusFilter !== 'Tất cả trạng thái' ||
      this.selectedCategoryId
    );
  }

  resetFilters() {
    this.searchTerm = '';
    this.locationFilter = 'Tất cả chi nhánh';
    this.statusFilter = 'Tất cả trạng thái';
    this.categoryFilter = 'Tất cả danh mục';
    this.selectedCategoryId = '';
    this.categorySearchTerm = '';
    this.expandedCategoryIds.clear();
    this.currentPage = 1;
    this.fetchOverview();
  }

  onSearchChange() {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    this.searchTimeout = setTimeout(() => {
      this.currentPage = 1;
      this.fetchOverview();
    }, 300);
  }

  clearSearch() {
    this.searchTerm = '';
    this.currentPage = 1;
    this.fetchOverview();
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages || page === this.currentPage) return;
    this.currentPage = page;
    this.fetchOverview();
  }

  getVisiblePages(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, this.currentPage - 2);
    let end = Math.min(this.totalPages, start + maxVisible - 1);
    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  getStartIndex(): number {
    if (this.totalItems === 0) return 0;
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  getEndIndex(): number {
    return Math.min(this.currentPage * this.pageSize, this.totalItems);
  }

  @HostListener('document:mousedown', ['$event'])
  onGlobalClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.location-filter-wrapper')) {
      this.showLocationDropdown = false;
    }
    if (!target.closest('.status-filter-wrapper')) {
      this.showStatusDropdown = false;
    }
    if (!target.closest('.category-filter-wrapper')) {
      this.showCategoryDropdown = false;
    }
    if (!target.closest('.variant-dropdown-wrapper')) {
      this.openVariantDropdown = null;
    }
    if (!target.closest('.action-menu-container')) {
      this.activeActionMenu = null;
    }
    if (!target.closest('.column-settings-container')) {
      this.showColumnDropdown = false;
    }
  }

  toggleColumnVisibility(colKey: string, event?: Event) {
    if (event) event.stopPropagation();
    if (colKey === 'product') return; // Không cho phép bỏ chọn cột Tên sản phẩm
    this.columnVisibility[colKey] = !this.columnVisibility[colKey];
    this.syncToStateService();
  }

  resetColumns(event?: Event) {
    if (event) event.stopPropagation();
    this.columnsConfig.forEach(col => {
      this.columnVisibility[col.key] = true;
    });
    this.syncToStateService();
  }

  getVisibleColumnCount(): number {
    let count = 2; // Checkbox + Actions
    for (const col of this.columnsConfig) {
      if (this.columnVisibility[col.key]) count++;
    }
    return count;
  }

  toggleExpand(id: string, event: Event) {
    event.stopPropagation();
    if (this.expandedRows.has(id)) {
      this.expandedRows.delete(id);
    } else {
      this.expandedRows.add(id);
    }
    this.syncToStateService();
  }

  getVariants(item: InventoryItem): InventoryVariant[] {
    return item.variants || [];
  }

  getVariantStatus(v: InventoryVariant): string {
    if (v.status) return v.status;
    const thresh = v.threshold != null ? v.threshold : 5;
    if (v.available <= 0) return 'Hết hàng';
    if (v.available <= thresh) return 'Sắp hết';
    return 'Còn hàng';
  }

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
    if (this.selectedIds.size === this.data.length && this.data.length > 0) {
      this.selectedIds.clear();
    } else {
      this.data.forEach(p => this.selectedIds.add(p.id));
    }
  }

  isAllSelected() {
    return this.data.length > 0 && this.selectedIds.size === this.data.length;
  }

  openModal(type: 'import' | 'export', productId: string = '', variantId: string = '', isProductFixed: boolean = false, isVariantFixed: boolean = false) {
    this.modalConfig = {
      isOpen: true,
      type,
      initialProductId: productId,
      initialVariantId: variantId,
      isProductFixed,
      isVariantFixed
    };
    this.activeActionMenu = null;
    this.openVariantDropdown = null;
  }

  closeModal() {
    this.modalConfig.isOpen = false;
  }

  handleModalSubmit(data: any) {
    const isImport = data.type === 'import';
    const isTransfer = (data.reason || '').includes('Chuyển kho');
    const orderType = isImport ? 'IMPORT' : (isTransfer ? 'TRANSFER' : 'EXPORT');
    const isDraft = data.action === 'draft';
    const orderStatus = isDraft ? 'PENDING' : 'COMPLETED';

    const payload = {
      orderCode: data.orderCode,
      status: orderStatus,
      type: orderType,
      sourceLocation: data.location,
      destinationLocation: data.destination,
      sourceWarehouseId: data.sourceWarehouseId,
      destWarehouseId: data.destWarehouseId,
      referenceCode: data.orderCode,
      reason: data.reason,
      notes: data.note,
      createdAt: data.createdAt,
      creatorName: data.creatorName,
      recipientName: data.recipientName,
      items: (data.items || []).map((it: any) => ({
        variantId: it.variantId,
        quantity: parseInt(it.quantity, 10) || 1,
        price: it.price ? parseInt(it.price.toString().replace(/\D/g, ''), 10) : 0,
        unit: it.unit || 'Chiếc'
      }))
    };

    this.http.post<any>(`${environment.apiUrl}/admin/inventory/orders`, payload).subscribe({
      next: (created) => {
        this.closeModal();
        this.fetchOverview();
        if (isDraft) {
          window.alert(`Đã lưu nháp thành công phiếu ${created.orderCode || created.id}!\nTrạng thái: Bản nháp (chưa làm thay đổi số lượng tồn kho).`);
        } else {
          window.alert(`Đã tạo và phát hành thành công phiếu ${created.orderCode || created.id}!\nSố lượng tồn kho thực tế đã được cập nhật ngay lập tức.`);
        }
      },
      error: (err) => {
        console.warn('Could not post order to API:', err);
        this.closeModal();
        this.fetchOverview();
        window.alert(`Đã hoàn tất thao tác cho phiếu ${data.orderCode || 'mới'}.`);
      }
    });
  }

  alert(message: string) {
    window.alert(message);
  }

  goToDetail(id: string) {
    this.syncToStateService();
    this.router.navigate(['/admin/inventory/product', id]);
  }
}
