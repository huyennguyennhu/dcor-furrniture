'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (otp === '123456') {
        const isAdmin = phone === '0999999999';
        
        localStorage.setItem('dcor_user', JSON.stringify({
          phone,
          role: isAdmin ? 'ADMIN' : 'CUSTOMER',
          name: isAdmin ? 'D\'Cor Administrator' : 'Khách hàng VIP'
        }));

        alert(`Đăng nhập thành công! Chào mừng ${isAdmin ? 'Admin' : 'Khách hàng'}.`);
        
        if (isAdmin) {
          router.push('/admin');
        } else {
          router.push('/');
        }
      } else {
        alert('Mã OTP không đúng! (Vui lòng dùng mã OTP kiểm thử: 123456)');
      }
    } catch (err) {
      alert('Đã xảy ra lỗi đăng nhập!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', padding: '20px' }}>
      <div className="filters-container" style={{ width: '100%', maxWidth: '400px', flexDirection: 'column', gap: '20px', padding: '40px 30px' }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--accent)' }}>Đăng Nhập OTP</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '5px' }}>Dành cho cả khách hàng và ban quản trị</p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px', width: '100%' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', marginBottom: '6px' }}>Số điện thoại</label>
            <input 
              type="tel" 
              required 
              className="search-input" 
              placeholder="Nhập SĐT của bạn (Admin: 0999999999)" 
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              style={{ width: '100%', borderRadius: '22px', padding: '0 20px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', marginBottom: '6px' }}>Mã xác thực OTP</label>
            <input 
              type="text" 
              required 
              className="search-input" 
              placeholder="Nhập mã OTP (Dùng mã test: 123456)" 
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              style={{ width: '100%', borderRadius: '22px', padding: '0 20px' }}
            />
          </div>

          <button 
            type="submit" 
            className="checkout-btn" 
            disabled={loading}
            style={{ width: '100%', marginTop: '10px' }}
          >
            {loading ? 'Đang xử lý...' : 'Xác thực & Đăng nhập'}
          </button>
        </form>

        <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', lineHeight: '1.4' }}>
          <p>Đăng nhập bằng <strong>0999999999</strong> để vào giao diện quản trị Admin.</p>
          <p>Đăng nhập bằng SĐT bất kỳ để đăng nhập tài khoản Khách hàng.</p>
        </div>
      </div>
    </div>
  );
}
