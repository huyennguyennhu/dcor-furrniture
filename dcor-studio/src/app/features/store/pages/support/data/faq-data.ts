import { FaqCategory, FaqItem } from '../models/support.model';
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

export const FAQ_CATEGORIES: FaqCategory[] = [
  { id: 'all', name: 'Tất cả câu hỏi', iconName: 'Search' },
  { id: 'dat-hang', name: 'Đặt hàng & Sản phẩm', iconName: 'ShoppingBag' },
  { id: 'thanh-toan', name: 'Thanh toán & Đặt cọc', iconName: 'CreditCard' },
  { id: 'van-chuyen', name: 'Vận chuyển & Giao hàng', iconName: 'Truck' },
  { id: 'doi-tra-bao-hanh', name: 'Đổi trả & Bảo hành', iconName: 'ShieldCheck' },
  { id: 'tai-khoan', name: 'Tài khoản & Quản lý đơn', iconName: 'UserRound' },
  { id: 'custom-tu-van', name: 'Custom, Tư vấn & Cộng đồng', iconName: 'Sparkles' }
];

export const FAQ_ITEMS: FaqItem[] = [
  // ==========================================================================
  // 1. Đặt hàng & Sản phẩm
  // ==========================================================================
  {
    id: 'faq-order-1',
    category: 'dat-hang',
    question: 'Tôi có thể mua hàng tại DCor với tư cách khách vãng lai không?',
    answer: 'Hoàn toàn được. Khách vãng lai có thể chọn sản phẩm và tiến hành đặt hàng bình thường. Khi nhập thông tin người nhận, nếu số điện thoại chưa được xác minh thì hệ thống sẽ gửi mã OTP 6 số để xác thực an toàn. Sau khi đặt hàng thành công, màn hình sẽ hiển thị thời gian giao hàng dự kiến và cung cấp ô nhập mật khẩu để khách vãng lai tạo nhanh tài khoản; hệ thống sẽ tự động liên kết đơn hàng vừa tạo vào tài khoản mới đó.',
    tags: ['khách vãng lai', 'đặt hàng', 'otp', 'tạo nhanh tài khoản']
  },
  {
    id: 'faq-order-2',
    category: 'dat-hang',
    question: 'DCor có tính năng so sánh các sản phẩm nội thất cùng loại không?',
    answer: `Có. Tại trang Sản phẩm (/explore), quý khách có thể bấm nút So sánh để chọn tối đa ${MAX_COMPARE_PRODUCTS} sản phẩm trong cùng một danh mục. Bảng so sánh sẽ đối chiếu chi tiết về kích thước, màu sắc, chất liệu và giá bán giúp quý khách dễ dàng lựa chọn sản phẩm phù hợp nhất.`,
    tags: ['so sánh', 'danh mục', 'explore', 'sản phẩm']
  },
  {
    id: 'faq-order-3',
    category: 'dat-hang',
    question: 'Nếu trong quá trình thanh toán có sản phẩm bất ngờ hết hàng thì xử lý ra sao?',
    answer: 'Hệ thống DCor có cơ chế kiểm tra tồn kho thời gian thực. Nếu sản phẩm trong giỏ bất ngờ hết hàng do khách hàng khác đặt mua trước, hệ thống sẽ hiển thị thông báo tức thì và hướng dẫn quý khách cập nhật lại giỏ hàng trước khi tiếp tục đặt mua.',
    tags: ['hết hàng', 'cập nhật giỏ hàng', 'tồn kho', 'thanh toán']
  },
  {
    id: 'faq-order-4',
    category: 'dat-hang',
    question: 'DCor có hỗ trợ dịch vụ quà tặng hay thiệp mừng không?',
    answer: 'Có. Tại bước Thanh toán (/checkout), quý khách có thể tích chọn mục "Tùy chọn quà tặng" để nhập lời nhắn chúc mừng trên thiệp và yêu cầu ẩn giá trên phiếu giao hàng khi gửi tặng người thân, bạn bè.',
    tags: ['quà tặng', 'lời nhắn thiệp', 'ẩn giá', 'checkout']
  },

  // ==========================================================================
  // 2. Thanh toán & Đặt cọc
  // ==========================================================================
  {
    id: 'faq-pay-1',
    category: 'thanh-toan',
    question: 'DCor hiện hỗ trợ những phương thức thanh toán nào?',
    answer: 'Hệ thống DCor hiện áp dụng 2 phương thức thanh toán chính thức: (1) Thanh toán khi nhận hàng (COD) và (2) Chuyển khoản ngân hàng quét mã VietQR. Mã VietQR là mã động được tạo tự động, tự điền số tài khoản, tên chủ tài khoản, số tiền và nội dung chuyển khoản chứa mã đơn hàng; sau khi ngân hàng xác nhận, đơn sẽ tự động chuyển sang trạng thái "Đã thanh toán".',
    tags: ['phương thức thanh toán', 'cod', 'vietqr', 'chuyển khoản ngân hàng']
  },
  {
    id: 'faq-pay-2',
    category: 'thanh-toan',
    question: 'Mã QR thanh toán VietQR bị hết hạn hoặc ngân hàng gián đoạn thì phải làm sao?',
    answer: 'Mỗi mã VietQR động có thời hạn hiệu lực nhất định. Nếu mã hết hạn, màn hình sẽ hiển thị nút "Tạo lại mã thanh toán" để quý khách lấy mã QR mới. Trường hợp hệ thống ngân hàng bị gián đoạn kết nối, quý khách có thể chuyển sang phương thức COD hoặc liên hệ tổng đài Hotline 1900 1234 để được hỗ trợ đối soát.',
    tags: ['vietqr hết hạn', 'tạo lại mã', 'gián đoạn', 'đối soát']
  },
  {
    id: 'faq-pay-3',
    category: 'thanh-toan',
    question: `Đơn hàng giá trị trên ${formatVND(HIGH_VALUE_ORDER_THRESHOLD)} có được thanh toán COD không?`,
    answer: `Không. Theo quy định, các đơn hàng giá trị cao (trên ${formatVND(HIGH_VALUE_ORDER_THRESHOLD)}) sẽ tự động bị khóa phương thức COD và bắt buộc phải đặt cọc ${HIGH_VALUE_DEPOSIT_PERCENT}% bằng hình thức chuyển khoản VietQR. Sau khi cọc thành công, đơn hàng sẽ có trạng thái thanh toán là "Đã thanh toán cọc"; phần giá trị còn lại (70%) sẽ thanh toán khi nhân viên giao hàng và lắp đặt hoàn tất.`,
    tags: ['khóa cod', 'đơn hàng lớn', 'đặt cọc 30%', '50 triệu']
  },
  {
    id: 'faq-pay-4',
    category: 'thanh-toan',
    question: 'Làm thế nào để yêu cầu xuất hóa đơn giá trị gia tăng (VAT) điện tử?',
    answer: 'Tại bước Thanh toán (/checkout), quý khách tích chọn ô "Yêu cầu hóa đơn VAT điện tử" và nhập đầy đủ: Tên doanh nghiệp, Mã số thuế, Địa chỉ công ty và Email nhận hóa đơn. Hóa đơn VAT điện tử hợp lệ sẽ được gửi về email của quý khách sau khi đơn hàng được giao thành công.',
    tags: ['hóa đơn vat', 'hóa đơn điện tử', 'doanh nghiệp', 'mã số thuế']
  },

  // ==========================================================================
  // 3. Vận chuyển & Giao hàng
  // ==========================================================================
  {
    id: 'faq-ship-1',
    category: 'van-chuyen',
    question: 'Phí vận chuyển đơn hàng được tính như thế nào?',
    answer: 'Phí vận chuyển tại DCor được tính linh hoạt theo khu vực nội thành hoặc liên tỉnh. Sau khi quý khách nhập địa chỉ giao hàng (Tỉnh/Thành, Quận/Huyện, Phường/Xã từ dữ liệu hành chính chuẩn), hệ thống sẽ tính toán và hiển thị số tiền phí vận chuyển cụ thể tại bảng xem lại đơn hàng trước khi bấm đặt mua.',
    tags: ['phí vận chuyển', 'nội thành', 'liên tỉnh', 'checkout']
  },
  {
    id: 'faq-ship-2',
    category: 'van-chuyen',
    question: 'Tôi có thể biết trước thời gian giao hàng dự kiến không?',
    answer: 'Có. Sau khi đặt hàng thành công, màn hình thông báo hoàn tất sẽ hiển thị thời gian giao hàng dự kiến cụ thể. Ngoài ra, quý khách có thể theo dõi chi tiết lịch trình giao hàng thời gian thực trong mục "Đơn hàng của tôi" (/account/orders).',
    tags: ['thời gian giao hàng', 'dự kiến', 'lịch trình giao hàng']
  },
  {
    id: 'faq-ship-3',
    category: 'van-chuyen',
    question: 'Đồ nội thất lớn có được hỗ trợ mang lên phòng và lắp ráp không?',
    answer: 'Có. DCor cung cấp dịch vụ giao hàng kèm lắp đặt tận nơi. Đội ngũ nhân viên giao nhận sẽ hỗ trợ bốc xếp sản phẩm vào đúng vị trí quý khách mong muốn trong phòng, thực hiện lắp ráp hoàn thiện, kiểm tra độ cân bằng vững chắc và cùng quý khách nghiệm thu trước khi bàn giao.',
    tags: ['lắp đặt', 'bốc xếp tận phòng', 'đồ nội thất lớn', 'bàn giao']
  },

  // ==========================================================================
  // 4. Đổi trả & Bảo hành
  // ==========================================================================
  {
    id: 'faq-warranty-1',
    category: 'doi-tra-bao-hanh',
    question: 'Chính sách bảo hành tại DCor hoạt động như thế nào? Có cần phiếu giấy không?',
    answer: 'DCor áp dụng mã bảo hành điện tử tự động gắn với từng sản phẩm sau khi đơn hàng được giao thành công ("Hoàn thành"), hoàn toàn không cần phiếu giấy. Thời hạn bảo hành được quy định riêng cho từng sản phẩm (hiển thị trong chi tiết đơn hàng và mục Bảo hành, không có thời hạn mặc định chung). Quý khách có thể gửi yêu cầu bảo hành kỹ thuật trực tuyến và theo dõi toàn bộ tiến trình tại tab "Lịch sử bảo hành".',
    tags: ['bảo hành điện tử', 'không cần phiếu giấy', 'thời hạn theo sản phẩm', 'lịch sử bảo hành']
  },
  {
    id: 'faq-warranty-2',
    category: 'doi-tra-bao-hanh',
    question: 'Khi sản phẩm gặp sự cố kỹ thuật, tôi cần chuẩn bị những gì để gửi yêu cầu bảo hành?',
    answer: `Quý khách vào tài khoản chọn sản phẩm còn hạn bảo hành, chọn nhóm lỗi, nhập mô tả chi tiết sự cố và tải lên hình ảnh/video thực tế rõ nét (dung lượng tối đa ${MAX_WARRANTY_MEDIA_SIZE_MB}MB). Quý khách lựa chọn hình thức kiểm tra tại nhà hoặc gửi về trung tâm bảo hành. Phiếu sẽ được tạo ở trạng thái "Tiếp nhận - Chờ thẩm định" kèm lịch hẹn liên hệ dự kiến. Nếu quá hạn bảo hành, sản phẩm sẽ chuyển sang dịch vụ sửa chữa tính phí.`,
    tags: ['gửi yêu cầu bảo hành', 'nhóm lỗi', 'ảnh video 15mb', 'kiểm tra tại nhà']
  },
  {
    id: 'faq-return-1',
    category: 'doi-tra-bao-hanh',
    question: 'Thời hạn và điều kiện để được yêu cầu đổi trả sản phẩm là gì?',
    answer: `Yêu cầu đổi trả chỉ được tạo khi đơn hàng ở trạng thái "Đã giao hàng thành công" và còn trong thời hạn đổi trả (tối đa ${MAX_RETURN_DAYS} ngày kể từ khi nhận hàng). Sản phẩm bắt buộc phải còn nguyên tem mác, không bị hư hại do người dùng. Quý khách có thể chọn Đổi sản phẩm mới hoặc Trả hàng và hoàn tiền với các lý do hợp lệ như: lỗi kết cấu nhà sản xuất, giao sai màu/kích thước, hoặc trầy xước do vận chuyển. Bắt buộc có mô tả và ít nhất 1 ảnh rõ nét chụp cận cảnh sản phẩm kèm tem mác.`,
    tags: ['đổi trả', 'tối đa 7 ngày', 'nguyên tem mác', 'đổi mới hoàn tiền']
  },
  {
    id: 'faq-return-2',
    category: 'doi-tra-bao-hanh',
    question: `Quy trình thẩm định đổi trả phân biệt như thế nào với đơn hàng trên/dưới ${formatVND(RETURN_INSPECTION_THRESHOLD)}?`,
    answer: `Với đơn/sản phẩm dưới ${formatVND(RETURN_INSPECTION_THRESHOLD)}: hệ thống thẩm định hồ sơ trực tuyến qua ảnh/video minh chứng, phản hồi dự kiến trong vòng ${ONLINE_RETURN_REVIEW_HOURS} giờ ("Chờ thẩm định hồ sơ trực tuyến"). Với đơn/sản phẩm từ ${formatVND(RETURN_INSPECTION_THRESHOLD)} trở lên: khách hàng chọn ngày và khung giờ để chuyên viên kỹ thuật DCor đến tận nhà giám định trực tiếp và lập biên bản ("Chờ kỹ thuật viên giám định tại nhà"). Trường hợp hư hại do va đập ngoại lực từ khách hàng sẽ bị từ chối kèm biên bản và lý do rõ ràng. Khi cần hủy yêu cầu đổi trả chưa hoàn tất, khách hàng phải xác thực bằng mã OTP.`,
    tags: ['thẩm định trực tuyến 24h', 'giám định tại nhà', '50 triệu', 'biên bản']
  },

  // ==========================================================================
  // 5. Tài khoản & Quản lý đơn
  // ==========================================================================
  {
    id: 'faq-acc-1',
    category: 'tai-khoan',
    question: 'Làm thế nào để theo dõi và lọc các đơn hàng của tôi?',
    answer: 'Tại mục "Đơn hàng của tôi" (/account/orders), quý khách có thể lọc đơn hàng theo 5 bộ lọc: Tất cả, Đang xử lý, Đang giao, Đã hoàn thành, Đã hủy. Chi tiết đơn hàng hiển thị đầy đủ thông tin người nhận, địa chỉ, từng món kèm ảnh/kích thước/màu/đơn giá, chi tiết thanh toán, mã bảo hành điện tử và lịch trình giao hàng cập nhật liên tục.',
    tags: ['quản lý đơn', 'bộ lọc', 'đơn hàng của tôi', 'lịch trình']
  },
  {
    id: 'faq-acc-2',
    category: 'tai-khoan',
    question: 'Khách vãng lai làm thế nào để tra cứu lại đơn hàng đã đặt?',
    answer: 'Khách vãng lai có thể sử dụng chức năng Tra cứu đơn hàng bằng Số điện thoại đặt hàng + Mã xác thực OTP 6 số. Màn hình tra cứu có đồng hồ đếm ngược hiệu lực mã OTP và giới hạn số lần gửi lại để đảm bảo an toàn thông tin.',
    tags: ['tra cứu đơn hàng', 'khách vãng lai', 'otp 6 số', 'sđt']
  },
  {
    id: 'faq-acc-3',
    category: 'tai-khoan',
    question: 'Khi nào tôi có thể chủ động hủy đơn hàng trên hệ thống?',
    answer: 'Quý khách có thể chủ động bấm Hủy đơn khi đơn hàng đang ở trạng thái: Chờ đặt cọc, Chờ xác nhận hoặc Đang xử lý ban đầu (chưa bàn giao cho đơn vị vận chuyển). Khi hủy, quý khách chọn lý do (thay đổi ý định, đổi mẫu/màu, đặt nhầm số lượng, thời gian giao lâu...) và nhập ghi chú; hệ thống sẽ tự động hoàn trả số lượng tồn kho. Nếu đơn hàng đã xuất kho hoặc đang giao, quý khách vui lòng liên hệ CSKH hoặc thực hiện đổi trả sau khi nhận hàng.',
    tags: ['hủy đơn', 'hoàn trả tồn kho', 'chờ xác nhận', 'đang xử lý']
  },

  // ==========================================================================
  // 6. Custom, Tư vấn & Cộng đồng
  // ==========================================================================
  {
    id: 'faq-custom-1',
    category: 'custom-tu-van',
    question: 'Quy trình đặt làm nội thất thiết kế riêng (Custom Furniture) tại DCor như thế nào?',
    answer: `Quý khách gửi yêu cầu Custom (chọn thuộc tính muốn chỉnh, mô tả, khoảng giá, ảnh minh họa, địa chỉ công trình) -> DCor phản hồi báo giá chi tiết trong vòng ${CUSTOM_QUOTE_RESPONSE_HOURS} giờ -> Quý khách xem bảng chi phí (gia công, vật liệu, tiến độ, tiền cọc) và dự thảo hợp đồng điện tử (điều khoản bảo hành, hoàn/hủy cọc) -> Quý khách yêu cầu điều chỉnh hoặc ký hợp đồng bằng OTP -> Thanh toán cọc (thông thường ${CUSTOM_DEPOSIT_RANGE}) qua QR/thẻ -> Đơn chuyển sang "Đã cọc / Đang gia công". Quý khách theo dõi toàn bộ tiến độ tại mục "Quản lý yêu cầu tùy chỉnh" (/account/custom-requests).`,
    tags: ['custom furniture', 'báo giá 24h', 'hợp đồng điện tử', 'đặt cọc custom']
  },
  {
    id: 'faq-custom-2',
    category: 'custom-tu-van',
    question: 'Làm thế nào để đặt lịch hẹn tư vấn tại Showroom DCor?',
    answer: `Quý khách truy cập chức năng Đặt lịch tư vấn, chọn Showroom (${ADDRESS}, mở cửa ${WORKING_HOURS}), chọn ngày và khung giờ còn trống, nhập nội dung cần tư vấn và gửi yêu cầu. Phiếu hẹn ở trạng thái "Chờ xác nhận" chờ ban quản trị duyệt và phân công chuyên viên. Khi cần đổi hoặc hủy lịch hẹn, quý khách cần xác thực bằng mã OTP.`,
    tags: ['đặt lịch tư vấn', 'showroom', 'khung giờ', 'otp']
  },
  {
    id: 'faq-custom-3',
    category: 'custom-tu-van',
    question: 'Công cụ Thiết kế không gian 3D và chuyên trang Cộng đồng hoạt động như thế nào?',
    answer: 'Tại trang Thiết kế không gian (/custom-design), quý khách có thể chọn bản mẫu hoặc tải ảnh mặt bằng thật, tự do kéo thả các sản phẩm nội thất DCor, bài trí không gian và xuất file ảnh thiết kế PNG về máy. Quý khách có thể chia sẻ thiết kế hoặc hình ảnh góc nhà lên chuyên trang Cộng đồng (/community - yêu cầu đăng nhập) và gắn thẻ sản phẩm DCor. Mọi bài viết của người dùng đều được ban quản trị kiểm duyệt trước khi hiển thị công khai.',
    tags: ['thiết kế không gian', 'kéo thả', 'cộng đồng', 'gắn thẻ sản phẩm']
  }
];
