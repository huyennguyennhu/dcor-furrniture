'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CheckoutPage() {
  const router = useRouter();
  
  // Trạng thái Form giao hàng
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  // Trạng thái Gift Order
  const [isGift, setIsGift] = useState(false);
  const [giftReceiver, setGiftReceiver] = useState('');
  const [giftPhone, setGiftPhone] = useState('');
  const [giftAddress, setGiftAddress] = useState('');
  const [giftMessage, setGiftMessage] = useState('');
  const [hidePrice, setHidePrice] = useState(false);

  // Phương thức thanh toán
  const [paymentMethod, setPaymentMethod] = useState('COD');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Giả lập tạo Order ID
    const randomOrderId = 'DC-' + Math.floor(100000 + Math.random() * 900000);
    
    // Redirect sang trang thành công
    router.push(`/order-success/${randomOrderId}`);
  };

  return (
    <div style={{ padding: '60px 0', minHeight: '90vh', backgroundColor: 'var(--bg-primary)' }}>
      <div className="container">
        
        <div style={{ marginBottom: '40px' }}>
          <span style={{ color: 'var(--accent)', fontSize: '14px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase' }}>Quy trình mua hàng</span>
          <h1 style={{ fontSize: '36px', fontWeight: 800, marginTop: '8px', color: 'var(--text-primary)', fontFamily: 'var(--font-title)' }}>Thanh toán đơn hàng</h1>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '40px', alignItems: 'start' }}>
          
          {/* Cột trái: Form thông tin */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            
            {/* Thông tin người mua */}
            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '30px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '20px', color: 'var(--text-primary)' }}>1. Thông tin giao hàng</h2>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Họ và tên *</label>
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
                  <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Số điện thoại *</label>
                  <input 
                    type="tel" 
                    required 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0901234567" 
                    style={{ width: '100%', height: '44px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0 16px', color: '#fff', fontSize: '14px', outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Địa chỉ Email (Nhận hóa đơn)</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nguyenvana@gmail.com" 
                  style={{ width: '100%', height: '44px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0 16px', color: '#fff', fontSize: '14px', outline: 'none' }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Địa chỉ giao hàng đầy đủ *</label>
                <input 
                  type="text" 
                  required 
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Số nhà, Tên đường, Phường/Xã, Quận/Huyện, Tỉnh/Thành phố" 
                  style={{ width: '100%', height: '44px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0 16px', color: '#fff', fontSize: '14px', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Ghi chú đơn hàng</label>
                <textarea 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ghi chú thêm về thời gian giao hàng, hướng dẫn chỉ đường..." 
                  style={{ width: '100%', height: '80px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '12px 16px', color: '#fff', fontSize: '14px', outline: 'none', resize: 'none' }}
                />
              </div>
            </div>

            {/* Tính năng Gift Order (Giao cho người khác) */}
            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '30px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>Gửi tặng làm Quà tặng</h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '2px' }}>Giao hàng cho người nhận khác, thêm lời chúc và ẩn hóa đơn giá trị.</p>
                </div>
                <label className="switch" style={{ position: 'relative', display: 'inline-block', width: '50px', height: '26px' }}>
                  <input 
                    type="checkbox" 
                    checked={isGift}
                    onChange={(e) => setIsGift(e.target.checked)}
                    style={{ opacity: 0, width: 0, height: 0 }} 
                  />
                  <span style={{ 
                    position: 'absolute', 
                    cursor: 'pointer', 
                    top: 0, left: 0, right: 0, bottom: 0, 
                    backgroundColor: isGift ? 'var(--accent)' : 'rgba(255, 255, 255, 0.1)', 
                    transition: '.4s', 
                    borderRadius: '34px' 
                  }}>
                    <span style={{ 
                      position: 'absolute', 
                      content: '""', 
                      height: '18px', width: '18px', 
                      left: isGift ? '28px' : '4px', 
                      bottom: '4px', 
                      backgroundColor: 'white', 
                      transition: '.4s', 
                      borderRadius: '50%' 
                    }}></span>
                  </span>
                </label>
              </div>

              {isGift && (
                <div style={{ marginTop: '24px', borderTop: '1px solid var(--border-color)', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Tên người nhận *</label>
                      <input 
                        type="text" 
                        required={isGift}
                        value={giftReceiver}
                        onChange={(e) => setGiftReceiver(e.target.value)}
                        placeholder="Họ tên người nhận quà" 
                        style={{ width: '100%', height: '44px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0 16px', color: '#fff', fontSize: '14px', outline: 'none' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Số điện thoại người nhận *</label>
                      <input 
                        type="tel" 
                        required={isGift}
                        value={giftPhone}
                        onChange={(e) => setGiftPhone(e.target.value)}
                        placeholder="SĐT người nhận" 
                        style={{ width: '100%', height: '44px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0 16px', color: '#fff', fontSize: '14px', outline: 'none' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Địa chỉ giao quà *</label>
                    <input 
                      type="text" 
                      required={isGift}
                      value={giftAddress}
                      onChange={(e) => setGiftAddress(e.target.value)}
                      placeholder="Địa chỉ chi tiết nơi nhận quà" 
                      style={{ width: '100%', height: '44px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0 16px', color: '#fff', fontSize: '14px', outline: 'none' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Lời nhắn chúc mừng (Thiệp tặng kèm)</label>
                    <textarea 
                      value={giftMessage}
                      onChange={(e) => setGiftMessage(e.target.value)}
                      placeholder="Chúc mừng tân gia! Hy vọng món quà này mang lại sự ấm áp..." 
                      style={{ width: '100%', height: '80px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '12px 16px', color: '#fff', fontSize: '14px', outline: 'none', resize: 'none' }}
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
                    <input 
                      type="checkbox" 
                      id="hidePrice" 
                      checked={hidePrice}
                      onChange={(e) => setHidePrice(e.target.checked)}
                      style={{ accentColor: 'var(--accent)', width: '18px', height: '18px', cursor: 'pointer' }} 
                    />
                    <label htmlFor="hidePrice" style={{ fontSize: '13px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                      <strong>Ẩn thông tin giá bán</strong> trên hóa đơn giao hàng đi kèm.
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Chọn phương thức thanh toán */}
            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '30px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '20px', color: 'var(--text-primary)' }}>2. Phương thức thanh toán</h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '16px',
                  background: paymentMethod === 'COD' ? 'rgba(188, 95, 19, 0.05)' : 'var(--bg-tertiary)',
                  border: `1px solid ${paymentMethod === 'COD' ? 'var(--accent)' : 'var(--border-color)'}`,
                  borderRadius: '12px',
                  cursor: 'pointer'
                }}>
                  <input type="radio" name="payment" value="COD" checked={paymentMethod === 'COD'} onChange={() => setPaymentMethod('COD')} style={{ accentColor: 'var(--accent)', width: '18px', height: '18px' }} />
                  <div>
                    <strong style={{ display: 'block', fontSize: '14px' }}>Thanh toán khi nhận hàng (COD)</strong>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Nhận hàng kiểm tra và thanh toán trực tiếp cho shipper.</span>
                  </div>
                </label>

                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '16px',
                  background: paymentMethod === 'ONLINE' ? 'rgba(188, 95, 19, 0.05)' : 'var(--bg-tertiary)',
                  border: `1px solid ${paymentMethod === 'ONLINE' ? 'var(--accent)' : 'var(--border-color)'}`,
                  borderRadius: '12px',
                  cursor: 'pointer'
                }}>
                  <input type="radio" name="payment" value="ONLINE" checked={paymentMethod === 'ONLINE'} onChange={() => setPaymentMethod('ONLINE')} style={{ accentColor: 'var(--accent)', width: '18px', height: '18px' }} />
                  <div>
                    <strong style={{ display: 'block', fontSize: '14px' }}>Thanh toán trực tuyến (Stripe / Thẻ tín dụng)</strong>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Thanh toán nhanh chóng qua cổng Stripe bằng thẻ nội địa hoặc quốc tế.</span>
                  </div>
                </label>
              </div>
            </div>

          </div>

          {/* Cột phải: Tóm tắt giỏ hàng */}
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '24px', boxShadow: 'var(--card-shadow)', position: 'sticky', top: '100px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>Đơn hàng của bạn</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Sofa Indivi 3 chỗ (x1)</span>
                <span style={{ fontWeight: 600 }}>42,250,000 ₫</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Bàn console Bordeaux (x2)</span>
                <span style={{ fontWeight: 600 }}>35,980,000 ₫</span>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: 'var(--text-secondary)' }}>
                <span>Tạm tính</span>
                <span>78,230,000 ₫</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: 'var(--text-secondary)' }}>
                <span>Giao hàng</span>
                <span style={{ color: '#2ECC71', fontWeight: 600 }}>Miễn phí</span>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
              <span style={{ fontSize: '16px', fontWeight: 700 }}>Tổng tiền:</span>
              <span style={{ fontSize: '24px', fontWeight: 800, color: 'var(--accent)', fontFamily: 'var(--font-title)' }}>78,230,000 ₫</span>
            </div>

            <button 
              type="submit" 
              style={{
                width: '100%',
                background: 'var(--accent)',
                color: '#fff',
                padding: '16px',
                borderRadius: '30px',
                fontSize: '16px',
                fontWeight: 600,
                boxShadow: '0 8px 25px rgba(var(--accent-rgb), 0.3)',
                transition: 'all 0.2s ease',
                cursor: 'pointer'
              }}
            >
              Đặt hàng ngay
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
