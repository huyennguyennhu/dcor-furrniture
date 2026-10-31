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
              // Cập nhật roles & role mới nhất từ Staff Metadata tương tự auth.middleware
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

              // Kiểm tra phân quyền IAM trên phân hệ chat: xem ('view') và chỉnh sửa ('edit')
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
    // Chỉ cho vào room 'staff' khi token là token nhân sự VÀ có quyền xem phân hệ chat (IAM chat view)
    // Token khách hàng (CUSTOMER / GUEST) TUYỆT ĐỐI không bao giờ được vào room staff
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

    // 1. chat:init (Khởi tạo hội thoại mới cho khách vãng lai hoặc kết nối lại)
    socket.on('chat:init', async (data: { name: string; phone: string }, callback?: (res: any) => void) => {
      try {
        const { name, phone } = data || {};
        let trimmedName = (name || '').trim();
        let trimmedPhone = (phone || '').trim();

        if (socket.data.customerId) {
          const customer = await prisma.customer.findUnique({
            where: { id: socket.data.customerId },
          });
          if (customer) {
            if (!trimmedPhone && customer.phone) trimmedPhone = customer.phone;
            if (!trimmedName && customer.fullName) trimmedName = customer.fullName;
          }
        }
        if (!trimmedName) trimmedName = 'Khách hàng';

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
            customerId: socket.data.customerId || null,
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

        if (conv && socket.data.customerId && !conv.customerId) {
          await prisma.chatConversation.update({
            where: { id: conversationId },
            data: { customerId: socket.data.customerId },
          });
        }

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

    // 5b. chat:close (Khách hàng hoặc khách vãng lai kết thúc hội thoại)
    socket.on('chat:close', async (data: { conversationId: string }, callback?: (res: any) => void) => {
      try {
        const conversationId = data?.conversationId || socket.data.conversationId;
        if (!conversationId) {
          const errMsg = 'Thiếu mã cuộc trò chuyện.';
          if (callback) callback({ error: errMsg });
          else socket.emit('chat:error', { message: errMsg });
          return;
        }

        const conv = await prisma.chatConversation.findUnique({
          where: { id: conversationId },
        });

        if (!conv) {
          const errMsg = 'Không tìm thấy cuộc trò chuyện.';
          if (callback) callback({ error: errMsg });
          else socket.emit('chat:error', { message: errMsg });
          return;
        }

        const isOwner =
          (socket.data.customerId && conv.customerId === socket.data.customerId) ||
          (socket.data.isGuest && conv.id === socket.data.conversationId) ||
          (socket.data.guestTokenHash && conv.guestTokenHash === socket.data.guestTokenHash) ||
          (socket.data.isStaff && socket.data.canChatEdit);

        if (!isOwner) {
          const errMsg = 'Bạn không có quyền kết thúc cuộc trò chuyện này.';
          if (callback) callback({ error: errMsg });
          else socket.emit('chat:error', { message: errMsg });
          return;
        }

        if (conv.status === 'CLOSED') {
          if (callback) callback({ success: true, conversation: conv });
          return;
        }

        const updated = await prisma.chatConversation.update({
          where: { id: conversationId },
          data: {
            status: 'CLOSED',
            closedAt: new Date(),
          },
        });

        const sysMsg = await prisma.chatMessage.create({
          data: {
            conversationId,
            senderType: 'SYSTEM',
            senderName: 'Hệ thống DCor',
            content: 'Cuộc trò chuyện đã được kết thúc.',
          },
        });

        if (io) {
          io.to(`conv:${conversationId}`).emit('chat:message', sysMsg);
          io.to(`conv:${conversationId}`).emit('chat:conversation', {
            id: updated.id,
            mode: updated.mode,
            status: 'CLOSED',
            closedAt: updated.closedAt,
          });
        }
        await broadcastConversationUpdate(conversationId);

        if (callback) callback({ success: true, conversation: updated });
        socket.emit('chat:close:success', { conversation: updated });
      } catch (error) {
        console.error('Lỗi chat:close:', error);
        if (callback) callback({ error: 'Không thể kết thúc cuộc trò chuyện.' });
        else socket.emit('chat:error', { message: 'Không thể kết thúc cuộc trò chuyện.' });
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
    // SỰ KIỆN NHÂN SỰ -> SERVER (YÊU CẦU QUYỀN CHAT TƯƠNG ỨNG)
    // ========================================================

    // 6. staff:send (Nhân sự gửi tin nhắn trả lời - Yêu cầu quyền chat edit)
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

          // Kiểm tra hội thoại
          const conv = await prisma.chatConversation.findUnique({
            where: { id: conversationId },
          });

          if (!conv) {
            const errMsg = 'Không tìm thấy cuộc trò chuyện.';
            if (callback) callback({ error: errMsg });
            else socket.emit('chat:error', { message: errMsg });
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

          if (callback) callback({ message: 'Gửi tin nhắn thành công.', messageData: staffMsg });
        } catch (error) {
          console.error('Lỗi staff:send:', error);
          if (callback) callback({ error: 'Không thể gửi tin nhắn nhân sự.' });
          else socket.emit('chat:error', { message: 'Không thể gửi tin nhắn nhân sự.' });
        }
      }
    );

    // 7. staff:claim (Nhân sự tiếp nhận hội thoại - Yêu cầu quyền chat edit)
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

    // 8. staff:transfer (Nhân sự chuyển giao hội thoại - Yêu cầu quyền chat edit)
    socket.on(
      'staff:transfer',
      async (data: { conversationId: string; staffId?: string; targetStaffId?: string }, callback?: (res: any) => void) => {
        try {
          if (!socket.data.isStaff || !socket.data.staffUser || !socket.data.canChatEdit) {
            const errMsg = 'Bạn không có quyền chỉnh sửa trên phân hệ chat (yêu cầu quyền chat edit).';
            if (callback) callback({ error: errMsg });
            else socket.emit('chat:error', { code: 'PERMISSION_DENIED', message: errMsg });
            return;
          }

          const conversationId = data?.conversationId;
          const targetStaffId = data?.staffId || data?.targetStaffId;
          if (!conversationId || !targetStaffId) {
            const errMsg = 'Thiếu mã cuộc trò chuyện hoặc mã nhân sự chuyển giao.';
            if (callback) callback({ error: errMsg });
            else socket.emit('chat:error', { message: errMsg });
            return;
          }

          const targetStaff = await prisma.staffUser.findUnique({
            where: { id: targetStaffId },
            select: { id: true, fullName: true, status: true },
          });

          if (!targetStaff || targetStaff.status !== 'ACTIVE') {
            const errMsg = 'Nhân sự được chọn không tồn tại hoặc đã bị khóa.';
            if (callback) callback({ error: errMsg });
            else socket.emit('chat:error', { message: errMsg });
            return;
          }

          const updated = await prisma.chatConversation.update({
            where: { id: conversationId },
            data: {
              assignedStaffId: targetStaffId,
              mode: 'STAFF',
              needsHuman: false,
            },
          });

          const currentStaff = socket.data.staffUser;
          const sysMsg = await prisma.chatMessage.create({
            data: {
              conversationId,
              senderType: 'SYSTEM',
              senderId: currentStaff.id,
              senderName: 'Hệ thống DCor',
              content: `${currentStaff.fullName} đã chuyển cuộc trò chuyện sang chuyên viên tư vấn ${targetStaff.fullName}.`,
            },
          });

          if (io) {
            io.to(`conv:${conversationId}`).emit('chat:message', sysMsg);
          }
          await broadcastConversationUpdate(conversationId);

          const resData = { message: 'Chuyển giao cuộc trò chuyện thành công.', conversation: updated };
          if (callback) callback(resData);
          socket.emit('staff:transfer:success', resData);
        } catch (error) {
          console.error('Lỗi staff:transfer:', error);
          if (callback) callback({ error: 'Không thể chuyển giao cuộc trò chuyện.' });
          else socket.emit('chat:error', { message: 'Không thể chuyển giao cuộc trò chuyện.' });
        }
      }
    );

    // 9. staff:close (Nhân sự đóng hội thoại - Yêu cầu quyền chat edit)
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
            status: 'CLOSED',
            closedAt: new Date(),
          },
        });

        const sysMsg = await prisma.chatMessage.create({
          data: {
            conversationId,
            senderType: 'SYSTEM',
            senderName: 'Hệ thống DCor',
            content: 'Cuộc trò chuyện đã được kết thúc.',
          },
        });

        if (io) {
          io.to(`conv:${conversationId}`).emit('chat:message', sysMsg);
        }
        await broadcastConversationUpdate(conversationId);

        const resData = { message: 'Đã đóng cuộc trò chuyện.', conversation: updated };
        if (callback) callback(resData);
        socket.emit('staff:close:success', resData);
      } catch (error) {
        console.error('Lỗi staff:close:', error);
        if (callback) callback({ error: 'Không thể đóng cuộc trò chuyện.' });
        else socket.emit('chat:error', { message: 'Không thể đóng cuộc trò chuyện.' });
      }
    });

    // 10. staff:typing (Nhân viên đang gõ - Yêu cầu quyền xem chat)
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

    // 11. staff:read (Nhân viên đã đọc - Yêu cầu quyền xem chat)
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

