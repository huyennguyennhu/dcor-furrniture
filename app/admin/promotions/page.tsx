'use client';

import React, { useState } from 'react';

interface Promotion {
  code: string;
  discount: string;
  minOrder: string;
  usageLimit: string;
  usedCount: number;
  status: 'ACTIVE' | 'EXPIRED';
  statusVi: string;
}

const SAMPLE_PROMOTIONS: Promotion[] = [
  { code: 'SCANDI10', discount: 'Giảm 10%', minOrder: 'Đơn từ 20M', usageLimit: '100 lượt', usedCount: 42, status: 'ACTIVE', statusVi: 'Đang chạy' },
  { code: 'DCONNEW', discount: 'Giảm 5M ₫', minOrder: 'Đơn từ 80M', usageLimit: '50 lượt', usedCount: 15, status: 'ACTIVE', statusVi: 'Đang chạy' },
  { code: 'XUAN2026', discount: 'Giảm 15%', minOrder: 'Không yêu cầu', usageLimit: '200 lượt', usedCount: 200, status: 'EXPIRED', statusVi: 'Hết hạn' }
];

export default function AdminPromotionsPage() {
  const [promos, setPromos] = useState<Promotion[]>(SAMPLE_PROMOTIONS);
  const [showForm, setShowForm] = useState(false);

  const [code, setCode] = useState('');
  const [discount, setDiscount] = useState('');
  const [minOrder, setMinOrder] = useState('');
  const [limit, setLimit] = useState('');

  const handleAddPromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !discount) return;

    const newPromo: Promotion = {
      code: code.trim().toUpperCase(),
      discount,
      minOrder: minOrder || 'Không yêu cầu',
      usageLimit: limit || 'Không giới hạn',
      usedCount: 0,
      status: 'ACTIVE',
      statusVi: 'Đang chạy'
    };

    setPromos([newPromo, ...promos]);
    setCode('');
    setDiscount('');
    setMinOrder('');
    setLimit('');
    setShowForm(false);
  };

  return (
    <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '30px', boxShadow: 'var(--card-shadow)' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-title)' }}>Quản lý chương trình khuyến mãi</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>Tạo và cấu hình các mã giảm giá (Promo Codes) cho chiến dịch tiếp thị.</p>
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
            + Tạo mã giảm giá mới
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleAddPromo} style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px', marginBottom: '30px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>Tạo mã giảm giá mới</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Mã giảm giá (Code) *</label>
              <input 
                type="text" 
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Ví dụ: SUMMERSALE"
                style={{ width: '100%', height: '40px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0 12px', color: '#fff', fontSize: '13px', outline: 'none' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Giá trị giảm *</label>
              <input 
                type="text" 
                required
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                placeholder="Ví dụ: Giảm 10% hoặc Giảm 2M ₫"
                style={{ width: '100%', height: '40px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0 12px', color: '#fff', fontSize: '13px', outline: 'none' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Giá trị đơn tối thiểu</label>
              <input 
                type="text" 
                value={minOrder}
                onChange={(e) => setMinOrder(e.target.value)}
                placeholder="Ví dụ: Đơn từ 10 triệu"
                style={{ width: '100%', height: '40px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0 12px', color: '#fff', fontSize: '13px', outline: 'none' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Giới hạn lượt dùng</label>
              <input 
                type="text" 
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                placeholder="Ví dụ: 100 lượt"
                style={{ width: '100%', height: '40px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0 12px', color: '#fff', fontSize: '13px', outline: 'none' }}
              />
            </div>
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
              Kích hoạt mã
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

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
              <th style={{ padding: '12px' }}>Mã Code</th>
              <th style={{ padding: '12px' }}>Mức ưu đãi</th>
              <th style={{ padding: '12px' }}>Đơn tối thiểu</th>
              <th style={{ padding: '12px' }}>Giới hạn sử dụng</th>
              <th style={{ padding: '12px', textAlign: 'center' }}>Đã dùng</th>
              <th style={{ padding: '12px', textAlign: 'right' }}>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {promos.map(p => (
              <tr key={p.code} style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                <td style={{ padding: '12px', fontWeight: 'bold', color: 'var(--accent)' }}>{p.code}</td>
                <td style={{ padding: '12px', color: '#fff', fontWeight: 600 }}>{p.discount}</td>
                <td style={{ padding: '12px' }}>{p.minOrder}</td>
                <td style={{ padding: '12px' }}>{p.usageLimit}</td>
                <td style={{ padding: '12px', textAlign: 'center' }}>{p.usedCount} lần</td>
                <td style={{ padding: '12px', textAlign: 'right' }}>
                  <span style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: p.status === 'ACTIVE' ? 'rgba(46, 204, 113, 0.1)' : 'rgba(231, 76, 60, 0.1)',
                    color: p.status === 'ACTIVE' ? '#2ECC71' : '#E74C3C'
                  }}>
                    {p.statusVi}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
