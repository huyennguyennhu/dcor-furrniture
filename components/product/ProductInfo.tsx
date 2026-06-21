'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { CatalogProduct } from '@/lib/data';
import { useStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { flyToCart } from '@/lib/flyToCart';

function buildDynamicOptions(product: any) {
  const configOptions = product.configOptions || [];
  if (!configOptions || configOptions.length === 0) return null;

  const groups: Record<string, { id: string, label: string, image?: string }[]> = {};
  
  const keyNames: Record<string, string> = {
    'vaMaterialLegStyle': 'Chân ghế',
    'vaMaterialUpholstery': 'Bọc ghế / Chất liệu',
    'vaSofaDirection': 'Hướng góc',
    'vaSize': 'Kích thước',
    'vaColor': 'Màu sắc',
    'vaColour': 'Màu sắc',
    'vaConfigurationSize': 'Cấu hình / Kích thước',
    'vaMaterialTabletop': 'Mặt bàn',
    'vaMaterialLeg': 'Chân',
    'vaMattressSize': 'Kích thước nệm',
    'vaMaterial': 'Chất liệu',
    'vaFunction': 'Chức năng',
    'vaMaterialSeat': 'Chất liệu ghế',
    'vaMotionOption': 'Tùy chọn chuyển động',
    'vaRugShape': 'Hình dáng thảm',
    'vaMaterialLamp': 'Chất liệu đèn',
    'vaMaterialShell': 'Vỏ bọc ngoài',
    'vaMaterialCabinet': 'Chất liệu tủ kệ',
    'vaSlatsIncluded': 'Bao gồm rạt giường'
  };

  configOptions.forEach((group: any) => {
    const k = group.groupId;
    const options = group.options || [];
    groups[k] = options.map((opt: any) => ({
      id: opt.id,
      label: opt.name || opt.id,
      image: opt.image || ''
    }));
  });

  return { keys: Object.keys(groups), names: keyNames, groups };
}

export default function ProductInfo({ product, onImagesChange }: { product: any, onImagesChange?: (images: string[]) => void }) {
  const { addToCart, wishlist, toggleWishlist } = useStore();
  const isFavorite = wishlist.includes(product.productId);
  const router = useRouter();

  const title = product.shortDescription_vi || product.shortDescription;
  const basePrice = product.prices?.[0]?.price || 0;
  const lowestPrice = product.lowestPrices?.[0]?.price || 0;
  
  const dynamicConfig = useMemo(() => buildDynamicOptions(product), [product]);
  const hasDynamicVariants = dynamicConfig && dynamicConfig.keys.length > 0;

  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});

  const filteredVariantPrices = useMemo(() => {
    return (product.variants || []).filter((v: any) => v.images && v.images.length > 0);
  }, [product.variants]);

  useEffect(() => {
    if (hasDynamicVariants && filteredVariantPrices.length > 0) {
      const cheapestVariant = [...filteredVariantPrices].sort((a, b) => (a.price || 0) - (b.price || 0))[0];
      setSelectedOptions(cheapestVariant.selections || {});
    }
  }, [hasDynamicVariants, filteredVariantPrices]);

  const matchedVariant = useMemo(() => {
    if (!hasDynamicVariants || !filteredVariantPrices) return null;
    return filteredVariantPrices.find((v: any) => {
      const sel = v.selections || {};
      return Object.keys(selectedOptions).every(k => sel[k] === selectedOptions[k]);
    }) || null;
  }, [selectedOptions, filteredVariantPrices, hasDynamicVariants]);

  useEffect(() => {
    if (onImagesChange) {
      if (matchedVariant && matchedVariant.images && matchedVariant.images.length > 0) {
        onImagesChange(matchedVariant.images);
      } else {
        onImagesChange(product.images || []);
      }
    }
  }, [matchedVariant, product.images, onImagesChange]);

  const handleSelectOption = (groupKey: string, optionId: string) => {
    const newOptions = { ...selectedOptions, [groupKey]: optionId };
    const comboExists = filteredVariantPrices.some((v: any) => {
      const sel = v.selections || {};
      return Object.keys(newOptions).every(k => sel[k] === newOptions[k]);
    });
    if (!comboExists && filteredVariantPrices) {
      const fallbackVariant = filteredVariantPrices.find((v: any) => v.selections?.[groupKey] === optionId);
      if (fallbackVariant && fallbackVariant.selections) setSelectedOptions(fallbackVariant.selections);
      else setSelectedOptions(newOptions);
    } else {
      setSelectedOptions(newOptions);
    }
  };

  const currentPrice = matchedVariant?.price || Math.max(lowestPrice, basePrice);

  const handleAddToCart = (e: React.MouseEvent) => {
    const variantTags: { label: string; value: string }[] = [];
    
    if (hasDynamicVariants) {
      dynamicConfig.keys.forEach(groupKey => {
        const groupName = dynamicConfig.names[groupKey] || groupKey;
        const options = dynamicConfig.groups[groupKey] || [];
        const selectedId = selectedOptions[groupKey];
        if (selectedId) {
          const opt = options.find((o: any) => o.id === selectedId);
          if (opt) variantTags.push({ label: groupName, value: opt.label || (opt as any).name || selectedId });
        }
      });
    } else if (selectedColor) {
      variantTags.push({ label: 'Màu sắc', value: colors[rawColors.indexOf(selectedColor)] || selectedColor });
    }

    const productImage = (matchedVariant && matchedVariant.images && matchedVariant.images[0]) || product.images?.[0] || '';

    addToCart({
      productId: product.productId,
      name: title,
      image: productImage,
      price: currentPrice,
      variantTags
    });
    flyToCart(e, productImage);
  };

  const COLOR_MAP: Record<string, string> = {
    beige: '#D4C3A3', grey: '#8C8C8C', blue: '#325A82', green: '#4B6E50',
    brown: '#6E4D3B', white: '#FAF5EF', black: '#1A1A1A', red: '#A33E3E',
    yellow: '#D4AF37', orange: '#D47A37', pink: '#D48CAD', purple: '#5F3F6D'
  };

  const colors = product.refinementColors_vi || product.refinementColors || [];
  const rawColors = product.refinementColors || [];
  const [selectedColor, setSelectedColor] = useState<string>(rawColors[0] || '');

  return (
    <div className="product-info-panel">
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
        <h1 style={{ fontSize: '36px', fontWeight: 700, letterSpacing: '-1px', margin: 0 }}>{title}</h1>
      </div>
      <div className="product-rating" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', color: 'var(--text-secondary)', fontSize: '14px' }}>
        <span style={{ color: '#FFD700', fontSize: '16px' }}>★★★★★</span>
        <span style={{ fontWeight: 600 }}>4.8</span>
      </div>

      {/* 2. Giá */}
      <div className="product-price-section" style={{ marginBottom: '32px' }}>
        <div style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '4px' }}>
          Giá
        </div>
        <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'baseline', gap: '16px' }}>
          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(currentPrice)}
          {product.discountValue && product.discountValue > 0 && (
            <span style={{ fontSize: '16px', color: 'var(--text-muted)', textDecoration: 'line-through', fontWeight: 300 }}>
              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.discountType === 'PERCENTAGE' ? currentPrice / (1 - product.discountValue / 100) : currentPrice + product.discountValue)}
            </span>
          )}
        </div>
      </div>

      {/* 3. Tùy chọn động từ Supabase (variantPrices) */}
      {hasDynamicVariants ? (
        <div className="dynamic-options-wrapper" style={{ marginBottom: '32px' }}>
          {dynamicConfig.keys.map(groupKey => {
            const groupName = dynamicConfig.names[groupKey] || groupKey;
            const options = dynamicConfig.groups[groupKey] || [];
            const selectedId = selectedOptions[groupKey];
            const isColorOrMaterial = groupKey.toLowerCase().includes('color') || groupKey.toLowerCase().includes('upholstery');

            return (
              <div key={groupKey} className="option-section" style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span style={{ fontWeight: 600 }}>{groupName}</span>
                  <span style={{ color: 'var(--text-secondary)' }}>{options.find(o => o.id === selectedId)?.label || 'Chưa chọn'}</span>
                </div>
                
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                  {options.map(opt => {
                    const isSelected = selectedId === opt.id;
                    if (isColorOrMaterial) {
                      if (!opt.image) return null;
                      return (
                        <button
                          key={opt.id}
                          onClick={() => handleSelectOption(groupKey, opt.id)}
                          title={opt.label}
                          style={{
                            width: '48px', height: '48px', borderRadius: '50%', overflow: 'hidden', padding: 0, margin: '4px',
                            border: isSelected ? '3px solid var(--accent)' : '2px solid rgba(255,255,255,0.2)',
                            boxShadow: isSelected ? '0 0 12px rgba(224,86,36,0.4)' : 'none',
                            cursor: 'pointer', transition: 'all 0.2s', transform: isSelected ? 'scale(1.1)' : 'scale(1)'
                          }}
                        >
                          <img src={opt.image} alt={opt.label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </button>
                      );
                    }
                    return (
                      <button 
                        key={opt.id}
                        onClick={() => handleSelectOption(groupKey, opt.id)}
                        style={{
                          padding: isSelected ? '11px 19px' : '12px 20px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)',
                          border: isSelected ? '2px solid var(--accent)' : '1px solid var(--border-color)',
                          color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                          cursor: 'pointer', transition: 'all 0.2s', textAlign: 'center'
                        }}
                      >
                        <div style={{ fontWeight: 600 }}>{opt.label}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Fallback: Hiển thị màu sắc có sẵn nếu không có biến thể động */
        colors.length > 0 && (
          <div className="option-section" style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontWeight: 600 }}>Màu sắc</span>
              <span style={{ color: 'var(--text-secondary)' }}>{colors[rawColors.indexOf(selectedColor)] || selectedColor}</span>
            </div>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {rawColors.map((color: string, idx: number) => {
                const hex = COLOR_MAP[color.toLowerCase()] || '#888';
                const isSelected = selectedColor === color;
                return (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    title={colors[idx] || color}
                    style={{
                      width: '40px', height: '40px', borderRadius: '50%', backgroundColor: hex,
                      border: isSelected ? '3px solid var(--accent)' : '2px solid rgba(255,255,255,0.2)',
                      boxShadow: isSelected ? '0 0 12px rgba(224,86,36,0.4)' : 'none',
                      cursor: 'pointer', transition: 'all 0.2s', transform: isSelected ? 'scale(1.1)' : 'scale(1)'
                    }}
                  />
                )
              })}
            </div>
          </div>
        )
      )}

      {/* 6. CTAs */}
      <div className="product-actions" style={{ display: 'flex', gap: '16px', marginBottom: '32px' }}>
        <button 
          onClick={handleAddToCart}
          style={{ flex: 1, padding: '16px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s', boxShadow: '0 8px 24px rgba(224, 86, 36, 0.4)' }}
        >
          Thêm vào giỏ hàng
        </button>
        <button 
          title="Yêu thích"
          onClick={() => toggleWishlist(product.productId)}
          style={{ width: '56px', height: '56px', flexShrink: 0, background: 'rgba(255,255,255,0.03)', color: isFavorite ? 'var(--accent)' : 'var(--text-primary)', border: isFavorite ? '1.5px solid var(--accent)' : '1.5px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--accent)'; e.currentTarget.style.borderColor = 'var(--accent)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = isFavorite ? 'var(--accent)' : 'var(--text-primary)'; e.currentTarget.style.borderColor = isFavorite ? 'var(--accent)' : 'var(--border-color)'; }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill={isFavorite ? 'var(--accent)' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
          </svg>
        </button>
        <button 
          title="Thử đặt sản phẩm này vào phòng của bạn (Room Planner)"
          onClick={() => router.push(`/thiet-ke/room-planner?product=${product.productId}`)}
          style={{ width: '56px', height: '56px', flexShrink: 0, background: 'rgba(255,255,255,0.03)', color: 'var(--text-primary)', border: '1.5px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--accent)'; e.currentTarget.style.borderColor = 'var(--accent)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = 'var(--border-color)'; }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m9.06 11.9 8.07-8.06a2.85 2.85 0 1 1 4.03 4.03l-8.06 8.08"/>
            <path d="M7.07 14.94c-1.66 0-3 1.35-3 3.02 0 1.33-2.5 1.52-2 2.02 1.08 1.1 2.49 2.02 4 2.02 2.2 0 4-1.8 4-4.04a3.01 3.01 0 0 0-3-3.02z"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
