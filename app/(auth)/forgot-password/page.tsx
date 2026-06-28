'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [contact, setContact] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Một đường liên kết khôi phục mật khẩu / mã xác minh OTP đã được gửi đến: ' + contact);
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '85vh', backgroundColor: 'var(--bg-primary)' }}>
      <div style={{
        width: '100%',
        maxWidth: '440px',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: '24px',
        padding: '40px',
        boxShadow: 'var(--glass-shadow)',
        margin: '20px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div className="logo" style={{ justifyContent: 'center', marginBottom: '16px' }}>
            <div className="logo-circle">
              <span className="logo-circle-text">DCOR</span>
            </div>
            <span className="logo-text">DCor</span>
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-title)' }}>Khôi phục mật khẩu</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '6px' }}>Nhập số điện thoại hoặc email liên kết để nhận hướng dẫn đặt lại mật khẩu.</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600 }}>Số điện thoại hoặc Email *</label>
            <input 
              type="text" 
              required
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="Nhập SĐT hoặc Email của bạn..." 
              style={{ width: '100%', height: '44px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0 16px', color: '#fff', fontSize: '14px', outline: 'none' }}
            />
          </div>

          <button 
            type="submit" 
            style={{
              width: '100%',
              background: 'var(--accent)',
              color: '#fff',
              height: '46px',
              borderRadius: '23px',
              fontSize: '15px',
              fontWeight: 600,
              boxShadow: '0 4px 15px rgba(var(--accent-rgb), 0.3)',
              cursor: 'pointer'
            }}
          >
            Gửi yêu cầu khôi phục
          </button>
        </form>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '24px', fontSize: '13px', color: 'var(--text-muted)' }}>
          <Link href="/login" style={{ color: 'var(--accent)', fontWeight: 600 }}>← Quay lại đăng nhập</Link>
        </div>

      </div>
    </div>
  );
}
