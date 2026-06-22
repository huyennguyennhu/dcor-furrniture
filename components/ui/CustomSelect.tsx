'use client';
import React, { useState, useRef, useEffect } from 'react';

interface Option {
  label: string;
  value: string;
  image?: string;
}

interface CustomSelectProps {
  options: Option[];
  value: string;
  onChange: (val: string) => void;
  className?: string;
  disabled?: boolean;
  variant?: 'default' | 'image-grid';
}

export default function CustomSelect({ options, value, onChange, className = '', disabled = false, variant = 'default' }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(o => o.value === value) || options[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`custom-select-container ${className}`} ref={containerRef} style={disabled ? { opacity: 0.6, pointerEvents: 'none' } : undefined}>
      <div 
        className={`custom-select-trigger ${isOpen ? 'open' : ''}`}
        onClick={() => { if (!disabled) setIsOpen(!isOpen); }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {variant === 'image-grid' && selectedOption?.image && (
            selectedOption.image.startsWith('#') || selectedOption.image.startsWith('rgb') ? (
              <div style={{ width: '25px', height: '25px', borderRadius: '50%', backgroundColor: selectedOption.image, border: '1px solid var(--border-color)' }} />
            ) : (
              <img src={selectedOption.image} alt={selectedOption.label} style={{ width: '25px', height: '25px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border-color)' }} />
            )
          )}
          <span>{selectedOption?.label}</span>
        </div>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
          <path d="m6 9 6 6 6-6"/>
        </svg>
      </div>
      
      {isOpen && (
        <div 
          className="custom-select-dropdown" 
          style={variant === 'image-grid' ? { padding: '12px', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px', minWidth: '240px' } : undefined}
        >
          {options.map(opt => (
            variant === 'image-grid' ? (
              <div 
                key={opt.value}
                className={`image-grid-option ${opt.value === value ? 'selected' : ''}`}
                onClick={() => { onChange(opt.value); setIsOpen(false); }}
                title={opt.label}
              >
                {opt.image ? (
                  opt.image.startsWith('#') || opt.image.startsWith('rgb') ? (
                    <div style={{ width: '100%', height: '100%', backgroundColor: opt.image }} />
                  ) : (
                    <img src={opt.image} alt={opt.label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  )
                ) : (
                  <div style={{ width: '100%', height: '100%', background: 'var(--border-color)' }} />
                )}
              </div>
            ) : (
              <div 
                key={opt.value}
                className={`custom-select-option ${opt.value === value ? 'selected' : ''}`}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                {opt.image && (
                  <div style={{
                    width: '20px', height: '20px', borderRadius: '50%', overflow: 'hidden',
                    background: opt.image.startsWith('#') || opt.image.startsWith('rgb') ? opt.image : 'var(--bg-tertiary)',
                    border: '1px solid var(--border-color)',
                    flexShrink: 0
                  }}>
                    {!(opt.image.startsWith('#') || opt.image.startsWith('rgb')) && (
                      <img src={opt.image} alt={opt.label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    )}
                  </div>
                )}
                {opt.label}
              </div>
            )
          ))}
        </div>
      )}
    </div>
  );
}
