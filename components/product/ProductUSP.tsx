import React from 'react';

const STATIC_USP = [
  { icon: 'truck', title: 'Giao hàng toàn quốc', desc: 'Miễn phí nội thành HCM' },
  { icon: 'refresh-ccw', title: 'Đổi trả 30 ngày', desc: 'Lỗi từ nhà sản xuất' },
  { icon: 'shield-check', title: 'Bảo hành 5 năm', desc: 'Bảo trì trọn đời' },
  { icon: 'layout', title: 'Hỗ trợ thiết kế', desc: 'Tư vấn không gian miễn phí' }
];

export default function ProductUSP() {
  return (
    <div className="product-usp-section" style={{ padding: '24px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {STATIC_USP.map((usp, idx) => (
          <div key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <div style={{ color: 'var(--accent)', background: 'rgba(224, 86, 36, 0.1)', padding: '10px', borderRadius: '50%' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '2px' }}>{usp.title}</div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{usp.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
