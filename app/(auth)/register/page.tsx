'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Đăng ký tài khoản thành công! Vui lòng đăng nhập.');
    router.push('/login');
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '90vh', backgroundColor: 'var(--bg-primary)' }}>
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
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-title)' }}>Đăng ký tài khoản</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '6px' }}>Tạo tài khoản để lưu trữ các thiết kế 3D và theo dõi đơn hàng của bạn.</p>
        </div>

        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>Họ và tên *</label>
            <input 
              type="text" 
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nguyễn Văn A" 
              style={{ width: '100%', height: '44px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0 16px', color: '#fff', fontSize: '14px', outline: 'none' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>Số điện thoại *</label>
            <input 
              type="tel" 
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Nhập số điện thoại đăng nhập OTP..." 
              style={{ width: '100%', height: '44px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0 16px', color: '#fff', fontSize: '14px', outline: 'none' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>Địa chỉ Email *</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nguyenvana@gmail.com" 
              style={{ width: '100%', height: '44px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0 16px', color: '#fff', fontSize: '14px', outline: 'none' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>Mật khẩu bảo mật *</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Tối thiểu 6 ký tự..." 
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
              cursor: 'pointer',
              marginTop: '10px'
            }}
          >
            Đăng ký
          </button>
        </form>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '24px', fontSize: '13px', color: 'var(--text-muted)' }}>
          <span>Đã có tài khoản?</span>
          <Link href="/login" style={{ color: 'var(--accent)', fontWeight: 600 }}>Đăng nhập ngay</Link>
        </div>

      </div>
    </div>
  );
}
