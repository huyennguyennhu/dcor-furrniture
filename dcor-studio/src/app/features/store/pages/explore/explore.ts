import { IconComponent } from '../../../../shared/components/icon/icon';
import { Component, OnInit, OnDestroy, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CatalogProduct, ProductCategory, ProductColorSwatch } from '../../../../shared/models/catalog.model';
import { CustomSelect } from '../../../../shared/components/custom-select/custom-select';
import { SidebarFilterComponent, FilterState as SidebarFilterState } from '../../../../shared/components/sidebar-filter/sidebar-filter'; 
import { QuickViewDrawerComponent } from '../../../../shared/components/quick-view-drawer/quick-view-drawer';
import { LucideAngularModule, Heart, Share2, Eye, Scale, ShoppingCart, ChevronDown, Check, Star } from 'lucide-angular';

import { environment } from '../../../../../environments/environment';

export type FilterState = SidebarFilterState;

const INITIAL_FILTER_STATE: FilterState = {
  categories: [],
  materials: [],
  colors: [],
  rooms: [],
  styles: [],
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
    LucideAngularModule
  ],
  templateUrl: './explore.html',
  styleUrls: ['./explore.css']
})
export class ExploreComponent implements OnInit, OnDestroy {
  icons = { Heart, Share2, Eye, Scale, ShoppingCart, ChevronDown, Check, Star };

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
  compareList: CatalogProduct[] = [];
  showScrollTop = false;
  selectedVariantMap: Record<string, ProductColorSwatch> = {};

  constructor(private route: ActivatedRoute, private router: Router, private cdr: ChangeDetectorRef) {}

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
    this.route.queryParams.subscribe(params => {
      this.filters.categories = params['category'] ? [params['category']] : [];
      this.filters.rooms = params['room'] ? [params['room']] : [];
      this.filters.styles = params['style'] ? [params['style']] : [];
      this.searchQuery = params['q'] || '';
      this.currentPage = 1;
      this.fetchData();
      this.scrollToTop();
    });
  }

  async fetchData() {
    this.isLoading = true;
    try {
      // 1. Gọi song song API categories và products từ database thật
      const [catRes, prodRes] = await Promise.all([
        fetch(`${environment.apiUrl}/categories`).catch(() => null),
        fetch(`${environment.apiUrl}/products`)
      ]);

      if (catRes && catRes.ok) {
        this.rawCategories = await catRes.json();

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

      if (prodRes.ok) {
        const data = await prodRes.json();
        const rawProducts = Array.isArray(data) ? data : (data.data || data.Items || data.products || []);
        
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

          // Helper phân tích màu sắc từ tên biến thể trong DB
          const getVariantColorInfo = (variantName: string): { name: string; hex: string } => {
            const lower = (variantName || '').toLowerCase();
            if (lower.includes('dark marble') || lower.includes('marble')) return { name: 'Cẩm thạch', hex: '#2E3136' };
            if (lower.includes('dark oak')) return { name: 'Sồi tối', hex: '#4A3728' };
            if (lower.includes('natural oak') || lower.includes('oak')) return { name: 'Gỗ sồi', hex: '#C4A482' };
            if (lower.includes('ash') || lower.includes('smoke') || lower.includes('khói')) return { name: 'Ghi khói', hex: '#6b7280' };
            if (lower.includes('dark grey') || lower.includes('charcoal')) return { name: 'Xám đậm', hex: '#374151' };
            if (lower.includes('light grey') || lower.includes('warm grey') || lower.includes('grey') || lower.includes('gray') || lower.includes('xám')) return { name: 'Xám', hex: '#9ca3af' };
            if (lower.includes('white') || lower.includes('trắng') || lower.includes('clear')) return { name: 'Trắng', hex: '#f3f4f6' };
            if (lower.includes('black') || lower.includes('đen')) return { name: 'Đen', hex: '#18181b' };
            if (lower.includes('brown') || lower.includes('nâu') || lower.includes('walnut')) return { name: 'Nâu', hex: '#6B4423' };
            if (lower.includes('green') || lower.includes('xanh lá') || lower.includes('olive')) return { name: 'Xanh lá', hex: '#3B5E45' };
            if (lower.includes('beige') || lower.includes('be') || lower.includes('sand') || lower.includes('cream')) return { name: 'Be', hex: '#D8C8B8' };
            if (lower.includes('cognac') || lower.includes('camel') || lower.includes('cam')) return { name: 'Cam đất', hex: '#9A461E' };
            if (lower.includes('blue') || lower.includes('xanh dương') || lower.includes('navy')) return { name: 'Xanh dương', hex: '#2B4C7E' };
            if (lower.includes('yellow') || lower.includes('vàng')) return { name: 'Vàng', hex: '#E6B800' };
            if (lower.includes('red') || lower.includes('đỏ') || lower.includes('burgundy')) return { name: 'Đỏ', hex: '#991b1b' };
            if (lower.includes('pink') || lower.includes('hồng')) return { name: 'Hồng', hex: '#ec4899' };

            const earthTones = ['#78716c', '#a8a29e', '#d6d3d1', '#737373', '#525252'];
            const hash = lower.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
            return { name: variantName || 'Tiêu chuẩn', hex: earthTones[hash % earthTones.length] };
          };

          // Xây dựng danh sách Color Swatches tương tác thực tế từ các biến thể trong DB
          const rawVariants = Array.isArray(p.variants) ? p.variants : [];
          const colorSwatches: ProductColorSwatch[] = [];
          const seenHex = new Set<string>();

          rawVariants.forEach((v: any, vIdx: number) => {
            const vRaw = v.optionValues?.images || v.images || [];
            const vClean = (Array.isArray(vRaw) ? vRaw : []).filter(isCleanUrl);
            const colorInfo = getVariantColorInfo(v.name);

            if (!seenHex.has(colorInfo.hex) && vClean.length > 0) {
              seenHex.add(colorInfo.hex);

              // Nếu là biến thể đầu tiên và có pMain hợp lệ, chèn pMain lên đầu làm góc chính diện
              const vImages = [...vClean];
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
            prices: [{ price: basePrice, formattedPrice: new Intl.NumberFormat('vi-VN').format(basePrice) + ' đ' }],
            lowestPrices: lowestPrice < basePrice ? [{ price: lowestPrice, formattedPrice: new Intl.NumberFormat('vi-VN').format(lowestPrice) + ' đ' }] : [],
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
      }
    } catch (e) {
      console.error('Lỗi khi tải dữ liệu trang Explore:', e);
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
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

  // Tiêu đề Banner động theo danh mục / phòng / phong cách
  get currentCategoryTitle(): string {
    // 1. Nếu chọn danh mục chính từ DB
    if (this.filters.categories && this.filters.categories.length > 0) {
      const selectedSlug = this.filters.categories[0];
      const match = this.rawCategories.find(c => c.slug === selectedSlug || c.id === selectedSlug);
      if (match) {
        return match.name;
      }
      return selectedSlug;
    }

    // 2. Nếu chọn phòng (slug room)
    if (this.filters.rooms && this.filters.rooms.length > 0) {
      const rSlug = this.filters.rooms[0];
      if (rSlug === 'phong-ngu') return 'Bedroom';
      if (rSlug === 'phong-khach') return 'Living Room';
      if (rSlug === 'phong-bep') return 'Kitchen & Dining';
      if (rSlug === 'phong-lam-viec') return 'Home Office';
      if (rSlug === 'ngoai-troi') return 'Outdoor';
    }

    // 3. Nếu chọn style
    if (this.filters.styles && this.filters.styles.length > 0) {
      const sSlug = this.filters.styles[0];
      const styleNames: Record<string, string> = {
        'japandi': 'Japandi Style',
        'scandinavian': 'Scandinavian Style',
        'modern-luxury': 'Modern Luxury',
        'wabi-sabi': 'Wabi-Sabi Style',
        'minimalism': 'Minimalism',
        'industrial': 'Industrial Style'
      };
      return styleNames[sSlug] || sSlug;
    }

    return 'Tất cả sản phẩm';
  }

  get currentCategoryBreadcrumb(): string {
    return this.currentCategoryTitle;
  }

  get hasActiveFilters(): boolean {
    return (this.filters.categories.length > 0) ||
           (this.filters.materials.length > 0) ||
           (this.filters.colors.length > 0) ||
           ((this.filters.rooms?.length || 0) > 0) ||
           ((this.filters.styles?.length || 0) > 0) ||
           (this.filters.minRating !== undefined) ||
           (this.filters.priceRange[0] > 0 || this.filters.priceRange[1] < this.dynamicMaxPrice);
  }

  get filteredExceptPrice(): CatalogProduct[] {
    return this.products.filter(prod => {
      // 1. Lọc theo danh mục chính từ Database (parentId == null)
      if (this.filters.categories.length > 0) {
        const matchesCategory = this.filters.categories.some(selectedCatSlug => {
          const sel = selectedCatSlug.toLowerCase();
          const pCatSlug = (prod.categoryObj?.slug || '').toLowerCase();
          const pCatId = (prod.categoryObj?.id || '').toLowerCase();
          const parentSlug = (prod.categoryObj?.parent?.slug || '').toLowerCase();
          const parentId = (prod.categoryObj?.parent?.id || '').toLowerCase();

          // Khớp slug danh mục chính hoặc slug danh mục con hoặc id
          return pCatSlug === sel || 
                 parentSlug === sel ||
                 pCatId === sel ||
                 parentId === sel ||
                 pCatSlug.includes(sel) ||
                 parentSlug.includes(sel);
        });
        if (!matchesCategory) return false;
      }

      // 2. Lọc theo phòng (slug room)
      if (this.filters.rooms && this.filters.rooms.length > 0) {
        const roomMatches = this.filters.rooms.some(rSlug => {
          const catSlug = (prod.categoryObj?.slug || '').toLowerCase();
          const parentSlug = (prod.categoryObj?.parent?.slug || '').toLowerCase();
          const name = (prod.name || '').toLowerCase();

          if (rSlug === 'phong-khach') {
            return parentSlug.includes('sofa') || parentSlug.includes('table') || parentSlug.includes('storage') || parentSlug.includes('rug') || parentSlug.includes('lamp') || name.includes('sofa') || name.includes('coffee') || name.includes('tv');
          }
          if (rSlug === 'phong-ngu') {
            return parentSlug.includes('bed') || catSlug.includes('bed') || catSlug.includes('night-stand') || catSlug.includes('throw') || name.includes('bed') || name.includes('nightstand');
          }
          if (rSlug === 'phong-bep') {
            return catSlug.includes('dining') || catSlug.includes('bar') || name.includes('dining') || name.includes('bar');
          }
          if (rSlug === 'phong-lam-viec') {
            return catSlug.includes('desk') || catSlug.includes('office') || name.includes('desk') || name.includes('office');
          }
          if (rSlug === 'ngoai-troi') {
            return parentSlug.includes('outdoor') || catSlug.includes('outdoor') || name.includes('outdoor');
          }
          return true;
        });
        if (!roomMatches) return false;
      }

      // 3. Lọc theo phong cách thiết kế (slug style)
      if (this.filters.styles && this.filters.styles.length > 0) {
        const styleMatches = this.filters.styles.some(sSlug => {
          const desc = (prod.description || '').toLowerCase();
          const name = (prod.name || '').toLowerCase();
          const text = `${name} ${desc}`;

          if (sSlug === 'japandi') {
            return text.includes('oak') || text.includes('wood') || text.includes('ceramic') || text.includes('fabric') || text.includes('linen') || text.includes('natural');
          }
          if (sSlug === 'scandinavian') {
            return text.includes('wool') || text.includes('oak') || text.includes('boucl') || text.includes('fabric') || text.includes('light');
          }
          if (sSlug === 'modern-luxury') {
            return text.includes('leather') || text.includes('marble') || text.includes('lacquered') || text.includes('steel') || text.includes('dark');
          }
          if (sSlug === 'wabi-sabi') {
            return text.includes('concrete') || text.includes('ceramic') || text.includes('rough') || text.includes('cotton') || text.includes('organic');
          }
          if (sSlug === 'minimalism') {
            return text.includes('metal') || text.includes('glass') || text.includes('acrylic') || text.includes('aluminium');
          }
          if (sSlug === 'industrial') {
            return text.includes('metal') || text.includes('concrete') || text.includes('steel') || text.includes('aluminium');
          }
          return true;
        });
        if (!styleMatches) return false;
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

      // 5. Lọc theo chất liệu thật
      if (this.filters.materials.length > 0) {
        const matchesMaterial = prod.refinementMaterials?.some(m => 
          this.filters.materials.some(fm => m.toLowerCase().includes(fm.toLowerCase()) || fm.toLowerCase().includes(m.toLowerCase()))
        );
        if (!matchesMaterial) return false;
      }

      // 6. Lọc theo màu sắc thật từ biến thể
      if (this.filters.colors.length > 0) {
        const matchesColor = this.filters.colors.some(cSlug => {
          const variantText = (prod.variants || []).map((v: any) => v.name || '').join(' ').toLowerCase();
          const desc = (prod.description || '').toLowerCase();
          const combined = `${variantText} ${desc}`;
          
          if (cSlug === 'white') return combined.includes('white') || combined.includes('trắng') || combined.includes('clear');
          if (cSlug === 'black') return combined.includes('black') || combined.includes('đen');
          if (cSlug === 'grey') return combined.includes('grey') || combined.includes('gray') || combined.includes('xám');
          if (cSlug === 'ash-grey') return combined.includes('ash') || combined.includes('tro');
          if (cSlug === 'brown') return combined.includes('brown') || combined.includes('nâu');
          if (cSlug === 'oak') return combined.includes('oak') || combined.includes('sồi');
          if (cSlug === 'dark-oak') return combined.includes('dark oak');
          if (cSlug === 'marble') return combined.includes('marble');
          if (cSlug === 'green') return combined.includes('green') || combined.includes('xanh');
          if (cSlug === 'beige') return combined.includes('beige') || combined.includes('be');
          if (cSlug === 'cognac') return combined.includes('cognac') || combined.includes('camel');
          if (cSlug === 'blue') return combined.includes('blue');
          if (cSlug === 'smoke') return combined.includes('smoke');
          if (cSlug === 'yellow') return combined.includes('yellow') || combined.includes('vàng');
          return combined.includes(cSlug);
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
    const selected = this.selectedVariantMap[prod.productId];
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
    const selected = this.selectedVariantMap[prod.productId];
    if (selected && selected.price && prod.discountValue) {
      return new Intl.NumberFormat('vi-VN').format(selected.price) + ' đ';
    }
    if (prod.lowestPrices && prod.lowestPrices.length > 0) {
      return prod.prices?.[0]?.formattedPrice ?? null;
    }
    return null;
  }

  isOnSale(prod: CatalogProduct): boolean {
    return Boolean(prod.lowestPrices && prod.lowestPrices.length > 0 && prod.lowestPrices[0].price < (prod.prices?.[0]?.price ?? 0));
  }

  getCategoryLabel(catKey: string): string {
    const match = this.rawCategories.find(c => c.slug === catKey || c.id === catKey);
    return match ? match.name : catKey;
  }

  getRoomLabel(slug: string): string {
    const roomMap: Record<string, string> = {
      'phong-khach': 'Phòng Khách',
      'phong-ngu': 'Phòng Ngủ',
      'phong-bep': 'Phòng Bếp',
      'phong-lam-viec': 'Phòng Làm Việc',
      'ngoai-troi': 'Ngoài Trời'
    };
    return roomMap[slug] || slug;
  }

  getStyleLabel(slug: string): string {
    const styleMap: Record<string, string> = {
      'japandi': 'Japandi',
      'scandinavian': 'Scandinavian',
      'modern-luxury': 'Modern Luxury',
      'wabi-sabi': 'Wabi-Sabi',
      'minimalism': 'Minimalism',
      'industrial': 'Industrial'
    };
    return styleMap[slug] || slug;
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

  removeFilterTag(key: 'rooms' | 'styles' | 'materials' | 'colors', val: string) {
    if (this.filters[key]) {
      this.filters[key] = (this.filters[key] as string[]).filter(item => item !== val);
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
    this.filters = newFilters;
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
    this.filters.materials = [];
    this.filters.colors = [];
    this.filters.rooms = [];
    this.filters.styles = [];
    this.filters.minRating = undefined;
    this.currentPage = 1;
    this.scrollToTop();
  }

  loadMore() {
    this.currentPage++;
  }

  toggleWishlist(e: Event, productId: string) {
    e.stopPropagation();
    e.preventDefault();
    if (this.wishlist.includes(productId)) {
      this.wishlist = this.wishlist.filter(id => id !== productId);
    } else {
      this.wishlist.push(productId);
    }
  }

  toggleCompare(e: Event, prod: CatalogProduct) {
    e.stopPropagation();
    e.preventDefault();
    const index = this.compareList.findIndex(p => p.productId === prod.productId);
    if (index > -1) {
      this.compareList.splice(index, 1);
    } else {
      if (this.compareList.length < 5) {
        this.compareList.push(prod);
      }
    }
  }

  isInCompare(productId: string): boolean {
    return this.compareList.some(p => p.productId === productId);
  }

  removeCompare(productId: string) {
    this.compareList = this.compareList.filter(p => p.productId !== productId);
  }

  handleBuyClick(e: Event, prod: CatalogProduct) {
    e.stopPropagation();
    e.preventDefault();
    this.openQuickView(e, prod);
  }

  openQuickView(e: Event, prod: CatalogProduct) {
    e.stopPropagation();
    e.preventDefault();
    const selected = this.selectedVariantMap[prod.productId];
    if (selected && selected.images && selected.images.length > 0) {
      prod.images = selected.images;
    }
    this.quickViewProduct = prod;
    this.isQuickViewOpen = true;
  }

  handleProductClick(productId: string) {
    this.router.navigate(['/products', productId]);
  }

  // --- Quản lý biến thể màu sắc & ảnh tương ứng trên thẻ sản phẩm ---
  getCardImages(prod: CatalogProduct): string[] {
    const selected = this.selectedVariantMap[prod.productId];
    if (selected && selected.images && selected.images.length > 0) {
      return selected.images;
    }
    return prod.images || [];
  }

  isSwatchActive(prod: CatalogProduct, sw: ProductColorSwatch): boolean {
    const current = this.selectedVariantMap[prod.productId];
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
    Object.keys(this.hoverTimerMap).forEach(id => clearInterval(this.hoverTimerMap[id]));
    Object.keys(this.mouseDebounceMap).forEach(id => clearTimeout(this.mouseDebounceMap[id]));
    this.hoverTimerMap = {};
    this.mouseDebounceMap = {};
  }
}
