import prisma, { withDbRetry } from './prisma';

/**
 * Khởi tạo bảng và dữ liệu mẫu cho hệ thống Chat & Chatbot DCor
 * Thực thi trực tiếp qua $executeRawUnsafe (CREATE TABLE IF NOT EXISTS)
 * Khớp chính xác với model Prisma đã khai báo
 */
export async function initChatDatabase() {
  try {
    await withDbRetry(async () => {
      // 1. Tạo bảng ChatConversation
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "ChatConversation" (
          "id" VARCHAR(64) PRIMARY KEY,
          "customerId" VARCHAR(64),
          "guestName" VARCHAR(255),
          "guestPhone" VARCHAR(50),
          "guestTokenHash" VARCHAR(255),
          "mode" VARCHAR(30) NOT NULL DEFAULT 'BOT',
          "status" VARCHAR(30) NOT NULL DEFAULT 'OPEN',
          "assignedStaffId" VARCHAR(64),
          "needsHuman" BOOLEAN NOT NULL DEFAULT false,
          "unreadStaff" INTEGER NOT NULL DEFAULT 0,
          "unreadCustomer" INTEGER NOT NULL DEFAULT 0,
          "fallbackCount" INTEGER NOT NULL DEFAULT 0,
          "botState" JSONB,
          "internalNote" TEXT,
          "lastMessageAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          "lastMessagePreview" TEXT,
          "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          "closedAt" TIMESTAMP WITH TIME ZONE
        );
      `);
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "idx_chatconversation_status_lastmessageat"
        ON "ChatConversation"("status", "lastMessageAt");
      `);
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "idx_chatconversation_assignedstaffid"
        ON "ChatConversation"("assignedStaffId");
      `);
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "idx_chatconversation_customerid"
        ON "ChatConversation"("customerId");
      `);

      // 2. Tạo bảng ChatMessage
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "ChatMessage" (
          "id" VARCHAR(64) PRIMARY KEY,
          "conversationId" VARCHAR(64) NOT NULL REFERENCES "ChatConversation"("id") ON DELETE CASCADE,
          "senderType" VARCHAR(30) NOT NULL,
          "senderId" VARCHAR(64),
          "senderName" VARCHAR(255),
          "content" TEXT NOT NULL,
          "imageUrl" TEXT,
          "quickReplies" JSONB,
          "meta" JSONB,
          "clientMessageId" VARCHAR(128),
          "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          "readAt" TIMESTAMP WITH TIME ZONE
        );
      `);
      await prisma.$executeRawUnsafe(`
        CREATE UNIQUE INDEX IF NOT EXISTS "idx_chatmessage_conversation_clientmsg"
        ON "ChatMessage"("conversationId", "clientMessageId")
        WHERE "clientMessageId" IS NOT NULL;
      `);
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "idx_chatmessage_conversation_createdat"
        ON "ChatMessage"("conversationId", "createdAt");
      `);

      // 3. Tạo bảng ChatBotScript
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "ChatBotScript" (
          "id" VARCHAR(64) PRIMARY KEY,
          "intent" VARCHAR(100) UNIQUE NOT NULL,
          "name" VARCHAR(255) NOT NULL,
          "patterns" TEXT[] NOT NULL,
          "answer" TEXT NOT NULL,
          "quickReplies" JSONB,
          "actionType" VARCHAR(50) NOT NULL DEFAULT 'NONE',
          "priority" INTEGER NOT NULL DEFAULT 0,
          "isActive" BOOLEAN NOT NULL DEFAULT true,
          "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        );
      `);
      await prisma.$executeRawUnsafe(`
        CREATE UNIQUE INDEX IF NOT EXISTS "idx_chatbotscript_intent"
        ON "ChatBotScript"("intent");
      `);
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "idx_chatbotscript_isactive_priority"
        ON "ChatBotScript"("isActive", "priority" DESC);
      `);

      // 4. Tạo bảng ChatSetting
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "ChatSetting" (
          "id" VARCHAR(64) PRIMARY KEY,
          "key" VARCHAR(100) UNIQUE NOT NULL,
          "value" JSONB NOT NULL,
          "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        );
      `);
      await prisma.$executeRawUnsafe(`
        CREATE UNIQUE INDEX IF NOT EXISTS "idx_chatsetting_key"
        ON "ChatSetting"("key");
      `);

      // 5. Nạp ChatSetting nếu bảng rỗng
      const settingCountRes: any = await prisma.$queryRawUnsafe(
        `SELECT COUNT(*)::int as count FROM "ChatSetting"`
      );
      if ((settingCountRes?.[0]?.count || 0) === 0) {
        const defaultSettings = [
          {
            id: 'setting-working-hours',
            key: 'workingHours',
            value: { start: '08:00', end: '22:00', days: [0, 1, 2, 3, 4, 5, 6] },
          },
          {
            id: 'setting-timezone',
            key: 'timezone',
            value: 'Asia/Ho_Chi_Minh',
          },
          {
            id: 'setting-greeting',
            key: 'greeting',
            value: 'Xin chào! DCor có thể hỗ trợ gì cho không gian sống của bạn hôm nay?',
          },
          {
            id: 'setting-offline-message',
            key: 'offlineMessage',
            value:
              'Hiện tại đang ngoài giờ làm việc của đội ngũ tư vấn (08:00 - 22:00). Bạn vui lòng để lại câu hỏi, chuyên viên DCor sẽ liên hệ hỗ trợ bạn sớm nhất vào đầu ca làm tiếp theo lúc 08:00 sáng nhé!',
          },
          {
            id: 'setting-handoff-message',
            key: 'handoffMessage',
            value:
              'DCor đã tiếp nhận yêu cầu và đang kết nối bạn với chuyên viên tư vấn. Bạn vui lòng giữ kết nối trong ít phút nhé!',
          },
          {
            id: 'setting-fallback-messages',
            key: 'fallbackMessages',
            value: [
              'DCor chưa hiểu rõ câu hỏi của bạn. Bạn vui lòng diễn đạt cụ thể hơn hoặc bấm vào các gợi ý dưới đây nhé!',
              'Xin lỗi bạn, câu hỏi này nằm ngoài hiểu biết hiện tại của bot. Bạn thử mô tả lại hoặc bấm nút "Gặp nhân viên" để được hỗ trợ trực tiếp.',
              'DCor chưa tìm được thông tin phù hợp với yêu cầu này. Bạn có thể chọn chủ đề cần giải đáp bên dưới để mình hỗ trợ ngay nhé!',
            ],
          },
          {
            id: 'setting-hotline',
            key: 'hotline',
            value: '1900 1234',
          },
          {
            id: 'setting-address',
            key: 'address',
            value: '669 QL1A, TP. Hồ Chí Minh',
          },
        ];

        for (const s of defaultSettings) {
          await prisma.$executeRawUnsafe(
            `INSERT INTO "ChatSetting" ("id", "key", "value", "createdAt", "updatedAt")
             VALUES ($1, $2, $3::jsonb, NOW(), NOW())
             ON CONFLICT ("key") DO NOTHING`,
            s.id,
            s.key,
            JSON.stringify(s.value)
          );
        }
      }

      // 6. Nạp dữ liệu kịch bản thực tế nếu bảng rỗng
      const scriptCountRes: any = await prisma.$queryRawUnsafe(
        `SELECT COUNT(*)::int as count FROM "ChatBotScript"`
      );
      if ((scriptCountRes?.[0]?.count || 0) === 0) {
        const initialScripts = [
          {
            id: 'script-greeting',
            intent: 'GREETING',
            name: 'Chào hỏi & Menu ban đầu',
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
            ],
            answer:
              'DCor xin chào bạn! Tình trạng phục vụ: {{status_open}}. Hotline: {{hotline}}. Địa chỉ showroom: {{address}}. DCor có thể hỗ trợ tư vấn sản phẩm hay giải đáp dịch vụ nào cho bạn hôm nay ạ?',
            quickReplies: [
              { label: '🛋️ Tìm sản phẩm', payload: 'tìm sản phẩm' },
              { label: '📦 Tra cứu đơn', payload: 'tra cứu đơn hàng' },
              { label: '🏷️ Khuyến mãi', payload: 'khuyến mãi' },
              { label: '🧑‍💼 Gặp nhân viên', payload: 'gặp nhân viên' },
            ],
            actionType: 'NONE',
            priority: 6,
          },
          {
            id: 'script-hours',
            intent: 'BUSINESS_HOURS',
            name: 'Giờ làm việc & Mở cửa Showroom',
            patterns: [
              'gio lam viec',
              'gio mo cua',
              'may gio dong cua',
              'khi nao mo cua',
              'gio hoat dong showroom',
              'lich lam viec',
              'thoi gian lam viec',
              'may gio nghi',
            ],
            answer:
              'DCor mở cửa từ {{hours}} tất cả các ngày trong tuần (kể cả Thứ 7 và Chủ Nhật). Hiện tại showroom {{status_open}}. Rất hân hạnh được đón tiếp bạn ghé trải nghiệm trực tiếp tại {{address}}!',
            quickReplies: [
              { label: '📍 Địa chỉ Showroom', payload: 'địa chỉ showroom' },
              { label: '📅 Đặt lịch tư vấn', payload: 'đặt lịch tư vấn' },
              { label: '📞 Hotline', payload: 'hotline' },
            ],
            actionType: 'BUSINESS_HOURS',
            priority: 9,
          },
          {
            id: 'script-address',
            intent: 'SHOWROOM_ADDRESS',
            name: 'Địa chỉ Showroom',
            patterns: [
              'dia chi',
              'showroom o dau',
              'cua hang o dau',
              'vi tri',
              'di chi showroom',
              'chi nhanh',
              'o dau',
              'shop o dau',
            ],
            answer:
              'Showroom chính thức của DCor tọa lạc tại: {{address}}. Không gian trưng bày mở cửa từ {{hours}} với đầy đủ mẫu sofa, bàn ăn, giường tủ thực tế để bạn trải nghiệm chất liệu và form dáng trực tiếp.',
            quickReplies: [
              { label: '⏰ Giờ mở cửa', payload: 'giờ làm việc' },
              { label: '📅 Đặt lịch trải nghiệm', payload: 'đặt lịch tư vấn' },
            ],
            actionType: 'NONE',
            priority: 9,
          },
          {
            id: 'script-hotline',
            intent: 'HOTLINE',
            name: 'Hotline tổng đài CSKH',
            patterns: [
              'hotline',
              'so hotline',
              'so dien thoai',
              'sdt tong dai',
              'so tong dai',
              'lien he qua dien thoai',
              'so cskh',
            ],
            answer:
              'Tổng đài hỗ trợ và chăm sóc khách hàng của DCor là: {{hotline}} (hoạt động từ {{hours}} hàng ngày). Cước phí cuộc gọi tính theo quy định của nhà mạng.',
            quickReplies: [
              { label: '🧑‍💼 Gặp nhân viên', payload: 'gặp nhân viên' },
              { label: '📍 Địa chỉ Showroom', payload: 'địa chỉ showroom' },
            ],
            actionType: 'NONE',
            priority: 10,
          },
          {
            id: 'script-order-lookup',
            intent: 'ORDER_STATUS',
            name: 'Tra cứu tiến độ đơn hàng',
            patterns: [
              'tra cuu don',
              'kiem tra don hang',
              'don hang cua toi',
              'tinh trang don',
              'tien do giao hang',
              'check don hang',
              'don hang dang o dau',
              'xem don hang',
              'ma don hang',
            ],
            answer:
              'Để tra cứu thông tin đơn hàng, bạn vui lòng nhập mã đơn hàng (định dạng DC-xxxxxx) kèm số điện thoại đã dùng khi đặt hàng để DCor đối chiếu bảo mật nhé!',
            quickReplies: [
              { label: '📦 Nhập mã đơn', payload: 'DC-' },
              { label: '🧑‍💼 Gặp nhân viên hỗ trợ', payload: 'gặp nhân viên' },
            ],
            actionType: 'ORDER_STATUS',
            priority: 10,
          },
          {
            id: 'script-product-search',
            intent: 'PRODUCT_SEARCH',
            name: 'Tìm kiếm sản phẩm nội thất',
            patterns: [
              'tim san pham',
              'tim sofa',
              'tim ban an',
              'tim giuong ngu',
              'tu quan ao',
              'den trang tri',
              'tham trai san',
              'xem san pham',
              'gia san pham',
              'muon mua sofa',
              'muon mua ban an',
              'co san pham nao',
            ],
            answer:
              'DCor cung cấp đa dạng sản phẩm: sofa da cao cấp, bàn ăn mặt đá Ceramic, giường ngủ gỗ sồi, tủ quần áo, đèn thả và thảm trang trí. Bạn có thể cho DCor biết loại sản phẩm, không gian phòng hoặc khoảng ngân sách dự kiến để mình gợi ý mẫu đẹp nhất nhé!',
            quickReplies: [
              { label: '🛋️ Sofa dưới 15 triệu', payload: 'sofa dưới 15 triệu' },
              { label: '🪑 Bàn ăn phòng bếp', payload: 'bàn ăn phòng bếp' },
              { label: '🛏️ Giường ngủ 1m8', payload: 'giường ngủ 1m8' },
            ],
            actionType: 'PRODUCT_SEARCH',
            priority: 10,
          },
          {
            id: 'script-warranty',
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
          },
          {
            id: 'script-return',
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
            ],
            answer:
              'DCor hỗ trợ đổi trả chỉ khi đơn hàng đã được giao thành công và chưa hoàn tất. Hệ thống sẽ tự động hoàn tất đơn sau 3 ngày kể từ khi nhận hàng. Đổi trả áp dụng khi sản phẩm có lỗi từ nhà sản xuất, trầy xước trong quá trình vận chuyển hoặc giao sai quy cách.',
            quickReplies: [
              { label: '🛡️ Chính sách bảo hành', payload: 'chính sách bảo hành' },
              { label: '🧑‍💼 Yêu cầu đổi trả', payload: 'gặp nhân viên' },
            ],
            actionType: 'NONE',
            priority: 8,
          },
          {
            id: 'script-shipping',
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
              { label: '📦 Tra cứu đơn', payload: 'tra cứu đơn hàng' },
            ],
            actionType: 'NONE',
            priority: 8,
          },
          {
            id: 'script-payment',
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
            ],
            answer:
              'DCor hỗ trợ đa dạng phương thức thanh toán: COD (tiền mặt khi nhận hàng), chuyển khoản quét mã VietQR, ví điện tử và thẻ tín dụng. Lưu ý: Đơn hàng có giá trị trên 50 triệu đồng sẽ khóa hình thức COD và yêu cầu đặt cọc tối thiểu 30% khi xác nhận đơn.',
            quickReplies: [
              { label: '🏷️ Khuyến mãi hiện có', payload: 'khuyến mãi' },
              { label: '📅 Đặt lịch tư vấn', payload: 'đặt lịch tư vấn' },
            ],
            actionType: 'NONE',
            priority: 8,
          },
          {
            id: 'script-promotion',
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
              'DCor đang có chương trình tri ân khách hàng: Nhập mã WELCOME10 để được giảm ngay 10% (tối đa 1.500.000 đ) cho đơn hàng đầu tiên từ 2 triệu đồng. Ngoài ra còn có ưu đãi tặng gối trang trí cao cấp khi mua sofa!',
            quickReplies: [
              { label: '🛋️ Tìm sản phẩm áp voucher', payload: 'tìm sản phẩm' },
              { label: '🧑‍💼 Nhận thêm ưu đãi', payload: 'gặp nhân viên' },
            ],
            actionType: 'NONE',
            priority: 8,
          },
          {
            id: 'script-consultation',
            intent: 'BOOK_CONSULTATION',
            name: 'Đặt lịch tư vấn Showroom / Kiến trúc sư',
            patterns: [
              'dat lich tu van',
              'hen gio showroom',
              'gap kien truc su',
              'tu van thiet ke',
              'dat lich hen',
              'hen tu van',
              'nho kien truc su tu van',
            ],
            answer:
              'DCor có đội ngũ kiến trúc sư và chuyên viên sẵn sàng tư vấn 1:1 miễn phí tại Showroom ({{address}}) hoặc qua video call. Chuyên viên sẽ chuẩn bị trước mẫu vật liệu, bảng phối màu và giải pháp không gian phù hợp với mặt bằng căn hộ của bạn.',
            quickReplies: [
              { label: '🧑‍💼 Đặt lịch ngay', payload: 'gặp nhân viên' },
              { label: '📍 Địa chỉ Showroom', payload: 'địa chỉ showroom' },
            ],
            actionType: 'BOOK_CONSULT',
            priority: 8,
          },
          {
            id: 'script-custom-design',
            intent: 'CUSTOM_DESIGN',
            name: 'Yêu cầu may đo theo kích thước',
            patterns: [
              'thiet ke theo yeu cau',
              'dat may do',
              'lam theo kich thuoc',
              'dong theo mau',
              'custom san pham',
              'thay doi kich thuoc',
              'kich thuoc rieng',
            ],
            answer:
              'DCor sở hữu xưởng sản xuất trực tiếp, sẵn sàng may đo sofa, bàn ghế, hệ tủ kệ theo kích thước chuẩn xác của từng căn hộ, tùy chọn chất liệu da bò Ý, vải nỉ nhung cao cấp chống bám bụi và tone màu nội thất.',
            quickReplies: [
              { label: '🧑‍💼 Kết nối kiến trúc sư', payload: 'gặp nhân viên' },
              { label: '📅 Đặt lịch tư vấn', payload: 'đặt lịch tư vấn' },
            ],
            actionType: 'NONE',
            priority: 8,
          },
          {
            id: 'script-handoff',
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
            ],
            answer: '{{handoffMessage}}',
            quickReplies: [
              { label: '📞 Gọi Hotline khẩn', payload: 'hotline' },
              { label: '⏰ Xem giờ làm việc', payload: 'giờ làm việc' },
            ],
            actionType: 'HANDOFF',
            priority: 15,
          },
          {
            id: 'script-thank-you',
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
              { label: '🛋️ Xem sản phẩm', payload: 'tìm sản phẩm' },
              { label: '📍 Địa chỉ Showroom', payload: 'địa chỉ showroom' },
            ],
            actionType: 'NONE',
            priority: 7,
          },
          {
            id: 'script-complaint',
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
          },
        ];

        for (const sc of initialScripts) {
          await prisma.$executeRawUnsafe(
            `INSERT INTO "ChatBotScript" (
              "id", "intent", "name", "patterns", "answer", "quickReplies", "actionType", "priority", "isActive", "createdAt", "updatedAt"
            ) VALUES (
              $1, $2, $3, $4::text[], $5, $6::jsonb, $7, $8, true, NOW(), NOW()
            ) ON CONFLICT ("intent") DO NOTHING`,
            sc.id,
            sc.intent,
            sc.name,
            sc.patterns,
            sc.answer,
            JSON.stringify(sc.quickReplies),
            sc.actionType,
            sc.priority
          );
        }
      }
    });
  } catch (error) {
    console.error('Lỗi khởi tạo Chat Database:', error);
    throw error;
  }
}
