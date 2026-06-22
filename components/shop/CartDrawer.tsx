'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useStore, CartItem } from '@/lib/store';
import { useRouter } from 'next/navigation';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const CustomCheckbox = ({ checked, onChange, indeterminate = false }: { checked: boolean, onChange: (e: any) => void, indeterminate?: boolean }) => {
  return (
    <label style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer', position: 'relative' }}>
      <input 
        type="checkbox" 
        checked={checked} 
        onChange={onChange}
        ref={input => { if (input) input.indeterminate = indeterminate; }}
        style={{ position: 'absolute', opacity: 0, cursor: 'pointer', height: 0, width: 0 }} 
      />
      <div style={{
        width: '18px',
        height: '18px',
        border: '1.5px solid var(--accent)',
        borderRadius: '4px',
        background: 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        transition: 'all 0.2s'
      }}>
        {checked && !indeterminate && (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        )}
        {indeterminate && (
          <div style={{ width: '10px', height: '2.5px', background: 'var(--accent)', borderRadius: '2px' }} />
        )}
      </div>
    </label>
  );
};

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const storeCartItems = useStore(state => state.cart);
  const updateQuantity = useStore(state => state.updateQuantity);
  const removeFromCart = useStore(state => state.removeFromCart);
  const clearCart = useStore(state => state.clearCart);
  const removeMultipleFromCart = useStore(state => state.removeMultipleFromCart);

  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const cartItems = mounted ? storeCartItems : [];

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

  // Selection state for Bulk Delete
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());

  // Custom Modal state
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean, target: 'single' | 'bulk' | 'all', indices: number[] }>({ isOpen: false, target: 'single', indices: [] });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);


  const totalPrice = cartItems.reduce((sum, item, index) => {
    return selectedIndices.has(index) ? sum + (item.price * item.quantity) : sum;
  }, 0);

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
    setSelectedIndices(new Set());
    onClose();
  };

  const navigateToProduct = (productId: string) => {
    onClose();
    router.push(`/kham-pha/${productId}`);
  };

  // --- Checkbox Handlers ---
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIndices(new Set(cartItems.map((_, i) => i)));
    } else {
      setSelectedIndices(new Set());
    }
  };

  const handleSelectItem = (index: number) => {
    const newSet = new Set(selectedIndices);
    if (newSet.has(index)) {
      newSet.delete(index);
    } else {
      newSet.add(index);
    }
    setSelectedIndices(newSet);
  };

  // --- Delete Modal Handlers ---
  const requestDeleteSingle = (index: number) => {
    setDeleteModal({ isOpen: true, target: 'single', indices: [index] });
  };

  const requestDeleteBulk = () => {
    if (selectedIndices.size === 0) return;
    setDeleteModal({ isOpen: true, target: 'bulk', indices: Array.from(selectedIndices) });
  };

  const requestDeleteAll = () => {
    setDeleteModal({ isOpen: true, target: 'all', indices: cartItems.map((_, i) => i) });
  };

  const executeDelete = () => {
    if (deleteModal.target === 'all') {
      clearCart();
      setSelectedIndices(new Set());
    } else if (deleteModal.target === 'single') {
      removeFromCart(deleteModal.indices[0]);
      // Clear selection to avoid index mismatch
      setSelectedIndices(new Set());
    } else {
      removeMultipleFromCart(deleteModal.indices);
      // Clear selection after bulk delete
      setSelectedIndices(new Set());
    }
    setDeleteModal({ isOpen: false, target: 'single', indices: [] });
  };

  const cancelDelete = () => {
    setDeleteModal({ isOpen: false, target: 'single', indices: [] });
  };

  // Checkbox state
  const isAllSelected = cartItems.length > 0 && selectedIndices.size === cartItems.length;
  const isIndeterminate = selectedIndices.size > 0 && selectedIndices.size < cartItems.length;

  return (
    <div className={`cart-drawer-overlay ${isOpen ? 'active' : ''}`} onClick={(e) => {
      if (e.target === e.currentTarget && !deleteModal.isOpen) {
        onClose();
      }
    }}>
      <div className="cart-drawer">
        <div className="cart-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {cartItems.length > 0 && (
              <CustomCheckbox 
                checked={isAllSelected}
                indeterminate={isIndeterminate}
                onChange={handleSelectAll}
              />
            )}
            <h3 style={{ fontSize: '20px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              Giỏ hàng của bạn
              <span style={{ 
                background: 'var(--accent)', 
                color: '#fff', 
                fontSize: '14px', 
                fontWeight: 700, 
                width: '25px', 
                height: '25px', 
                borderRadius: '50%', 
                display: 'inline-flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                lineHeight: 1
              }}>
                {cartItems.length}
              </span>
            </h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {selectedIndices.size > 0 && (
              <button 
                onClick={requestDeleteBulk}
                title="Xóa mục đã chọn"
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px', transition: 'all 0.2s', position: 'relative' }}
                onMouseEnter={e => { e.currentTarget.style.color='#e74c3c'; e.currentTarget.style.transform='scale(1.1)'; }}
                onMouseLeave={e => { e.currentTarget.style.color='var(--text-muted)'; e.currentTarget.style.transform='scale(1)'; }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                </svg>
                <span style={{ position: 'absolute', top: '-4px', right: '-4px', background: '#e74c3c', color: '#fff', fontSize: '10px', minWidth: '16px', height: '16px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', padding: '0 4px', pointerEvents: 'none', transition: 'transform 0.2s' }}>
                  {selectedIndices.size}
                </span>
              </button>
            )}
            <button className="close-btn" onClick={onClose} style={{ cursor: 'pointer', background: 'transparent', border: 'none', color: 'var(--text-primary)', padding: '4px', transition: 'all 0.3s ease' }}
              onMouseEnter={e => { e.currentTarget.style.color='var(--accent)'; e.currentTarget.style.transform='rotate(90deg)'; }}
              onMouseLeave={e => { e.currentTarget.style.color='var(--text-primary)'; e.currentTarget.style.transform='rotate(0deg)'; }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
              </svg>
            </button>
          </div>
        </div>

        <div className="cart-items-wrapper" style={{ flexGrow: 1, overflowY: 'auto', paddingRight: '10px' }}>
          {cartItems.length === 0 ? (
            <div className="cart-empty-message" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', gap: '15px' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/>
                <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>
              </svg>
              <p>Giỏ hàng đang trống</p>
            </div>
          ) : (
            <>
              {groupedCart.map((group, groupIndex) => {
                const isGroupSelected = group.items.length > 0 && group.items.every(i => selectedIndices.has(i.originalIndex));
                const isGroupIndeterminate = !isGroupSelected && group.items.some(i => selectedIndices.has(i.originalIndex));

                return (
                  <div key={group.productId} className="cart-group" style={{ marginBottom: '20px', background: 'transparent', borderRadius: '12px', overflow: 'hidden' }}>
                    {/* Group Header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 0', borderBottom: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.02)' }}>
                      <CustomCheckbox 
                        checked={isGroupSelected}
                        indeterminate={isGroupIndeterminate}
                        onChange={() => {
                          const newSet = new Set(selectedIndices);
                          if (isGroupSelected) {
                            group.items.forEach(i => newSet.delete(i.originalIndex));
                          } else {
                            group.items.forEach(i => newSet.add(i.originalIndex));
                          }
                          setSelectedIndices(newSet);
                        }}
                      />
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 7v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7"/><path d="M4 15h16"/><path d="M4 11h16"/><path d="M12 4v7"/><path d="M8 7v4"/><path d="M16 7v4"/><path d="M12 2v2"/></svg>
                      <h4 
                        onClick={() => navigateToProduct(group.productId)}
                        style={{ fontSize: '16px', fontWeight: 600, cursor: 'pointer', color: 'var(--text-primary)', margin: 0, transition: 'color 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.color='var(--accent)'} 
                        onMouseLeave={e => e.currentTarget.style.color='var(--text-primary)'}
                      >
                        {group.name}
                      </h4>
                    </div>
                  
                  {/* Group Items */}
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {group.items.map(({ item, originalIndex }, idx) => (
                      <div className="cart-item" key={originalIndex} style={{ display: 'flex', gap: '16px', padding: '20px 0', borderBottom: idx < group.items.length - 1 ? '1px solid var(--border-color)' : 'none', position: 'relative', alignItems: 'flex-start' }}>
                        
                        {/* Item Checkbox */}
                        <div style={{ paddingTop: '22px' }}>
                          <CustomCheckbox 
                            checked={selectedIndices.has(originalIndex)}
                            onChange={() => handleSelectItem(originalIndex)}
                          />
                        </div>

                        {/* Clickable Image */}
                        <div 
                          className="cart-item-image" 
                          onClick={() => navigateToProduct(item.productId)}
                          style={{ width: '64.8px', height: '64.8px', flexShrink: 0, cursor: 'pointer', borderRadius: '8px', overflow: 'hidden', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6px' }}
                          title="Xem chi tiết sản phẩm"
                        >
                          <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'contain', transition: 'transform 0.3s' }} onMouseEnter={e => e.currentTarget.style.transform='scale(1.05)'} onMouseLeave={e => e.currentTarget.style.transform='scale(1)'} />
                        </div>
                        
                        <div className="cart-item-details" style={{ flexGrow: 1 }}>
                          
                          <div style={{ paddingRight: '28px' }}>
                            {/* Variant Tags */}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
                              {item.variantTags && item.variantTags.length > 0 ? (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '4px 8px', borderRadius: '12px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                                  {item.variantTags.map(tag => tag.value).join(' | ')}
                                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="m6 9 6 6 6-6"/></svg>
                                </span>
                              ) : (item.leg || item.upholstery) ? (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '4px 8px', borderRadius: '12px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                                  {[item.leg?.name, item.upholstery?.name].filter(Boolean).join(' | ')}
                                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="m6 9 6 6 6-6"/></svg>
                                </span>
                              ) : null}
                            </div>
                          </div>
                          
                          {/* Price and Quantity Row */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginRight: '4px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              {item.originalPrice && item.originalPrice > item.price && (
                                <span style={{ fontSize: '13px', textDecoration: 'line-through', color: 'var(--text-muted)' }}>
                                  {formatVND(item.originalPrice * item.quantity)}
                                </span>
                              )}
                              <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--accent)' }}>
                                {formatVND(item.price * item.quantity)}
                              </span>
                            </div>

                            {/* Quantity Selector */}
                            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--accent)', borderRadius: '12px', overflow: 'hidden', background: 'transparent' }}>
                              <button 
                                onClick={() => {
                                  if (item.quantity <= 1) {
                                    requestDeleteSingle(originalIndex);
                                  } else {
                                    updateQuantity(originalIndex, item.quantity - 1);
                                  }
                                }}
                                style={{ padding: '2px 10px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--accent)', fontSize: '16px', fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              >-</button>
                              <span style={{ width: '24px', textAlign: 'center', fontSize: '13px', fontWeight: 600, color: 'var(--accent)' }}>{item.quantity}</span>
                              <button 
                                onClick={() => updateQuantity(originalIndex, item.quantity + 1)}
                                style={{ padding: '2px 10px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--accent)', fontSize: '16px', fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              >+</button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                );
              })}
            </>
          )}
        </div>
        
        {cartItems.length > 0 && (
          <div className="cart-footer" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '24px', marginTop: '24px' }}>
            <div className="cart-summary-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', fontSize: '18px', fontWeight: 600 }}>
              <span>Tổng cộng</span>
              <span className="cart-summary-total" style={{ color: 'var(--accent)', fontSize: '22px' }}>{formatVND(totalPrice)}</span>
            </div>
            <button className="checkout-btn" onClick={handleCheckout} style={{ width: '100%', padding: '16px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 600, cursor: 'pointer', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform='translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform='translateY(0)'}>
              Đặt Hàng & Thanh Toán
            </button>
          </div>
        )}
      </div>

      {/* --- Custom Confirmation Modal --- */}
      {deleteModal.isOpen && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: 'var(--bg-primary)', padding: '32px', borderRadius: '16px',
            width: '90%', maxWidth: '360px', textAlign: 'center',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            animation: 'fadeIn 0.2s ease-out',
            border: '1px solid var(--border-color)'
          }}>
            <div style={{ width: '64px', height: '64px', background: 'rgba(231, 76, 60, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: '#e74c3c' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
              </svg>
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '12px', color: 'var(--text-primary)' }}>Xác nhận xóa</h3>
            <p style={{ fontSize: '15px', color: 'var(--text-secondary)', marginBottom: '32px', lineHeight: 1.5 }}>
              {deleteModal.target === 'single' ? 'Bạn có chắc chắn muốn xóa sản phẩm này khỏi giỏ hàng không?' : 
               deleteModal.target === 'bulk' ? (
                 <>Bạn có chắc chắn muốn xóa <strong style={{ color: '#e74c3c', fontSize: '18px' }}>{deleteModal.indices.length}</strong> sản phẩm đã chọn khỏi giỏ hàng không?</>
               ) :
               'Bạn có chắc chắn muốn xóa TẤT CẢ sản phẩm khỏi giỏ hàng không? Hành động này không thể hoàn tác.'}
            </p>
            <div style={{ display: 'flex', gap: '16px' }}>
              <button 
                onClick={cancelDelete}
                style={{ flex: 1, padding: '14px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '15px', fontWeight: 600, cursor: 'pointer' }}
              >
                Hủy bỏ
              </button>
              <button 
                onClick={executeDelete}
                style={{ flex: 1, padding: '14px', background: '#e74c3c', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '15px', fontWeight: 600, cursor: 'pointer' }}
              >
                XÓA
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
