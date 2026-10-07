import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CatalogProduct } from '../../../../shared/models/catalog.model';
import { CatalogSection } from '../../../../shared/components/catalog-section/catalog-section';

// Data from lib/collections
const STYLE_COLLECTIONS = [
  { id: 'scandinavian', name: 'Scandinavian', name_vi: 'Bắc Âu Hiện Đại', description_vi: 'Đơn giản, tinh tế, ưu tiên ánh sáng tự nhiên và công năng.', coverImage: 'https://ckkvyltbeinzqogjsfli.supabase.co/storage/v1/object/public/dcor/rooms/scandi.jpg', accentColor: '#D1D5DB' },
  { id: 'japandi', name: 'Japandi', name_vi: 'Japandi Tối Giản', description_vi: 'Sự pha trộn giữa sự mộc mạc của Nhật Bản và nét thanh lịch của Bắc Âu.', coverImage: 'https://ckkvyltbeinzqogjsfli.supabase.co/storage/v1/object/public/dcor/rooms/japandi.jpg', accentColor: '#E5E7EB' },
  { id: 'midcentury', name: 'Mid-Century', name_vi: 'Retro Cổ Điển', description_vi: 'Đường nét mạnh mẽ, vật liệu tự nhiên mang hơi thở của những năm 50s.', coverImage: 'https://ckkvyltbeinzqogjsfli.supabase.co/storage/v1/object/public/dcor/rooms/mid.jpg', accentColor: '#F3F4F6' }
];

const ROOM_INSPIRATIONS = [
  { id: 'living-1', name_vi: 'Phòng khách Metropolitan', tag: 'Phòng khách', area: '25m²', description_vi: 'Góc nhìn đô thị hiện đại với tông màu trung tính và nhấn nhá bằng kim loại.', coverImage: 'https://ckkvyltbeinzqogjsfli.supabase.co/storage/v1/object/public/dcor/rooms/living1.jpg', productIds: ['prod-1', 'prod-2'] },
  { id: 'dining-1', name_vi: 'Phòng ăn Ấm cúng', tag: 'Phòng ăn', area: '15m²', description_vi: 'Nơi sum vầy hoàn hảo với bàn ăn gỗ tự nhiên mở rộng được.', coverImage: 'https://ckkvyltbeinzqogjsfli.supabase.co/storage/v1/object/public/dcor/rooms/dining.jpg', productIds: ['prod-3'] }
];

const HERO_HOTSPOTS = [
  { id: 'spot-1', x: 25, y: 65, name_vi: 'Sofa Indivi', price: 'Từ 45.000.000đ', image: 'https://ckkvyltbeinzqogjsfli.supabase.co/storage/v1/object/public/dcor/sofas/indivi.jpg', productId: 'sofa-indivi' },
  { id: 'spot-2', x: 70, y: 45, name_vi: 'Đèn treo trần', price: 'Từ 8.500.000đ', image: 'https://ckkvyltbeinzqogjsfli.supabase.co/storage/v1/object/public/dcor/lighting/105000001520_2751896_PNG-Web2072dpi.png', productId: 'light-1' }
];

const TRUST_ITEMS = [
  { icon: 'leaf', title: 'Gỗ tự nhiên bền vững', desc: 'Nguyên liệu từ rừng quản lý bền vững, đạt chứng chỉ FSC.' },
  { icon: 'shield', title: 'Bảo hành 5 năm', desc: 'Cam kết chất lượng dài hạn với dịch vụ bảo hành toàn quốc.' },
  { icon: 'truck', title: 'Giao hàng toàn quốc', desc: 'Vận chuyển nhanh chóng, an toàn đến mọi tỉnh thành.' },
  { icon: 'wrench', title: 'Miễn phí lắp đặt', desc: 'Đội ngũ kỹ thuật chuyên nghiệp lắp đặt tận nơi.' },
];

const STATIC_REVIEWS = [
  { name: 'Nguyễn Minh Tuấn', city: 'TP. HCM', rating: 5, text: 'Sofa rất đẹp và chất lượng vượt mong đợi. Dịch vụ lắp đặt nhanh chóng, nhân viên nhiệt tình.', product: 'Sofa Indivi 3 chỗ' },
  { name: 'Trần Thị Lan Anh', city: 'Hà Nội', rating: 5, text: 'Mua bàn ăn Augusta, giao hàng đúng hẹn, đóng gói cẩn thận. Chất lượng xứng với giá tiền.', product: 'Bàn ăn Augusta' },
  { name: 'Lê Hữu Phước', city: 'Đà Nẵng', rating: 5, text: 'Tôi rất thích tính năng tùy biến chân sofa. Cảm giác như được thiết kế riêng cho mình.', product: 'Sofa Carmo 2 chỗ' },
];

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, CatalogSection],
  templateUrl: './home.html',
  styleUrls: ['./home.css']
})
export class HomeComponent implements OnInit {
  products: CatalogProduct[] = [];
  categories: any[] = [];
  isLoading = true;

  activeHotspot: string | null = null;
  scrollY = 0;
  
  featuredTab: 'newest' | 'sale' = 'newest';
  
  STYLE_COLLECTIONS = STYLE_COLLECTIONS;
  ROOM_INSPIRATIONS = ROOM_INSPIRATIONS;
  HERO_HOTSPOTS = HERO_HOTSPOTS;
  TRUST_ITEMS = TRUST_ITEMS;
  STATIC_REVIEWS = STATIC_REVIEWS;

  activeRoom: string | null = null;
  reviewIdx = 0;

  get saleProducts() {
    return this.products.filter(p => this.isOnSale(p)).slice(0, 8);
  }

  get newestProducts() {
    return this.products.slice(0, 8);
  }

  get displayedFeatured() {
    return this.featuredTab === 'sale' ? this.saleProducts : this.newestProducts;
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.scrollY = window.scrollY;
  }

  ngOnInit() {
    this.fetchProducts();
  }

  async fetchProducts() {
    try {
      const res = await fetch('https://dcor-furrniture.onrender.com/api/products');
      if (res.ok) {
        const data = await res.json();
        this.products = data;
        this.generateCategories(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      this.isLoading = false;
    }
  }

  generateCategories(data: CatalogProduct[]) {
    const counts: Record<string, number> = {};
    const firstImages: Record<string, string> = {};

    data.forEach(p => {
      const cat = p.category || 'Khác';
      counts[cat] = (counts[cat] || 0) + 1;
      if (!firstImages[cat] && p.images && p.images.length > 0) {
        firstImages[cat] = p.images[0];
      }
    });

    const order = ['Sofa', 'Ghế', 'Bàn', 'Tủ & Kệ', 'Đèn', 'Thảm', 'Giường', 'Phụ kiện'];
    
    this.categories = Object.keys(counts).map(cat => ({
      label: cat,
      value: cat,
      emoji: '',
      desc: `${counts[cat]} mẫu`,
      img: firstImages[cat] || 'https://ckkvyltbeinzqogjsfli.supabase.co/storage/v1/object/public/dcor/sofas/41252001_2733503_PNG-Web2072dpi.png'
    })).sort((a, b) => {
      const idxA = order.indexOf(a.value);
      const idxB = order.indexOf(b.value);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return b.desc.localeCompare(a.desc);
    });
  }

  getProductPriceFormatted(prod: CatalogProduct): string {
    return prod.prices?.[0]?.formattedPrice ?? 'Liên hệ';
  }

  getLowestPriceFormatted(prod: CatalogProduct): string | null {
    return prod.lowestPrices?.[0]?.formattedPrice ?? null;
  }

  isOnSale(prod: CatalogProduct): boolean {
    const base = prod.prices?.[0]?.price ?? 0;
    const low = prod.lowestPrices?.[0]?.price ?? 0;
    return low > 0 && low < base;
  }

  getProductsForRoom(productIds: string[]): CatalogProduct[] {
    return productIds.map(id => this.products.find(p => p.productId === id)).filter(Boolean) as CatalogProduct[];
  }

  scrollCollections(track: HTMLElement, dir: 'left' | 'right') {
    track.scrollBy({ left: dir === 'left' ? -340 : 340, behavior: 'smooth' });
  }

  getStarsArray(rating: number): number[] {
    return Array(rating).fill(0);
  }
}

