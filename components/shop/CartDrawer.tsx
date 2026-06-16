'use client';

import React, { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { cart, removeFromCart, clearCart } = useStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen) return null;

  const cartItems = mounted ? cart : [];
  const totalPrice = cartItems.reduce((sum, item) => sum + item.price, 0);

  const formatVND = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(value);
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) return;
    alert("Cảm ơn bạn đã trải nghiệm thiết kế! Yêu cầu đặt hàng của bạn đã được giả lập thành công.");
    clearCart();
    onClose();
  };

  return (
    <div className="cart-drawer-overlay active" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="cart-drawer">
        <div className="cart-header">
          <h3>Giỏ hàng của bạn</h3>
          <button className="close-btn" onClick={onClose} style={{ padding: '0 12px' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
            </svg>
          </button>
        </div>
        
        <div className="cart-items-wrapper">
          {cartItems.length === 0 ? (
            <div className="cart-empty-message" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', gap: '15px' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/>
                <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>
              </svg>
              <p>Giỏ hàng đang trống</p>
            </div>
          ) : (
            cartItems.map((item, index) => (
              <div className="cart-item" key={index} style={{ display: 'flex', gap: '15px', padding: '15px 0', borderBottom: '1px solid var(--border-color)', position: 'relative' }}>
                <div className="cart-item-image" style={{ width: '80px', height: '80px', flexShrink: 0 }}>
                  <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} />
                </div>
                <div className="cart-item-details" style={{ flexGrow: 1 }}>
                  <h4 className="cart-item-title" style={{ fontSize: '15px', fontWeight: 600 }}>{item.name}</h4>
                  <p className="cart-item-specs" style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {item.leg && <><span>Chân: {item.leg.name}</span><br /></>}
                    {item.upholstery && <span>Vải bọc: {item.upholstery.name}</span>}
                  </p>
                  <div className="cart-item-price" style={{ fontSize: '14px', fontWeight: 700, color: 'var(--accent)', marginTop: '8px' }}>
                    {formatVND(item.price)}
                  </div>
                </div>
                <button 
                  className="cart-item-remove" 
                  onClick={() => removeFromCart(index)}
                  title="Xóa khỏi giỏ hàng"
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', position: 'absolute', right: '0', top: '15px' }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/>
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>
        
        {cartItems.length > 0 && (
          <div className="cart-footer">
            <div className="cart-summary-row">
              <span>Tổng số tiền:</span>
              <span className="cart-summary-total">{formatVND(totalPrice)}</span>
            </div>
            <button className="checkout-btn" onClick={handleCheckout}>Đặt Hàng & Thanh Toán</button>
          </div>
        )}
      </div>
    </div>
  );
}
