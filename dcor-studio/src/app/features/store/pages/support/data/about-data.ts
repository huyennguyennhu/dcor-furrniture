import { ContentSection } from '../models/support.model';
import {
  HOTLINE,
  EMAIL,
  ADDRESS,
  WORKING_HOURS,
  AUTO_COMPLETE_DAYS
} from '../support-config';

export const ABOUT_SECTIONS: ContentSection[] = [
  {
    id: 'cau-chuyen-thuong-hieu',
    title: '1. Câu chuyện thương hiệu: DCor - Design Your Core',
    paragraphs: [
      'DCor được sinh ra từ một niềm trăn trở giản dị nhưng sâu sắc: Giữa nhịp sống đô thị hối hả và xô bồ, đâu là chốn bình yên đích thực để mỗi con người tìm về, tái tạo năng lượng và gắn kết yêu thương? Câu trả lời chính là ngôi nhà.',
      'Tên gọi DCor là chữ viết tắt của triết lý "Design Your Core" - Thiết kế nên phần cốt lõi của không gian sống. Chúng tôi tin rằng đồ nội thất không đơn thuần là những vật dụng vô tri, mà là linh hồn thổi vào từng góc nhà sự ấm áp, là chứng nhân cho những khoảnh khắc sum vầy của các thế hệ gia đình Việt.',
      'Khởi nguồn từ một xưởng mộc chế tác thủ công quy mô nhỏ với những người thợ lành nghề yêu gỗ tự nhiên, DCor đã từng bước phát triển thành thương hiệu nội thất hiện đại, nơi kết hợp nhuần nhuyễn giữa kỹ nghệ mộng gỗ truyền thống và công nghệ gia công CNC chính xác chuẩn xác từng milimet.'
    ],
    callout: {
      type: 'tip',
      title: 'Triết lý tuyển chọn nguyên vật liệu',
      text: 'Toàn bộ gỗ sồi tự nhiên Bắc Mỹ, gỗ óc chó và gỗ tần bì sử dụng tại DCor đều có chứng nhận xuất xứ rừng trồng bền vững (FSC). Chúng tôi chỉ dùng các dòng sơn lót và sơn phủ gốc nước không chứa chì, không phát thải formaldehyd, đảm bảo an toàn tuyệt đối cho sức khỏe của trẻ nhỏ và người cao tuổi.'
    }
  },
  {
    id: 'gia-tri-cot-loi',
    title: '2. 4 Giá trị cốt lõi định hình nên DCor',
    paragraphs: [
      'Trải qua hành trình bền bỉ kiến tạo không gian sống cho hàng chục ngàn gia đình trên khắp Việt Nam, 4 giá trị cốt lõi luôn là kim chỉ nam cho mọi quyết định của chúng tôi:'
    ],
    steps: [
      {
        number: 1,
        title: 'Tinh xảo trong từng đường nét (Craftsmanship)',
        description: 'Tôn trọng vẻ đẹp tự nhiên của từng thớ gỗ. Mỗi góc cạnh bàn, tay vịn sofa đều được mài nhẵn thủ công qua 4 cấp độ ráp mịn, tạo nên xúc cảm chạm êm ái và an toàn tối đa khi tiếp xúc.'
      },
      {
        number: 2,
        title: 'Bền vững cùng thời gian (Sustainability)',
        description: 'Nói không với vật liệu kém bền hay kiểu dáng chạy theo xu hướng ngắn hạn. Đồ nội thất DCor được thiết kế với độ bền kết cấu từ 10 - 20 năm, mang vẻ đẹp tối giản thanh lịch không bao giờ lỗi mốt.'
      },
      {
        number: 3,
        title: 'Tận tâm đồng hành (Dedication)',
        description: 'Chúng tôi không chỉ bán sản phẩm, mà đồng hành cùng quý khách từ khâu khảo sát mặt bằng, tư vấn phối màu đến dịch vụ giao hàng, bảo trì và chăm sóc suốt vòng đời sản phẩm.'
      },
      {
        number: 4,
        title: 'Sáng tạo & Đổi mới (Innovation)',
        description: 'Tiên phong ứng dụng công cụ phác thảo không gian 3D trực tuyến, tạo điều kiện để gia chủ tự tay bài trí và tùy biến món đồ theo phong cách cá nhân hóa độc bản.'
      }
    ]
  },
  {
    id: 'cam-ket-dich-vu',
    title: '3. Bộ ba Cam kết vàng về chất lượng dịch vụ',
    paragraphs: [
      'Để quý khách hoàn toàn an tâm trao gửi niềm tin xây dựng tổ ấm, DCor thiết lập bộ ba cam kết dịch vụ minh bạch và nghiêm ngặt nhất trong ngành nội thất:'
    ],
    listItems: [
      'Cam kết Giao vận an toàn: Đóng gói tiêu chuẩn 5 lớp chống sốc và chống ẩm; đội ngũ kỹ thuật viên trực tiếp giao hàng, bốc xếp tận phòng và lắp đặt hoàn thiện miễn phí tại nội thành.',
      'Cam kết Bảo hành dài hạn: Bảo hành chính hãng từ 12 đến 36 tháng cho từng sản phẩm. Tiếp nhận xử lý kỹ thuật tại nhà trong vòng 24 giờ kể từ khi khách gửi yêu cầu.',
      `Cam kết Đổi trả minh bạch: Hỗ trợ đổi mới hoặc hoàn tiền 100% trong vòng ${AUTO_COMPLETE_DAYS} ngày nếu sản phẩm phát sinh lỗi kỹ thuật từ nhà sản xuất hoặc không đúng mô tả đơn hàng.`
    ]
  },
  {
    id: 'quy-trinh-san-xuat',
    title: '4. Quy trình 5 bước sản xuất & hoàn thiện khép kín',
    paragraphs: [
      'Mỗi sản phẩm xuất xưởng từ DCor là kết tinh của một quy trình kiểm soát chất lượng khép kín, chuẩn hóa từ khâu phôi gỗ thô đến khi đặt vào phòng khách của quý khách:'
    ],
    steps: [
      {
        number: 1,
        title: 'Sấy gỗ và tuyển chọn phôi đạt chuẩn',
        description: 'Gỗ tự nhiên được sấy chân không đạt độ ẩm tiêu chuẩn 10% - 12% để triệt tiêu hiện tượng nứt toác và cong vênh do khí hậu nóng ẩm tại Việt Nam.'
      },
      {
        number: 2,
        title: 'Tạo hình và gia công mộng mòi',
        description: 'Kết hợp máy cắt CNC chính xác cao và kỹ nghệ ghép mộng mòi truyền thống của thợ mộc mộc bản, đảm bảo kết cấu chịu lực tải trọng lớn vững chãi.'
      },
      {
        number: 3,
        title: 'Chà nhám và hoàn thiện sơn bề mặt',
        description: 'Xử lý qua 3 lớp sơn lót chống ẩm và lớp sơn phủ mờ PU bảo vệ vân gỗ tự nhiên, giữ trọn sắc thái ấm áp và hương thơm mộc của gỗ.'
      },
      {
        number: 4,
        title: 'Bọc nệm mút và may đo áo đệm',
        description: 'Sử dụng nệm mút nguyên khối D40 chống lún xẹp, bọc lớp bông gòn vi sợi tơi xốp và bọc vải nỉ/da cao cấp may chỉ đôi chắc chắn.'
      },
      {
        number: 5,
        title: 'Kiểm định chất lượng xuất xưởng (KCS/QC)',
        description: '100% sản phẩm được lắp ráp thử, kiểm tra độ cân bằng chân ghế, đường may và dán tem bảo hành điện tử trước khi bọc 5 lớp xuất kho.'
      }
    ]
  },
  {
    id: 'thong-tin-showroom',
    title: '5. Không gian trải nghiệm thực tế tại Showroom DCor',
    paragraphs: [
      `Không có gì chân thực bằng việc chính mắt chiêm ngưỡng và tận tay cảm nhận vẻ đẹp của từng thớ gỗ. Showroom DCor được thiết kế như một chuỗi không gian căn hộ mẫu sống động, giúp quý khách dễ dàng hình dung ngôi nhà tương lai của mình.`,
      `Tại Showroom, quý khách có thể trải nghiệm ngồi thử các mẫu sofa với độ êm ái khác nhau, thử mở rộng các dòng bàn ăn thông minh và khám phá bộ sưu tập hơn 200 mẫu vải nỉ, mẫu da nhập khẩu cao cấp.`
    ],
    callout: {
      type: 'info',
      title: 'Thông tin Showroom trải nghiệm DCor',
      text: `Địa chỉ Showroom: ${ADDRESS}\nGiờ đón tiếp khách: ${WORKING_HOURS}\nHotline đặt lịch trước: ${HOTLINE}\nEmail hỗ trợ: ${EMAIL}`
    }
  },
  {
    id: 'dat-lich-tu-van-chuyen-sau',
    title: '6. Đặt lịch tư vấn trực tiếp cùng Kiến trúc sư DCor',
    paragraphs: [
      'Dù quý khách đang chuẩn bị nhận bàn giao căn hộ mới, nâng cấp phòng khách hay muốn thiết kế một món đồ nội thất độc bản theo đúng kích thước phong thủy, đội ngũ kiến trúc sư và chuyên viên tư vấn của DCor luôn sẵn sàng đồng hành hoàn toàn miễn phí.',
      'Hãy để DCor cùng quý khách kiến tạo nên một không gian sống đậm chất nghệ thuật, tiện nghi và đong đầy hạnh phúc gia đình.'
    ]
  }
];

