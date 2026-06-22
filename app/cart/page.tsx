'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useStore, CartItem } from '@/lib/store';
import { useRouter } from 'next/navigation';

export default function CartPage() {
  const [mounted, setMounted] = useState(false);
  const cartItems = useStore(state => state.cart);
  const updateQuantity = useStore(state => state.updateQuantity);
  const removeFromCart = useStore(state => state.removeFromCart);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const groupedCart = useMemo(() => {
    const groups: { productId: string; name: string; items: { item: CartItem, originalIndex: number }[] }[] = [];
    for (let i = cartItems.length - 1; i >= 0; i--) {
      const item = cartItems[i];
      let group = groups.find(g => g.productId === item.productId);
      if (!group) {
        group = { productId: item.productId, name: item.name, items: [] };
        groups.push(group);
      }
      group.items.push({ item, originalIndex: i });
    }
    return groups;
  }, [cartItems]);

  const subTotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shippingFee = subTotal > 50000000 ? 0 : 250000;
  const totalAmount = subTotal + shippingFee;

  const formatCurrency = (val: number) => {
    return val.toLocaleString('vi-VN') + ' ₫';
  };

  return (
    <div style={{ padding: '60px 0', minHeight: '80vh', backgroundColor: 'var(--bg-primary)' }}>
      <div className="container">
        
        <div style={{ marginBottom: '40px' }}>
          <span style={{ color: 'var(--accent)', fontSize: '14px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase' }}>Giỏ hàng của bạn</span>
          <h1 style={{ fontSize: '36px', fontWeight: 800, marginTop: '8px', color: 'var(--text-primary)', fontFamily: 'var(--font-title)' }}>Chi tiết Giỏ hàng</h1>
        </div>

        {cartItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 40px', background: 'var(--bg-secondary)', borderRadius: '16px', border: '1px dashed var(--border-color)' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '16px', marginBottom: '20px' }}>Giỏ hàng của bạn đang rỗng.</p>
            <Link href="/" className="cta-btn">
              Quay lại mua sắm
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '30px', alignItems: 'start' }}>
            
            {/* Cột trái: Danh sách sản phẩm */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {groupedCart.map(group => (
                <div key={group.productId} style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  boxShadow: 'var(--card-shadow)'
                }}>
                  {/* Group Header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 24px', borderBottom: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.02)' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 7v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7"/><path d="M4 15h16"/><path d="M4 11h16"/><path d="M12 4v7"/><path d="M8 7v4"/><path d="M16 7v4"/><path d="M12 2v2"/></svg>
                    <h3 
                      onClick={() => router.push(`/kham-pha/${group.productId}`)}
                      style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', margin: 0, cursor: 'pointer', transition: 'color 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.color='var(--accent)'}
                      onMouseLeave={e => e.currentTarget.style.color='var(--text-primary)'}
                    >
                      {group.name}
                    </h3>
                  </div>

                  {/* Group Items */}
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {group.items.map(({ item, originalIndex }, idx) => (
                      <div key={originalIndex} style={{
                        display: 'flex',
                        gap: '24px',
                        alignItems: 'center',
                        padding: '24px',
                        borderBottom: idx < group.items.length - 1 ? '1px solid var(--border-color)' : 'none'
                      }}>
                        <div style={{ width: '100px', height: '100px', background: 'var(--bg-tertiary)', borderRadius: '12px', padding: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0, cursor: 'pointer' }} onClick={() => router.push(`/kham-pha/${item.productId}`)}>
                          <img src={item.image} alt={item.name} style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
                        </div>

                        <div style={{ flexGrow: 1 }}>
                          {/* Variant Tags */}
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                            {item.variantTags && item.variantTags.length > 0 ? (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '13px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', padding: '6px 12px', borderRadius: '16px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                                <span>{item.variantTags.map(tag => tag.value).join(' | ')}</span>
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="m6 9 6 6 6-6"/></svg>
                              </span>
                            ) : (item.leg || item.upholstery) ? (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '13px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', padding: '6px 12px', borderRadius: '16px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                                <span>{[item.leg?.name, item.upholstery?.name].filter(Boolean).join(' | ')}</span>
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="m6 9 6 6 6-6"/></svg>
                              </span>
                            ) : null}
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                            {/* Chỉnh số lượng */}
                            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border-color)', borderRadius: '20px', background: 'var(--bg-tertiary)', overflow: 'hidden' }}>
                              <button onClick={() => {
                                if (item.quantity <= 1) {
                                  removeFromCart(originalIndex);
                                } else {
                                  updateQuantity(originalIndex, item.quantity - 1);
                                }
                              }} style={{ padding: '6px 14px', color: '#fff', fontWeight: 'bold', background: 'transparent', border: 'none', cursor: 'pointer' }}>-</button>
                              <span style={{ padding: '0 10px', fontSize: '14px', minWidth: '30px', textAlign: 'center' }}>{item.quantity}</span>
                              <button onClick={() => updateQuantity(originalIndex, item.quantity + 1)} style={{ padding: '6px 14px', color: '#fff', fontWeight: 'bold', background: 'transparent', border: 'none', cursor: 'pointer' }}>+</button>
                            </div>

                            <button 
                              onClick={() => removeFromCart(originalIndex)}
                              style={{ color: '#E74C3C', fontSize: '13px', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer' }}
                            >
                              Xóa sản phẩm
                            </button>
                          </div>
                        </div>

                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--accent)' }}>{formatCurrency(item.price * item.quantity)}</div>
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Đơn giá: {formatCurrency(item.price)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Cột phải: Tóm tắt đơn hàng */}
            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '24px', boxShadow: 'var(--card-shadow)', position: 'sticky', top: '100px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>Tóm tắt đơn hàng</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: 'var(--text-secondary)' }}>
                  <span>Tạm tính ({cartItems.reduce((a, b) => a + b.quantity, 0)} sản phẩm)</span>
                  <span>{formatCurrency(subTotal)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: 'var(--text-secondary)' }}>
                  <span>Phí giao hàng</span>
                  <span>{shippingFee === 0 ? 'Miễn phí' : formatCurrency(shippingFee)}</span>
                </div>
                {shippingFee > 0 && (
                  <span style={{ fontSize: '11px', color: 'var(--accent)', marginTop: '-8px' }}>Miễn phí giao hàng cho đơn hàng trên 50 triệu!</span>
                )}
              </div>

              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <span style={{ fontSize: '16px', fontWeight: 700 }}>Tổng tiền:</span>
                <span style={{ fontSize: '24px', fontWeight: 800, color: 'var(--accent)', fontFamily: 'var(--font-title)' }}>{formatCurrency(totalAmount)}</span>
              </div>

              <button 
                onClick={() => router.push('/checkout')}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'center',
                  background: 'var(--accent)',
                  color: '#fff',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '16px',
                  borderRadius: '30px',
                  fontSize: '16px',
                  fontWeight: 600,
                  boxShadow: '0 8px 25px rgba(var(--accent-rgb), 0.3)',
                  transition: 'all 0.2s ease'
                }}
              >
                Tiến hành thanh toán
              </button>
              
              <button 
                onClick={() => router.push('/')}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'center',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-secondary)',
                  marginTop: '16px',
                  fontSize: '14px'
                }}
              >
                ← Tiếp tục mua sắm
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
