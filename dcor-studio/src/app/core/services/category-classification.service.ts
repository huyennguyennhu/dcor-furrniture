import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

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

export const DEFAULT_SUB_CATEGORIES: CategoryItem[] = [
  // 4 nhóm cha cấp 1
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
    productsCount: 69,
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

  // Con của Không gian & Phòng ứng dụng (sub-room)
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

  // Con của Bộ sưu tập (sub-collection)
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

  // Con của Phong cách thiết kế (sub-style)
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
    image: '',
    type: 'sub',
    parentId: 'sub-style',
    parentName: 'Phong cách thiết kế',
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
    image: '',
    type: 'sub',
    parentId: 'sub-style',
    parentName: 'Phong cách thiết kế',
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
    image: '',
    type: 'sub',
    parentId: 'sub-style',
    parentName: 'Phong cách thiết kế',
    sortOrder: 6,
    status: 'Hiển thị',
    productsCount: 7,
    linkedProducts: []
  },

  // Con của Chất liệu chế tác (sub-material)
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

function parseProductConfigOptions(prod: any): Record<string, any> {
  const raw = prod?.configOptions;
  if (!raw) return {};
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  }
  return typeof raw === 'object' ? raw : {};
}

function hasAssignedSubCategory(assigned: unknown, targetSlug: string, cat?: CategoryItem): boolean {
  if (!assigned) return false;
  const targets = new Set<string>();
  if (targetSlug) targets.add(String(targetSlug).trim().toLowerCase());
  if (cat?.id) targets.add(String(cat.id).trim().toLowerCase());
  if (cat?.slug) targets.add(String(cat.slug).trim().toLowerCase());
  if (targets.size === 0) return false;

  const list = Array.isArray(assigned) ? assigned : [assigned];
  return list.some(val => {
    if (val === null || val === undefined) return false;
    const norm = String(val).trim().toLowerCase();
    return norm.length > 0 && targets.has(norm);
  });
}

export function matchProductRoom(prod: any, roomSlug: string, cat?: CategoryItem): boolean {
  if (!prod || !roomSlug) return false;
  const cfg = parseProductConfigOptions(prod);
  if (hasAssignedSubCategory(cfg['roomIds'] ?? cfg['roomId'], roomSlug, cat)) {
    return true;
  }
  if (cat?.linkedProducts && Array.isArray(cat.linkedProducts) && cat.linkedProducts.length > 0) {
    const isLinked = cat.linkedProducts.some((lp: any) => lp.id === prod.id || lp.sku === prod.slug || lp.sku === prod.productId);
    if (isLinked) return true;
  }
  const catSlug = (prod.categoryObj?.slug || '').toLowerCase();
  const parentSlug = (prod.categoryObj?.parent?.slug || '').toLowerCase();
  const name = (prod.name || '').toLowerCase();

  if (roomSlug === 'phong-khach') {
    return parentSlug.includes('sofa') || parentSlug.includes('table') || parentSlug.includes('storage') || 
           parentSlug.includes('rug') || parentSlug.includes('lamp') || name.includes('sofa') || 
           name.includes('coffee') || name.includes('tv') || catSlug.includes('living');
  }
  if (roomSlug === 'phong-an') {
    return catSlug.includes('dining') || catSlug.includes('bar') || name.includes('dining') || 
           name.includes('bar') || parentSlug.includes('chair');
  }
  if (roomSlug === 'phong-ngu') {
    return parentSlug.includes('bed') || catSlug.includes('bed') || catSlug.includes('night-stand') || 
           catSlug.includes('throw') || name.includes('bed') || name.includes('nightstand');
  }
  if (roomSlug === 'phong-lam-viec') {
    return catSlug.includes('desk') || catSlug.includes('office') || name.includes('desk') || name.includes('office');
  }
  if (roomSlug === 'ngoai-troi' || roomSlug === 'ngoai-troi-ban-cong') {
    return parentSlug.includes('outdoor') || catSlug.includes('outdoor') || name.includes('outdoor');
  }
  if (cat?.name) {
    const term = cat.name.toLowerCase();
    return name.includes(term) || (prod.description || '').toLowerCase().includes(term);
  }
  return false;
}

export function matchProductCollection(prod: any, collectionSlug: string, cat?: CategoryItem): boolean {
  if (!prod || !collectionSlug) return false;
  const cfg = parseProductConfigOptions(prod);
  if (hasAssignedSubCategory(cfg['collectionId'] ?? cfg['collectionIds'], collectionSlug, cat)) {
    return true;
  }
  if (cat?.linkedProducts && Array.isArray(cat.linkedProducts) && cat.linkedProducts.length > 0) {
    const isLinked = cat.linkedProducts.some((lp: any) => lp.id === prod.id || lp.sku === prod.slug || lp.sku === prod.productId);
    if (isLinked) return true;
  }
  const key = collectionSlug.replace('bo-suu-tap-', '').toLowerCase();
  const name = (prod.name || '').toLowerCase();
  const slug = (prod.slug || '').toLowerCase();
  return name.includes(key) || slug.includes(key);
}

export function matchProductStyle(prod: any, styleSlug: string, cat?: CategoryItem): boolean {
  if (!prod || !styleSlug) return false;
  const cfg = parseProductConfigOptions(prod);
  if (hasAssignedSubCategory(cfg['styleId'] ?? cfg['styleIds'], styleSlug, cat)) {
    return true;
  }
  if (cat?.linkedProducts && Array.isArray(cat.linkedProducts) && cat.linkedProducts.length > 0) {
    const isLinked = cat.linkedProducts.some((lp: any) => lp.id === prod.id || lp.sku === prod.slug || lp.sku === prod.productId);
    if (isLinked) return true;
  }
  const text = `${prod.name || ''} ${prod.description || ''} ${prod.category || ''}`.toLowerCase();
  const s = styleSlug.toLowerCase();

  if (s.includes('scandinavian') || s.includes('bac-au')) {
    return text.includes('oak') || text.includes('wool') || text.includes('boucl') || text.includes('fabric') || text.includes('light');
  }
  if (s.includes('modern') || s.includes('hien-dai')) {
    return text.includes('leather') || text.includes('marble') || text.includes('lacquered') || text.includes('steel') || text.includes('dark');
  }
  if (s.includes('minimal') || s.includes('toi-gian')) {
    return text.includes('metal') || text.includes('glass') || text.includes('acrylic') || text.includes('aluminium') || text.includes('gọn');
  }
  if (s.includes('japandi')) {
    return text.includes('oak') || text.includes('wood') || text.includes('ceramic') || text.includes('linen') || text.includes('natural');
  }
  if (s.includes('wabi')) {
    return text.includes('concrete') || text.includes('ceramic') || text.includes('rough') || text.includes('cotton') || text.includes('organic');
  }
  if (s.includes('industrial')) {
    return text.includes('metal') || text.includes('concrete') || text.includes('steel') || text.includes('aluminium');
  }
  if (cat?.name) {
    return text.includes(cat.name.toLowerCase());
  }
  return false;
}

export function matchProductMaterial(prod: any, materialSlug: string, cat?: CategoryItem): boolean {
  if (!prod || !materialSlug) return false;
  const cfg = parseProductConfigOptions(prod);
  if (hasAssignedSubCategory(cfg['materialIds'] ?? cfg['materialId'], materialSlug, cat)) {
    return true;
  }
  if (cat?.linkedProducts && Array.isArray(cat.linkedProducts) && cat.linkedProducts.length > 0) {
    const isLinked = cat.linkedProducts.some((lp: any) => lp.id === prod.id || lp.sku === prod.slug || lp.sku === prod.productId);
    if (isLinked) return true;
  }
  const text = `${prod.name || ''} ${prod.description || ''} ${(prod.refinementMaterials || []).join(' ')}`.toLowerCase();
  const m = materialSlug.toLowerCase();

  if (m.includes('leather') || m.includes('da-bo')) {
    return text.includes('leather') || text.includes('da bò') || text.includes('da thật') || text.includes('aniline') || text.includes('nappa');
  }
  if (m.includes('fabric') || m.includes('vai-ni')) {
    return text.includes('fabric') || text.includes('vải') || text.includes('nỉ') || text.includes('boucl') || text.includes('velvet') || text.includes('linen');
  }
  if (m.includes('oak') || m.includes('go-soi')) {
    return text.includes('oak') || text.includes('sồi') || text.includes('gỗ sồi');
  }
  if (m.includes('walnut') || m.includes('go-oc-cho')) {
    return text.includes('walnut') || text.includes('óc chó') || text.includes('gỗ óc chó');
  }
  if (m.includes('ceramic') || m.includes('gom-ceramic')) {
    return text.includes('ceramic') || text.includes('gốm') || text.includes('đá') || text.includes('marble');
  }
  if (cat?.name) {
    return text.includes(cat.name.toLowerCase());
  }
  return false;
}

@Injectable({
  providedIn: 'root'
})
export class CategoryClassificationService {
  private readonly categoriesSubject = new BehaviorSubject<CategoryItem[]>([...DEFAULT_SUB_CATEGORIES]);
  public readonly categories$ = this.categoriesSubject.asObservable();
  private hasLoadedFromApi = false;
  private isLoadingFromApi = false;

  constructor(private http: HttpClient) {
    // Dọn dẹp key localStorage cũ để mọi trình duyệt dùng chung 1 nguồn sự thật từ Database Backend
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.removeItem('dcor_admin_categories');
      } catch {}
    }
    this.loadSubCategories().subscribe();
  }

  /**
   * Tải danh mục phụ & thuộc tính dùng chung toàn hệ thống từ PostgreSQL (/api/sub-categories)
   */
  loadSubCategories(force = false): Observable<CategoryItem[]> {
    if (this.hasLoadedFromApi && !force) {
      return of(this.categoriesSubject.value);
    }
    if (this.isLoadingFromApi && !force) {
      return of(this.categoriesSubject.value);
    }

    this.isLoadingFromApi = true;
    return this.http.get<{ items?: CategoryItem[] }>(`${environment.apiUrl}/sub-categories`).pipe(
      map(res => (Array.isArray(res?.items) && res.items.length > 0 ? res.items : [...DEFAULT_SUB_CATEGORIES])),
      tap(items => {
        this.hasLoadedFromApi = true;
        this.isLoadingFromApi = false;
        this.categoriesSubject.next(items);
      }),
      catchError(() => {
        this.isLoadingFromApi = false;
        return of(this.categoriesSubject.value);
      })
    );
  }

  /** Đồng bộ lại từ Backend ngay sau khi Admin thêm/sửa/xóa/ẩn hiện danh mục phụ */
  refresh(): void {
    this.loadSubCategories(true).subscribe();
  }

  /** Cập nhật tức thì danh sách trên bộ nhớ (đồng bộ với Storefront không cần reload trang) */
  setCategories(items: CategoryItem[]): void {
    if (Array.isArray(items) && items.length > 0) {
      this.hasLoadedFromApi = true;
      this.categoriesSubject.next(items);
    }
  }

  getAdminCategories(): CategoryItem[] {
    if (!this.hasLoadedFromApi && !this.isLoadingFromApi) {
      this.loadSubCategories().subscribe();
    }
    return this.categoriesSubject.value;
  }

  getActiveCategoriesByType(type: 'room' | 'collection' | 'style' | 'material'): CategoryItem[] {
    const parentIdMap: Record<'room' | 'collection' | 'style' | 'material', string> = {
      room: 'sub-room',
      collection: 'sub-collection',
      style: 'sub-style',
      material: 'sub-material'
    };
    const targetParentId = parentIdMap[type];
    const all = this.getAdminCategories();

    // Nếu nhóm cha cấp 1 bị Admin ẩn -> ẩn toàn bộ danh mục con trong bộ lọc & menu
    const parentGroup = all.find(c => c.id === targetParentId);
    if (parentGroup && parentGroup.status === 'Đã ẩn') {
      return [];
    }

    return all
      .filter(c => (c.type === type || (c.type === 'sub' && c.parentId === targetParentId)) && c.status === 'Hiển thị')
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }

  getRooms(): CategoryItem[] {
    return this.getActiveCategoriesByType('room');
  }

  getCollections(): CategoryItem[] {
    return this.getActiveCategoriesByType('collection');
  }

  getStyles(): CategoryItem[] {
    return this.getActiveCategoriesByType('style');
  }

  getMaterials(): CategoryItem[] {
    return this.getActiveCategoriesByType('material');
  }
}
