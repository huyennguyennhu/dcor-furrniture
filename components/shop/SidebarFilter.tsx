'use client';

import React, { useState, useEffect } from 'react';

export interface FilterState {
  categories: string[];
  spaces: string[];
  styles: string[];
  materials: string[];
  colors: string[];
  priceRange: [number, number];
  dcor: string[];
}

export const INITIAL_FILTER_STATE: FilterState = {
  categories: [],
  spaces: [],
  styles: [],
  materials: [],
  colors: [],
  priceRange: [0, 999999999],
  dcor: []
};

interface SidebarFilterProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  dynamicFilters?: { categories: string[], materials: string[], colors: any[] };
  validFilters?: { categories: string[], materials: string[], colors: string[] };
  dynamicMaxPrice?: number;
}

const FALLBACK_COLORS: Record<string, string> = {
  'Trắng': '#F5F5F5', 'Đen': '#222222', 'Nâu': '#8B4513', 'Xanh lá': '#4B6E50', 
  'Xanh dương': '#325A82', 'Vàng': '#FFD700', 'Xám': '#808080',
  'White': '#F5F5F5', 'Black': '#222222', 'Brown': '#8B4513', 'Green': '#4B6E50',
  'Blue': '#325A82', 'Yellow': '#FFD700', 'Grey': '#808080', 'Beige': '#D4C3A3'
};

export default function SidebarFilter({ filters, onFilterChange, dynamicFilters, validFilters, dynamicMaxPrice = 100000000 }: SidebarFilterProps) {
  const CATEGORIES = dynamicFilters?.categories && dynamicFilters.categories.length > 0 ? dynamicFilters.categories : ['Sofa', 'Bàn', 'Ghế', 'Tủ Kệ', 'Giường', 'Đèn', 'Thảm', 'Phụ Kiện'];
  const MATERIALS = dynamicFilters?.materials && dynamicFilters.materials.length > 0 ? dynamicFilters.materials : ['Gỗ tự nhiên', 'Gỗ công nghiệp', 'Kim loại', 'Kính', 'Da', 'Vải'];
  const COLORS = dynamicFilters?.colors && dynamicFilters.colors.length > 0 
    ? dynamicFilters.colors
    : [
        { name: 'Trắng', hex: '#F5F5F5' }, { name: 'Đen', hex: '#222222' }, { name: 'Nâu', hex: '#8B4513' },
        { name: 'Xanh lá', hex: '#4B6E50' }, { name: 'Xanh dương', hex: '#325A82' }, { name: 'Vàng', hex: '#FFD700' }, { name: 'Xám', hex: '#808080' }
      ];

  // Lọc chỉ giữ lại những mục khả dụng dựa trên validFilters
  const VALID_CATEGORIES = validFilters ? CATEGORIES.filter(c => validFilters.categories.includes(c) || filters.categories.includes(c)) : CATEGORIES;
  const VALID_MATERIALS = validFilters ? MATERIALS.filter(m => validFilters.materials.includes(m) || filters.materials.includes(m)) : MATERIALS;
  const VALID_COLORS = validFilters ? COLORS.filter(c => validFilters.colors.includes(c.name) || filters.colors.includes(c.name)) : COLORS;
  const currentPriceValue = filters.priceRange[1] > dynamicMaxPrice ? dynamicMaxPrice : filters.priceRange[1];
  
  const [localPrice, setLocalPrice] = useState(currentPriceValue);

  useEffect(() => {
    setLocalPrice(currentPriceValue);
  }, [currentPriceValue]);

  const formatPriceShort = (price: number) => {
    if (price >= 1000000000) return (price / 1000000000).toFixed(1).replace(/\.0$/, '') + 'tỷ';
    if (price >= 1000000) return (price / 1000000).toFixed(0) + 'tr';
    if (price >= 1000) return (price / 1000).toFixed(0) + 'k';
    return price + 'đ';
  };

  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    category: true,
    price: true,
    material: false,
    color: false
  });
  
  const [materialPage, setMaterialPage] = useState(0);
  const [materialSearchQuery, setMaterialSearchQuery] = useState('');

  const toggleExpand = (key: string) => {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const filteredMaterials = VALID_MATERIALS.filter(m => m.toLowerCase().includes(materialSearchQuery.toLowerCase()));
  const usePagination = VALID_MATERIALS.length > 10;
  const totalMaterialPages = usePagination ? Math.ceil(filteredMaterials.length / 5) : 1;
  const currentMaterials = usePagination ? filteredMaterials.slice(materialPage * 5, (materialPage + 1) * 5) : filteredMaterials;

  const handleCheckboxChange = (key: keyof FilterState, value: string) => {
    const currentList = filters[key] as string[];
    const newList = currentList.includes(value) 
      ? currentList.filter(item => item !== value)
      : [...currentList, value];
    // Always reset price to max when another filter is changed
    onFilterChange({ ...filters, [key]: newList, priceRange: [0, 999999999] });
  };

  const FilterSection = ({ title, id, count, children }: { title: string, id: string, count?: number, children: React.ReactNode }) => (
    <div className="filter-section">
      <div className="filter-header" onClick={() => toggleExpand(id)}>
        <h4>
          {title}
          {count !== undefined && <span className="filter-count-badge">{count}</span>}
        </h4>
        <svg
          style={{ transform: expanded[id] ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
          xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        >
          <path d="m6 9 6 6 6-6"/>
        </svg>
      </div>
      {expanded[id] && <div className="filter-body">{children}</div>}
    </div>
  );

  const CheckboxItem = ({ label, filterKey, value }: { label: string, filterKey: keyof FilterState, value: string }) => {
    const isChecked = (filters[filterKey] as string[]).includes(value);
    return (
      <label className="filter-checkbox-label">
        <input 
          type="checkbox" 
          className="filter-checkbox" 
          checked={isChecked}
          onChange={() => handleCheckboxChange(filterKey, value)}
        />
        <span className="filter-checkbox-custom"></span>
        <span className="filter-checkbox-text">{label}</span>
      </label>
    );
  };

  return (
    <aside className="sidebar-filter-wrapper">
      <div className="sidebar-filter-content">
        <h3 className="sidebar-title">Bộ lọc</h3>
        
        <FilterSection title="Danh mục" id="category" count={CATEGORIES.length}>
          {CATEGORIES.map(cat => <CheckboxItem key={cat} label={cat} filterKey="categories" value={cat} />)}
        </FilterSection>

        <FilterSection title="Khoảng giá" id="price">
          <div className="price-slider-wrapper" style={{ padding: '25px 0 5px 0' }}>
            <div style={{ position: 'relative' }}>
              <div 
                style={{ 
                  position: 'absolute', 
                  left: `calc(${(localPrice / dynamicMaxPrice) * 100}% + ${8 - (localPrice / dynamicMaxPrice) * 16}px)`,
                  top: '-28px',
                  transform: 'translateX(-50%)',
                  background: 'var(--accent, #B77953)',
                  color: '#fff',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontSize: '10px',
                  fontWeight: '500',
                  whiteSpace: 'nowrap',
                  pointerEvents: 'none',
                  zIndex: 10,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.15)'
                }}
              >
                {formatPriceShort(localPrice)}
                <div style={{
                  position: 'absolute',
                  bottom: '-4px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  borderWidth: '4px 4px 0',
                  borderStyle: 'solid',
                  borderColor: 'var(--accent, #B77953) transparent transparent transparent'
                }} />
              </div>

              <input 
                type="range" 
                min={0} 
                max={dynamicMaxPrice} 
                step={500000}
                value={localPrice}
                onChange={(e) => setLocalPrice(parseInt(e.target.value))}
                onMouseUp={() => onFilterChange({ ...filters, priceRange: [0, localPrice] })}
                onTouchEnd={() => onFilterChange({ ...filters, priceRange: [0, localPrice] })}
                className="price-slider"
                style={{ width: '100%', position: 'relative', zIndex: 1, margin: 0 }}
              />
            </div>
            <div className="price-range-labels" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)', marginTop: '12px' }}>
              <span>0đ</span>
              <span>{formatPriceShort(dynamicMaxPrice)}</span>
            </div>
          </div>
        </FilterSection>

        <FilterSection title="Chất liệu" id="material" count={VALID_MATERIALS.length}>
          {VALID_MATERIALS.length >= 20 && (
            <input 
              type="text" 
              className="filter-search-input" 
              placeholder="Tìm chất liệu..." 
              value={materialSearchQuery}
              onChange={(e) => { setMaterialSearchQuery(e.target.value); setMaterialPage(0); }}
              style={{ width: '100%', padding: '6px 12px', marginBottom: '10px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '13px' }}
            />
          )}
          {currentMaterials.map(m => (
            <CheckboxItem key={m} label={m} filterKey="materials" value={m} />
          ))}
          {usePagination && totalMaterialPages > 1 && (
            <div className="filter-pagination" style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '10px', alignItems: 'center' }}>
              <button 
                disabled={materialPage === 0} 
                onClick={() => setMaterialPage(prev => prev - 1)}
                style={{ background: 'none', border: 'none', cursor: materialPage === 0 ? 'not-allowed' : 'pointer', opacity: materialPage === 0 ? 0.3 : 1, color: 'var(--accent)' }}
              >
                &lt;
              </button>
              <span style={{ fontSize: '12px', color: '#666' }}>{materialPage + 1} / {totalMaterialPages}</span>
              <button 
                disabled={materialPage >= totalMaterialPages - 1} 
                onClick={() => setMaterialPage(prev => prev + 1)}
                style={{ background: 'none', border: 'none', cursor: materialPage >= totalMaterialPages - 1 ? 'not-allowed' : 'pointer', opacity: materialPage >= totalMaterialPages - 1 ? 0.3 : 1, color: 'var(--accent)' }}
              >
                &gt;
              </button>
            </div>
          )}
        </FilterSection>

        <FilterSection title="Màu sắc" id="color" count={VALID_COLORS.length}>
          <div className="filter-color-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
            {VALID_COLORS.map(c => (
              <label 
                key={c.name} 
                className={`color-swatch-item ${filters.colors.includes(c.name) ? 'active' : ''}`}
                title={c.name}
              >
                <input 
                  type="checkbox" 
                  checked={filters.colors.includes(c.name)}
                  onChange={() => handleCheckboxChange('colors', c.name)}
                  style={{ display: 'none' }}
                />
                <span 
                  className="color-swatch-circle" 
                  style={{ 
                    backgroundColor: c.hex,
                    backgroundImage: c.imageLink ? `url("${c.imageLink}")` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    borderRadius: '50%',
                    border: '1px solid rgba(0,0,0,0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    height: '100%',
                    cursor: 'pointer'
                  }}
                >
                  {filters.colors.includes(c.name) && (
                    <svg className="color-check-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0px 0px 2px rgba(0,0,0,0.8))' }}>
                      <path d="m6 9 6 6 6-6"/>
                    </svg>
                  )}
                </span>
              </label>
            ))}
          </div>
        </FilterSection>
      </div>
    </aside>
  );
}
