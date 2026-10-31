import { OtherPolicyLink } from '../models/support.model';

export const ALL_SUPPORT_LINKS: OtherPolicyLink[] = [
  {
    label: 'Hướng dẫn mua hàng',
    description: 'Chi tiết các bước tìm kiếm, chọn biến thể, đặt mua và theo dõi đơn hàng',
    href: '/huong-dan-mua-hang',
    iconName: 'ShoppingBag',
    badge: 'Cẩm nang'
  },
  {
    label: 'Chính sách bảo hành',
    description: 'Mã bảo hành điện tử tự động, thời hạn theo từng sản phẩm và theo dõi lịch sử bảo trì',
    href: '/chinh-sach/bao-hanh',
    iconName: 'ShieldCheck',
    badge: 'Chính hãng'
  },
  {
    label: 'Chính sách đổi trả',
    description: 'Quy trình đổi trả tối đa 7 ngày, thẩm định trực tuyến hoặc giám định tại nhà',
    href: '/chinh-sach/doi-tra',
    iconName: 'RefreshCw',
    badge: 'Minh bạch'
  },
  {
    label: 'Chính sách vận chuyển',
    description: 'Phí vận chuyển nội thành/liên tỉnh, thời gian giao dự kiến và dịch vụ lắp đặt tận nơi',
    href: '/chinh-sach/van-chuyen',
    iconName: 'Truck',
    badge: 'Tận tâm'
  },
  {
    label: 'Chính sách thanh toán',
    description: 'Thanh toán COD và VietQR động, quy định đặt cọc 30% cho đơn giá trị cao',
    href: '/chinh-sach/thanh-toan',
    iconName: 'CreditCard',
    badge: 'An toàn'
  },
  {
    label: 'Câu hỏi thường gặp',
    description: 'Giải đáp các thắc mắc phổ biến về sản phẩm, quy trình đơn hàng và hỗ trợ khách hàng',
    href: '/faq',
    iconName: 'Info',
    badge: 'Trợ giúp'
  },
  {
    label: 'Về DCor',
    description: 'Design Your Core - Nền tảng thương mại điện tử nội thất kết hợp tư vấn thiết kế theo yêu cầu',
    href: '/about',
    iconName: 'House',
    badge: 'Thương hiệu'
  }
];

export function getOtherPolicies(currentHref: string): OtherPolicyLink[] {
  return ALL_SUPPORT_LINKS.filter(link => link.href !== currentHref);
}
