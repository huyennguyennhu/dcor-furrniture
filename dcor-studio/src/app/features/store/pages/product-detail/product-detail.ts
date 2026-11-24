import { Component, OnInit, OnDestroy, ChangeDetectorRef, HostListener, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { finalize, TimeoutError, timeout, Subscription } from 'rxjs';
import { CatalogProduct, ProductCategory } from '../../../../shared/models/catalog.model';
import { IconComponent } from '../../../../shared/components/icon/icon';
import { CartService } from '../../../../core/services/cart.service';
import { WishlistService } from '../../../../core/services/wishlist.service';
import { ProductService } from '../../../../core/services/product.service';
import { PromotionService, formatDiscountBadgeText } from '../../../../core/services/promotion.service';
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
import { CustomRequestModalComponent } from '../../../../shared/components/custom-request-modal/custom-request-modal';
import { ShowroomConsultationModalComponent } from '../../../../shared/components/showroom-consultation-modal/showroom-consultation-modal';
import { CompareService } from '../../../../core/services/compare.service';

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
    CustomRequestModalComponent,
    ShowroomConsultationModalComponent
  ],
  templateUrl: './product-detail.html',
  styleUrls: ['./product-detail.css']
})
export class ProductDetailComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('thumbStrip') thumbStripRef?: ElementRef<HTMLDivElement>;
  canScrollThumbLeft = false;
  canScrollThumbRight = false;
  // Product state
  product: any = null;
  productId = '';
  isLoading = true;

  // Comparison State & Modal
  compareList: any[] = [];
  isCompareModalOpen = false;
  showClearCompareConfirmModal = false;
  private compareSub?: Subscription;

  // Active Tab: 'desc' | 'specs' | 'care' | 'policy' | 'reviews'
  activeTab: 'desc' | 'specs' | 'care' | 'policy' = 'desc';

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
  isHeroImageLoading = false;
  private preloadedUrls = new Set<string>();

  onHeroImageLoad() {
    this.isHeroImageLoading = false;
  }

  onHeroImageError() {
    this.isHeroImageLoading = false;
  }

  // Variants & Attributes
  attributeGroups: ProductAttributeGroup[] = [];
  selectedAttributes: Record<string, string> = {};
  matchedVariant: any = null;
  expandedAttributeGroups: Record<string, boolean> = {};
  readonly VISUAL_OPTIONS_LIMIT = 14; // 1 hàng tối đa 14 màu cho phần hình
  readonly DEFAULT_OPTIONS_LIMIT = 6;

  // Real data
  currentSku = '';
  currentPrice = 0;
  originalPrice: number | null = null;
  discountPercent = 0;
  discountBadgeText = '';
  discountSaveText = '';
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
  specsLegsHeight = '';
  specsSeatingHeight = '';
  specsArmrestHeight = '';

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
  private campaignSub?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private cartService: CartService,
    private wishlistService: WishlistService,
    private cdr: ChangeDetectorRef,
    private productService: ProductService,
    public compareService: CompareService,
    private promotionService: PromotionService
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

    // Khởi tạo và lắng nghe đồng bộ danh sách so sánh sản phẩm từ CompareService
    this.compareSub = this.compareService.compareList$.subscribe(list => {
      this.compareList = list || [];
      this.cdr.detectChanges();
    });

    this.campaignSub = this.promotionService.activeCampaigns$.subscribe(() => {
      if (this.product) {
        this.updateVariantData();
        this.cdr.detectChanges();
      }
    });
  }

  ngOnDestroy() {
    this.wishlistSub?.unsubscribe();
    this.compareSub?.unsubscribe();
    this.campaignSub?.unsubscribe();
    if (this.flashSaleInterval) clearInterval(this.flashSaleInterval);
    if (this.toastTimer) clearTimeout(this.toastTimer);
    if (this.copyTimer) clearTimeout(this.copyTimer);
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
    this.isHeroImageLoading = true;
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
      const data = await this.productService.getProductById(id);
      this.product = {
        ...data,
        allowCustom: !!(data.allowCustom ?? data.configOptions?.allowCustom),
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
        const rawOpts: AttributeOption[] = (attr.options || []).map((o: any) => {
          // Chỉ lấy hình ảnh khi bản thân option có ảnh swatch/texture thực sự từ DB
          // Tuyệt đối không lấy ảnh sản phẩm biến thể (v.images) gán vào option
          const isCleanImg = (url: any) => typeof url === 'string' && url.startsWith('http') && !url.includes('dsasf753c');
          const optImg = isCleanImg(o.image) ? o.image : (isCleanImg(o.imageUrl) ? o.imageUrl : null);
          return {
            id: String(o.id),
            name: o.name,
            image: optImg,
            hexColor: o.hexColor || this.detectColor(o.name)?.hex || null,
            groupName: o.groupName || null
          };
        });

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
                  hexColor: (partIdx === 0 && o.hexColor) ? o.hexColor : (this.detectColor(partVal)?.hex || null),
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
              hexColor: o.hexColor || this.detectColor(o.name)?.hex || null
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
                hexColor: this.detectColor(val)?.hex || null
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
          const matchedOpt = group.options.find(o => this.isVariantMatchOption(inStockVariant, group, o))
            || group.options.find(o => vNameLower.includes(o.name.toLowerCase()));
          this.selectedAttributes[group.groupId] = matchedOpt ? matchedOpt.id : (group.options[0]?.id || '');
        }
      }
    }

    this.updateVariantData();
    this.preloadVariantImages();
  }

  isVariantMatchOption(v: any, group: ProductAttributeGroup, opt: AttributeOption): boolean {
    if (!v || !opt) return false;
    const optIdLower = (opt.id || '').toLowerCase();
    const optNameLower = (opt.name || '').toLowerCase();
    const vNameLower = (v.name || '').toLowerCase();
    const vSkuLower = (v.sku || '').toLowerCase();
    const groupId = group.groupId;

    // 1. Kiểm tra trực tiếp trong optionValues theo groupId
    const optVal = v.optionValues?.[groupId];
    if (optVal !== undefined && optVal !== null) {
      const optValStr = String(optVal).toLowerCase();
      if (optValStr === optIdLower || optValStr === optNameLower) return true;
    }

    // 1b. Nếu là sub-group (_sub_0, _sub_1), kiểm tra parent groupId
    const parentGroupId = groupId.replace(/_sub_\d+$/, '');
    const parentOptVal = v.optionValues?.[parentGroupId];
    if (parentOptVal !== undefined && parentOptVal !== null) {
      const pStr = String(parentOptVal).toLowerCase();
      if (pStr === optIdLower || pStr === optNameLower) return true;
    }

    // 2. Kiểm tra trong optionValues.attributes
    const nestedVal = v.optionValues?.attributes?.[groupId] || v.optionValues?.attributes?.[parentGroupId];
    if (nestedVal !== undefined && nestedVal !== null) {
      const nestedStr = String(nestedVal).toLowerCase();
      if (nestedStr === optIdLower || nestedStr === optNameLower) return true;
    }

    // 3. Khớp theo tên biến thể (v.name chứa opt.name hoặc ngược lại)
    if (optNameLower && (vNameLower.includes(optNameLower) || optNameLower.includes(vNameLower))) {
      return true;
    }

    // 4. Khớp theo các phần của tên biến thể (nếu có chia dấu /)
    const vParts = this.parseVariantToParts(v.name || '');
    if (vParts.some(p => p.toLowerCase() === optNameLower || p.toLowerCase() === optIdLower)) {
      return true;
    }

    // 5. Khớp theo SKU (nếu mã optionId nằm trong SKU của biến thể)
    if (optIdLower && optIdLower.length >= 3 && vSkuLower.includes(optIdLower)) {
      return true;
    }

    // 6. Khớp trong optionValues (color, size, material)
    if (v.optionValues) {
      for (const key of ['color', 'size', 'material', 'finish']) {
        const val = v.optionValues[key];
        if (typeof val === 'string' && val.trim() && val !== 'Tiêu chuẩn' && val !== 'Mặc định') {
          const valLower = val.toLowerCase();
          if (valLower === optIdLower || valLower === optNameLower || optNameLower.includes(valLower)) {
            return true;
          }
        }
      }
    }

    return false;
  }

  // Kiểm tra xem một option có biến thể nào khả dụng hay không
  isOptionAvailable(group: ProductAttributeGroup, opt: AttributeOption): boolean {
    if (!this.product?.variants || this.product.variants.length === 0) return true;

    // Tìm các biến thể khớp với option này
    const matchingVariants = this.product.variants.filter((v: any) => this.isVariantMatchOption(v, group, opt));

    // Nếu sản phẩm không hề có biến thể nào ứng với option này (ví dụ thuộc danh mục vải mẫu BoConcept chung nhưng shop không nhập), ẩn đi
    if (matchingVariants.length === 0) return false;

    // Kiểm tra xem có biến thể khớp nào còn tồn kho khả dụng (> 0)
    const hasInStock = matchingVariants.some((v: any) => {
      const availStock = (v.stock ?? 0) - (v.reservedStock ?? 0);
      return availStock > 0 && v.isActive !== false;
    });
    if (hasInStock) return true;

    // Nếu toàn bộ nhóm hoặc toàn bộ sản phẩm đều hết hàng, vẫn giữ lại các tùy chọn để khách xem và chọn mẫu
    const hasAnyInStockInGroup = group.options.some(otherOpt => {
      return this.product.variants.some((v: any) =>
        this.isVariantMatchOption(v, group, otherOpt) &&
        ((v.stock ?? 0) - (v.reservedStock ?? 0)) > 0 &&
        v.isActive !== false
      );
    });
    if (!hasAnyInStockInGroup) {
      return true;
    }

    return false;
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

      for (const group of this.attributeGroups) {
        const selValId = this.selectedAttributes[group.groupId];
        if (!selValId) continue;

        const selectedOpt = group.options.find(o => o.id === selValId);
        if (selectedOpt && this.isVariantMatchOption(v, group, selectedOpt)) {
          score += 10;
        } else {
          const optVal = v.optionValues?.[group.groupId];
          if (optVal !== undefined && String(optVal) === selValId) {
            score += 10;
          }
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
    this.preloadVariantImages();
  }

  private updateVariantData() {
    const prod = this.product;
    const v = this.matchedVariant || prod?.variants?.[0];

    // SKU
    this.currentSku = v?.sku || prod?.slug || 'DCOR-PREMIUM';

    // Pricing & Discount: Kiểm tra chiến dịch khuyến mãi hoặc trường discountValue
    const basePrice = v?.price || prod?.basePrice || prod?.prices?.[0]?.price || 0;
    const campDisc = this.promotionService.getDiscountForProduct(prod || { id: this.productId, name: this.product?.name || '', basePrice });

    if (campDisc) {
      this.hasFlashSale = true;
      this.discountPercent = campDisc.discountPercent;
      this.discountBadgeText = campDisc.badgeText;
      this.discountSaveText = campDisc.badgeText.replace(/^-/, '');
      this.currentPrice = campDisc.salePrice;
      this.originalPrice = campDisc.originalPrice || basePrice;
    } else {
      this.hasFlashSale = Boolean(prod?.discountValue && prod.discountValue > 0);

      if (this.hasFlashSale) {
        if (prod.discountType === 'PERCENT') {
          this.discountPercent = prod.discountValue;
          this.discountBadgeText = formatDiscountBadgeText('PERCENT', prod.discountValue);
          this.discountSaveText = this.discountBadgeText.replace(/^-/, '');
          this.currentPrice = prod.salePrice || Math.round(basePrice * (1 - prod.discountValue / 100));
          this.originalPrice = prod.originalPrice || basePrice;
        } else if (prod.discountType === 'AMOUNT' || prod.discountType === 'FIXED' || prod.discountType === 'FIXED_AMOUNT') {
          this.currentPrice = prod.salePrice || Math.max(0, basePrice - prod.discountValue);
          this.originalPrice = prod.originalPrice || basePrice;
          this.discountPercent = basePrice > 0 ? Math.round((prod.discountValue / basePrice) * 100) : 0;
          this.discountBadgeText = formatDiscountBadgeText('AMOUNT', prod.discountValue);
          this.discountSaveText = this.discountBadgeText.replace(/^-/, '');
        } else {
          // Fallback percentage
          this.discountPercent = prod.discountValue;
          this.discountBadgeText = formatDiscountBadgeText('PERCENT', prod.discountValue);
          this.discountSaveText = this.discountBadgeText.replace(/^-/, '');
          this.currentPrice = prod.salePrice || Math.round(basePrice * (1 - prod.discountValue / 100));
          this.originalPrice = prod.originalPrice || basePrice;
        }
      } else {
        this.currentPrice = basePrice;
        this.originalPrice = null;
        this.discountPercent = 0;
        this.discountBadgeText = '';
        this.discountSaveText = '';
      }
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
    this.isHeroImageLoading = true;
    setTimeout(() => this.updateThumbScrollState(), 100);

    // Technical Specs
    const attrs = v?.attributes || v?.optionValues?.attributes || {};
    const dims = v?.dimensions || v?.optionValues?.dimensions || {};

    this.specsWidth = attrs.width || (dims.width ? `${dims.width} cm` : '');
    this.specsDepth = attrs.depth || (dims.depth ? `${dims.depth} cm` : '');
    this.specsHeight = attrs.height || (dims.height ? `${dims.height} cm` : '');
    this.specsWeight = attrs.weight || (dims.weight ? `${dims.weight} kg` : '');
    this.specsDiameter = attrs.diameter ? (attrs.diameter.includes('cm') ? attrs.diameter : `${attrs.diameter} cm`) : '';
    this.specsLegsHeight = attrs.legsHeight || (attrs.legHeight ? (attrs.legHeight.includes('cm') ? attrs.legHeight : `${attrs.legHeight} cm`) : '');
    this.specsSeatingHeight = attrs.seatingHeight || '';
    this.specsArmrestHeight = attrs.armrestHeight || '';
    this.specsWeightLoad = attrs.weightLoad || '120 kg';
    this.specsFinish = attrs.finish_vi || attrs.finish || prod?.description || 'Vật liệu tiêu chuẩn DCOR';
    this.specsDesignedBy = attrs.designedBy || 'BoConcept Design Team (Đan Mạch)';

    const dimParts: string[] = [];
    if (this.specsDiameter) dimParts.push(`Đường kính: ${this.specsDiameter}`);
    if (this.specsWidth) dimParts.push(`Rộng: ${this.specsWidth}`);
    if (this.specsDepth) dimParts.push(`Sâu: ${this.specsDepth}`);
    if (this.specsHeight) dimParts.push(`Cao: ${this.specsHeight}`);
    if (this.specsLegsHeight) dimParts.push(`Chiều cao chân: ${this.specsLegsHeight}`);
    if (this.specsWeight) dimParts.push(`Trọng lượng: ${this.specsWeight}`);
    this.dimensionsText = dimParts.join(' • ');

    this.cdr.detectChanges();
  }

  optimizeImageUrl(url: string, width = 800): string {
    if (!url || typeof url !== 'string' || !url.startsWith('http')) return url;
    if (url.includes('cloudinary.com')) {
      if (url.includes('/image/fetch/') && !url.includes('w_')) {
        return url.replace('/image/fetch/', `/image/fetch/w_${width},c_limit,f_auto,q_auto:good/`);
      }
      if (url.includes('/image/upload/') && !url.includes('w_')) {
        return url.replace('/image/upload/', `/image/upload/w_${width},c_limit,f_auto,q_auto:good/`);
      }
    }
    return url;
  }

  getThumbUrl(url: string): string {
    if (!url || typeof url !== 'string') return url;
    if (url.includes('/image/fetch/')) {
      return url.replace(/\/image\/fetch\/([^/]+\/)?/, '/image/fetch/w_160,h_160,c_fill,f_auto,q_auto:good/');
    }
    if (url.includes('/image/upload/')) {
      return url.replace(/\/image\/upload\/([^/]+\/)?/, '/image/upload/w_160,h_160,c_fill,f_auto,q_auto:good/');
    }
    return url;
  }

  private extractImages(prod: any, variant: any): string[] {
    const list: string[] = [];
    const isClean = (u: any) => typeof u === 'string' && u.startsWith('http') && !u.includes('dsasf753c');

    // 1. Ảnh từ variant hiện tại
    const vImgs = variant?.images || variant?.optionValues?.images || [];
    if (Array.isArray(vImgs)) {
      vImgs.filter(isClean).forEach(img => {
        const opt = this.optimizeImageUrl(img, 800);
        if (!list.includes(opt)) list.push(opt);
      });
    }

    // 2. Ảnh từ product
    const pImgs = Array.isArray(prod?.images) ? prod.images : [];
    pImgs.filter(isClean).forEach((img: string) => {
      const opt = this.optimizeImageUrl(img, 800);
      if (!list.includes(opt)) list.push(opt);
    });

    return list.length > 0 ? list : ['/assets/img/furniture-placeholder.svg'];
  }

  // Nhận diện loại nhóm thuộc tính để hiển thị phù hợp
  isColorGroup(group: ProductAttributeGroup): boolean {
    const gLower = (group.groupId || '').toLowerCase();
    const lLower = (group.label || '').toLowerCase();
    return gLower.includes('colour') || gLower.includes('color') || lLower.includes('màu');
  }

  isSizeGroup(group: ProductAttributeGroup): boolean {
    const gLower = (group.groupId || '').toLowerCase();
    const lLower = (group.label || '').toLowerCase();
    if (gLower.includes('size') || gLower.includes('dimension') || gLower.includes('height') ||
      lLower.includes('kích thước') || lLower.includes('size') || lLower.includes('chiều cao')) {
      return true;
    }
    // Nếu tất cả các options trong nhóm này đều là dạng số đo kích cỡ (VD: 17cm, H45xØ38cm, W170xL240cm, Ø230cm)
    if (group.options?.length > 0 && group.options.every(o => /^(H\d|W\d|L\d|D\d|Ø\d|\d+(\.\d+)?\s*(cm|mm|m)|[0-9½¼¾\.\s\/xX]+$)/i.test(o.name.trim()))) {
      return true;
    }
    return false;
  }

  isMaterialGroup(group: ProductAttributeGroup): boolean {
    const gLower = (group.groupId || '').toLowerCase();
    const lLower = (group.label || '').toLowerCase();
    return gLower.includes('material') || gLower.includes('upholstery') || lLower.includes('chất liệu') || lLower.includes('vải');
  }

  isVisualGroup(group: ProductAttributeGroup): boolean {
    // 1. Nhóm kích thước / số đo thì luôn hiển thị nút chữ rõ ràng có số liệu, không dùng swatch tròn
    if (this.isSizeGroup(group)) return false;

    // 2. Nếu nhóm có hình ảnh swatch texture thực tế từ nhà sản xuất (như vải bọc, da bọc o.image)
    if (group.options?.some(o => !!o.image)) return true;

    // 3. Nếu là nhóm màu sắc và có màu sắc hex hợp lệ
    if (this.isColorGroup(group) && group.options?.some(o => !!o.hexColor)) return true;

    // 4. Mọi trường hợp còn lại không có hình (như chân ghế, mặt bàn không ảnh, hướng ghế, chức năng...)
    // thì để bình thường dạng nút bấm có chữ đàng hoàng, không chèn ảnh hay ép thành ô swatch tròn
    return false;
  }

  formatOptionDisplayName(name: string, group?: ProductAttributeGroup): string {
    if (!name) return '';
    let str = name.trim();

    const isSize = group ? this.isSizeGroup(group) : false;

    // 1. Nếu là số thuần trong nhóm kích thước hoặc chân/độ cao, thêm đơn vị "cm"
    if (/^\d+(\.\d+)?$/.test(str) && isSize) {
      return `${str} cm`;
    }

    // 2. Chuẩn hóa khoảng trắng trước các đơn vị đo lường: 15cm -> 15 cm, 17cm -> 17 cm, 9,5cm -> 9,5 cm
    str = str.replace(/(\d+(?:[½¼¾]|\/\d+)?)\s*(cm|mm|m)\b/gi, '$1 $2');

    // 3. Chuẩn hóa ký tự nhân kích thước x thành × với khoảng cách đẹp: H45xØ38cm -> H45 × Ø38 cm
    str = str.replace(/([a-zA-Z0-9½¼¾]+)\s*[xX]\s*([a-zA-Z0-9½¼¾Øø]+)/g, '$1 × $2');
    str = str.replace(/([a-zA-Z0-9½¼¾]+)\s*[xX]\s*([a-zA-Z0-9½¼¾Øø]+)/g, '$1 × $2');

    // 4. Chuẩn hóa ký hiệu đường kính Ø: Ø230cm -> Ø230 cm
    str = str.replace(/[Øø]\s*(\d+)/g, 'Ø$1');

    return str;
  }

  preloadVariantImages() {
    const rawVariants: any[] = Array.isArray(this.product?.variants) ? this.product.variants : [];
    if (rawVariants.length === 0) return;

    const runPreload = () => {
      rawVariants.forEach((v: any) => {
        const imgs = v?.images || v?.optionValues?.images || [];
        if (Array.isArray(imgs) && imgs.length > 0) {
          const firstImg = this.optimizeImageUrl(imgs[0], 800);
          if (firstImg && typeof firstImg === 'string' && !this.preloadedUrls.has(firstImg)) {
            this.preloadedUrls.add(firstImg);
            const img = new Image();
            img.src = firstImg;
          }
        }
      });
    };

    if (typeof window !== 'undefined') {
      if ('requestIdleCallback' in window) {
        (window as any).requestIdleCallback(runPreload, { timeout: 1500 });
      } else {
        setTimeout(runPreload, 200);
      }
    }
  }

  hoveredOption: Record<string, string | null> = {};

  onOptionMouseEnter(groupId: string, name: string) {
    this.hoveredOption[groupId] = name;
    const group = this.attributeGroups.find(g => g.groupId === groupId);
    if (group && this.product?.variants) {
      const opt = group.options.find(o => o.name === name);
      if (opt) {
        const matched = this.product.variants.find((v: any) => this.isVariantMatchOption(v, group, opt));
        const imgs = matched?.images || matched?.optionValues?.images || [];
        if (Array.isArray(imgs) && imgs[0]) {
          const url = this.optimizeImageUrl(imgs[0], 800);
          if (!this.preloadedUrls.has(url)) {
            this.preloadedUrls.add(url);
            const img = new Image();
            img.src = url;
          }
        }
      }
    }
  }

  onOptionMouseLeave(groupId: string) {
    this.hoveredOption[groupId] = null;
  }

  getHoveredOrSelectedName(group: ProductAttributeGroup): string {
    const raw = this.hoveredOption[group.groupId] || this.getSelectedOptionName(group);
    return this.formatOptionDisplayName(raw, group);
  }

  isBrightColor(opt: AttributeOption): boolean {
    if (opt.image) return false;
    const hex = (opt.hexColor || this.detectColor(opt.name)?.hex || '').toLowerCase();
    return hex === '#ffffff' || hex === '#f3f4f6' || hex === '#f8f8f8' || hex === '#d8c8b8';
  }

  getSwatchBgColor(opt: AttributeOption): string {
    if (opt.image) {
      return '#8B5A2B';
    }
    const color = opt.hexColor || this.detectColor(opt.name)?.hex;
    if (!color || color.toLowerCase() === 'red') {
      return '#8B5A2B';
    }
    return color;
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
    return group.options.filter(opt => this.isOptionAvailable(group, opt));
  }

  getGroupOptionsLimit(group: ProductAttributeGroup): number {
    return this.isVisualGroup(group) ? this.VISUAL_OPTIONS_LIMIT : this.DEFAULT_OPTIONS_LIMIT;
  }

  shouldShowToggle(group: ProductAttributeGroup): boolean {
    const limit = this.getGroupOptionsLimit(group);
    return this.getAvailableOptions(group).length > limit;
  }

  getVisibleOptions(group: ProductAttributeGroup): AttributeOption[] {
    const available = this.getAvailableOptions(group);
    const limit = this.getGroupOptionsLimit(group);
    if (this.isGroupExpanded(group.groupId) || available.length <= limit) {
      return available;
    }

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
    const limit = this.getGroupOptionsLimit(group);
    return Math.max(0, available.length - limit);
  }

  getSelectedOptionName(group: ProductAttributeGroup): string {
    const selId = this.selectedAttributes[group.groupId];
    if (!selId) return '';
    const opt = group.options?.find(o => o.id === selId);
    return opt ? opt.name : '';
  }

  detectColor(text: string): { name: string; hex: string } | null {
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
    return null;
  }

  @HostListener('window:resize')
  onResize() {
    this.updateThumbScrollState();
  }

  ngAfterViewInit() {
    setTimeout(() => this.updateThumbScrollState(), 300);
  }

  // --- GALLERY INTERACTIONS & LIGHTBOX ---
  selectGalleryImage(idx: number) {
    if (this.activeImageIndex !== idx) {
      this.isHeroImageLoading = true;
      this.activeImageIndex = idx;
      this.isMagnifierActive = false;
      this.scrollActiveThumbIntoView();
    }
  }

  prevGalleryImage() {
    if (this.galleryImages.length <= 1) return;
    this.isHeroImageLoading = true;
    this.activeImageIndex = (this.activeImageIndex - 1 + this.galleryImages.length) % this.galleryImages.length;
    this.isMagnifierActive = false;
    this.scrollActiveThumbIntoView();
  }

  nextGalleryImage() {
    if (this.galleryImages.length <= 1) return;
    this.isHeroImageLoading = true;
    this.activeImageIndex = (this.activeImageIndex + 1) % this.galleryImages.length;
    this.isMagnifierActive = false;
    this.scrollActiveThumbIntoView();
  }

  scrollThumbs(direction: 'left' | 'right') {
    const el = this.thumbStripRef?.nativeElement;
    if (!el) return;
    const scrollAmount = 240;
    el.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
    setTimeout(() => this.updateThumbScrollState(), 320);
  }

  onThumbScroll() {
    this.updateThumbScrollState();
  }

  updateThumbScrollState() {
    const el = this.thumbStripRef?.nativeElement;
    if (!el) {
      this.canScrollThumbLeft = false;
      this.canScrollThumbRight = false;
      return;
    }
    this.canScrollThumbLeft = el.scrollLeft > 4;
    this.canScrollThumbRight = el.scrollLeft + el.clientWidth < el.scrollWidth - 6;
    this.cdr.detectChanges();
  }

  scrollActiveThumbIntoView() {
    const el = this.thumbStripRef?.nativeElement;
    if (!el) return;
    const activeItem = el.children[this.activeImageIndex] as HTMLElement;
    if (activeItem) {
      activeItem.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    }
    setTimeout(() => this.updateThumbScrollState(), 320);
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
              } catch (e) { }
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
    return this.compareService.isInCompare(this.product.id || this.product.productId);
  }

  get isCompareDisabled(): boolean {
    if (!this.product) return false;
    return this.compareService.isCompareDisabled(this.product);
  }

  get compareTooltip(): string {
    if (this.isCompared) return 'Bỏ so sánh';
    if (this.isCompareDisabled) {
      if (this.compareList.length > 0) {
        return `Chỉ so sánh các sản phẩm cùng danh mục chính (${this.getRootCategoryName(this.compareList[0])})`;
      }
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
    this.compareService.toggle(this.product);
  }

  loadCompareList() {
    this.compareList = this.compareService.currentList;
    this.cdr.detectChanges();
  }

  openCompareModal() {
    this.compareService.openModal();
  }

  closeCompareModal() {
    this.compareService.closeModal();
  }

  removeCompare(productId: string) {
    this.compareService.remove(productId);
  }

  confirmClearAllCompare() {
    this.compareService.openConfirmClear();
  }

  cancelClearAllCompare() {
    this.compareService.closeConfirmClear();
  }

  executeClearAllCompare() {
    this.compareService.clear();
  }

  clearAllCompare() {
    this.compareService.clear();
  }

  copyCompareShareLink() {
    this.compareService.copyShareLink();
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

  get isCustomAllowed(): boolean {
    if (!this.product) return false;
    return !!(this.product.allowCustom ?? this.product.configOptions?.allowCustom);
  }

  // --- CUSTOM REQUEST MODAL ---
  openCustomModal() {
    if (!this.isCustomAllowed) {
      this.showToast('Sản phẩm này hiện không hỗ trợ tùy chỉnh thiết kế riêng.', 'warning');
      return;
    }
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
      const allProducts: any[] = await this.productService.getProducts();
      if (Array.isArray(allProducts)) {
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
  setActiveTab(tab: 'desc' | 'specs' | 'care' | 'policy') {
    this.activeTab = tab;
  }

  scrollToReviews() {
    const el = document.getElementById('pdp-reviews-section');
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
