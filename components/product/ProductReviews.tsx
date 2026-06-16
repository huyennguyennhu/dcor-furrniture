'use client';

import React, { useEffect, useState } from 'react';

export default function ProductReviews({ productId }: { productId: string }) {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | '5' | '4' | 'images'>('all');

  useEffect(() => {
    async function fetchReviews() {
      try {
        const res = await fetch(`/api/products/${productId}/reviews`);
        if (res.ok) {
          const data = await res.json();
          setReviews(data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchReviews();
  }, [productId]);

  if (loading) return <div style={{ marginTop: '80px', color: 'var(--text-muted)' }}>Đang tải đánh giá...</div>;

  if (reviews.length === 0) {
    return (
      <div className="product-reviews-section" style={{ marginTop: '80px', padding: '40px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px dashed var(--border-color)' }}>
        <h2 style={{ fontSize: '24px', marginBottom: '8px' }}>Chưa có đánh giá nào</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Hãy trở thành người đầu tiên đánh giá sản phẩm này sau khi mua hàng.</p>
      </div>
    );
  }

  const filteredReviews = reviews.filter(r => {
    if (filter === '5') return r.rating === 5;
    if (filter === '4') return r.rating === 4;
    if (filter === 'images') return r.images && r.images.length > 0;
    return true;
  });

  const avgRating = (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1);

  return (
    <div className="product-reviews-section" style={{ marginTop: '80px' }}>
      <h2 style={{ fontSize: '24px', marginBottom: '24px' }}>Khách hàng đánh giá ({reviews.length})</h2>
      
      <div style={{ display: 'flex', gap: '40px', marginBottom: '40px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', fontWeight: 700, color: 'var(--text-primary)' }}>{avgRating}</div>
          <div style={{ color: '#FFD700', fontSize: '20px', margin: '8px 0' }}>★★★★★</div>
          <div style={{ color: 'var(--text-muted)' }}>{reviews.length} đánh giá</div>
        </div>
        
        <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: '12px', alignContent: 'center' }}>
          {[
            { id: 'all', label: 'Tất cả' },
            { id: '5', label: `5 Sao (${reviews.filter(r => r.rating === 5).length})` },
            { id: '4', label: `4 Sao (${reviews.filter(r => r.rating === 4).length})` },
            { id: 'images', label: `Có hình ảnh (${reviews.filter(r => r.images && r.images.length > 0).length})` }
          ].map(f => (
            <button 
              key={f.id}
              onClick={() => setFilter(f.id as any)}
              style={{
                padding: '8px 20px', borderRadius: '20px', background: filter === f.id ? 'var(--text-primary)' : 'rgba(255,255,255,0.05)',
                color: filter === f.id ? 'var(--bg-primary)' : 'var(--text-primary)', border: '1px solid',
                borderColor: filter === f.id ? 'var(--text-primary)' : 'var(--border-color)', cursor: 'pointer', transition: 'all 0.2s'
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {filteredReviews.map(review => (
          <div key={review.id} style={{ padding: '24px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                {review.user?.avatarUrl ? (
                  <img src={review.user.avatarUrl} alt="avatar" style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
                ) : (
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 600 }}>
                    {review.user?.fullName?.charAt(0) || 'U'}
                  </div>
                )}
                <div>
                  <div style={{ fontWeight: 600 }}>{review.user?.fullName || 'Khách hàng'}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{new Date(review.createdAt).toLocaleDateString('vi-VN')}</div>
                </div>
              </div>
              <div style={{ color: '#FFD700' }}>
                {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
              </div>
            </div>
            
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: review.images ? '16px' : 0 }}>
              {review.comment}
            </p>
            
            {review.images && Array.isArray(review.images) && review.images.length > 0 && (
              <div style={{ display: 'flex', gap: '12px' }}>
                {review.images.map((img: string, idx: number) => (
                  <img key={idx} src={img} alt="Review" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px', cursor: 'pointer' }} />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
