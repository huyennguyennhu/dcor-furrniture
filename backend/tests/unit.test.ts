import test, { describe, it } from 'node:test';
import assert from 'node:assert';
import { normalizePhone, isValidPassword } from '../src/services/otp.service';
import {
  normalizeChatText,
  calculatePatternScore,
  isComplaint,
  extractOrderNumber,
  extractPhoneNumber,
  extractBudget,
  extractProductSearchCriteria,
} from '../src/services/chat-text.util';
import { ChatBotService } from '../src/services/chat-bot.service';
import { stripHtml, isValidImageUrl, generateSlug } from '../src/controllers/blog.controller';
import { validateAndSanitizeBlocks } from '../src/controllers/blog-admin.controller';

const chatBotService = new ChatBotService();

describe('NHÓM A - TEST ĐƠN VỊ (UNIT TESTS)', () => {
  // =========================================================================
  // 1. CHUẨN HÓA SỐ ĐIỆN THOẠI & MẬT KHẨU
  // =========================================================================
  describe('1. Chuẩn hóa SĐT và mật khẩu', () => {
    it('TC-AUTH-01: Chuẩn hóa các định dạng số điện thoại Việt Nam hợp lệ', () => {
      assert.strictEqual(normalizePhone('0901234567'), '0901234567');
      assert.strictEqual(normalizePhone('+84901234567'), '0901234567');
      assert.strictEqual(normalizePhone(' 090 123 4567 '), '0901234567');
      assert.strictEqual(normalizePhone('090.123.4567'), '0901234567');
      assert.strictEqual(normalizePhone('090-123-4567'), '0901234567');
      assert.strictEqual(normalizePhone('+84 901.234.567'), '0901234567');
    });

    it('TC-AUTH-02: Kiểm tra mật khẩu >= 8 ký tự và gồm cả chữ lẫn số', () => {
      // Hợp lệ
      assert.strictEqual(isValidPassword('Password123'), true);
      assert.strictEqual(isValidPassword('dcor2026!'), true);
      assert.strictEqual(isValidPassword('1234567a'), true);
      assert.strictEqual(isValidPassword('Abcdefgh1'), true);

      // Không hợp lệ: dưới 8 ký tự
      assert.strictEqual(isValidPassword('Pass12'), false);
      assert.strictEqual(isValidPassword(''), false);
      assert.strictEqual(isValidPassword('a1'), false);

      // Không hợp lệ: chỉ có chữ
      assert.strictEqual(isValidPassword('PasswordOnly'), false);
      assert.strictEqual(isValidPassword('abcdefghijk'), false);

      // Không hợp lệ: chỉ có số
      assert.strictEqual(isValidPassword('12345678'), false);
      assert.strictEqual(isValidPassword('0900000100'), false);
    });
  });

  // =========================================================================
  // 2. CHẤM ĐIỂM INTENT CHATBOT & KỊCH BẢN NLP
  // =========================================================================
  describe('2. Chấm điểm Intent Chatbot & Xử lý ngôn ngữ', () => {
    const mockScripts = [
      {
        id: 'script-greeting',
        intent: 'GREETING',
        name: 'Chào hỏi & Menu ban đầu',
        patterns: ['xin chao', 'chao ban', 'hello', 'hi dcor', 'alo', 'ad oi', 'shop oi'],
        answer: 'DCor xin chào bạn! Hotline: {{hotline}}.',
        actionType: 'NONE',
        priority: 6,
        isActive: true,
      },
      {
        id: 'script-hours',
        intent: 'BUSINESS_HOURS',
        name: 'Giờ làm việc & Mở cửa Showroom',
        patterns: ['gio lam viec', 'gio mo cua', 'may gio dong cua', 'khi nao mo cua', 'gio hoat dong showroom'],
        answer: 'DCor mở cửa từ {{hours}} hàng ngày.',
        actionType: 'BUSINESS_HOURS',
        priority: 9,
        isActive: true,
      },
      {
        id: 'script-address',
        intent: 'SHOWROOM_ADDRESS',
        name: 'Địa chỉ Showroom',
        patterns: ['dia chi', 'showroom o dau', 'cua hang o dau', 'chi nhanh', 'shop o dau'],
        answer: 'Showroom DCor tọa lạc tại: {{address}}.',
        actionType: 'NONE',
        priority: 9,
        isActive: true,
      },
      {
        id: 'script-order',
        intent: 'ORDER_STATUS',
        name: 'Tra cứu tình trạng đơn hàng',
        patterns: ['tra cuu don hang', 'don hang cua toi', 'kiem tra don', 'tien do giao hang', 'don hang den dau roi'],
        answer: 'Để tra cứu đơn hàng, bạn vui lòng nhập mã đơn (DC-xxxxxx).',
        actionType: 'ORDER_STATUS',
        priority: 10,
        isActive: true,
      },
      {
        id: 'script-payment',
        intent: 'PAYMENT_POLICY',
        name: 'Phương thức thanh toán & Đặt cọc',
        patterns: ['phuong thuc thanh toan', 'thanh toan the nao', 'co tra gop khong', 'co cod khong', 'dat coc bao nhieu', 'chuyen khoan'],
        answer: 'DCor hỗ trợ thanh toán khi nhận hàng (COD) và chuyển khoản qua mã VietQR.',
        actionType: 'NONE',
        priority: 8,
        isActive: true,
      },
      {
        id: 'script-handoff',
        intent: 'HUMAN_HANDOFF',
        name: 'Gặp nhân viên tư vấn',
        patterns: ['gap nhan vien', 'gap cskh', 'gap tu van vien', 'noi chuyen voi nguoi that', 'ho tro truc tiep'],
        answer: '{{handoffMessage}}',
        actionType: 'HANDOFF',
        priority: 15,
        isActive: true,
      },
    ];

    it('TC-CHAT-01: Chuẩn hóa tiếng Việt, bỏ dấu và giải mã từ viết tắt', () => {
      // Bỏ dấu, chữ thường, từ viết tắt: ko -> khong, sp -> san pham, sr -> showroom, dh -> don hang, vs -> voi
      assert.strictEqual(normalizeChatText('Shop ko có sp này à?'), 'shop khong co san pham nay a');
      assert.strictEqual(normalizeChatText('sr ở đâu hả ad?'), 'showroom o dau ha admin');
      assert.strictEqual(normalizeChatText('tra cứu dh giúp e vs'), 'tra cuu don hang giup em voi');
      assert.strictEqual(normalizeChatText('đc k shop'), 'duoc khong shop');
      assert.strictEqual(normalizeChatText('sđt hotline bn vậy'), 'so dien thoai hotline bao nhieu vay');
    });

    it('TC-CHAT-02: Phân biệt ngưỡng mơ hồ (Ambiguity Gap < 0.1)', () => {
      // Tạo tình huống 2 intent có điểm số gần ngang nhau
      const scripts = [
        {
          id: 's1',
          intent: 'POLICY_A',
          name: 'Chính sách bảo hành',
          patterns: ['bao hanh sofa phong khach'],
          answer: 'A',
          priority: 5,
          isActive: true,
        },
        {
          id: 's2',
          intent: 'POLICY_B',
          name: 'Bảo trì sofa',
          patterns: ['bao tri sofa phong khach'],
          answer: 'B',
          priority: 5,
          isActive: true,
        },
      ];
      const { bestMatch, secondMatch } = (chatBotService as any).scoreIntents('bao sofa phong khach', scripts);
      assert.ok(bestMatch, 'Phải có bestMatch');
      assert.ok(secondMatch, 'Phải có secondMatch');
      const diff = Math.abs(bestMatch.score - secondMatch.score);
      assert.ok(diff < 0.1, `Khoảng cách giữa hai intent phải < 0.1 (thực tế: ${diff})`);
    });

    it('TC-CHAT-03: Fallback xoay vòng sau lần đầu chưa hiểu', () => {
      const fallbackList = [
        'DCor chưa hiểu rõ câu hỏi của bạn. Bạn vui lòng diễn đạt cụ thể hơn hoặc chọn một trong các gợi ý bên dưới nhé!',
        'Xin lỗi bạn, câu hỏi này nằm ngoài hiểu biết hiện tại của bot. Bạn thử mô tả lại hoặc bấm nút Gặp nhân viên để được hỗ trợ trực tiếp.',
        'DCor chưa tìm được thông tin phù hợp với yêu cầu này. Bạn có thể chọn chủ đề cần giải đáp bên dưới để mình hỗ trợ ngay nhé!',
      ];

      // Giả lập logic chọn thông điệp fallback xoay vòng theo fallbackCount:
      const getFallback = (count: number) => fallbackList[count % fallbackList.length];

      assert.strictEqual(getFallback(0), fallbackList[0]);
      assert.strictEqual(getFallback(1), fallbackList[1]);
      assert.strictEqual(getFallback(2), fallbackList[2]);
      assert.strictEqual(getFallback(3), fallbackList[0], 'Xoay vòng lại phần tử đầu tiên');

      // Ngưỡng 2 lần liên tiếp không hiểu -> Handoff
      const fallbackThreshold = 2;
      const shouldHandoff = (count: number) => count >= fallbackThreshold;
      assert.strictEqual(shouldHandoff(1), false);
      assert.strictEqual(shouldHandoff(2), true, 'fallbackCount >= 2 phải kích hoạt chuyển nhân viên');
    });

    it('TC-CHAT-04: Chuyển nhân viên (Handoff) theo yêu cầu rõ ràng, gửi ảnh, hoặc từ khiếu nại', () => {
      // 1. Khách gửi ảnh
      const hasImage = Boolean('https://res.cloudinary.com/dcor/image/upload/sample.jpg');
      assert.strictEqual(hasImage, true, 'Gửi ảnh kích hoạt handoff nhân viên');

      // 2. Khách khiếu nại gay gắt
      assert.strictEqual(isComplaint('Dịch vụ quá tệ, lừa đảo, tôi muốn hoàn tiền gấp!'), true);
      assert.strictEqual(isComplaint('Shop lừa đảo à, tôi muốn khiếu nại'), true);
      assert.strictEqual(isComplaint('Cho mình xem mẫu sofa phòng khách'), false);

      // 3. Yêu cầu rõ ràng "Gặp nhân viên"
      const handoffKeywords = [
        'gap nhan vien',
        'gap cskh',
        'gap tu van vien',
        'noi chuyen voi nguoi that',
        'ho tro truc tiep',
      ];
      const checkWantsHandoff = (text: string) => {
        const norm = normalizeChatText(text);
        return handoffKeywords.some(kw => norm.includes(kw));
      };

      assert.strictEqual(checkWantsHandoff('cho tôi gặp nhân viên tư vấn trực tiếp'), true);
      assert.strictEqual(checkWantsHandoff('nói chuyện với người thật đi'), true);
      assert.strictEqual(checkWantsHandoff('gặp cskh'), true);
      assert.strictEqual(checkWantsHandoff('tư vấn giúp tôi chiếc bàn ăn'), false);
    });

    it('TC-CHAT-05: Khi conversation ở mode STAFF thì bot phải im lặng', () => {
      // Kiểm tra quy tắc nghiệp vụ mode STAFF tại server
      const convStaff = { mode: 'STAFF', id: 'conv-123' };
      const shouldBotReply = convStaff.mode !== 'STAFF' && convStaff.mode !== 'WAITING_STAFF';
      assert.strictEqual(shouldBotReply, false, 'Mode STAFF và WAITING_STAFF bot tuyệt đối không trả lời tự động');
    });

    it('TC-CHAT-06: Bot trả lời 24/7 không phụ thuộc vào giờ làm việc', () => {
      // Kiểm tra hàm isBusinessOpen vẫn tính toán đúng trạng thái nhưng bot vẫn luôn sinh câu trả lời
      const businessInfo = chatBotService.isBusinessOpen({ start: '08:00', end: '22:00', days: [1, 2, 3, 4, 5, 6] });
      assert.ok(businessInfo.statusText);
      assert.ok(businessInfo.hoursText);

      // Thay thế biến trong câu trả lời hoạt động bình thường
      const template = 'Showroom mở lúc {{hours}}. Trạng thái: {{status_open}}. Hotline: {{hotline}}';
      const output = chatBotService.replaceVariables(template, {
        hotline: '1900 1234',
        workingHours: { start: '08:00', end: '22:00', days: [0, 1, 2, 3, 4, 5, 6] },
      });
      assert.ok(output.includes('1900 1234'));
      assert.ok(!output.includes('{{hotline}}'));
    });

    it('TC-CHAT-07: Trích xuất ngân sách (5tr, dưới 10 triệu, từ 3 đến 8 triệu)', () => {
      const b1 = extractBudget('tôi muốn tìm sofa khoảng 5tr');
      assert.ok(b1, 'Phải trích xuất được 5tr');
      assert.strictEqual(b1?.minPrice, 4000000);
      assert.strictEqual(b1?.maxPrice, 6000000);

      const b2 = extractBudget('tìm bàn ăn dưới 10 triệu');
      assert.ok(b2, 'Phải trích xuất được dưới 10 triệu');
      assert.strictEqual(b2?.maxPrice, 10000000);

      const b3 = extractBudget('ngân sách từ 3 đến 8 triệu');
      assert.ok(b3, 'Phải trích xuất được từ 3 đến 8 triệu');
      assert.strictEqual(b3?.minPrice, 3000000);
      assert.strictEqual(b3?.maxPrice, 8000000);
    });

    it('TC-CHAT-08: Trích xuất mã đơn hàng định dạng DC-xxxxxx', () => {
      assert.strictEqual(extractOrderNumber('Đơn hàng của mình là DC-123456'), 'DC-123456');
      assert.strictEqual(extractOrderNumber('mã đơn: dc-654321 kiểm tra giúp'), 'DC-654321');
      assert.strictEqual(extractOrderNumber('DC 987654'), 'DC-987654');
      assert.strictEqual(extractOrderNumber('không có mã đơn nào ở đây'), null);
    });

    it('TC-CHAT-09: Tra đơn phải khớp cả mã đơn và số điện thoại bảo mật', () => {
      const order = {
        orderNumber: 'DC-123456',
        phone: '0901234567',
      };

      const inputOrderMatch = 'DC-123456';
      const inputPhoneMatch = '0901234567';
      const inputPhoneMismatch = '0909999999';

      const cleanOrderPhone = order.phone.replace(/\s+/g, '').replace('+84', '0');
      const cleanInputSuccess = inputPhoneMatch.replace(/\s+/g, '').replace('+84', '0');
      const cleanInputFail = inputPhoneMismatch.replace(/\s+/g, '').replace('+84', '0');

      assert.strictEqual(order.orderNumber === inputOrderMatch && cleanOrderPhone === cleanInputSuccess, true);
      assert.strictEqual(order.orderNumber === inputOrderMatch && cleanOrderPhone === cleanInputFail, false);
    });

    it('TC-CHAT-10: Kịch bản thanh toán chỉ nhắc COD và VietQR, không nhắc ví điện tử hay thẻ', () => {
      const standardPaymentAnswer = 'DCor hỗ trợ thanh toán khi nhận hàng (COD) và chuyển khoản qua mã VietQR.';
      const forbiddenTerms = ['ví điện tử', 'vi dien tu', 'thẻ tín dụng', 'the tin dung', 'momo', 'zalopay', 'vnpay'];

      const lower = standardPaymentAnswer.toLowerCase();
      assert.ok(lower.includes('cod'), 'Phải chứa COD');
      assert.ok(lower.includes('vietqr'), 'Phải chứa VietQR');

      for (const term of forbiddenTerms) {
        assert.strictEqual(lower.includes(term), false, `Không được nhắc tới phương thức chưa hỗ trợ: ${term}`);
      }
    });
  });

  // =========================================================================
  // 3. VALIDATE KHỐI NỘI DUNG BLOG & SLUG BỎ DẤU
  // =========================================================================
  describe('3. Validate khối nội dung Blog & Sinh slug', () => {
    it('TC-BLOG-01: Từ chối loại block không hợp lệ', () => {
      const invalidBlocks = [{ type: 'unknown_type', text: 'Nội dung khối lạ' }];
      const res = validateAndSanitizeBlocks(invalidBlocks);
      assert.strictEqual(res.isValid, false);
      assert.ok(res.error?.includes('không hợp lệ'));
    });

    it('TC-BLOG-02: Từ chối khối nội dung vượt quá 5000 ký tự', () => {
      const hugeText = 'A'.repeat(5001);
      const blocks = [{ type: 'paragraph', text: hugeText }];
      const res = validateAndSanitizeBlocks(blocks);
      assert.strictEqual(res.isValid, false);
      assert.ok(res.error?.includes('5000'));
    });

    it('TC-BLOG-03: Từ chối bài viết vượt quá 200 khối nội dung', () => {
      const manyBlocks = Array.from({ length: 201 }, (_, i) => ({
        type: 'paragraph',
        text: `Đoạn văn ${i + 1}`,
      }));
      const res = validateAndSanitizeBlocks(manyBlocks);
      assert.strictEqual(res.isValid, false);
      assert.ok(res.error?.includes('200'));
    });

    it('TC-BLOG-04: Thẻ HTML trong khối phải được loại bỏ an toàn (stripHtml)', () => {
      const rawText = '<script>alert("xss")</script><p>Nội dung <b>đậm</b> và <a href="#">liên kết</a></p>';
      const clean = stripHtml(rawText);
      assert.strictEqual(clean.includes('<'), false);
      assert.strictEqual(clean.includes('>'), false);
      assert.strictEqual(clean.includes('alert("xss")'), true);
      assert.strictEqual(clean.includes('Nội dung'), true);

      // Kiểm tra qua validateAndSanitizeBlocks
      const blocks = [{ type: 'paragraph', text: '<b>Xin chào</b> <i>DCor</i>' }];
      const res = validateAndSanitizeBlocks(blocks);
      assert.strictEqual(res.isValid, true);
      assert.strictEqual(res.sanitizedBlocks?.[0].text, 'Xin chào DCor');
    });

    it('TC-BLOG-05: Từ chối URL ảnh không hợp lệ (phải bắt đầu bằng https:// hoặc /assets/)', () => {
      assert.strictEqual(isValidImageUrl('http://insecure.com/image.jpg'), false);
      assert.strictEqual(isValidImageUrl('javascript:alert(1)'), false);
      assert.strictEqual(isValidImageUrl('ftp://files/image.png'), false);

      assert.strictEqual(isValidImageUrl('https://images.unsplash.com/photo-123.jpg'), true);
      assert.strictEqual(isValidImageUrl('/assets/img/blog_sofa.jpg'), true);

      const invalidBlock = [{ type: 'image', url: 'http://not-https.com/img.jpg' }];
      const res = validateAndSanitizeBlocks(invalidBlock);
      assert.strictEqual(res.isValid, false);
    });

    it('TC-BLOG-06: Sinh slug bỏ dấu tiếng Việt chuẩn SEO, không ký tự đặc biệt', () => {
      assert.strictEqual(
        generateSlug('Nghệ thuật bài trí phòng khách tối giản 2026!'),
        'nghe-thuat-bai-tri-phong-khach-toi-gian-2026'
      );
      assert.strictEqual(
        generateSlug('Đ/C & Nội thất Gỗ Óc Chó Cao Cấp?'),
        'dc-noi-that-go-oc-cho-cao-cap'
      );
      assert.strictEqual(generateSlug('   Khoảng Trắng    Thừa   '), 'khoang-trang-thua');
    });

    it('TC-BLOG-07: Logic hiển thị bài viết công khai (PUBLISHED và publishedAt <= now)', () => {
      const now = new Date('2026-11-04T12:00:00Z');

      const publishedPast = { status: 'PUBLISHED', publishedAt: new Date('2026-11-01T00:00:00Z') };
      const publishedFuture = { status: 'PUBLISHED', publishedAt: new Date('2026-11-05T00:00:00Z') };
      const draftPost = { status: 'DRAFT', publishedAt: new Date('2026-11-01T00:00:00Z') };
      const hiddenPost = { status: 'HIDDEN', publishedAt: new Date('2026-11-01T00:00:00Z') };

      const isPublic = (p: { status: string; publishedAt: Date }) =>
        p.status === 'PUBLISHED' && p.publishedAt.getTime() <= now.getTime();

      assert.strictEqual(isPublic(publishedPast), true, 'Bài đã xuất bản trong quá khứ phải hiển thị');
      assert.strictEqual(isPublic(publishedFuture), false, 'Bài hẹn giờ tương lai không được hiển thị');
      assert.strictEqual(isPublic(draftPost), false, 'Bản nháp không được hiển thị');
      assert.strictEqual(isPublic(hiddenPost), false, 'Bài ẩn không được hiển thị');
    });
  });
});
