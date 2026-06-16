'use client';

import React from 'react';
import Link from 'next/link';

interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  image: string;
  date: string;
  readTime: string;
}

const SAMPLE_POSTS: BlogPost[] = [
  {
    slug: 'xu-huong-Scandinavian-2026',
    title: 'Xu hướng thiết kế Scandinavian lên ngôi năm 2026',
    excerpt: 'Phong cách tối giản Bắc Âu ngày càng phát triển với việc chú trọng vật liệu tự nhiên bền vững và sự tối đa công năng trong từng món nội thất nhỏ gọn.',
    image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=600&q=80',
    date: '14 Tháng 6, 2026',
    readTime: '5 phút đọc'
  },
  {
    slug: 'cach-chon-sofa-phu-hop',
    title: 'Cẩm nang chọn Sofa phù hợp cho căn hộ chung cư nhỏ',
    excerpt: 'Làm thế nào để chọn được một chiếc sofa vừa vặn cho không gian phòng khách nhỏ hẹp mà vẫn đảm bảo tính sang trọng và đủ chỗ ngồi cho gia đình?',
    image: 'https://ckkvyltbeinzqogjsfli.supabase.co/storage/v1/object/public/dcor/sofas/SM42250020_boconcept-indivi-upholstery-2.png',
    date: '02 Tháng 6, 2026',
    readTime: '4 phút đọc'
  },
  {
    slug: 'meo-bao-quan-do-go-tu-nhien',
    title: '5 mẹo bảo quản đồ nội thất gỗ tự nhiên luôn như mới',
    excerpt: 'Sồi, óc chó là những loại gỗ tự nhiên cao cấp rất bền bỉ, nhưng nếu không biết cách chăm sóc định kỳ, gỗ có thể bị rạn nứt hoặc mất đi độ bóng tự nhiên.',
    image: 'https://images.unsplash.com/photo-1618219908412-a29a1bb7b86e?auto=format&fit=crop&w=600&q=80',
    date: '25 Tháng 5, 2026',
    readTime: '3 phút đọc'
  }
];

export default function BlogListPage() {
  return (
    <div style={{ padding: '60px 0', minHeight: '80vh', backgroundColor: 'var(--bg-primary)' }}>
      <div className="container">
        
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <span style={{ color: 'var(--accent)', fontSize: '13px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase' }}>Cảm hứng không gian</span>
          <h1 style={{ fontSize: '36px', fontWeight: 800, marginTop: '8px', color: 'var(--text-primary)', fontFamily: 'var(--font-title)' }}>DC'or Blog & Ý tưởng</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '15px', marginTop: '6px', maxWidth: '600px', margin: '6px auto 0' }}>Cập nhật các xu hướng thiết kế nội thất mới nhất và các mẹo trang trí nhà cửa từ chuyên gia thiết kế.</p>
        </div>

        {/* Grid bài viết */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '35px' }}>
          {SAMPLE_POSTS.map(post => (
            <div 
              key={post.slug}
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
              <div style={{ height: '200px', overflow: 'hidden' }}>
                <img src={post.image} alt={post.title} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'all 0.5s ease' }} />
              </div>

              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px', flexGrow: 1 }}>
                <div style={{ display: 'flex', gap: '10px', fontSize: '11px', color: 'var(--text-muted)' }}>
                  <span>{post.date}</span>
                  <span>•</span>
                  <span>{post.readTime}</span>
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, lineHeight: '1.4' }}>
                  <Link href={`/blog/${post.slug}`} style={{ color: 'var(--text-primary)' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-primary)'}>
                    {post.title}
                  </Link>
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5', flexGrow: 1 }}>
                  {post.excerpt}
                </p>
                <Link 
                  href={`/blog/${post.slug}`} 
                  style={{
                    alignSelf: 'start',
                    color: 'var(--accent)',
                    fontSize: '13px',
                    fontWeight: 600,
                    marginTop: '10px'
                  }}
                >
                  Đọc thêm →
                </Link>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
