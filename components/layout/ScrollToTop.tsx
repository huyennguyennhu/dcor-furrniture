'use client';

import React, { useState, useEffect } from 'react';

export default function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 400) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    // Initial check
    toggleVisibility();

    return () => {
      window.removeEventListener('scroll', toggleVisibility);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <button
      onClick={scrollToTop}
      style={{
        position: 'fixed',
        bottom: '40px',
        right: '40px',
        width: '52px',
        height: '52px',
        borderRadius: '50%',
        backgroundColor: 'var(--accent)',
        color: '#fff',
        border: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 12px rgba(224, 86, 36, 0.4)',
        cursor: isVisible ? 'pointer' : 'default',
        zIndex: 9999,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        opacity: isVisible ? 1 : 0,
        pointerEvents: isVisible ? 'auto' : 'none',
        transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
      }}
      title="Lên đầu trang"
      onMouseEnter={(e) => { 
        if(isVisible) { 
          e.currentTarget.style.transform = 'translateY(-5px) scale(1.05)'; 
          e.currentTarget.style.boxShadow = '0 8px 20px rgba(224, 86, 36, 0.5)'; 
        } 
      }}
      onMouseLeave={(e) => { 
        if(isVisible) { 
          e.currentTarget.style.transform = 'translateY(0) scale(1)'; 
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(224, 86, 36, 0.4)'; 
        } 
      }}
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="m18 15-6-6-6 6"/>
      </svg>
    </button>
  );
}
