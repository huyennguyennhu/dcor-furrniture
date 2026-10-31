import { ContentSection } from '../models/support.model';
import {
  HOTLINE,
  EMAIL,
  ADDRESS,
  WORKING_HOURS,
  HIGH_VALUE_ORDER_THRESHOLD,
  HIGH_VALUE_DEPOSIT_PERCENT,
  RETURN_INSPECTION_THRESHOLD,
  ONLINE_RETURN_REVIEW_HOURS,
  MAX_RETURN_DAYS,
  MAX_WARRANTY_MEDIA_SIZE_MB,
  CUSTOM_QUOTE_RESPONSE_HOURS,
  CUSTOM_DEPOSIT_RANGE,
  MAX_COMPARE_PRODUCTS,
  formatVND
} from '../support-config';

export const SHOPPING_GUIDE_SECTIONS: ContentSection[] = [
  {
    id: 'tim-kiem-va-loc-san-pham',
    title: '1. Tìm kiếm, lọc và so sánh sản phẩm nội thất',
    paragraphs: [
      'Tại DCor, quý khách có thể dễ dàng khám phá hàng loạt sản phẩm nội thất tinh tế thông qua trang danh mục Sản phẩm (/explore).',
      'Thanh tìm kiếm ở đầu trang cho phép tìm kiếm nhanh theo tên sản phẩm hoặc từ khóa mong muốn.'
    ],
    listItems: [
      'Lọc theo Danh mục sản phẩm: Sofa, Bàn, Ghế, Tủ kệ, Giường ngủ và Đồ trang trí.',
      'Lọc theo Khoảng giá: Kéo chọn khoảng ngân sách đầu tư phù hợp.',
      'Lọc theo Không gian: Phòng khách, Phòng ăn, Phòng ngủ, Phòng làm việc...',
      'Lọc theo Phong cách thiết kế: Hiện đại, Tối giản, Bắc Âu / Scandinavian, Cổ điển...',
      'Lọc theo Đánh giá: Chọn mức xếp hạng sao tối thiểu theo phản hồi từ người dùng thực tế.',
      'Lọc theo Màu sắc và Chất liệu: Lọc nhanh các mẫu phù hợp với bảng màu không gian nhà bạn.',
      'Sắp xếp linh hoạt: Theo Bán chạy nhất (featured), Mới nhất (newest), Giá: Thấp đến Cao (price-asc), Giá: Cao đến Thấp (price-desc) hoặc Đang khuyến mãi (sale).'
    ],
    callout: {
      type: 'tip',
      title: 'Tính năng Xem nhanh và So sánh sản phẩm',
      text: `Quý khách có thể bấm nút "Xem nhanh" để xem ảnh, thông số kỹ thuật và chọn biến thể ngay tại trang danh mục. Đặc biệt, tính năng So sánh cho phép quý khách chọn tối đa ${MAX_COMPARE_PRODUCTS} sản phẩm trong cùng một danh mục để đối chiếu trực tiếp về kiểu dáng, kích thước và mức giá.`
    }
  },
  {
    id: 'chon-bien-the-va-gio-hang',
    title: '2. Lựa chọn biến thể và quản lý giỏ hàng',
    paragraphs: [
      'Tại trang chi tiết sản phẩm (/products/:id), quý khách dễ dàng lựa chọn biến thể phù hợp với không gian thực tế:',
      'Mỗi biến thể có hình ảnh, giá bán và số lượng tồn kho riêng biệt. Nếu biến thể tạm thời hết hàng, hệ thống sẽ tự động thông báo để quý khách chọn lựa chọn khác.'
    ],
    listItems: [
      'Chọn biến thể màu sắc, kích thước và chất liệu mong muốn.',
      'Điều chỉnh số lượng trong giới hạn tồn kho khả dụng.',
      'Xem thông số kỹ thuật, mô tả chi tiết và thời hạn bảo hành điện tử niêm yết theo từng sản phẩm.',
      'Bấm "Thêm vào giỏ hàng" để lưu sản phẩm vào ngăn trượt giỏ hàng (Cart Drawer) ở cạnh phải màn hình; tại đây quý khách có thể chọn món thanh toán, chỉnh số lượng hoặc xóa sản phẩm.'
    ]
  },
  {
    id: 'quy-trinh-dat-hang-va-thanh-toan',
    title: '3. Quy trình đặt hàng & Thanh toán (Checkout)',
    paragraphs: [
      'Trang Thanh toán (/checkout) của DCor được thiết kế tinh giản, an toàn và hỗ trợ đầy đủ các tiện ích đặt hàng hiện đại theo 5 bước:'
    ],
    steps: [
      {
        number: 1,
        title: 'Nhập thông tin người nhận & Địa chỉ giao hàng',
        description: 'Nhập họ tên, số điện thoại và email. Chọn địa chỉ từ sổ địa chỉ đã lưu hoặc nhập mới gồm Tỉnh/Thành, Quận/Huyện, Phường/Xã từ dữ liệu hành chính chuẩn. Nếu số điện thoại chưa được xác minh, hệ thống sẽ kích hoạt bước xác thực mã OTP 6 số.'
      },
      {
        number: 2,
        title: 'Áp dụng mã giảm giá & Tùy chọn quà tặng',
        description: 'Nhập mã ưu đãi; hệ thống tự động kiểm tra điều kiện và báo rõ lý do nếu voucher không hợp lệ hoặc đơn hàng chưa đạt giá trị tối thiểu. Quý khách có thể tích chọn Tùy chọn quà tặng để nhập lời nhắn thiệp và ẩn giá trên phiếu giao hàng.'
      },
      {
        number: 3,
        title: 'Xem lại đơn hàng & Phí vận chuyển',
        description: 'Bảng xem lại đơn hàng hiển thị minh bạch tiền hàng, phí vận chuyển tính theo khu vực nội thành hoặc liên tỉnh, và số tiền giảm giá.'
      },
      {
        number: 4,
        title: 'Lựa chọn phương thức thanh toán',
        description: `Chọn 1 trong 2 hình thức: Thanh toán khi nhận hàng (COD) hoặc Chuyển khoản ngân hàng quét mã VietQR. Đơn hàng từ giá trị cao (trên ${formatVND(HIGH_VALUE_ORDER_THRESHOLD)}) sẽ tự động khóa COD và bắt buộc đặt cọc ${HIGH_VALUE_DEPOSIT_PERCENT}% bằng chuyển khoản; phần còn lại thanh toán khi nhận hàng.`
      },
      {
        number: 5,
        title: 'Yêu cầu hóa đơn VAT điện tử & Đặt hàng',
        description: 'Nếu có nhu cầu, tích chọn "Yêu cầu hóa đơn VAT điện tử" và nhập Tên doanh nghiệp, Mã số thuế, Địa chỉ công ty, Email nhận hóa đơn. Hệ thống có cơ chế chống bấm đúp bảo đảm không tạo trùng đơn. Nếu có sản phẩm hết hàng bất ngờ, hệ thống sẽ thông báo ngay để quý khách cập nhật giỏ hàng.'
      }
    ],
    callout: {
      type: 'note',
      title: 'Màn hình thành công & Khách vãng lai tạo nhanh tài khoản',
      text: 'Sau khi thanh toán hoàn tất, màn hình thông báo đặt hàng thành công sẽ hiển thị thời gian giao hàng dự kiến. Khách vãng lai có thể tạo nhanh tài khoản bằng cách nhập mật khẩu ngay trên màn hình này; hệ thống sẽ tự động liên kết đơn hàng vừa đặt vào tài khoản mới.'
    }
  },
  {
    id: 'quan-ly-va-tra-cuu-don-hang',
    title: '4. Quản lý đơn hàng, bộ lọc & Tra cứu khách vãng lai',
    paragraphs: [
      'Quý khách có thể theo dõi chặt chẽ tiến trình đơn hàng tại trang "Đơn hàng của tôi" (/account/orders):',
      'Hệ thống cung cấp thanh bộ lọc đa năng gồm 5 trạng thái: Tất cả, Đang xử lý, Đang giao, Đã hoàn thành, Đã hủy.'
    ],
    listItems: [
      'Chi tiết đơn hàng hiển thị đầy đủ: thông tin người nhận, địa chỉ giao nhận, danh sách từng món đồ kèm ảnh chụp/kích thước/màu sắc/đơn giá, chi tiết thanh toán, mã bảo hành điện tử (khi đơn Hoàn thành) và lịch trình giao hàng cập nhật liên tục.',
      'Khách vãng lai tra cứu đơn hàng: Quý khách chưa có tài khoản có thể dễ dàng tra cứu đơn hàng bằng Số điện thoại đặt hàng + Mã xác thực OTP 6 số (giao diện có đếm ngược thời gian hiệu lực và giới hạn số lần gửi lại mã để bảo mật).'
    ],
    subsections: [
      {
        id: 'quy-dinh-huy-don',
        title: 'Quy định hủy đơn hàng và hoàn trả tồn kho',
        paragraphs: [
          'Khách hàng có thể chủ động bấm Hủy đơn trực tiếp trên hệ thống khi đơn hàng đang ở trạng thái: Chờ đặt cọc, Chờ xác nhận hoặc Đang xử lý ban đầu (khi đơn chưa xuất kho giao cho đơn vị vận chuyển).',
          'Khi hủy đơn, quý khách chọn lý do cụ thể (như: thay đổi ý định, muốn đổi mẫu/màu, đặt nhầm số lượng, thời gian giao quá lâu...) và nhập ghi chú; hệ thống sẽ tự động ghi nhận và hoàn trả lại số lượng tồn kho.',
          'Trường hợp đơn hàng đã xuất kho hoặc đang trên đường giao hàng: hệ thống khóa chức năng hủy đơn trực tiếp; quý khách vui lòng liên hệ bộ phận Chăm sóc khách hàng hoặc tiến hành thủ tục đổi trả sau khi nhận hàng.'
        ]
      }
    ]
  },
  {
    id: 'bang-trang-thai-vong-doi-don-hang',
    title: '5. Bảng trạng thái vòng đời đơn hàng',
    paragraphs: [
      'Mỗi đơn hàng tại DCor được gắn nhãn và vận hành tuần tự qua các trạng thái chuẩn xác sau:'
    ],
    table: {
      headers: ['Nhãn trạng thái đơn', 'Bộ lọc tương ứng', 'Ý nghĩa và tiến trình xử lý'],
      rows: [
        ['Chờ đặt cọc', 'Đang xử lý', `Đơn hàng giá trị cao (trên ${formatVND(HIGH_VALUE_ORDER_THRESHOLD)}) đang chờ khách hàng chuyển khoản thanh toán cọc ${HIGH_VALUE_DEPOSIT_PERCENT}%.`],
        ['Chờ xác nhận', 'Đang xử lý', 'Đơn hàng mới được tạo thành công, đang chờ nhân viên kiểm tra thông tin và xác nhận đơn.'],
        ['Đang xử lý', 'Đang xử lý', 'Đơn hàng đã được duyệt, bộ phận kho đang đóng gói và chuẩn bị bàn giao cho đội ngũ vận chuyển.'],
        ['Đang giao hàng', 'Đang giao', 'Đơn hàng đang trên đường vận chuyển và lắp đặt đến địa chỉ của quý khách theo lịch trình.'],
        ['Hoàn thành', 'Đã hoàn thành', 'Đơn hàng đã giao và lắp đặt thành công; hệ thống tự động kích hoạt mã bảo hành điện tử cho từng sản phẩm.'],
        ['Đã hủy', 'Đã hủy', 'Đơn hàng đã được hủy bởi khách hàng hoặc quản trị viên; hệ thống tự động hoàn trả tồn kho khả dụng.']
      ]
    }
  },
  {
    id: 'quy-trinh-doi-tra-va-bao-hanh-dien-tu',
    title: '6. Quy trình Đổi trả & Bảo hành điện tử',
    paragraphs: [
      'Sau khi nhận hàng thành công, quý khách an tâm sử dụng sản phẩm với chính sách hậu mãi rõ ràng:'
    ],
    listItems: [
      `Quy trình Đổi trả: Gửi yêu cầu từ mục tài khoản khi đơn hàng "Đã giao hàng thành công" và còn trong thời hạn tối đa ${MAX_RETURN_DAYS} ngày kể từ khi nhận hàng. Sản phẩm phải còn nguyên tem mác, không hư hại do người dùng. Chọn đổi mới hoặc trả hàng hoàn tiền kèm ảnh chụp rõ tem mác. Đơn dưới ${formatVND(RETURN_INSPECTION_THRESHOLD)} duyệt hồ sơ trực tuyến trong vòng ${ONLINE_RETURN_REVIEW_HOURS} giờ; đơn từ ${formatVND(RETURN_INSPECTION_THRESHOLD)} trở lên có kỹ thuật viên đến tận nhà giám định. Hủy yêu cầu chưa hoàn tất cần xác thực mã OTP.`,
      `Quy trình Bảo hành điện tử: Mã bảo hành điện tử tạo tự động gắn từng sản phẩm sau khi đơn hoàn thành (không cần phiếu giấy). Thời hạn bảo hành theo từng sản phẩm cụ thể. Quý khách chọn sản phẩm còn hạn, chọn nhóm lỗi, mô tả sự cố, gửi ảnh/video (tối đa ${MAX_WARRANTY_MEDIA_SIZE_MB}MB) và chọn kiểm tra tại nhà hoặc gửi về trung tâm. Theo dõi tiến trình qua tab "Lịch sử bảo hành" (Tiếp nhận -> Đã xếp lịch kỹ thuật viên -> Đang xử lý -> Đã hoàn tất bảo trì). Quá hạn bảo hành sẽ chuyển sang dịch vụ sửa chữa tính phí.`
    ]
  },
  {
    id: 'dat-hang-custom-thiet-ke-rieng',
    title: '7. Đặt hàng thiết kế riêng (Custom Furniture)',
    paragraphs: [
      'Đối với nhu cầu gia công may đo nội thất theo phong cách hoặc kích thước công trình riêng, dịch vụ Custom của DCor mang đến trải nghiệm minh bạch và chuyên nghiệp:'
    ],
    steps: [
      {
        number: 1,
        title: 'Gửi yêu cầu thiết kế riêng',
        description: 'Quý khách chọn thuộc tính muốn chỉnh, nhập mô tả chi tiết, khoảng giá dự kiến, ảnh minh họa cùng thông tin liên hệ và địa chỉ công trình.'
      },
      {
        number: 2,
        title: `Nhận phản hồi báo giá trong vòng ${CUSTOM_QUOTE_RESPONSE_HOURS} giờ`,
        description: 'Chuyên viên kỹ thuật và thiết kế DCor gửi bảng chi phí chi tiết (giá gia công, vật liệu phát sinh, thời gian sản xuất, tiền cọc) kèm dự thảo hợp đồng điện tử (quy định bảo hành, tiến độ bàn giao, trách nhiệm hai bên và chính sách hoàn/hủy cọc).'
      },
      {
        number: 3,
        title: 'Yêu cầu thay đổi hoặc Ký hợp đồng điện tử',
        description: 'Quý khách có thể gửi yêu cầu điều chỉnh báo giá hoặc đồng ý ký hợp đồng điện tử bằng mã OTP an toàn.'
      },
      {
        number: 4,
        title: `Thanh toán cọc (${CUSTOM_DEPOSIT_RANGE})`,
        description: 'Thanh toán tiền đặt cọc qua quét mã QR hoặc thẻ ngân hàng; trạng thái yêu cầu chuyển sang "Đã cọc / Đang gia công". Quý khách theo dõi toàn bộ tiến độ tại mục "Quản lý yêu cầu tùy chỉnh" (/account/custom-requests).'
      }
    ]
  },
  {
    id: 'dat-lich-tu-van-showroom',
    title: '8. Đặt lịch tư vấn Showroom',
    paragraphs: [
      `Quý khách muốn trải nghiệm chất liệu thực tế có thể sử dụng chức năng Đặt lịch tư vấn tại Showroom DCor (${ADDRESS}, mở cửa ${WORKING_HOURS}):`
    ],
    steps: [
      {
        number: 1,
        title: 'Chọn showroom, ngày và khung giờ',
        description: 'Lựa chọn địa điểm showroom, ngày và khung giờ còn trống phù hợp với thời gian biểu của quý khách.'
      },
      {
        number: 2,
        title: 'Nhập nội dung tư vấn & Gửi yêu cầu',
        description: 'Điền thông tin liên hệ và nội dung cần tư vấn. Hệ thống khởi tạo phiếu hẹn ở trạng thái "Chờ xác nhận".'
      },
      {
        number: 3,
        title: 'Quản trị duyệt và xác nhận lịch hẹn',
        description: 'Ban quản trị kiểm tra, phân công chuyên viên tư vấn phụ trách và chuyển lịch hẹn sang trạng thái "Xác nhận". Khi cần đổi lịch hoặc hủy lịch hẹn, quý khách cần xác thực bằng mã OTP gửi về số điện thoại.'
      }
    ]
  },
  {
    id: 'thiet-ke-khong-gian-va-cong-dong',
    title: '9. Thiết kế không gian 3D, Blog Cảm hứng & Cộng đồng',
    paragraphs: [
      'DCor mang đến hệ sinh thái sáng tạo không gian và kết nối cộng đồng yêu nội thất:'
    ],
    listItems: [
      'Blog & Cảm hứng (/blog): Cập nhật bài viết cẩm nang bài trí, xu hướng thiết kế nội thất mới nhất; sản phẩm DCor được gắn thẻ trực tiếp trong bài viết để xem nhanh; độc giả có thể tham gia bình luận và thả tim.',
      'Chia sẻ góc nhà: Khách hàng có thể đăng tải hình ảnh góc nhà thực tế của mình; bài viết của khách hàng sẽ được đội ngũ kiểm duyệt kỹ lưỡng trước khi hiển thị công khai trên hệ thống.',
      'Thiết kế không gian (/custom-design): Chọn bản mẫu hoặc tải lên ảnh mặt bằng thật, tự do kéo thả các sản phẩm nội thất DCor vào không gian phòng, xoay đổi góc nhìn và xuất file ảnh thiết kế định dạng PNG về máy.',
      'Cộng đồng (/community): Đăng tải bản thiết kế không gian lên chuyên trang Cộng đồng (yêu cầu đăng nhập tài khoản), gắn thẻ các sản phẩm DCor có trong thiết kế để giao lưu và truyền cảm hứng cho người dùng khác.'
    ]
  }
];
