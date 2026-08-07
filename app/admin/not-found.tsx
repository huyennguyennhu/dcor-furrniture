import React from 'react';
import Link from 'next/link';

export default function AdminNotFound() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '40px', textAlign: 'center' }}>
      <h2 style={{ fontSize: '32px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px' }}>404 - Chưa tìm thấy trang</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', maxWidth: '400px' }}>
        Tính năng này hiện đang được phát triển hoặc đường dẫn không tồn tại. Vui lòng quay lại sau!
      </p>
      <Link href="/admin/products" style={{ padding: '10px 20px', background: 'var(--accent)', color: 'white', borderRadius: '8px', textDecoration: 'none', fontWeight: 600 }}>
        Quay về Trang Quản lý Sản phẩm
      </Link>
    </div>
  );
}
