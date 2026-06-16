'use client';

import React, { useState } from 'react';

interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  type: 'Cá nhân' | 'B2B';
  membership: 'Vàng' | 'Bạc' | 'Đồng' | 'B2B Partner';
  ordersCount: number;
  totalSpent: string;
}

const SAMPLE_CUSTOMERS: Customer[] = [
  { id: 'DC-KH-101', name: 'Nguyễn Văn A', phone: '0901234567', email: 'vana@gmail.com', type: 'Cá nhân', membership: 'Vàng', ordersCount: 5, totalSpent: '185,490,000 ₫' },
  { id: 'DC-KH-102', name: 'Công ty Kiến trúc X', phone: '0987654321', email: 'contact@xdesign.vn', type: 'B2B', membership: 'B2B Partner', ordersCount: 12, totalSpent: '1,420,000,000 ₫' },
  { id: 'DC-KH-103', name: 'Lê Hoàng Yến', phone: '0911223344', email: 'hoangyen@gmail.com', type: 'Cá nhân', membership: 'Bạc', ordersCount: 2, totalSpent: '48,600,000 ₫' }
];

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>(SAMPLE_CUSTOMERS);
  const [search, setSearch] = useState('');

  const filtered = customers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.phone.includes(search) ||
    c.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '30px', boxShadow: 'var(--card-shadow)' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-title)' }}>Quản lý khách hàng & Đối tác B2B</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>Xem danh sách thông tin tài khoản khách hàng cá nhân và doanh nghiệp B2B.</p>
        </div>
      </div>

      {/* Tìm kiếm */}
      <div style={{ marginBottom: '20px' }}>
        <input 
          type="text" 
          placeholder="Tìm khách hàng theo tên, SĐT hoặc mã KH..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: '100%',
            maxWidth: '400px',
            height: '40px',
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            padding: '0 16px',
            color: '#fff',
            fontSize: '13px',
            outline: 'none'
          }}
        />
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
              <th style={{ padding: '12px' }}>Mã KH</th>
              <th style={{ padding: '12px' }}>Họ và tên</th>
              <th style={{ padding: '12px' }}>SĐT / Email</th>
              <th style={{ padding: '12px' }}>Phân loại</th>
              <th style={{ padding: '12px' }}>Hạng thành viên</th>
              <th style={{ padding: '12px', textAlign: 'center' }}>Số đơn đặt</th>
              <th style={{ padding: '12px', textAlign: 'right' }}>Tổng chi tiêu</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => (
              <tr key={c.id} style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                <td style={{ padding: '12px', fontWeight: 'bold' }}>{c.id}</td>
                <td style={{ padding: '12px', color: '#fff', fontWeight: 600 }}>{c.name}</td>
                <td style={{ padding: '12px' }}>
                  <div>{c.phone}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{c.email}</div>
                </td>
                <td style={{ padding: '12px' }}>
                  <span style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: c.type === 'B2B' ? 'rgba(188, 95, 19, 0.1)' : 'rgba(255,255,255,0.03)',
                    color: c.type === 'B2B' ? 'var(--accent)' : 'var(--text-secondary)'
                  }}>
                    {c.type}
                  </span>
                </td>
                <td style={{ padding: '12px', color: c.membership === 'Vàng' ? '#F1C40F' : c.membership.includes('B2B') ? 'var(--accent)' : 'var(--text-secondary)' }}>{c.membership}</td>
                <td style={{ padding: '12px', textAlign: 'center' }}>{c.ordersCount} đơn</td>
                <td style={{ padding: '12px', textAlign: 'right', fontWeight: 700, color: 'var(--accent)' }}>{c.totalSpent}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
