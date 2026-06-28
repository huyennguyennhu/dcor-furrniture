'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function OrderSuccessPage() {
  const params = useParams();
  const orderId = params.orderId as string || 'DC-874291';

  const copyToClipboard = () => {
    navigator.clipboard.writeText(orderId);
    alert('Đã copy mã đơn hàng: ' + orderId);
  };

  return (
    <div style={{ padding: '80px 0', minHeight: '85vh', backgroundColor: 'var(--bg-primary)', display: 'flex', alignItems: 'center' }}>
      <div className="container" style={{ maxWidth: '600px', textAlign: 'center' }}>
        
        {/* Icon thành công */}
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: 'rgba(46, 204, 113, 0.1)',
          border: '2px solid #2ECC71',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          margin: '0 auto 30px'
        }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#2ECC71" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>

        <h1 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-title)' }}>Đặt hàng thành công!</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '15px', marginTop: '10px', maxWidth: '450px', margin: '10px auto 30px' }}>
          Cảm ơn bạn đã lựa chọn DCor Studio. Đơn hàng của bạn đã được tiếp nhận và đang được nhân viên xử lý.
        </p>

        {/* Thông tin mã đơn */}
        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          padding: '20px',
          marginBottom: '30px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ textAlign: 'left' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Mã đơn hàng của bạn</span>
            <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--accent)', marginTop: '4px', letterSpacing: '1px' }}>{orderId}</div>
          </div>
          <button 
            onClick={copyToClipboard}
            style={{
              padding: '8px 16px',
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-secondary)',
              borderRadius: '20px',
              fontSize: '13px',
              fontWeight: 600
            }}
          >
            Sao chép mã
          </button>
        </div>

        {/* Hộp gợi ý đăng ký tài khoản cho Guest */}
        <div style={{
          background: 'rgba(188, 95, 19, 0.03)',
          border: '1px solid rgba(188, 95, 19, 0.15)',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '40px',
          textAlign: 'left'
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            Lưu thông tin & Theo dõi đơn hàng?
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '6px', lineHeight: '1.5' }}>
            Tạo nhanh mật khẩu cho số điện thoại của bạn để kích hoạt tài khoản. Bạn có thể theo dõi tiến độ giao hàng, lưu wishlist và dùng Room Planner đồng bộ.
          </p>
          <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
            <input 
              type="password" 
              placeholder="Nhập mật khẩu mới..." 
              style={{
                flexGrow: 1,
                height: '40px',
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '0 12px',
                color: '#fff',
                fontSize: '13px',
                outline: 'none'
              }}
            />
            <button 
              onClick={() => alert('Đã kích hoạt tài khoản thành công!')}
              style={{
                background: 'var(--accent)',
                color: '#fff',
                padding: '0 20px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Kích hoạt
            </button>
          </div>
        </div>

        {/* Nút hành động */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <Link href={`/track-order?id=${orderId}`} className="customize-btn" style={{ padding: '12px 24px' }}>
            Theo dõi đơn hàng
          </Link>
          <Link href="/" className="cta-btn" style={{ textTransform: 'none', padding: '12px 24px' }}>
            Tiếp tục mua sắm
          </Link>
        </div>

      </div>
    </div>
  );
}
