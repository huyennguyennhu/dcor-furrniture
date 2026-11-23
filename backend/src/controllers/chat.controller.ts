import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { hashGuestToken, getIO, broadcastConversationUpdate, normalizeConversationOutput } from '../services/chat.socket';
import { chatBotService } from '../services/chat-bot.service';

const JWT_SECRET = process.env.JWT_SECRET || 'dcor_super_secret_key_2026';

/**
 * Trích xuất định danh khách hàng từ JWT hoặc Header X-Guest-Token
 */
async function identifyCustomer(req: Request): Promise<{
  customerId: string | null;
  guestTokenHash: string | null;
  customerUser: any | null;
}> {
  let customerId: string | null = null;
  let guestTokenHash: string | null = null;
  let customerUser: any | null = null;

  // 1. Kiểm tra JWT Bearer Token
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      if (decoded && decoded.type === 'CUSTOMER' && decoded.userId) {
        customerId = String(decoded.userId);
        customerUser = await prisma.customer.findUnique({
          where: { id: customerId },
        });
      }
    } catch (_) {}
  }

  // 2. Kiểm tra X-Guest-Token Header
  const guestToken = req.headers['x-guest-token'] as string;
  if (guestToken && typeof guestToken === 'string') {
    guestTokenHash = hashGuestToken(guestToken.trim());
  }

  return { customerId, guestTokenHash, customerUser };
}

export const chatController = {
  /**
   * GET /api/chat/greeting
   * Công khai trả lời chào và quickReplies theo trạng thái đăng nhập, KHÔNG tạo hội thoại trong DB
   */
  getGreeting: async (req: Request, res: Response): Promise<void> => {
    try {
      const { customerId, customerUser } = await identifyCustomer(req);
      const settings = await chatBotService.getSettingsMap();

      if (customerId && customerUser) {
        const rawGreeting =
          settings['greetingAuth'] || 'Chào {{name}}! DCor có thể hỗ trợ gì cho không gian sống của bạn hôm nay?';
        const greeting = chatBotService.replaceVariables(rawGreeting, settings, {
          name: customerUser.fullName || 'bạn',
        });
        const quickReplies = [
          { label: '📦 Tình trạng đơn hàng', payload: 'tình trạng đơn hàng' },
          { label: '📐 May đo riêng', payload: 'may đo riêng' },
          { label: '📍 Đặt lịch Showroom', payload: 'đặt lịch showroom' },
        ];

        res.status(200).json({
          isAuthenticated: true,
          customerName: customerUser.fullName,
          greeting,
          quickReplies,
        });
        return;
      }

      // Khách vãng lai (Guest)
      const rawGreeting =
        settings['greetingGuest'] ||
        'Xin chào bạn! Mình là Trợ lý AI của DCor. Bạn đang quan tâm đến mẫu sofa, bàn ghế hay cần giải pháp nội thất nào hôm nay?';
      const greeting = chatBotService.replaceVariables(rawGreeting, settings);
      const quickReplies = [
        { label: '🛋️ Xem mẫu Sofa hot', payload: 'xem mẫu sofa hot' },
        { label: '📐 Tư vấn may đo theo kích thước', payload: 'tư vấn may đo theo kích thước' },
        { label: '📍 Đặt lịch trải nghiệm Showroom', payload: 'đặt lịch trải nghiệm showroom' },
      ];

      res.status(200).json({
        isAuthenticated: false,
        greeting,
        quickReplies,
      });
    } catch (error) {
      console.error('Lỗi getGreeting:', error);
      res.status(500).json({ message: 'Không thể lấy lời chào trợ lý DCor.' });
    }
  },

  /**
   * GET /api/chat/conversations/me
   * Lấy thông tin hội thoại hiện tại của khách
   */
  getMeConversation: async (req: Request, res: Response): Promise<void> => {
    try {
      const { customerId, guestTokenHash } = await identifyCustomer(req);

      if (!customerId && !guestTokenHash) {
        res.status(401).json({ message: 'Vui lòng cung cấp token khách hàng hoặc X-Guest-Token.' });
        return;
      }

      let conversation = null;
      if (customerId) {
        conversation = await prisma.chatConversation.findFirst({
          where: { customerId },
          orderBy: { updatedAt: 'desc' },
        });
      } else if (guestTokenHash) {
        conversation = await prisma.chatConversation.findFirst({
          where: { guestTokenHash },
          orderBy: { updatedAt: 'desc' },
        });
      }

      if (!conversation) {
        res.status(404).json({ message: 'Chưa tìm thấy cuộc trò chuyện nào của bạn.' });
        return;
      }

      // Tuyệt đối không trả về guestTokenHash và chuẩn hóa trạng thái
      const safeOutputConv = normalizeConversationOutput(conversation);
      const { guestTokenHash: _, ...safeConversation } = safeOutputConv;

      let assignedStaffName: string | null = null;
      if (safeOutputConv.assignedStaffId) {
        const staff = await prisma.staffUser.findUnique({
          where: { id: safeOutputConv.assignedStaffId },
          select: { fullName: true },
        });
        assignedStaffName = staff?.fullName || null;
      }

      res.status(200).json({
        conversation: {
          ...safeConversation,
          assignedStaffName,
        },
      });
    } catch (error) {
      console.error('Lỗi getMeConversation:', error);
      res.status(500).json({ message: 'Lỗi máy chủ khi lấy thông tin cuộc trò chuyện.' });
    }
  },

  /**
   * GET /api/chat/conversations/:id/messages?before=&limit=20
   * Lấy lịch sử tin nhắn của hội thoại (chỉ chủ sở hữu)
   */
  getMessages: async (req: Request, res: Response): Promise<void> => {
    try {
      const rawId = req.params.id;
      const id = Array.isArray(rawId) ? rawId[0] : String(rawId || '');
      const { before, limit } = req.query;

      if (!id) {
        res.status(400).json({ message: 'Thiếu mã hội thoại.' });
        return;
      }

      const { customerId, guestTokenHash } = await identifyCustomer(req);

      const conversation = await prisma.chatConversation.findUnique({
        where: { id },
      });

      if (!conversation) {
        res.status(404).json({ message: 'Không tìm thấy cuộc trò chuyện.' });
        return;
      }

      let isOwner = false;
      if (customerId && conversation.customerId === customerId) {
        isOwner = true;
      } else if (guestTokenHash && conversation.guestTokenHash === guestTokenHash) {
        isOwner = true;
        if (customerId && !conversation.customerId) {
          await prisma.chatConversation.update({
            where: { id },
            data: { customerId },
          });
        }
      }

      if (!isOwner) {
        res.status(403).json({ message: 'Bạn không có quyền truy cập vào cuộc trò chuyện này.' });
        return;
      }

      const pageSize = Math.min(50, Math.max(1, Number(limit) || 20));

      const botState = (conversation.botState as any) || {};
      const customerClearedAt = botState.customerClearedAt ? new Date(botState.customerClearedAt) : null;

      const whereClause: any = {
        conversationId: id,
      };

      if (customerClearedAt && !isNaN(customerClearedAt.getTime())) {
        whereClause.createdAt = { gt: customerClearedAt };
      }

      if (before) {
        const beforeDate = new Date(before as string);
        if (!isNaN(beforeDate.getTime())) {
          whereClause.createdAt = {
            ...(whereClause.createdAt || {}),
            lt: beforeDate,
          };
        }
      }

      const messages = await prisma.chatMessage.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        take: pageSize + 1,
      });

      const hasMore = messages.length > pageSize;
      const resultMessages = hasMore ? messages.slice(0, pageSize) : messages;
      resultMessages.reverse();

      res.status(200).json({
        messages: resultMessages,
        hasMore,
      });
    } catch (error) {
      console.error('Lỗi getMessages:', error);
      res.status(500).json({ message: 'Lỗi máy chủ khi lấy tin nhắn.' });
    }
  },

  /**
   * POST /api/chat/conversations/claim
   * Claim sau đăng nhập:
   * Nếu khách đã có hội thoại theo customerId thì GỘP:
   * chuyển mọi tin nhắn của hội thoại guest sang hội thoại của khách (UPDATE conversationId; trùng (conversationId, clientMessageId) thì đặt clientMessageId = null),
   * cộng unreadStaff, cập nhật lastMessageAt/lastMessagePreview theo tin mới nhất, nối internalNote,
   * giữ mode/assignedStaffId/needsHuman của hội thoại đang WAITING_STAFF hoặc STAFF (ưu tiên hội thoại của khách),
   * xóa hội thoại guest, trả conversationId còn lại;
   * chưa có thì gắn customerId vào hội thoại guest.
   * Giữ hành vi pendingHandoff (tin SYSTEM đã đăng nhập, chuyển WAITING_STAFF).
   */
  claimConversation: async (req: Request, res: Response): Promise<void> => {
    try {
      const { customerId, customerUser } = await identifyCustomer(req);
      if (!customerId || !customerUser) {
        res.status(401).json({ message: 'Yêu cầu đăng nhập tài khoản khách hàng để liên kết hội thoại.' });
        return;
      }

      const guestToken = req.body?.guestToken || (req.headers['x-guest-token'] as string);
      if (!guestToken) {
        res.status(400).json({ message: 'Thiếu guestToken để liên kết hội thoại.' });
        return;
      }

      const guestTokenHash = hashGuestToken(guestToken.trim());
      const guestConv = await prisma.chatConversation.findFirst({
        where: { guestTokenHash },
      });

      if (!guestConv) {
        res.status(404).json({ message: 'Không tìm thấy hội thoại vãng lai tương ứng.' });
        return;
      }

      // Kiểm tra xem khách hàng đã có hội thoại theo customerId chưa
      const existingCustomerConv = await prisma.chatConversation.findFirst({
        where: { customerId },
      });

      let finalConversationId = guestConv.id;
      let hadPendingHandoff = false;
      let sysMsgCreated: any = null;

      const guestBotState = (guestConv.botState as any) || {};
      const guestHadPendingHandoff = Boolean(guestBotState.pendingHandoff);

      if (existingCustomerConv && existingCustomerConv.id !== guestConv.id) {
        // GỘP HỘI THOẠI
        finalConversationId = existingCustomerConv.id;
        const custBotState = (existingCustomerConv.botState as any) || {};
        hadPendingHandoff = guestHadPendingHandoff || Boolean(custBotState.pendingHandoff);

        // Lấy tất cả tin nhắn của guestConv
        const guestMessages = await prisma.chatMessage.findMany({
          where: { conversationId: guestConv.id },
        });

        // Tìm các clientMessageId đã tồn tại trong existingCustomerConv
        const existingClientMsgIds = new Set(
          (
            await prisma.chatMessage.findMany({
              where: {
                conversationId: existingCustomerConv.id,
                clientMessageId: { not: null },
              },
              select: { clientMessageId: true },
            })
          ).map((m) => m.clientMessageId)
        );

        await prisma.$transaction(async (tx) => {
          // Chuyển tin nhắn sang existingCustomerConv
          for (const msg of guestMessages) {
            let newClientMsgId = msg.clientMessageId;
            if (newClientMsgId && existingClientMsgIds.has(newClientMsgId)) {
              newClientMsgId = null;
            }
            await tx.chatMessage.update({
              where: { id: msg.id },
              data: {
                conversationId: existingCustomerConv.id,
                clientMessageId: newClientMsgId,
              },
            });
          }

          // Xác định mode, assignedStaffId, needsHuman
          let chosenMode = existingCustomerConv.mode;
          let chosenAssignedStaffId = existingCustomerConv.assignedStaffId;
          let chosenNeedsHuman = existingCustomerConv.needsHuman;

          const isStaffLevel = (m: string) => m === 'STAFF' || m === 'WAITING_STAFF';
          if (!isStaffLevel(existingCustomerConv.mode) && isStaffLevel(guestConv.mode)) {
            chosenMode = guestConv.mode;
            chosenAssignedStaffId = guestConv.assignedStaffId;
            chosenNeedsHuman = guestConv.needsHuman;
          }

          // Nối internalNote
          const notes = [existingCustomerConv.internalNote, guestConv.internalNote]
            .filter((n) => Boolean(n && n.trim()))
            .join('\n---\n');

          // Xác định tin nhắn mới nhất sau khi gộp
          const latestMsg = await tx.chatMessage.findFirst({
            where: { conversationId: existingCustomerConv.id },
            orderBy: { createdAt: 'desc' },
          });

          const mergedBotState = {
            ...guestBotState,
            ...custBotState,
          };
          delete mergedBotState.pendingHandoff;

          const updateCustData: any = {
            unreadStaff: existingCustomerConv.unreadStaff + guestConv.unreadStaff,
            status: 'OPEN',
            mode: chosenMode,
            assignedStaffId: chosenAssignedStaffId,
            needsHuman: chosenNeedsHuman,
            internalNote: notes || null,
            botState: mergedBotState,
            guestName: customerUser.fullName || existingCustomerConv.guestName,
          };

          if (customerUser.phone && !customerUser.phone.startsWith('GOOG_')) {
            updateCustData.guestPhone = customerUser.phone;
          }

          if (latestMsg) {
            updateCustData.lastMessageAt = latestMsg.createdAt;
            updateCustData.lastMessagePreview = (latestMsg.content || '[Hình ảnh]').slice(0, 100);
          }

          if (hadPendingHandoff) {
            updateCustData.mode = 'WAITING_STAFF';
            updateCustData.needsHuman = true;
          }

          await tx.chatConversation.update({
            where: { id: existingCustomerConv.id },
            data: updateCustData,
          });

          // Xóa hội thoại guest
          await tx.chatConversation.delete({
            where: { id: guestConv.id },
          });

          if (hadPendingHandoff) {
            sysMsgCreated = await tx.chatMessage.create({
              data: {
                conversationId: existingCustomerConv.id,
                senderType: 'SYSTEM',
                senderName: 'Hệ thống DCor',
                content: 'Khách hàng đã đăng nhập thành công. Đang kết nối chuyên viên tư vấn...',
              },
            });
          }
        });
      } else {
        // Chưa có hội thoại customer -> Gắn customerId vào guestConv
        hadPendingHandoff = guestHadPendingHandoff;
        delete guestBotState.pendingHandoff;

        const updateData: any = {
          customerId,
          status: 'OPEN',
          guestName: customerUser.fullName || guestConv.guestName,
          botState: guestBotState,
        };

        if (customerUser.phone && !customerUser.phone.startsWith('GOOG_')) {
          updateData.guestPhone = customerUser.phone;
        }

        if (hadPendingHandoff) {
          updateData.mode = 'WAITING_STAFF';
          updateData.needsHuman = true;
        }

        await prisma.$transaction(async (tx) => {
          await tx.chatConversation.update({
            where: { id: guestConv.id },
            data: updateData,
          });

          if (hadPendingHandoff) {
            sysMsgCreated = await tx.chatMessage.create({
              data: {
                conversationId: guestConv.id,
                senderType: 'SYSTEM',
                senderName: 'Hệ thống DCor',
                content: 'Khách hàng đã đăng nhập thành công. Đang kết nối chuyên viên tư vấn...',
              },
            });
          }
        });
      }

      const finalConv = await prisma.chatConversation.findUnique({
        where: { id: finalConversationId },
      });

      try {
        const io = getIO();
        if (sysMsgCreated) {
          io.to(`conv:${finalConversationId}`).emit('chat:message', sysMsgCreated);
        }
        await broadcastConversationUpdate(finalConversationId);
      } catch (_) {}

      res.status(200).json({
        message: 'Đã liên kết hội thoại với tài khoản thành công.',
        conversationId: finalConversationId,
        conversation: finalConv ? normalizeConversationOutput(finalConv) : finalConv,
        hadPendingHandoff,
      });
    } catch (error) {
      console.error('Lỗi claimConversation customer:', error);
      res.status(500).json({ message: 'Lỗi máy chủ khi liên kết hội thoại.' });
    }
  },

  /**
   * DELETE /api/chat/conversations/:id
   * Làm mới của khách KHÔNG xóa hay đóng hội thoại:
   * ghi botState.customerClearedAt = now, chèn tin SYSTEM meta {type:'SESSION_RESET'} (createdAt đúng bằng customerClearedAt),
   * đặt lại botState phiên (fallbackCount, pendingHandoff) nhưng KHÔNG đổi mode nếu đang STAFF hoặc WAITING_STAFF.
   * Phía khách (GET messages và socket): chỉ trả tin có createdAt > customerClearedAt.
   * Phía admin: trả TOÀN BỘ lịch sử kèm tin SESSION_RESET.
   * Khách nhắn tiếp thì dùng cùng hội thoại.
   */
  deleteConversation: async (req: Request, res: Response): Promise<void> => {
    try {
      const rawId = req.params.id;
      const id = Array.isArray(rawId) ? rawId[0] : String(rawId || '');
      const { customerId, guestTokenHash } = await identifyCustomer(req);

      if (!id) {
        res.status(400).json({ message: 'Thiếu mã hội thoại.' });
        return;
      }

      const conv = await prisma.chatConversation.findUnique({
        where: { id },
      });

      if (!conv) {
        res.status(404).json({ message: 'Không tìm thấy cuộc trò chuyện.' });
        return;
      }

      let isOwner = false;
      if (customerId && conv.customerId === customerId) {
        isOwner = true;
      } else if (guestTokenHash && conv.guestTokenHash === guestTokenHash) {
        isOwner = true;
      }

      if (!isOwner) {
        res.status(403).json({ message: 'Bạn không có quyền xóa cuộc trò chuyện này.' });
        return;
      }

      const now = new Date();
      const botState = (conv.botState as any) || {};
      botState.customerClearedAt = now.toISOString();
      delete botState.pendingHandoff;
      delete botState.step;
      delete botState.pendingOrderNumber;
      delete botState.pendingPhone;
      delete botState.lookupAttempts;
      delete botState.lookupResetAt;

      const updateData: any = {
        status: 'OPEN',
        mode: 'BOT',
        assignedStaffId: null,
        needsHuman: false,
        fallbackCount: 0,
        botState,
      };

      let sysResetMsg: any = null;

      await prisma.$transaction(async (tx) => {
        await tx.chatConversation.update({
          where: { id },
          data: updateData,
        });

        sysResetMsg = await tx.chatMessage.create({
          data: {
            conversationId: id,
            senderType: 'SYSTEM',
            senderName: 'Hệ thống DCor',
            content: 'Cuộc trò chuyện đã được làm mới.',
            meta: { type: 'SESSION_RESET' },
            createdAt: now,
          },
        });
      });

      try {
        const io = getIO();
        // Gửi tới phòng hội thoại để admin và khách nhận được
        io.to(`conv:${id}`).emit('chat:session_reset', {
          conversationId: id,
          clearedAt: now.toISOString(),
          message: sysResetMsg,
        });
        await broadcastConversationUpdate(id);
      } catch (_) {}

      res.status(200).json({
        message: 'Đã làm mới cuộc trò chuyện thành công.',
        clearedAt: now.toISOString(),
      });
    } catch (error) {
      console.error('Lỗi deleteConversation:', error);
      res.status(500).json({ message: 'Lỗi máy chủ khi làm mới cuộc trò chuyện.' });
    }
  },

  /**
   * POST /api/chat/conversations/:id/close
   * Bỏ khái niệm hội thoại 'đã đóng' trong luồng thường.
   * 'Kết thúc ca tư vấn' (giữ đường dẫn): gửi tin SYSTEM 'Phiên hỗ trợ trực tiếp đã hoàn thành. Trợ lý AI DCor sẵn sàng tiếp tục đồng hành cùng bạn!',
   * mode về BOT, gỡ assignedStaffId và needsHuman, status giữ OPEN. Bỏ reopen.
   */
  closeConversation: async (req: Request, res: Response): Promise<void> => {
    try {
      const rawId = req.params.id;
      const id = Array.isArray(rawId) ? rawId[0] : String(rawId || '');
      const { customerId, guestTokenHash } = await identifyCustomer(req);

      if (!id) {
        res.status(400).json({ message: 'Thiếu mã hội thoại.' });
        return;
      }

      const conversation = await prisma.chatConversation.findUnique({
        where: { id },
      });

      if (!conversation) {
        res.status(404).json({ message: 'Không tìm thấy cuộc trò chuyện.' });
        return;
      }

      let isOwner = false;
      if (customerId && conversation.customerId === customerId) {
        isOwner = true;
      } else if (guestTokenHash && conversation.guestTokenHash === guestTokenHash) {
        isOwner = true;
      }

      if (!isOwner) {
        res.status(403).json({ message: 'Bạn không có quyền kết thúc cuộc trò chuyện này.' });
        return;
      }

      const updated = await prisma.chatConversation.update({
        where: { id },
        data: {
          status: 'OPEN',
          mode: 'BOT',
          assignedStaffId: null,
          needsHuman: false,
          fallbackCount: 0,
        },
      });

      const sysMsg = await prisma.chatMessage.create({
        data: {
          conversationId: id,
          senderType: 'SYSTEM',
          senderName: 'Hệ thống DCor',
          content: 'Phiên hỗ trợ trực tiếp đã hoàn thành. Trợ lý AI DCor sẵn sàng tiếp tục đồng hành cùng bạn!',
        },
      });

      try {
        const io = getIO();
        io.to(`conv:${id}`).emit('chat:message', sysMsg);
        await broadcastConversationUpdate(id);
      } catch (_) {}

      res.status(200).json({
        message: 'Phiên hỗ trợ đã hoàn tất, trợ lý AI sẵn sàng tiếp tục đồng hành cùng bạn.',
        conversation: normalizeConversationOutput(updated),
      });
    } catch (error) {
      console.error('Lỗi closeConversation:', error);
      res.status(500).json({ message: 'Lỗi máy chủ khi kết thúc cuộc trò chuyện.' });
    }
  },
};
