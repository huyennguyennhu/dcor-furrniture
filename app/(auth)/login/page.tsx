'use client';
import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { Eye, EyeOff, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate VN phone
    const phoneRegex = /^0[35789]\d{8}$/;
    if (!phoneRegex.test(phone)) {
      setError('Số điện thoại không hợp lệ. Vui lòng nhập số điện thoại Việt Nam (10 số, bắt đầu bằng 03, 05, 07, 08 hoặc 09).');
      setLoading(false);
      return;
    }

    try {
      const res = await signIn('credentials', {
        redirect: false,
        phone,
        password,
      });

      if (res?.error) {
        setError('Thông tin đăng nhập không chính xác');
      } else {
        router.push('/');
        router.refresh();
      }
    } catch (err) {
      setError('Đã xảy ra lỗi, vui lòng thử lại');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    setLoading(true);
    signIn('google', { callbackUrl: '/' });
  };

  const isFormValid = /^0[35789]\d{8}$/.test(phone) && password.length >= 6;

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
            <h2 style={{ fontSize: '32px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '10px' }}>Welcome Back</h2>
            <p style={{ fontSize: '15px', color: 'var(--text-muted)' }}>Đăng nhập để tiếp tục mua sắm</p>
          </div>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            <div>
              <label style={{ display: 'block', fontSize: '14px', marginBottom: '8px', fontWeight: 500 }}>Số điện thoại <span style={{ color: 'red' }}>*</span></label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="tel" 
                  value={phone} 
                  onChange={e => {
                    const val = e.target.value.replace(/\D/g, '');
                    setPhone(val);
                    if (error) setError('');
                  }} 
                  maxLength={10}
                  required 
                  className="auth-input" 
                  placeholder="Nhập số điện thoại" 
                  autoComplete="off"
                  style={{ paddingRight: '40px' }}
                />
                {phone && (
                  <button type="button" onClick={() => setPhone('')} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', padding: 0 }}>
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
                  value={password} 
                  onChange={e => {
                    setPassword(e.target.value);
                    if (error) setError('');
                  }} 
                  required 
                  className="auth-input" 
                  style={{ paddingRight: '70px' }} 
                  placeholder="Nhập mật khẩu" 
                  autoComplete="new-password"
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
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px' }}>
              <label className="auth-checkbox-label">
                <input type="checkbox" className="auth-checkbox" defaultChecked /> Ghi nhớ đăng nhập
              </label>
              <Link href="/forgot-password" className="hover-underline-lr" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>Quên mật khẩu?</Link>
            </div>

            <button type="submit" className="checkout-btn" disabled={loading || !isFormValid} style={{ width: '100%', padding: '16px', borderRadius: '12px', fontSize: '16px', fontWeight: 600, marginTop: '10px', opacity: (loading || !isFormValid) ? 0.5 : 1, cursor: (loading || !isFormValid) ? 'not-allowed' : 'pointer' }}>
              {loading ? 'Đang xử lý...' : 'ĐĂNG NHẬP'}
            </button>
            {error && <div style={{ color: 'red', fontSize: '14px', textAlign: 'center', padding: '10px', background: 'rgba(255,0,0,0.05)', borderRadius: '8px', marginTop: '-10px' }}>{error}</div>}
          </form>

          <div style={{ display: 'flex', alignItems: 'center', margin: '30px 0', gap: '15px' }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></div>
            <span style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: 500 }}>Hoặc</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></div>
          </div>

          <button type="button" onClick={handleGoogleLogin} className="google-auth-btn">
            <span className="google-auth-btn-bg"></span>
            <span className="google-auth-btn-content">
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Tiếp tục với Google
            </span>
          </button>

          <div style={{ textAlign: 'center', marginTop: '30px', fontSize: '15px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Bạn chưa có tài khoản? </span>
            <Link href="/register" className="hover-underline-lr" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>Đăng ký ngay</Link>
          </div>

          <div style={{ textAlign: 'center', marginTop: '30px', fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
            Bằng việc đăng nhập bạn đồng ý với<br />
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

