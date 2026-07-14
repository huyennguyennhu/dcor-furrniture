'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, X } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1);
  const [contact, setContact] = useState('');
  const [loading, setLoading] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const isStep1Valid = /^0[35789]\d{8}$/.test(contact);
  const isStep2Valid = newPassword.length >= 6 && newPassword === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (step === 1) {
      setLoading(true);
      try {
        const res = await fetch('/api/auth/check-phone', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: contact }),
        });
        const data = await res.json();
        
        if (!res.ok) {
          setError(data.message || 'Tài khoản không tồn tại');
          setLoading(false);
          return;
        }
        
        setStep(2);
      } catch (err) {
        setError('Lỗi kết nối');
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(true);
      try {
        const res = await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: contact, password: newPassword }),
        });
        const data = await res.json();
        
        if (!res.ok) {
          setError(data.message || 'Lỗi cập nhật mật khẩu');
          setLoading(false);
          return;
        }

        router.push('/login');
      } catch (err) {
        setError('Lỗi kết nối');
      } finally {
        setLoading(false);
      }
    }
  };

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
            <h2 style={{ fontSize: '32px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '10px' }}>Khôi phục mật khẩu</h2>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            <div>
              <label style={{ display: 'block', fontSize: '14px', marginBottom: '8px', fontWeight: 500 }}>Số điện thoại <span style={{ color: 'red' }}>*</span></label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="tel" 
                  value={contact} 
                  onChange={e => {
                    const val = e.target.value.replace(/\D/g, '');
                    setContact(val);
                    if (error) setError('');
                  }}
                  maxLength={10}
                  required 
                  disabled={step === 2}
                  className="auth-input" 
                  placeholder="Nhập số điện thoại của bạn" 
                  autoComplete="off"
                  style={{ paddingRight: '40px', opacity: step === 2 ? 0.6 : 1, cursor: step === 2 ? 'not-allowed' : 'text' }}
                />
                {contact && step === 1 && (
                  <button type="button" onClick={() => setContact('')} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', padding: 0 }}>
                    <X size={18} />
                  </button>
                )}
              </div>
            </div>

            {step === 2 && (
              <>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', marginBottom: '8px', fontWeight: 500 }}>Mật khẩu mới <span style={{ color: 'red' }}>*</span></label>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type={showPassword ? 'text' : 'password'} 
                      required
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
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
                      {newPassword && (
                        <button type="button" onClick={() => setNewPassword('')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', padding: 0 }}>
                          <X size={18} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', marginBottom: '8px', fontWeight: 500 }}>Nhập lại mật khẩu mới <span style={{ color: 'red' }}>*</span></label>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type={showConfirmPassword ? 'text' : 'password'} 
                      required
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (error) setError('');
                      }}
                      placeholder="Nhập lại mật khẩu mới" 
                      className="auth-input"
                      autoComplete="new-password"
                      style={{ paddingRight: '70px' }}
                    />
                    <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', padding: 0 }}>
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                      {confirmPassword && (
                        <button type="button" onClick={() => setConfirmPassword('')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', padding: 0 }}>
                          <X size={18} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}

            <button 
              type="submit" 
              className="checkout-btn" 
              disabled={loading || (step === 1 ? !isStep1Valid : !isStep2Valid)} 
              style={{ width: '100%', padding: '16px', borderRadius: '12px', fontSize: '16px', fontWeight: 600, marginTop: '10px', opacity: (loading || (step === 1 ? !isStep1Valid : !isStep2Valid)) ? 0.5 : 1, cursor: (loading || (step === 1 ? !isStep1Valid : !isStep2Valid)) ? 'not-allowed' : 'pointer' }}
            >
              {loading ? 'Đang xử lý...' : (step === 1 ? 'GỬI YÊU CẦU KHÔI PHỤC' : 'ĐỔI MẬT KHẨU')}
            </button>
            {error && <div style={{ color: 'red', fontSize: '14px', textAlign: 'center', padding: '10px', background: 'rgba(255,0,0,0.05)', borderRadius: '8px', marginTop: '-10px' }}>{error}</div>}
          </form>

          <div style={{ textAlign: 'center', marginTop: '30px', fontSize: '15px' }}>
            <Link href="/login" className="hover-underline-lr" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>← Quay lại đăng nhập</Link>
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
