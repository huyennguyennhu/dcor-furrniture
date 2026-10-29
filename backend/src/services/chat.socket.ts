import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { chatBotService } from './chat-bot.service';

const JWT_SECRET = process.env.JWT_SECRET || 'dcor_super_secret_key_2026';

let io: Server | null = null;

// Hàng đợi tuần tự xử lý tin nhắn theo từng hội thoại (chống race condition và đảo lộn thứ tự)
const conversationQueues = new Map<string, Promise<void>>();

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

    let assignedStaffName: string | null = null;
    if (conv.assignedStaffId) {
      const staff = await prisma.staffUser.findUnique({
        where: { id: conv.assignedStaffId },
        select: { fullName: true },
      });
      assignedStaffName = staff?.fullName || null;
    }

    const payload = {
      id: conv.id,
      mode: conv.mode,
      status: conv.status,
      assignedStaffId: conv.assignedStaffId,
      assignedStaffName,
      needsHuman: conv.needsHuman,
      unreadStaff: conv.unreadStaff,
      unreadCustomer: conv.unreadCustomer,
      lastMessageAt: conv.lastMessageAt,
      lastMessagePreview: conv.lastMessagePreview,
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

      // 1. Kiểm tra nếu là nhân sự (Staff token)
      if (token) {
        try {
          const decoded: any = jwt.verify(token, JWT_SECRET);
          if (decoded && decoded.email) {
            const staff = await prisma.staffUser.findUnique({
              where: { email: decoded.email.toLowerCase() },
              select: { id: true, fullName: true, role: true, status: true, deletedAt: true },
            });

            if (staff && staff.status === 'ACTIVE' && staff.deletedAt === null) {
              socket.data.isStaff = true;
              socket.data.staffUser = staff;
              socket.data.userId = staff.id;
              return next();
            }
          }
        } catch (_) {
          // Token staff không hợp lệ -> kiểm tra tiếp nếu là token khách
        }
      }

      // 2. Kiểm tra nếu là khách hàng đã đăng nhập (customerToken)
      const customerToken = auth.customerToken || token;
      if (customerToken) {
        try {
          const decoded: any = jwt.verify(customerToken, JWT_SECRET);
          if (decoded && decoded.type === 'CUSTOMER' && decoded.userId) {
            socket.data.isCustomer = true;
            socket.data.customerId = decoded.userId;
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
        }
      }

      return next();
    } catch (err) {
      return next(new Error('Lỗi xác thực kết nối Socket'));
    }
  });

  io.on('connection', async (socket: Socket) => {
    // Nếu là nhân sự -> tự động vào room 'staff'
    if (socket.data.isStaff) {
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

    // 1. chat:init (Khởi tạo hội thoại mới cho khách vãng lai hoặc kết nối lại)
    socket.on('chat:init', async (data: { name: string; phone: string }, callback?: (res: any) => void) => {
      try {
        const { name, phone } = data || {};
        const trimmedName = (name || 'Khách hàng').trim();
        const trimmedPhone = (phone || '').trim();

        // Kiểm tra số điện thoại Việt Nam hợp lệ
        const phoneRegex = /(?:(?:\+84|84|0)[3|5|7|8|9])([0-9]{8})\b/;
        if (!trimmedPhone || !phoneRegex.test(trimmedPhone)) {
          const errRes = { message: 'Số điện thoại không hợp lệ. Vui lòng nhập số điện thoại Việt Nam (10 số).' };
          if (callback) callback({ error: errRes.message });
          else socket.emit('chat:error', errRes);
          return;
        }

        // Sinh guestToken ngẫu nhiên 32 bytes hex và băm SHA-256
        const guestToken = crypto.randomBytes(32).toString('hex');
        const guestTokenHash = hashGuestToken(guestToken);

        // Tạo hội thoại trong Database
        const conversation = await prisma.chatConversation.create({
          data: {
            guestName: trimmedName,
            guestPhone: trimmedPhone,
            guestTokenHash,
            mode: 'BOT',
            status: 'OPEN',
            unreadCustomer: 1,
            lastMessagePreview: 'Xin chào! DCor có thể hỗ trợ gì cho bạn hôm nay?',
          },
        });

        // Tạo tin nhắn BOT chào hỏi đầu tiên
        const settings = await chatBotService.getSettingsMap();
        const greetingText = settings['greeting'] || 'Xin chào! DCor có thể hỗ trợ gì cho bạn hôm nay?';
        const formattedGreeting = chatBotService.replaceVariables(greetingText, settings);

        const firstMsg = await prisma.chatMessage.create({
          data: {
            conversationId: conversation.id,
            senderType: 'BOT',
            senderName: 'Trợ lý ảo DCor',
            content: formattedGreeting,
            quickReplies: [
              { label: '🛋️ Tìm sản phẩm', payload: 'tìm sản phẩm' },
              { label: '📦 Tra cứu đơn', payload: 'tra cứu đơn hàng' },
              { label: '🏷️ Khuyến mãi', payload: 'khuyến mãi' },
              { label: '🧑‍💼 Gặp nhân viên', payload: 'gặp nhân viên' },
            ],
          },
        });

        socket.data.conversationId = conversation.id;
        socket.data.isGuest = true;
        socket.join(`conv:${conversation.id}`);

        const result = {
          conversationId: conversation.id,
          guestToken,
          message: firstMsg,
        };

        if (callback) callback(result);
        socket.emit('chat:init:success', result);

        // Báo cho toàn bộ nhân sự có hội thoại mới
        if (io) {
          io.to('staff').emit('staff:conversation:new', {
            id: conversation.id,
            guestName: trimmedName,
            guestPhone: trimmedPhone,
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
        conversationId: string;
        content: string;
        imageUrl?: string;
        clientMessageId?: string;
      }) => {
        const { conversationId, content, imageUrl, clientMessageId } = payload || {};

        if (!conversationId) {
          socket.emit('chat:error', { message: 'Thiếu mã hội thoại (conversationId).' });
          return;
        }

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

        // C. Kiểm tra ảnh hợp lệ (chỉ chấp nhận HTTPS từ server upload)
        if (imageUrl) {
          if (!imageUrl.startsWith('https://')) {
            socket.emit('chat:error', { message: 'URL hình ảnh không hợp lệ (phải bắt đầu bằng https://).' });
            return;
          }
        }

        // D. Kiểm tra hội thoại trong DB
        const conv = await prisma.chatConversation.findUnique({
          where: { id: conversationId },
        });

        if (!conv) {
          socket.emit('chat:error', { message: 'Không tìm thấy cuộc trò chuyện này.' });
          return;
        }

        if (conv.status === 'CLOSED') {
          socket.emit('chat:error', { message: 'Cuộc trò chuyện này đã kết thúc.' });
          return;
        }

        // E. Chống gửi trùng lặp bằng clientMessageId
        if (clientMessageId) {
          const existing = await prisma.chatMessage.findUnique({
            where: {
              conversationId_clientMessageId: {
                conversationId,
                clientMessageId,
              },
            },
          });
          if (existing) {
            // Trả lại tin cũ cho khách nếu bị mất gói tin
            socket.emit('chat:message', existing);
            return;
          }
        }

        // Đảm bảo socket đã join room hội thoại
        socket.join(`conv:${conversationId}`);

        // F. Xử lý tuần tự theo hàng đợi của từng hội thoại (Mutex queue)
        const prevPromise = conversationQueues.get(conversationId) || Promise.resolve();
        const nextPromise = prevPromise
          .then(async () => {
            // Lưu tin nhắn của Khách
            const senderName = conv.guestName || 'Khách hàng';
            const customerMsg = await prisma.chatMessage.create({
              data: {
                conversationId,
                senderType: 'CUSTOMER',
                senderId: socket.data.customerId || null,
                senderName,
                content: (content || '').trim(),
                imageUrl: imageUrl || null,
                clientMessageId: clientMessageId || null,
              },
            });

            // Cập nhật hội thoại
            await prisma.chatConversation.update({
              where: { id: conversationId },
              data: {
                unreadStaff: { increment: 1 },
                lastMessageAt: new Date(),
                lastMessagePreview: content ? content.slice(0, 100) : '[Hình ảnh]',
              },
            });

            // Phát tin nhắn tới room khách & room staff
            if (io) {
              io.to(`conv:${conversationId}`).emit('chat:message', customerMsg);
            }
            await broadcastConversationUpdate(conversationId);

            // G. Xử lý phản hồi tự động nếu mode là BOT hoặc WAITING_STAFF
            // Nếu mode là STAFF: Bot TUYỆT ĐỐI KHÔNG trả lời!
            if (conv.mode === 'STAFF') {
              return;
            }

            // Kích hoạt trạng thái Bot đang gõ phím (chat:typing)
            if (io) {
              io.to(`conv:${conversationId}`).emit('chat:typing', {
                conversationId,
                isTyping: true,
                senderType: 'BOT',
                senderName: 'Trợ lý ảo DCor',
              });
            }

            // Xử lý logic Bot
            const botResult = await chatBotService.processMessage({
              conversation: conv,
              userContent: content || '',
              imageUrl,
            });

            // Tính thời gian gõ phím giả lập (500 - 1200ms)
            const typingDelay = chatBotService.getTypingDelay(botResult.reply);
            await new Promise((resolve) => setTimeout(resolve, typingDelay));

            // Tắt trạng thái đang gõ phím
            if (io) {
              io.to(`conv:${conversationId}`).emit('chat:typing', {
                conversationId,
                isTyping: false,
                senderType: 'BOT',
              });
            }

            // Lưu tin nhắn Bot
            const botMsg = await prisma.chatMessage.create({
              data: {
                conversationId,
                senderType: 'BOT',
                senderName: 'Trợ lý ảo DCor',
                content: botResult.reply,
                quickReplies: botResult.quickReplies ? (botResult.quickReplies as any) : undefined,
                meta: botResult.meta ? (botResult.meta as any) : undefined,
              },
            });

            // Cập nhật Conversation theo kết quả Bot
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

            // Nếu Bot kích hoạt chuyển nhân viên (Handoff)
            if (botResult.needsHandoff) {
              updateData.mode = 'WAITING_STAFF';
              updateData.needsHuman = true;
            }

            await prisma.chatConversation.update({
              where: { id: conversationId },
              data: updateData,
            });

            // Phát tin nhắn Bot vào room
            if (io) {
              io.to(`conv:${conversationId}`).emit('chat:message', botMsg);
            }

            // Nếu có tin nhắn SYSTEM kèm theo (ví dụ thông báo giờ làm việc khi handoff)
            if (botResult.systemMessage) {
              const sysMsg = await prisma.chatMessage.create({
                data: {
                  conversationId,
                  senderType: 'SYSTEM',
                  senderName: 'Hệ thống DCor',
                  content: botResult.systemMessage,
                },
              });
              if (io) {
                io.to(`conv:${conversationId}`).emit('chat:message', sysMsg);
              }
            }

            await broadcastConversationUpdate(conversationId);
          })
          .catch((err) => {
            console.error('Lỗi xử lý tin nhắn trong hàng đợi:', err);
          });

        conversationQueues.set(conversationId, nextPromise);
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

    // 5. quickReply:select (Khách bấm chọn quick reply)
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
    // SỰ KIỆN NHÂN SỰ -> SERVER
    // ========================================================

    // 6. staff:send (Nhân sự gửi tin nhắn trả lời)
    socket.on(
      'staff:send',
      async (payload: {
        conversationId: string;
        content: string;
        imageUrl?: string;
        clientMessageId?: string;
      }) => {
        try {
          if (!socket.data.isStaff || !socket.data.staffUser) {
            socket.emit('chat:error', { message: 'Chỉ nhân sự được cấp quyền mới có thể gửi tin.' });
            return;
          }

          const { conversationId, content, imageUrl, clientMessageId } = payload || {};
          if (!conversationId || (!content && !imageUrl)) {
            socket.emit('chat:error', { message: 'Nội dung tin nhắn không được để trống.' });
            return;
          }

          const staff = socket.data.staffUser;

          // Kiểm tra hội thoại
          const conv = await prisma.chatConversation.findUnique({
            where: { id: conversationId },
          });

          if (!conv) {
            socket.emit('chat:error', { message: 'Không tìm thấy cuộc trò chuyện.' });
            return;
          }

          // Lưu tin nhắn nhân viên
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

          // Cập nhật hội thoại: Chuyển mode sang STAFF nếu đang WAITING_STAFF, gán staff nếu chưa gán
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

          // Phát tin nhắn vào room hội thoại
          if (io) {
            io.to(`conv:${conversationId}`).emit('chat:message', staffMsg);
          }

          await broadcastConversationUpdate(conversationId);
        } catch (error) {
          console.error('Lỗi staff:send:', error);
          socket.emit('chat:error', { message: 'Không thể gửi tin nhắn nhân sự.' });
        }
      }
    );

    // 7. staff:typing (Nhân viên đang gõ)
    socket.on('staff:typing', (data: { conversationId: string; isTyping: boolean }) => {
      if (socket.data.isStaff && data?.conversationId && io) {
        socket.to(`conv:${data.conversationId}`).emit('chat:typing', {
          conversationId: data.conversationId,
          isTyping: !!data.isTyping,
          senderType: 'STAFF',
          senderName: socket.data.staffUser?.fullName || 'Chuyên viên tư vấn',
        });
      }
    });

    // 8. staff:read (Nhân viên đã đọc)
    socket.on('staff:read', async (data: { conversationId: string }) => {
      try {
        if (!socket.data.isStaff || !data?.conversationId) return;

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

