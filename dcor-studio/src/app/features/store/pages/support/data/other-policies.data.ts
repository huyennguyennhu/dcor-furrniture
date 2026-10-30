import { OtherPolicyLink } from '../models/support.model';

export const ALL_SUPPORT_LINKS: OtherPolicyLink[] = [
  {
    label: 'Hướng dẫn mua hàng',
    description: 'Chi tiết các bước tìm kiếm, đặt mua nội thất và theo dõi đơn hàng',
    href: '/huong-dan-mua-hang',
    iconName: 'ShoppingBag',
    badge: 'Cẩm nang'
  },
  {
    label: 'Chính sách bảo hành',
    description: 'Quy định bảo hành dài hạn 12 - 36 tháng và quy trình tiếp nhận kỹ thuật',
    href: '/chinh-sach/bao-hanh',
    iconName: 'ShieldCheck',
    badge: 'Tiêu chuẩn'
  },
  {
    label: 'Chính sách đổi trả',
    description: 'Quy trình đổi mới và hoàn tiền trong thời gian quy định minh bạch',
    href: '/chinh-sach/doi-tra',
    iconName: 'RefreshCw',
    badge: 'Minh bạch'
  },
  {
    label: 'Chính sách vận chuyển',
    description: 'Phạm vi giao hàng toàn quốc, biểu phí và dịch vụ lắp ráp tận nhà',
    href: '/chinh-sach/van-chuyen',
    iconName: 'Truck',
    badge: 'Tận tâm'
  },
  {
    label: 'Chính sách thanh toán',
    description: 'Đa dạng hình thức COD, QR, thẻ và chính sách bảo mật giao dịch',
    href: '/chinh-sach/thanh-toan',
    iconName: 'CreditCard',
    badge: 'An toàn'
  },
  {
    label: 'Câu hỏi thường gặp',
    description: 'Giải đáp nhanh hơn 20 thắc mắc phổ biến về sản phẩm và dịch vụ',
    href: '/faq',
    iconName: 'Info',
    badge: 'Hỗ trợ 24/7'
  },
  {
    label: 'Về DCor Furniture',
    description: 'Câu chuyện thương hiệu, giá trị cốt lõi và hệ thống xưởng chế tác',
    href: '/about',
    iconName: 'House',
    badge: 'Thương hiệu'
  }
];

export function getOtherPolicies(currentHref: string): OtherPolicyLink[] {
  return ALL_SUPPORT_LINKS.filter(link => link.href !== currentHref);
}

