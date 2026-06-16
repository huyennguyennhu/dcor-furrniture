'use client';

import React, { useEffect, useState } from 'react';
import { CatalogProduct } from '@/lib/data';
import { useStore } from '@/lib/store';

interface QuickViewDrawerProps {
  product: CatalogProduct | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function QuickViewDrawer({ product, isOpen, onClose }: QuickViewDrawerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const addToCart = useStore(state => state.addToCart);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      document.body.style.overflow = 'hidden';
    } else {
      setTimeout(() => setIsVisible(false), 300);
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen && !isVisible) return null;

  const titleVi = product?.shortDescription_vi || product?.shortDescription;
  const price = product?.prices?.[0]?.formattedPrice || 'Liên hệ';
  const img = product?.images?.[0] || '';

  return (
    <>
      <div 
        className={`drawer-backdrop ${isOpen ? 'open' : ''}`} 
        onClick={onClose}
      />
      <div className={`quick-view-drawer ${isOpen ? 'open' : ''}`}>
        <div className="drawer-header">
          <h3>Xem nhanh</h3>
          <button className="close-btn" onClick={onClose}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>
        
        {product && (
          <div className="drawer-content quick-view-content">
            <div className="qv-image">
              <img src={img} alt={titleVi} />
            </div>
            
            <div className="qv-info">
              <span className="qv-category">{product.category}</span>
              <h2 className="qv-title">{titleVi}</h2>
              <div className="qv-price">{price}</div>
              
              <div className="qv-attributes">
                <div className="qv-attr">
                  <span className="qv-attr-label">Màu sắc:</span>
                  <div className="qv-colors">
                    {product.refinementColors?.slice(0,4).map((c, i) => (
                      <span key={i} className="qv-color-dot" title={c}></span>
                    )) || <span>Đa dạng</span>}
                  </div>
                </div>
                <div className="qv-attr">
                  <span className="qv-attr-label">Chất liệu:</span>
                  <span>{product.refinementMaterials_vi?.[0] || product.refinementMaterials?.[0] || 'Tùy chỉnh'}</span>
                </div>
                <div className="qv-attr">
                  <span className="qv-attr-label">Tình trạng:</span>
                  <span style={{ color: 'var(--success, #38A169)' }}>Còn hàng</span>
                </div>
              </div>

              <div className="qv-actions">
                <button 
                  className="qv-add-btn"
                  onClick={() => {
                    addToCart({
                      productId: product.productId,
                      name: titleVi || '',
                      image: img,
                      price: product.prices?.[0]?.price || 0,
                    });
                    onClose();
                  }}
                >
                  Thêm vào giỏ hàng
                </button>
                <a href={`/products/${product.productId}`} className="qv-detail-link">
                  Xem chi tiết đầy đủ
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
