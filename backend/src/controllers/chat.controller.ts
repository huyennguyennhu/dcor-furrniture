import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { hashGuestToken, getIO, broadcastConversationUpdate } from '../services/chat.socket';

const JWT_SECRET = process.env.JWT_SECRET || 'dcor_super_secret_key_2026';

/**
 * Trích xuất định danh khách hàng từ JWT hoặc Header X-Guest-Token
 */
async function identifyCustomer(req: Request): Promise<{
  customerId: string | null;
  guestTokenHash: string | null;
}> {
  let customerId: string | null = null;
  let guestTokenHash: string | null = null;

  // 1. Kiểm tra JWT Bearer Token
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      if (decoded && decoded.type === 'CUSTOMER' && decoded.userId) {
        customerId = decoded.userId;
      }
    } catch (_) {}
  }

  // 2. Kiểm tra X-Guest-Token Header
  const guestToken = req.headers['x-guest-token'] as string;
  if (guestToken && typeof guestToken === 'string') {
    guestTokenHash = hashGuestToken(guestToken.trim());
  }

  return { customerId, guestTokenHash };
}

export const chatController = {
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
      if (customerId && guestTokenHash) {
        conversation = await prisma.chatConversation.findFirst({
          where: {
            OR: [{ customerId }, { guestTokenHash }],
          },
          orderBy: { updatedAt: 'desc' },
        });
        if (conversation && !conversation.customerId) {
          await prisma.chatConversation.update({
            where: { id: conversation.id },
            data: { customerId },
          });
        }
      } else if (customerId) {
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

      // KIỂM TRA TỰ ĐỘNG ĐÓNG PHIÊN CŨ (INACTIVITY TIMEOUT)
      // Nếu hội thoại còn OPEN nhưng tin nhắn cuối đã hơn 12 tiếng hoặc qua ngày hôm sau (>4h)
      if (conversation.status === 'OPEN') {
        const lastActivityTime = new Date(
          conversation.lastMessageAt || conversation.updatedAt || conversation.createdAt
        ).getTime();
        const now = Date.now();
        const diffHours = (now - lastActivityTime) / (1000 * 60 * 60);

        const lastDate = new Date(lastActivityTime);
        const nowDate = new Date(now);
        const isDifferentDay =
          lastDate.getDate() !== nowDate.getDate() ||
          lastDate.getMonth() !== nowDate.getMonth() ||
          lastDate.getFullYear() !== nowDate.getFullYear();

        if (diffHours >= 12 || (isDifferentDay && diffHours >= 4)) {
          conversation = await prisma.chatConversation.update({
            where: { id: conversation.id },
            data: {
              status: 'CLOSED',
              closedAt: new Date(),
            },
          });

          await prisma.chatMessage.create({
            data: {
              conversationId: conversation.id,
              senderType: 'SYSTEM',
              senderName: 'Hệ thống DCor',
              content: 'Cuộc trò chuyện đã tự động kết thúc do không có hoạt động mới.',
            },
          });
        }
      }

      // Tuyệt đối không trả về guestTokenHash
      const { guestTokenHash: _, ...safeConversation } = conversation;

      let assignedStaffName: string | null = null;
      if (conversation.assignedStaffId) {
        const staff = await prisma.staffUser.findUnique({
          where: { id: conversation.assignedStaffId },
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

      // Tìm hội thoại
      const conversation = await prisma.chatConversation.findUnique({
        where: { id },
      });

      if (!conversation) {
        res.status(404).json({ message: 'Không tìm thấy cuộc trò chuyện.' });
        return;
      }

      // Kiểm tra quyền sở hữu
      let isOwner = false;
      if (customerId && conversation.customerId === customerId) {
        isOwner = true;
      } else if (guestTokenHash && conversation.guestTokenHash === guestTokenHash) {
        isOwner = true;
        // Nếu khách hàng đã đăng nhập nhưng hội thoại này trước đó tạo bằng guestToken của chính họ,
        // liên kết customerId vào cuộc trò chuyện để các lần gọi sau đồng bộ chuẩn xác
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

      const whereClause: any = {
        conversationId: id,
      };

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
      const resultMessages = hasMore ? messages.slice(0, pageSize) : messages;

      // Đảo ngược để trả về thứ tự thời gian tăng dần
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
   * POST /api/chat/conversations/:id/close
   * Khách hàng kết thúc cuộc trò chuyện
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

      if (conversation.status === 'CLOSED') {
        res.status(200).json({ message: 'Cuộc trò chuyện đã kết thúc.', conversation });
        return;
      }

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
        io.to(`conv:${id}`).emit('chat:conversation', {
          id: updated.id,
          mode: updated.mode,
          status: 'CLOSED',
          closedAt: updated.closedAt,
        });
        await broadcastConversationUpdate(id);
      } catch (_) {}

      res.status(200).json({
        message: 'Đã kết thúc cuộc trò chuyện thành công.',
        conversation: updated,
      });
    } catch (error) {
      console.error('Lỗi closeConversation:', error);
      res.status(500).json({ message: 'Lỗi máy chủ khi kết thúc cuộc trò chuyện.' });
    }
  },
};
