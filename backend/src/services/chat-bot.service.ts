import prisma from '../lib/prisma';
import {
  normalizeChatText,
  calculatePatternScore,
  isComplaint,
  extractOrderNumber,
  extractPhoneNumber,
  extractProductSearchCriteria,
  ExtractedBudget,
} from './chat-text.util';

export interface BotProcessResult {
  reply: string;
  quickReplies?: Array<{ label: string; payload: string }>;
  meta?: any;
  needsHandoff?: boolean;
  systemMessage?: string;
  updatedBotState?: any;
  newFallbackCount?: number;
}

export interface ScriptTestResult {
  intent: string;
  score: number;
  candidates: Array<{ intent: string; name: string; score: number }>;
  reply: string;
  quickReplies?: Array<{ label: string; payload: string }>;
}

const ORDER_STATUS_VN: Record<string, string> = {
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận đơn hàng',
  PROCESSING: 'Đang sản xuất / Chuẩn bị hàng',
  READY_TO_SHIP: 'Sẵn sàng giao hàng',
  SHIPPED: 'Đang vận chuyển giao hàng',
  DELIVERED: 'Đã giao hàng thành công',
  COMPLETED: 'Đơn hàng hoàn tất',
  CANCELLED: 'Đã hủy đơn',
  RETURN_REQUESTED: 'Yêu cầu đổi trả',
  RETURNING: 'Đang hoàn trả hàng',
  RETURNED: 'Đã hoàn trả thành công',
  FAILED_DELIVERY: 'Giao hàng không thành công',
};

const PAYMENT_STATUS_VN: Record<string, string> = {
  UNPAID: 'Chưa thanh toán',
  PARTIAL: 'Đã đặt cọc / Thanh toán một phần',
  PAID: 'Đã thanh toán đủ',
  REFUND_PENDING: 'Đang chờ hoàn tiền',
  REFUNDED: 'Đã hoàn tiền',
};

export class ChatBotService {
  /**
   * Kiểm tra giờ mở cửa hiện tại theo múi giờ Asia/Ho_Chi_Minh
   */
  public isBusinessOpen(workingHoursSetting?: any): { isOpen: boolean; statusText: string; hoursText: string } {
    const config = workingHoursSetting || {
      start: '08:00',
      end: '22:00',
      days: [0, 1, 2, 3, 4, 5, 6],
    };

    const hoursText = `${config.start || '08:00'} - ${config.end || '22:00'} (Thứ 2 - Chủ Nhật)`;

    // Tính thời gian hiện tại theo múi giờ Việt Nam (UTC+7)
    const now = new Date();
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    const vnTime = new Date(utc + 7 * 3600000);

    const dayOfWeek = vnTime.getDay(); // 0: Chủ Nhật, 1: Thứ 2, ...
    const validDays: number[] = Array.isArray(config.days) ? config.days : [0, 1, 2, 3, 4, 5, 6];

    if (!validDays.includes(dayOfWeek)) {
      return {
        isOpen: false,
        statusText: 'Đang đóng cửa (hôm nay không làm việc)',
        hoursText,
      };
    }

    const currentMinutes = vnTime.getHours() * 60 + vnTime.getMinutes();

    const [startH, startM] = (config.start || '08:00').split(':').map(Number);
    const [endH, endM] = (config.end || '22:00').split(':').map(Number);

    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    const isOpen = currentMinutes >= startMinutes && currentMinutes < endMinutes;

    const statusText = isOpen
      ? `Đang mở cửa (${config.start || '08:00'} - ${config.end || '22:00'})`
      : `Đang đóng cửa (mở cửa lại lúc ${config.start || '08:00'})`;

    return { isOpen, statusText, hoursText };
  }

  /**
   * Thay thế các biến động trong câu trả lời bot:
   * {{hotline}}, {{address}}, {{hours}}, {{status_open}}, {{handoffMessage}}
   */
  public replaceVariables(template: string, settings: Record<string, any>): string {
    if (!template) return '';

    const business = this.isBusinessOpen(settings['workingHours']);
    const hotline = settings['hotline'] || '1900 1234';
    const address = settings['address'] || '669 QL1A, TP. Hồ Chí Minh';
    const handoffMessage =
      settings['handoffMessage'] ||
      'DCor đã tiếp nhận yêu cầu và đang kết nối bạn với chuyên viên tư vấn. Bạn vui lòng giữ kết nối trong ít phút nhé!';

    return template
      .replace(/\{\{hotline\}\}/g, hotline)
      .replace(/\{\{address\}\}/g, address)
      .replace(/\{\{hours\}\}/g, business.hoursText)
      .replace(/\{\{status_open\}\}/g, business.statusText)
      .replace(/\{\{handoffMessage\}\}/g, handoffMessage);
  }

  /**
   * Tính thời gian gõ phím giả lập (500ms - 1200ms tỉ lệ theo độ dài)
   */
  public getTypingDelay(text: string): number {
    const len = (text || '').length;
    const delay = 500 + Math.round((len / 200) * 700);
    return Math.min(1200, Math.max(500, delay));
  }

  /**
   * Lấy cấu hình ChatSetting từ Database
   */
  public async getSettingsMap(): Promise<Record<string, any>> {
    try {
      const records = await prisma.chatSetting.findMany();
      const map: Record<string, any> = {};
      for (const r of records) {
        map[r.key] = r.value;
      }
      return map;
    } catch (e) {
      console.error('Lỗi đọc ChatSetting:', e);
      return {};
    }
  }

  /**
   * Lấy danh sách các kịch bản đang kích hoạt
   */
  public async getActiveScripts(): Promise<any[]> {
    try {
      return await prisma.chatBotScript.findMany({
        where: { isActive: true },
        orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
      });
    } catch (e) {
      console.error('Lỗi đọc ChatBotScript:', e);
      return [];
    }
  }

  /**
   * Chấm điểm Intent từ câu hỏi của khách đối chiếu với các kịch bản
   */
  public scoreIntents(
    rawText: string,
    scripts: any[]
  ): {
    bestMatch: { script: any; score: number } | null;
    secondMatch: { script: any; score: number } | null;
    candidates: Array<{ intent: string; name: string; score: number }>;
  } {
    const normalizedInput = normalizeChatText(rawText);
    if (!normalizedInput) {
      return { bestMatch: null, secondMatch: null, candidates: [] };
    }

    const scored: Array<{ script: any; score: number }> = [];

    for (const sc of scripts) {
      let maxScore = 0;
      const patterns: string[] = Array.isArray(sc.patterns) ? sc.patterns : [];

      for (const p of patterns) {
        const score = calculatePatternScore(normalizedInput, p);
        if (score > maxScore) {
          maxScore = score;
        }
      }

      if (maxScore > 0) {
        scored.push({ script: sc, score: maxScore });
      }
    }

    scored.sort((a, b) => {
      // Nếu chênh lệch điểm >= 0.04 thì chọn điểm cao hơn
      if (Math.abs(b.score - a.score) >= 0.04) {
        return b.score - a.score;
      }
      // Khi điểm xấp xỉ nhau, ưu tiên kịch bản có priority cao hơn
      const prioDiff = (b.script.priority || 0) - (a.script.priority || 0);
      if (prioDiff !== 0) return prioDiff;
      return b.score - a.score;
    });

    const candidates = scored.slice(0, 5).map((s) => ({
      intent: s.script.intent,
      name: s.script.name,
      score: Math.round(s.score * 100) / 100,
    }));

    const bestMatch = scored[0] || null;
    const secondMatch = scored[1] || null;

    return { bestMatch, secondMatch, candidates };
  }

  /**
   * Xử lý tin nhắn khách hàng gửi đến Bot
   */
  public async processMessage(params: {
    conversation: any;
    userContent: string;
    imageUrl?: string;
  }): Promise<BotProcessResult> {
    const { conversation, userContent, imageUrl } = params;
    const settings = await this.getSettingsMap();
    const scripts = await this.getActiveScripts();
    const botState = (conversation.botState as any) || {};
    const fallbackCount = conversation.fallbackCount || 0;

    // 1. Nếu khách gửi ảnh: Tự động kích hoạt chuyển nhân viên ngay
    if (imageUrl) {
      const business = this.isBusinessOpen(settings['workingHours']);
      const sysMsg = business.isOpen
        ? 'Hiện đang trong giờ làm việc. Chuyên viên tư vấn DCor sẽ xem hình ảnh và phản hồi bạn trong giây lát.'
        : 'Hiện đang ngoài giờ làm việc (08:00 - 22:00). Nhân viên DCor sẽ xem hình ảnh và liên hệ hỗ trợ bạn sớm nhất vào ca làm tiếp theo lúc 08:00 sáng mai.';

      return {
        reply: 'DCor đã nhận được hình ảnh của bạn và đang chuyển đến chuyên viên tư vấn để kiểm tra trực quan.',
        needsHandoff: true,
        systemMessage: sysMsg,
        newFallbackCount: fallbackCount,
        updatedBotState: botState,
      };
    }

    // 2. Kiểm tra từ khóa khiếu nại nghiêm trọng -> Handoff ngay lập tức
    if (isComplaint(userContent)) {
      const complaintScript = scripts.find((s) => s.intent === 'COMPLAINT_FEEDBACK');
      const answer = complaintScript
        ? this.replaceVariables(complaintScript.answer, settings)
        : 'DCor vô cùng xin lỗi về trải nghiệm chưa được hài lòng của bạn! Hệ thống đang ưu tiên chuyển tiếp cuộc trò chuyện tới Trưởng bộ phận CSKH để hỗ trợ bạn ngay lập tức.';

      return {
        reply: answer,
        needsHandoff: true,
        systemMessage: 'Cuộc trò chuyện được chuyển tới nhân sự do khách hàng có phản ánh/khiếu nại dịch vụ.',
        newFallbackCount: fallbackCount,
        updatedBotState: botState,
        quickReplies: [{ label: '📞 Hotline 1900 1234', payload: 'hotline' }],
      };
    }

    // 3. Xử lý luồng nhiều bước đang chờ (botState)
    if (botState.step === 'AWAITING_ORDER_NUMBER' || botState.step === 'AWAITING_PHONE') {
      return await this.handleOrderStatusMultiStep(userContent, conversation, botState, settings);
    }

    // 4. Kiểm tra tin nhắn quá ngắn / chỉ có emoji
    const normalizedInput = normalizeChatText(userContent);
    if (!normalizedInput || normalizedInput.length < 2) {
      const greetingScript = scripts.find((s) => s.intent === 'GREETING');
      const replyText = greetingScript
        ? this.replaceVariables(greetingScript.answer, settings)
        : settings['greeting'] || 'Xin chào! DCor có thể hỗ trợ gì cho bạn hôm nay?';

      return {
        reply: replyText,
        quickReplies: greetingScript?.quickReplies || [
          { label: '🛋️ Tìm sản phẩm', payload: 'tìm sản phẩm' },
          { label: '📦 Tra cứu đơn', payload: 'tra cứu đơn hàng' },
          { label: '🧑‍💼 Gặp nhân viên', payload: 'gặp nhân viên' },
        ],
        newFallbackCount: 0,
        updatedBotState: botState,
      };
    }

    // 5. Nếu câu hỏi có chứa mã đơn hàng (DC-xxxxxx) -> tự động chuyển sang luồng tra cứu đơn hàng
    const extractedOrderCode = extractOrderNumber(userContent);
    if (extractedOrderCode) {
      return await this.handleOrderStatusMultiStep(userContent, conversation, botState, settings);
    }

    // 6. Chấm điểm Intent
    const { bestMatch, secondMatch } = this.scoreIntents(userContent, scripts);

    // Ngưỡng tự tin tối thiểu: 0.55
    const CONFIDENCE_THRESHOLD = 0.55;
    const AMBIGUITY_GAP = 0.1;

    // A. Nếu điểm cao nhất < 0.55 -> Kích hoạt Fallback
    if (!bestMatch || bestMatch.score < CONFIDENCE_THRESHOLD) {
      const nextFallback = fallbackCount + 1;

      // Nếu fallbackCount >= 2 -> Tự động chuyển nhân viên
      if (nextFallback >= 2) {
        const business = this.isBusinessOpen(settings['workingHours']);
        const sysMsg = business.isOpen
          ? 'Hiện đang trong giờ làm việc. Chuyên viên tư vấn DCor sẽ phản hồi bạn trong giây lát. Vui lòng giữ kết nối nhé!'
          : 'Hiện đang ngoài giờ làm việc (08:00 - 22:00). Nhân viên DCor sẽ liên hệ hỗ trợ bạn sớm nhất vào ca làm tiếp theo lúc 08:00 sáng mai. Trong lúc chờ, bot vẫn sẵn sàng giải đáp các câu hỏi thường gặp của bạn.';

        return {
          reply:
            'DCor chưa nắm bắt chính xác nhu cầu của bạn sau 2 lần hỏi. Em đã chuyển tiếp cuộc trò chuyện tới chuyên viên CSKH để hỗ trợ bạn chu đáo hơn nhé!',
          needsHandoff: true,
          systemMessage: sysMsg,
          newFallbackCount: nextFallback,
          updatedBotState: botState,
          quickReplies: [
            { label: '📞 Gọi Hotline', payload: 'hotline' },
            { label: '⏰ Giờ làm việc', payload: 'giờ làm việc' },
          ],
        };
      }

      // Fallback lần 1: Chọn thông điệp fallback xoay vòng
      const fallbackList: string[] = Array.isArray(settings['fallbackMessages'])
        ? settings['fallbackMessages']
        : [
            'DCor chưa hiểu rõ câu hỏi của bạn. Bạn vui lòng diễn đạt cụ thể hơn hoặc chọn một trong các gợi ý bên dưới nhé!',
            'Xin lỗi bạn, câu hỏi này nằm ngoài hiểu biết hiện tại của bot. Bạn thử mô tả lại hoặc bấm nút Gặp nhân viên để được hỗ trợ trực tiếp.',
            'DCor chưa tìm được thông tin phù hợp với yêu cầu này. Bạn có thể chọn chủ đề cần giải đáp bên dưới để mình hỗ trợ ngay nhé!',
          ];

      const fallbackText = fallbackList[fallbackCount % fallbackList.length];

      return {
        reply: fallbackText,
        quickReplies: [
          { label: '🛋️ Tìm sản phẩm', payload: 'tìm sản phẩm' },
          { label: '📦 Tra cứu đơn', payload: 'tra cứu đơn hàng' },
          { label: '🧑‍💼 Gặp nhân viên', payload: 'gặp nhân viên' },
        ],
        newFallbackCount: nextFallback,
        updatedBotState: botState,
      };
    }

    // B. Kiểm tra trạng thái MƠ HỒ (Ambiguity): điểm >= 0.55 nhưng hơn hạng nhì < 0.1
    if (secondMatch && bestMatch.score - secondMatch.score < AMBIGUITY_GAP && secondMatch.score >= 0.45) {
      return {
        reply: `Có phải bạn đang muốn hỏi về "${bestMatch.script.name}" hoặc "${secondMatch.script.name}" không ạ? Bạn vui lòng bấm chọn bên dưới nhé:`,
        quickReplies: [
          {
            label: bestMatch.script.name,
            payload: (bestMatch.script.patterns && bestMatch.script.patterns[0]) || bestMatch.script.name,
          },
          {
            label: secondMatch.script.name,
            payload: (secondMatch.script.patterns && secondMatch.script.patterns[0]) || secondMatch.script.name,
          },
        ],
        newFallbackCount: 0,
        updatedBotState: botState,
      };
    }

    // C. Khớp Intent thành công -> Reset fallbackCount về 0
    const matchedScript = bestMatch.script;

    // Xử lý theo ActionType
    switch (matchedScript.actionType) {
      case 'HANDOFF': {
        const business = this.isBusinessOpen(settings['workingHours']);
        const sysMsg = business.isOpen
          ? 'Hiện đang trong giờ làm việc. Chuyên viên tư vấn DCor sẽ phản hồi bạn trong giây lát. Vui lòng giữ kết nối nhé!'
          : 'Hiện đang ngoài giờ làm việc (08:00 - 22:00). Nhân viên DCor sẽ liên hệ hỗ trợ bạn sớm nhất vào ca làm tiếp theo lúc 08:00 sáng mai. Trong lúc chờ, bot vẫn sẵn sàng giải đáp các câu hỏi thường gặp của bạn.';

        const reply = this.replaceVariables(matchedScript.answer, settings);

        return {
          reply,
          needsHandoff: true,
          systemMessage: sysMsg,
          newFallbackCount: 0,
          updatedBotState: botState,
          quickReplies: matchedScript.quickReplies,
        };
      }

      case 'ORDER_STATUS': {
        return await this.handleOrderStatusMultiStep(userContent, conversation, botState, settings);
      }

      case 'PRODUCT_SEARCH': {
        return await this.handleProductSearchFlow(userContent, matchedScript, settings);
      }

      default: {
        const reply = this.replaceVariables(matchedScript.answer, settings);
        return {
          reply,
          quickReplies: matchedScript.quickReplies,
          newFallbackCount: 0,
          updatedBotState: botState,
        };
      }
    }
  }

  /**
   * Xử lý luồng tra cứu đơn hàng nhiều bước (ORDER_STATUS)
   */
  private async handleOrderStatusMultiStep(
    userContent: string,
    conversation: any,
    currentBotState: any,
    settings: Record<string, any>
  ): Promise<BotProcessResult> {
    const state = { ...currentBotState };
    const now = Date.now();

    // 1. Kiểm tra Rate Limit: Tối đa 5 lần tra cứu sai mỗi giờ
    const ONE_HOUR = 60 * 60 * 1000;
    if (state.lookupResetAt && now < state.lookupResetAt) {
      if ((state.lookupAttempts || 0) >= 5) {
        return {
          reply:
            'Bạn đã nhập sai thông tin tra cứu quá 5 lần trong 1 giờ qua. Để đảm bảo bảo mật cho khách hàng, tính năng này tạm thời bị khóa. Bạn vui lòng bấm nút Gặp nhân viên để được hỗ trợ trực tiếp nhé!',
          needsHandoff: true,
          systemMessage: 'Khách hàng bị khóa tra cứu đơn do vượt quá 5 lần thử.',
          quickReplies: [{ label: '🧑‍💼 Gặp nhân viên', payload: 'gặp nhân viên' }],
          updatedBotState: state,
        };
      }
    } else {
      // Đã qua 1 giờ -> Reset attempts
      state.lookupAttempts = 0;
      state.lookupResetAt = now + ONE_HOUR;
    }

    // 2. Tìm mã đơn hàng từ nội dung tin nhắn hoặc trong botState
    const extractedOrderCode = extractOrderNumber(userContent) || state.pendingOrderNumber;

    // 3. Tìm số điện thoại: từ tin nhắn, hoặc SĐT khách vãng lai, hoặc SĐT khách đăng ký
    let phone = extractPhoneNumber(userContent) || state.pendingPhone;

    if (!phone) {
      if (conversation.guestPhone) {
        phone = conversation.guestPhone;
      } else if (conversation.customerId) {
        const cust = await prisma.customer.findUnique({
          where: { id: conversation.customerId },
          select: { phone: true },
        });
        if (cust?.phone) {
          phone = cust.phone;
        }
      }
    }

    // Nếu chưa có mã đơn hàng
    if (!extractedOrderCode) {
      state.step = 'AWAITING_ORDER_NUMBER';
      return {
        reply: 'Để tra cứu tiến độ đơn hàng, bạn vui lòng cung cấp mã đơn hàng (định dạng DC-xxxxxx) nhé!',
        quickReplies: [
          { label: '📦 Ví dụ: DC-123456', payload: 'DC-123456' },
          { label: '🧑‍💼 Gặp nhân viên', payload: 'gặp nhân viên' },
        ],
        updatedBotState: state,
        newFallbackCount: 0,
      };
    }

    // Đã có mã đơn hàng, lưu lại vào state
    state.pendingOrderNumber = extractedOrderCode;

    // Nếu chưa có số điện thoại đối chiếu
    if (!phone) {
      state.step = 'AWAITING_PHONE';
      return {
        reply: `Để bảo mật thông tin đơn hàng **${extractedOrderCode}**, bạn vui lòng nhập số điện thoại đã dùng khi đặt hàng để DCor xác nhận nhé!`,
        updatedBotState: state,
        newFallbackCount: 0,
      };
    }

    // Đã có cả mã đơn hàng và số điện thoại -> Thực hiện đối chiếu trong Database
    const cleanPhone = phone.replace(/\s+/g, '').replace('+84', '0').replace(/^84/, '0');

    const order = await prisma.order.findFirst({
      where: {
        orderNumber: { equals: extractedOrderCode, mode: 'insensitive' },
      },
    });

    // So sánh số điện thoại bảo mật
    const orderPhoneClean = order ? order.phone.replace(/\s+/g, '').replace('+84', '0').replace(/^84/, '0') : '';

    if (!order || orderPhoneClean !== cleanPhone) {
      // Tăng số lần thử sai
      state.lookupAttempts = (state.lookupAttempts || 0) + 1;

      // Không tiết lộ đơn có tồn tại hay không
      return {
        reply:
          'DCor không tìm thấy đơn hàng nào phù hợp với thông tin bạn cung cấp. Bạn vui lòng kiểm tra lại mã đơn và số điện thoại nhé!',
        quickReplies: [
          { label: '🔄 Thử lại', payload: 'tra cứu đơn hàng' },
          { label: '🧑‍💼 Gặp nhân viên', payload: 'gặp nhân viên' },
        ],
        updatedBotState: state,
        newFallbackCount: 0,
      };
    }

    // Khớp thông tin đơn hàng thành công!
    const statusVn = ORDER_STATUS_VN[order.status] || order.status;
    const paymentVn = PAYMENT_STATUS_VN[order.paymentStatus] || order.paymentStatus;
    const totalAmountVn = Number(order.totalAmount).toLocaleString('vi-VN');

    const detailText =
      `📦 **Thông tin tiến độ đơn hàng ${order.orderNumber}:**\n` +
      `- **Trạng thái:** ${statusVn}\n` +
      `- **Thanh toán:** ${paymentVn}\n` +
      `- **Tổng tiền:** ${totalAmountVn} đ\n` +
      `- **Đơn vị vận chuyển:** ${order.shippingProvider || 'Đội vận chuyển DCor'}\n` +
      `- **Mã vận đơn:** ${order.trackingCode || 'Đang cập nhật'}\n` +
      `- **Người nhận:** ${order.receiverName}`;

    // Xóa trạng thái pending
    delete state.step;
    delete state.pendingOrderNumber;
    delete state.pendingPhone;
    state.lookupAttempts = 0;

    return {
      reply: detailText,
      meta: {
        type: 'ORDER_CARD',
        orderId: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        statusVn,
        paymentStatus: order.paymentStatus,
        paymentVn,
        totalAmount: order.totalAmount.toString(),
        shippingProvider: order.shippingProvider,
        trackingCode: order.trackingCode,
      },
      quickReplies: [
        { label: '🔄 Tra cứu đơn khác', payload: 'tra cứu đơn hàng' },
        { label: '🛋️ Xem sản phẩm', payload: 'tìm sản phẩm' },
        { label: '🧑‍💼 Gặp nhân viên', payload: 'gặp nhân viên' },
      ],
      updatedBotState: state,
      newFallbackCount: 0,
    };
  }

  /**
   * Xử lý tìm kiếm sản phẩm từ Database thật (PRODUCT_SEARCH)
   */
  private async handleProductSearchFlow(
    userContent: string,
    script: any,
    settings: Record<string, any>
  ): Promise<BotProcessResult> {
    const criteria = extractProductSearchCriteria(userContent);

    try {
      // Truy vấn sản phẩm đang bán (isActive = true, deletedAt = null)
      const products = await prisma.product.findMany({
        where: {
          isActive: true,
          deletedAt: null,
        },
        include: {
          category: true,
          variants: {
            where: { isActive: true },
          },
        },
        take: 30,
      });

      // Lọc và tính điểm sản phẩm phù hợp
      interface ProductMatch {
        product: any;
        score: number;
        lowestPrice: number;
      }

      const matches: ProductMatch[] = [];

      for (const p of products) {
        let score = 0;
        const normName = normalizeChatText(p.name);
        const normCat = normalizeChatText(p.category?.name || '');
        const normDesc = normalizeChatText(p.description || '');

        // Tìm giá thấp nhất từ biến thể hoặc basePrice
        let lowestPrice = p.basePrice || 0;
        if (p.variants && p.variants.length > 0) {
          const prices = p.variants.map((v: any) => v.price).filter((pr: number) => pr > 0);
          if (prices.length > 0) {
            lowestPrice = Math.min(...prices);
          }
        }

        // Khớp loại sản phẩm (sofa, bàn, ghế...)
        if (criteria.categoryKeyword) {
          const catTerm = normalizeChatText(criteria.categoryKeyword);
          if (normName.includes(catTerm) || normCat.includes(catTerm)) {
            score += 5;
          }
        }

        // Khớp phòng (khách, ngủ, bếp...)
        if (criteria.room) {
          const roomTerm = normalizeChatText(criteria.room);
          if (normName.includes(roomTerm) || normCat.includes(roomTerm) || normDesc.includes(roomTerm)) {
            score += 3;
          }
        }

        // Khớp ngân sách
        if (criteria.budget) {
          const { minPrice, maxPrice } = criteria.budget;
          let withinBudget = true;
          if (minPrice !== undefined && lowestPrice < minPrice) withinBudget = false;
          if (maxPrice !== undefined && lowestPrice > maxPrice) withinBudget = false;

          if (withinBudget) {
            score += 4;
          } else {
            // Không nằm trong ngân sách -> trừ điểm nặng
            score -= 10;
          }
        }

        if (score > 0) {
          matches.push({ product: p, score, lowestPrice });
        }
      }

      matches.sort((a, b) => b.score - a.score);

      const topProducts = matches.slice(0, 3);

      if (topProducts.length === 0) {
        return {
          reply:
            'DCor chưa tìm thấy sản phẩm nào khớp hoàn toàn với tiêu chí này. Bạn có thể ghé mục Khám phá (/explore) để xem trọn bộ sưu tập hoặc cho DCor biết thêm khoảng ngân sách/chất liệu bạn thích nhé!',
          quickReplies: [
            { label: '🛋️ Sofa phòng khách', payload: 'sofa phòng khách' },
            { label: '🪑 Bàn ăn mặt đá', payload: 'bàn ăn mặt đá' },
            { label: '🧑‍💼 Nhờ nhân viên gợi ý', payload: 'gặp nhân viên' },
          ],
          newFallbackCount: 0,
        };
      }

      // Tạo thẻ meta sản phẩm
      const productCards = topProducts.map(({ product, lowestPrice }) => {
        let firstImg = '';
        if (Array.isArray(product.images) && product.images.length > 0) {
          firstImg = product.images[0];
        } else if (typeof product.images === 'string') {
          firstImg = product.images;
        }

        return {
          productId: product.id,
          name: product.name,
          image: firstImg,
          price: lowestPrice,
          formattedPrice: `${lowestPrice.toLocaleString('vi-VN')} đ`,
          link: `/products/${product.id}`,
        };
      });

      const replyLines = [
        'DCor gợi ý cho bạn một số mẫu nội thất nổi bật phù hợp với tiêu chí tìm kiếm:',
      ];
      for (const card of productCards) {
        replyLines.push(`• **${card.name}** - Giá từ: ${card.formattedPrice}`);
      }
      replyLines.push('Bạn có thể bấm vào thẻ sản phẩm bên dưới để xem chi tiết chất liệu và thông số nhé!');

      return {
        reply: replyLines.join('\n'),
        meta: {
          type: 'PRODUCT_CARDS',
          products: productCards,
        },
        quickReplies: [
          { label: '🔍 Xem thêm sản phẩm', payload: 'tìm sản phẩm khác' },
          { label: '📅 Đặt lịch trải nghiệm', payload: 'đặt lịch tư vấn' },
          { label: '🧑‍💼 Tư vấn chi tiết', payload: 'gặp nhân viên' },
        ],
        newFallbackCount: 0,
      };
    } catch (error) {
      console.error('Lỗi tìm kiếm sản phẩm:', error);
      return {
        reply: this.replaceVariables(script.answer, settings),
        quickReplies: script.quickReplies,
        newFallbackCount: 0,
      };
    }
  }

  /**
   * Phương thức Test Intent dành cho Admin API POST /scripts/test
   * KHÔNG tạo tin nhắn, không có tác dụng phụ DB
   */
  public async testScriptText(rawText: string): Promise<ScriptTestResult> {
    const scripts = await this.getActiveScripts();
    const settings = await this.getSettingsMap();
    const { bestMatch, candidates } = this.scoreIntents(rawText, scripts);

    if (!bestMatch || bestMatch.score < 0.55) {
      return {
        intent: 'FALLBACK',
        score: bestMatch ? Math.round(bestMatch.score * 100) / 100 : 0,
        candidates,
        reply: 'Không khớp kịch bản nào trên ngưỡng 0.55. Bot sẽ trả về câu Fallback hoặc chuyển nhân viên.',
      };
    }

    const reply = this.replaceVariables(bestMatch.script.answer, settings);

    return {
      intent: bestMatch.script.intent,
      score: Math.round(bestMatch.score * 100) / 100,
      candidates,
      reply,
      quickReplies: bestMatch.script.quickReplies,
    };
  }
}

export const chatBotService = new ChatBotService();
