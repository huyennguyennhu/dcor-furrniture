'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { CatalogProduct } from '@/lib/data';
import ProductGallery from '@/components/product/ProductGallery';
import { useStore } from '@/lib/store';
import { flyToCart } from '@/lib/flyToCart';
import CustomSelect from '@/components/ui/CustomSelect';

interface QuickViewDrawerProps {
  product: CatalogProduct | null;
  isOpen: boolean;
  onClose: () => void;
}

// Helper to extract variant groups
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

export default function QuickViewDrawer({ product, isOpen, onClose }: QuickViewDrawerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [showAnim, setShowAnim] = useState(false);
  const addToCart = useStore(state => state.addToCart);

  const COLOR_MAP: Record<string, string> = {
    beige: '#D4C3A3', grey: '#8C8C8C', blue: '#325A82', green: '#4B6E50',
    brown: '#6E4D3B', white: '#FAF5EF', black: '#1A1A1A', red: '#A33E3E',
    yellow: '#D4AF37', orange: '#D47A37', pink: '#D48CAD', purple: '#5F3F6D'
  };

  const [fullProduct, setFullProduct] = useState<any>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  useEffect(() => {
    if (isOpen && product?.productId) {
      setIsLoadingDetails(true);
      fetch(`/api/products/${product.productId}`)
        .then(res => res.json())
        .then(data => setFullProduct(data))
        .catch(err => console.error(err))
        .finally(() => setIsLoadingDetails(false));
    } else {
      setFullProduct(null);
      setSelectedOptions({});
    }
  }, [isOpen, product]);

  const activeProduct = fullProduct || product;

  const dynamicConfig = useMemo(() => activeProduct ? buildDynamicOptions(activeProduct) : null, [activeProduct]);
  const hasDynamicVariants = dynamicConfig && dynamicConfig.keys.length > 0;
  
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);

  const filteredVariantPrices = useMemo(() => {
    return (activeProduct?.variants || []).filter((v: any) => v.images && v.images.length > 0);
  }, [activeProduct?.variants]);

  const rawColors = (activeProduct as any)?.refinementColors || [];
  const colors = (activeProduct as any)?.refinementColors_vi || rawColors;
  const [selectedColor, setSelectedColor] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setShowAnim(true));
      });
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = `${scrollbarWidth}px`;
      
      // Reset state on open
      setQuantity(1);
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

  useEffect(() => {
    if (hasDynamicVariants && filteredVariantPrices.length > 0) {
      const firstVariant = filteredVariantPrices[0];
      setSelectedOptions(firstVariant.selections || {});
    } else if (rawColors.length > 0) {
      setSelectedColor(rawColors[0]);
    }
  }, [hasDynamicVariants, filteredVariantPrices, rawColors]);

  const matchedVariant = useMemo(() => {
    if (!hasDynamicVariants || !filteredVariantPrices) return null;
    return filteredVariantPrices.find((v: any) => {
      const sel = v.selections || {};
      return Object.keys(selectedOptions).every(k => sel[k] === selectedOptions[k]);
    }) || null;
  }, [selectedOptions, filteredVariantPrices, hasDynamicVariants]);

  const handleSelectOption = (groupKey: string, optionId: string) => {
    const newOptions = { ...selectedOptions, [groupKey]: optionId };
    const comboExists = filteredVariantPrices.some((v: any) => {
      const sel = v.selections || {};
      return Object.keys(newOptions).every(k => sel[k] === newOptions[k]);
    });
    if (!comboExists && filteredVariantPrices.length > 0) {
      const fallbackVariant = filteredVariantPrices.find((v: any) => v.selections?.[groupKey] === optionId);
      if (fallbackVariant) {
        setSelectedOptions(fallbackVariant.selections || {});
        return;
      }
    }
    setSelectedOptions(newOptions);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    if (!product) return;
    const titleVi = product.shortDescription_vi || product.shortDescription;
    
    let variantTags: {label: string, value: string}[] | undefined = undefined;
    if (hasDynamicVariants && matchedVariant) {
      variantTags = dynamicConfig?.keys
        .filter(k => (dynamicConfig.groups[k]?.length || 0) > 1)
        .map(k => {
          const selId = selectedOptions[k];
          const opt = dynamicConfig.groups[k]?.find(o => o.id === selId);
          return { label: dynamicConfig.names[k] || k, value: opt?.label || selId };
        });
      
      // Prevent empty array
      if (variantTags?.length === 0) variantTags = undefined;
    } else if (!hasDynamicVariants && selectedColor && rawColors.length > 1) {
      const selectedIdx = rawColors.indexOf(selectedColor);
      const selectedLabel = colors[selectedIdx] || selectedColor;
      variantTags = [{ label: 'Màu sắc', value: selectedLabel }];
    }

    addToCart({
      productId: product.productId,
      name: titleVi || '',
      image: (matchedVariant?.images?.[0]) || product.images?.[0] || '',
      price: currentPrice, // Add current price instead of default
      variantTags: variantTags,
      quantity: quantity
    });

    flyToCart(e);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  if (!isOpen && !isVisible) return null;

  const titleVi = activeProduct?.shortDescription_vi || activeProduct?.shortDescription;
  const basePrice = matchedVariant ? matchedVariant.price : (activeProduct?.prices?.[0]?.price || 0);
  const discountVal = activeProduct?.discountValue || 0;
  const isPercentage = activeProduct?.discountType === 'PERCENTAGE';
  const currentPrice = discountVal > 0 
    ? (isPercentage ? basePrice * (1 - discountVal / 100) : Math.max(0, basePrice - discountVal))
    : basePrice;
  const originalPrice = basePrice;

  const minBasePrice = activeProduct?.lowestPrices?.[0]?.price || activeProduct?.prices?.[0]?.price || 0;
  const minCurrentPrice = discountVal > 0 
    ? (isPercentage ? minBasePrice * (1 - discountVal / 100) : Math.max(0, minBasePrice - discountVal))
    : minBasePrice;

  const img = activeProduct?.images?.[0] || '';
  
  const dimensionData = matchedVariant?.dimensions || (activeProduct as any)?.dimensions;
  const DimensionsTable = dimensionData && Object.keys(dimensionData).length > 0 ? (
    <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid var(--border-color)' }}>
      <h3 style={{ fontSize: '18px', color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--accent)' }}><path d="M4 10h16"/><path d="M4 14h16"/><path d="M2 12h20"/></svg>
        Kích thước & Khối lượng
      </h3>
      <table className="qv-dimensions-table">
        <tbody>
          {dimensionData.height && <tr><th>Chiều cao</th><td>{dimensionData.height}</td></tr>}
          {dimensionData.width && <tr><th>Chiều rộng</th><td>{dimensionData.width}</td></tr>}
          {dimensionData.depth && <tr><th>Chiều sâu</th><td>{dimensionData.depth}</td></tr>}
          {dimensionData.seatingHeight && <tr><th>Chiều cao chỗ ngồi</th><td>{dimensionData.seatingHeight}</td></tr>}
          {dimensionData.armrestHeight && <tr><th>Chiều cao tay vịn</th><td>{dimensionData.armrestHeight}</td></tr>}
          {dimensionData.legsHeight && <tr><th>Chiều cao chân</th><td>{dimensionData.legsHeight}</td></tr>}
          {dimensionData.weight && <tr><th>Trọng lượng</th><td>{dimensionData.weight}</td></tr>}
        </tbody>
      </table>
    </div>
  ) : null;

  return (
    <>
      <div 
        className={`drawer-backdrop ${showAnim ? 'open' : ''}`} 
        onClick={onClose}
      />
      <div className={`quick-view-drawer ${showAnim ? 'open' : ''}`}>
        <div className="drawer-header">
          <h3>Xem nhanh</h3>
          <button className="close-btn" onClick={onClose} style={{ cursor: 'pointer', background: 'transparent', border: 'none', color: 'var(--text-primary)', padding: '4px', transition: 'all 0.3s ease' }}
              onMouseEnter={e => { e.currentTarget.style.color='var(--accent)'; e.currentTarget.style.transform='rotate(90deg)'; }}
              onMouseLeave={e => { e.currentTarget.style.color='var(--text-primary)'; e.currentTarget.style.transform='rotate(0deg)'; }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
              </svg>
          </button>
        </div>
        
        {isLoadingDetails ? (
          <div className="drawer-content quick-view-content" style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, padding: '0 24px 24px 24px' }}>
            <div className="skeleton-box" style={{ width: '100%', aspectRatio: '1', borderRadius: '16px', margin: '0 auto 24px' }}></div>
            <div className="skeleton-box" style={{ width: '30%', height: '14px', marginBottom: '12px', borderRadius: '4px' }}></div>
            <div className="skeleton-box" style={{ width: '85%', height: '28px', marginBottom: '24px', borderRadius: '6px' }}></div>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '32px' }}>
              <div className="skeleton-box" style={{ width: '35%', height: '24px', borderRadius: '4px' }}></div>
              <div className="skeleton-box" style={{ width: '25%', height: '24px', borderRadius: '4px' }}></div>
            </div>
            <div style={{ width: '100%', height: '1px', background: 'var(--border-color)', marginBottom: '24px' }}></div>
            <div className="skeleton-box" style={{ width: '40%', height: '20px', marginBottom: '16px', borderRadius: '4px' }}></div>
            <div className="skeleton-box" style={{ width: '100%', height: '48px', marginBottom: '16px', borderRadius: '24px' }}></div>
            <div className="skeleton-box" style={{ width: '100%', height: '48px', marginBottom: '32px', borderRadius: '24px' }}></div>
          </div>
        ) : activeProduct ? (
          <>
            <div className="drawer-content quick-view-content" style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, overflowY: 'auto' }}>
            <div className="qv-image" style={{ width: '100%', margin: '0 auto 24px', background: 'transparent' }}>
              <ProductGallery 
                key={matchedVariant ? JSON.stringify(matchedVariant.selections) : 'default'}
                images={(matchedVariant?.images && matchedVariant.images.length > 0) ? matchedVariant.images : (activeProduct.images || [img])} 
                name={titleVi || ''} 
                product={activeProduct} 
                imageMaxWidth="220px" 
              />
            </div>
            
            <div className="qv-info" style={{ flexGrow: 1 }}>
              <span className="qv-category">{activeProduct.category}</span>
              <h2 className="qv-title">{titleVi}</h2>
              <div className="qv-price" style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
                <span style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 500 }}>Giá từ:</span>
                <span style={{ color: 'var(--text-primary)', fontSize: '24px', fontWeight: 800 }}>
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(minCurrentPrice)}
                </span>
                {discountVal > 0 && (
                  <span style={{ fontSize: '16px', color: 'var(--text-muted)', textDecoration: 'line-through', fontWeight: 300 }}>
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(minBasePrice)}
                  </span>
                )}
              </div>
              
              {((hasDynamicVariants && dynamicConfig) || (!hasDynamicVariants && rawColors.length > 0) || activeProduct?.leg || activeProduct?.upholstery) && (
                <div style={{ paddingTop: '24px', borderTop: '1px solid var(--border-color)', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '18px', color: 'var(--text-primary)', margin: '0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--accent)' }}><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                    Tùy chọn cấu hình
                  </h3>
                </div>
              )}
              
              {hasDynamicVariants && dynamicConfig && (
                <div style={{ marginBottom: '16px' }}>
                  {dynamicConfig.keys.map(groupKey => {
                    const groupName = dynamicConfig.names[groupKey] || groupKey;
                    const options = dynamicConfig.groups[groupKey] || [];
                    const selectedId = selectedOptions[groupKey];
                    return (
                      <div key={groupKey} className="qv-select-wrapper">
                        <label className="qv-select-label">{groupName}</label>
                        {options.length > 1 ? (
                          <CustomSelect
                            options={options.map(opt => ({ label: opt.label, value: opt.id, image: opt.image }))}
                            value={selectedId || ''}
                            onChange={(val) => handleSelectOption(groupKey, val)}
                            variant={options.some(opt => opt.image && !opt.image.startsWith('#') && !opt.image.startsWith('rgb')) ? 'image-grid' : 'default'}
                          />
                        ) : (
                          <div style={{ padding: '10px 16px', borderRadius: '20px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '14px', cursor: 'default' }}>
                            {options[0]?.label}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {!hasDynamicVariants && rawColors.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <div className="qv-select-wrapper">
                    <label className="qv-select-label">Màu sắc</label>
                    {rawColors.length > 1 ? (
                      <CustomSelect
                        options={rawColors.map((color: string, idx: number) => ({ label: colors[idx] || color, value: color, image: COLOR_MAP[color.toLowerCase()] || '#888' }))}
                        value={selectedColor || ''}
                        onChange={(val) => setSelectedColor(val)}
                        variant="default"
                      />
                    ) : (
                      <div style={{ padding: '10px 16px', borderRadius: '20px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '14px', cursor: 'default' }}>
                        {colors[0] || rawColors[0]}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeProduct?.leg && (
                <div style={{ marginBottom: '16px' }}>
                  <div className="qv-select-wrapper">
                    <label className="qv-select-label">Chân ghế / Kiểu dáng</label>
                    <div style={{ padding: '10px 16px', borderRadius: '20px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '14px', cursor: 'default' }}>
                      {(activeProduct.leg as any).name_vi || (activeProduct.leg as any).name}
                    </div>
                  </div>
                </div>
              )}

              {activeProduct?.upholstery && (
                <div style={{ marginBottom: '16px' }}>
                  <div className="qv-select-wrapper">
                    <label className="qv-select-label">Chất liệu / Màu sắc</label>
                    <div style={{ padding: '10px 16px', borderRadius: '20px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '14px', cursor: 'default' }}>
                      {(activeProduct.upholstery as any).name_vi || (activeProduct.upholstery as any).name}
                    </div>
                  </div>
                </div>
              )}

              {DimensionsTable}

            </div>
          </div>
          <div className="drawer-footer" style={{ padding: '0px', borderTop: '1px solid var(--border-color)', background: 'var(--bg-primary)', flexShrink: 0 }}>
            <div className="qv-actions" style={{ margin: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.03)', border: '1.5px solid var(--accent)', borderRadius: '8px', overflow: 'hidden', height: '44px', transition: 'all 0.2s' }}>
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))} 
                    style={{ width: '32px', height: '100%', background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '18px', transition: 'background 0.2s' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(224, 86, 36, 0.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                    onMouseDown={(e) => e.currentTarget.style.background = 'rgba(224, 86, 36, 0.2)'}
                    onMouseUp={(e) => e.currentTarget.style.background = 'rgba(224, 86, 36, 0.1)'}
                  >-</button>
                  <span style={{ width: '28px', textAlign: 'center', fontSize: '14px', fontWeight: 600, color: 'var(--accent)' }}>{quantity}</span>
                  <button 
                    onClick={() => setQuantity(quantity + 1)} 
                    style={{ width: '32px', height: '100%', background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '18px', transition: 'background 0.2s' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(224, 86, 36, 0.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                    onMouseDown={(e) => e.currentTarget.style.background = 'rgba(224, 86, 36, 0.2)'}
                    onMouseUp={(e) => e.currentTarget.style.background = 'rgba(224, 86, 36, 0.1)'}
                  >+</button>
                </div>
                <button 
                  className="qv-add-btn"
                  onClick={handleAddToCart}
                >
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(currentPrice * quantity)}
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
                </button>
                <a href={`/kham-pha/${product.productId}`} className="qv-detail-link" title="Khám phá chi tiết">
                  <span>Chi tiết</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                </a>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </>
  );
}
