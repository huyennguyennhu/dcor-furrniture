'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';

import { Eye, EyeOff, X } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Mật khẩu không khớp!');
      return;
    }
    setError('');
    setLoading(true);
    
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone, password, fullName }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Đã xảy ra lỗi, vui lòng thử lại');
        setLoading(false);
        return;
      }

      const loginRes = await signIn('credentials', {
        redirect: false,
        phone,
        password,
      });

      if (loginRes?.error) {
        setError('Đăng ký thành công nhưng hệ thống không thể tự động đăng nhập. Vui lòng chuyển sang trang Đăng nhập.');
      } else {
        router.push('/');
        router.refresh();
      }
    } catch (err) {
      setError('Đã xảy ra lỗi kết nối');
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = fullName.trim() !== '' && /^0[35789]\d{8}$/.test(phone) && password.length >= 6 && confirmPassword === password;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100vw', background: 'var(--bg-primary)' }}>
      {/* Left Column - Image */}
      <div style={{ flex: 1, display: 'none', position: 'relative' }} className="login-image-column">
        <img 
          src="https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&q=80" 
          alt="DCor Interior" 
          style={{ width: '100%', height: '100vh', objectFit: 'cover' }} 
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '60px', color: '#fff' }}>
          <h1 style={{ fontSize: '48px', fontWeight: 300, marginBottom: '20px', letterSpacing: '-1px' }}>DCor Studio</h1>
          <p style={{ fontSize: '18px', opacity: 0.9, maxWidth: '500px', lineHeight: 1.6 }}>Nâng tầm không gian sống với thiết kế nội thất tối giản phong cách Bắc Âu.</p>
        </div>
      </div>

      {/* Right Column - Form */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '40px 20px' }}>
        <div style={{ width: '100%', maxWidth: '420px' }}>
          <div style={{ marginBottom: '40px', textAlign: 'center' }}>
            <h2 style={{ fontSize: '32px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '10px' }}>Tạo tài khoản</h2>
            <p style={{ fontSize: '15px', color: 'var(--text-muted)' }}>Lưu trữ thiết kế và theo dõi đơn hàng của bạn</p>
          </div>

          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
          <div>
            <label style={{ display: 'block', fontSize: '14px', marginBottom: '8px', fontWeight: 500 }}>Họ và tên <span style={{ color: 'red' }}>*</span></label>
            <div style={{ position: 'relative' }}>
              <input 
                type="text" 
                required
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  if (error) setError('');
                }}
                placeholder="Nhập họ và tên của bạn" 
                className="auth-input"
                autoComplete="off"
                style={{ paddingRight: '40px' }}
              />
              {fullName && (
                <button type="button" onClick={() => setFullName('')} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}>
                  <X size={18} />
                </button>
              )}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '14px', marginBottom: '8px', fontWeight: 500 }}>Số điện thoại <span style={{ color: 'red' }}>*</span></label>
            <div style={{ position: 'relative' }}>
              <input 
                type="tel" 
                required
                value={phone}
                onChange={e => {
                  const val = e.target.value.replace(/\D/g, '');
                  setPhone(val);
                  if (error) setError('');
                }}
                maxLength={10}
                placeholder="Nhập số điện thoại của bạn" 
                className="auth-input"
                autoComplete="off"
                style={{ paddingRight: '40px' }}
              />
              {phone && (
                <button type="button" onClick={() => setPhone('')} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}>
                  <X size={18} />
                </button>
              )}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '14px', marginBottom: '8px', fontWeight: 500 }}>Địa chỉ Email</label>
            <div style={{ position: 'relative' }}>
              <input 
                type="email" 
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError('');
                }}
                placeholder="Nhập địa chỉ email của bạn" 
                className="auth-input"
                autoComplete="off"
                style={{ paddingRight: '40px' }}
              />
              {email && (
                <button type="button" onClick={() => setEmail('')} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}>
                  <X size={18} />
                </button>
              )}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '14px', marginBottom: '8px', fontWeight: 500 }}>Mật khẩu <span style={{ color: 'red' }}>*</span></label>
            <div style={{ position: 'relative' }}>
              <input 
                type={showPassword ? 'text' : 'password'} 
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError('');
                }}
                placeholder="Tối thiểu 6 ký tự" 
                className="auth-input"
                autoComplete="new-password"
                style={{ paddingRight: '70px' }}
              />
              <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', padding: 0 }}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
                {password && (
                  <button type="button" onClick={() => setPassword('')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', padding: 0 }}>
                    <X size={18} />
                  </button>
                )}
              </div>
            </div>
            {password.length > 0 && password.length < 6 && (
              <p style={{ color: 'red', fontSize: '12px', marginTop: '6px' }}>Mật khẩu phải có tối thiểu 6 ký tự.</p>
            )}
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '14px', marginBottom: '8px', fontWeight: 500, color: password.length < 6 ? 'var(--text-muted)' : 'inherit' }}>Nhập lại mật khẩu <span style={{ color: 'red' }}>*</span></label>
            <div style={{ position: 'relative' }}>
              <input 
                type={showConfirmPassword ? 'text' : 'password'} 
                required
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (error) setError('');
                }}
                placeholder="Nhập lại mật khẩu" 
                className="auth-input"
                autoComplete="new-password"
                disabled={password.length < 6}
                style={{ paddingRight: '70px', opacity: password.length < 6 ? 0.6 : 1, cursor: password.length < 6 ? 'not-allowed' : 'text' }}
              />
              <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', display: 'flex', gap: '8px', alignItems: 'center', opacity: password.length < 6 ? 0.5 : 1 }}>
                <button type="button" disabled={password.length < 6} onClick={() => setShowConfirmPassword(!showConfirmPassword)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: password.length < 6 ? 'not-allowed' : 'pointer', display: 'flex', padding: 0 }}>
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
                {confirmPassword && (
                  <button type="button" disabled={password.length < 6} onClick={() => setConfirmPassword('')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: password.length < 6 ? 'not-allowed' : 'pointer', display: 'flex', padding: 0 }}>
                    <X size={18} />
                  </button>
                )}
              </div>
            </div>
          </div>

            <button type="submit" className="checkout-btn" disabled={loading || !isFormValid} style={{ width: '100%', padding: '16px', borderRadius: '12px', fontSize: '16px', fontWeight: 600, marginTop: '10px', opacity: (loading || !isFormValid) ? 0.5 : 1, cursor: (loading || !isFormValid) ? 'not-allowed' : 'pointer' }}>
              {loading ? 'Đang xử lý...' : 'ĐĂNG KÝ TÀI KHOẢN'}
            </button>
            {error && <div style={{ color: 'red', fontSize: '14px', textAlign: 'center', padding: '10px', background: 'rgba(255,0,0,0.05)', borderRadius: '8px', marginTop: '-10px' }}>{error}</div>}
        </form>

        <div style={{ textAlign: 'center', marginTop: '30px', fontSize: '15px' }}>
          <span style={{ color: 'var(--text-muted)' }}>Đã có tài khoản? </span>
          <Link href="/login" className="hover-underline-lr" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>Đăng nhập ngay</Link>
        </div>

        <div style={{ textAlign: 'center', marginTop: '30px', fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
          Bằng việc đăng ký bạn đồng ý với<br />
          <a href="#" style={{ color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 500 }}>Điều khoản sử dụng</a> và <a href="#" style={{ color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 500 }}>Chính sách bảo mật</a> của DCor Studio
        </div>
      </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @media (min-width: 900px) {
          .login-image-column {
            display: block !important;
          }
        }
      `}} />
    </div>
  );
}
