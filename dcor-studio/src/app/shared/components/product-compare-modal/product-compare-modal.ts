import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CatalogProduct, ProductColorSwatch } from '../../models/catalog.model';
import { IconComponent } from '../icon/icon';
import { CartService } from '../../../core/services/cart.service';
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

export interface CompareSpecItem {
  label: string;
  key: 'price' | 'rating' | 'width' | 'depth' | 'height' | 'weight' | 'material' | 'color';
}

@Component({
  selector: 'app-product-compare-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, IconComponent],
  templateUrl: './product-compare-modal.html',
  styleUrls: ['./product-compare-modal.css']
})
export class ProductCompareModalComponent implements OnInit, OnChanges {
  @Input() isOpen = false;
  @Input() products: CatalogProduct[] = [];
  @Output() onClose = new EventEmitter<void>();
  @Output() onRemove = new EventEmitter<string>();

  fullProductMap: Record<string, any> = {};
  selectedVariantMap: Record<string, any> = {};
  highlightDifferences = true;
  copiedLinkSuccess = false;
  toastMessage: string | null = null;
  toastType: 'success' | 'warning' | 'info' = 'success';
  addingToCartMap: Record<string, boolean> = {};
  addedSuccessMap: Record<string, boolean> = {};

  attributeGroupsMap: Record<string, ProductAttributeGroup[]> = {};
  selectedAttributesMap: Record<string, Record<string, string>> = {};
  openDropdownKey: string | null = null;

  specsList: CompareSpecItem[] = [
    { label: 'Giá sản phẩm', key: 'price' },
    { label: 'Đánh giá khách hàng', key: 'rating' },
    { label: 'Chiều rộng', key: 'width' },
    { label: 'Chiều sâu / Chiều dài', key: 'depth' },
    { label: 'Chiều cao', key: 'height' },
    { label: 'Trọng lượng', key: 'weight' },
    { label: 'Chất liệu & Hoàn thiện', key: 'material' },
    { label: 'Màu sắc biến thể', key: 'color' }
  ];

  constructor(
    private cdr: ChangeDetectorRef,
    private cartService: CartService
  ) {}

  ngOnInit() {
    this.initCompareData();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['isOpen'] && this.isOpen) {
      if (typeof document !== 'undefined') {
        document.body.style.overflow = 'hidden';
      }
      this.initCompareData();
      setTimeout(() => {
        const wrapper = document.querySelector('.compare-table-wrapper');
        if (wrapper) {
          wrapper.scrollTop = 0;
          wrapper.scrollLeft = 0;
        }
      }, 0);
    } else if (changes['isOpen'] && !this.isOpen) {
      if (typeof document !== 'undefined') {
        document.body.style.overflow = '';
      }
    }

    if (changes['products']) {
      this.initCompareData();
    }
  }

  @HostListener('document:click')
  onDocumentClick() {
    this.openDropdownKey = null;
  }

  getProdId(prod: CatalogProduct): string {
    return String(prod.productId || (prod as any).id || '');
  }

  initCompareData() {
    if (!this.products || this.products.length === 0) return;

    this.products.forEach(prod => {
      const pid = this.getProdId(prod);
      if (!pid) return;

      // 1. Khởi tạo biến thể mặc định nếu chưa có
      if (!this.selectedVariantMap[pid]) {
        const variants = prod.variants || [];
        if (variants.length > 0) {
          this.selectedVariantMap[pid] = variants[0];
        }
      }

      // Khởi tạo thuộc tính sơ bộ
      this.initProductAttributeGroups(prod);

      // 2. Tải thêm chi tiết đầy đủ từ API nếu chưa có
      if (!this.fullProductMap[pid]) {
        fetch(`${environment.apiUrl}/products/${pid}`)
          .then(res => res.json())
          .then(data => {
            this.fullProductMap[pid] = data;
            const fullVariants = data.variants || [];
            if (fullVariants.length > 0 && !this.selectedVariantMap[pid]) {
              this.selectedVariantMap[pid] = fullVariants[0];
            } else if (fullVariants.length > 0 && this.selectedVariantMap[pid]) {
              // Cập nhật với dữ liệu chi tiết hơn từ full data
              const currentId = this.selectedVariantMap[pid].id;
              const matched = fullVariants.find((v: any) => v.id === currentId);
              if (matched) {
                this.selectedVariantMap[pid] = matched;
              }
            }
            this.initProductAttributeGroups(prod, data);
            this.cdr.detectChanges();
          })
          .catch(err => {
            console.warn('Lỗi tải chi tiết sản phẩm so sánh:', err);
          });
      } else {
        this.initProductAttributeGroups(prod, this.fullProductMap[pid]);
      }
    });
  }

  closeModal() {
    if (typeof document !== 'undefined') {
      document.body.style.overflow = '';
    }
    this.openDropdownKey = null;
    this.onClose.emit();
  }

  removeProduct(e: Event, productId: string) {
    e.stopPropagation();
    this.onRemove.emit(productId);
  }

  // Lấy biến thể đang được chọn cho một cột sản phẩm
  getSelectedVariant(prod: CatalogProduct): any {
    const pid = this.getProdId(prod);
    if (this.selectedVariantMap[pid]) {
      return this.selectedVariantMap[pid];
    }
    const full = this.fullProductMap[pid];
    if (full?.variants?.length > 0) {
      return full.variants[0];
    }
    return prod.variants?.[0] || null;
  }

  // Danh sách biến thể khả dụng cho một sản phẩm
  getProductVariants(prod: CatalogProduct): any[] {
    const pid = this.getProdId(prod);
    const full = this.fullProductMap[pid];
    if (full?.variants && full.variants.length > 0) {
      return full.variants;
    }
    return prod.variants || [];
  }

  onVariantSelect(prod: CatalogProduct, variantId: string) {
    const pid = this.getProdId(prod);
    const variants = this.getProductVariants(prod);
    const matched = variants.find((v: any) => v.id === variantId);
    if (matched) {
      this.selectedVariantMap[pid] = matched;
      this.syncSelectedAttributesForVariant(prod, matched);
      this.cdr.detectChanges();
    }
  }

  // --- Quản lý Nhóm Thuộc Tính Biến Thể (Giống Quick View) ---
  getAttributeGroups(prod: CatalogProduct): ProductAttributeGroup[] {
    const pid = this.getProdId(prod);
    return this.attributeGroupsMap[pid] || [];
  }

  getSelectedAttributeId(prod: CatalogProduct, groupId: string): string {
    const pid = this.getProdId(prod);
    return this.selectedAttributesMap[pid]?.[groupId] || '';
  }

  getSelectedOption(prod: CatalogProduct, group: ProductAttributeGroup): AttributeOption | undefined {
    const selId = this.getSelectedAttributeId(prod, group.groupId);
    return group.options.find(o => o.id === selId) || group.options[0];
  }

  toggleDropdown(pid: string, groupId: string, e: Event) {
    e.stopPropagation();
    const key = `${pid}_${groupId}`;
    this.openDropdownKey = this.openDropdownKey === key ? null : key;
  }

  selectAttributeOption(prod: CatalogProduct, groupId: string, optionId: string, e: Event) {
    e.stopPropagation();
    this.openDropdownKey = null;
    const pid = this.getProdId(prod);
    if (!this.selectedAttributesMap[pid]) {
      this.selectedAttributesMap[pid] = {};
    }
    this.selectedAttributesMap[pid][groupId] = optionId;
    this.resolveVariantFromSelections(prod, groupId, optionId);
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

  initProductAttributeGroups(prod: CatalogProduct, fullData?: any) {
    const pid = this.getProdId(prod);
    const target = fullData || this.fullProductMap[pid] || prod;
    const rawVariants: any[] = Array.isArray(target.variants) && target.variants.length > 0 
      ? target.variants 
      : (prod.variants || []);
    const configAttrs: any[] = target.configOptions?.attributes || (prod as any).configOptions?.attributes || [];

    const groups: ProductAttributeGroup[] = [];
    if (!this.selectedAttributesMap[pid]) {
      this.selectedAttributesMap[pid] = {};
    }

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
              groups.push({
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
              name: parts.length === 1 ? parts[0] : o.name
            };
          });
          const uniqueCleaned = Array.from(new Map(cleanedOpts.map(o => [o.name, o])).values());
          if (uniqueCleaned.length > 1) {
            groups.push({
              groupId: gid,
              label,
              options: uniqueCleaned
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
            groups.push({
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

    this.attributeGroupsMap[pid] = groups;

    // Thiết lập selectedAttributes ban đầu theo biến thể đang chọn
    const currentVariant = this.selectedVariantMap[pid] || rawVariants[0];
    if (currentVariant) {
      this.selectedVariantMap[pid] = currentVariant;
      this.syncSelectedAttributesForVariant(prod, currentVariant);
    }
  }

  private syncSelectedAttributesForVariant(prod: CatalogProduct, variant: any) {
    const pid = this.getProdId(prod);
    const groups = this.attributeGroupsMap[pid] || [];
    if (!this.selectedAttributesMap[pid]) {
      this.selectedAttributesMap[pid] = {};
    }
    const vNameLower = (variant.name || '').toLowerCase();
    for (const group of groups) {
      const valId = variant.optionValues?.[group.groupId];
      if (valId !== undefined && valId !== null && group.options.some(o => o.id === String(valId))) {
        this.selectedAttributesMap[pid][group.groupId] = String(valId);
      } else {
        const matchedOpt = group.options.find(o => vNameLower.includes(o.name.toLowerCase()));
        this.selectedAttributesMap[pid][group.groupId] = matchedOpt ? matchedOpt.id : (group.options[0]?.id || '');
      }
    }
  }

  findMatchingVariant(prod: CatalogProduct, attrs: Record<string, string>): any | null {
    const variants: any[] = this.getProductVariants(prod);
    if (variants.length === 0) return null;
    const pid = this.getProdId(prod);
    const groups = this.attributeGroupsMap[pid] || [];

    const exact = variants.find(v => {
      const vNameLower = (v.name || '').toLowerCase();
      return Object.keys(attrs).every(gid => {
        const selVal = attrs[gid];
        const vVal = v.optionValues?.[gid];
        if (vVal !== undefined && vVal !== null) {
          return String(vVal) === String(selVal);
        }
        const group = groups.find(g => g.groupId === gid);
        const opt = group?.options.find(o => o.id === selVal);
        if (!opt) return true;
        return vNameLower.includes(opt.name.toLowerCase());
      });
    });
    if (exact) return exact;

    let bestMatch: any = null;
    let maxScore = -1;

    for (const v of variants) {
      let score = 0;
      const vNameLower = (v.name || '').toLowerCase();
      for (const gid of Object.keys(attrs)) {
        const selVal = attrs[gid];
        const vVal = v.optionValues?.[gid];
        if (vVal !== undefined && vVal !== null && String(vVal) === String(selVal)) {
          score += 2;
        } else {
          const group = groups.find(g => g.groupId === gid);
          const opt = group?.options.find(o => o.id === selVal);
          if (opt && vNameLower.includes(opt.name.toLowerCase())) {
            score += 1;
          }
        }
      }
      if (score > maxScore) {
        maxScore = score;
        bestMatch = v;
      }
    }

    return bestMatch || variants[0];
  }

  resolveVariantFromSelections(prod: CatalogProduct, changedGroupId: string, changedOptionId: string) {
    const pid = this.getProdId(prod);
    const attrs = this.selectedAttributesMap[pid] || {};
    const matched = this.findMatchingVariant(prod, attrs);

    if (matched) {
      this.selectedVariantMap[pid] = matched;
      this.syncSelectedAttributesForVariant(prod, matched);
      this.cdr.detectChanges();
    }
  }

  // --- Lấy dữ liệu từng hàng ---

  // 1. Ảnh biến thể đang chọn
  getColumnImage(prod: CatalogProduct): string {
    const variant = this.getSelectedVariant(prod);
    if (variant) {
      const vImgs = variant.images || variant.optionValues?.images || [];
      if (Array.isArray(vImgs) && vImgs.length > 0 && typeof vImgs[0] === 'string' && vImgs[0].startsWith('http')) {
        return vImgs[0];
      }
    }
    if (prod.images && prod.images.length > 0) {
      return prod.images[0];
    }
    return 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80';
  }

  // 2. Giá sản phẩm (sau khi đổi biến thể)
  getColumnFinalPrice(prod: CatalogProduct): number {
    const variant = this.getSelectedVariant(prod);
    let base = variant?.price || prod.prices?.[0]?.price || (prod as any).basePrice || 0;
    if (prod.discountValue) {
      if (prod.discountType === 'PERCENT') {
        return Math.round(base * (100 - prod.discountValue) / 100);
      } else {
        return Math.max(0, base - prod.discountValue);
      }
    }
    return base;
  }

  getColumnOriginalPrice(prod: CatalogProduct): number | null {
    if (!prod.discountValue) return null;
    const variant = this.getSelectedVariant(prod);
    return variant?.price || prod.prices?.[0]?.price || (prod as any).basePrice || 0;
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('vi-VN').format(price) + ' đ';
  }

  // 3. Đánh giá
  getColumnRating(prod: CatalogProduct): { rating: number; count: number } {
    return {
      rating: prod.rating || 4.9,
      count: prod.reviewCount || 128
    };
  }

  // 4. Các thông số kích thước chia theo từng hàng riêng biệt
  getColumnWidth(prod: CatalogProduct): string {
    const variant = this.getSelectedVariant(prod);
    const pid = prod.productId || (prod as any).id;
    const full = this.fullProductMap[pid];
    const fullVar = full?.variants?.find((v: any) => v.id === variant?.id) || full?.variants?.[0];

    const attr = variant?.optionValues?.attributes || fullVar?.optionValues?.attributes || variant?.attributes || {};
    const dim = variant?.dimensions || fullVar?.dimensions || {};

    if (attr.width) return attr.width.includes('cm') ? attr.width : `${attr.width} cm`;
    if (attr.diameter) return `Ø ${attr.diameter.includes('cm') ? attr.diameter : attr.diameter + ' cm'}`;
    if (dim.width) return `${dim.width} cm`;

    const desc = full?.description || prod.description || '';
    const match = desc.match(/(?:Rộng|W|Width)[:\s]*([\d.,]+(?:\/[\d.,]+)?\s*cm)/i);
    if (match) return match[1];

    return '—';
  }

  getColumnDepth(prod: CatalogProduct): string {
    const variant = this.getSelectedVariant(prod);
    const pid = prod.productId || (prod as any).id;
    const full = this.fullProductMap[pid];
    const fullVar = full?.variants?.find((v: any) => v.id === variant?.id) || full?.variants?.[0];

    const attr = variant?.optionValues?.attributes || fullVar?.optionValues?.attributes || variant?.attributes || {};
    const dim = variant?.dimensions || fullVar?.dimensions || {};

    if (attr.depth) return attr.depth.includes('cm') ? attr.depth : `${attr.depth} cm`;
    if (attr.length) return attr.length.includes('cm') ? attr.length : `${attr.length} cm`;
    if (dim.depth) return `${dim.depth} cm`;
    if (dim.length) return `${dim.length} cm`;

    const desc = full?.description || prod.description || '';
    const match = desc.match(/(?:Sâu|D|Depth|Dài|Length)[:\s]*([\d.,]+(?:\/[\d.,]+)?\s*cm)/i);
    if (match) return match[1];

    return '—';
  }

  getColumnHeight(prod: CatalogProduct): string {
    const variant = this.getSelectedVariant(prod);
    const pid = prod.productId || (prod as any).id;
    const full = this.fullProductMap[pid];
    const fullVar = full?.variants?.find((v: any) => v.id === variant?.id) || full?.variants?.[0];

    const attr = variant?.optionValues?.attributes || fullVar?.optionValues?.attributes || variant?.attributes || {};
    const dim = variant?.dimensions || fullVar?.dimensions || {};

    if (attr.height) return attr.height.includes('cm') ? attr.height : `${attr.height} cm`;
    if (dim.height) return `${dim.height} cm`;

    const desc = full?.description || prod.description || '';
    const match = desc.match(/(?:Cao|H|Height)[:\s]*([\d.,]+(?:\/[\d.,]+)?\s*cm)/i);
    if (match) return match[1];

    return '—';
  }

  getColumnWeight(prod: CatalogProduct): string {
    const variant = this.getSelectedVariant(prod);
    const pid = prod.productId || (prod as any).id;
    const full = this.fullProductMap[pid];
    const fullVar = full?.variants?.find((v: any) => v.id === variant?.id) || full?.variants?.[0];

    const attr = variant?.optionValues?.attributes || fullVar?.optionValues?.attributes || variant?.attributes || {};
    const dim = variant?.dimensions || fullVar?.dimensions || {};

    if (attr.weight) return attr.weight.includes('kg') ? attr.weight : `${attr.weight} kg`;
    if (dim.weight) return `${dim.weight} kg`;

    const desc = full?.description || prod.description || '';
    const match = desc.match(/(?:Nặng|Weight)[:\s]*([\d.,]+\s*kg)/i);
    if (match) return match[1];

    return '—';
  }

  getColumnDimensions(prod: CatalogProduct): string {
    const w = this.getColumnWidth(prod);
    const d = this.getColumnDepth(prod);
    const h = this.getColumnHeight(prod);
    const wt = this.getColumnWeight(prod);
    const parts: string[] = [];
    if (w && w !== '—') parts.push(`Rộng ${w}`);
    if (d && d !== '—') parts.push(`Sâu ${d}`);
    if (h && h !== '—') parts.push(`Cao ${h}`);
    if (wt && wt !== '—') parts.push(`Nặng ${wt}`);
    return parts.length > 0 ? parts.join(' · ') : 'D 205cm · R 95cm · C 82cm';
  }

  getCategoryPillText(prod: CatalogProduct): string {
    if (!prod) return 'SẢN PHẨM';
    const name = (prod.name || '').toLowerCase();
    const cat = (prod.category || prod.categoryObj?.name || '').toLowerCase();
    if (name.includes('sofa') || cat.includes('sofa')) return 'SOFAS';
    if (name.includes('rug') || name.includes('plaid') || name.includes('carpet') || name.includes('throw') || cat.includes('rug')) return 'THẢM';
    if (name.includes('table') || name.includes('desk') || cat.includes('table')) return 'BÀN';
    if (name.includes('chair') || name.includes('stool') || name.includes('bench') || cat.includes('chair')) return 'GHẾ';
    if (name.includes('bed') || cat.includes('bed')) return 'GIƯỜNG';
    if (name.includes('storage') || name.includes('drawer') || name.includes('shelf') || cat.includes('storage')) return 'TỦ KỆ';
    if (name.includes('lamp') || name.includes('pendant') || name.includes('light') || cat.includes('lamp')) return 'ĐÈN';
    return prod.category?.toUpperCase() || 'SẢN PHẨM';
  }

  // 5. Chất liệu
  getColumnMaterial(prod: CatalogProduct): string {
    const variant = this.getSelectedVariant(prod);
    const pid = prod.productId || (prod as any).id;
    const full = this.fullProductMap[pid];

    if (variant?.attributes?.material) return variant.attributes.material;
    if (variant?.attributes?.upholstery) return variant.attributes.upholstery;
    if (variant?.attributes?.fabric) return variant.attributes.fabric;
    
    // Nếu tên biến thể có chứa chất liệu
    const vName = variant?.name || '';
    if (vName.includes('/')) {
      const parts = vName.split('/').map((s: string) => s.trim());
      if (parts.length > 1) return parts.join(' kết hợp ');
    }

    if (prod.refinementMaterials && prod.refinementMaterials.length > 0) {
      return prod.refinementMaterials.join(', ');
    }

    const desc = full?.description || prod.description || '';
    if (desc) {
      const commaParts = desc.split(',').map((s: string) => s.trim()).filter(Boolean);
      if (commaParts.length > 0) return commaParts.slice(0, 2).join(', ');
    }

    return 'Gỗ sồi cao cấp, Vải nỉ cao cấp Đan Mạch';
  }

  // 6. Màu sắc
  detectColor(text: string): { name: string; hex: string } {
    const lower = (text || '').toLowerCase();
    if (lower.includes('green') || lower.includes('xanh lá') || lower.includes('olive')) return { name: 'Xanh lá', hex: '#3B5E45' };
    if (lower.includes('sky blue') || lower.includes('blue') || lower.includes('xanh dương') || lower.includes('navy')) return { name: 'Xanh dương', hex: '#2B4C7E' };
    if (lower.includes('yellow') || lower.includes('vàng') || lower.includes('ochre')) return { name: 'Vàng', hex: '#E6B800' };
    if (lower.includes('cognac') || lower.includes('camel') || lower.includes('amber') || lower.includes('cam')) return { name: 'Cam đất', hex: '#9A461E' };
    if (lower.includes('beige') || lower.includes('sand') || lower.includes('cream') || lower.includes('taupe') || lower.includes('be')) return { name: 'Be sữa', hex: '#D8C8B8' };
    if (lower.includes('dark grey') || lower.includes('charcoal')) return { name: 'Xám than', hex: '#374151' };
    if (lower.includes('light grey') || lower.includes('grey') || lower.includes('gray') || lower.includes('xám')) return { name: 'Xám khói', hex: '#9CA3AF' };
    if (lower.includes('white') || lower.includes('trắng')) return { name: 'Trắng sứ', hex: '#F3F4F6' };
    if (lower.includes('black') || lower.includes('đen')) return { name: 'Đen nhám', hex: '#18181B' };
    if (lower.includes('oak') || lower.includes('sồi')) return { name: 'Gỗ sồi tự nhiên', hex: '#C4A482' };
    if (lower.includes('brown') || lower.includes('walnut') || lower.includes('nâu')) return { name: 'Nâu Walnut', hex: '#6B4423' };
    return { name: text || 'Tiêu chuẩn', hex: '#78716c' };
  }

  // 6. Màu sắc
  getColumnColor(prod: CatalogProduct): { name: string; hex: string } {
    const variant = this.getSelectedVariant(prod);
    const rawName = variant?.name || 'Tiêu chuẩn';
    return this.detectColor(rawName);
  }

  // --- Kiểm tra khác biệt giữa các cột để làm nổi bật ---
  isRowDifferent(key: 'price' | 'rating' | 'width' | 'depth' | 'height' | 'weight' | 'material' | 'color'): boolean {
    if (!this.products || this.products.length < 2) return false;

    let values: string[] = [];
    if (key === 'price') {
      values = this.products.map(p => String(this.getColumnFinalPrice(p)));
    } else if (key === 'rating') {
      values = this.products.map(p => `${this.getColumnRating(p).rating}`);
    } else if (key === 'width') {
      values = this.products.map(p => this.getColumnWidth(p).trim().toLowerCase());
    } else if (key === 'depth') {
      values = this.products.map(p => this.getColumnDepth(p).trim().toLowerCase());
    } else if (key === 'height') {
      values = this.products.map(p => this.getColumnHeight(p).trim().toLowerCase());
    } else if (key === 'weight') {
      values = this.products.map(p => this.getColumnWeight(p).trim().toLowerCase());
    } else if (key === 'material') {
      values = this.products.map(p => this.getColumnMaterial(p).trim().toLowerCase());
    } else if (key === 'color') {
      values = this.products.map(p => this.getColumnColor(p).name.trim().toLowerCase());
    }

    const first = values[0];
    return values.some(v => v !== first);
  }

  // --- Thêm vào giỏ hàng ngay từ từng cột ---
  addToCart(prod: CatalogProduct) {
    const pid = prod.productId || (prod as any).id;
    const variant = this.getSelectedVariant(prod);
    if (!variant || !variant.id) {
      this.showToast('Vui lòng chọn biến thể sản phẩm hợp lệ', 'warning');
      return;
    }

    this.addingToCartMap[pid] = true;
    const selectedConfig = {
      variantName: variant.name || 'Tiêu chuẩn',
      sku: variant.sku || prod.slug,
      dimensions: this.getColumnDimensions(prod),
      material: this.getColumnMaterial(prod)
    };

    const rawPrice = variant.price || (prod.prices?.[0]?.price) || (prod as any).basePrice || 0;
    const productImages = Array.isArray(prod.images) ? prod.images : [];
    const variantImages = (variant.optionValues as any)?.images;
    const imageUrl = (Array.isArray(variantImages) && variantImages.length > 0)
      ? variantImages[0]
      : (productImages.length > 0 ? productImages[0] : '');

    const guestProductInfo = {
      productId: pid,
      name: prod.name || prod.shortDescription_vi || prod.shortDescription || 'Sản phẩm',
      variantName: variant.name !== 'Phân loại mặc định' ? variant.name : undefined,
      image: typeof imageUrl === 'string' ? imageUrl : '',
      price: rawPrice,
      availableStock: variant.stock
    };

    this.cartService.addToCart(variant.id, 1, selectedConfig, guestProductInfo)
      .subscribe({
        next: () => {
          this.addingToCartMap[pid] = false;
          this.addedSuccessMap[pid] = true;
          this.showToast(`Đã thêm ${prod.name} vào giỏ hàng!`, 'success');
          setTimeout(() => {
            this.addedSuccessMap[pid] = false;
            this.cdr.detectChanges();
          }, 3000);
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.addingToCartMap[pid] = false;
          console.error('Lỗi thêm giỏ hàng từ bảng so sánh:', err);
          this.showToast('Không thể thêm sản phẩm vào giỏ hàng.', 'warning');
          this.cdr.detectChanges();
        }
      });
  }

  // --- Sao chép liên kết chia sẻ ---
  copyShareLink() {
    if (typeof window === 'undefined') return;
    const ids = this.products.map(p => p.productId || (p as any).id).filter(Boolean);
    const shareUrl = `${window.location.origin}/explore?compare=${ids.join(',')}`;

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        this.copiedLinkSuccess = true;
        this.showToast('Đã sao chép liên kết so sánh vào bộ nhớ tạm!', 'success');
        setTimeout(() => {
          this.copiedLinkSuccess = false;
          this.cdr.detectChanges();
        }, 3000);
      }).catch(() => {
        this.fallbackCopy(shareUrl);
      });
    } else {
      this.fallbackCopy(shareUrl);
    }
  }

  private fallbackCopy(text: string) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      this.copiedLinkSuccess = true;
      this.showToast('Đã sao chép liên kết so sánh!', 'success');
      setTimeout(() => {
        this.copiedLinkSuccess = false;
        this.cdr.detectChanges();
      }, 3000);
    } catch (e) {
      this.showToast('Không thể sao chép liên kết tự động.', 'warning');
    }
    document.body.removeChild(textArea);
  }

  showToast(msg: string, type: 'success' | 'warning' | 'info' = 'success') {
    this.toastMessage = msg;
    this.toastType = type;
    this.cdr.detectChanges();
    setTimeout(() => {
      if (this.toastMessage === msg) {
        this.toastMessage = null;
        this.cdr.detectChanges();
      }
    }, 3200);
  }
}
