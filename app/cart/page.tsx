'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface CartItem {
  id: string;
  productId: string;
  name: string;
  image: string;
  price: number;
  formattedPrice: string;
  quantity: number;
  variantKey: string;
  variantDesc: string;
}

const INITIAL_CART: CartItem[] = [
  {
    id: 'cart-1',
    productId: 'SM42250020',
    name: 'Sofa Indivi 3 chỗ',
    image: 'https://ckkvyltbeinzqogjsfli.supabase.co/storage/v1/object/public/dcor/sofas/SM42250020_boconcept-indivi-upholstery-2.png',
    price: 42250000,
    formattedPrice: '42,250,000 ₫',
    quantity: 1,
    variantKey: 'Lazio-Grey-LegMetal',
    variantDesc: 'Vải Lazio Xám đậm / Chân kim loại đen'
  },
  {
    id: 'cart-2',
    productId: '37006300',
    name: 'Bàn console Bordeaux',
    image: 'https://ckkvyltbeinzqogjsfli.supabase.co/storage/v1/object/public/dcor/tables/37006300_368118_PNG-Web2072dpi.png',
    price: 17990000,
    formattedPrice: '17,990,000 ₫',
    quantity: 2,
    variantKey: 'Lacquered-LightGrey',
    variantDesc: 'Gỗ sơn mài Xám nhạt'
  }
];

export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>(INITIAL_CART);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  const updateQuantity = (id: string, delta: number) => {
    setCartItems(cartItems.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeItem = (id: string) => {
    setCartItems(cartItems.filter(item => item.id !== id));
  };

  const handleVariantChange = (id: string, newDesc: string) => {
    setCartItems(cartItems.map(item => {
      if (item.id === id) {
        return { ...item, variantDesc: newDesc };
      }
      return item;
    }));
    setEditingItemId(null);
  };

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
              {cartItems.map(item => (
                <div key={item.id} style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '16px',
                  padding: '20px',
                  display: 'flex',
                  gap: '20px',
                  alignItems: 'center',
                  boxShadow: 'var(--card-shadow)'
                }}>
                  <div style={{ width: '100px', height: '100px', background: 'var(--bg-tertiary)', borderRadius: '12px', padding: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}>
                    <img src={item.image} alt={item.name} style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
                  </div>

                  <div style={{ flexGrow: 1 }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>{item.name}</h3>
                    
                    {/* Đổi Variant Inline */}
                    <div style={{ marginTop: '6px' }}>
                      {editingItemId === item.id ? (
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
                          <select 
                            onChange={(e) => handleVariantChange(item.id, e.target.value)}
                            defaultValue={item.variantDesc}
                            style={{ padding: '6px 12px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#fff', fontSize: '13px' }}
                          >
                            <option value="Vải Lazio Xám đậm / Chân thép đen">Vải Lazio Xám đậm / Chân thép đen</option>
                            <option value="Vải Lazio Kem cát / Chân thép đen">Vải Lazio Kem cát / Chân thép đen</option>
                            <option value="Da Estoril Nâu / Chân gỗ tự nhiên">Da Estoril Nâu / Chân gỗ tự nhiên</option>
                            <option value="Gỗ sơn mài Xám nhạt">Gỗ sơn mài Xám nhạt</option>
                            <option value="Gỗ sồi màu tự nhiên">Gỗ sồi màu tự nhiên</option>
                          </select>
                          <button onClick={() => setEditingItemId(null)} style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Hủy</button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Cấu hình: <strong>{item.variantDesc}</strong></span>
                          <button 
                            onClick={() => setEditingItemId(item.id)}
                            style={{ fontSize: '12px', color: 'var(--accent)', fontWeight: 600 }}
                          >
                            Thay đổi
                          </button>
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginTop: '16px' }}>
                      {/* Chỉnh số lượng */}
                      <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border-color)', borderRadius: '20px', background: 'var(--bg-tertiary)', overflow: 'hidden' }}>
                        <button onClick={() => updateQuantity(item.id, -1)} style={{ padding: '6px 14px', color: '#fff', fontWeight: 'bold' }}>-</button>
                        <span style={{ padding: '0 10px', fontSize: '14px', minWidth: '30px', textAlign: 'center' }}>{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, 1)} style={{ padding: '6px 14px', color: '#fff', fontWeight: 'bold' }}>+</button>
                      </div>

                      <button 
                        onClick={() => removeItem(item.id)}
                        style={{ color: '#E74C3C', fontSize: '13px', fontWeight: 500 }}
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

              <Link 
                href="/checkout" 
                style={{
                  display: 'block',
                  textAlign: 'center',
                  background: 'var(--accent)',
                  color: '#fff',
                  padding: '16px',
                  borderRadius: '30px',
                  fontSize: '16px',
                  fontWeight: 600,
                  boxShadow: '0 8px 25px rgba(var(--accent-rgb), 0.3)',
                  transition: 'all 0.2s ease'
                }}
              >
                Tiến hành thanh toán
              </Link>
              
              <Link 
                href="/" 
                style={{
                  display: 'block',
                  textAlign: 'center',
                  color: 'var(--text-secondary)',
                  marginTop: '16px',
                  fontSize: '14px'
                }}
              >
                ← Tiếp tục mua sắm
              </Link>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
