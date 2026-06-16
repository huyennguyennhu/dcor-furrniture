'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface PostDetail {
  id: string;
  user: string;
  avatar: string;
  image: string;
  description: string;
  likes: number;
  style: string;
  roomType: string;
  createdAt: string;
  taggedProducts: { id: string; name: string; price: string; x: number; y: number }[];
  comments: { user: string; content: string; time: string }[];
}

const SAMPLE_POST_DETAIL: PostDetail = {
  id: 'post-1',
  user: 'Minh Trí',
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80',
  image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=80',
  description: 'Rất hài lòng với mẫu sofa Indivi Lazio mới mua từ D\'Cor Studio. Thiết kế tối giản, tông màu xám rất sang trọng, ngồi vô cùng êm ái. Rất đề xuất cho những ai yêu thích phong cách Scandinavian hiện đại.',
  likes: 124,
  style: 'Scandinavian',
  roomType: 'Phòng khách',
  createdAt: '12 Tháng 6, 2026',
  taggedProducts: [
    { id: 'SM42250020', name: 'Sofa Indivi 3 chỗ', price: '42,250,000 ₫', x: 45, y: 55 }
  ],
  comments: [
    { user: 'Bảo Khánh', content: 'Sofa đẹp quá anh ơi, cho em hỏi đệm ngồi có bị lún nhiều sau thời gian sử dụng không ạ?', time: '1 ngày trước' },
    { user: 'Minh Trí', content: 'Không em nhé, nệm bọt mật độ cao chịu lực tốt lắm, đàn hồi nhanh.', time: '12 giờ trước' }
  ]
};

export default function CommunityPostDetailPage() {
  const params = useParams();
  const [post, setPost] = useState<PostDetail>(SAMPLE_POST_DETAIL);
  const [commentText, setCommentText] = useState('');
  const [isLiked, setIsLiked] = useState(false);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setPost({
      ...post,
      likes: isLiked ? post.likes - 1 : post.likes + 1
    });
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    const newComment = {
      user: 'Khách hàng (Bạn)',
      content: commentText,
      time: 'Vừa xong'
    };

    setPost({
      ...post,
      comments: [...post.comments, newComment]
    });
    setCommentText('');
  };

  return (
    <div style={{ padding: '60px 0', minHeight: '90vh', backgroundColor: 'var(--bg-primary)' }}>
      <div className="container">
        
        <Link href="/community" style={{ color: 'var(--text-muted)', fontSize: '14px', display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '24px' }}>
          ← Quay lại Feed Cộng đồng
        </Link>

        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '40px', alignItems: 'start' }}>
          
          {/* Cột trái: Ảnh không gian & Tagged Point */}
          <div>
            <div style={{
              position: 'relative',
              borderRadius: '20px',
              overflow: 'hidden',
              border: '1px solid var(--border-color)',
              boxShadow: 'var(--glass-shadow)',
              background: 'var(--bg-secondary)',
              aspectRatio: '16/10'
            }}>
              <img src={post.image} alt={post.description} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              
              {/* Điểm Tagged sản phẩm trên ảnh */}
              {post.taggedProducts.map((p, idx) => (
                <div 
                  key={idx} 
                  style={{
                    position: 'absolute',
                    left: `${p.x}%`,
                    top: `${p.y}%`,
                    transform: 'translate(-50%, -50%)',
                    zIndex: 10
                  }}
                >
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--accent)',
                    border: '3px solid #fff',
                    boxShadow: '0 0 10px rgba(0,0,0,0.5)',
                    cursor: 'pointer',
                    position: 'relative'
                  }} title={p.name}>
                    {/* Tooltip hiển thị thông tin sản phẩm */}
                    <div style={{
                      position: 'absolute',
                      bottom: '30px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: 'rgba(31, 21, 16, 0.95)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      color: '#fff',
                      fontSize: '11px',
                      whiteSpace: 'nowrap',
                      pointerEvents: 'auto',
                      boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontWeight: 600 }}>{p.name}</div>
                      <div style={{ color: 'var(--accent)', fontWeight: 700, marginTop: '2px' }}>{p.price}</div>
                      <Link href={`/kham-pha/${p.id}`} style={{ display: 'block', marginTop: '6px', color: '#fff', textDecoration: 'underline' }}>Xem chi tiết →</Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <Link 
                href={`/room-planner?bg=${encodeURIComponent(post.image)}`} 
                className="customize-btn"
                style={{ flexGrow: 1, justifyContent: 'center', padding: '14px' }}
              >
                Thử thiết kế này trong Room Planner
              </Link>
            </div>
          </div>

          {/* Cột phải: Thông tin mô tả & Comments */}
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '30px', boxShadow: 'var(--card-shadow)' }}>
            
            {/* User profile */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <img src={post.avatar} alt={post.user} style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover' }} />
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>{post.user}</h3>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Đăng ngày {post.createdAt}</span>
                </div>
              </div>
              <button 
                onClick={handleLike}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  borderRadius: '20px',
                  background: isLiked ? 'var(--accent)' : 'var(--bg-tertiary)',
                  border: '1px solid var(--border-color)',
                  color: '#fff',
                  fontSize: '13px',
                  fontWeight: 600
                }}
              >
                <span>{isLiked ? '' : ''}</span> {post.likes}
              </button>
            </div>

            {/* Mô tả */}
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '20px' }}>
              {post.description}
            </p>

            {/* Mục Bình luận */}
            <div>
              <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px', textTransform: 'uppercase' }}>Bình luận ({post.comments.length})</h4>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '300px', overflowY: 'auto', marginBottom: '24px', paddingRight: '6px' }}>
                {post.comments.map((comment, index) => (
                  <div key={index} style={{ background: 'var(--bg-tertiary)', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <strong style={{ fontSize: '13px', color: '#fff' }}>{comment.user}</strong>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{comment.time}</span>
                    </div>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>{comment.content}</p>
                  </div>
                ))}
              </div>

              {/* Form gửi bình luận */}
              <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '10px' }}>
                <input 
                  type="text" 
                  placeholder="Viết bình luận của bạn..." 
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  style={{
                    flexGrow: 1,
                    height: '44px',
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '0 16px',
                    color: '#fff',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                />
                <button 
                  type="submit"
                  style={{
                    background: 'var(--accent)',
                    color: '#fff',
                    padding: '0 20px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Gửi
                </button>
              </form>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
