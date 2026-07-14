'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { CatalogProduct } from '@/lib/data';
import ProductGallery from '@/components/product/ProductGallery';
import { useStore, CartItem } from '@/lib/store';
import CustomSelect from '@/components/ui/CustomSelect';

interface CartEditVariantDrawerProps {
  cartItem: CartItem | null;
  originalIndex: number | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: (index: number) => void;
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

export default function CartEditVariantDrawer({ cartItem, originalIndex, isOpen, onClose, onUpdated }: CartEditVariantDrawerProps) {
  const updateCartItem = useStore(state => state.updateCartItem);

  const COLOR_MAP: Record<string, string> = {
    beige: '#D4C3A3', grey: '#8C8C8C', blue: '#325A82', green: '#4B6E50',
    brown: '#6E4D3B', white: '#FAF5EF', black: '#1A1A1A', red: '#A33E3E',
    yellow: '#D4AF37', orange: '#D47A37', pink: '#D48CAD', purple: '#5F3F6D'
  };

  const [fullProduct, setFullProduct] = useState<any>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  useEffect(() => {
    if (isOpen && cartItem?.productId) {
      setIsLoadingDetails(true);
      fetch(`/api/products/${cartItem.productId}`)
        .then(res => res.json())
        .then(data => setFullProduct(data))
        .catch(err => console.error(err))
        .finally(() => setIsLoadingDetails(false));
    } else {
      setFullProduct(null);
      setSelectedOptions({});
    }
  }, [isOpen, cartItem]);

  const activeProduct = fullProduct;

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
    if (isOpen && cartItem) {
      setQuantity(cartItem.quantity);
    }
  }, [isOpen, cartItem]);

  useEffect(() => {
    if (hasDynamicVariants && filteredVariantPrices.length > 0) {
      const firstVariant = filteredVariantPrices[0];
      let initialSelections = firstVariant.selections || {};
      
      if (cartItem?.variantTags && dynamicConfig) {
         const rebuiltSelections: Record<string, string> = {};
         
         cartItem.variantTags.forEach(tag => {
            const groupKey = dynamicConfig.keys.find(k => (dynamicConfig.names[k] || k) === tag.label);
            if (groupKey) {
               const option = dynamicConfig.groups[groupKey]?.find(o => o.label === tag.value);
               if (option) {
                  rebuiltSelections[groupKey] = option.id;
               }
            }
         });

         // Find if there's a variant that perfectly matches our rebuilt selections
         const perfectlyMatchingVariant = filteredVariantPrices.find((v: any) => {
            const sel = v.selections || {};
            return Object.keys(rebuiltSelections).every(k => sel[k] === rebuiltSelections[k]);
         });

         if (perfectlyMatchingVariant) {
            initialSelections = perfectlyMatchingVariant.selections;
         } else {
            initialSelections = { ...initialSelections, ...rebuiltSelections };
         }
      }

      setSelectedOptions(initialSelections);
    } else if (rawColors.length > 0) {
      const selectedIdx = cartItem?.variantTags?.[0]?.value ? colors.indexOf(cartItem.variantTags[0].value) : 0;
      setSelectedColor(rawColors[selectedIdx >= 0 ? selectedIdx : 0]);
    }
  }, [hasDynamicVariants, filteredVariantPrices, rawColors, cartItem, colors]);

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

  const handleUpdateCart = () => {
    if (!activeProduct || originalIndex === null || !cartItem) return;
    const titleVi = activeProduct.shortDescription_vi || activeProduct.shortDescription;
    
    let variantTags: {label: string, value: string}[] | undefined = undefined;
    if (hasDynamicVariants && matchedVariant) {
      variantTags = dynamicConfig?.keys
        .filter(k => (dynamicConfig.groups[k]?.length || 0) > 1)
        .map(k => {
          const selId = selectedOptions[k];
          const opt = dynamicConfig.groups[k]?.find(o => o.id === selId);
          return { label: dynamicConfig.names[k] || k, value: opt?.label || selId };
        });
      if (variantTags?.length === 0) variantTags = undefined;
    } else if (!hasDynamicVariants && selectedColor && rawColors.length > 1) {
      const selectedIdx = rawColors.indexOf(selectedColor);
      const selectedLabel = colors[selectedIdx] || selectedColor;
      variantTags = [{ label: 'Màu sắc', value: selectedLabel }];
    }

    updateCartItem(originalIndex, {
      productId: activeProduct.productId,
      name: titleVi || cartItem.name,
      image: (matchedVariant?.images?.[0]) || activeProduct.images?.[0] || cartItem.image,
      price: currentPrice,
      variantTags: variantTags,
      quantity: quantity
    });

    onUpdated(originalIndex);
    onClose();
  };

  const titleVi = activeProduct?.shortDescription_vi || activeProduct?.shortDescription || cartItem?.name;
  const basePrice = matchedVariant ? matchedVariant.price : (activeProduct?.prices?.[0]?.price || cartItem?.price || 0);
  const discountVal = activeProduct?.discountValue || 0;
  const isPercentage = activeProduct?.discountType === 'PERCENTAGE';
  const currentPrice = discountVal > 0 
    ? (isPercentage ? basePrice * (1 - discountVal / 100) : Math.max(0, basePrice - discountVal))
    : basePrice;

  const minBasePrice = activeProduct?.lowestPrices?.[0]?.price || activeProduct?.prices?.[0]?.price || 0;
  const minCurrentPrice = discountVal > 0 
    ? (isPercentage ? minBasePrice * (1 - discountVal / 100) : Math.max(0, minBasePrice - discountVal))
    : minBasePrice;

  const img = activeProduct?.images?.[0] || cartItem?.image || '';

  return (
    <div className={`cart-edit-drawer ${isOpen ? 'active' : ''}`}>
      <div className="cart-header" style={{ padding: '24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '20px', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{color: 'var(--accent)'}}><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
          Chỉnh sửa biến thể
        </h3>
        <button className="close-btn" onClick={onClose} style={{ cursor: 'pointer', background: 'transparent', border: 'none', color: 'var(--text-primary)', padding: '4px', transition: 'all 0.3s ease' }}
            onMouseEnter={e => { e.currentTarget.style.color='var(--accent)'; e.currentTarget.style.transform='rotate(90deg)'; }}
            onMouseLeave={e => { e.currentTarget.style.color='var(--text-primary)'; e.currentTarget.style.transform='rotate(0deg)'; }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m9 18 6-6-6-6"/>
            </svg>
        </button>
      </div>
      
      {isLoadingDetails ? (
        <div style={{ padding: '24px', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          <div className="skeleton-box" style={{ width: '100%', aspectRatio: '1', borderRadius: '16px', margin: '0 auto 24px' }}></div>
          <div className="skeleton-box" style={{ width: '85%', height: '28px', marginBottom: '24px', borderRadius: '6px' }}></div>
          <div style={{ width: '100%', height: '1px', background: 'var(--border-color)', marginBottom: '24px' }}></div>
          <div className="skeleton-box" style={{ width: '100%', height: '48px', marginBottom: '16px', borderRadius: '24px' }}></div>
        </div>
      ) : activeProduct ? (
        <>
          <div style={{ padding: '24px', flexGrow: 1, overflowY: 'auto' }}>
            <div style={{ width: '100%', margin: '0 auto 24px', background: 'transparent' }}>
              <ProductGallery 
                key={matchedVariant ? JSON.stringify(matchedVariant.selections) : 'default'}
                images={(matchedVariant?.images && matchedVariant.images.length > 0) ? matchedVariant.images : (activeProduct.images || [img])} 
                name={titleVi || ''} 
                product={activeProduct} 
                imageMaxWidth="180px" 
              />
            </div>
            
            <span style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>{activeProduct.category}</span>
            <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '12px', lineHeight: 1.3 }}>{titleVi}</h2>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
              <span style={{ color: 'var(--text-primary)', fontSize: '22px', fontWeight: 800 }}>
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(currentPrice)}
              </span>
            </div>
            
            {hasDynamicVariants && dynamicConfig && (
              <div style={{ marginBottom: '16px' }}>
                {dynamicConfig.keys.map(groupKey => {
                  const groupName = dynamicConfig.names[groupKey] || groupKey;
                  const options = dynamicConfig.groups[groupKey] || [];
                  const selectedId = selectedOptions[groupKey];
                  const isImageGroup = groupKey.toLowerCase().includes('color') || groupKey.toLowerCase().includes('upholstery') || groupKey === 'vaMaterial' || groupKey === 'vaMaterialSeat';

                  return (
                    <div key={groupKey} className="qv-select-wrapper" style={{ marginBottom: '16px' }}>
                      <label className="qv-select-label" style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase' }}>{groupName}</label>
                      {options.length > 1 ? (
                        <CustomSelect
                          options={options.map(opt => ({ label: opt.label, value: opt.id, image: opt.image }))}
                          value={selectedId || ''}
                          onChange={(val) => handleSelectOption(groupKey, val)}
                          variant={(isImageGroup && options.some(opt => opt.image && !opt.image.startsWith('#') && !opt.image.startsWith('rgb'))) ? 'image-grid' : 'default'}
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
                  <label className="qv-select-label" style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase' }}>Màu sắc</label>
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
            
            {/* Explore Link added as requested */}
            <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-color)', textAlign: 'center' }}>
              <a href={`/kham-pha/${activeProduct?.productId}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 500, textDecoration: 'none' }} title="Khám phá chi tiết">
                 <span>Khám phá chi tiết sản phẩm</span>
                 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              </a>
            </div>
          </div>
          
          <div style={{ padding: '16px 24px 30px 24px', borderTop: '1px solid var(--border-color)', background: 'var(--bg-primary)', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.03)', border: '1.5px solid var(--accent)', borderRadius: '8px', overflow: 'hidden', height: '54px', flexShrink: 0 }}>
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} style={{ width: '40px', height: '100%', background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '18px' }}>-</button>
              <span style={{ width: '32px', textAlign: 'center', fontSize: '14px', fontWeight: 600, color: 'var(--accent)' }}>{quantity}</span>
              <button onClick={() => setQuantity(quantity + 1)} style={{ width: '40px', height: '100%', background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '18px' }}>+</button>
            </div>
            <button 
              onClick={handleUpdateCart}
              style={{ flexGrow: 1, height: '54px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '0 16px', transition: 'all 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.transform='translateY(-2px)'} 
              onMouseLeave={e => e.currentTarget.style.transform='translateY(0)'}
            >
              <span style={{ fontWeight: 700, letterSpacing: '0.5px' }}>
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(currentPrice * quantity)}
              </span>
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>|</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                Cập nhật giỏ hàng
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
            </button>
          </div>
        </>
      ) : (
        <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Không tìm thấy thông tin sản phẩm.
        </div>
      )}
    </div>
  );
}
