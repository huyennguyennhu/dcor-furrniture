import { IconComponent } from '../../../../shared/components/icon/icon';
import { Component, OnInit, AfterViewInit, OnDestroy, ChangeDetectorRef, NgZone, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { CatalogProduct } from '../../../../shared/models/catalog.model';
import { ProductCardComponent } from '../../../../shared/components/product-card/product-card';
import { ProductService } from '../../../../core/services/product.service';
import { ShowroomConsultationModalComponent } from '../../../../shared/components/showroom-consultation-modal/showroom-consultation-modal';
import { WishlistService } from '../../../../core/services/wishlist.service';
import { PromotionService } from '../../../../core/services/promotion.service';
import { BlogService } from '../blog/services/blog.service';
import { BlogPostSummary } from '../blog/models/blog.model';
import { environment } from '../../../../../environments/environment';

// Data from lib/collections
export interface HomeCategoryItem {
  id: string;
  title: string;
  titleVi: string;
  subtitle: string;
  subtitleVi?: string;
  image: string;
  query: string;
}

const HOME_CATEGORIES: HomeCategoryItem[] = [
  {
    id: 'chairs',
    title: 'Chairs',
    titleVi: 'Ghế',
    subtitle: 'Ghế ngồi thanh lịch và êm ái.',
    subtitleVi: 'Ghế ngồi thanh lịch và êm ái.',
    image: 'https://res.cloudinary.com/yqbkibfq/image/fetch/w_800,c_limit,f_auto,q_auto:good/https://assets.boconcept.com/d028c878-9227-4aac-9ba6-ad43013ccaef/1354515_PNG-Web%2072dpi.png',
    query: 'chairs'
  },
  {
    id: 'tables',
    title: 'Tables',
    titleVi: 'Bàn',
    subtitle: 'Bàn tối giản, chất liệu vượt thời gian.',
    subtitleVi: 'Bàn tối giản, chất liệu vượt thời gian.',
    image: 'https://res.cloudinary.com/yqbkibfq/image/fetch/w_800,c_limit,f_auto,q_auto:good/https://assets.boconcept.com/87507d0b-ad67-47a7-8089-ad4300b2ee2e/1106983_PNG-Web%2072dpi.png',
    query: 'tables'
  },
  {
    id: 'beds',
    title: 'Beds',
    titleVi: 'Giường',
    subtitle: 'Không gian thư thái, trọn vẹn giấc ngủ.',
    subtitleVi: 'Không gian thư thái, trọn vẹn giấc ngủ.',
    image: 'https://res.cloudinary.com/yqbkibfq/image/fetch/w_800,c_limit,f_auto,q_auto:good/https://assets.boconcept.com/e4417f8b-6dfc-4b7e-baea-b2fb0104f233/2864658_PNG-Web%2072dpi.png',
    query: 'beds'
  },
  {
    id: 'storage',
    title: 'Storage',
    titleVi: 'Tủ Kệ',
    subtitle: 'Giải pháp lưu trữ thông minh, tối giản.',
    subtitleVi: 'Giải pháp lưu trữ thông minh, tối giản.',
    image: 'https://res.cloudinary.com/yqbkibfq/image/fetch/w_800,c_limit,f_auto,q_auto:good/https://assets.boconcept.com/a4af61b0-c597-4662-96f8-b2e6009c3566/2815962_PNG-Web%2072dpi.png',
    query: 'storage'
  },
  {
    id: 'sofas',
    title: 'Sofas',
    titleVi: 'Sofa',
    subtitle: 'Sofa module cao cấp, thư giãn tối đa.',
    subtitleVi: 'Sofa module cao cấp, thư giãn tối đa.',
    image: 'https://res.cloudinary.com/yqbkibfq/image/fetch/w_800,c_limit,f_auto,q_auto:good/https://assets.boconcept.com/1dae6253-c39d-47c7-830f-b2e800071a4a/2868108_PNG-Web%2072dpi.png',
    query: 'sofas'
  },
  {
    id: 'lamps',
    title: 'Lamps',
    titleVi: 'Đèn',
    subtitle: 'Ánh sáng tinh tế cho từng không gian.',
    subtitleVi: 'Ánh sáng tinh tế cho từng không gian.',
    image: 'https://res.cloudinary.com/yqbkibfq/image/fetch/w_800,c_limit,f_auto,q_auto:good/https://assets.boconcept.com/edbaee1f-6f6a-4897-8d2d-ad4300b2f353/1106997_PNG-Web%2072dpi.png',
    query: 'lamps'
  },
  {
    id: 'rugs',
    title: 'Rugs',
    titleVi: 'Thảm',
    subtitle: 'Thảm dệt thủ công ấm áp và sang trọng.',
    subtitleVi: 'Thảm dệt thủ công ấm áp và sang trọng.',
    image: 'https://assets.boconcept.com/4ef91e1e-f3a3-41ff-96bf-b20c00d4597d/2768244_PNG-Web%2072dpi.png',
    query: 'rugs'
  },
  {
    id: 'accessories',
    title: 'Accessories',
    titleVi: 'Phụ kiện',
    subtitle: 'Điểm nhấn nghệ thuật cho mọi căn phòng.',
    subtitleVi: 'Điểm nhấn nghệ thuật cho mọi căn phòng.',
    image: 'https://res.cloudinary.com/yqbkibfq/image/fetch/w_800,c_limit,f_auto,q_auto:good/https://assets.boconcept.com/38db6aa3-5207-4cbb-9b84-b2b400afd754/2802682_PNG-Web%2072dpi.png',
    query: 'accessories'
  },
  {
    id: 'outdoors',
    title: 'Outdoors',
    titleVi: 'Ngoài trời',
    subtitle: 'Nội thất ngoài trời bền bỉ, tiện nghi.',
    subtitleVi: 'Nội thất ngoài trời bền bỉ, tiện nghi.',
    image: 'https://res.cloudinary.com/yqbkibfq/image/fetch/w_800,c_limit,f_auto,q_auto:good/https://assets.boconcept.com/0c0585f3-002e-480f-9ba1-b0c200d96a2a/2113766_PNG-Web%2072dpi.png',
    query: 'outdoors'
  }
];

export interface StyleSubcategoryItem {
  id: string;
  name: string;
  nameVi: string;
  slug: string;
  image: string;
  gridSpan: 'wide' | 'normal';
}

const SUB_CATEGORY_STYLES: StyleSubcategoryItem[] = [
  {
    id: 'scandinavian',
    name: 'Scandinavian',
    nameVi: 'Bắc Âu',
    slug: 'bac-au-scandinavian',
    image: '/assets/img/scandinavian.jpg',
    gridSpan: 'wide'
  },
  {
    id: 'modern_luxury',
    name: 'Modern Luxury',
    nameVi: 'Hiện đại',
    slug: 'hien-dai-modern-luxury',
    image: '/assets/img/modern_luxury.jpg',
    gridSpan: 'normal'
  },
  {
    id: 'minimalism',
    name: 'Minimalism',
    nameVi: 'Tối giản',
    slug: 'toi-gian-minimalism',
    image: '/assets/img/minimalism.jpg',
    gridSpan: 'normal'
  },
  {
    id: 'japandi',
    name: 'Japandi',
    nameVi: 'Japandi',
    slug: 'japandi',
    image: '/assets/img/japandi.jpg',
    gridSpan: 'normal'
  },
  {
    id: 'wabi_sabi',
    name: 'Wabi-Sabi',
    nameVi: 'Wabi-Sabi',
    slug: 'wabi-sabi',
    image: '/assets/img/wabi_sabi.jpg',
    gridSpan: 'normal'
  },
  {
    id: 'industrial',
    name: 'Industrial',
    nameVi: 'Công nghiệp',
    slug: 'industrial',
    image: '/assets/img/industrial.jpg',
    gridSpan: 'wide'
  }
];

export interface RoomHotspotItem {
  id: string;
  code: string;
  productId: string;
  x: number;
  y: number;
  nameFallback: string;
  priceFallback: string;
  imageFallback: string;
}

export interface ShoppableRoom {
  id: 'living' | 'office';
  name: string;
  title: string;
  desc: string;
  image: string;
  hotspots: RoomHotspotItem[];
}

const SHOPPABLE_ROOMS: ShoppableRoom[] = [
  {
    id: 'living',
    name: 'Phòng khách',
    title: 'Không gian phòng khách hiện đại',
    desc: 'Bản hòa ca giữa vẻ đẹp mộc mạc và sự thanh lịch với các điểm nhấn nội thất tinh tế',
    image: '/assets/img/phong_khach.jpg',
    hotspots: [
      {
        id: 'spot-como',
        code: '340040500708-b4c3',
        productId: 'b4c33d20-2c9a-419c-9e34-3d64f2e28f00',
        x: 62,
        y: 26,
        nameFallback: 'Como bookcase',
        priceFallback: '10.490.000 ₫',
        imageFallback: 'https://res.cloudinary.com/yqbkibfq/image/upload/v1793525353/dcor/products/ei9ph1gwfnkrsxlopji5.webp'
      },
      {
        id: 'spot-dawn',
        code: '105000001510',
        productId: '61ebc763-b326-46e0-bdce-65e310d29ce5',
        x: 37,
        y: 48,
        nameFallback: 'Dawn table lamp',
        priceFallback: '15.790.000 ₫',
        imageFallback: 'https://res.cloudinary.com/yqbkibfq/image/upload/v1793525471/dcor/products/wwoidff9ijbcwqqgqvkd.webp'
      },
      {
        id: 'spot-nawabari',
        code: '447532013063702',
        productId: '0bf53b23-d7d6-4df5-9ec7-b0c0a9021e18',
        x: 65,
        y: 67,
        nameFallback: 'Nawabari 3 seater sofa, wooden leg',
        priceFallback: '68.490.000 ₫',
        imageFallback: 'https://res.cloudinary.com/yqbkibfq/image/upload/v1793525428/dcor/products/bjsudbhkuizbdnaeu7kr.webp'
      },
      {
        id: 'spot-bermuda',
        code: '498590402110',
        productId: 'db871e44-087f-492a-937c-ec128f841d13',
        x: 22,
        y: 76,
        nameFallback: 'Bermuda footstool',
        priceFallback: '11.290.000 ₫',
        imageFallback: 'https://res.cloudinary.com/yqbkibfq/image/upload/v1793525297/dcor/products/pnlhpdvow5hjjf8qogic.webp'
      },
      {
        id: 'spot-madrid',
        code: '3700AD180037180',
        productId: 'd1faee79-dfef-48b6-8efa-8d9d85224a16',
        x: 49,
        y: 80,
        nameFallback: 'Madrid coffee table',
        priceFallback: '21.290.000 ₫',
        imageFallback: 'https://res.cloudinary.com/yqbkibfq/image/upload/v1793525436/dcor/products/xodpteb6f54aehscr7ow.webp'
      }
    ]
  },
  {
    id: 'office',
    name: 'Phòng làm việc',
    title: 'Góc làm việc khơi nguồn cảm hứng',
    desc: 'Không gian sáng tạo tối giản, đường nét thanh lịch giúp nâng cao hiệu suất làm việc',
    image: '/assets/img/phong_lam_viec.jpg',
    hotspots: [
      {
        id: 'spot-008128',
        code: '344000100008128',
        productId: 'a6167ea5-8422-4caa-84cc-032b6b24ac97',
        x: 59,
        y: 20,
        nameFallback: 'Calgary storage with drawer',
        priceFallback: '44.990.000 ₫',
        imageFallback: 'https://res.cloudinary.com/yqbkibfq/image/upload/v1793525467/dcor/products/ylifh03ghatydyp6ptel.webp'
      },
      {
        id: 'spot-702075',
        code: '3790AC000702075',
        productId: 'f1dc51ad-0de0-4e70-9e55-2214390839a8',
        x: 86,
        y: 60,
        nameFallback: 'Element dresser with 4 drawers',
        priceFallback: '47.490.000 ₫',
        imageFallback: 'https://res.cloudinary.com/yqbkibfq/image/upload/v1793525360/dcor/products/iyfwxdaq3ugrp8z1ssjh.webp'
      },
      {
        id: 'spot-GHf252',
        code: '3700022T035CCGH-f252',
        productId: 'f2520fc7-745d-41d0-9cfc-c60c10faf795',
        x: 31,
        y: 55,
        nameFallback: 'Cupertino desk',
        priceFallback: '51.390.000 ₫',
        imageFallback: 'https://res.cloudinary.com/yqbkibfq/image/upload/v1793525442/dcor/products/apn9qzunnbpxtzvdwnxo.webp'
      },
      {
        id: 'spot-992252',
        code: '4025075D1992252',
        productId: 'd687d599-cd97-4367-be05-790077014c9f',
        x: 48,
        y: 60,
        nameFallback: 'Hamilton office chair',
        priceFallback: '15.690.000 ₫',
        imageFallback: 'https://res.cloudinary.com/yqbkibfq/image/upload/v1793525339/dcor/products/cplllbxn6tfxwxar7trr.webp'
      },
      {
        id: 'spot-012330',
        code: '106071012330',
        productId: '3835771b-ed6e-417f-befd-d28355f9dabd',
        x: 60,
        y: 90,
        nameFallback: 'Tide rug',
        priceFallback: '32.490.000 ₫',
        imageFallback: 'https://res.cloudinary.com/yqbkibfq/image/upload/v1793525499/dcor/products/gzvdantitwi3ckggh7b1.webp'
      }
    ]
  }
];

const STYLE_COLLECTIONS = [
  { id: 'scandinavian', name: 'Scandinavian', name_vi: 'Bắc Âu Hiện Đại', description_vi: 'Đơn giản, tinh tế, ưu tiên ánh sáng tự nhiên và công năng.', coverImage: '/assets/img/scandinavian.jpg', accentColor: '#D1D5DB' },
  { id: 'japandi', name: 'Japandi', name_vi: 'Japandi Tối Giản', description_vi: 'Sự pha trộn giữa sự mộc mạc của Nhật Bản và nét thanh lịch của Bắc Âu.', coverImage: '/assets/img/japandi.jpg', accentColor: '#E5E7EB' },
  { id: 'midcentury', name: 'Mid-Century', name_vi: 'Retro Cổ Điển', description_vi: 'Đường nét mạnh mẽ, vật liệu tự nhiên mang hơi thở của những năm 50s.', coverImage: '/assets/img/modern_luxury.jpg', accentColor: '#F3F4F6' }
];

const ROOM_INSPIRATIONS = [
  { id: 'living-1', name_vi: 'Phòng khách Metropolitan', tag: 'Phòng khách', area: '25m²', description_vi: 'Góc nhìn đô thị hiện đại với tông màu trung tính và nhấn nhá bằng kim loại.', coverImage: '/assets/room_img/phong_khach.png', productIds: ['prod-1', 'prod-2'] },
  { id: 'dining-1', name_vi: 'Phòng ăn Ấm cúng', tag: 'Phòng ăn', area: '15m²', description_vi: 'Nơi sum vầy hoàn hảo với bàn ăn gỗ tự nhiên mở rộng được.', coverImage: '/assets/room_img/phong_an.png', productIds: ['prod-3'] }
];

const HERO_HOTSPOTS = [
  { id: 'spot-1', x: 18, y: 72, name_vi: 'Ghế Bành Da Cao Cấp', price: 'Từ 18.500.000đ', image: '/assets/img/furniture-placeholder.svg', productId: 'sofa-indivi' },
  { id: 'spot-2', x: 84, y: 68, name_vi: 'Sofa Góc L Đương Đại', price: 'Từ 48.900.000đ', image: '/assets/img/furniture-placeholder.svg', productId: 'sofa-indivi' }
];

const TRUST_ITEMS = [
  { icon: 'leaf', title: 'Gỗ tự nhiên bền vững', desc: 'Nguyên liệu từ rừng quản lý bền vững, đạt chứng chỉ FSC.' },
  { icon: 'shield', title: 'Bảo hành 5 năm', desc: 'Cam kết chất lượng dài hạn với dịch vụ bảo hành toàn quốc.' },
  { icon: 'truck', title: 'Giao hàng toàn quốc', desc: 'Vận chuyển nhanh chóng, an toàn đến mọi tỉnh thành.' },
  { icon: 'wrench', title: 'Miễn phí lắp đặt', desc: 'Đội ngũ kỹ thuật chuyên nghiệp lắp đặt tận nơi.' },
];

export interface CustomerReviewItem {
  name: string;
  role: string;
  city?: string;
  rating: number;
  text: string;
  avatar: string;
}

const STATIC_REVIEWS: CustomerReviewItem[] = [
  {
    name: 'Olivia Bennett',
    role: 'Homeowner',
    rating: 5,
    text: 'Premium craftsmanship, timeless designs, and outstanding customer service made this one of the best furniture purchases we\'ve ever made for our home interiors.',
    avatar: '/assets/favicon/logo.png'
  },
  {
    name: 'Nguyễn Minh Tuấn',
    role: 'Kiến trúc sư nội thất',
    rating: 5,
    text: 'Đường nét thiết kế của DCor mang đậm tinh thần Bắc Âu tối giản và sang trọng. Chất liệu gỗ sồi tự nhiên cùng đệm bọc da cao cấp đem lại sự êm ái hoàn hảo cho cả gia đình.',
    avatar: '/assets/favicon/logo.png'
  },
  {
    name: 'Sophia Henderson',
    role: 'Interior Stylist',
    rating: 5,
    text: 'The aesthetic balance and ergonomic comfort are world-class. It seamlessly transformed our open-plan penthouse into an inspiring, peaceful and stylish living space.',
    avatar: '/assets/favicon/logo.png'
  },
  {
    name: 'Trần Thị Lan Anh',
    role: 'Chủ nhân Villa, Đà Nẵng',
    rating: 5,
    text: 'Dịch vụ tư vấn không gian và giao lắp đặt cực kỳ chuyên nghiệp. Từng chi tiết nhỏ như chân bàn, kệ sách và đệm ghế sofa đều chuẩn xác, tinh xảo vượt xa mong đợi.',
    avatar: '/assets/favicon/logo.png'
  },
  {
    name: 'Alexander Wright',
    role: 'Creative Consultant',
    rating: 5,
    text: 'Exceptional attention to detail and sustainable materials. Every single piece feels intentionally crafted, durable, and effortlessly elegant for contemporary living.',
    avatar: '/assets/favicon/logo.png'
  }
];

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [IconComponent, CommonModule, RouterModule, ProductCardComponent, ShowroomConsultationModalComponent],
  templateUrl: './home.html',
  styleUrls: ['./home.css']
})
export class HomeComponent implements OnInit, AfterViewInit, OnDestroy {

  constructor(
    private cdr: ChangeDetectorRef,
    private productService: ProductService,
    private wishlistService: WishlistService,
    private ngZone: NgZone,
    private promotionService: PromotionService,
    private blogService: BlogService
  ) { }

  // Blog section state (Góc Cảm Hứng)
  featuredBlog: BlogPostSummary | null = null;
  sideBlogs: BlogPostSummary[] = [];
  isLoadingBlogs = false;
  private blogSub?: Subscription;

  private readonly FALLBACK_BLOGS: BlogPostSummary[] = [
    {
      id: 'fallback-1',
      slug: 'kien-tao-khong-gian-song-duong-dai',
      title: 'Kiến Tạo Không Gian Sống Đương Đại: Góc Nhìn & Triết Lý Từ Giám Đốc Thiết Kế DCor',
      excerpt: 'Khám phá cách thức phối hợp chất liệu gỗ sồi tự nhiên, da bò Ý Mastrotto cùng ánh sáng gián tiếp để định hình vẻ đẹp sang trọng, ấm cúng trong từng góc nhà.',
      coverImageUrl: '/assets/img/modern_luxury.jpg',
      category: {
        name: 'Xu hướng',
        slug: 'xu-huong'
      },
      tags: ['thiết kế đương đại', 'xu hướng 2024'],
      authorName: 'Trần Minh Quân',
      publishedAt: '2026-11-10T08:00:00.000Z',
      likesCount: 42,
      commentCount: 5,
      readingMinutes: 4
    },
    {
      id: 'fallback-2',
      slug: 'nghe-thuat-bo-tri-ban-an-chung-cu',
      title: 'Nghệ Thuật Bố Trí Bàn Ăn Cho Căn Hộ Chung Cư: Tối Ưu Không Gian & Kết Nối Gia Đình',
      excerpt: 'Bí quyết chọn kích thước bàn ăn mở rộng thông minh và bố trí ánh sáng ấm cúng cho không gian căn hộ.',
      coverImageUrl: '/assets/room_img/phong_an.png',
      category: {
        name: 'Mẹo không gian',
        slug: 'meo-khong-gian'
      },
      tags: ['mẹo bố trí', 'phòng ăn'],
      authorName: 'Nguyễn Bích Ngọc',
      publishedAt: '2026-11-08T09:30:00.000Z',
      likesCount: 38,
      commentCount: 3,
      readingMinutes: 5
    },
    {
      id: 'fallback-3',
      slug: 'bi-quyet-ve-sinh-sofa-da-that',
      title: 'Bí Quyết Vệ Sinh & Bảo Dưỡng Sofa Da Thật Luôn Mềm Mại Như Mới Mua',
      excerpt: 'Hướng dẫn chi tiết quy trình vệ sinh sofa da định kỳ, xử lý vết bẩn cứng đầu mà không làm hỏng bề mặt da.',
      coverImageUrl: '/assets/img/blog_care_guide.jpg',
      category: {
        name: 'Chăm sóc nội thất',
        slug: 'cham-soc-noi-that'
      },
      tags: ['bảo dưỡng sofa', 'chăm sóc nội thất'],
      authorName: 'Đặng Quốc Huy',
      publishedAt: '2026-11-06T14:15:00.000Z',
      likesCount: 29,
      commentCount: 4,
      readingMinutes: 4
    }
  ];

  isInWishlist(productId?: string): boolean {
    return !!productId && this.wishlistService.isWishlisted(productId);
  }

  toggleWishlist(event: Event, prod: CatalogProduct): void {
    event.preventDefault();
    event.stopPropagation();
    const pid = prod.productId || (prod as any).id;
    if (!pid) return;

    this.wishlistService.toggle(pid);
    this.cdr.detectChanges();
  }

  products: CatalogProduct[] = [];
  categories: any[] = [];
  isLoading = true;

  // Showroom consultation modal state
  isConsultationModalOpen = false;

  openConsultationModal() {
    this.isConsultationModalOpen = true;
  }

  closeConsultationModal() {
    this.isConsultationModalOpen = false;
  }

  activeHotspot: string | null = null;
  featuredTab: 'newest' | 'sale' = 'newest';

  saleProducts: CatalogProduct[] = [];
  newestProducts: CatalogProduct[] = [];
  private campaignSub?: Subscription;

  SUB_CATEGORY_STYLES = SUB_CATEGORY_STYLES;
  STYLE_COLLECTIONS = STYLE_COLLECTIONS;
  ROOM_INSPIRATIONS = ROOM_INSPIRATIONS;
  HERO_HOTSPOTS = HERO_HOTSPOTS;
  TRUST_ITEMS = TRUST_ITEMS;
  STATIC_REVIEWS = STATIC_REVIEWS;
  HOME_CATEGORIES = HOME_CATEGORIES;

  // Category Carousel State: 9 items, 4 visible at once => 6 positions (indices 0 to 5)
  activeCategoryIndex = 0;
  categoryDots = [0, 1, 2, 3, 4, 5];
  private categoryAutoPlayTimer?: any;
  readonly CATEGORY_AUTOPLAY_INTERVAL = 4000;

  activeRoom: string | null = null;
  reviewIdx = 0;
  private reviewAutoPlayTimer?: any;
  readonly REVIEW_AUTOPLAY_INTERVAL = 5500;

  get displayedFeatured() {
    return this.featuredTab === 'sale' ? this.saleProducts : this.newestProducts;
  }

  scrollToExplore() {
    const el = document.getElementById('categories');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  startCategoryAutoPlay(): void {
    this.stopCategoryAutoPlay();
    if (typeof window === 'undefined') return;
    this.categoryAutoPlayTimer = setInterval(() => {
      this.nextCategory();
      this.cdr.detectChanges();
    }, this.CATEGORY_AUTOPLAY_INTERVAL);
  }

  stopCategoryAutoPlay(): void {
    if (this.categoryAutoPlayTimer) {
      clearInterval(this.categoryAutoPlayTimer);
      this.categoryAutoPlayTimer = undefined;
    }
  }

  nextCategory(): void {
    this.activeCategoryIndex = (this.activeCategoryIndex + 1) % this.categoryDots.length;
  }

  prevCategory(): void {
    this.activeCategoryIndex = (this.activeCategoryIndex - 1 + this.categoryDots.length) % this.categoryDots.length;
  }

  setCategoryIndex(index: number): void {
    this.activeCategoryIndex = index;
    this.startCategoryAutoPlay();
  }

  startReviewAutoPlay(): void {
    this.stopReviewAutoPlay();
    if (typeof window === 'undefined') return;
    this.reviewAutoPlayTimer = setInterval(() => {
      this.nextReview();
      this.cdr.detectChanges();
    }, this.REVIEW_AUTOPLAY_INTERVAL);
  }

  stopReviewAutoPlay(): void {
    if (this.reviewAutoPlayTimer) {
      clearInterval(this.reviewAutoPlayTimer);
      this.reviewAutoPlayTimer = undefined;
    }
  }

  pauseReviewAutoPlay(): void {
    this.stopReviewAutoPlay();
  }

  resumeReviewAutoPlay(): void {
    this.startReviewAutoPlay();
  }

  nextReview(): void {
    this.reviewIdx = (this.reviewIdx + 1) % this.STATIC_REVIEWS.length;
  }

  prevReview(): void {
    this.reviewIdx = (this.reviewIdx - 1 + this.STATIC_REVIEWS.length) % this.STATIC_REVIEWS.length;
  }

  setReviewIndex(index: number): void {
    this.reviewIdx = index;
    this.startReviewAutoPlay();
  }

  ngOnInit() {
    this.fetchProducts();
    this.fetchBlogs();
    this.startCategoryAutoPlay();
    this.startReviewAutoPlay();

    this.campaignSub = this.promotionService.activeCampaigns$.subscribe(() => {
      if (this.products.length > 0) {
        this.fetchProducts();
      }
    });
  }

  ngAfterViewInit(): void {
  }

  ngOnDestroy(): void {
    this.stopCategoryAutoPlay();
    this.stopReviewAutoPlay();
    this.campaignSub?.unsubscribe();
    this.blogSub?.unsubscribe();
  }

  fetchBlogs(): void {
    this.isLoadingBlogs = true;
    this.initFallbackBlogs();

    this.blogSub = this.blogService.getPosts({ pageSize: 3 }).subscribe({
      next: (res) => {
        if (res && res.items && res.items.length > 0) {
          this.featuredBlog = res.items[0];
          this.sideBlogs = res.items.slice(1, 3);
          if (this.sideBlogs.length < 2) {
            const fallbackRemain = this.FALLBACK_BLOGS.slice(res.items.length);
            this.sideBlogs = [...this.sideBlogs, ...fallbackRemain].slice(0, 2);
          }
        }
        this.isLoadingBlogs = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.warn('Không thể tải bài viết blog từ backend, sử dụng dữ liệu dự phòng:', err);
        this.initFallbackBlogs();
        this.isLoadingBlogs = false;
        this.cdr.detectChanges();
      }
    });
  }

  private initFallbackBlogs(): void {
    this.featuredBlog = this.FALLBACK_BLOGS[0];
    this.sideBlogs = this.FALLBACK_BLOGS.slice(1, 3);
  }

  formatBlogDate(dateStr?: string | Date | null): string {
    if (!dateStr) return 'Mới đăng';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return 'Mới đăng';
      const day = d.getDate();
      const month = d.getMonth() + 1;
      const year = d.getFullYear();
      return `${day} Tháng ${month}, ${year}`;
    } catch {
      return 'Mới đăng';
    }
  }

  onBlogImgError(event: Event, fallbackUrl: string = '/assets/img/modern_luxury.jpg'): void {
    const target = event.target as HTMLImageElement;
    if (target && target.src !== fallbackUrl) {
      target.src = fallbackUrl;
    }
  }

  async fetchProducts() {
    this.isLoading = true;
    try {
      const data = await this.productService.getProducts();
      let rawProducts = Array.isArray(data) ? data : [];

      function getParentCategory(childCat: string): string {
        if (!childCat) return 'Sofa';
        const c = childCat.toLowerCase();
        if (c.includes('sofa') || c.includes('chaise')) return 'Sofa';
        if (c.includes('chair') || c.includes('bench') || c.includes('stool') || c.includes('recliner') || c.includes('poufs') || c.includes('cushion') || c.includes('seat')) return 'Ghế';
        if (c.includes('table') || c.includes('desk') || (c.includes('stand') && !c.includes('night'))) return 'Bàn';
        if (c.includes('storage') || c.includes('shelf') || c.includes('shelves') || c.includes('bookcase') || c.includes('board') || c.includes('unit') || c.includes('chest') || c.includes('drawer') || c.includes('system') || c.includes('night') || c.includes('hallway')) return 'Tủ Kệ';
        if (c.includes('bed') || c.includes('daybed')) return 'Giường';
        if (c.includes('lamp') || c.includes('pendant') || c.includes('lighting')) return 'Đèn';
        if (c.includes('rug') || c.includes('carpet')) return 'Thảm';
        return 'Phụ Kiện';
      }

      this.products = rawProducts.map((p: any) => {
        const base = Number(p.basePrice) || (p.prices?.[0]?.price || p.price || 0);
        const campDisc = this.promotionService.getDiscountForProduct(p);
        const hasDiscount = campDisc || (p.discountValue && p.discountValue > 0);
        const salePrice = campDisc ? campDisc.salePrice : (p.salePrice || (p.discountType === 'PERCENT' ? Math.round(base * (100 - p.discountValue) / 100) : Math.max(0, base - p.discountValue)));
        const originalPrice = campDisc ? campDisc.originalPrice : (p.originalPrice || base);
        const discountVal = campDisc ? campDisc.discountValue : p.discountValue;

        return {
          ...p,
          productId: p.id || p.productId,
          slug: p.slug || '',
          variantUrl: p.slug || p.id || '',
          shortDescription: p.name || p.shortDescription || '',
          shortDescription_vi: p.name || p.shortDescription_vi || '',
          category: getParentCategory(p.category?.name || (typeof p.category === 'string' ? p.category : '')),
          description: p.description || p.description_vi,
          refinementMaterials: p.description ? [p.description] : (p.refinementMaterials || []),
          refinementMaterials_vi: p.description ? [p.description] : (p.refinementMaterials_vi || []),
          refinementColors: p.refinementColors || [],
          images: p.images || [],
          prices: [{ price: base, formattedPrice: new Intl.NumberFormat('vi-VN').format(base) + ' ₫', currency: 'VND' }],
          lowestPrices: hasDiscount ? [{ price: salePrice, formattedPrice: new Intl.NumberFormat('vi-VN').format(salePrice) + ' ₫', currency: 'VND' }] : [],
          discountValue: discountVal,
          discountType: campDisc ? campDisc.discountType : p.discountType,
          originalPrice: originalPrice,
          isBestSeller: p.isBestSeller || false,
          isNew: p.isNew || false,
          createdAt: p.createdAt
        };
      });

      this.saleProducts = this.products.filter(p => this.isOnSale(p)).slice(0, 8);
      this.newestProducts = this.products.slice(0, 8);
      this.generateCategories(this.products);
    } catch (e) {
      console.error(e);
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
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

    const order = ['Sofa', 'Bàn', 'Ghế', 'Tủ Kệ', 'Giường', 'Đèn', 'Thảm', 'Phụ Kiện'];

    this.categories = Object.keys(counts).map(cat => ({
      label: cat,
      value: cat,
      emoji: '',
      desc: `${counts[cat]} mẫu`,
      img: firstImages[cat] || '/assets/img/furniture-placeholder.svg'
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
    if (this.promotionService.getDiscountForProduct(prod)) return true;
    const base = (prod as any).basePrice ?? prod.prices?.[0]?.price ?? 0;
    const low = prod.lowestPrices?.[0]?.price ?? ((prod as any).discountValue ? base - (prod as any).discountValue : 0);
    return (low > 0 && low < base) || Boolean((prod as any).discountValue && (prod as any).discountValue > 0);
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

  SHOPPABLE_ROOMS = SHOPPABLE_ROOMS;
  selectedRoomTab: 'living' | 'office' = 'living';
  activeHotspotId: string | null = null;

  get currentRoom(): ShoppableRoom {
    return this.SHOPPABLE_ROOMS.find(r => r.id === this.selectedRoomTab) || this.SHOPPABLE_ROOMS[0];
  }

  selectRoomTab(tab: 'living' | 'office') {
    this.selectedRoomTab = tab;
    this.activeHotspotId = null;
  }

  setActiveHotspot(id: string) {
    this.activeHotspotId = id;
  }

  clearActiveHotspot() {
    this.activeHotspotId = null;
  }

  toggleActiveHotspot(id: string) {
    this.activeHotspotId = this.activeHotspotId === id ? null : id;
  }

  getHotspotProduct(spot: RoomHotspotItem): any {
    const prod = this.products.find(p => p.productId === spot.productId || (p as any).id === spot.productId);
    if (prod) {
      return {
        id: prod.productId || (prod as any).id,
        name: prod.shortDescription_vi || prod.shortDescription || (prod as any).name || spot.nameFallback,
        price: this.isOnSale(prod) ? this.getLowestPriceFormatted(prod) : this.getProductPriceFormatted(prod),
        originalPrice: this.isOnSale(prod) ? this.getProductPriceFormatted(prod) : null,
        image: prod.images?.[0] || spot.imageFallback,
        category: prod.category || 'Nội thất',
        isOnSale: this.isOnSale(prod)
      };
    }
    return {
      id: spot.productId,
      name: spot.nameFallback,
      price: spot.priceFallback,
      originalPrice: null,
      image: spot.imageFallback,
      category: 'Nội thất',
      isOnSale: false
    };
  }
}
