import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { CatalogProduct, ProductColorSwatch } from '../../models/catalog.model';
import { IconComponent } from '../icon/icon';
import { WishlistService } from '../../../core/services/wishlist.service';
import { CompareService } from '../../../core/services/compare.service';

const COMPARE_STORAGE_KEY = 'dcor_compare_items';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, RouterModule, IconComponent],
  templateUrl: './product-card.html',
  styleUrls: ['./product-card.css']
})
export class ProductCardComponent implements OnInit, OnChanges, OnDestroy {
  @Input() product!: CatalogProduct | any;
  @Input() compact = false;
  @Input() showQuickView = true;
  @Input() showCompare = true;
  @Input() showWishlist = true;
  @Input() showBuyButton = true;

  @Output() quickView = new EventEmitter<any>();
  @Output() buy = new EventEmitter<any>();
  @Output() compareChange = new EventEmitter<any>();
  @Output() cardClick = new EventEmitter<any>();

  // Normalized product details
  productId = '';
  productSlug = '';
  displayName = '';
  categoryName = '';
  
  // Pricing
  isOnSale = false;
  discountBadgeText = '';
  currentPrice = 0;
  originalPrice: number | null = null;
  formattedCurrentPrice = '';
  formattedOriginalPrice = '';

  // Images & Angles
  cardImages: string[] = [];
  activeImageIndex = 0;
  isHovered = false;
  private autoCycleTimer: any = null;

  // Swatches
  colorSwatches: ProductColorSwatch[] = [];
  selectedSwatch?: ProductColorSwatch;

  // Social / Actions State
  isWishlisted = false;
  isInCompare = false;
  isCompareDisabled = false;
  compareTooltip = 'Thêm vào so sánh';

  // Ratings
  ratingVal = 4.9;
  reviewCount = 128;

  private wishlistSub?: Subscription;
  private compareUpdateListener?: () => void;

  constructor(
    private router: Router,
    private wishlistService: WishlistService,
    private cdr: ChangeDetectorRef,
    public compareService: CompareService
  ) {}

  ngOnInit() {
    this.normalizeProduct();
    this.initWishlist();
    this.initCompareState();

    if (typeof window !== 'undefined') {
      this.compareUpdateListener = () => {
        this.checkCompareState();
      };
      window.addEventListener('dcor_compare_updated', this.compareUpdateListener);
      window.addEventListener('storage', this.compareUpdateListener);
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['product'] && !changes['product'].isFirstChange()) {
      this.normalizeProduct();
      this.checkCompareState();
      this.checkWishlistState();
    }
  }

  ngOnDestroy() {
    this.clearHoverTimer();
    this.wishlistSub?.unsubscribe();
    if (typeof window !== 'undefined' && this.compareUpdateListener) {
      window.removeEventListener('dcor_compare_updated', this.compareUpdateListener);
      window.removeEventListener('storage', this.compareUpdateListener);
    }
  }

  // --- NORMALIZE PRODUCT DATA ---
  private normalizeProduct() {
    const p = this.product;
    if (!p) return;

    this.productId = p.productId || p.id || '';
    this.productSlug = p.slug || '';
    this.displayName = p.shortDescription_vi || p.shortDescription || p.name || 'Sản phẩm DCOR';
    this.categoryName = this.extractCategoryName(p);

    // Pricing
    const base = (p.basePrice !== undefined) ? p.basePrice : (p.prices?.[0]?.price || p.price || 0);
    const discVal = p.discountValue ?? (p.discountPercent ?? 0);
    const discType = p.discountType || 'PERCENT';

    this.isOnSale = Boolean(discVal && discVal > 0);

    if (this.isOnSale) {
      if (discType === 'PERCENT') {
        this.currentPrice = Math.round(base * (100 - discVal) / 100);
        this.originalPrice = base;
        this.discountBadgeText = `-${discVal}%`;
      } else {
        this.currentPrice = Math.max(0, base - discVal);
        this.originalPrice = base;
        this.discountBadgeText = 'SALE';
      }
    } else {
      this.currentPrice = base;
      this.originalPrice = null;
      this.discountBadgeText = p.isNew ? 'MỚI' : '';
    }

    this.formattedCurrentPrice = this.formatCurrency(this.currentPrice);
    this.formattedOriginalPrice = this.originalPrice ? this.formatCurrency(this.originalPrice) : '';

    // Ratings
    this.ratingVal = p.rating || 4.9;
    this.reviewCount = p.reviewCount || 128;

    // Swatches & Images
    this.initSwatchesAndImages();
    this.cdr.markForCheck();
  }

  private extractCategoryName(p: any): string {
    if (!p) return 'Nội thất';
    if (typeof p.category === 'string') return p.category;
    if (p.category?.name) return p.category.name;
    if (p.category?.parent?.name) return p.category.parent.name;
    return 'Nội thất';
  }

  private initSwatchesAndImages() {
    const p = this.product;
    if (!p) return;

    const isCleanUrl = (u: any): boolean =>
      typeof u === 'string' && u.startsWith('http') && !u.includes('assets.boconcept.com');

    // 1. Direct colorSwatches if present (e.g. from ExploreComponent)
    if (Array.isArray(p.colorSwatches) && p.colorSwatches.length > 0) {
      this.colorSwatches = p.colorSwatches;
      this.selectedSwatch = this.colorSwatches[0];
      this.cardImages = this.selectedSwatch.images?.length > 0 ? this.selectedSwatch.images : this.extractFallbackImages(p);
      return;
    }

    // 2. Extract swatches from variants if present
    const rawVariants: any[] = Array.isArray(p.variants) ? p.variants : [];
    const extractedSwatches: ProductColorSwatch[] = [];
    const seenHex = new Set<string>();

    const fallbackImgs = this.extractFallbackImages(p);

    if (rawVariants.length > 0) {
      rawVariants.forEach((v: any, idx: number) => {
        const vRaw = v.optionValues?.images || v.images || [];
        const vClean = (Array.isArray(vRaw) ? vRaw : []).filter(isCleanUrl);
        const vImages = vClean.length > 0 ? vClean : fallbackImgs;
        const color = this.detectColor(v.name || '');

        if (!seenHex.has(color.hex) && vImages.length > 0) {
          seenHex.add(color.hex);
          extractedSwatches.push({
            id: v.id || `v-${idx}`,
            name: color.name,
            rawName: v.name || '',
            hex: color.hex,
            images: vImages,
            price: v.price
          });
        }
      });
    }

    if (extractedSwatches.length > 0) {
      this.colorSwatches = extractedSwatches;
      this.selectedSwatch = this.colorSwatches[0];
      this.cardImages = this.selectedSwatch.images?.length > 0 ? this.selectedSwatch.images : fallbackImgs;
    } else {
      this.colorSwatches = [];
      this.selectedSwatch = undefined;
      this.cardImages = fallbackImgs;
    }

    this.activeImageIndex = 0;
  }

  private extractFallbackImages(p: any): string[] {
    const isClean = (u: any) => typeof u === 'string' && u.startsWith('http') && !u.includes('assets.boconcept.com');
    const imgs: string[] = [];

    if (Array.isArray(p.images)) {
      p.images.filter(isClean).forEach((u: string) => {
        if (!imgs.includes(u)) imgs.push(u);
      });
    }

    if (imgs.length === 0) {
      imgs.push('/assets/img/furniture-placeholder.svg');
    }

    return imgs;
  }

  private detectColor(text: string): { name: string; hex: string } {
    const lower = (text || '').toLowerCase();
    if (lower.includes('green') || lower.includes('xanh lá') || lower.includes('olive')) return { name: 'Xanh lá', hex: '#3B5E45' };
    if (lower.includes('sky blue') || lower.includes('blue') || lower.includes('xanh dương') || lower.includes('navy')) return { name: 'Xanh dương', hex: '#2B4C7E' };
    if (lower.includes('yellow') || lower.includes('vàng') || lower.includes('ochre')) return { name: 'Vàng', hex: '#E6B800' };
    if (/\brose\b/i.test(lower) || lower.includes('pink') || lower.includes('hồng')) return { name: 'Hồng', hex: '#EC4899' };
    if (/\bred\b/i.test(lower) || lower.includes('đỏ')) return { name: 'Đỏ', hex: '#991B1B' };
    if (lower.includes('cognac') || lower.includes('camel') || lower.includes('amber') || lower.includes('cam')) return { name: 'Cam đất', hex: '#9A461E' };
    if (lower.includes('beige') || lower.includes('sand') || lower.includes('cream') || lower.includes('taupe') || lower.includes('be')) return { name: 'Be sữa', hex: '#D8C8B8' };
    if (lower.includes('dark grey') || lower.includes('charcoal')) return { name: 'Xám than', hex: '#374151' };
    if (lower.includes('light grey') || lower.includes('grey') || lower.includes('gray') || lower.includes('xám') || lower.includes('ash')) return { name: 'Xám khói', hex: '#9CA3AF' };
    if (lower.includes('white') || lower.includes('trắng')) return { name: 'Trắng sứ', hex: '#F3F4F6' };
    if (lower.includes('black') || lower.includes('đen')) return { name: 'Đen nhám', hex: '#18181B' };
    if (lower.includes('oak') || lower.includes('sồi')) return { name: 'Gỗ sồi tự nhiên', hex: '#C4A482' };
    if (lower.includes('brown') || lower.includes('walnut') || lower.includes('nâu')) return { name: 'Nâu Walnut', hex: '#6B4423' };
    if (lower.includes('terracotta') || lower.includes('rust')) return { name: 'Đỏ đất', hex: '#A84332' };

    const earthTones = ['#78716c', '#a8a29e', '#d6d3d1', '#737373', '#525252'];
    const hash = (text || '').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return { name: text || 'Tiêu chuẩn', hex: earthTones[hash % earthTones.length] };
  }

  // --- SWATCH & MULTI-ANGLE INTERACTION ---
  get visibleSwatches(): ProductColorSwatch[] {
    if (!this.colorSwatches || this.colorSwatches.length <= 5) {
      return this.colorSwatches;
    }
    const list = [...this.colorSwatches];
    if (this.selectedSwatch) {
      const idx = list.findIndex(s => s.id === this.selectedSwatch?.id);
      if (idx >= 5) {
        const [active] = list.splice(idx, 1);
        list.unshift(active);
      }
    }
    return list.slice(0, 5);
  }

  selectSwatch(event: Event, sw: ProductColorSwatch) {
    event.stopPropagation();
    event.preventDefault();
    if (this.selectedSwatch?.id === sw.id) return;

    this.selectedSwatch = sw;
    if (sw.images && sw.images.length > 0) {
      this.cardImages = sw.images;
    }
    this.activeImageIndex = 0;
    this.cdr.markForCheck();
  }

  onCardMouseEnter() {
    this.isHovered = true;
    if (this.cardImages.length > 1) {
      this.startAutoCycle();
    }
  }

  onCardMouseLeave() {
    this.isHovered = false;
    this.clearHoverTimer();
    this.activeImageIndex = 0;
    this.cdr.markForCheck();
  }

  onImageMouseMove(event: MouseEvent) {
    if (this.cardImages.length <= 1) return;
    this.clearHoverTimer();

    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const segmentWidth = rect.width / this.cardImages.length;
    const index = Math.min(
      Math.floor(mouseX / segmentWidth),
      this.cardImages.length - 1
    );

    if (index >= 0 && index !== this.activeImageIndex) {
      this.activeImageIndex = index;
      this.cdr.markForCheck();
    }
  }

  private startAutoCycle() {
    this.clearHoverTimer();
    this.autoCycleTimer = setInterval(() => {
      if (this.cardImages.length > 1) {
        this.activeImageIndex = (this.activeImageIndex + 1) % this.cardImages.length;
        this.cdr.markForCheck();
      }
    }, 1800);
  }

  private clearHoverTimer() {
    if (this.autoCycleTimer) {
      clearInterval(this.autoCycleTimer);
      this.autoCycleTimer = null;
    }
  }

  onImageError(index: number) {
    if (this.cardImages[index]) {
      this.cardImages[index] = '/assets/img/furniture-placeholder.svg';
      this.cdr.markForCheck();
    }
  }

  // --- ACTIONS: QUICKVIEW, COMPARE, WISHLIST, BUY ---
  onCardClick() {
    if (this.cardClick.observed) {
      this.cardClick.emit(this.product);
    } else {
      const targetId = this.productId || this.productSlug;
      if (targetId) {
        this.router.navigate(['/products', targetId]);
      }
    }
  }

  onQuickViewClick(e: Event) {
    e.stopPropagation();
    e.preventDefault();
    if (this.quickView.observed) {
      this.quickView.emit(this.product);
    } else {
      this.onCardClick();
    }
  }

  onBuyClick(e: Event) {
    e.stopPropagation();
    e.preventDefault();
    if (this.buy.observed) {
      this.buy.emit(this.product);
    } else if (this.quickView.observed) {
      this.quickView.emit(this.product);
    } else {
      this.onCardClick();
    }
  }

  // --- WISHLIST ---
  private initWishlist() {
    this.checkWishlistState();
    this.wishlistSub = this.wishlistService.wishlist$.subscribe(() => {
      this.checkWishlistState();
    });
  }

  private checkWishlistState() {
    this.isWishlisted = this.wishlistService.isWishlisted(this.productId);
    this.cdr.markForCheck();
  }

  toggleWishlist(e: Event) {
    e.stopPropagation();
    e.preventDefault();
    if (!this.productId) return;
    this.wishlistService.toggle(this.productId);
  }

  // --- COMPARE ---
  private initCompareState() {
    this.checkCompareState();
  }

  private checkCompareState() {
    this.isInCompare = this.compareService.isInCompare(this.productId);
    this.isCompareDisabled = this.compareService.isCompareDisabled({ ...this.product, id: this.productId, productId: this.productId });

    if (this.isInCompare) {
      this.compareTooltip = 'Bỏ so sánh';
    } else if (this.isCompareDisabled) {
      const first = this.compareService.currentList[0];
      const catName = first ? this.compareService.getRootCategoryName(first) : '';
      this.compareTooltip = catName ? `Chỉ so sánh các sản phẩm cùng danh mục chính (${catName})` : 'Chỉ so sánh các sản phẩm cùng danh mục chính';
    } else {
      this.compareTooltip = 'Thêm vào so sánh';
    }
    this.cdr.detectChanges();
  }

  toggleCompare(e: Event) {
    e.stopPropagation();
    e.preventDefault();
    this.compareService.toggle({
      ...this.product,
      id: this.productId,
      productId: this.productId,
      name: this.displayName,
      cardImages: this.cardImages,
      images: this.cardImages,
      basePrice: this.currentPrice
    });
    this.checkCompareState();
    this.compareChange.emit(this.compareService.currentList);
  }

  private getProductRootCategoryKey(prod: any): string {
    if (!prod) return 'accessories';
    const catName = (prod.category?.name || prod.category || '').toLowerCase();
    const catSlug = (prod.category?.slug || '').toLowerCase();
    const parentName = (prod.category?.parent?.name || '').toLowerCase();
    const name = (prod.name || prod.shortDescription || '').toLowerCase();

    if (parentName.includes('sofa') || catName.includes('sofa') || catSlug.includes('sofa') || name.includes('sofa')) return 'sofas';
    if (parentName.includes('chair') || catName.includes('chair') || catSlug.includes('chair') || name.includes('chair') || name.includes('ghế')) return 'chairs';
    if (parentName.includes('table') || catName.includes('table') || catSlug.includes('table') || name.includes('table') || name.includes('bàn')) return 'tables';
    if (parentName.includes('storage') || catName.includes('storage') || catSlug.includes('storage') || name.includes('tủ') || name.includes('kệ')) return 'storage';
    if (parentName.includes('bed') || catName.includes('bed') || catSlug.includes('bed') || name.includes('giường')) return 'beds';
    if (parentName.includes('rug') || catName.includes('rug') || catSlug.includes('rug') || name.includes('thảm')) return 'rugs';
    if (parentName.includes('lamp') || catName.includes('lamp') || catSlug.includes('lamp') || name.includes('đèn')) return 'lamps';
    if (parentName.includes('outdoor') || catName.includes('outdoor') || catSlug.includes('outdoor')) return 'outdoor';
    return 'accessories';
  }

  private formatCurrency(val: number): string {
    if (!val && val !== 0) return 'Liên hệ';
    return new Intl.NumberFormat('vi-VN').format(val) + '₫';
  }
}
