'use client';

import React from 'react';

export default function ProductFeatures({ product }: { product: any }) {
  const details = product.variants?.[0]?.details;

  const features: {title: string, desc: string}[] = [];
  if (details?.designFeatures) {
    const rawFeatures = details.designFeatures.split('|');
    for (let i = 0; i < rawFeatures.length; i += 2) {
      if (rawFeatures[i] && rawFeatures[i+1]) {
        const featTitle = rawFeatures[i].replace(/Invisible legs/gi, 'Chân ghế vô hình');
        const featDesc = rawFeatures[i+1].replace(/This adds a visual lightness to the design\./gi, 'Điều này tạo thêm sự thanh thoát và nhẹ nhàng cho tổng thể thiết kế.');
        features.push({ title: featTitle, desc: featDesc });
      }
    }
  }

  if (features.length === 0) return null;

  return (
    <div className="product-features-section" style={{ marginBottom: '80px' }}>
      <h2 style={{ fontSize: '28px', color: 'var(--text-primary)', marginBottom: '32px', textAlign: 'center', letterSpacing: '-0.5px' }}>Đặc điểm thiết kế nổi bật</h2>
      <div style={{ display: 'flex', gap: '24px', overflowX: 'auto', paddingBottom: '16px', scrollbarWidth: 'none', scrollSnapType: 'x mandatory', margin: '0 -8px', padding: '0 8px 16px 8px' }}>
        {features.map((pair, idx) => {
          const totalFeatures = features.length;
          const maxVisible = Math.min(totalFeatures, 5);
          const gaps = maxVisible - 1;
          const flexBasis = totalFeatures <= 5 
            ? `max(200px, calc((100% - ${gaps * 24}px) / ${maxVisible}))`
            : `max(200px, calc((100% - 96px) / 5))`;

          return (
            <div key={idx} style={{ 
              flex: `0 0 ${flexBasis}`, 
              scrollSnapAlign: 'start', 
              background: 'rgba(255,255,255,0.02)', 
              padding: '24px', 
              borderRadius: '12px', 
              border: '1px solid var(--border-color)',
              borderTop: '3px solid var(--accent)', // Just a very subtle accent line instead of heavy colors
              transition: 'transform 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '8px', fontSize: '16px' }}>{pair.title}</strong>
              <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)', textAlign: 'justify', lineHeight: 1.6 }}>{pair.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
