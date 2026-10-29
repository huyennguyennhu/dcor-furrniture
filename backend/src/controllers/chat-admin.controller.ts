import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../lib/prisma';
import { broadcastConversationUpdate, getIO } from '../services/chat.socket';
import { chatBotService } from '../services/chat-bot.service';

function getParamId(param: string | string[] | undefined): string {
  if (Array.isArray(param)) return param[0] || '';
  return String(param || '');
}

export const chatAdminController = {
  /**
   * GET /api/admin/chat/conversations
   * Lấy danh sách hội thoại có phân trang, bộ lọc và tìm kiếm
   * Ưu tiên needsHuman lên đầu
   */
  getConversations: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { filter, q, page, pageSize } = req.query;
      const currentPage = Math.max(1, Number(page) || 1);
      const limit = Math.min(50, Math.max(1, Number(pageSize) || 20));
      const skip = (currentPage - 1) * limit;

      const whereClause: any = {};

      // Áp dụng bộ lọc
      switch (filter) {
        case 'waiting':
          whereClause.mode = 'WAITING_STAFF';
          whereClause.status = 'OPEN';
          break;
        case 'unread':
          whereClause.unreadStaff = { gt: 0 };
          whereClause.status = 'OPEN';
          break;
        case 'unanswered':
          whereClause.mode = { not: 'BOT' };
          whereClause.unreadStaff = { gt: 0 };
          whereClause.status = 'OPEN';
          break;
        case 'mine':
          whereClause.assignedStaffId = req.user?.userId;
          whereClause.status = 'OPEN';
          break;
        case 'closed':
          whereClause.status = 'CLOSED';
          break;
        case 'all':
        default:
          // Mặc định lấy tất cả các hội thoại
          break;
      }

      // Tìm kiếm từ khóa q
      if (q && typeof q === 'string' && q.trim()) {
        const searchTerm = q.trim();
        whereClause.OR = [
          { guestName: { contains: searchTerm, mode: 'insensitive' } },
          { guestPhone: { contains: searchTerm, mode: 'insensitive' } },
          { lastMessagePreview: { contains: searchTerm, mode: 'insensitive' } },
        ];
      }

      // Sắp xếp: Ưu tiên needsHuman DESC, sau đó đến lastMessageAt DESC
      const [total, conversations] = await Promise.all([
        prisma.chatConversation.count({ where: whereClause }),
        prisma.chatConversation.findMany({
          where: whereClause,
          orderBy: [{ needsHuman: 'desc' }, { lastMessageAt: 'desc' }],
          skip,
          take: limit,
        }),
      ]);

      // Nạp tên nhân sự phụ trách nếu có
      const staffIds = conversations
        .map((c) => c.assignedStaffId)
        .filter((id): id is string => Boolean(id));

      const staffMap = new Map<string, string>();
      if (staffIds.length > 0) {
        const staffList = await prisma.staffUser.findMany({
          where: { id: { in: staffIds } },
          select: { id: true, fullName: true },
        });
        for (const s of staffList) {
          staffMap.set(s.id, s.fullName);
        }
      }

      const safeConversations = conversations.map((conv) => {
        const { guestTokenHash: _, ...rest } = conv;
        return {
          ...rest,
          assignedStaffName: conv.assignedStaffId ? staffMap.get(conv.assignedStaffId) || null : null,
        };
      });

      res.status(200).json({
        conversations: safeConversations,
        total,
        page: currentPage,
        pageSize: limit,
        totalPages: Math.ceil(total / limit),
      });
    } catch (error) {
      console.error('Lỗi getConversations admin:', error);
      res.status(500).json({ message: 'Lỗi máy chủ khi lấy danh sách cuộc trò chuyện.' });
    }
  },

  /**
   * GET /api/admin/chat/conversations/:id
   * Chi tiết cuộc trò chuyện + thông tin khách hàng + 3 đơn hàng gần nhất
   */
  getConversationDetail: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const id = getParamId(req.params.id);
      const conv = await prisma.chatConversation.findUnique({
        where: { id },
      });

      if (!conv) {
        res.status(404).json({ message: 'Không tìm thấy cuộc trò chuyện này.' });
        return;
      }

      // Thông tin khách hàng
      let customerInfo: any = null;
      if (conv.customerId) {
        customerInfo = await prisma.customer.findUnique({
          where: { id: conv.customerId },
          select: {
            id: true,
            fullName: true,
            phone: true,
            email: true,
            avatarUrl: true,
            totalSpent: true,
          },
        });
      }

      // Tra cứu 3 đơn hàng gần nhất
      const phoneToSearch = conv.guestPhone || customerInfo?.phone;
      let recentOrders: any[] = [];
      if (conv.customerId || phoneToSearch) {
        recentOrders = await prisma.order.findMany({
          where: {
            OR: [
              ...(conv.customerId ? [{ customerId: conv.customerId }] : []),
              ...(phoneToSearch ? [{ phone: phoneToSearch }] : []),
            ],
          },
          orderBy: { createdAt: 'desc' },
          take: 3,
          select: {
            id: true,
            orderNumber: true,
            totalAmount: true,
            status: true,
            paymentStatus: true,
            shippingProvider: true,
            trackingCode: true,
            createdAt: true,
          },
        });
      }

      let assignedStaffName: string | null = null;
      if (conv.assignedStaffId) {
        const staff = await prisma.staffUser.findUnique({
          where: { id: conv.assignedStaffId },
          select: { fullName: true },
        });
        assignedStaffName = staff?.fullName || null;
      }

      const { guestTokenHash: _, ...safeConv } = conv;

      res.status(200).json({
        conversation: {
          ...safeConv,
          assignedStaffName,
        },
        customer: customerInfo,
        recentOrders: recentOrders.map((o) => ({
          ...o,
          totalAmount: o.totalAmount.toString(),
        })),
      });
    } catch (error) {
      console.error('Lỗi getConversationDetail:', error);
      res.status(500).json({ message: 'Lỗi máy chủ khi lấy chi tiết cuộc trò chuyện.' });
    }
  },

  /**
   * GET /api/admin/chat/conversations/:id/messages
   */
  getConversationMessages: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const id = getParamId(req.params.id);
      const { before, limit } = req.query;

      const pageSize = Math.min(50, Math.max(1, Number(limit) || 30));
      const whereClause: any = { conversationId: id };

      if (before) {
        const beforeDate = new Date(before as string);
        if (!isNaN(beforeDate.getTime())) {
          whereClause.createdAt = { lt: beforeDate };
        }
      }

      const messages = await prisma.chatMessage.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        take: pageSize + 1,
      });

      const hasMore = messages.length > pageSize;
      const result = hasMore ? messages.slice(0, pageSize) : messages;
      result.reverse();

      res.status(200).json({
        messages: result,
        hasMore,
      });
    } catch (error) {
      console.error('Lỗi getConversationMessages:', error);
      res.status(500).json({ message: 'Lỗi máy chủ khi lấy tin nhắn.' });
    }
  },

  /**
   * POST /api/admin/chat/conversations/:id/claim
   * Nhân sự tiếp nhận hội thoại
   */
  claimConversation: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const id = getParamId(req.params.id);
      const staffId = req.user?.userId;

      if (!staffId) {
        res.status(401).json({ message: 'Không tìm thấy thông tin nhân sự đăng nhập.' });
        return;
      }

      const staff = await prisma.staffUser.findUnique({
        where: { id: staffId },
        select: { fullName: true },
      });

      const staffName = staff?.fullName || 'Chuyên viên tư vấn';

      const updated = await prisma.chatConversation.update({
        where: { id },
        data: {
          mode: 'STAFF',
          assignedStaffId: staffId,
          needsHuman: false,
        },
      });

      // Tạo tin nhắn SYSTEM
      const sysMsg = await prisma.chatMessage.create({
        data: {
          conversationId: id,
          senderType: 'SYSTEM',
          senderName: 'Hệ thống DCor',
          content: `Chuyên viên tư vấn ${staffName} đã tiếp nhận hỗ trợ cuộc trò chuyện.`,
        },
      });

      try {
        const io = getIO();
        io.to(`conv:${id}`).emit('chat:message', sysMsg);
      } catch (_) {}

      await broadcastConversationUpdate(id);

      res.status(200).json({
        message: 'Tiếp nhận cuộc trò chuyện thành công.',
        conversation: updated,
      });
    } catch (error) {
      console.error('Lỗi claimConversation:', error);
      res.status(500).json({ message: 'Không thể tiếp nhận cuộc trò chuyện.' });
    }
  },

  /**
   * POST /api/admin/chat/conversations/:id/transfer
   * Chuyển hội thoại sang nhân viên khác
   */
  transferConversation: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const id = getParamId(req.params.id);
      const { staffId } = req.body;

      if (!staffId) {
        res.status(400).json({ message: 'Vui lòng chọn nhân sự cần chuyển giao.' });
        return;
      }

      const targetStaff = await prisma.staffUser.findUnique({
        where: { id: staffId },
        select: { id: true, fullName: true, status: true },
      });

      if (!targetStaff || targetStaff.status !== 'ACTIVE') {
        res.status(400).json({ message: 'Nhân sự được chọn không tồn tại hoặc đã bị khóa.' });
        return;
      }

      const updated = await prisma.chatConversation.update({
        where: { id },
        data: {
          assignedStaffId: staffId,
          mode: 'STAFF',
          needsHuman: false,
        },
      });

      const sysMsg = await prisma.chatMessage.create({
        data: {
          conversationId: id,
          senderType: 'SYSTEM',
          senderName: 'Hệ thống DCor',
          content: `Cuộc trò chuyện đã được chuyển sang chuyên viên tư vấn ${targetStaff.fullName}.`,
        },
      });

      try {
        const io = getIO();
        io.to(`conv:${id}`).emit('chat:message', sysMsg);
      } catch (_) {}

      await broadcastConversationUpdate(id);

      res.status(200).json({
        message: 'Chuyển giao cuộc trò chuyện thành công.',
        conversation: updated,
      });
    } catch (error) {
      console.error('Lỗi transferConversation:', error);
      res.status(500).json({ message: 'Không thể chuyển giao cuộc trò chuyện.' });
    }
  },

  /**
   * POST /api/admin/chat/conversations/:id/return-to-bot
   * Trả hội thoại về cho bot
   */
  returnToBot: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const id = getParamId(req.params.id);

      const updated = await prisma.chatConversation.update({
        where: { id },
        data: {
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
          content: 'Cuộc trò chuyện đã được chuyển lại cho trợ lý ảo DCor hỗ trợ tự động.',
        },
      });

      try {
        const io = getIO();
        io.to(`conv:${id}`).emit('chat:message', sysMsg);
      } catch (_) {}

      await broadcastConversationUpdate(id);

      res.status(200).json({
        message: 'Đã chuyển cuộc trò chuyện về cho Bot.',
        conversation: updated,
      });
    } catch (error) {
      console.error('Lỗi returnToBot:', error);
      res.status(500).json({ message: 'Không thể chuyển cuộc trò chuyện về cho Bot.' });
    }
  },

  /**
   * POST /api/admin/chat/conversations/:id/close
   * Đóng cuộc trò chuyện
   */
  closeConversation: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const id = getParamId(req.params.id);

      const updated = await prisma.chatConversation.update({
        where: { id },
        data: {
          status: 'CLOSED',
          closedAt: new Date(),
        },
      });

      const sysMsg = await prisma.chatMessage.create({
        data: {
          conversationId: id,
          senderType: 'SYSTEM',
          senderName: 'Hệ thống DCor',
          content: 'Cuộc trò chuyện đã được kết thúc.',
        },
      });

      try {
        const io = getIO();
        io.to(`conv:${id}`).emit('chat:message', sysMsg);
      } catch (_) {}

      await broadcastConversationUpdate(id);

      res.status(200).json({
        message: 'Đã đóng cuộc trò chuyện.',
        conversation: updated,
      });
    } catch (error) {
      console.error('Lỗi closeConversation:', error);
      res.status(500).json({ message: 'Không thể đóng cuộc trò chuyện.' });
    }
  },

  /**
   * POST /api/admin/chat/conversations/:id/reopen
   * Mở lại cuộc trò chuyện
   */
  reopenConversation: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const id = getParamId(req.params.id);

      const updated = await prisma.chatConversation.update({
        where: { id },
        data: {
          status: 'OPEN',
          closedAt: null,
        },
      });

      const sysMsg = await prisma.chatMessage.create({
        data: {
          conversationId: id,
          senderType: 'SYSTEM',
          senderName: 'Hệ thống DCor',
          content: 'Cuộc trò chuyện đã được mở lại.',
        },
      });

      try {
        const io = getIO();
        io.to(`conv:${id}`).emit('chat:message', sysMsg);
      } catch (_) {}

      await broadcastConversationUpdate(id);

      res.status(200).json({
        message: 'Đã mở lại cuộc trò chuyện.',
        conversation: updated,
      });
    } catch (error) {
      console.error('Lỗi reopenConversation:', error);
      res.status(500).json({ message: 'Không thể mở lại cuộc trò chuyện.' });
    }
  },

  /**
   * PUT /api/admin/chat/conversations/:id/note
   * Cập nhật ghi chú nội bộ
   */
  updateInternalNote: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const id = getParamId(req.params.id);
      const { internalNote } = req.body;

      const updated = await prisma.chatConversation.update({
        where: { id },
        data: {
          internalNote: internalNote ? String(internalNote).trim() : null,
        },
      });

      res.status(200).json({
        message: 'Cập nhật ghi chú nội bộ thành công.',
        internalNote: updated.internalNote,
      });
    } catch (error) {
      console.error('Lỗi updateInternalNote:', error);
      res.status(500).json({ message: 'Không thể cập nhật ghi chú nội bộ.' });
    }
  },

  /**
   * GET /api/admin/chat/staff
   * Danh sách nhân sự có thể tiếp nhận hội thoại
   */
  getAvailableStaff: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const staffList = await prisma.staffUser.findMany({
        where: {
          status: 'ACTIVE',
          deletedAt: null,
        },
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
          status: true,
        },
        orderBy: { fullName: 'asc' },
      });

      res.status(200).json({ staff: staffList });
    } catch (error) {
      console.error('Lỗi getAvailableStaff:', error);
      res.status(500).json({ message: 'Không thể lấy danh sách nhân sự.' });
    }
  },

  // ==========================================
  // KỊCH BẢN CHATBOT (SCRIPTS)
  // ==========================================

  /**
   * GET /api/admin/chat/scripts
   */
  getScripts: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const scripts = await prisma.chatBotScript.findMany({
        orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
      });
      res.status(200).json({ scripts });
    } catch (error) {
      console.error('Lỗi getScripts:', error);
      res.status(500).json({ message: 'Không thể lấy danh sách kịch bản bot.' });
    }
  },

  /**
   * POST /api/admin/chat/scripts
   */
  createScript: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { intent, name, patterns, answer, quickReplies, actionType, priority, isActive } = req.body;

      if (!intent || !name || !patterns || !answer) {
        res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ intent, tên kịch bản, câu mẫu và câu trả lời.' });
        return;
      }

      const patternArray = Array.isArray(patterns) ? patterns.filter(Boolean) : [];
      if (patternArray.length < 1) {
        res.status(400).json({ message: 'Kịch bản phải có tối thiểu 1 câu mẫu/từ khóa (patterns).' });
        return;
      }

      if (answer.length > 2000) {
        res.status(400).json({ message: 'Nội dung câu trả lời không được vượt quá 2000 ký tự.' });
        return;
      }

      if (quickReplies && Array.isArray(quickReplies) && quickReplies.length > 6) {
        res.status(400).json({ message: 'Tối đa 6 nút phản hồi nhanh (quick replies).' });
        return;
      }

      // Kiểm tra intent duy nhất
      const existing = await prisma.chatBotScript.findUnique({
        where: { intent: intent.trim().toUpperCase() },
      });

      if (existing) {
        res.status(400).json({ message: `Mã kịch bản (intent) "${intent}" đã tồn tại trên hệ thống.` });
        return;
      }

      const script = await prisma.chatBotScript.create({
        data: {
          intent: intent.trim().toUpperCase(),
          name: name.trim(),
          patterns: patternArray,
          answer: answer.trim(),
          quickReplies: quickReplies || undefined,
          actionType: actionType || 'NONE',
          priority: Number(priority) || 0,
          isActive: isActive !== false,
        },
      });

      res.status(201).json({
        message: 'Tạo kịch bản bot thành công.',
        script,
      });
    } catch (error) {
      console.error('Lỗi createScript:', error);
      res.status(500).json({ message: 'Không thể tạo kịch bản bot.' });
    }
  },

  /**
   * PUT /api/admin/chat/scripts/:id
   */
  updateScript: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const id = getParamId(req.params.id);
      const { name, patterns, answer, quickReplies, actionType, priority, isActive } = req.body;

      if (patterns && Array.isArray(patterns) && patterns.length < 1) {
        res.status(400).json({ message: 'Kịch bản phải có tối thiểu 1 câu mẫu/từ khóa.' });
        return;
      }

      if (answer && answer.length > 2000) {
        res.status(400).json({ message: 'Nội dung câu trả lời không được vượt quá 2000 ký tự.' });
        return;
      }

      if (quickReplies && Array.isArray(quickReplies) && quickReplies.length > 6) {
        res.status(400).json({ message: 'Tối đa 6 nút phản hồi nhanh.' });
        return;
      }

      const updated = await prisma.chatBotScript.update({
        where: { id },
        data: {
          ...(name ? { name: name.trim() } : {}),
          ...(patterns ? { patterns } : {}),
          ...(answer ? { answer: answer.trim() } : {}),
          ...(quickReplies !== undefined ? { quickReplies } : {}),
          ...(actionType ? { actionType } : {}),
          ...(priority !== undefined ? { priority: Number(priority) } : {}),
          ...(isActive !== undefined ? { isActive: !!isActive } : {}),
        },
      });

      res.status(200).json({
        message: 'Cập nhật kịch bản thành công.',
        script: updated,
      });
    } catch (error) {
      console.error('Lỗi updateScript:', error);
      res.status(500).json({ message: 'Không thể cập nhật kịch bản.' });
    }
  },

  /**
   * DELETE /api/admin/chat/scripts/:id
   */
  deleteScript: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const id = getParamId(req.params.id);
      await prisma.chatBotScript.delete({
        where: { id },
      });
      res.status(200).json({ message: 'Xóa kịch bản thành công.' });
    } catch (error) {
      console.error('Lỗi deleteScript:', error);
      res.status(500).json({ message: 'Không thể xóa kịch bản.' });
    }
  },

  /**
   * POST /api/admin/chat/scripts/test
   * Chạy bộ chấm điểm intent, KHÔNG tạo tin nhắn, không có tác dụng phụ
   */
  testScript: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { text } = req.body;
      if (!text || typeof text !== 'string') {
        res.status(400).json({ message: 'Vui lòng cung cấp nội dung câu thử nghiệm (text).' });
        return;
      }

      const result = await chatBotService.testScriptText(text);
      res.status(200).json(result);
    } catch (error) {
      console.error('Lỗi testScript:', error);
      res.status(500).json({ message: 'Không thể kiểm thử kịch bản.' });
    }
  },

  // ==========================================
  // CÀI ĐẶT CHAT & BOT (SETTINGS)
  // ==========================================

  /**
   * GET /api/admin/chat/settings
   */
  getSettings: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const settings = await chatBotService.getSettingsMap();
      res.status(200).json({ settings });
    } catch (error) {
      console.error('Lỗi getSettings:', error);
      res.status(500).json({ message: 'Không thể lấy cấu hình chat.' });
    }
  },

  /**
   * PUT /api/admin/chat/settings
   */
  updateSettings: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const settingsBody = req.body;
      if (!settingsBody || typeof settingsBody !== 'object') {
        res.status(400).json({ message: 'Dữ liệu cấu hình không hợp lệ.' });
        return;
      }

      // 1. Validate workingHours nếu có
      if (settingsBody.workingHours) {
        const wh = settingsBody.workingHours;
        const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
        if (!timeRegex.test(wh.start) || !timeRegex.test(wh.end)) {
          res.status(400).json({ message: 'Giờ làm việc phải theo định dạng HH:mm (ví dụ 08:00, 22:00).' });
          return;
        }
        if (!Array.isArray(wh.days) || wh.days.some((d: any) => typeof d !== 'number' || d < 0 || d > 6)) {
          res.status(400).json({ message: 'Mảng ngày làm việc phải chứa các số từ 0 (Chủ nhật) đến 6 (Thứ bảy).' });
          return;
        }
      }

      // 2. Validate độ dài các tin nhắn cấu hình (<= 500 ký tự)
      const textKeys = ['greeting', 'offlineMessage', 'handoffMessage'];
      for (const k of textKeys) {
        if (settingsBody[k] && typeof settingsBody[k] === 'string' && settingsBody[k].length > 500) {
          res.status(400).json({ message: `Nội dung ${k} không được vượt quá 500 ký tự.` });
          return;
        }
      }

      if (settingsBody.fallbackMessages && Array.isArray(settingsBody.fallbackMessages)) {
        if (settingsBody.fallbackMessages.length < 3) {
          res.status(400).json({ message: 'Danh sách tin nhắn Fallback phải có ít nhất 3 biến thể.' });
          return;
        }
        for (const msg of settingsBody.fallbackMessages) {
          if (typeof msg === 'string' && msg.length > 500) {
            res.status(400).json({ message: 'Mỗi tin nhắn Fallback không được vượt quá 500 ký tự.' });
            return;
          }
        }
      }

      // Lưu từng khóa vào database
      for (const [key, value] of Object.entries(settingsBody)) {
        await prisma.$executeRawUnsafe(
          `INSERT INTO "ChatSetting" ("id", "key", "value", "createdAt", "updatedAt")
           VALUES ($1, $2, $3::jsonb, NOW(), NOW())
           ON CONFLICT ("key") DO UPDATE
           SET "value" = $3::jsonb, "updatedAt" = NOW()`,
          `setting-${key}`,
          key,
          JSON.stringify(value)
        );
      }

      const updatedSettings = await chatBotService.getSettingsMap();
      res.status(200).json({
        message: 'Cập nhật cấu hình thành công.',
        settings: updatedSettings,
      });
    } catch (error) {
      console.error('Lỗi updateSettings:', error);
      res.status(500).json({ message: 'Không thể cập nhật cấu hình.' });
    }
  },
};
