'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { BOCONCEPT_CATALOG, CatalogProduct } from '@/lib/data';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CatalogProduct[]>([]);
  const [activeCategory, setActiveCategory] = useState('');

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const filtered = BOCONCEPT_CATALOG.filter(prod => {
      const titleVi = prod.shortDescription_vi || prod.shortDescription;
      const matchesQuery = 
        titleVi.toLowerCase().includes(query.toLowerCase()) ||
        prod.shortDescription.toLowerCase().includes(query.toLowerCase()) ||
        prod.productId.toLowerCase().includes(query.toLowerCase());
      
      const matchesCategory = activeCategory ? prod.category === activeCategory : true;

      return matchesQuery && matchesCategory;
    });

    setResults(filtered);
  }, [query, activeCategory]);

  const categories = Array.from(new Set(BOCONCEPT_CATALOG.map(p => p.category))).filter(Boolean);

  return (
    <div style={{ padding: '60px 0', minHeight: '80vh', backgroundColor: 'var(--bg-primary)' }}>
      <div className="container" style={{ maxWidth: '1000px' }}>
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <span style={{ color: 'var(--accent)', fontSize: '14px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase' }}>Tìm kiếm nâng cao</span>
          <h1 style={{ fontSize: '40px', fontWeight: 800, marginTop: '8px', color: 'var(--text-primary)', fontFamily: 'var(--font-title)' }}>Bạn đang tìm kiếm gì?</h1>
        </div>

        {/* Khung tìm kiếm lớn */}
        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: '24px',
          padding: '24px',
          boxShadow: 'var(--card-shadow)',
          marginBottom: '30px'
        }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <input 
              type="text" 
              placeholder="Nhập tên sản phẩm, chất liệu, màu sắc hoặc mã SKU..." 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{
                width: '100%',
                height: '60px',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-color)',
                borderRadius: '30px',
                padding: '0 30px 0 60px',
                fontSize: '18px',
                color: 'var(--text-primary)',
                outline: 'none',
                transition: 'all 0.3s ease'
              }}
              autoFocus
            />
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              style={{ position: 'absolute', left: '22px', color: 'var(--text-muted)' }}
            >
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
            </svg>
          </div>

          {/* Lọc danh mục nhanh */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '20px', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginRight: '10px' }}>Bộ lọc nhanh:</span>
            <button 
              onClick={() => setActiveCategory('')}
              style={{
                padding: '8px 16px',
                borderRadius: '20px',
                background: activeCategory === '' ? 'var(--accent)' : 'var(--bg-tertiary)',
                color: '#fff',
                fontSize: '13px',
                fontWeight: 500
              }}
            >
              Tất cả
            </button>
            {categories.map(cat => (
              <button 
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '20px',
                  background: activeCategory === cat ? 'var(--accent)' : 'var(--bg-tertiary)',
                  color: '#fff',
                  fontSize: '13px',
                  fontWeight: 500
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Kết quả tìm kiếm */}
        <div>
          {query.trim() === '' ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
              Nhập từ khóa để bắt đầu tìm kiếm các thiết kế nội thất Scandinavian cao cấp.
            </div>
          ) : results.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)', background: 'var(--bg-secondary)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
              Không tìm thấy kết quả nào phù hợp với từ khóa "{query}".
            </div>
          ) : (
            <div>
              <div style={{ marginBottom: '20px', fontSize: '14px', color: 'var(--text-muted)' }}>
                Tìm thấy <strong>{results.length}</strong> kết quả phù hợp:
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {results.map(prod => {
                  const titleVi = prod.shortDescription_vi || prod.shortDescription;
                  const price = prod.prices && prod.prices[0] ? prod.prices[0].formattedPrice : 'Liên hệ';
                  return (
                    <Link 
                      href={`/kham-pha/${prod.productId}`} 
                      key={prod.productId}
                      style={{
                        display: 'flex',
                        gap: '20px',
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '16px',
                        padding: '16px',
                        transition: 'all 0.3s ease',
                        alignItems: 'center'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'var(--accent)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--border-color)';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      <div style={{ width: '80px', height: '80px', background: 'var(--bg-tertiary)', borderRadius: '12px', padding: '6px', display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}>
                        <img src={prod.images[0]} alt={titleVi} style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
                      </div>
                      <div style={{ flexGrow: 1 }}>
                        <span style={{ fontSize: '11px', color: 'var(--accent)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>{prod.category}</span>
                        <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>{titleVi}</h3>
                        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>Mã sản phẩm: {prod.productId}</p>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--accent)' }}>{price}</div>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Chi tiết →</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
