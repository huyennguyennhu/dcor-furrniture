import { Component, OnInit, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { 
  LucideAngularModule, 
  Folder, Layers, Search, Plus, Edit, Trash2, 
  AlertTriangle, Eye, EyeOff, CornerDownRight, Sparkles, Check, X, 
  Info, ExternalLink, Image as ImageIcon, Filter, Home, Palette, 
  CheckCircle2, Tag, ChevronDown, ChevronRight, ChevronLeft, RefreshCw
} from 'lucide-angular';

import { environment } from '../../../../../environments/environment';
import { AdminAuthService } from '../../../../core/services/admin-auth.service';
import { ProductService } from '../../../../core/services/product.service';
import {
  CategoryClassificationService,
  CategoryGroupType,
  CategoryItem,
  LinkedProduct,
  DEFAULT_SUB_CATEGORIES
} from '../../../../core/services/category-classification.service';

export type { CategoryGroupType, LinkedProduct, CategoryItem };

export const INITIAL_CATEGORIES: CategoryItem[] = [
  // ==========================================
  // 1. DANH MỤC CHÍNH (MAIN)
  // ==========================================
  {
    id: 'cat-sofa',
    name: 'Sofa & Ghế bành',
    slug: 'sofa-ghe-banh',
    description: 'Bộ sưu tập sofa góc L, sofa văng và ghế bành thư giãn cao cấp.',
    image: '/assets/img/furniture-placeholder.svg',
    type: 'main',
    parentId: null,
    sortOrder: 1,
    status: 'Hiển thị',
    productsCount: 12,
    linkedProducts: [
      { id: 'prod-001', name: 'Sofa Bergamo Góc L Chữ L', sku: 'DCOR-SF-BER' },
      { id: 'prod-005', name: 'Ghế Bành Thư Giãn Cenova Boucle', sku: 'DCOR-AC-CEN' }
    ]
  },
  {
    id: 'cat-sofa-l',
    name: 'Sofa Góc Chữ L Modula',
    slug: 'sofa-goc-chu-l',
    description: 'Dòng sofa góc tiện nghi dành cho phòng khách rộng.',
    image: '/assets/img/furniture-placeholder.svg',
    type: 'main',
    parentId: 'cat-sofa',
    parentName: 'Sofa & Ghế bành',
    sortOrder: 2,
    status: 'Hiển thị',
    productsCount: 4,
    linkedProducts: [
      { id: 'prod-001', name: 'Sofa Bergamo Góc L Chữ L', sku: 'DCOR-SF-BER' }
    ]
  },
  {
    id: 'cat-armchair',
    name: 'Ghế Bành Thư Giãn (Armchair)',
    slug: 'ghe-banh-thu-gian',
    description: 'Ghế đơn đọc sách bọc da Nappa hoặc vải lông cừu Boucle.',
    image: '/assets/img/furniture-placeholder.svg',
    type: 'main',
    parentId: 'cat-sofa',
    parentName: 'Sofa & Ghế bành',
    sortOrder: 3,
    status: 'Hiển thị',
    productsCount: 3,
    linkedProducts: [
      { id: 'prod-005', name: 'Ghế Bành Thư Giãn Cenova Boucle', sku: 'DCOR-AC-CEN' }
    ]
  },
  {
    id: 'cat-table',
    name: 'Bàn trà & Bàn góc',
    slug: 'ban-tra-ban-goc',
    description: 'Bàn trà mặt đá Ceramic, kính khói và chân thép sơn tĩnh điện.',
    image: '/assets/img/furniture-placeholder.svg',
    type: 'main',
    parentId: null,
    sortOrder: 4,
    status: 'Hiển thị',
    productsCount: 8,
    linkedProducts: [
      { id: 'prod-002', name: 'Bàn Trà Como Kính & Gỗ Óc Chó', sku: 'DCOR-TB-COM' }
    ]
  },
  {
    id: 'cat-bed',
    name: 'Phòng ngủ & Giường',
    slug: 'phong-ngu-giuong',
    description: 'Khung giường bọc đệm êm ái, tap đầu giường phong cách Bắc Âu.',
    image: '/assets/img/furniture-placeholder.svg',
    type: 'main',
    parentId: null,
    sortOrder: 5,
    status: 'Hiển thị',
    productsCount: 6,
    linkedProducts: [
      { id: 'prod-003', name: 'Giường Ngủ Lugano Đệm Bọc Tinh Tế', sku: 'DCOR-BD-LUG' }
    ]
  },
  {
    id: 'cat-dining',
    name: 'Bàn ăn & Ghế ăn',
    slug: 'ban-an-ghe-an',
    description: 'Bàn ăn thông minh kéo dài mặt ceramic chống trầy, ghế bọc da sang trọng.',
    image: '/assets/img/furniture-placeholder.svg',
    type: 'main',
    parentId: null,
    sortOrder: 6,
    status: 'Hiển thị',
    productsCount: 7,
    linkedProducts: [
      { id: 'prod-004', name: 'Bàn Ăn Santiago Mở Rộng Ceramic', sku: 'DCOR-DT-SAN' }
    ]
  },
  {
    id: 'cat-storage',
    name: 'Kệ & Tủ lưu trữ',
    slug: 'ke-tu-luu-tru',
    description: 'Kệ tivi, tủ sideboard và hệ thống tủ sách module tinh tế.',
    image: '/assets/img/furniture-placeholder.svg',
    type: 'main',
    parentId: null,
    sortOrder: 7,
    status: 'Hiển thị',
    productsCount: 5,
    linkedProducts: []
  },
  {
    id: 'cat-decor',
    name: 'Phụ kiện & Thảm trang trí',
    slug: 'phu-kien-tham-trang-tri',
    description: 'Thảm lông cừu, gối tựa và bình gốm thủ công nghệ thuật.',
    image: '/assets/img/furniture-placeholder.svg',
    type: 'main',
    parentId: null,
    sortOrder: 8,
    status: 'Đã ẩn',
    productsCount: 0,
    linkedProducts: []
  },

  // ==========================================
  // 2. DANH MỤC PHỤ & THUỘC TÍNH (Dùng chung từ PostgreSQL)
  // ==========================================
  ...DEFAULT_SUB_CATEGORIES
];

@Component({
  selector: 'app-product-categories',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LucideAngularModule],
  templateUrl: './product-categories.html',
  styleUrls: ['./product-categories.css']
})
export class ProductCategoriesComponent implements OnInit {
  icons = { 
    Folder, Layers, Search, Plus, Edit, Trash2, 
    AlertTriangle, Eye, EyeOff, CornerDownRight, Sparkles, Check, X, 
    Info, ExternalLink, ImageIcon, Filter, Home, Palette, 
    CheckCircle2, Tag, ChevronDown, ChevronRight, ChevronLeft, RefreshCw
  };

  allCategories: CategoryItem[] = [...INITIAL_CATEGORIES];
  filteredCategories: CategoryItem[] = [];
  isLoading = true;

  // Phân trang danh mục (10 danh mục / trang)
  currentPage = 1;
  pageSize = 10;

  // Set lưu trữ các danh mục chính đang được mở rộng danh mục con
  expandedIds: Set<string> = new Set<string>();

  // Phân cấp Tabs 2 cấp: Danh mục chính vs Danh mục phụ & Phân loại
  topLevelTab: 'main' | 'sub' = 'main';
  activeTab: CategoryGroupType = 'main';
  activeSubGroup: CategoryGroupType = 'room';

  groupTabs: Array<{ id: CategoryGroupType; label: string; icon: any }> = [
    { id: 'main', label: 'Danh mục chính', icon: Folder },
    { id: 'room', label: 'Phòng & Không gian', icon: Home },
    { id: 'collection', label: 'Bộ sưu tập', icon: Sparkles },
    { id: 'style', label: 'Phong cách', icon: Palette },
    { id: 'material', label: 'Chất liệu', icon: Layers }
  ];

  subCategoriesTabs: Array<{ id: CategoryGroupType; label: string; icon: any }> = [
    { id: 'room', label: 'Phòng & Không gian', icon: Home },
    { id: 'collection', label: 'Bộ sưu tập', icon: Sparkles },
    { id: 'style', label: 'Phong cách', icon: Palette },
    { id: 'material', label: 'Chất liệu', icon: Layers }
  ];

  // Search & Filter
  searchQuery = '';
  statusFilter = 'ALL';
  isStatusDropdownOpen = false;
  deleteConfirmInput = '';
  isDeleting = false;
  isSaving = false;

  // Modal Thêm / Chỉnh sửa
  isModalOpen = false;
  modalMode: 'add' | 'edit' = 'add';
  isSlugManuallyEdited = false;
  
  formData: {
    id: string;
    name: string;
    slug: string;
    type: CategoryGroupType;
    parentId: string | null;
    sortOrder: number;
    status: 'Hiển thị' | 'Đã ẩn';
    description: string;
    image: string;
  } = {
    id: '',
    name: '',
    slug: '',
    type: 'main',
    parentId: null,
    sortOrder: 1,
    status: 'Hiển thị',
    description: '',
    image: ''
  };

  formErrors: Record<string, string> = {};

  // Modal Xác nhận Thay đổi Trạng thái (Ẩn / Hiện có Cảnh báo)
  isConfirmToggleModalOpen = false;
  statusToggleTarget: CategoryItem | null = null;

  // Modal Ràng buộc Toàn vẹn khi Xóa (Delete Constraint Modal)
  isConstraintModalOpen = false;
  isConfirmDeleteModalOpen = false;
  categoryTarget: CategoryItem | null = null;

  // Feedback Toast
  toastMessage: string | null = null;
  toastType: 'success' | 'warning' | 'info' | 'error' = 'success';
  private toastTimer: any = null;

  constructor(
    private router: Router,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    public adminAuthService: AdminAuthService,
    private productService: ProductService,
    private categoryClassificationService: CategoryClassificationService
  ) {}

  get canCreate(): boolean {
    return this.adminAuthService.hasPermission('categories', 'create');
  }

  get canEdit(): boolean {
    return this.adminAuthService.hasPermission('categories', 'edit');
  }

  get canDelete(): boolean {
    return this.adminAuthService.hasPermission('categories', 'delete');
  }

  ngOnInit() {
    // Không tự động sổ danh mục con - chỉ hiển thị danh mục cha trước giống như danh mục chính
    this.expandedIds.clear();
    this.loadCategories();
  }

  loadCategories() {
    this.isLoading = true;

    // Tải đồng thời Danh mục chính và Danh mục phụ từ Database Backend (PostgreSQL) — KHÔNG dùng localStorage
    forkJoin({
      main: this.http.get<any>(`${environment.apiUrl}/admin/categories`).pipe(catchError(() => of(null))),
      sub: this.http.get<{ items?: CategoryItem[] }>(`${environment.apiUrl}/admin/categories/sub`).pipe(
        catchError(() => this.http.get<{ items?: CategoryItem[] }>(`${environment.apiUrl}/sub-categories`).pipe(catchError(() => of(null))))
      )
    }).subscribe(({ main, sub }) => {
      const tree = main?.tree || [];
      let mainCats: CategoryItem[];

      if (Array.isArray(tree) && tree.length > 0) {
        const apiCats: CategoryItem[] = [];
        let sortIdx = 1;

        tree.forEach((parent: any) => {
          const parentCount = parent._count?.products || 0;
          apiCats.push({
            id: parent.id,
            name: parent.name,
            slug: parent.slug,
            description: '',
            image: '',
            type: 'main',
            parentId: null,
            parentName: undefined,
            sortOrder: parent.sortOrder || sortIdx++,
            status: parent.isActive ? 'Hiển thị' : 'Đã ẩn',
            productsCount: parentCount,
            linkedProducts: []
          });

          if (Array.isArray(parent.children) && parent.children.length > 0) {
            parent.children.forEach((child: any) => {
              const childCount = child._count?.products || 0;
              apiCats.push({
                id: child.id,
                name: child.name,
                slug: child.slug,
                description: '',
                image: '',
                type: 'main',
                parentId: parent.id,
                parentName: parent.name,
                sortOrder: child.sortOrder || sortIdx++,
                status: child.isActive ? 'Hiển thị' : 'Đã ẩn',
                productsCount: childCount,
                linkedProducts: childCount > 0 ? [
                  { id: `prod-${child.id}`, name: `Sản phẩm thuộc ${child.name}`, sku: `DCOR-${child.slug.toUpperCase().slice(0, 8)}` }
                ] : []
              });
            });
          }
        });
        mainCats = apiCats;
      } else {
        mainCats = INITIAL_CATEGORIES.filter(c => c.type === 'main');
      }

      const subCats: CategoryItem[] = Array.isArray(sub?.items) && sub.items.length > 0
        ? sub.items
        : [...DEFAULT_SUB_CATEGORIES];

      this.categoryClassificationService.setCategories(subCats);
      this.allCategories = [...mainCats, ...subCats];
      this.isLoading = false;
      this.applyFilters();
      this.cdr.detectChanges();
    });
  }

  // Lấy các danh mục gốc (cấp 1 / cha) để hiển thị trên bảng
  get rootCategories(): CategoryItem[] {
    const currentType = this.topLevelTab === 'main' ? 'main' : 'sub';
    return this.filteredCategories.filter(c => c.type === currentType && !c.parentId);
  }

  // Phân trang 10 mục / trang
  get paginatedCategories(): CategoryItem[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.rootCategories.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.rootCategories.length / this.pageSize) || 1;
  }

  get pagesArray(): Array<number | '...'> {
    const total = this.totalPages;
    const current = this.currentPage;

    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    if (current <= 4) {
      return [1, 2, 3, 4, 5, '...', total];
    }

    if (current >= total - 3) {
      return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
    }

    return [1, '...', current - 1, current, current + 1, '...', total];
  }

  onPageClick(p: number | '...') {
    if (typeof p === 'number') {
      this.goToPage(p);
    }
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.cdr.detectChanges();
    }
  }

  // Lấy các danh mục con của 1 danh mục cha
  getSubcategories(parentId: string): CategoryItem[] {
    const currentType = this.topLevelTab === 'main' ? 'main' : 'sub';
    let children = this.allCategories.filter(c => c.type === currentType && c.parentId === parentId);
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.trim().toLowerCase();
      children = children.filter(c => c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q));
    }
    if (this.statusFilter !== 'ALL') {
      children = children.filter(c => c.status === this.statusFilter);
    }
    return children.sort((a, b) => a.sortOrder - b.sortOrder);
  }

  // Đóng / mở danh mục con
  toggleExpand(catId: string, event?: Event) {
    if (event) event.stopPropagation();
    if (this.expandedIds.has(catId)) {
      this.expandedIds.delete(catId);
    } else {
      this.expandedIds.add(catId);
    }
  }

  isExpanded(catId: string): boolean {
    return this.expandedIds.has(catId);
  }

  // Đếm số lượng theo từng Tab
  getCountByGroup(type: CategoryGroupType): number {
    return this.allCategories.filter(c => c.type === type).length;
  }

  // Tổng số lượng các phân loại phụ
  getSubCategoriesTotalCount(): number {
    return this.allCategories.filter(c => c.type === 'sub').length;
  }

  // Chuyển Tab Cấp 1: Danh mục chính vs Danh mục phụ
  switchTopLevelTab(level: 'main' | 'sub') {
    this.topLevelTab = level;
    this.activeTab = level;
    this.searchQuery = '';
    this.statusFilter = 'ALL';
    this.currentPage = 1;
    this.expandedIds.clear(); // Thu gọn toàn bộ, chỉ hiển thị danh mục cha trước
    this.applyFilters();
    this.cdr.detectChanges();
  }

  // Chuyển Tab (tương thích)
  setTab(tab: CategoryGroupType) {
    this.topLevelTab = tab === 'main' ? 'main' : 'sub';
    this.activeTab = this.topLevelTab;
    this.searchQuery = '';
    this.statusFilter = 'ALL';
    this.currentPage = 1;
    this.expandedIds.clear(); // Thu gọn toàn bộ, chỉ hiển thị danh mục cha trước
    this.applyFilters();
    this.cdr.detectChanges();
  }

  // Áp dụng bộ lọc
  
  toggleStatusDropdown(event?: Event) {
    if (event) event.stopPropagation();
    this.isStatusDropdownOpen = !this.isStatusDropdownOpen;
  }

  selectStatusFilter(val: string) {
    this.statusFilter = val;
    this.isStatusDropdownOpen = false;
    this.applyFilters();
  }

  get selectedStatusLabel(): string {
    if (this.statusFilter === 'Hiển thị') return 'Chỉ mục Hiển thị';
    if (this.statusFilter === 'Đã ẩn') return 'Chỉ mục Đã ẩn';
    return 'Tất cả trạng thái';
  }

  get isAllExpanded(): boolean {
    const list = this.paginatedCategories.filter(c => this.getSubcategories(c.id).length > 0);
    return list.length > 0 && list.every(c => this.expandedIds.has(c.id));
  }

  toggleExpandAll() {
    const list = this.paginatedCategories.filter(c => this.getSubcategories(c.id).length > 0);
    if (this.isAllExpanded) {
      list.forEach(c => this.expandedIds.delete(c.id));
    } else {
      list.forEach(c => this.expandedIds.add(c.id));
    }
  }

  applyFilters() {
    this.currentPage = 1;
    const currentType = this.topLevelTab === 'main' ? 'main' : 'sub';
    let list = this.allCategories.filter(c => c.type === currentType);

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.trim().toLowerCase();
      list = list.filter(c => 
        c.name.toLowerCase().includes(q) || 
        c.slug.toLowerCase().includes(q) ||
        (c.description && c.description.toLowerCase().includes(q))
      );
    }

    if (this.statusFilter !== 'ALL') {
      list = list.filter(c => c.status === this.statusFilter);
    }

    list.sort((a, b) => a.sortOrder - b.sortOrder);
    this.filteredCategories = list;
  }

  get availableParentCategories(): CategoryItem[] {
    const currentType = this.topLevelTab === 'main' ? 'main' : 'sub';
    return this.allCategories.filter(c => c.type === currentType && !c.parentId && c.id !== this.formData.id);
  }

  // Custom Dropdown cho Modal Thêm/Sửa Danh mục
  isModalParentDropdownOpen = false;

  get selectedParentLabel(): string {
    if (!this.formData.parentId) {
      return '-- Không có (Danh mục gốc cấp 1) --';
    }
    const found = this.availableParentCategories.find(p => p.id === this.formData.parentId);
    return found ? found.name : '-- Không có (Danh mục gốc cấp 1) --';
  }

  toggleModalParentDropdown(e?: Event) {
    if (e) e.stopPropagation();
    this.isModalParentDropdownOpen = !this.isModalParentDropdownOpen;
  }

  selectModalParent(parentId: string | null) {
    this.formData.parentId = parentId;
    this.isModalParentDropdownOpen = false;
  }

  @HostListener('document:click')
  onDocumentClick() {
    this.isModalParentDropdownOpen = false;
  }

  get activeGroupLabel(): string {
    return this.topLevelTab === 'main' ? 'Danh mục chính' : 'Danh mục phụ';
  }

  // --- CẢNH BÁO XÁC NHẬN CHUYỂN TRẠNG THÁI (ẨN / HIỆN) ---
  requestToggleStatus(item: CategoryItem, event: Event) {
    event.stopPropagation();
    this.statusToggleTarget = item;
    this.isConfirmToggleModalOpen = true;
  }

  closeToggleModal() {
    this.isConfirmToggleModalOpen = false;
    this.statusToggleTarget = null;
  }

  confirmToggleStatus() {
    if (!this.statusToggleTarget) return;

    const target = this.statusToggleTarget;
    const isNowHidden = target.status === 'Hiển thị';
    const newStatusText = isNowHidden ? 'Đã ẩn' : 'Hiển thị';

    // Gọi API Backend đồng bộ cho cả danh mục chính & danh mục phụ
    if (target.type === 'main') {
      this.http.patch<any>(`${environment.apiUrl}/admin/categories/${target.id}/status`, {}).subscribe({
        next: () => {
          target.status = newStatusText;
          this.productService.clearCache();
          this.showToast(`Đã chuyển danh mục "${target.name}" sang trạng thái ${newStatusText}!`, 'success');
          this.closeToggleModal();
          this.applyFilters();
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.showToast(err?.error?.message || 'Lỗi: Máy chủ từ chối cập nhật trạng thái danh mục (403 Forbidden).', 'error');
          this.closeToggleModal();
        }
      });
    } else {
      this.http.patch<any>(`${environment.apiUrl}/admin/categories/sub/${target.id}/status`, {}).subscribe({
        next: () => {
          target.status = newStatusText;
          this.categoryClassificationService.setCategories(this.allCategories.filter(c => c.type !== 'main'));
          this.categoryClassificationService.refresh();
          this.showToast(`Đã chuyển "${target.name}" sang trạng thái ${newStatusText}!`, 'success');
          this.closeToggleModal();
          this.applyFilters();
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.showToast(err?.error?.message || 'Lỗi: Máy chủ từ chối cập nhật trạng thái danh mục phụ.', 'error');
          this.closeToggleModal();
        }
      });
    }
  }

  // --- MODAL THÊM / SỬA DANH MỤC ---
  openAddModal() {
    this.modalMode = 'add';
    this.isSlugManuallyEdited = false;
    this.isModalParentDropdownOpen = false;
    this.formErrors = {};

    const currentType = this.topLevelTab === 'main' ? 'main' : 'sub';
    const maxOrder = this.allCategories.filter(c => c.type === currentType).reduce((max, c) => Math.max(max, c.sortOrder), 0);
    this.formData = {
      id: `${currentType}-${Date.now().toString().slice(-4)}`,
      name: '',
      slug: '',
      type: currentType,
      parentId: null,
      sortOrder: maxOrder + 1,
      status: 'Hiển thị',
      description: '',
      image: ''
    };

    this.isModalOpen = true;
  }

  openEditModal(item: CategoryItem, event: Event) {
    event.stopPropagation();
    this.modalMode = 'edit';
    this.isSlugManuallyEdited = true;
    this.isModalParentDropdownOpen = false;
    this.formErrors = {};

    this.formData = {
      id: item.id,
      name: item.name,
      slug: item.slug,
      type: item.type,
      parentId: item.parentId || null,
      sortOrder: item.sortOrder,
      status: item.status,
      description: item.description || '',
      image: item.image || ''
    };

    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }

  onNameInput() {
    delete this.formErrors['name'];
    if (!this.isSlugManuallyEdited) {
      this.formData.slug = this.slugify(this.formData.name);
    }
  }

  onSlugInput() {
    this.isSlugManuallyEdited = true;
    delete this.formErrors['slug'];
  }

  saveCategory() {
    this.formErrors = {};

    if (!this.formData.name.trim()) {
      this.formErrors['name'] = 'Vui lòng nhập tên danh mục/phân loại';
    }

    if (!this.formData.slug.trim()) {
      this.formErrors['slug'] = 'Vui lòng nhập đường dẫn tĩnh (slug)';
    }

    if (Object.keys(this.formErrors).length > 0) {
      return;
    }

    let pName: string | undefined = undefined;
    if (this.formData.parentId) {
      const p = this.allCategories.find(c => c.id === this.formData.parentId);
      if (p) pName = p.name;
    }

    const payload = {
      name: this.formData.name.trim(),
      parentId: this.formData.parentId,
      sortOrder: Number(this.formData.sortOrder) || 1,
      isActive: this.formData.status === 'Hiển thị'
    };

    if (this.modalMode === 'add') {
      if (this.activeTab === 'main') {
        this.http.post<any>(`${environment.apiUrl}/admin/categories`, payload).subscribe({
          next: (res) => {
            const created = res.category || {};
            this.allCategories.push({
              id: created.id || this.formData.id,
              name: this.formData.name.trim(),
              slug: created.slug || this.formData.slug.trim(),
              description: this.formData.description.trim(),
              image: this.formData.image.trim() || '/assets/img/furniture-placeholder.svg',
              type: this.formData.type,
              parentId: this.formData.parentId,
              parentName: pName,
              sortOrder: Number(this.formData.sortOrder) || 1,
              status: this.formData.status,
              productsCount: 0,
              linkedProducts: []
            });
            this.productService.clearCache();
            this.showToast(`Đã thêm mới danh mục "${this.formData.name}" vào cơ sở dữ liệu!`, 'success');
            this.closeModal();
            this.applyFilters();
            this.cdr.detectChanges();
          },
          error: (err) => {
            this.showToast(err?.error?.message || 'Máy chủ từ chối: Bạn không có quyền thêm mới danh mục! (403 Forbidden)', 'error');
            this.closeModal();
          }
        });
      } else {
        const subPayload = {
          id: this.formData.id,
          name: this.formData.name.trim(),
          slug: this.formData.slug.trim(),
          description: this.formData.description.trim(),
          image: this.formData.image.trim(),
          parentId: this.formData.parentId,
          sortOrder: Number(this.formData.sortOrder) || 1,
          status: this.formData.status,
          isActive: this.formData.status === 'Hiển thị'
        };
        this.http.post<any>(`${environment.apiUrl}/admin/categories/sub`, subPayload).subscribe({
          next: (res) => {
            const created: CategoryItem = res?.category || {
              id: this.formData.id,
              name: this.formData.name.trim(),
              slug: this.formData.slug.trim(),
              description: this.formData.description.trim(),
              image: this.formData.image.trim(),
              type: 'sub',
              parentId: this.formData.parentId,
              parentName: pName,
              sortOrder: Number(this.formData.sortOrder) || 1,
              status: this.formData.status,
              productsCount: 0,
              linkedProducts: []
            };
            this.allCategories.push(created);
            this.categoryClassificationService.setCategories(this.allCategories.filter(c => c.type !== 'main'));
            this.categoryClassificationService.refresh();
            this.showToast(`Đã thêm mới ${this.activeGroupLabel} "${created.name}" vào cơ sở dữ liệu!`, 'success');
            this.closeModal();
            this.applyFilters();
            this.cdr.detectChanges();
          },
          error: (err) => {
            this.showToast(err?.error?.message || 'Không thể thêm mới danh mục phụ vào cơ sở dữ liệu.', 'error');
            this.closeModal();
          }
        });
      }
    } else {
      if (this.activeTab === 'main') {
        this.http.put<any>(`${environment.apiUrl}/admin/categories/${this.formData.id}`, payload).subscribe({
          next: () => {
            const index = this.allCategories.findIndex(c => c.id === this.formData.id);
            if (index > -1) {
              this.allCategories[index] = {
                ...this.allCategories[index],
                name: this.formData.name.trim(),
                slug: this.formData.slug.trim(),
                description: this.formData.description.trim(),
                image: this.formData.image.trim(),
                parentId: this.formData.parentId,
                parentName: pName,
                sortOrder: Number(this.formData.sortOrder) || 1,
                status: this.formData.status
              };
            }
            this.productService.clearCache();
            this.showToast(`Đã cập nhật danh mục "${this.formData.name}" thành công!`, 'success');
            this.closeModal();
            this.applyFilters();
            this.cdr.detectChanges();
          },
          error: (err) => {
            this.showToast(err?.error?.message || 'Máy chủ từ chối: Bạn không có quyền cập nhật danh mục! (403 Forbidden)', 'error');
            this.closeModal();
          }
        });
      } else {
        const subPayload = {
          name: this.formData.name.trim(),
          slug: this.formData.slug.trim(),
          description: this.formData.description.trim(),
          image: this.formData.image.trim(),
          parentId: this.formData.parentId,
          sortOrder: Number(this.formData.sortOrder) || 1,
          status: this.formData.status,
          isActive: this.formData.status === 'Hiển thị'
        };
        this.http.put<any>(`${environment.apiUrl}/admin/categories/sub/${this.formData.id}`, subPayload).subscribe({
          next: (res) => {
            const updated: CategoryItem | undefined = res?.category;
            const index = this.allCategories.findIndex(c => c.id === this.formData.id);
            if (index > -1) {
              this.allCategories[index] = updated || {
                ...this.allCategories[index],
                name: this.formData.name.trim(),
                slug: this.formData.slug.trim(),
                description: this.formData.description.trim(),
                image: this.formData.image.trim(),
                parentId: this.formData.parentId,
                parentName: pName,
                sortOrder: Number(this.formData.sortOrder) || 1,
                status: this.formData.status
              };
              // Cập nhật parentName cho các mục con nếu sửa tên nhóm cha
              this.allCategories.forEach(c => {
                if (c.parentId === this.formData.id) {
                  c.parentName = this.formData.name.trim();
                }
              });
            }
            this.categoryClassificationService.setCategories(this.allCategories.filter(c => c.type !== 'main'));
            this.categoryClassificationService.refresh();
            this.showToast(`Đã cập nhật ${this.activeGroupLabel} "${this.formData.name}" thành công!`, 'success');
            this.closeModal();
            this.applyFilters();
            this.cdr.detectChanges();
          },
          error: (err) => {
            this.showToast(err?.error?.message || 'Không thể cập nhật danh mục phụ.', 'error');
            this.closeModal();
          }
        });
      }
    }
  }

  setSampleImage(url: string) {
    this.formData.image = url;
  }

  // --- RÀNG BUỘC TOÀN VẸN KHI XÓA (DELETE CONSTRAINT MODAL) ---
  handleDeleteClick(item: CategoryItem, event: Event) {
    event.stopPropagation();
    this.categoryTarget = item;

    if (item.productsCount > 0) {
      this.isConstraintModalOpen = true;
    } else {
      this.isConfirmDeleteModalOpen = true;
    }
  }

  closeConstraintModal() {
    this.isConstraintModalOpen = false;
    this.categoryTarget = null;
  }

  closeConfirmDeleteModal() {
    this.deleteConfirmInput = "";
    this.isDeleting = false;
    this.isConfirmDeleteModalOpen = false;
    this.categoryTarget = null;
  }

  confirmDelete() {
    if (!this.categoryTarget) return;

    const targetId = this.categoryTarget.id;
    const targetName = this.categoryTarget.name;

    if (this.categoryTarget.type === 'main') {
      this.http.delete<any>(`${environment.apiUrl}/admin/categories/${targetId}`).subscribe({
        next: () => {
          this.allCategories = this.allCategories.filter(c => c.id !== targetId);
          this.productService.clearCache();
          this.showToast(`Đã xóa danh mục "${targetName}" khỏi cơ sở dữ liệu!`, 'success');
          this.closeConfirmDeleteModal();
          this.applyFilters();
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.showToast(err?.error?.message || 'Không thể xóa danh mục.', 'error');
          this.closeConfirmDeleteModal();
        }
      });
    } else {
      this.http.delete<any>(`${environment.apiUrl}/admin/categories/sub/${targetId}`).subscribe({
        next: () => {
          this.allCategories = this.allCategories.filter(c => c.id !== targetId);
          this.categoryClassificationService.setCategories(this.allCategories.filter(c => c.type !== 'main'));
          this.categoryClassificationService.refresh();
          this.showToast(`Đã xóa "${targetName}" khỏi cơ sở dữ liệu!`, 'success');
          this.closeConfirmDeleteModal();
          this.applyFilters();
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.showToast(err?.error?.message || 'Không thể xóa danh mục phụ.', 'error');
          this.closeConfirmDeleteModal();
        }
      });
    }
  }

  viewProduct(prodId: string) {
    this.closeConstraintModal();
    this.router.navigate(['/admin/products', prodId]);
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
