'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface UserPost {
  id: string;
  image: string;
  description: string;
  likes: number;
  isApproved: boolean;
  createdAt: string;
}

const INITIAL_POSTS: UserPost[] = [
  {
    id: 'post-1',
    image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=400&q=80',
    description: 'Rất hài lòng với mẫu sofa Indivi Lazio mới mua từ D\'Cor Studio. Thiết kế tối giản, tông màu xám rất sang trọng, ngồi vô cùng êm ái.',
    likes: 124,
    isApproved: true,
    createdAt: '12 Tháng 6, 2026'
  }
];

export default function UserPostsPage() {
  const [posts, setPosts] = useState<UserPost[]>(INITIAL_POSTS);

  const handleRemove = (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa bài chia sẻ này không?')) {
      setPosts(posts.filter(p => p.id !== id));
    }
  };

  return (
    <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '30px', boxShadow: 'var(--card-shadow)' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-title)' }}>Bài chia sẻ của tôi</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>Quản lý các hình ảnh thực tế bạn đã đăng tải lên DCor Community.</p>
        </div>
        <Link 
          href="/community/new"
          style={{
            padding: '10px 20px',
            background: 'var(--accent)',
            color: '#fff',
            borderRadius: '20px',
            fontSize: '13px',
            fontWeight: 600
          }}
        >
          + Đăng bài chia sẻ mới
        </Link>
      </div>

      {posts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          Bạn chưa đăng bài viết cộng đồng nào.
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
                padding: '20px',
                display: 'flex',
                gap: '20px',
                alignItems: 'center'
              }}
            >
              <div style={{ width: '120px', height: '90px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0 }}>
                <img src={post.image} alt="Post" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>

              <div style={{ flexGrow: 1 }}>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>{post.description}</p>
                <div style={{ display: 'flex', gap: '15px', marginTop: '10px', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Đăng ngày: {post.createdAt}</span>
                  <span style={{ fontSize: '12px', color: 'var(--accent)', fontWeight: 600 }}>{post.likes} Lượt thích</span>
                  
                  {/* Trạng thái phê duyệt */}
                  <span style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: post.isApproved ? 'rgba(46, 204, 113, 0.1)' : 'rgba(241, 196, 15, 0.1)',
                    color: post.isApproved ? '#2ECC71' : '#F1C40F',
                    textTransform: 'uppercase'
                  }}>
                    {post.isApproved ? 'Đã duyệt' : 'Chờ duyệt'}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0 }}>
                <Link 
                  href={`/community/${post.id}`}
                  style={{
                    padding: '8px 16px',
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-secondary)',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 600,
                    textAlign: 'center'
                  }}
                >
                  Xem bài
                </Link>
                <button 
                  onClick={() => handleRemove(post.id)}
                  style={{
                    padding: '8px 16px',
                    background: 'rgba(231, 76, 60, 0.1)',
                    border: '1px solid #E74C3C',
                    color: '#E74C3C',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 600
                  }}
                >
                  Xóa bài
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
}
