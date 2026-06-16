'use client';

import React, { useState } from 'react';

interface UserReview {
  id: string;
  productName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

const INITIAL_REVIEWS: UserReview[] = [
  {
    id: 'rev-1',
    productName: 'Sofa Indivi 3 chỗ',
    rating: 5,
    comment: 'Sofa ngồi rất đã, nệm êm vừa phải không bị quá lún. Chân thép đen lắp chắc chắn.',
    createdAt: '15 Tháng 5, 2026'
  }
];

export default function UserReviewsPage() {
  const [reviews, setReviews] = useState<UserReview[]>(INITIAL_REVIEWS);
  const [showForm, setShowForm] = useState(false);

  const [productName, setProductName] = useState('Bàn console Bordeaux');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment) return;

    const newRev: UserReview = {
      id: `rev-${Date.now()}`,
      productName,
      rating,
      comment,
      createdAt: 'Hôm nay'
    };

    setReviews([newRev, ...reviews]);
    setComment('');
    setShowForm(false);
    alert('Cảm ơn bạn đã gửi đánh giá sản phẩm!');
  };

  return (
    <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '30px', boxShadow: 'var(--card-shadow)' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-title)' }}>Đánh giá của tôi</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>Viết cảm nhận và đánh giá về các sản phẩm bạn đã mua tại cửa hàng.</p>
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
            + Viết đánh giá mới
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleAddReview} style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px', marginBottom: '30px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>Viết đánh giá sản phẩm</h3>
          
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Chọn sản phẩm đã mua</label>
            <select 
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              style={{ width: '100%', height: '40px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0 12px', color: '#fff', fontSize: '13px', outline: 'none' }}
            >
              <option value="Bàn console Bordeaux">Bàn console Bordeaux</option>
              <option value="Hệ thống Como">Hệ thống Como</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Đánh giá số sao</label>
            <div style={{ display: 'flex', gap: '6px' }}>
              {[1, 2, 3, 4, 5].map(num => (
                <button 
                  key={num}
                  type="button"
                  onClick={() => setRating(num)}
                  style={{
                    fontSize: '20px',
                    color: rating >= num ? '#F1C40F' : 'var(--text-muted)',
                    cursor: 'pointer'
                  }}
                >
                  </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Nội dung bình luận *</label>
            <textarea 
              required
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Chia sẻ trải nghiệm sử dụng thực tế của bạn về chất liệu, kiểu dáng, dịch vụ lắp đặt..."
              style={{ width: '100%', height: '80px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px 12px', color: '#fff', fontSize: '13px', outline: 'none', resize: 'none' }}
            />
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
              Gửi đánh giá
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

      {/* Danh sách review */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {reviews.map(rev => (
          <div key={rev.id} style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <strong style={{ fontSize: '15px', color: '#fff', display: 'block' }}>{rev.productName}</strong>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Đánh giá ngày: {rev.createdAt}</span>
              </div>
              <div style={{ display: 'flex', gap: '2px' }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <span key={i} style={{ color: i < rev.rating ? '#F1C40F' : 'var(--text-muted)', fontSize: '14px' }}></span>
                ))}
              </div>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>{rev.comment}</p>
          </div>
        ))}
      </div>

    </div>
  );
}
