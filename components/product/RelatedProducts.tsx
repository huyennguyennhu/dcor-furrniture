'use client';

import React, { useEffect, useState, useRef } from 'react';
import { CatalogProduct } from '@/lib/data';
import Link from 'next/link';

export default function RelatedProducts({ currentProductId, category }: { currentProductId: string, category: string }) {
  const [related, setRelated] = useState<CatalogProduct[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

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
          gap: '20px', 
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
          const price = prod.prices?.[0]?.formattedPrice || 'Liên hệ';
          const title = prod.shortDescription_vi || prod.shortDescription;
          const img = prod.images?.[0] || '';
          
          return (
            <Link 
              href={`/kham-pha/${prod.productId}`} 
              key={prod.productId} 
              style={{ textDecoration: 'none', color: 'inherit', flexShrink: 0, width: 'calc((100% - 80px) / 5)', scrollSnapAlign: 'start', minWidth: '200px' }} 
              className="product-card"
            >
              <div style={{ background: 'var(--bg-secondary)', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)', transition: 'transform 0.3s' }}>
                <div style={{ aspectRatio: '1', padding: '20px', background: 'rgba(255,255,255,0.02)' }}>
                  <img src={img} alt={title} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
                <div style={{ padding: '16px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>{prod.category}</div>
                  <div style={{ fontWeight: 600, marginBottom: '8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '14px' }}>{title}</div>
                  <div style={{ color: 'var(--accent)', fontWeight: 700, fontSize: '14px' }}>{price}</div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
