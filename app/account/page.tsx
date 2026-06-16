'use client';

import React from 'react';
import Link from 'next/link';

export default function AccountDashboardPage() {
  return (
    <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '30px', boxShadow: 'var(--card-shadow)' }}>
      
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-title)' }}>Tổng quan tài khoản</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>Chào mừng bạn quay lại! Tại đây bạn có thể quản lý thông tin cá nhân và đơn đặt hàng.</p>
      </div>

      {/* Grid thống kê nhanh */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '40px' }}>
        <div style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Đơn hàng gần đây</span>
          <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--accent)', marginTop: '8px' }}>1 đơn</div>
          <Link href="/account/orders" style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginTop: '12px', textDecoration: 'underline' }}>Xem tất cả →</Link>
        </div>

        <div style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Yêu thích đã lưu</span>
          <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--accent)', marginTop: '8px' }}>5 mẫu</div>
          <Link href="/account/wishlist" style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginTop: '12px', textDecoration: 'underline' }}>Xem chi tiết →</Link>
        </div>

        <div style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Bản vẽ Room Planner</span>
          <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--accent)', marginTop: '8px' }}>2 bản</div>
          <Link href="/account/room-designs" style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginTop: '12px', textDecoration: 'underline' }}>Xem thiết kế →</Link>
        </div>
      </div>

      {/* Thông tin cá nhân cơ bản */}
      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '30px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px', textTransform: 'uppercase' }}>Thông tin hồ sơ</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block' }}>Họ và tên:</span>
            <strong style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Khách hàng Demo</strong>
          </div>
          <div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block' }}>Số điện thoại:</span>
            <strong style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>0901234567</strong>
          </div>
          <div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block' }}>Email:</span>
            <strong style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>khachhang.demo@gmail.com</strong>
          </div>
          <div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block' }}>Hạng thành viên:</span>
            <strong style={{ fontSize: '14px', color: 'var(--accent)' }}>Thành viên Vàng (Tích lũy 100 điểm)</strong>
          </div>
        </div>
      </div>

    </div>
  );
}
