import { ContentSection } from '../models/support.model';
import {
  HOTLINE,
  EMAIL,
  ADDRESS,
  WORKING_HOURS,
  MAX_COMPARE_PRODUCTS
} from '../support-config';

export const ABOUT_SECTIONS: ContentSection[] = [
  {
    id: 'gioi-thieu',
    title: '1. Giới thiệu DCor',
    paragraphs: [
      'DCor là nền tảng thương mại điện tử chuyên kinh doanh sản phẩm nội thất kết hợp dịch vụ tư vấn và kết nối thiết kế theo yêu cầu, hướng đến nhóm khách hàng trẻ tại các khu vực đô thị.',
      'Chúng tôi kết nối trải nghiệm mua sắm trực tuyến hiện đại với các giải pháp tư vấn chuyên sâu, giúp người tiêu dùng trẻ dễ dàng tiếp cận những sản phẩm nội thất phù hợp với phong cách sống đương đại.'
    ]
  },
  {
    id: 'y-nghia-ten-goi',
    title: '2. Ý nghĩa tên gọi & Thông điệp thương hiệu',
    paragraphs: [
      'Tên gọi DCor là sự kết hợp giữa "Design" và "Core", đồng thời tạo ngữ âm đồng điệu với thuật ngữ "Decor". Tên gọi này truyền tải trọn vẹn triết lý cốt lõi: giá trị thẩm mỹ của nội thất phải xuất phát từ công năng cốt lõi bên trong, thay vì chỉ dừng lại ở hình thức trang trí bên ngoài.',
      'Thông điệp thương hiệu: "Design Your Core - Kiến tạo không gian, nâng tầm bản sắc", hướng đến mục tiêu hỗ trợ khách hàng cá nhân hóa không gian sống theo phong cách riêng của chính mình.'
    ],
    callout: {
      type: 'tip',
      title: 'Thông điệp thương hiệu',
      text: 'Design Your Core - Kiến tạo không gian, nâng tầm bản sắc'
    }
  },
  {
    id: 'dinh-huong-va-su-menh',
    title: '3. Định hướng phát triển & Sứ mệnh',
    paragraphs: [
      'Định hướng: Trở thành nền tảng thương mại điện tử nội thất ứng dụng công nghệ hàng đầu tại Việt Nam, tiên phong mang lại trải nghiệm mua sắm số hiện đại cho thế hệ người tiêu dùng trẻ.',
      'Sứ mệnh: Tái định hình quy trình mua sắm trực tuyến bằng các giải pháp trực quan hóa không gian và gợi ý sản phẩm cá nhân hóa, giúp khách hàng ra quyết định chính xác, phù hợp diện tích thực tế và ngân sách đầu tư.'
    ]
  },
  {
    id: 'ba-tru-cot',
    title: '4. Ba trụ cột giá trị',
    paragraphs: [
      'Mọi hoạt động vận hành và trải nghiệm dịch vụ tại DCor đều được xây dựng vững chắc dựa trên ba trụ cột cốt lõi:'
    ],
    steps: [
      {
        number: 1,
        title: 'Chất lượng',
        description: 'Đồng nhất tuyệt đối giữa sản phẩm thực tế và thông số kỹ thuật, hình ảnh hiển thị trên nền tảng thương mại điện tử.'
      },
      {
        number: 2,
        title: 'Minh bạch',
        description: 'Công khai chi phí, nguồn gốc xuất xứ, biểu phí vận chuyển nội thành/liên tỉnh cùng các chính sách bảo hành điện tử và đổi trả rõ ràng.'
      },
      {
        number: 3,
        title: 'Tận tâm',
        description: 'Đồng hành, hỗ trợ liên tục từ khâu tìm kiếm, tư vấn giải pháp không gian đến khi giao hàng, lắp đặt và hoàn thiện sản phẩm.'
      }
    ]
  },
  {
    id: 'tien-ich-nen-tang',
    title: '5. Tiện ích nổi bật trên nền tảng DCor',
    paragraphs: [
      'Khách hàng trải nghiệm mua sắm trên nền tảng DCor được hỗ trợ đồng bộ bởi các công cụ số hóa hiện đại:'
    ],
    listItems: [
      `Danh mục nội thất trực tuyến (/explore): Tìm kiếm nhanh, lọc theo danh mục, khoảng giá, màu sắc, chất liệu và tính năng so sánh tối đa ${MAX_COMPARE_PRODUCTS} sản phẩm trong cùng danh mục.`,
      'Công cụ Thiết kế không gian 3D (/custom-design): Chọn bản mẫu hoặc tải ảnh thật mặt bằng, kéo thả sản phẩm nội thất DCor và xuất ảnh thiết kế PNG về máy.',
      'Chuyên trang Cộng đồng (/community): Đăng tải hình ảnh góc nhà thực tế hoặc bản thiết kế 3D, gắn thẻ sản phẩm DCor, chia sẻ cảm hứng và tương tác cùng các thành viên.',
      'Dịch vụ đặt làm thiết kế riêng (Custom Furniture): Gửi yêu cầu Custom, nhận báo giá chi tiết trong vòng 24 giờ, xem dự thảo hợp đồng điện tử và theo dõi tiến độ sản xuất tại mục "Quản lý yêu cầu tùy chỉnh" (/account/custom-requests).'
    ]
  },
  {
    id: 'thong-tin-lien-he-showroom',
    title: '6. Thông tin liên hệ & Showroom',
    paragraphs: [
      'Khách hàng có thể trải nghiệm sản phẩm thực tế và nhận tư vấn trực tiếp tại không gian trưng bày của DCor:',
      'Để được chuyên viên tư vấn tiếp đón chu đáo và sắp xếp khung giờ phù hợp, quý khách có thể sử dụng chức năng Đặt lịch tư vấn trực tuyến trên nền tảng.'
    ],
    callout: {
      type: 'info',
      title: 'Thông tin liên hệ chính thức',
      text: `Địa chỉ Showroom: ${ADDRESS}\nHotline hỗ trợ: ${HOTLINE}\nEmail tiếp nhận: ${EMAIL}\nThời gian mở cửa đón tiếp: ${WORKING_HOURS}`
    }
  }
];
