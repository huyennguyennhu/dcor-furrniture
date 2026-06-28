'use client';

import React, { useState, useEffect } from 'react';

interface HoverImageSliderProps {
  images: string[];
  alt: string;
  onSale?: boolean;
  isBestSeller?: boolean;
  isNew?: boolean;
  discountType?: 'PERCENTAGE' | 'AMOUNT' | string;
  discountValue?: number;
}

export default function HoverImageSlider({ images, alt, onSale, isBestSeller, isNew, discountType, discountValue }: HoverImageSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isHovered && images.length > 1) {
      interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % images.length);
      }, 1200); // Đổi ảnh mỗi 1.2 giây
    } else {
      setCurrentIndex(0);
    }
    return () => clearInterval(interval);
  }, [isHovered, images.length]);

  const validImages = images.length > 0 ? images : [''];

  return (
    <div 
      className="card-image-area"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ position: 'relative' }}
    >
      {validImages.map((img, idx) => (
        <img 
          key={idx}
          className="img-slider-item" 
          src={img} 
          alt={alt} 
          loading={idx === 0 ? 'lazy' : 'eager'} 
          style={{
            position: 'absolute',
            top: 0, left: 0, width: '100%', height: '100%',
            opacity: currentIndex === idx ? 1 : 0,
            transition: 'opacity 0.6s ease-in-out',
            zIndex: currentIndex === idx ? 1 : 0
          }}
        />
      ))}
      <div className="product-badges" style={{ zIndex: 10 }}>
        {onSale ? (
          <span className="badge-tag badge-sale">
            {discountType && discountValue ? (discountType === 'PERCENTAGE' ? `Giảm ${discountValue}%` : `Giảm ${new Intl.NumberFormat('vi-VN').format(discountValue)}đ`) : 'Sale'}
          </span>
        ) : isBestSeller ? (
          <span className="badge-tag badge-bestseller">Bán chạy</span>
        ) : isNew ? (
          <span className="badge-tag badge-new">Mới</span>
        ) : null}
      </div>
    </div>
  );
}
