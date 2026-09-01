'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Search } from 'lucide-react';

interface Option {
  value: string;
  label: string;
}

interface CustomSelectProps {
  options: Option[];
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  style?: React.CSSProperties;
  searchable?: boolean;
  disabled?: boolean;
  dropUp?: boolean;
}

export default function CustomSelect({ options, value, onChange, placeholder = 'Chọn...', style, searchable = false, disabled = false, dropUp = false }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  
  const selectedOption = options.find(o => o.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Reset search when closed
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
    }
  }, [isOpen]);

  const filteredOptions = useMemo(() => {
    if (!searchable || !searchQuery) return options;
    return options.filter(opt => opt.label.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [options, searchable, searchQuery]);

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', ...style }}>
      <button
        type="button"
        disabled={disabled}
        onMouseDown={(e) => {
          // Ngăn form submit nếu nằm trong form
          e.preventDefault();
          if (!disabled) setIsOpen(!isOpen);
        }}
        style={{
          width: '100%',
          padding: '10px 12px',
          background: disabled ? 'var(--bg-secondary)' : 'var(--bg-primary)',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          color: value ? 'var(--text-primary)' : 'var(--text-muted)',
          fontSize: '13px',
          cursor: disabled ? 'not-allowed' : 'pointer',
          outline: 'none',
          boxShadow: isOpen ? '0 0 0 2px rgba(139, 92, 246, 0.1)' : 'none',
          borderColor: isOpen ? 'var(--accent)' : 'var(--border-color)',
          opacity: disabled ? 0.7 : 1
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown size={14} style={{ color: 'var(--text-muted)', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          ...(dropUp
            ? { bottom: 'calc(100% + 2px)', top: 'auto' }
            : { top: 'calc(100% + 2px)', bottom: 'auto' }),
          left: 0,
          right: 0,
          background: 'var(--bg-primary)',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          boxShadow: dropUp ? '0 -4px 12px rgba(0,0,0,0.1)' : '0 4px 12px rgba(0,0,0,0.1)',
          zIndex: 50,
          padding: '4px',
          maxHeight: '250px',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {searchable && (
            <div style={{ padding: '4px', borderBottom: '1px solid var(--border-color)', marginBottom: '4px' }}>
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  autoFocus
                  placeholder="Tìm kiếm..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 8px 8px 28px',
                    borderRadius: '4px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                />
              </div>
            </div>
          )}

          <div style={{ overflowY: 'auto', flex: 1 }}>
            {filteredOptions.length === 0 ? (
              <div style={{ padding: '8px 12px', fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center' }}>Không tìm thấy kết quả</div>
            ) : (
              filteredOptions.map(opt => (
                <div
                  key={opt.value}
                  onMouseDown={() => { onChange(opt.value); setIsOpen(false); }}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    color: value === opt.value ? 'var(--accent)' : 'var(--text-primary)',
                    fontWeight: value === opt.value ? 600 : 400
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-secondary)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  {opt.label}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
