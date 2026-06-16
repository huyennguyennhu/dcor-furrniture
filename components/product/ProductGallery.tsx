'use client';

import React, { useState, useEffect } from 'react';

export default function ProductGallery({ images, name }: { images: string[], name: string }) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setActiveIndex(0);
  }, [images]);

  if (!images || images.length === 0) return null;

  const handlePrev = () => setActiveIndex(prev => (prev === 0 ? images.length - 1 : prev - 1));
  const handleNext = () => setActiveIndex(prev => (prev === images.length - 1 ? 0 : prev + 1));

  return (
    <div className="product-gallery">
      <div className="main-image-wrapper" style={{ position: 'relative' }}>
        <img 
          src={images[activeIndex] || images[0]} 
          alt={`${name} - Ảnh ${activeIndex + 1}`} 
          className="main-image"
          style={{ width: '100%', height: 'auto', aspectRatio: '4/3', objectFit: 'contain', borderRadius: '16px', background: 'var(--bg-secondary)' }}
        />
        {/* Mock Badge */}
        <div className="gallery-badges" style={{ position: 'absolute', top: '16px', left: '16px', display: 'flex', gap: '8px' }}>
          <span className="badge-tag badge-sale">Bán chạy</span>
          <span className="badge-tag">Mới</span>
        </div>

        {/* Navigation Buttons */}
        {images.length > 1 && (
          <>
            <button 
              onClick={handlePrev}
              style={{ position: 'absolute', top: '50%', left: '16px', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.8)', color: '#000', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            <button 
              onClick={handleNext}
              style={{ position: 'absolute', top: '50%', right: '16px', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.8)', color: '#000', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            </button>
          </>
        )}
      </div>
      
      {images.length > 1 && (
        <div className="thumbnails-row" style={{ display: 'flex', gap: '12px', marginTop: '16px', overflowX: 'auto', paddingBottom: '8px', justifyContent: 'center' }}>
          {images.map((img, idx) => (
            <div 
              key={idx}
              className={`thumbnail-item ${idx === activeIndex ? 'active' : ''}`}
              onClick={() => setActiveIndex(idx)}
              style={{
                width: '80px', height: '80px', flexShrink: 0,
                borderRadius: '8px', overflow: 'hidden', cursor: 'pointer',
                border: idx === activeIndex ? '2px solid var(--accent)' : '2px solid transparent',
                background: 'var(--bg-secondary)',
                opacity: idx === activeIndex ? 1 : 0.6,
                transition: 'all 0.2s'
              }}
            >
              <img src={img} alt={`Thumbnail ${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
