import { Component, OnInit, HostListener, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { 
  LucideAngularModule, 
  Package, Tag, AlertCircle, TrendingUp, Search, Download, Plus, ChevronDown, ArrowUp, ArrowDown 
} from 'lucide-angular';

interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  variants: number;
  price: number;
  stock: number;
  status: 'Đang bán' | 'Sắp hết' | 'Hết hàng' | 'Đã ẩn';
  image: string;
}

const SORT_LABELS: Record<string, string> = {
  'newest': 'Mới cập nhật',
  'price': 'Theo giá bán',
  'stock': 'Theo tồn kho',
  'a_z': 'Theo bảng chữ cái'
};

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LucideAngularModule],
  templateUrl: './products.html',
  styleUrls: ['./products.css']
})
export class ProductsComponent implements OnInit {
  icons = { Package, Tag, AlertCircle, TrendingUp, Search, Download, Plus, ChevronDown, ArrowUp, ArrowDown };

  products: Product[] = [];
  isLoading = true;
  search = '';
  
  activeSort = 'newest';
  sortDirection: 'desc' | 'asc' = 'desc';
  showSortDropdown = false;
  SORT_LABELS = SORT_LABELS;
  sortLabelKeys = Object.keys(SORT_LABELS);

  categoryFilter = 'Tất cả danh mục';
  showCategoryDropdown = false;
  categories = ['Tất cả danh mục', 'Nội thất', 'Đèn', 'Phụ kiện'];

  statusFilter = 'Tất cả trạng thái';
  showStatusDropdown = false;
  statuses = ['Tất cả trạng thái', 'Đang bán', 'Sắp hết', 'Hết hàng', 'Đã ẩn'];

  selectedProducts = new Set<string>();
  showBulkActions = false;

  filtered: Product[] = [];
  sortedAndFiltered: Product[] = [];

  activeActionMenu: string | null = null;

  @ViewChild('filterRef', { static: false }) filterRef!: ElementRef;

  constructor(private router: Router) {}

  ngOnInit() {
    this.fetchProducts();
  }

  fetchProducts() {
    this.isLoading = true;
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        const mapped: Product[] = data.map((p: any) => ({
          id: p.id,
          sku: p.id,
          name: p.shortDescription_vi || p.shortDescription || p.productId,
          category: p.category || 'Khác',
          variants: p.variantsCount || 0,
          price: p.prices && p.prices[0] ? p.prices[0].price : 0,
          stock: Math.floor(Math.random() * 100), // Dummy stock
          status: 'Đang bán',
          image: p.images && p.images.length > 0 ? p.images[0] : ''
        }));
        this.products = mapped;
        this.applyFilters();
        this.isLoading = false;
      })
      .catch(err => {
        console.error('Failed to fetch products', err);
        // Fallback mockup data if api is not ready
        this.products = [
          { id: '1', sku: 'SKU-01', name: 'Sofa Indivi', category: 'Nội thất', variants: 3, price: 12000000, stock: 15, status: 'Đang bán', image: '' },
          { id: '2', sku: 'SKU-02', name: 'Đèn bàn', category: 'Đèn', variants: 1, price: 500000, stock: 4, status: 'Sắp hết', image: '' },
          { id: '3', sku: 'SKU-03', name: 'Ghế xoay', category: 'Nội thất', variants: 5, price: 2500000, stock: 0, status: 'Hết hàng', image: '' }
        ];
        this.applyFilters();
        this.isLoading = false;
      });
  }

  @HostListener('document:mousedown', ['$event'])
  onGlobalClick(event: MouseEvent) {
    if (this.filterRef && !this.filterRef.nativeElement.contains(event.target)) {
      this.showSortDropdown = false;
      this.showCategoryDropdown = false;
      this.showStatusDropdown = false;
      this.showBulkActions = false;
    }
  }

  toggleDropdown(name: string, event: Event) {
    event.stopPropagation();
    this.showSortDropdown = name === 'sort' ? !this.showSortDropdown : false;
    this.showCategoryDropdown = name === 'category' ? !this.showCategoryDropdown : false;
    this.showStatusDropdown = name === 'status' ? !this.showStatusDropdown : false;
    this.showBulkActions = name === 'bulk' ? !this.showBulkActions : false;
  }

  toggleSortDirection() {
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    this.applyFilters();
  }

  setDropdownValue(type: string, value: string) {
    if (type === 'sort') { this.activeSort = value; this.showSortDropdown = false; }
    if (type === 'category') { this.categoryFilter = value; this.showCategoryDropdown = false; }
    if (type === 'status') { this.statusFilter = value; this.showStatusDropdown = false; }
    this.applyFilters();
  }

  onSearchChange() {
    this.applyFilters();
  }

  applyFilters() {
    this.filtered = this.products.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(this.search.toLowerCase()) || 
                          p.sku.toLowerCase().includes(this.search.toLowerCase());
      const matchCategory = this.categoryFilter === 'Tất cả danh mục' || p.category === this.categoryFilter;
      const matchStatus = this.statusFilter === 'Tất cả trạng thái' || p.status === this.statusFilter;
      
      return matchSearch && matchCategory && matchStatus;
    });

    this.sortedAndFiltered = [...this.filtered].sort((a, b) => {
      let result = 0;
      if (this.activeSort === 'newest') result = b.id.localeCompare(a.id);
      if (this.activeSort === 'price') result = b.price - a.price;
      if (this.activeSort === 'stock') result = b.stock - a.stock;
      if (this.activeSort === 'a_z') result = a.name.localeCompare(b.name);
      
      return this.sortDirection === 'asc' ? -result : result;
    });
  }

  toggleSelection(id: string, event: Event) {
    event.stopPropagation();
    if (this.selectedProducts.has(id)) {
      this.selectedProducts.delete(id);
    } else {
      this.selectedProducts.add(id);
    }
  }

  toggleSelectAll(event: Event) {
    event.stopPropagation();
    if (this.selectedProducts.size === this.sortedAndFiltered.length && this.sortedAndFiltered.length > 0) {
      this.selectedProducts.clear();
    } else {
      this.sortedAndFiltered.forEach(p => this.selectedProducts.add(p.id));
    }
  }

  isAllSelected() {
    return this.sortedAndFiltered.length > 0 && this.selectedProducts.size === this.sortedAndFiltered.length;
  }

  goToDetail(id: string) {
    this.router.navigate([`/admin/products/${id}`]);
  }

  handleBulkAction(action: string, event: Event) {
    event.stopPropagation();
    this.showBulkActions = false;
    if (action === 'hide') {
      alert(`Đã ẩn ${this.selectedProducts.size} SP`);
    } else if (action === 'show') {
      alert(`Đã hiện ${this.selectedProducts.size} SP`);
    } else if (action === 'delete') {
      alert(`Đã xóa ${this.selectedProducts.size} SP`);
    }
    this.selectedProducts.clear();
  }

  getStockColor(stock: number) {
    return stock === 0 ? '#ef4444' : stock < 10 ? '#f59e0b' : 'var(--text-primary)';
  }

  getStockWeight(stock: number) {
    return stock < 10 ? 600 : 400;
  }

  getStatusBg(status: string) {
    if (status === 'Đang bán') return 'rgba(16, 185, 129, 0.1)';
    if (status === 'Hết hàng') return 'rgba(239, 68, 68, 0.1)';
    if (status === 'Sắp hết') return 'rgba(245, 158, 11, 0.1)';
    return 'rgba(100, 116, 139, 0.1)';
  }

  getStatusColor(status: string) {
    if (status === 'Đang bán') return '#10b981';
    if (status === 'Hết hàng') return '#ef4444';
    if (status === 'Sắp hết') return '#f59e0b';
    return '#64748b';
  }
}
