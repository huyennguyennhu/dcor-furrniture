import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, ChevronDown, Check, Star } from 'lucide-angular';
import { ProductCategory } from '../../models/catalog.model';

export interface FilterState {
  categories: string[];
  materials: string[];
  colors: string[];
  priceRange: [number, number];
  rooms?: string[];
  styles?: string[];
  minRating?: number;
}

export interface RoomOption {
  slug: string;
  name: string;
}

export interface StyleOption {
  slug: string;
  name: string;
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
  @Input() dynamicFilters: any = {};
  @Input() validFilters: any = {};
  @Input() dynamicMaxPrice = 100000000;
  @Input() productCount = 0;
  @Input() ratingCounts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0 };

  @Output() onFilterChange = new EventEmitter<FilterState>();

  expanded: Record<string, boolean> = {
    category: true,
    price: true,
    room: true,
    style: true,
    rating: true,
    color: true,
    material: true
  };

  // Phân trang chất liệu
  materialPage = 0;
  materialPageSize = 5;
  materialSearchQuery = '';

  // Phân trang màu sắc
  colorPage = 0;
  colorPageSize = 12;

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

  // Danh mục chính (Root categories từ DB)
  displayCategories: { key: string; label: string; count?: number }[] = [];

  // Phòng: slug room
  ROOM_OPTIONS: RoomOption[] = [
    { slug: 'phong-khach', name: 'Phòng Khách' },
    { slug: 'phong-ngu', name: 'Phòng Ngủ' },
    { slug: 'phong-bep', name: 'Phòng Bếp' },
    { slug: 'phong-lam-viec', name: 'Phòng Làm Việc' },
    { slug: 'ngoai-troi', name: 'Ngoài Trời' }
  ];

  // Phong cách thiết kế: slug style
  STYLE_OPTIONS: StyleOption[] = [
    { slug: 'japandi', name: 'Japandi' },
    { slug: 'scandinavian', name: 'Scandinavian' },
    { slug: 'modern-luxury', name: 'Modern Luxury' },
    { slug: 'wabi-sabi', name: 'Wabi-Sabi' },
    { slug: 'minimalism', name: 'Minimalism' },
    { slug: 'industrial', name: 'Industrial' }
  ];

  VALID_MATERIALS: string[] = [];
  VALID_COLORS: ColorOption[] = [];

  ngOnChanges(changes: SimpleChanges) {
    if (changes['rawCategories'] || changes['dynamicFilters'] || changes['validFilters']) {
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
    // 1. Danh mục chính trong database (parentId == null)
    if (this.rawCategories && this.rawCategories.length > 0) {
      const rootCats = this.rawCategories.filter(c => !c.parentId);
      
      this.displayCategories = rootCats.map(c => ({
        key: c.slug,
        label: c.name, // Dùng mặc định tên trong database
        count: c._count?.products || 0
      }));
    }

    // 2. Chất liệu thật từ database
    if (this.dynamicFilters?.materials?.length) {
      this.VALID_MATERIALS = [...this.dynamicFilters.materials];
    } else {
      this.VALID_MATERIALS = [
        'Fabric', 'Leather', 'Oak', 'Wool', 'Ceramic', 'Concrete', 'Glass', 
        'Acrylic', 'Polyester', 'Metal', 'Aluminium', 'Wood', 'Marble', 'Steel'
      ];
    }

    // 3. Màu sắc thật từ database
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

  isCatActive(key: string): boolean {
    if (key === 'all') {
      return !this.filters.categories || this.filters.categories.length === 0;
    }
    return this.filters.categories.some(c => c.toLowerCase() === key.toLowerCase() || key.toLowerCase().includes(c.toLowerCase()));
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

  toggleExpand(key: string) {
    this.expanded[key] = !this.expanded[key];
  }

  formatPriceNumber(price: number): string {
    return new Intl.NumberFormat('vi-VN').format(price) + ' đ';
  }

  // --- Phân trang Chất liệu ---
  get filteredMaterials(): string[] {
    if (!this.materialSearchQuery) return this.VALID_MATERIALS;
    const q = this.materialSearchQuery.toLowerCase();
    return this.VALID_MATERIALS.filter(m => m.toLowerCase().includes(q));
  }

  get totalMaterialPages(): number {
    return Math.max(1, Math.ceil(this.filteredMaterials.length / this.materialPageSize));
  }

  get currentMaterials(): string[] {
    const start = this.materialPage * this.materialPageSize;
    return this.filteredMaterials.slice(start, start + this.materialPageSize);
  }

  // --- Phân trang Màu sắc ---
  get totalColorPages(): number {
    return Math.max(1, Math.ceil(this.VALID_COLORS.length / this.colorPageSize));
  }

  get currentColors(): ColorOption[] {
    const start = this.colorPage * this.colorPageSize;
    return this.VALID_COLORS.slice(start, start + this.colorPageSize);
  }

  handleCheckboxChange(key: 'materials' | 'colors' | 'rooms' | 'styles', value: string) {
    const currentList = (this.filters[key] as string[]) || [];
    let newList: string[] = [];
    if (currentList.includes(value)) {
      newList = currentList.filter(item => item !== value);
    } else {
      newList = [...currentList, value];
    }
    this.onFilterChange.emit({ ...this.filters, [key]: newList });
  }

  selectRating(rating: number) {
    const newRating = this.filters.minRating === rating ? undefined : rating;
    this.onFilterChange.emit({ ...this.filters, minRating: newRating });
  }

  // --- Lọc Phòng: Chỉ được chọn 1 phòng tại 1 thời điểm ---
  isRoomActive(slug: string): boolean {
    return Boolean(this.filters.rooms && this.filters.rooms.includes(slug));
  }

  selectRoom(slug: string) {
    const isCurrentlySelected = this.filters.rooms?.includes(slug);
    // Click vào phòng đang chọn sẽ bỏ chọn (toggle), click phòng khác sẽ chọn duy nhất phòng đó
    const newRooms = isCurrentlySelected ? [] : [slug];
    this.onFilterChange.emit({ ...this.filters, rooms: newRooms });
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
