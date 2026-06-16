'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function BlogPostDetailPage() {
  const params = useParams();
  const slug = params.slug as string || 'xu-huong-Scandinavian-2026';

  const blogPost = {
    title: 'Xu hướng thiết kế Scandinavian lên ngôi năm 2026',
    date: '14 Tháng 6, 2026',
    author: 'D\'Cor Editor',
    readTime: '5 phút đọc',
    image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=80',
    content: [
      'Phong cách Scandinavian (hay phong cách Bắc Âu) từ lâu đã nổi tiếng với sự kết hợp hài hòa giữa vẻ đẹp thẩm mỹ tinh tế, sự tối giản và tính công năng thực tế. Bước sang năm 2026, phong cách này không những không giảm nhiệt mà còn phát triển lên một tầm cao mới, tập trung sâu hơn vào các giá trị bền vững và cá nhân hóa không gian.',
      'Sự thay đổi lớn nhất trong xu hướng Scandinavian 2026 chính là việc ứng dụng các vật liệu sinh thái thân thiện với môi trường. Người dùng có xu hướng lựa chọn đồ gỗ tự nhiên được khai thác từ nguồn rừng tái sinh bền vững, đi kèm vải bọc hữu cơ hoặc các mẫu da thật được xử lý thực vật không hóa chất độc hại.',
      'Bên cạnh đó, việc cá nhân hóa các món đồ nội thất đang trở thành nhu cầu thiết yếu. Việc phối ghép cấu hình chân sofa kim loại thanh mảnh hay chất liệu chân gỗ sồi mộc mạc, kết hợp cùng hàng trăm mẫu vải bọc màu cát, màu be giúp gia chủ bộc lộ rõ nét phong thái sống cá nhân.',
      'Tại D\'Cor Studio, chúng tôi cung cấp các giải pháp cấu hình tùy biến linh hoạt online cùng các thư viện ảnh thực tế chia sẻ từ cộng đồng để bạn dễ dàng tìm thấy nguồn cảm hứng phù hợp nhất cho tổ ấm của mình.'
    ]
  };

  return (
    <div style={{ padding: '60px 0', minHeight: '90vh', backgroundColor: 'var(--bg-primary)' }}>
      <div className="container" style={{ maxWidth: '800px' }}>
        
        <Link href="/blog" style={{ color: 'var(--text-muted)', fontSize: '14px', display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '24px' }}>
          ← Quay lại danh sách bài viết
        </Link>

        <article style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Header bài viết */}
          <div>
            <div style={{ display: 'flex', gap: '15px', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>
              <span>{blogPost.date}</span>
              <span>•</span>
              <span>Tác giả: {blogPost.author}</span>
              <span>•</span>
              <span>{blogPost.readTime}</span>
            </div>
            <h1 style={{ fontSize: '38px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: '1.2', fontFamily: 'var(--font-title)' }}>{blogPost.title}</h1>
          </div>

          {/* Ảnh bìa lớn */}
          <div style={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border-color)', height: '400px', background: 'var(--bg-secondary)' }}>
            <img src={blogPost.image} alt={blogPost.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>

          {/* Nội dung chi tiết */}
          <div style={{
            fontSize: '16px',
            color: 'var(--text-secondary)',
            lineHeight: '1.8',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            marginTop: '10px'
          }}>
            {blogPost.content.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>

        </article>

      </div>
    </div>
  );
}
