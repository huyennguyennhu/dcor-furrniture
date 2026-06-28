import React from 'react';
import Link from 'next/link';

export default function AboutPage() {
  return (
    <div style={{ padding: '80px 0', minHeight: '80vh', backgroundColor: 'var(--bg-primary)' }}>
      <div className="container" style={{ maxWidth: '800px', textAlign: 'center' }}>
        
        <div style={{ marginBottom: '40px' }}>
          <span style={{ color: 'var(--accent)', fontSize: '13px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase' }}>Câu chuyện thương hiệu</span>
          <h1 style={{ fontSize: '38px', fontWeight: 800, marginTop: '8px', color: 'var(--text-primary)', fontFamily: 'var(--font-title)' }}>Về DCor Studio</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '15px', marginTop: '6px' }}>Thiết kế nội thất mang phong cách Scandinavian, kết hợp công năng và vẻ đẹp bền vững.</p>
        </div>

        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: '20px',
          padding: '40px',
          boxShadow: 'var(--card-shadow)',
          textAlign: 'left',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
          lineHeight: '1.8',
          fontSize: '15px',
          color: 'var(--text-secondary)'
        }}>
          <p>
            <strong>DCor Studio</strong> được thành lập từ niềm đam mê kiến tạo những không gian sống đậm chất nghệ thuật nhưng vẫn đảm bảo tính ứng dụng cao. Lấy cảm hứng từ triết lý thiết kế Bắc Âu (Scandinavian Design), chúng tôi chú trọng sự tối giản, tinh tế trong từng đường nét, tôn vinh vẻ đẹp nguyên bản của vật liệu tự nhiên và ánh sáng.
          </p>

          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px' }}>Triết lý Thiết kế</h3>
            <p>
              Đối với chúng tôi, một ngôi nhà đẹp không chỉ để ngắm nhìn, mà là để sống và tận hưởng. Mỗi sản phẩm sofa tùy biến chân và vải bọc, hay các hệ thống kệ tủ Bordeaux, Como đều được thiết kế tỉ mỉ để hòa hợp với thói quen sinh hoạt và bộc lộ phong cách cá nhân của gia chủ.
            </p>
          </div>

          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px' }}>Giải pháp Công nghệ tối ưu (0 VND Budget)</h3>
            <p>
              Website của DCor Studio được phát triển bởi UEL GIS Team trên nền tảng các dịch vụ Cloud thế hệ mới ở gói miễn phí (Free Tier) như Next.js App Router, Supabase Postgres DB, Cloudinary, Resend và Tawk.to. Đây là minh chứng cho việc ứng dụng công nghệ hiện đại tối ưu chi phí vận hành ở mức 0 VNĐ nhưng vẫn mang lại trải nghiệm khách hàng cao cấp, mượt mà và bảo mật.
            </p>
          </div>

          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '24px', marginTop: '10px', display: 'flex', gap: '15px', justifyContent: 'center' }}>
            <Link href="/" className="cta-btn" style={{ padding: '12px 30px', fontSize: '14px' }}>
              Khám phá bộ sưu tập
            </Link>
            <Link href="/contact" className="customize-btn" style={{ padding: '12px 30px', fontSize: '14px' }}>
              Liên hệ Showroom
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
