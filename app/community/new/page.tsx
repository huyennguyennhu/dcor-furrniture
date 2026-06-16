'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function NewCommunityPostPage() {
  const router = useRouter();
  const [description, setDescription] = useState('');
  const [style, setStyle] = useState('Minimalist');
  const [roomType, setRoomType] = useState('Living room');
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setImagePreview(url);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Bài viết của bạn đã được gửi lên hệ thống và đang chờ Admin duyệt phê duyệt!');
    router.push('/community');
  };

  return (
    <div style={{ padding: '60px 0', minHeight: '85vh', backgroundColor: 'var(--bg-primary)' }}>
      <div className="container" style={{ maxWidth: '700px' }}>
        
        <Link href="/community" style={{ color: 'var(--text-muted)', fontSize: '14px', display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '24px' }}>
          ← Quay lại Feed Cộng đồng
        </Link>

        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '35px', boxShadow: 'var(--card-shadow)' }}>
          
          <div style={{ marginBottom: '30px' }}>
            <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-title)' }}>Chia sẻ không gian của bạn</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '6px' }}>Đăng tải hình ảnh thực tế căn phòng của bạn để truyền cảm hứng thiết kế cho cộng đồng.</p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Upload ảnh */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600 }}>Tải ảnh thực tế (Tối đa 5 ảnh) *</label>
              
              {imagePreview ? (
                <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)', height: '280px', background: 'var(--bg-tertiary)' }}>
                  <img src={imagePreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button 
                    type="button" 
                    onClick={() => setImagePreview(null)}
                    style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(231, 76, 60, 0.8)', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600 }}
                  >
                    Thay đổi ảnh khác
                  </button>
                </div>
              ) : (
                <label style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '200px',
                  border: '2px dashed var(--border-color)',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  background: 'rgba(255, 255, 255, 0.02)',
                  transition: 'all 0.2s ease'
                }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '10px' }}>
                    <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
                  </svg>
                  <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Chọn ảnh từ thiết bị của bạn</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Hỗ trợ JPG, PNG, WEBP</span>
                  <input type="file" accept="image/*" required onChange={handleImageChange} style={{ display: 'none' }} />
                </label>
              )}
            </div>

            {/* Lọc Tag */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>Phong cách thiết kế</label>
                <select 
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  style={{ width: '100%', height: '44px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0 12px', color: '#fff', fontSize: '13px', outline: 'none' }}
                >
                  <option value="Scandinavian">Scandinavian (Bắc Âu)</option>
                  <option value="Minimalist">Minimalist (Tối giản)</option>
                  <option value="Modern">Modern (Hiện đại)</option>
                  <option value="Classic">Classic (Cổ điển)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>Loại phòng không gian</label>
                <select 
                  value={roomType}
                  onChange={(e) => setRoomType(e.target.value)}
                  style={{ width: '100%', height: '44px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0 12px', color: '#fff', fontSize: '13px', outline: 'none' }}
                >
                  <option value="Living room">Phòng khách</option>
                  <option value="Bedroom">Phòng ngủ</option>
                  <option value="Office">Phòng làm việc</option>
                  <option value="Kitchen">Phòng bếp</option>
                </select>
              </div>
            </div>

            {/* Mô tả */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>Cảm nhận & Trải nghiệm thực tế *</label>
              <textarea 
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Chia sẻ về sản phẩm bạn đã mua, cách bài trí không gian và trải nghiệm sử dụng..." 
                style={{ width: '100%', height: '120px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '12px 16px', color: '#fff', fontSize: '14px', outline: 'none', resize: 'none' }}
              />
            </div>

            {/* Gợi ý tag sản phẩm */}
            <div style={{ background: 'var(--bg-tertiary)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>️ Gắn thẻ sản phẩm đã mua</span>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Sau khi đăng ảnh thành công, hệ thống sẽ tự động đối chiếu các sản phẩm đã mua trong tài khoản để bạn gắn thẻ (tag) trực tiếp lên vị trí tương ứng trong bức ảnh.</p>
            </div>

            <button 
              type="submit" 
              style={{
                width: '100%',
                background: 'var(--accent)',
                color: '#fff',
                padding: '14px',
                borderRadius: '30px',
                fontSize: '15px',
                fontWeight: 600,
                boxShadow: '0 6px 20px rgba(var(--accent-rgb), 0.3)',
                cursor: 'pointer',
                marginTop: '10px'
              }}
            >
              Đăng bài viết (Chờ phê duyệt)
            </button>

          </form>

        </div>
      </div>
    </div>
  );
}
