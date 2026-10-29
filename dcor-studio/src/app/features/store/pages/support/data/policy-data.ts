import { ContentSection } from '../models/support.model';
import {
  HOTLINE,
  EMAIL,
  ADDRESS,
  WORKING_HOURS,
  AUTO_COMPLETE_DAYS,
  CODE_LOCK_THRESHOLD,
  CODE_LOCK_THRESHOLD_FORMATTED,
  DEPOSIT_PERCENT
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
  'bao-hanh': {
    slug: 'bao-hanh',
    title: 'Chính sách bảo hành sản phẩm',
    shortDesc: 'Cam kết chất lượng bền bỉ với thời hạn bảo hành minh bạch theo từng sản phẩm và dịch vụ hỗ trợ kỹ thuật tận nhà.',
    badge: 'Bảo hành chính hãng',
    lastUpdated: '15/10/2026',
    sections: [
      {
        id: 'thoi-han-bao-hanh',
        title: '1. Thời hạn bảo hành tính theo từng sản phẩm',
        paragraphs: [
          'Tại DCor, mỗi dòng sản phẩm nội thất đều sở hữu thời hạn bảo hành tiêu chuẩn riêng biệt, được niêm yết công khai và minh bạch ngay trên trang chi tiết sản phẩm và trong phiếu giao hàng điện tử.',
          'Thời gian bảo hành bắt đầu được tính kể từ ngày khách hàng ký biên bản bàn giao hoặc ngày đơn hàng chuyển sang trạng thái "Đã giao hàng" thành công trên hệ thống.'
        ],
        table: {
          headers: ['Danh mục sản phẩm', 'Thời hạn bảo hành', 'Phạm vi bảo hành chi tiết'],
          rows: [
            ['Khung sườn sofa gỗ sồi / gỗ tự nhiên', '36 tháng', 'Mối ghép mộng, chống mối mọt, nứt gãy kết cấu chịu lực'],
            ['Nệm mút sofa, lò xo đàn hồi', '24 tháng', 'Xẹp lún biến dạng vượt quá 15% bề dày quy chuẩn'],
            ['Vải bọc / Da bọc sofa', '12 tháng', 'Đường kim mũi chỉ, bong tróc nổ da tự nhiên không do ngoại lực'],
            ['Bàn ăn, ghế ăn, tủ kệ gỗ', '24 tháng', 'Bề mặt sơn phủ, cong vênh nứt tách tự nhiên, phụ kiện ray trượt'],
            ['Phụ kiện kim khí (bản lề, ray nâng piston)', '12 tháng', 'Lỗi kẹt cứng, gãy bản lề do lỗi gia công kỹ thuật']
          ]
        }
      },
      {
        id: 'dieu-kien-bao-hanh',
        title: '2. Điều kiện áp dụng bảo hành miễn phí',
        paragraphs: [
          'DCor cam kết tiếp nhận bảo hành và sửa chữa hoàn toàn miễn phí cho quý khách hàng khi sản phẩm thỏa mãn đầy đủ các điều kiện sau:'
        ],
        listItems: [
          'Sản phẩm còn trong thời hạn bảo hành hợp lệ và có thông tin đơn hàng lưu trữ trên hệ thống tài khoản DCor.',
          'Lỗi kỹ thuật xuất phát từ khâu sản xuất, gia công, lắp ráp hoặc lỗi nguyên vật liệu của nhà sản xuất.',
          'Khung gỗ bị cong vênh, co ngót, nứt nẻ hoặc mối mọt trong điều kiện sử dụng bình thường trong nhà.',
          'Sản phẩm được sử dụng đúng công năng, tải trọng cho phép và tuân thủ sách hướng dẫn bảo quản nội thất đi kèm.'
        ],
        callout: {
          type: 'tip',
          title: 'Tra cứu hạn bảo hành',
          text: 'Quý khách có thể vào mục "Tài khoản > Đơn hàng của tôi" để xem thời hạn bảo hành còn lại cho từng món đồ đã mua.'
        }
      },
      {
        id: 'truong-hop-khong-bao-hanh',
        title: '3. Các trường hợp từ chối bảo hành hoặc bảo hành tính phí',
        paragraphs: [
          'Để đảm bảo tính khách quan và công bằng, DCor không áp dụng chính sách bảo hành miễn phí đối với các trường hợp dưới đây (khách hàng có thể sử dụng dịch vụ sửa chữa có tính phí ưu đãi):'
        ],
        listItems: [
          'Sản phẩm đã hết thời hạn bảo hành theo quy định niêm yết.',
          'Hư hại do tác động ngoại lực, va đập mạnh làm móp méo, trầy xước, nứt vỡ trong quá trình quý khách tự di chuyển đồ đạc.',
          'Vết rách, thủng, ố màu do vật sắc nhọn, hóa chất tẩy rửa có tính axit mạnh, tàn thuốc lá hoặc do vật nuôi cào cắn.',
          'Để sản phẩm ở môi trường ẩm ướt kéo dài gây mốc hoặc tiếp xúc trực tiếp dưới ánh nắng mặt trời gay gắt gây nứt gỗ.',
          'Khách hàng tự ý tháo rời phụ kiện, sửa chữa kết cấu hoặc giao cho bên thứ ba can thiệp mà không có sự đồng ý của DCor.',
          'Hao mòn tự nhiên theo thời gian sử dụng thông thường (vải sờn nhẹ, màu da sẫm tự nhiên theo mồ hôi).'
        ]
      },
      {
        id: 'huong-dan-yeu-cau-bao-hanh',
        title: '4. Cách gửi yêu cầu bảo hành nhanh trong tài khoản',
        paragraphs: [
          'Quý khách không cần giữ hóa đơn giấy cồng kềnh. Toàn bộ quy trình yêu cầu bảo hành được số hóa 100% ngay trong tài khoản thành viên DCor:'
        ],
        steps: [
          {
            number: 1,
            title: 'Chọn sản phẩm cần bảo hành',
            description: 'Đăng nhập vào tài khoản DCor, truy cập trang "Đơn hàng của tôi" và bấm nút "Yêu cầu bảo hành" bên cạnh sản phẩm còn hạn.'
          },
          {
            number: 2,
            title: 'Mô tả chi tiết sự cố',
            description: 'Mô tả hiện tượng lỗi gặp phải (ví dụ: ray ngăn kéo bị kẹt, chân bàn cập kê, nệm sofa lún một bên).'
          },
          {
            number: 3,
            title: 'Lựa chọn hình thức kiểm tra',
            description: `Chọn "Kiểm tra tại nhà" (áp dụng tại nội thành TP.HCM) hoặc "Mang đến Showroom DCor" tại địa chỉ ${ADDRESS}.`
          },
          {
            number: 4,
            title: 'Đính kèm ảnh và video minh chứng',
            description: 'Tải lên tối thiểu 2 hình ảnh rõ nét và 1 video ngắn quay trực tiếp vị trí lỗi để kỹ thuật viên chuẩn bị trước linh kiện thay thế.'
          }
        ]
      },
      {
        id: 'quy-trinh-xu-ly-ky-thuat',
        title: '5. Các bước xử lý kỹ thuật và sửa chữa tại DCor',
        paragraphs: [
          'Mỗi yêu cầu bảo hành được vận hành theo quy trình 4 giai đoạn chuẩn mực, đảm bảo giải quyết dứt điểm sự cố trong thời gian sớm nhất:'
        ],
        steps: [
          {
            number: 1,
            title: 'Tiếp nhận yêu cầu (Trong 24 giờ)',
            description: 'Bộ phận CSKH kiểm tra dữ liệu đơn hàng và liên hệ qua điện thoại xác nhận tình trạng sơ bộ cùng quý khách.'
          },
          {
            number: 2,
            title: 'Phân công kỹ thuật viên',
            description: 'Điều phối kỹ thuật viên chuyên trách khu vực hẹn lịch đến kiểm tra trực tiếp tại nhà theo khung giờ thuận tiện của quý khách.'
          },
          {
            number: 3,
            title: 'Đang kiểm tra và Sửa chữa',
            description: 'Kỹ thuật viên khắc phục lỗi tại chỗ. Với các lỗi khung sườn phức tạp cần máy móc xưởng, DCor sẽ vận chuyển miễn phí về xưởng (thời gian từ 3 - 7 ngày).'
          },
          {
            number: 4,
            title: 'Hoàn tất và Ký biên bản bàn giao',
            description: 'Kiểm tra độ hoàn thiện, nghiệm thu cùng khách hàng và cập nhật trạng thái "Hoàn tất" trên cổng thông tin tài khoản.'
          }
        ]
      },
      {
        id: 'gia-han-bao-hanh',
        title: '6. Chính sách gia hạn bảo hành và dịch vụ bảo dưỡng',
        paragraphs: [
          'Sau khi thời hạn bảo hành tiêu chuẩn kết thúc, DCor cung cấp các gói dịch vụ gia hạn và bảo dưỡng trọn đời nhằm giữ cho nội thất của quý khách luôn sáng bóng như mới:',
          'Gói gia hạn bảo hành 12 tháng hoặc 24 tháng cho khung sườn gỗ tự nhiên với mức chi phí ưu đãi chỉ từ 5% - 8% giá trị ban đầu của sản phẩm.'
        ],
        listItems: [
          'Dịch vụ vệ sinh công nghiệp cho nệm sofa da/vải nỉ định kỳ 6 tháng/lần.',
          'Dịch vụ lau dầu dưỡng gỗ chuyên dụng, làm mới lớp vecni/sơn mờ cho mặt bàn ăn và kệ tủ.',
          'Thay thế linh kiện kim khí, bản lề chậm chấn, tay nắm chính hãng với giá gốc xuất xưởng.'
        ]
      },
      {
        id: 'lien-he-ky-thuat',
        title: '7. Kênh liên hệ và hỗ trợ khẩn cấp',
        paragraphs: [
          `Đội ngũ kỹ thuật viên DCor luôn sẵn sàng lắng nghe và giải đáp mọi vấn đề kỹ thuật của quý khách trong khung giờ làm việc ${WORKING_HOURS}:`
        ],
        listItems: [
          `Hotline kỹ thuật: ${HOTLINE} (Phím 2 để gặp Bộ phận Kỹ thuật & Bảo hành)`,
          `Email tiếp nhận hồ sơ: ${EMAIL}`,
          `Địa chỉ Trung tâm bảo hành & Showroom: ${ADDRESS}`
        ]
      }
    ]
  },
  'doi-tra': {
    slug: 'doi-tra',
    title: 'Chính sách đổi trả & hoàn tiền',
    shortDesc: 'Quy định minh bạch về điều kiện đổi mới sản phẩm, thời hạn gửi yêu cầu và các bước xử lý thu hồi hoàn tiền.',
    badge: 'Đổi trả an tâm',
    lastUpdated: '15/10/2026',
    sections: [
      {
        id: 'thoi-han-yeu-cau-doi-tra',
        title: `1. Thời hạn gửi yêu cầu đổi trả (${AUTO_COMPLETE_DAYS} ngày)`,
        paragraphs: [
          'Nhằm mang lại trải nghiệm mua sắm an tâm tuyệt đối, DCor áp dụng chính sách đổi trả sản phẩm linh hoạt ngay sau khi giao hàng thành công.',
          `Quý khách chỉ có thể gửi yêu cầu đổi trả khi đơn hàng đã được giao thành công và chưa chuyển sang trạng thái "Hoàn tất".`
        ],
        callout: {
          type: 'warning',
          title: `Cơ chế tự động hoàn tất sau ${AUTO_COMPLETE_DAYS} ngày`,
          text: `Hệ thống DCor sẽ TỰ ĐỘNG chuyển trạng thái đơn hàng sang "Hoàn tất" sau đúng ${AUTO_COMPLETE_DAYS} ngày kể từ thời điểm giao hàng nếu khách hàng không bấm nút "Đã nhận hàng" và không gửi yêu cầu đổi trả/khiếu nại. Khi đơn đã "Hoàn tất", hệ thống sẽ khóa tính năng gửi yêu cầu đổi trả và áp dụng theo quy chế bảo hành tiêu chuẩn.`
        }
      },
      {
        id: 'truong-hop-duoc-doi-tra',
        title: '2. Các trường hợp được chấp thuận đổi mới hoặc hoàn tiền',
        paragraphs: [
          'DCor tiếp nhận đổi mới sản phẩm cùng loại 100% hoặc hoàn tiền toàn bộ giá trị đơn hàng trong các trường hợp sau đây:'
        ],
        listItems: [
          'Giao sai sản phẩm, sai kích thước, sai màu sắc hoặc sai chất liệu so với đơn đặt hàng đã xác nhận.',
          'Sản phẩm bị lỗi kỹ thuật cấu trúc nghiêm trọng do nhà sản xuất (nứt gãy khung gỗ, mối mộng bung rời, lệch ray cơ học).',
          'Sản phẩm bị trầy xước, bong tróc màng sơn, rách da/vải do lỗi vận chuyển của đội ngũ giao vận DCor.',
          'Đổi theo nhu cầu cá nhân (chỉ áp dụng cho sản phẩm tiêu chuẩn còn nguyên kiện, chưa sử dụng, chưa lắp ráp, khách hàng thanh toán chi phí vận chuyển phát sinh hai chiều).'
        ]
      },
      {
        id: 'truong-hop-khong-duoc-doi-tra',
        title: '3. Các trường hợp không áp dụng đổi trả',
        paragraphs: [
          'DCor xin phép từ chối giải quyết đổi trả đối với những trường hợp sau:'
        ],
        listItems: [
          'Sản phẩm đặt làm riêng theo yêu cầu (Custom Furniture) theo bản vẽ kích thước, chất liệu riêng biệt của khách hàng.',
          'Sản phẩm thuộc diện thanh lý hàng mẫu xả kho, quà tặng khuyến mãi không có giá trị thương mại.',
          'Sản phẩm đã qua sử dụng, có mùi nước hoa/mùi lạ, dính bẩn thức ăn, chất lỏng hoặc đã bị tháo ốc vít.',
          `Yêu cầu đổi trả được gửi sau thời hạn ${AUTO_COMPLETE_DAYS} ngày hoặc đơn hàng đã ở trạng thái "Hoàn tất".`,
          'Không cung cấp được hình ảnh hoặc video chứng minh rõ ràng tình trạng hư hỏng ban đầu.'
        ]
      },
      {
        id: 'ho-so-can-co',
        title: '4. Bộ hồ sơ và minh chứng cần chuẩn bị',
        paragraphs: [
          'Để quy trình thẩm định diễn ra nhanh chóng, khi gửi yêu cầu đổi trả trên hệ thống website, quý khách cần cung cấp đầy đủ các thông tin sau:'
        ],
        listItems: [
          'Mã số đơn hàng (Order ID) và tên sản phẩm cụ thể cần đổi trả.',
          'Lý do đổi trả chi tiết được chọn từ menu gợi ý (Giao sai mẫu, Lỗi sản xuất, Vận chuyển trầy xước, Đổi ý).',
          'Tối thiểu 3 hình ảnh chụp rõ nét: Ảnh chụp toàn cảnh món đồ, ảnh cận cảnh chi tiết bị lỗi, và ảnh chụp tem mác/phiếu giao nhận.',
          '1 đoạn video ngắn quay cận cảnh quá trình phát hiện lỗi hoặc video khui kiện hàng (unbox).'
        ]
      },
      {
        id: 'quy-trinh-doi-tra',
        title: '5. Quy trình 6 bước xử lý thu hồi và đổi sản phẩm mới',
        paragraphs: [
          'Quy trình đổi trả tại DCor được kiểm soát chặt chẽ qua hệ sinh thái công nghệ, đảm bảo quyền lợi cao nhất cho người mua:'
        ],
        steps: [
          {
            number: 1,
            title: 'Khách hàng gửi yêu cầu',
            description: 'Gửi yêu cầu trực tuyến trong mục "Tài khoản > Đơn hàng của tôi" kèm lý do và ảnh minh chứng.'
          },
          {
            number: 2,
            title: 'Quản trị kiểm tra hồ sơ',
            description: 'Đội ngũ kiểm soát chất lượng DCor đối chiếu với camera khâu đóng gói xuất kho để xác thực tính khách quan.'
          },
          {
            number: 3,
            title: 'Tư vấn liên hệ xác nhận',
            description: 'Nhân viên chăm sóc khách hàng gọi điện thông báo chấp thuận hoặc giải thích lý do, thống nhất thời gian thu hồi.'
          },
          {
            number: 4,
            title: 'Thu hồi sản phẩm tận nhà',
            description: 'Xe vận chuyển DCor đến tận nơi nhận lại sản phẩm theo lịch hẹn, bàn giao biên bản thu hồi cho quý khách.'
          },
          {
            number: 5,
            title: 'Nhập kho và thẩm định thực tế',
            description: 'Bộ phận kho tiếp nhận, kiểm tra hiện trạng sản phẩm thu hồi để kích hoạt lệnh giao bù hoặc hoàn tiền.'
          },
          {
            number: 6,
            title: 'Giao sản phẩm mới hoặc Hoàn tất',
            description: 'Giao sản phẩm mới thay thế 100% hoặc hoàn tiền về tài khoản ngân hàng của quý khách.'
          }
        ]
      },
      {
        id: 'theo-doi-trang-thai-doi-tra',
        title: '6. Theo dõi tiến trình trạng thái yêu cầu đổi trả',
        paragraphs: [
          'Quý khách có thể kiểm tra trạng thái xử lý yêu cầu đổi trả bất cứ lúc nào trong trang cá nhân:',
          'Các trạng thái hiển thị rõ ràng trên hệ thống bao gồm:'
        ],
        listItems: [
          'Chờ duyệt (Pending): Yêu cầu vừa được khởi tạo, đang chờ ban quản trị xem xét trong tối đa 12 giờ làm việc.',
          'Đã duyệt (Approved): Yêu cầu được chấp thuận; nhân viên chuẩn bị điều phối xe thu hồi hàng hoặc gửi sản phẩm đổi mới.',
          'Từ chối (Rejected): Yêu cầu không thỏa mãn điều kiện quy định. DCor luôn đính kèm văn bản và hình ảnh giải thích cụ thể lý do từ chối.',
          'Hoàn tất (Completed): Sản phẩm mới đã được giao tận tay quý khách hoặc số tiền hoàn đã được chuyển khoản thành công.'
        ]
      }
    ]
  },
  'van-chuyen': {
    slug: 'van-chuyen',
    title: 'Chính sách vận chuyển & giao nhận',
    shortDesc: 'Dịch vụ giao vận chuyên nghiệp, hỗ trợ bốc xếp tận phòng và lắp đặt hoàn thiện đồ gỗ nội thất lớn trên toàn quốc.',
    badge: 'Giao vận tận tâm',
    lastUpdated: '15/10/2026',
    sections: [
      {
        id: 'pham-vi-va-phi-van-chuyen',
        title: '1. Phạm vi phục vụ và biểu phí giao hàng',
        paragraphs: [
          'DCor cung cấp dịch vụ giao nhận đồ nội thất trên phạm vi toàn quốc (63 tỉnh thành). Chúng tôi áp dụng thuật toán tính phí vận chuyển tự động, chính xác và minh bạch ngay tại bước thanh toán.',
          'Phí vận chuyển được tính căn cứ theo khoảng cách km từ kho tổng TP.HCM, trọng lượng và thể tích khối của sản phẩm.'
        ],
        listItems: [
          'Khu vực nội thành TP. Hồ Chí Minh: Miễn phí vận chuyển cho các đơn hàng đạt hạn mức ưu đãi từ 10.000.000đ trở lên.',
          'Khu vực ngoại thành & các tỉnh lân cận (Bình Dương, Đồng Nai, Long An): Phí vận chuyển ưu đãi chỉ từ 150.000đ - 350.000đ.',
          'Các tỉnh thành miền Trung và miền Bắc: Vận chuyển qua xe chuyên dụng liên tỉnh với biểu phí cố định theo mét khối, cam kết không phát sinh chi phí trung gian.'
        ]
      },
      {
        id: 'don-vi-va-nhan-vien-giao-hang',
        title: '2. Đội ngũ nhân viên và đơn vị vận chuyển chuyên trách',
        paragraphs: [
          'Đồ gỗ nội thất là mặt hàng giá trị cao và dễ bị tổn thương nếu không được bảo quản đúng cách trong quá trình di chuyển. Vì vậy, DCor trực tiếp xây dựng đội ngũ vận tải riêng biệt:',
          'Tại khu vực trọng điểm, nhân viên vận chuyển chính là các kỹ thuật viên lắp ráp lành nghề của DCor, mặc đồng phục, đeo thẻ nhân viên và được trang bị bộ dụng cụ lắp ráp chuyên nghiệp.'
        ],
        listItems: [
          'Xe tải thùng kín chuyên dụng có đệm xốp lót sàn và dây ràng cố định hàng hóa chống va đập.',
          'Hàng hóa được bọc 5 lớp bảo vệ: Màng PE chống nước, màng xốp bong bóng chống sốc, xốp góc cạnh 4 chiều, bìa carton dày và màng co quấn chặt.',
          'Đối với tuyến giao xa, DCor hợp tác với các đơn vị chuyển phát uy tín có cam kết bảo hiểm hàng hóa 100% (Viettel Post, Nhất Tín Logistics).'
        ]
      },
      {
        id: 'giao-va-lap-dat-noi-that-lon',
        title: '3. Giao hàng và lắp đặt hoàn thiện đối với đồ nội thất lớn',
        paragraphs: [
          'Một trong những giá trị dịch vụ khác biệt lớn nhất tại DCor là chính sách hỗ trợ giao hàng và lắp đặt trọn gói tận phòng:',
          'Đối với các sản phẩm kích thước lớn (như Sofa góc, Giường ngủ 1m8, Bàn ăn nguyên khối, Tủ quần áo cánh lùa):'
        ],
        steps: [
          {
            number: 1,
            title: 'Hỗ trợ bốc xếp lên tầng',
            description: 'Đội ngũ giao hàng chủ động hỗ trợ bê vác lên thang máy hoặc thang bộ nhà phố đến đúng phòng quý khách chỉ định.'
          },
          {
            number: 2,
            title: 'Lắp ráp hoàn chỉnh tại chỗ',
            description: 'Tiến hành siết ốc vít kết cấu, cân chỉnh chân tăng giảm để đồ nội thất không bị bấp bênh trên sàn nhà.'
          },
          {
            number: 3,
            title: 'Vệ sinh và thu dọn hiện trường',
            description: 'Lau sạch bụi bề mặt gỗ, thu gom toàn bộ bao bì carton, xốp bảo vệ và rác thải đóng gói mang về, trả lại không gian sạch sẽ cho quý khách.'
          }
        ]
      },
      {
        id: 'theo-doi-tien-trinh-giao-hang',
        title: '4. Theo dõi tiến trình đơn hàng thời gian thực',
        paragraphs: [
          'Quý khách luôn nắm rõ đơn hàng của mình đang ở đâu thông qua hệ thống cập nhật tiến trình tự động:',
          'Mỗi khi đơn hàng chuyển giao cho tài xế xuất kho, hệ thống sẽ gửi tin nhắn SMS kèm họ tên tài xế, số điện thoại liên lạc và khung giờ giao dự kiến.'
        ],
        callout: {
          type: 'info',
          title: 'Tra cứu trực tuyến',
          text: 'Chỉ cần vào mục "Đơn hàng của tôi", quý khách có thể xem thời gian thực trạng thái xe giao hàng và bản đồ định vị đơn hàng.'
        }
      },
      {
        id: 'kiem-tra-hang-khi-nhan',
        title: '5. Quy định kiểm tra hàng hóa khi nhận (Đồng kiểm)',
        paragraphs: [
          'DCor khuyến khích tất cả khách hàng thực hiện đồng kiểm trực tiếp cùng nhân viên giao vận trước khi ký tên vào Biên bản bàn giao:',
          'Các tiêu chí kiểm tra cơ bản:'
        ],
        listItems: [
          'Kiểm tra tình trạng bao bì bên ngoài xem có rách thủng hay ướt nước bất thường không.',
          'Kiểm tra màu sắc, mẫu mã sản phẩm đúng với thông tin đặt trên website.',
          'Kiểm tra bề mặt gỗ không bị trầy xước, nứt nẻ; đường may nỉ/da căng đều, không đứt chỉ.',
          'Thử nghiệm độ vững chắc và đóng mở êm ái của các ngăn kéo, cánh cửa tủ.'
        ]
      },
      {
        id: 'xac-nhan-da-nhan-hang',
        title: `6. Xác nhận 'Đã nhận hàng' và cơ chế tự hoàn tất sau ${AUTO_COMPLETE_DAYS} ngày`,
        paragraphs: [
          'Sau khi kiểm tra hài lòng và nhận sản phẩm hoàn thiện, quý khách đăng nhập website và bấm nút "Đã nhận hàng" trong chi tiết đơn hàng.',
          `Trường hợp quý khách quên thao tác: Hệ thống DCor sẽ TỰ ĐỘNG hoàn tất đơn hàng sau đúng ${AUTO_COMPLETE_DAYS} ngày kể từ thời điểm nhân viên bàn giao thành công. Khi đơn đã hoàn tất, thời hạn bảo hành chính thức sẽ bắt đầu được đếm ngược trên hệ thống.`
        ]
      },
      {
        id: 'xu-ly-giao-that-bai',
        title: '7. Xử lý sự cố khi giao hàng không thành công',
        paragraphs: [
          'Nếu nhân viên giao hàng không thể liên hệ được với quý khách tại thời điểm giao:'
        ],
        listItems: [
          'Tài xế sẽ gọi lại tối thiểu 3 lần trong khoảng cách 15 phút. Nếu vẫn không liên lạc được, đơn hàng sẽ được chuyển về lưu tạm tại bưu cục gần nhất.',
          'Bộ phận CSKH sẽ liên hệ lại với quý khách để sắp xếp lịch hẹn giao lần 2 hoàn toàn miễn phí.',
          'DCor hỗ trợ giữ hàng lưu kho tối đa 3 ngày làm việc. Quá thời hạn trên mà không thể bàn giao do lý do từ phía người nhận, đơn hàng sẽ được hoàn về kho tổng TP.HCM.'
        ]
      }
    ]
  },
  'thanh-toan': {
    slug: 'thanh-toan',
    title: 'Chính sách thanh toán & bảo mật',
    shortDesc: 'Phương thức thanh toán an toàn, quy định đặt cọc đơn hàng giá trị cao và quy trình xuất hóa đơn GTGT hợp lệ.',
    badge: 'Thanh toán bảo mật',
    lastUpdated: '15/10/2026',
    sections: [
      {
        id: 'phuong-thuc-thanh-toan',
        title: '1. Các phương thức thanh toán linh hoạt được hỗ trợ',
        paragraphs: [
          'DCor tích hợp đa dạng các cổng thanh toán số hiện đại nhất hiện nay nhằm tạo sự tiện lợi tối đa cho quý khách hàng:',
          'Mọi giao dịch đều được ghi nhận bằng biên lai điện tử và gửi thông báo xác nhận qua Email/SMS tức thì.'
        ],
        listItems: [
          'Thanh toán tiền mặt khi nhận hàng (COD): Quý khách thanh toán trực tiếp cho nhân viên giao vận sau khi kiểm tra hàng hóa.',
          'Chuyển khoản ngân hàng qua mã VietQR thông minh: Quét mã QR thanh toán nhanh chóng qua ứng dụng ngân hàng di động, tự động xác nhận đơn trong 30 giây.',
          'Thẻ ATM nội địa (Napas): Hỗ trợ kết nối internet banking của hơn 40 ngân hàng thương mại tại Việt Nam.',
          'Thẻ tín dụng / Thẻ ghi nợ quốc tế: Visa, MasterCard, JCB với lớp bảo mật xác thực OTP 3D-Secure.',
          'Ví điện tử phổ biến: MoMo, ZaloPay, VNPay-QR.'
        ]
      },
      {
        id: 'han-muc-don-hang-lon',
        title: `2. Đơn hàng trên ${CODE_LOCK_THRESHOLD_FORMATTED}: Quy định thanh toán online & đặt cọc`,
        paragraphs: [
          `Để đảm bảo an toàn giao dịch cho các mặt hàng nội thất cao cấp có giá trị lớn, DCor áp dụng quy định hạn mức đơn hàng (CODE_LOCK_THRESHOLD = ${CODE_LOCK_THRESHOLD_FORMATTED}):`,
          `Với bất kỳ đơn hàng nào có tổng giá trị từ ${CODE_LOCK_THRESHOLD_FORMATTED} (${CODE_LOCK_THRESHOLD} VNĐ) trở lên:`
        ],
        callout: {
          type: 'warning',
          title: `Chỉ áp dụng thanh toán online và đặt cọc ${DEPOSIT_PERCENT}%`,
          text: `Hệ thống sẽ tự động khóa phương thức thanh toán tiền mặt (COD). Quý khách cần thanh toán trực tuyến số tiền đặt cọc tối thiểu là ${DEPOSIT_PERCENT}% giá trị đơn hàng thông qua chuyển khoản QR, thẻ ngân hàng hoặc ví điện tử. Số tiền ${100 - DEPOSIT_PERCENT}% còn lại sẽ được thanh toán sau khi hàng được bàn giao và lắp đặt hoàn thiện tại nhà.`
        }
      },
      {
        id: 'thanh-toan-don-custom',
        title: '3. Quy định thanh toán cho đơn hàng thiết kế riêng (Custom Furniture)',
        paragraphs: [
          'Đối với các sản phẩm được gia công sản xuất theo bản vẽ thiết kế hoặc kích thước phi tiêu chuẩn của khách hàng, tiến độ thanh toán được thực hiện theo 2 giai đoạn quy định trong Hợp đồng kinh tế:'
        ],
        steps: [
          {
            number: 1,
            title: `Đặt cọc sản xuất (${DEPOSIT_PERCENT}% giá trị hợp đồng)`,
            description: `Khách hàng tiến hành thanh toán đặt cọc ${DEPOSIT_PERCENT}% ngay sau khi hai bên ký biên bản chốt bản vẽ thiết kế 3D và phụ lục vật tư để xưởng bắt đầu quy trình chế tác.`
          },
          {
            number: 2,
            title: `Tất toán phần còn lại (${100 - DEPOSIT_PERCENT}%)`,
            description: `Thanh toán số tiền ${100 - DEPOSIT_PERCENT}% còn lại ngay sau khi sản phẩm được đội ngũ DCor vận chuyển, lắp đặt hoàn thiện và hai bên cùng ký vào Biên bản nghiệm thu sản phẩm đạt chuẩn.`
          }
        ]
      },
      {
        id: 'xuat-hoa-don-vat',
        title: '4. Chính sách xuất hóa đơn giá trị gia tăng (VAT)',
        paragraphs: [
          'Tất cả giá bán sản phẩm niêm yết trên website DCor đã bao gồm thuế Giá trị gia tăng (VAT) theo quy định hiện hành của pháp luật Việt Nam.',
          'Đối với khách hàng là cơ quan, doanh nghiệp cần xuất hóa đơn tài chính GTGT:'
        ],
        listItems: [
          'Quý khách vui lòng tích chọn ô "Yêu cầu xuất hóa đơn công ty (VAT)" tại bước thanh toán đơn hàng.',
          'Điền đầy đủ: Tên công ty, Mã số thuế doanh nghiệp, Địa chỉ trụ sở ghi trên Giấy phép ĐKKD và Email nhận hóa đơn điện tử.',
          'DCor phát hành Hóa đơn điện tử hợp lệ (có chữ ký số của Tổng cục Thuế) gửi về email của quý khách trong vòng 2 - 3 ngày làm việc sau khi đơn hàng được giao thành công.'
        ]
      },
      {
        id: 'chinh-sach-hoan-tien',
        title: '5. Quy định và thời hạn xử lý hoàn tiền',
        paragraphs: [
          'Trong trường hợp đơn hàng bị hủy hợp lệ trước khi vận chuyển hoặc đơn hàng đổi trả được duyệt hoàn tiền, DCor cam kết hoàn trả 100% số tiền tương ứng cho quý khách theo đúng kênh thanh toán ban đầu:'
        ],
        table: {
          headers: ['Phương thức thanh toán ban đầu', 'Thời gian hoàn tiền dự kiến', 'Hình thức nhận tiền'],
          rows: [
            ['Chuyển khoản ngân hàng / VietQR', '24 - 48 giờ làm việc', 'Chuyển khoản về đúng số tài khoản chuyển tiền'],
            ['Ví điện tử MoMo / ZaloPay', '24 giờ làm việc', 'Hoàn trực tiếp về số dư ví điện tử'],
            ['Thẻ ATM nội địa (Napas)', '3 - 5 ngày làm việc', 'Hoàn về tài khoản thẻ của ngân hàng phát hành'],
            ['Thẻ tín dụng quốc tế (Visa/Mastercard)', '5 - 15 ngày làm việc', 'Ghi có vào sao kê thẻ tín dụng kỳ tiếp theo']
          ]
        }
      },
      {
        id: 'bao-mat-thanh-toan',
        title: '6. Tiêu chuẩn bảo mật thông tin thanh toán tuyệt đối',
        paragraphs: [
          'An toàn bảo mật thông tin tài chính của khách hàng là nguyên tắc số 1 tại DCor:',
          'Toàn bộ kết nối giữa trình duyệt của quý khách và máy chủ DCor đều được mã hóa bằng chứng chỉ bảo mật SSL 256-bit cao cấp nhất.'
        ],
        listItems: [
          'DCor TUYỆT ĐỐI KHÔNG lưu trữ số thẻ ngân hàng, ngày hết hạn hay mã bảo mật CVV/CVC của quý khách trên hệ thống cơ sở dữ liệu.',
          'Mọi giao dịch thẻ tín dụng và thẻ quốc tế đều được xử lý qua Cổng thanh toán trung gian đạt tiêu chuẩn An ninh dữ liệu thẻ thanh toán quốc tế PCI DSS (Payment Card Industry Data Security Standard) Cấp độ 1.',
          'Cơ chế bảo vệ 3D-Secure gửi mã OTP riêng biệt về số điện thoại đăng ký ngân hàng trước khi tiền được trừ khỏi tài khoản.'
        ]
      }
    ]
  }
};

