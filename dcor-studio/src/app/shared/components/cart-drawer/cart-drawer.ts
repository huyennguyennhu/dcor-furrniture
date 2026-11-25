import { Component, EventEmitter, Input, Output, OnInit, OnChanges, SimpleChanges, OnDestroy, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { CartService, CartItem } from '../../../core/services/cart.service';
import { PromotionService, Promotion, AppliedPromotion, formatDiscountBadgeText } from '../../../core/services/promotion.service';
import { WishlistService } from '../../../core/services/wishlist.service';
import { applyImageErrorFallback, resolveNextImageFallback, PLACEHOLDER_PRODUCT_IMAGE } from '../../utils/image-fallback.util';
import { Subscription } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { 
  LucideAngularModule, 
  Trash2, 
  X, 
  AlertCircle, 
  AlertTriangle, 
  CheckCircle2, 
  Check, 
  ShoppingBag, 
  ChevronDown, 
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  ArrowRight, 
  Tag, 
  Undo2,
  Sparkles,
  Truck,
  Pencil,
  Heart,
  Star,
  Layers
} from 'lucide-angular';


export interface VariantAttributeOption {
  id: string;
  name: string;
  groupName?: string | null;
  image?: string | null;
  hexColor?: string | null;
}

export interface VariantAttributeGroup {
  groupId: string;
  label: string;
  options: VariantAttributeOption[];
}

export interface VariantSingleFixedAttribute {
  groupId: string;
  label: string;
  value: string;
}

const GROUP_LABEL_MAP: Record<string, string> = {
  vaConfigurationSize: 'Kích thước',
  vaSize: 'Kích thước',
  vaMaterialUpholstery: 'Chất liệu vải bọc',
  vaMaterial: 'Chất liệu / Màu hoàn thiện',
  vaColour: 'Màu sắc',
  vaColor: 'Màu sắc',
  vaMaterialLeg: 'Chất liệu chân',
  vaMaterialLegStyle: 'Kiểu dáng chân',
  vaMaterialSeat: 'Chất liệu mặt ngồi',
  vaMaterialTabletop: 'Chất liệu mặt bàn',
  vaSofaDirection: 'Hướng góc sofa',
  vaRugShape: 'Kiểu dáng thảm',
  vaFunction: 'Chức năng',
  vaMaterialLamp: 'Chất liệu đèn',
  vaMaterialShell: 'Chất liệu vỏ / Khung',
  vaMaterialCabinet: 'Chất liệu tủ',
  vaMattressSize: 'Kích thước nệm',
  vaFinish: 'Bề mặt hoàn thiện'
};

@Component({
  selector: 'app-cart-drawer',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LucideAngularModule],
  templateUrl: './cart-drawer.html',
  styleUrl: './cart-drawer.css'
})
export class CartDrawerComponent implements OnInit, OnChanges, OnDestroy {
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();

  // Lucide Icons (Nguồn chuẩn https://lucide.dev/icons/)
  icons = {
    Trash2,
    X,
    AlertCircle,
    AlertTriangle,
    CheckCircle2,
    Check,
    ShoppingBag,
    ChevronDown,
    ChevronUp,
    ChevronLeft,
    ChevronRight,
    ArrowRight,
    Tag,
    Undo2,
    Sparkles,
    Truck,
    Pencil,
    Heart,
    Star,
    Layers
  };

  // Cache biến thể sản phẩm theo productId để tải nhanh tức thì
  private static productVariantsCache = new Map<string, any>();

  cartItems: CartItem[] = [];
  isLoading = false;
  selectedItemIds: Set<string> = new Set();

  // Khuyến mãi / Vouchers từ hệ thống thực tế (đồng bộ qua PromotionService)
  systemPromotions: Promotion[] = [];
  appliedProductVoucher: AppliedPromotion | null = null;
  appliedFreeshipVoucher: AppliedPromotion | null = null;
  voucherActiveTab: 'product' | 'freeship' = 'product';
  showAllProductVouchers = false;
  manuallyRemovedProduct = false;
  manuallyRemovedFreeship = false;
  selectedVoucherCode = '';
  customVoucherInput = '';
  showCustomInput = false;
  voucherError = '';

  get appliedVoucher(): AppliedPromotion | null {
    return this.appliedProductVoucher;
  }

  get hasAnyAppliedVoucher(): boolean {
    return !!this.appliedProductVoucher || !!this.appliedFreeshipVoucher;
  }

  // Confirm delete single item modal
  isConfirmDeleteOpen = false;
  itemToDelete: CartItem | null = null;

  // Confirm batch delete modal
  isBatchDeleteModalOpen = false;
  isOutOfStockModalOpen = false;
  outOfStockItems: CartItem[] = [];

  // Variant Switcher Drawer (Mở sidebar bên cạnh - Dropdown chuẩn Xem Nhanh)
  isVariantDrawerOpen = false;
  editingCartItem: CartItem | null = null;
  productForVariantEdit: any = null;
  isLoadingProductVariants = false;
  selectedVariantId: string | null = null;
  currentVariantImageIdx = 0;
  variantErrorMessage: string | null = null;

  // Dropdown ma trận thuộc tính chuẩn tab Xem Nhanh trong Sidebar
  variantAttributeGroups: VariantAttributeGroup[] = [];
  variantSingleFixedAttributes: VariantSingleFixedAttribute[] = [];
  selectedVariantAttributes: Record<string, string> = {};
  openVariantDropdownGroupId: string | null = null;
  isSingleVariantDropdownOpen = false;

  // Dữ liệu hiển thị chuẩn Quick View trong Sidebar Chỉnh sửa biến thể
  variantGalleryImages: string[] = [];
  isEditingProductWishlisted = false;
  editingQuantity = 1;
  editingMaxStock = 0;
  editingSafetyThreshold = 5;
  variantRealMaterial = '';
  variantRealDimensions = '';
  variantSpecsWeightLoad = '';
  variantSpecsMaterials = '';
  variantSpecsDesignedBy = '';
  variantSpecsPolicy = 'Bảo hành 10 năm kết cấu, Đổi trả 30 ngày';

  // Floating tooltip hiện đầy đủ thuộc tính khi bị tràn (...)
  hoveredVariantTooltip: { text: string; top: number; left: number; placement: 'top' | 'bottom' } | null = null;

  // Voucher Switcher Drawer / Panel (Mở song song bên cạnh giỏ hàng)
  isVoucherDrawerOpen = false;

  // Toast notifications
  toastMessage: string | null = null;
  toastType: 'success' | 'warning' | 'error' = 'success';
  private toastTimer: any = null;

  private sub: Subscription = new Subscription();

  constructor(
    private router: Router,
    private cartService: CartService,
    private promotionService: PromotionService,
    private wishlistService: WishlistService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['isOpen']?.currentValue === true) {
      // Tải lại giỏ hàng để luôn hiển thị sản phẩm mới nhất
      this.cartService.loadCart().subscribe(() => {
        this.syncPromotionsWithSubTotal();
      });
      // Khi người dùng ấn vào giỏ hàng: nạp khuyến mãi và tự động áp mã tốt nhất ngay lập tức!
      this.promotionService.loadPromotions().subscribe(() => {
        this.syncPromotionsWithSubTotal();
      });
      this.syncPromotionsWithSubTotal();
    }
  }

  // Đồng bộ kiểm tra điều kiện khuyến mãi & tự động áp mã có số tiền giảm cao nhất
  syncPromotionsWithSubTotal() {
    const total = this.subTotal;
    this.promotionService.recalculate(total);
    if (total > 0) {
      this.promotionService.autoApplyBestPromotions(
        total,
        false,
        this.manuallyRemovedProduct,
        this.manuallyRemovedFreeship
      );
    } else {
      this.promotionService.removeAppliedPromotion();
      this.promotionService.removeAppliedFreeship();
    }
    this.cdr.detectChanges();
  }

  ngOnInit() {
    this.sub.add(
      this.cartService.cart$.subscribe(items => {
        this.cartItems = items;

        const allIds = new Set(items.map(item => item.id));

        if (this.selectedItemIds.size === 0) {
          // Mặc định chọn tất cả item lần đầu
          this.selectedItemIds = allIds;
        } else {
          // Lọc bỏ những item không còn tồn tại trong giỏ
          const newSelected = new Set<string>();
          this.selectedItemIds.forEach(id => {
            if (allIds.has(id)) {
              newSelected.add(id);
            }
          });
          this.selectedItemIds = newSelected;
        }

        // Đồng bộ tính lại giá trị giảm giá khi sản phẩm trong giỏ thay đổi
        this.syncPromotionsWithSubTotal();
      })
    );

    // Đồng bộ danh sách khuyến mãi thực tế từ hệ thống
    this.sub.add(
      this.promotionService.promotions$.subscribe(promos => {
        this.systemPromotions = promos;
        this.syncPromotionsWithSubTotal();
      })
    );

    // Đồng bộ mã giảm giá sản phẩm
    this.sub.add(
      this.promotionService.appliedPromotion$.subscribe(applied => {
        this.appliedProductVoucher = applied;
        this.cdr.detectChanges();
      })
    );

    // Đồng bộ mã miễn phí vận chuyển (Freeship)
    this.sub.add(
      this.promotionService.appliedFreeship$.subscribe(freeship => {
        this.appliedFreeshipVoucher = freeship;
        this.cdr.detectChanges();
      })
    );

    this.sub.add(
      this.cartService.isLoading$.subscribe(loading => {
        this.isLoading = loading;
        this.cdr.detectChanges();
      })
    );

    this.sub.add(
      this.wishlistService.wishlist$.subscribe(() => {
        this.checkEditingWishlist();
        this.cdr.detectChanges();
      })
    );

    this.cartService.loadCart().subscribe({
      error: () => {}
    });
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }
  }

  // --- Logic Selection ---
  get selectableItems(): CartItem[] {
    return this.cartItems;
  }

  get isAllSelected(): boolean {
    return this.cartItems.length > 0 && this.cartItems.every(i => this.selectedItemIds.has(i.id));
  }

  get selectedItems(): CartItem[] {
    return this.cartItems.filter(item => this.selectedItemIds.has(item.id));
  }

  get selectedValidItems(): CartItem[] {
    return this.selectedItems;
  }

  get selectedCount(): number {
    return this.selectedItemIds.size;
  }

  toggleSelectAll() {
    if (this.isAllSelected) {
      this.selectedItemIds.clear();
    } else {
      this.selectedItemIds.clear();
      this.cartItems.forEach(i => this.selectedItemIds.add(i.id));
    }
    this.syncPromotionsWithSubTotal();
  }

  toggleSelectItem(item: CartItem) {
    if (this.selectedItemIds.has(item.id)) {
      this.selectedItemIds.delete(item.id);
    } else {
      this.selectedItemIds.add(item.id);
    }
    this.syncPromotionsWithSubTotal();
  }

  isItemSelected(item: CartItem): boolean {
    return this.selectedItemIds.has(item.id);
  }

  // --- Tính toán Tạm tính, Khuyến mãi & Tổng cộng ---
  get subTotal(): number {
    return this.selectedValidItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }

  get productPromotions(): Promotion[] {
    return this.systemPromotions.filter(p => !p.isFreeShip && !p.code.startsWith('FREESHIP'));
  }

  get displayedProductPromotions(): Promotion[] {
    return this.showAllProductVouchers ? this.productPromotions : this.productPromotions.slice(0, 3);
  }

  get hasMoreProductPromotions(): boolean {
    return this.productPromotions.length > 3;
  }

  get freeshipPromotions(): Promotion[] {
    return this.systemPromotions.filter(p => !!p.isFreeShip || p.code.startsWith('FREESHIP'));
  }

  get eligibleProductPromotionsCount(): number {
    return this.productPromotions.filter(p => this.isVoucherEligible(p)).length;
  }

  get eligibleFreeshipPromotionsCount(): number {
    return this.freeshipPromotions.filter(p => this.isVoucherEligible(p)).length;
  }

  get totalEligibleVouchersCount(): number {
    return this.eligibleProductPromotionsCount + this.eligibleFreeshipPromotionsCount;
  }

  get eligibleVouchers(): Promotion[] {
    return this.promotionService.getEligiblePromotions(this.subTotal);
  }

  get discountAmount(): number {
    return this.appliedProductVoucher ? this.appliedProductVoucher.calculatedDiscount : 0;
  }

  get freeshipDiscountAmount(): number {
    return this.appliedFreeshipVoucher ? this.appliedFreeshipVoucher.calculatedDiscount : 0;
  }

  get shippingFee(): number {
    if (this.subTotal === 0) return 0;
    if (this.subTotal >= 50000000) return 0;
    const baseFee = 250000;
    if (this.appliedFreeshipVoucher) {
      return Math.max(0, baseFee - (this.appliedFreeshipVoucher.calculatedDiscount || baseFee));
    }
    return baseFee;
  }

  get productSaleSavings(): number {
    return this.selectedValidItems.reduce((sum, item) => {
      if (item.originalPrice && item.originalPrice > item.price) {
        return sum + (item.originalPrice - item.price) * item.quantity;
      }
      return sum;
    }, 0);
  }

  get totalSavings(): number {
    const freeshipSaving = (this.subTotal > 0 && this.subTotal < 50000000 && this.appliedFreeshipVoucher)
      ? Math.min(250000, this.appliedFreeshipVoucher.calculatedDiscount || 250000)
      : 0;
    return this.productSaleSavings + this.discountAmount + freeshipSaving;
  }

  get totalAmount(): number {
    return Math.max(0, this.subTotal - this.discountAmount);
  }

  get totalSelectedQuantity(): number {
    return this.selectedValidItems.reduce((sum, item) => sum + item.quantity, 0);
  }

  get totalItemsCount(): number {
    return this.cartItems.reduce((a, b) => a + b.quantity, 0);
  }

  get canCheckout(): boolean {
    return this.selectedItems.length > 0;
  }

  // --- Logic Khuyến mãi (Đồng bộ qua PromotionService) ---
  onVoucherSelectChange() {
    this.voucherError = '';
    if (this.selectedVoucherCode === 'CUSTOM') {
      this.showCustomInput = true;
      this.promotionService.removeAppliedPromotion();
    } else if (this.selectedVoucherCode) {
      this.showCustomInput = false;
      this.promotionService.applyPromotion(this.selectedVoucherCode, this.subTotal, this.selectedItems).subscribe(res => {
        if (!res.success) {
          this.voucherError = res.message;
        } else {
          this.voucherError = '';
        }
        this.cdr.detectChanges();
      });
    } else {
      this.promotionService.removeAppliedPromotion();
    }
  }

  applyCustomVoucher() {
    const code = (this.customVoucherInput || '').trim().toUpperCase();
    if (!code) {
      this.voucherError = 'Vui lòng nhập mã ưu đãi.';
      return;
    }
    this.voucherError = '';
    this.manuallyRemovedProduct = false;
    this.manuallyRemovedFreeship = false;
    this.promotionService.applyPromotion(code, this.subTotal, this.selectedItems).subscribe(res => {
      if (!res.success) {
        this.voucherError = res.message;
      } else {
        this.voucherError = '';
        this.showCustomInput = false;
        const isFreeship = code.startsWith('FREESHIP');
        this.showToast(`Đã áp dụng mã "${code}" thành công!`, 'success');
      }
      this.cdr.detectChanges();
    });
  }

  // --- Logic Sidebar Khuyến Mãi (Mở song song bên cạnh giỏ hàng) ---
  openVoucherDrawer() {
    this.isVariantDrawerOpen = false;
    this.isVoucherDrawerOpen = true;
    this.voucherError = '';
    this.showAllProductVouchers = false;
    // Đồng bộ danh sách voucher mới nhất từ cùng database của Admin
    this.promotionService.loadPromotions().subscribe();
  }

  toggleShowAllProductVouchers() {
    this.showAllProductVouchers = !this.showAllProductVouchers;
  }

  closeVoucherDrawer() {
    this.isVoucherDrawerOpen = false;
  }

  get eligibleVouchersCount(): number {
    return this.systemPromotions.filter(v => this.isVoucherEligible(v)).length;
  }

  isVoucherEligible(v: Promotion): boolean {
    if (v.isActive === false) return false;
    if (v.minOrderValue && this.subTotal < v.minOrderValue) return false;
    if (v.scope === 'SPECIFIC_PRODUCTS' && Array.isArray(v.productIds) && v.productIds.length > 0) {
      const idSet = new Set(v.productIds.map(x => String(x).trim()));
      const hasMatch = this.selectedItems.some(it => idSet.has(String(it.productId || it.id || '').trim()));
      if (!hasMatch) return false;
    }
    return true;
  }

  amountNeededForVoucher(v: Promotion): number {
    const min = v.minOrderValue || 0;
    return Math.max(0, min - this.subTotal);
  }

  applyVoucherDirectly(v: Promotion) {
    if (!this.isVoucherEligible(v)) {
      if (v.scope === 'SPECIFIC_PRODUCTS' && v.productIds?.length) {
        this.voucherError = `Mã "${v.code}" chỉ áp dụng cho các sản phẩm chọn lọc, chưa có trong giỏ hàng hiện tại.`;
      } else {
        this.voucherError = `Đơn hàng cần tối thiểu ${this.formatCurrency(v.minOrderValue || 0)} để áp dụng mã "${v.code}".`;
      }
      return;
    }
    this.voucherError = '';
    const isFreeship = !!v.isFreeShip || v.code.startsWith('FREESHIP');
    if (isFreeship) {
      this.manuallyRemovedFreeship = false;
    } else {
      this.manuallyRemovedProduct = false;
    }
    this.promotionService.applyPromotion(v.code, this.subTotal, this.selectedItems).subscribe(res => {
      if (res.success) {
        const desc = isFreeship ? 'miễn phí vận chuyển' : `giảm ${this.formatCurrency(res.applied?.calculatedDiscount || 0)}`;
        this.showToast(`Đã áp dụng mã "${v.code}" (${desc})!`, 'success');
      } else {
        this.voucherError = res.message;
      }
      this.cdr.detectChanges();
    });
  }

  removeProductVoucher() {
    this.manuallyRemovedProduct = true;
    this.promotionService.removeAppliedPromotion();
    this.voucherError = '';
    this.cdr.detectChanges();
  }

  removeFreeshipVoucher() {
    this.manuallyRemovedFreeship = true;
    this.promotionService.removeAppliedFreeship();
    this.voucherError = '';
    this.cdr.detectChanges();
  }

  removeVoucher() {
    this.removeProductVoucher();
  }

  formatCurrency(val: number): string {
    return (val || 0).toLocaleString('vi-VN') + ' ₫';
  }

  // Định dạng rút gọn số tiền giảm giá cho chip hiển thị trên cùng 1 hàng
  formatShortDiscount(val: number): string {
    if (!val || val <= 0) return '0₫';
    if (val >= 1000000) {
      const m = val / 1000000;
      return m % 1 === 0 ? `${m}tr` : `${m.toFixed(1)}tr`;
    }
    if (val >= 1000) {
      const k = val / 1000;
      return k % 1 === 0 ? `${k}k` : `${k.toFixed(0)}k`;
    }
    return `${val}₫`;
  }

  showToast(message: string, type: 'success' | 'warning' | 'error' = 'warning', durationMs = 3000) {
    this.toastMessage = message;
    this.toastType = type;
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }
    this.toastTimer = setTimeout(() => {
      this.toastMessage = null;
      this.cdr.detectChanges();
    }, durationMs);
  }

  // --- Logic Thay đổi Số lượng ---
  increaseQuantity(item: CartItem) {
    if (item.availableStock !== undefined && item.quantity >= item.availableStock) {
      this.showToast(`Chỉ còn ${item.availableStock} sản phẩm trong kho.`, 'warning');
      return;
    }

    const nextQty = item.quantity + 1;
    this.cartService.updateQuantity(item.id, nextQty).subscribe({
      next: () => {
        this.cdr.detectChanges();
      },
      error: (err) => {
        const msg = err.error?.message || 'Không thể cập nhật số lượng';
        this.showToast(msg, 'error');
      }
    });
  }

  decreaseQuantity(item: CartItem) {
    if (item.quantity <= 1) {
      // Giảm về 0 -> Hiển thị xác nhận xóa
      this.promptRemove(item);
      return;
    }

    const nextQty = item.quantity - 1;
    this.cartService.updateQuantity(item.id, nextQty).subscribe({
      next: () => {
        this.cdr.detectChanges();
      },
      error: (err) => {
        const msg = err.error?.message || 'Không thể cập nhật số lượng';
        this.showToast(msg, 'error');
      }
    });
  }

  // --- Logic Xóa 1 sản phẩm ---
  promptRemove(item: CartItem) {
    this.itemToDelete = item;
    this.isConfirmDeleteOpen = true;
  }

  confirmRemove() {
    if (!this.itemToDelete) return;
    const id = this.itemToDelete.id;
    this.cartService.removeFromCart(id).subscribe({
      next: () => {
        this.selectedItemIds.delete(id);
        this.showToast('Đã xóa sản phẩm khỏi giỏ hàng.', 'success');
        this.cancelDelete();
      },
      error: (err) => {
        const msg = err.error?.message || 'Không thể xóa sản phẩm';
        this.showToast(msg, 'error');
        this.cancelDelete();
      }
    });
  }

  cancelDelete() {
    this.isConfirmDeleteOpen = false;
    this.itemToDelete = null;
  }

  // --- Logic Xóa nhiều sản phẩm đã chọn ---
  promptDeleteSelected() {
    if (this.selectedItemIds.size === 0) return;
    this.isBatchDeleteModalOpen = true;
  }

  confirmDeleteSelected() {
    const ids = Array.from(this.selectedItemIds);
    if (ids.length === 0) return;

    this.cartService.removeMultiple(ids).subscribe({
      next: () => {
        this.selectedItemIds.clear();
        this.showToast(`Đã xóa ${ids.length} sản phẩm được chọn.`, 'success');
        this.isBatchDeleteModalOpen = false;
      },
      error: (err) => {
        const msg = err.error?.message || 'Không thể xóa các sản phẩm được chọn';
        this.showToast(msg, 'error');
        this.isBatchDeleteModalOpen = false;
      }
    });
  }

  cancelDeleteSelected() {
    this.isBatchDeleteModalOpen = false;
  }

  get variantImages(): string[] {
    if (this.variantGalleryImages.length > 0) {
      return this.variantGalleryImages;
    }
    const v = this.selectedVariantDetails;
    if (v?.images && Array.isArray(v.images) && v.images.length > 0) {
      return v.images;
    }
    const p = this.productForVariantEdit;
    if (p?.images && Array.isArray(p.images) && p.images.length > 0) {
      return p.images;
    }
    if (this.editingCartItem?.image) {
      return [this.editingCartItem.image];
    }
    return ['/assets/img/furniture-placeholder.svg'];
  }

  optimizeVariantImageUrl(url: string, width = 800): string {
    if (!url || typeof url !== 'string') return url;
    if (url.includes('res.cloudinary.com')) {
      if (url.includes('/image/fetch/') && !url.includes('w_')) {
        return url.replace('/image/fetch/', `/image/fetch/w_${width},c_limit,f_auto,q_auto:good/`);
      }
      if (url.includes('/image/upload/') && !url.includes('w_')) {
        return url.replace('/image/upload/', `/image/upload/w_${width},c_limit,f_auto,q_auto:good/`);
      }
    }
    return url;
  }

  getVariantThumbUrl(url: string): string {
    if (!url || typeof url !== 'string') return url;
    if (url.includes('/image/fetch/')) {
      return url.replace(/\/image\/fetch\/([^/]+\/)?/, '/image/fetch/w_160,h_160,c_fill,f_auto,q_auto:good/');
    }
    if (url.includes('/image/upload/')) {
      return url.replace(/\/image\/upload\/([^/]+\/)?/, '/image/upload/w_160,h_160,c_fill,f_auto,q_auto:good/');
    }
    return url;
  }

  private extractVariantRealImages(prod: any, currentVariant: any): string[] {
    const list: string[] = [];
    const isClean = (u: any) => typeof u === 'string' && u.startsWith('http') && !u.includes('dsasf753c');

    const vImgs = currentVariant?.images || currentVariant?.optionValues?.images || [];
    if (Array.isArray(vImgs)) {
      vImgs.filter(isClean).forEach((img: string) => {
        const opt = this.optimizeVariantImageUrl(img, 800);
        if (!list.includes(opt)) list.push(opt);
      });
    }

    const pImgs = prod?.images || [];
    if (Array.isArray(pImgs)) {
      pImgs.filter(isClean).forEach((img: string) => {
        const opt = this.optimizeVariantImageUrl(img, 800);
        if (!list.includes(opt)) list.push(opt);
      });
    }

    if (list.length === 0 && this.editingCartItem?.image) {
      list.push(this.editingCartItem.image);
    }

    return list.length > 0 ? list : ['/assets/img/furniture-placeholder.svg'];
  }

  private buildVariantDimensionString(attrs: any, dims: any): string {
    const parts: string[] = [];
    if (attrs.diameter) {
      parts.push(`Đường kính: ${attrs.diameter}`);
    } else if (dims.width || attrs.width) {
      parts.push(`Rộng: ${attrs.width || (dims.width + ' cm')}`);
    }
    if (dims.depth || attrs.depth) {
      parts.push(`Sâu: ${attrs.depth || (dims.depth + ' cm')}`);
    }
    if (dims.height || attrs.height) {
      parts.push(`Cao: ${attrs.height || (dims.height + ' cm')}`);
    }
    if (dims.weight || attrs.weight) {
      parts.push(`Trọng lượng: ${attrs.weight || (dims.weight + ' kg')}`);
    }
    if (attrs.mattressSize) {
      parts.push(`Kích thước nệm: ${attrs.mattressSize}`);
    }
    return parts.join(' × ');
  }

  private updateVariantSidebarData() {
    const prod = this.productForVariantEdit;
    const v = this.selectedVariantDetails || prod?.variants?.[0];
    const attrs = v?.attributes || v?.optionValues?.attributes || {};
    const dims = v?.dimensions || v?.optionValues?.dimensions || {};

    // A. Tồn kho khả dụng & Ngưỡng cảnh báo từ Database
    const stockVal = v ? ((v.stock ?? 0) - (v.reservedStock ?? 0)) : (prod?.stock || 0);
    this.editingMaxStock = Math.max(0, stockVal);

    const rawThreshold = v?.safetyThreshold ?? v?.threshold ?? v?.optionValues?.safetyThreshold ?? v?.warehouseStocks?.[0]?.safetyThreshold;
    this.editingSafetyThreshold = (typeof rawThreshold === 'number' && Number.isFinite(rawThreshold) && rawThreshold >= 0) ? rawThreshold : 5;

    if (this.editingMaxStock > 0 && this.editingQuantity > this.editingMaxStock) {
      this.editingQuantity = this.editingMaxStock;
    } else if (this.editingMaxStock > 0 && this.editingQuantity < 1) {
      this.editingQuantity = 1;
    }

    // B. Ảnh thật từ Database
    this.variantGalleryImages = this.extractVariantRealImages(prod, v);
    this.currentVariantImageIdx = 0;

    // C. Kích thước thật từ Database
    this.variantRealDimensions = this.buildVariantDimensionString(attrs, dims);

    // D. Chất liệu & Hoàn thiện thật từ Database
    const finish = attrs.finish_vi || attrs.finish || '';
    const upholstery = attrs.upholsteryComposition_vi || attrs.upholsteryComposition || '';
    const baseDesc = prod?.description || '';
    const matParts = [finish, upholstery, baseDesc].filter(Boolean);
    this.variantRealMaterial = matParts.length > 0 ? matParts.join(' • ') : '';

    // E. Thông số kỹ thuật
    this.variantSpecsWeightLoad = attrs.weightLoad ? `${attrs.weightLoad}` : '';
    if (attrs.productSpecification_vi) {
      this.variantSpecsMaterials = attrs.productSpecification_vi.split('|').slice(0, 3).join(', ');
    } else if (attrs.productSpecification) {
      this.variantSpecsMaterials = attrs.productSpecification.split('|').slice(0, 2).join(', ');
    } else {
      this.variantSpecsMaterials = this.variantRealMaterial || '';
    }
    this.variantSpecsDesignedBy = attrs.designedBy || '';
  }

  private checkEditingWishlist() {
    const pid = this.productForVariantEdit?.productId || this.productForVariantEdit?.id || this.editingCartItem?.productId;
    this.isEditingProductWishlisted = pid ? this.wishlistService.isWishlisted(pid) : false;
  }

  toggleEditingWishlist(e: Event) {
    e.stopPropagation();
    e.preventDefault();
    const pid = this.productForVariantEdit?.productId || this.productForVariantEdit?.id || this.editingCartItem?.productId;
    if (!pid) return;
    this.isEditingProductWishlisted = this.wishlistService.toggle(pid);
    this.cdr.detectChanges();
  }

  selectVariantThumbnail(idx: number) {
    this.currentVariantImageIdx = idx;
  }

  decreaseEditingQuantity() {
    if (this.editingMaxStock === 0) return;
    this.editingQuantity = this.editingQuantity > 1 ? this.editingQuantity - 1 : 1;
  }

  increaseEditingQuantity() {
    if (this.editingMaxStock === 0) return;
    if (this.editingQuantity < this.editingMaxStock) {
      this.editingQuantity++;
    }
  }

  onEditingQtyFocus(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input) input.select();
  }

  onEditingQtyKeydown(event: KeyboardEvent) {
    const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];
    if (allowedKeys.includes(event.key)) {
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        this.increaseEditingQuantity();
      } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        this.decreaseEditingQuantity();
      } else if (event.key === 'Enter') {
        (event.target as HTMLElement).blur();
      }
      return;
    }
    if (event.ctrlKey || event.metaKey) return;
    if (!/^[0-9]$/.test(event.key)) {
      event.preventDefault();
    }
  }

  onEditingQtyInput(event: Event) {
    const input = event.target as HTMLInputElement;
    const cleanVal = input.value.replace(/\D/g, '');
    if (!cleanVal) {
      input.value = '';
      return;
    }
    let num = parseInt(cleanVal, 10);
    if (this.editingMaxStock > 0 && num > this.editingMaxStock) num = this.editingMaxStock;
    if (num < 1) num = 1;
    input.value = String(num);
    this.editingQuantity = num;
  }

  onEditingQtyBlur(event: Event) {
    const input = event.target as HTMLInputElement;
    const cleanVal = input.value.replace(/\D/g, '');
    let num = parseInt(cleanVal, 10);
    if (isNaN(num) || num < 1) {
      num = this.editingMaxStock > 0 ? 1 : 0;
    } else if (this.editingMaxStock > 0 && num > this.editingMaxStock) {
      num = this.editingMaxStock;
    }
    this.editingQuantity = num;
    input.value = String(this.editingQuantity);
  }

  get isEditingLowStock(): boolean {
    return this.editingMaxStock > 0 && this.editingMaxStock <= this.editingSafetyThreshold;
  }

  get editingCurrentSku(): string {
    return this.selectedVariantDetails?.sku || this.productForVariantEdit?.variants?.[0]?.sku || this.editingCartItem?.sku || this.editingCartItem?.productId || '—';
  }

  get editingCurrentPrice(): number {
    const prod = this.productForVariantEdit;
    const v = this.selectedVariantDetails;
    const raw = v ? v.price : (prod?.basePrice || this.editingCartItem?.price || 0);
    if (prod) {
      const campDisc = this.promotionService.getDiscountForProduct(prod);
      if (campDisc) return campDisc.salePrice;
      const disc = prod.discountValue;
      const type = prod.discountType;
      if (disc && disc > 0) {
        if (type === 'PERCENT') return Math.round(raw * (100 - disc) / 100);
        return Math.max(0, raw - disc);
      }
    }
    return raw;
  }

  get editingOriginalPrice(): number | null {
    const prod = this.productForVariantEdit;
    if (!prod) return this.editingCartItem?.originalPrice || null;
    const campDisc = this.promotionService.getDiscountForProduct(prod);
    if (campDisc) return campDisc.originalPrice;
    const disc = prod.discountValue;
    if (disc && disc > 0) {
      return this.selectedVariantDetails ? this.selectedVariantDetails.price : prod.basePrice;
    }
    return null;
  }

  get editingDiscountBadgeText(): string {
    const prod = this.productForVariantEdit;
    if (!prod) return '';
    const campDisc = this.promotionService.getDiscountForProduct(prod);
    if (campDisc) return campDisc.badgeText;
    const disc = prod.discountValue;
    if (disc && disc > 0) {
      return formatDiscountBadgeText(prod.discountType || 'PERCENT', disc);
    }
    return '';
  }

  prevVariantImage(e?: Event) {
    if (e) e.stopPropagation();
    const imgs = this.variantImages;
    this.currentVariantImageIdx = this.currentVariantImageIdx <= 0 ? imgs.length - 1 : this.currentVariantImageIdx - 1;
  }

  nextVariantImage(e?: Event) {
    if (e) e.stopPropagation();
    const imgs = this.variantImages;
    this.currentVariantImageIdx = this.currentVariantImageIdx >= imgs.length - 1 ? 0 : this.currentVariantImageIdx + 1;
  }

  // --- Logic Đổi Biến Thể Sản Phẩm (Sidebar bên cạnh - Chuẩn 100% Quick View Drawer) ---
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if ((this.openVariantDropdownGroupId || this.isSingleVariantDropdownOpen) && !target.closest('.custom-select-box')) {
      this.openVariantDropdownGroupId = null;
      this.isSingleVariantDropdownOpen = false;
    }
  }

  openVariantDrawer(item: CartItem, event?: Event) {
    if (event) event.stopPropagation();
    this.editingCartItem = item;
    this.selectedVariantId = item.variantId;
    this.editingQuantity = Math.max(1, item.quantity || 1);
    this.isVariantDrawerOpen = true;
    this.isVoucherDrawerOpen = false;
    this.currentVariantImageIdx = 0;
    this.variantErrorMessage = null;
    this.openVariantDropdownGroupId = null;
    this.isSingleVariantDropdownOpen = false;
    this.checkEditingWishlist();

    // Kiểm tra cache: Nếu sản phẩm đã tải trước đó, hiển thị ngay lập tức
    if (CartDrawerComponent.productVariantsCache.has(item.productId)) {
      this.productForVariantEdit = CartDrawerComponent.productVariantsCache.get(item.productId);
      this.isLoadingProductVariants = false;
      this.initVariantAttributes();
      this.checkEditingWishlist();
      this.cdr.detectChanges();
      return;
    }

    this.isLoadingProductVariants = true;
    this.productForVariantEdit = null;

    fetch(`${environment.apiUrl}/products/${item.productId}`)
      .then(res => {
        if (!res.ok) throw new Error('Không thể tải biến thể của sản phẩm');
        return res.json();
      })
      .then(data => {
        CartDrawerComponent.productVariantsCache.set(item.productId, data);
        this.productForVariantEdit = data;
        this.isLoadingProductVariants = false;
        this.initVariantAttributes();
        this.checkEditingWishlist();
        this.cdr.detectChanges();
      })
      .catch(err => {
        console.error('Lỗi tải sản phẩm:', err);
        this.isLoadingProductVariants = false;
        this.variantErrorMessage = 'Không thể tải danh sách biến thể. Vui lòng thử lại.';
        this.cdr.detectChanges();
      });
  }

  closeVariantDrawer() {
    this.isVariantDrawerOpen = false;
    this.editingCartItem = null;
    this.productForVariantEdit = null;
    this.selectedVariantId = null;
    this.currentVariantImageIdx = 0;
    this.variantErrorMessage = null;
    this.openVariantDropdownGroupId = null;
    this.isSingleVariantDropdownOpen = false;
    this.variantAttributeGroups = [];
    this.variantSingleFixedAttributes = [];
    this.selectedVariantAttributes = {};
    this.variantGalleryImages = [];
    this.editingQuantity = 1;
    this.editingMaxStock = 0;
  }

  get availableVariantsForEdit(): any[] {
    return this.productForVariantEdit?.variants || [];
  }

  get selectedVariantDetails(): any {
    return this.availableVariantsForEdit.find(v => v.id === this.selectedVariantId);
  }

  getVariantAvailableStock(v: any): number {
    return Math.max(0, (v?.stock ?? 0) - (v?.reservedStock ?? 0));
  }

  selectVariant(variant: any) {
    if (variant.isActive === false || this.getVariantAvailableStock(variant) <= 0) {
      return;
    }
    this.selectedVariantId = variant.id;
    this.currentVariantImageIdx = 0;
    this.variantErrorMessage = null;
    this.syncSelectedAttributesFromVariant(variant);
    this.updateVariantSidebarData();
    this.cdr.detectChanges();
  }

  // --- Khởi tạo và xử lý Ma trận thuộc tính Dropdown chuẩn 100% Quick View ---
  private isNumericSlash(name: string): boolean {
    return /\d[\d½¼¾.]*\s*\/\s*\d/.test((name || '').trim());
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

  initVariantAttributes() {
    const prod = this.productForVariantEdit;
    if (!prod) return;

    const rawVariants: any[] = Array.isArray(prod.variants) ? prod.variants : [];
    const configAttrs: any[] = prod.configOptions?.attributes || [];

    this.variantAttributeGroups = [];
    this.variantSingleFixedAttributes = [];
    this.selectedVariantAttributes = {};
    this.openVariantDropdownGroupId = null;
    this.isSingleVariantDropdownOpen = false;

    // 1. Phân tích nhóm thuộc tính giống hệt Quick View
    if (configAttrs.length > 0) {
      for (const attr of configAttrs) {
        const gid = attr.groupId || 'attr';
        const label = GROUP_LABEL_MAP[gid] || attr.groupName || gid;
        const rawOpts: VariantAttributeOption[] = (attr.options || []).map((o: any) => ({
          id: String(o.id),
          name: o.name,
          image: o.image || null,
          hexColor: o.hexColor || null,
          groupName: o.groupName || null
        }));

        const isComposite = rawOpts.length > 0 && rawOpts.every(o => {
          const parts = this.splitCompositeName(o.name);
          return parts.length >= 2;
        });

        if (isComposite) {
          for (let partIdx = 0; partIdx < 2; partIdx++) {
            const subMap = new Map<string, VariantAttributeOption>();
            rawOpts.forEach(o => {
              const parts = this.splitCompositeName(o.name);
              const partVal = (parts[partIdx] || parts[0]).trim();
              if (partVal && !subMap.has(partVal)) {
                subMap.set(partVal, {
                  id: partVal,
                  name: partVal,
                  image: partIdx === 0 ? o.image : null,
                  hexColor: partIdx === 0 ? o.hexColor : null,
                  groupName: o.groupName || null
                });
              }
            });

            const subOpts = Array.from(subMap.values());
            const subGroupId = `${gid}_sub_${partIdx}`;
            let subLabel = label;
            if (gid === 'vaMaterial') {
              subLabel = partIdx === 0 ? 'Chất liệu thân / Mặt tủ' : 'Chất liệu khung / Chân';
            } else if (gid === 'vaMaterialShell') {
              subLabel = partIdx === 0 ? 'Chất liệu khung / Vỏ' : 'Chất liệu đệm / Vải bọc';
            } else if (gid === 'vaMaterialTabletop') {
              subLabel = partIdx === 0 ? 'Chất liệu mặt bàn chính' : 'Chi tiết phối viền / ngăn';
            } else if (gid === 'vaMaterialLeg') {
              subLabel = partIdx === 0 ? 'Chất liệu chân chính' : 'Chi tiết phối chân';
            } else {
              subLabel = partIdx === 0 ? `${label} (Chính)` : `${label} (Khung / Phối)`;
            }

            if (subOpts.length > 1) {
              this.variantAttributeGroups.push({
                groupId: subGroupId,
                label: subLabel,
                options: subOpts
              });
            } else if (subOpts.length === 1) {
              this.variantSingleFixedAttributes.push({
                groupId: subGroupId,
                label: subLabel,
                value: subOpts[0].name
              });
            }
          }
        } else {
          const cleanedOpts = rawOpts.map(o => {
            const parts = this.splitCompositeName(o.name);
            return {
              ...o,
              name: parts.length === 1 ? parts[0] : o.name
            };
          });
          const uniqueOpts = Array.from(new Map(cleanedOpts.map(o => [o.name, o])).values());
          if (uniqueOpts.length > 1) {
            this.variantAttributeGroups.push({
              groupId: gid,
              label,
              options: uniqueOpts
            });
          } else if (uniqueOpts.length === 1) {
            this.variantSingleFixedAttributes.push({
              groupId: gid,
              label,
              value: uniqueOpts[0].name
            });
          }
        }
      }
    } else if (rawVariants.length > 1) {
      const sampleParts = this.parseVariantToParts(rawVariants[0].name || '');
      if (sampleParts.length > 1) {
        sampleParts.forEach((_: string, idx: number) => {
          const uniqueVals = Array.from(new Set(rawVariants.map(v => (this.parseVariantToParts(v.name || '')[idx] || '').trim()))).filter(Boolean);
          if (uniqueVals.length > 1) {
            let label = `Thuộc tính ${idx + 1}`;
            if (idx === 0 && uniqueVals.some(v => /^[HhWwLlDdØø]\d+/i.test(v))) {
              label = 'Kích thước';
            } else if (uniqueVals.some(v => /lacquer|veneer|fabric|wood|leather|gỗ|da|vải|sơn/i.test(v))) {
              label = idx === 0 ? 'Chất liệu thân / Mặt' : (idx === 1 ? 'Chất liệu khung / Chân' : 'Màu sắc / Hoàn thiện');
            }
            this.variantAttributeGroups.push({
              groupId: `opt_${idx}`,
              label,
              options: uniqueVals.map(val => ({ id: val, name: val }))
            });
          } else if (uniqueVals.length === 1) {
            this.variantSingleFixedAttributes.push({
              groupId: `opt_${idx}`,
              label: idx === 0 && /^[HhWwLlDdØø]\d+/i.test(uniqueVals[0]) ? 'Kích thước tiêu chuẩn' : 'Chất liệu tiêu chuẩn',
              value: uniqueVals[0]
            });
          }
        });
      }
    }

    // 2. Khởi tạo giá trị chọn theo biến thể đang có trong giỏ hàng
    const currentVar = this.selectedVariantDetails || rawVariants[0];
    if (currentVar) {
      this.selectedVariantId = currentVar.id;
      this.syncSelectedAttributesFromVariant(currentVar);
    }

    // 3. Cập nhật toàn bộ ảnh, tồn kho, thông số kỹ thuật chuẩn Quick View
    this.updateVariantSidebarData();
  }

  private isVariantMatchOption(v: any, group: VariantAttributeGroup, opt: VariantAttributeOption): boolean {
    if (!v || !opt) return false;
    const optIdLower = (opt.id || '').toLowerCase();
    const optNameLower = (opt.name || '').toLowerCase();
    const vNameLower = (v.name || '').toLowerCase();
    const vSkuLower = (v.sku || '').toLowerCase();
    const groupId = group.groupId;

    const optVal = v.optionValues?.[groupId];
    if (optVal !== undefined && optVal !== null) {
      const optValStr = String(optVal).toLowerCase();
      if (optValStr === optIdLower || optValStr === optNameLower) return true;
    }

    const parentGroupId = groupId.replace(/_sub_\d+$/, '');
    const parentOptVal = v.optionValues?.[parentGroupId];
    if (parentOptVal !== undefined && parentOptVal !== null) {
      const pStr = String(parentOptVal).toLowerCase();
      if (pStr === optIdLower || pStr === optNameLower) return true;
    }

    const nestedVal = v.optionValues?.attributes?.[groupId] || v.optionValues?.attributes?.[parentGroupId];
    if (nestedVal !== undefined && nestedVal !== null) {
      const nestedStr = String(nestedVal).toLowerCase();
      if (nestedStr === optIdLower || nestedStr === optNameLower) return true;
    }

    if (optNameLower && (vNameLower.includes(optNameLower) || optNameLower.includes(vNameLower))) {
      return true;
    }

    const vParts = this.parseVariantToParts(v.name || '');
    if (vParts.some(p => p.toLowerCase() === optNameLower || p.toLowerCase() === optIdLower)) {
      return true;
    }

    if (optIdLower && optIdLower.length >= 3 && vSkuLower.includes(optIdLower)) {
      return true;
    }

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

  private syncSelectedAttributesFromVariant(v: any) {
    if (!v) return;
    const vNameLower = (v.name || '').toLowerCase();
    for (const group of this.variantAttributeGroups) {
      const valId = v.optionValues?.[group.groupId];
      if (valId !== undefined && valId !== null && group.options.some(o => o.id === String(valId))) {
        this.selectedVariantAttributes[group.groupId] = String(valId);
      } else {
        const matchedOpt = group.options.find(o => this.isVariantMatchOption(v, group, o))
          || group.options.find(o => vNameLower.includes(o.name.toLowerCase()));
        this.selectedVariantAttributes[group.groupId] = matchedOpt ? matchedOpt.id : (group.options[0]?.id || '');
      }
    }
  }

  toggleVariantDropdownGroup(groupId: string, event?: Event) {
    if (event) event.stopPropagation();
    this.openVariantDropdownGroupId = this.openVariantDropdownGroupId === groupId ? null : groupId;
    this.isSingleVariantDropdownOpen = false;
  }

  selectVariantAttributeOption(groupId: string, optionId: string, event?: Event) {
    if (event) event.stopPropagation();
    this.openVariantDropdownGroupId = null;
    this.selectedVariantAttributes[groupId] = optionId;
    this.resolveVariantFromSelections(groupId, optionId);
  }

  getSelectedVariantOption(group: VariantAttributeGroup): VariantAttributeOption | undefined {
    const selId = this.selectedVariantAttributes[group.groupId];
    return group.options.find(o => o.id === selId) || group.options[0];
  }

  formatOptionDisplayName(name: string | undefined | null, group?: VariantAttributeGroup): string {
    if (!name) return '';
    let str = name.trim();
    const isSize = group ? ((group.groupId || '').toLowerCase().includes('size') || (group.label || '').toLowerCase().includes('kích thước')) : false;

    if (/^\d+(\.\d+)?$/.test(str) && isSize) {
      return `${str} cm`;
    }
    str = str.replace(/(\d+(?:[½¼¾]|\/\d+)?)\s*(cm|mm|m)\b/gi, '$1 $2');
    str = str.replace(/([a-zA-Z0-9½¼¾]+)\s*[xX]\s*([a-zA-Z0-9½¼¾Øø]+)/g, '$1 × $2');
    str = str.replace(/([a-zA-Z0-9½¼¾]+)\s*[xX]\s*([a-zA-Z0-9½¼¾Øø]+)/g, '$1 × $2');
    str = str.replace(/[Øø]\s*(\d+)/g, 'Ø$1');
    return str;
  }

  toggleSingleVariantDropdown(event?: Event) {
    if (event) event.stopPropagation();
    this.isSingleVariantDropdownOpen = !this.isSingleVariantDropdownOpen;
    this.openVariantDropdownGroupId = null;
  }

  selectVariantFromDropdown(v: any, event?: Event) {
    if (event) event.stopPropagation();
    this.isSingleVariantDropdownOpen = false;
    this.selectVariant(v);
  }

  private findMatchingVariant(attrs: Record<string, string>): any | null {
    const variants: any[] = this.availableVariantsForEdit;
    if (variants.length === 0) return null;

    let bestMatch = variants[0];
    let highestScore = -1;

    for (const v of variants) {
      let score = 0;
      for (const group of this.variantAttributeGroups) {
        const selValId = attrs[group.groupId];
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

      const avail = this.getVariantAvailableStock(v);
      if (avail > 0) score += 2;

      if (score > highestScore) {
        highestScore = score;
        bestMatch = v;
      }
    }

    return bestMatch || variants[0];
  }

  private resolveVariantFromSelections(changedGroupId: string, changedOptionId: string) {
    const matched = this.findMatchingVariant(this.selectedVariantAttributes);
    if (matched) {
      this.selectedVariantId = matched.id;
      this.syncSelectedAttributesFromVariant(matched);
      this.variantErrorMessage = null;
      this.updateVariantSidebarData();
      this.cdr.detectChanges();
    }
  }

  saveVariantChange() {
    if (!this.editingCartItem || !this.selectedVariantId) return;

    const targetQty = Math.max(1, this.editingQuantity || this.editingCartItem.quantity || 1);

    // Trường hợp giữ nguyên biến thể nhưng có thay đổi số lượng
    if (this.selectedVariantId === this.editingCartItem.variantId) {
      if (targetQty !== this.editingCartItem.quantity) {
        if (this.editingMaxStock > 0 && targetQty > this.editingMaxStock) {
          this.variantErrorMessage = `Chỉ còn ${this.editingMaxStock} sản phẩm trong kho.`;
          return;
        }
        this.cartService.updateQuantity(this.editingCartItem.id, targetQty).subscribe({
          next: () => {
            this.showToast('Cập nhật số lượng thành công.', 'success');
            this.closeVariantDrawer();
          },
          error: (err) => {
            this.variantErrorMessage = err.error?.message || 'Không thể cập nhật số lượng.';
            this.cdr.detectChanges();
          }
        });
        return;
      }
      this.closeVariantDrawer();
      return;
    }

    const newVariant = this.availableVariantsForEdit.find(v => v.id === this.selectedVariantId);
    if (!newVariant) {
      this.variantErrorMessage = 'Biến thể đã chọn không hợp lệ.';
      return;
    }

    const availableStock = this.getVariantAvailableStock(newVariant);

    const existingSameVariantItem = this.cartItems.find(
      i => i.variantId === this.selectedVariantId && i.id !== this.editingCartItem!.id
    );

    if (existingSameVariantItem) {
      const mergedQty = targetQty + existingSameVariantItem.quantity;
      if (mergedQty > availableStock) {
        this.variantErrorMessage = `Không thể đổi vì tổng số lượng sau khi gộp (${mergedQty}) sẽ vượt quá tồn kho (Chỉ còn ${availableStock} sản phẩm).`;
        return;
      }
    } else {
      if (targetQty > availableStock) {
        this.variantErrorMessage = `Số lượng hiện tại (${targetQty}) vượt quá tồn kho của biến thể mới (Chỉ còn ${availableStock} sản phẩm).`;
        return;
      }
    }

    const selectedTags: { label: string; value: string }[] = [];
    if (this.variantAttributeGroups.length > 0) {
      for (const group of this.variantAttributeGroups) {
        const opt = this.getSelectedVariantOption(group);
        if (opt?.name) {
          selectedTags.push({
            label: group.label,
            value: this.formatOptionDisplayName(opt.name, group)
          });
        }
      }
    }

    const newVariantImgs = newVariant.optionValues?.images;
    const updatedImage = (Array.isArray(newVariantImgs) && newVariantImgs.length > 0 && typeof newVariantImgs[0] === 'string')
      ? newVariantImgs[0]
      : (this.variantGalleryImages[0] || this.editingCartItem.image);

    const updatedGuestInfo: Partial<CartItem> = {
      sku: newVariant.sku,
      variantName: newVariant.name,
      variantTags: selectedTags.length > 0 ? selectedTags : undefined,
      image: updatedImage,
      price: this.editingCurrentPrice || newVariant.price || this.editingCartItem.price,
      originalPrice: this.editingOriginalPrice || undefined,
      availableStock
    };

    this.cartService.updateVariant(
      this.editingCartItem.id,
      this.selectedVariantId,
      targetQty,
      { ...this.selectedVariantAttributes },
      updatedGuestInfo
    ).subscribe({
      next: (res) => {
        this.showToast(res?.message || 'Cập nhật biến thể thành công.', 'success');
        this.closeVariantDrawer();
      },
      error: (err) => {
        this.variantErrorMessage = err.error?.message || 'Không thể cập nhật biến thể.';
        this.cdr.detectChanges();
      }
    });
  }

  getVariantDisplayText(item: CartItem): string {
    const values: string[] = [];
    const seen = new Set<string>();
    const skuLower = String(item.sku || '').trim().toLowerCase();

    const pushRawValue = (raw: string | undefined | null) => {
      if (!raw || typeof raw !== 'string') return;
      const trimmed = raw.trim();
      if (!trimmed || trimmed.startsWith('http://') || trimmed.startsWith('https://')) return;

      const majorParts = trimmed.split(/\s*[|·]\s*/).map(p => p.trim()).filter(Boolean);
      for (const chunk of majorParts) {
        const parts = this.splitCompositeName(chunk);
        for (const p of parts) {
          const formatted = this.formatOptionDisplayName(p);
          const lower = formatted.toLowerCase();
          if (
            !formatted ||
            lower === 'phân loại mặc định' ||
            lower === 'tùy chọn mặc định' ||
            (skuLower && lower === skuLower) ||
            seen.has(lower)
          ) {
            continue;
          }
          seen.add(lower);
          values.push(formatted);
        }
      }
    };

    if (Array.isArray(item.variantTags) && item.variantTags.length > 0) {
      for (const tag of item.variantTags) {
        pushRawValue(tag?.value);
      }
    }

    if (values.length === 0 && item.variantName) {
      pushRawValue(item.variantName);
    }

    return values.length > 0 ? values.join(' | ') : 'Tùy chọn mặc định';
  }

  onVariantBadgeMouseEnter(event: MouseEvent, item: CartItem) {
    if (typeof window === 'undefined') return;
    const btn = event.currentTarget as HTMLElement | null;
    if (!btn) return;

    const textEl = btn.querySelector('.variant-text') as HTMLElement | null;
    if (!textEl || textEl.scrollWidth <= textEl.clientWidth + 1) {
      this.hoveredVariantTooltip = null;
      return;
    }

    const fullText = this.getVariantDisplayText(item);
    const rect = btn.getBoundingClientRect();
    const tooltipMaxWidth = 280;
    const left = Math.max(12, Math.min(window.innerWidth - tooltipMaxWidth - 12, rect.left));
    const showBelow = rect.top < 96;

    this.hoveredVariantTooltip = {
      text: fullText,
      top: showBelow ? rect.bottom + 8 : rect.top - 8,
      left,
      placement: showBelow ? 'bottom' : 'top'
    };
  }

  hideVariantTooltip() {
    this.hoveredVariantTooltip = null;
  }

  closeDrawer() {
    this.hideVariantTooltip();
    this.closeVariantDrawer();
    this.isOpen = false;
    this.isConfirmDeleteOpen = false;
    this.isBatchDeleteModalOpen = false;
    this.isVariantDrawerOpen = false;
    this.isVoucherDrawerOpen = false;
    this.isOutOfStockModalOpen = false;
    this.itemToDelete = null;
    this.close.emit();
  }

  isItemOutOfStock(item: CartItem): boolean {
    return item.isActive === false ||
           item.isProductActive === false ||
           (item.availableStock !== undefined && item.availableStock <= 0) ||
           (item.unavailableReason !== undefined && item.unavailableReason !== '');
  }

  closeOutOfStockModal() {
    this.isOutOfStockModalOpen = false;
  }

  unselectOutOfStockItems() {
    this.outOfStockItems.forEach(item => {
      this.selectedItemIds.delete(item.id);
    });
    this.syncPromotionsWithSubTotal();
    this.closeOutOfStockModal();
    this.showToast('Đã bỏ chọn các sản phẩm hết hàng.', 'success');
  }

  removeOutOfStockItems() {
    const ids = this.outOfStockItems.map(item => item.id);
    if (ids.length === 0) return;

    this.cartService.removeMultiple(ids).subscribe({
      next: () => {
        ids.forEach(id => this.selectedItemIds.delete(id));
        this.closeOutOfStockModal();
        this.showToast(`Đã xóa ${ids.length} sản phẩm hết hàng khỏi giỏ.`, 'success');
      },
      error: (err) => {
        const msg = err.error?.message || 'Không thể xóa các sản phẩm hết hàng';
        this.showToast(msg, 'error');
        this.closeOutOfStockModal();
      }
    });
  }

  private failedVariantUrls = new Set<string>();

  onVariantGalleryImageError(index: number, event: Event) {
    const coverFallbacks: Array<string | undefined> = [
      ...(Array.isArray(this.productForVariantEdit?.images)
        ? this.productForVariantEdit.images.filter((u: any) => typeof u === 'string' && u.startsWith('http') && !u.includes('/image/fetch/'))
        : []),
      this.editingCartItem?.image
    ];
    const failedUrl = this.variantImages[index];
    if (failedUrl && failedUrl !== PLACEHOLDER_PRODUCT_IMAGE) {
      this.failedVariantUrls.add(failedUrl);
      const nextUrl = resolveNextImageFallback(failedUrl, coverFallbacks, this.failedVariantUrls);
      if (nextUrl !== failedUrl) {
        this.variantImages[index] = nextUrl;
        this.cdr.detectChanges();
        return;
      }
    }
    applyImageErrorFallback(event, coverFallbacks);
  }

  onCartImageError(event: Event, fallback?: string) {
    applyImageErrorFallback(event, fallback ? [fallback] : []);
  }

  goToCheckout() {
    if (!this.canCheckout) {
      this.showToast('Vui lòng chọn ít nhất một sản phẩm để thanh toán.', 'warning');
      return;
    }

    const problemItems = this.selectedItems.filter(item => this.isItemOutOfStock(item));

    if (problemItems.length > 0) {
      this.outOfStockItems = problemItems;
      this.isOutOfStockModalOpen = true;

      const firstItem = problemItems[0];
      const msg = problemItems.length === 1
        ? `Sản phẩm "${firstItem.name}" hiện đã hết hàng trong kho. Vui lòng bỏ chọn hoặc xóa khỏi giỏ trước khi thanh toán.`
        : `Có ${problemItems.length} sản phẩm hiện đã hết hàng trong kho. Vui lòng bỏ chọn hoặc xóa khỏi giỏ trước khi thanh toán.`;

      this.showToast(msg, 'error');
      this.cdr.detectChanges();
      return;
    }

    // Lưu danh sách ID các sản phẩm được chọn vào sessionStorage để checkout lấy đúng mục
    const selectedIds = Array.from(this.selectedItemIds);
    try {
      sessionStorage.setItem('dcor_checkout_items', JSON.stringify(selectedIds));
    } catch (e) {
      console.error('Không thể lưu session checkout:', e);
    }

    this.closeDrawer();
    this.router.navigate(['/checkout']);
  }
}
