'use client';

import React, { useState } from 'react';

interface AdminBlogPost {
  slug: string;
  title: string;
  date: string;
  status: 'PUBLISHED' | 'DRAFT';
  statusVi: string;
}

const SAMPLE_POSTS: AdminBlogPost[] = [
  { slug: 'xu-huong-Scandinavian-2026', title: 'Xu thái thiết kế Scandinavian lên ngôi năm 2026', date: '14 Tháng 6, 2026', status: 'PUBLISHED', statusVi: 'Đã xuất bản' },
  { slug: 'cach-chon-sofa-phu-hop', title: 'Cẩm nang chọn Sofa phù hợp cho căn hộ chung cư nhỏ', date: '02 Tháng 6, 2026', status: 'PUBLISHED', statusVi: 'Đã xuất bản' },
  { slug: 'meo-bao-quan-do-go-tu-nhien', title: '5 mẹo bảo quản đồ nội thất gỗ tự nhiên luôn như mới', date: '25 Tháng 5, 2026', status: 'DRAFT', statusVi: 'Bản nháp' }
];

export default function AdminContentPage() {
  const [posts, setPosts] = useState<AdminBlogPost[]>(SAMPLE_POSTS);
  const [showForm, setShowForm] = useState(false);

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [status, setStatus] = useState<'PUBLISHED' | 'DRAFT'>('DRAFT');

  const handleAddPost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !slug) return;

    const newPost: AdminBlogPost = {
      slug: slug.trim().toLowerCase().replace(/\s+/g, '-'),
      title,
      date: 'Hôm nay',
      status,
      statusVi: status === 'PUBLISHED' ? 'Đã xuất bản' : 'Bản nháp'
    };

    setPosts([newPost, ...posts]);
    setTitle('');
    setSlug('');
    setShowForm(false);
    alert('Đã thêm bài viết Blog mới thành công!');
  };

  return (
    <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '30px', boxShadow: 'var(--card-shadow)' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-title)' }}>Quản trị nội dung website</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>Cấu hình Banner trang chủ, viết bài viết Blog truyền cảm hứng và thiết lập các trang thông tin.</p>
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
            + Viết bài viết Blog mới
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleAddPost} style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px', marginBottom: '30px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>Viết bài viết Blog mới</h3>
          
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Tiêu đề bài viết *</label>
            <input 
              type="text" 
              required
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                // Tự sinh slug cơ bản
                setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-'));
              }}
              placeholder="Nhập tiêu đề bài viết..."
              style={{ width: '100%', height: '40px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0 12px', color: '#fff', fontSize: '13px', outline: 'none' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Đường dẫn tĩnh (Slug) *</label>
              <input 
                type="text" 
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="url-bai-viet-viet-lien"
                style={{ width: '100%', height: '40px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0 12px', color: '#fff', fontSize: '13px', outline: 'none' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Trạng thái</label>
              <select 
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                style={{ width: '100%', height: '40px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0 12px', color: '#fff', fontSize: '13px', outline: 'none' }}
              >
                <option value="DRAFT">Bản nháp (Draft)</option>
                <option value="PUBLISHED">Xuất bản ngay (Published)</option>
              </select>
            </div>
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
              Lưu bài viết
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

      {/* Danh sách các bài viết */}
      <div>
        <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px', textTransform: 'uppercase' }}>Danh sách bài viết Blog</h3>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '12px' }}>Tiêu đề bài viết</th>
                <th style={{ padding: '12px' }}>Đường dẫn (Slug)</th>
                <th style={{ padding: '12px' }}>Ngày tạo</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {posts.map(p => (
                <tr key={p.slug} style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                  <td style={{ padding: '12px', color: '#fff', fontWeight: 600 }}>{p.title}</td>
                  <td style={{ padding: '12px' }}>/blog/{p.slug}</td>
                  <td style={{ padding: '12px' }}>{p.date}</td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>
                    <span style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: p.status === 'PUBLISHED' ? 'rgba(46, 204, 113, 0.1)' : 'rgba(241, 196, 15, 0.1)',
                      color: p.status === 'PUBLISHED' ? '#2ECC71' : '#F1C40F'
                    }}>
                      {p.statusVi}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
