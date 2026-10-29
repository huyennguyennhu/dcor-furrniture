import { ContentSection } from '../models/support.model';
import {
  HOTLINE,
  EMAIL,
  ADDRESS,
  WORKING_HOURS,
  DEPOSIT_PERCENT,
  AUTO_COMPLETE_DAYS,
  CODE_LOCK_THRESHOLD_FORMATTED
} from '../support-config';

export const SHOPPING_GUIDE_SECTIONS: ContentSection[] = [
  {
    id: 'tim-kiem-va-loc-san-pham',
    title: '1. Tìm kiếm và lọc sản phẩm nội thất phù hợp',
    paragraphs: [
      'Tại DCor, chúng tôi thiết kế công cụ tìm kiếm và bộ lọc trực quan giúp quý khách dễ dàng định vị món đồ nội thất phù hợp với mặt bằng kiến trúc và phong cách sống của gia đình mình.',
      'Quý khách có thể nhập từ khóa trực tiếp vào thanh tìm kiếm nổi bật ở đầu trang (ví dụ: "sofa góc chữ L", "bàn ăn gỗ sồi 6 ghế", "kệ tivi tối giản") hoặc duyệt nhanh qua cây danh mục phân tầng tại mục "Sản Phẩm".'
    ],
    listItems: [
      'Lọc theo phân loại không gian: Phòng khách, Phòng ăn, Phòng ngủ, Phòng làm việc, Đồ trang trí.',
      'Lọc theo chất liệu chủ đạo: Gỗ sồi tự nhiên Bắc Mỹ, Gỗ óc chó, Nệm mút D40 bọc nỉ/da cao cấp, Kim loại sơn tĩnh điện chống xước.',
      'Lọc theo khoảng giá ngân sách: Dễ dàng kéo chọn mức giá phù hợp với kế hoạch tài chính.',
      'Sắp xếp linh hoạt: Theo độ phổ biến, mới nhất, giá tăng dần hoặc giảm dần.'
    ],
    callout: {
      type: 'tip',
      title: 'Mẹo tìm nhanh',
      text: 'Mỗi sản phẩm đều hiển thị nhãn tình trạng kho "Còn hàng" hoặc "Đặt trước". Quý khách có thể xem nhanh kích thước cơ bản phủ bì (Dài x Rộng x Cao) ngay trên thẻ tóm tắt sản phẩm.'
    }
  },
  {
    id: 'chon-bien-the-va-so-luong',
    title: '2. Lựa chọn biến thể kích thước, màu sắc & số lượng',
    paragraphs: [
      'Đặc thù của đồ nội thất là tính vừa vặn với không gian thực tế. Trang chi tiết sản phẩm của DCor cung cấp đầy đủ các tùy chọn biến thể để quý khách cá nhân hóa trước khi đặt hàng:',
      'Trước khi thêm vào giỏ, hãy xem kỹ bản vẽ thông số kỹ thuật và hình ảnh chụp thực tế dưới các điều kiện ánh sáng tự nhiên.'
    ],
    listItems: [
      'Kích thước quy chuẩn: Lựa chọn kích thước phủ bì phù hợp với diện tích phòng (ví dụ: Sofa 2m2, 2m4 hoặc 2m8; Bàn ăn 4 ghế, 6 ghế hoặc 8 ghế).',
      'Màu sắc và chất liệu bọc: Chọn màu nệm vải nỉ nhung, da PU chống thấm hoặc màu vân gỗ (Tone màu gỗ sồi tự nhiên sáng hoặc Tone nâu trầm óc chó cổ điển).',
      'Điều chỉnh số lượng: Sử dụng nút tăng/giảm số lượng theo nhu cầu sử dụng thực tế của gia đình.'
    ],
    callout: {
      type: 'note',
      title: 'Lưu ý đo đạc cửa và thang máy',
      text: 'Với các sản phẩm nội thất kích thước lớn nguyên khối, quý khách vui lòng kiểm tra chiều rộng cửa ra vào, hành lang và kích thước cabin thang máy của tòa nhà để đảm bảo việc bốc xếp diễn ra thuận lợi.'
    }
  },
  {
    id: 'quan-ly-gio-hang',
    title: '3. Kiểm tra và quản lý giỏ hàng thông minh',
    paragraphs: [
      'Sau khi bấm "Thêm vào giỏ hàng", một ngăn trượt (Drawer Giỏ hàng) sẽ mở ra tức thì ở cạnh phải màn hình, cho phép quý khách xem nhanh danh mục sản phẩm đã chọn mà không làm gián đoạn trải nghiệm duyệt trang.',
      'Trong giỏ hàng, quý khách có thể:'
    ],
    listItems: [
      'Thay đổi số lượng hoặc xóa sản phẩm nếu thay đổi kế hoạch bài trí.',
      'Nhập mã giảm giá khuyến mãi (Voucher DCor) để nhận ưu đãi chiết khấu trực tiếp.',
      'Xem chi tiết bảng tạm tính bao gồm: Tiền hàng, Giảm giá khuyến mãi và ghi chú giao nhận.',
      'Bấm nút "Tiến hành thanh toán" để chuyển sang màn hình hoàn tất đơn hàng.'
    ]
  },
  {
    id: 'quy-trinh-thanh-toan',
    title: '4. Thanh toán đơn hàng và thông tin xuất hóa đơn',
    paragraphs: [
      'Màn hình Thanh toán (Checkout) của DCor được tối ưu hóa theo quy trình 1 trang (One-page Checkout) liền mạch và rõ ràng:',
      'Các trường thông tin bắt buộc gồm có Họ tên người nhận, Số điện thoại và Địa chỉ giao hàng chi tiết (Tỉnh/Thành phố, Quận/Huyện, Phường/Xã, Số nhà và tên đường).'
    ],
    steps: [
      {
        number: 1,
        title: 'Xác nhận thông tin giao nhận',
        description: 'Điền chính xác địa chỉ và số điện thoại người nhận hàng để nhân viên giao vận liên hệ hẹn giờ giao chính xác.'
      },
      {
        number: 2,
        title: 'Áp dụng mã ưu đãi',
        description: 'Kiểm tra và kích hoạt voucher giảm giá hoặc mã khách hàng thân thiết nếu có.'
      },
      {
        number: 3,
        title: 'Lựa chọn phương thức thanh toán',
        description: 'Chọn giữa Thanh toán khi nhận hàng (COD), Quét mã QR chuyển khoản tự động, Thẻ ATM/Visa hoặc Ví điện tử.'
      },
      {
        number: 4,
        title: 'Yêu cầu xuất hóa đơn GTGT (VAT)',
        description: 'Tích chọn vào ô "Yêu cầu hóa đơn VAT" nếu cần xuất hóa đơn công ty và nhập Mã số thuế, Tên doanh nghiệp, Địa chỉ trụ sở.'
      }
    ]
  },
  {
    id: 'khach-vang-lai-otp',
    title: '5. Mua hàng nhanh cho khách vãng lai và xác thực OTP',
    paragraphs: [
      'DCor hiểu rằng sự nhanh chóng và thuận tiện là ưu tiên hàng đầu. Quý khách hoàn toàn có thể mua hàng mà không cần phải trải qua các bước đăng ký tài khoản rườm rà trước đó.',
      'Khi đặt hàng dưới tư cách khách vãng lai, hệ thống sẽ thực hiện cơ chế xác thực số điện thoại bằng mã OTP (One-Time Password):'
    ],
    listItems: [
      'Quý khách nhập số điện thoại nhận hàng tại màn hình thanh toán.',
      'Hệ thống DCor gửi ngay một mã OTP gồm 6 chữ số qua tin nhắn SMS tới số điện thoại vừa cung cấp.',
      'Quý khách nhập mã OTP vào ô xác thực để hoàn tất gửi đơn hàng an toàn.',
      'Cơ chế này giúp bảo vệ quyền lợi của khách hàng, ngăn chặn việc tạo đơn giả mạo và tự động lưu trữ lịch sử đơn hàng để liên kết vào tài khoản khi quý khách kích hoạt sau này.'
    ]
  },
  {
    id: 'theo-doi-don-hang',
    title: '6. Theo dõi tiến trình trong mục "Đơn hàng của tôi"',
    paragraphs: [
      'Sau khi đặt hàng thành công, quý khách có thể chủ động theo dõi toàn bộ hành trình của kiện hàng tại trang "Tài khoản > Đơn hàng của tôi".',
      'Đơn hàng sẽ trải qua các mốc trạng thái cụ thể và minh bạch:'
    ],
    listItems: [
      'Chờ xác nhận: Đơn hàng mới khởi tạo, tổng đài viên DCor đang kiểm tra tính khả dụng của sản phẩm.',
      'Đã xác nhận & Đang chuẩn bị: Bộ phận kho tiến hành kiểm định chất lượng (QC), đóng bọc màng bảo vệ 5 lớp và xuất phiếu xuất kho.',
      'Đang giao hàng: Kiện hàng đã được giao cho tài xế DCor hoặc đối tác vận chuyển chuyên trách. Quý khách có thể xem thông tin tài xế và lộ trình di chuyển.',
      'Đã giao hàng: Sản phẩm đã được bàn giao và lắp đặt hoàn tất tại địa chỉ của quý khách.',
      `Hoàn tất: Đơn hàng hoàn tất chính thức (khi quý khách bấm "Đã nhận hàng" hoặc sau ${AUTO_COMPLETE_DAYS} ngày kể từ thời điểm giao hàng thành công).`
    ]
  },
  {
    id: 'dat-lich-tu-van',
    title: '7. Đặt lịch tư vấn Showroom và trải nghiệm thực tế',
    paragraphs: [
      `Nếu quý khách muốn trực tiếp cảm nhận chất lượng gỗ tự nhiên, độ đàn hồi của nệm mút hay cần chuyên viên phân tích phương án bài trí cho căn hộ của mình, hãy sử dụng tính năng "Đặt lịch tư vấn Showroom":`,
      `Showroom DCor tọa lạc tại địa chỉ ${ADDRESS}, mở cửa phục vụ từ ${WORKING_HOURS}.`
    ],
    listItems: [
      'Truy cập mục "Đặt lịch tư vấn" trên thanh điều hướng hoặc gọi Hotline ' + HOTLINE + '.',
      'Chọn ngày và khung giờ hẹn mong muốn đến tham quan.',
      'Ghi chú sơ lược về loại căn hộ (chung cư, nhà phố, biệt thự) và nhu cầu nội thất chính.',
      'Kiến trúc sư của DCor sẽ chuẩn bị sẵn các mẫu vật liệu, catalogue mẫu và bản vẽ gợi ý để tiếp đón quý khách chu đáo nhất.'
    ]
  },
  {
    id: 'yeu-cau-custom',
    title: '8. Quy trình đặt thiết kế đồ gỗ theo yêu cầu (Custom Furniture)',
    paragraphs: [
      'Đối với những không gian đặc thù đòi hỏi kích thước phi tiêu chuẩn hoặc gia chủ có phong cách bài trí độc bản, dịch vụ Custom Furniture của DCor mang đến giải pháp toàn diện theo quy trình 5 bước nghiêm ngặt:'
    ],
    steps: [
      {
        number: 1,
        title: 'Gửi yêu cầu thiết kế ban đầu',
        description: 'Quý khách truy cập trang "/custom-design", tải lên hình ảnh ý tưởng, bản vẽ phác thảo mặt bằng hoặc kích thước mong muốn.'
      },
      {
        number: 2,
        title: 'Khảo sát, báo giá và ký hợp đồng',
        description: 'Kiến trúc sư DCor liên hệ tư vấn vật liệu, dựng phối cảnh 3D chi tiết và gửi bảng dự toán kinh phí kèm bản hợp đồng kinh tế rõ ràng.'
      },
      {
        number: 3,
        title: `Đặt cọc sản xuất (${DEPOSIT_PERCENT}%)`,
        description: `Khách hàng tiến hành đặt cọc ${DEPOSIT_PERCENT}% giá trị hợp đồng để xưởng DCor tiến hành nhập khẩu vật tư gỗ đạt chuẩn và đưa vào quy trình gia công.`
      },
      {
        number: 4,
        title: 'Chế tác thủ công và cập nhật tiến độ',
        description: 'Đội ngũ thợ mộc lành nghề chế tác từng chi tiết mộng gỗ, hoàn thiện bề mặt sơn lót và sơn phủ cao cấp. DCor cập nhật hình ảnh xưởng định kỳ cho khách hàng.'
      },
      {
        number: 5,
        title: 'Giao hàng, nghiệm thu và tất toán',
        description: 'Đội ngũ kỹ thuật vận chuyển tận nhà, lắp đặt chính xác từng milimet. Quý khách ký biên bản nghiệm thu trước khi thanh toán phần còn lại.'
      }
    ],
    callout: {
      type: 'info',
      title: 'Hợp đồng bảo đảm chất lượng',
      text: 'Mọi sản phẩm Custom đều có cam kết vật liệu chuẩn 100% theo mẫu duyệt, bảo hành kết cấu khung tương đương sản phẩm tiêu chuẩn niêm yết.'
    }
  },
  {
    id: 'thiet-ke-khong-gian-cong-dong',
    title: '9. Thiết kế không gian 3D và chia sẻ cùng Cộng đồng DCor',
    paragraphs: [
      'DCor không chỉ là nơi mua sắm nội thất, mà còn là một không gian cảm hứng kết nối những người yêu thích tổ ấm tinh tế:',
      'Thông qua công cụ phối cảnh không gian và chuyên mục "Cộng đồng" (/community), quý khách có thể thỏa sức sáng tạo:'
    ],
    listItems: [
      'Tự do sắp xếp thử các mẫu nội thất DCor vào mô hình căn hộ để hình dung độ tương quan màu sắc trước khi quyết định mua.',
      'Đăng tải hình ảnh góc không gian sống thực tế đã hoàn thiện của nhà mình để truyền cảm hứng cho cộng đồng.',
      'Khám phá các ý tưởng decor độc đáo từ các thành viên khác và bấm xem ngay danh sách sản phẩm xuất hiện trong bức ảnh.'
    ]
  }
];

