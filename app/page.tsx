'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Leaf, ShieldCheck, Truck, Wrench } from 'lucide-react';
import { CatalogProduct } from '@/lib/data';
import { STYLE_COLLECTIONS, ROOM_INSPIRATIONS, HERO_HOTSPOTS } from '@/lib/collections';

const ITEMS_PER_PAGE = 8;

// ===== HELPERS =====
const getProductPriceVal = (prod: CatalogProduct) =>
  prod.prices?.[0]?.price ?? 0;

const getProductPriceFormatted = (prod: CatalogProduct) =>
  prod.prices?.[0]?.formattedPrice ?? 'Liên hệ';

const getLowestPriceFormatted = (prod: CatalogProduct) =>
  prod.lowestPrices?.[0]?.formattedPrice ?? null;

const isOnSale = (prod: CatalogProduct) => {
  const base = prod.prices?.[0]?.price ?? 0;
  const low = prod.lowestPrices?.[0]?.price ?? 0;
  return low > 0 && low < base;
};

// ===== SECTION 1: HERO SHOPPABLE =====
function HeroSection() {
  const [activeHotspot, setActiveHotspot] = useState<string | null>(null);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <section className="hero-shoppable" id="hero">
      {/* Parallax bg image */}
      <div
        className="hero-bg"
        style={{ transform: `translateY(${scrollY * 0.35}px)` }}
      />
      <div className="hero-overlay" />

      {/* Content */}
      <div className="hero-shoppable-content">
        <span className="hero-eyebrow">Nội thất cao cấp</span>
        <h1 className="hero-headline">
          Biến ngôi nhà
          <span className="hero-headline-accent" style={{ display: 'block', whiteSpace: 'nowrap' }}>thành tổ ấm</span>
        </h1>
        <p className="hero-tagline">
          Hơn 300 mẫu nội thất thiết kế độc quyền — tùy biến theo phong cách của bạn.
        </p>
      </div>

      {/* Interactive Hotspots */}
      {HERO_HOTSPOTS.map(spot => (
        <div
          key={spot.id}
          className={`hotspot ${activeHotspot === spot.id ? 'active' : ''}`}
          style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
          onMouseEnter={() => setActiveHotspot(spot.id)}
          onMouseLeave={() => setActiveHotspot(null)}
        >
          <div className="hotspot-pulse" />
          <div className="hotspot-dot" />
          <div className="hotspot-tooltip">
            <img src={spot.image} alt={spot.name_vi} className="hotspot-img" />
            <div className="hotspot-info">
              <span className="hotspot-name">{spot.name_vi}</span>
              <span className="hotspot-price">{spot.price}</span>
              <Link href={`/kham-pha/${spot.productId}`} className="hotspot-cta">
                Xem chi tiết →
              </Link>
            </div>
          </div>
        </div>
      ))}

      {/* Scroll cue */}
      <div className="hero-scroll-cue">
        <span>Khám phá</span>
        <div className="scroll-arrow" />
      </div>
    </section>
  );
}

// ===== SECTION 2: CATEGORY CARDS =====
const DEFAULT_CATEGORIES = [
  { label: 'Sofa', value: 'Sofa', emoji: '️', desc: 'Đang tải...', img: 'https://ckkvyltbeinzqogjsfli.supabase.co/storage/v1/object/public/dcor/sofas/41252001_2733503_PNG-Web2072dpi.png' },
  { label: 'Ghế', value: 'Ghế', emoji: '', desc: 'Đang tải...', img: 'https://ckkvyltbeinzqogjsfli.supabase.co/storage/v1/object/public/dcor/chairs/4020B010_373227_PNG-Web2072dpi.png' },
  { label: 'Bàn', value: 'Bàn', emoji: '', desc: 'Đang tải...', img: 'https://ckkvyltbeinzqogjsfli.supabase.co/storage/v1/object/public/dcor/tables/105000001540_2802663_PNG-Web2072dpi.png' },
  { label: 'Tủ & Kệ', value: 'Tủ & Kệ', emoji: '️', desc: 'Đang tải...', img: 'https://ckkvyltbeinzqogjsfli.supabase.co/storage/v1/object/public/dcor/storage/34005430_2108556_PNG-Web2072dpi.png' },
  { label: 'Đèn', value: 'Đèn', emoji: '', desc: 'Đang tải...', img: 'https://ckkvyltbeinzqogjsfli.supabase.co/storage/v1/object/public/dcor/lighting/105000001520_2751896_PNG-Web2072dpi.png' },
  { label: 'Thảm', value: 'Thảm', emoji: '', desc: 'Đang tải...', img: 'https://ckkvyltbeinzqogjsfli.supabase.co/storage/v1/object/public/dcor/rugs/106071012300_2766660_PNG-Web2072dpi.png' },
  { label: 'Giường', value: 'Giường', emoji: '️', desc: 'Đang tải...', img: 'https://ckkvyltbeinzqogjsfli.supabase.co/storage/v1/object/public/dcor/beds/104011033760_1107030_PNG-Web2072dpi.png' },
  { label: 'Phụ kiện', value: 'Phụ kiện', emoji: '', desc: 'Đang tải...', img: 'https://ckkvyltbeinzqogjsfli.supabase.co/storage/v1/object/public/dcor/accessories/104011032150_798739_PNG-Web2072dpi.png' },
];

function CategorySection({ onCategoryClick, categories }: { onCategoryClick: (cat: string) => void; categories: typeof DEFAULT_CATEGORIES }) {
  return (
    <section className="categories-section" id="categories">
      <div className="container">
        <div className="section-header-simple">
          <h2 className="section-title">Danh mục <span>sản phẩm</span></h2>
          <p className="section-tagline">Khám phá bộ sưu tập nội thất đa dạng</p>
        </div>
        <div className="categories-grid">
          {categories.map(cat => (
            <button
              key={cat.value}
              className="category-card"
              onClick={() => onCategoryClick(cat.value)}
              id={`cat-${cat.value.replace(/[^a-zA-Z0-9]/g, '-')}`}
            >
              <div className="category-card-img">
                <img src={cat.img} alt={cat.label} loading="lazy" />
                <div className="category-card-overlay" />
              </div>
              <div className="category-card-body">
                <span className="category-card-emoji">{cat.emoji}</span>
                <span className="category-card-name">{cat.label}</span>
                <span className="category-card-count">{cat.desc}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

// ===== SECTION 3: FEATURED PRODUCTS =====
type FeaturedTab = 'newest' | 'sale';

function FeaturedSection({ products }: { products: CatalogProduct[] }) {
  const [activeTab, setActiveTab] = useState<FeaturedTab>('newest');

  const saleProducts = products.filter(isOnSale).slice(0, 8);
  const newestProducts = [...products].slice(0, 8);

  const displayed = activeTab === 'sale' ? saleProducts : newestProducts;

  return (
    <section className="featured-section" id="featured">
      <div className="container">
        <div className="featured-header">
          <div>
            <h2 className="section-title">Sản phẩm <span>nổi bật</span></h2>
            <p className="section-tagline">Được yêu thích nhiều nhất tháng này</p>
          </div>
          <div className="featured-tabs">
            <button
              className={`featured-tab ${activeTab === 'newest' ? 'active' : ''}`}
              onClick={() => setActiveTab('newest')}
            >
              Mới nhất
            </button>
            <button
              className={`featured-tab ${activeTab === 'sale' ? 'active' : ''}`}
              onClick={() => setActiveTab('sale')}
            >
              Đang sale
            </button>
          </div>
        </div>

        <div className="featured-grid">
          {displayed.map(prod => {
            const img = prod.images?.[0] || '';
            const img2 = prod.images?.[1] || img;
            const titleVi = prod.shortDescription_vi || prod.shortDescription;
            const onSale = isOnSale(prod);
            const lowestFmt = getLowestPriceFormatted(prod);

            return (
              <Link href={`/kham-pha/${prod.productId}`} key={prod.productId} className="featured-card">
                <div className="featured-card-img">
                  <img className="img-primary" src={img} alt={titleVi} loading="lazy" />
                  <img className="img-secondary" src={img2} alt={titleVi} loading="lazy" />
                  {onSale && <div className="sale-badge">SALE</div>}
                  <div className="featured-card-hover-cta">Xem chi tiết</div>
                </div>
                <div className="featured-card-body">
                  <span className="featured-card-cat">{prod.category}</span>
                  <h3 className="featured-card-name">{titleVi}</h3>
                  <div className="featured-card-price-row">
                    {onSale && lowestFmt ? (
                      <>
                        <span className="price-sale">{lowestFmt}</span>
                        <span className="price-original">{getProductPriceFormatted(prod)}</span>
                      </>
                    ) : (
                      <span className="price-main">{getProductPriceFormatted(prod)}</span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        <div style={{ textAlign: 'center', marginTop: '40px' }}>
          <a href="#catalog" className="cta-btn-outline">Xem tất cả sản phẩm</a>
        </div>
      </div>
    </section>
  );
}

// ===== SECTION 4: STYLE COLLECTIONS =====
function CollectionsSection() {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: 'left' | 'right') => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: dir === 'left' ? -340 : 340, behavior: 'smooth' });
    }
  };

  return (
    <section className="collections-section" id="collections">
      <div className="container">
        <div className="collections-header">
          <div>
            <h2 className="section-title">Phong cách <span>thiết kế</span></h2>
            <p className="section-tagline">Chọn phong cách — chúng tôi lo phần còn lại</p>
          </div>
          <div className="collection-nav-btns">
            <button className="col-nav-btn" onClick={() => scroll('left')} aria-label="Cuộn trái">‹</button>
            <button className="col-nav-btn" onClick={() => scroll('right')} aria-label="Cuộn phải">›</button>
          </div>
        </div>

        <div className="collections-track" ref={scrollRef}>
          {STYLE_COLLECTIONS.map(col => (
            <div key={col.id} className="collection-card" style={{ '--col-accent': col.accentColor } as React.CSSProperties}>
              <div className="collection-card-img">
                <img src={col.coverImage} alt={col.name_vi} loading="lazy" />
                <div className="collection-card-gradient" />
              </div>
              <div className="collection-card-body">
                <span className="collection-tag">{col.name}</span>
                <h3 className="collection-name">{col.name_vi}</h3>
                <p className="collection-desc">{col.description_vi}</p>
                <Link
                  href={`/#catalog`}
                  className="collection-cta"
                  style={{ backgroundColor: col.accentColor }}
                >
                  Khám phá
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ===== SECTION 5: ROOM INSPIRATIONS =====
function InspirationsSection({ products }: { products: CatalogProduct[] }) {
  const [activeRoom, setActiveRoom] = useState<string | null>(null);

  const getProductsForRoom = (productIds: string[]) =>
    productIds
      .map(id => products.find(p => p.productId === id))
      .filter(Boolean) as CatalogProduct[];

  return (
    <section className="inspirations-section" id="inspirations">
      <div className="container">
        <div className="section-header-simple">
          <h2 className="section-title">Không gian <span>mẫu</span></h2>
          <p className="section-tagline">Bộ sưu tập nội thất hoàn chỉnh theo diện tích và phong cách sống</p>
        </div>

        <div className="inspirations-grid">
          {ROOM_INSPIRATIONS.map(room => {
            const roomProducts = getProductsForRoom(room.productIds);
            const isOpen = activeRoom === room.id;

            return (
              <div key={room.id} className={`inspiration-card ${isOpen ? 'expanded' : ''}`}>
                <div className="inspiration-card-img" onClick={() => setActiveRoom(isOpen ? null : room.id)}>
                  <img src={room.coverImage} alt={room.name_vi} loading="lazy" />
                  <div className="inspiration-overlay">
                    <span className="inspiration-tag">{room.tag}</span>
                    <h3 className="inspiration-name">{room.name_vi}</h3>
                    <span className="inspiration-area">{room.area}</span>
                  </div>
                  <div className="inspiration-toggle">{isOpen ? '−' : '+'}</div>
                </div>

                {isOpen && (
                  <div className="inspiration-products">
                    <p className="inspiration-desc">{room.description_vi}</p>
                    <div className="inspiration-products-list">
                      {roomProducts.map(prod => {
                        if (!prod) return null;
                        const titleVi = prod.shortDescription_vi || prod.shortDescription;
                        const priceFmt = isOnSale(prod)
                          ? getLowestPriceFormatted(prod)
                          : getProductPriceFormatted(prod);
                        return (
                          <Link href={`/kham-pha/${prod.productId}`} key={prod.productId} className="insp-prod-item">
                            <img src={prod.images?.[0]} alt={titleVi} />
                            <div>
                              <span className="insp-prod-name">{titleVi}</span>
                              <span className="insp-prod-price">{priceFmt}</span>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                    <Link href="/#catalog" className="insp-view-all">Xem toàn bộ sản phẩm →</Link>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ===== SECTION 7: TRUST + REVIEWS =====
const TRUST_ITEMS = [
  { icon: Leaf, title: 'Gỗ tự nhiên bền vững', desc: 'Nguyên liệu từ rừng quản lý bền vững, đạt chứng chỉ FSC.' },
  { icon: ShieldCheck, title: 'Bảo hành 5 năm', desc: 'Cam kết chất lượng dài hạn với dịch vụ bảo hành toàn quốc.' },
  { icon: Truck, title: 'Giao hàng toàn quốc', desc: 'Vận chuyển nhanh chóng, an toàn đến mọi tỉnh thành.' },
  { icon: Wrench, title: 'Miễn phí lắp đặt', desc: 'Đội ngũ kỹ thuật chuyên nghiệp lắp đặt tận nơi.' },
];

const STATIC_REVIEWS = [
  { name: 'Nguyễn Minh Tuấn', city: 'TP. HCM', rating: 5, text: 'Sofa rất đẹp và chất lượng vượt mong đợi. Dịch vụ lắp đặt nhanh chóng, nhân viên nhiệt tình.', product: 'Sofa Indivi 3 chỗ' },
  { name: 'Trần Thị Lan Anh', city: 'Hà Nội', rating: 5, text: 'Mua bàn ăn Augusta, giao hàng đúng hẹn, đóng gói cẩn thận. Chất lượng xứng với giá tiền.', product: 'Bàn ăn Augusta' },
  { name: 'Lê Hữu Phước', city: 'Đà Nẵng', rating: 5, text: 'Tôi rất thích tính năng tùy biến chân sofa. Cảm giác như được thiết kế riêng cho mình.', product: 'Sofa Carmo 2 chỗ' },
  { name: 'Phạm Thu Hương', city: 'Hải Phòng', rating: 5, text: 'Website dễ dùng, chọn được màu vải yêu thích. Sofa đặt trong phòng trông cực kỳ sang trọng.', product: 'Sofa Amsterdam góc' },
];

function TrustSection() {
  const [reviewIdx, setReviewIdx] = useState(0);

  return (
    <section className="trust-section" id="why-us">
      <div className="container">
        {/* Trust grid */}
        <div className="section-header-simple" style={{ marginBottom: '50px' }}>
          <h2 className="section-title">Vì sao chọn <span>D'Cor Studio?</span></h2>
        </div>
        <div className="trust-grid">
          {TRUST_ITEMS.map((item, i) => {
            const IconComponent = item.icon;
            return (
              <div key={i} className="trust-card">
                <span className="trust-icon" style={{ display: 'inline-flex', marginBottom: '20px', color: 'var(--accent)' }}>
                  <IconComponent size={40} strokeWidth={1.5} />
                </span>
                <h4 className="trust-title">{item.title}</h4>
                <p className="trust-desc">{item.desc}</p>
              </div>
            );
          })}
        </div>

        {/* Reviews */}
        <div className="reviews-block" style={{ marginTop: '80px' }}>
          <h2 className="section-title" style={{ textAlign: 'center', marginBottom: '40px' }}>
            Khách hàng <span>nói gì?</span>
          </h2>
          <div className="review-carousel">
            <button className="review-nav review-nav-prev" onClick={() => setReviewIdx(i => Math.max(i - 1, 0))}>‹</button>
            <div className="review-card">
              <div className="review-stars">{''.repeat(STATIC_REVIEWS[reviewIdx].rating)}</div>
              <p className="review-text">"{STATIC_REVIEWS[reviewIdx].text}"</p>
              <div className="review-product">{STATIC_REVIEWS[reviewIdx].product}</div>
              <div className="review-author">
                <div className="review-avatar">{STATIC_REVIEWS[reviewIdx].name[0]}</div>
                <div>
                  <span className="review-name">{STATIC_REVIEWS[reviewIdx].name}</span>
                  <span className="review-city">{STATIC_REVIEWS[reviewIdx].city}</span>
                </div>
              </div>
            </div>
            <button className="review-nav review-nav-next" onClick={() => setReviewIdx(i => Math.min(i + 1, STATIC_REVIEWS.length - 1))}>›</button>
          </div>
          <div className="review-dots">
            {STATIC_REVIEWS.map((_, i) => (
              <button key={i} className={`review-dot ${i === reviewIdx ? 'active' : ''}`} onClick={() => setReviewIdx(i)} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ===== MAIN HOME PAGE =====
export default function Home() {
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadProducts() {
      try {
        const res = await fetch('/api/products');
        if (res.ok) {
          const data = await res.json();
          setProducts(data);

          // Tạo danh mục sản phẩm động trực tiếp từ dữ liệu Supabase
          const counts: Record<string, number> = {};
          const firstImages: Record<string, string> = {};

          data.forEach((p: CatalogProduct) => {
            const cat = p.category || 'Khác';
            counts[cat] = (counts[cat] || 0) + 1;
            if (!firstImages[cat] && p.images && p.images.length > 0) {
              firstImages[cat] = p.images[0];
            }
          });

          const order = ['Sofa', 'Ghế', 'Bàn', 'Tủ & Kệ', 'Đèn', 'Thảm', 'Giường', 'Phụ kiện'];

          const generatedCats = Object.keys(counts)
            .map(cat => ({
              label: cat,
              value: cat,
              emoji: '',
              desc: `${counts[cat]} mẫu`,
              img: firstImages[cat] || 'https://ckkvyltbeinzqogjsfli.supabase.co/storage/v1/object/public/dcor/sofas/41252001_2733503_PNG-Web2072dpi.png'
            }))
            .sort((a, b) => {
              const idxA = order.indexOf(a.value);
              const idxB = order.indexOf(b.value);
              if (idxA !== -1 && idxB !== -1) return idxA - idxB;
              if (idxA !== -1) return -1;
              if (idxB !== -1) return 1;
              return b.desc.localeCompare(a.desc);
            });

          if (generatedCats.length > 0) {
            setCategories(generatedCats);
          }
        }
      } catch (err) {
        console.error('Failed to fetch products:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadProducts();
  }, []);

  // Chuyển sang trang /kham-pha với filter danh mục
  const handleCategoryClick = (cat: string) => {
    window.location.href = `/kham-pha${cat ? `?category=${encodeURIComponent(cat)}` : ''}`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* 1. Hero */}
      <HeroSection />

      {/* 2. Categories */}
      <CategorySection onCategoryClick={handleCategoryClick} categories={categories} />

      {/* 3. Featured */}
      {isLoading ? (
        <section className="featured-section">
          <div className="container">
            <div style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              Đang tải sản phẩm nổi bật...
            </div>
          </div>
        </section>
      ) : (
        <FeaturedSection products={products} />
      )}

      {/* 4. Collections */}
      <CollectionsSection />

      {/* 5. Inspirations */}
      {!isLoading && <InspirationsSection products={products} />}

      {/* 6. Trust + Reviews */}
      <TrustSection />
    </div>
  );
}
