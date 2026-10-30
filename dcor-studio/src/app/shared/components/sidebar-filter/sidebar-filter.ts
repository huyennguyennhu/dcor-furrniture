import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, ChevronDown, Check, Star } from 'lucide-angular';
import { ProductCategory } from '../../models/catalog.model';
import { 
  CategoryClassificationService, 
  CategoryItem, 
  matchProductRoom, 
  matchProductCollection, 
  matchProductStyle, 
  matchProductMaterial 
} from '../../../core/services/category-classification.service';

export interface FilterState {
  categories: string[];      // Danh mục chính (Sofas, Chairs, Tables, etc.)
  rooms?: string[];          // Phòng & Không gian (Phòng khách, Phòng ăn, etc.)
  collections?: string[];    // Bộ sưu tập (Bergamo, Como, etc.)
  styles?: string[];         // Phong cách (Scandinavian, Modern Luxury, etc.)
  materials?: string[];      // Chất liệu (Da bò, Vải nỉ, etc.)
  colors: string[];          // Màu sắc
  priceRange: [number, number];
  minRating?: number;
}

export interface SubcategoryOption {
  id: string;
  name: string;
  slug: string;
  type: 'room' | 'collection' | 'style' | 'material';
  count?: number;
}

export interface ColorOption {
  name: string;
  slug: string;
  hex: string;
}

@Component({
  selector: 'app-sidebar-filter',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './sidebar-filter.html',
  styleUrls: ['./sidebar-filter.css']
})
export class SidebarFilterComponent implements OnChanges {
  icons = { ChevronDown, Check, Star };

  @Input() filters!: FilterState;
  @Input() rawCategories: ProductCategory[] = [];
  @Input() allProducts: any[] = [];
  @Input() dynamicFilters: any = {};
  @Input() validFilters: any = {};
  @Input() dynamicMaxPrice = 100000000;
  @Input() productCount = 0;
  @Input() ratingCounts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0 };

  @Output() onFilterChange = new EventEmitter<FilterState>();

  // Trạng thái đóng/mở từng khối bộ lọc
  expanded: Record<string, boolean> = {
    category: true,
    room: true,
    collection: true,
    style: true,
    material: true,
    price: true,
    color: true,
    rating: true
  };

  // 1. Danh mục chính (Root categories từ Database: parentId == null)
  displayCategories: { key: string; label: string; count?: number }[] = [];

  // 2. Các khối danh mục phụ được quản lý từ Admin
  roomOptions: SubcategoryOption[] = [];
  collectionOptions: SubcategoryOption[] = [];
  styleOptions: SubcategoryOption[] = [];
  materialOptions: SubcategoryOption[] = [];

  // Phân trang màu sắc
  colorPage = 0;
  colorPageSize = 12;
  VALID_COLORS: ColorOption[] = [];

  localMinPrice = 0;
  localMaxPrice = 100000000;

  get minPercent(): number {
    if (!this.dynamicMaxPrice) return 0;
    return Math.min(100, Math.max(0, (this.localMinPrice / this.dynamicMaxPrice) * 100));
  }

  get maxPercent(): number {
    if (!this.dynamicMaxPrice) return 100;
    return Math.min(100, Math.max(0, (this.localMaxPrice / this.dynamicMaxPrice) * 100));
  }

  constructor(private categoryClassificationService: CategoryClassificationService) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['rawCategories'] || changes['allProducts'] || changes['dynamicFilters'] || changes['validFilters']) {
      this.initFilters();
    }
    if (changes['filters']) {
      const min = this.filters.priceRange?.[0] ?? 0;
      const max = this.filters.priceRange?.[1] ?? this.dynamicMaxPrice;
      this.localMinPrice = Math.max(0, Math.min(min, this.dynamicMaxPrice));
      this.localMaxPrice = Math.max(0, Math.min(max, this.dynamicMaxPrice));
      if (this.localMinPrice > this.localMaxPrice) {
        this.localMinPrice = this.localMaxPrice;
      }
    }
  }

  initFilters() {
    // 1. Danh mục chính từ Database: Giữ nguyên tên gốc trong DB (Sofas, Chairs, Tables, etc.)
    if (this.rawCategories && this.rawCategories.length > 0) {
      const rootCats = this.rawCategories.filter(c => !c.parentId);
      this.displayCategories = rootCats.map(c => ({
        key: c.slug,
        label: c.name, // Dùng đúng tên trong database, không thêm Sofa (Sofas)
        count: c._count?.products || 0
      }));
    }

    // 2. Các khối danh mục phụ từ Admin (Phòng & Không gian, Bộ sưu tập, Phong cách, Chất liệu)
    const adminRooms = this.categoryClassificationService.getRooms();
    const adminCollections = this.categoryClassificationService.getCollections();
    const adminStyles = this.categoryClassificationService.getStyles();
    const adminMaterials = this.categoryClassificationService.getMaterials();

    this.roomOptions = adminRooms.map(cat => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      type: 'room',
      count: this.countMatchingProducts((p) => matchProductRoom(p, cat.slug, cat))
    }));

    this.collectionOptions = adminCollections.map(cat => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      type: 'collection',
      count: this.countMatchingProducts((p) => matchProductCollection(p, cat.slug, cat))
    }));

    this.styleOptions = adminStyles.map(cat => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      type: 'style',
      count: this.countMatchingProducts((p) => matchProductStyle(p, cat.slug, cat))
    }));

    this.materialOptions = adminMaterials.map(cat => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      type: 'material',
      count: this.countMatchingProducts((p) => matchProductMaterial(p, cat.slug, cat))
    }));

    // 3. Màu sắc thật từ database / dynamicFilters
    if (this.dynamicFilters?.colors?.length) {
      this.VALID_COLORS = [...this.dynamicFilters.colors];
    } else {
      this.VALID_COLORS = [
        { name: 'Xám (Grey)', slug: 'grey', hex: '#808080' },
        { name: 'Trắng (White)', slug: 'white', hex: '#F8F8F8' },
        { name: 'Nâu (Brown)', slug: 'brown', hex: '#6B4423' },
        { name: 'Đen (Black)', slug: 'black', hex: '#222222' },
        { name: 'Xanh lá (Green)', slug: 'green', hex: '#3B5E45' },
        { name: 'Gỗ sồi (Oak)', slug: 'oak', hex: '#C4A482' },
        { name: 'Sồi tối (Dark Oak)', slug: 'dark-oak', hex: '#4A3728' },
        { name: 'Cẩm thạch (Marble)', slug: 'marble', hex: '#2E3136' },
        { name: 'Be (Beige)', slug: 'beige', hex: '#D8C8B8' },
        { name: 'Xanh dương (Blue)', slug: 'blue', hex: '#2B4C7E' },
        { name: 'Cam đất (Cognac)', slug: 'cognac', hex: '#9A461E' },
        { name: 'Vàng (Yellow)', slug: 'yellow', hex: '#E6B800' }
      ];
    }
  }

  private countMatchingProducts(predicate: (prod: any) => boolean): number {
    if (!this.allProducts || this.allProducts.length === 0) return 0;
    return this.allProducts.filter(predicate).length;
  }

  isCatActive(key: string): boolean {
    if (key === 'all') {
      return !this.filters.categories || this.filters.categories.length === 0;
    }
    return Boolean(this.filters.categories && this.filters.categories.includes(key));
  }

  selectCategory(key: string) {
    let newCategories: string[] = [];
    if (key !== 'all') {
      newCategories = [key];
    }

    this.onFilterChange.emit({
      ...this.filters,
      categories: newCategories
    });
  }

  isItemActive(group: 'rooms' | 'collections' | 'styles' | 'materials', slug: string): boolean {
    return Boolean(this.filters[group] && this.filters[group]!.includes(slug));
  }

  toggleFilterItem(group: 'rooms' | 'collections' | 'styles' | 'materials', slug: string) {
    const current = this.filters[group] || [];
    let updated: string[];
    if (current.includes(slug)) {
      updated = current.filter(s => s !== slug);
    } else {
      updated = [...current, slug];
    }
    this.onFilterChange.emit({
      ...this.filters,
      [group]: updated
    });
  }

  toggleExpand(key: string) {
    this.expanded[key] = !this.expanded[key];
  }

  formatPriceNumber(price: number): string {
    return new Intl.NumberFormat('vi-VN').format(price) + ' đ';
  }

  // --- Phân trang Màu sắc ---
  get totalColorPages(): number {
    return Math.max(1, Math.ceil(this.VALID_COLORS.length / this.colorPageSize));
  }

  get currentColors(): ColorOption[] {
    const start = this.colorPage * this.colorPageSize;
    return this.VALID_COLORS.slice(start, start + this.colorPageSize);
  }

  selectRating(rating: number) {
    const newRating = this.filters.minRating === rating ? undefined : rating;
    this.onFilterChange.emit({ ...this.filters, minRating: newRating });
  }

  // --- Lọc Màu sắc ---
  isColorActive(slug: string): boolean {
    return Boolean(this.filters.colors && this.filters.colors.includes(slug));
  }

  selectColor(slug: string) {
    const isCurrentlySelected = this.filters.colors?.includes(slug);
    const newColors = isCurrentlySelected ? [] : [slug];
    this.onFilterChange.emit({ ...this.filters, colors: newColors });
  }

  // --- Điều khiển 2 phía Min và Max & Nhập thủ công ---
  onMinSliderInput() {
    if (this.localMinPrice > this.localMaxPrice) {
      this.localMinPrice = this.localMaxPrice;
    }
  }

  onMaxSliderInput() {
    if (this.localMaxPrice < this.localMinPrice) {
      this.localMaxPrice = this.localMinPrice;
    }
  }

  handlePriceChangeEnd() {
    if (this.localMinPrice > this.localMaxPrice) {
      const temp = this.localMinPrice;
      this.localMinPrice = this.localMaxPrice;
      this.localMaxPrice = temp;
    }
    this.onFilterChange.emit({ ...this.filters, priceRange: [this.localMinPrice, this.localMaxPrice] });
  }

  formatPriceOnlyNumber(price: number): string {
    return new Intl.NumberFormat('vi-VN').format(price || 0);
  }

  parsePriceInput(val: string): number {
    const clean = (val || '').replace(/[^\d]/g, '');
    const num = parseInt(clean, 10);
    return isNaN(num) ? 0 : num;
  }

  onInputFocus(event: any) {
    if (event?.target) {
      event.target.select();
    }
  }

  onMinInputBlur(event: any) {
    const val = this.parsePriceInput(event.target.value);
    const clamped = Math.max(0, Math.min(val, this.dynamicMaxPrice));
    this.localMinPrice = clamped;
    if (this.localMinPrice > this.localMaxPrice) {
      this.localMaxPrice = this.localMinPrice;
    }
    event.target.value = this.formatPriceOnlyNumber(this.localMinPrice);
    this.handlePriceChangeEnd();
  }

  onMinInputEnter(event: any) {
    event.target.blur();
  }

  onMaxInputBlur(event: any) {
    const val = this.parsePriceInput(event.target.value);
    const clamped = Math.max(0, Math.min(val, this.dynamicMaxPrice));
    this.localMaxPrice = clamped;
    if (this.localMaxPrice < this.localMinPrice) {
      this.localMinPrice = this.localMaxPrice;
    }
    event.target.value = this.formatPriceOnlyNumber(this.localMaxPrice);
    this.handlePriceChangeEnd();
  }

  onMaxInputEnter(event: any) {
    event.target.blur();
  }
}
