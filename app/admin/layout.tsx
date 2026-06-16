'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const userStr = localStorage.getItem('dcor_user');
    if (userStr) {
      const user = JSON.parse(userStr);
      if (user.role !== 'ADMIN' && user.role !== 'STAFF') {
        alert('Bạn không có quyền truy cập trang quản trị!');
        router.push('/');
      }
    } else {
      alert('Vui lòng đăng nhập tài khoản quản trị!');
      router.push('/login');
    }
  }, []);

  if (!mounted) return null;

  return (
    <div style={{ display: 'flex', minHeight: '80vh', borderTop: '1px solid var(--border-color)' }}>
      <aside style={{ width: '260px', background: 'var(--bg-secondary)', borderRight: '1px solid var(--border-color)', padding: '30px 20px', display: 'flex', flexDirection: 'column', gap: '25px' }}>
        <div>
          <h3 style={{ fontSize: '18px', color: 'var(--accent)', fontWeight: 700 }}>Hệ Thống Admin</h3>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>D'Cor Studio Dashboard</p>
        </div>
        
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <Link 
            href="/admin" 
            className={`user-menu-item ${pathname === '/admin' ? 'active' : ''}`}
            style={{ borderRadius: '8px', padding: '12px 15px', color: pathname === '/admin' ? 'var(--accent)' : 'inherit', background: pathname === '/admin' ? 'var(--bg-tertiary)' : 'none' }}
          >
            Thống kê doanh thu
          </Link>
          <Link 
            href="/admin/products" 
            className={`user-menu-item ${pathname.startsWith('/admin/products') ? 'active' : ''}`}
            style={{ borderRadius: '8px', padding: '12px 15px', color: pathname.startsWith('/admin/products') ? 'var(--accent)' : 'inherit', background: pathname.startsWith('/admin/products') ? 'var(--bg-tertiary)' : 'none' }}
          >
            ️ Quản lý sản phẩm
          </Link>
          <Link 
            href="/admin/orders" 
            className={`user-menu-item ${pathname.startsWith('/admin/orders') ? 'active' : ''}`}
            style={{ borderRadius: '8px', padding: '12px 15px', color: pathname.startsWith('/admin/orders') ? 'var(--accent)' : 'inherit', background: pathname.startsWith('/admin/orders') ? 'var(--bg-tertiary)' : 'none' }}
          >
            Quản lý đơn hàng
          </Link>
          <Link 
            href="/admin/price-proposals" 
            className={`user-menu-item ${pathname.startsWith('/admin/price-proposals') ? 'active' : ''}`}
            style={{ borderRadius: '8px', padding: '12px 15px', color: pathname.startsWith('/admin/price-proposals') ? 'var(--accent)' : 'inherit', background: pathname.startsWith('/admin/price-proposals') ? 'var(--bg-tertiary)' : 'none' }}
          >
            ️ Duyệt đề xuất giá
          </Link>
        </nav>

        <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border-color)', paddingTop: '15px' }}>
          <button 
            onClick={() => {
              localStorage.removeItem('dcor_user');
              router.push('/login');
            }} 
            className="customize-btn" 
            style={{ width: '100%', justifyContent: 'center' }}
          >
            Đăng xuất admin
          </button>
        </div>
      </aside>

      <main style={{ flexGrow: 1, padding: '40px' }}>
        {children}
      </main>
    </div>
  );
}
