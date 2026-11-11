import { Component, OnInit, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { 
  LucideAngularModule, 
  Folder, Layers, Search, Plus, Edit, Trash2, 
  AlertTriangle, Eye, EyeOff, CornerDownRight, Sparkles, Check, X, 
  Info, ExternalLink, Image as ImageIcon, Filter, Home, Palette, 
  CheckCircle2, Tag, ChevronDown, ChevronRight, ChevronLeft, RefreshCw
} from 'lucide-angular';

import { environment } from '../../../../../environments/environment';
import { AdminAuthService } from '../../../../core/services/admin-auth.service';

export type CategoryGroupType = 'main' | 'sub' | 'room' | 'collection' | 'style' | 'material';

export interface LinkedProduct {
  id: string;
  name: string;
  sku: string;
}

export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  type: CategoryGroupType;
  parentId?: string | null;
  parentName?: string;
  sortOrder: number;
  status: 'Hiển thị' | 'Đã ẩn';
  productsCount: number;
  linkedProducts?: LinkedProduct[];
}

export const INITIAL_CATEGORIES: CategoryItem[] = [
  // ==========================================
  // 1. DANH MỤC CHÍNH (MAIN)
  // ==========================================
  {
    id: 'cat-sofa',
    name: 'Sofa & Ghế bành',
    slug: 'sofa-ghe-banh',
    description: 'Bộ sưu tập sofa góc L, sofa văng và ghế bành thư giãn cao cấp.',
    image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=300&q=80',
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
    image: 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=300&q=80',
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
    image: 'https://images.unsplash.com/photo-1580481077195-c9b83b3e6c0c?auto=format&fit=crop&w=300&q=80',
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
    image: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=300&q=80',
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
    image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=300&q=80',
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
    image: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=300&q=80',
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
    image: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=300&q=80',
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
    image: 'https://images.unsplash.com/photo-1616046229478-9901c5536a45?auto=format&fit=crop&w=300&q=80',
    type: 'main',
    parentId: null,
    sortOrder: 8,
    status: 'Đã ẩn',
    productsCount: 0,
    linkedProducts: []
  },

  // ==========================================
  // 2. DANH MỤC PHỤ: CÁC NHÓM CHA CẤP 1
  // ==========================================
  {
    id: 'sub-room',
    name: 'Không gian & Phòng ứng dụng',
    slug: 'khong-gian-phong',
    description: 'Phân loại theo khu vực và không gian bài trí nội thất.',
    image: '',
    type: 'sub',
    parentId: null,
    sortOrder: 1,
    status: 'Hiển thị',
    productsCount: 36,
    linkedProducts: []
  },
  {
    id: 'sub-collection',
    name: 'Bộ sưu tập',
    slug: 'bo-suu-tap',
    description: 'Các bộ sưu tập thiết kế đồng bộ của thương hiệu DCor.',
    image: '',
    type: 'sub',
    parentId: null,
    sortOrder: 2,
    status: 'Hiển thị',
    productsCount: 23,
    linkedProducts: []
  },
  {
    id: 'sub-style',
    name: 'Phong cách thiết kế',
    slug: 'phong-cach',
    description: 'Các trường phái kiến trúc và ngôn ngữ nội thất.',
    image: '',
    type: 'sub',
    parentId: null,
    sortOrder: 3,
    status: 'Hiển thị',
    productsCount: 44,
    linkedProducts: []
  },
  {
    id: 'sub-material',
    name: 'Chất liệu chế tác',
    slug: 'chat-lieu',
    description: 'Vật liệu cấu thành: Da thật, nỉ, gỗ sồi, gỗ óc chó, đá ceramic.',
    image: '',
    type: 'sub',
    parentId: null,
    sortOrder: 4,
    status: 'Hiển thị',
    productsCount: 43,
    linkedProducts: []
  },

  // ==========================================
  // 2.1 CÁC CON CỦA KHÔNG GIAN (sub-room)
  // ==========================================
  {
    id: 'rm-living',
    name: 'Phòng khách',
    slug: 'phong-khach',
    description: 'Không gian sum họp tiện nghi với sofa, bàn trà và hệ tủ tivi.',
    image: '',
    type: 'sub',
    parentId: 'sub-room',
    parentName: 'Không gian & Phòng ứng dụng',
    sortOrder: 1,
    status: 'Hiển thị',
    productsCount: 15,
    linkedProducts: []
  },
  {
    id: 'rm-dining',
    name: 'Phòng ăn',
    slug: 'phong-an',
    description: 'Khu vực gắn kết gia đình với bộ bàn ghế ăn cao cấp.',
    image: '',
    type: 'sub',
    parentId: 'sub-room',
    parentName: 'Không gian & Phòng ứng dụng',
    sortOrder: 2,
    status: 'Hiển thị',
    productsCount: 8,
    linkedProducts: []
  },
  {
    id: 'rm-bed',
    name: 'Phòng ngủ',
    slug: 'phong-ngu',
    description: 'Không gian nghỉ ngơi thư thái với giường êm ái và tap đầu giường.',
    image: '',
    type: 'sub',
    parentId: 'sub-room',
    parentName: 'Không gian & Phòng ứng dụng',
    sortOrder: 3,
    status: 'Hiển thị',
    productsCount: 9,
    linkedProducts: []
  },
  {
    id: 'rm-work',
    name: 'Phòng làm việc',
    slug: 'phong-lam-viec',
    description: 'Bàn làm việc thông minh và ghế công thái học bọc da cao cấp.',
    image: '',
    type: 'sub',
    parentId: 'sub-room',
    parentName: 'Không gian & Phòng ứng dụng',
    sortOrder: 4,
    status: 'Hiển thị',
    productsCount: 4,
    linkedProducts: []
  },
  {
    id: 'rm-outdoor',
    name: 'Ngoài trời & Ban công',
    slug: 'ngoai-troi-ban-cong',
    description: 'Bàn ghế cafe ngoài trời kháng tia UV và chịu mưa nắng bền bỉ.',
    image: '',
    type: 'sub',
    parentId: 'sub-room',
    parentName: 'Không gian & Phòng ứng dụng',
    sortOrder: 5,
    status: 'Đã ẩn',
    productsCount: 0,
    linkedProducts: []
  },

  // ==========================================
  // 2.2 CÁC CON CỦA BỘ SƯU TẬP (sub-collection)
  // ==========================================
  {
    id: 'col-bergamo',
    name: 'Bộ sưu tập Bergamo',
    slug: 'bo-suu-tap-bergamo',
    description: 'Dòng sản phẩm mang cảm hứng Bắc Âu đương đại với các đường bo viền hữu cơ.',
    image: '',
    type: 'sub',
    parentId: 'sub-collection',
    parentName: 'Bộ sưu tập',
    sortOrder: 1,
    status: 'Hiển thị',
    productsCount: 6,
    linkedProducts: []
  },
  {
    id: 'col-como',
    name: 'Bộ sưu tập Como',
    slug: 'bo-suu-tap-como',
    description: 'Sự kết hợp tinh tế giữa kính khói, gỗ óc chó và thép đen nhám.',
    image: '',
    type: 'sub',
    parentId: 'sub-collection',
    parentName: 'Bộ sưu tập',
    sortOrder: 2,
    status: 'Hiển thị',
    productsCount: 4,
    linkedProducts: []
  },
  {
    id: 'col-lugano',
    name: 'Bộ sưu tập Lugano',
    slug: 'bo-suu-tap-lugano',
    description: 'Thiết kế phòng ngủ và giường tối giản với đệm bọc đầu giường trang nhã.',
    image: '',
    type: 'sub',
    parentId: 'sub-collection',
    parentName: 'Bộ sưu tập',
    sortOrder: 3,
    status: 'Hiển thị',
    productsCount: 5,
    linkedProducts: []
  },
  {
    id: 'col-santiago',
    name: 'Bộ sưu tập Santiago',
    slug: 'bo-suu-tap-santiago',
    description: 'Dòng bàn ăn thông minh ceramic và ghế ăn da bò thủ công.',
    image: '',
    type: 'sub',
    parentId: 'sub-collection',
    parentName: 'Bộ sưu tập',
    sortOrder: 4,
    status: 'Hiển thị',
    productsCount: 5,
    linkedProducts: []
  },
  {
    id: 'col-cenova',
    name: 'Bộ sưu tập Cenova',
    slug: 'bo-suu-tap-cenova',
    description: 'Ghế bành đơn thư giãn bọc vải Boucle mềm mại.',
    image: '',
    type: 'sub',
    parentId: 'sub-collection',
    parentName: 'Bộ sưu tập',
    sortOrder: 5,
    status: 'Hiển thị',
    productsCount: 3,
    linkedProducts: []
  },

  // ==========================================
  // 2.3 CÁC CON CỦA PHONG CÁCH (sub-style)
  // ==========================================
  {
    id: 'st-nordic',
    name: 'Bắc Âu (Scandinavian)',
    slug: 'bac-au-scandinavian',
    description: 'Phong cách đề cao ánh sáng tự nhiên, đường nét mộc mạc và tone màu trung tính.',
    image: '',
    type: 'sub',
    parentId: 'sub-style',
    parentName: 'Phong cách thiết kế',
    sortOrder: 1,
    status: 'Hiển thị',
    productsCount: 12,
    linkedProducts: []
  },
  {
    id: 'st-modern',
    name: 'Hiện đại (Modern Luxury)',
    slug: 'hien-dai-modern-luxury',
    description: 'Đường nét dứt khoát, kết hợp kim loại mạ vàng PVD và đá cẩm thạch sang trọng.',
    image: '',
    type: 'sub',
    parentId: 'sub-style',
    parentName: 'Phong cách thiết kế',
    sortOrder: 2,
    status: 'Hiển thị',
    productsCount: 18,
    linkedProducts: []
  },
  {
    id: 'st-minimal',
    name: 'Tối giản (Minimalism)',
    slug: 'toi-gian-minimalism',
    description: 'Loại bỏ chi tiết thừa, tập trung vào công năng và chất lượng vật liệu nguyên bản.',
    image: '',
    type: 'sub',
    parentId: 'sub-style',
    parentName: 'Phong cách thiết kế',
    sortOrder: 3,
    status: 'Hiển thị',
    productsCount: 14,
    linkedProducts: []
  },
  {
    id: 'st-japandi',
    name: 'Japandi',
    slug: 'japandi',
    description: 'Sự giao thoa hoàn hảo giữa thẩm mỹ tối giản Nhật Bản và sự ấm cúng Bắc Âu.',
    image: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=300&q=80',
    type: 'style',
    sortOrder: 4,
    status: 'Hiển thị',
    productsCount: 10,
    linkedProducts: []
  },
  {
    id: 'st-wabisabi',
    name: 'Wabi-Sabi',
    slug: 'wabi-sabi',
    description: 'Vẻ đẹp của sự mộc mạc, bất toàn và hài hòa với thiên nhiên.',
    image: 'https://images.unsplash.com/photo-1616046229478-9901c5536a45?auto=format&fit=crop&w=300&q=80',
    type: 'style',
    sortOrder: 5,
    status: 'Hiển thị',
    productsCount: 8,
    linkedProducts: []
  },
  {
    id: 'st-industrial',
    name: 'Công nghiệp (Industrial)',
    slug: 'industrial',
    description: 'Phong cách phóng khoáng với khung kim loại, thép đen và bề mặt bê tông độc đáo.',
    image: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=300&q=80',
    type: 'style',
    sortOrder: 6,
    status: 'Hiển thị',
    productsCount: 7,
    linkedProducts: []
  },

  // ==========================================
  // 2.4 CÁC CON CỦA CHẤT LIỆU (sub-material)
  // ==========================================
  {
    id: 'mat-leather-real',
    name: 'Da bò Aniline Ý thật',
    slug: 'da-bo-aniline-y',
    description: 'Chất liệu da thượng hạng mềm mịn, lưu giữ vân da tự nhiên và càng dùng càng bóng đẹp.',
    image: '',
    type: 'sub',
    parentId: 'sub-material',
    parentName: 'Chất liệu chế tác',
    sortOrder: 1,
    status: 'Hiển thị',
    productsCount: 6,
    linkedProducts: []
  },
  {
    id: 'mat-fabric-felt',
    name: 'Vải nỉ Copenhagen',
    slug: 'vai-ni-copenhagen',
    description: 'Vải dệt cao cấp chống bám bụi, độ bền sợi cao và tạo cảm giác ấm cúng.',
    image: '',
    type: 'sub',
    parentId: 'sub-material',
    parentName: 'Chất liệu chế tác',
    sortOrder: 2,
    status: 'Hiển thị',
    productsCount: 15,
    linkedProducts: []
  },
  {
    id: 'mat-wood-oak',
    name: 'Gỗ sồi (Oak) tự nhiên',
    slug: 'go-soi-tu-nhien',
    description: 'Gỗ sồi nhập khẩu Bắc Mỹ tẩm sấy chống cong vênh mối mọt, vân gỗ sáng trang nhã.',
    image: '',
    type: 'sub',
    parentId: 'sub-material',
    parentName: 'Chất liệu chế tác',
    sortOrder: 3,
    status: 'Hiển thị',
    productsCount: 10,
    linkedProducts: []
  },
  {
    id: 'mat-wood-walnut',
    name: 'Gỗ óc chó (Walnut) thượng hạng',
    slug: 'go-oc-cho-walnut',
    description: 'Tone màu nâu trầm sang trọng với những đường vân cuộn sóng lôi cuốn.',
    image: '',
    type: 'sub',
    parentId: 'sub-material',
    parentName: 'Chất liệu chế tác',
    sortOrder: 4,
    status: 'Hiển thị',
    productsCount: 8,
    linkedProducts: []
  },
  {
    id: 'mat-ceramic',
    name: 'Gốm Ceramic chống trầy',
    slug: 'gom-ceramic-chong-tray',
    description: 'Mặt bàn ceramic công nghệ nung nhiệt cao, chống trầy xước, chống ố màu và chịu nhiệt tuyệt đối.',
    image: '',
    type: 'sub',
    parentId: 'sub-material',
    parentName: 'Chất liệu chế tác',
    sortOrder: 5,
    status: 'Hiển thị',
    productsCount: 4,
    linkedProducts: []
  }
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
  isLoading = false;

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
    public adminAuthService: AdminAuthService
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
    
    // Tải danh mục thực tế từ Database Backend (/api/admin/categories)
    this.http.get<any>(`${environment.apiUrl}/admin/categories`).subscribe({
      next: (res) => {
        const tree = res.tree || [];
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

          const otherGroups = this.getStoredNonMainCategories();
          this.allCategories = [...apiCats, ...otherGroups];
        } else {
          this.allCategories = [...INITIAL_CATEGORIES.filter(c => c.type === 'main'), ...this.getStoredNonMainCategories()];
        }
        this.isLoading = false;
        this.applyFilters();
        this.cdr.detectChanges();
      },
      error: () => {
        this.allCategories = [...INITIAL_CATEGORIES.filter(c => c.type === 'main'), ...this.getStoredNonMainCategories()];
        this.isLoading = false;
        this.applyFilters();
        this.cdr.detectChanges();
      }
    });
  }

  getStoredNonMainCategories(): CategoryItem[] {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('dcor_admin_categories');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        } catch (e) {}
      }
    }
    return INITIAL_CATEGORIES.filter(c => c.type !== 'main');
  }

  saveNonMainCategories() {
    if (typeof localStorage !== 'undefined') {
      const nonMain = this.allCategories.filter(c => c.type !== 'main');
      localStorage.setItem('dcor_admin_categories', JSON.stringify(nonMain));
    }
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

  get pagesArray(): number[] {
    const pages: number[] = [];
    for (let i = 1; i <= this.totalPages; i++) {
      pages.push(i);
    }
    return pages;
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

    // Gọi API Backend nếu là danh mục main
    if (target.type === 'main') {
      this.http.patch<any>(`${environment.apiUrl}/admin/categories/${target.id}/status`, {}).subscribe({
        next: () => {
          target.status = newStatusText;
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
      target.status = newStatusText;
      this.showToast(`Đã chuyển "${target.name}" sang trạng thái ${newStatusText}!`, 'success');
      this.closeToggleModal();
      this.saveNonMainCategories();
      this.applyFilters();
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
              image: this.formData.image.trim() || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=300&q=80',
              type: this.formData.type,
              parentId: this.formData.parentId,
              parentName: pName,
              sortOrder: Number(this.formData.sortOrder) || 1,
              status: this.formData.status,
              productsCount: 0,
              linkedProducts: []
            });
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
        const newItem: CategoryItem = {
          id: this.formData.id,
          name: this.formData.name.trim(),
          slug: this.formData.slug.trim(),
          description: this.formData.description.trim(),
          image: this.formData.image.trim(),
          type: this.formData.type,
          parentId: this.formData.parentId,
          parentName: pName,
          sortOrder: Number(this.formData.sortOrder) || 1,
          status: this.formData.status,
          productsCount: 0,
          linkedProducts: []
        };
        this.allCategories.push(newItem);
        this.saveNonMainCategories();
        this.showToast(`Đã thêm mới ${this.activeGroupLabel} "${newItem.name}"`, 'success');
        this.closeModal();
        this.applyFilters();
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
          this.saveNonMainCategories();
          this.showToast(`Đã cập nhật ${this.activeGroupLabel} "${this.formData.name}"`, 'success');
        }
        this.closeModal();
        this.applyFilters();
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
      this.allCategories = this.allCategories.filter(c => c.id !== targetId);
      this.saveNonMainCategories();
      this.showToast(`Đã xóa "${targetName}" thành công!`, 'success');
      this.closeConfirmDeleteModal();
      this.applyFilters();
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
