'use client';

import React from 'react';

export default function AdminDashboard() {
  const stats = [
    { label: 'Doanh thu tháng này', val: '248,500,000 ₫', change: '+12.4% so với tháng trước', color: 'var(--accent)' },
    { label: 'Đơn hàng mới', val: '18 đơn', change: '+3 đơn đang chờ duyệt', color: '#52b788' },
    { label: 'Yêu cầu trả giá', val: '5 đề xuất', change: 'Cần phê duyệt gấp', color: '#f77f00' },
    { label: 'Tỷ lệ hủy đơn', val: '2.1%', change: '-0.5% so với tháng trước', color: '#d62828' }
  ];

  return (
    <div>
      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: 700 }}>Tổng Quan Doanh Số & Thống Kê</h2>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Cập nhật tình hình kinh doanh thời gian thực</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        {stats.map((s, idx) => (
          <div key={idx} className="filters-container" style={{ margin: 0, padding: '24px', flexWrap: 'nowrap', flexDirection: 'column', alignItems: 'flex-start', borderLeft: `4px solid ${s.color}` }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>{s.label}</span>
            <h3 style={{ fontSize: '24px', fontWeight: 700, margin: '8px 0', color: '#fff' }}>{s.val}</h3>
            <span style={{ fontSize: '11px', color: s.color }}>{s.change}</span>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px' }}>
        <div className="filters-container" style={{ margin: 0, padding: '30px', flexDirection: 'column', alignItems: 'stretch' }}>
          <h4 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px' }}>Biểu đồ doanh thu 14 ngày qua</h4>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', height: '180px', paddingTop: '20px', borderBottom: '1px solid var(--border-color)' }}>
            {[45, 60, 50, 75, 90, 80, 110, 95, 120, 130, 115, 140, 160, 180].map((h, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '6%' }}>
                <div style={{ height: `${h}px`, width: '100%', background: 'linear-gradient(to top, var(--accent), #ff9f1c)', borderRadius: '4px 4px 0 0', position: 'relative' }} title={`Ngày ${i+1}: ${h}tr`}></div>
                <span style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '8px' }}>{i + 1}/6</span>
              </div>
            ))}
          </div>
        </div>

        <div className="filters-container" style={{ margin: 0, padding: '30px', flexDirection: 'column', alignItems: 'stretch' }}>
          <h4 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px' }}>Top sản phẩm bán chạy</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
              <span>1. Sofa Indivi 2,5 chỗ</span>
              <span style={{ color: 'var(--accent)', fontWeight: 600 }}>12 đơn</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
              <span>2. Ghế ăn Charlotte</span>
              <span style={{ color: 'var(--accent)', fontWeight: 600 }}>8 đơn</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
              <span>3. Sofa Indivi 3 chỗ</span>
              <span style={{ color: 'var(--accent)', fontWeight: 600 }}>5 đơn</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
