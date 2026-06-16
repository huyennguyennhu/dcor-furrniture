'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const menuItems = [
    { name: 'Tổng quan tài khoản', path: '/account' },
    { name: 'Hồ sơ cá nhân', path: '/account/profile' },
    { name: 'Đơn hàng của tôi', path: '/account/orders' },
    { name: 'Sổ địa chỉ giao hàng', path: '/account/addresses' },
    { name: 'Danh sách yêu thích', path: '/account/wishlist' },
    { name: 'Thiết kế đã lưu (Planner)', path: '/account/room-designs' },
    { name: 'Bài viết cộng đồng của tôi', path: '/account/posts' },
    { name: 'Đánh giá của tôi', path: '/account/reviews' },
    { name: 'Yêu cầu đổi trả', path: '/account/returns' }
  ];

  return (
    <div style={{ padding: '50px 0', minHeight: '85vh', backgroundColor: 'var(--bg-primary)' }}>
      <div className="container">
        
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '40px', alignItems: 'start' }}>
          
          {/* Sidebar */}
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: 'var(--card-shadow)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '10px', textAlign: 'center' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--accent)', color: '#fff', fontSize: '24px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold', margin: '0 auto 12px' }}>
                K
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Khách hàng Demo</h3>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Mã KH: DC-98765</span>
            </div>

            <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {menuItems.map(item => {
                const isActive = pathname === item.path;
                return (
                  <Link 
                    key={item.path} 
                    href={item.path}
                    style={{
                      display: 'block',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: isActive ? 600 : 500,
                      background: isActive ? 'var(--accent)' : 'transparent',
                      color: isActive ? '#fff' : 'var(--text-secondary)',
                      transition: 'all 0.2s ease',
                      border: `1px solid ${isActive ? 'var(--accent)' : 'transparent'}`
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'var(--bg-tertiary)';
                        e.currentTarget.style.color = 'var(--accent)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = 'var(--text-secondary)';
                      }
                    }}
                  >
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            <button 
              onClick={() => alert('Đăng xuất tài khoản...')}
              style={{
                marginTop: '20px',
                padding: '12px',
                width: '100%',
                background: 'rgba(231, 76, 60, 0.1)',
                border: '1px solid #E74C3C',
                color: '#E74C3C',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                textAlign: 'center'
              }}
            >
              Đăng xuất
            </button>
          </div>

          {/* Nội dung trang con */}
          <div>
            {children}
          </div>

        </div>

      </div>
    </div>
  );
}
