import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, ChevronDown, Check } from 'lucide-angular';

export interface FilterState {
  categories: string[];
  materials: string[];
  colors: string[];
  priceRange: [number, number];
}

const FALLBACK_COLORS: Record<string, string> = {
  'Trắng': '#F5F5F5', 'Đen': '#222222', 'Nâu': '#8B4513', 'Xanh lá': '#4B6E50', 
  'Xanh dương': '#325A82', 'Vàng': '#FFD700', 'Xám': '#808080'
};

@Component({
  selector: 'app-sidebar-filter',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './sidebar-filter.html',
  styleUrls: ['./sidebar-filter.css']
})
export class SidebarFilterComponent implements OnChanges {
  icons = { ChevronDown, Check };

  @Input() filters!: FilterState;
  @Input() dynamicFilters: any = {};
  @Input() validFilters: any = {};
  @Input() dynamicMaxPrice = 100000000;

  @Output() onFilterChange = new EventEmitter<FilterState>();

  expanded: Record<string, boolean> = {
    category: true,
    price: true,
    material: false,
    color: false
  };

  materialPage = 0;
  materialSearchQuery = '';
  localPrice = 100000000;

  CATEGORIES: string[] = [];
  MATERIALS: string[] = [];
  COLORS: any[] = [];
  VALID_CATEGORIES: string[] = [];
  VALID_MATERIALS: string[] = [];
  VALID_COLORS: any[] = [];

  ngOnChanges(changes: SimpleChanges) {
    if (changes['dynamicFilters'] || changes['validFilters']) {
      this.initFilters();
    }
    if (changes['filters']) {
      this.localPrice = this.filters.priceRange[1] > this.dynamicMaxPrice ? this.dynamicMaxPrice : this.filters.priceRange[1];
    }
  }

  initFilters() {
    this.CATEGORIES = this.dynamicFilters?.categories?.length ? this.dynamicFilters.categories : ['Sofa', 'Bàn', 'Ghế', 'Tủ Kệ', 'Giường', 'Đèn', 'Thảm', 'Phụ Kiện'];
    this.MATERIALS = this.dynamicFilters?.materials?.length ? this.dynamicFilters.materials : ['Gỗ tự nhiên', 'Gỗ công nghiệp', 'Kim loại', 'Kính', 'Da', 'Vải'];
    this.COLORS = this.dynamicFilters?.colors?.length ? this.dynamicFilters.colors : [
      { name: 'Trắng', hex: '#F5F5F5' }, { name: 'Đen', hex: '#222222' }, { name: 'Nâu', hex: '#8B4513' },
      { name: 'Xanh lá', hex: '#4B6E50' }, { name: 'Xanh dương', hex: '#325A82' }, { name: 'Vàng', hex: '#FFD700' }, { name: 'Xám', hex: '#808080' }
    ];

    if (this.validFilters && Object.keys(this.validFilters).length > 0) {
      this.VALID_CATEGORIES = this.CATEGORIES.filter(c => this.validFilters.categories.includes(c) || this.filters.categories.includes(c));
      this.VALID_MATERIALS = this.MATERIALS.filter(m => this.validFilters.materials.includes(m) || this.filters.materials.includes(m));
      this.VALID_COLORS = this.COLORS.filter(c => {
        const name = typeof c === 'string' ? c : c.name;
        return this.validFilters.colors.includes(name) || this.filters.colors.includes(name);
      });
    } else {
      this.VALID_CATEGORIES = this.CATEGORIES;
      this.VALID_MATERIALS = this.MATERIALS;
      this.VALID_COLORS = this.COLORS;
    }
  }

  getColorHex(c: any): string {
    if (typeof c === 'string') return FALLBACK_COLORS[c] || '#888';
    return c.hex || FALLBACK_COLORS[c.name] || '#888';
  }

  getColorName(c: any): string {
    if (typeof c === 'string') return c;
    return c.name;
  }

  formatPriceShort(price: number) {
    if (price >= 1000000000) return (price / 1000000000).toFixed(1).replace(/\.0$/, '') + 'tỷ';
    if (price >= 1000000) return (price / 1000000).toFixed(0) + 'tr';
    if (price >= 1000) return (price / 1000).toFixed(0) + 'k';
    return price + 'đ';
  }

  toggleExpand(key: string) {
    this.expanded[key] = !this.expanded[key];
  }

  get filteredMaterials() {
    return this.VALID_MATERIALS.filter(m => m.toLowerCase().includes(this.materialSearchQuery.toLowerCase()));
  }

  get usePagination() {
    return this.VALID_MATERIALS.length > 10;
  }

  get totalMaterialPages() {
    return this.usePagination ? Math.ceil(this.filteredMaterials.length / 5) : 1;
  }

  get currentMaterials() {
    return this.usePagination ? this.filteredMaterials.slice(this.materialPage * 5, (this.materialPage + 1) * 5) : this.filteredMaterials;
  }

  handleCheckboxChange(key: keyof FilterState, value: string) {
    const currentList = this.filters[key] as string[];
    let newList = [];
    if (currentList.includes(value)) {
      newList = currentList.filter(item => item !== value);
    } else {
      newList = [...currentList, value];
    }
    this.onFilterChange.emit({ ...this.filters, [key]: newList, priceRange: [0, 100000000] });
  }

  handlePriceChangeEnd() {
    this.onFilterChange.emit({ ...this.filters, priceRange: [0, this.localPrice] });
  }
}
