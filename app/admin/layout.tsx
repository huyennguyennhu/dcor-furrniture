'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
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
      // Bỏ comment dòng dưới để test dễ dàng nếu chưa làm login admin
      // alert('Vui lòng đăng nhập tài khoản quản trị!');
      // router.push('/login');
    }
  }, [router]);

  if (!mounted) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', backgroundColor: 'var(--bg-primary)' }}>
      <AdminHeader />
      <div style={{ flexGrow: 1, display: 'flex', overflow: 'hidden' }}>
        <AdminSidebar />
        <main style={{ flexGrow: 1, padding: '32px', overflowY: 'auto', backgroundColor: '#fcf8f3', minWidth: 0 }}>
          {children}
        </main>
      </div>
    </div>
  );
}
