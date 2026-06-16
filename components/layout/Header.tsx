'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { ShoppingBag, User, Sun, Moon, ArrowRight } from 'lucide-react';
import { CatalogProduct } from '@/lib/data';

interface HeaderProps {
  onOpenCart: () => void;
}

export default function Header({ onOpenCart }: HeaderProps) {
  const { cart, toggleTheme, theme } = useStore();
  const pathname = usePathname();
  const router = useRouter();
  
  const [mounted, setMounted] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    document.documentElement.setAttribute('data-theme', theme);
    fetch('/api/products').then(res => res.json()).then(setProducts).catch(() => {});
  }, [theme]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setSearchQuery('');
    setIsDropdownOpen(false);
  }, [pathname]);

  const cartCount = mounted ? cart.length : 0;

  const searchResults = searchQuery.trim()
    ? products.filter(p => {
        const query = searchQuery.toLowerCase();
        return (p.shortDescription || '').toLowerCase().includes(query) || 
               (p.shortDescription_vi || '').toLowerCase().includes(query) ||
               (p.category || '').toLowerCase().includes(query);
      })
    : [];

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (searchQuery.trim() && searchResults.length > 0) {
        setIsDropdownOpen(false);
        router.push(`/kham-pha?q=${encodeURIComponent(searchQuery.trim())}`);
      }
    }
  };

  const handleSearchSubmit = () => {
    if (searchQuery.trim() && searchResults.length > 0) {
      setIsDropdownOpen(false);
      router.push(`/kham-pha?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      inputRef.current?.focus();
    }
  };

  const isHomePage = pathname === '/';
  const isDocked = !isHomePage || scrolled;

  const headerH = 80;
  const searchH = 44;
  const dockedTop = Math.round((headerH - searchH) / 2);

  const searchBg = isDocked ? 'var(--bg-tertiary)' : 'rgba(255,255,255,0.15)';
  const searchBorder = isDocked ? 'transparent' : 'rgba(255,255,255,0.3)';
  const searchText = isDocked ? 'var(--text-primary)' : '#fff';
  const searchIcon = isDocked ? 'var(--text-primary)' : 'rgba(255,255,255,0.8)';

  const searchPlaceholder = 'Khám phá mảnh ghép hoàn hảo';
  const headerClass = isDocked ? 'header-solid' : 'header-hero';

  return (
    <header className={headerClass}>
      <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
        <Link href="/" className="logo">
          <div className="logo-circle">
            <span className="logo-circle-text">DCOR.</span>
          </div>
        </Link>

        <nav style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <ul style={{ display: 'flex', alignItems: 'center', gap: '40px', listStyle: 'none', margin: 0, padding: 0 }}>
            {[
              { label: 'Khám phá', href: '/kham-pha' },
              { label: 'Thiết kế', href: '/thiet-ke' },
              { label: 'Cộng đồng', href: '/community' },
              { label: 'Cảm hứng', href: '/blog' },
              { label: "Về D'Cor", href: '/about' }
            ].map(link => {
              const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
              return (
                <li key={link.href}>
                  <Link 
                    href={link.href} 
                    className={`header-nav-link ${isActive ? 'active' : ''}`}
                    style={{ fontWeight: isActive ? 700 : 500, fontSize: '16px', letterSpacing: '0.2px' }}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: isDocked ? '260px' : '0px', transition: 'width 0.35s cubic-bezier(0.4,0,0.2,1)', height: '44px' }} aria-hidden="true" />

          <div
            className="floating-search-bar"
            style={{
              position: 'absolute',
              right: isDocked ? '160px' : '40px', 
              top: isDocked ? `${dockedTop}px` : `${headerH + 16}px`,
              width: isDocked ? '260px' : '380px',
              zIndex: 101,
              transition: 'all 0.35s cubic-bezier(0.4,0,0.2,1)',
              boxShadow: isDocked ? 'none' : '0 8px 32px rgba(0,0,0,0.15)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxSizing: 'border-box',
                background: searchBg,
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: `1px solid ${searchBorder}`,
                borderRadius: '50px',
                padding: isDocked ? '6px 8px 6px 14px' : '8px 10px 8px 18px',
                height: `${searchH}px`,
                transition: 'background 0.35s ease, padding 0.35s ease, border-color 0.35s ease',
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: searchIcon, flexShrink: 0, transition: 'color 0.35s ease' }}>
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
              </svg>
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  setIsDropdownOpen(true);
                }}
                onFocus={() => setIsDropdownOpen(true)}
                onBlur={() => setIsDropdownOpen(false)}
                onKeyDown={handleSearch}
                placeholder={searchPlaceholder}
                style={{
                  flex: 1,
                  background: 'none',
                  border: 'none',
                  outline: 'none',
                  color: searchText,
                  fontSize: isDocked ? '14px' : '15px',
                  fontFamily: 'var(--font-body)',
                  minWidth: 0,
                  transition: 'font-size 0.35s ease, color 0.35s ease',
                }}
              />
              {searchQuery && (
                <button
                  onClick={handleSearchSubmit}
                  style={{
                    background: 'var(--accent)', border: 'none', borderRadius: '50%',
                    width: '30px', height: '30px', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', cursor: 'pointer', flexShrink: 0,
                  }}
                >
                  <ArrowRight size={14} strokeWidth={2.5} color="#fff" />
                </button>
              )}
            </div>

            {/* Dropdown Menu */}
            {isDropdownOpen && searchQuery.trim() && (
              <div 
                onMouseDown={(e) => e.preventDefault()}
                style={{
                  position: 'absolute', top: 'calc(100% + 12px)', left: 0, right: 0,
                  background: 'var(--bg-primary)', border: '1px solid var(--border-color)',
                  borderRadius: '16px', padding: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                  maxHeight: '400px', overflowY: 'auto', zIndex: 102
                }}
              >
                {searchResults.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {searchResults.slice(0, 5).map(p => (
                      <Link 
                        key={p.productId} 
                        href={`/kham-pha/${p.productId}`}
                        onClick={() => setIsDropdownOpen(false)}
                        style={{ display: 'flex', gap: '12px', padding: '8px', borderRadius: '8px', textDecoration: 'none', color: 'var(--text-primary)', transition: 'background 0.2s' }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <img src={p.images?.[0] || ''} alt="" style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '4px', background: 'var(--bg-secondary)' }} />
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>{p.shortDescription_vi || p.shortDescription}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{p.category}</div>
                        </div>
                      </Link>
                    ))}
                    {searchResults.length > 5 && (
                      <div style={{ textAlign: 'center', paddingTop: '8px', borderTop: '1px solid var(--border-color)' }}>
                        <button onClick={handleSearchSubmit} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontWeight: 600, cursor: 'pointer', fontSize: '13px' }}>
                          Xem tất cả {searchResults.length} kết quả
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
                    Không tìm thấy sản phẩm nào
                  </div>
                )}
              </div>
            )}
          </div>

          <button className="icon-btn" onClick={onOpenCart} title="Giỏ hàng" style={{ position: 'relative' }}>
            <ShoppingBag size={22} strokeWidth={1.5} />
            {cartCount > 0 && <span className="badge" id="cart-count">{cartCount}</span>}
          </button>

          <div className="user-dropdown-wrapper">
            <button className="icon-btn" onClick={() => setUserMenuOpen(!userMenuOpen)} title="Tài khoản">
              <User size={22} strokeWidth={1.5} />
            </button>
            <div className={`user-dropdown-menu ${userMenuOpen ? 'active' : ''}`} style={{ display: userMenuOpen ? 'block' : 'none' }}>
              <div className="user-dropdown-header">
                <span className="user-name">Khách hàng D'Cor</span>
                <span className="user-role">Thành viên VIP</span>
              </div>
              <ul>
                <li><Link href="/account/profile" className="user-menu-item" onClick={() => setUserMenuOpen(false)}>Hồ sơ cá nhân</Link></li>
                <li><Link href="/account/orders" className="user-menu-item" onClick={() => setUserMenuOpen(false)}>Đơn hàng của tôi</Link></li>
                <li><Link href="/account/wishlist" className="user-menu-item" onClick={() => setUserMenuOpen(false)}>Sản phẩm yêu thích</Link></li>
                <li>
                  <button
                    className="user-menu-item"
                    onClick={() => { toggleTheme(); setUserMenuOpen(false); }}
                    style={{
                      width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '10px 16px', fontSize: '14px', color: 'var(--text-secondary)',
                    }}
                  >
                    <span>{mounted && theme === 'dark' ? 'Chế độ sáng' : 'Chế độ tối'}</span>
                    {mounted && theme === 'dark' ? <Sun size={15} strokeWidth={1.5} /> : <Moon size={15} strokeWidth={1.5} />}
                  </button>
                </li>
                <li><Link href="/admin" className="user-menu-item" onClick={() => setUserMenuOpen(false)} style={{ borderTop: '1px solid var(--border-color)', marginTop: '4px' }}>Hệ thống quản trị Admin</Link></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
