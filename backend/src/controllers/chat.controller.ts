import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { hashGuestToken } from '../services/chat.socket';

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

      const conversation = await prisma.chatConversation.findFirst({
        where: {
          OR: [
            ...(customerId ? [{ customerId }] : []),
            ...(guestTokenHash ? [{ guestTokenHash }] : []),
          ],
        },
        orderBy: { updatedAt: 'desc' },
      });

      if (!conversation) {
        res.status(404).json({ message: 'Chưa tìm thấy cuộc trò chuyện nào của bạn.' });
        return;
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
      const isOwner =
        (customerId && conversation.customerId === customerId) ||
        (guestTokenHash && conversation.guestTokenHash === guestTokenHash);

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
};
