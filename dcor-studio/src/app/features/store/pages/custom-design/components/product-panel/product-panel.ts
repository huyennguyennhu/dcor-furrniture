import { Component, OnInit, ChangeDetectorRef, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../../../../../../shared/components/icon/icon';
import { RoomPlannerService } from '../../services/room-planner.service';
import { environment } from '../../../../../../../environments/environment';

export interface PlannerProductCard {
  id: string;
  productId: string;
  slug?: string;
  name: string;
  category: string;
  categorySlug?: string;
  imageUrl: string;
  unitPrice: number;
  formattedPrice: string;
  dimensionCm: { width: number; depth: number };
  isEstimatedDimension: boolean;
  rawProduct: any;
}

const FALLBACK_IMAGE =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><rect width="120" height="120" rx="8" fill="%23f3f4f6"/><path d="M35 75 L55 52 L68 64 L85 45 L95 75 Z" fill="%23cbd5e1"/><circle cx="48" cy="42" r="7" fill="%23cbd5e1"/></svg>';

@Component({
  selector: 'app-product-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  templateUrl: './product-panel.html',
  styleUrls: ['./product-panel.css']
})
export class ProductPanelComponent implements OnInit {
  products = signal<PlannerProductCard[]>([]);
  rawCategories: any[] = [];
  isLoading = signal<boolean>(true);
  loadError = signal<string>('');
  addedProductId = signal<string | null>(null);

  searchQuery = signal<string>('');
  selectedCategory = signal<string>('all');

  // Phân trang / Xem thêm
  readonly pageSize: number = 12;
  currentPage = signal<number>(1);

  // Danh mục hiển thị dạng chip
  categories = signal<{ id: string; name: string; slug: string }[]>([
    { id: 'all', name: 'Tất cả', slug: 'all' }
  ]);

  // Danh sách toàn bộ sản phẩm thỏa mãn điều kiện lọc
  readonly allFilteredProducts = computed(() => {
    const list = this.products();
    const query = this.searchQuery().trim().toLowerCase();
    const selected = this.selectedCategory();

    // 1. Chuẩn bị tập hợp ID / Slug hợp lệ nếu có chọn danh mục
    let validCatIds: Set<string> | null = null;
    let validCatSlugs: Set<string> | null = null;
    let targetCatName: string = '';

    if (selected !== 'all') {
      const matchCat = this.rawCategories.find(c => c.id === selected || c.slug === selected);
      if (matchCat) {
        targetCatName = (matchCat.name || '').toLowerCase();
        validCatIds = new Set<string>([matchCat.id]);
        validCatSlugs = new Set<string>([(matchCat.slug || '').toLowerCase()]);

        // Thêm tất cả các danh mục con trong cây
        if (matchCat.children && Array.isArray(matchCat.children)) {
          matchCat.children.forEach((ch: any) => {
            validCatIds!.add(ch.id);
            if (ch.slug) validCatSlugs!.add(ch.slug.toLowerCase());
          });
        }

        // Tìm thêm các danh mục có parentId trỏ tới danh mục này
        this.rawCategories
          .filter(c => c.parentId === matchCat.id)
          .forEach(ch => {
            validCatIds!.add(ch.id);
            if (ch.slug) validCatSlugs!.add(ch.slug.toLowerCase());
          });
      }
    }

    return list.filter(p => {
      // Filter theo danh mục (hỗ trợ toàn bộ cây cha-con)
      if (validCatIds && validCatSlugs) {
        const pRaw = p.rawProduct;
        const pCatId = pRaw?.categoryId || pRaw?.category?.id;
        const pParentId = pRaw?.category?.parentId || pRaw?.category?.parent?.id;
        const pSlug = (pRaw?.category?.slug || p.categorySlug || '').toLowerCase();
        const pParentSlug = (pRaw?.category?.parent?.slug || '').toLowerCase();
        const pCatName = (p.category || '').toLowerCase();

        const matchesCategory =
          (pCatId && validCatIds.has(pCatId)) ||
          (pParentId && validCatIds.has(pParentId)) ||
          (pSlug && validCatSlugs.has(pSlug)) ||
          (pParentSlug && validCatSlugs.has(pParentSlug)) ||
          (targetCatName && pCatName.includes(targetCatName)) ||
          (targetCatName && (
            (targetCatName.includes('table') && (pCatName.includes('table') || pCatName.includes('bàn'))) ||
            (targetCatName.includes('sofa') && pCatName.includes('sofa')) ||
            (targetCatName.includes('chair') && (pCatName.includes('chair') || pCatName.includes('ghế'))) ||
            (targetCatName.includes('storage') && (pCatName.includes('storage') || pCatName.includes('tủ') || pCatName.includes('kệ'))) ||
            (targetCatName.includes('bed') && (pCatName.includes('bed') || pCatName.includes('giường'))) ||
            (targetCatName.includes('lamp') && (pCatName.includes('lamp') || pCatName.includes('đèn'))) ||
            (targetCatName.includes('rug') && (pCatName.includes('rug') || pCatName.includes('thảm')))
          ));

        if (!matchesCategory) return false;
      }

      // Filter theo từ khóa tìm kiếm
      if (query) {
        const pName = p.name.toLowerCase();
        const pCat = p.category.toLowerCase();
        const pDesc = (p.rawProduct?.description || '').toLowerCase();
        if (!pName.includes(query) && !pCat.includes(query) && !pDesc.includes(query)) {
          return false;
        }
      }

      return true;
    });
  });

  // Danh sách sản phẩm cắt theo trang (Xem thêm)
  readonly displayedProducts = computed(() => {
    const all = this.allFilteredProducts();
    const count = this.currentPage() * this.pageSize;
    return all.slice(0, count);
  });

  readonly hasMore = computed(() => {
    return this.allFilteredProducts().length > this.displayedProducts().length;
  });

  readonly remainingCount = computed(() => {
    return Math.max(0, this.allFilteredProducts().length - this.displayedProducts().length);
  });

  constructor(
    public plannerService: RoomPlannerService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.fetchProducts();
  }

  async fetchProducts(): Promise<void> {
    this.isLoading.set(true);
    this.loadError.set('');

    try {
      // Gọi song song categories và products giống explore.ts
      const [catRes, prodRes] = await Promise.all([
        fetch(`${environment.apiUrl}/categories`).catch(() => null),
        fetch(`${environment.apiUrl}/products`)
      ]);

      if (catRes && catRes.ok) {
        const catData = await catRes.json();
        if (Array.isArray(catData)) {
          this.rawCategories = catData;

          // Lấy các danh mục gốc (parentId == null) và lọc các mục có sản phẩm
          const rootCats = catData
            .filter((c: any) => !c.parentId && c.isActive !== false)
            .sort((a: any, b: any) => (a.sortOrder || 0) - (b.sortOrder || 0))
            .map((c: any) => ({
              id: c.id,
              name: c.name,
              slug: c.slug || c.name.toLowerCase()
            }));

          this.categories.set([
            { id: 'all', name: 'Tất cả', slug: 'all' },
            ...rootCats
          ]);
        }
      }

      if (!prodRes.ok) {
        throw new Error(`Lỗi kết nối máy chủ (${prodRes.status})`);
      }

      const data = await prodRes.json();
      const rawList = Array.isArray(data) ? data : (data.data || data.Items || data.products || []);

      const mapped = this.mapProductCards(rawList);
      this.products.set(mapped);
      this.isLoading.set(false);
      this.cdr.markForCheck();
    } catch (err: any) {
      this.products.set([]);
      this.loadError.set(err.message || 'Không thể tải danh sách sản phẩm từ máy chủ. Vui lòng thử lại.');
      this.isLoading.set(false);
      this.cdr.markForCheck();
    }
  }

  private mapProductCards(rawList: any[]): PlannerProductCard[] {
    const isCleanUrl = (u: any): boolean => {
      return typeof u === 'string' && u.startsWith('http') && !u.includes('assets.boconcept.com');
    };

    return rawList.map((p: any) => {
      const basePrice = p.basePrice || 0;
      let lowestPrice = basePrice;
      if (p.discountValue) {
        if (p.discountType === 'PERCENT') {
          lowestPrice = Math.round((basePrice * (100 - p.discountValue)) / 100);
        } else {
          lowestPrice = Math.max(0, basePrice - p.discountValue);
        }
      }

      const categoryName = p.category?.parent?.name || p.category?.name || 'Nội thất';
      const categorySlug = p.category?.slug || '';

      const pMain = Array.isArray(p.images) && p.images[0] && isCleanUrl(p.images[0]) ? p.images[0] : null;
      const v0RawImgs = p.variants?.[0]?.optionValues?.images || p.variants?.[0]?.images || [];
      const v0CleanImgs = (Array.isArray(v0RawImgs) ? v0RawImgs : []).filter(isCleanUrl);

      const finalImage =
        pMain ||
        v0CleanImgs[0] ||
        (Array.isArray(p.images) && p.images[0]) ||
        'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80';

      const { width, depth, isEstimated } = this.extractDimensions(p);

      return {
        id: p.id || p.productId || `prod_${Date.now()}`,
        productId: p.id || p.productId || `prod_${Date.now()}`,
        slug: p.slug,
        name: p.name || 'Sản phẩm nội thất',
        category: categoryName,
        categorySlug,
        imageUrl: finalImage,
        unitPrice: lowestPrice,
        formattedPrice: new Intl.NumberFormat('vi-VN').format(lowestPrice) + ' ₫',
        dimensionCm: { width, depth },
        isEstimatedDimension: isEstimated,
        rawProduct: p
      };
    });
  }

  private extractDimensions(product: any): { width: number; depth: number; isEstimated: boolean } {
    let width = 0;
    let depth = 0;

    const parseNum = (v: any): number => {
      if (typeof v === 'number') return v;
      if (typeof v === 'string') {
        const m = v.replace(',', '.').match(/[\d.]+/);
        return m ? parseFloat(m[0]) : 0;
      }
      return 0;
    };

    // 1. Trích xuất từ attributes trong variant 0 (Madrid, Expose, Demand, etc.)
    const attrs = product.variants?.[0]?.optionValues?.attributes;
    if (attrs) {
      if (attrs.diameter) {
        const d = parseNum(attrs.diameter);
        if (d > 0) {
          width = d;
          depth = d;
        }
      }
      if ((!width || !depth) && attrs.width && attrs.depth) {
        width = parseNum(attrs.width);
        depth = parseNum(attrs.depth);
      } else if (!width && attrs.width) {
        width = parseNum(attrs.width);
      }
    }

    // 2. Trích xuất từ variant size (2m, 2m4)
    if (!width || !depth) {
      const sizeVal = product.variants?.[0]?.optionValues?.size;
      if (typeof sizeVal === 'string') {
        if (/2m4/i.test(sizeVal)) {
          width = 240;
          depth = 95;
        } else if (/2m/i.test(sizeVal)) {
          width = 200;
          depth = 90;
        } else if (/1m8/i.test(sizeVal)) {
          width = 180;
          depth = 85;
        } else if (/1m6/i.test(sizeVal)) {
          width = 160;
          depth = 80;
        }
      }
    }

    // 3. Trích xuất từ variant name (H51xØ46cm, H45xØ38cm, etc.)
    if (!width || !depth) {
      const vName = product.variants?.[0]?.name || '';
      const diamMatch = vName.match(/Ø(\d+)/);
      if (diamMatch) {
        const d = parseFloat(diamMatch[1]);
        if (d > 0) {
          width = d;
          depth = d;
        }
      }
    }

    // 4. Trích xuất từ configOptions.dimensions
    if ((!width || !depth) && product.configOptions?.dimensions) {
      width = parseNum(product.configOptions.dimensions.width);
      depth = parseNum(product.configOptions.dimensions.depth);
    }

    // 5. Trích xuất từ variants[0].optionValues.dimensions
    if ((!width || !depth) && product.variants?.[0]?.optionValues?.dimensions) {
      width = parseNum(product.variants[0].optionValues.dimensions.width);
      depth = parseNum(product.variants[0].optionValues.dimensions.depth);
    }

    // 6. Trích xuất từ dimensions trực tiếp
    if ((!width || !depth) && product.dimensions) {
      width = parseNum(product.dimensions.width);
      depth = parseNum(product.dimensions.depth);
    }

    // 7. Fallback ước tính theo danh mục nếu hoàn toàn thiếu
    if (!width || !depth || width <= 0 || depth <= 0) {
      const catLower = (product.category?.parent?.name || product.category?.name || '').toLowerCase();
      if (catLower.includes('sofa')) {
        return { width: 220, depth: 95, isEstimated: true };
      }
      if (catLower.includes('table') || catLower.includes('bàn')) {
        return { width: 140, depth: 80, isEstimated: true };
      }
      if (catLower.includes('chair') || catLower.includes('ghế')) {
        return { width: 60, depth: 60, isEstimated: true };
      }
      if (catLower.includes('bed') || catLower.includes('giường')) {
        return { width: 180, depth: 200, isEstimated: true };
      }
      if (catLower.includes('rug') || catLower.includes('thảm')) {
        return { width: 200, depth: 140, isEstimated: true };
      }
      return { width: 100, depth: 60, isEstimated: true };
    }

    return { width, depth, isEstimated: false };
  }

  // Bấm nút thêm vào phòng
  handleAddProduct(prod: PlannerProductCard): void {
    this.plannerService.addProductToCanvas(prod.rawProduct);

    // Feedback visual nhanh
    this.addedProductId.set(prod.id);
    setTimeout(() => {
      if (this.addedProductId() === prod.id) {
        this.addedProductId.set(null);
        this.cdr.markForCheck();
      }
    }, 700);
  }

  // Kéo thả vào canvas
  onDragStart(e: DragEvent, prod: PlannerProductCard): void {
    if (e.dataTransfer) {
      e.dataTransfer.setData('application/json', JSON.stringify(prod.rawProduct));
      e.dataTransfer.effectAllowed = 'copy';
    }
  }

  setCategory(idOrSlug: string): void {
    this.selectedCategory.set(idOrSlug);
    this.currentPage.set(1);
  }

  clearSearch(): void {
    this.searchQuery.set('');
    this.currentPage.set(1);
  }

  loadMore(): void {
    this.currentPage.update(p => p + 1);
  }

  onImgError(e: Event): void {
    (e.target as HTMLImageElement).src = FALLBACK_IMAGE;
  }
}
