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

@Component({
  selector: 'app-product-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  templateUrl: './product-panel.html',
  styleUrls: ['./product-panel.css']
})
export class ProductPanelComponent implements OnInit {
  products = signal<PlannerProductCard[]>([]);
  isLoading = signal<boolean>(true);
  loadError = signal<string>('');

  searchQuery = signal<string>('');
  selectedCategory = signal<string>('all');

  categories = signal<{ id: string; name: string; slug: string }[]>([
    { id: 'all', name: 'Tất cả', slug: 'all' },
    { id: 'sofa', name: 'Sofa', slug: 'sofa' },
    { id: 'table', name: 'Bàn', slug: 'ban' },
    { id: 'chair', name: 'Ghế', slug: 'ghe' },
    { id: 'storage', name: 'Tủ Kệ', slug: 'tu-ke' },
    { id: 'bed', name: 'Giường', slug: 'giuong' },
    { id: 'lamp', name: 'Đèn', slug: 'den' },
    { id: 'rug', name: 'Thảm', slug: 'tham' }
  ]);

  readonly filteredProducts = computed(() => {
    const list = this.products();
    const query = this.searchQuery().trim().toLowerCase();
    const cat = this.selectedCategory().toLowerCase();

    return list.filter(p => {
      // 1. Filter theo từ khóa
      if (query && !p.name.toLowerCase().includes(query) && !p.category.toLowerCase().includes(query)) {
        return false;
      }

      // 2. Filter theo danh mục
      if (cat !== 'all') {
        const pCat = p.category.toLowerCase();
        const pCatSlug = (p.categorySlug || '').toLowerCase();
        const matchesCategory =
          pCat.includes(cat) ||
          pCatSlug.includes(cat) ||
          (cat === 'sofa' && (pCat.includes('sofa') || pCat.includes('chaise'))) ||
          (cat === 'ban' && (pCat.includes('bàn') || pCat.includes('table') || pCat.includes('desk'))) ||
          (cat === 'ghe' && (pCat.includes('ghế') || pCat.includes('chair') || pCat.includes('stool'))) ||
          (cat === 'tu-ke' && (pCat.includes('tủ') || pCat.includes('kệ') || pCat.includes('storage') || pCat.includes('shelf'))) ||
          (cat === 'giuong' && (pCat.includes('giường') || pCat.includes('bed'))) ||
          (cat === 'den' && (pCat.includes('đèn') || pCat.includes('lamp') || pCat.includes('light'))) ||
          (cat === 'tham' && (pCat.includes('thảm') || pCat.includes('rug')));

        if (!matchesCategory) return false;
      }

      return true;
    });
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
      const [catRes, prodRes] = await Promise.all([
        fetch(`${environment.apiUrl}/categories`).catch(() => null),
        fetch(`${environment.apiUrl}/products`)
      ]);

      if (catRes && catRes.ok) {
        const catData = await catRes.json();
        if (Array.isArray(catData) && catData.length > 0) {
          const mappedCats = [
            { id: 'all', name: 'Tất cả', slug: 'all' },
            ...catData.map((c: any) => ({
              id: c.id,
              name: c.name,
              slug: c.slug || c.name.toLowerCase()
            }))
          ];
          this.categories.set(mappedCats);
        }
      }

      if (!prodRes.ok) {
        throw new Error(`Lỗi kết nối máy chủ (${prodRes.status})`);
      }

      const data = await prodRes.json();
      const rawList = Array.isArray(data) ? data : (data.data || data.Items || data.products || []);

      const isCleanUrl = (u: any): boolean => {
        return typeof u === 'string' && u.startsWith('http') && !u.includes('assets.boconcept.com');
      };

      const mapped: PlannerProductCard[] = rawList.map((p: any) => {
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

        // Trích xuất ảnh chính
        const pMain = Array.isArray(p.images) && p.images[0] && isCleanUrl(p.images[0]) ? p.images[0] : null;
        const v0RawImgs = p.variants?.[0]?.optionValues?.images || p.variants?.[0]?.images || [];
        const v0CleanImgs = (Array.isArray(v0RawImgs) ? v0RawImgs : []).filter(isCleanUrl);

        let finalImage = pMain || v0CleanImgs[0] || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80';

        // Trích xuất kích thước cm (width x depth)
        const { width, depth, isEstimated } = this.extractDimensions(p);

        return {
          id: p.id || p.productId,
          productId: p.id || p.productId,
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

      this.products.set(mapped);
      this.isLoading.set(false);
      this.cdr.markForCheck();
    } catch (err: any) {
      this.loadError.set(err.message || 'Không thể tải danh sách sản phẩm. Vui lòng thử lại.');
      this.isLoading.set(false);
      this.cdr.markForCheck();
    }
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

    if (product.configOptions?.dimensions) {
      width = parseNum(product.configOptions.dimensions.width);
      depth = parseNum(product.configOptions.dimensions.depth);
    }

    if ((!width || !depth) && product.variants?.[0]?.optionValues?.dimensions) {
      width = parseNum(product.variants[0].optionValues.dimensions.width);
      depth = parseNum(product.variants[0].optionValues.dimensions.depth);
    }

    if ((!width || !depth) && product.dimensions) {
      width = parseNum(product.dimensions.width);
      depth = parseNum(product.dimensions.depth);
    }

    if (!width || !depth || width <= 0 || depth <= 0) {
      return { width: 100, depth: 60, isEstimated: true };
    }

    return { width, depth, isEstimated: false };
  }

  // Bấm nút thêm vào phòng
  handleAddProduct(prod: PlannerProductCard): void {
    this.plannerService.addProductToCanvas(prod.rawProduct);
  }

  // Bắt đầu kéo thả vào canvas
  onDragStart(e: DragEvent, prod: PlannerProductCard): void {
    if (e.dataTransfer) {
      e.dataTransfer.setData('application/json', JSON.stringify(prod.rawProduct));
      e.dataTransfer.effectAllowed = 'copy';
    }
  }

  setCategory(slug: string): void {
    this.selectedCategory.set(slug);
  }

  clearSearch(): void {
    this.searchQuery.set('');
  }
}
