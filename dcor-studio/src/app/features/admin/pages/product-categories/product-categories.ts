import { IconComponent } from '../../../../shared/components/icon/icon';
import { Component, OnInit, HostListener, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { 
  LucideAngularModule, 
  Trash2, Plus, ChevronDown
} from 'lucide-angular';
import { AdminPageTabs } from '../../components/admin-page-tabs/admin-page-tabs';

const TABS = [
  { id: 'main', label: 'Danh mục chính', count: 8 },
  { id: 'room', label: 'Phòng', count: 5 },
  { id: 'collection', label: 'Collection', count: 12 },
  { id: 'style', label: 'Phong cách', count: 6 },
  { id: 'material', label: 'Chất liệu', count: 15 }
];

interface Category {
  id: string;
  name: string;
  slug: string;
  productsCount: number;
  status: 'Hiển thị' | 'Đã ẩn';
  order: number;
}

const SAMPLE_CATEGORIES: Record<string, Category[]> = {
  main: [
    { id: 'CAT-01', name: 'Sofa & Ghế bành', slug: 'sofa-ghe-banh', productsCount: 124, status: 'Hiển thị', order: 1 },
    { id: 'CAT-02', name: 'Bàn trà & Bàn góc', slug: 'ban-tra-ban-goc', productsCount: 86, status: 'Hiển thị', order: 2 },
    { id: 'CAT-03', name: 'Giường ngủ', slug: 'giuong-ngu', productsCount: 52, status: 'Đã ẩn', order: 3 },
  ],
  room: [
    { id: 'RM-01', name: 'Phòng khách', slug: 'phong-khach', productsCount: 150, status: 'Hiển thị', order: 1 },
    { id: 'RM-02', name: 'Phòng ăn', slug: 'phong-an', productsCount: 85, status: 'Hiển thị', order: 2 },
    { id: 'RM-03', name: 'Phòng ngủ', slug: 'phong-ngu', productsCount: 120, status: 'Hiển thị', order: 3 },
    { id: 'RM-04', name: 'Phòng làm việc', slug: 'phong-lam-viec', productsCount: 45, status: 'Hiển thị', order: 4 },
    { id: 'RM-05', name: 'Ngoài trời', slug: 'ngoai-troi', productsCount: 30, status: 'Đã ẩn', order: 5 },
  ],
  collection: [
    { id: 'COL-01', name: 'Bộ sưu tập Bergamo', slug: 'bergamo', productsCount: 12, status: 'Hiển thị', order: 1 },
    { id: 'COL-02', name: 'Bộ sưu tập Como', slug: 'como', productsCount: 8, status: 'Hiển thị', order: 2 },
    { id: 'COL-03', name: 'Bộ sưu tập Lugano', slug: 'lugano', productsCount: 15, status: 'Hiển thị', order: 3 },
    { id: 'COL-04', name: 'Bộ sưu tập Osaka', slug: 'osaka', productsCount: 10, status: 'Hiển thị', order: 4 },
    { id: 'COL-05', name: 'Bộ sưu tập Carmo', slug: 'carmo', productsCount: 6, status: 'Đã ẩn', order: 5 },
    { id: 'COL-06', name: 'Bộ sưu tập Indivi', slug: 'indivi', productsCount: 22, status: 'Hiển thị', order: 6 },
    { id: 'COL-07', name: 'Bộ sưu tập Cenova', slug: 'cenova', productsCount: 9, status: 'Hiển thị', order: 7 },
    { id: 'COL-08', name: 'Bộ sưu tập Carlton', slug: 'carlton', productsCount: 11, status: 'Hiển thị', order: 8 },
    { id: 'COL-09', name: 'Bộ sưu tập Cupertino', slug: 'cupertino', productsCount: 7, status: 'Hiển thị', order: 9 },
    { id: 'COL-10', name: 'Bộ sưu tập Ottawa', slug: 'ottawa', productsCount: 14, status: 'Hiển thị', order: 10 },
    { id: 'COL-11', name: 'Bộ sưu tập Adelaide', slug: 'adelaide', productsCount: 5, status: 'Hiển thị', order: 11 },
    { id: 'COL-12', name: 'Bộ sưu tập Hampton', slug: 'hampton', productsCount: 4, status: 'Đã ẩn', order: 12 },
  ],
  style: [
    { id: 'ST-01', name: 'Phong cách Hiện đại', slug: 'hien-dai', productsCount: 200, status: 'Hiển thị', order: 1 },
    { id: 'ST-02', name: 'Phong cách Tối giản', slug: 'toi-gian', productsCount: 150, status: 'Hiển thị', order: 2 },
    { id: 'ST-03', name: 'Phong cách Bắc Âu (Scandinavian)', slug: 'bac-au', productsCount: 180, status: 'Hiển thị', order: 3 },
    { id: 'ST-04', name: 'Phong cách Cổ điển', slug: 'co-dien', productsCount: 50, status: 'Đã ẩn', order: 4 },
    { id: 'ST-05', name: 'Phong cách Công nghiệp (Industrial)', slug: 'cong-nghiep', productsCount: 70, status: 'Hiển thị', order: 5 },
    { id: 'ST-06', name: 'Phong cách Đương đại', slug: 'duong-dai', productsCount: 90, status: 'Hiển thị', order: 6 },
  ],
  material: [
    { id: 'MAT-01', name: 'Gỗ sồi (Oak)', slug: 'go-soi', productsCount: 120, status: 'Hiển thị', order: 1 },
    { id: 'MAT-02', name: 'Gỗ óc chó (Walnut)', slug: 'go-oc-cho', productsCount: 85, status: 'Hiển thị', order: 2 },
    { id: 'MAT-03', name: 'Da bò thật (Aniline leather)', slug: 'da-bo', productsCount: 45, status: 'Hiển thị', order: 3 },
    { id: 'MAT-04', name: 'Vải nỉ (Felt)', slug: 'vai-ni', productsCount: 160, status: 'Hiển thị', order: 4 },
    { id: 'MAT-05', name: 'Vải nhung (Velvet)', slug: 'vai-nhung', productsCount: 90, status: 'Hiển thị', order: 5 },
    { id: 'MAT-06', name: 'Kim loại sơn tĩnh điện', slug: 'kim-loai', productsCount: 210, status: 'Hiển thị', order: 6 },
    { id: 'MAT-07', name: 'Kính cường lực', slug: 'kinh', productsCount: 65, status: 'Hiển thị', order: 7 },
    { id: 'MAT-08', name: 'Đá cẩm thạch (Marble)', slug: 'da-cam-thach', productsCount: 30, status: 'Hiển thị', order: 8 },
    { id: 'MAT-09', name: 'Đá Ceramic', slug: 'da-ceramic', productsCount: 40, status: 'Hiển thị', order: 9 },
    { id: 'MAT-10', name: 'Nhựa ABS cao cấp', slug: 'nhua-abs', productsCount: 55, status: 'Hiển thị', order: 10 },
    { id: 'MAT-11', name: 'Vải bọc ngoài trời', slug: 'vai-ngoai-troi', productsCount: 25, status: 'Đã ẩn', order: 11 },
    { id: 'MAT-12', name: 'Sơn mài (Lacquer)', slug: 'son-mai', productsCount: 75, status: 'Hiển thị', order: 12 },
    { id: 'MAT-13', name: 'Gỗ trắc (Rosewood)', slug: 'go-trac', productsCount: 15, status: 'Đã ẩn', order: 13 },
    { id: 'MAT-14', name: 'Da nhân tạo (PU)', slug: 'da-pu', productsCount: 110, status: 'Hiển thị', order: 14 },
    { id: 'MAT-15', name: 'Mây tre đan', slug: 'may-tre', productsCount: 20, status: 'Hiển thị', order: 15 },
  ]
};

@Component({
  selector: 'app-product-categories',
  standalone: true,
  imports: [IconComponent, CommonModule, FormsModule, RouterModule, LucideAngularModule, AdminPageTabs],
  templateUrl: './product-categories.html',
  styleUrls: ['./product-categories.css']
})
export class ProductCategoriesComponent implements OnInit {
  icons = { Trash2, Plus, ChevronDown };
  TABS = TABS;
  SAMPLE_CATEGORIES = SAMPLE_CATEGORIES;

  activeTab = 'main';
  search = '';
  categories: Category[] = [];
  loading = true;
  selectedKeys = new Set<string>();
  
  isAddTypeOpen = false;
  
  // States cho modal Danh Mục chung (Thêm/Sửa/Xem)
  isCategoryModalOpen = false;
  categoryModalMode: 'add' | 'edit' | 'view' = 'add';
  editingCategoryId: string | null = null;

  // States cho modal Thêm Loại
  newTypeName = '';
  typeNameError = '';
  newTypeId = '';
  isTypeIdEdited = false;
  typeIdError = '';

  // States cho modal Thêm Danh Mục
  newCatName = '';
  catNameError = '';
  newCatSlug = '';
  isCatSlugEdited = false;
  catSlugError = '';
  newCatType = this.activeTab;
  newCatStatus = 'Hiển thị';
  showTypeDropdown = false;
  showStatusDropdown = false;
  newCatOrder = 1;
  showOrderDetails = false;

  activeActionMenu: string | null = null;

  @ViewChild('typeDropdownRef', { static: false }) typeDropdownRef!: ElementRef;
  @ViewChild('statusDropdownRef', { static: false }) statusDropdownRef!: ElementRef;

  constructor(private router: Router) {}

  ngOnInit() {
    this.fetchCategories();
  }

  fetchCategories() {
    // Giả lập fetch API
    this.categories = [];
    this.loading = false;
  }

  get currentData() {
    return this.activeTab === 'main' ? (this.categories.length ? this.categories : SAMPLE_CATEGORIES['main']) : (SAMPLE_CATEGORIES[this.activeTab] || []);
  }

  get filtered() {
    return this.currentData.filter(c => c.name.toLowerCase().includes(this.search.toLowerCase()));
  }

  @HostListener('document:mousedown', ['$event'])
  onGlobalClick(event: MouseEvent) {
    if (this.typeDropdownRef && !this.typeDropdownRef.nativeElement.contains(event.target)) {
      this.showTypeDropdown = false;
    }
    if (this.statusDropdownRef && !this.statusDropdownRef.nativeElement.contains(event.target)) {
      this.showStatusDropdown = false;
    }
    const target = event.target as HTMLElement;
    if (!target.closest('.action-menu-container')) {
      this.activeActionMenu = null;
    }
  }

  onTabChange(tabId: string) {
    this.activeTab = tabId;
    this.selectedKeys.clear();
  }

  toggleActionMenu(id: string, event: Event) {
    event.stopPropagation();
    this.activeActionMenu = this.activeActionMenu === id ? null : id;
  }

  generateSlug(str: string) {
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

  validateTypeName(name: string) {
    if (name && TABS.some(tab => tab.label.toLowerCase() === name.toLowerCase())) {
      this.typeNameError = 'Tên loại này đã tồn tại!';
      return false;
    }
    this.typeNameError = '';
    return true;
  }

  handleTypeNameChange(val: string) {
    this.newTypeName = val;
    const isValid = this.validateTypeName(val);
    
    if (!this.isTypeIdEdited) {
      if (isValid) {
        const slug = this.generateSlug(val);
        this.newTypeId = slug;
        this.validateTypeId(slug);
      } else {
        this.newTypeId = '';
        this.typeIdError = '';
      }
    }
  }

  handleTypeIdChange(val: string) {
    this.newTypeId = val;
    this.isTypeIdEdited = true;
    this.validateTypeId(val);
  }

  validateTypeId(id: string) {
    if (id && TABS.some(tab => tab.id.toLowerCase() === id.toLowerCase())) {
      this.typeIdError = 'Mã ID này đã tồn tại!';
      return false;
    }
    this.typeIdError = '';
    return true;
  }

  validateCatName(name: string) {
    if (name && this.currentData.some(c => c.name.toLowerCase() === name.toLowerCase())) {
      this.catNameError = 'Tên danh mục này đã tồn tại!';
      return false;
    }
    this.catNameError = '';
    return true;
  }

  handleCatNameChange(val: string) {
    this.newCatName = val;
    const isValid = this.validateCatName(val);
    
    if (!this.isCatSlugEdited) {
      if (isValid) {
        const slug = this.generateSlug(val);
        this.newCatSlug = slug;
        this.validateCatSlug(slug);
      } else {
        this.newCatSlug = '';
        this.catSlugError = '';
      }
    }
  }

  handleCatSlugChange(val: string) {
    this.newCatSlug = val;
    this.isCatSlugEdited = true;
    this.validateCatSlug(val);
  }

  validateCatSlug(slug: string) {
    if (slug && this.currentData.some(c => c.slug.toLowerCase() === slug.toLowerCase())) {
      this.catSlugError = 'Đường dẫn này đã tồn tại trong loại danh mục hiện tại!';
      return false;
    }
    this.catSlugError = '';
    return true;
  }

  resetTypeForm() {
    this.newTypeName = '';
    this.typeNameError = '';
    this.newTypeId = '';
    this.isTypeIdEdited = false;
    this.typeIdError = '';
  }

  resetCatForm() {
    this.newCatName = '';
    this.catNameError = '';
    this.newCatSlug = '';
    this.isCatSlugEdited = false;
    this.catSlugError = '';
    this.newCatType = this.activeTab;
    this.newCatStatus = 'Hiển thị';
    this.showTypeDropdown = false;
    this.showStatusDropdown = false;
    this.newCatOrder = 1;
    this.showOrderDetails = false;
    this.editingCategoryId = null;
  }

  openCategoryModal(mode: 'add' | 'edit' | 'view', item?: Category) {
    this.categoryModalMode = mode;
    if (mode === 'add') {
      this.resetCatForm();
    } else if (item) {
      this.newCatName = item.name;
      this.newCatSlug = item.slug;
      this.newCatType = this.activeTab;
      this.newCatStatus = item.status;
      this.newCatOrder = item.order;
      this.editingCategoryId = item.id;
      this.isCatSlugEdited = true;
    }
    this.isCategoryModalOpen = true;
    this.activeActionMenu = null;
  }

  setCategoryModalMode(mode: 'add' | 'edit' | 'view') {
    this.categoryModalMode = mode;
  }

  handleToggleStatus(item: Category) {
    alert(`Đã đổi trạng thái danh mục "${item.name}" thành: ${item.status === 'Hiển thị' ? 'Đã ẩn' : 'Hiển thị'} (Mô phỏng)`);
    this.activeActionMenu = null;
  }

  handleDeleteCategory(item: Category) {
    if (window.confirm(`Bạn có chắc chắn muốn xóa danh mục "${item.name}" không? Thao tác này không thể hoàn tác.`)) {
      alert('Đã xóa thành công (Mô phỏng)');
    }
    this.activeActionMenu = null;
  }

  toggleSelection(id: string, event: Event) {
    event.stopPropagation();
    if (this.selectedKeys.has(id)) {
      this.selectedKeys.delete(id);
    } else {
      this.selectedKeys.add(id);
    }
  }

  toggleSelectAll(event: Event) {
    event.stopPropagation();
    if (this.selectedKeys.size === this.filtered.length && this.filtered.length > 0) {
      this.selectedKeys.clear();
    } else {
      this.filtered.forEach(p => this.selectedKeys.add(p.id));
    }
  }

  isAllSelected() {
    return this.filtered.length > 0 && this.selectedKeys.size === this.filtered.length;
  }

  deleteSelected() {
    if(confirm(`Bạn có chắc muốn xóa ${this.selectedKeys.size} danh mục?`)) {
      this.selectedKeys.clear();
    }
  }

  getTabLabel(id: string) {
    return this.TABS.find(t => t.id === id)?.label || 'Chọn loại';
  }

  getSortedCategoriesForOrder() {
    const list = SAMPLE_CATEGORIES[this.newCatType] || [];
    return [...list].sort((a, b) => (a.order || 0) - (b.order || 0));
  }
}
