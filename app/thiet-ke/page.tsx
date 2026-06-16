'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, PenTool, Columns, Box } from 'lucide-react';

const ROOM_TYPES = [
  { id: 'living', name: 'Phòng khách', image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80' },
  { id: 'bedroom', name: 'Phòng ngủ', image: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=800&q=80' },
  { id: 'dining', name: 'Phòng ăn', image: 'https://images.unsplash.com/photo-1617806118233-18e1c0945594?auto=format&fit=crop&w=800&q=80' },
  { id: 'office', name: 'Văn phòng', image: 'https://images.unsplash.com/photo-1618219908412-a29a1bb7b86e?auto=format&fit=crop&w=800&q=80' }
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
  return (
    <div className="design-hub-page">
      {/* 1. Hero Section */}
      <section className="design-hero">
        <div className="container">
          <div className="design-hero-content">
            <h1 className="design-hero-title">Sẵn sàng bắt đầu?</h1>
            <p className="design-hero-subtitle">Khám phá ứng dụng Room Planner thông minh của D'Cor, nơi mọi ý tưởng đều có thể biến thành hiện thực và mua sắm ngay lập tức.</p>
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
            <p className="section-desc">Khám phá các thiết kế mẫu từ chuyên gia D'Cor và bắt đầu từ chúng.</p>
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
