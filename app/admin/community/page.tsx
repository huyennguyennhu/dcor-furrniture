'use client';

import React, { useState } from 'react';

interface PendingPost {
  id: string;
  user: string;
  avatar: string;
  image: string;
  description: string;
  style: string;
  roomType: string;
  createdAt: string;
}

const SAMPLE_PENDING_POSTS: PendingPost[] = [
  {
    id: 'post-pending-1',
    user: 'Trần Thanh',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80',
    image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=400&q=80',
    description: 'Sắp xếp phòng khách mới siêu ưng với sofa Đan Mạch mua dịp sale của D\'Cor Studio!',
    style: 'Modern',
    roomType: 'Phòng khách',
    createdAt: 'Hôm nay'
  }
];

export default function AdminCommunityPage() {
  const [posts, setPosts] = useState<PendingPost[]>(SAMPLE_PENDING_POSTS);

  const handleApprove = (id: string) => {
    alert('Đã duyệt bài viết! Bài viết hiện đã xuất hiện trên Feed công khai /community.');
    setPosts(posts.filter(p => p.id !== id));
  };

  const handleReject = (id: string) => {
    if (confirm('Bạn có chắc muốn từ chối và xóa bài chia sẻ này?')) {
      setPosts(posts.filter(p => p.id !== id));
    }
  };

  return (
    <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '30px', boxShadow: 'var(--card-shadow)' }}>
      
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-title)' }}>Duyệt bài đăng cộng đồng (Community Moderation)</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>Duyệt hoặc ẩn/xóa các bài viết chia sẻ không gian thực tế từ phía người dùng.</p>
      </div>

      {posts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
          Không có bài chia sẻ nào đang chờ duyệt.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {posts.map(post => (
            <div 
              key={post.id}
              style={{
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '24px',
                display: 'grid',
                gridTemplateColumns: '150px 1fr auto',
                gap: '20px',
                alignItems: 'center'
              }}
            >
              {/* Ảnh bài viết */}
              <div style={{ height: '110px', borderRadius: '8px', overflow: 'hidden' }}>
                <img src={post.image} alt="Pending Post" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>

              {/* Thông tin mô tả */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <img src={post.avatar} alt={post.user} style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} />
                  <strong style={{ fontSize: '14px', color: '#fff' }}>{post.user}</strong>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>• {post.createdAt}</span>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.4', marginBottom: '8px' }}>{post.description}</p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span style={{ fontSize: '10px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', padding: '2px 8px', borderRadius: '4px' }}>{post.style}</span>
                  <span style={{ fontSize: '10px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', padding: '2px 8px', borderRadius: '4px' }}>{post.roomType}</span>
                </div>
              </div>

              {/* Nút duyệt */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  onClick={() => handleApprove(post.id)}
                  style={{
                    padding: '10px 20px',
                    background: '#2ECC71',
                    color: '#fff',
                    borderRadius: '20px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Phê duyệt
                </button>
                <button 
                  onClick={() => handleReject(post.id)}
                  style={{
                    padding: '10px 20px',
                    background: 'rgba(231, 76, 60, 0.1)',
                    border: '1px solid #E74C3C',
                    color: '#E74C3C',
                    borderRadius: '20px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Từ chối
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
}
