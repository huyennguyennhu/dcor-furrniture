import { IconComponent } from '../../../../shared/components/icon/icon';
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
  image: string;
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
      title: 'Về DCor',
      links: [
        { label: 'Giới thiệu về DCor', href: '/about' },
        { label: 'Danh sách sản phẩm', href: '/explore' },
        { label: 'Đặt lịch tư vấn Showroom', href: '/account/appointments' },
        { label: 'Thiết kế không gian', href: '/custom-design' },
        { label: 'Cộng đồng', href: '/community' },
        { label: 'Blog', href: '/blog' },
      ],
    },
    {
      id: 'support',
      title: 'Hỗ trợ',
      links: [
        { label: 'Hướng dẫn đặt hàng', href: '/huong-dan-mua-hang' },
        { label: 'Câu hỏi thường gặp', href: '/faq' },
      ],
    },
    {
      id: 'policies',
      title: 'Chính sách',
      links: [
        { label: 'Chính sách bảo hành & đổi trả', href: '/chinh-sach/doi-tra' },
        { label: 'Chính sách bảo hành', href: '/chinh-sach/bao-hanh' },
        { label: 'Chính sách thanh toán', href: '/chinh-sach/thanh-toan' },
        { label: 'Chính sách vận chuyển', href: '/chinh-sach/van-chuyen' },
      ],
    },
  ];

  CONTACT_LINKS: FooterLink[] = [
    { label: '669 QL1A, TP. Hồ Chí Minh', href: '#' },
    { label: '1900 1234', href: 'tel:19001234' },
    { label: 'dcorfurniture406@gmail.com', href: 'mailto:dcorfurniture406@gmail.com' },
    { label: '8:00 – 22:00, Thứ 2 – Chủ nhật', href: '#' },
  ];
  
  isContactColOpen = false;

  SOCIAL_LINKS: SocialLink[] = [
    {
      label: 'Facebook',
      href: 'https://www.facebook.com/profile.php?id=61587272468575&locale=vi_VN',
      image: '/assets/img/facebook.png',
    },
    {
      label: 'Instagram',
      href: 'https://www.instagram.com/dcor_furniture/',
      image: '/assets/img/insta.png',
    },
    {
      label: 'TikTok',
      href: '#',
      image: '/assets/img/tiktok.png',
    },
  ];

  toggleAccordion(col: FooterCol) {
    col.isOpen = !col.isOpen;
  }

  toggleContactAccordion() {
    this.isContactColOpen = !this.isContactColOpen;
  }
}
