'use client';

import React, { useState } from 'react';

export default function ProfilePage() {
  const [fullName, setFullName] = useState('Khách hàng Demo');
  const [email, setEmail] = useState('khachhang.demo@gmail.com');
  const [phone, setPhone] = useState('0901234567');
  const [avatar, setAvatar] = useState('https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Đã cập nhật thông tin hồ sơ cá nhân thành công!');
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatar(URL.createObjectURL(file));
    }
  };

  return (
    <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '30px', boxShadow: 'var(--card-shadow)' }}>
      
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-title)' }}>Hồ sơ cá nhân</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>Cập nhật thông tin tài khoản của bạn để đảm bảo liên lạc và giao nhận hàng chính xác.</p>
      </div>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Chỉnh avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '24px' }}>
          <img src={avatar} alt="Avatar" style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--accent)' }} />
          <div>
            <label style={{ display: 'inline-block', padding: '8px 16px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
              Thay đổi ảnh đại diện
              <input type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} />
            </label>
            <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Chấp nhận định dạng JPG, PNG kích thước dưới 2MB.</span>
          </div>
        </div>

        {/* Các trường nhập */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>Họ và tên *</label>
            <input 
              type="text" 
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              style={{ width: '100%', height: '44px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0 16px', color: '#fff', fontSize: '14px', outline: 'none' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>Số điện thoại đặt hàng (Đăng nhập) *</label>
            <input 
              type="tel" 
              required
              disabled
              value={phone}
              style={{ width: '100%', height: '44px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0 16px', color: 'var(--text-muted)', fontSize: '14px', outline: 'none', cursor: 'not-allowed' }}
            />
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', display: 'block' }}>Số điện thoại dùng để đăng nhập OTP nên không thể sửa.</span>
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>Địa chỉ Email *</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: '100%', height: '44px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0 16px', color: '#fff', fontSize: '14px', outline: 'none' }}
            />
          </div>
        </div>

        <button 
          type="submit" 
          style={{
            alignSelf: 'start',
            background: 'var(--accent)',
            color: '#fff',
            padding: '12px 30px',
            borderRadius: '25px',
            fontSize: '14px',
            fontWeight: 600,
            boxShadow: '0 4px 15px rgba(var(--accent-rgb), 0.2)',
            cursor: 'pointer'
          }}
        >
          Lưu thay đổi
        </button>

      </form>

    </div>
  );
}
