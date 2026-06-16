'use client';

import React, { useState } from 'react';

interface Address {
  id: string;
  receiverName: string;
  phone: string;
  detail: string;
  isDefault: boolean;
}

const INITIAL_ADDRESSES: Address[] = [
  {
    id: 'addr-1',
    receiverName: 'Khách hàng Demo',
    phone: '0901234567',
    detail: '280 An Dương Vương, Phường 4, Quận 5, TP. Hồ Chí Minh',
    isDefault: true
  },
  {
    id: 'addr-2',
    receiverName: 'Nguyễn Văn B (Người thân)',
    phone: '0987654321',
    detail: '12 Đường số 5, KDC Trung Sơn, Bình Hưng, Bình Chánh, TP. Hồ Chí Minh',
    isDefault: false
  }
];

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>(INITIAL_ADDRESSES);
  const [showForm, setShowForm] = useState(false);
  
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newDetail, setNewDetail] = useState('');

  const handleSetDefault = (id: string) => {
    setAddresses(addresses.map(addr => ({
      ...addr,
      isDefault: addr.id === id
    })));
  };

  const handleRemove = (id: string) => {
    setAddresses(addresses.filter(addr => addr.id !== id));
  };

  const handleAddAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newPhone || !newDetail) return;

    const newAddr: Address = {
      id: `addr-${Date.now()}`,
      receiverName: newName,
      phone: newPhone,
      detail: newDetail,
      isDefault: addresses.length === 0
    };

    setAddresses([...addresses, newAddr]);
    
    // Reset form
    setNewName('');
    setNewPhone('');
    setNewDetail('');
    setShowForm(false);
  };

  return (
    <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '30px', boxShadow: 'var(--card-shadow)' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-title)' }}>Sổ địa chỉ giao hàng</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>Quản lý các địa chỉ nhận hàng để thanh toán nhanh hơn khi mua sắm.</p>
        </div>
        {!showForm && (
          <button 
            onClick={() => setShowForm(true)}
            style={{
              padding: '10px 20px',
              background: 'var(--accent)',
              color: '#fff',
              borderRadius: '20px',
              fontSize: '13px',
              fontWeight: 600
            }}
          >
            + Thêm địa chỉ mới
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleAddAddress} style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px', marginBottom: '30px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>Thêm địa chỉ giao hàng mới</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Họ tên người nhận *</label>
              <input 
                type="text" 
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Nguyễn Văn A"
                style={{ width: '100%', height: '40px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0 12px', color: '#fff', fontSize: '13px', outline: 'none' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Số điện thoại người nhận *</label>
              <input 
                type="tel" 
                required
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="0901234567"
                style={{ width: '100%', height: '40px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0 12px', color: '#fff', fontSize: '13px', outline: 'none' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Địa chỉ nhận hàng chi tiết *</label>
            <input 
              type="text" 
              required
              value={newDetail}
              onChange={(e) => setNewDetail(e.target.value)}
              placeholder="Số nhà, Tên đường, Phường/Xã, Quận/Huyện..."
              style={{ width: '100%', height: '40px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0 12px', color: '#fff', fontSize: '13px', outline: 'none' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button 
              type="submit"
              style={{
                background: 'var(--accent)',
                color: '#fff',
                padding: '10px 20px',
                borderRadius: '20px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Lưu địa chỉ
            </button>
            <button 
              type="button"
              onClick={() => setShowForm(false)}
              style={{
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-secondary)',
                padding: '10px 20px',
                borderRadius: '20px',
                fontSize: '13px',
                fontWeight: 600
              }}
            >
              Hủy bỏ
            </button>
          </div>
        </form>
      )}

      {/* Danh sách địa chỉ */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {addresses.map(addr => (
          <div 
            key={addr.id}
            style={{
              padding: '20px',
              borderRadius: '12px',
              border: `1px solid ${addr.isDefault ? 'var(--accent)' : 'var(--border-color)'}`,
              background: addr.isDefault ? 'rgba(188, 95, 19, 0.02)' : 'var(--bg-tertiary)',
              position: 'relative'
            }}
          >
            {addr.isDefault && (
              <span style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'var(--accent)',
                color: '#fff',
                fontSize: '10px',
                fontWeight: 700,
                padding: '4px 8px',
                borderRadius: '4px',
                textTransform: 'uppercase'
              }}>
                Mặc định
              </span>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxWidth: '80%' }}>
              <strong style={{ fontSize: '15px', color: 'var(--text-primary)' }}>{addr.receiverName}</strong>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Số điện thoại: {addr.phone}</span>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>Địa chỉ: {addr.detail}</p>
            </div>

            <div style={{ display: 'flex', gap: '15px', borderTop: '1px solid var(--border-color)', marginTop: '16px', paddingTop: '12px', fontSize: '13px' }}>
              {!addr.isDefault && (
                <button 
                  onClick={() => handleSetDefault(addr.id)}
                  style={{ color: 'var(--accent)', fontWeight: 600 }}
                >
                  Đặt làm mặc định
                </button>
              )}
              <button 
                onClick={() => handleRemove(addr.id)}
                style={{ color: '#E74C3C', fontWeight: 500 }}
              >
                Xóa địa chỉ
              </button>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
