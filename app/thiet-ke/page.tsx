'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, PenTool, Columns, Box, UploadCloud, Loader2 } from 'lucide-react';
import { usePlannerStore } from '@/lib/store/plannerStore';

const ROOM_TYPES = [
  { id: 'living', name: 'Phòng khách', image: 'https://res.cloudinary.com/dsasf753c/image/upload/v1782629735/room_img/phong_khach.png' },
  { id: 'bedroom', name: 'Phòng ngủ', image: 'https://res.cloudinary.com/dsasf753c/image/upload/v1782629737/room_img/phong_ngu.png' },
  { id: 'dining', name: 'Phòng ăn', image: 'https://res.cloudinary.com/dsasf753c/image/upload/v1782629732/room_img/phong_an.png' }
];

const TEMPLATES = [
  { id: 't1', name: 'Japandi Harmony', category: 'Japandi', image: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800&q=80' },
  { id: 't2', name: 'Nordic Light', category: 'Scandinavian', image: 'https://images.unsplash.com/photo-1593696140826-c58b021acf8b?auto=format&fit=crop&w=800&q=80' },
  { id: 't3', name: 'Urban Minimalist', category: 'Minimalist', image: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=800&q=80' }
];

const RECENT_DESIGNS = [
  { id: 'r1', name: 'Phòng khách nhà mới', date: '12/06/2026', image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80' },
  { id: 'r2', name: 'Phòng ngủ bé', date: '10/06/2026', image: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=800&q=80' }
];

export default function DesignHubPage() {
  const router = useRouter();
  const setCustomImage = usePlannerStore(state => state.setCustomImage);
  const [activeTab, setActiveTab] = useState('all');
  const [drafts, setDrafts] = useState<any[]>([]);
  const [isCompressing, setIsCompressing] = useState(false);

  useEffect(() => {
    // Load drafts and cleanup old ones (> 7 days)
    const stored = localStorage.getItem('dcor_drafts');
    if (stored) {
      try {
        let parsedDrafts = JSON.parse(stored);
        
        // Remove old drafts (> 7 days) and empty drafts (0 items)
        const now = new Date();
        const validDrafts = parsedDrafts.filter((d: any) => {
          const isNotEmpty = d.canvasState && d.canvasState.length > 0;
          if (!isNotEmpty) return false;
          
          if (!d.updatedAt) return true;
          const diffTime = Math.abs(now.getTime() - new Date(d.updatedAt).getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
          return diffDays <= 7;
        });

        // Limit to 8 drafts just in case
        const limitedDrafts = validDrafts.slice(0, 8);
        
        setDrafts(limitedDrafts);
        if (limitedDrafts.length !== parsedDrafts.length) {
          localStorage.setItem('dcor_drafts', JSON.stringify(limitedDrafts));
        }
      } catch(e) {
        console.error('Failed to parse drafts', e);
      }
    }
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit: 10MB = 10 * 1024 * 1024 bytes
    if (file.size > 10 * 1024 * 1024) {
      alert('Vui lòng chọn ảnh có kích thước dưới 10MB để đảm bảo hiệu suất tốt nhất.');
      return;
    }

    setIsCompressing(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Nén ảnh bằng Canvas
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Tối đa 1920px cho chiều rộng/cao để không quá nặng
        const MAX_SIZE = 1920;
        if (width > height && width > MAX_SIZE) {
          height *= MAX_SIZE / width;
          width = MAX_SIZE;
        } else if (height > MAX_SIZE) {
          width *= MAX_SIZE / height;
          height = MAX_SIZE;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          // Nén thành định dạng WebP với quality 0.8
          const webpBase64 = canvas.toDataURL('image/webp', 0.8);
          setCustomImage(webpBase64);
          router.push('/thiet-ke/room-planner?room=custom');
        } else {
          setIsCompressing(false);
          alert('Trình duyệt không hỗ trợ nén ảnh.');
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };
  return (
    <div className="design-hub-page">
      {/* 1. Hero Section */}
      <section className="design-hero">
        <div className="container">
          <div className="design-hero-content">
            <h1 className="design-hero-title">Sẵn sàng bắt đầu?</h1>
            <p className="design-hero-subtitle">Khám phá ứng dụng Room Planner thông minh của DCor, nơi mọi ý tưởng đều có thể biến thành hiện thực và mua sắm ngay lập tức.</p>
            <Link href="/thiet-ke/room-planner" className="design-cta-btn">
              Thiết kế không gian ngay <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* 2. Bắt đầu thiết kế (Chọn loại phòng) */}
      <section className="design-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Bạn muốn thiết kế không gian nào?</h2>
            <p className="section-desc">Bắt đầu từ không gian trống hoặc chọn ảnh phòng thực tế của bạn.</p>
          </div>
          
          <div className="room-types-grid">
            {ROOM_TYPES.map(room => (
              <Link href={`/thiet-ke/room-planner?room=${room.id}`} key={room.id} className="room-type-card">
                <div className="room-type-img-wrapper">
                  <img src={room.image} alt={room.name} loading="lazy" />
                  <div className="room-type-overlay">
                    <span className="room-type-action">Tạo thiết kế mới</span>
                  </div>
                </div>
                <h3 className="room-type-name">{room.name}</h3>
              </Link>
            ))}

            {/* Card Upload Ảnh Tự Chọn */}
            <label className={`room-type-card new-design-card ${isCompressing ? 'opacity-50 pointer-events-none' : ''}`}>
              <div className="new-design-content">
                <div className="new-design-icon flex justify-center mb-2">
                  {isCompressing ? (
                    <Loader2 size={40} className="animate-spin" />
                  ) : (
                    <UploadCloud size={40} />
                  )}
                </div>
                <h3>{isCompressing ? 'Đang xử lý ảnh...' : 'Tải ảnh phòng của bạn lên'}</h3>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>JPG, PNG (Max 10MB)</span>
              </div>
              <input 
                type="file" 
                accept="image/*" 
                style={{ display: 'none' }} 
                onChange={handleFileUpload} 
                disabled={isCompressing}
              />
            </label>
          </div>
        </div>
      </section>

      {/* 3. Thiết kế của tôi (Mock UI cho Saved Designs) */}
      <section className="design-section bg-alt">
        <div className="container">
          <div className="section-header flex-between">
            <div>
              <h2 className="section-title">Thiết kế gần đây</h2>
              <p className="section-desc">Tiếp tục công việc đang dang dở của bạn.</p>
            </div>
            <Link href="/account/designs" className="view-all-link">Xem tất cả</Link>
          </div>
          
          {drafts.length > 0 && (
            <div style={{ marginBottom: '40px' }}>
              <h3 style={{ fontSize: '18px', marginBottom: '16px', color: 'var(--text-primary)' }}>
                Bản nháp lưu tạm <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 'normal', marginLeft: '8px' }}>(Tự động xóa sau 7 ngày)</span>
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', marginBottom: '16px' }}>
                {drafts.map((draft, idx) => (
                  <div key={idx} className="recent-design-card" style={{ width: '320px' }}>
                    <div className="recent-img-wrapper" style={{ border: '1px dashed var(--border-color)', position: 'relative', overflow: 'hidden' }}>
                      {draft.backgroundImage ? (
                        <img src={draft.backgroundImage} alt={draft.name} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8, display: 'block' }} />
                      ) : (
                        <div style={{ color: 'var(--text-muted)', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Không có nền</div>
                      )}
                      <div className="recent-overlay">
                        <Link href={`/thiet-ke/room-planner?draft=${draft.id}`} className="recent-action-btn">
                          Tiếp tục bản nháp
                        </Link>
                      </div>
                    </div>
                    <div className="recent-info">
                      <h3 className="recent-name">{draft.name}</h3>
                      <span className="recent-date">Lưu lúc: {new Date(draft.updatedAt).toLocaleString('vi-VN')}</span>
                      <span className="recent-date" style={{ display: 'block', marginTop: '4px', color: 'var(--accent)' }}>
                        {draft.canvasState?.length || 0} sản phẩm
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ width: '100%', height: '1px', background: 'var(--border-color)' }}></div>
            </div>
          )}

          <h3 style={{ fontSize: '18px', marginBottom: '16px', color: 'var(--text-primary)' }}>Thiết kế gần đây</h3>
          <div className="recent-designs-grid">
            {RECENT_DESIGNS.map(design => (
              <div key={design.id} className="recent-design-card">
                <div className="recent-img-wrapper">
                  <img src={design.image} alt={design.name} loading="lazy" />
                  <div className="recent-overlay">
                    <Link href={`/thiet-ke/room-planner?load=${design.id}`} className="recent-action-btn">
                      Tiếp tục thiết kế
                    </Link>
                  </div>
                </div>
                <div className="recent-info">
                  <h3 className="recent-name">{design.name}</h3>
                  <span className="recent-date">Cập nhật: {design.date}</span>
                </div>
              </div>
            ))}
            
            <Link href="/thiet-ke/room-planner" className="recent-design-card new-design-card">
              <div className="new-design-content">
                <div className="new-design-icon">+</div>
                <h3>Tạo bản thảo mới</h3>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* 4. Mẫu thiết kế nổi bật (Templates) */}
      <section className="design-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Không gian được yêu thích</h2>
            <p className="section-desc">Khám phá các thiết kế mẫu từ chuyên gia DCor và bắt đầu từ chúng.</p>
          </div>
          
          <div className="templates-grid">
            {TEMPLATES.map(tpl => (
              <div key={tpl.id} className="template-card">
                <div className="template-img-wrapper">
                  <img src={tpl.image} alt={tpl.name} loading="lazy" />
                  <div className="template-badge">{tpl.category}</div>
                  <div className="template-overlay">
                    <Link href={`/thiet-ke/room-planner?template=${tpl.id}`} className="template-action-btn">
                      Sử dụng mẫu này
                    </Link>
                  </div>
                </div>
                <h3 className="template-name">{tpl.name}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Công cụ nổi bật */}
      <section className="design-section bg-alt tools-section">
        <div className="container">
          <div className="section-header text-center">
            <h2 className="section-title">Hệ sinh thái Công cụ</h2>
            <p className="section-desc">Trải nghiệm mua sắm nội thất hoàn toàn mới với các công cụ tương tác.</p>
          </div>
          
          <div className="tools-grid">
            <div className="tool-card">
              <div className="tool-icon"><Columns size={32} /></div>
              <h3>Bố trí phòng 2D/3D</h3>
              <p>Trực quan hóa không gian và sắp xếp nội thất theo kích thước thực tế.</p>
            </div>
            <div className="tool-card">
              <div className="tool-icon"><Box size={32} /></div>
              <h3>AR - Không gian thực</h3>
              <p>Sử dụng camera điện thoại để xem nội thất ngay trong phòng của bạn.</p>
            </div>
            <div className="tool-card">
              <div className="tool-icon"><PenTool size={32} /></div>
              <h3>Tùy chỉnh vật liệu</h3>
              <p>Đổi màu sắc, chất liệu vải, da trên các mẫu Sofa cao cấp theo ý muốn.</p>
            </div>
          </div>
        </div>
      </section>


    </div>
  );
}
