import { Component, OnInit, OnDestroy, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { finalize, TimeoutError, timeout, Subscription } from 'rxjs';
import { CatalogProduct, ProductCategory } from '../../../../shared/models/catalog.model';
import { IconComponent } from '../../../../shared/components/icon/icon';
import { CartService } from '../../../../core/services/cart.service';
import { WishlistService } from '../../../../core/services/wishlist.service';
import { environment } from '../../../../../environments/environment';

export interface AttributeOption {
  id: string;
  name: string;
  image?: string | null;
  hexColor?: string | null;
  groupName?: string | null;
}

export interface ProductAttributeGroup {
  groupId: string;
  label: string;
  options: AttributeOption[];
}

export interface ReviewItem {
  id: string;
  reviewerName: string;
  rating: number;
  createdAt: string;
  formattedDate: string;
  variantId: string | null;
  variantName: string;
  comment: string;
  images: string[];
  helpfulCount: number;
  isVerifiedPurchase: boolean;
  liked?: boolean;
}

export interface ShowroomItem {
  id: string;
  code: string;
  name: string;
  address: string;
  phone: string;
  managerName?: string;
}

import { ProductCardComponent } from '../../../../shared/components/product-card/product-card';
import { ProductCompareModalComponent } from '../../../../shared/components/product-compare-modal/product-compare-modal';
import { CustomRequestModalComponent } from '../../../../shared/components/custom-request-modal/custom-request-modal';
import { ShowroomConsultationModalComponent } from '../../../../shared/components/showroom-consultation-modal/showroom-consultation-modal';

const GROUP_LABEL_MAP: Record<string, string> = {
  vaConfigurationSize: 'Kích thước',
  vaMaterialUpholstery: 'Chất liệu vải bọc',
  vaMaterial: 'Chất liệu hoàn thiện',
  vaColour: 'Màu sắc',
  vaMaterialLeg: 'Chất liệu chân',
  vaMaterialLegStyle: 'Kiểu dáng chân',
  vaMaterialSeat: 'Chất liệu mặt ngồi',
  vaMaterialTabletop: 'Chất liệu mặt bàn',
  vaSofaDirection: 'Hướng góc sofa',
  vaRugShape: 'Kiểu dáng thảm',
  vaFunction: 'Chức năng',
  vaMaterialLamp: 'Chất liệu đèn',
  vaMaterialShell: 'Chất liệu khung / vỏ',
  vaMaterialCabinet: 'Chất liệu thân tủ',
  vaMattressSize: 'Kích thước nệm'
};

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [
    IconComponent, 
    CommonModule, 
    RouterModule, 
    FormsModule, 
    ProductCardComponent, 
    ProductCompareModalComponent,
    CustomRequestModalComponent,
    ShowroomConsultationModalComponent
  ],
  templateUrl: './product-detail.html',
  styleUrls: ['./product-detail.css']
})
export class ProductDetailComponent implements OnInit, OnDestroy {
  // Product state
  product: any = null;
  productId = '';
  isLoading = true;

  // Comparison State & Modal
  compareList: any[] = [];
  isCompareModalOpen = false;
  private compareEventListener?: () => void;

  // Active Tab: 'desc' | 'specs' | 'care' | 'policy' | 'reviews'
  activeTab: 'desc' | 'specs' | 'care' | 'policy' | 'reviews' = 'desc';

  // Gallery
  activeImageIndex = 0;
  galleryImages: string[] = [];
  isLightboxOpen = false;
  lightboxIndex = 0;
  lightboxZoom = 1;

  // Touch swipe mobile
  touchStartX = 0;
  touchEndX = 0;

  // Magnifier Lens (Kính lúp vuông soi chi tiết)
  isMagnifierActive = false;
  readonly LENS_SIZE = 200;
  readonly ZOOM_FACTOR = 2.5;
  lensLeft = 0;
  lensTop = 0;
  lensImgX = 0;
  lensImgY = 0;
  containerWidth = 0;
  containerHeight = 0;

  // Variants & Attributes
  attributeGroups: ProductAttributeGroup[] = [];
  selectedAttributes: Record<string, string> = {};
  matchedVariant: any = null;
  expandedAttributeGroups: Record<string, boolean> = {};
  readonly ATTRIBUTE_OPTIONS_LIMIT = 6;

  // Real data
  currentSku = '';
  currentPrice = 0;
  originalPrice: number | null = null;
  discountPercent = 0;
  maxStock = 0;
  quantity = 1;
  quantityError = '';

  // Flash Sale Timer
  hasFlashSale = false;
  flashSaleHours = '08';
  flashSaleMinutes = '45';
  flashSaleSeconds = '30';
  private flashSaleInterval: any = null;

  // Wishlist
  isWishlisted = false;
  private wishlistSub?: Subscription;

  // Share & Copy Link
  isCopiedLink = false;
  private copyTimer: any = null;

  // Toast notification
  toastMessage = '';
  toastType: 'success' | 'warning' | 'info' = 'success';
  private toastTimer: any = null;

  // Cart action
  isAddingToCart = false;
  isBuyingNow = false;
  cartMessage = '';

  // Specs & Dimensions
  dimensionsText = '';
  specsWidth = '';
  specsDepth = '';
  specsHeight = '';
  specsWeight = '';
  specsDiameter = '';
  specsWeightLoad = '';
  specsFinish = '';
  specsDesignedBy = '';

  // Reviews (FR3-C-14)
  reviews: ReviewItem[] = [];
  averageRating = 4.9;
  totalReviewsCount = 0;
  starDistribution: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  hasImageFilterCount = 0;
  selectedStarFilter = 'all';
  selectedVariantFilter = 'all';
  reviewPage = 1;
  reviewTotalPages = 1;
  reviewTotalFiltered = 0;
  isLoadingReviews = false;

  // Write Review Modal
  isWriteReviewModalOpen = false;
  newReview = {
    rating: 5,
    reviewerName: '',
    comment: ''
  };
  isSubmittingReview = false;

  // Showroom Consultation Modal
  isShowroomModalOpen = false;
  showrooms: ShowroomItem[] = [];
  isLoadingShowrooms = false;
  consultationForm = {
    fullName: '',
    phone: '',
    email: '',
    showroomId: '',
    preferredDate: '',
    preferredTime: '10:00',
    notes: ''
  };
  isSubmittingConsultation = false;
  consultationSuccessCode = '';

  // Custom Request Modal
  isCustomModalOpen = false;
  customForm = {
    fullName: '',
    phone: '',
    email: '',
    requestedDimensions: '',
    preferredMaterial: '',
    notes: ''
  };
  isSubmittingCustom = false;
  customSuccess = false;

  // Related Products (FR3-C-15)
  relatedProducts: CatalogProduct[] = [];
  isLoadingRelated = false;
  relatedScrollPosition = 0;

  // Sticky Mobile Buy Bar
  showStickyMobileBar = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private cartService: CartService,
    private wishlistService: WishlistService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id && id !== this.productId) {
        this.productId = id;
        this.resetState();
        this.loadProduct(id);
        if (typeof window !== 'undefined') {
          window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
          document.documentElement.scrollTop = 0;
          document.body.scrollTop = 0;
        }
      }
    });

    this.wishlistSub = this.wishlistService.wishlist$.subscribe(() => {
      this.checkWishlist();
      this.cdr.detectChanges();
    });

    this.startFlashSaleTimer();

    // Khởi tạo và lắng nghe đồng bộ danh sách so sánh sản phẩm
    this.loadCompareList();
    if (typeof window !== 'undefined') {
      this.compareEventListener = () => {
        this.loadCompareList();
        this.cdr.detectChanges();
      };
      window.addEventListener('dcor_compare_updated', this.compareEventListener);
      window.addEventListener('storage', this.compareEventListener);
    }
  }

  ngOnDestroy() {
    this.wishlistSub?.unsubscribe();
    if (this.flashSaleInterval) clearInterval(this.flashSaleInterval);
    if (this.toastTimer) clearTimeout(this.toastTimer);
    if (this.copyTimer) clearTimeout(this.copyTimer);
    if (typeof window !== 'undefined' && this.compareEventListener) {
      window.removeEventListener('dcor_compare_updated', this.compareEventListener);
      window.removeEventListener('storage', this.compareEventListener);
    }
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    if (typeof window !== 'undefined') {
      const scrollY = window.pageYOffset || document.documentElement.scrollTop || 0;
      // Show sticky bar on mobile when scrolled past 480px
      this.showStickyMobileBar = scrollY > 480 && window.innerWidth <= 768;
    }
  }

  private resetState() {
    this.activeImageIndex = 0;
    this.galleryImages = [];
    this.attributeGroups = [];
    this.selectedAttributes = {};
    this.matchedVariant = null;
    this.expandedAttributeGroups = {};
    this.isMagnifierActive = false;
    this.quantity = 1;
    this.quantityError = '';
    this.cartMessage = '';
    this.activeTab = 'desc';
    this.selectedStarFilter = 'all';
    this.selectedVariantFilter = 'all';
    this.reviewPage = 1;
    this.reviews = [];
    this.isRelatedExpanded = false;
    this.relatedProducts = [];
  }

  async loadProduct(id: string) {
    this.isLoading = true;
    try {
      const res = await fetch(`${environment.apiUrl}/products/${id}`);
      if (!res.ok) {
        throw new Error(`Không thể tải sản phẩm (HTTP ${res.status}).`);
      }

      const data = await res.json();
      this.product = {
        ...data,
        categoryObj: data.category,
        category: typeof data.category === 'string'
          ? data.category
          : (data.category?.name || 'Sản phẩm')
      };

      this.initProductVariants();
      this.loadReviews();
      this.loadRelatedProducts();
      this.checkWishlist();
    } catch (e) {
      console.error('Lỗi khi tải chi tiết sản phẩm:', e);
      this.showToast('Không thể tải thông tin sản phẩm', 'warning');
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  // --- FLASH SALE TIMER ---
  private startFlashSaleTimer() {
    const updateCountdown = () => {
      const now = new Date();
      // Target is end of current day (23:59:59)
      const target = new Date();
      target.setHours(23, 59, 59, 999);
      const diffMs = Math.max(0, target.getTime() - now.getTime());

      const totalSec = Math.floor(diffMs / 1000);
      const hours = Math.floor(totalSec / 3600);
      const minutes = Math.floor((totalSec % 3600) / 60);
      const seconds = totalSec % 60;

      this.flashSaleHours = String(hours).padStart(2, '0');
      this.flashSaleMinutes = String(minutes).padStart(2, '0');
      this.flashSaleSeconds = String(seconds).padStart(2, '0');
      this.cdr.detectChanges();
    };

    updateCountdown();
    this.flashSaleInterval = setInterval(updateCountdown, 1000);
  }

  // --- VARIANT RESOLUTION & MATRIX ---
  private isNumericSlash(str: string): boolean {
    return /\d[\d½¼¾\.]*\s*\/\s*\d/.test(str);
  }

  private splitCompositeName(name: string): string[] {
    if (!name || this.isNumericSlash(name)) return [name.trim()];
    const parts = name.split(/\s*\/\s*/).map(p => p.trim()).filter(Boolean);
    if (parts.length > 1 && parts.every(p => !/^\d+$/.test(p))) {
      if (parts.length === 2 && parts[0].toLowerCase() === parts[1].toLowerCase()) {
        return [parts[0]];
      }
      return parts;
    }
    return [name.trim()];
  }

  private parseVariantToParts(name: string): string[] {
    if (!name) return [];
    const majorParts = name.split(/\s+[\/|]\s+/);
    const result: string[] = [];
    for (const part of majorParts) {
      result.push(...this.splitCompositeName(part));
    }
    return result;
  }

  initProductVariants() {
    const prod = this.product;
    if (!prod) return;

    const rawVariants: any[] = Array.isArray(prod.variants) ? prod.variants : [];
    const configAttrs: any[] = prod.configOptions?.attributes || [];

    this.attributeGroups = [];
    this.selectedAttributes = {};

    // 1. Phân loại thuộc tính từ configOptions
    if (configAttrs.length > 0) {
      for (const attr of configAttrs) {
        const gid = attr.groupId || 'attr';
        const label = GROUP_LABEL_MAP[gid] || attr.groupName || gid;
        const rawOpts: AttributeOption[] = (attr.options || []).map((o: any) => ({
          id: String(o.id),
          name: o.name,
          image: o.image || null,
          hexColor: o.hexColor || this.detectColor(o.name).hex,
          groupName: o.groupName || null
        }));

        const isComposite = rawOpts.length > 0 && rawOpts.every(o => {
          const parts = this.splitCompositeName(o.name);
          return parts.length >= 2;
        });

        if (isComposite) {
          for (let partIdx = 0; partIdx < 2; partIdx++) {
            const subMap = new Map<string, AttributeOption>();
            rawOpts.forEach(o => {
              const parts = this.splitCompositeName(o.name);
              const partVal = (parts[partIdx] || parts[0]).trim();
              if (partVal && !subMap.has(partVal)) {
                subMap.set(partVal, {
                  id: partVal,
                  name: partVal,
                  image: partIdx === 0 ? o.image : null,
                  hexColor: (partIdx === 0 && o.hexColor) ? o.hexColor : this.detectColor(partVal).hex,
                  groupName: o.groupName || null
                });
              }
            });

            const subOpts = Array.from(subMap.values());
            const subGroupId = `${gid}_sub_${partIdx}`;
            let subLabel = label;
            if (gid === 'vaMaterial') {
              subLabel = partIdx === 0 ? 'Chất liệu thân / Mặt' : 'Chất liệu khung / Chân';
            } else if (gid === 'vaMaterialShell') {
              subLabel = partIdx === 0 ? 'Chất liệu vỏ / Khung' : 'Chất liệu đệm / Vải';
            } else {
              subLabel = partIdx === 0 ? `${label} (Chính)` : `${label} (Phối)`;
            }

            if (subOpts.length > 0) {
              this.attributeGroups.push({
                groupId: subGroupId,
                label: subLabel,
                options: subOpts
              });
            }
          }
        } else {
          const cleanedOpts = rawOpts.map(o => {
            const parts = this.splitCompositeName(o.name);
            return {
              ...o,
              name: parts.length === 1 ? parts[0] : o.name,
              hexColor: o.hexColor || this.detectColor(o.name).hex
            };
          });
          const uniqueCleaned = Array.from(new Map(cleanedOpts.map(o => [o.name, o])).values());

          if (uniqueCleaned.length > 0) {
            this.attributeGroups.push({
              groupId: gid,
              label,
              options: uniqueCleaned
            });
          }
        }
      }
    } else if (rawVariants.length > 1) {
      // Fallback từ tên biến thể nếu không có configOptions
      const sampleParts = this.parseVariantToParts(rawVariants[0].name || '');
      if (sampleParts.length > 0) {
        sampleParts.forEach((_: string, idx: number) => {
          const uniqueVals = Array.from(new Set(rawVariants.map(v => (this.parseVariantToParts(v.name || '')[idx] || '').trim()))).filter(Boolean);
          if (uniqueVals.length > 0) {
            let label = `Thuộc tính ${idx + 1}`;
            if (idx === 0 && uniqueVals.some(v => /^[HhWwLlDdØø]\d+/i.test(v))) {
              label = 'Kích thước';
            } else if (uniqueVals.some(v => /lacquer|veneer|fabric|wood|leather|gỗ|da|vải|sơn/i.test(v))) {
              label = idx === 0 ? 'Chất liệu' : 'Màu sắc & Hoàn thiện';
            }
            this.attributeGroups.push({
              groupId: `opt_${idx}`,
              label,
              options: uniqueVals.map(val => ({
                id: val,
                name: val,
                hexColor: this.detectColor(val).hex
              }))
            });
          }
        });
      }
    }

    // 2. Mặc định chọn biến thể đầu tiên còn hàng (hoặc biến thể đầu tiên)
    const inStockVariant = rawVariants.find(v => ((v.stock ?? 0) - (v.reservedStock ?? 0)) > 0) || rawVariants[0];
    if (inStockVariant) {
      this.matchedVariant = inStockVariant;
      const vNameLower = (inStockVariant.name || '').toLowerCase();

      for (const group of this.attributeGroups) {
        const valId = inStockVariant.optionValues?.[group.groupId];
        if (valId !== undefined && valId !== null && group.options.some(o => o.id === String(valId))) {
          this.selectedAttributes[group.groupId] = String(valId);
        } else {
          const matchedOpt = group.options.find(o => vNameLower.includes(o.name.toLowerCase()));
          this.selectedAttributes[group.groupId] = matchedOpt ? matchedOpt.id : (group.options[0]?.id || '');
        }
      }
    }

    this.updateVariantData();
  }

  // Kiểm tra xem một option có biến thể nào còn hàng hay không ("tùy chọn hết hàng ẩn đi")
  isOptionAvailable(groupId: string, optionId: string): boolean {
    if (!this.product?.variants || this.product.variants.length === 0) return true;

    // Tìm các biến thể khớp với option này
    const matchingVariants = this.product.variants.filter((v: any) => {
      // 1. Phải khớp optionId ở nhóm này
      const val = v.optionValues?.[groupId];
      const nameMatch = (v.name || '').toLowerCase().includes(optionId.toLowerCase());
      const hasThisOption = (val !== undefined && String(val) === optionId) || nameMatch;

      if (!hasThisOption) return false;

      // 2. Tồn kho khả dụng phải > 0
      const availStock = (v.stock ?? 0) - (v.reservedStock ?? 0);
      return availStock > 0 && v.isActive !== false;
    });

    return matchingVariants.length > 0;
  }

  selectOption(groupId: string, optionId: string) {
    this.selectedAttributes[groupId] = optionId;
    this.matchVariantFromSelection();
  }

  private matchVariantFromSelection() {
    const rawVariants: any[] = this.product?.variants || [];
    if (rawVariants.length === 0) return;

    let bestMatch = rawVariants[0];
    let highestScore = -1;

    for (const v of rawVariants) {
      let score = 0;
      const vNameLower = (v.name || '').toLowerCase();

      for (const group of this.attributeGroups) {
        const selValId = this.selectedAttributes[group.groupId];
        if (!selValId) continue;

        const optVal = v.optionValues?.[group.groupId];
        if (optVal !== undefined && String(optVal) === selValId) {
          score += 10;
        } else if (vNameLower.includes(selValId.toLowerCase())) {
          score += 5;
        }
      }

      // Ưu tiên biến thể còn hàng
      const avail = (v.stock ?? 0) - (v.reservedStock ?? 0);
      if (avail > 0) score += 2;

      if (score > highestScore) {
        highestScore = score;
        bestMatch = v;
      }
    }

    this.matchedVariant = bestMatch;
    this.updateVariantData();
  }

  private updateVariantData() {
    const prod = this.product;
    const v = this.matchedVariant || prod?.variants?.[0];

    // SKU
    this.currentSku = v?.sku || prod?.slug || 'DCOR-PREMIUM';

    // Pricing & Discount
    const basePrice = v?.price || prod?.basePrice || prod?.prices?.[0]?.price || 0;
    this.hasFlashSale = Boolean(prod?.discountValue && prod.discountValue > 0);

    if (this.hasFlashSale) {
      if (prod.discountType === 'PERCENT') {
        this.discountPercent = prod.discountValue;
        this.currentPrice = Math.round(basePrice * (1 - prod.discountValue / 100));
        this.originalPrice = basePrice;
      } else if (prod.discountType === 'AMOUNT') {
        this.currentPrice = Math.max(0, basePrice - prod.discountValue);
        this.originalPrice = basePrice;
        this.discountPercent = Math.round((prod.discountValue / basePrice) * 100);
      } else {
        // Fallback percentage
        this.discountPercent = prod.discountValue;
        this.currentPrice = Math.round(basePrice * (1 - prod.discountValue / 100));
        this.originalPrice = basePrice;
      }
    } else {
      this.currentPrice = basePrice;
      this.originalPrice = null;
      this.discountPercent = 0;
    }

    // Stock
    const rawStock = v ? ((v.stock ?? 0) - (v.reservedStock ?? 0)) : 10;
    this.maxStock = Math.max(0, rawStock);
    if (this.quantity > this.maxStock && this.maxStock > 0) {
      this.quantity = this.maxStock;
    }
    if (this.maxStock === 0) {
      this.quantity = 0;
    } else if (this.quantity === 0) {
      this.quantity = 1;
    }
    this.quantityError = '';

    // Images
    this.galleryImages = this.extractImages(prod, v);
    this.activeImageIndex = 0;

    // Technical Specs
    const attrs = v?.attributes || {};
    const dims = v?.dimensions || {};

    this.specsWidth = attrs.width || (dims.width ? `${dims.width} cm` : '');
    this.specsDepth = attrs.depth || (dims.depth ? `${dims.depth} cm` : '');
    this.specsHeight = attrs.height || (dims.height ? `${dims.height} cm` : '');
    this.specsWeight = attrs.weight || (dims.weight ? `${dims.weight} kg` : '');
    this.specsDiameter = attrs.diameter || '';
    this.specsWeightLoad = attrs.weightLoad || '120 kg';
    this.specsFinish = attrs.finish_vi || attrs.finish || prod?.description || 'Vật liệu tiêu chuẩn DCOR';
    this.specsDesignedBy = attrs.designedBy || 'BoConcept Design Team (Đan Mạch)';

    const dimParts: string[] = [];
    if (this.specsDiameter) dimParts.push(`Đường kính: ${this.specsDiameter}`);
    if (this.specsWidth) dimParts.push(`Rộng: ${this.specsWidth}`);
    if (this.specsDepth) dimParts.push(`Sâu: ${this.specsDepth}`);
    if (this.specsHeight) dimParts.push(`Cao: ${this.specsHeight}`);
    if (this.specsWeight) dimParts.push(`Trọng lượng: ${this.specsWeight}`);
    this.dimensionsText = dimParts.join(' • ');

    this.cdr.detectChanges();
  }

  private extractImages(prod: any, variant: any): string[] {
    const list: string[] = [];
    const isClean = (u: any) => typeof u === 'string' && u.startsWith('http') && !u.includes('assets.boconcept.com');

    // 1. Ảnh từ variant hiện tại
    const vImgs = variant?.images || variant?.optionValues?.images || [];
    if (Array.isArray(vImgs)) {
      vImgs.filter(isClean).forEach(img => {
        if (!list.includes(img)) list.push(img);
      });
    }

    // 2. Ảnh từ product
    const pImgs = Array.isArray(prod?.images) ? prod.images : [];
    pImgs.filter(isClean).forEach((img: string) => {
      if (!list.includes(img)) list.push(img);
    });

    return list.length > 0 ? list : ['https://ckkvyltbeinzqogjsfli.supabase.co/storage/v1/object/public/dcor/sofas/41252001_2733503_PNG-Web2072dpi.png'];
  }

  // Nhận diện loại nhóm thuộc tính để hiển thị phù hợp
  isColorGroup(group: ProductAttributeGroup): boolean {
    const gLower = group.groupId.toLowerCase();
    const lLower = group.label.toLowerCase();
    return gLower.includes('colour') || gLower.includes('color') || lLower.includes('màu');
  }

  isSizeGroup(group: ProductAttributeGroup): boolean {
    const gLower = group.groupId.toLowerCase();
    const lLower = group.label.toLowerCase();
    return gLower.includes('size') || lLower.includes('kích thước') || lLower.includes('size');
  }

  isMaterialGroup(group: ProductAttributeGroup): boolean {
    const gLower = group.groupId.toLowerCase();
    const lLower = group.label.toLowerCase();
    return gLower.includes('material') || gLower.includes('upholstery') || lLower.includes('chất liệu') || lLower.includes('vải');
  }

  // --- QUẢN LÝ THU GỌN / XEM THÊM KHI THUỘC TÍNH CÓ NHIỀU OPTIONS ---
  isGroupExpanded(groupId: string): boolean {
    return !!this.expandedAttributeGroups[groupId];
  }

  toggleGroupExpansion(groupId: string) {
    this.expandedAttributeGroups[groupId] = !this.expandedAttributeGroups[groupId];
    this.cdr.detectChanges();
  }

  getAvailableOptions(group: ProductAttributeGroup): AttributeOption[] {
    if (!group || !group.options) return [];
    return group.options.filter(opt => this.isOptionAvailable(group.groupId, opt.id));
  }

  shouldShowToggle(group: ProductAttributeGroup): boolean {
    return this.getAvailableOptions(group).length > this.ATTRIBUTE_OPTIONS_LIMIT;
  }

  getVisibleOptions(group: ProductAttributeGroup): AttributeOption[] {
    const available = this.getAvailableOptions(group);
    if (this.isGroupExpanded(group.groupId) || available.length <= this.ATTRIBUTE_OPTIONS_LIMIT) {
      return available;
    }

    const limit = this.ATTRIBUTE_OPTIONS_LIMIT;
    const selectedId = this.selectedAttributes[group.groupId];
    const initialSlice = available.slice(0, limit);

    // Nếu tùy chọn hiện đang chọn nằm ngoài top `limit`, hoán đổi để tùy chọn đã chọn luôn hiển thị
    if (selectedId && !initialSlice.some(o => o.id === selectedId)) {
      const selectedOpt = available.find(o => o.id === selectedId);
      if (selectedOpt) {
        return [...available.slice(0, limit - 1), selectedOpt];
      }
    }

    return initialSlice;
  }

  getRemainingOptionsCount(group: ProductAttributeGroup): number {
    const available = this.getAvailableOptions(group);
    return Math.max(0, available.length - this.ATTRIBUTE_OPTIONS_LIMIT);
  }

  getSelectedOptionName(group: ProductAttributeGroup): string {
    const selId = this.selectedAttributes[group.groupId];
    if (!selId) return '';
    const opt = group.options?.find(o => o.id === selId);
    return opt ? opt.name : '';
  }

  detectColor(text: string): { name: string; hex: string } {
    const lower = (text || '').toLowerCase();
    if (lower.includes('green') || lower.includes('xanh lá') || lower.includes('olive')) return { name: 'Xanh lá', hex: '#3B5E45' };
    if (lower.includes('sky blue') || lower.includes('blue') || lower.includes('xanh dương') || lower.includes('navy')) return { name: 'Xanh dương', hex: '#2B4C7E' };
    if (lower.includes('yellow') || lower.includes('vàng') || lower.includes('ochre')) return { name: 'Vàng', hex: '#E6B800' };
    if (lower.includes('cognac') || lower.includes('camel') || lower.includes('amber') || lower.includes('cam')) return { name: 'Cam đất', hex: '#9A461E' };
    if (lower.includes('beige') || lower.includes('sand') || lower.includes('cream') || lower.includes('taupe') || lower.includes('be')) return { name: 'Be sữa', hex: '#D8C8B8' };
    if (lower.includes('dark grey') || lower.includes('charcoal')) return { name: 'Xám than', hex: '#374151' };
    if (lower.includes('light grey') || lower.includes('grey') || lower.includes('gray') || lower.includes('xám') || lower.includes('ash')) return { name: 'Xám khói', hex: '#9CA3AF' };
    if (lower.includes('white') || lower.includes('trắng')) return { name: 'Trắng sứ', hex: '#F3F4F6' };
    if (lower.includes('black') || lower.includes('đen')) return { name: 'Đen nhám', hex: '#18181B' };
    if (lower.includes('oak') || lower.includes('sồi')) return { name: 'Gỗ sồi tự nhiên', hex: '#C4A482' };
    if (lower.includes('brown') || lower.includes('walnut') || lower.includes('nâu') || lower.includes('espresso')) return { name: 'Nâu Walnut', hex: '#6B4423' };
    if (lower.includes('terracotta') || lower.includes('red') || lower.includes('đỏ') || lower.includes('rust')) return { name: 'Đỏ đất', hex: '#A84332' };
    return { name: text || 'Tiêu chuẩn', hex: '#78716c' };
  }

  // --- GALLERY INTERACTIONS & LIGHTBOX ---
  selectGalleryImage(idx: number) {
    this.activeImageIndex = idx;
    this.isMagnifierActive = false;
  }

  prevGalleryImage() {
    if (this.galleryImages.length <= 1) return;
    this.activeImageIndex = (this.activeImageIndex - 1 + this.galleryImages.length) % this.galleryImages.length;
    this.isMagnifierActive = false;
  }

  nextGalleryImage() {
    if (this.galleryImages.length <= 1) return;
    this.activeImageIndex = (this.activeImageIndex + 1) % this.galleryImages.length;
    this.isMagnifierActive = false;
  }

  // --- KÍNH LÚP SOI CHI TIẾT (MAGNIFIER LENS) ---
  onMagnifierEnter(event: MouseEvent) {
    if (typeof window === 'undefined') return;
    if (window.innerWidth <= 768) return;

    const target = event.currentTarget as HTMLElement;
    if (!target) return;
    this.isMagnifierActive = true;
    this.updateMagnifierPosition(event, target);
  }

  onMagnifierMove(event: MouseEvent) {
    if (!this.isMagnifierActive) return;
    const target = event.currentTarget as HTMLElement;
    if (!target) return;
    this.updateMagnifierPosition(event, target);
  }

  onMagnifierLeave() {
    this.isMagnifierActive = false;
  }

  private updateMagnifierPosition(event: MouseEvent, container: HTMLElement) {
    const rect = container.getBoundingClientRect();
    this.containerWidth = rect.width;
    this.containerHeight = rect.height;

    // Tọa độ chuột trong khung container
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    const lensHalf = this.LENS_SIZE / 2;

    // Giới hạn kính lúp không tràn ra ngoài viền khung ảnh
    let left = mouseX - lensHalf;
    let top = mouseY - lensHalf;
    left = Math.max(0, Math.min(this.containerWidth - this.LENS_SIZE, left));
    top = Math.max(0, Math.min(this.containerHeight - this.LENS_SIZE, top));

    this.lensLeft = left;
    this.lensTop = top;

    // Tọa độ tâm kính lúp trên khung ảnh
    const centerX = left + lensHalf;
    const centerY = top + lensHalf;

    // Vị trí ảnh phóng to bên trong kính lúp để tâm kính lúp khớp chính xác điểm soi
    this.lensImgX = lensHalf - centerX * this.ZOOM_FACTOR;
    this.lensImgY = lensHalf - centerY * this.ZOOM_FACTOR;
  }

  get lensStyle() {
    return {
      'width.px': this.LENS_SIZE,
      'height.px': this.LENS_SIZE,
      'left.px': this.lensLeft,
      'top.px': this.lensTop
    };
  }

  get lensImgStyle() {
    return {
      'width.px': this.containerWidth * this.ZOOM_FACTOR,
      'height.px': this.containerHeight * this.ZOOM_FACTOR,
      'padding.px': 24 * this.ZOOM_FACTOR,
      'left.px': this.lensImgX,
      'top.px': this.lensImgY
    };
  }

  // Mobile swipe gestures
  onTouchStart(e: TouchEvent) {
    this.isMagnifierActive = false;
    this.touchStartX = e.changedTouches[0].screenX;
  }

  onTouchEnd(e: TouchEvent) {
    this.touchEndX = e.changedTouches[0].screenX;
    const diff = this.touchStartX - this.touchEndX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        this.nextGalleryImage();
      } else {
        this.prevGalleryImage();
      }
    }
  }

  openLightbox(idx = 0) {
    this.lightboxIndex = idx;
    this.lightboxZoom = 1;
    this.isLightboxOpen = true;
    if (typeof document !== 'undefined') {
      document.body.style.overflow = 'hidden';
    }
  }

  closeLightbox() {
    this.isLightboxOpen = false;
    this.lightboxZoom = 1;
    if (typeof document !== 'undefined') {
      document.body.style.overflow = '';
    }
  }

  nextLightbox() {
    this.lightboxIndex = (this.lightboxIndex + 1) % this.galleryImages.length;
  }

  prevLightbox() {
    this.lightboxIndex = (this.lightboxIndex - 1 + this.galleryImages.length) % this.galleryImages.length;
  }

  zoomInLightbox() {
    this.lightboxZoom = Math.min(3, this.lightboxZoom + 0.3);
  }

  zoomOutLightbox() {
    this.lightboxZoom = Math.max(1, this.lightboxZoom - 0.3);
  }

  // --- QUANTITY STEPPER ---
  decreaseQuantity() {
    if (this.quantity > 1) {
      this.quantity--;
      this.quantityError = '';
    }
  }

  increaseQuantity() {
    if (this.quantity < this.maxStock) {
      this.quantity++;
      this.quantityError = '';
    } else {
      this.quantityError = `Tối đa ${this.maxStock} sản phẩm có sẵn trong kho.`;
    }
  }

  onQuantityChange(val: any) {
    const parsed = parseInt(val, 10);
    if (isNaN(parsed) || parsed < 1) {
      this.quantity = 1;
      this.quantityError = '';
    } else if (parsed > this.maxStock) {
      this.quantity = this.maxStock;
      this.quantityError = `Số lượng không được vượt quá tồn kho (${this.maxStock} sản phẩm).`;
    } else {
      this.quantity = parsed;
      this.quantityError = '';
    }
  }

  // --- ACTIONS: CART, BUY NOW, WISHLIST, COMPARE, SHARE ---
  addToCart(redirectAfter = false) {
    if (!this.product) return;

    const variant = this.matchedVariant || this.product.variants?.[0];
    if (!variant) {
      this.cartMessage = 'Sản phẩm hiện chưa có biến thể khả dụng.';
      return;
    }

    if (this.maxStock <= 0) {
      this.showToast('Biến thể đã tạm hết hàng trong kho.', 'warning');
      return;
    }

    if (redirectAfter) {
      this.isBuyingNow = true;
    } else {
      this.isAddingToCart = true;
    }
    this.cartMessage = '';

    const selectedOptions = {
      ...this.selectedAttributes,
      variantName: variant.name,
      sku: this.currentSku
    };

    // Lấy thông tin cho guest cart (hỗ trợ mua hàng không cần đăng nhập trước)
    const rawPrice = this.currentPrice || variant.price || this.product.prices?.[0]?.price || 0;
    const productImages = Array.isArray(this.product.images) ? this.product.images : [];
    const variantImages = (variant.optionValues as any)?.images;
    const imageUrl = (Array.isArray(variantImages) && variantImages.length > 0)
      ? variantImages[0]
      : (this.galleryImages?.[0] || (productImages.length > 0 ? productImages[0] : ''));

    const guestProductInfo = {
      productId: this.product.productId || (this.product as any).id || '',
      name: this.product.shortDescription_vi || this.product.shortDescription || (this.product as any).name || 'Sản phẩm',
      variantName: variant.name !== 'Phân loại mặc định' ? variant.name : undefined,
      image: typeof imageUrl === 'string' ? imageUrl : '',
      price: rawPrice,
      originalPrice: this.originalPrice || undefined,
      availableStock: this.maxStock
    };

    this.cartService.addToCart(variant.id, this.quantity, selectedOptions, guestProductInfo)
      .pipe(
        timeout({ first: 15000 }),
        finalize(() => {
          this.isAddingToCart = false;
          this.isBuyingNow = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (res: any) => {
          this.showToast(`Đã thêm ${this.quantity} sản phẩm vào giỏ hàng thành công!`, 'success');
          if (redirectAfter) {
            if (res?.cartItem?.id) {
              try {
                sessionStorage.setItem('dcor_checkout_items', JSON.stringify([res.cartItem.id]));
              } catch (e) {}
            }
            this.router.navigate(['/checkout']);
          }
        },
        error: (error: unknown) => {
          const msg = error instanceof TimeoutError
            ? 'Máy chủ phản hồi quá lâu. Vui lòng thử lại.'
            : error instanceof HttpErrorResponse
              ? error.error?.message || 'Không thể thêm sản phẩm vào giỏ hàng.'
              : 'Không thể thêm sản phẩm vào giỏ hàng.';
          this.showToast(msg, 'warning');
        }
      });
  }

  buyNow() {
    this.addToCart(true);
  }

  checkWishlist() {
    if (this.product?.id || this.product?.productId) {
      const id = this.product.id || this.product.productId;
      this.isWishlisted = this.wishlistService.isWishlisted(id);
    }
  }

  get isCompared(): boolean {
    if (!this.product) return false;
    try {
      const stored = localStorage.getItem('dcor_compare_items');
      const list: any[] = stored ? JSON.parse(stored) : [];
      return list.some(item => (item.id === this.product.id || item.productId === this.product.id));
    } catch {
      return false;
    }
  }

  get isCompareDisabled(): boolean {
    if (!this.product) return false;
    try {
      const stored = localStorage.getItem('dcor_compare_items');
      const list: any[] = stored ? JSON.parse(stored) : [];
      if (list.length === 0) return false;
      if (this.isCompared) return false;
      return !this.isSameMainCategory(list[0], this.product);
    } catch {
      return false;
    }
  }

  get compareTooltip(): string {
    if (this.isCompared) return 'Bỏ so sánh';
    if (this.isCompareDisabled) {
      try {
        const stored = localStorage.getItem('dcor_compare_items');
        const list: any[] = stored ? JSON.parse(stored) : [];
        if (list.length > 0) {
          return `Chỉ so sánh các sản phẩm cùng danh mục chính (${this.getRootCategoryName(list[0])})`;
        }
      } catch { }
      return 'Không cùng danh mục so sánh';
    }
    return 'Thêm vào so sánh';
  }

  getProductMainCategoryKey(prod: any): string {
    if (!prod) return 'accessories';
    const catName = (prod.category?.name || prod.categoryName || '').toLowerCase();
    const catSlug = (prod.category?.slug || '').toLowerCase();
    const parentName = (prod.category?.parent?.name || '').toLowerCase();
    const parentSlug = (prod.category?.parent?.slug || '').toLowerCase();
    const name = (prod.name || '').toLowerCase();

    if (parentName.includes('sofa') || parentSlug.includes('sofa') || catName.includes('sofa') || catSlug.includes('sofa') || name.includes('sofa')) return 'sofas';
    if (parentName.includes('chair') || parentSlug.includes('chair') || catName.includes('chair') || catSlug.includes('chair') || name.includes('chair') || name.includes('ghế')) return 'chairs';
    if (parentName.includes('table') || parentSlug.includes('table') || catName.includes('table') || catSlug.includes('table') || name.includes('table') || name.includes('bàn')) return 'tables';
    if (parentName.includes('storage') || parentSlug.includes('storage') || catName.includes('storage') || catSlug.includes('storage') || parentName.includes('tủ') || catName.includes('tủ') || name.includes('tủ') || name.includes('kệ') || name.includes('cabinet') || name.includes('shelf')) return 'storage';
    if (parentName.includes('bed') || parentSlug.includes('bed') || catName.includes('bed') || catSlug.includes('bed') || name.includes('bed') || name.includes('giường')) return 'beds';
    if (parentName.includes('rug') || parentSlug.includes('rug') || catName.includes('rug') || catSlug.includes('rug') || name.includes('rug') || name.includes('thảm') || name.includes('carpet')) return 'rugs';
    if (parentName.includes('lamp') || parentSlug.includes('lamp') || catName.includes('lamp') || catSlug.includes('lamp') || name.includes('lamp') || name.includes('pendant') || name.includes('light') || name.includes('đèn')) return 'lamps';
    if (parentName.includes('outdoor') || parentSlug.includes('outdoor') || catName.includes('outdoor') || catSlug.includes('outdoor') || name.includes('outdoor')) return 'outdoor';
    return 'accessories';
  }

  getRootCategoryName(prod: any): string {
    const key = this.getProductMainCategoryKey(prod);
    const map: Record<string, string> = {
      sofas: 'Sofas',
      chairs: 'Chairs',
      tables: 'Tables',
      storage: 'Storage',
      beds: 'Beds',
      rugs: 'Rugs',
      lamps: 'Lamps',
      outdoor: 'Outdoor',
      accessories: 'Accessories'
    };
    return map[key] || 'Sản phẩm';
  }

  isSameMainCategory(prodA: any, prodB: any): boolean {
    if (!prodA || !prodB) return false;
    const idA = prodA.productId || prodA.id;
    const idB = prodB.productId || prodB.id;
    if (idA && idB && idA === idB) return true;
    return this.getProductMainCategoryKey(prodA) === this.getProductMainCategoryKey(prodB);
  }

  toggleWishlist() {
    const id = this.product?.id || this.product?.productId;
    if (!id) return;
    const added = this.wishlistService.toggle(id);
    this.isWishlisted = added;
    this.showToast(
      added ? 'Đã thêm sản phẩm vào danh sách yêu thích!' : 'Đã xóa sản phẩm khỏi danh sách yêu thích.',
      'info'
    );
  }

  toggleCompare() {
    if (!this.product) return;
    try {
      const stored = localStorage.getItem('dcor_compare_items');
      let compareList: any[] = stored ? JSON.parse(stored) : [];

      if (this.isCompareDisabled) {
        if (compareList.length > 0) {
          this.showToast(`Chỉ có thể so sánh sản phẩm cùng danh mục chính (${this.getRootCategoryName(compareList[0])})`, 'warning');
        }
        return;
      }

      const exists = compareList.some((item: any) => item.id === this.product.id || item.productId === this.product.id);
      if (exists) {
        compareList = compareList.filter((item: any) => item.id !== this.product.id && item.productId !== this.product.id);
        localStorage.setItem('dcor_compare_items', JSON.stringify(compareList));
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('dcor_compare_updated'));
          window.dispatchEvent(new Event('storage'));
        }
        this.showToast('Đã xóa khỏi danh sách so sánh.', 'info');
      } else {
        if (compareList.length >= 5) {
          this.showToast('Tối đa 5 sản phẩm để so sánh.', 'warning');
          return;
        }
        compareList.push({
          id: this.product.id,
          productId: this.product.id,
          name: this.product.name,
          category: this.product.category,
          categoryId: this.product.categoryId,
          basePrice: this.currentPrice,
          images: this.galleryImages,
          variants: this.product.variants
        });
        localStorage.setItem('dcor_compare_items', JSON.stringify(compareList));
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('dcor_compare_updated'));
          window.dispatchEvent(new Event('storage'));
        }
        this.showToast(`Đã thêm vào so sánh (${compareList.length}/5 sản phẩm).`, 'success');
      }
      this.loadCompareList();
      this.cdr.detectChanges();
    } catch {
      this.showToast('Thao tác so sánh hoàn tất.', 'info');
    }
  }

  loadCompareList() {
    try {
      const stored = localStorage.getItem('dcor_compare_items');
      this.compareList = stored ? JSON.parse(stored) : [];
    } catch {
      this.compareList = [];
    }
    this.cdr.detectChanges();
  }

  openCompareModal() {
    if (this.compareList.length < 2) {
      this.showToast('Vui lòng chọn tối thiểu 2 sản phẩm để so sánh!', 'info');
      return;
    }
    this.isCompareModalOpen = true;
    this.cdr.detectChanges();
  }

  closeCompareModal() {
    this.isCompareModalOpen = false;
    this.cdr.detectChanges();
  }

  removeCompare(productId: string) {
    this.compareList = this.compareList.filter(p => (p.id !== productId && p.productId !== productId));
    try {
      localStorage.setItem('dcor_compare_items', JSON.stringify(this.compareList));
    } catch {}
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('dcor_compare_updated'));
      window.dispatchEvent(new Event('storage'));
    }
    if (this.compareList.length <= 1) {
      this.isCompareModalOpen = false;
    }
    this.showToast('Đã xóa sản phẩm khỏi danh sách so sánh.', 'info');
    this.cdr.detectChanges();
  }

  clearAllCompare() {
    this.compareList = [];
    try {
      localStorage.setItem('dcor_compare_items', '[]');
    } catch {}
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('dcor_compare_updated'));
      window.dispatchEvent(new Event('storage'));
    }
    this.isCompareModalOpen = false;
    this.showToast('Đã xóa toàn bộ sản phẩm đang so sánh.', 'info');
    this.cdr.detectChanges();
  }

  copyCompareShareLink() {
    if (typeof window === 'undefined') return;
    const ids = this.compareList.map(p => p.productId || p.id).filter(Boolean);
    const shareUrl = `${window.location.origin}/explore?compare=${ids.join(',')}`;

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        this.showToast('Đã sao chép liên kết so sánh!', 'success');
      }).catch(() => {
        this.fallbackCopyText(shareUrl, () => {
          this.showToast('Đã sao chép liên kết so sánh!', 'success');
        });
      });
    } else {
      this.fallbackCopyText(shareUrl, () => {
        this.showToast('Đã sao chép liên kết so sánh!', 'success');
      });
    }
  }

  shareProduct() {
    if (typeof window === 'undefined') return;

    const url = window.location.href;
    const onSuccess = () => {
      this.isCopiedLink = true;
      this.showToast('Đã sao chép liên kết sản phẩm vào bộ nhớ tạm!', 'success');
      if (this.copyTimer) clearTimeout(this.copyTimer);
      this.copyTimer = setTimeout(() => {
        this.isCopiedLink = false;
        this.cdr.detectChanges();
      }, 2500);
      this.cdr.detectChanges();
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url)
        .then(onSuccess)
        .catch(() => this.fallbackCopyText(url, onSuccess));
    } else {
      this.fallbackCopyText(url, onSuccess);
    }
  }

  private fallbackCopyText(text: string, callback?: () => void) {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      if (successful) {
        if (callback) callback();
      } else {
        this.showToast('Không thể sao chép liên kết.', 'warning');
      }
    } catch {
      this.showToast('Không thể sao chép liên kết.', 'warning');
    }
  }

  // --- REVIEWS SYSTEM (FR3-C-14) ---
  loadReviews(page = 1) {
    this.isLoadingReviews = true;
    this.reviewPage = page;

    let url = `${environment.apiUrl}/products/${this.productId}/reviews?page=${page}&limit=5`;
    if (this.selectedStarFilter && this.selectedStarFilter !== 'all') {
      url += `&rating=${this.selectedStarFilter}`;
    }
    if (this.selectedVariantFilter && this.selectedVariantFilter !== 'all') {
      url += `&variantId=${this.selectedVariantFilter}`;
    }

    fetch(url)
      .then(res => res.json())
      .then(data => {
        this.averageRating = data.averageRating || 4.9;
        this.totalReviewsCount = data.totalCount || 0;
        this.starDistribution = data.distribution || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        this.hasImageFilterCount = data.hasImageFilterCount || 0;
        this.reviews = data.reviews || [];
        this.reviewTotalPages = data.totalPages || 1;
        this.reviewTotalFiltered = data.totalFiltered || 0;
      })
      .catch(err => {
        console.error('Lỗi tải đánh giá:', err);
      })
      .finally(() => {
        this.isLoadingReviews = false;
        this.cdr.detectChanges();
      });
  }

  setStarFilter(star: string) {
    this.selectedStarFilter = star;
    this.loadReviews(1);
  }

  setVariantFilter(vId: string) {
    this.selectedVariantFilter = vId;
    this.loadReviews(1);
  }

  likeReview(rev: ReviewItem) {
    if (!rev.liked) {
      rev.helpfulCount++;
      rev.liked = true;
      this.showToast('Cảm ơn bạn đã phản hồi đánh giá hữu ích!', 'success');
    }
  }

  openWriteReviewModal() {
    this.isWriteReviewModalOpen = true;
  }

  closeWriteReviewModal() {
    this.isWriteReviewModalOpen = false;
  }

  async submitReview() {
    if (!this.newReview.comment.trim()) {
      this.showToast('Vui lòng nhập nội dung đánh giá.', 'warning');
      return;
    }

    this.isSubmittingReview = true;
    try {
      const res = await fetch(`${environment.apiUrl}/products/${this.productId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating: this.newReview.rating,
          comment: this.newReview.comment,
          reviewerName: this.newReview.reviewerName || 'Khách hàng',
          variantId: this.matchedVariant?.id,
          variantName: this.matchedVariant?.name
        })
      });

      if (res.ok) {
        const data = await res.json();
        this.showToast(data.message || 'Gửi đánh giá thành công!', 'success');
        this.isWriteReviewModalOpen = false;
        this.newReview = { rating: 5, reviewerName: '', comment: '' };
        this.loadReviews(1);
      } else {
        throw new Error('Gửi đánh giá thất bại');
      }
    } catch {
      this.showToast('Không thể gửi đánh giá. Vui lòng thử lại sau.', 'warning');
    } finally {
      this.isSubmittingReview = false;
      this.cdr.detectChanges();
    }
  }

  // --- SHOWROOM CONSULTATION MODAL ---
  openShowroomModal() {
    this.isShowroomModalOpen = true;
  }

  closeShowroomModal() {
    this.isShowroomModalOpen = false;
  }

  onConsultationSuccess(appointment: any) {
    this.showToast(
      `Đặt lịch thành công! Mã: ${appointment?.appointmentCode || 'DCOR-DL'}`,
      'success'
    );
  }

  // --- CUSTOM REQUEST MODAL ---
  openCustomModal() {
    this.isCustomModalOpen = true;
    this.customSuccess = false;
  }

  closeCustomModal() {
    this.isCustomModalOpen = false;
  }

  onCustomSubmitSuccess(requestData: any) {
    this.showToast('Yêu cầu chế tác độc bản đã được gửi thành công!', 'success');
  }

  submitCustom() {
    if (!this.customForm.fullName.trim() || !this.customForm.phone.trim()) {
      this.showToast('Vui lòng nhập đầy đủ họ tên và số điện thoại.', 'warning');
      return;
    }

    this.isSubmittingCustom = true;
    setTimeout(() => {
      this.isSubmittingCustom = false;
      this.customSuccess = true;
      this.showToast('Đã gửi yêu cầu thiết kế tùy chỉnh thành công! KTS sẽ liên hệ bạn sớm nhất.', 'success');
    }, 800);
  }

  // --- RELATED PRODUCTS (Ưu tiên danh mục phụ, bổ sung danh mục lớn, 1 hàng & xem thêm) ---
  isRelatedExpanded = false;
  readonly RELATED_ROW_SIZE = 4;

  get displayedRelatedProducts(): any[] {
    if (this.isRelatedExpanded) {
      return this.relatedProducts;
    }
    return this.relatedProducts.slice(0, this.RELATED_ROW_SIZE);
  }

  get remainingRelatedCount(): number {
    return Math.max(0, this.relatedProducts.length - this.RELATED_ROW_SIZE);
  }

  toggleRelatedExpansion() {
    this.isRelatedExpanded = !this.isRelatedExpanded;
    if (!this.isRelatedExpanded && typeof document !== 'undefined') {
      const el = document.getElementById('pdp-related-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
    this.cdr.detectChanges();
  }

  async loadRelatedProducts() {
    if (!this.product) return;
    this.isLoadingRelated = true;
    this.isRelatedExpanded = false;

    try {
      const res = await fetch(`${environment.apiUrl}/products`);
      if (res.ok) {
        const allProducts: any[] = await res.json();
        const currentId = this.product.id || this.productId;
        const currentNormalizedName = (this.product.name || '').trim().toLowerCase();

        // Loại bỏ chính sản phẩm hiện tại và bất kỳ sản phẩm nào trùng tên
        const candidateProducts = allProducts.filter((p: any) =>
          p.id !== currentId &&
          (p.name || '').trim().toLowerCase() !== currentNormalizedName
        );

        // Xác định ID danh mục phụ và ID danh mục chính (Parent Category) của sản phẩm hiện tại
        const currentSubId = this.product.categoryId || this.product.categoryObj?.id || this.product.category?.id;
        const currentParentId =
          this.product.categoryObj?.parent?.id ||
          this.product.categoryObj?.parentId ||
          this.product.category?.parent?.id ||
          this.product.category?.parentId ||
          (this.product.categoryObj && !this.product.categoryObj.parentId ? this.product.categoryObj.id : null);

        // 1. Nhóm ưu tiên cao nhất: Cùng danh mục phụ (Subcategory)
        const sameSubcategory: any[] = [];
        // 2. Nhóm bổ sung: Cùng danh mục lớn / danh mục chính (Parent Category), khác danh mục phụ
        const sameMainCategory: any[] = [];
        const seenNames = new Set<string>();

        candidateProducts.forEach(p => {
          const pSubId = p.categoryId || p.category?.id;
          const pParentId =
            p.category?.parent?.id ||
            p.category?.parentId ||
            (p.category && !p.category.parentId ? pSubId : null);

          // Kiểm tra xem sản phẩm có cùng danh mục lớn (Tables, Sofas, Chairs...) trong cơ sở dữ liệu hay không
          const isSameMajorCategory = Boolean(
            (currentParentId && pParentId && currentParentId === pParentId) ||
            (currentParentId && pSubId === currentParentId) ||
            (currentSubId && pParentId === currentSubId)
          );

          if (!isSameMajorCategory) return;

          // Loại bỏ trùng lặp nếu có 2 bản ghi cùng tên trong danh sách gợi ý
          const pNormName = (p.name || '').trim().toLowerCase();
          if (seenNames.has(pNormName)) return;
          seenNames.add(pNormName);

          if (currentSubId && pSubId === currentSubId) {
            sameSubcategory.push(p);
          } else {
            sameMainCategory.push(p);
          }
        });

        // Sắp xếp ưu tiên: Bán chạy (BestSeller) lên trước trong từng nhóm
        const sortFn = (a: any, b: any) => {
          if (a.isBestSeller && !b.isBestSeller) return -1;
          if (!a.isBestSeller && b.isBestSeller) return 1;
          return 0;
        };

        sameSubcategory.sort(sortFn);
        sameMainCategory.sort(sortFn);

        // Ghép danh sách: Ưu tiên cùng danh mục phụ trước, tiếp đến cùng danh mục lớn
        let combined = [...sameSubcategory, ...sameMainCategory];

        // Dự phòng (nếu danh mục quá ít sản phẩm, lấy thêm sản phẩm nổi bật cùng phong cách)
        if (combined.length === 0) {
          combined = candidateProducts.slice(0, 8);
        }

        this.relatedProducts = combined;
      }
    } catch (e) {
      console.error('Lỗi tải sản phẩm liên quan:', e);
    } finally {
      this.isLoadingRelated = false;
      this.cdr.detectChanges();
    }
  }

  // --- TAB NAVIGATION ---
  setActiveTab(tab: 'desc' | 'specs' | 'care' | 'policy' | 'reviews') {
    this.activeTab = tab;
  }

  scrollToReviews() {
    this.activeTab = 'reviews';
    const el = document.getElementById('pdp-tabs-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }

  // --- HELPERS ---
  getCategoryName(cat: any): string {
    if (!cat) return 'Nội thất';
    if (typeof cat === 'string') return cat;
    return cat.name || cat.slug || 'Nội thất';
  }

  getRelatedProductPrice(item: CatalogProduct): number {
    return (item as any).basePrice || item.prices?.[0]?.price || 0;
  }

  formatPrice(val: number): string {
    if (!val && val !== 0) return 'Liên hệ';
    return new Intl.NumberFormat('vi-VN').format(val) + '₫';
  }

  getStarDistributionPercent(star: number): number {
    if (!this.totalReviewsCount) return 0;
    const count = this.starDistribution[star] || 0;
    return Math.round((count / this.totalReviewsCount) * 100);
  }

  showToast(msg: string, type: 'success' | 'warning' | 'info' = 'success') {
    this.toastMessage = msg;
    this.toastType = type;
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.toastMessage = '';
      this.cdr.detectChanges();
    }, 3500);
    this.cdr.detectChanges();
  }
}
