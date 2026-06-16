// lib/collections.ts — Static config dùng URL ảnh chính xác từ Supabase DB

export interface StyleCollection {
  id: string;
  name: string;
  name_vi: string;
  description_vi: string;
  coverImage: string;
  accentColor: string;
  productIds: string[];
}

export interface RoomInspiration {
  id: string;
  name_vi: string;
  area: string;
  description_vi: string;
  coverImage: string;
  tag: string;
  productIds: string[];
}

export const STYLE_COLLECTIONS: StyleCollection[] = [
  {
    id: 'scandinavian',
    name: 'Scandinavian',
    name_vi: 'Bắc Âu',
    description_vi: 'Tinh giản, sáng sủa, ấm áp. Gỗ sáng và vải lanh tự nhiên.',
    coverImage: 'https://ckkvyltbeinzqogjsfli.supabase.co/storage/v1/object/public/dcor/sofas/SM42250019_2703219_PNG-Web2072dpi.png',
    accentColor: '#D4C3A3',
    productIds: ['SM42250019', 'SM42250018', '34005430', '4025D179', 'SM42250001'],
  },
  {
    id: 'modern-luxury',
    name: 'Modern Luxury',
    name_vi: 'Sang trọng hiện đại',
    description_vi: 'Đường nét sắc sảo, vật liệu cao cấp, không gian đẳng cấp.',
    coverImage: 'https://ckkvyltbeinzqogjsfli.supabase.co/storage/v1/object/public/dcor/sofas/SM43550005_2695695_PNG-Web2072dpi.png',
    accentColor: '#B8860B',
    productIds: ['SM43550005', 'SM44850009', 'SMAugusta01', '48052501', '106071012300'],
  },
  {
    id: 'minimalist',
    name: 'Minimalist',
    name_vi: 'Tối giản',
    description_vi: 'Không gian thở. Chỉ giữ lại những gì cần thiết và đẹp.',
    coverImage: 'https://ckkvyltbeinzqogjsfli.supabase.co/storage/v1/object/public/dcor/sofas/SM43350216_2777021_PNG-Web2072dpi.png',
    accentColor: '#8C8C8C',
    productIds: ['SM43350216', '3800UF00', 'SM0Lugano04', '34005430', '4025D179'],
  },
  {
    id: 'japandi',
    name: 'Japandi',
    name_vi: 'Nhật Bản & Bắc Âu',
    description_vi: 'Sự kết hợp giữa tinh thần Nhật Bản và vẻ đẹp chức năng Bắc Âu.',
    coverImage: 'https://ckkvyltbeinzqogjsfli.supabase.co/storage/v1/object/public/dcor/sofas/SM41750022_51835_PNG-Web2072dpi.png',
    accentColor: '#6E4D3B',
    productIds: ['SM41750022', '48053001', '43553001', 'SM43350217', '3800UF00'],
  },
  {
    id: 'industrial',
    name: 'Industrial',
    name_vi: 'Công nghiệp',
    description_vi: 'Thép, da thật và gỗ tối màu. Cá tính và mạnh mẽ.',
    coverImage: 'https://ckkvyltbeinzqogjsfli.supabase.co/storage/v1/object/public/dcor/sofas/SM44850009_2079440_PNG-Web2072dpi.png',
    accentColor: '#4A4A4A',
    productIds: ['SM44850009', 'SM43550005', '48052501', 'SM0Lugano04', '4020B010'],
  },
];

export const ROOM_INSPIRATIONS: RoomInspiration[] = [
  {
    id: 'apartment-50',
    name_vi: 'Căn hộ 50m²',
    area: '50 m²',
    description_vi: 'Sofa góc đa năng, bàn cà phê nhỏ gọn và đèn phòng khách tạo nên không gian sống tối ưu.',
    coverImage: 'https://ckkvyltbeinzqogjsfli.supabase.co/storage/v1/object/public/dcor/sofas/SM42250001_2717819_PNG-Web2072dpi.png',
    tag: 'Phổ biến nhất',
    productIds: ['SM42250001', 'SM42250018', '34005430', '106071012300'],
  },
  {
    id: 'apartment-70',
    name_vi: 'Căn hộ 70m²',
    area: '70 m²',
    description_vi: 'Phòng khách rộng rãi với sofa sectional, kệ tivi và thảm trải sàn cao cấp.',
    coverImage: 'https://ckkvyltbeinzqogjsfli.supabase.co/storage/v1/object/public/dcor/sofas/SM43550005_2695695_PNG-Web2072dpi.png',
    tag: 'Cho gia đình',
    productIds: ['SM43550005', 'SM41750022', 'SMAugusta01', '106071012300'],
  },
  {
    id: 'townhouse',
    name_vi: 'Nhà phố 2 tầng',
    area: '90 m²',
    description_vi: 'Không gian sang trọng với sofa da, tủ sách và bộ bàn ăn thiết kế.',
    coverImage: 'https://ckkvyltbeinzqogjsfli.supabase.co/storage/v1/object/public/dcor/sofas/SM44850009_2079440_PNG-Web2072dpi.png',
    tag: 'Sang trọng',
    productIds: ['SM44850009', 'SMAugusta01', '3800UF00', '48053001'],
  },
  {
    id: 'home-office',
    name_vi: 'Văn phòng tại nhà',
    area: '20 m²',
    description_vi: 'Ghế làm việc ergonomic, kệ lưu trữ thông minh và đèn bàn tinh tế.',
    coverImage: 'https://ckkvyltbeinzqogjsfli.supabase.co/storage/v1/object/public/dcor/chairs/4020B010_373227_PNG-Web2072dpi.png',
    tag: 'Làm việc từ nhà',
    productIds: ['4020B010', '34005430', 'SM0Lugano04', '105000001540'],
  },
];

export interface HeroHotspot {
  id: string;
  productId: string;
  name_vi: string;
  price: string;
  image: string;
  x: number;
  y: number;
}

export const HERO_HOTSPOTS: HeroHotspot[] = [
  {
    id: 'hotspot-sofa',
    productId: 'SM42250021',
    name_vi: 'Sofa Indivi chaise longue',
    price: '56,890,000 ₫',
    image: 'https://ckkvyltbeinzqogjsfli.supabase.co/storage/v1/object/public/dcor/sofas/SM42250021_2704535_PNG-Web_2072dpi.png',
    x: 38,
    y: 62,
  },
  {
    id: 'hotspot-table',
    productId: '30000640',
    name_vi: 'Bàn cà phê Cancún',
    price: '14,990,000 ₫',
    image: 'https://ckkvyltbeinzqogjsfli.supabase.co/storage/v1/object/public/dcor/tables/30000640_2112067_PNG-Web_2072dpi.png',
    x: 62,
    y: 75,
  },
  {
    id: 'hotspot-lamp',
    productId: '105000001520',
    name_vi: 'Đèn Ripple treo trần',
    price: '28,190,000 ₫',
    image: 'https://ckkvyltbeinzqogjsfli.supabase.co/storage/v1/object/public/dcor/lighting/105000001520_2751896_PNG-Web2072dpi.png',
    x: 78,
    y: 30,
  },
];
