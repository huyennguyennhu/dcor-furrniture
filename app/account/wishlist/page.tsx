'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface WishlistItem {
  id: string;
  name: string;
  image: string;
  price: string;
  category: string;
}

const INITIAL_WISHLIST: WishlistItem[] = [
  {
    id: 'SM42250020',
    name: 'Sofa Indivi 3 chỗ',
    image: 'https://ckkvyltbeinzqogjsfli.supabase.co/storage/v1/object/public/dcor/sofas/SM42250020_boconcept-indivi-upholstery-2.png',
    price: '42,250,000 ₫',
    category: 'Sofa'
  },
  {
    id: '37006300',
    name: 'Bàn console Bordeaux',
    image: 'https://ckkvyltbeinzqogjsfli.supabase.co/storage/v1/object/public/dcor/tables/37006300_368118_PNG-Web2072dpi.png',
    price: '17,990,000 ₫',
    category: 'Bàn'
  }
];

export default function WishlistPage() {
  const [items, setItems] = useState<WishlistItem[]>(INITIAL_WISHLIST);

  const handleRemove = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const handleAddToCart = (name: string) => {
    alert('Đã thêm sản phẩm ' + name + ' vào giỏ hàng thành công!');
  };

  return (
    <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '30px', boxShadow: 'var(--card-shadow)' }}>
      
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-title)' }}>Danh sách sản phẩm yêu thích</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>Nơi lưu trữ những mẫu thiết kế bạn ưng ý nhất để dễ dàng theo dõi và đặt mua sau này.</p>
      </div>

      {items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          Không có sản phẩm nào trong danh sách yêu thích của bạn.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '24px' }}>
          {items.map(item => (
            <div 
              key={item.id}
              style={{
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative'
              }}
            >
              {/* Nút xóa wishlist */}
              <button 
                onClick={() => handleRemove(item.id)}
                style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  width: '26px',
                  height: '26px',
                  background: 'rgba(31, 21, 16, 0.8)',
                  color: 'var(--text-muted)',
                  border: 'none',
                  borderRadius: '50%',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  cursor: 'pointer',
                  zIndex: 2
                }}
                title="Xóa khỏi danh sách"
              >
                ×
              </button>

              <div style={{ padding: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '160px', background: 'rgba(255,255,255,0.01)' }}>
                <img src={item.image} alt={item.name} style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
              </div>

              <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', flexGrow: 1 }}>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--accent)', textTransform: 'uppercase', fontWeight: 600 }}>{item.category}</span>
                  <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>{item.name}</h3>
                </div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--accent)', marginTop: 'auto' }}>{item.price}</div>
              </div>

              <div style={{ padding: '16px', borderTop: '1px solid var(--border-color)', display: 'grid', gridTemplateColumns: '1fr auto', gap: '8px' }}>
                <button 
                  onClick={() => handleAddToCart(item.name)}
                  style={{
                    background: 'var(--accent)',
                    color: '#fff',
                    padding: '8px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Mua hàng
                </button>
                <Link 
                  href={`/kham-pha/${item.id}`}
                  style={{
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-primary)',
                    color: 'var(--text-secondary)',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 600,
                    textAlign: 'center'
                  }}
                >
                  Xem
                </Link>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
}
