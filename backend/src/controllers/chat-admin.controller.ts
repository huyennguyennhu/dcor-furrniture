import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../lib/prisma';
import { broadcastConversationUpdate, getIO, normalizeConversationOutput } from '../services/chat.socket';
import { chatBotService } from '../services/chat-bot.service';

function getParamId(param: string | string[] | undefined): string {
  if (Array.isArray(param)) return param[0] || '';
  return String(param || '');
}

export const chatAdminController = {
  /**
   * GET /api/admin/chatbox/summary
   * Thống kê hội thoại: {total, waiting, mine, unread, resolved}
   */
  getSummary: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const currentStaffId = req.user?.userId || req.user?.id;

      const [total, waiting, mine, unread, resolved] = await Promise.all([
        // Tổng số hội thoại
        prisma.chatConversation.count(),
        // Chờ nhân viên tiếp nhận (mode = WAITING_STAFF và status = OPEN)
        prisma.chatConversation.count({
          where: { mode: 'WAITING_STAFF', status: 'OPEN' },
        }),
        // Hội thoại của chính nhân viên đang đăng nhập và status = OPEN
        currentStaffId
          ? prisma.chatConversation.count({
              where: { assignedStaffId: currentStaffId, status: 'OPEN' },
            })
          : 0,
        // Hội thoại có tin nhắn chưa đọc của nhân sự (unreadStaff > 0 và status = OPEN)
        prisma.chatConversation.count({
          where: { unreadStaff: { gt: 0 }, status: 'OPEN' },
        }),
        // Hội thoại đã xử lý / hoàn tất (status = CLOSED)
        prisma.chatConversation.count({
          where: { status: 'CLOSED' },
        }),
      ]);

      res.status(200).json({
        total,
        waiting,
        mine,
        unread,
        resolved,
      });
    } catch (error) {
      console.error('Lỗi getSummary chat admin:', error);
      res.status(500).json({ message: 'Lỗi máy chủ khi lấy dữ liệu thống kê chatbox.' });
    }
  },

  /**
   * GET /api/admin/chatbox/conversations
   * Lấy danh sách hội thoại có phân trang, bộ lọc và tìm kiếm.
   * Danh sách hiển thị 'Khách vãng lai #<4 ký tự cuối id>' khi không có tên;
   * Bỏ filter 'closed' và 'unanswered', giữ all|unread|waiting|mine;
   * Thêm customerType ('MEMBER' | 'GUEST');
   * Không trả phone nếu rỗng hoặc dạng giả GOOG_...
   */
  getConversations: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { filter, q, page, pageSize } = req.query;
      const currentPage = Math.max(1, Number(page) || 1);
      const limit = Math.min(50, Math.max(1, Number(pageSize) || 20));
      const skip = (currentPage - 1) * limit;

      const whereClause: any = {};

      switch (filter) {
        case 'waiting':
          whereClause.mode = 'WAITING_STAFF';
          whereClause.status = 'OPEN';
          break;
        case 'unanswered':
          whereClause.mode = 'STAFF';
          whereClause.status = 'OPEN';
          whereClause.messages = {
            some: {
              senderType: 'CUSTOMER',
            },
          };
          break;
        case 'unread':
          whereClause.unreadStaff = { gt: 0 };
          whereClause.status = 'OPEN';
          break;
        case 'mine':
          whereClause.assignedStaffId = req.user?.userId || req.user?.id;
          whereClause.status = 'OPEN';
          break;
        case 'all':
        default:
          break;
      }

      if (q && typeof q === 'string' && q.trim()) {
        const searchTerm = q.trim();
        whereClause.OR = [
          { guestName: { contains: searchTerm, mode: 'insensitive' } },
          { guestPhone: { contains: searchTerm, mode: 'insensitive' } },
          { lastMessagePreview: { contains: searchTerm, mode: 'insensitive' } },
        ];
      }

      // Đếm counts toàn cục { all, waiting, unanswered } độc lập với filter hiện tại và phân trang
      const [countAll, countWaiting, staffConvsForCount] = await Promise.all([
        prisma.chatConversation.count(),
        prisma.chatConversation.count({
          where: { mode: 'WAITING_STAFF', status: 'OPEN' },
        }),
        prisma.chatConversation.findMany({
          where: { mode: 'STAFF', status: 'OPEN' },
          select: {
            id: true,
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              select: { senderType: true },
            },
          },
        }),
      ]);

      const countUnanswered = staffConvsForCount.filter(
        (c) => c.messages.length > 0 && c.messages[0].senderType === 'CUSTOMER'
      ).length;

      const counts = {
        all: countAll,
        waiting: countWaiting,
        unanswered: countUnanswered,
      };

      let conversations: any[] = [];
      let total = 0;

      if (filter === 'unanswered') {
        // Lấy tất cả hội thoại mode STAFF (áp dụng q nếu có) rồi lọc tin nhắn cuối do CUSTOMER gửi
        const staffWhere: any = {
          mode: 'STAFF',
          status: 'OPEN',
        };
        if (whereClause.OR) staffWhere.OR = whereClause.OR;

        const allCandidateStaffConvs = await prisma.chatConversation.findMany({
          where: staffWhere,
          include: {
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              select: { senderType: true },
            },
          },
          orderBy: { lastMessageAt: 'desc' },
        });

        const filtered = allCandidateStaffConvs.filter(
          (c) => c.messages.length > 0 && c.messages[0].senderType === 'CUSTOMER'
        );
        total = filtered.length;
        conversations = filtered.slice(skip, skip + limit);
      } else {
        const [cnt, list] = await Promise.all([
          prisma.chatConversation.count({ where: whereClause }),
          prisma.chatConversation.findMany({
            where: whereClause,
            orderBy: [{ needsHuman: 'desc' }, { lastMessageAt: 'desc' }],
            skip,
            take: limit,
          }),
        ]);
        total = cnt;
        conversations = list;
      }

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

      const safeConversations = conversations.map((rawConv) => {
        const conv = normalizeConversationOutput(rawConv);
        const { guestTokenHash: _, messages: _msgs, ...rest } = conv as any;

        // Định dạng hiển thị 'Khách vãng lai #<4 ký tự cuối id>' khi không có tên hoặc rỗng
        const displayName =
          conv.guestName && conv.guestName.trim()
            ? conv.guestName.trim()
            : `Khách vãng lai #${conv.id.slice(-4)}`;

        // Không bao giờ hiển thị SĐT dạng GOOG_... hoặc nếu rỗng
        let displayPhone = conv.guestPhone || '';
        if (displayPhone.startsWith('GOOG_')) {
          displayPhone = '';
        }

        const customerType: 'MEMBER' | 'GUEST' = conv.customerId ? 'MEMBER' : 'GUEST';

        return {
          ...rest,
          customerType,
          guestName: displayName,
          guestPhone: displayPhone,
          assignedStaffName: conv.assignedStaffId ? staffMap.get(conv.assignedStaffId) || null : null,
        };
      });

      res.status(200).json({
        conversations: safeConversations,
        total,
        page: currentPage,
        pageSize: limit,
        totalPages: Math.ceil(total / limit),
        counts,
      });
    } catch (error) {
      console.error('Lỗi getConversations admin:', error);
      res.status(500).json({ message: 'Lỗi máy chủ khi lấy danh sách cuộc trò chuyện.' });
    }
  },

  /**
   * GET /api/admin/chatbox/conversations/:id
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

      const phoneToSearch = conv.guestPhone || customerInfo?.phone;
      let recentOrders: any[] = [];
      const searchPhones = phoneToSearch && !phoneToSearch.startsWith('GOOG_') ? [phoneToSearch] : [];

      if (conv.customerId || searchPhones.length > 0) {
        recentOrders = await prisma.order.findMany({
          where: {
            OR: [
              ...(conv.customerId ? [{ customerId: conv.customerId }] : []),
              ...(searchPhones.length > 0 ? [{ phone: { in: searchPhones } }] : []),
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

      const safeOutputConv = normalizeConversationOutput(conv);
      let assignedStaffName: string | null = null;
      if (safeOutputConv.assignedStaffId) {
        const staff = await prisma.staffUser.findUnique({
          where: { id: safeOutputConv.assignedStaffId },
          select: { fullName: true },
        });
        assignedStaffName = staff?.fullName || null;
      }

      const { guestTokenHash: _, ...safeConv } = safeOutputConv;

      const displayName =
        safeOutputConv.guestName && safeOutputConv.guestName.trim()
          ? safeOutputConv.guestName.trim()
          : `Khách vãng lai #${safeOutputConv.id.slice(-4)}`;

      let displayPhone = safeOutputConv.guestPhone || '';
      if (displayPhone.startsWith('GOOG_')) {
        displayPhone = '';
      }

      const customerType: 'MEMBER' | 'GUEST' = safeOutputConv.customerId ? 'MEMBER' : 'GUEST';

      res.status(200).json({
        conversation: {
          ...safeConv,
          customerType,
          guestName: displayName,
          guestPhone: displayPhone,
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
   * GET /api/admin/chatbox/conversations/:id/messages
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
   * POST /api/admin/chatbox/conversations/:id/claim
   * Nhân sự tiếp nhận hội thoại
   */
  claimConversation: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const id = getParamId(req.params.id);
      const staffId = req.user?.userId || req.user?.id;

      if (!staffId || req.user?.type === 'CUSTOMER') {
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
        conversation: normalizeConversationOutput(updated),
      });
    } catch (error) {
      console.error('Lỗi claimConversation:', error);
      res.status(500).json({ message: 'Không thể tiếp nhận cuộc trò chuyện.' });
    }
  },

  /**
   * POST /api/admin/chatbox/conversations/:id/return-to-bot
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
        conversation: normalizeConversationOutput(updated),
      });
    } catch (error) {
      console.error('Lỗi returnToBot:', error);
      res.status(500).json({ message: 'Không thể chuyển cuộc trò chuyện về cho Bot.' });
    }
  },

  /**
   * POST /api/admin/chatbox/conversations/:id/close
   * Nhân viên "Kết thúc ca tư vấn":
   * Gửi SYSTEM 'Phiên hỗ trợ trực tiếp đã hoàn thành. Trợ lý AI DCor sẵn sàng tiếp tục đồng hành cùng bạn!',
   * mode về BOT, gỡ assignedStaffId và needsHuman, status giữ OPEN. Bỏ reopen.
   */
  closeConversation: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const id = getParamId(req.params.id);

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
          content:
            'Phiên hỗ trợ trực tiếp đã hoàn thành. Trợ lý AI DCor sẵn sàng tiếp tục đồng hành cùng bạn!',
        },
      });

      try {
        const io = getIO();
        io.to(`conv:${id}`).emit('chat:message', sysMsg);
      } catch (_) {}

      await broadcastConversationUpdate(id);

      res.status(200).json({
        message: 'Phiên hỗ trợ trực tiếp đã hoàn thành. Trợ lý AI DCor sẵn sàng tiếp tục đồng hành cùng bạn!',
        conversation: normalizeConversationOutput(updated),
      });
    } catch (error) {
      console.error('Lỗi closeConversation:', error);
      res.status(500).json({ message: 'Không thể đóng cuộc trò chuyện.' });
    }
  },

  /**
   * POST /api/admin/chatbox/conversations/:id/reopen
   * Bỏ reopen trong mô hình mới (luôn duy trì OPEN)
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

      res.status(200).json({
        message: 'Hội thoại đã ở trạng thái mở.',
        conversation: updated,
      });
    } catch (error) {
      console.error('Lỗi reopenConversation:', error);
      res.status(500).json({ message: 'Không thể mở lại cuộc trò chuyện.' });
    }
  },

  /**
   * PUT /api/admin/chatbox/conversations/:id/note
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

  // ==========================================
  // KỊCH BẢN CHATBOT (SCRIPTS)
  // ==========================================

  /**
   * GET /api/admin/chatbox/scripts
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
   * POST /api/admin/chatbox/scripts
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
   * PUT /api/admin/chatbox/scripts/:id
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
   * DELETE /api/admin/chatbox/scripts/:id
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
   * POST /api/admin/chatbox/scripts/test
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
   * GET /api/admin/chatbox/settings
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
   * PUT /api/admin/chatbox/settings
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
          res.status(400).json({ message: 'Giờ làm việc phải theo định dạng HH:mm (ví dụ 08:00, 21:30).' });
          return;
        }
        if (!Array.isArray(wh.days) || wh.days.some((d: any) => typeof d !== 'number' || d < 0 || d > 6)) {
          res.status(400).json({ message: 'Mảng ngày làm việc phải chứa các số từ 0 (Chủ nhật) đến 6 (Thứ bảy).' });
          return;
        }
      }

      // 2. Validate độ dài các tin nhắn cấu hình (<= 500 ký tự)
      const textKeys = ['greetingGuest', 'greetingAuth', 'greeting', 'offlineMessage', 'handoffMessage'];
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
