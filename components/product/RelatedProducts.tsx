'use client';

import React, { useEffect, useState, useRef } from 'react';
import { CatalogProduct } from '@/lib/data';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import { flyToCart } from '@/lib/flyToCart';
import QuickViewDrawer from '@/components/shop/QuickViewDrawer';
import HoverImageSlider from '@/components/ui/HoverImageSlider';

const isOnSale = (p: CatalogProduct) => p.lowestPrices && p.lowestPrices.length > 0 && p.lowestPrices[0].price < (p.prices?.[0]?.price || 0);
const getProductPriceFormatted = (p: CatalogProduct) => p.prices?.[0]?.formattedPrice || 'Liên hệ';
const getLowestPriceFormatted = (p: CatalogProduct) => p.lowestPrices?.[0]?.formattedPrice || '';

export default function RelatedProducts({ currentProductId, category }: { currentProductId: string, category: string }) {
  const { addToCart, wishlist, toggleWishlist } = useStore();
  const [related, setRelated] = useState<CatalogProduct[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<CatalogProduct | null>(null);

  const openQuickView = (e: React.MouseEvent, prod: CatalogProduct) => {
    e.stopPropagation();
    e.preventDefault();
    setQuickViewProduct(prod);
    setIsQuickViewOpen(true);
  };

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/products');
        if (res.ok) {
          const all: CatalogProduct[] = await res.json();
          // Lấy 10 sản phẩm để có thể cuộn
          const filtered = all.filter(p => p.category === category && p.productId !== currentProductId).slice(0, 10);
          if (filtered.length < 10) {
            const more = all.filter(p => p.productId !== currentProductId && !filtered.find(f => f.productId === p.productId)).slice(0, 10 - filtered.length);
            setRelated([...filtered, ...more]);
          } else {
            setRelated(filtered);
          }
        }
      } catch (e) {}
    }
    load();
  }, [currentProductId, category]);

  if (related.length === 0) return null;

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const cardWidth = scrollRef.current.firstElementChild?.clientWidth || 240;
      const scrollAmount = cardWidth * 2; // Cuộn 2 card mỗi lần bấm
      scrollRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="related-products-section" style={{ marginTop: '80px', position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', margin: 0 }}>Có thể bạn sẽ thích</h2>
        {related.length > 5 && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => scroll('left')} style={{ width: '40px', height: '40px', borderRadius: '50%', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            <button onClick={() => scroll('right')} style={{ width: '40px', height: '40px', borderRadius: '50%', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            </button>
          </div>
        )}
      </div>

      <div 
        ref={scrollRef}
        style={{ 
          display: 'flex', 
          gap: '0px', 
          overflowX: 'auto', 
          scrollSnapType: 'x mandatory', 
          paddingBottom: '16px',
          scrollbarWidth: 'none', // Ẩn scrollbar trên Firefox
          msOverflowStyle: 'none', // Ẩn scrollbar trên IE/Edge
        }}
      >
        <style dangerouslySetInnerHTML={{ __html: `
          .related-products-section ::-webkit-scrollbar { display: none; }
        `}} />
        
        {related.map(prod => {
          let allImages = prod.images || [];
          if (prod.variants) {
            const extraImgs = prod.variants.flatMap((v: any) => v.images || []).filter(Boolean);
            allImages = Array.from(new Set([...allImages, ...extraImgs]));
          }
          allImages = allImages.slice(0, 6);
          
          const titleVi = prod.shortDescription_vi || prod.shortDescription;
          const materialLabel = prod.refinementMaterials_vi?.[0] || prod.refinementMaterials?.[0] || 'Sản phẩm';
          const onSale = isOnSale(prod);
          const lowestFmt = getLowestPriceFormatted(prod);
          const isFavorite = wishlist.includes(prod.productId);
          
          return (
            <Link 
              href={`/kham-pha/${prod.productId}`} 
              key={prod.productId} 
              style={{ textDecoration: 'none', color: 'inherit', flexShrink: 0, width: 'calc((100% - 80px) / 5)', scrollSnapAlign: 'start', minWidth: '240px' }} 
            >
              <div className="product-card">
                <HoverImageSlider 
                  images={allImages} 
                  alt={titleVi} 
                  onSale={onSale}
                  isBestSeller={prod.isBestSeller || false}
                  isNew={prod.isNew || false}
                  discountType={prod.discountType}
                  discountValue={prod.discountValue}
                />
                
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
                          <span className="card-price-label">Giá từ</span>
                          <div className="card-price">{getProductPriceFormatted(prod)}</div>
                        </>
                      )}
                    </div>
                        {/*
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
                              price: prod.lowestPrices?.[0]?.price || prod.prices?.[0]?.price || 0,
                              variantTags: defaultTags.length > 0 ? defaultTags : undefined
                            });
                            flyToCart(e, img1);
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
                        </button>
                        */}
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <QuickViewDrawer 
        product={quickViewProduct} 
        isOpen={isQuickViewOpen} 
        onClose={() => setIsQuickViewOpen(false)} 
      />
    </div>
  );
}
