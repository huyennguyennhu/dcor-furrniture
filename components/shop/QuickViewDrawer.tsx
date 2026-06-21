'use client';

import React, { useEffect, useState } from 'react';
import { CatalogProduct } from '@/lib/data';
import ProductGallery from '@/components/product/ProductGallery';
import { useStore } from '@/lib/store';

interface QuickViewDrawerProps {
  product: CatalogProduct | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function QuickViewDrawer({ product, isOpen, onClose }: QuickViewDrawerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [showAnim, setShowAnim] = useState(false);
  const addToCart = useStore(state => state.addToCart);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setShowAnim(true));
      });
      // Prevent layout shift from scrollbar disappearing
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    } else {
      setShowAnim(false);
      setTimeout(() => {
        setIsVisible(false);
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
      }, 400);
    }
    return () => { 
      document.body.style.overflow = ''; 
      document.body.style.paddingRight = '';
    };
  }, [isOpen]);

  if (!isOpen && !isVisible) return null;

  const titleVi = product?.shortDescription_vi || product?.shortDescription;
  const originalPrice = product?.prices?.[0]?.price || 0;
  const currentPrice = product?.lowestPrices?.[0]?.price || originalPrice;
  const img = product?.images?.[0] || '';

  return (
    <>
      <div 
        className={`drawer-backdrop ${showAnim ? 'open' : ''}`} 
        onClick={onClose}
      />
      <div className={`quick-view-drawer ${showAnim ? 'open' : ''}`}>
        <div className="drawer-header">
          <h3>Xem nhanh</h3>
          <button className="close-btn" onClick={onClose}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>
        
        {product && (
          <div className="drawer-content quick-view-content">
            <div className="qv-image" style={{ width: '75%', margin: '0 auto 24px', background: 'transparent' }}>
              <ProductGallery images={product.images || [img]} name={titleVi || ''} product={product} />
            </div>
            
            <div className="qv-info">
              <span className="qv-category">{product.category}</span>
              <h2 className="qv-title">{titleVi}</h2>
              <div className="qv-price" style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '32px' }}>
                <span style={{ color: 'var(--text-primary)', fontSize: '24px', fontWeight: 800 }}>
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(currentPrice)}
                </span>
                {product.discountValue && product.discountValue > 0 && (
                  <span style={{ fontSize: '16px', color: 'var(--text-muted)', textDecoration: 'line-through', fontWeight: 300 }}>
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(originalPrice)}
                  </span>
                )}
                {product.discountValue && product.discountValue > 0 && (
                  <span style={{ background: 'var(--accent)', color: '#fff', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 700 }}>
                    {product.discountType === 'PERCENTAGE' ? `Giảm ${product.discountValue}%` : `Giảm ${new Intl.NumberFormat('vi-VN').format(product.discountValue)}đ`}
                  </span>
                )}
              </div>
              
              <div className="qv-attributes">
                <div className="qv-attr">
                  <span className="qv-attr-label">Danh mục:</span>
                  <span style={{ fontWeight: 500 }}>{product.category || 'Sản phẩm'}</span>
                </div>
                <div className="qv-attr">
                  <span className="qv-attr-label">Mã sản phẩm:</span>
                  <span style={{ fontFamily: 'monospace', fontWeight: 500 }}>{product.id}</span>
                </div>
                <div className="qv-attr">
                  <span className="qv-attr-label">Phiên bản:</span>
                  <span style={{ fontWeight: 500 }}>{product.variants?.length ? `${product.variants.length} lựa chọn` : 'Tiêu chuẩn'}</span>
                </div>
              </div>

              <div className="qv-actions">
                <button 
                  className="qv-add-btn"
                  onClick={() => {
                    const defaultTags: {label: string, value: string}[] = [];
                    if (product.refinementColors_vi?.length || product.refinementColors?.length) {
                      defaultTags.push({ label: 'Màu sắc', value: product.refinementColors_vi?.[0] || product.refinementColors?.[0] || '' });
                    }
                    if (product.refinementMaterials_vi?.length || product.refinementMaterials?.length) {
                      defaultTags.push({ label: 'Chất liệu', value: product.refinementMaterials_vi?.[0] || product.refinementMaterials?.[0] || '' });
                    }

                    addToCart({
                      productId: product.productId,
                      name: titleVi || '',
                      image: img,
                      price: product.prices?.[0]?.price || 0,
                      variantTags: defaultTags.length > 0 ? defaultTags : undefined
                    });
                    onClose();
                  }}
                >
                  Thêm vào giỏ hàng
                </button>
                <a href={`/kham-pha/${product.productId}`} className="qv-detail-link">
                  Khám phá chi tiết
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
