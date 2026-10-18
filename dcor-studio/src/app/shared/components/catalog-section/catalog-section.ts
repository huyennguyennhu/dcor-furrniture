import { IconComponent } from '../icon/icon';
import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HoverImageSlider } from '../hover-image-slider/hover-image-slider';
import { CatalogProduct } from '../../models/catalog.model';

@Component({
  selector: 'app-catalog-section',
  standalone: true,
  imports: [IconComponent, CommonModule, FormsModule, HoverImageSlider],
  templateUrl: './catalog-section.html',
  styleUrls: ['./catalog-section.css']
})
export class CatalogSection implements OnInit, OnChanges {
  @Input() products: CatalogProduct[] = [];
  @Input() initialCategory: string = '';
  @Input() categories: { label: string; value: string; emoji: string; desc: string; img: string }[] = [];

  searchQuery: string = '';
  categoryFilter: string = '';
  materialFilter: string = '';
  colorFilter: string = '';
  sortBy: string = 'featured';
  currentPage: number = 1;

  readonly ITEMS_PER_PAGE = 8;
  readonly COLOR_MAP: Record<string, string> = {
    Grey: '#808080', Beige: '#F5F5DC', Brown: '#8B4513',
    Blue: '#325A82', Green: '#4B6E50', Black: '#222',
    White: '#F5F5F5', Red: '#A33E3E',
  };
  
  colorEntries = Object.entries(this.COLOR_MAP);
  Math = Math;

  ngOnInit() {
    this.categoryFilter = this.initialCategory;
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['initialCategory']) {
      this.categoryFilter = this.initialCategory;
      this.currentPage = 1;
    }
  }

  get filteredProducts(): CatalogProduct[] {
    let filtered = this.products.filter(prod => {
      if (this.categoryFilter && prod.category !== this.categoryFilter) return false;
      const titleVi = prod.shortDescription_vi || prod.shortDescription;
      if (this.searchQuery && !titleVi.toLowerCase().includes(this.searchQuery.toLowerCase()) &&
          !prod.shortDescription.toLowerCase().includes(this.searchQuery.toLowerCase())) return false;
      if (this.materialFilter) {
        const mats = prod.refinementMaterials || [];
        if (!mats.some(m => m.toLowerCase() === this.materialFilter.toLowerCase())) return false;
      }
      if (this.colorFilter) {
        const cols = prod.refinementColors || [];
        if (!cols.some(c => c.toLowerCase() === this.colorFilter.toLowerCase())) return false;
      }
      return true;
    });

    if (this.sortBy === 'price-asc') {
      filtered.sort((a, b) => this.getProductPriceVal(a) - this.getProductPriceVal(b));
    } else if (this.sortBy === 'price-desc') {
      filtered.sort((a, b) => this.getProductPriceVal(b) - this.getProductPriceVal(a));
    }

    return filtered;
  }

  get totalPages(): number {
    return Math.ceil(this.filteredProducts.length / this.ITEMS_PER_PAGE);
  }

  get paginatedProducts(): CatalogProduct[] {
    const start = (this.currentPage - 1) * this.ITEMS_PER_PAGE;
    return this.filteredProducts.slice(start, start + this.ITEMS_PER_PAGE);
  }

  handleCatChange(val: string) {
    this.categoryFilter = val;
    this.currentPage = 1;
  }

  onFilterChange() {
    this.currentPage = 1;
  }

  getPageNumbers(): (number | string)[] {
    const pages: (number | string)[] = [];
    if (this.totalPages <= 5) {
      for (let i = 1; i <= this.totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (this.currentPage > 3) pages.push('...');
      const start = Math.max(2, this.currentPage - 1);
      const end = Math.min(this.totalPages - 1, this.currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (this.currentPage < this.totalPages - 2) pages.push('...');
      pages.push(this.totalPages);
    }
    return pages;
  }

  setPage(page: number | string) {
    if (typeof page === 'number') {
      this.currentPage = page;
    }
  }

  // --- Helpers ---
  getProductPriceVal(prod: CatalogProduct): number {
    return prod.prices?.[0]?.price ?? 0;
  }

  getProductPriceFormatted(prod: CatalogProduct): string {
    return prod.prices?.[0]?.formattedPrice ?? 'Liên hệ';
  }

  getLowestPriceFormatted(prod: CatalogProduct): string | null {
    return prod.lowestPrices?.[0]?.formattedPrice ?? null;
  }

  isOnSale(prod: CatalogProduct): boolean {
    const base = prod.prices?.[0]?.price ?? 0;
    const low = prod.lowestPrices?.[0]?.price ?? 0;
    return low > 0 && low < base;
  }

  getAllImages(prod: CatalogProduct): string[] {
    let allImages = prod.images || [];
    if (prod.variants) {
      const extraImgs = prod.variants.flatMap((v: any) => {
        const vImgs = v.optionValues?.images || v.images || [];
        return Array.isArray(vImgs) ? vImgs : [];
      }).filter(Boolean);
      allImages = Array.from(new Set([...allImages, ...extraImgs]));
    }
    return allImages.slice(0, 6);
  }
}
