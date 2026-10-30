import { Component, EventEmitter, Input, Output, OnInit, OnChanges, SimpleChanges, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { CartService, CartItem } from '../../../core/services/cart.service';
import { PromotionService, Promotion, AppliedPromotion } from '../../../core/services/promotion.service';
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
  Building2
} from 'lucide-angular';

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
    Building2
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

  // Variant Switcher Drawer / Panel
  isVariantDrawerOpen = false;
  editingCartItem: CartItem | null = null;
  productForVariantEdit: any = null;
  isLoadingProductVariants = false;
  selectedVariantId: string | null = null;
  variantErrorMessage: string | null = null;

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
    private cdr: ChangeDetectorRef
  ) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['isOpen']?.currentValue === true) {
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

        const validIds = new Set(
          items
            .filter(item => item.isActive !== false && (item.availableStock === undefined || item.availableStock > 0))
            .map(item => item.id)
        );

        if (this.selectedItemIds.size === 0) {
          // Mặc định chọn tất cả item hợp lệ lần đầu
          this.selectedItemIds = validIds;
        } else {
          // Lọc bỏ những item không còn tồn tại hoặc đã bị hết hàng
          const newSelected = new Set<string>();
          this.selectedItemIds.forEach(id => {
            if (validIds.has(id)) {
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
    return this.cartItems.filter(
      item => item.isActive !== false && (item.availableStock === undefined || item.availableStock > 0)
    );
  }

  get isAllSelected(): boolean {
    return this.selectableItems.length > 0 && this.selectableItems.every(i => this.selectedItemIds.has(i.id));
  }

  get selectedValidItems(): CartItem[] {
    return this.cartItems.filter(
      item => this.selectedItemIds.has(item.id) &&
              item.isActive !== false &&
              (item.availableStock === undefined || item.availableStock > 0)
    );
  }

  get selectedCount(): number {
    return this.selectedItemIds.size;
  }

  toggleSelectAll() {
    if (this.isAllSelected) {
      this.selectedItemIds.clear();
    } else {
      this.selectedItemIds.clear();
      this.selectableItems.forEach(i => this.selectedItemIds.add(i.id));
    }
    this.syncPromotionsWithSubTotal();
  }

  toggleSelectItem(item: CartItem) {
    if (item.isActive === false || (item.availableStock !== undefined && item.availableStock <= 0)) {
      return;
    }

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

  get totalAmount(): number {
    return Math.max(0, this.subTotal + (this.subTotal > 0 ? this.shippingFee : 0) - this.discountAmount);
  }

  get totalSelectedQuantity(): number {
    return this.selectedValidItems.reduce((sum, item) => sum + item.quantity, 0);
  }

  get totalItemsCount(): number {
    return this.cartItems.reduce((a, b) => a + b.quantity, 0);
  }

  get canCheckout(): boolean {
    return this.selectedValidItems.length > 0 && this.subTotal > 0;
  }

  // --- Logic Khuyến mãi (Đồng bộ qua PromotionService) ---
  onVoucherSelectChange() {
    this.voucherError = '';
    if (this.selectedVoucherCode === 'CUSTOM') {
      this.showCustomInput = true;
      this.promotionService.removeAppliedPromotion();
    } else if (this.selectedVoucherCode) {
      this.showCustomInput = false;
      this.promotionService.applyPromotion(this.selectedVoucherCode, this.subTotal).subscribe(res => {
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
    this.promotionService.applyPromotion(code, this.subTotal).subscribe(res => {
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
    return true;
  }

  amountNeededForVoucher(v: Promotion): number {
    const min = v.minOrderValue || 0;
    return Math.max(0, min - this.subTotal);
  }

  applyVoucherDirectly(v: Promotion) {
    if (!this.isVoucherEligible(v)) {
      this.voucherError = `Đơn hàng cần tối thiểu ${this.formatCurrency(v.minOrderValue || 0)} để áp dụng mã "${v.code}".`;
      return;
    }
    this.voucherError = '';
    const isFreeship = !!v.isFreeShip || v.code.startsWith('FREESHIP');
    if (isFreeship) {
      this.manuallyRemovedFreeship = false;
    } else {
      this.manuallyRemovedProduct = false;
    }
    this.promotionService.applyPromotion(v.code, this.subTotal).subscribe(res => {
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

  currentVariantImageIdx = 0;

  get variantImages(): string[] {
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
    return ['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&auto=format&fit=crop'];
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

  // --- Logic Đổi Biến Thể Sản Phẩm (Drawer) ---
  openVariantDrawer(item: CartItem) {
    this.editingCartItem = item;
    this.selectedVariantId = item.variantId;
    this.isVariantDrawerOpen = true;
    this.isVoucherDrawerOpen = false;
    this.currentVariantImageIdx = 0;
    this.variantErrorMessage = null;

    // Kiểm tra cache: Nếu sản phẩm đã tải trước đó, hiển thị ngay lập tức không cần chờ mạng!
    if (CartDrawerComponent.productVariantsCache.has(item.productId)) {
      this.productForVariantEdit = CartDrawerComponent.productVariantsCache.get(item.productId);
      this.isLoadingProductVariants = false;
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
  }

  get availableVariantsForEdit(): any[] {
    return this.productForVariantEdit?.variants || [];
  }

  get selectedVariantDetails(): any {
    return this.availableVariantsForEdit.find(v => v.id === this.selectedVariantId);
  }

  selectVariant(variant: any) {
    if (variant.isActive === false || (variant.stock - (variant.reservedStock || 0)) <= 0) {
      return;
    }
    this.selectedVariantId = variant.id;
    this.currentVariantImageIdx = 0;
    this.variantErrorMessage = null;
  }

  saveVariantChange() {
    if (!this.editingCartItem || !this.selectedVariantId) return;

    if (this.selectedVariantId === this.editingCartItem.variantId) {
      this.closeVariantDrawer();
      return;
    }

    const newVariant = this.availableVariantsForEdit.find(v => v.id === this.selectedVariantId);
    if (!newVariant) {
      this.variantErrorMessage = 'Biến thể đã chọn không hợp lệ.';
      return;
    }

    const availableStock = Math.max(0, newVariant.stock - (newVariant.reservedStock || 0));

    // Kiểm tra xem trong giỏ hàng đã có dòng nào trùng với biến thể mới này chưa
    const existingSameVariantItem = this.cartItems.find(
      i => i.variantId === this.selectedVariantId && i.id !== this.editingCartItem!.id
    );

    if (existingSameVariantItem) {
      const mergedQty = this.editingCartItem.quantity + existingSameVariantItem.quantity;
      if (mergedQty > availableStock) {
        this.variantErrorMessage = `Không thể đổi vì tổng số lượng sau khi gộp (${mergedQty}) sẽ vượt quá tồn kho (Chỉ còn ${availableStock} sản phẩm).`;
        return;
      }
    } else {
      if (this.editingCartItem.quantity > availableStock) {
        this.variantErrorMessage = `Số lượng hiện tại (${this.editingCartItem.quantity}) vượt quá tồn kho của biến thể mới (Chỉ còn ${availableStock} sản phẩm).`;
        return;
      }
    }

    this.cartService.updateVariant(this.editingCartItem.id, this.selectedVariantId).subscribe({
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

  closeDrawer() {
    this.isOpen = false;
    this.isConfirmDeleteOpen = false;
    this.isBatchDeleteModalOpen = false;
    this.isVariantDrawerOpen = false;
    this.isVoucherDrawerOpen = false;
    this.itemToDelete = null;
    this.close.emit();
  }

  goToCheckout() {
    if (!this.canCheckout) {
      this.showToast('Vui lòng có ít nhất một sản phẩm hợp lệ để thanh toán.', 'warning');
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
