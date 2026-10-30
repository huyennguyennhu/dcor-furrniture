import { IconComponent } from '../../../../shared/components/icon/icon';
import { Component, OnInit, OnDestroy, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CatalogProduct, ProductCategory, ProductColorSwatch } from '../../../../shared/models/catalog.model';
import { CustomSelect } from '../../../../shared/components/custom-select/custom-select';
import { SidebarFilterComponent, FilterState as SidebarFilterState } from '../../../../shared/components/sidebar-filter/sidebar-filter'; 
import { 
  CategoryClassificationService, 
  CategoryItem, 
  matchProductRoom, 
  matchProductCollection, 
  matchProductStyle, 
  matchProductMaterial 
} from '../../../../core/services/category-classification.service';
import { QuickViewDrawerComponent } from '../../../../shared/components/quick-view-drawer/quick-view-drawer';
import { ProductCompareModalComponent } from '../../../../shared/components/product-compare-modal/product-compare-modal';
import { Subscription } from 'rxjs';
import { WishlistService } from '../../../../core/services/wishlist.service';
import { ProductService } from '../../../../core/services/product.service';
import { CompareService } from '../../../../core/services/compare.service';
import { LucideAngularModule, Heart, Share2, Eye, Scale, ShoppingCart, ChevronDown, Check, Star, SlidersHorizontal, X } from 'lucide-angular';

import { environment } from '../../../../../environments/environment';

export type FilterState = SidebarFilterState;

const INITIAL_FILTER_STATE: FilterState = {
  categories: [],
  rooms: [],
  collections: [],
  styles: [],
  materials: [],
  colors: [],
  minRating: undefined,
  priceRange: [0, 100000000]
};

@Component({
  selector: 'app-explore',
  standalone: true,
  imports: [
    IconComponent, 
    CommonModule, 
    RouterModule, 
    FormsModule, 
    CustomSelect, 
    SidebarFilterComponent, 
    QuickViewDrawerComponent, 
    ProductCompareModalComponent,
    LucideAngularModule
  ],
  templateUrl: './explore.html',
  styleUrls: ['./explore.css']
})
export class ExploreComponent implements OnInit, OnDestroy {
  icons = { Heart, Share2, Eye, Scale, ShoppingCart, ChevronDown, Check, Star, SlidersHorizontal, X };

  products: CatalogProduct[] = [];
  rawCategories: ProductCategory[] = [];
  isLoading = true;
  
  dynamicFilters = { categories: [] as string[], materials: [] as string[], colors: [] as any[] };
  
  searchQuery = '';
  filters: FilterState = { ...INITIAL_FILTER_STATE };
  sortBy = 'featured';
  currentPage = 1;
  itemsPerPage = 12;

  quickViewProduct: CatalogProduct | null = null;
  isQuickViewOpen = false;
  
  wishlist: string[] = [];
  private wishlistSub?: Subscription;
  private compareSub?: Subscription;
  compareList: CatalogProduct[] = [];
  isCompareModalOpen = false;
  showClearCompareConfirmModal = false;
  compareToastMessage: string | null = null;
  compareToastType: 'warning' | 'info' | 'success' = 'warning';
  private compareToastTimer: any = null;
  private pendingCompareParam: string | null = null;

  showScrollTop = false;
  heroParallaxY = 0;
  isFilterDrawerOpen = false;
  selectedVariantMap: Record<string, ProductColorSwatch> = {};
  private sub = new Subscription();

  adminCategories: CategoryItem[] = [];
  adminCategoryMap: Record<string, CategoryItem> = {};

  get activeFilterCount(): number {
    let count = 0;
    count += (this.filters.categories?.length || 0);
    count += (this.filters.rooms?.length || 0);
    count += (this.filters.collections?.length || 0);
    count += (this.filters.styles?.length || 0);
    count += (this.filters.materials?.length || 0);
    count += (this.filters.colors?.length || 0);
    if (this.filters.minRating !== undefined) count++;
    if (this.filters.priceRange && (this.filters.priceRange[0] > 0 || this.filters.priceRange[1] < this.dynamicMaxPrice)) count++;
    return count;
  }

  toggleFilterDrawer() {
    this.isFilterDrawerOpen = !this.isFilterDrawerOpen;
    if (typeof document !== 'undefined') {
      document.body.style.overflow = this.isFilterDrawerOpen ? 'hidden' : '';
    }
  }

  closeFilterDrawer() {
    this.isFilterDrawerOpen = false;
    if (typeof document !== 'undefined') {
      document.body.style.overflow = '';
    }
  }
  constructor(
    private route: ActivatedRoute, 
    private router: Router, 
    private cdr: ChangeDetectorRef,
    private wishlistService: WishlistService,
    private productService: ProductService,
    public compareService: CompareService,
    private categoryClassificationService: CategoryClassificationService
  ) {}

  @HostListener('window:scroll', [])
  onWindowScroll() {
    if (typeof window !== 'undefined') {
      const scrollOffset = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
      this.showScrollTop = scrollOffset > 300;
    }
  }

  scrollToTop() {
    if (typeof window !== 'undefined') {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  }

  ngOnInit() {
    this.adminCategories = this.categoryClassificationService.getAdminCategories();
    this.adminCategories.forEach(cat => {
      this.adminCategoryMap[cat.slug] = cat;
      this.adminCategoryMap[cat.id] = cat;
    });

    this.wishlistSub = this.wishlistService.wishlist$.subscribe((ids: any) => {
      this.wishlist = Array.isArray(ids) ? (typeof ids[0] === 'string' ? ids : ids.map((i: any) => i.productId || i.id)) : [];
      this.cdr.detectChanges();
    });

    this.compareSub = this.compareService.compareList$.subscribe(list => {
      this.compareList = (list as any[]) || [];
      this.cdr.detectChanges();
    });

    const savedState = this.getSavedExploreState();

    this.route.queryParams.subscribe(params => {
      const hasFilterParams = Boolean(
        params['category'] || params['categories'] ||
        params['room'] || params['rooms'] ||
        params['collection'] || params['collections'] ||
        params['style'] || params['styles'] ||
        params['material'] || params['materials'] ||
        params['color'] || params['colors'] ||
        params['q']
      );

      if (savedState && !hasFilterParams) {
        // Phục hồi lại toàn bộ bộ lọc, sắp xếp, tìm kiếm và phân trang từ phiên trước khi click vào sản phẩm
        if (savedState.filters) {
          this.filters = { ...savedState.filters };
        }
        if (savedState.sortBy) {
          this.sortBy = savedState.sortBy;
        }
        if (savedState.searchQuery !== undefined) {
          this.searchQuery = savedState.searchQuery;
        }
        this.currentPage = savedState.currentPage || 1;
        if (params['compare']) {
          this.pendingCompareParam = params['compare'];
        }
        this.fetchData(savedState);
      } else {
        if (hasFilterParams && typeof window !== 'undefined') {
          sessionStorage.removeItem('dcor_explore_saved_state');
        }

        this.filters.categories = params['category'] ? [params['category']] : [];
        this.filters.rooms = params['room'] ? [params['room']] : (params['rooms'] ? (Array.isArray(params['rooms']) ? params['rooms'] : [params['rooms']]) : []);
        this.filters.collections = params['collection'] ? [params['collection']] : (params['collections'] ? (Array.isArray(params['collections']) ? params['collections'] : [params['collections']]) : []);
        
        // Normalize style slug to match canonical admin categories (bac-au-scandinavian, etc.)
        const rawStyle = params['style'] || (Array.isArray(params['styles']) ? params['styles'][0] : params['styles']);
        if (rawStyle) {
          const s = String(rawStyle).toLowerCase().trim();
          let canonicalSlug = s;
          if (s.includes('scandinavian') || s.includes('bac-au')) canonicalSlug = 'bac-au-scandinavian';
          else if (s.includes('modern') || s.includes('hien-dai')) canonicalSlug = 'hien-dai-modern-luxury';
          else if (s.includes('minimal') || s.includes('toi-gian')) canonicalSlug = 'toi-gian-minimalism';
          else if (s.includes('japandi')) canonicalSlug = 'japandi';
          else if (s.includes('wabi')) canonicalSlug = 'wabi-sabi';
          else if (s.includes('industrial') || s.includes('cong-nghiep')) canonicalSlug = 'industrial';
          this.filters.styles = [canonicalSlug];
        } else {
          this.filters.styles = [];
        }

        this.filters.materials = params['material'] ? [params['material']] : (params['materials'] ? (Array.isArray(params['materials']) ? params['materials'] : [params['materials']]) : []);
        this.filters.colors = params['color'] ? [params['color']] : (params['colors'] ? [params['colors']] : []);
        this.searchQuery = params['q'] || '';
        if (params['compare']) {
          this.pendingCompareParam = params['compare'];
        }
        this.currentPage = 1;
        this.fetchData();
        this.scrollToTop();
      }
    });
  }

  async fetchData(savedState?: any) {
    this.isLoading = true;
    try {
      // 1. Gọi song song API categories và products từ cached ProductService
      const [categoriesData, productsData] = await Promise.all([
        this.productService.getCategories().catch(() => []),
        this.productService.getProducts()
      ]);

      if (Array.isArray(categoriesData)) {
        this.rawCategories = categoriesData;

        // Đồng bộ và chuẩn hóa category filter nếu URL truyền slug hoặc tên
        if (this.filters.categories.length > 0) {
          const catParam = this.filters.categories[0].trim().toLowerCase();
          const matched = this.rawCategories.find(c => {
            const cSlug = (c.slug || '').toLowerCase();
            const cName = (c.name || '').toLowerCase();
            if (cSlug === catParam || cName === catParam) return true;
            if (catParam === 'bàn' && (cSlug.includes('table') || cName.includes('table'))) return true;
            if (catParam === 'ghế' && (cSlug.includes('chair') || cName.includes('chair'))) return true;
            if (catParam === 'sofa' && (cSlug.includes('sofa') || cName.includes('sofa'))) return true;
            if ((catParam === 'tủ kệ' || catParam === 'tủ') && (cSlug.includes('storage') || cName.includes('storage'))) return true;
            if (catParam === 'giường' && (cSlug.includes('bed') || cName.includes('bed'))) return true;
            if (catParam === 'đèn' && (cSlug.includes('lamp') || cName.includes('lamp'))) return true;
            if (catParam === 'thảm' && (cSlug.includes('rug') || cName.includes('rug'))) return true;
            if (catParam === 'ngoài trời' && (cSlug.includes('outdoor') || cName.includes('outdoor'))) return true;
            if (catParam === 'phụ kiện' && (cSlug.includes('accessories') || cName.includes('accessories'))) return true;
            return false;
          });
          if (matched) {
            this.filters.categories = [matched.slug];
          }
        }
      }

      if (Array.isArray(productsData)) {
        const rawProducts = productsData;
        
        this.products = rawProducts.map((p: any) => {
          // Tính toán giá và giá khuyến mãi
          const basePrice = p.basePrice || 0;
          let lowestPrice = basePrice;
          if (p.discountValue) {
            if (p.discountType === 'PERCENT') {
              lowestPrice = Math.round(basePrice * (100 - p.discountValue) / 100);
            } else {
              lowestPrice = Math.max(0, basePrice - p.discountValue);
            }
          }

          // Trích xuất chất liệu từ description trong DB
          const materialsList: string[] = [];
          if (p.description) {
            const parts = p.description.split(',').map((s: string) => s.trim()).filter(Boolean);
            parts.forEach((part: string) => materialsList.push(part));
          }

          // Trích xuất màu sắc từ biến thể trong DB
          const extractedColors: string[] = [];
          if (p.variants && Array.isArray(p.variants)) {
            p.variants.forEach((v: any) => {
              if (v.name && v.name !== 'Phân loại mặc định') {
                extractedColors.push(v.name);
              }
            });
          }

          const categoryName = p.category?.parent?.name || p.category?.name || 'Sản phẩm';

          // Hàm kiểm tra URL hình ảnh hợp lệ (loại bỏ URL trả về 403 từ assets.boconcept.com)
          const isCleanUrl = (u: any): boolean => {
            return typeof u === 'string' && u.startsWith('http') && !u.includes('assets.boconcept.com');
          };

          const pMain = (Array.isArray(p.images) && p.images[0] && isCleanUrl(p.images[0])) ? p.images[0] : null;

          // Chỉ lấy các ảnh góc nhìn từ biến thể chính (variant 0), KHÔNG gom các biến thể màu/chất liệu khác
          const v0RawImgs = p.variants?.[0]?.optionValues?.images || p.variants?.[0]?.images || [];
          const v0CleanImgs = (Array.isArray(v0RawImgs) ? v0RawImgs : []).filter(isCleanUrl);

          const finalImages: string[] = [];
          if (pMain) {
            finalImages.push(pMain);
          }

          // Tránh trùng ảnh đầu (v0CleanImgs[0] thường cùng góc chính diện với pMain)
          if (v0CleanImgs.length > 1) {
            for (let i = 1; i < v0CleanImgs.length; i++) {
              const url = v0CleanImgs[i];
              if (!finalImages.includes(url)) {
                finalImages.push(url);
              }
            }
          } else if (finalImages.length === 0 && v0CleanImgs.length > 0) {
            finalImages.push(v0CleanImgs[0]);
          }

          // Fallback nếu hoàn toàn không có ảnh
          if (finalImages.length === 0) {
            finalImages.push('https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80');
          }

          // Helper phân tích màu sắc từ tên biến thể trong DB (xử lý chính xác cả biến thể ghép dạng "/")
          const getVariantColorInfo = (variantName: string): { name: string; hex: string } => {
            const raw = (variantName || '').trim();
            const parts = raw.split('/').map(p => p.trim()).filter(Boolean);

            const detect = (text: string): { name: string; hex: string } | null => {
              const lower = text.toLowerCase();
              if (lower.includes('green') || lower.includes('xanh lá') || lower.includes('olive')) return { name: 'Xanh lá', hex: '#3B5E45' };
              if (lower.includes('sky blue') || lower.includes('blue') || lower.includes('xanh dương') || lower.includes('navy')) return { name: 'Xanh dương', hex: '#2B4C7E' };
              if (lower.includes('yellow') || lower.includes('vàng') || lower.includes('ochre') || lower.includes('celestial')) return { name: 'Vàng', hex: '#E6B800' };
              if (/\brose\b/i.test(lower) || lower.includes('pink') || lower.includes('hồng')) return { name: 'Hồng', hex: '#ec4899' };
              if (/\bred\b/i.test(lower) || lower.includes('brick red') || lower.includes('đỏ') || lower.includes('burgundy')) return { name: 'Đỏ', hex: '#991b1b' };
              if (lower.includes('cognac') || lower.includes('camel') || lower.includes('amber') || lower.includes('terracotta') || lower.includes('cam đất') || /\bcam\b/i.test(lower)) return { name: 'Cam đất', hex: '#9A461E' };
              if (lower.includes('beige') || lower.includes('sand') || lower.includes('cream') || lower.includes('taupe') || /\bbe\b/i.test(lower)) return { name: 'Be', hex: '#D8C8B8' };
              if (lower.includes('dark marble') || lower.includes('marble') || lower.includes('cẩm thạch')) return { name: 'Cẩm thạch', hex: '#2E3136' };
              if (lower.includes('dark oak')) return { name: 'Sồi tối', hex: '#4A3728' };
              if (lower.includes('dark grey') || lower.includes('charcoal')) return { name: 'Xám đậm', hex: '#374151' };
              if (lower.includes('light grey') || lower.includes('warm grey') || lower.includes('grey') || lower.includes('gray') || lower.includes('xám')) return { name: 'Xám', hex: '#9ca3af' };
              if (/\bash\b/i.test(lower) || lower.includes('smoke') || lower.includes('khói')) return { name: 'Ghi khói', hex: '#6b7280' };
              if (lower.includes('white') || lower.includes('trắng') || lower.includes('clear')) return { name: 'Trắng', hex: '#f3f4f6' };
              if (lower.includes('black') || lower.includes('đen')) return { name: 'Đen', hex: '#18181b' };
              if (lower.includes('natural oak') || /\boak\b/i.test(lower) || lower.includes('sồi')) return { name: 'Gỗ sồi', hex: '#C4A482' };
              if (lower.includes('brown') || lower.includes('nâu') || lower.includes('walnut') || lower.includes('gỗ')) return { name: 'Nâu', hex: '#6B4423' };
              return null;
            };

            // Nếu biến thể có nhiều phần ngăn cách bởi "/", duyệt từ phải sang trái (phần nệm/vải thường nằm phía sau)
            for (let i = parts.length - 1; i >= 0; i--) {
              const p = parts[i];
              if (/^[HhWwLlØø\d]/.test(p) && (p.includes('cm') || p.includes('Ø') || p.includes('x'))) continue;
              const res = detect(p);
              if (res) return res;
            }

            const res = detect(raw);
            if (res) return res;

            const earthTones = ['#78716c', '#a8a29e', '#d6d3d1', '#737373', '#525252'];
            const hash = raw.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
            return { name: raw || 'Tiêu chuẩn', hex: earthTones[hash % earthTones.length] };
          };

          // Xây dựng danh sách Color Swatches tương tác thực tế từ các biến thể trong DB
          const rawVariants = Array.isArray(p.variants) ? p.variants : [];
          const colorSwatches: ProductColorSwatch[] = [];
          const seenHex = new Set<string>();

          rawVariants.forEach((v: any, vIdx: number) => {
            const vRaw = v.optionValues?.images || v.images || [];
            const vClean = (Array.isArray(vRaw) ? vRaw : []).filter(isCleanUrl);
            const colorInfo = getVariantColorInfo(v.name);
            const vImages = vClean.length > 0 ? [...vClean] : [...finalImages];

            if (!seenHex.has(colorInfo.hex) && vImages.length > 0) {
              seenHex.add(colorInfo.hex);

              // Nếu là biến thể đầu tiên và có pMain hợp lệ, chèn pMain lên đầu làm góc chính diện
              if (vIdx === 0 && pMain && !vImages.includes(pMain)) {
                vImages.unshift(pMain);
              }

              colorSwatches.push({
                id: v.id || `v-${vIdx}`,
                name: colorInfo.name,
                rawName: v.name,
                hex: colorInfo.hex,
                images: vImages,
                price: v.price
              });
            }
          });

          // Nếu các biến thể không có ảnh riêng, fallback dùng finalImages
          if (colorSwatches.length === 0 && finalImages.length > 0) {
            const defaultColor = getVariantColorInfo(p.name || 'Tiêu chuẩn');
            colorSwatches.push({
              id: p.id || p.productId || 'default',
              name: defaultColor.name,
              rawName: 'Tiêu chuẩn',
              hex: defaultColor.hex,
              images: finalImages,
              price: basePrice
            });
          }

          return {
            id: p.id,
            productId: p.id || p.productId,
            slug: p.slug,
            variantUrl: p.slug || p.id || '',
            name: p.name,
            shortDescription: p.name || '',
            shortDescription_vi: p.name || '',
            category: categoryName,
            categoryObj: p.category,
            categoryId: p.categoryId,
            description: p.description || 'Khung sấy nhiệt cao cấp, đệm cao su êm ái',
            refinementMaterials: materialsList.length > 0 ? materialsList : ['Fabric'],
            refinementColors: extractedColors,
            images: finalImages,
            colorSwatches: colorSwatches,
            prices: [{ price: basePrice, formattedPrice: new Intl.NumberFormat('vi-VN').format(basePrice) + ' đ', currency: 'VND' }],
            lowestPrices: lowestPrice < basePrice ? [{ price: lowestPrice, formattedPrice: new Intl.NumberFormat('vi-VN').format(lowestPrice) + ' đ', currency: 'VND' }] : [],
            isBestSeller: p.isBestSeller || false,
            isNew: p.isNew || false,
            discountValue: p.discountValue,
            discountType: p.discountType,
            variants: p.variants || [],
            rating: p.rating || 4.9,
            reviewCount: p.reviewCount || 128,
            createdAt: p.createdAt
          };
        });

        // Khởi tạo màu mặc định đang chọn cho từng sản phẩm
        this.products.forEach(prod => {
          if (prod.colorSwatches && prod.colorSwatches.length > 0) {
            this.selectedVariantMap[prod.productId] = prod.colorSwatches[0];
          }
        });

        this.generateDynamicFilters(this.products);
        this.syncSelectedVariantsWithColorFilter();

        // Phục hồi danh sách so sánh từ liên kết chia sẻ URL (?compare=id1,id2,...)
        if (this.pendingCompareParam) {
          const ids = this.pendingCompareParam.split(',').map((id: string) => id.trim()).filter(Boolean);
          const matched = this.products.filter(p => ids.includes(p.productId || (p as any).id));
          if (matched.length > 0) {
            const first = matched[0];
            const valid = matched.filter(p => this.compareService.isSameCategory(first, p)).slice(0, 5);
            this.compareService.saveToStorage(valid);
            if (valid.length >= 2) {
              this.compareService.openModal();
            }
          }
          this.pendingCompareParam = null;
        }
      }
    } catch (e) {
      console.error('Lỗi khi tải dữ liệu trang Explore:', e);
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();

      if (savedState && savedState.scrollY !== undefined) {
        this.restoreScrollPosition(savedState);
      }
    }
  }

  // Trích xuất chất liệu thật và màu sắc thật từ toàn bộ sản phẩm trong DB
  generateDynamicFilters(data: CatalogProduct[]) {
    // 1. Trích xuất chất liệu thật
    const matSet = new Set<string>();
    data.forEach(p => {
      if (p.description) {
        const parts = p.description.split(',').map(s => s.trim()).filter(Boolean);
        parts.forEach(part => matSet.add(part));
      }
    });

    const materials = Array.from(matSet).sort();

    // 2. Trích xuất màu sắc thật từ biến thể trong DB
    const colorDefinitions = [
      { name: 'Xám (Grey)', slug: 'grey', hex: '#808080', keywords: ['grey', 'gray', 'xám'] },
      { name: 'Trắng (White)', slug: 'white', hex: '#F8F8F8', keywords: ['white', 'trắng', 'clear'] },
      { name: 'Nâu (Brown)', slug: 'brown', hex: '#6B4423', keywords: ['brown', 'nâu'] },
      { name: 'Đen (Black)', slug: 'black', hex: '#222222', keywords: ['black', 'đen'] },
      { name: 'Gỗ sồi (Oak)', slug: 'oak', hex: '#C4A482', keywords: ['oak', 'sồi'] },
      { name: 'Sồi tối (Dark Oak)', slug: 'dark-oak', hex: '#4A3728', keywords: ['dark oak'] },
      { name: 'Cẩm thạch (Dark Marble)', slug: 'marble', hex: '#2E3136', keywords: ['marble'] },
      { name: 'Xanh lá (Green)', slug: 'green', hex: '#3B5E45', keywords: ['green', 'xanh'] },
      { name: 'Be (Beige)', slug: 'beige', hex: '#D8C8B8', keywords: ['beige', 'be'] },
      { name: 'Cam đất (Cognac)', slug: 'cognac', hex: '#9A461E', keywords: ['cognac', 'camel', 'cam'] },
      { name: 'Xanh dương (Blue)', slug: 'blue', hex: '#2B4C7E', keywords: ['blue'] },
      { name: 'Khói (Smoke)', slug: 'smoke', hex: '#5C5C5C', keywords: ['smoke'] },
      { name: 'Vàng (Yellow)', slug: 'yellow', hex: '#E6B800', keywords: ['yellow', 'vàng'] }
    ];

    const activeColors = colorDefinitions.filter(cd => {
      return data.some(p => {
        const variantText = (p.variants || []).map((v: any) => v.name || '').join(' ').toLowerCase();
        return cd.keywords.some(kw => variantText.includes(kw));
      });
    });

    this.dynamicFilters = {
      categories: [],
      materials: materials.length > 0 ? materials : ['Fabric', 'Leather', 'Oak', 'Wool', 'Ceramic', 'Concrete', 'Glass', 'Metal', 'Wood'],
      colors: activeColors.length > 0 ? activeColors : colorDefinitions
    };
  }

  // Data đánh giá thật: Tính số lượng sản phẩm thực tế theo số sao
  get ratingCounts(): Record<number, number> {
    const counts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0 };
    this.products.forEach(p => {
      const r = p.rating || 4.9;
      if (r >= 4.9) counts[5]++;
      else if (r >= 4.0) counts[4]++;
      else if (r >= 3.0) counts[3]++;
      else counts[2]++;
    });
    return counts;
  }

  // Tiêu đề Banner động theo danh mục chính / phòng / bộ sưu tập / phong cách
  get currentCategoryTitle(): string {
    if (this.filters.categories && this.filters.categories.length > 0) {
      return this.getCategoryLabel(this.filters.categories[0]);
    }
    if (this.filters.rooms && this.filters.rooms.length > 0) {
      return this.getRoomLabel(this.filters.rooms[0]);
    }
    if (this.filters.collections && this.filters.collections.length > 0) {
      return this.getCollectionLabel(this.filters.collections[0]);
    }
    if (this.filters.styles && this.filters.styles.length > 0) {
      return this.getStyleLabel(this.filters.styles[0]);
    }
    if (this.filters.materials && this.filters.materials.length > 0) {
      return this.getMaterialLabel(this.filters.materials[0]);
    }
    return 'Tất cả sản phẩm';
  }

  get currentCategoryBreadcrumb(): string {
    return this.currentCategoryTitle;
  }

  get hasActiveFilters(): boolean {
    return (this.filters.categories.length > 0) ||
           ((this.filters.rooms?.length || 0) > 0) ||
           ((this.filters.collections?.length || 0) > 0) ||
           ((this.filters.styles?.length || 0) > 0) ||
           ((this.filters.materials?.length || 0) > 0) ||
           (this.filters.colors.length > 0) ||
           (this.filters.minRating !== undefined) ||
           (this.filters.priceRange[0] > 0 || this.filters.priceRange[1] < this.dynamicMaxPrice);
  }

  get filteredExceptPrice(): CatalogProduct[] {
    return this.products.filter(prod => {
      // 1. Lọc theo danh mục chính từ Database (parentId == null hoặc slug)
      if (this.filters.categories.length > 0) {
        const matchesCategory = this.filters.categories.some(selectedCatSlug => {
          const sel = selectedCatSlug.toLowerCase();
          const pCatSlug = (prod.categoryObj?.slug || '').toLowerCase();
          const pCatId = (prod.categoryObj?.id || '').toLowerCase();
          const parentSlug = (prod.categoryObj?.parent?.slug || '').toLowerCase();
          const parentId = (prod.categoryObj?.parent?.id || '').toLowerCase();
          const pName = (prod.categoryObj?.name || '').toLowerCase();
          const parentName = (prod.categoryObj?.parent?.name || '').toLowerCase();

          return pCatSlug === sel || 
                 parentSlug === sel ||
                 pCatId === sel ||
                 parentId === sel ||
                 pName === sel ||
                 parentName === sel ||
                 pCatSlug.includes(sel) ||
                 parentSlug.includes(sel);
        });
        if (!matchesCategory) return false;
      }

      // 2. Lọc theo Phòng & Không gian (từ Admin Categories)
      if (this.filters.rooms && this.filters.rooms.length > 0) {
        const matchesRoom = this.filters.rooms.some(rSlug => {
          const adminCat = this.adminCategoryMap[rSlug];
          return matchProductRoom(prod, rSlug, adminCat);
        });
        if (!matchesRoom) return false;
      }

      // 3. Lọc theo Bộ sưu tập (từ Admin Categories)
      if (this.filters.collections && this.filters.collections.length > 0) {
        const matchesCollection = this.filters.collections.some(cSlug => {
          const adminCat = this.adminCategoryMap[cSlug];
          return matchProductCollection(prod, cSlug, adminCat);
        });
        if (!matchesCollection) return false;
      }

      // 4. Lọc theo Phong cách (từ Admin Categories)
      if (this.filters.styles && this.filters.styles.length > 0) {
        const matchesStyle = this.filters.styles.some(sSlug => {
          const adminCat = this.adminCategoryMap[sSlug];
          return matchProductStyle(prod, sSlug, adminCat);
        });
        if (!matchesStyle) return false;
      }

      // 5. Lọc theo Chất liệu (từ Admin Categories)
      if (this.filters.materials && this.filters.materials.length > 0) {
        const matchesMaterial = this.filters.materials.some(mSlug => {
          const adminCat = this.adminCategoryMap[mSlug];
          return matchProductMaterial(prod, mSlug, adminCat);
        });
        if (!matchesMaterial) return false;
      }

      // 4. Lọc theo đánh giá thật
      if (this.filters.minRating !== undefined) {
        const min = this.filters.minRating;
        const prodRating = prod.rating || 4.9;
        if (min === 5 && prodRating < 4.9) return false;
        if (min === 4 && prodRating < 4.0) return false;
        if (min === 3 && prodRating < 3.0) return false;
        if (min === 2 && prodRating < 2.0) return false;
      }

      // 5. Lọc theo chất liệu (nếu có)
      if (this.filters.materials && this.filters.materials.length > 0) {
        const selectedMats = this.filters.materials;
        const matchesMaterial = prod.refinementMaterials?.some(m => 
          selectedMats.some(fm => m.toLowerCase().includes(fm.toLowerCase()) || fm.toLowerCase().includes(m.toLowerCase()))
        );
        if (!matchesMaterial) return false;
      }

      // 6. Lọc nghiêm ngặt theo màu sắc: Chỉ hiển thị sản phẩm thực sự có biến thể màu được chọn, sản phẩm không có màu này sẽ bị ẩn
      if (this.filters.colors.length > 0) {
        const matchesColor = this.filters.colors.some(cSlug => {
          return Boolean(prod.colorSwatches && prod.colorSwatches.some(sw => this.isColorSlugMatch(cSlug, sw)));
        });
        if (!matchesColor) return false;
      }

      // 7. Lọc theo từ khóa tìm kiếm
      if (this.searchQuery) {
        const q = this.searchQuery.toLowerCase();
        const text = `${prod.name} ${prod.category} ${prod.description}`.toLowerCase();
        if (!text.includes(q)) return false;
      }

      return true;
    });
  }

  get filteredProducts(): CatalogProduct[] {
    const min = this.filters.priceRange[0] || 0;
    const max = this.filters.priceRange[1] ?? this.dynamicMaxPrice;
    let list = this.filteredExceptPrice.filter(prod => {
      const price = this.getProductPriceVal(prod);
      return price >= min && price <= max;
    });

    if (this.sortBy === 'featured') {
      list.sort((a, b) => {
        if (a.isBestSeller && !b.isBestSeller) return -1;
        if (!a.isBestSeller && b.isBestSeller) return 1;
        return 0;
      });
    } else if (this.sortBy === 'newest') {
      list.sort((a, b) => {
        const dA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dB - dA;
      });
    } else if (this.sortBy === 'price-asc') {
      list.sort((a, b) => this.getProductPriceVal(a) - this.getProductPriceVal(b));
    } else if (this.sortBy === 'price-desc') {
      list.sort((a, b) => this.getProductPriceVal(b) - this.getProductPriceVal(a));
    } else if (this.sortBy === 'sale') {
      list.sort((a, b) => (b.discountValue || 0) - (a.discountValue || 0));
    }

    return list;
  }

  get paginatedProducts(): CatalogProduct[] {
    return this.filteredProducts.slice(0, this.currentPage * this.itemsPerPage);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredProducts.length / this.itemsPerPage);
  }

  get dynamicMaxPrice(): number {
    return 100000000;
  }

  getProductPriceVal(prod: CatalogProduct): number {
    if (prod.lowestPrices && prod.lowestPrices.length > 0) {
      return prod.lowestPrices[0].price;
    }
    return prod.prices?.[0]?.price ?? 0;
  }

  getProductPriceFormatted(prod: CatalogProduct): string {
    const selected = this.getSelectedSwatch(prod);
    if (selected && selected.price) {
      let pPrice = selected.price;
      if (prod.discountValue) {
        if (prod.discountType === 'PERCENT') {
          pPrice = Math.round(selected.price * (100 - prod.discountValue) / 100);
        } else {
          pPrice = Math.max(0, selected.price - prod.discountValue);
        }
      }
      return new Intl.NumberFormat('vi-VN').format(pPrice) + ' đ';
    }
    if (prod.lowestPrices && prod.lowestPrices.length > 0) {
      return prod.lowestPrices[0].formattedPrice;
    }
    return prod.prices?.[0]?.formattedPrice ?? 'Liên hệ';
  }

  getOriginalPriceFormatted(prod: CatalogProduct): string | null {
    const selected = this.getSelectedSwatch(prod);
    if (selected && selected.price && prod.discountValue) {
      return new Intl.NumberFormat('vi-VN').format(selected.price) + ' đ';
    }
    if (prod.lowestPrices && prod.lowestPrices.length > 0) {
      return prod.prices?.[0]?.formattedPrice ?? null;
    }
    return null;
  }

  isOnSale(prod: CatalogProduct): boolean {
    return Boolean(
      (prod.discountValue && prod.discountValue > 0) ||
      (prod.lowestPrices && prod.lowestPrices.length > 0 && prod.lowestPrices[0].price < (prod.prices?.[0]?.price ?? 0))
    );
  }

  getCategoryLabel(catKey: string): string {
    const match = this.rawCategories.find(c => c.slug === catKey || c.id === catKey);
    return match ? match.name : catKey;
  }

  getRoomLabel(slug: string): string {
    const match = this.adminCategoryMap[slug];
    return match ? match.name : slug;
  }

  getCollectionLabel(slug: string): string {
    const match = this.adminCategoryMap[slug];
    return match ? match.name : slug;
  }

  getStyleLabel(slug: string): string {
    const match = this.adminCategoryMap[slug];
    return match ? match.name : slug;
  }

  getMaterialLabel(slug: string): string {
    const match = this.adminCategoryMap[slug];
    return match ? match.name : slug;
  }

  getColorLabel(slug: string): string {
    const color = this.dynamicFilters.colors.find(c => c.slug === slug);
    return color ? color.name : slug;
  }

  formatPriceShort(price: number): string {
    if (price >= 1000000) return (price / 1000000).toFixed(0) + 'tr';
    return price + 'đ';
  }

  removeCategory(cat: string) {
    this.filters.categories = this.filters.categories.filter(c => c !== cat);
    this.currentPage = 1;
    this.scrollToTop();
  }

  removeFilterTag(key: 'rooms' | 'collections' | 'styles' | 'materials' | 'colors', val: string) {
    if (this.filters[key]) {
      this.filters[key] = (this.filters[key] as string[]).filter(item => item !== val);
    }
    if (key === 'colors') {
      this.syncSelectedVariantsWithColorFilter();
    }
    this.currentPage = 1;
    this.scrollToTop();
  }

  resetPrice() {
    this.filters.priceRange = [0, this.dynamicMaxPrice];
    this.currentPage = 1;
    this.scrollToTop();
  }

  onFilterChange(newFilters: FilterState) {
    const prevColor = this.filters.colors?.[0];
    const newColor = newFilters.colors?.[0];
    this.filters = newFilters;
    if (prevColor !== newColor) {
      this.syncSelectedVariantsWithColorFilter();
    }
    this.currentPage = 1;
    this.scrollToTop();
  }

  onSortChange(newSort: string) {
    this.sortBy = newSort;
    this.currentPage = 1;
    this.scrollToTop();
  }

  clearAllFilters() {
    this.filters = { ...INITIAL_FILTER_STATE };
    this.filters.categories = [];
    this.filters.rooms = [];
    this.filters.collections = [];
    this.filters.styles = [];
    this.filters.materials = [];
    this.filters.colors = [];
    this.filters.minRating = undefined;
    this.syncSelectedVariantsWithColorFilter();
    this.currentPage = 1;
    this.scrollToTop();
  }

  loadMore() {
    this.currentPage++;
  }

  isInWishlist(productId?: string): boolean {
    return !!productId && this.wishlistService.isWishlisted(productId);
  }

  toggleWishlist(e: Event, productId: string) {
    e.stopPropagation();
    e.preventDefault();
    if (productId) {
      this.wishlistService.toggle(productId);
    }
  }

  getProductMainCategoryKey(p: CatalogProduct): string {
    if (!p) return 'accessories';
    const parentName = (p.categoryObj?.parent?.name || '').toLowerCase();
    const parentSlug = (p.categoryObj?.parent?.slug || '').toLowerCase();
    const catName = (p.categoryObj?.name || p.category || '').toLowerCase();
    const catSlug = (p.categoryObj?.slug || '').toLowerCase();
    const name = (p.name || '').toLowerCase();

    // 1. Sofa check (Sofa, lounge sofa, sofa bed, v.v.)
    if (parentName.includes('sofa') || parentSlug.includes('sofa') || 
        catName.includes('sofa') || catSlug.includes('sofa') || 
        name.includes('sofa')) {
      return 'sofas';
    }

    // 2. Rugs / Thảm check (Rug, plaid, carpet, throw)
    if (parentName.includes('rug') || parentSlug.includes('rug') || 
        catName.includes('rug') || catSlug.includes('rug') || 
        name.includes('rug') || name.includes('plaid') || 
        catName.includes('throw') || catSlug.includes('throw')) {
      return 'rugs';
    }

    // 3. Tables / Bàn check (Table, desk)
    if (parentName.includes('table') || parentSlug.includes('table') || 
        catName.includes('table') || catSlug.includes('table') || 
        name.includes('table') || name.includes('desk') || 
        catName.includes('desk') || catSlug.includes('desk')) {
      return 'tables';
    }

    // 4. Chairs / Ghế check (Chair, bench, stool, recliner, armchair)
    if (parentName.includes('chair') || parentSlug.includes('chair') || 
        catName.includes('chair') || catSlug.includes('chair') || 
        name.includes('chair') || name.includes('bench') || 
        name.includes('stool') || name.includes('armchair') || 
        name.includes('recliner')) {
      return 'chairs';
    }

    // 5. Beds / Giường check
    if (parentName.includes('bed') || parentSlug.includes('bed') || 
        catName.includes('bed') || catSlug.includes('bed') || 
        name.includes('bed') || name.includes('daybed')) {
      return 'beds';
    }

    // 6. Storage / Tủ kệ check
    if (parentName.includes('storage') || parentSlug.includes('storage') || 
        catName.includes('storage') || catSlug.includes('storage') || 
        name.includes('storage') || name.includes('drawer') || 
        name.includes('shelf') || name.includes('sideboard') || 
        name.includes('nightstand') || name.includes('night stand') || 
        name.includes('bookcase') || name.includes('tv')) {
      return 'storage';
    }

    // 7. Lamps / Đèn check
    if (parentName.includes('lamp') || parentSlug.includes('lamp') || 
        catName.includes('lamp') || catSlug.includes('lamp') || 
        name.includes('lamp') || name.includes('pendant') || 
        name.includes('light')) {
      return 'lamps';
    }

    // 8. Outdoor check
    if (parentName.includes('outdoor') || parentSlug.includes('outdoor') || 
        catName.includes('outdoor') || catSlug.includes('outdoor') || 
        name.includes('outdoor')) {
      return 'outdoor';
    }

    return 'accessories';
  }

  getRootCategoryName(prod: CatalogProduct): string {
    const key = this.getProductMainCategoryKey(prod);
    const map: Record<string, string> = {
      sofas: 'Sofas',
      chairs: 'Chairs',
      tables: 'Tables',
      storage: 'Storage',
      beds: 'Beds',
      rugs: 'Rugs',
      lamps: 'Lamps',
      outdoor: 'Outdoor',
      accessories: 'Accessories'
    };
    return map[key] || 'Sản phẩm';
  }

  isSameMainCategory(prodA: CatalogProduct, prodB: CatalogProduct): boolean {
    if (!prodA || !prodB) return false;
    if (prodA.productId === prodB.productId) return true;
    return this.getProductMainCategoryKey(prodA) === this.getProductMainCategoryKey(prodB);
  }

  isCompareDisabledForProduct(prod: CatalogProduct): boolean {
    return this.compareService.isCompareDisabled(prod);
  }

  getCompareButtonTooltip(prod: CatalogProduct): string {
    if (this.isInCompare(prod.productId)) {
      return 'Bỏ so sánh';
    }
    if (this.isCompareDisabledForProduct(prod)) {
      return `Chỉ so sánh các sản phẩm cùng danh mục chính (${this.getRootCategoryName(this.compareList[0])})`;
    }
    return 'Thêm vào so sánh';
  }

  toggleCompare(e: Event, prod: CatalogProduct) {
    e.stopPropagation();
    e.preventDefault();
    this.compareService.toggle(prod);
  }

  isInCompare(productId: string): boolean {
    return this.compareService.isInCompare(productId);
  }

  removeCompare(productId: string) {
    this.compareService.remove(productId);
  }

  confirmClearAllCompare() {
    this.compareService.openConfirmClear();
  }

  cancelClearAllCompare() {
    this.compareService.closeConfirmClear();
  }

  executeClearAllCompare() {
    this.compareService.clear();
  }

  clearAllCompare() {
    this.compareService.clear();
  }

  openCompareModal() {
    this.compareService.openModal();
  }

  closeCompareModal() {
    this.compareService.closeModal();
  }

  onRemoveCompareProduct(productId: string) {
    this.compareService.remove(productId);
  }

  copyCompareShareLink() {
    this.compareService.copyShareLink();
  }

  private fallbackCopyLink(text: string) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      this.showCompareToast('Đã sao chép liên kết so sánh!', 'success');
    } catch (e) {
      this.showCompareToast('Không thể sao chép liên kết.', 'warning');
    }
    document.body.removeChild(textArea);
  }

  showCompareToast(msg: string, type: 'warning' | 'info' | 'success' = 'warning') {
    this.compareToastMessage = msg;
    this.compareToastType = type;
    this.cdr.detectChanges();
    if (this.compareToastTimer) clearTimeout(this.compareToastTimer);
    this.compareToastTimer = setTimeout(() => {
      this.compareToastMessage = null;
      this.cdr.detectChanges();
    }, 3200);
  }

  handleBuyClick(e: Event, prod: CatalogProduct) {
    e.stopPropagation();
    e.preventDefault();
    this.openQuickView(e, prod);
  }

  openQuickView(e: Event, prod: CatalogProduct) {
    e.stopPropagation();
    e.preventDefault();
    const selected = this.getSelectedSwatch(prod);
    if (selected && selected.images && selected.images.length > 0) {
      prod.images = selected.images;
    }
    this.quickViewProduct = prod;
    this.isQuickViewOpen = true;
  }

  handleProductClick(productId: string) {
    this.saveExploreState(productId);
    this.router.navigate(['/products', productId]);
  }

  saveExploreState(productId?: string) {
    if (typeof window === 'undefined') return;
    try {
      const state = {
        scrollY: window.scrollY || document.documentElement.scrollTop || 0,
        currentPage: this.currentPage,
        filters: this.filters,
        sortBy: this.sortBy,
        searchQuery: this.searchQuery,
        productId: productId || '',
        timestamp: Date.now()
      };
      sessionStorage.setItem('dcor_explore_saved_state', JSON.stringify(state));
    } catch (e) {
      console.warn('Cannot save explore state:', e);
    }
  }

  private getSavedExploreState(): any {
    if (typeof window === 'undefined') return null;
    try {
      const raw = sessionStorage.getItem('dcor_explore_saved_state');
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (data && (Date.now() - data.timestamp < 30 * 60 * 1000)) {
        return data;
      }
    } catch (e) {
      console.warn('Error reading explore saved state:', e);
    }
    return null;
  }

  private restoreScrollPosition(savedState: { scrollY: number; productId?: string }) {
    if (typeof window === 'undefined') return;

    const targetY = savedState.scrollY || 0;
    const targetProductId = savedState.productId;

    const executeScroll = () => {
      window.scrollTo({
        top: targetY,
        behavior: 'instant' as ScrollBehavior
      });

      if (targetProductId) {
        const el = document.getElementById('product-' + targetProductId);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top < 50 || rect.bottom > window.innerHeight + 150) {
            el.scrollIntoView({ block: 'center', behavior: 'instant' as ScrollBehavior });
          }
        }
      }
    };

    requestAnimationFrame(() => {
      executeScroll();
      setTimeout(() => {
        executeScroll();
        try {
          sessionStorage.removeItem('dcor_explore_saved_state');
        } catch {}
      }, 100);
    });
  }

  // --- Quản lý biến thể màu sắc & ảnh tương ứng trên thẻ sản phẩm ---
  isColorSlugMatch(slug: string, target: string | ProductColorSwatch): boolean {
    const text = (typeof target === 'string'
      ? target
      : `${target.name || ''} ${target.rawName || ''} ${target.hex || ''}`
    ).toLowerCase();

    if (slug === 'white') return text.includes('white') || text.includes('trắng') || text.includes('clear') || text.includes('#f3f4f6') || text.includes('#f8f8f8');
    if (slug === 'black') return text.includes('black') || text.includes('đen') || text.includes('#18181b') || text.includes('#222222');
    if (slug === 'grey') return text.includes('grey') || text.includes('gray') || text.includes('xám') || /\bash\b/i.test(text) || text.includes('charcoal') || text.includes('#808080') || text.includes('#9ca3af') || text.includes('#374151');
    if (slug === 'ash-grey') return /\bash\b/i.test(text) || text.includes('tro') || text.includes('ghi khói') || text.includes('#6b7280');
    if (slug === 'brown') return text.includes('brown') || text.includes('nâu') || text.includes('walnut') || text.includes('espresso') || text.includes('#6b4423');
    if (slug === 'oak') return ((text.includes('oak') || text.includes('sồi')) && !text.includes('dark oak')) || text.includes('#c4a482');
    if (slug === 'dark-oak') return text.includes('dark oak') || (text.includes('sồi') && (text.includes('tối') || text.includes('đậm'))) || text.includes('#4a3728');
    if (slug === 'marble') return text.includes('marble') || text.includes('cẩm thạch') || text.includes('#2e3136');
    if (slug === 'green') return text.includes('green') || text.includes('xanh lá') || text.includes('olive') || text.includes('#3b5e45');
    if (slug === 'beige') return text.includes('beige') || text.includes('sand') || text.includes('cream') || text.includes('taupe') || /\bbe\b/i.test(text) || text.includes('#d8c8b8');
    if (slug === 'cognac') return text.includes('cognac') || text.includes('camel') || text.includes('amber') || text.includes('terracotta') || text.includes('cam đất') || /\bcam\b/i.test(text) || text.includes('#9a461e');
    if (slug === 'blue') return text.includes('blue') || text.includes('xanh dương') || text.includes('navy') || text.includes('#2b4c7e');
    if (slug === 'smoke') return text.includes('smoke') || text.includes('khói') || text.includes('ghi khói') || text.includes('#5c5c5c') || text.includes('#6b7280');
    if (slug === 'yellow') return text.includes('yellow') || text.includes('vàng') || text.includes('ochre') || text.includes('celestial') || text.includes('#e6b800');
    return text.includes(slug.toLowerCase());
  }

  syncSelectedVariantsWithColorFilter() {
    const activeColor = this.filters.colors?.[0];
    this.products.forEach(prod => {
      if (!prod.colorSwatches || prod.colorSwatches.length === 0) return;
      if (activeColor) {
        const matched = prod.colorSwatches.find(sw => this.isColorSlugMatch(activeColor, sw));
        if (matched) {
          this.selectedVariantMap[prod.productId] = matched;
          this.activeImageMap[prod.productId] = 0;
          return;
        }
      }
      this.selectedVariantMap[prod.productId] = prod.colorSwatches[0];
      this.activeImageMap[prod.productId] = 0;
    });
    this.cdr.detectChanges();
  }

  getSelectedSwatch(prod: CatalogProduct): ProductColorSwatch | undefined {
    return this.selectedVariantMap[prod.productId] || prod.colorSwatches?.[0];
  }

  getVisibleSwatches(prod: CatalogProduct): ProductColorSwatch[] {
    if (!prod.colorSwatches || prod.colorSwatches.length <= 5) {
      return prod.colorSwatches || [];
    }
    const active = this.getSelectedSwatch(prod);
    const swatches = [...prod.colorSwatches];
    if (active) {
      const idx = swatches.findIndex(s => s.id === active.id);
      if (idx >= 5) {
        const [activeSw] = swatches.splice(idx, 1);
        swatches.unshift(activeSw);
      }
    }
    return swatches.slice(0, 5);
  }

  getCardImages(prod: CatalogProduct): string[] {
    const selected = this.getSelectedSwatch(prod);
    if (selected && selected.images && selected.images.length > 0) {
      return selected.images;
    }
    return prod.images || [];
  }

  isSwatchActive(prod: CatalogProduct, sw: ProductColorSwatch): boolean {
    const current = this.getSelectedSwatch(prod);
    return current ? current.id === sw.id : (prod.colorSwatches?.[0]?.id === sw.id);
  }

  selectCardSwatch(event: Event, prod: CatalogProduct, sw: ProductColorSwatch) {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }

    if (this.selectedVariantMap[prod.productId]?.id === sw.id) return;

    this.selectedVariantMap[prod.productId] = sw;
    this.activeImageMap[prod.productId] = 0;
    this.clearHoverTimer(prod.productId);

    if (this.hoveredCardId === prod.productId && sw.images && sw.images.length > 1) {
      this.startAutoCycle(prod);
    }

    this.cdr.detectChanges();
  }

  // --- Quản lý đổi góc nhìn sản phẩm khi rê chuột (Multi-angle view on hover) ---
  activeImageMap: Record<string, number> = {};
  hoverTimerMap: Record<string, any> = {};
  mouseDebounceMap: Record<string, any> = {};
  hoveredCardId: string | null = null;

  getActiveImageIndex(productId: string): number {
    return this.activeImageMap[productId] || 0;
  }

  // Khi rê chuột vào thẻ sản phẩm
  onCardMouseEnter(prod: CatalogProduct) {
    this.hoveredCardId = prod.productId;
    const imgs = this.getCardImages(prod);
    if (!imgs || imgs.length <= 1) return;

    this.startAutoCycle(prod);
  }

  // Khởi động chu kỳ tự động luân phiên đổi góc (1.5s/góc để người dùng thấy rõ sự chuyển động)
  private startAutoCycle(prod: CatalogProduct) {
    this.clearHoverTimer(prod.productId);
    const imgs = this.getCardImages(prod);
    if (!imgs || imgs.length <= 1) return;

    this.hoverTimerMap[prod.productId] = setInterval(() => {
      const curImgs = this.getCardImages(prod);
      if (this.hoveredCardId === prod.productId && curImgs && curImgs.length > 1) {
        const current = this.activeImageMap[prod.productId] || 0;
        this.activeImageMap[prod.productId] = (current + 1) % curImgs.length;
        this.cdr.detectChanges();
      }
    }, 1500);
  }

  // Khi di chuyển chuột trên ảnh sản phẩm (có độ trễ nhẹ debounce 130ms)
  onCardMouseMove(event: MouseEvent, prod: CatalogProduct) {
    this.hoveredCardId = prod.productId;
    const imgs = this.getCardImages(prod);
    if (!imgs || imgs.length <= 1) return;

    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const ratio = Math.max(0, Math.min(0.999, x / rect.width));
    const targetIdx = Math.floor(ratio * imgs.length);

    // Thêm độ trễ nhẹ 130ms khi rê chuột giữa các ảnh để tránh nhấp nháy liên tục
    if (this.mouseDebounceMap[prod.productId]) {
      clearTimeout(this.mouseDebounceMap[prod.productId]);
    }

    this.mouseDebounceMap[prod.productId] = setTimeout(() => {
      if (this.hoveredCardId === prod.productId && this.activeImageMap[prod.productId] !== targetIdx) {
        this.activeImageMap[prod.productId] = targetIdx;
        this.cdr.detectChanges();
      }
      // Sau khi dừng di chuyển chuột, tiếp tục luân phiên tự động
      this.startAutoCycle(prod);
    }, 130);
  }

  // Khi rời chuột khỏi thẻ sản phẩm
  onCardMouseLeave(prod: CatalogProduct) {
    if (this.hoveredCardId === prod.productId) {
      this.hoveredCardId = null;
    }
    this.clearHoverTimer(prod.productId);
    if (this.mouseDebounceMap[prod.productId]) {
      clearTimeout(this.mouseDebounceMap[prod.productId]);
      delete this.mouseDebounceMap[prod.productId];
    }
    // Trở về ảnh chính ban đầu
    this.activeImageMap[prod.productId] = 0;
    this.cdr.detectChanges();
  }

  private clearHoverTimer(productId: string) {
    if (this.hoverTimerMap[productId]) {
      clearInterval(this.hoverTimerMap[productId]);
      delete this.hoverTimerMap[productId];
    }
  }

  // Tự động loại bỏ góc ảnh nếu bị lỗi tải hình (404/403)
  onImageError(prod: CatalogProduct, errorIdx: number) {
    const imgs = this.getCardImages(prod);
    if (imgs && imgs.length > 1) {
      imgs.splice(errorIdx, 1);
      if ((this.activeImageMap[prod.productId] || 0) >= imgs.length) {
        this.activeImageMap[prod.productId] = 0;
      }
      this.cdr.detectChanges();
    }
  }

  ngOnDestroy() {
    if (typeof document !== 'undefined') {
      document.body.style.overflow = '';
    }
    this.wishlistSub?.unsubscribe();
    this.compareSub?.unsubscribe();
    this.sub.unsubscribe();
    Object.keys(this.hoverTimerMap).forEach(id => clearInterval(this.hoverTimerMap[id]));
    Object.keys(this.mouseDebounceMap).forEach(id => clearTimeout(this.mouseDebounceMap[id]));
    this.hoverTimerMap = {};
    this.mouseDebounceMap = {};
  }
}
