'use client';

import React, { useState } from 'react';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Thông tin liên hệ của bạn đã được tiếp nhận. Chúng tôi sẽ phản hồi lại qua Email sớm nhất có thể!');
    setName('');
    setEmail('');
    setSubject('');
    setMessage('');
  };

  return (
    <div style={{ padding: '60px 0', minHeight: '80vh', backgroundColor: 'var(--bg-primary)' }}>
      <div className="container">
        
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <span style={{ color: 'var(--accent)', fontSize: '14px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase' }}>Liên kết với chúng tôi</span>
          <h1 style={{ fontSize: '38px', fontWeight: 800, marginTop: '8px', color: 'var(--text-primary)', fontFamily: 'var(--font-title)' }}>Liên hệ D'Cor Studio</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '15px', marginTop: '6px' }}>Chúng tôi luôn sẵn sàng lắng nghe ý kiến và hỗ trợ thiết kế không gian sống của bạn.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '50px', alignItems: 'stretch' }}>
          
          {/* Cột trái: Thông tin showroom */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            
            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '30px', boxShadow: 'var(--card-shadow)' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px', color: 'var(--text-primary)', textTransform: 'uppercase' }}>Trụ sở chính & Showroom</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                <p><strong>Địa chỉ:</strong> 280 An Dương Vương, Phường 4, Quận 5, Thành phố Hồ Chí Minh, Việt Nam</p>
                <p><strong>Hotline tư vấn:</strong> 1800 6543 (Miễn phí cuộc gọi)</p>
                <p><strong>Giờ mở cửa:</strong> 8:00 AM - 9:30 PM (Cả tuần)</p>
                <p><strong>Email hỗ trợ:</strong> support@dcorstudio.vn</p>
              </div>
            </div>

            {/* Bản đồ giả lập */}
            <div style={{
              flexGrow: 1,
              borderRadius: '16px',
              overflow: 'hidden',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-secondary)',
              position: 'relative',
              minHeight: '240px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              <div style={{
                width: '100%',
                height: '100%',
                backgroundImage: 'url(https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=600&q=80)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                position: 'absolute',
                top: 0,
                left: 0,
                opacity: 0.2
              }}></div>
              <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', padding: '20px' }}>
                <strong style={{ display: 'block', fontSize: '15px', color: 'var(--text-primary)' }}>Bản đồ Showroom D'Cor</strong>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginTop: '6px' }}>Nhấp để mở chỉ đường trên Google Maps</span>
              </div>
            </div>

          </div>

          {/* Cột phải: Form liên hệ */}
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '30px', boxShadow: 'var(--card-shadow)' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px', color: 'var(--text-primary)', textTransform: 'uppercase' }}>️ Gửi lời nhắn cho chúng tôi</h3>
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Họ và tên *</label>
                <input 
                  type="text" 
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nguyễn Văn A" 
                  style={{ width: '100%', height: '44px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0 16px', color: '#fff', fontSize: '14px', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Địa chỉ Email *</label>
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
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Chủ đề liên hệ *</label>
                <input 
                  type="text" 
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Tư vấn thiết kế, hỏi sản phẩm..." 
                  style={{ width: '100%', height: '44px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0 16px', color: '#fff', fontSize: '14px', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Nội dung chi tiết *</label>
                <textarea 
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Vui lòng nhập chi tiết câu hỏi hoặc yêu cầu tư vấn..." 
                  style={{ width: '100%', height: '120px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '12px 16px', color: '#fff', fontSize: '14px', outline: 'none', resize: 'none' }}
                />
              </div>

              <button 
                type="submit" 
                style={{
                  background: 'var(--accent)',
                  color: '#fff',
                  padding: '14px 28px',
                  borderRadius: '25px',
                  fontSize: '14px',
                  fontWeight: 600,
                  boxShadow: '0 4px 15px rgba(var(--accent-rgb), 0.2)',
                  alignSelf: 'start',
                  cursor: 'pointer'
                }}
              >
                Gửi liên hệ
              </button>
            </form>
          </div>

        </div>

      </div>
    </div>
  );
}
