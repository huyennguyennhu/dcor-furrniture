import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, OnChanges, SimpleChanges, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { finalize, TimeoutError, timeout, Subscription } from 'rxjs';
import { CatalogProduct } from '../../models/catalog.model';
import { IconComponent } from '../icon/icon';
import { CartService, MAX_ITEM_QUANTITY } from '../../../core/services/cart.service';
import { WishlistService } from '../../../core/services/wishlist.service';
import { PromotionService, formatDiscountBadgeText } from '../../../core/services/promotion.service';
import { applyImageErrorFallback, resolveNextImageFallback, PLACEHOLDER_PRODUCT_IMAGE } from '../../utils/image-fallback.util';
import { environment } from '../../../../environments/environment';

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

export interface SingleFixedAttribute {
  groupId: string;
  label: string;
  value: string;
}

const GROUP_LABEL_MAP: Record<string, string> = {
  vaConfigurationSize: 'Kích thước',
  vaMaterialUpholstery: 'Chất liệu vải bọc',
  vaMaterial: 'Chất liệu / Màu hoàn thiện',
  vaColour: 'Màu sắc',
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
  vaMattressSize: 'Kích thước nệm'
};

@Component({
  selector: 'app-quick-view-drawer',
  standalone: true,
  imports: [IconComponent, CommonModule, RouterModule, FormsModule],
  templateUrl: './quick-view-drawer.html',
  styleUrls: ['./quick-view-drawer.css']
})
export class QuickViewDrawerComponent implements OnInit, OnDestroy, OnChanges {
  @Input() product: CatalogProduct | null = null;
  @Input() isOpen = false;
  @Output() onClose = new EventEmitter<void>();

  isVisible = false;
  showAnim = false;
  isLoadingDetails = false;
  fullProduct: any = null;

  // Gallery hình ảnh thật từ Database
  currentImageIdx = 0;
  galleryImages: string[] = [];

  // Yêu thích
  isWishlisted = false;
  private wishlistSub?: Subscription;

  // Ma trận biến thể thật từ Database (Mỗi thuộc tính là 1 dropdown riêng: Kích thước, Vải, v.v.)
  attributeGroups: ProductAttributeGroup[] = [];
  singleFixedAttributes: SingleFixedAttribute[] = [];
  selectedAttributes: Record<string, string> = {}; // { groupId: optionId }
  openDropdownGroupId: string | null = null;

  matchedVariant: any = null;
  selectedVariantId = '';

  // Thông số thật từ Database
  realMaterial = '';
  realDimensions = '';
  specsWeightLoad = '';
  specsMaterials = '';
  specsDesignedBy = '';
  specsPolicy = 'Bảo hành 10 năm kết cấu, Đổi trả 30 ngày';

  // Số lượng & Tồn kho thật
  quantity = 1;
  maxStock = 0;
  safetyThreshold = 5;

  // Trạng thái thao tác
  isAddingToCart = false;
  isBuyingNow = false;
  cartMessage = '';
  cartSuccess = false;

  constructor(
    private cdr: ChangeDetectorRef,
    private cartService: CartService,
    private wishlistService: WishlistService,
    private router: Router,
    private promotionService: PromotionService
  ) {}

  ngOnInit() {
    this.wishlistSub = this.wishlistService.wishlist$.subscribe(() => {
      this.checkWishlist();
      this.cdr.detectChanges();
    });
  }

  ngOnDestroy() {
    this.wishlistSub?.unsubscribe();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['isOpen']) {
      if (this.isOpen) {
        this.openDrawer();
      } else {
        this.closeDrawer();
      }
    } else if (changes['product'] && this.isOpen) {
      this.openDrawer();
    }
  }

  openDrawer() {
    this.isVisible = true;
    setTimeout(() => (this.showAnim = true), 40);
    this.quantity = 1;
    this.cartMessage = '';
    this.cartSuccess = false;
    document.body.style.overflow = 'hidden';

    this.checkWishlist();

    const targetId = this.product?.productId || (this.product as any)?.id;
    if (targetId) {
      this.isLoadingDetails = true;
      fetch(`${environment.apiUrl}/products/${targetId}`)
        .then(res => res.json())
        .then(data => {
          this.fullProduct = {
            ...this.product,
            ...data,
            isNew: this.product?.isNew !== undefined ? Boolean(this.product.isNew) : Boolean(data.isNew),
            productId: data.id || targetId,
            name: data.name || this.product?.name,
            shortDescription: data.name || this.product?.shortDescription,
            shortDescription_vi: data.name || this.product?.shortDescription_vi,
            basePrice: data.basePrice || this.product?.prices?.[0]?.price || 0,
            discountValue: data.discountValue ?? this.product?.discountValue ?? null,
            discountType: data.discountType ?? this.product?.discountType ?? null,
            configOptions: data.configOptions || (this.product as any)?.configOptions || null,
            variants: data.variants || this.product?.variants || []
          };
          this.initProductState();
          this.isLoadingDetails = false;
          this.cdr.detectChanges();
        })
        .catch(err => {
          console.error('Lỗi tải chi tiết sản phẩm từ database:', err);
          this.fullProduct = this.product;
          this.initProductState();
          this.isLoadingDetails = false;
          this.cdr.detectChanges();
        });
    } else {
      this.initProductState();
    }
  }

  closeDrawer() {
    this.showAnim = false;
    setTimeout(() => {
      this.isVisible = false;
      document.body.style.overflow = '';
      this.fullProduct = null;
    }, 350);
  }

  closeAction() {
    this.onClose.emit();
  }

  get activeProduct(): any {
    return this.fullProduct || this.product;
  }

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

  initProductState() {
    const prod = this.activeProduct;
    if (!prod) return;

    const rawVariants: any[] = Array.isArray(prod.variants) ? prod.variants : [];
    const configAttrs: any[] = prod.configOptions?.attributes || [];

    this.attributeGroups = [];
    this.singleFixedAttributes = [];
    this.selectedAttributes = {};
    this.openDropdownGroupId = null;

    // 1. Khởi tạo nhóm thuộc tính (Tự động bóc tách các thuộc tính gộp chứa dấu "/")
    if (configAttrs.length > 0) {
      for (const attr of configAttrs) {
        const gid = attr.groupId || 'attr';
        const label = GROUP_LABEL_MAP[gid] || attr.groupName || gid;
        const rawOpts: AttributeOption[] = (attr.options || []).map((o: any) => ({
          id: String(o.id),
          name: o.name,
          image: o.image || null,
          hexColor: o.hexColor || null,
          groupName: o.groupName || null
        }));

        // Kiểm tra xem nhóm này có phải các biến thể ghép dạng "A / B" (như matt ash grey/matt black) không
        const isComposite = rawOpts.length > 0 && rawOpts.every(o => {
          const parts = this.splitCompositeName(o.name);
          return parts.length >= 2;
        });

        if (isComposite) {
          // Tách thành 2 nhóm con độc lập (VD: Thân/Mặt và Khung/Chân)
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
              this.attributeGroups.push({
                groupId: subGroupId,
                label: subLabel,
                options: subOpts
              });
            } else if (subOpts.length === 1) {
              this.singleFixedAttributes.push({
                groupId: subGroupId,
                label: subLabel,
                value: subOpts[0].name
              });
            }
          }
        } else {
          // Chuẩn hóa tên đơn lẻ nếu có lặp (VD: "dark oak veneer/dark oak veneer" -> "dark oak veneer")
          const cleanedOpts = rawOpts.map(o => {
            const parts = this.splitCompositeName(o.name);
            return {
              ...o,
              name: parts.length === 1 ? parts[0] : o.name
            };
          });
          const uniqueCleaned = Array.from(new Map(cleanedOpts.map(o => [o.name, o])).values());

          if (uniqueCleaned.length > 1) {
            this.attributeGroups.push({
              groupId: gid,
              label,
              options: uniqueCleaned
            });
          } else if (uniqueCleaned.length === 1) {
            this.singleFixedAttributes.push({
              groupId: gid,
              label,
              value: uniqueCleaned[0].name
            });
          }
        }
      }
    } else if (rawVariants.length > 1) {
      // Fallback: phân tích tên biến thể (hỗ trợ cả dấu " / " và dấu "/" sát chữ)
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
            this.attributeGroups.push({
              groupId: `opt_${idx}`,
              label,
              options: uniqueVals.map(val => ({ id: val, name: val }))
            });
          } else if (uniqueVals.length === 1) {
            this.singleFixedAttributes.push({
              groupId: `opt_${idx}`,
              label: idx === 0 && /^[HhWwLlDdØø]\d+/i.test(uniqueVals[0]) ? 'Kích thước tiêu chuẩn' : 'Chất liệu tiêu chuẩn',
              value: uniqueVals[0]
            });
          }
        });
      }
    }

    // 2. Mặc định chọn biến thể đầu tiên
    if (rawVariants.length > 0) {
      this.matchedVariant = rawVariants[0];
      this.selectedVariantId = this.matchedVariant.id;

      // Gán selectedAttributes theo biến thể đầu tiên
      const vNameLower = (this.matchedVariant.name || '').toLowerCase();
      for (const group of this.attributeGroups) {
        const valId = this.matchedVariant.optionValues?.[group.groupId];
        if (valId !== undefined && valId !== null && group.options.some(o => o.id === String(valId))) {
          this.selectedAttributes[group.groupId] = String(valId);
        } else {
          const matchedOpt = group.options.find(o => vNameLower.includes(o.name.toLowerCase()));
          this.selectedAttributes[group.groupId] = matchedOpt ? matchedOpt.id : (group.options[0]?.id || '');
        }
      }
    } else {
      this.matchedVariant = null;
      this.selectedVariantId = '';
    }

    // 3. Cập nhật dữ liệu từ biến thể đang chọn
    this.updateDataForVariant();
  }


  private updateDataForVariant() {
    const prod = this.activeProduct;
    const v = this.matchedVariant || prod?.variants?.[0];
    const attrs = v?.attributes || v?.optionValues?.attributes || {};
    const dims = v?.dimensions || v?.optionValues?.dimensions || {};

    // A. Tồn kho khả dụng & Ngưỡng cảnh báo từ Database
    const stockVal = v ? ((v.stock ?? 0) - (v.reservedStock ?? 0)) : (prod?.stock || 0);
    this.maxStock = Math.max(0, stockVal);
    
    // Mức cảnh báo tồn kho của biến thể từ database (WarehouseStock.safetyThreshold)
    const rawThreshold = v?.safetyThreshold ?? v?.threshold ?? v?.optionValues?.safetyThreshold ?? v?.warehouseStocks?.[0]?.safetyThreshold;
    this.safetyThreshold = (typeof rawThreshold === 'number' && Number.isFinite(rawThreshold) && rawThreshold >= 0) ? rawThreshold : 5;

    if (this.maxStock > 0 && this.quantity > this.maxStock) {
      this.quantity = this.maxStock;
    }

    // B. Ảnh thật từ Database
    this.galleryImages = this.extractRealImages(prod, v);
    this.currentImageIdx = 0;

    // C. Kích thước thật từ Database
    this.realDimensions = this.buildDimensionString(attrs, dims);

    // D. Chất liệu & Hoàn thiện thật từ Database
    const finish = attrs.finish_vi || attrs.finish || '';
    const upholstery = attrs.upholsteryComposition_vi || attrs.upholsteryComposition || '';
    const baseDesc = prod?.description || '';
    
    const matParts = [finish, upholstery, baseDesc].filter(Boolean);
    this.realMaterial = matParts.length > 0 ? matParts.join(' • ') : '';

    // E. Thông số kỹ thuật
    this.specsWeightLoad = attrs.weightLoad ? `${attrs.weightLoad}` : '';
    
    if (attrs.productSpecification_vi) {
      const parts = attrs.productSpecification_vi.split('|');
      this.specsMaterials = parts.slice(0, 3).join(', ');
    } else if (attrs.productSpecification) {
      const parts = attrs.productSpecification.split('|');
      this.specsMaterials = parts.slice(0, 2).join(', ');
    } else {
      this.specsMaterials = this.realMaterial || '';
    }

    this.specsDesignedBy = attrs.designedBy || '';
  }

  private buildDimensionString(attrs: any, dims: any): string {
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

  optimizeImageUrl(url: string, width = 800): string {
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

  private extractRealImages(prod: any, currentVariant: any): string[] {
    const list: string[] = [];
    const isClean = (u: any) => typeof u === 'string' && u.startsWith('http') && !u.includes('dsasf753c');

    // 1. Ảnh của biến thể đang chọn (ưu tiên hàng đầu)
    const vImgs = currentVariant?.images || currentVariant?.optionValues?.images || [];
    if (Array.isArray(vImgs)) {
      vImgs.filter(isClean).forEach(img => {
        const opt = this.optimizeImageUrl(img, 800);
        if (!list.includes(opt)) list.push(opt);
      });
    }

    // 2. Ảnh của sản phẩm chính (bổ sung các góc còn lại)
    const pImgs = prod?.images || [];
    if (Array.isArray(pImgs)) {
      pImgs.filter(isClean).forEach(img => {
        const opt = this.optimizeImageUrl(img, 800);
        if (!list.includes(opt)) list.push(opt);
      });
    }

    return list.length > 0 ? list : ['/assets/img/furniture-placeholder.svg'];
  }

  toggleDropdown(groupId: string, e: Event) {
    e.stopPropagation();
    if (this.openDropdownGroupId === groupId) {
      this.openDropdownGroupId = null;
    } else {
      this.openDropdownGroupId = groupId;
    }
  }

  selectAttributeOption(groupId: string, optionId: string, e: Event) {
    e.stopPropagation();
    this.openDropdownGroupId = null;
    this.selectedAttributes[groupId] = optionId;
    this.matchVariantFromSelection();
  }

  getSelectedOption(group: ProductAttributeGroup): AttributeOption | undefined {
    const selId = this.selectedAttributes[group.groupId];
    return group.options.find(o => o.id === selId) || group.options[0];
  }

  formatOptionDisplayName(name: string | undefined | null, group?: ProductAttributeGroup): string {
    if (!name) return '';
    let str = name.trim();

    const isSize = group ? ((group.groupId || '').toLowerCase().includes('size') || (group.label || '').toLowerCase().includes('kích thước')) : false;

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

  private matchVariantFromSelection() {
    const rawVariants: any[] = this.activeProduct?.variants || [];
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
    this.selectedVariantId = bestMatch?.id || '';

    // Cập nhật lại các dropdown theo bestMatch
    if (bestMatch) {
      const vNameLower = (bestMatch.name || '').toLowerCase();
      for (const g of this.attributeGroups) {
        const vVal = bestMatch.optionValues?.[g.groupId];
        if (vVal !== undefined && vVal !== null && g.options.some(o => o.id === String(vVal))) {
          this.selectedAttributes[g.groupId] = String(vVal);
        } else {
          const matchingOpt = g.options.find(o => this.isVariantMatchOption(bestMatch, g, o))
            || g.options.find(o => vNameLower.includes(o.name.toLowerCase()));
          if (matchingOpt) {
            this.selectedAttributes[g.groupId] = matchingOpt.id;
          }
        }
      }
    }

    this.updateDataForVariant();
    this.cdr.detectChanges();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(e: MouseEvent) {
    if (this.openDropdownGroupId) {
      const target = e.target as HTMLElement;
      if (!target.closest('.custom-select-box')) {
        this.openDropdownGroupId = null;
        this.cdr.detectChanges();
      }
    }
  }

  selectThumbnail(idx: number) {
    this.currentImageIdx = idx;
  }

  decreaseQuantity() {
    if (this.maxStock === 0) return;
    if (this.quantity > 1) {
      this.quantity--;
    } else {
      this.quantity = 1;
    }
  }

  increaseQuantity() {
    if (this.maxStock === 0) return;
    if (this.quantity < this.maxAllowedQuantity) {
      this.quantity++;
    }
  }

  onQuantityFocus(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input) {
      input.select();
    }
  }

  onQuantityKeydown(event: KeyboardEvent) {
    const allowedKeys = [
      'Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
      'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
      'Home', 'End'
    ];
    if (allowedKeys.includes(event.key)) {
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        this.increaseQuantity();
      } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        this.decreaseQuantity();
      } else if (event.key === 'Enter') {
        (event.target as HTMLElement).blur();
      }
      return;
    }

    if (event.ctrlKey || event.metaKey) {
      return;
    }

    // Chỉ cho phép nhập các ký tự số từ 0 đến 9
    if (!/^[0-9]$/.test(event.key)) {
      event.preventDefault();
    }
  }

  onQuantityInput(event: Event) {
    const input = event.target as HTMLInputElement;
    const cleanVal = input.value.replace(/\D/g, '');

    if (!cleanVal) {
      input.value = '';
      return;
    }

    let num = parseInt(cleanVal, 10);
    const maxAllowed = this.maxAllowedQuantity;
    if (maxAllowed > 0 && num > maxAllowed) {
      num = maxAllowed;
    }
    if (num < 1) {
      num = 1;
    }

    input.value = String(num);
    this.quantity = num;
  }

  onQuantityBlur(event: Event) {
    const input = event.target as HTMLInputElement;
    const cleanVal = input.value.replace(/\D/g, '');
    let num = parseInt(cleanVal, 10);
    const maxAllowed = this.maxAllowedQuantity;

    if (isNaN(num) || num < 1) {
      num = maxAllowed > 0 ? 1 : 0;
    } else if (maxAllowed > 0 && num > maxAllowed) {
      num = maxAllowed;
    }

    this.quantity = num;
    input.value = String(this.quantity);
  }

  get maxAllowedQuantity(): number {
    return Math.min(this.maxStock, MAX_ITEM_QUANTITY);
  }

  get isLowStock(): boolean {
    return this.maxStock > 0 && this.maxStock <= this.safetyThreshold;
  }

  get currentSku(): string {
    return this.matchedVariant?.sku || this.activeProduct?.variants?.[0]?.sku || this.activeProduct?.id || '—';
  }

  get currentPrice(): number {
    const raw = this.matchedVariant ? this.matchedVariant.price : (this.activeProduct?.basePrice || 0);
    const campDisc = this.promotionService.getDiscountForProduct(this.activeProduct);
    if (campDisc) {
      return campDisc.salePrice;
    }
    const disc = this.activeProduct?.discountValue;
    const type = this.activeProduct?.discountType;
    if (disc && disc > 0) {
      if (type === 'PERCENT') {
        return Math.round(raw * (100 - disc) / 100);
      }
      return Math.max(0, raw - disc);
    }
    return raw;
  }

  get originalPrice(): number | null {
    const campDisc = this.promotionService.getDiscountForProduct(this.activeProduct);
    if (campDisc) {
      return campDisc.originalPrice;
    }
    const disc = this.activeProduct?.discountValue;
    if (disc && disc > 0) {
      return this.matchedVariant ? this.matchedVariant.price : this.activeProduct?.basePrice;
    }
    return null;
  }

  get discountPercent(): number | null {
    const campDisc = this.promotionService.getDiscountForProduct(this.activeProduct);
    if (campDisc) {
      return campDisc.discountPercent;
    }
    const disc = this.activeProduct?.discountValue;
    if (disc && disc > 0) {
      if (this.activeProduct?.discountType === 'PERCENT') return disc;
      const base = this.originalPrice || 1;
      return Math.round((disc / base) * 100);
    }
    return null;
  }

  get discountBadgeText(): string {
    const campDisc = this.promotionService.getDiscountForProduct(this.activeProduct);
    if (campDisc) {
      return campDisc.badgeText;
    }
    const disc = this.activeProduct?.discountValue;
    if (disc && disc > 0) {
      return formatDiscountBadgeText(this.activeProduct?.discountType || 'PERCENT', disc);
    }
    return '';
  }

  formatPrice(num: number | null | undefined): string {
    if (!num) return '0 đ';
    return new Intl.NumberFormat('vi-VN').format(num) + ' đ';
  }

  // Wishlist
  private checkWishlist() {
    const pid = this.activeProduct?.productId || this.activeProduct?.id;
    this.isWishlisted = pid ? this.wishlistService.isWishlisted(pid) : false;
  }

  toggleWishlist(e: Event) {
    e.stopPropagation();
    e.preventDefault();
    const pid = this.activeProduct?.productId || this.activeProduct?.id;
    if (!pid) return;
    this.isWishlisted = this.wishlistService.toggle(pid);
    this.cdr.detectChanges();
  }

  // Thêm vào giỏ
  handleAddToCart(e?: Event) {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }

    const variant = this.matchedVariant || this.activeProduct?.variants?.[0];
    if (!variant) {
      this.cartMessage = 'Sản phẩm hiện chưa có biến thể sẵn sàng.';
      this.cartSuccess = false;
      return;
    }

    if (this.maxStock === 0) {
      this.cartMessage = 'Sản phẩm hiện đã hết hàng.';
      this.cartSuccess = false;
      return;
    }

    if (!this.quantity || this.quantity < 1) {
      this.quantity = 1;
    } else if (this.quantity > this.maxStock) {
      this.quantity = this.maxStock;
    }

    this.isAddingToCart = true;
    this.cartMessage = '';

    const cleanVariantName = (variant.name || '').replace(/([a-zA-Z])\/([a-zA-Z])/g, '$1 · ');
    const selectedConfig = {
      ...this.selectedAttributes,
      variantName: cleanVariantName,
      sku: variant.sku
    };

    const selectedVariantTags = this.attributeGroups
      .map(group => {
        const selId = this.selectedAttributes[group.groupId];
        const opt = group.options.find(o => o.id === selId) || group.options[0];
        return opt?.name ? { label: group.label, value: opt.name } : null;
      })
      .filter((t): t is { label: string; value: string } => !!t);

    const rawPrice = this.currentPrice || variant.price || this.activeProduct?.prices?.[0]?.price || 0;
    const productImages = Array.isArray(this.activeProduct?.images) ? this.activeProduct.images : [];
    const variantImages = (variant.optionValues as any)?.images;
    const imageUrl = (Array.isArray(variantImages) && variantImages.length > 0)
      ? variantImages[0]
      : (this.galleryImages?.[0] || (productImages.length > 0 ? productImages[0] : ''));

    const guestProductInfo = {
      productId: this.activeProduct?.productId || this.activeProduct?.id || '',
      sku: variant.sku,
      name: this.activeProduct?.shortDescription_vi || this.activeProduct?.shortDescription || this.activeProduct?.name || 'Sản phẩm',
      variantName: cleanVariantName !== 'Phân loại mặc định' ? cleanVariantName : undefined,
      variantTags: selectedVariantTags.length > 0 ? selectedVariantTags : undefined,
      image: typeof imageUrl === 'string' ? imageUrl : '',
      price: rawPrice,
      originalPrice: this.originalPrice || undefined,
      availableStock: this.maxStock
    };

    this.cartService.addToCart(variant.id, this.quantity, selectedConfig, guestProductInfo)
      .pipe(
        timeout({ first: 10000 }),
        finalize(() => {
          this.isAddingToCart = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.cartSuccess = true;
          this.cartMessage = 'Đã thêm sản phẩm vào giỏ hàng thành công!';
          setTimeout(() => {
            if (this.cartSuccess) this.cartMessage = '';
            this.cdr.detectChanges();
          }, 3500);
        },
        error: (err: unknown) => {
          this.cartSuccess = false;
          this.cartMessage = err instanceof TimeoutError
            ? 'Máy chủ phản hồi quá lâu, vui lòng thử lại.'
            : err instanceof HttpErrorResponse
              ? err.error?.message || 'Không thể thêm sản phẩm vào giỏ hàng.'
              : 'Không thể thêm sản phẩm vào giỏ hàng.';
        }
      });
  }

  // Mua ngay
  handleBuyNow(e: Event) {
    e.stopPropagation();
    e.preventDefault();

    const variant = this.matchedVariant || this.activeProduct?.variants?.[0];
    if (!variant || this.maxStock === 0) return;

    if (!this.quantity || this.quantity < 1) {
      this.quantity = 1;
    } else if (this.quantity > this.maxStock) {
      this.quantity = this.maxStock;
    }

    const cleanVariantName = (variant.name || '').replace(/([a-zA-Z])\/([a-zA-Z])/g, '$1 · ');
    const selectedConfig = {
      ...this.selectedAttributes,
      variantName: cleanVariantName,
      sku: variant.sku
    };

    const selectedVariantTags = this.attributeGroups
      .map(group => {
        const selId = this.selectedAttributes[group.groupId];
        const opt = group.options.find(o => o.id === selId) || group.options[0];
        return opt?.name ? { label: group.label, value: opt.name } : null;
      })
      .filter((t): t is { label: string; value: string } => !!t);

    const rawPrice = this.currentPrice || variant.price || this.activeProduct?.prices?.[0]?.price || 0;
    const productImages = Array.isArray(this.activeProduct?.images) ? this.activeProduct.images : [];
    const variantImages = (variant.optionValues as any)?.images;
    const imageUrl = (Array.isArray(variantImages) && variantImages.length > 0)
      ? variantImages[0]
      : (this.galleryImages?.[0] || (productImages.length > 0 ? productImages[0] : ''));

    const guestProductInfo = {
      productId: this.activeProduct?.productId || this.activeProduct?.id || '',
      sku: variant.sku,
      name: this.activeProduct?.shortDescription_vi || this.activeProduct?.shortDescription || this.activeProduct?.name || 'Sản phẩm',
      variantName: cleanVariantName !== 'Phân loại mặc định' ? cleanVariantName : undefined,
      variantTags: selectedVariantTags.length > 0 ? selectedVariantTags : undefined,
      image: typeof imageUrl === 'string' ? imageUrl : '',
      price: rawPrice,
      originalPrice: this.originalPrice || undefined,
      availableStock: this.maxStock
    };

    this.isBuyingNow = true;
    this.cartService.addToCart(variant.id, this.quantity, selectedConfig, guestProductInfo)
      .pipe(
        timeout({ first: 10000 }),
        finalize(() => {
          this.isBuyingNow = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (res) => {
          if (res?.cartItem?.id) {
            try {
              sessionStorage.setItem('dcor_checkout_items', JSON.stringify([res.cartItem.id]));
            } catch (err) {
              console.error('Không thể lưu session checkout:', err);
            }
          }
          this.closeAction();
          this.router.navigate(['/checkout']);
        },
        error: (err: unknown) => {
          this.cartSuccess = false;
          this.cartMessage = err instanceof TimeoutError
            ? 'Máy chủ phản hồi quá lâu, vui lòng thử lại.'
            : err instanceof HttpErrorResponse
              ? err.error?.message || 'Không thể tiến hành mua ngay lúc này.'
              : 'Không thể tiến hành mua ngay lúc này.';
          this.cdr.detectChanges();
        }
      });
  }

  private failedGalleryUrls = new Set<string>();

  onGalleryImageError(index: number, event: Event) {
    const coverFallbacks = Array.isArray(this.activeProduct?.images)
      ? this.activeProduct.images.filter((u: any) => typeof u === 'string' && u.startsWith('http') && !u.includes('/image/fetch/'))
      : [];
    const failedUrl = this.galleryImages[index];
    if (failedUrl && failedUrl !== PLACEHOLDER_PRODUCT_IMAGE) {
      this.failedGalleryUrls.add(failedUrl);
      const nextUrl = resolveNextImageFallback(failedUrl, coverFallbacks, this.failedGalleryUrls);
      if (nextUrl !== failedUrl) {
        this.galleryImages[index] = nextUrl;
        this.cdr.detectChanges();
        return;
      }
    }
    applyImageErrorFallback(event, coverFallbacks);
  }

  onSwatchImageError(event: Event) {
    applyImageErrorFallback(event);
  }

  // Xem toàn bộ chi tiết
  viewFullDetail() {
    const pid = this.activeProduct?.productId || this.activeProduct?.id;
    if (pid) {
      if (typeof window !== 'undefined') {
        try {
          const raw = sessionStorage.getItem('dcor_explore_saved_state');
          if (raw) {
            const data = JSON.parse(raw);
            data.productId = pid;
            sessionStorage.setItem('dcor_explore_saved_state', JSON.stringify(data));
          } else {
            sessionStorage.setItem('dcor_explore_saved_state', JSON.stringify({
              scrollY: window.scrollY || document.documentElement.scrollTop || 0,
              productId: pid,
              timestamp: Date.now()
            }));
          }
        } catch {}
      }
      this.closeAction();
      this.router.navigate(['/products', pid]);
    }
  }

}
