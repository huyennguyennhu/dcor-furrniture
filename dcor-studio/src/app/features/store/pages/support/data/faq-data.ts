import { FaqCategory, FaqItem } from '../models/support.model';
import {
  HOTLINE,
  EMAIL,
  ADDRESS,
  WORKING_HOURS,
  AUTO_COMPLETE_DAYS,
  CODE_LOCK_THRESHOLD_FORMATTED,
  DEPOSIT_PERCENT
} from '../support-config';

export const FAQ_CATEGORIES: FaqCategory[] = [
  { id: 'all', name: 'Tất cả câu hỏi', iconName: 'Search' },
  { id: 'dat-hang', name: 'Đặt hàng', iconName: 'ShoppingBag' },
  { id: 'thanh-toan', name: 'Thanh toán', iconName: 'CreditCard' },
  { id: 'van-chuyen', name: 'Vận chuyển', iconName: 'Truck' },
  { id: 'doi-tra-bao-hanh', name: 'Đổi trả & Bảo hành', iconName: 'ShieldCheck' },
  { id: 'tai-khoan', name: 'Tài khoản', iconName: 'UserRound' },
  { id: 'thiet-ke-tu-van', name: 'Thiết kế & Tư vấn', iconName: 'Sparkles' }
];

export const FAQ_ITEMS: FaqItem[] = [
  // 1. Đặt hàng (4 câu)
  {
    id: 'faq-order-1',
    category: 'dat-hang',
    question: 'Tôi có thể mua hàng tại DCor mà không cần đăng ký tài khoản trước không?',
    answer: 'Hoàn toàn được. DCor hỗ trợ tính năng "Mua hàng nhanh cho khách vãng lai". Quý khách chỉ cần chọn sản phẩm, thêm vào giỏ và tiến hành thanh toán. Hệ thống sẽ gửi một mã OTP gồm 6 chữ số qua tin nhắn SMS tới số điện thoại của quý khách để xác nhận đơn hàng an toàn mà không bắt buộc tạo mật khẩu.',
    tags: ['khách vãng lai', 'tài khoản', 'otp', 'đặt hàng nhanh']
  },
  {
    id: 'faq-order-2',
    category: 'dat-hang',
    question: 'Làm thế nào để biết sản phẩm nội thất còn hàng sẵn hay cần đặt trước?',
    answer: 'Tình trạng tồn kho của từng biến thể (màu sắc, kích thước) được hiển thị trực tiếp trên trang chi tiết sản phẩm. Nếu nhãn ghi "Có sẵn", sản phẩm sẽ được xuất kho và giao ngay trong 1 - 2 ngày làm việc. Nếu nhãn ghi "Đặt trước", xưởng thủ công DCor sẽ tiến hành gia công chế tác với thời gian giao hàng dự kiến từ 5 - 10 ngày.',
    tags: ['tồn kho', 'còn hàng', 'đặt trước', 'sản xuất']
  },
  {
    id: 'faq-order-3',
    category: 'dat-hang',
    question: 'Tôi có thể thay đổi địa chỉ nhận hàng hoặc bổ sung sản phẩm sau khi đã bấm đặt đơn không?',
    answer: `Quý khách hoàn toàn có thể thay đổi thông tin khi đơn hàng còn ở trạng thái "Chờ xác nhận". Hãy liên hệ ngay tới Hotline ${HOTLINE} hoặc nhắn tin qua cửa sổ hỗ trợ trực tuyến để tổng đài viên điều chỉnh giúp quý khách. Nếu đơn hàng đã được bàn giao cho tài xế xuất kho, việc đổi địa chỉ có thể phát sinh thêm thời gian giao hàng.`,
    tags: ['thay đổi địa chỉ', 'bổ sung sản phẩm', 'chỉnh sửa đơn', 'hotline']
  },
  {
    id: 'faq-order-4',
    category: 'dat-hang',
    question: 'DCor có áp dụng chính sách chiết khấu ưu đãi cho đơn hàng số lượng lớn hoặc căn hộ trọn gói không?',
    answer: 'Có. DCor luôn dành mức chiết khấu thương mại đặc biệt từ 5% đến 15% cho các đơn hàng hoàn thiện nội thất căn hộ trọn gói, đơn hàng văn phòng hoặc dự án biệt thự. Quý khách có thể bấm nút "Đặt lịch tư vấn" trên website hoặc liên hệ bộ phận dự án để nhận bảng dự toán kinh phí ưu đãi nhất.',
    tags: ['chiết khấu', 'ưu đãi lớn', 'căn hộ trọn gói', 'dự án']
  },

  // 2. Thanh toán (4 câu)
  {
    id: 'faq-pay-1',
    category: 'thanh-toan',
    question: 'Tôi có thể thanh toán tiền mặt khi nhận hàng (COD) với mọi đơn hàng không?',
    answer: `DCor hỗ trợ thanh toán COD cho tất cả các đơn hàng tiêu chuẩn có giá trị dưới ${CODE_LOCK_THRESHOLD_FORMATTED}. Đối với các đơn hàng giá trị lớn từ ${CODE_LOCK_THRESHOLD_FORMATTED} trở lên hoặc đơn hàng thiết kế riêng theo yêu cầu (Custom Design), hệ thống quy định quý khách cần thanh toán trực tuyến và đặt cọc tối thiểu ${DEPOSIT_PERCENT}% để đảm bảo an toàn giao dịch.`,
    tags: ['cod', 'tiền mặt', 'đặt cọc', 'hạn mức']
  },
  {
    id: 'faq-pay-2',
    category: 'thanh-toan',
    question: 'Phương thức thanh toán quét mã VietQR tự động mất bao lâu để ghi nhận thành công?',
    answer: 'Hệ thống thanh toán qua VietQR của DCor được tích hợp công nghệ khớp lệnh ngân hàng tự động. Ngay sau khi quý khách thực hiện quét mã QR và chuyển khoản thành công từ ứng dụng ngân hàng, hệ thống website sẽ tự động cập nhật trạng thái "Đã thanh toán" chỉ trong 30 giây đến 1 phút mà quý khách không cần phải chụp gửi lại ủy nhiệm chi.',
    tags: ['vietqr', 'chuyển khoản', 'quét mã', 'tự động']
  },
  {
    id: 'faq-pay-3',
    category: 'thanh-toan',
    question: 'DCor có hỗ trợ trả góp lãi suất 0% qua thẻ tín dụng ngân hàng không?',
    answer: 'Có. DCor hỗ trợ chương trình trả góp lãi suất 0% với các kỳ hạn linh hoạt 3, 6, 9 hoặc 12 tháng qua thẻ tín dụng quốc tế (Visa, Mastercard, JCB) phát hành bởi hơn 25 ngân hàng đối tác tại Việt Nam. Quý khách chỉ cần chọn phương thức "Trả góp thẻ tín dụng" tại bước thanh toán.',
    tags: ['trả góp', 'thẻ tín dụng', 'lãi suất 0%', 'visa mastercard']
  },
  {
    id: 'faq-pay-4',
    category: 'thanh-toan',
    question: 'Tôi muốn yêu cầu xuất hóa đơn giá trị gia tăng (VAT) cho doanh nghiệp thì phải làm thế nào?',
    answer: 'Tại trang thanh toán đơn hàng, quý khách tích chọn vào mục "Yêu cầu xuất hóa đơn VAT" và điền đầy đủ Tên công ty, Mã số thuế, Địa chỉ trụ sở và Email nhận hóa đơn. Hóa đơn điện tử hợp lệ của cơ quan thuế sẽ được DCor phát hành và gửi về hòm thư điện tử của quý khách trong vòng 2 - 3 ngày làm việc sau khi đơn hàng được giao thành công.',
    tags: ['hóa đơn', 'vat', 'doanh nghiệp', 'mã số thuế']
  },

  // 3. Vận chuyển (4 câu)
  {
    id: 'faq-ship-1',
    category: 'van-chuyen',
    question: 'Phí vận chuyển được tính như thế nào và có chính sách miễn phí ship không?',
    answer: 'Phí vận chuyển được tính toán tự động dựa trên khoảng cách km từ kho DCor tại TP.HCM, trọng lượng và thể tích của món đồ nội thất. DCor áp dụng chương trình miễn phí giao hàng cho tất cả các đơn hàng nội thành TP.HCM đạt giá trị từ 10.000.000đ trở lên.',
    tags: ['phí vận chuyển', 'freeship', 'nội thành', 'tính phí']
  },
  {
    id: 'faq-ship-2',
    category: 'van-chuyen',
    question: 'Đồ nội thất lớn như sofa, giường, tủ có được nhân viên đưa lên tận phòng và lắp đặt không?',
    answer: 'Chắc chắn có. Đây là dịch vụ tiêu chuẩn của DCor. Đội ngũ nhân viên giao vận chuyên nghiệp của chúng tôi sẽ hỗ trợ bê vác sản phẩm lên tận căn hộ hoặc phòng ngủ của quý khách (kể cả thang bộ nhà phố), tiến hành lắp ráp hoàn chỉnh ốc vít, chân ghế và thu gom sạch sẽ bao bì đóng gói trước khi bàn giao.',
    tags: ['lắp đặt tận phòng', 'bê vác', 'sofa lớn', 'lắp ráp']
  },
  {
    id: 'faq-ship-3',
    category: 'van-chuyen',
    question: 'Thời gian giao hàng tiêu chuẩn của DCor mất bao lâu?',
    answer: 'Thời gian giao hàng đối với sản phẩm có sẵn tại khu vực nội thành TP.HCM là từ 1 - 2 ngày làm việc. Tại các tỉnh thành lân cận (Bình Dương, Đồng Nai, Long An) là từ 2 - 4 ngày. Đối với các tỉnh thành miền Trung và miền Bắc, thời gian vận chuyển an toàn qua xe chuyên dụng là từ 4 - 7 ngày làm việc.',
    tags: ['thời gian giao hàng', 'tiến độ', 'tỉnh xa', 'nội thành']
  },
  {
    id: 'faq-ship-4',
    category: 'van-chuyen',
    question: 'Nếu đến giờ giao hàng mà tôi bận đột xuất không thể nhận thì xử lý như thế nào?',
    answer: 'Tài xế giao hàng DCor luôn gọi điện thoại hẹn trước với quý khách từ 1 - 2 tiếng. Nếu quý khách có việc bận đột xuất, DCor sẽ sắp xếp dời lịch giao sang ca tiếp theo hoặc ngày hôm sau hoàn toàn miễn phí. Hàng hóa được lưu kho bảo quản an toàn tối đa 3 ngày để chờ thời điểm thuận lợi nhất của quý khách.',
    tags: ['hẹn lại lịch', 'bận đột xuất', 'lưu kho', 'giao lại']
  },

  // 4. Đổi trả & Bảo hành (4 câu)
  {
    id: 'faq-return-1',
    category: 'doi-tra-bao-hanh',
    question: 'Thời hạn bảo hành các sản phẩm nội thất DCor là bao lâu?',
    answer: 'Thời hạn bảo hành dao động từ 12 đến 36 tháng tùy theo từng danh mục sản phẩm cụ thể: Khung sườn sofa gỗ tự nhiên được bảo hành 36 tháng; Đệm mút và lò xo bảo hành 24 tháng; Bàn ghế ăn và tủ kệ gỗ bảo hành 24 tháng; Phụ kiện bản lề kim khí bảo hành 12 tháng. Thông tin bảo hành được hiển thị chi tiết tại trang của từng sản phẩm.',
    tags: ['thời hạn bảo hành', 'sofa', 'gỗ sồi', 'khung sườn']
  },
  {
    id: 'faq-return-2',
    category: 'doi-tra-bao-hanh',
    question: `Tôi có thể yêu cầu đổi trả sản phẩm trong thời gian bao lâu kể từ khi nhận hàng?`,
    answer: `Quý khách có thể gửi yêu cầu đổi trả trong vòng ${AUTO_COMPLETE_DAYS} ngày kể từ thời điểm nhận hàng thành công, khi đơn hàng chưa chuyển sang trạng thái "Hoàn tất". Sau ${AUTO_COMPLETE_DAYS} ngày, hệ thống sẽ tự động hoàn tất đơn hàng và chuyển sang chế độ bảo hành tiêu chuẩn, tính năng gửi yêu cầu đổi trả sẽ được đóng lại.`,
    tags: ['đổi trả', 'thời hạn đổi trả', 'hoàn tất', 'quy định']
  },
  {
    id: 'faq-return-3',
    category: 'doi-tra-bao-hanh',
    question: 'Làm thế nào để tạo yêu cầu bảo hành nhanh chóng khi phát sinh sự cố?',
    answer: `Quý khách chỉ cần đăng nhập tài khoản trên website, truy cập mục "Tài khoản > Đơn hàng của tôi", bấm vào nút "Yêu cầu bảo hành" tại món đồ cần sửa chữa. Điền mô tả hiện tượng, đính kèm 2 hình ảnh và 1 video ngắn quay lỗi. Kỹ thuật viên DCor sẽ liên hệ xác nhận trong vòng 24 giờ để hẹn lịch kiểm tra tại nhà hoặc tại Showroom.`,
    tags: ['tạo yêu cầu bảo hành', 'sửa chữa', 'video ảnh', 'kỹ thuật']
  },
  {
    id: 'faq-return-4',
    category: 'doi-tra-bao-hanh',
    question: 'Tôi có phải chịu phí vận chuyển khi thực hiện đổi trả sản phẩm lỗi không?',
    answer: 'Nếu sản phẩm bị lỗi do khâu sản xuất của DCor, bị giao sai mẫu mã hoặc bị hư hại trầy xước do quá trình vận chuyển, DCor chịu 100% chi phí thu hồi và giao sản phẩm mới. Trong trường hợp quý khách muốn đổi mẫu mã theo sở thích cá nhân, quý khách chỉ cần thanh toán chi phí vận chuyển phát sinh hai chiều theo cước phí niêm yết.',
    tags: ['chi phí đổi trả', 'freeship đổi trả', 'lỗi nhà sản xuất', 'đổi mẫu']
  },

  // 5. Tài khoản (4 câu)
  {
    id: 'faq-account-1',
    category: 'tai-khoan',
    question: 'Làm thế nào để thay đổi thông tin cá nhân và địa chỉ giao hàng mặc định?',
    answer: 'Quý khách vui lòng đăng nhập vào website DCor, bấm vào biểu tượng tài khoản ở góc phải trên cùng và chọn "Hồ sơ cá nhân". Tại đây, quý khách có thể cập nhật họ tên, số điện thoại, ảnh đại diện, đổi mật khẩu và thiết lập danh sách địa chỉ nhận hàng thân quen.',
    tags: ['hồ sơ cá nhân', 'đổi mật khẩu', 'địa chỉ mặc định', 'tài khoản']
  },
  {
    id: 'faq-account-2',
    category: 'tai-khoan',
    question: 'Tôi bị quên mật khẩu đăng nhập tài khoản thì phải làm sao?',
    answer: 'Tại cửa sổ Đăng nhập, quý khách bấm vào liên kết "Quên mật khẩu?", sau đó điền địa chỉ Email đã dùng khi đăng ký. Hệ thống DCor sẽ gửi ngay một đường link khôi phục mật khẩu bảo mật vào hộp thư của quý khách. Quý khách chỉ cần mở email và làm theo hướng dẫn để tạo mật khẩu mới.',
    tags: ['quên mật khẩu', 'khôi phục', 'reset mật khẩu', 'email']
  },
  {
    id: 'faq-account-3',
    category: 'tai-khoan',
    question: 'DCor có đảm bảo bảo mật thông tin cá nhân và lịch sử mua sắm của tôi không?',
    answer: `Tuyệt đối an toàn. DCor cam kết bảo mật 100% dữ liệu thông tin cá nhân của khách hàng theo Luật An ninh mạng Việt Nam và chuẩn bảo mật quốc tế SSL. Chúng tôi không bao giờ chia sẻ, trao đổi hay bán dữ liệu khách hàng cho bất kỳ bên thứ ba nào vì mục đích quảng cáo thương mại.`,
    tags: ['bảo mật thông tin', 'quyền riêng tư', 'an toàn dữ liệu', 'chính sách bảo mật']
  },
  {
    id: 'faq-account-4',
    category: 'tai-khoan',
    question: 'Đơn hàng tôi mua với tư cách khách vãng lai có được liên kết vào tài khoản sau này không?',
    answer: 'Có. Khi quý khách đăng ký tài khoản chính thức sử dụng cùng số điện thoại đã dùng để nhận hàng trước đó, hệ thống DCor sẽ tự động nhận diện và đồng bộ toàn bộ lịch sử đơn hàng cũ vào mục "Đơn hàng của tôi", giúp quý khách dễ dàng quản lý hạn bảo hành.',
    tags: ['đồng bộ đơn hàng', 'liên kết số điện thoại', 'khách vãng lai', 'lịch sử mua sắm']
  },

  // 6. Thiết kế & Tư vấn (4 câu)
  {
    id: 'faq-design-1',
    category: 'thiet-ke-tu-van',
    question: 'Dịch vụ thiết kế Custom Furniture theo kích thước riêng tại DCor hoạt động như thế nào?',
    answer: `Quý khách có thể gửi bản vẽ phác thảo, hình ảnh ý tưởng hoặc kích thước phòng tại chuyên trang "/custom-design". Kiến trúc sư của DCor sẽ liên hệ trực tiếp, tư vấn chất liệu gỗ, lên phối cảnh 3D và báo giá chi tiết. Sau khi quý khách đặt cọc ${DEPOSIT_PERCENT}%, xưởng DCor sẽ tiến hành sản xuất đo ni đóng giày riêng cho ngôi nhà của quý khách.`,
    tags: ['custom furniture', 'đóng theo yêu cầu', 'thiết kế riêng', 'bản vẽ 3d']
  },
  {
    id: 'faq-design-2',
    category: 'thiet-ke-tu-van',
    question: 'Đặt lịch tư vấn trực tiếp tại Showroom DCor có mất phí không?',
    answer: `Dịch vụ tư vấn không gian và tiếp đón trải nghiệm nội thất tại Showroom DCor (${ADDRESS}) là HOÀN TOÀN MIỄN PHÍ. Quý khách sẽ được kiến trúc sư và chuyên viên tư vấn tiếp đón tận tình, phân tích bản vẽ mặt bằng và phối màu nội thất phù hợp với phong thủy và phong cách của gia đình.`,
    tags: ['showroom', 'tư vấn miễn phí', 'kiến trúc sư', 'đặt lịch hẹn']
  },
  {
    id: 'faq-design-3',
    category: 'thiet-ke-tu-van',
    question: 'DCor có hỗ trợ kỹ thuật viên đến tận nhà khảo sát và đo đạc kích thước thực tế không?',
    answer: 'Có. Đối với các đơn hàng đóng nội thất may đo (Custom) hoặc các gói hoàn thiện căn hộ từ 2 phòng trở lên, DCor cử kỹ thuật viên đến tận công trình/nhà của quý khách để đo đạc hiện trạng thực tế, kiểm tra vị trí ổ điện, công tắc và đường ống nước nhằm đảm bảo món đồ khi lắp đặt chuẩn xác từng milimet.',
    tags: ['khảo sát tận nhà', 'đo đạc thực tế', 'kỹ thuật viên', 'chuẩn kích thước']
  },
  {
    id: 'faq-design-4',
    category: 'thiet-ke-tu-van',
    question: 'Tôi có thể chia sẻ thiết kế không gian nhà mình lên Cộng đồng DCor như thế nào?',
    answer: 'Quý khách truy cập vào mục "Cộng đồng" (/community), bấm vào nút "Chia sẻ không gian của bạn", tải lên những bức ảnh chụp góc nội thất ưng ý nhất của tổ ấm kèm theo vài dòng cảm nhận. Bài viết của quý khách sẽ được duyệt xuất bản để truyền cảm hứng cho hàng ngàn thành viên yêu nhà đẹp khác.',
    tags: ['cộng đồng', 'chia sẻ không gian', 'decor nhà đẹp', 'community']
  }
];

