import { IconComponent } from '../icon/icon';
import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CatalogProduct } from '../../models/catalog.model';
import { CustomSelect } from '../custom-select/custom-select';
import { LucideAngularModule, X, Plus, Minus, Info, ChevronLeft, ChevronRight, ShoppingCart, ExternalLink } from 'lucide-angular';

import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-quick-view-drawer',
  standalone: true,
  imports: [IconComponent, CommonModule, RouterModule, FormsModule, LucideAngularModule, CustomSelect],
  templateUrl: './quick-view-drawer.html',
  styleUrls: ['./quick-view-drawer.css']
})
export class QuickViewDrawerComponent implements OnChanges {
  icons = { X, Plus, Minus, Info, ChevronLeft, ChevronRight, ShoppingCart, ExternalLink };
  constructor(private cdr: ChangeDetectorRef) {}

  currentImageIdx = 0;

  prevImage(e: Event) {
    e.stopPropagation();
    this.currentImageIdx = this.currentImageIdx === 0 ? this.images.length - 1 : this.currentImageIdx - 1;
  }

  nextImage(e: Event) {
    e.stopPropagation();
    this.currentImageIdx = this.currentImageIdx === this.images.length - 1 ? 0 : this.currentImageIdx + 1;
  }


  @Input() product: CatalogProduct | null = null;
  @Input() isOpen = false;
  @Output() onClose = new EventEmitter<void>();

  isVisible = false;
  showAnim = false;

  fullProduct: any = null;
  isLoadingDetails = false;

  dynamicConfig: any = null;
  hasDynamicVariants = false;
  selectedOptions: Record<string, string> = {};
  quantity = 1;

  filteredVariantPrices: any[] = [];
  rawColors: string[] = [];
  colors: string[] = [];
  selectedColor = '';

  matchedVariant: any = null;

  COLOR_MAP: Record<string, string> = {
    beige: '#D4C3A3', grey: '#8C8C8C', blue: '#325A82', green: '#4B6E50',
    brown: '#6E4D3B', white: '#FAF5EF', black: '#1A1A1A', red: '#A33E3E',
    yellow: '#D4AF37', orange: '#D47A37', pink: '#D48CAD', purple: '#5F3F6D'
  };

  ngOnChanges(changes: SimpleChanges) {
    if (changes['isOpen']) {
      if (this.isOpen) {
        this.openDrawer();
      } else {
        this.closeDrawer();
      }
    }
  }

  openDrawer() {
    this.isVisible = true;
    setTimeout(() => this.showAnim = true, 50);
    this.quantity = 1;
    document.body.style.overflow = 'hidden';

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

    if (this.product?.productId) {
      this.isLoadingDetails = true;
      fetch(`${environment.apiUrl}/products/${this.product.productId}`)
        .then(res => res.json())
        .then(data => {
          this.fullProduct = {
            ...this.product,
            ...data,
            productId: data.id || this.product?.productId,
            shortDescription: data.name || this.product?.shortDescription,
            shortDescription_vi: data.name || this.product?.shortDescription_vi,
            category: getParentCategory(data.category?.name || this.product?.category || ''),
            prices: data.basePrice ? [{ price: data.basePrice, formattedPrice: new Intl.NumberFormat('vi-VN').format(data.basePrice) + ' ₫' }] : this.product?.prices,
            lowestPrices: data.discountValue ? [{ price: data.basePrice - data.discountValue, formattedPrice: new Intl.NumberFormat('vi-VN').format(data.basePrice - data.discountValue) + ' ₫' }] : this.product?.lowestPrices,
          };
          this.initProductState();
          this.isLoadingDetails = false;
          this.cdr.detectChanges();
        })
        .catch(err => {
          console.error(err);
          this.fullProduct = this.product;
          this.initProductState();
          this.isLoadingDetails = false;
          this.cdr.detectChanges();
        });
    }
  }

  closeDrawer() {
    this.showAnim = false;
    setTimeout(() => {
      this.isVisible = false;
      document.body.style.overflow = '';
      this.fullProduct = null;
      this.selectedOptions = {};
    }, 400);
  }

  closeAction() {
    this.onClose.emit();
  }

  initProductState() {
    const activeProduct = this.fullProduct || this.product;
    if (!activeProduct) return;

    this.dynamicConfig = this.buildDynamicOptions(activeProduct);
    this.hasDynamicVariants = this.dynamicConfig && this.dynamicConfig.keys.length > 0;
    
    // Lấy variants từ database (không lọc v.images vì db chưa có cột images cho variant)
    this.filteredVariantPrices = activeProduct.variants || [];
    this.rawColors = activeProduct.refinementColors || [];
    this.colors = activeProduct.refinementColors_vi || this.rawColors;

    if (this.hasDynamicVariants && this.filteredVariantPrices.length > 0) {
      const firstVariant = this.filteredVariantPrices[0];
      // Dùng optionValues (của db) thay vì selections
      this.selectedOptions = firstVariant.optionValues || firstVariant.selections || {};
    } else if (this.rawColors.length > 0) {
      this.selectedColor = this.rawColors[0];
    }
    
    this.updateMatchedVariant();
  }

  buildDynamicOptions(product: any) {
    let configOptions = product.configOptions || [];
    if (configOptions && !Array.isArray(configOptions)) {
      configOptions = configOptions.attributes || [];
    }
    if (!configOptions || configOptions.length === 0) return null;

    const groups: any = {};
    const keyNames: any = {
      'vaMaterialLegStyle': 'Chân ghế',
      'vaMaterialUpholstery': 'Bọc ghế / Chất liệu',
      'vaSofaDirection': 'Hướng góc',
      'vaSize': 'Kích thước',
      'vaColor': 'Màu sắc',
      'vaColour': 'Màu sắc',
      'vaConfigurationSize': 'Cấu hình / Kích thước',
      'vaMaterialTabletop': 'Mặt bàn',
      'vaMaterialLeg': 'Chân',
      'vaMattressSize': 'Kích thước nệm',
      'vaMaterial': 'Chất liệu',
      'vaFunction': 'Chức năng',
      'vaMaterialSeat': 'Chất liệu ghế',
      'vaMotionOption': 'Tùy chọn chuyển động',
      'vaRugShape': 'Hình dáng thảm',
      'vaMaterialLamp': 'Chất liệu đèn',
      'vaMaterialShell': 'Vỏ bọc ngoài',
      'vaMaterialCabinet': 'Chất liệu tủ kệ',
      'vaSlatsIncluded': 'Bao gồm rạt giường'
    };

    configOptions.forEach((group: any) => {
      const k = group.groupId;
      const options = group.options || [];
      groups[k] = options.map((opt: any) => ({
        id: opt.id,
        label: opt.name || opt.id,
        image: opt.image || ''
      }));
    });

    return { keys: Object.keys(groups), names: keyNames, groups };
  }

  updateMatchedVariant() {
    if (!this.hasDynamicVariants || !this.filteredVariantPrices) {
      this.matchedVariant = null;
      return;
    }
    this.matchedVariant = this.filteredVariantPrices.find((v: any) => {
      const sel = v.optionValues || v.selections || {};
      return Object.keys(this.selectedOptions).every(k => sel[k] === this.selectedOptions[k]);
    }) || null;
  }

  handleSelectOption(groupKey: string, optionId: string) {
    const newOptions = { ...this.selectedOptions, [groupKey]: optionId };
    const comboExists = this.filteredVariantPrices.some((v: any) => {
      const sel = v.selections || {};
      return Object.keys(newOptions).every(k => sel[k] === newOptions[k]);
    });
    if (!comboExists && this.filteredVariantPrices.length > 0) {
      const fallbackVariant = this.filteredVariantPrices.find((v: any) => {
        const sel = v.optionValues || v.selections;
        return sel?.[groupKey] === optionId;
      });
      if (fallbackVariant) {
        this.selectedOptions = fallbackVariant.optionValues || fallbackVariant.selections || {};
        this.updateMatchedVariant();
        return;
      }
    }
    this.selectedOptions = newOptions;
    this.updateMatchedVariant();
  }

  handleAddToCart(e: Event) {
    e.stopPropagation();
    e.preventDefault();
    // Logic addToCart here
    window.alert(`Đã thêm ${this.quantity} ${this.activeProduct?.shortDescription || ''} vào giỏ hàng`);
    this.closeAction();
  }

  get activeProduct(): any {
    return this.fullProduct || this.product;
  }

  get currentPrice() {
    const basePrice = this.matchedVariant ? this.matchedVariant.price : (this.activeProduct?.prices?.[0]?.price || 0);
    const discountVal = this.activeProduct?.discountValue || 0;
    const isPercentage = this.activeProduct?.discountType === 'PERCENTAGE';
    return discountVal > 0 
      ? (isPercentage ? basePrice * (1 - discountVal / 100) : Math.max(0, basePrice - discountVal))
      : basePrice;
  }

  get minBasePrice() {
    return this.activeProduct?.lowestPrices?.[0]?.price || this.activeProduct?.prices?.[0]?.price || 0;
  }

  get minCurrentPrice() {
    const discountVal = this.activeProduct?.discountValue || 0;
    const isPercentage = this.activeProduct?.discountType === 'PERCENTAGE';
    return discountVal > 0 
      ? (isPercentage ? this.minBasePrice * (1 - discountVal / 100) : Math.max(0, this.minBasePrice - discountVal))
      : this.minBasePrice;
  }

  get discountVal() {
    return this.activeProduct?.discountValue || 0;
  }

  get dimensionData() {
    // Ưu tiên đọc từ configOptions nếu lưu dưới dạng object JSON
    const configDims = this.activeProduct?.configOptions?.dimensions;
    const optionValuesDims = this.matchedVariant?.optionValues?.dimensions;
    return optionValuesDims || configDims || this.matchedVariant?.dimensions || this.activeProduct?.dimensions;
  }

  hasDimensions() {
    return this.dimensionData && Object.keys(this.dimensionData).length > 0;
  }

  get images() {
    return (this.matchedVariant?.images && this.matchedVariant.images.length > 0) 
      ? this.matchedVariant.images 
      : (this.activeProduct?.images || []);
  }

  formatPrice(price: number) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  }

  getSelectOptions(groupKey: string) {
    return this.dynamicConfig.groups[groupKey].map((opt: any) => ({
      label: opt.label,
      value: opt.id,
      image: opt.image
    }));
  }

  isImageGroup(groupKey: string) {
    return groupKey.toLowerCase().includes('color') || groupKey.toLowerCase().includes('upholstery') || groupKey === 'vaMaterial' || groupKey === 'vaMaterialSeat';
  }
}
