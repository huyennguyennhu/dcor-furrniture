import { IconComponent } from '../../../../shared/components/icon/icon';
import { Component, OnInit, HostListener, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CatalogProduct } from '../../../../shared/models/catalog.model';
import { CustomSelect } from '../../../../shared/components/custom-select/custom-select';
import { HoverImageSlider } from '../../../../shared/components/hover-image-slider/hover-image-slider';
import { SidebarFilterComponent, FilterState as SidebarFilterState } from '../../../../shared/components/sidebar-filter/sidebar-filter'; 
import { QuickViewDrawerComponent } from '../../../../shared/components/quick-view-drawer/quick-view-drawer';
import { LucideAngularModule, Heart, Share2, Eye } from 'lucide-angular';

import { environment } from '../../../../../environments/environment';

export type FilterState = SidebarFilterState;

const INITIAL_FILTER_STATE: FilterState = {
  categories: [],
  materials: [],
  colors: [],
  priceRange: [0, 100000000]
};

@Component({
  selector: 'app-explore',
  standalone: true,
  imports: [IconComponent, CommonModule, RouterModule, FormsModule, CustomSelect, HoverImageSlider, SidebarFilterComponent, QuickViewDrawerComponent, LucideAngularModule],
  templateUrl: './explore.html',
  styleUrls: ['./explore.css']
})
export class ExploreComponent implements OnInit {
  icons = { Heart, Share2, Eye };
  products: CatalogProduct[] = [];
  isLoading = true;
  
  dynamicFilters = { categories: [] as string[], materials: [] as string[], colors: [] as string[] };
  
  searchQuery = '';
  filters: FilterState = { ...INITIAL_FILTER_STATE };
  sortBy = 'featured';
  currentPage = 1;
  itemsPerPage = 12;

  quickViewProduct: CatalogProduct | null = null;
  isQuickViewOpen = false;
  
  wishlist: string[] = [];

  constructor(private route: ActivatedRoute, private router: Router, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.filters.categories = params['category'] ? [params['category']] : [];
      this.searchQuery = params['q'] || '';
      this.currentPage = 1;
      this.fetchData();
    });
  }

  async fetchData() {
    this.isLoading = true;
    try {
      const res = await fetch(`${environment.apiUrl}/products`);
      if (!res.ok) {
        throw new Error(`Không thể tải danh sách sản phẩm (HTTP ${res.status}).`);
      }

      if (res.ok) {
        const data = await res.json();
        
        // Handle both old array format and new paginated object format
        let rawProducts = Array.isArray(data) ? data : (data.data || data.Items || data.products || []);
        
function getParentCategory(childCat: string): string {
  if (!childCat) return 'Sofa';
  const c = childCat.toLowerCase();
  if (c.includes('sofa') || c.includes('chaise')) return 'Sofa';
  if (c.includes('chair') || c.includes('bench') || c.includes('stool') || c.includes('recliner') || c.includes('poufs') || c.includes('cushion') || c.includes('seat')) return 'Ghế';
  if (c.includes('table') || c.includes('desk') || (c.includes('stand') && !c.includes('night'))) return 'Bàn';
  if (c.includes('storage') || c.includes('shelf') || c.includes('shelves') || c.includes('bookcase') || c.includes('board') || c.includes('unit') || c.includes('chest') || c.includes('drawer') || c.includes('system') || c.includes('night') || c.includes('hallway')) return 'Tủ Kệ';
  if (c.includes('bed') || c.includes('daybed')) return 'Giường';
  if (c.includes('lamp') || c.includes('pendant') || c.includes('lighting')) return 'Đèn';
  if (c.includes('rug') || c.includes('carpet')) return 'Thảm';
  return 'Phụ Kiện';
}

        this.products = rawProducts.map((p: any) => ({
          productId: p.id || p.productId,
          shortDescription: p.name || p.shortDescription || '',
          shortDescription_vi: p.name || p.shortDescription_vi || '',
          category: getParentCategory(p.category?.name || (typeof p.category === 'string' ? p.category : '')),
          description: p.description || p.description_vi,
          refinementMaterials: p.description ? [p.description] : (p.refinementMaterials || []),
          refinementMaterials_vi: p.description ? [p.description] : (p.refinementMaterials_vi || []),
          refinementColors: p.refinementColors || [],
          images: p.images || [],
          prices: p.prices || [{ price: p.basePrice || 0, formattedPrice: new Intl.NumberFormat('vi-VN').format(p.basePrice || 0) + ' ₫' }],
          lowestPrices: p.discountValue ? [{ price: (p.basePrice || 0) - p.discountValue, formattedPrice: new Intl.NumberFormat('vi-VN').format((p.basePrice || 0) - p.discountValue) + ' ₫' }] : (p.lowestPrices || []),
          isBestSeller: p.isBestSeller || false,
          isNew: p.isNew || false,
          createdAt: p.createdAt
        }));
        
        this.generateDynamicFilters(this.products);
      }
    } catch (e) {
      console.error(e);
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  generateDynamicFilters(data: CatalogProduct[]) {
    const cats = new Set<string>();
    const mats = new Set<string>();
    const cols = new Set<string>();
    data.forEach(p => {
      if (p.category) cats.add(p.category);
      if (p.refinementMaterials) p.refinementMaterials.forEach(m => mats.add(m));
      if (p.refinementColors) p.refinementColors.forEach(c => cols.add(c));
    });
    this.dynamicFilters = {
      categories: Array.from(cats),
      materials: Array.from(mats),
      colors: Array.from(cols)
    };
  }

  get filteredExceptPrice() {
    return this.products.filter(prod => {
      if (this.filters.categories.length > 0) {
        if (!this.filters.categories.some(c => 
          prod.category?.toLowerCase().includes(c.toLowerCase()) || 
          prod.shortDescription?.toLowerCase().includes(c.toLowerCase())
        )) return false;
      }
      if (this.filters.materials.length > 0) {
        if (!prod.refinementMaterials?.some(m => this.filters.materials.includes(m)) && 
            !prod.refinementMaterials_vi?.some(m => this.filters.materials.includes(m))) return false;
      }
      if (this.filters.colors.length > 0) {
        if (!prod.refinementColors?.some(c => this.filters.colors.includes(c)) &&
            !prod.refinementColors_vi?.some(c => this.filters.colors.includes(c))) return false;
      }
      const query = this.normalizeSearchText(this.searchQuery);
      const searchableText = [
        prod.shortDescription_vi,
        prod.shortDescription,
        prod.category
      ].map(value => this.normalizeSearchText(value || ''));
      if (query && !searchableText.some(value => value.includes(query))) return false;
      
      return true;
    });
  }

  private normalizeSearchText(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLocaleLowerCase('vi')
      .trim();
  }

  get filteredProducts() {
    let list = this.filteredExceptPrice.filter(prod => {
      const price = this.getProductPriceVal(prod);
      return price <= this.filters.priceRange[1];
    });

    if (this.sortBy === 'featured') {
      list.sort((a, b) => {
        if (a.isBestSeller && !b.isBestSeller) return -1;
        if (!a.isBestSeller && b.isBestSeller) return 1;
        return 0;
      });
    } else if (this.sortBy === 'newest') {
      list.sort((a, b) => {
        const dA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dB - dA;
      });
    } else if (this.sortBy === 'price-asc') {
      list.sort((a, b) => this.getProductPriceVal(a) - this.getProductPriceVal(b));
    } else if (this.sortBy === 'price-desc') {
      list.sort((a, b) => this.getProductPriceVal(b) - this.getProductPriceVal(a));
    }

    return list;
  }

  get paginatedProducts() {
    return this.filteredProducts.slice(0, this.currentPage * this.itemsPerPage);
  }

  get totalPages() {
    return Math.ceil(this.filteredProducts.length / this.itemsPerPage);
  }

  get activeTagCount() {
    let count = this.filters.categories.length + this.filters.materials.length + this.filters.colors.length;
    if (this.filters.priceRange[1] < 100000000) count++;
    return count;
  }

  get dynamicMaxPrice() {
    const maxPriceInFiltered = this.filteredExceptPrice.length > 0 
      ? Math.max(...this.filteredExceptPrice.map(p => this.getProductPriceVal(p)))
      : 100000000;
    return Math.max(10000000, Math.ceil(maxPriceInFiltered / 1000000) * 1000000);
  }

  get validFiltersObj() {
    const validCategories = new Set<string>();
    const validMaterials = new Set<string>();
    const validColors = new Set<string>();

    this.products.forEach(prod => {
      const passCat = this.filters.categories.length === 0 || this.filters.categories.some(c => 
        prod.category?.toLowerCase().includes(c.toLowerCase()) || 
        prod.shortDescription?.toLowerCase().includes(c.toLowerCase())
      );
      const passMat = this.filters.materials.length === 0 || (prod.refinementMaterials?.some(m => this.filters.materials.includes(m)) || prod.refinementMaterials_vi?.some(m => this.filters.materials.includes(m)));
      const passCol = this.filters.colors.length === 0 || (prod.refinementColors?.some(c => this.filters.colors.includes(c)) || prod.refinementColors_vi?.some(c => this.filters.colors.includes(c)));
      const passPrice = this.getProductPriceVal(prod) <= this.filters.priceRange[1];
      
      const titleVi = prod.shortDescription_vi || prod.shortDescription;
      const passSearch = !this.searchQuery || titleVi.toLowerCase().includes(this.searchQuery.toLowerCase()) || prod.shortDescription.toLowerCase().includes(this.searchQuery.toLowerCase());

      if (passMat && passCol && passPrice && passSearch) {
        if (prod.category) {
          const capitalizedCat = prod.category.split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
          if (capitalizedCat === 'Tủ Kệ' || capitalizedCat === 'Tủ kệ') validCategories.add('Tủ Kệ');
          else validCategories.add(capitalizedCat);
        }
      }
      if (passCat && passCol && passPrice && passSearch) {
        prod.refinementMaterials?.forEach(m => validMaterials.add(m));
        prod.refinementMaterials_vi?.forEach(m => validMaterials.add(m));
      }
      if (passCat && passMat && passPrice && passSearch) {
        prod.refinementColors?.forEach(c => validColors.add(c));
        prod.refinementColors_vi?.forEach(c => validColors.add(c));
      }
    });

    return {
      categories: Array.from(validCategories),
      materials: Array.from(validMaterials),
      colors: Array.from(validColors)
    };
  }

  getProductPriceVal(prod: CatalogProduct) {
    return prod.prices?.[0]?.price ?? 0;
  }

  getProductPriceFormatted(prod: CatalogProduct) {
    return prod.prices?.[0]?.formattedPrice ?? 'Liên hệ';
  }

  getLowestPriceFormatted(prod: CatalogProduct) {
    return prod.lowestPrices?.[0]?.formattedPrice ?? null;
  }

  isOnSale(prod: CatalogProduct) {
    const base = prod.prices?.[0]?.price ?? 0;
    const low = prod.lowestPrices?.[0]?.price ?? 0;
    return low > 0 && low < base;
  }

  handleQuickCatClick(cat: string) {
    if (cat === 'Tất cả') {
      this.filters.categories = [];
    } else {
      if (this.filters.categories.includes(cat)) {
        this.filters.categories = this.filters.categories.filter(c => c !== cat);
      } else {
        this.filters.categories.push(cat);
      }
    }
    this.currentPage = 1;
  }

  removeFilterTag(key: keyof FilterState, val: string | null) {
    if (key === 'priceRange') {
      this.filters.priceRange = [0, 100000000];
    } else {
      this.filters[key] = (this.filters[key] as string[]).filter(item => item !== val);
    }
    this.currentPage = 1;
  }

  onFilterChange(newFilters: FilterState) {
    this.filters = newFilters;
    this.currentPage = 1;
  }

  clearAllFilters() {
    this.filters = { ...INITIAL_FILTER_STATE };
    this.filters.categories = [];
    this.filters.materials = [];
    this.filters.colors = [];
    this.currentPage = 1;
  }

  toggleWishlist(e: Event, productId: string) {
    e.stopPropagation();
    e.preventDefault();
    if (this.wishlist.includes(productId)) {
      this.wishlist = this.wishlist.filter(id => id !== productId);
    } else {
      this.wishlist.push(productId);
    }
  }

  openQuickView(e: Event, prod: CatalogProduct) {
    e.stopPropagation();
    e.preventDefault();
    this.quickViewProduct = prod;
    this.isQuickViewOpen = true;
  }

  handleProductClick(productId: string) {
    this.router.navigate(['/products', productId]);
  }
}
