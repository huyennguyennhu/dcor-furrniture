import { IconComponent } from '../../../../shared/components/icon/icon';
import { Component, OnInit, HostListener, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { 
  LucideAngularModule, 
  Package, Plus, Search, Filter, ArrowRightLeft, ArrowUpRight, ArrowDownRight, MoreHorizontal, Image as ImageIcon, X,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, CheckSquare, Square, SlidersHorizontal
} from 'lucide-angular';
import { TransactionModalComponent } from '../../components/transaction-modal/transaction-modal';
import { environment } from '../../../../../environments/environment';

export interface InventoryVariant {
  id: string;
  sku: string;
  name: string;
  price: number;
  physical: number;
  reserved: number;
  available: number;
  threshold: number;
}

export interface InventoryItem {
  id: string;
  sku: string;
  productName: string;
  category: string;
  image: string;
  location: string;
  physicalStock: number;
  reservedStock: number;
  availableStock: number;
  threshold: number;
  status: string;
  variants: InventoryVariant[];
}

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [IconComponent, CommonModule, FormsModule, RouterModule, LucideAngularModule, TransactionModalComponent],
  templateUrl: './inventory.html',
  styleUrls: ['./inventory.css']
})
export class InventoryComponent implements OnInit {
  icons = { 
    Package, Plus, Search, Filter, ArrowRightLeft, ArrowUpRight, ArrowDownRight, MoreHorizontal, ImageIcon, X,
    ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, CheckSquare, Square, SlidersHorizontal
  };

  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);

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

  searchTerm = '';
  locationFilter = 'Tất cả chi nhánh';
  showLocationDropdown = false;
  locationOptions: string[] = ['Tất cả chi nhánh'];

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
    this.fetchWarehouses();
    this.fetchOverview();
  }

  fetchWarehouses() {
    this.http.get<any[]>(`${environment.apiUrl}/admin/inventory/warehouses`).subscribe({
      next: (warehouses) => {
        if (Array.isArray(warehouses) && warehouses.length > 0) {
          this.locationOptions = ['Tất cả chi nhánh', ...warehouses.map(w => w.name)];
          this.cdr.markForCheck();
        }
      },
      error: (err) => {
        console.warn('Could not fetch warehouses:', err);
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
        } else {
          this.rawItems = [];
          this.data = [];
          this.totalItems = 0;
          this.totalPages = 1;
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
  }

  resetColumns(event?: Event) {
    if (event) event.stopPropagation();
    this.columnsConfig.forEach(col => {
      this.columnVisibility[col.key] = true;
    });
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
  }

  getVariants(item: InventoryItem): InventoryVariant[] {
    return item.variants || [];
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
    console.log('Submitted transaction:', data);
    this.closeModal();
    this.fetchOverview();
  }

  alert(message: string) {
    window.alert(message);
  }

  goToDetail(id: string) {
    this.router.navigate(['/admin/inventory/product', id]);
  }
}
