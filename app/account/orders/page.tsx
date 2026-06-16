'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface UserOrder {
  id: string;
  createdAt: string;
  totalAmount: string;
  status: 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  statusVi: string;
  items: { name: string; qty: number; price: string }[];
}

const SAMPLE_ORDERS: UserOrder[] = [
  {
    id: 'DC-874291',
    createdAt: '14 Tháng 6, 2026',
    totalAmount: '78,230,000 ₫',
    status: 'PENDING',
    statusVi: 'Chờ duyệt',
    items: [
      { name: 'Sofa Indivi Lazio 3 chỗ', qty: 1, price: '42,250,000 ₫' },
      { name: 'Bàn console Bordeaux', qty: 2, price: '17,990,000 ₫' }
    ]
  },
  {
    id: 'DC-192834',
    createdAt: '10 Tháng 5, 2026',
    totalAmount: '119,900,000 ₫',
    status: 'DELIVERED',
    statusVi: 'Đã nhận hàng',
    items: [
      { name: 'Hệ thống Como màu xám', qty: 1, price: '119,900,000 ₫' }
    ]
  }
];

export default function UserOrdersPage() {
  const [orders, setOrders] = useState<UserOrder[]>(SAMPLE_ORDERS);
  const [activeTab, setActiveTab] = useState<'ALL' | 'PENDING' | 'DELIVERED' | 'CANCELLED'>('ALL');

  const handleCancelOrder = (id: string) => {
    if (confirm('Bạn có chắc chắn muốn hủy đơn hàng ' + id + ' không?')) {
      setOrders(orders.map(o => o.id === id ? { ...o, status: 'CANCELLED', statusVi: 'Đã hủy' } : o));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'var(--accent)';
      case 'CONFIRMED': return '#3498DB';
      case 'SHIPPED': return '#F1C40F';
      case 'DELIVERED': return '#2ECC71';
      case 'CANCELLED': return '#E74C3C';
      default: return 'var(--text-muted)';
    }
  };

  const filteredOrders = activeTab === 'ALL' 
    ? orders
    : orders.filter(o => o.status === activeTab);

  return (
    <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '30px', boxShadow: 'var(--card-shadow)' }}>
      
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-title)' }}>Đơn hàng của tôi</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>Theo dõi hành trình vận chuyển, kiểm tra lịch sử và quản lý đơn hàng.</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', marginBottom: '24px', gap: '20px' }}>
        {[
          { key: 'ALL', label: 'Tất cả' },
          { key: 'PENDING', label: 'Chờ xử lý' },
          { key: 'DELIVERED', label: 'Đã giao' },
          { key: 'CANCELLED', label: 'Đã hủy' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            style={{
              padding: '12px 6px',
              fontSize: '14px',
              fontWeight: activeTab === tab.key ? 700 : 500,
              color: activeTab === tab.key ? 'var(--accent)' : 'var(--text-secondary)',
              borderBottom: `2px solid ${activeTab === tab.key ? 'var(--accent)' : 'transparent'}`,
              marginBottom: '-1px'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Danh sách đơn */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {filteredOrders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
            Không tìm thấy đơn hàng nào tương ứng.
          </div>
        ) : (
          filteredOrders.map(order => (
            <div key={order.id} style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '24px' }}>
              
              {/* Header đơn */}
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '14px', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>MÃ ĐƠN HÀNG</span>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: '#fff' }}>{order.id}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>NGÀY ĐẶT</span>
                    <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{order.createdAt}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: getStatusColor(order.status) }}></div>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: getStatusColor(order.status) }}>{order.statusVi}</span>
                </div>
              </div>

              {/* Items */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                {order.items.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px' }}>
                    <div style={{ color: 'var(--text-secondary)' }}>
                      {item.name} <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>x{item.qty}</span>
                    </div>
                    <strong style={{ color: '#fff' }}>{item.price}</strong>
                  </div>
                ))}
              </div>

              {/* Footer đơn */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '16px', flexWrap: 'wrap', gap: '15px' }}>
                <div>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Tổng thanh toán</span>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--accent)' }}>{order.totalAmount}</div>
                </div>
                
                <div style={{ display: 'flex', gap: '10px' }}>
                  <Link href={`/account/orders/${order.id}`} className="customize-btn" style={{ fontSize: '12px', padding: '8px 16px' }}>
                    Xem chi tiết
                  </Link>

                  {order.status === 'PENDING' && (
                    <button 
                      onClick={() => handleCancelOrder(order.id)}
                      style={{
                        padding: '8px 16px',
                        background: 'rgba(231, 76, 60, 0.1)',
                        border: '1px solid #E74C3C',
                        color: '#E74C3C',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: 600
                      }}
                    >
                      Hủy đơn hàng
                    </button>
                  )}

                  {order.status === 'DELIVERED' && (
                    <Link 
                      href={`/account/reviews?id=${order.id}`}
                      style={{
                        padding: '8px 16px',
                        background: 'var(--accent)',
                        color: '#fff',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: 600
                      }}
                    >
                      Viết đánh giá
                    </Link>
                  )}
                </div>
              </div>

            </div>
          ))
        )}
      </div>

    </div>
  );
}
