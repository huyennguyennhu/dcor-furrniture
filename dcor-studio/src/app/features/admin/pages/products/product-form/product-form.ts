import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { 
  LucideAngularModule, 
  ArrowLeft, Save, Upload, Plus, Trash2, Check, AlertCircle, Layers, 
  Package, Settings, Warehouse, Eye, Info, X, ChevronRight, Tag, 
  CheckCircle2, Sparkles, RotateCcw, FileText, SlidersHorizontal, 
  DollarSign, Image as ImageIcon, HelpCircle, Search, ChevronDown
} from 'lucide-angular';

import { environment } from '../../../../../../environments/environment';

export type ProductFormTab = 'basic' | 'classification' | 'variants' | 'specs';

export interface ProductImageItem {
  id: string;
  url: string;
  isCover: boolean;
  order: number;
}

export interface ProductVariantFormItem {
  id: string;
  sku: string;
  name: string;
  color: string;
  size: string;
  price: number;
  originalPrice: number;
  image: string;
  isActive: boolean;
}

export interface CategoryOptionItem {
  id: string;
  name: string;
  parentId?: string | null;
  parentName?: string;
  displayName: string;
}

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LucideAngularModule],
  templateUrl: './product-form.html',
  styleUrls: ['./product-form.css']
})
export class ProductFormComponent implements OnInit {
  icons = { 
    ArrowLeft, Save, Upload, Plus, Trash2, Check, AlertCircle, Layers, 
    Package, Settings, Warehouse, Eye, Info, X, ChevronRight, Tag, 
    CheckCircle2, Sparkles, RotateCcw, FileText, SlidersHorizontal, 
    DollarSign, ImageIcon, HelpCircle, Search, ChevronDown
  };

  // State chế độ Form & Tab
  isEditMode = false;
  productId = '';
  activeTab: ProductFormTab = 'basic';
  isLoading = false;

  // Tab definitions: 4 Tabs (đã loại bỏ phần tồn kho & giá vốn)
  tabs: Array<{ id: ProductFormTab; label: string; step: number; icon: any; count?: number }> = [
    { id: 'basic', label: 'Thông tin chung', step: 1, icon: Package },
    { id: 'classification', label: 'Phân loại', step: 2, icon: Tag },
    { id: 'variants', label: 'Biến thể & Thuộc tính', step: 3, icon: Layers },
    { id: 'specs', label: 'Thông số & Xuất bản', step: 4, icon: Settings }
  ];

  // ==========================================
  // DATA MODEL CỦA SẢN PHẨM
  // ==========================================
  formData = {
    basic: {
      name: '',
      baseSku: '',
      brand: 'DCor Luxury Furniture',
      shortDesc: '',
      fullDesc: '',
      images: [] as ProductImageItem[]
    },
    allowCustom: false, // Cho phép khách hàng yêu cầu custom kích thước / chất liệu / màu
    classification: {
      primaryCategoryId: '',
      roomIds: [] as string[],
      collectionId: '',
      styleId: '',
      materialIds: [] as string[]
    },
    variants: [] as ProductVariantFormItem[],
    specs: {
      length: 0,
      width: 0,
      height: 0,
      weight: 0,
      warrantyMonths: 36,
      careInstructions: 'Vệ sinh bằng khăn mềm ẩm, tránh tiếp xúc trực tiếp với hóa chất tẩy rửa mạnh hoặc ánh nắng mặt trời chiếu trực tiếp thời gian dài.'
    },
    publication: {
      status: 'Nháp' as 'Đang bán' | 'Nháp' | 'Đã ẩn',
      isPublished: false
    }
  };

  // State cho Danh mục & Combobox tìm kiếm
  categories: CategoryOptionItem[] = [];
  categorySearchQuery = '';
  isCategoryDropdownOpen = false;

  // State cho việc tải ảnh lên Cloudinary
  isUploadingImage = false;

  rooms = [
    { id: 'rm-living', name: 'Phòng khách' },
    { id: 'rm-dining', name: 'Phòng ăn' },
    { id: 'rm-bed', name: 'Phòng ngủ' },
    { id: 'rm-work', name: 'Phòng làm việc' },
    { id: 'rm-outdoor', name: 'Ngoài trời' }
  ];

  collections = [
    { id: 'col-bergamo', name: 'Bộ sưu tập Bergamo' },
    { id: 'col-como', name: 'Bộ sưu tập Como' },
    { id: 'col-lugano', name: 'Bộ sưu tập Lugano' },
    { id: 'col-santiago', name: 'Bộ sưu tập Santiago' },
    { id: 'col-cenova', name: 'Bộ sưu tập Cenova' },
    { id: 'col-cupertino', name: 'Bộ sưu tập Cupertino' },
    { id: 'col-ottawa', name: 'Bộ sưu tập Ottawa' },
    { id: 'col-carmo', name: 'Bộ sưu tập Carmo' },
    { id: 'col-indivi', name: 'Bộ sưu tập Indivi' }
  ];

  styles = [
    { id: 'st-modern', name: 'Hiện đại (Modern)' },
    { id: 'st-minimal', name: 'Tối giản (Minimalism)' },
    { id: 'st-nordic', name: 'Bắc Âu (Scandinavian)' },
    { id: 'st-classic', name: 'Cổ điển (Classic Luxury)' },
    { id: 'st-contemporary', name: 'Đương đại (Contemporary)' },
    { id: 'st-industrial', name: 'Công nghiệp (Industrial)' }
  ];

  materials = [
    { id: 'mat-leather-real', name: 'Da bò Aniline thật' },
    { id: 'mat-leather-pu', name: 'Da nhân tạo PU cao cấp' },
    { id: 'mat-fabric-felt', name: 'Vải nỉ Copenhagen' },
    { id: 'mat-fabric-velvet', name: 'Vải nhung Sapphire' },
    { id: 'mat-fabric-boucle', name: 'Vải lông cừu Boucle' },
    { id: 'mat-wood-oak', name: 'Gỗ sồi (Oak) tự nhiên' },
    { id: 'mat-wood-walnut', name: 'Gỗ óc chó (Walnut)' },
    { id: 'mat-ceramic', name: 'Gốm Ceramic chống trầy' },
    { id: 'mat-glass', name: 'Kính khói cường lực' },
    { id: 'mat-metal', name: 'Thép sơn tĩnh điện' },
    { id: 'mat-brass', name: 'Đồng xước thủ công' }
  ];

  // Generator ma trận thuộc tính (Tab 3)
  colorAttributes: string[] = ['Xám ghi', 'Be sáng', 'Nâu Cognac'];
  sizeAttributes: string[] = ['2m4', '2m8'];
  newColorInput = '';
  newSizeInput = '';

  // Input hỗ trợ thêm nhanh ảnh URL
  newImageUrl = '';

  // Validation errors map
  validationErrors: Record<string, string> = {};

  // Feedback Toast
  toastMessage: string | null = null;
  toastType: 'success' | 'warning' | 'info' | 'error' = 'success';
  private toastTimer: any = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadCategoriesFromApi();

    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id && id !== 'new') {
        this.isEditMode = true;
        this.productId = id;
        this.loadExistingProduct(id);
      } else {
        this.isEditMode = false;
        this.initNewProduct();
      }
    });
  }

  // Tải danh mục thực tế từ Database
  loadCategoriesFromApi() {
    this.http.get<any>(`${environment.apiUrl}/admin/categories`).subscribe({
      next: (res) => {
        const catsList: CategoryOptionItem[] = [];
        const tree = res.tree || [];

        tree.forEach((parent: any) => {
          catsList.push({
            id: parent.id,
            name: parent.name,
            parentId: null,
            displayName: parent.name
          });

          if (Array.isArray(parent.children)) {
            parent.children.forEach((child: any) => {
              catsList.push({
                id: child.id,
                name: child.name,
                parentId: parent.id,
                parentName: parent.name,
                displayName: `— ${child.name} (${parent.name})`
              });
            });
          }
        });

        this.categories = catsList;

        if (this.formData.classification.primaryCategoryId) {
          const found = this.categories.find(c => c.id === this.formData.classification.primaryCategoryId);
          if (found) {
            this.categorySearchQuery = found.parentName ? `${found.parentName} > ${found.name}` : found.name;
          }
        }
        this.cdr.detectChanges();
      },
      error: () => {
        // Fallback danh mục dự phòng
        this.categories = [
          { id: 'cat-sofa', name: 'Sofa & Ghế bành', displayName: 'Sofa & Ghế bành' },
          { id: 'cat-table', name: 'Bàn trà & Bàn góc', displayName: 'Bàn trà & Bàn góc' },
          { id: 'cat-bed', name: 'Phòng ngủ & Giường', displayName: 'Phòng ngủ & Giường' },
          { id: 'cat-dining', name: 'Bàn ăn & Ghế ăn', displayName: 'Bàn ăn & Ghế ăn' },
          { id: 'cat-storage', name: 'Kệ & Tủ lưu trữ', displayName: 'Kệ & Tủ lưu trữ' }
        ];
        this.cdr.detectChanges();
      }
    });
  }

  // Lọc danh mục theo từ khóa người dùng gõ trong Dropdown
  get filteredCategories(): CategoryOptionItem[] {
    if (!this.categorySearchQuery || !this.categorySearchQuery.trim()) {
      return this.categories;
    }
    const q = this.categorySearchQuery.toLowerCase().trim();
    return this.categories.filter(c => 
      c.name.toLowerCase().includes(q) || 
      (c.parentName && c.parentName.toLowerCase().includes(q))
    );
  }

  selectCategory(cat: CategoryOptionItem) {
    this.formData.classification.primaryCategoryId = cat.id;
    this.categorySearchQuery = cat.parentName ? `${cat.parentName} > ${cat.name}` : cat.name;
    this.isCategoryDropdownOpen = false;
    this.clearError('category');
  }

  clearCategorySelection(event: Event) {
    event.stopPropagation();
    this.formData.classification.primaryCategoryId = '';
    this.categorySearchQuery = '';
    this.isCategoryDropdownOpen = false;
  }

  onCategorySearchInput() {
    this.isCategoryDropdownOpen = true;
    if (!this.categorySearchQuery.trim()) {
      this.formData.classification.primaryCategoryId = '';
    }
  }

  // Khởi tạo sản phẩm mới
  initNewProduct() {
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    this.formData.basic.baseSku = `DCOR-PRD-${randomSuffix}`;
    this.formData.publication.status = 'Nháp';
    this.formData.publication.isPublished = false;

    // Ảnh mặc định
    this.formData.basic.images = [
      {
        id: 'img-def-1',
        url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80',
        isCover: true,
        order: 1
      }
    ];

    this.generateVariantsFromAttributes();
  }

  // Tải dữ liệu sản phẩm khi chỉnh sửa
  loadExistingProduct(id: string) {
    this.isLoading = true;

    this.http.get<any>(`${environment.apiUrl}/admin/products/${id}`).subscribe({
      next: (product) => {
        this.fillFormData(product, id);
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        // Thử API public /products/:id
        this.http.get<any>(`${environment.apiUrl}/products/${id}`).subscribe({
          next: (product) => {
            this.fillFormData(product, id);
            this.isLoading = false;
            this.cdr.detectChanges();
          },
          error: () => {
            this.isLoading = false;
            this.showToast('Không thể tải thông tin sản phẩm từ cơ sở dữ liệu.', 'error');
            this.cdr.detectChanges();
          }
        });
      }
    });
  }

  private fillFormData(item: any, id: string) {
    this.formData.basic.name = item.name || `Sản phẩm ${id}`;
    this.formData.basic.baseSku = item.slug || `DCOR-SKU-${id.slice(0, 8).toUpperCase()}`;
    this.formData.basic.brand = item.configOptions?.brand || 'DCor Luxury Furniture';
    this.formData.basic.shortDesc = item.description_vi || item.description || '';
    this.formData.basic.fullDesc = item.description || '';

    // Cờ cho phép custom
    this.formData.allowCustom = !!(item.allowCustom || item.configOptions?.allowCustom);

    // Xử lý danh sách hình ảnh
    if (Array.isArray(item.images) && item.images.length > 0) {
      this.formData.basic.images = item.images.map((img: any, idx: number) => {
        const url = typeof img === 'string' ? img : img.url;
        return {
          id: `img-${idx + 1}`,
          url,
          isCover: idx === 0,
          order: idx + 1
        };
      });
    }

    this.formData.classification.primaryCategoryId = item.categoryId || item.primaryCategoryId || '';
    if (this.formData.classification.primaryCategoryId && this.categories.length > 0) {
      const found = this.categories.find(c => c.id === this.formData.classification.primaryCategoryId);
      if (found) {
        this.categorySearchQuery = found.parentName ? `${found.parentName} > ${found.name}` : found.name;
      }
    }

    this.formData.classification.roomIds = item.configOptions?.roomIds || ['rm-living'];
    this.formData.classification.collectionId = item.configOptions?.collectionId || '';
    this.formData.classification.styleId = item.configOptions?.styleId || '';
    this.formData.classification.materialIds = item.configOptions?.materialIds || [];

    // Xử lý biến thể: không chứa tồn kho và giá vốn
    if (Array.isArray(item.variants) && item.variants.length > 0) {
      this.formData.variants = item.variants.map((v: any, idx: number) => {
        const opt = typeof v.optionValues === 'string' ? JSON.parse(v.optionValues) : (v.optionValues || {});
        return {
          id: v.id || `var-${idx + 1}`,
          sku: v.sku || `SKU-${idx + 1}`,
          name: v.name || 'Tiêu chuẩn',
          color: opt.color || 'Tiêu chuẩn',
          size: opt.size || 'Mặc định',
          price: v.price || item.basePrice || 0,
          originalPrice: Math.round((v.price || item.basePrice || 0) * 1.15),
          image: (Array.isArray(opt.images) && opt.images[0]) || this.formData.basic.images[0]?.url || '',
          isActive: v.isActive !== false
        };
      });
    } else {
      this.generateVariantsFromAttributes();
    }

    if (item.configOptions?.specs) {
      this.formData.specs = { ...this.formData.specs, ...item.configOptions.specs };
    }

    this.formData.publication.status = item.isActive ? 'Đang bán' : 'Nháp';
    this.formData.publication.isPublished = item.isActive;
  }

  switchTab(tabId: ProductFormTab) {
    this.activeTab = tabId;
  }

  prevTab() {
    const currentIndex = this.tabs.findIndex(t => t.id === this.activeTab);
    if (currentIndex > 0) {
      this.activeTab = this.tabs[currentIndex - 1].id;
    }
  }

  nextTab() {
    const currentIndex = this.tabs.findIndex(t => t.id === this.activeTab);
    if (currentIndex < this.tabs.length - 1) {
      this.activeTab = this.tabs[currentIndex + 1].id;
    }
  }

  // --- TAB 1: TẢI ẢNH TỪ MÁY TÍNH LÊN CLOUDINARY (NÉN WEBP) ---
  onFileInputChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const files = Array.from(input.files);
    this.isUploadingImage = true;
    let uploadedCount = 0;
    let successCount = 0;

    files.forEach((file) => {
      const uploadData = new FormData();
      uploadData.append('file', file);

      this.http.post<any>(`${environment.apiUrl}/upload/image`, uploadData).subscribe({
        next: (res) => {
          if (res && res.url) {
            const isFirst = this.formData.basic.images.length === 0;
            this.formData.basic.images.push({
              id: 'img-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
              url: res.url,
              isCover: isFirst,
              order: this.formData.basic.images.length + 1
            });
            delete this.validationErrors['images'];
            successCount++;
          }
          uploadedCount++;
          if (uploadedCount >= files.length) {
            this.isUploadingImage = false;
            input.value = '';
            this.showToast(`Đã tải lên và nén WebP thành công ${successCount} ảnh!`, 'success');
            this.cdr.detectChanges();
          }
        },
        error: (err) => {
          uploadedCount++;
          if (uploadedCount >= files.length) {
            this.isUploadingImage = false;
            input.value = '';
          }
          this.showToast(err?.error?.message || 'Lỗi khi tải ảnh lên Cloudinary.', 'error');
          this.cdr.detectChanges();
        }
      });
    });
  }

  addImageFromUrl() {
    if (!this.newImageUrl.trim()) return;

    const isFirst = this.formData.basic.images.length === 0;
    this.formData.basic.images.push({
      id: 'img-' + Date.now(),
      url: this.newImageUrl.trim(),
      isCover: isFirst,
      order: this.formData.basic.images.length + 1
    });

    this.newImageUrl = '';
    delete this.validationErrors['images'];
    this.showToast('Đã thêm 1 hình ảnh mới', 'info');
  }

  addSampleImage(url: string) {
    const isFirst = this.formData.basic.images.length === 0;
    this.formData.basic.images.push({
      id: 'img-' + Date.now(),
      url,
      isCover: isFirst,
      order: this.formData.basic.images.length + 1
    });
    delete this.validationErrors['images'];
  }

  setCoverImage(index: number) {
    this.formData.basic.images.forEach((img, idx) => {
      img.isCover = idx === index;
    });
    this.showToast('Đã đặt làm ảnh bìa chính', 'success');
  }

  removeImage(index: number) {
    const wasCover = this.formData.basic.images[index]?.isCover;
    this.formData.basic.images.splice(index, 1);
    if (wasCover && this.formData.basic.images.length > 0) {
      this.formData.basic.images[0].isCover = true;
    }
  }

  // --- TAB 2: THUỘC TÍNH VÀ MULTI-SELECT ---
  toggleRoom(roomId: string) {
    const idx = this.formData.classification.roomIds.indexOf(roomId);
    if (idx > -1) {
      this.formData.classification.roomIds.splice(idx, 1);
    } else {
      this.formData.classification.roomIds.push(roomId);
    }
  }

  isRoomSelected(roomId: string): boolean {
    return this.formData.classification.roomIds.includes(roomId);
  }

  toggleMaterial(matId: string) {
    const idx = this.formData.classification.materialIds.indexOf(matId);
    if (idx > -1) {
      this.formData.classification.materialIds.splice(idx, 1);
    } else {
      this.formData.classification.materialIds.push(matId);
    }
  }

  isMaterialSelected(matId: string): boolean {
    return this.formData.classification.materialIds.includes(matId);
  }

  // --- TAB 3: GENERATE BIẾN THỂ CÁCH NHAU BẰNG DẤU GẠCH ( / ) ---
  addColorAttribute() {
    if (this.newColorInput.trim() && !this.colorAttributes.includes(this.newColorInput.trim())) {
      this.colorAttributes.push(this.newColorInput.trim());
      this.newColorInput = '';
    }
  }

  removeColorAttribute(idx: number) {
    this.colorAttributes.splice(idx, 1);
  }

  addSizeAttribute() {
    if (this.newSizeInput.trim() && !this.sizeAttributes.includes(this.newSizeInput.trim())) {
      this.sizeAttributes.push(this.newSizeInput.trim());
      this.newSizeInput = '';
    }
  }

  removeSizeAttribute(idx: number) {
    this.sizeAttributes.splice(idx, 1);
  }

  generateVariantsFromAttributes() {
    if (this.colorAttributes.length === 0 || this.sizeAttributes.length === 0) {
      this.showToast('Vui lòng thêm ít nhất 1 Màu sắc và 1 Kích thước để sinh ma trận', 'warning');
      return;
    }

    const baseSku = this.formData.basic.baseSku || 'DCOR-SF';
    const generated: ProductVariantFormItem[] = [];

    this.colorAttributes.forEach(color => {
      this.sizeAttributes.forEach(size => {
        const colorSlug = this.slugify(color).toUpperCase().slice(0, 3);
        const sizeSlug = this.slugify(size).toUpperCase().slice(0, 4);
        const varSku = `${baseSku}-${colorSlug}-${sizeSlug}`;
        const varId = `var-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

        const coverImg = this.formData.basic.images.find(i => i.isCover)?.url || 
          'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=400&q=80';

        // Tên biến thể phân tách bằng dấu gạch: sofa vải / 20x20cm / phong cách tối giản
        generated.push({
          id: varId,
          sku: varSku,
          name: `${color} / ${size}`,
          color,
          size,
          price: 15000000,
          originalPrice: 18000000,
          image: coverImg,
          isActive: true
        });
      });
    });

    this.formData.variants = generated;
    delete this.validationErrors['variants'];
    this.showToast(`Đã tự động sinh ${generated.length} biến thể từ tổ hợp thuộc tính!`, 'success');
  }

  addManualVariant() {
    const baseSku = this.formData.basic.baseSku || 'DCOR-PRD';
    const index = this.formData.variants.length + 1;
    const varId = `var-manual-${Date.now()}`;
    const coverImg = this.formData.basic.images.find(i => i.isCover)?.url || 
      'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=400&q=80';

    const newVar: ProductVariantFormItem = {
      id: varId,
      sku: `${baseSku}-VAR-${index}`,
      name: `Biến thể mới ${index}`,
      color: 'Tự chọn',
      size: 'Tiêu chuẩn',
      price: 12000000,
      originalPrice: 14000000,
      image: coverImg,
      isActive: true
    };

    this.formData.variants.push(newVar);
    this.showToast('Đã thêm 1 biến thể thủ công', 'info');
  }

  removeVariant(index: number) {
    this.formData.variants.splice(index, 1);
  }

  // --- VALIDATION & LƯU VÀO DATABASE ---
  validateForPublish(): boolean {
    this.validationErrors = {};

    if (!this.formData.basic.name.trim()) {
      this.validationErrors['name'] = 'Vui lòng nhập tên sản phẩm';
    }

    if (!this.formData.classification.primaryCategoryId) {
      this.validationErrors['category'] = 'Vui lòng chọn danh mục chính cho sản phẩm';
    }

    if (this.formData.basic.images.length === 0) {
      this.validationErrors['images'] = 'Bắt buộc tải lên hoặc thêm ít nhất 1 hình ảnh sản phẩm';
    }

    if (this.formData.variants.length === 0) {
      this.validationErrors['variants'] = 'Bắt buộc tạo ít nhất 1 biến thể sản phẩm';
    } else {
      const hasValidPrice = this.formData.variants.some(v => v.price > 0 && v.isActive);
      if (!hasValidPrice) {
        this.validationErrors['variants'] = 'Ít nhất 1 biến thể đang mở bán phải có giá bán hợp lệ (> 0 ₫)';
      }
    }

    const errorKeys = Object.keys(this.validationErrors);
    if (errorKeys.length > 0) {
      if (this.validationErrors['name'] || this.validationErrors['images']) {
        this.switchTab('basic');
      } else if (this.validationErrors['category']) {
        this.switchTab('classification');
      } else if (this.validationErrors['variants']) {
        this.switchTab('variants');
      }

      this.showToast('Vui lòng hoàn thiện các trường bắt buộc trước khi lưu!', 'warning');
      return false;
    }

    return true;
  }

  publishProduct() {
    if (!this.validateForPublish()) return;

    this.formData.publication.status = 'Đang bán';
    this.formData.publication.isPublished = true;
    this.saveToDatabase();
  }

  saveDraft() {
    if (!this.formData.basic.name.trim()) {
      this.formData.basic.name = 'Sản phẩm nháp mới';
    }
    this.formData.publication.status = 'Nháp';
    this.formData.publication.isPublished = false;
    this.saveToDatabase();
  }

  private saveToDatabase() {
    this.isLoading = true;

    const payload = {
      name: this.formData.basic.name.trim(),
      categoryId: this.formData.classification.primaryCategoryId,
      description: this.formData.basic.fullDesc || this.formData.basic.shortDesc,
      basePrice: this.formData.variants[0]?.price || 0,
      images: this.formData.basic.images.map(i => i.url),
      allowCustom: this.formData.allowCustom,
      configOptions: {
        allowCustom: this.formData.allowCustom,
        brand: this.formData.basic.brand,
        roomIds: this.formData.classification.roomIds,
        collectionId: this.formData.classification.collectionId,
        styleId: this.formData.classification.styleId,
        materialIds: this.formData.classification.materialIds,
        specs: this.formData.specs
      },
      isActive: this.formData.publication.status === 'Đang bán',
      variants: this.formData.variants.map(v => ({
        id: v.id && !v.id.startsWith('var-') ? v.id : undefined,
        sku: v.sku,
        name: v.name,
        price: v.price,
        isActive: v.isActive,
        optionValues: {
          color: v.color,
          size: v.size,
          images: v.image ? [v.image] : []
        }
      }))
    };

    const request$ = (this.isEditMode && this.productId)
      ? this.http.put<any>(`${environment.apiUrl}/admin/products/${this.productId}`, payload)
      : this.http.post<any>(`${environment.apiUrl}/admin/products`, payload);

    request$.subscribe({
      next: () => {
        this.isLoading = false;
        this.showToast(this.isEditMode ? 'Cập nhật sản phẩm thành công!' : 'Tạo sản phẩm mới vào cơ sở dữ liệu thành công!', 'success');
        setTimeout(() => {
          this.router.navigate(['/admin/products']);
        }, 1200);
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Lỗi lưu sản phẩm vào database:', err);
        this.showToast(err?.error?.message || 'Không thể lưu sản phẩm vào cơ sở dữ liệu.', 'error');
        this.cdr.detectChanges();
      }
    });
  }

  cancel() {
    this.router.navigate(['/admin/products']);
  }

  formatVND(value: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(value || 0);
  }

  private slugify(str: string): string {
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[đĐ]/g, 'd')
      .replace(/([^0-9a-z-\s])/g, '')
      .replace(/(\s+)/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  clearError(key: string) {
    delete this.validationErrors[key];
  }

  showToast(message: string, type: 'success' | 'warning' | 'info' | 'error' = 'success') {
    this.toastMessage = message;
    this.toastType = type;
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.toastMessage = null;
      this.cdr.detectChanges();
    }, 3500);
  }

  dismissToast() {
    this.toastMessage = null;
    if (this.toastTimer) clearTimeout(this.toastTimer);
  }
}
