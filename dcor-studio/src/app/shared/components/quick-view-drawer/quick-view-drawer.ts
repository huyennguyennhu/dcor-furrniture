import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CatalogProduct } from '../../models/catalog.model';
import { HoverImageSlider } from '../hover-image-slider/hover-image-slider';
import { CustomSelect } from '../custom-select/custom-select';
import { LucideAngularModule, X, Plus, Minus, Info } from 'lucide-angular';

@Component({
  selector: 'app-quick-view-drawer',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, LucideAngularModule, HoverImageSlider, CustomSelect],
  templateUrl: './quick-view-drawer.html',
  styleUrls: ['./quick-view-drawer.css']
})
export class QuickViewDrawerComponent implements OnChanges {
  icons = { X, Plus, Minus, Info };

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

    if (this.product?.productId) {
      this.isLoadingDetails = true;
      // Giả lập fetch API chi tiết
      fetch(`/api/products/${this.product.productId}`)
        .then(res => res.json())
        .then(data => {
          this.fullProduct = data;
          this.initProductState();
          this.isLoadingDetails = false;
        })
        .catch(err => {
          console.error(err);
          this.fullProduct = this.product;
          this.initProductState();
          this.isLoadingDetails = false;
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
    
    this.filteredVariantPrices = (activeProduct.variants || []).filter((v: any) => v.images && v.images.length > 0);
    this.rawColors = activeProduct.refinementColors || [];
    this.colors = activeProduct.refinementColors_vi || this.rawColors;

    if (this.hasDynamicVariants && this.filteredVariantPrices.length > 0) {
      const firstVariant = this.filteredVariantPrices[0];
      this.selectedOptions = firstVariant.selections || {};
    } else if (this.rawColors.length > 0) {
      this.selectedColor = this.rawColors[0];
    }
    
    this.updateMatchedVariant();
  }

  buildDynamicOptions(product: any) {
    const configOptions = product.configOptions || [];
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
      const sel = v.selections || {};
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
      const fallbackVariant = this.filteredVariantPrices.find((v: any) => v.selections?.[groupKey] === optionId);
      if (fallbackVariant) {
        this.selectedOptions = fallbackVariant.selections || {};
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
    return this.matchedVariant?.dimensions || this.activeProduct?.dimensions;
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
