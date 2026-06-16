'use client';

import React, { useState } from 'react';

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
  priceRange: [0, 100000000],
  dcor: []
};

interface SidebarFilterProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
}

const CATEGORIES = ['Sofa', 'Bàn', 'Ghế', 'Tủ', 'Giường', 'Đèn', 'Trang trí', 'Phụ kiện'];
const SPACES = ['Phòng khách', 'Phòng ngủ', 'Phòng ăn', 'Văn phòng', 'Ban công'];
const STYLES = ['Scandinavian', 'Japandi', 'Minimalist', 'Industrial', 'Modern Luxury', 'Contemporary'];
const MATERIALS = ['Gỗ tự nhiên', 'Gỗ công nghiệp', 'Kim loại', 'Kính', 'Da', 'Vải'];
const COLORS = [
  { name: 'Trắng', hex: '#F5F5F5' },
  { name: 'Đen', hex: '#222222' },
  { name: 'Nâu', hex: '#8B4513' },
  { name: 'Xanh lá', hex: '#4B6E50' },
  { name: 'Xanh dương', hex: '#325A82' },
  { name: 'Vàng', hex: '#FFD700' },
  { name: 'Xám', hex: '#808080' }
];

const DCOR_FILTERS = [
  { id: 'size_small', label: 'Dưới 20m²' },
  { id: 'size_medium', label: '20 - 40m²' },
  { id: 'size_large', label: '40 - 60m²' },
  { id: 'size_xlarge', label: 'Trên 60m²' },
  // { id: 'room_planner', label: 'Có thể dùng trong Room Planner' },
  // { id: 'community', label: 'Có trong không gian thực tế' }
];

export default function SidebarFilter({ filters, onFilterChange }: SidebarFilterProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    category: true,
    space: true,
    style: true,
    price: true,
    material: false,
    color: false,
    dcor: true
  });

  const toggleExpand = (key: string) => {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleCheckboxChange = (key: keyof FilterState, value: string) => {
    const currentList = filters[key] as string[];
    const newList = currentList.includes(value) 
      ? currentList.filter(item => item !== value)
      : [...currentList, value];
    
    onFilterChange({ ...filters, [key]: newList });
  };

  const FilterSection = ({ title, id, children }: { title: string, id: string, children: React.ReactNode }) => (
    <div className="filter-section">
      <div className="filter-header" onClick={() => toggleExpand(id)}>
        <h4>{title}</h4>
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
        
        <FilterSection title="Danh mục" id="category">
          {CATEGORIES.map(cat => <CheckboxItem key={cat} label={cat} filterKey="categories" value={cat} />)}
        </FilterSection>

        <FilterSection title="Không gian sử dụng" id="space">
          {SPACES.map(s => <CheckboxItem key={s} label={s} filterKey="spaces" value={s} />)}
        </FilterSection>

        <FilterSection title="Phong cách" id="style">
          {STYLES.map(s => <CheckboxItem key={s} label={s} filterKey="styles" value={s} />)}
        </FilterSection>

        <FilterSection title="Khoảng giá" id="price">
          <div className="price-slider-wrapper">
            <input 
              type="range" 
              min="0" 
              max="100000000" 
              className="price-slider" 
              value={filters.priceRange[1]}
              onChange={(e) => onFilterChange({ ...filters, priceRange: [0, parseInt(e.target.value)] })}
            />
            <div className="price-range-labels">
              <span>0đ</span>
              <span>{filters.priceRange[1] >= 100000000 ? '100tr+' : `${(filters.priceRange[1]/1000000).toFixed(0)}tr`}</span>
            </div>
          </div>
        </FilterSection>

        <FilterSection title="Chất liệu" id="material">
          {MATERIALS.map(m => <CheckboxItem key={m} label={m} filterKey="materials" value={m} />)}
        </FilterSection>

        <FilterSection title="Màu sắc" id="color">
          <div className="color-swatch-grid">
            {COLORS.map(c => {
              const isSelected = filters.colors.includes(c.name);
              return (
                <div 
                  key={c.name} 
                  className="color-swatch-item" 
                  title={c.name}
                  onClick={() => handleCheckboxChange('colors', c.name)}
                >
                  <span 
                    className="color-swatch" 
                    style={{ 
                      backgroundColor: c.hex,
                      border: isSelected ? '2px solid var(--accent)' : '1px solid rgba(255,255,255,0.1)',
                      boxShadow: isSelected ? '0 0 0 2px var(--bg-primary)' : 'none'
                    }}
                  ></span>
                </div>
              );
            })}
          </div>
        </FilterSection>

        <FilterSection title="Đặc quyền D'Cor" id="dcor">
          {DCOR_FILTERS.map(f => <CheckboxItem key={f.id} label={f.label} filterKey="dcor" value={f.id} />)}
        </FilterSection>

      </div>
    </aside>
  );
}
