import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { iamService } from '../lib/iam.service';
import { getStaffMetadata } from '../lib/staff-metadata';
import { chatBotService } from './chat-bot.service';

const JWT_SECRET = process.env.JWT_SECRET || 'dcor_super_secret_key_2026';

let io: Server | null = null;

// Hàng đợi tuần tự xử lý tin nhắn theo từng hội thoại (chống race condition và đảo lộn thứ tự)
const conversationQueues = new Map<string, Promise<void>>();

// Map khóa Promise trong bộ nhớ để bảo đảm thao tác 'tìm hoặc tạo' hội thoại là duy nhất khi chạy đồng thời
const conversationInitLocks = new Map<string, Promise<any>>();

export function normalizeConversationOutput<T extends { status?: string; mode?: string; assignedStaffId?: string | null; needsHuman?: boolean }>(conv: T): T {
  if (conv && conv.status === 'CLOSED') {
    return {
      ...conv,
      status: 'OPEN',
      mode: conv.mode === 'STAFF' ? 'BOT' : (conv.mode || 'BOT'),
      assignedStaffId: conv.mode === 'STAFF' ? null : conv.assignedStaffId,
      needsHuman: conv.mode === 'STAFF' ? false : conv.needsHuman,
    };
  }
  return conv;
}

// Bộ đếm giới hạn tốc độ tin nhắn: 20 tin / phút mỗi socket
const socketMessageTimestamps = new Map<string, number[]>();

export function getIO(): Server {
  if (!io) {
    throw new Error('Socket.io chưa được khởi tạo! Vui lòng gọi initChatSocket(server) trước.');
  }
  return io;
}

export function hashGuestToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Tìm hoặc tạo hội thoại duy nhất an toàn khi chạy đồng thời.
 * Sử dụng lock theo Map<string, Promise> trong bộ nhớ + catch unique violation và đọc lại.
 */
export async function getOrCreateConversation(params: {
  customerId?: string | null;
  guestTokenHash?: string | null;
  name?: string;
  phone?: string;
  initialPreview?: string;
}): Promise<{ conversation: any; isExisting: boolean; guestToken: string | null }> {
  const lockKey = params.customerId
    ? `CUST:${params.customerId}`
    : params.guestTokenHash
    ? `GUEST_HASH:${params.guestTokenHash}`
    : `NEW_GUEST:${Math.random().toString(36).substring(2, 9)}`;

  while (conversationInitLocks.has(lockKey)) {
    try {
      await conversationInitLocks.get(lockKey);
    } catch (_) {}
  }

  let resolveLock!: (val: any) => void;
  const lockPromise = new Promise((resolve) => {
    resolveLock = resolve;
  });
  conversationInitLocks.set(lockKey, lockPromise);

  try {
    let finalName = 'Khách vãng lai';
    let finalPhone = '';

    // 1. Nếu có customerId: kiểm tra DB trước
    if (params.customerId) {
      const customer = await prisma.customer.findUnique({
        where: { id: params.customerId },
      });
      if (customer) {
        if (customer.fullName && customer.fullName.trim()) finalName = customer.fullName.trim();
        if (customer.phone && !customer.phone.startsWith('GOOG_')) finalPhone = customer.phone;
      }

      let existing = await prisma.chatConversation.findFirst({
        where: { customerId: params.customerId },
      });
      if (existing) {
        if (existing.status !== 'OPEN') {
          existing = await prisma.chatConversation.update({
            where: { id: existing.id },
            data: { status: 'OPEN', closedAt: null },
          });
        }
        return { conversation: existing, isExisting: true, guestToken: null };
      }
    } else if (params.guestTokenHash) {
      let existing = await prisma.chatConversation.findFirst({
        where: { guestTokenHash: params.guestTokenHash },
      });
      if (existing) {
        if (existing.status !== 'OPEN') {
          existing = await prisma.chatConversation.update({
            where: { id: existing.id },
            data: { status: 'OPEN', closedAt: null },
          });
        }
        return { conversation: existing, isExisting: true, guestToken: null };
      }
      if (params.name && params.name.trim()) finalName = params.name.trim();
      if (params.phone && params.phone.trim() && !params.phone.startsWith('GOOG_')) finalPhone = params.phone.trim();
    } else {
      if (params.name && params.name.trim()) finalName = params.name.trim();
      if (params.phone && params.phone.trim() && !params.phone.startsWith('GOOG_')) finalPhone = params.phone.trim();
    }

    // 2. Tạo mới với token
    const guestToken = params.guestTokenHash ? null : crypto.randomBytes(32).toString('hex');
    const guestTokenHash = params.guestTokenHash || (guestToken ? hashGuestToken(guestToken) : null);

    let conversation: any = null;
    let isExisting = false;

    try {
      conversation = await prisma.$transaction(async (tx) => {
        if (params.customerId) {
          const checkCust = await tx.chatConversation.findFirst({
            where: { customerId: params.customerId },
          });
          if (checkCust) return checkCust;
        } else if (guestTokenHash) {
          const checkGuest = await tx.chatConversation.findFirst({
            where: { guestTokenHash },
          });
          if (checkGuest) return checkGuest;
        }

        return await tx.chatConversation.create({
          data: {
            customerId: params.customerId || null,
            guestName: finalName,
            guestPhone: finalPhone,
            guestTokenHash,
            mode: 'BOT',
            status: 'OPEN',
            unreadCustomer: 1,
            lastMessagePreview: params.initialPreview || 'Xin chào bạn! Mình là Trợ lý AI của DCor...',
          },
        });
      });
    } catch (dbErr: any) {
      // Bắt lỗi vi phạm unique (P2002) hoặc race condition, đọc lại hội thoại đã tạo
      if (params.customerId) {
        conversation = await prisma.chatConversation.findFirst({
          where: { customerId: params.customerId },
        });
        isExisting = true;
      } else if (guestTokenHash) {
        conversation = await prisma.chatConversation.findFirst({
          where: { guestTokenHash },
        });
        isExisting = true;
      }
      if (!conversation) throw dbErr;
    }

    if (conversation.customerId && params.customerId) {
      const checkCount = await prisma.chatMessage.count({
        where: { conversationId: conversation.id },
      });
      if (checkCount > 0) isExisting = true;
    }

    return { conversation, isExisting, guestToken };
  } finally {
    conversationInitLocks.delete(lockKey);
    resolveLock(true);
  }
}

/**
 * Tính tổng số tin nhắn chưa đọc của toàn bộ nhân sự
 */
export async function getTotalUnreadStaffCount(): Promise<number> {
  try {
    const aggregate = await prisma.chatConversation.aggregate({
      _sum: { unreadStaff: true },
      where: { status: 'OPEN' },
    });
    return aggregate._sum.unreadStaff || 0;
  } catch (e) {
    return 0;
  }
}

/**
 * Phát cập nhật thông tin hội thoại tới room staff và room khách
 */
export async function broadcastConversationUpdate(conversationId: string) {
  if (!io) return;
  try {
    const conv = await prisma.chatConversation.findUnique({
      where: { id: conversationId },
    });
    if (!conv) return;

    const safeConv = normalizeConversationOutput(conv);
    let assignedStaffName: string | null = null;
    if (safeConv.assignedStaffId) {
      const staff = await prisma.staffUser.findUnique({
        where: { id: safeConv.assignedStaffId },
        select: { fullName: true },
      });
      assignedStaffName = staff?.fullName || null;
    }

    // Hiển thị Khách vãng lai #<4 ký tự cuối id> nếu không có tên
    const displayName = safeConv.guestName && safeConv.guestName.trim()
      ? safeConv.guestName
      : `Khách vãng lai #${safeConv.id.slice(-4)}`;

    const payload = {
      id: safeConv.id,
      guestName: displayName,
      guestPhone: safeConv.guestPhone || '',
      customerId: safeConv.customerId,
      mode: safeConv.mode,
      status: safeConv.status,
      assignedStaffId: safeConv.assignedStaffId,
      assignedStaffName,
      needsHuman: safeConv.needsHuman,
      unreadStaff: safeConv.unreadStaff,
      unreadCustomer: safeConv.unreadCustomer,
      lastMessageAt: safeConv.lastMessageAt,
      lastMessagePreview: safeConv.lastMessagePreview,
    };

    io.to(`conv:${conv.id}`).emit('chat:conversation', payload);
    io.to('staff').emit('staff:conversation:update', payload);

    const totalUnread = await getTotalUnreadStaffCount();
    io.to('staff').emit('staff:unread', { total: totalUnread });
  } catch (error) {
    console.error('Lỗi broadcastConversationUpdate:', error);
  }
}

/**
 * Khởi tạo Socket.IO Server
 */
export function initChatSocket(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 30000,
    pingInterval: 25000,
  });

  io.use(async (socket: Socket, next) => {
    try {
      const auth = socket.handshake.auth || {};
      const token = auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');

      // 1. Kiểm tra nếu là nhân sự (Staff token hợp lệ và tài khoản ACTIVE)
      if (token) {
        try {
          const decoded: any = jwt.verify(token, JWT_SECRET);
          // Token phải có email và tuyệt đối không phải là token khách hàng
          if (decoded && decoded.type !== 'CUSTOMER' && decoded.email) {
            const staff = await prisma.staffUser.findUnique({
              where: { email: decoded.email.toLowerCase() },
              select: { id: true, fullName: true, role: true, status: true, deletedAt: true },
            });

            if (staff && staff.status === 'ACTIVE' && staff.deletedAt === null) {
              const iamUser: any = {
                ...decoded,
                userId: staff.id,
                id: staff.id,
                email: decoded.email,
                role: staff.role,
                roles: decoded.roles || (staff.role ? [staff.role] : []),
                type: 'STAFF',
              };

              const metadata = getStaffMetadata(decoded.email);
              if (metadata && Array.isArray(metadata.roles) && metadata.roles.length > 0) {
                iamUser.roles = metadata.roles;
                iamUser.role = metadata.role || metadata.roles[0];
              }

              const canChatView = iamService.hasPermission(iamUser, 'chat', 'view');
              const canChatEdit = iamService.hasPermission(iamUser, 'chat', 'edit');

              socket.data.isStaff = true;
              socket.data.staffUser = staff;
              socket.data.iamUser = iamUser;
              socket.data.userId = staff.id;
              socket.data.canChatView = canChatView;
              socket.data.canChatEdit = canChatEdit;

              return next();
            }
          }
        } catch (_) {}
      }

      // 2. Kiểm tra nếu là khách hàng đã đăng nhập (customerToken)
      const customerToken = auth.customerToken || token;
      if (customerToken) {
        try {
          const decoded: any = jwt.verify(customerToken, JWT_SECRET);
          if (decoded && decoded.type === 'CUSTOMER' && decoded.userId) {
            socket.data.isCustomer = true;
            socket.data.customerId = decoded.userId;
            socket.data.isStaff = false;
            socket.data.canChatView = false;
            socket.data.canChatEdit = false;
            return next();
          }
        } catch (_) {}
      }

      // 3. Khách vãng lai với guestToken
      if (auth.guestToken) {
        const hash = hashGuestToken(auth.guestToken);
        const conv = await prisma.chatConversation.findFirst({
          where: { guestTokenHash: hash },
        });
        if (conv) {
          socket.data.conversationId = conv.id;
          socket.data.isGuest = true;
          socket.data.guestTokenHash = hash;
          socket.data.isStaff = false;
          socket.data.canChatView = false;
          socket.data.canChatEdit = false;
        }
      }

      return next();
    } catch (err) {
      return next(new Error('Lỗi xác thực kết nối Socket'));
    }
  });

  io.on('connection', async (socket: Socket) => {
    // Chỉ cho vào room 'staff' khi token là token nhân sự VÀ có quyền xem phân hệ chat
    if (socket.data.isStaff && socket.data.canChatView && !socket.data.isCustomer && !socket.data.isGuest) {
      socket.join('staff');
      const totalUnread = await getTotalUnreadStaffCount();
      socket.emit('staff:unread', { total: totalUnread });
    }

    // Nếu đã có conversationId từ handshake -> vào room hội thoại
    if (socket.data.conversationId) {
      socket.join(`conv:${socket.data.conversationId}`);
    }

    // ========================================================
    // SỰ KIỆN KHÁCH HÀNG -> SERVER
    // ========================================================

    // 1. chat:init (Khách vãng lai ZERO FRICTION: Không yêu cầu tên/SĐT)
    // Nhận rỗng: tạo hội thoại guestName 'Khách vãng lai', guestPhone rỗng
    // Khách đăng nhập: tìm hội thoại theo customerId; có thì dùng lại (đưa status về OPEN), chưa có thì tạo.
    // Không bao giờ có hai hội thoại cùng customerId (dùng memory lock + transaction + xử lý lỗi vi phạm unique).
    socket.on('chat:init', async (data?: { name?: string; phone?: string }, callback?: (res: any) => void) => {
      try {
        const { conversation, isExisting, guestToken } = await getOrCreateConversation({
          customerId: socket.data.customerId,
          guestTokenHash: socket.data.guestTokenHash,
          name: data?.name,
          phone: data?.phone,
        });

        let firstMsg: any = null;

        if (!isExisting) {
          // Lấy lời chào và quick replies từ ChatSetting theo trạng thái đăng nhập
          const settings = await chatBotService.getSettingsMap();
          let greetingText = '';
          let quickReplies: any[] = [];

          if (socket.data.customerId) {
            greetingText = 'Chào {{name}}! DCor có thể hỗ trợ gì cho bạn hôm nay?';
            greetingText = chatBotService.replaceVariables(greetingText, settings, { name: conversation.guestName || 'bạn' });
            quickReplies = [
              { label: '📦 Tình trạng đơn hàng', payload: 'tình trạng đơn hàng' },
              { label: '📐 May đo riêng', payload: 'may đo riêng' },
              { label: '📍 Đặt lịch Showroom', payload: 'đặt lịch showroom' },
            ];
          } else {
            greetingText = 'Xin chào bạn! DCor có thể hỗ trợ gì cho bạn hôm nay?';
            greetingText = chatBotService.replaceVariables(greetingText, settings);
            quickReplies = [
              { label: '🛋️ Xem mẫu Sofa hot', payload: 'xem mẫu sofa hot' },
              { label: '📐 Tư vấn may đo theo kích thước', payload: 'tư vấn may đo theo kích thước' },
              { label: '📍 Đặt lịch trải nghiệm Showroom', payload: 'đặt lịch trải nghiệm showroom' },
            ];
          }

          firstMsg = await prisma.chatMessage.create({
            data: {
              conversationId: conversation.id,
              senderType: 'BOT',
              senderName: 'Trợ lý AI DCor',
              content: greetingText,
              quickReplies,
            },
          });
        }

        socket.data.conversationId = conversation.id;
        socket.data.isGuest = !socket.data.customerId;
        if (conversation.guestTokenHash) {
          socket.data.guestTokenHash = conversation.guestTokenHash;
        }
        socket.join(`conv:${conversation.id}`);

        const result = {
          conversationId: conversation.id,
          guestToken,
          message: firstMsg,
        };

        if (callback) callback(result);
        socket.emit('chat:init:success', result);

        if (io && !isExisting) {
          const displayName = conversation.guestName && conversation.guestName !== 'Khách vãng lai'
            ? conversation.guestName
            : `Khách vãng lai #${conversation.id.slice(-4)}`;
          io.to('staff').emit('staff:conversation:new', {
            id: conversation.id,
            guestName: displayName,
            guestPhone: conversation.guestPhone || '',
            mode: conversation.mode,
            createdAt: conversation.createdAt,
          });
          const totalUnread = await getTotalUnreadStaffCount();
          io.to('staff').emit('staff:unread', { total: totalUnread });
        }
      } catch (error) {
        console.error('Lỗi chat:init:', error);
        if (callback) callback({ error: 'Không thể khởi tạo hội thoại chat.' });
        else socket.emit('chat:error', { message: 'Không thể khởi tạo hội thoại chat.' });
      }
    });

    // 2. chat:send (Khách gửi tin nhắn)
    socket.on(
      'chat:send',
      async (payload: {
        conversationId?: string;
        content?: string;
        imageUrl?: string;
        clientMessageId?: string;
      }) => {
        let { conversationId, content, imageUrl, clientMessageId } = payload || {};

        // A. Giới hạn tốc độ: 20 tin / phút mỗi socket
        const now = Date.now();
        const timestamps = socketMessageTimestamps.get(socket.id) || [];
        const recentTimestamps = timestamps.filter((t) => now - t < 60000);
        if (recentTimestamps.length >= 20) {
          socket.emit('chat:error', {
            message: 'Bạn đang gửi tin nhắn quá nhanh. Vui lòng thử lại sau giây lát (tối đa 20 tin/phút).',
          });
          return;
        }
        recentTimestamps.push(now);
        socketMessageTimestamps.set(socket.id, recentTimestamps);

        // B. Kiểm tra độ dài nội dung
        if (content && content.length > 1000) {
          socket.emit('chat:error', { message: 'Tin nhắn không được vượt quá 1000 ký tự.' });
          return;
        }

        // C. KIỂM TRA ẢNH:
        // Nếu là khách vãng lai (không có customerId) gửi ảnh:
        // Server từ chối tin có imageUrl của guest
        const isCustomerLoggedIn = Boolean(socket.data.customerId);
        if (imageUrl && !isCustomerLoggedIn) {
          // Từ chối không lưu ảnh và gửi phản hồi LOGIN_CTA
          socket.emit('chat:error', {
            code: 'REQUIRE_LOGIN',
            message: 'Vui lòng đăng nhập để gửi hình ảnh bản phối cho chuyên viên tư vấn.',
          });

          // Nếu có conversationId, gửi bot reply LOGIN_CTA
          if (conversationId) {
            const botReplyMsg = await prisma.chatMessage.create({
              data: {
                conversationId,
                senderType: 'BOT',
                senderName: 'Trợ lý AI DCor',
                content:
                  'Để chuyên viên DCor có thể đồng hành, lưu lại bản phối và hỗ trợ tư vấn chi tiết nhất, bạn vui lòng đăng nhập tài khoản nhé!',
                meta: { type: 'LOGIN_CTA' },
                quickReplies: [{ label: '🔐 Đăng nhập ngay', payload: 'dang_nhap' }],
              },
            });
            await prisma.chatConversation.update({
              where: { id: conversationId },
              data: {
                botState: { pendingHandoff: true },
                lastMessageAt: new Date(),
                lastMessagePreview: botReplyMsg.content.slice(0, 100),
              },
            });
            if (io) {
              io.to(`conv:${conversationId}`).emit('chat:message', botReplyMsg);
            }
          }
          return;
        }

        if (imageUrl && !imageUrl.startsWith('https://')) {
          socket.emit('chat:error', { message: 'URL hình ảnh không hợp lệ (phải bắt đầu bằng https://).' });
          return;
        }

        // D. TỰ TẠO HOẶC TÌM HỘI THOẠI DUY NHẤT (nếu chưa có conversationId)
        let conv: any = null;
        if (!conversationId) {
          const { conversation, guestToken } = await getOrCreateConversation({
            customerId: socket.data.customerId,
            guestTokenHash: socket.data.guestTokenHash,
            initialPreview: (content || '[Hình ảnh]').slice(0, 100),
          });
          conv = conversation;
          conversationId = conv.id;
          socket.data.conversationId = conv.id;
          if (conv.guestTokenHash) socket.data.guestTokenHash = conv.guestTokenHash;
          socket.join(`conv:${conv.id}`);

          if (guestToken) {
            socket.emit('chat:init:success', {
              conversationId: conv.id,
              guestToken,
            });
          }
        } else {
          conv = await prisma.chatConversation.findUnique({
            where: { id: conversationId },
          });
        }

        if (!conv) {
          socket.emit('chat:error', { message: 'Không tìm thấy cuộc trò chuyện này.' });
          return;
        }

        // Đảm bảo status luôn là OPEN
        if (conv.status !== 'OPEN') {
          conv = await prisma.chatConversation.update({
            where: { id: conversationId },
            data: {
              status: 'OPEN',
              closedAt: null,
            },
          });
        }

        if (socket.data.customerId && !conv.customerId) {
          conv = await prisma.chatConversation.update({
            where: { id: conversationId },
            data: { customerId: socket.data.customerId },
          });
        }

        const convId = conversationId!;

        // E. Chống gửi trùng lặp bằng clientMessageId
        if (clientMessageId) {
          const existing = await prisma.chatMessage.findUnique({
            where: {
              conversationId_clientMessageId: {
                conversationId: convId,
                clientMessageId,
              },
            },
          });
          if (existing) {
            socket.emit('chat:message', existing);
            return;
          }
        }

        socket.join(`conv:${convId}`);

        // F. Xử lý tuần tự theo hàng đợi của từng hội thoại (Mutex queue)
        const prevPromise = conversationQueues.get(convId) || Promise.resolve();
        const nextPromise = prevPromise
          .then(async () => {
            const senderName = conv.guestName || (socket.data.customerId ? 'Khách hàng' : 'Khách vãng lai');
            const customerMsg = await prisma.chatMessage.create({
              data: {
                conversationId: convId,
                senderType: 'CUSTOMER',
                senderId: socket.data.customerId || null,
                senderName,
                content: (content || '').trim(),
                imageUrl: imageUrl || null,
                clientMessageId: clientMessageId || null,
              },
            });

            await prisma.chatConversation.update({
              where: { id: convId },
              data: {
                unreadStaff: { increment: 1 },
                lastMessageAt: new Date(),
                lastMessagePreview: content ? content.slice(0, 100) : '[Hình ảnh]',
              },
            });

            if (io) {
              io.to(`conv:${convId}`).emit('chat:message', customerMsg);
            }
            await broadcastConversationUpdate(convId);

            // G. Xử lý phản hồi tự động nếu mode là BOT (Bot trả lời 24/7)
            // Nếu mode là STAFF hoặc WAITING_STAFF: Bot không can thiệp
            if (conv.mode === 'STAFF' || conv.mode === 'WAITING_STAFF') {
              return;
            }

            if (io) {
              io.to(`conv:${convId}`).emit('chat:typing', {
                conversationId: convId,
                isTyping: true,
                senderType: 'BOT',
                senderName: 'Trợ lý AI DCor',
              });
            }

            const botResult = await chatBotService.processMessage({
              conversation: conv,
              userContent: content || '',
              imageUrl,
            });

            const typingDelay = chatBotService.getTypingDelay(botResult.reply);
            await new Promise((resolve) => setTimeout(resolve, typingDelay));

            if (io) {
              io.to(`conv:${convId}`).emit('chat:typing', {
                conversationId: convId,
                isTyping: false,
                senderType: 'BOT',
              });
            }

            const botMsg = await prisma.chatMessage.create({
              data: {
                conversationId: convId,
                senderType: 'BOT',
                senderName: 'Trợ lý AI DCor',
                content: botResult.reply,
                quickReplies: botResult.quickReplies ? (botResult.quickReplies as any) : undefined,
                meta: botResult.meta ? (botResult.meta as any) : undefined,
              },
            });

            const updateData: any = {
              unreadCustomer: { increment: 1 },
              lastMessageAt: new Date(),
              lastMessagePreview: botResult.reply.slice(0, 100),
            };

            if (botResult.newFallbackCount !== undefined) {
              updateData.fallbackCount = botResult.newFallbackCount;
            }

            if (botResult.updatedBotState) {
              updateData.botState = botResult.updatedBotState;
            }

            if (botResult.needsHandoff) {
              updateData.mode = 'WAITING_STAFF';
              updateData.needsHuman = true;
            }

            await prisma.chatConversation.update({
              where: { id: convId },
              data: updateData,
            });

            if (io) {
              io.to(`conv:${convId}`).emit('chat:message', botMsg);
            }

            if (botResult.systemMessage) {
              const sysMsg = await prisma.chatMessage.create({
                data: {
                  conversationId: convId,
                  senderType: 'SYSTEM',
                  senderName: 'Hệ thống DCor',
                  content: botResult.systemMessage,
                },
              });
              if (io) {
                io.to(`conv:${convId}`).emit('chat:message', sysMsg);
              }
            }

            await broadcastConversationUpdate(convId);
          })
          .catch((err) => {
            console.error('Lỗi xử lý tin nhắn trong hàng đợi:', err);
          });

        conversationQueues.set(convId, nextPromise);
      }
    );

    // 3. chat:typing (Khách đang gõ phím)
    socket.on('chat:typing', (data: { conversationId: string; isTyping: boolean }) => {
      if (data?.conversationId && io) {
        socket.to(`conv:${data.conversationId}`).emit('chat:typing', {
          conversationId: data.conversationId,
          isTyping: !!data.isTyping,
          senderType: 'CUSTOMER',
        });
      }
    });

    // 4. chat:read (Khách đã đọc tin nhắn)
    socket.on('chat:read', async (data: { conversationId: string }) => {
      try {
        if (!data?.conversationId) return;
        await prisma.chatConversation.update({
          where: { id: data.conversationId },
          data: { unreadCustomer: 0 },
        });

        await prisma.chatMessage.updateMany({
          where: {
            conversationId: data.conversationId,
            senderType: { in: ['STAFF', 'BOT', 'SYSTEM'] },
            readAt: null,
          },
          data: { readAt: new Date() },
        });

        if (io) {
          io.to(`conv:${data.conversationId}`).emit('chat:read', {
            conversationId: data.conversationId,
            readerType: 'CUSTOMER',
          });
        }
      } catch (e) {
        console.error('Lỗi chat:read:', e);
      }
    });

    // 5. quickReply:select (Khách chọn nút quick reply)
    socket.on('quickReply:select', (data: { conversationId: string; payload: string }) => {
      if (data?.conversationId && data?.payload) {
        socket.emit('chat:send', {
          conversationId: data.conversationId,
          content: data.payload,
          clientMessageId: `qr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        });
      }
    });

    // ========================================================
    // SỰ KIỆN NHÂN SỰ -> SERVER (YÊU CẦU QUYỀN CHAT TƯƠNG ỨNG)
    // ========================================================

    // 6. staff:send (Nhân sự gửi tin nhắn trả lời)
    socket.on(
      'staff:send',
      async (
        payload: {
          conversationId: string;
          content: string;
          imageUrl?: string;
          clientMessageId?: string;
        },
        callback?: (res: any) => void
      ) => {
        try {
          if (!socket.data.isStaff || !socket.data.staffUser || !socket.data.canChatEdit) {
            const errMsg = 'Bạn không có quyền chỉnh sửa trên phân hệ chat (yêu cầu quyền chat edit).';
            if (callback) callback({ error: errMsg });
            else socket.emit('chat:error', { code: 'PERMISSION_DENIED', message: errMsg });
            return;
          }

          const { conversationId, content, imageUrl, clientMessageId } = payload || {};
          if (!conversationId || (!content && !imageUrl)) {
            const errMsg = 'Nội dung tin nhắn không được để trống.';
            if (callback) callback({ error: errMsg });
            else socket.emit('chat:error', { message: errMsg });
            return;
          }

          const staff = socket.data.staffUser;

          const conv = await prisma.chatConversation.findUnique({
            where: { id: conversationId },
          });

          if (!conv) {
            const errMsg = 'Không tìm thấy cuộc trò chuyện.';
            if (callback) callback({ error: errMsg });
            else socket.emit('chat:error', { message: errMsg });
            return;
          }

          const staffMsg = await prisma.chatMessage.create({
            data: {
              conversationId,
              senderType: 'STAFF',
              senderId: staff.id,
              senderName: staff.fullName,
              content: (content || '').trim(),
              imageUrl: imageUrl || null,
              clientMessageId: clientMessageId || null,
            },
          });

          const updateData: any = {
            unreadCustomer: { increment: 1 },
            lastMessageAt: new Date(),
            lastMessagePreview: content ? content.slice(0, 100) : '[Hình ảnh]',
          };

          if (conv.mode === 'WAITING_STAFF' || !conv.assignedStaffId) {
            updateData.mode = 'STAFF';
            updateData.assignedStaffId = staff.id;
            updateData.needsHuman = false;
          }

          await prisma.chatConversation.update({
            where: { id: conversationId },
            data: updateData,
          });

          if (io) {
            io.to(`conv:${conversationId}`).emit('chat:message', staffMsg);
          }

          await broadcastConversationUpdate(conversationId);

          if (callback) callback({ message: 'Gửi tin nhắn thành công.', messageData: staffMsg });
        } catch (error) {
          console.error('Lỗi staff:send:', error);
          if (callback) callback({ error: 'Không thể gửi tin nhắn nhân sự.' });
          else socket.emit('chat:error', { message: 'Không thể gửi tin nhắn nhân sự.' });
        }
      }
    );

    // 7. staff:claim (Nhân sự tiếp nhận hội thoại)
    socket.on('staff:claim', async (data: { conversationId: string }, callback?: (res: any) => void) => {
      try {
        if (!socket.data.isStaff || !socket.data.staffUser || !socket.data.canChatEdit) {
          const errMsg = 'Bạn không có quyền chỉnh sửa trên phân hệ chat (yêu cầu quyền chat edit).';
          if (callback) callback({ error: errMsg });
          else socket.emit('chat:error', { code: 'PERMISSION_DENIED', message: errMsg });
          return;
        }

        const conversationId = data?.conversationId;
        if (!conversationId) {
          const errMsg = 'Thiếu mã hội thoại (conversationId).';
          if (callback) callback({ error: errMsg });
          else socket.emit('chat:error', { message: errMsg });
          return;
        }

        const staff = socket.data.staffUser;
        const updated = await prisma.chatConversation.update({
          where: { id: conversationId },
          data: {
            mode: 'STAFF',
            assignedStaffId: staff.id,
            needsHuman: false,
          },
        });

        const sysMsg = await prisma.chatMessage.create({
          data: {
            conversationId,
            senderType: 'SYSTEM',
            senderId: staff.id,
            senderName: 'Hệ thống DCor',
            content: `Chuyên viên tư vấn ${staff.fullName} đã tiếp nhận hỗ trợ cuộc trò chuyện.`,
          },
        });

        if (io) {
          io.to(`conv:${conversationId}`).emit('chat:message', sysMsg);
        }
        await broadcastConversationUpdate(conversationId);

        const resData = { message: 'Tiếp nhận cuộc trò chuyện thành công.', conversation: updated };
        if (callback) callback(resData);
        socket.emit('staff:claim:success', resData);
      } catch (error) {
        console.error('Lỗi staff:claim:', error);
        if (callback) callback({ error: 'Không thể tiếp nhận cuộc trò chuyện.' });
        else socket.emit('chat:error', { message: 'Không thể tiếp nhận cuộc trò chuyện.' });
      }
    });

    // 8. staff:close (Nhân sự "Kết thúc ca tư vấn")
    // Gửi tin SYSTEM 'Phiên hỗ trợ trực tiếp đã hoàn thành. Trợ lý AI DCor sẵn sàng tiếp tục đồng hành cùng bạn!',
    // mode về BOT, gỡ assignedStaffId và needsHuman, status giữ OPEN.
    socket.on('staff:close', async (data: { conversationId: string }, callback?: (res: any) => void) => {
      try {
        if (!socket.data.isStaff || !socket.data.staffUser || !socket.data.canChatEdit) {
          const errMsg = 'Bạn không có quyền chỉnh sửa trên phân hệ chat (yêu cầu quyền chat edit).';
          if (callback) callback({ error: errMsg });
          else socket.emit('chat:error', { code: 'PERMISSION_DENIED', message: errMsg });
          return;
        }

        const conversationId = data?.conversationId;
        if (!conversationId) {
          const errMsg = 'Thiếu mã cuộc trò chuyện.';
          if (callback) callback({ error: errMsg });
          else socket.emit('chat:error', { message: errMsg });
          return;
        }

        const updated = await prisma.chatConversation.update({
          where: { id: conversationId },
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
            conversationId,
            senderType: 'SYSTEM',
            senderName: 'Hệ thống DCor',
            content:
              'Phiên hỗ trợ trực tiếp đã hoàn thành. Trợ lý AI DCor sẵn sàng tiếp tục đồng hành cùng bạn!',
          },
        });

        if (io) {
          io.to(`conv:${conversationId}`).emit('chat:message', sysMsg);
        }
        await broadcastConversationUpdate(conversationId);

        const resData = { message: 'Đã hoàn thành ca tư vấn.', conversation: updated };
        if (callback) callback(resData);
        socket.emit('staff:close:success', resData);
      } catch (error) {
        console.error('Lỗi staff:close:', error);
        if (callback) callback({ error: 'Không thể đóng cuộc trò chuyện.' });
        else socket.emit('chat:error', { message: 'Không thể đóng cuộc trò chuyện.' });
      }
    });

    // 9. staff:typing
    socket.on('staff:typing', (data: { conversationId: string; isTyping: boolean }) => {
      if (socket.data.isStaff && socket.data.canChatView && data?.conversationId && io) {
        socket.to(`conv:${data.conversationId}`).emit('chat:typing', {
          conversationId: data.conversationId,
          isTyping: !!data.isTyping,
          senderType: 'STAFF',
          senderName: socket.data.staffUser?.fullName || 'Chuyên viên tư vấn',
        });
      }
    });

    // 10. staff:read
    socket.on('staff:read', async (data: { conversationId: string }) => {
      try {
        if (!socket.data.isStaff || !socket.data.canChatView || !data?.conversationId) return;

        await prisma.chatConversation.update({
          where: { id: data.conversationId },
          data: { unreadStaff: 0 },
        });

        await prisma.chatMessage.updateMany({
          where: {
            conversationId: data.conversationId,
            senderType: 'CUSTOMER',
            readAt: null,
          },
          data: { readAt: new Date() },
        });

        if (io) {
          io.to(`conv:${data.conversationId}`).emit('chat:read', {
            conversationId: data.conversationId,
            readerType: 'STAFF',
          });

          const totalUnread = await getTotalUnreadStaffCount();
          io.to('staff').emit('staff:unread', { total: totalUnread });
        }
      } catch (e) {
        console.error('Lỗi staff:read:', e);
      }
    });

    socket.on('disconnect', () => {
      socketMessageTimestamps.delete(socket.id);
    });
  });

  return io;
}
