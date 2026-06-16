'use client';
import Link from 'next/link';
import { useState } from 'react';

/* ── Data ──────────────────────────────────────────── */
const FOOTER_COLS = [
  {
    id: 'explore',
    title: 'Khám phá',
    links: [
      { label: 'Sản phẩm', href: '/products' },
      { label: 'Không gian', href: '/kham-pha' },
      { label: 'Thiết kế phòng', href: '/room-planner' },
      { label: 'So sánh sản phẩm', href: '/compare' },
      { label: 'Cộng đồng', href: '/community' },
      { label: 'Cảm hứng', href: '/kham-pha' },
    ],
  },
  {
    id: 'support',
    title: 'Hỗ trợ khách hàng',
    links: [
      { label: 'Liên hệ', href: '/contact' },
      { label: 'Theo dõi đơn hàng', href: '/account/orders' },
      { label: 'Chính sách giao hàng', href: '/shipping-policy' },
      { label: 'Chính sách đổi trả', href: '/return-policy' },
      { label: 'Điều khoản sử dụng', href: '/terms' },
      { label: 'Câu hỏi thường gặp', href: '/faq' },
    ],
  },
  {
    id: 'account',
    title: 'Tài khoản',
    links: [
      { label: 'Hồ sơ cá nhân', href: '/account/profile' },
      { label: 'Đơn hàng của tôi', href: '/account/orders' },
      { label: 'Danh sách yêu thích', href: '/account/wishlist' },
      { label: 'Thiết kế của tôi', href: '/account/designs' },
      { label: 'Bài đăng của tôi', href: '/account/posts' },
      { label: 'Đánh giá của tôi', href: '/account/reviews' },
    ],
  },
];

const SOCIAL_LINKS = [
  {
    label: 'Facebook',
    href: 'https://www.facebook.com/profile.php?id=61587272468575',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
      </svg>
    ),
  },
  {
    label: 'Instagram',
    href: '#',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
      </svg>
    ),
  },
  {
    label: 'Pinterest',
    href: '#',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z" />
      </svg>
    ),
  },
  {
    label: 'TikTok',
    href: '#',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.89a8.15 8.15 0 0 0 4.78 1.52V7a4.85 4.85 0 0 1-1.01-.31z" />
      </svg>
    ),
  },
  {
    label: 'YouTube',
    href: '#',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.4a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z" />
        <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="white" />
      </svg>
    ),
  },
];

/* ── Pre-footer CTA ─────────────────────────────────── */
function PreFooterCTA() {
  return (
    <section className="pre-footer-cta">
      <div className="container">
        <div className="pre-footer-inner">
          <div className="pre-footer-text">
            <span className="pre-footer-eyebrow">Sẵn sàng chưa?</span>
            <h2 className="pre-footer-title">Bắt đầu thiết kế<br />không gian của bạn</h2>
            <p className="pre-footer-desc">
              Khám phá hàng trăm mẫu nội thất cao cấp hoặc dùng Room Planner 3D để hình dung căn phòng mơ ước.
            </p>
          </div>
          <div className="pre-footer-actions">
            <Link href="/products" className="btn-cta-primary">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
              Khám phá sản phẩm
            </Link>
            <Link href="/thiet-ke/room-planner" className="btn-cta-secondary">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
              Thiết kế phòng
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Accordion item (mobile) ───────────────────────── */
function AccordionCol({ col }: { col: typeof FOOTER_COLS[0] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`footer-accordion-item ${open ? 'open' : ''}`}>
      <button className="footer-accordion-trigger" onClick={() => setOpen(v => !v)}>
        <span>{col.title}</span>
        <svg className="footer-accordion-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      <div className="footer-accordion-body">
        <ul>
          {col.links.map(l => (
            <li key={l.label}><Link href={l.href}>{l.label}</Link></li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* ── Main Footer ────────────────────────────────────── */
export default function Footer() {
  return (
    <>
      <PreFooterCTA />

      <footer className="site-footer">
        {/* Top: brand + columns */}
        <div className="footer-top">
          <div className="container">
            <div className="footer-grid">

              {/* Brand column */}
              <div className="footer-brand">
                <Link href="/" className="footer-logo">
                  <div className="footer-logo-circle">
                    <span>DCOR.</span>
                  </div>
                  <span className="footer-logo-name">D'Cor</span>
                </Link>
                <p className="footer-tagline">
                  Nội thất hiện đại kết hợp công nghệ, giúp khách hàng dễ dàng lựa chọn, tùy chỉnh và thiết kế không gian sống theo phong cách riêng.
                </p>
              </div>

              {/* Nav columns — desktop */}
              <div className="footer-nav-cols footer-nav-cols--desktop">
                {FOOTER_COLS.map(col => (
                  <div key={col.id} className="footer-col">
                    <h4 className="footer-col-title">{col.title}</h4>
                    <ul className="footer-col-links">
                      {col.links.map(l => (
                        <li key={l.label}><Link href={l.href}>{l.label}</Link></li>
                      ))}
                    </ul>
                  </div>
                ))}

                {/* Liên hệ column — desktop */}
                <div className="footer-col">
                  <h4 className="footer-col-title">Liên hệ</h4>
                  <div className="footer-contact footer-contact--col">
                    <div className="footer-contact-item">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                      <span>123 Nguyễn Văn A, TP. Hồ Chí Minh</span>
                    </div>
                    <div className="footer-contact-item">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.42 2 2 0 0 1 3.6 1.25h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 9a16 16 0 0 0 6 6l1.06-.94a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                      <span>1900 xxxx</span>
                    </div>
                    <div className="footer-contact-item">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                      <a href="mailto:support@dcor.vn">support@dcor.vn</a>
                    </div>
                    <div className="footer-contact-item footer-hours">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                      <span>08:00 – 22:00<br/>(Thứ 2 – Chủ nhật)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Nav columns — mobile accordion */}
              <div className="footer-nav-cols--mobile">
                {FOOTER_COLS.map(col => <AccordionCol key={col.id} col={col} />)}
                <AccordionCol
                  col={{
                    id: 'contact',
                    title: 'Liên hệ',
                    links: [
                      { label: '123 Nguyễn Văn A, TP. HCM', href: '#' },
                      { label: 'Hotline: 1900 xxxx', href: 'tel:1900xxxx' },
                      { label: 'support@dcor.vn', href: 'mailto:support@dcor.vn' },
                      { label: '08:00 – 22:00, Thứ 2 – Chủ nhật', href: '#' },
                    ],
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Social + copyright */}
        <div className="footer-bottom">
          <div className="container">
            <div className="footer-bottom-inner">
              <div className="footer-social">
                <span className="footer-social-label">Kết nối cùng D'Cor</span>
                <div className="footer-social-icons">
                  {SOCIAL_LINKS.map(s => (
                    <a
                      key={s.label}
                      href={s.href}
                      className="footer-social-icon"
                      aria-label={s.label}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {s.icon}
                    </a>
                  ))}
                </div>
              </div>
              <p className="footer-copy">© 2026 D'Cor. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
