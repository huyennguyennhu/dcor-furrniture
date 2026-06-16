'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

export default function RoomPlannerCTA({ productId }: { productId: string }) {
  const router = useRouter();

  return (
    <div className="room-planner-cta-section" style={{ marginTop: '80px', padding: '40px', background: 'var(--bg-secondary)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '40px' }}>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: 'var(--accent)' }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg>
          <span style={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>Tương thích Room Planner</span>
        </div>
        <h2 style={{ fontSize: '32px', marginBottom: '16px', letterSpacing: '-1px' }}>Thử bố trí sản phẩm này vào không gian của bạn</h2>
        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px 0', color: 'var(--text-secondary)' }}>
          <li style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{ color: 'var(--accent)' }}>✓</span> Trải nghiệm kích thước thực tế trong môi trường 3D
          </li>
          <li style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{ color: 'var(--accent)' }}>✓</span> Kết hợp dễ dàng với các đồ nội thất khác
          </li>
          <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: 'var(--accent)' }}>✓</span> Lên dự toán chính xác cho toàn bộ không gian
          </li>
        </ul>
      </div>
      
      <div style={{ width: '400px', flexShrink: 0, textAlign: 'center' }}>
        <button 
          onClick={() => router.push(`/thiet-ke/room-planner?product=${productId}`)}
          style={{ width: '100%', padding: '20px', background: 'var(--text-primary)', color: 'var(--bg-primary)', border: 'none', borderRadius: '8px', fontSize: '18px', fontWeight: 600, cursor: 'pointer', transition: 'transform 0.2s', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
        >
          Thiết kế ngay
        </button>
      </div>
    </div>
  );
}
