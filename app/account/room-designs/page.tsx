'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface SavedDesign {
  id: string;
  name: string;
  image: string;
  updatedAt: string;
  productsCount: number;
}

const INITIAL_DESIGNS: SavedDesign[] = [
  {
    id: 'design-1',
    name: 'Phòng khách nhà mới 2026',
    image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=400&q=80',
    updatedAt: '14 Tháng 6, 2026',
    productsCount: 3
  },
  {
    id: 'design-2',
    name: 'Phòng ngủ bé con',
    image: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=400&q=80',
    updatedAt: '08 Tháng 5, 2026',
    productsCount: 1
  }
];

export default function SavedRoomDesignsPage() {
  const [designs, setDesigns] = useState<SavedDesign[]>(INITIAL_DESIGNS);

  const handleRemove = (id: string) => {
    setDesigns(designs.filter(d => d.id !== id));
  };

  return (
    <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '30px', boxShadow: 'var(--card-shadow)' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-title)' }}>Bản vẽ Room Planner đã lưu</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>Nơi lưu trữ các bản thiết kế bố trí không gian nội thất ảo của bạn.</p>
        </div>
        <Link 
          href="/thiet-ke/room-planner"
          style={{
            padding: '10px 20px',
            background: 'var(--accent)',
            color: '#fff',
            borderRadius: '20px',
            fontSize: '13px',
            fontWeight: 600
          }}
        >
          + Tạo thiết kế mới
        </Link>
      </div>

      {designs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          Không có bản thiết kế Room Planner nào được lưu.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {designs.map(design => (
            <div 
              key={design.id}
              style={{
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <div style={{ height: '160px', overflow: 'hidden', position: 'relative' }}>
                <img src={design.image} alt={design.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <span style={{ position: 'absolute', bottom: '10px', left: '10px', background: 'rgba(31, 21, 16, 0.8)', color: '#fff', fontSize: '11px', padding: '4px 8px', borderRadius: '4px' }}>
                  {design.productsCount} sản phẩm
                </span>
              </div>

              <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '6px', flexGrow: 1 }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#fff' }}>{design.name}</h3>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Cập nhật lần cuối: {design.updatedAt}</span>
              </div>

              <div style={{ padding: '16px', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '10px' }}>
                <Link 
                  href={`/thiet-ke/room-planner?design=${design.id}`}
                  style={{
                    flexGrow: 1,
                    background: 'var(--accent)',
                    color: '#fff',
                    padding: '8px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 600,
                    textAlign: 'center'
                  }}
                >
                  Mở trình thiết kế
                </Link>
                <button 
                  onClick={() => handleRemove(design.id)}
                  style={{
                    padding: '8px 12px',
                    background: 'rgba(231, 76, 60, 0.1)',
                    border: '1px solid #E74C3C',
                    color: '#E74C3C',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 600
                  }}
                >
                  Xóa
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
}
