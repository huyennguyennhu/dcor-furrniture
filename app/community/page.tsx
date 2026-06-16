'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface Post {
  id: string;
  user: string;
  avatar: string;
  image: string;
  description: string;
  likes: number;
  style: string;
  roomType: string;
  taggedProducts: { id: string; name: string; price: string }[];
}

const SAMPLE_POSTS: Post[] = [
  {
    id: 'post-1',
    user: 'Minh Trí',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80',
    image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80',
    description: 'Rất hài lòng với mẫu sofa Indivi Lazio mới mua từ D\'Cor Studio. Thiết kế tối giản, tông màu xám rất sang trọng, ngồi vô cùng êm ái.',
    likes: 124,
    style: 'Scandinavian',
    roomType: 'Phòng khách',
    taggedProducts: [
      { id: 'SM42250020', name: 'Sofa Indivi 3 chỗ', price: '42,250,000 ₫' }
    ]
  },
  {
    id: 'post-2',
    user: 'Hương Giang',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80',
    image: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=800&q=80',
    description: 'Phòng ngủ mới hoàn thành cực ưng ý. Chiếc tủ treo tường Bordeaux này vừa làm đẹp góc phòng vừa rất tiện lợi để đồ decor.',
    likes: 85,
    style: 'Tối giản',
    roomType: 'Phòng ngủ',
    taggedProducts: [
      { id: '37006300', name: 'Bàn console Bordeaux', price: '17,990,000 ₫' }
    ]
  },
  {
    id: 'post-3',
    user: 'Khánh Nam',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=100&q=80',
    image: 'https://images.unsplash.com/photo-1618219908412-a29a1bb7b86e?auto=format&fit=crop&w=800&q=80',
    description: 'Không gian làm việc tại nhà đậm chất Bắc Âu nhờ kệ sách Como. Tải ảnh lên Room Planner để phối màu trước quả là quyết định đúng đắn.',
    likes: 210,
    style: 'Hiện đại',
    roomType: 'Phòng làm việc',
    taggedProducts: [
      { id: '3400C011', name: 'Hệ thống Como', price: '119,900,000 ₫' }
    ]
  }
];

export default function CommunityPage() {
  const [posts, setPosts] = useState<Post[]>(SAMPLE_POSTS);
  const [selectedStyle, setSelectedStyle] = useState('');
  const [likedPosts, setLikedPosts] = useState<string[]>([]);

  const handleLike = (id: string) => {
    if (likedPosts.includes(id)) {
      setLikedPosts(likedPosts.filter(pId => pId !== id));
      setPosts(posts.map(p => p.id === id ? { ...p, likes: p.likes - 1 } : p));
    } else {
      setLikedPosts([...likedPosts, id]);
      setPosts(posts.map(p => p.id === id ? { ...p, likes: p.likes + 1 } : p));
    }
  };

  const filteredPosts = selectedStyle 
    ? posts.filter(p => p.style === selectedStyle)
    : posts;

  return (
    <div style={{ padding: '60px 0', minHeight: '80vh', backgroundColor: 'var(--bg-primary)' }}>
      <div className="container">
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', flexWrap: 'wrap', gap: '15px' }}>
          <div>
            <span style={{ color: 'var(--accent)', fontSize: '13px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase' }}>Ý tưởng từ cộng đồng</span>
            <h1 style={{ fontSize: '32px', fontWeight: 800, marginTop: '4px', color: 'var(--text-primary)', fontFamily: 'var(--font-title)' }}>D'Cor Community</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>Khám phá không gian thực tế được chia sẻ bởi các khách hàng của D'Cor Studio.</p>
          </div>
          <Link 
            href="/community/new" 
            style={{
              padding: '12px 24px',
              background: 'var(--accent)',
              color: '#fff',
              borderRadius: '25px',
              fontWeight: 600,
              fontSize: '14px',
              boxShadow: '0 4px 15px rgba(var(--accent-rgb), 0.3)'
            }}
          >
            + Chia sẻ phòng của bạn
          </Link>
        </div>

        {/* Lọc Phong cách */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', flexWrap: 'wrap' }}>
          <button 
            onClick={() => setSelectedStyle('')}
            style={{
              padding: '8px 18px',
              borderRadius: '20px',
              background: selectedStyle === '' ? 'var(--accent)' : 'var(--bg-secondary)',
              border: `1px solid ${selectedStyle === '' ? 'var(--accent)' : 'var(--border-color)'}`,
              color: '#fff',
              fontSize: '13px',
              fontWeight: 500
            }}
          >
            Tất cả
          </button>
          {['Scandinavian', 'Tối giản', 'Hiện đại'].map(style => (
            <button 
              key={style}
              onClick={() => setSelectedStyle(style)}
              style={{
                padding: '8px 18px',
                borderRadius: '20px',
                background: selectedStyle === style ? 'var(--accent)' : 'var(--bg-secondary)',
                border: `1px solid ${selectedStyle === style ? 'var(--accent)' : 'var(--border-color)'}`,
                color: '#fff',
                fontSize: '13px',
                fontWeight: 500
              }}
            >
              {style}
            </button>
          ))}
        </div>

        {/* Masonry Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '30px' }}>
          {filteredPosts.map(post => {
            const isLiked = likedPosts.includes(post.id);
            return (
              <div 
                key={post.id}
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  boxShadow: 'var(--card-shadow)',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                {/* Ảnh bài viết */}
                <div style={{ position: 'relative', overflow: 'hidden', height: '240px' }}>
                  <img src={post.image} alt={post.description} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', top: '12px', right: '12px', display: 'flex', gap: '6px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 600, background: 'rgba(31, 21, 16, 0.8)', padding: '4px 10px', borderRadius: '4px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>{post.style}</span>
                    <span style={{ fontSize: '11px', fontWeight: 600, background: 'rgba(31, 21, 16, 0.8)', padding: '4px 10px', borderRadius: '4px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>{post.roomType}</span>
                  </div>
                </div>

                {/* Thông tin User */}
                <div style={{ padding: '20px', flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <img src={post.avatar} alt={post.user} style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} />
                    <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>{post.user}</span>
                  </div>

                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5', flexGrow: 1 }}>{post.description}</p>

                  {/* Tagged Products */}
                  <div style={{ background: 'var(--bg-tertiary)', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Sản phẩm trong ảnh:</span>
                    {post.taggedProducts.map(p => (
                      <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                        <Link href={`/kham-pha/${p.id}`} style={{ fontSize: '12px', fontWeight: 600, color: '#fff' }}>
                          {p.name}
                        </Link>
                        <span style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: 700 }}>{p.price}</span>
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '12px', marginTop: '8px' }}>
                    <button 
                      onClick={() => handleLike(post.id)}
                      style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: isLiked ? 'var(--accent)' : 'var(--text-secondary)', cursor: 'pointer' }}
                    >
                      <span style={{ fontSize: '16px' }}>{isLiked ? '' : ''}</span>
                      <strong>{post.likes} Yêu thích</strong>
                    </button>
                    <Link href={`/community/${post.id}`} style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                      Xem chi tiết →
                    </Link>
                  </div>
                </div>

              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
