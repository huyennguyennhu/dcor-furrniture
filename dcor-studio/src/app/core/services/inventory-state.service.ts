import { Injectable } from '@angular/core';
import { ProductService } from './product.service';

export interface InventoryVariant {
  id: string;
  sku: string;
  name: string;
  price: number;
  physical: number;
  reserved: number;
  available: number;
  threshold: number;
  status?: string;
  image?: string;
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
  threshold: number | string;
  status: string;
  statusCategory?: string;
  statusBadges?: { text: string; type: string }[];
  variants: InventoryVariant[];
}

@Injectable({
  providedIn: 'root'
})
export class InventoryStateService {
  hasLoaded = false;

  data: InventoryItem[] = [];
  rawItems: InventoryItem[] = [];
  summary = {
    totalPhysicalStock: 0,
    totalReservedStock: 0,
    totalAvailableStock: 0,
    inStockCount: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    totalProducts: 0
  };

  currentPage = 1;
  pageSize = 10;
  totalItems = 0;
  totalPages = 1;

  searchTerm = '';
  locationFilter = 'Tất cả chi nhánh';
  statusFilter = 'Tất cả trạng thái';
  selectedCategoryId = '';
  selectedCategoryName = 'Tất cả danh mục';

  expandedRows = new Set<string>();
  locationOptions: string[] = [
    'Tất cả chi nhánh',
    'Kho Tổng (TP.HCM)',
    'Kho Hà Nội',
    'Showroom Quận 1',
    'Showroom Thủ Đức'
  ];
  categoriesTree: any[] = [];
  columnVisibility: { [key: string]: boolean } = {
    product: true,
    physicalStock: true,
    reservedStock: true,
    availableStock: true,
    threshold: true,
    status: true
  };

  constructor(private productService: ProductService) {}

  saveState(state: Partial<InventoryStateService>) {
    Object.assign(this, state);
    this.hasLoaded = true;
  }

  invalidate() {
    this.hasLoaded = false;
    this.productService.clearCache();
  }
}
