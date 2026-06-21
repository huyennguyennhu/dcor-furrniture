'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { flyToCart } from '@/lib/flyToCart';
import { useSearchParams, useRouter } from 'next/navigation';
import { CatalogProduct } from '@/lib/data';
import { useStore } from '@/lib/store';
import SidebarFilter, { FilterState, INITIAL_FILTER_STATE } from '@/components/shop/SidebarFilter';
import QuickViewDrawer from '@/components/shop/QuickViewDrawer';
import CustomSelect from '@/components/ui/CustomSelect';

const ITEMS_PER_PAGE = 12;

const getProductPriceVal = (prod: CatalogProduct) => prod.prices?.[0]?.price ?? 0;
const getProductPriceFormatted = (prod: CatalogProduct) => prod.prices?.[0]?.formattedPrice ?? 'Liên hệ';
const getLowestPriceFormatted = (prod: CatalogProduct) => prod.lowestPrices?.[0]?.formattedPrice ?? null;
const isOnSale = (prod: CatalogProduct) => {
  const base = prod.prices?.[0]?.price ?? 0;
  const low = prod.lowestPrices?.[0]?.price ?? 0;
  return low > 0 && low < base;
};

const QUICK_CATEGORIES = ['Tất cả', 'Sofa', 'Bàn', 'Ghế', 'Tủ Kệ', 'Giường', 'Đèn', 'Thảm', 'Trang trí', 'Phụ Kiện'];

function KhamPhaContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { addToCart, wishlist, toggleWishlist } = useStore();
  
  const initialCategory = searchParams.get('category') || '';
  const initialQuery = searchParams.get('q') || '';

  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dynamicFilters, setDynamicFilters] = useState({ categories: [], materials: [], colors: [] });
  
  // Filter States
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [filters, setFilters] = useState<FilterState>({
    ...INITIAL_FILTER_STATE,
    categories: initialCategory ? [initialCategory] : []
  });
  const [sortBy, setSortBy] = useState('featured');
  const [currentPage, setCurrentPage] = useState(1);
  const [pendingScrollId, setPendingScrollId] = useState<string | null>(null);

  // Quick View State
  const [quickViewProduct, setQuickViewProduct] = useState<CatalogProduct | null>(null);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);

  const catDep = filters.categories.join(',');
  const matDep = filters.materials.join(',');
  const colDep = filters.colors.join(',');

  useEffect(() => {
    async function loadData() {
      try {
        const [res, filterRes] = await Promise.all([
          fetch('/api/products'),
          fetch('/api/products/filters')
        ]);
        if (res.ok) {
          const data = await res.json();
          setProducts(data);
        }
        if (filterRes.ok) {
          const filterData = await filterRes.json();
          setDynamicFilters({
            categories: filterData.categories || [],
            materials: filterData.materials || [],
            colors: filterData.colors || []
          });
        }
      } catch (err) {
        console.error('Failed to fetch data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    const savedStateStr = sessionStorage.getItem('exploreState');
    if (savedStateStr) {
      if (initialCategory || initialQuery) {
        // User clicked a category link or search, don't restore old state
        sessionStorage.removeItem('exploreState');
      } else {
        try {
          const savedState = JSON.parse(savedStateStr);
          // Always reset price slider to max when restoring session, per user request
          if (savedState.filters) {
            savedState.filters.priceRange = [0, 999999999];
            setFilters(savedState.filters);
          }
          setCurrentPage(savedState.currentPage);
          setSortBy(savedState.sortBy);
          setSearchQuery(savedState.searchQuery);
          
          if (savedState.scrollToProductId) {
            setPendingScrollId(savedState.scrollToProductId);
          }
        } catch (e) {}
      }
    }
  }, [initialCategory]);

  useEffect(() => {
    if (pendingScrollId && !isLoading && products.length > 0) {
      const timer = setTimeout(() => {
        const el = document.getElementById(`product-${pendingScrollId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add('highlight-card');
          setTimeout(() => el.classList.remove('highlight-card'), 2500);
          
          const savedStateStr = sessionStorage.getItem('exploreState');
          if (savedStateStr) {
            try {
              const savedState = JSON.parse(savedStateStr);
              delete savedState.scrollToProductId;
              sessionStorage.setItem('exploreState', JSON.stringify(savedState));
            } catch (e) {}
          }
        }
        setPendingScrollId(null);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [pendingScrollId, isLoading, products.length]);

  const handleProductClick = (productId: string) => {
    sessionStorage.setItem('exploreState', JSON.stringify({
      filters,
      currentPage,
      sortBy,
      searchQuery,
      scrollToProductId: productId
    }));
    router.push(`/kham-pha/${productId}`);
  };

  const filteredExceptPrice = products.filter(prod => {
    // 1. Categories
    if (filters.categories.length > 0) {
      if (!filters.categories.some(c => 
        prod.category?.toLowerCase().includes(c.toLowerCase()) || 
        prod.shortDescription?.toLowerCase().includes(c.toLowerCase())
      )) return false;
    }
    // 2. Materials
    if (filters.materials.length > 0) {
      if (!prod.refinementMaterials?.some(m => filters.materials.includes(m)) && 
          !prod.refinementMaterials_vi?.some(m => filters.materials.includes(m))) return false;
    }
    // 3. Colors
    if (filters.colors.length > 0) {
      if (!prod.refinementColors?.some(c => filters.colors.includes(c)) &&
          !prod.refinementColors_vi?.some(c => filters.colors.includes(c))) return false;
    }

    // Search query
    const titleVi = prod.shortDescription_vi || prod.shortDescription;
    if (searchQuery &&
      !titleVi.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !prod.shortDescription.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    
    return true;
  });

  // Faceted Search Validation: Tính toán các bộ lọc khả dụng
  const validCategories = new Set<string>();
  const validMaterials = new Set<string>();
  const validColors = new Set<string>();

  products.forEach(prod => {
    const passCat = filters.categories.length === 0 || filters.categories.some(c => 
      prod.category?.toLowerCase().includes(c.toLowerCase()) || 
      prod.shortDescription?.toLowerCase().includes(c.toLowerCase())
    );
    const passMat = filters.materials.length === 0 || (prod.refinementMaterials?.some(m => filters.materials.includes(m)) || prod.refinementMaterials_vi?.some(m => filters.materials.includes(m)));
    const passCol = filters.colors.length === 0 || (prod.refinementColors?.some(c => filters.colors.includes(c)) || prod.refinementColors_vi?.some(c => filters.colors.includes(c)));
    const passPrice = getProductPriceVal(prod) <= filters.priceRange[1];
    
    const titleVi = prod.shortDescription_vi || prod.shortDescription;
    const passSearch = !searchQuery || titleVi.toLowerCase().includes(searchQuery.toLowerCase()) || prod.shortDescription.toLowerCase().includes(searchQuery.toLowerCase());

    // Valid Categories ignoring category filter
    if (passMat && passCol && passPrice && passSearch) {
      if (prod.category) {
        // Chuẩn hóa lại tên category cho khớp với mảng tĩnh CATEGORIES
        const capitalizedCat = prod.category.split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
        // Ghi đè Tủ kệ thành Tủ Kệ cho đồng bộ mảng
        if (capitalizedCat === 'Tủ Kệ' || capitalizedCat === 'Tủ kệ') validCategories.add('Tủ Kệ');
        else validCategories.add(capitalizedCat);
      }
    }
    if (passCat && passCol && passPrice && passSearch) {
      prod.refinementMaterials?.forEach(m => validMaterials.add(m));
      prod.refinementMaterials_vi?.forEach(m => validMaterials.add(m));
    }
    if (passCat && passMat && passPrice && passSearch) {
      prod.refinementColors?.forEach(c => validColors.add(c));
      prod.refinementColors_vi?.forEach(c => validColors.add(c));
    }
  });

  const validFiltersObj = {
    categories: Array.from(validCategories),
    materials: Array.from(validMaterials),
    colors: Array.from(validColors)
  };

  // Tìm giá cao nhất trong các sản phẩm đã lọc (không tính điều kiện giá)
  const maxPriceInFiltered = filteredExceptPrice.length > 0 
    ? Math.max(...filteredExceptPrice.map(p => getProductPriceVal(p)))
    : 100000000;
  
  // Dùng mốc giá cao nhất này làm max bound cho slider (nhưng ít nhất là 10,000,000 để slider không bị lỗi nếu max=0)
  const dynamicMaxPrice = Math.max(10000000, Math.ceil(maxPriceInFiltered / 1000000) * 1000000);

  const filtered = filteredExceptPrice.filter(prod => {
    // 4. Price
    const price = getProductPriceVal(prod);
    if (price > filters.priceRange[1]) return false;
    return true;
  });

  const sorted = [...filtered];
  if (sortBy === 'featured') {
    sorted.sort((a, b) => {
      if (a.isBestSeller && !b.isBestSeller) return -1;
      if (!a.isBestSeller && b.isBestSeller) return 1;
      return 0;
    });
  }
  else if (sortBy === 'newest') {
    sorted.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });
  }
  else if (sortBy === 'price-asc') sorted.sort((a, b) => getProductPriceVal(a) - getProductPriceVal(b));
  else if (sortBy === 'price-desc') sorted.sort((a, b) => getProductPriceVal(b) - getProductPriceVal(a));

  const totalPages = Math.ceil(sorted.length / ITEMS_PER_PAGE);
  const paginated = sorted.slice(0, currentPage * ITEMS_PER_PAGE);

  const openQuickView = (e: React.MouseEvent, prod: CatalogProduct) => {
    e.stopPropagation();
    e.preventDefault();
    setQuickViewProduct(prod);
    setIsQuickViewOpen(true);
  };

  const handleQuickCatClick = (cat: string) => {
    if (cat === 'Tất cả') {
      setFilters(prev => ({ ...prev, categories: [] }));
    } else {
      setFilters(prev => {
        const currentList = prev.categories;
        const newList = currentList.includes(cat) 
          ? currentList.filter(item => item !== cat) 
          : [...currentList, cat];
        return { ...prev, categories: newList };
      });
    }
    setCurrentPage(1);
  };

  const activeTagCount = Object.entries(filters).reduce((acc, [key, val]) => {
    if (key === 'priceRange') return acc;
    if (Array.isArray(val)) return acc + val.length;
    return acc;
  }, 0) + (filters.priceRange[1] < 100000000 ? 1 : 0);

  const clearAllFilters = () => {
    setFilters(INITIAL_FILTER_STATE);
    setCurrentPage(1);
  };

  const removeFilterTag = (key: keyof FilterState, val: string | null) => {
    if (key === 'priceRange') {
      setFilters(prev => ({ ...prev, priceRange: [0, 100000000] }));
    } else {
      setFilters(prev => ({
        ...prev,
        [key]: (prev[key] as string[]).filter(item => item !== val)
      }));
    }
    setCurrentPage(1);
  };

  return (
    <div className="explore-page">
      {/* 1. Hero nhỏ & Quick Filter */}
      <section className="explore-hero">
        <div className="container">
          <div className="explore-hero-content">
            <h1 className="explore-hero-title">KHÁM PHÁ</h1>
            <p className="explore-hero-subtitle">Tìm kiếm nội thất phù hợp với không gian và phong cách của bạn</p>
          </div>
          
          {isLoading ? (
            <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '5px' }}>
              <div style={{ width: '80px', height: '36px', background: 'rgba(255,255,255,0.2)', borderRadius: '20px', animation: 'pulse 1.5s infinite ease-in-out' }}></div>
              <div style={{ width: '100px', height: '36px', background: 'rgba(255,255,255,0.2)', borderRadius: '20px', animation: 'pulse 1.5s infinite ease-in-out' }}></div>
              <div style={{ width: '90px', height: '36px', background: 'rgba(255,255,255,0.2)', borderRadius: '20px', animation: 'pulse 1.5s infinite ease-in-out' }}></div>
              <div style={{ width: '110px', height: '36px', background: 'rgba(255,255,255,0.2)', borderRadius: '20px', animation: 'pulse 1.5s infinite ease-in-out' }}></div>
              <div style={{ width: '85px', height: '36px', background: 'rgba(255,255,255,0.2)', borderRadius: '20px', animation: 'pulse 1.5s infinite ease-in-out' }}></div>
            </div>
          ) : (
            <div className="quick-pill-list">
              {['Tất cả', ...(dynamicFilters?.categories?.length > 0 ? dynamicFilters.categories : QUICK_CATEGORIES.slice(1))].map(cat => {
                const isActive = filters.categories.includes(cat) || (cat === 'Tất cả' && filters.categories.length === 0);
                return (
                  <button 
                    key={cat} 
                    className={`quick-pill ${isActive ? 'active' : ''}`}
                    onClick={() => handleQuickCatClick(cat)}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </section>


      {/* 3. Thanh điều khiển danh sách (Sticky) */}
      <div className="explore-active-bar">
        <div className="container">
          <div className="active-bar-content">
            <div className="active-tags">
              <span className="product-count">{filtered.length} sản phẩm</span>
              {filters.categories.map(c => (
                <span key={c} className="active-tag">{c} <button onClick={() => removeFilterTag('categories', c)}>&times;</button></span>
              ))}
              {filters.materials.map(m => (
                <span key={m} className="active-tag">{m} <button onClick={() => removeFilterTag('materials', m)}>&times;</button></span>
              ))}
              {filters.colors.map(c => (
                <span key={c} className="active-tag">{c} <button onClick={() => removeFilterTag('colors', c)}>&times;</button></span>
              ))}
              {filters.priceRange[1] < 100000000 && (
                <span className="active-tag">Dưới {(filters.priceRange[1]/1000000).toFixed(0)}tr <button onClick={() => removeFilterTag('priceRange', null)}>&times;</button></span>
              )}
              {activeTagCount > 0 && (
                <button className="clear-all-btn" onClick={clearAllFilters}>
                  Xóa bộ lọc
                </button>
              )}
            </div>
            
            <div className="sort-dropdown">
              <CustomSelect 
                value={sortBy} 
                onChange={(val) => { setSortBy(val); setCurrentPage(1); }}
                options={[
                  { value: 'featured', label: 'Sắp xếp: Phổ biến' },
                  { value: 'newest', label: 'Sắp xếp: Mới nhất' },
                  { value: 'price-asc', label: 'Giá: Tăng dần' },
                  { value: 'price-desc', label: 'Giá: Giảm dần' }
                ]}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 4. Khu vực chính */}
      <div className="container explore-main-layout">
        {/* 5. Sidebar Filter */}
        <div className="explore-sidebar">
          {isLoading ? (
            <div style={{ padding: '20px', animation: 'pulse 1.5s infinite ease-in-out' }}>
              <style>{`
                @keyframes pulse {
                  0% { opacity: 0.6; }
                  50% { opacity: 0.2; }
                  100% { opacity: 0.6; }
                }
              `}</style>
              <div style={{ width: '60%', height: '24px', background: '#eaeaea', marginBottom: '20px', borderRadius: '4px' }}></div>
              <div style={{ width: '100%', height: '30px', background: '#f5f5f5', marginBottom: '10px', borderRadius: '4px' }}></div>
              <div style={{ width: '100%', height: '30px', background: '#f5f5f5', marginBottom: '10px', borderRadius: '4px' }}></div>
              <div style={{ width: '100%', height: '30px', background: '#f5f5f5', marginBottom: '30px', borderRadius: '4px' }}></div>
              
              <div style={{ width: '60%', height: '24px', background: '#eaeaea', marginBottom: '20px', borderRadius: '4px' }}></div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '30px' }}>
                <div style={{ width: '100%', height: '30px', background: '#f5f5f5', borderRadius: '4px' }}></div>
                <div style={{ width: '100%', height: '30px', background: '#f5f5f5', borderRadius: '4px' }}></div>
                <div style={{ width: '100%', height: '30px', background: '#f5f5f5', borderRadius: '4px' }}></div>
                <div style={{ width: '100%', height: '30px', background: '#f5f5f5', borderRadius: '4px' }}></div>
              </div>

              <div style={{ width: '60%', height: '24px', background: '#eaeaea', marginBottom: '20px', borderRadius: '4px' }}></div>
              <div style={{ width: '100%', height: '4px', background: '#eaeaea', marginBottom: '30px', borderRadius: '2px' }}></div>
            </div>
          ) : (
            <SidebarFilter 
              filters={filters} 
              onFilterChange={(newFilters) => { setFilters(newFilters); setCurrentPage(1); }} 
              dynamicFilters={dynamicFilters} 
              validFilters={validFiltersObj}
              dynamicMaxPrice={dynamicMaxPrice}
            />
          )}
        </div>

        {/* 7. Product Grid */}
        <div className="explore-content">
          {isLoading ? (
            <div className="products-grid">
              {Array.from({ length: 12 }).map((_, i) => (
                <div className="skeleton-card" key={i}>
                  <div className="skeleton-img" style={{ height: '280px' }} />
                  <div style={{ padding: '20px' }}>
                    <div className="skeleton-text" style={{ height: '12px', width: '40%', marginBottom: '10px' }} />
                    <div className="skeleton-text" style={{ height: '18px', width: '80%' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : paginated.length === 0 ? (
            <div className="empty-state" style={{ textAlign: 'center', padding: '100px 0' }}>
              <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>Không tìm thấy sản phẩm nào phù hợp với bộ lọc hiện tại.</p>
              <button onClick={clearAllFilters} className="cta-btn">Xóa bộ lọc</button>
            </div>
          ) : (
            <div className="products-grid">
              {paginated.map(prod => {
                const img1 = prod.images?.[0] || '';
                const img2 = prod.images?.[1] || img1;
                const titleVi = prod.shortDescription_vi || prod.shortDescription;
                const onSale = isOnSale(prod);
                const lowestFmt = getLowestPriceFormatted(prod);
                const isFavorite = wishlist.includes(prod.productId);

                return (
                  <div 
                    className="product-card" 
                    key={prod.productId}
                    id={`product-${prod.productId}`}
                    onClick={() => handleProductClick(prod.productId)}
                  >
                    <div className="card-image-area">
                      <img className="img-primary" src={img1} alt={titleVi} loading="lazy" />
                      <img className="img-secondary" src={img2} alt={titleVi} loading="lazy" />
                      
                      <div className="product-badges">
                        {onSale && (prod.discountValue || 0) > 0 ? (
                          <span className="badge-tag badge-sale">
                            {prod.discountType === 'PERCENTAGE' ? `Giảm ${prod.discountValue}%` : `Giảm ${new Intl.NumberFormat('vi-VN').format(prod.discountValue || 0)}đ`}
                          </span>
                        ) : prod.isBestSeller ? (
                          <span className="badge-tag badge-bestseller">Bán chạy</span>
                        ) : prod.isNew ? (
                          <span className="badge-tag badge-new">Mới</span>
                        ) : null}
                      </div>
                    </div>
                    
                    <div className="card-details">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span className="card-category">{prod.category || 'D\'Cor'}</span>
                        <div className="card-mini-actions">
                          <button className={`mini-action-btn ${isFavorite ? 'favorite-active' : ''}`} title="Yêu thích" onClick={(e) => { e.stopPropagation(); e.preventDefault(); toggleWishlist(prod.productId); }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill={isFavorite ? 'var(--accent)' : 'none'} stroke={isFavorite ? 'var(--accent)' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
                          </button>
                          <button className="mini-action-btn" title="So sánh" onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/></svg>
                          </button>
                          <button className="mini-action-btn" title="Xem nhanh" onClick={(e) => openQuickView(e, prod)}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                          </button>
                        </div>
                      </div>
                      <h3 className="card-title">{titleVi}</h3>
                      <div className="card-price-row">
                        <div>
                          {onSale && lowestFmt ? (
                            <>
                              <span className="card-price-label">Sale:</span>
                              <div className="card-price" style={{ color: 'var(--accent)' }}>{lowestFmt}</div>
                            </>
                          ) : (
                            <>
                              <span className="card-price-label">Giá từ:</span>
                              <div className="card-price">{getProductPriceFormatted(prod)}</div>
                            </>
                          )}
                        </div>
                        <button 
                          className="add-to-cart-btn-icon"
                          title="Thêm vào giỏ"
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            const defaultTags: {label: string, value: string}[] = [];
                            if (prod.refinementColors_vi?.length || prod.refinementColors?.length) {
                              defaultTags.push({ label: 'Màu sắc', value: prod.refinementColors_vi?.[0] || prod.refinementColors?.[0] || '' });
                            }
                            if (prod.refinementMaterials_vi?.length || prod.refinementMaterials?.length) {
                              defaultTags.push({ label: 'Chất liệu', value: prod.refinementMaterials_vi?.[0] || prod.refinementMaterials?.[0] || '' });
                            }

                            addToCart({
                              productId: prod.productId,
                              name: titleVi,
                              image: img1,
                              price: getProductPriceVal(prod),
                              variantTags: defaultTags.length > 0 ? defaultTags : undefined
                            });
                            flyToCart(e, img1);
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 9. Pagination */}
          {!isLoading && currentPage < totalPages && (
            <div className="explore-load-more">
              <button onClick={() => setCurrentPage(p => p + 1)}>
                Khám phá thêm
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
              </button>
            </div>
          )}

          {/* 10. CTA Room Planner */}
          {!isLoading && (
            <div className="explore-cta-banner">
              <div className="cta-content">
                <h2>Chưa tìm được sản phẩm phù hợp?</h2>
                <p>Hãy thử bố trí không gian bằng công cụ Thiết kế phòng của chúng tôi.</p>
                <button onClick={() => router.push('/thiet-ke/room-planner')} className="cta-btn">
                  Thiết kế ngay
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 8. Quick View Drawer */}
      <QuickViewDrawer 
        product={quickViewProduct} 
        isOpen={isQuickViewOpen} 
        onClose={() => setIsQuickViewOpen(false)} 
      />

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes skeleton-pulse { 0%,100%{opacity:.6} 50%{opacity:.25} }
        .skeleton-card{border:1px solid var(--border-color);border-radius:12px;background:rgba(255,255,255,.02);overflow:hidden}
        .skeleton-img{background:rgba(255,255,255,.05);animation:skeleton-pulse 1.5s infinite ease-in-out}
        .skeleton-text{background:rgba(255,255,255,.05);animation:skeleton-pulse 1.5s infinite ease-in-out; border-radius:4px;}
      `}} />
    </div>
  );
}

export default function KhamPhaPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', padding: '100px 0', color: 'var(--text-muted)' }}>Đang tải dữ liệu...</div>}>
      <KhamPhaContent />
    </Suspense>
  );
}
