'use client';

import React from 'react';

export default function AdminReportsPage() {
  return (
    <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '30px', boxShadow: 'var(--card-shadow)' }}>
      
      <div style={{ marginBottom: '30px', borderBottom: '1px solid var(--border-color)', paddingBottom: '20px' }}>
        <span style={{
          fontSize: '10px',
          fontWeight: 700,
          padding: '2px 8px',
          borderRadius: '4px',
          background: 'rgba(231, 76, 60, 0.1)',
          color: '#E74C3C',
          textTransform: 'uppercase',
          display: 'inline-block',
          marginBottom: '8px'
        }}>
          Chỉ dành cho Quản trị viên (Admin Only)
        </span>
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-title)' }}>Báo cáo doanh thu & Hiệu suất kinh doanh</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>Báo cáo chi tiết về doanh số bán hàng, hiệu suất của từng dòng sản phẩm và hành vi khách hàng.</p>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '40px' }}>
        <div style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '24px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Doanh thu tháng này</span>
          <div style={{ fontSize: '32px', fontWeight: 800, color: '#2ECC71', marginTop: '8px', fontFamily: 'var(--font-title)' }}>1,485,300,000 ₫</div>
          <span style={{ fontSize: '11px', color: '#2ECC71', display: 'block', marginTop: '8px' }}>↑ Tăng 12.4% so với tháng trước</span>
        </div>

        <div style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '24px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Tổng đơn hàng đã duyệt</span>
          <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '8px', fontFamily: 'var(--font-title)' }}>184 đơn</div>
          <span style={{ fontSize: '11px', color: '#2ECC71', display: 'block', marginTop: '8px' }}>↑ Tăng 8.2% so với tháng trước</span>
        </div>

        <div style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '24px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Tỷ lệ hủy đơn hàng</span>
          <div style={{ fontSize: '32px', fontWeight: 800, color: '#E74C3C', marginTop: '8px', fontFamily: 'var(--font-title)' }}>2.1 %</div>
          <span style={{ fontSize: '11px', color: '#2ECC71', display: 'block', marginTop: '8px' }}>↓ Giảm 0.5% so với tháng trước (Tốt)</span>
        </div>
      </div>

      {/* Chi tiết hiệu suất dòng sản phẩm */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '30px' }}>
        
        {/* Sản phẩm bán chạy */}
        <div style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '20px', textTransform: 'uppercase' }}>Top 5 sản phẩm doanh số cao</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {[
              { rank: 1, name: 'Sofa Indivi Lazio 3 chỗ', sales: '24 chiếc', revenue: '1,014,000,000 ₫' },
              { rank: 2, name: 'Bàn console Bordeaux', sales: '32 chiếc', revenue: '575,680,000 ₫' },
              { rank: 3, name: 'Hệ thống tường Como', sales: '3 chiếc', revenue: '359,700,000 ₫' },
              { rank: 4, name: 'Tủ treo tường Lugano', sales: '8 chiếc', revenue: '227,920,000 ₫' },
              { rank: 5, name: 'Quầy đêm nguyên tố', sales: '15 chiếc', revenue: '104,850,000 ₫' }
            ].map(item => (
              <div key={item.rank} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'var(--bg-secondary)', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold', color: 'var(--accent)' }}>{item.rank}</span>
                  <span style={{ color: 'var(--text-secondary)' }}>{item.name}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: '#fff', fontWeight: 600 }}>{item.revenue}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Đã bán: {item.sales}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Phân bổ danh mục */}
        <div style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '20px', textTransform: 'uppercase' }}>Tỷ trọng theo Danh mục</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {[
              { name: '️ Sofa & Ghế thư giãn', percent: 65, color: 'var(--accent)' },
              { name: '️ Tủ kệ & Storage', percent: 20, color: '#3498DB' },
              { name: 'Bàn trà & Bàn console', percent: 15, color: '#2ECC71' }
            ].map((cat, idx) => (
              <div key={idx}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{cat.name}</span>
                  <strong style={{ color: '#fff' }}>{cat.percent}%</strong>
                </div>
                {/* Progress bar */}
                <div style={{ height: '8px', background: 'var(--bg-primary)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${cat.percent}%`, height: '100%', background: cat.color }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
