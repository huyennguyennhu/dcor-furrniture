'use client';

import React from 'react';
import { Search, Filter, Download, Plus } from 'lucide-react';

interface FilterOption {
  label: string;
  value: string;
  options: { label: string; value: string }[];
}

interface FilterBarProps {
  searchPlaceholder?: string;
  searchValue: string;
  onSearchChange: (val: string) => void;
  filters?: FilterOption[];
  onFilterChange?: (filterLabel: string, val: string) => void;
  onExport?: () => void;
  primaryAction?: {
    label: string;
    onClick: () => void;
  };
  customActions?: React.ReactNode;
}

export default function FilterBar({ 
  searchPlaceholder = 'Tìm kiếm...', 
  searchValue, 
  onSearchChange,
  filters = [],
  onFilterChange,
  onExport,
  primaryAction,
  customActions
}: FilterBarProps) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', background: 'white', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '8px 16px', minWidth: '260px' }}>
          <Search size={16} color="var(--text-muted)" style={{ marginRight: '8px' }} />
          <input 
            type="text" 
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            style={{ border: 'none', background: 'none', outline: 'none', fontSize: '14px', width: '100%', color: 'var(--text-primary)' }}
          />
        </div>

        {filters.map((filter, idx) => (
          <select 
            key={idx}
            value={filter.value}
            onChange={(e) => onFilterChange && onFilterChange(filter.label, e.target.value)}
            style={{ 
              padding: '9px 36px 9px 16px', 
              borderRadius: '8px', 
              border: '1px solid var(--border-color)', 
              background: 'white',
              fontSize: '14px',
              color: 'var(--text-primary)',
              outline: 'none',
              cursor: 'pointer',
              appearance: 'none',
              backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 12px center',
              backgroundSize: '16px'
            }}
          >
            <option value="">{filter.label}</option>
            {filter.options.map((opt, oIdx) => (
              <option key={oIdx} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {onExport && (
          <button 
            onClick={onExport}
            className="admin-btn admin-btn-secondary"
          >
            <Download size={16} /> Export
          </button>
        )}
        {primaryAction && (
          <button 
            onClick={primaryAction.onClick}
            className="admin-btn admin-btn-primary"
          >
            <Plus size={16} /> {primaryAction.label}
          </button>
        )}
        {customActions}
      </div>
    </div>
  );
}
