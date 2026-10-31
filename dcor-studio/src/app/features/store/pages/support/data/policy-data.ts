import { ContentSection } from '../models/support.model';
import {
  HOTLINE,
  EMAIL,
  ADDRESS,
  WORKING_HOURS,
  POLICY_LAST_UPDATED,
  HIGH_VALUE_ORDER_THRESHOLD,
  HIGH_VALUE_DEPOSIT_PERCENT,
  RETURN_INSPECTION_THRESHOLD,
  ONLINE_RETURN_REVIEW_HOURS,
  MAX_RETURN_DAYS,
  MAX_WARRANTY_MEDIA_SIZE_MB,
  CUSTOM_QUOTE_RESPONSE_HOURS,
  CUSTOM_DEPOSIT_RANGE,
  formatVND
} from '../support-config';

export interface PolicyDefinition {
  slug: string;
  title: string;
  shortDesc: string;
  badge: string;
  lastUpdated: string;
  sections: ContentSection[];
}

export const POLICIES: Record<string, PolicyDefinition> = {
  // ==========================================================================
  // 1. CHÍNH SÁCH BẢO HÀNH
  // ==========================================================================
  'bao-hanh': {
    slug: 'bao-hanh',
    title: 'Chính sách bảo hành sản phẩm',
    shortDesc: 'Mã bảo hành điện tử tạo tự động, thời hạn tính theo từng sản phẩm, tra cứu trực tuyến và theo dõi lịch sử bảo trì tại DCor.',
    badge: 'Bảo hành chính hãng',
    lastUpdated: POLICY_LAST_UPDATED,
    sections: [
      {
        id: 'ma-bao-hanh-dien-tu',
        title: '1. Mã bảo hành điện tử & Thời hạn theo từng sản phẩm',
        paragraphs: [
          'Tại DCor, hệ thống áp dụng hoàn toàn công nghệ mã bảo hành điện tử. Ngay sau khi đơn hàng được giao thành công và chuyển sang trạng thái "Hoàn thành", mã bảo hành điện tử sẽ được tạo tự động và gắn liền với từng sản phẩm trong đơn mà không cần sử dụng phiếu bảo hành giấy.',
          'Thời hạn bảo hành được quy định riêng biệt cho từng sản phẩm và hiển thị công khai ngay trong thông tin chi tiết đơn hàng cũng như mục Bảo hành. DCor không áp dụng một thời hạn bảo hành mặc định chung cho toàn bộ sản phẩm.',
          'Trong thời hạn bảo hành còn hiệu lực, sản phẩm đáp ứng đúng điều kiện quy định sẽ được hỗ trợ kiểm tra và khắc phục sự cố kỹ thuật hoàn toàn miễn phí.'
        ],
        callout: {
          type: 'tip',
          title: 'Tra cứu mã bảo hành điện tử trực tuyến',
          text: 'Khách hàng có thể đăng nhập tài khoản, truy cập mục "Đơn hàng của tôi" (/account/orders) để xem mã bảo hành điện tử gắn với từng món đồ cùng thời hạn bảo hành chi tiết sau khi đơn hàng đã hoàn thành.'
        }
      },
      {
        id: 'dieu-kien-tiep-nhan-va-tu-choi',
        title: '2. Điều kiện tiếp nhận và phạm vi bảo hành',
        paragraphs: [
          'DCor tiếp nhận xử lý bảo hành hợp lệ đối với các trường hợp đáp ứng đầy đủ điều kiện sau:'
        ],
        listItems: [
          'Sản phẩm còn trong thời hạn bảo hành điện tử hợp lệ ghi nhận trên hệ thống DCor.',
          'Lỗi kỹ thuật hoặc hư hỏng phát sinh do kết cấu sản xuất hoặc lỗi linh kiện từ nhà sản xuất trong quá trình sử dụng đúng công năng hướng dẫn.',
          'Khách hàng cung cấp đầy đủ thông tin mô tả chi tiết sự cố và đính kèm hình ảnh/video thực tế rõ nét của sản phẩm.'
        ],
        subsections: [
          {
            id: 'tu-choi-bao-hanh-va-dich-vu-tinh-phi',
            title: 'Các trường hợp từ chối bảo hành miễn phí',
            paragraphs: [
              'DCor không bảo hành miễn phí đối với các trường hợp sản phẩm hư hỏng do tác động ngoại lực (rơi vỡ, va đập, trầy xước trong quá trình quý khách tự di chuyển), sử dụng sai hướng dẫn hoặc tự ý tháo rời sửa chữa thay đổi kết cấu.',
              'Khi sản phẩm đã quá hạn bảo hành hoặc hư hại không thuộc phạm vi miễn phí, hệ thống sẽ chuyển sang dịch vụ sửa chữa có tính phí theo thẩm định thực tế của bộ phận kỹ thuật.'
            ]
          }
        ]
      },
      {
        id: 'huong-dan-gui-yeu-cau-bao-hanh',
        title: '3. Hướng dẫn gửi yêu cầu bảo hành trực tuyến',
        paragraphs: [
          'Quý khách có thể khởi tạo yêu cầu bảo hành kỹ thuật nhanh chóng ngay trong tài khoản thành viên theo các bước sau:'
        ],
        steps: [
          {
            number: 1,
            title: 'Chọn sản phẩm còn hạn bảo hành',
            description: 'Đăng nhập vào tài khoản DCor, truy cập trang chi tiết đơn hàng hoặc mục Bảo hành và chọn sản phẩm cần bảo hành.'
          },
          {
            number: 2,
            title: 'Chọn nhóm lỗi và mô tả chi tiết',
            description: 'Lựa chọn nhóm lỗi tương ứng từ danh mục và nhập mô tả chi tiết hiện tượng sự cố kỹ thuật của sản phẩm.'
          },
          {
            number: 3,
            title: 'Tải ảnh và video thực tế',
            description: `Tải lên hình ảnh chụp rõ nét hoặc video thực tế thể hiện vị trí sự cố kỹ thuật (dung lượng tối đa ${MAX_WARRANTY_MEDIA_SIZE_MB}MB). Trường hợp thiếu mô tả hoặc hình ảnh minh chứng, hệ thống sẽ yêu cầu bổ sung trước khi chuyển sang thẩm định.`
          },
          {
            number: 4,
            title: 'Lựa chọn hình thức hỗ trợ',
            description: `Chọn hình thức: "Kỹ thuật viên đến kiểm tra tại nhà" hoặc "Gửi về trung tâm bảo hành". Phiếu sẽ được lưu ở trạng thái "Tiếp nhận - Chờ thẩm định" kèm lịch hẹn liên hệ dự kiến.`
          }
        ]
      },
      {
        id: 'lich-su-va-trang-thai-bao-hanh',
        title: '4. Theo dõi tiến trình tại mục "Lịch sử bảo hành"',
        paragraphs: [
          'Toàn bộ quá trình tiếp nhận và xử lý sự cố kỹ thuật được cập nhật minh bạch tại tab "Lịch sử bảo hành" qua các trạng thái sau:'
        ],
        table: {
          headers: ['Trạng thái phiếu', 'Mô tả tiến trình kỹ thuật'],
          rows: [
            ['Tiếp nhận - Chờ thẩm định', 'Phiếu bảo hành vừa được khởi tạo thành công, kèm lịch hẹn liên hệ dự kiến; chuyên viên kỹ thuật tiến hành kiểm tra mô tả và minh chứng.'],
            ['Đã tiếp nhận', 'Hồ sơ bảo hành hợp lệ đã được thẩm định và chấp thuận tiếp nhận xử lý.'],
            ['Đã xếp lịch kỹ thuật viên', 'Kỹ thuật viên chuyên trách đã được phân công và lên lịch hẹn hỗ trợ trực tiếp tại nhà khách hàng hoặc tiếp nhận tại trung tâm.'],
            ['Đang xử lý', 'Kỹ thuật viên đang tiến hành kiểm tra thực tế, thay thế linh kiện hoặc sửa chữa khắc phục sự cố.'],
            ['Đã hoàn tất bảo trì', 'Sản phẩm đã được sửa chữa hoàn chỉnh, nghiệm thu chất lượng và bàn giao lại cho khách hàng kèm biên bản kỹ thuật.']
          ]
        }
      },
      {
        id: 'lien-he-bao-hanh',
        title: '5. Kênh hỗ trợ kỹ thuật & Showroom',
        paragraphs: [
          `Đội ngũ kỹ thuật viên DCor sẵn sàng tiếp nhận và giải đáp thắc mắc của quý khách trong khung giờ làm việc ${WORKING_HOURS}:`
        ],
        listItems: [
          `Tổng đài Hotline kỹ thuật: ${HOTLINE}`,
          `Hòm thư điện tử hỗ trợ: ${EMAIL}`,
          `Địa chỉ Showroom & Trung tâm bảo hành: ${ADDRESS}`
        ]
      }
    ]
  },

  // ==========================================================================
  // 2. CHÍNH SÁCH ĐỔI TRẢ
  // ==========================================================================
  'doi-tra': {
    slug: 'doi-tra',
    title: 'Chính sách đổi trả sản phẩm',
    shortDesc: 'Quy định đổi trả trong thời hạn tối đa 7 ngày kể từ khi nhận hàng, áp dụng cơ chế duyệt trực tuyến hoặc giám định tại nhà minh bạch.',
    badge: 'Đổi trả minh bạch',
    lastUpdated: POLICY_LAST_UPDATED,
    sections: [
      {
        id: 'thoi-han-va-dieu-kien-doi-tra',
        title: '1. Thời hạn và điều kiện tiếp nhận đổi trả',
        paragraphs: [
          `Khách hàng có thể gửi yêu cầu đổi trả từ mục tài khoản khi đơn hàng ở trạng thái "Đã giao hàng thành công" và còn trong thời hạn đổi trả (tối đa ${MAX_RETURN_DAYS} ngày kể từ khi nhận hàng).`,
          'Hệ thống DCor chỉ hiển thị các đơn hàng còn trong hạn hợp lệ để khách hàng tạo yêu cầu. Nếu trong tài khoản không còn đơn hàng nào đủ điều kiện, giao diện sẽ hiển thị chi tiết chính sách thời hạn và hướng dẫn khách hàng liên hệ bộ phận Chăm sóc khách hàng (CSKH) để được giải đáp.'
        ],
        callout: {
          type: 'warning',
          title: 'Điều kiện đối với sản phẩm đổi trả',
          text: 'Sản phẩm đổi trả bắt buộc phải còn nguyên tem mác, không bị hư hại hoặc biến dạng do lỗi từ phía người dùng trong quá trình sử dụng.'
        }
      },
      {
        id: 'loai-hinh-va-ly-do-doi-tra',
        title: '2. Loại hình và lý do đổi trả',
        paragraphs: [
          'Khi tạo yêu cầu đổi trả, khách hàng có thể lựa chọn 1 trong 2 loại hình sau:',
          '• Đổi sản phẩm mới: Đổi sang sản phẩm mới cùng loại khi sản phẩm đã nhận phát sinh lỗi hư hỏng hoặc sai thông số.\n• Trả hàng và hoàn tiền: Hoàn trả sản phẩm về kho DCor và nhận lại tiền đã thanh toán.',
          'Các lý do gợi ý hợp lệ được hệ thống thiết lập sẵn bao gồm:'
        ],
        listItems: [
          'Lỗi kết cấu của nhà sản xuất (nứt gãy mối nối, cong vênh khung gỗ, lỗi phụ kiện cơ khí...).',
          'Giao sai màu sắc hoặc kích thước so với thông tin đơn hàng đã xác nhận.',
          'Trầy xước, móp méo hoặc rách bề mặt vật liệu do quá trình vận chuyển của đội ngũ giao nhận.'
        ]
      },
      {
        id: 'ho-so-va-phan-loai-tham-dinh',
        title: '3. Hồ sơ yêu cầu & Cơ chế phân loại thẩm định theo giá trị',
        paragraphs: [
          'Khi lập yêu cầu đổi trả trên website, khách hàng bắt buộc phải nhập mô tả chi tiết tình trạng sản phẩm và tải lên ít nhất 1 hình ảnh rõ nét, bao gồm hình ảnh chụp cận cảnh tem mác của sản phẩm.',
          `Nhằm xử lý nhanh chóng và chính xác, DCor phân loại quy trình thẩm định theo giá trị đơn hàng hoặc sản phẩm với ngưỡng ${formatVND(RETURN_INSPECTION_THRESHOLD)}:`
        ],
        steps: [
          {
            number: 1,
            title: `Đơn hoặc sản phẩm dưới ${formatVND(RETURN_INSPECTION_THRESHOLD)}: Thẩm định hồ sơ trực tuyến`,
            description: `Hồ sơ được thẩm định trực tuyến dựa trên hình ảnh và video minh chứng do khách hàng cung cấp. Thời gian phản hồi dự kiến trong vòng ${ONLINE_RETURN_REVIEW_HOURS} giờ với trạng thái ban đầu là "Chờ thẩm định hồ sơ trực tuyến" (hoặc "Chờ duyệt hồ sơ trực tuyến").`
          },
          {
            number: 2,
            title: `Đơn hoặc sản phẩm từ ${formatVND(RETURN_INSPECTION_THRESHOLD)} trở lên: Giám định kỹ thuật tại nhà`,
            description: 'Khách hàng chủ động chọn ngày và khung giờ thuận tiện để chuyên viên kỹ thuật DCor đến tận nhà giám định trực tiếp hiện trạng sản phẩm, trạng thái hiển thị là "Chờ kỹ thuật viên giám định tại nhà" (hoặc "Chờ kỹ thuật viên đến kiểm định tại nhà"). Quá trình giám định có lập biên bản chi tiết; trường hợp hư hỏng do va đập ngoại lực từ phía khách hàng sẽ bị từ chối tiếp nhận kèm biên bản và lý do rõ ràng.'
          }
        ]
      },
      {
        id: 'bang-trang-thai-doi-tra',
        title: '4. Bảng trạng thái theo dõi tiến trình đổi trả',
        paragraphs: [
          'Khách hàng theo dõi toàn bộ tiến trình xử lý tại trang chi tiết phiếu đổi trả trong tài khoản của mình. Chi tiết phiếu hiển thị đầy đủ: lý do đổi trả, ảnh đã gửi, thông tin kỹ thuật viên phụ trách (nếu có), biên bản giám định, lịch hẹn lấy hàng và số tiền dự kiến hoàn trả:',
          'Lưu ý: Để bảo mật thông tin, thao tác hủy yêu cầu đổi trả khi chưa hoàn tất bắt buộc phải xác thực bằng mã OTP gửi về số điện thoại.'
        ],
        table: {
          headers: ['Trạng thái hiển thị', 'Mô tả tiến trình xử lý'],
          rows: [
            ['Chờ duyệt hồ sơ trực tuyến', 'Đơn/sản phẩm dưới 50 triệu: hồ sơ đang được bộ phận chuyên môn thẩm định qua ảnh/video, phản hồi dự kiến trong 24 giờ.'],
            ['Chờ kỹ thuật viên đến kiểm định tại nhà', 'Đơn/sản phẩm từ 50 triệu trở lên: đã tiếp nhận lịch hẹn, chờ kỹ thuật viên đến tận nơi giám định thực tế và lập biên bản.'],
            ['Đã duyệt - Chờ lấy hàng', 'Yêu cầu đổi trả đủ điều kiện đã được phê duyệt; bộ phận vận chuyển sắp xếp lịch đến thu hồi sản phẩm.'],
            ['Đang thu hồi hàng về kho', 'Nhân viên giao nhận đang tiến hành vận chuyển sản phẩm đổi trả về kho DCor.'],
            ['Đã hoàn tất', 'Sản phẩm mới đã được giao thay thế hoặc thủ tục hoàn tiền đã hoàn thành toàn bộ cho khách hàng.'],
            ['Đã từ chối', 'Yêu cầu không đủ điều kiện (hư hỏng do ngoại lực từ người dùng, sai lệch tem mác); có biên bản và lý do từ chối cụ thể.'],
            ['Đã hủy', 'Khách hàng đã chủ động hủy bỏ yêu cầu đổi trả sau khi xác thực mã OTP thành công.']
          ]
        }
      }
    ]
  },

  // ==========================================================================
  // 3. CHÍNH SÁCH VẬN CHUYỂN
  // ==========================================================================
  'van-chuyen': {
    slug: 'van-chuyen',
    title: 'Chính sách vận chuyển & giao nhận',
    shortDesc: 'Biểu phí vận chuyển nội thành/liên tỉnh tại bước thanh toán, thời gian giao hàng dự kiến và dịch vụ lắp đặt tận nơi.',
    badge: 'Giao vận tận tâm',
    lastUpdated: POLICY_LAST_UPDATED,
    sections: [
      {
        id: 'phi-van-chuyen-noi-thanh-lien-tinh',
        title: '1. Phí vận chuyển nội thành và liên tỉnh',
        paragraphs: [
          'Phí vận chuyển tại DCor được tính toán linh hoạt dựa trên địa chỉ nhận hàng của quý khách, phân loại theo khu vực nội thành hoặc liên tỉnh.',
          'Số tiền phí vận chuyển được hệ thống tính tự động và hiển thị rõ ràng tại bảng xem lại đơn hàng ở bước Thanh toán (/checkout) sau khi quý khách nhập thông tin Tỉnh/Thành, Quận/Huyện, Phường/Xã từ dữ liệu hành chính chuẩn.'
        ],
        callout: {
          type: 'info',
          title: 'Tính phí minh bạch tại bước đặt hàng',
          text: 'Mức phí vận chuyển nội thành hoặc liên tỉnh được hiển thị công khai trước khi bấm nút đặt mua, đảm bảo minh bạch tuyệt đối và không phát sinh bất kỳ chi phí ẩn nào.'
        }
      },
      {
        id: 'thoi-gian-giao-hang-du-kien',
        title: '2. Thời gian giao hàng dự kiến',
        paragraphs: [
          'Sau khi hoàn tất quy trình đặt hàng, màn hình thông báo đặt hàng thành công sẽ hiển thị thời gian giao hàng dự kiến cụ thể cho đơn hàng của quý khách.',
          'Quý khách có thể theo dõi chi tiết lịch trình giao hàng thời gian thực tại trang "Đơn hàng của tôi" (/account/orders). Mọi sự thay đổi về tiến trình giao vận đều được hệ thống cập nhật đồng bộ để khách hàng chủ động thời gian đón tiếp nhân viên.'
        ]
      },
      {
        id: 'dich-vu-giao-va-lap-dat',
        title: '3. Dịch vụ giao hàng và lắp đặt tận nơi',
        paragraphs: [
          'Đối với các sản phẩm đồ nội thất, DCor thực hiện quy trình giao hàng kèm lắp đặt tận nhà chu đáo:',
          'Nhân viên giao nhận hỗ trợ bốc xếp sản phẩm vào đúng vị trí không gian quý khách mong muốn, thực hiện lắp ráp hoàn thiện, kiểm tra độ cân bằng vững chắc và bàn giao trực tiếp cho khách hàng.'
        ],
        steps: [
          {
            number: 1,
            title: 'Hỗ trợ bốc xếp đúng vị trí',
            description: 'Đưa sản phẩm vào đúng căn phòng và vị trí bài trí theo yêu cầu của quý khách.'
          },
          {
            number: 2,
            title: 'Lắp đặt và hoàn thiện',
            description: 'Lắp ráp chi tiết kết cấu, siết chặt ốc vít và cân chỉnh phụ kiện bảo đảm an toàn khi sử dụng.'
          },
          {
            number: 3,
            title: 'Bàn giao và nghiệm thu',
            description: 'Khách hàng cùng nhân viên kiểm tra ngoại quan sản phẩm trước khi ký nhận bàn giao.'
          }
        ]
      },
      {
        id: 'quy-trinh-xuat-kho-va-nhan-hang',
        title: '4. Vòng đời giao nhận & Lưu ý hủy đơn',
        paragraphs: [
          'Tiến trình vận chuyển đơn hàng được gắn kết chặt chẽ với trạng thái quản lý trên hệ thống DCor:'
        ],
        listItems: [
          'Giai đoạn Chờ đặt cọc, Chờ xác nhận hoặc Đang xử lý ban đầu (khi đơn hàng chưa xuất kho giao cho đơn vị vận chuyển): khách hàng có thể chủ động bấm Hủy đơn trực tiếp trên hệ thống.',
          'Giai đoạn Đã xuất kho hoặc Đang giao hàng: hệ thống khóa chức năng hủy đơn trực tiếp. Khi đó, quý khách vui lòng liên hệ bộ phận Chăm sóc khách hàng hoặc tiến hành thủ tục đổi trả sau khi nhận hàng.',
          'Khi nhân viên giao hàng và lắp đặt bàn giao xong, đối với đơn COD, khách hàng chuẩn bị tiền mặt để thanh toán cho nhân viên giao hàng; sau khi nhận hàng thành công, đơn sẽ chuyển sang trạng thái "Hoàn thành" và tự động sinh mã bảo hành điện tử.'
        ]
      }
    ]
  },

  // ==========================================================================
  // 4. CHÍNH SÁCH THANH TOÁN
  // ==========================================================================
  'thanh-toan': {
    slug: 'thanh-toan',
    title: 'Chính sách thanh toán & bảo mật',
    shortDesc: 'Áp dụng 2 phương thức thanh toán: COD và Chuyển khoản VietQR động; quy định đặt cọc 30% cho đơn giá trị cao trên 50.000.000 VNĐ.',
    badge: 'Thanh toán an toàn',
    lastUpdated: POLICY_LAST_UPDATED,
    sections: [
      {
        id: 'hai-phuong-thuc-thanh-toan',
        title: '1. Hai phương thức thanh toán chính thức',
        paragraphs: [
          'Nhằm đảm bảo an toàn giao dịch tối đa, hệ thống thương mại điện tử DCor hiện chỉ áp dụng duy nhất 2 phương thức thanh toán:'
        ],
        listItems: [
          'Thanh toán khi nhận hàng (COD): Đơn hàng có trạng thái thanh toán ban đầu là "Chưa thanh toán". Quý khách chuẩn bị tiền mặt để thanh toán trực tiếp cho nhân viên khi nhân viên giao hàng và lắp đặt hoàn thiện tại nhà.',
          'Chuyển khoản ngân hàng quét mã VietQR: Hệ thống tự động tạo mã QR động chứa đầy đủ thông tin: số tài khoản, tên chủ tài khoản, số tiền chính xác và nội dung chuyển khoản chứa mã đơn hàng. Sau khi ngân hàng xác nhận giao dịch thành công, trạng thái đơn sẽ tự động chuyển sang "Đã thanh toán".'
        ],
        callout: {
          type: 'info',
          title: 'Xử lý khi mã VietQR hết hạn hoặc hệ thống ngân hàng gián đoạn',
          text: 'Mỗi mã VietQR động có thời gian hiệu lực nhất định. Nếu mã hết hiệu lực, màn hình sẽ cung cấp nút "Tạo lại mã thanh toán" để quý khách lấy mã mới. Trường hợp hệ thống ngân hàng gián đoạn kết nối, quý khách có thể chuyển sang phương thức COD hoặc liên hệ tổng đài Hotline 1900 1234 để được đối soát kịp thời.'
        }
      },
      {
        id: 'don-hang-gia-tri-cao',
        title: '2. Quy định thanh toán cho đơn hàng giá trị cao',
        paragraphs: [
          `Đối với các đơn hàng có giá trị cao (trên ${formatVND(HIGH_VALUE_ORDER_THRESHOLD)}), hệ thống DCor tự động khóa phương thức thanh toán COD nhằm bảo đảm an toàn giao dịch.`,
          `Khách hàng bắt buộc phải thực hiện đặt cọc ${HIGH_VALUE_DEPOSIT_PERCENT}% tổng giá trị đơn hàng bằng phương thức chuyển khoản ngân hàng qua VietQR. Phần giá trị còn lại (70%) sẽ được thanh toán khi nhận hàng và lắp đặt hoàn tất.`
        ],
        callout: {
          type: 'warning',
          title: 'Khóa COD và quy định cọc 30%',
          text: `Đơn hàng trên ${formatVND(HIGH_VALUE_ORDER_THRESHOLD)} bị khóa COD và bắt buộc đặt cọc ${HIGH_VALUE_DEPOSIT_PERCENT}% bằng chuyển khoản. Sau khi thanh toán cọc thành công, đơn hàng sẽ có trạng thái thanh toán là "Đã thanh toán cọc"; số tiền còn lại thanh toán khi nhận hàng.`
        }
      },
      {
        id: 'thanh-toan-hang-custom',
        title: '3. Quy định đặt cọc cho hàng thiết kế riêng (Custom Furniture)',
        paragraphs: [
          `Đối với các sản phẩm sản xuất đo ni đóng giày theo yêu cầu (Custom Furniture), khách hàng cũng thực hiện đặt cọc (thông thường từ ${CUSTOM_DEPOSIT_RANGE} tổng giá trị) theo đúng báo giá và hợp đồng kinh tế đã thống nhất:`
        ],
        steps: [
          {
            number: 1,
            title: 'Xem bảng chi phí và dự thảo hợp đồng',
            description: `Khách hàng gửi yêu cầu và nhận báo giá trong vòng ${CUSTOM_QUOTE_RESPONSE_HOURS} giờ. Bảng báo giá thể hiện chi tiết chi phí gia công, vật liệu phát sinh, thời gian sản xuất và số tiền cọc. Quý khách đọc kỹ dự thảo hợp đồng điện tử về điều khoản bảo hành, tiến độ bàn giao, trách nhiệm hai bên và chính sách hoàn/hủy cọc.`
          },
          {
            number: 2,
            title: 'Ký hợp đồng và thanh toán cọc',
            description: 'Khách hàng có thể yêu cầu thay đổi báo giá hoặc ký hợp đồng điện tử bằng mã xác thực OTP, sau đó thực hiện thanh toán tiền cọc qua mã QR ngân hàng. Trạng thái yêu cầu chuyển sang "Đã cọc / Đang gia công".'
          },
          {
            number: 3,
            title: 'Bàn giao và thanh toán phần còn lại',
            description: 'Sau khi sản phẩm được giao và lắp đặt hoàn thiện tại công trình, khách hàng kiểm tra nghiệm thu thực tế và thanh toán phần giá trị còn lại theo hợp đồng.'
          }
        ]
      },
      {
        id: 'xuat-hoa-don-vat-dien-tu',
        title: '4. Yêu cầu xuất hóa đơn giá trị gia tăng (VAT) điện tử',
        paragraphs: [
          'DCor hỗ trợ xuất hóa đơn VAT điện tử hợp lệ cho mọi khách hàng cá nhân và doanh nghiệp có nhu cầu:'
        ],
        listItems: [
          'Tích chọn ô "Yêu cầu hóa đơn VAT điện tử" ngay tại bước Thanh toán (/checkout).',
          'Cung cấp đầy đủ và chính xác 4 trường thông tin bắt buộc: Tên doanh nghiệp, Mã số thuế, Địa chỉ công ty và Email nhận hóa đơn.',
          'Hệ thống tự động phát hành và gửi hóa đơn điện tử hợp lệ về địa chỉ email của quý khách sau khi đơn hàng được bàn giao hoàn thành.'
        ]
      },
      {
        id: 'bao-mat-va-chong-bam-dup',
        title: '5. An toàn giao dịch & Cơ chế chống bấm đúp',
        paragraphs: [
          'Hệ thống thanh toán của DCor tích hợp cơ chế chống bấm đúp (prevent double-click) khi quý khách bấm nút đặt hàng hoặc xác nhận thanh toán, ngăn chặn triệt để tình trạng tạo trùng đơn hàng hay gửi kép giao dịch.',
          'Nếu trong quá trình thanh toán, một sản phẩm trong giỏ bất ngờ hết hàng do khách hàng khác hoàn tất trước, hệ thống sẽ đưa ra thông báo tức thì và hướng dẫn quý khách cập nhật lại giỏ hàng một cách minh bạch.'
        ]
      }
    ]
  }
};
