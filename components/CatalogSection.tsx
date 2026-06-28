'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { CatalogProduct } from '@/lib/data';
import { getProductPriceVal, getProductPriceFormatted, getLowestPriceFormatted, isOnSale } from '@/lib/helpers';
import HoverImageSlider from '@/components/ui/HoverImageSlider';

const ITEMS_PER_PAGE = 8;

export default function CatalogSection({ products, initialCategory, categories }: { products: CatalogProduct[]; initialCategory: string; categories: { label: string; value: string; emoji: string; desc: string; img: string }[] }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState(initialCategory);
  const [materialFilter, setMaterialFilter] = useState('');
  const [colorFilter, setColorFilter] = useState('');
  const [sortBy, setSortBy] = useState('featured');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCategoryFilter(initialCategory);
    setCurrentPage(1);
  }, [initialCategory]);

  const filtered = products.filter(prod => {
    if (categoryFilter && prod.category !== categoryFilter) return false;
    const titleVi = prod.shortDescription_vi || prod.shortDescription;
    if (searchQuery && !titleVi.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !prod.shortDescription.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (materialFilter) {
      const mats = prod.refinementMaterials || [];
      if (!mats.some(m => m.toLowerCase() === materialFilter.toLowerCase())) return false;
    }
    if (colorFilter) {
      const cols = prod.refinementColors || [];
      if (!cols.some(c => c.toLowerCase() === colorFilter.toLowerCase())) return false;
    }
    return true;
  });

  if (sortBy === 'price-asc') filtered.sort((a, b) => getProductPriceVal(a) - getProductPriceVal(b));
  else if (sortBy === 'price-desc') filtered.sort((a, b) => getProductPriceVal(b) - getProductPriceVal(a));

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleCatChange = (val: string) => { setCategoryFilter(val); setCurrentPage(1); };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 5) { for (let i = 1; i <= totalPages; i++) pages.push(i); }
    else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  const COLOR_MAP: Record<string, string> = {
    Grey: '#808080', Beige: '#F5F5DC', Brown: '#8B4513',
    Blue: '#325A82', Green: '#4B6E50', Black: '#222',
    White: '#F5F5F5', Red: '#A33E3E',
  };

  return (
    <section className="catalog-section" id="catalog">
      <div className="container">
        <div className="section-header">
          <div>
            <h2 className="section-title">Toàn bộ <span>bộ sưu tập</span></h2>
            <p className="section-tagline">{filtered.length} sản phẩm{categoryFilter ? ` trong danh mục "${categoryFilter}"` : ''}</p>
          </div>

          {/* Category filter pills */}
          <div className="color-filters-bar" style={{ gap: '5px', flexWrap: 'wrap' }}>
            {[{ label: 'Tất cả', value: '' }, ...categories.map((c: { label: string; value: string }) => ({ label: c.label, value: c.value }))].map(({ label, value }) => (
              <button
                key={value}
                className={`filter-select ${categoryFilter === value ? 'active' : ''}`}
                onClick={() => handleCatChange(value)}
                style={{ padding: '8px 16px', background: categoryFilter === value ? 'var(--accent)' : 'none', color: '#fff', borderRadius: '15px', fontSize: '13px' }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="filters-container">
          <div className="filters-group">
            <div className="search-wrapper">
              <input type="text" className="search-input" placeholder="Tìm sản phẩm theo tên..."
                value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }} />
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
              </svg>
            </div>
            <div className="select-wrapper">
              <select className="filter-select" value={materialFilter} onChange={e => { setMaterialFilter(e.target.value); setCurrentPage(1); }}>
                <option value="">Tất cả chất liệu</option>
                <option value="Fabric">Vải bọc đệm</option>
                <option value="Leather">Da thú thật</option>
                <option value="Wood">Gỗ tự nhiên</option>
                <option value="Metal">Khung kim loại</option>
                <option value="Lacquered">Sơn mài</option>
              </select>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
            </div>
            <div className="select-wrapper">
              <select className="filter-select" value={sortBy} onChange={e => { setSortBy(e.target.value); setCurrentPage(1); }}>
                <option value="featured">Sắp xếp: Nổi bật</option>
                <option value="price-asc">Giá: Thấp đến Cao</option>
                <option value="price-desc">Giá: Cao đến Thấp</option>
              </select>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
            </div>
          </div>

          {/* Color filter dots */}
          <div className="color-filters-bar">
            <span className="color-filter-label">Tông màu:</span>
            <button className={`color-badge-btn ${colorFilter === '' ? 'active' : ''}`}
              style={{ backgroundColor: '#fff', border: colorFilter === '' ? '2px solid var(--accent)' : '2px solid transparent' }}
              onClick={() => { setColorFilter(''); setCurrentPage(1); }} title="Tất cả" />
            {Object.entries(COLOR_MAP).map(([color, hex]) => (
              <button key={color}
                className={`color-badge-btn ${colorFilter === color ? 'active' : ''}`}
                style={{ backgroundColor: hex }}
                onClick={() => { setColorFilter(color); setCurrentPage(1); }}
                title={color}
              />
            ))}
          </div>
        </div>

        {/* Skeleton CSS */}
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes skeleton-pulse { 0%,100%{opacity:.6} 50%{opacity:.25} }
          .skeleton-card{border:1px solid var(--border-color);border-radius:12px;background:rgba(255,255,255,.02);overflow:hidden}
          .skeleton-img{height:240px;background:rgba(255,255,255,.05);animation:skeleton-pulse 1.5s infinite ease-in-out}
          .skeleton-text{background:rgba(255,255,255,.05);border-radius:4px;animation:skeleton-pulse 1.5s infinite ease-in-out}
        `}} />

        <div className="products-grid">
          {paginated.length === 0 ? (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '80px 0', color: 'var(--text-secondary)' }}>
              Không tìm thấy sản phẩm nào phù hợp với bộ lọc đã chọn.
            </div>
          ) : (
            paginated.map(prod => {
              let allImages = prod.images || [];
              if (prod.variants) {
                const extraImgs = prod.variants.flatMap((v: any) => v.images || []).filter(Boolean);
                allImages = Array.from(new Set([...allImages, ...extraImgs]));
              }
              // Giới hạn 6 ảnh để vòng lặp không bị quá dài và nặng web
              allImages = allImages.slice(0, 6);

              const titleVi = prod.shortDescription_vi || prod.shortDescription;
              const materialLabel = prod.refinementMaterials_vi?.[0] || prod.refinementMaterials?.[0] || 'Sản phẩm';
              const onSale = isOnSale(prod);
              const lowestFmt = getLowestPriceFormatted(prod);

              return (
                <div className="product-card" key={prod.productId}>
                  <HoverImageSlider 
                    images={allImages} 
                    alt={titleVi} 
                    onSale={onSale}
                    isBestSeller={prod.isBestSeller || false}
                    isNew={prod.isNew || false}
                  />
                  <div className="card-details">
                    <span className="card-category">{prod.category || 'Danish Design'}</span>
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
                            <span className="card-price-label">Giá từ</span>
                            <div className="card-price">{getProductPriceFormatted(prod)}</div>
                          </>
                        )}
                      </div>
                      <Link href={`/products/${prod.productId}`} className="customize-btn">
                        Xem chi tiết
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="5" x2="19" y1="12" y2="12"/><path d="m12 5 7 7-7 7"/>
                        </svg>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', marginTop: '50px', flexWrap: 'wrap' }}>
            <button className="pagination-btn" disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
              style={{ padding: '10px 20px', background: 'rgba(255,255,255,.04)', border: '1px solid var(--border-color)', color: currentPage === 1 ? 'var(--text-muted)' : '#fff', borderRadius: '25px', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', fontSize: '13px' }}>
              Trước
            </button>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              {getPageNumbers().map((page, idx) => page === '...'
                ? <span key={`e-${idx}`} style={{ color: 'var(--text-muted)', padding: '0 8px' }}>...</span>
                : (
                  <button key={`p-${page}`} onClick={() => setCurrentPage(page as number)}
                    style={{ width: '40px', height: '40px', display: 'flex', justifyContent: 'center', alignItems: 'center', background: page === currentPage ? 'var(--accent)' : 'rgba(255,255,255,.04)', border: page === currentPage ? '1px solid var(--accent)' : '1px solid var(--border-color)', color: '#fff', borderRadius: '50%', cursor: 'pointer', fontSize: '14px', fontWeight: page === currentPage ? 600 : 400 }}>
                    {page}
                  </button>
                )
              )}
            </div>
            <button className="pagination-btn" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
              style={{ padding: '10px 20px', background: 'rgba(255,255,255,.04)', border: '1px solid var(--border-color)', color: currentPage === totalPages ? 'var(--text-muted)' : '#fff', borderRadius: '25px', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', fontSize: '13px' }}>
              Sau
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
