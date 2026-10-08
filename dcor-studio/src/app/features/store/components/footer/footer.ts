import { IconComponent, IconName } from '../../../../shared/components/icon/icon';
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

interface FooterLink {
  label: string;
  href: string;
}

interface FooterCol {
  id: string;
  title: string;
  links: FooterLink[];
  isOpen?: boolean; // For mobile accordion
}

interface SocialLink {
  label: string;
  href: string;
  icon: IconName;
}

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [IconComponent, CommonModule, RouterModule],
  templateUrl: './footer.html',
  styleUrls: ['./footer.css']
})
export class Footer {
  FOOTER_COLS: FooterCol[] = [
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

  CONTACT_LINKS: FooterLink[] = [
    { label: '123 Nguyễn Văn A, TP. HCM', href: '#' },
    { label: 'Hotline: 1900 xxxx', href: 'tel:1900xxxx' },
    { label: 'support@dcor.vn', href: 'mailto:support@dcor.vn' },
    { label: '08:00 – 22:00, Thứ 2 – Chủ nhật', href: '#' },
  ];
  
  isContactColOpen = false;

  SOCIAL_LINKS: SocialLink[] = [
    {
      label: 'Facebook',
      href: 'https://www.facebook.com/profile.php?id=61587272468575',
      icon: 'Share2',
    },
    {
      label: 'Instagram',
      href: '#',
      icon: 'Share2',
    },
    {
      label: 'Pinterest',
      href: '#',
      icon: 'Share2',
    },
    {
      label: 'TikTok',
      href: '#',
      icon: 'Share2',
    },
    {
      label: 'YouTube',
      href: '#',
      icon: 'Share2',
    },
  ];

  toggleAccordion(col: FooterCol) {
    col.isOpen = !col.isOpen;
  }

  toggleContactAccordion() {
    this.isContactColOpen = !this.isContactColOpen;
  }
}
