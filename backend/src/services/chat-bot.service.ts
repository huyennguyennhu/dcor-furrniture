import prisma from '../lib/prisma';
import {
  normalizeChatText,
  calculatePatternScore,
  isComplaint,
  isPureGreeting,
  isHandoffRequest,
  extractOrderNumber,
  extractPhoneNumber,
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
  CONFIRMED: 'Đã xác nhận',
  PROCESSING: 'Đang xử lý / May đo',
  READY_TO_SHIP: 'Sẵn sàng giao hàng',
  SHIPPED: 'Đang giao hàng',
  DELIVERED: 'Đã giao hàng thành công',
  COMPLETED: 'Hoàn tất đơn hàng',
  CANCELLED: 'Đã hủy',
  RETURN_REQUESTED: 'Yêu cầu đổi trả',
  RETURNING: 'Đang hoàn trả hàng',
  RETURNED: 'Đã hoàn trả thành công',
  FAILED_DELIVERY: 'Giao hàng không thành công',
};

export class ChatBotService {
  /**
   * Kiểm tra giờ mở cửa / giờ trực CSKH theo múi giờ Asia/Ho_Chi_Minh
   * Mặc định 08:00 - 21:30
   */
  public isBusinessOpen(workingHoursSetting?: any): { isOpen: boolean; statusText: string; hoursText: string } {
    const config = workingHoursSetting || {
      start: '08:00',
      end: '21:30',
      days: [0, 1, 2, 3, 4, 5, 6],
    };

    const startStr = config.start || '08:00';
    const endStr = config.end || '21:30';
    const hoursText = `${startStr} - ${endStr}`;

    const now = new Date();
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    const vnTime = new Date(utc + 7 * 3600000);

    const dayOfWeek = vnTime.getDay(); // 0: Chủ Nhật, 1: Thứ 2, ...
    const validDays: number[] = Array.isArray(config.days) ? config.days : [0, 1, 2, 3, 4, 5, 6];

    if (!validDays.includes(dayOfWeek)) {
      return {
        isOpen: false,
        statusText: `Đang ngoài giờ trực (${hoursText})`,
        hoursText,
      };
    }

    const currentMinutes = vnTime.getHours() * 60 + vnTime.getMinutes();
    const [startH, startM] = startStr.split(':').map(Number);
    const [endH, endM] = endStr.split(':').map(Number);

    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    const isOpen = currentMinutes >= startMinutes && currentMinutes < endMinutes;

    const statusText = isOpen
      ? `Đang trong giờ trực (${hoursText})`
      : `Đang ngoài giờ trực (trực lại lúc ${startStr} sáng mai)`;

    return { isOpen, statusText, hoursText };
  }

  /**
   * Thay thế các biến động trong câu trả lời bot:
   * {{hotline}}, {{address}}, {{hours}}, {{status_open}}, {{handoffMessage}}, {{name}}
   */
  public replaceVariables(template: string, settings: Record<string, any>, extraVars?: Record<string, string>): string {
    if (!template) return '';

    const business = this.isBusinessOpen(settings['workingHours']);
    const hotline = settings['hotline'] || '1900 1234';
    const address = settings['address'] || '669 QL1A, TP. Hồ Chí Minh';
    const handoffMessage =
      settings['handoffMessage'] ||
      'DCor đã tiếp nhận yêu cầu và đang kết nối bạn với chuyên viên tư vấn. Bạn vui lòng giữ kết nối trong ít phút nhé!';

    let res = template
      .replace(/\{\{hotline\}\}/g, hotline)
      .replace(/\{\{address\}\}/g, address)
      .replace(/\{\{hours\}\}/g, business.hoursText)
      .replace(/\{\{status_open\}\}/g, business.statusText)
      .replace(/\{\{handoffMessage\}\}/g, handoffMessage);

    if (extraVars) {
      for (const [k, v] of Object.entries(extraVars)) {
        res = res.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), v);
      }
    }

    return res;
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
      if (sc.intent === 'GREETING' && !isPureGreeting(rawText)) {
        continue;
      }

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
      if (Math.abs(b.score - a.score) >= 0.04) {
        return b.score - a.score;
      }
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
   * Xử lý tin nhắn khách hàng gửi đến Bot (24/7)
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
    const isCustomerLoggedIn = Boolean(conversation.customerId);

    // 1. XỬ LÝ KHI NGƯỜI DÙNG GỬI ẢNH:
    if (imageUrl) {
      if (isCustomerLoggedIn) {
        const business = this.isBusinessOpen(settings['workingHours']);
        if (business.isOpen) {
          return {
            reply:
              'DCor đã tiếp nhận hình ảnh từ bạn và đang kết nối chuyên viên tư vấn để kiểm tra trực quan. Bạn vui lòng giữ kết nối trong ít phút nhé!',
            needsHandoff: true,
            systemMessage: 'Khách hàng gửi hình ảnh bản phối/mặt bằng cần chuyên viên hỗ trợ trực quan.',
            newFallbackCount: fallbackCount,
            updatedBotState: botState,
          };
        } else {
          const offlineReply = this.replaceVariables(
            settings['offlineMessage'] ||
            'Hiện tại đội ngũ CSKH đang ngoài giờ trực ({{hours}}). Bạn có thể để lại nội dung cần hỗ trợ, DCor sẽ ưu tiên liên hệ phản hồi vào đầu giờ sáng mai nhé!',
            settings
          );
          return {
            reply: offlineReply,
            needsHandoff: true,
            systemMessage: 'Khách hàng gửi hình ảnh ngoài giờ trực của chuyên viên CSKH.',
            newFallbackCount: fallbackCount,
            updatedBotState: botState,
          };
        }
      } else {
        // Khách vãng lai gửi ảnh: Bot phản hồi tiếp nhận ảnh và hướng dẫn đăng nhập nếu muốn kết nối nhân viên
        return {
          reply:
            'DCor đã nhận được hình ảnh của bạn! Bạn cần tư vấn thêm về mẫu mã, kích thước hay phối màu cho sản phẩm này? (Nếu muốn lưu mẫu và kết nối trực tiếp với chuyên viên tư vấn may đo, bạn có thể đăng nhập tài khoản nhé).',
          quickReplies: [
            { label: '📐 Tư vấn kích thước & chất liệu', payload: 'may đo riêng' },
            { label: '🔐 Đăng nhập để gặp chuyên viên', payload: 'dang_nhap' },
          ],
          needsHandoff: false,
          newFallbackCount: 0,
          updatedBotState: botState,
        };
      }
    }

    // 2. Ý ĐỊNH CHUYỂN NHÂN VIÊN VÀ KHIẾU NẠI CÓ ƯU TIÊN CAO NHẤT VÀ ĐƯỢC XÉT TRƯỚC
    const normalizedInput = normalizeChatText(userContent);

    // Xử lý khi khách bấm nút chọn: "Tiếp tục chat với Trợ lý AI"
    if (normalizedInput === 'tiep tuc chat bot' || normalizedInput.includes('tiep tuc chat voi tro ly ai') || normalizedInput.includes('quay lai chat bot')) {
      delete botState.pendingHandoff;
      return {
        reply: 'Trợ lý AI DCor sẵn sàng tiếp tục đồng hành cùng bạn! Bạn đang cần tìm hiểu về mẫu sản phẩm nào hoặc cần hỗ trợ gì tiếp theo ạ?',
        quickReplies: [
          { label: '🛋️ Xem mẫu Sofa hot', payload: 'xem mẫu sofa hot' },
          { label: '📐 Tư vấn may đo riêng', payload: 'may đo riêng' },
          { label: '📍 Đặt lịch Showroom', payload: 'đặt lịch showroom' },
        ],
        needsHandoff: false,
        newFallbackCount: 0,
        updatedBotState: botState,
      };
    }

    // Xử lý khi khách bấm nút chọn: "Để lại tin nhắn chờ nhân viên"
    if (normalizedInput === 'xac nhan cho nhan vien' || normalizedInput.includes('de lai tin nhan cho nhan vien')) {
      return {
        reply: 'DCor đã ghi nhận yêu cầu của bạn vào hàng đợi ưu tiên. Bạn có thể để lại câu hỏi hoặc yêu cầu cụ thể tại đây, chuyên viên tư vấn sẽ liên hệ phản hồi ngay khi bắt đầu ca trực nhé!',
        needsHandoff: true,
        systemMessage: 'Khách hàng xác nhận để lại tin nhắn chờ chuyên viên tư vấn sau giờ làm.',
        newFallbackCount: 0,
        updatedBotState: botState,
        quickReplies: [
          { label: '🤖 Tiếp tục chat với Trợ lý AI', payload: 'Tiếp tục chat với Trợ lý AI' },
        ],
      };
    }

    const wantsHandoff = isHandoffRequest(userContent);

    if (wantsHandoff) {
      delete botState.step;
      delete botState.pendingOrderNumber;
      delete botState.pendingPhone;

      // Khách vãng lai bấm "Gặp nhân viên"
      if (!isCustomerLoggedIn) {
        botState.pendingHandoff = true;
        return {
          reply:
            'Để chuyên viên DCor có thể đồng hành, lưu lại bản phối và hỗ trợ tư vấn chi tiết nhất, bạn vui lòng đăng nhập tài khoản nhé!',
          meta: { type: 'LOGIN_CTA' },
          quickReplies: [{ label: '🔐 Đăng nhập tài khoản', payload: 'dang_nhap' }],
          needsHandoff: false,
          newFallbackCount: 0,
          updatedBotState: botState,
        };
      }

      // Khách đã đăng nhập bấm "Gặp nhân viên"
      const business = this.isBusinessOpen(settings['workingHours']);
      if (business.isOpen) {
        const handoffText = this.replaceVariables(
          settings['handoffMessage'] ||
          'DCor đã tiếp nhận yêu cầu và đang kết nối bạn với chuyên viên tư vấn. Bạn vui lòng giữ kết nối trong ít phút nhé!',
          settings
        );
        return {
          reply: handoffText,
          needsHandoff: true,
          systemMessage: 'Khách hàng yêu cầu kết nối chuyên viên tư vấn trực tiếp.',
          newFallbackCount: 0,
          updatedBotState: botState,
          quickReplies: [
            { label: '🤖 Tiếp tục chat với Trợ lý AI', payload: 'Tiếp tục chat với Trợ lý AI' },
            { label: '📞 Hotline 1900 1234', payload: 'hotline' },
            { label: '📍 Đặt lịch Showroom', payload: 'đặt lịch showroom' },
          ],
        };
      } else {
        const offlineText = this.replaceVariables(
          settings['offlineMessage'] ||
          'Hiện tại đội ngũ CSKH đang ngoài giờ trực ({{hours}}). Bạn có thể để lại nội dung cần hỗ trợ, DCor sẽ ưu tiên liên hệ phản hồi vào đầu giờ sáng mai nhé!',
          settings
        );
        return {
          reply: offlineText,
          needsHandoff: false, // Ngoài giờ làm việc: mặc định không treo vào WAITING_STAFF trừ khi khách bấm xác nhận đợi
          systemMessage: 'Khách hàng hỏi gặp nhân viên ngoài giờ trực CSKH.',
          newFallbackCount: 0,
          updatedBotState: botState,
          quickReplies: [
            { label: '🛎️ Để lại tin nhắn chờ nhân viên', payload: 'Để lại tin nhắn chờ nhân viên' },
            { label: '🤖 Tiếp tục chat với Trợ lý AI', payload: 'Tiếp tục chat với Trợ lý AI' },
            { label: '🛋️ Xem mẫu Sofa hot', payload: 'xem mẫu sofa hot' },
          ],
        };
      }
    }

    // 3. Kiểm tra khiếu nại nghiêm trọng -> Handoff
    if (isComplaint(userContent)) {
      if (!isCustomerLoggedIn) {
        botState.pendingHandoff = true;
        return {
          reply:
            'DCor rất tiếc về sự cố bạn gặp phải. Để chuyên viên DCor tra cứu hồ sơ và hỗ trợ xử lý triệt để, bạn vui lòng đăng nhập tài khoản nhé!',
          meta: { type: 'LOGIN_CTA' },
          quickReplies: [{ label: '🔐 Đăng nhập tài khoản', payload: 'dang_nhap' }],
          needsHandoff: false,
          newFallbackCount: fallbackCount,
          updatedBotState: botState,
        };
      }

      const business = this.isBusinessOpen(settings['workingHours']);
      const complaintScript = scripts.find((s) => s.intent === 'COMPLAINT_FEEDBACK');
      const answer = complaintScript
        ? this.replaceVariables(complaintScript.answer, settings)
        : 'DCor vô cùng xin lỗi về trải nghiệm chưa được hài lòng của bạn! Hệ thống đang ưu tiên chuyển tiếp cuộc trò chuyện tới Trưởng bộ phận CSKH để hỗ trợ bạn ngay lập tức.';

      return {
        reply: answer,
        needsHandoff: true,
        systemMessage: business.isOpen
          ? 'Hội thoại được ưu tiên chuyển CSKH do phản ánh dịch vụ.'
          : 'Khách phản ánh dịch vụ ngoài giờ trực. CSKH sẽ ưu tiên liên hệ đầu giờ sáng mai.',
        newFallbackCount: fallbackCount,
        updatedBotState: botState,
        quickReplies: [{ label: '📞 Hotline 1900 1234', payload: 'hotline' }],
      };
    }

    // 4. Kiểm tra từ khóa HỦY/THOÁT luồng tra cứu đơn hàng
    const cancelKeywords = ['huy', 'huy tra cuu', 'khong tra cuu nua', 'quay lai', 'bo qua', 'thoat'];
    if (botState.step && cancelKeywords.includes(normalizedInput)) {
      delete botState.step;
      delete botState.pendingOrderNumber;
      delete botState.pendingPhone;

      return {
        reply: 'Đã hủy yêu cầu tra cứu đơn hàng. DCor có thể hỗ trợ gì khác cho bạn hôm nay?',
        quickReplies: [
          { label: '🛋️ Xem mẫu Sofa hot', payload: 'xem mẫu sofa hot' },
          { label: '📐 May đo riêng', payload: 'may đo riêng' },
          { label: '📍 Đặt lịch Showroom', payload: 'đặt lịch showroom' },
        ],
        newFallbackCount: 0,
        updatedBotState: botState,
      };
    }

    // 5. Xử lý luồng nhiều bước tra cứu đơn hàng đang chờ (AWAITING_ORDER_NUMBER / AWAITING_PHONE)
    if (botState.step === 'AWAITING_ORDER_NUMBER' || botState.step === 'AWAITING_PHONE') {
      const { bestMatch: stepMatch } = this.scoreIntents(userContent, scripts);
      if (stepMatch && stepMatch.score >= 0.7 && stepMatch.script.intent !== 'ORDER_STATUS') {
        delete botState.step;
        delete botState.pendingOrderNumber;
        delete botState.pendingPhone;
      } else {
        return await this.handleOrderStatusMultiStep(userContent, conversation, botState, settings);
      }
    }

    // 6. Kiểm tra tin nhắn chào hỏi thuần túy hoặc quá ngắn
    if (!normalizedInput || normalizedInput.length < 2 || isPureGreeting(userContent)) {
      const defaultGreeting = isCustomerLoggedIn
        ? 'Chào {{name}}! DCor có thể hỗ trợ gì cho bạn hôm nay?'
        : 'Xin chào bạn! DCor có thể hỗ trợ gì cho bạn hôm nay?';

      let replyText = defaultGreeting;
      replyText = this.replaceVariables(replyText, settings, {
        name: conversation.guestName || 'bạn',
      });

      const quickReplies = isCustomerLoggedIn
        ? [
          { label: '📦 Tình trạng đơn hàng', payload: 'tình trạng đơn hàng' },
          { label: '📐 May đo riêng', payload: 'may đo riêng' },
          { label: '📍 Đặt lịch Showroom', payload: 'đặt lịch showroom' },
        ]
        : [
          { label: '🛋️ Xem mẫu Sofa hot', payload: 'xem mẫu sofa hot' },
          { label: '📐 Tư vấn may đo theo kích thước', payload: 'tư vấn may đo theo kích thước' },
          { label: '📍 Đặt lịch trải nghiệm Showroom', payload: 'đặt lịch trải nghiệm showroom' },
        ];

      return {
        reply: replyText,
        quickReplies,
        newFallbackCount: 0,
        updatedBotState: botState,
      };
    }

    // 7. Nếu câu hỏi có chứa mã đơn hàng (DC-xxxxxx hoặc ORD-xxxxxx) -> tự động chuyển sang luồng tra cứu đơn hàng
    const extractedOrderCode = extractOrderNumber(userContent);
    if (extractedOrderCode) {
      return await this.handleOrderStatusMultiStep(userContent, conversation, botState, settings);
    }

    // 8. Chấm điểm Intent
    const { bestMatch, secondMatch } = this.scoreIntents(userContent, scripts);

    const CONFIDENCE_THRESHOLD = 0.55;
    const AMBIGUITY_GAP = 0.1;

    // A. Nếu điểm cao nhất < 0.55 -> Kích hoạt Fallback xoay vòng (>= 3)
    if (!bestMatch || bestMatch.score < CONFIDENCE_THRESHOLD) {
      const nextFallback = fallbackCount + 1;

      // Fallback xoay vòng
      const fallbackList: string[] = Array.isArray(settings['fallbackMessages'])
        ? settings['fallbackMessages']
        : [
          'DCor chưa hiểu rõ câu hỏi của bạn. Bạn vui lòng diễn đạt cụ thể hơn hoặc chọn một trong các gợi ý bên dưới nhé!',
          'Xin lỗi bạn, câu hỏi này nằm ngoài hiểu biết hiện tại của bot. Bạn thử mô tả lại hoặc bấm nút Gặp nhân viên để được hỗ trợ trực tiếp.',
          'DCor chưa tìm được thông tin phù hợp với yêu cầu này. Bạn có thể chọn chủ đề cần giải đáp bên dưới để mình hỗ trợ ngay nhé!',
        ];

      const fallbackText = fallbackList[fallbackCount % fallbackList.length];

      const defaultQR = isCustomerLoggedIn
        ? [
          { label: '📦 Tình trạng đơn hàng', payload: 'tình trạng đơn hàng' },
          { label: '📐 May đo riêng', payload: 'may đo riêng' },
          { label: '📍 Đặt lịch Showroom', payload: 'đặt lịch showroom' },
        ]
        : [
          { label: '🛋️ Xem mẫu Sofa hot', payload: 'xem mẫu sofa hot' },
          { label: '📐 Tư vấn may đo theo kích thước', payload: 'tư vấn may đo theo kích thước' },
          { label: '📍 Đặt lịch trải nghiệm Showroom', payload: 'đặt lịch trải nghiệm showroom' },
        ];

      return {
        reply: fallbackText,
        meta: {
          type: 'LINK',
          label: 'Xem tất cả sản phẩm',
          url: '/explore',
        },
        quickReplies: [
          { label: '🛋️ Sofa', payload: 'xem sofa' },
          { label: '🍽️ Bàn ăn', payload: 'xem ban an' },
          { label: '🛏️ Giường', payload: 'xem giuong' },
          { label: '🚪 Tủ', payload: 'xem tu' },
          ...defaultQR,
        ],
        newFallbackCount: nextFallback,
        updatedBotState: botState,
      };
    }

    // B. Kiểm tra MƠ HỒ (Ambiguity)
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

    // Xử lý theo ActionType & Intent
    switch (matchedScript.actionType) {
      case 'SOFA_HOT': {
        return await this.handleSofaHotFlow(matchedScript, settings);
      }

      case 'ORDER_STATUS': {
        return await this.handleOrderStatusMultiStep(userContent, conversation, botState, settings);
      }

      case 'BOOK_CONSULT': {
        const reply = this.replaceVariables(matchedScript.answer, settings);
        return {
          reply,
          meta: { type: 'BOOKING_CTA' },
          quickReplies: matchedScript.quickReplies || [
            { label: '📅 Đặt lịch tư vấn tại Showroom', payload: 'đặt lịch tư vấn tại showroom' },
            { label: '🛋️ Xem mẫu Sofa hot', payload: 'xem mẫu sofa hot' },
          ],
          newFallbackCount: 0,
          updatedBotState: botState,
        };
      }

      case 'CUSTOM_DESIGN': {
        const reply = this.replaceVariables(matchedScript.answer, settings);
        return {
          reply,
          meta: {
            type: 'LINK',
            label: 'Xem các mẫu hỗ trợ May đo',
            url: '/explore',
          },
          quickReplies: matchedScript.quickReplies || [
            { label: '🛋️ Xem các mẫu hỗ trợ May đo', payload: 'xem mau may do' },
            { label: '📍 Đặt lịch tư vấn tại Showroom', payload: 'đặt lịch tư vấn tại showroom' },
          ],
          newFallbackCount: 0,
          updatedBotState: botState,
        };
      }

      case 'HANDOFF': {
        // Chuyển sang logic handoff phía trên
        if (!isCustomerLoggedIn) {
          botState.pendingHandoff = true;
          return {
            reply:
              'Để chuyên viên DCor có thể đồng hành, lưu lại bản phối và hỗ trợ tư vấn chi tiết nhất, bạn vui lòng đăng nhập tài khoản nhé!',
            meta: { type: 'LOGIN_CTA' },
            quickReplies: [{ label: '🔐 Đăng nhập ngay', payload: 'dang_nhap' }],
            needsHandoff: false,
            newFallbackCount: 0,
            updatedBotState: botState,
          };
        }

        const business = this.isBusinessOpen(settings['workingHours']);
        const reply = business.isOpen
          ? this.replaceVariables(
            settings['handoffMessage'] ||
            'DCor đã tiếp nhận yêu cầu và đang kết nối bạn với chuyên viên tư vấn. Bạn vui lòng giữ kết nối trong ít phút nhé!',
            settings
          )
          : this.replaceVariables(
            settings['offlineMessage'] ||
            'Hiện tại đội ngũ CSKH đang ngoài giờ trực ({{hours}}). Bạn có thể để lại nội dung cần hỗ trợ, DCor sẽ ưu tiên liên hệ phản hồi vào đầu giờ sáng mai nhé!',
            settings
          );

        return {
          reply,
          needsHandoff: true,
          systemMessage: business.isOpen ? undefined : 'Khách liên hệ ngoài giờ trực CSKH.',
          newFallbackCount: 0,
          updatedBotState: botState,
          quickReplies: matchedScript.quickReplies,
        };
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
   * Xử lý intent SOFA_HOT:
   * Tối đa 3 thẻ sản phẩm đang bán thuộc nhóm Sofas có isBestSeller (thiếu thì lấy mới nhất)
   * Thẻ: {productId, name, image, price, link: '/products/<id>'}
   */
  public async handleSofaHotFlow(script: any, settings: Record<string, any>): Promise<BotProcessResult> {
    try {
      // 1. Tìm các sản phẩm thuộc category Sofa có isBestSeller = true
      const sofaCategoryFilter = {
        category: {
          OR: [{ slug: { contains: 'sofa', mode: 'insensitive' as const } }, { name: { contains: 'sofa', mode: 'insensitive' as const } }],
        },
      };

      let products = await prisma.product.findMany({
        where: {
          isActive: true,
          deletedAt: null,
          isBestSeller: true,
          ...sofaCategoryFilter,
        },
        orderBy: { createdAt: 'desc' },
        take: 3,
        select: {
          id: true,
          name: true,
          basePrice: true,
          images: true,
          isBestSeller: true,
        },
      });

      // 2. Nếu thiếu < 3 sản phẩm, lấy bù các sản phẩm sofa mới nhất
      if (products.length < 3) {
        const needed = 3 - products.length;
        const existingIds = products.map((p) => p.id);
        const fallbackProducts = await prisma.product.findMany({
          where: {
            isActive: true,
            deletedAt: null,
            id: { notIn: existingIds },
            ...sofaCategoryFilter,
          },
          orderBy: { createdAt: 'desc' },
          take: needed,
          select: {
            id: true,
            name: true,
            basePrice: true,
            images: true,
            isBestSeller: true,
          },
        });
        products = [...products, ...fallbackProducts];
      }

      // Tạo các thẻ sản phẩm chuẩn format
      const cards = products.map((p) => {
        let firstImg = '';
        if (Array.isArray(p.images) && p.images.length > 0) {
          firstImg = String(p.images[0]);
        } else if (typeof p.images === 'string') {
          firstImg = p.images;
        }

        return {
          productId: p.id,
          name: p.name,
          image: firstImg,
          price: p.basePrice,
          link: `/products/${p.id}`,
        };
      });

      const reply = this.replaceVariables(
        script.answer ||
        'DCor gợi ý top mẫu Sofa nổi bật và được yêu thích nhất hiện nay. Bạn có thể bấm vào thẻ sản phẩm để xem chi tiết kích thước và chất liệu nhé!',
        settings
      );

      return {
        reply,
        meta: {
          type: 'SOFA_HOT_CARDS',
          products: cards,
        },
        quickReplies: [
          { label: '📐 May đo riêng', payload: 'may đo riêng' },
          { label: '📍 Đặt lịch Showroom', payload: 'đặt lịch showroom' },
          { label: '🧑‍💼 Gặp nhân viên', payload: 'gặp nhân viên' },
        ],
        newFallbackCount: 0,
      };
    } catch (error) {
      console.error('Lỗi handleSofaHotFlow:', error);
      return {
        reply: this.replaceVariables(script.answer, settings),
        quickReplies: script.quickReplies,
        newFallbackCount: 0,
      };
    }
  }

  /**
   * Xử lý luồng tra cứu đơn hàng ORDER_STATUS:
   * - KHÁCH ĐĂNG NHẬP: không cần mã -> liệt kê tối đa 3 đơn gần nhất của chính khách (mã, trạng thái tiếng Việt, tổng tiền) theo customerId
   * - KHÁCH VÃNG LAI hoặc hỏi đơn cụ thể: xin mã đơn và SĐT đặt hàng, chỉ trả khi KHỚP, không khớp chỉ nói không tìm thấy, tối đa 5 lần thử/giờ
   */
  public async handleOrderStatusMultiStep(
    userContent: string,
    conversation: any,
    currentBotState: any,
    settings: Record<string, any>
  ): Promise<BotProcessResult> {
    const state = { ...currentBotState };
    const isCustomerLoggedIn = Boolean(conversation.customerId);

    // Trích xuất mã đơn và SĐT từ tin nhắn hiện tại
    const extractedOrderCode = extractOrderNumber(userContent) || state.pendingOrderNumber;
    const extractedPhone = extractPhoneNumber(userContent) || state.pendingPhone;

    // A. NẾU KHÁCH ĐÃ ĐĂNG NHẬP VÀ KHÔNG HỎI MÃ ĐƠN CỤ THỂ
    // Liệt kê tối đa 3 đơn gần nhất của chính khách
    if (isCustomerLoggedIn && !extractedOrderCode) {
      try {
        const orders = await prisma.order.findMany({
          where: { customerId: conversation.customerId },
          orderBy: { createdAt: 'desc' },
          take: 3,
          select: {
            id: true,
            orderNumber: true,
            status: true,
            totalAmount: true,
            createdAt: true,
          },
        });

        if (orders.length === 0) {
          return {
            reply: 'Hiện tại bạn chưa có đơn hàng nào tại DCor. Bạn có thể tham khảo các mẫu Sofa hot bên dưới nhé!',
            quickReplies: [
              { label: '🛋️ Xem mẫu Sofa hot', payload: 'xem mẫu sofa hot' },
              { label: '📐 May đo riêng', payload: 'may đo riêng' },
              { label: '📍 Đặt lịch Showroom', payload: 'đặt lịch showroom' },
            ],
            newFallbackCount: 0,
            updatedBotState: state,
          };
        }

        const lines = ['📦 **Danh sách đơn hàng gần nhất của bạn:**'];
        for (const o of orders) {
          const statusVn = ORDER_STATUS_VN[o.status] || o.status;
          const totalVn = Number(o.totalAmount).toLocaleString('vi-VN');
          lines.push(`• **${o.orderNumber}** - ${statusVn} (Tổng: ${totalVn} đ)`);
        }
        lines.push('\nNếu cần kiểm tra chi tiết đơn hàng cụ thể, bạn có thể gửi mã đơn cho DCor nhé!');

        return {
          reply: lines.join('\n'),
          quickReplies: [
            ...orders.map((o) => ({ label: `🔍 ${o.orderNumber}`, payload: o.orderNumber })),
            { label: '🧑‍💼 Gặp nhân viên', payload: 'gặp nhân viên' },
          ],
          newFallbackCount: 0,
          updatedBotState: state,
        };
      } catch (err) {
        console.error('Lỗi lấy đơn hàng của khách đăng nhập:', err);
      }
    }

    // B. KHÁCH VÃNG LAI HOẶC HỎI ĐƠN CỤ THỂ:
    // Kiểm tra Rate limit 5 lần thử mỗi giờ
    const now = Date.now();
    const ONE_HOUR = 60 * 60 * 1000;
    if (state.lookupResetAt && now < state.lookupResetAt) {
      if ((state.lookupAttempts || 0) >= 5) {
        return {
          reply:
            'Bạn đã nhập sai thông tin tra cứu quá 5 lần trong 1 giờ qua. Để đảm bảo an toàn bảo mật thông tin, tính năng tra cứu tạm khóa. Bạn vui lòng đăng nhập hoặc bấm Gặp nhân viên để được hỗ trợ nhé!',
          quickReplies: [{ label: '🧑‍💼 Gặp nhân viên', payload: 'gặp nhân viên' }],
          updatedBotState: state,
        };
      }
    } else {
      state.lookupAttempts = 0;
      state.lookupResetAt = now + ONE_HOUR;
    }

    // 1. Chưa có mã đơn hàng
    if (!extractedOrderCode) {
      state.step = 'AWAITING_ORDER_NUMBER';
      return {
        reply: 'Để tra cứu tiến độ đơn hàng, bạn vui lòng cung cấp mã đơn hàng (ví dụ DC-123456 hoặc ORD-...) nhé!',
        quickReplies: [
          { label: '🧑‍💼 Gặp nhân viên', payload: 'gặp nhân viên' },
          { label: '❌ Hủy', payload: 'hủy' },
        ],
        updatedBotState: state,
        newFallbackCount: 0,
      };
    }

    state.pendingOrderNumber = extractedOrderCode;

    // 2. Chưa có số điện thoại
    if (!extractedPhone) {
      state.step = 'AWAITING_PHONE';
      return {
        reply: `DCor đã nhận mã đơn **${extractedOrderCode}**. Để bảo mật thông tin đơn hàng, bạn vui lòng nhập số điện thoại đặt hàng để DCor đối chiếu nhé!`,
        quickReplies: [
          { label: '🧑‍💼 Gặp nhân viên', payload: 'gặp nhân viên' },
          { label: '❌ Hủy tra cứu', payload: 'hủy' },
        ],
        updatedBotState: state,
        newFallbackCount: 0,
      };
    }

    // 3. Đã có cả mã đơn và số điện thoại -> Đối chiếu trong DB
    const cleanPhone = extractedPhone.replace(/\s+/g, '').replace('+84', '0').replace(/^84/, '0');

    const order = await prisma.order.findFirst({
      where: {
        orderNumber: { equals: extractedOrderCode, mode: 'insensitive' },
      },
    });

    const orderPhoneClean = order ? order.phone.replace(/\s+/g, '').replace('+84', '0').replace(/^84/, '0') : '';

    // CHỈ TRẢ KHI KHỚP CẢ MÃ ĐƠN VÀ SĐT. Không khớp chỉ nói không tìm thấy.
    if (!order || orderPhoneClean !== cleanPhone) {
      state.lookupAttempts = (state.lookupAttempts || 0) + 1;
      return {
        reply:
          'DCor không tìm thấy đơn hàng nào phù hợp với thông tin bạn cung cấp. Bạn vui lòng kiểm tra lại mã đơn và số điện thoại nhé!',
        quickReplies: [
          { label: '🔄 Thử lại', payload: 'tình trạng đơn hàng' },
          { label: '🧑‍💼 Gặp nhân viên', payload: 'gặp nhân viên' },
          { label: '❌ Hủy', payload: 'hủy' },
        ],
        updatedBotState: state,
        newFallbackCount: 0,
      };
    }

    // KHỚP THÀNH CÔNG!
    const statusVn = ORDER_STATUS_VN[order.status] || order.status;
    const totalAmountVn = Number(order.totalAmount).toLocaleString('vi-VN');

    const detailText =
      `📦 **Thông tin tiến độ đơn hàng ${order.orderNumber}:**\n` +
      `- **Trạng thái:** ${statusVn}\n` +
      `- **Tổng tiền:** ${totalAmountVn} đ\n` +
      `- **Người nhận:** ${order.receiverName}`;

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
        totalAmount: order.totalAmount.toString(),
      },
      quickReplies: [
        { label: '🔄 Tra cứu đơn khác', payload: 'tình trạng đơn hàng' },
        { label: '🛋️ Xem mẫu Sofa hot', payload: 'xem mẫu sofa hot' },
        { label: '🧑‍💼 Gặp nhân viên', payload: 'gặp nhân viên' },
      ],
      updatedBotState: state,
      newFallbackCount: 0,
    };
  }

  /**
   * Phương thức Test Intent dành cho Admin API POST /scripts/test
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
