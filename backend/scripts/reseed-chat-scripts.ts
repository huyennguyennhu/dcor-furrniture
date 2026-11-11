import prisma from '../src/lib/prisma';

export const SEED_CHAT_SETTINGS = [
  {
    key: 'workingHours',
    value: { start: '08:00', end: '21:30', days: [0, 1, 2, 3, 4, 5, 6] },
  },
  {
    key: 'timezone',
    value: 'Asia/Ho_Chi_Minh',
  },
  {
    key: 'greetingGuest',
    value:
      'Xin chào bạn! Mình là Trợ lý AI của DCor. Bạn đang quan tâm đến mẫu sofa, bàn ghế hay cần giải pháp nội thất nào hôm nay?',
  },
  {
    key: 'greetingAuth',
    value: 'Chào {{name}}! DCor có thể hỗ trợ gì cho không gian sống của bạn hôm nay?',
  },
  {
    key: 'offlineMessage',
    value:
      'Hiện tại đội ngũ CSKH đang ngoài giờ trực ({{hours}}). Bạn có thể để lại nội dung cần hỗ trợ, DCor sẽ ưu tiên liên hệ phản hồi vào đầu giờ sáng mai nhé!',
  },
  {
    key: 'handoffMessage',
    value:
      'DCor đã tiếp nhận yêu cầu và đang kết nối bạn với chuyên viên tư vấn. Bạn vui lòng giữ kết nối trong ít phút nhé!',
  },
  {
    key: 'fallbackMessages',
    value: [
      'DCor chưa hiểu rõ câu hỏi của bạn. Bạn vui lòng diễn đạt cụ thể hơn hoặc chọn một trong các gợi ý bên dưới nhé!',
      'Xin lỗi bạn, câu hỏi này nằm ngoài hiểu biết hiện tại của bot. Bạn thử mô tả lại hoặc bấm nút Gặp nhân viên để được hỗ trợ trực tiếp.',
      'DCor chưa tìm được thông tin phù hợp với yêu cầu này. Bạn có thể chọn chủ đề cần giải đáp bên dưới để mình hỗ trợ ngay nhé!',
    ],
  },
  {
    key: 'hotline',
    value: '1900 1234',
  },
  {
    key: 'address',
    value: '669 QL1A, TP. Hồ Chí Minh',
  },
];

export const SEED_CHAT_SCRIPTS = [
  {
    intent: 'GREETING',
    name: 'Chào hỏi & Khởi động',
    patterns: [
      'xin chao',
      'chao ban',
      'hello',
      'hi dcor',
      'alo',
      'co ai o day khong',
      'ad oi',
      'shop oi',
      'hi shop',
      'chao shop',
      'hi',
      'dcor oi',
    ],
    answer: 'Chào bạn! DCor có thể hỗ trợ gì cho bạn hôm nay?',
    quickReplies: [
      { label: '🛋️ Xem mẫu Sofa hot', payload: 'xem mẫu sofa hot' },
      { label: '📐 Tư vấn may đo theo kích thước', payload: 'tư vấn may đo theo kích thước' },
      { label: '📍 Đặt lịch trải nghiệm Showroom', payload: 'đặt lịch trải nghiệm showroom' },
    ],
    actionType: 'NONE',
    priority: 6,
    isActive: true,
  },
  {
    intent: 'SOFA_HOT',
    name: 'Mẫu Sofa Hot & Bán chạy',
    patterns: [
      'xem mau sofa hot',
      'sofa hot',
      'sofa ban chay',
      'mau sofa hot nhat',
      'sofa noi bat',
      'top sofa',
      'mau sofa dep nhat',
      'sofa khuyen dung',
      'cac mau sofa hot',
      'sofa phong khach hot',
    ],
    answer:
      'DCor gợi ý top mẫu Sofa nổi bật và được yêu thích nhất hiện nay. Bạn có thể bấm vào thẻ sản phẩm để xem chi tiết kích thước và chất liệu nhé!',
    quickReplies: [
      { label: '📐 May đo riêng', payload: 'may đo riêng' },
      { label: '📍 Đặt lịch Showroom', payload: 'đặt lịch showroom' },
      { label: '🧑‍💼 Gặp nhân viên', payload: 'gặp nhân viên' },
    ],
    actionType: 'SOFA_HOT',
    priority: 11,
    isActive: true,
  },
  {
    intent: 'CUSTOM_DESIGN',
    name: 'Tư vấn May đo & Tùy biến',
    patterns: [
      'may do rieng',
      'tu van may do theo kich thuoc',
      'may do theo kich thuoc',
      'may do',
      'dong theo yeu cau',
      'dat may do',
      'lam theo kich thuoc',
      'dong theo ban ve',
      'kich thuoc rieng',
      'tuy bien kich thuoc',
      'ban ve ngoai catalogue',
      'dat hang theo yeu cau',
    ],
    answer:
      'DCor hỗ trợ tùy biến theo yêu cầu dựa trên các mẫu trong catalogue (ví dụ điều chỉnh kích thước theo mặt bằng, chất liệu, màu sắc). Với yêu cầu thiết kế riêng, bạn có thể gửi yêu cầu Custom để được phản hồi báo giá trong vòng 24 giờ.',
    quickReplies: [
      { label: '🛋️ Xem các mẫu hỗ trợ May đo', payload: 'xem mau may do' },
      { label: '📍 Đặt lịch tư vấn tại Showroom', payload: 'đặt lịch tư vấn tại showroom' },
    ],
    actionType: 'CUSTOM_DESIGN',
    priority: 10,
    isActive: true,
  },
  {
    intent: 'SHOWROOM_BOOKING',
    name: 'Đặt lịch trải nghiệm & Tư vấn Showroom',
    patterns: [
      'dat lich trai nghiem showroom',
      'dat lich showroom',
      'dat lich tu van tai showroom',
      'dat lich hen showroom',
      'trai nghiem showroom',
      'dia chi showroom',
      'gio mo cua showroom',
      'xem chat lieu thuc te',
      'thu do em cua nem',
      'showroom o dau',
      'dia chi cua hang',
      'gio lam viec',
    ],
    answer:
      'Showroom DCor tọa lạc tại: {{address}}. Mở cửa đón khách từ {{hours}} (Hotline: {{hotline}}).\nKhi đặt lịch trước, bạn sẽ có chuyên viên tư vấn vật liệu riêng và chuẩn bị sẵn mẫu catalogue da/vải thực tế.',
    quickReplies: [
      { label: '📅 Đặt lịch tư vấn tại Showroom', payload: 'đặt lịch tư vấn tại showroom' },
      { label: '🛋️ Xem mẫu Sofa hot', payload: 'xem mẫu sofa hot' },
      { label: '🧑‍💼 Gặp nhân viên', payload: 'gặp nhân viên' },
    ],
    actionType: 'BOOK_CONSULT',
    priority: 10,
    isActive: true,
  },
  {
    intent: 'ORDER_STATUS',
    name: 'Tình trạng đơn hàng',
    patterns: [
      'tinh trang don hang',
      'kiem tra don hang',
      'tra cuu don hang',
      'don hang cua toi',
      'check don hang',
      'don hang dang o dau',
      'xem don hang',
      'tien do don hang',
      'ma don hang',
    ],
    answer:
      'Để tra cứu tiến độ đơn hàng, bạn vui lòng cung cấp mã đơn hàng (định dạng DC-xxxxxx hoặc ORD-xxxx) kèm số điện thoại đặt hàng để DCor đối chiếu bảo mật nhé!',
    quickReplies: [
      { label: '🧑‍💼 Gặp nhân viên', payload: 'gặp nhân viên' },
      { label: '❌ Hủy tra cứu', payload: 'hủy' },
    ],
    actionType: 'ORDER_STATUS',
    priority: 12,
    isActive: true,
  },
  {
    intent: 'WARRANTY_POLICY',
    name: 'Chính sách bảo hành',
    patterns: [
      'chinh sach bao hanh',
      'bao hanh may nam',
      'bao hanh bao lau',
      'dieu kien bao hanh',
      'bao hanh sofa',
      'thoi gian bao hanh',
      'co bao hanh khong',
    ],
    answer:
      'Sản phẩm DCor được bảo hành chính hãng từ 2 đến 5 năm: khung xương kim loại và nệm mút bảo hành 5 năm, bề mặt da/vải nỉ và ray trượt phụ kiện bảo hành 2 năm. Mã bảo hành điện tử được tự động kích hoạt ngay sau khi đơn hàng hoàn tất.',
    quickReplies: [
      { label: '🔄 Chính sách đổi trả', payload: 'chính sách đổi trả' },
      { label: '🧑‍💼 Hỗ trợ bảo hành', payload: 'gặp nhân viên' },
    ],
    actionType: 'NONE',
    priority: 8,
    isActive: true,
  },
  {
    intent: 'RETURN_POLICY',
    name: 'Chính sách đổi trả hàng',
    patterns: [
      'chinh sach doi tra',
      'doi hang',
      'tra hang',
      'dieu kien doi tra',
      'co duoc tra hang khong',
      'muon doi san pham',
      'hoan tra',
      'doi tra trong may ngay',
    ],
    answer:
      'Chính sách đổi trả DCor áp dụng tối đa trong vòng 7 ngày kể từ khi nhận hàng. DCor hỗ trợ 2 hình thức: Đổi sản phẩm mới (nếu sản phẩm có lỗi kỹ thuật/trầy xước giao hàng) hoặc Trả hàng và hoàn tiền theo quy định.',
    quickReplies: [
      { label: '🛡️ Chính sách bảo hành', payload: 'chính sách bảo hành' },
      { label: '🧑‍💼 Gặp nhân viên đổi trả', payload: 'gặp nhân viên' },
    ],
    actionType: 'NONE',
    priority: 8,
    isActive: true,
  },
  {
    intent: 'SHIPPING_POLICY',
    name: 'Chính sách vận chuyển & Giao lắp',
    patterns: [
      'phi van chuyen',
      'phi ship',
      'giao hang bao lau',
      'co lap dat khong',
      'van chuyen the nao',
      'giao hang toan quoc khong',
      'thoi gian giao hang',
    ],
    answer:
      'DCor miễn phí vận chuyển và lắp đặt tận nhà tại khu vực TP. Hồ Chí Minh cho đơn hàng từ 10 triệu đồng. Với các tỉnh thành khác, DCor hỗ trợ gửi qua đơn vị vận chuyển chuyên nghiệp bọc lót chống sốc kèm bảo hiểm hàng nội thất toàn diện.',
    quickReplies: [
      { label: '💳 Phương thức thanh toán', payload: 'phương thức thanh toán' },
      { label: '📦 Tình trạng đơn hàng', payload: 'tình trạng đơn hàng' },
    ],
    actionType: 'NONE',
    priority: 8,
    isActive: true,
  },
  {
    intent: 'PAYMENT_POLICY',
    name: 'Phương thức thanh toán & Đặt cọc',
    patterns: [
      'phuong thuc thanh toan',
      'thanh toan the nao',
      'co tra gop khong',
      'co cod khong',
      'dat coc bao nhieu',
      'hinh thuc thanh toan',
      'chuyen khoan',
      'quet ma qr',
      'vietqr',
    ],
    answer:
      'DCor hỗ trợ 2 phương thức thanh toán: COD (tiền mặt khi nhận hàng) và chuyển khoản quét mã VietQR (không áp dụng ví điện tử hay quẹt thẻ). Lưu ý: Các đơn hàng có giá trị trên 50 triệu đồng sẽ khóa hình thức COD và yêu cầu đặt cọc tối thiểu 30% khi xác nhận đơn.',
    quickReplies: [
      { label: '🏷️ Khuyến mãi hiện có', payload: 'khuyến mãi' },
      { label: '📍 Đặt lịch Showroom', payload: 'đặt lịch showroom' },
    ],
    actionType: 'NONE',
    priority: 8,
    isActive: true,
  },
  {
    intent: 'PROMOTION_VOUCHER',
    name: 'Khuyến mãi & Voucher giảm giá',
    patterns: [
      'khuyen mai',
      'co giam gia khong',
      'voucher',
      'ma giam gia',
      'chuong trinh uu dai',
      'co sale khong',
      'ma khuyen mai',
    ],
    answer:
      'DCor đang có chương trình tri ân khách hàng: Nhập mã WELCOME10 để được giảm ngay 10% (tối đa 1.500.000 đ) cho đơn hàng đầu tiên từ 2 triệu đồng. Ngoài ra còn có ưu đãi quà tặng cao cấp khi mua trọn bộ combo phòng khách!',
    quickReplies: [
      { label: '🛋️ Xem mẫu Sofa hot', payload: 'xem mẫu sofa hot' },
      { label: '🧑‍💼 Nhận thêm ưu đãi', payload: 'gặp nhân viên' },
    ],
    actionType: 'NONE',
    priority: 8,
    isActive: true,
  },
  {
    intent: 'HANDOFF_STAFF',
    name: 'Gặp nhân viên tư vấn',
    patterns: [
      'gap nhan vien',
      'gap cskh',
      'gap tu van vien',
      'noi chuyen voi nguoi that',
      'ho tro truc tiep',
      'nhan vien dau roi',
      'tu van truc tiep',
      'chuyen nhan vien',
    ],
    answer: '{{handoffMessage}}',
    quickReplies: [
      { label: '📞 Gọi Hotline khẩn', payload: 'hotline' },
      { label: '📍 Đặt lịch Showroom', payload: 'đặt lịch showroom' },
    ],
    actionType: 'HANDOFF',
    priority: 15,
    isActive: true,
  },
  {
    intent: 'THANK_YOU_BYE',
    name: 'Cảm ơn & Tạm biệt',
    patterns: [
      'cam on',
      'thank you',
      'thanks',
      'tam biet',
      'bye',
      'ok cam on nhe',
      'cam on shop',
      'ok cam on',
    ],
    answer:
      'DCor rất vui được đồng hành cùng bạn nâng tầm không gian sống! Nếu có bất kỳ câu hỏi nào khác, đừng ngần ngại nhắn tin cho DCor bất cứ lúc nào nhé. Chúc bạn một ngày tuyệt vời!',
    quickReplies: [
      { label: '🛋️ Xem mẫu Sofa hot', payload: 'xem mẫu sofa hot' },
      { label: '📍 Đặt lịch Showroom', payload: 'đặt lịch showroom' },
    ],
    actionType: 'NONE',
    priority: 7,
    isActive: true,
  },
  {
    intent: 'COMPLAINT_FEEDBACK',
    name: 'Khiếu nại & Phản ánh chất lượng',
    patterns: [
      'khieu nai',
      'lua dao',
      'hoan tien gap',
      'dich vu te',
      'buc minh',
      'that vong',
      'kien shop',
      'lua gat',
      'doi tien',
    ],
    answer:
      'DCor vô cùng xin lỗi về trải nghiệm chưa được như ý của bạn! Cuộc trò chuyện đang được ưu tiên chuyển ngay đến Trưởng ca CSKH để giải quyết thỏa đáng cho bạn.',
    quickReplies: [{ label: '📞 Hotline 1900 1234', payload: 'hotline' }],
    actionType: 'HANDOFF',
    priority: 20,
    isActive: true,
  },
];

// Danh sách các intent cũ không còn dùng trong bộ kịch bản mới -> tắt isActive = false
export const RETIRED_INTENTS = [
  'BUSINESS_HOURS',
  'SHOWROOM_ADDRESS',
  'HOTLINE',
  'PRODUCT_SEARCH',
  'BOOK_CONSULTATION',
];

export async function reseedChatScriptsAndSettings() {
  console.log('🌱 Bắt đầu cập nhật ChatSetting và ChatBotScript (idempotent upsert)...');

  // 1. Upsert ChatSetting
  for (const s of SEED_CHAT_SETTINGS) {
    await prisma.$executeRawUnsafe(
      `INSERT INTO "ChatSetting" ("id", "key", "value", "createdAt", "updatedAt")
       VALUES ($1, $2, $3::jsonb, NOW(), NOW())
       ON CONFLICT ("key") DO UPDATE
       SET "value" = $3::jsonb, "updatedAt" = NOW()`,
      `setting-${s.key}`,
      s.key,
      JSON.stringify(s.value)
    );
    console.log(`  ✓ Đã cập nhật ChatSetting: ${s.key}`);
  }

  // 2. Upsert ChatBotScript theo intent
  for (const sc of SEED_CHAT_SCRIPTS) {
    const scriptId = `script-${sc.intent.toLowerCase().replace(/_/g, '-')}`;
    await prisma.$executeRawUnsafe(
      `INSERT INTO "ChatBotScript" (
        "id", "intent", "name", "patterns", "answer", "quickReplies", "actionType", "priority", "isActive", "createdAt", "updatedAt"
      ) VALUES (
        $1, $2, $3, $4::text[], $5, $6::jsonb, $7, $8, $9, NOW(), NOW()
      ) ON CONFLICT ("intent") DO UPDATE
      SET "name" = $3,
          "patterns" = $4::text[],
          "answer" = $5,
          "quickReplies" = $6::jsonb,
          "actionType" = $7,
          "priority" = $8,
          "isActive" = $9,
          "updatedAt" = NOW()`,
      scriptId,
      sc.intent,
      sc.name,
      sc.patterns,
      sc.answer,
      JSON.stringify(sc.quickReplies),
      sc.actionType,
      sc.priority,
      sc.isActive
    );
    console.log(`  ✓ Đã cập nhật ChatBotScript: ${sc.intent} (${sc.name})`);
  }

  // 3. Tắt các intent cũ không còn dùng (isActive = false), KHÔNG xóa, không đụng intent admin tự tạo
  for (const retired of RETIRED_INTENTS) {
    const existing = await prisma.chatBotScript.findUnique({
      where: { intent: retired },
    });
    if (existing) {
      await prisma.chatBotScript.update({
        where: { intent: retired },
        data: { isActive: false },
      });
      console.log(`  ℹ Đã tắt intent cũ không còn dùng: ${retired} (isActive = false)`);
    }
  }

  console.log('✅ Hoàn tất cập nhật kịch bản ChatBot và ChatSetting thành công!');
}

if (require.main === module) {
  reseedChatScriptsAndSettings()
    .catch((err) => {
      console.error('❌ Lỗi khi chạy reseed:', err);
      process.exit(1);
    })
    .finally(() => {
      prisma.$disconnect();
    });
}

