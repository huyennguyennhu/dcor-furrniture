import { Component, OnInit, HostListener, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { 
  LucideAngularModule, 
  ChevronDown, Plus, Trash2, X, ArrowLeft, Save, Edit2, Eye, Image as ImageIcon, Upload, Package 
} from 'lucide-angular';
import { AdminPageTabs } from '../../../components/admin-page-tabs/admin-page-tabs';

const TABS = [
  { id: 'general', label: 'Thông tin chung' },
  { id: 'classification', label: 'Phân loại' },
  { id: 'variants', label: 'Biến thể & Hình ảnh' },
  { id: 'promotion', label: 'Khuyến mãi' }
];

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, AdminPageTabs],
  templateUrl: './product-form.html'
})
export class ProductFormComponent implements OnInit {
  icons = { ChevronDown, Plus, Trash2, X, ArrowLeft, Save, Edit2, Eye, ImageIcon, Upload, Package };
  TABS = TABS;

  activeTab = 'general';
  isEdit = false;
  viewMode = false;
  isModified = false;
  
  initialData: any = {};

  configOptions: any[] = [];
  variants: any[] = [];
  expandedVariantIdx: number | null = null;
  mainSku = '';
  
  catCategory = '';
  catRoom = '';
  catCollection = '';
  catStyle = '';
  catMaterial = '';
  catColor = '';
  dbCategories: any[] = [];

  specs: {name: string, value: string}[] = [
    { name: 'Kích thước (D×R×C)', value: '' },
    { name: 'Trọng lượng', value: '' },
    { name: 'Chất liệu', value: '' },
    { name: 'Bảo hành', value: '' }
  ];

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit() {
    this.route.url.subscribe(url => {
      const path = url[url.length - 1].path;
      if (path === 'new') {
        this.isEdit = false;
        this.viewMode = false;
      } else {
        this.isEdit = true;
        this.viewMode = true; // start in view mode
        const id = path;
        this.mainSku = id;
        this.initialData = {
          name: 'Sản phẩm ' + id,
          product_id: id,
          costPrice: 5000000,
          shortDescription: 'Mô tả ngắn cho sản phẩm này.',
          description: 'Mô tả chi tiết',
          status: 'Đang bán'
        };
      }
    });

    // Mock API fetch
    this.dbCategories = [
      { slug: 'sofa', name: 'Sofa' },
      { slug: 'ban', name: 'Bàn' },
      { slug: 'ghe', name: 'Ghế' }
    ];
  }

  onTabChange(tabId: string) {
    this.activeTab = tabId;
  }

  goBack() {
    this.router.navigate(['/admin/products']);
  }

  toggleViewMode() {
    this.viewMode = !this.viewMode;
  }

  handleSave() {
    alert('Lưu sản phẩm thành công!');
    this.router.navigate(['/admin/products']);
  }

  // General tab methods
  handleAddSpec() {
    this.specs.push({ name: '', value: '' });
    this.isModified = true;
  }
  
  handleRemoveSpec(index: number) {
    this.specs.splice(index, 1);
    this.isModified = true;
  }
  
  handleSpecChange() {
    this.isModified = true;
  }

  // Variants methods
  handleAddConfigOption() {
    this.configOptions.push({ groupId: 'opt_' + Date.now().toString(), groupName: '', options: [] });
    this.isModified = true;
  }
  
  handleRemoveConfigOption(idx: number) {
    this.configOptions.splice(idx, 1);
    this.generateVariants(this.configOptions);
    this.isModified = true;
  }

  handleChangeConfigName() {
    this.isModified = true;
  }

  handleAddConfigValue(optIdx: number, event: any) {
    if (event.key === 'Enter') {
      event.preventDefault();
      const val = event.target.value.trim();
      if (!val) return;
      
      const optValues = this.configOptions[optIdx].options || [];
      if (!optValues.find((v: any) => v.name === val)) {
        this.configOptions[optIdx].options.push({ id: 'val_' + Date.now().toString(), name: val, image: null, hexColor: null, groupName: null });
        this.generateVariants(this.configOptions);
        this.isModified = true;
      }
      event.target.value = '';
    }
  }
  
  handleRemoveConfigValue(optIdx: number, valIdx: number) {
    this.configOptions[optIdx].options.splice(valIdx, 1);
    this.generateVariants(this.configOptions);
    this.isModified = true;
  }

  generateVariants(opts: any[]) {
    const validOpts = opts.filter(o => (o.options || []).length > 0 && (o.groupName || '').trim() !== '');
    if (validOpts.length === 0) {
      this.variants = [];
      return;
    }

    const cartesian = (...a: any[]) => a.reduce((a, b) => a.flatMap((d: any) => b.map((e: any) => [d, e].flat())));
    const arrays = validOpts.map(o => o.options || []);
    let combinations = arrays.length > 1 ? cartesian(...arrays) : arrays[0].map((v: any) => [v]);
    
    this.variants = combinations.map((combo: any) => {
      const isArray = Array.isArray(combo);
      const nameFromOpts = isArray ? combo.map((c: any) => c.name).join(' - ') : combo.name;
      const suffix = isArray ? combo.map((c: any) => c.id.substring(0, 4)).join('-') : combo.id.substring(0, 4);
      
      const selections: any = {};
      if (isArray) {
        combo.forEach((c: any, i: number) => selections[validOpts[i].groupId] = c.id);
      } else {
        selections[validOpts[0].groupId] = combo.id;
      }
      
      const autoSku = this.mainSku ? `${this.mainSku}-${suffix.toUpperCase()}` : '';

      const existing = this.variants.find((v: any) => JSON.stringify(v.selections) === JSON.stringify(selections));
      return existing ? existing : {
        name: this.initialData.name || '',
        selections: selections,
        price: this.initialData.price || 0,
        stock: 0,
        variantId: autoSku,
        images: []
      };
    });
  }

  getVariantDisplayName(v: any) {
    const names: string[] = [];
    this.configOptions.forEach(opt => {
      if (v.selections && v.selections[opt.groupId]) {
        const selectedOpt = (opt.options || []).find((o: any) => o.id === v.selections[opt.groupId]);
        if (selectedOpt) names.push(selectedOpt.name);
      }
    });
    return names.length > 0 ? names.join(' - ') : 'Mặc định';
  }

  formatVND(val: number) {
    return new Intl.NumberFormat('vi-VN').format(val);
  }
}
