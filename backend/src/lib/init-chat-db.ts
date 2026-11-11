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
      // Index partial unique cho customerId để bảo đảm 1 khách 1 hội thoại
      try {
        await prisma.$executeRawUnsafe(`
          CREATE UNIQUE INDEX IF NOT EXISTS "idx_chatconversation_customerid_unique"
          ON "ChatConversation" ("customerId")
          WHERE "customerId" IS NOT NULL;
        `);
      } catch (idxError: any) {
        console.warn('⚠️ Cảnh báo: Chạy scripts/merge-chat-conversations.ts để gộp hội thoại trùng');
      }

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

      // 5. Nạp cấu hình và kịch bản chuẩn luồng mới bằng upsert
      const defaultSettings = [
        {
          id: 'setting-workingHours',
          key: 'workingHours',
          value: { start: '08:00', end: '21:30', days: [0, 1, 2, 3, 4, 5, 6] },
        },
        {
          id: 'setting-timezone',
          key: 'timezone',
          value: 'Asia/Ho_Chi_Minh',
        },
        {
          id: 'setting-greetingGuest',
          key: 'greetingGuest',
          value:
            'Xin chào bạn! Mình là Trợ lý AI của DCor. Bạn đang quan tâm đến mẫu sofa, bàn ghế hay cần giải pháp nội thất nào hôm nay?',
        },
        {
          id: 'setting-greetingAuth',
          key: 'greetingAuth',
          value: 'Chào {{name}}! DCor có thể hỗ trợ gì cho không gian sống của bạn hôm nay?',
        },
        {
          id: 'setting-offlineMessage',
          key: 'offlineMessage',
          value:
            'Hiện tại đội ngũ CSKH đang ngoài giờ trực ({{hours}}). Bạn có thể để lại nội dung cần hỗ trợ, DCor sẽ ưu tiên liên hệ phản hồi vào đầu giờ sáng mai nhé!',
        },
        {
          id: 'setting-handoffMessage',
          key: 'handoffMessage',
          value:
            'DCor đã tiếp nhận yêu cầu và đang kết nối bạn với chuyên viên tư vấn. Bạn vui lòng giữ kết nối trong ít phút nhé!',
        },
        {
          id: 'setting-fallbackMessages',
          key: 'fallbackMessages',
          value: [
            'DCor chưa hiểu rõ câu hỏi của bạn. Bạn vui lòng diễn đạt cụ thể hơn hoặc chọn một trong các gợi ý bên dưới nhé!',
            'Xin lỗi bạn, câu hỏi này nằm ngoài hiểu biết hiện tại của bot. Bạn thử mô tả lại hoặc bấm nút Gặp nhân viên để được hỗ trợ trực tiếp.',
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
    });
  } catch (error) {
    console.error('Lỗi khởi tạo Chat Database:', error);
    throw error;
  }
}
