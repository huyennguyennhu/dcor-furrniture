import { Component, OnInit, ChangeDetectorRef, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { 
  LucideAngularModule, 
  ArrowLeft, Save, Upload, Plus, Trash2, Check, AlertCircle, Layers, 
  Package, Settings, Warehouse, Eye, Info, X, ChevronRight, Tag, 
  CheckCircle2, Sparkles, RotateCcw, FileText, SlidersHorizontal, 
  DollarSign, Image as ImageIcon, HelpCircle, Search, ChevronDown,
  Copy, Sliders, CheckSquare, Square, Images, AlertTriangle
} from 'lucide-angular';

import { environment } from '../../../../../../environments/environment';
import { ProductService } from '../../../../../core/services/product.service';
import { CategoryClassificationService, CategoryItem } from '../../../../../core/services/category-classification.service';

export type ProductFormTab = 'basic' | 'classification' | 'variants' | 'specs';

export interface ProductImageItem {
  id: string;
  url: string;
  isCover: boolean;
  order: number;
}

export interface AttributeGroup {
  id: string;
  name: string;
  options: string[];
  newOptionInput: string;
  isDuplicateWarning?: boolean;
  duplicateOptionName?: string;
}

export interface ProductVariantFormItem {
  id: string;
  sku: string;
  name: string;
  attributes: Record<string, string>;
  color?: string;
  size?: string;
  price: number;
  originalPrice: number;
  costPrice: number;
  stock: number;
  safetyThreshold: number | null;
  barcode: string;
  images: string[];
  image?: string;
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
    DollarSign, ImageIcon, HelpCircle, Search, ChevronDown,
    Copy, Sliders, CheckSquare, Square, Images, AlertTriangle
  };

  // State chế độ Form & Tab
  isEditMode = false;
  productId = '';
  activeTab: ProductFormTab = 'basic';
  isLoading = false;
  isSubmitting = false;

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
      brand: '',
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
      length: null as any,
      width: null as any,
      height: null as any,
      weight: null as any,
      warrantyMonths: 24 as number | null,
      careInstructions: ''
    },
    publication: {
      status: 'Nháp' as 'Đang bán' | 'Nháp' | 'Đã ẩn',
      isPublished: false
    }
  };

  // State cho Danh mục Cha & Con
  categories: CategoryOptionItem[] = [];
  selectedParentCategoryId = '';
  categorySearchQuery = '';
  isCategoryDropdownOpen = false;
  // Custom Dropdown Open States (giống trang products)
  isParentCatDropdownOpen = false;
  isChildCatDropdownOpen = false;
  isCollectionDropdownOpen = false;
  isStyleDropdownOpen = false;
  isStatusDropdownOpen = false;

  get selectedParentCatLabel(): string {
    if (!this.selectedParentCategoryId) return '-- Chọn danh mục cha --';
    const found = this.categories.find(c => c.id === this.selectedParentCategoryId);
    return found ? found.name : '-- Chọn danh mục cha --';
  }

  get selectedChildCatLabel(): string {
    const primaryId = this.formData.classification.primaryCategoryId;
    if (!primaryId) return '-- Chọn danh mục con --';
    if (primaryId === this.selectedParentCategoryId) return '-- Mặc định (nhóm chính) --';
    const found = this.childCategories.find(c => c.id === primaryId);
    return found ? found.name : '-- Chọn danh mục con --';
  }

  get selectedCollectionLabel(): string {
    const colId = this.formData.classification.collectionId;
    if (!colId) return '-- Không thuộc bộ sưu tập nào --';
    const found = this.collections.find(c => c.id === colId);
    return found ? found.name : '-- Không thuộc bộ sưu tập nào --';
  }

  get selectedStyleLabel(): string {
    const stId = this.formData.classification.styleId;
    if (!stId) return '-- Chọn phong cách thiết kế --';
    const found = this.styles.find(s => s.id === stId);
    return found ? found.name : '-- Chọn phong cách thiết kế --';
  }

  get selectedStatusLabel(): string {
    const st = this.formData.publication.status;
    if (st === 'Đang bán') return 'Đang bán (Hiển thị trực tuyến trên Store)';
    if (st === 'Nháp') return 'Bản nháp (Lưu tạm trong hệ thống quản trị)';
    if (st === 'Đã ẩn') return 'Đã ẩn (Tạm khóa không bán cho khách hàng)';
    return st || 'Chọn trạng thái';
  }

  closeAllFormDropdowns() {
    this.isParentCatDropdownOpen = false;
    this.isChildCatDropdownOpen = false;
    this.isCollectionDropdownOpen = false;
    this.isStyleDropdownOpen = false;
    this.isStatusDropdownOpen = false;
  }

  toggleParentCatDropdown(e?: Event) {
    if (e) e.stopPropagation();
    const curr = this.isParentCatDropdownOpen;
    this.closeAllFormDropdowns();
    this.isParentCatDropdownOpen = !curr;
  }

  selectParentCat(catId: string) {
    this.selectedParentCategoryId = catId;
    this.onParentCategoryChange();
    this.isParentCatDropdownOpen = false;
  }

  toggleChildCatDropdown(e?: Event) {
    if (e) e.stopPropagation();
    const curr = this.isChildCatDropdownOpen;
    this.closeAllFormDropdowns();
    this.isChildCatDropdownOpen = !curr;
  }

  selectChildCat(subId: string) {
    this.formData.classification.primaryCategoryId = subId;
    this.clearError('category');
    this.isChildCatDropdownOpen = false;
  }

  toggleCollectionDropdown(e?: Event) {
    if (e) e.stopPropagation();
    const curr = this.isCollectionDropdownOpen;
    this.closeAllFormDropdowns();
    this.isCollectionDropdownOpen = !curr;
  }

  selectCollection(colId: string) {
    this.formData.classification.collectionId = colId;
    this.isCollectionDropdownOpen = false;
  }

  toggleStyleDropdown(e?: Event) {
    if (e) e.stopPropagation();
    const curr = this.isStyleDropdownOpen;
    this.closeAllFormDropdowns();
    this.isStyleDropdownOpen = !curr;
  }

  selectStyle(styleId: string) {
    this.formData.classification.styleId = styleId;
    this.isStyleDropdownOpen = false;
  }

  toggleStatusDropdown(e?: Event) {
    if (e) e.stopPropagation();
    const curr = this.isStatusDropdownOpen;
    this.closeAllFormDropdowns();
    this.isStatusDropdownOpen = !curr;
  }

  selectStatus(status: 'Đang bán' | 'Nháp' | 'Đã ẩn') {
    this.formData.publication.status = status;
    this.formData.publication.isPublished = status === 'Đang bán';
    this.isStatusDropdownOpen = false;
  }

  @HostListener('document:click')
  onDocumentClick() {
    this.closeAllFormDropdowns();
  }

  get parentCategories(): CategoryOptionItem[] {
    return this.categories.filter(c => !c.parentId);
  }

  get childCategories(): CategoryOptionItem[] {
    if (!this.selectedParentCategoryId) return [];
    return this.categories.filter(c => c.parentId === this.selectedParentCategoryId);
  }

  onParentCategoryChange() {
    const children = this.childCategories;
    if (children.length > 0) {
      this.formData.classification.primaryCategoryId = children[0].id;
    } else {
      this.formData.classification.primaryCategoryId = this.selectedParentCategoryId;
    }
    this.clearError('category');
  }

  initSelectedCategories() {
    if (this.formData.classification.primaryCategoryId) {
      const found = this.categories.find(c => c.id === this.formData.classification.primaryCategoryId);
      if (found) {
        if (found.parentId) {
          this.selectedParentCategoryId = found.parentId;
        } else {
          this.selectedParentCategoryId = found.id;
        }
      }
    } else if (this.parentCategories.length > 0) {
      this.selectedParentCategoryId = this.parentCategories[0].id;
      this.onParentCategoryChange();
    }
  }

  // State cho việc tải ảnh lên Cloudinary
  isUploadingImage = false;

  rooms: Array<{ id: string; name: string; slug?: string }> = [
    { id: 'rm-living', name: 'Phòng khách', slug: 'phong-khach' },
    { id: 'rm-dining', name: 'Phòng ăn', slug: 'phong-an' },
    { id: 'rm-bed', name: 'Phòng ngủ', slug: 'phong-ngu' },
    { id: 'rm-work', name: 'Phòng làm việc', slug: 'phong-lam-viec' },
    { id: 'rm-outdoor', name: 'Ngoài trời & Ban công', slug: 'ngoai-troi-ban-cong' }
  ];

  collections: Array<{ id: string; name: string; slug?: string }> = [
    { id: 'col-bergamo', name: 'Bộ sưu tập Bergamo', slug: 'bo-suu-tap-bergamo' },
    { id: 'col-como', name: 'Bộ sưu tập Como', slug: 'bo-suu-tap-como' },
    { id: 'col-lugano', name: 'Bộ sưu tập Lugano', slug: 'bo-suu-tap-lugano' },
    { id: 'col-santiago', name: 'Bộ sưu tập Santiago', slug: 'bo-suu-tap-santiago' },
    { id: 'col-cenova', name: 'Bộ sưu tập Cenova', slug: 'bo-suu-tap-cenova' }
  ];

  styles: Array<{ id: string; name: string; slug?: string }> = [
    { id: 'st-nordic', name: 'Bắc Âu (Scandinavian)', slug: 'bac-au-scandinavian' },
    { id: 'st-modern', name: 'Hiện đại (Modern Luxury)', slug: 'hien-dai-modern-luxury' },
    { id: 'st-minimal', name: 'Tối giản (Minimalism)', slug: 'toi-gian-minimalism' },
    { id: 'st-japandi', name: 'Japandi', slug: 'japandi' },
    { id: 'st-wabisabi', name: 'Wabi-Sabi', slug: 'wabi-sabi' },
    { id: 'st-industrial', name: 'Công nghiệp (Industrial)', slug: 'industrial' }
  ];

  materials: Array<{ id: string; name: string; slug?: string }> = [
    { id: 'mat-leather-real', name: 'Da bò Aniline Ý thật', slug: 'da-bo-aniline-y' },
    { id: 'mat-fabric-felt', name: 'Vải nỉ Copenhagen', slug: 'vai-ni-copenhagen' },
    { id: 'mat-wood-oak', name: 'Gỗ sồi (Oak) tự nhiên', slug: 'go-soi-tu-nhien' },
    { id: 'mat-wood-walnut', name: 'Gỗ óc chó (Walnut) thượng hạng', slug: 'go-oc-cho-walnut' },
    { id: 'mat-ceramic', name: 'Gốm Ceramic chống trầy', slug: 'gom-ceramic-chong-tray' }
  ];

  // Generator ma trận thuộc tính động (Tab 3) - Tối đa 3 nhóm
  attributeGroups: AttributeGroup[] = [];
  commonAttributeSuggestions = ['Màu sắc', 'Kích thước', 'Chất liệu', 'Kiểu dáng', 'Quy cách', 'Dung lượng'];

  // State cho công cụ Bulk Edit (Chỉnh sửa hàng loạt)
  bulkEdit = {
    price: null as number | null,
    costPrice: null as number | null,
    stock: null as number | null,
    safetyThreshold: null as number | null,
    skuPrefix: ''
  };

  // State cho Media Picker Modal (Chọn nhiều ảnh cho biến thể)
  isVariantImageModalOpen = false;
  selectedVariantForImage: ProductVariantFormItem | null = null;
  tempSelectedImages: string[] = [];
  isUploadingVariantImage = false;

  // Tương thích ngược (nếu có tham chiếu)
  colorAttributes: string[] = [];
  sizeAttributes: string[] = [];
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

  readonly warrantyMonthPresets = [
    { value: 0, label: 'Không BH' },
    { value: 6, label: '6 tháng' },
    { value: 12, label: '12 tháng' },
    { value: 24, label: '24 tháng' },
    { value: 36, label: '36 tháng' },
    { value: 60, label: '60 tháng' }
  ];

  selectWarrantyMonths(months: number) {
    this.formData.specs.warrantyMonths = months;
  }

  private normalizeWarrantyMonths(raw: any, fallback = 24): number {
    if (raw === null || raw === undefined || raw === '') return fallback;
    const parsed = Math.round(Number(raw));
    if (!Number.isFinite(parsed) || parsed < 0) return fallback;
    return Math.min(120, parsed);
  }

  parseThreshold(raw: any): number | null {
    if (raw === null || raw === undefined || raw === '') return null;
    const parsed = Math.round(Number(raw));
    if (!Number.isFinite(parsed) || parsed < 0) return null;
    return Math.min(999999, parsed);
  }

  isValidThreshold(raw: any): boolean {
    return this.parseThreshold(raw) !== null;
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private productService: ProductService,
    private categoryClassificationService: CategoryClassificationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadCategoriesFromApi();
    this.loadSubCategoriesFromApi();

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
        this.initSelectedCategories();
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
        this.initSelectedCategories();
        this.cdr.detectChanges();
      }
    });
  }

  // Tải danh mục phụ & thuộc tính đồng bộ trực tiếp từ PostgreSQL (/api/admin/categories/sub)
  loadSubCategoriesFromApi() {
    const applySubCategories = (items: CategoryItem[]) => {
      if (!Array.isArray(items) || items.length === 0) return;
      const byParent = (parentId: string, legacyType: string) =>
        items
          .filter(c => (c.parentId === parentId || c.type === legacyType) && c.status !== 'Đã ẩn')
          .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
          .map(c => ({ id: c.id, name: c.name, slug: c.slug }));

      const dbRooms = byParent('sub-room', 'room');
      const dbCollections = byParent('sub-collection', 'collection');
      const dbStyles = byParent('sub-style', 'style');
      const dbMaterials = byParent('sub-material', 'material');

      if (dbRooms.length > 0) this.rooms = dbRooms;
      if (dbCollections.length > 0) this.collections = dbCollections;
      if (dbStyles.length > 0) this.styles = dbStyles;
      if (dbMaterials.length > 0) this.materials = dbMaterials;
      this.cdr.detectChanges();
    };

    this.http.get<{ items?: CategoryItem[] }>(`${environment.apiUrl}/admin/categories/sub`).subscribe({
      next: (res) => {
        if (Array.isArray(res?.items) && res.items.length > 0) {
          this.categoryClassificationService.setCategories(res.items);
          applySubCategories(res.items);
        } else {
          applySubCategories(this.categoryClassificationService.getAdminCategories());
        }
      },
      error: () => {
        this.categoryClassificationService.loadSubCategories(true).subscribe(items => {
          applySubCategories(items);
        });
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

    // Không cấu hình sẵn ảnh mẫu - để trống hoàn toàn để người dùng tự tải lên từ thiết bị
    this.formData.basic.images = [];
    this.formData.variants = [];
    this.attributeGroups = [];
    this.formData.specs.warrantyMonths = 24;
  }

  // Tải dữ liệu sản phẩm khi chỉnh sửa
  loadExistingProduct(id: string) {
    this.isLoading = true;

    this.http.get<any>(`${environment.apiUrl}/admin/products/${id}`).subscribe({
      next: (product) => {
        this.fillFormData(product, id);
        this.isLoading = false; this.isSubmitting = false;
        this.cdr.detectChanges();
      },
      error: () => {
        // Thử API public /products/:id
        this.http.get<any>(`${environment.apiUrl}/products/${id}`).subscribe({
          next: (product) => {
            this.fillFormData(product, id);
            this.isLoading = false; this.isSubmitting = false;
            this.cdr.detectChanges();
          },
          error: () => {
            this.isLoading = false; this.isSubmitting = false;
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

    this.formData.classification.roomIds = Array.isArray(item.configOptions?.roomIds) ? [...item.configOptions.roomIds] : [];
    this.formData.classification.collectionId = item.configOptions?.collectionId || '';
    this.formData.classification.styleId = item.configOptions?.styleId || '';
    this.formData.classification.materialIds = Array.isArray(item.configOptions?.materialIds) ? [...item.configOptions.materialIds] : [];

    // Xử lý biến thể: hỗ trợ mảng ảnh, tồn kho, giá vốn, barcode và attributes động
    if (Array.isArray(item.variants) && item.variants.length > 0) {
      const extractedAttrs: Record<string, Set<string>> = {};

      this.formData.variants = item.variants.map((v: any, idx: number) => {
        const opt = typeof v.optionValues === 'string' ? JSON.parse(v.optionValues) : (v.optionValues || {});
        const variantImages: string[] = Array.isArray(opt.images) && opt.images.length > 0
          ? opt.images
          : (opt.image ? [opt.image] : (this.formData.basic.images[0]?.url ? [this.formData.basic.images[0].url] : []));

        // Trích xuất các thuộc tính động
        const attrs: Record<string, string> = {};
        if (opt && typeof opt === 'object') {
          for (const key of Object.keys(opt)) {
            if (!['images', 'image', 'costPrice', 'barcode', 'safetyThreshold', 'threshold', 'stock', 'attributes'].includes(key) && opt[key] !== undefined && opt[key] !== null && typeof opt[key] !== 'object') {
              const strVal = String(opt[key]).trim();
              if (strVal) {
                attrs[key] = strVal;
                if (!extractedAttrs[key]) extractedAttrs[key] = new Set();
                extractedAttrs[key].add(strVal);
              }
            }
          }
        }
        if (opt.color && !attrs['Màu sắc']) {
          attrs['Màu sắc'] = String(opt.color);
          if (!extractedAttrs['Màu sắc']) extractedAttrs['Màu sắc'] = new Set();
          extractedAttrs['Màu sắc'].add(String(opt.color));
        }
        if (opt.size && !attrs['Kích thước']) {
          attrs['Kích thước'] = String(opt.size);
          if (!extractedAttrs['Kích thước']) extractedAttrs['Kích thước'] = new Set();
          extractedAttrs['Kích thước'].add(String(opt.size));
        }

        const rawThreshold = v.safetyThreshold ?? v.threshold ?? opt.safetyThreshold ?? v.warehouseStocks?.[0]?.safetyThreshold;
        const parsedThreshold = this.parseThreshold(rawThreshold);

        return {
          id: v.id || `var-${idx + 1}`,
          sku: v.sku || `SKU-${idx + 1}`,
          name: v.name || 'Tiêu chuẩn',
          attributes: attrs,
          color: opt.color || attrs['Màu sắc'] || '',
          size: opt.size || attrs['Kích thước'] || '',
          price: v.price || item.basePrice || 0,
          originalPrice: Math.round((v.price || item.basePrice || 0) * 1.15),
          costPrice: opt.costPrice || 0,
          stock: v.stock !== undefined ? v.stock : 0,
          safetyThreshold: parsedThreshold,
          barcode: opt.barcode || '',
          images: variantImages,
          image: variantImages[0] || (Array.isArray(opt.images) && opt.images[0]) || this.formData.basic.images[0]?.url || '',
          isActive: v.isActive !== false,
          rawOptionValues: opt
        };
      });

      // Tái lập danh sách attributeGroups từ dữ liệu DB
      const reconstructedGroups: AttributeGroup[] = [];
      for (const attrName of Object.keys(extractedAttrs)) {
        if (reconstructedGroups.length < 3) {
          reconstructedGroups.push({
            id: `attr-${Date.now()}-${reconstructedGroups.length}`,
            name: attrName,
            options: Array.from(extractedAttrs[attrName]),
            newOptionInput: ''
          });
        }
      }
      this.attributeGroups = reconstructedGroups;
    } else {
      this.attributeGroups = [];
      this.formData.variants = [];
    }

    if (item.configOptions?.specs) {
      this.formData.specs = { ...this.formData.specs, ...item.configOptions.specs };
    }
    this.formData.specs.warrantyMonths = this.normalizeWarrantyMonths(
      item.warrantyMonths ?? item.configOptions?.specs?.warrantyMonths ?? item.configOptions?.warrantyMonths,
      24
    );

    this.formData.publication.status = item.isActive ? 'Đang bán' : 'Nháp';
    this.formData.publication.isPublished = item.isActive;
  }

  isStep1Valid(): boolean {
    return !!(this.formData.basic.name && this.formData.basic.name.trim() && this.formData.basic.images && this.formData.basic.images.length > 0);
  }

  isStep2Valid(): boolean {
    return this.isStep1Valid() && !!this.formData.classification.primaryCategoryId;
  }

  isStep3Valid(): boolean {
    return this.isStep2Valid() && 
      this.formData.variants.length > 0 && 
      this.formData.variants.some(v => v.price > 0) &&
      this.formData.variants.every(v => this.isValidThreshold(v.safetyThreshold));
  }

  isStepAvailable(tabId: ProductFormTab): boolean {
    if (this.isEditMode) return true;
    if (tabId === 'basic') return true;
    if (tabId === 'classification') return this.isStep1Valid();
    if (tabId === 'variants') return this.isStep2Valid();
    if (tabId === 'specs') return this.isStep3Valid();
    return false;
  }

  canSwitchToTab(tabId: ProductFormTab): boolean {
    if (this.isEditMode) return true;
    if (tabId === 'basic') return true;

    if (tabId === 'classification') {
      if (!this.formData.basic.name || !this.formData.basic.name.trim()) {
        this.validationErrors['name'] = 'Vui lòng nhập tên sản phẩm trước khi chuyển bước';
        this.showToast('Vui lòng hoàn thành Tên sản phẩm ở Bước 1!', 'warning');
        return false;
      }
      if (!this.formData.basic.images || this.formData.basic.images.length === 0) {
        this.validationErrors['images'] = 'Bắt buộc tải lên ít nhất 1 hình ảnh sản phẩm';
        this.showToast('Vui lòng tải lên ít nhất 1 hình ảnh ở Bước 1!', 'warning');
        return false;
      }
      return true;
    }

    if (tabId === 'variants') {
      if (!this.isStep1Valid()) {
        return this.canSwitchToTab('classification');
      }
      if (!this.formData.classification.primaryCategoryId) {
        this.validationErrors['category'] = 'Vui lòng chọn danh mục chính cho sản phẩm';
        this.showToast('Vui lòng chọn danh mục sản phẩm ở Bước 2 trước khi qua Bước 3!', 'warning');
        return false;
      }
      return true;
    }

    if (tabId === 'specs') {
      if (!this.isStep1Valid() || !this.isStep2Valid()) {
        return this.canSwitchToTab('variants');
      }
      if (this.formData.variants.length === 0) {
        this.validationErrors['variants'] = 'Bắt buộc tạo ít nhất 1 biến thể';
        this.showToast('Vui lòng tạo ít nhất 1 biến thể ở Bước 3!', 'warning');
        return false;
      }
      const hasValidPrice = this.formData.variants.some(v => v.price > 0);
      if (!hasValidPrice) {
        this.validationErrors['variants'] = 'Ít nhất 1 biến thể phải có giá bán hợp lệ (> 0 ₫)';
        this.showToast('Vui lòng nhập giá bán (> 0 ₫) cho ít nhất 1 biến thể ở Bước 3!', 'warning');
        return false;
      }
      const missingThreshold = this.formData.variants.some(v => !this.isValidThreshold(v.safetyThreshold));
      if (missingThreshold) {
        this.validationErrors['variants'] = 'Vui lòng nhập ngưỡng tồn kho hợp lệ (≥ 0) cho tất cả biến thể';
        this.showToast('Vui lòng nhập ngưỡng tồn kho cho tất cả biến thể ở Bước 3!', 'warning');
        return false;
      }
      return true;
    }

    return true;
  }

  switchTab(tabId: ProductFormTab) {
    if (!this.canSwitchToTab(tabId)) {
      return;
    }
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
      const targetTab = this.tabs[currentIndex + 1].id;
      if (this.canSwitchToTab(targetTab)) {
        this.activeTab = targetTab;
      }
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

  newMaterialName = '';

  addQuickMaterial() {
    const name = this.newMaterialName.trim();
    if (!name) return;

    const existing = this.materials.find(m => m.name.toLowerCase() === name.toLowerCase());
    if (existing) {
      if (!this.formData.classification.materialIds.includes(existing.id)) {
        this.formData.classification.materialIds.push(existing.id);
      }
      this.newMaterialName = '';
      this.showToast(`Đã chọn chất liệu có sẵn: ${existing.name}`, 'info');
      return;
    }

    const slug = this.slugify(name) || `chat-lieu-${Date.now()}`;
    const newId = `mat-${Date.now().toString().slice(-6)}`;
    const subPayload = {
      id: newId,
      name,
      slug,
      description: '',
      image: '',
      parentId: 'sub-material',
      sortOrder: this.materials.length + 1,
      status: 'Hiển thị',
      isActive: true
    };

    this.http.post<any>(`${environment.apiUrl}/admin/categories/sub`, subPayload).subscribe({
      next: (res) => {
        const created = res?.category;
        const createdId = created?.id || newId;
        const createdName = created?.name || name;
        const createdSlug = created?.slug || slug;
        if (!this.materials.some(m => m.id === createdId)) {
          this.materials.push({ id: createdId, name: createdName, slug: createdSlug });
        }
        if (!this.formData.classification.materialIds.includes(createdId)) {
          this.formData.classification.materialIds.push(createdId);
        }
        this.newMaterialName = '';
        this.categoryClassificationService.refresh();
        this.showToast('Đã thêm chất liệu vào hệ thống: ' + createdName, 'success');
        this.cdr.detectChanges();
      },
      error: () => {
        this.materials.push({ id: newId, name, slug });
        this.formData.classification.materialIds.push(newId);
        this.newMaterialName = '';
        this.showToast('Đã thêm chất liệu: ' + name, 'success');
        this.cdr.detectChanges();
      }
    });
  }

  isMaterialSelected(matId: string): boolean {
    return this.formData.classification.materialIds.includes(matId);
  }

  
  // Confirm Delete Modal State (BUG-26: Xác nhận xóa thuộc tính / biến thể)
  isConfirmDeleteModalOpen = false;
  deleteConfirmTarget: {
    type: 'attribute' | 'variant';
    index: number;
    title: string;
    description: string;
  } | null = null;

  promptDeleteAttributeGroup(index: number) {
    const group = this.attributeGroups[index];
    const name = group?.name ? `"${group.name}"` : `#${index + 1}`;
    this.deleteConfirmTarget = {
      type: 'attribute',
      index: index,
      title: 'Xóa nhóm thuộc tính',
      description: `Bạn có chắc chắn muốn xóa nhóm thuộc tính ${name}? Thao tác này sẽ cập nhật lại ma trận biến thể của sản phẩm.`
    };
    this.isConfirmDeleteModalOpen = true;
  }

  promptDeleteVariant(index: number) {
    const variant = this.formData.variants[index];
    const name = variant?.name || variant?.sku || `Biến thể #${index + 1}`;
    this.deleteConfirmTarget = {
      type: 'variant',
      index: index,
      title: 'Xóa biến thể sản phẩm',
      description: `Bạn có chắc chắn muốn xóa biến thể "${name}"? Thao tác này không thể hoàn tác.`
    };
    this.isConfirmDeleteModalOpen = true;
  }

  cancelDelete() {
    this.isConfirmDeleteModalOpen = false;
    this.deleteConfirmTarget = null;
  }

  executeConfirmDelete() {
    if (!this.deleteConfirmTarget) return;

    if (this.deleteConfirmTarget.type === 'attribute') {
      const idx = this.deleteConfirmTarget.index;
      const groupName = this.attributeGroups[idx]?.name || `Thuộc tính #${idx + 1}`;
      this.attributeGroups.splice(idx, 1);
      this.generateVariantsFromAttributes();
      this.showToast(`Đã xóa nhóm thuộc tính ${groupName}`, 'info');
    } else if (this.deleteConfirmTarget.type === 'variant') {
      const idx = this.deleteConfirmTarget.index;
      const varSku = this.formData.variants[idx]?.sku || '';
      this.formData.variants.splice(idx, 1);
      this.showToast(`Đã xóa biến thể ${varSku}`, 'info');
    }

    this.cancelDelete();
  }

  // --- TAB 3: DYNAMIC ATTRIBUTES & CARTESIAN PRODUCT MATRIX ---
  addAttributeGroup() {
    if (this.attributeGroups.length >= 10) {
      this.showToast('Hệ thống hỗ trợ tối đa 10 nhóm thuộc tính!', 'warning');
      return;
    }
    const id = `attr-${Date.now()}-${this.attributeGroups.length}`;
    const usedNames = this.attributeGroups.map(g => g.name.trim().toLowerCase());
    const suggestion = this.commonAttributeSuggestions.find(s => !usedNames.includes(s.toLowerCase())) || '';

    this.attributeGroups.push({
      id,
      name: suggestion.slice(0, 30),
      options: [],
      newOptionInput: ''
    });
  }

  removeAttributeGroup(index: number) {
    this.attributeGroups.splice(index, 1);
    this.generateVariantsFromAttributes();
  }

  onOptionInputKeyDown(event: KeyboardEvent, group: AttributeGroup) {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      this.addOptionTag(group);
    }
  }

  addOptionTag(group: AttributeGroup) {
    const groupName = (group.name || '').trim();
    if (!groupName) {
      this.showToast('Vui lòng nhập tên thuộc tính trước khi thêm giá trị', 'warning');
      return;
    }

    if (group.options.length >= 10) {
      this.showToast('Mỗi nhóm thuộc tính chỉ được thêm tối đa 10 giá trị!', 'warning');
      return;
    }

    let val = (group.newOptionInput || '').trim().replace(/^,+|,+$/g, '');
    if (!val) return;

    if (val.length > 30) {
      val = val.substring(0, 30);
      this.showToast('Giá trị thuộc tính được giới hạn tối đa 30 ký tự!', 'info');
    }

    // Kiểm tra trùng lặp (không phân biệt hoa thường)
    const exists = group.options.some(opt => opt.toLowerCase() === val.toLowerCase());
    if (exists) {
      group.isDuplicateWarning = true;
      group.duplicateOptionName = val;
      this.showToast(`Giá trị "${val}" đã tồn tại trong nhóm "${group.name}"!`, 'warning');
      setTimeout(() => {
        group.isDuplicateWarning = false;
        group.duplicateOptionName = undefined;
        this.cdr.detectChanges();
      }, 1800);
      return;
    }

    group.options.push(val);
    group.newOptionInput = '';
    group.isDuplicateWarning = false;

    // Tự động sinh lại ma trận biến thể theo thời gian thực (giữ nguyên dữ liệu cũ theo Composite Key)
    this.generateVariantsFromAttributes();
  }

  removeOptionTag(group: AttributeGroup, tagIndex: number) {
    group.options.splice(tagIndex, 1);
    this.generateVariantsFromAttributes();
  }

  // Khóa tổng hợp (Composite Key) để lưu trữ và bảo toàn dữ liệu variant khi thêm/bớt tag
  private buildCompositeKey(attrs: Record<string, string>): string {
    if (!attrs) return '';
    const sortedKeys = Object.keys(attrs).sort();
    return sortedKeys.map(k => `${k}:${attrs[k]}`).join('|');
  }

  // Tự động sinh ma trận biến thể (Descartes) kết hợp bảo toàn dữ liệu đã nhập
  generateVariantsFromAttributes(isManual = false) {
    const validGroups = this.attributeGroups.filter(g => g.name.trim() && g.options.length > 0);

    if (validGroups.length === 0) {
      if (isManual) {
        this.showToast('Vui lòng tạo ít nhất 1 nhóm thuộc tính có giá trị để sinh biến thể', 'warning');
      }
      return;
    }

    const baseSku = this.formData.basic.baseSku || 'DCOR-PRD';
    const prodName = this.formData.basic.name.trim();
    const coverImg = this.formData.basic.images.find(i => i.isCover)?.url || this.formData.basic.images[0]?.url || '';

    // Tạo bản đồ các biến thể hiện tại theo composite key để bảo toàn dữ liệu
    const existingVariantsMap = new Map<string, ProductVariantFormItem>();
    this.formData.variants.forEach(v => {
      const key = this.buildCompositeKey(v.attributes || {});
      if (key) {
        existingVariantsMap.set(key, v);
      }
    });

    // Thuật toán Descartes cho các nhóm thuộc tính
    const groupArrays = validGroups.map(g => 
      g.options.map(opt => ({ groupName: g.name.trim().slice(0, 30), value: opt.trim().slice(0, 30) }))
    );

    const combinations: Array<Array<{ groupName: string; value: string }>> = groupArrays.reduce(
      (acc, curr) => acc.flatMap(combo => curr.map(item => [...combo, item])),
      [[]] as Array<Array<{ groupName: string; value: string }>>
    );

    const newVariants: ProductVariantFormItem[] = [];

    combinations.forEach((combo, idx) => {
      const attrs: Record<string, string> = {};
      const slugParts: string[] = [];
      const titleParts: string[] = [];

      combo.forEach(c => {
        attrs[c.groupName] = c.value;
        slugParts.push(this.slugify(c.value).toUpperCase().slice(0, 4));
        titleParts.push(c.value);
      });

      const key = this.buildCompositeKey(attrs);
      const existing = existingVariantsMap.get(key);

      const colorVal = attrs['Màu sắc'] || attrs['Color'] || '';
      const sizeVal = attrs['Kích thước'] || attrs['Size'] || '';

      const varTitle = prodName ? `${prodName} - ${titleParts.join(' / ')}` : titleParts.join(' / ');
      const varSku = `${baseSku}-${slugParts.join('-')}`;

      if (existing) {
        // Giữ nguyên dữ liệu người dùng đã nhập trước đó
        newVariants.push({
          ...existing,
          name: varTitle,
          attributes: attrs,
          color: colorVal,
          size: sizeVal
        });
      } else {
        // Biến thể mới được sinh ra
        const varId = `var-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`;
        newVariants.push({
          id: varId,
          sku: varSku,
          name: varTitle,
          attributes: attrs,
          color: colorVal,
          size: sizeVal,
          price: this.bulkEdit.price || 0,
          originalPrice: this.bulkEdit.price ? Math.round(this.bulkEdit.price * 1.15) : 0,
          costPrice: this.bulkEdit.costPrice || 0,
          stock: 0,
          safetyThreshold: this.parseThreshold(this.bulkEdit.safetyThreshold),
          barcode: '',
          images: coverImg ? [coverImg] : [],
          image: coverImg,
          isActive: true
        });
      }
    });

    this.formData.variants = newVariants;
    delete this.validationErrors['variants'];
    if (isManual) {
      this.showToast(`Đã tự động tổ hợp ${newVariants.length} biến thể từ các thuộc tính!`, 'success');
    }
  }

  addManualVariant() {
    const baseSku = this.formData.basic.baseSku || 'DCOR-PRD';
    const index = this.formData.variants.length + 1;
    const varId = `var-manual-${Date.now()}`;
    const coverImg = this.formData.basic.images.find(i => i.isCover)?.url || this.formData.basic.images[0]?.url || '';

    const newVar: ProductVariantFormItem = {
      id: varId,
      sku: `${baseSku}-VAR-${index}`,
      name: `Biến thể tùy chỉnh ${index}`,
      attributes: { 'Đặc biệt': `Tùy chọn ${index}` },
      color: '',
      size: '',
      price: this.bulkEdit.price || 0,
      originalPrice: 0,
      costPrice: this.bulkEdit.costPrice || 0,
      stock: 0,
      safetyThreshold: this.parseThreshold(this.bulkEdit.safetyThreshold),
      barcode: '',
      images: coverImg ? [coverImg] : [],
      image: coverImg,
      isActive: false // Biến thể lẻ mặc định không mở bán
    };

    this.formData.variants.push(newVar);
    this.showToast('Đã thêm 1 biến thể lẻ (mặc định chưa mở bán)', 'info');
  }

  removeVariant(index: number) {
    this.formData.variants.splice(index, 1);
  }

  // --- CÔNG CỤ BULK EDIT (CHỈNH SỬA HÀNG LOẠT - 1 NÚT ÁP DỤNG DUY NHẤT) ---
  applyBulkEdit() {
    if (this.formData.variants.length === 0) {
      this.showToast('Chưa có biến thể nào để áp dụng hàng loạt', 'warning');
      return;
    }

    const hasPrice = this.bulkEdit.price !== null && this.bulkEdit.price !== undefined && String(this.bulkEdit.price) !== '';
    const hasCostPrice = this.bulkEdit.costPrice !== null && this.bulkEdit.costPrice !== undefined && String(this.bulkEdit.costPrice) !== '';
    const hasThreshold = this.bulkEdit.safetyThreshold !== null && this.bulkEdit.safetyThreshold !== undefined && String(this.bulkEdit.safetyThreshold) !== '';

    if (!hasPrice && !hasCostPrice && !hasThreshold) {
      this.showToast('Vui lòng nhập ít nhất một giá trị (giá bán, giá vốn hoặc ngưỡng tồn kho) để áp dụng', 'warning');
      return;
    }

    const appliedParts: string[] = [];

    if (hasPrice) {
      const p = Math.round(Number(this.bulkEdit.price));
      if (!Number.isFinite(p) || p < 0) {
        this.showToast('Vui lòng nhập giá bán chung hợp lệ (≥ 0)', 'warning');
        return;
      }
      this.formData.variants.forEach(v => {
        v.price = p;
        v.originalPrice = Math.round(p * 1.15);
      });
      appliedParts.push(`giá bán ${this.formatVND(p)}`);
    }

    if (hasCostPrice) {
      const cp = Math.round(Number(this.bulkEdit.costPrice));
      if (!Number.isFinite(cp) || cp < 0) {
        this.showToast('Vui lòng nhập giá vốn chung hợp lệ (≥ 0)', 'warning');
        return;
      }
      this.formData.variants.forEach(v => {
        v.costPrice = cp;
      });
      appliedParts.push(`giá vốn ${this.formatVND(cp)}`);
    }

    if (hasThreshold) {
      const th = this.parseThreshold(this.bulkEdit.safetyThreshold);
      if (th === null) {
        this.showToast('Vui lòng nhập ngưỡng tồn kho chung hợp lệ (≥ 0)', 'warning');
        return;
      }
      this.formData.variants.forEach(v => {
        v.safetyThreshold = th;
      });
      appliedParts.push(`ngưỡng tồn kho ${th}`);
    }

    this.clearError('variants');
    this.showToast(`Đã áp dụng ${appliedParts.join(', ')} cho tất cả ${this.formData.variants.length} biến thể!`, 'success');
  }
  applyBulkPrice() {
    if (this.bulkEdit.price === null || this.bulkEdit.price < 0) {
      this.showToast('Vui lòng nhập giá bán hợp lệ để áp dụng hàng loạt', 'warning');
      return;
    }
    const p = Math.round(Number(this.bulkEdit.price));
    this.formData.variants.forEach(v => {
      v.price = p;
      v.originalPrice = Math.round(p * 1.15);
    });
    this.showToast(`Đã áp dụng giá bán ${this.formatVND(p)} cho tất cả ${this.formData.variants.length} biến thể!`, 'success');
  }

  applyBulkCostPrice() {
    if (this.bulkEdit.costPrice === null || this.bulkEdit.costPrice < 0) {
      this.showToast('Vui lòng nhập giá vốn hợp lệ để áp dụng hàng loạt', 'warning');
      return;
    }
    const cp = Math.round(Number(this.bulkEdit.costPrice));
    this.formData.variants.forEach(v => {
      v.costPrice = cp;
    });
    this.showToast(`Đã áp dụng giá vốn ${this.formatVND(cp)} cho tất cả ${this.formData.variants.length} biến thể!`, 'success');
  }

  applyBulkStock() {
    if (this.bulkEdit.stock === null || this.bulkEdit.stock < 0) {
      this.showToast('Vui lòng nhập tồn kho ban đầu hợp lệ', 'warning');
      return;
    }
    const st = Math.round(Number(this.bulkEdit.stock));
    this.formData.variants.forEach(v => {
      v.stock = st;
    });
    this.showToast(`Đã thiết lập tồn kho ban đầu ${st} sản phẩm cho toàn bộ biến thể!`, 'success');
  }

  applyBulkSkuPrefix() {
    const prefix = (this.bulkEdit.skuPrefix || '').trim();
    if (!prefix) {
      this.showToast('Vui lòng nhập tiền tố SKU để áp dụng hàng loạt', 'warning');
      return;
    }
    this.formData.variants.forEach((v, idx) => {
      const parts = v.sku.split('-');
      const suffix = parts.length > 2 ? parts.slice(2).join('-') : `VAR-${idx + 1}`;
      v.sku = `${prefix}-${suffix}`;
    });
    this.showToast(`Đã cập nhật tiền tố SKU "${prefix}" cho tất cả biến thể!`, 'success');
  }

  // --- VARIANT MEDIA PICKER MODAL (CHỌN NHIỀU ẢNH CHO BIẾN THỂ) ---
  openVariantImagePicker(variant: ProductVariantFormItem) {
    this.selectedVariantForImage = variant;
    this.tempSelectedImages = Array.isArray(variant.images) && variant.images.length > 0
      ? [...variant.images]
      : (variant.image ? [variant.image] : []);
    this.isVariantImageModalOpen = true;
  }

  closeVariantImagePicker() {
    this.isVariantImageModalOpen = false;
    this.selectedVariantForImage = null;
    this.tempSelectedImages = [];
  }

  toggleImageSelection(imageUrl: string) {
    const idx = this.tempSelectedImages.indexOf(imageUrl);
    if (idx > -1) {
      this.tempSelectedImages.splice(idx, 1);
    } else {
      this.tempSelectedImages.push(imageUrl);
    }
  }

  isImageSelected(imageUrl: string): boolean {
    return this.tempSelectedImages.includes(imageUrl);
  }

  saveVariantImages() {
    if (!this.selectedVariantForImage) return;

    this.selectedVariantForImage.images = [...this.tempSelectedImages];
    this.selectedVariantForImage.image = this.tempSelectedImages[0] || '';

    this.showToast(`Đã lưu ${this.tempSelectedImages.length} ảnh cho biến thể "${this.selectedVariantForImage.name}"`, 'success');
    this.closeVariantImagePicker();
  }

  // Áp dụng bộ ảnh này cho tất cả biến thể có cùng giá trị thuộc tính (vd: Tất cả kích cỡ cùng Màu Đỏ)
  applyImagesToSameAttribute(attrName: string, attrVal: string) {
    if (!attrName || !attrVal) return;

    let count = 0;
    this.formData.variants.forEach(v => {
      if (v.attributes && v.attributes[attrName] === attrVal) {
        v.images = [...this.tempSelectedImages];
        v.image = this.tempSelectedImages[0] || '';
        count++;
      }
    });

    this.showToast(`Đã áp dụng ${this.tempSelectedImages.length} ảnh cho ${count} biến thể có ${attrName}: "${attrVal}"!`, 'success');
    this.closeVariantImagePicker();
  }

  // Tải ảnh trực tiếp từ modal vào Media Pool và tự động tích chọn
  onVariantModalUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    this.isUploadingVariantImage = true;
    const uploadData = new FormData();
    uploadData.append('file', file);

    this.http.post<any>(`${environment.apiUrl}/upload/image`, uploadData).subscribe({
      next: (res) => {
        this.isUploadingVariantImage = false;
        input.value = '';
        if (res && res.url) {
          this.formData.basic.images.push({
            id: 'img-' + Date.now(),
            url: res.url,
            isCover: false,
            order: this.formData.basic.images.length + 1
          });
          if (!this.tempSelectedImages.includes(res.url)) {
            this.tempSelectedImages.push(res.url);
          }
          this.showToast('Đã tải ảnh lên và gắn vào biến thể!', 'success');
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        this.isUploadingVariantImage = false;
        input.value = '';
        this.showToast(err?.error?.message || 'Lỗi khi tải ảnh lên.', 'error');
        this.cdr.detectChanges();
      }
    });
  }

  getVariantAttributeKeys(variant: ProductVariantFormItem | null): string[] {
    if (!variant || !variant.attributes) return [];
    return Object.keys(variant.attributes);
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
      } else if (this.formData.variants.some(v => !this.isValidThreshold(v.safetyThreshold))) {
        this.validationErrors['variants'] = 'Vui lòng nhập ngưỡng tồn kho hợp lệ (≥ 0) cho tất cả biến thể';
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
    if (!this.formData.classification.primaryCategoryId) {
      if (this.categories.length > 0) {
        this.formData.classification.primaryCategoryId = this.categories[0].id;
        this.categorySearchQuery = this.categories[0].parentName 
          ? `${this.categories[0].parentName} > ${this.categories[0].name}` 
          : this.categories[0].name;
      } else {
        this.showToast('Vui lòng chọn danh mục cho sản phẩm trước khi lưu nháp!', 'warning');
        this.switchTab('classification');
        return;
      }
    }
    this.formData.publication.status = 'Nháp';
    this.formData.publication.isPublished = false;
    this.saveToDatabase();
  }

  private saveToDatabase() {
    this.isLoading = true;

    const resolvedWarrantyMonths = this.normalizeWarrantyMonths(this.formData.specs.warrantyMonths, 24);
    const normalizedSpecs = {
      ...this.formData.specs,
      warrantyMonths: resolvedWarrantyMonths
    };

    const payload = {
      name: this.formData.basic.name.trim(),
      categoryId: this.formData.classification.primaryCategoryId,
      description: this.formData.basic.fullDesc || this.formData.basic.shortDesc,
      basePrice: this.formData.variants[0]?.price || 0,
      images: this.formData.basic.images.map(i => i.url),
      allowCustom: this.formData.allowCustom,
      warrantyMonths: resolvedWarrantyMonths,
      configOptions: {
        allowCustom: this.formData.allowCustom,
        warrantyMonths: resolvedWarrantyMonths,
        brand: this.formData.basic.brand,
        roomIds: this.formData.classification.roomIds,
        collectionId: this.formData.classification.collectionId,
        styleId: this.formData.classification.styleId,
        materialIds: this.formData.classification.materialIds,
        specs: normalizedSpecs
      },
      isActive: this.formData.publication.status === 'Đang bán',
      variants: this.formData.variants.map(v => {
        const variantImages = Array.isArray(v.images) && v.images.length > 0
          ? v.images
          : (v.image ? [v.image] : (this.formData.basic.images[0]?.url ? [this.formData.basic.images[0].url] : []));
        const parsedThreshold = this.parseThreshold(v.safetyThreshold);
        return {
          id: v.id && !v.id.startsWith('var-') ? v.id : undefined,
          sku: v.sku,
          name: v.name,
          price: Number(v.price) || 0,
          stock: Number(v.stock) || 0,
          safetyThreshold: parsedThreshold,
          isActive: v.isActive,
          optionValues: {
            ...((v as any).rawOptionValues || {}),
            attributes: v.attributes || {},
            color: v.color || (v.attributes ? v.attributes['Màu sắc'] : ''),
            size: v.size || (v.attributes ? v.attributes['Kích thước'] : ''),
            costPrice: Number(v.costPrice) || 0,
            stock: Number(v.stock) || 0,
            ...(parsedThreshold !== null ? { safetyThreshold: parsedThreshold } : {}),
            barcode: v.barcode || '',
            images: variantImages,
            image: variantImages[0] || ''
          }
        };
      })
    };

    const request$ = (this.isEditMode && this.productId)
      ? this.http.put<any>(`${environment.apiUrl}/admin/products/${this.productId}`, payload)
      : this.http.post<any>(`${environment.apiUrl}/admin/products`, payload);

    request$.subscribe({
        next: () => {
          this.isLoading = false; this.isSubmitting = false;
          this.productService.clearCache();
          this.categoryClassificationService.refresh();
          const successMsg = this.isEditMode 
            ? 'Cập nhật sản phẩm thành công!' 
            : 'Tạo và xuất bản sản phẩm mới thành công!';
          this.showToast(successMsg, 'success');
          this.cdr.detectChanges();
          setTimeout(() => {
            this.router.navigate(['/admin/products']);
          }, 1000);
        },
        error: (err) => {
          this.isLoading = false; this.isSubmitting = false;
          console.error('Lỗi lưu sản phẩm vào database:', err);
          const errorMsg = err?.error?.message || err?.error?.error || 'Không thể lưu sản phẩm vào cơ sở dữ liệu.';
          this.showToast(errorMsg, 'error');
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
