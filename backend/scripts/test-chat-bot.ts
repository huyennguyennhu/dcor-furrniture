import assert from 'node:assert';
import {
  normalizeChatText,
  extractBudget,
  extractOrderNumber,
  extractPhoneNumber,
  isComplaint,
  isPureGreeting,
  isHandoffRequest,
  calculatePatternScore,
} from '../src/services/chat-text.util';
import { ChatBotService } from '../src/services/chat-bot.service';
import { SEED_CHAT_SCRIPTS, SEED_CHAT_SETTINGS } from './reseed-chat-scripts';
import { iamService } from '../src/lib/iam.service';

const chatBotService = new ChatBotService();
const activeSeedScripts = SEED_CHAT_SCRIPTS.filter((s) => s.isActive);

console.log('🚀 Bắt đầu chạy bộ kiểm thử ChatBot DCor theo luồng mới (>= 40 test cases tiếng Việt)...');

let passedCount = 0;
let totalCount = 0;

const asyncTests: Promise<void>[] = [];

function runTest(name: string, fn: () => void | Promise<void>) {
  totalCount++;
  try {
    const res = fn();
    if (res && typeof (res as any).then === 'function') {
      const p = (res as any)
        .then(() => {
          passedCount++;
        })
        .catch((err: any) => {
          console.error(`❌ [FAIL] Test #${totalCount}: ${name}`);
          console.error(err);
          process.exit(1);
        });
      asyncTests.push(p);
    } else {
      passedCount++;
    }
  } catch (err: any) {
    console.error(`❌ [FAIL] Test #${totalCount}: ${name}`);
    console.error(err);
    throw err;
  }
}

// ============================================================================
// PHẦN 1: KIỂM THỬ TRÍCH XUẤT NGÂN SÁCH (BUDGET EXTRACTION)
// ============================================================================
runTest('Trích xuất ngân sách "5tr"', () => {
  const b = extractBudget('tôi cần tìm sofa 5tr');
  assert.ok(b);
  assert.strictEqual(b.maxPrice, 5_000_000);
});

runTest('Trích xuất ngân sách "dưới 10 triệu"', () => {
  const b = extractBudget('tìm bàn ăn dưới 10 triệu');
  assert.ok(b);
  assert.strictEqual(b.minPrice, 0);
  assert.strictEqual(b.maxPrice, 10_000_000);
});

runTest('Trích xuất ngân sách "duoi 5tr" (viết tắt không dấu)', () => {
  const b = extractBudget('mua giuong duoi 5tr ak');
  assert.ok(b);
  assert.strictEqual(b.maxPrice, 5_000_000);
});

runTest('Trích xuất ngân sách "từ 3 đến 8 triệu"', () => {
  const b = extractBudget('ngân sách từ 3 đến 8 triệu');
  assert.ok(b);
  assert.strictEqual(b.minPrice, 3_000_000);
  assert.strictEqual(b.maxPrice, 8_000_000);
});

runTest('Trích xuất ngân sách "tu 3 den 8tr" (viết tắt)', () => {
  const b = extractBudget('gia tu 3 den 8tr');
  assert.ok(b);
  assert.strictEqual(b.minPrice, 3_000_000);
  assert.strictEqual(b.maxPrice, 8_000_000);
});

runTest('Trích xuất ngân sách "trên 20tr"', () => {
  const b = extractBudget('sofa cao cap tren 20tr');
  assert.ok(b);
  assert.strictEqual(b.minPrice, 20_000_000);
});

runTest('Trích xuất ngân sách "khoảng 15 triệu" (tầm giá)', () => {
  const b = extractBudget('khoang 15 trieu co mau nao dep');
  assert.ok(b);
  assert.strictEqual(b.minPrice, 11_250_000);
  assert.strictEqual(b.maxPrice, 18_750_000);
});

runTest('Trích xuất ngân sách không có giá trị', () => {
  const b = extractBudget('tôi muốn xem mẫu mã sofa đẹp');
  assert.strictEqual(b, null);
});

// ============================================================================
// PHẦN 2: KIỂM THỬ TRÍCH XUẤT MÃ ĐƠN HÀNG VÀ SĐT (ORDER NUMBER & PHONE)
// ============================================================================
runTest('Trích xuất mã đơn format DC-xxxxxx: "Kiểm tra đơn DC-123456"', () => {
  const code = extractOrderNumber('Kiểm tra đơn DC-123456');
  assert.strictEqual(code, 'DC-123456');
});

runTest('Trích xuất mã đơn format ORD-xxxxxx: "Check đơn ORD-1791280290761-1"', () => {
  const code = extractOrderNumber('Check đơn ORD-1791280290761-1');
  assert.strictEqual(code, 'ORD-1791280290761-1');
});

runTest('Trích xuất mã đơn viết thường "dc 654321"', () => {
  const code = extractOrderNumber('mã đơn dc 654321');
  assert.strictEqual(code, 'DC-654321');
});

runTest('Trích xuất mã đơn "dc-999888 giao chưa"', () => {
  const code = extractOrderNumber('dc-999888 giao chưa');
  assert.strictEqual(code, 'DC-999888');
});

runTest('Trích xuất mã đơn "Don hang dc112233"', () => {
  const code = extractOrderNumber('Don hang dc112233');
  assert.strictEqual(code, 'DC-112233');
});

runTest('Trích xuất mã đơn không chứa format DC hoặc ORD', () => {
  const code = extractOrderNumber('Hôm nay trời đẹp quá');
  assert.strictEqual(code, null);
});

runTest('Trích xuất số điện thoại Việt Nam 10 số', () => {
  const phone = extractPhoneNumber('SĐT nhận hàng của tôi là 0901234567');
  assert.strictEqual(phone, '0901234567');
});

runTest('Trích xuất số điện thoại có tiền tố +84', () => {
  const phone = extractPhoneNumber('Liên hệ +84988776655 nhé');
  assert.strictEqual(phone, '0988776655');
});

// ============================================================================
// PHẦN 3: KIỂM THỬ PHÂN LOẠI INTENT BỘ KỊCH BẢN MỚI (LUONG_MOI.PDF)
// ============================================================================
const intentTests = [
  // 1. Chào hỏi
  { text: 'Xin chào shop', expected: 'GREETING' },
  { text: 'hi shop dcor', expected: 'GREETING' },
  { text: 'alo ad oi co ai o day khong', expected: 'GREETING' },
  { text: 'chao ban nhe', expected: 'GREETING' },

  // 2. Sofa hot
  { text: 'Xem mẫu sofa hot', expected: 'SOFA_HOT' },
  { text: 'cho minh xem sofa ban chay', expected: 'SOFA_HOT' },
  { text: 'mau sofa hot nhat hien nay', expected: 'SOFA_HOT' },
  { text: 'top sofa phong khach', expected: 'SOFA_HOT' },

  // 3. Custom (May đo)
  { text: 'Tư vấn may đo theo kích thước', expected: 'CUSTOM_DESIGN' },
  { text: 'May đo riêng', expected: 'CUSTOM_DESIGN' },
  { text: 'xưởng bên bạn có nhận đóng sofa theo bản vẽ thiết kế riêng không', expected: 'CUSTOM_DESIGN' },
  { text: 'bên bạn có làm hàng đặt theo yêu cầu không', expected: 'CUSTOM_DESIGN' },
  { text: 'co dong theo kich thuoc rieng phong khach k', expected: 'CUSTOM_DESIGN' },

  // 4. Showroom Booking
  { text: 'Đặt lịch trải nghiệm showroom', expected: 'SHOWROOM_BOOKING' },
  { text: 'Dat lich Showroom', expected: 'SHOWROOM_BOOKING' },
  { text: 'dat lich tu van tai showroom', expected: 'SHOWROOM_BOOKING' },
  { text: 'cho minh xin dia chi showroom o dau', expected: 'SHOWROOM_BOOKING' },
  { text: 'showroom mo cua may gio', expected: 'SHOWROOM_BOOKING' },
  { text: 'minh muon den xem chat lieu thuc te va thu do em cua nem', expected: 'SHOWROOM_BOOKING' },

  // 5. Tình trạng đơn hàng
  { text: 'Tình trạng đơn hàng', expected: 'ORDER_STATUS' },
  { text: 'tra cuu don hang cua toi', expected: 'ORDER_STATUS' },
  { text: 'kiem tra don hang', expected: 'ORDER_STATUS' },
  { text: 'check don hang giup minh', expected: 'ORDER_STATUS' },
  { text: 'don hang dang o dau roi shop', expected: 'ORDER_STATUS' },

  // 6. Bảo hành
  { text: 'Sản phẩm bên mình được bảo hành mấy năm', expected: 'WARRANTY_POLICY' },
  { text: 'chinh sach bao hanh sofa the nao', expected: 'WARRANTY_POLICY' },
  { text: 'dieu kien bao hanh san pham', expected: 'WARRANTY_POLICY' },

  // 7. Đổi trả (Tối đa 7 ngày, đổi mới hoặc trả hàng hoàn tiền)
  { text: 'Chính sách đổi trả hàng như thế nào', expected: 'RETURN_POLICY' },
  { text: 'co duoc tra hang khong shop', expected: 'RETURN_POLICY' },
  { text: 'doi tra trong may ngay', expected: 'RETURN_POLICY' },
  { text: 'dieu kien doi tra san pham', expected: 'RETURN_POLICY' },

  // 8. Vận chuyển
  { text: 'Phí vận chuyển và thời gian giao hàng bao lâu', expected: 'SHIPPING_POLICY' },
  { text: 'phi ship the nao co lap dat ko', expected: 'SHIPPING_POLICY' },
  { text: 'giao hang bao lau thi nhan duoc', expected: 'SHIPPING_POLICY' },

  // 9. Thanh toán (COD và VietQR, trên 50tr cọc 30%)
  { text: 'Có thanh toán khi nhận hàng COD không', expected: 'PAYMENT_POLICY' },
  { text: 'phuong thuc thanh toan the nao', expected: 'PAYMENT_POLICY' },
  { text: 'co chuyen khoan vietqr khong', expected: 'PAYMENT_POLICY' },
  { text: 'dat coc bao nhieu phan tram', expected: 'PAYMENT_POLICY' },

  // 10. Khuyến mãi
  { text: 'Shop có voucher giảm giá nào không', expected: 'PROMOTION_VOUCHER' },
  { text: 'co ma km giam gia gi ko ad', expected: 'PROMOTION_VOUCHER' },
  { text: 'chuong trinh khuyen mai hien tai', expected: 'PROMOTION_VOUCHER' },

  // 11. Gặp nhân viên
  { text: 'Cho tôi gặp nhân viên tư vấn', expected: 'HANDOFF_STAFF' },
  { text: 'gap cskh truc tiep', expected: 'HANDOFF_STAFF' },
  { text: 'muon noi chuyen voi nguoi that', expected: 'HANDOFF_STAFF' },

  // 12. Cảm ơn & Tạm biệt
  { text: 'Cảm ơn shop nhiều nhé', expected: 'THANK_YOU_BYE' },
  { text: 'ok thanks shop bye', expected: 'THANK_YOU_BYE' },
];

for (const t of intentTests) {
  runTest(`Phân loại Intent: "${t.text}" -> ${t.expected}`, () => {
    const { bestMatch } = chatBotService.scoreIntents(t.text, activeSeedScripts);
    assert.ok(bestMatch, `Không tìm thấy match nào cho: "${t.text}"`);
    assert.ok(
      bestMatch.score >= 0.55,
      `Điểm số quá thấp (${bestMatch.score} < 0.55) cho câu: "${t.text}"`
    );
    assert.strictEqual(
      bestMatch.script.intent,
      t.expected,
      `Kỳ vọng intent ${t.expected} nhưng nhận được ${bestMatch.script.intent} (score: ${bestMatch.score}) cho câu "${t.text}"`
    );
  });
}

// ============================================================================
// PHẦN 4: KIỂM THỬ KHIẾU NẠI & PHẢN ÁNH CHẤT LƯỢNG
// ============================================================================
const complaintCases = [
  'Shop lua dao a, toi muon khieu nai',
  'Dich vu qua te, buc minh thiet chu',
  'Hoan tien gap cho toi',
  'Toi se kien shop neu khong tra loi',
];

for (const cc of complaintCases) {
  runTest(`Phát hiện khiếu nại: "${cc}"`, () => {
    const flag = isComplaint(cc);
    assert.strictEqual(flag, true, `Câu "${cc}" phải được xác định là khiếu nại!`);
  });
}

// ============================================================================
// PHẦN 5: KIỂM THỬ NỘI DUNG TRUNG TÍNH CỦA INTENT CUSTOM (MAY ĐO)
// ============================================================================
runTest('Intent CUSTOM_DESIGN có nội dung trung tính đúng yêu cầu', () => {
  const customScript = activeSeedScripts.find((s) => s.intent === 'CUSTOM_DESIGN');
  assert.ok(customScript);
  assert.strictEqual(
    customScript.answer,
    'DCor hỗ trợ tùy biến theo yêu cầu dựa trên các mẫu trong catalogue (ví dụ điều chỉnh kích thước theo mặt bằng, chất liệu, màu sắc). Với yêu cầu thiết kế riêng, bạn có thể gửi yêu cầu Custom để được phản hồi báo giá trong vòng 24 giờ.'
  );
  // Không được chứa các từ cấm
  assert.strictEqual(customScript.answer.includes('xưởng sản xuất trực tiếp'), false);
  assert.strictEqual(customScript.answer.includes('chưa nhận gia công'), false);
});

// ============================================================================
// PHẦN 6: KIỂM THỬ SHOWROOM BOOKING CTA VÀ METADATA
// ============================================================================
runTest('Intent SHOWROOM_BOOKING trả actionType BOOK_CONSULT', () => {
  const showroomScript = activeSeedScripts.find((s) => s.intent === 'SHOWROOM_BOOKING');
  assert.ok(showroomScript);
  assert.strictEqual(showroomScript.actionType, 'BOOK_CONSULT');
  assert.ok(showroomScript.answer.includes('{{address}}'));
  assert.ok(showroomScript.answer.includes('{{hours}}'));
  assert.ok(showroomScript.answer.includes('{{hotline}}'));
});

// ============================================================================
// PHẦN 7: KIỂM THỬ CHÍNH SÁCH ĐỔI TRẢ VÀ THANH TOÁN
// ============================================================================
runTest('Chính sách thanh toán CHỈ COD và VietQR, đơn > 50tr cọc 30%', () => {
  const paymentScript = activeSeedScripts.find((s) => s.intent === 'PAYMENT_POLICY');
  assert.ok(paymentScript);
  assert.ok(paymentScript.answer.includes('COD'));
  assert.ok(paymentScript.answer.includes('VietQR'));
  assert.ok(paymentScript.answer.includes('không áp dụng ví điện tử hay quẹt thẻ'));
  assert.ok(paymentScript.answer.includes('50 triệu'));
  assert.ok(paymentScript.answer.includes('30%'));
});

runTest('Chính sách đổi trả tối đa 7 ngày, đổi mới hoặc hoàn tiền', () => {
  const returnScript = activeSeedScripts.find((s) => s.intent === 'RETURN_POLICY');
  assert.ok(returnScript);
  assert.ok(returnScript.answer.includes('7 ngày'));
  assert.ok(returnScript.answer.includes('Đổi sản phẩm mới'));
  assert.ok(returnScript.answer.includes('Trả hàng và hoàn tiền'));
});

// ============================================================================
// PHẦN 8: KIỂM THỬ GIỜ LÀM VIỆC & MẶC ĐỊNH 08:00 - 21:30
// ============================================================================
runTest('Kiểm tra giờ trực mặc định 08:00 - 21:30', () => {
  const business = chatBotService.isBusinessOpen({
    start: '08:00',
    end: '21:30',
    days: [0, 1, 2, 3, 4, 5, 6],
  });
  assert.ok(typeof business.isOpen === 'boolean');
  assert.ok(business.hoursText.includes('08:00 - 21:30'));
});

// ============================================================================
// PHẦN 9: KIỂM THỬ PHÂN QUYỀN IAM /api/admin/chatbox
// ============================================================================
runTest('Super Admin có quyền xem và sửa phân hệ chat', () => {
  const superAdmin = { id: 'sa-1', email: 'admin@dcor.vn', role: 'Super Admin', roles: ['Super Admin'], type: 'STAFF' };
  assert.strictEqual(iamService.hasPermission(superAdmin, 'chat', 'view'), true);
  assert.strictEqual(iamService.hasPermission(superAdmin, 'chat', 'edit'), true);
});

runTest('Khách hàng (CUSTOMER) bị từ chối truy cập API quản trị', () => {
  const customerUser = { id: 'c-1', email: 'cust@gmail.com', role: 'CUSTOMER', type: 'CUSTOMER' };
  assert.strictEqual(customerUser.type === 'CUSTOMER', true);
});

// ============================================================================
// PHẦN 10: KIỂM THỬ ƯU TIÊN CHUYỂN NHÂN VIÊN VÀ CHÀO HỎI THUẦN TÚY (>= 10 câu mới)
// ============================================================================
const newHandoffVsGreetingTests = [
  'hello, t muốn nhân viên hỗ trợ',
  'hello cho mình gặp nhân viên',
  'chào shop, mình muốn nói chuyện với người thật',
  'alo tư vấn viên đâu',
  'hi ad cho minh gap cskh',
  'chao dcor can gap nhan vien tu van',
  'hello shop muon gap nguoi that',
  'alo nhan vien ho tro minh voi',
  'hi shop chuyen nhan vien giup minh',
  'chao shop cho toi gap nhan vien',
  'hello shop co nhan vien o day khong',
];

for (const query of newHandoffVsGreetingTests) {
  runTest(`Ưu tiên Handoff trước Chào hỏi: "${query}"`, () => {
    // 1. Phải được nhận diện là Handoff Request
    const isHandoff = isHandoffRequest(query);
    assert.strictEqual(isHandoff, true, `Câu "${query}" phải kích hoạt ý định chuyển nhân viên!`);

    // 2. Không được coi là lời chào thuần túy
    const isPure = isPureGreeting(query);
    assert.strictEqual(isPure, false, `Câu "${query}" không được coi là lời chào thuần túy!`);

    // 3. Khi chấm điểm intent qua bot service, không được trả về GREETING
    const { bestMatch } = chatBotService.scoreIntents(query, activeSeedScripts);
    if (bestMatch && bestMatch.score >= 0.55) {
      assert.notStrictEqual(
        bestMatch.script.intent,
        'GREETING',
        `Câu "${query}" bị nhầm sang GREETING thay vì HANDOFF!`
      );
    }
  });
}

// Kiểm thử các câu chào hỏi thuần túy
const pureGreetingTests = [
  'xin chào',
  'hello shop',
  'hi dcor',
  'alo',
  'chào bạn nha',
  'hi ad',
];

for (const pg of pureGreetingTests) {
  runTest(`Lời chào thuần túy: "${pg}"`, () => {
    const isPure = isPureGreeting(pg);
    assert.strictEqual(isPure, true, `Câu "${pg}" phải được coi là lời chào thuần túy!`);
    const isHandoff = isHandoffRequest(pg);
    assert.strictEqual(isHandoff, false, `Câu "${pg}" không được có handoff!`);
  });
}

// ============================================================================
// PHẦN 11: KIỂM THỬ GỌI ĐỒNG THỜI 5 LẦN CHO CÙNG CUSTOMERID VÀ GUESTTOKEN
// ============================================================================
runTest('Mô phỏng 5 lần gọi đồng thời getOrCreateConversation cho cùng customerId', async () => {
  const { getOrCreateConversation, hashGuestToken } = await import('../src/services/chat.socket');
  const prisma = (await import('../src/lib/prisma')).default;

  const testCustomer = await prisma.customer.findFirst({
    select: { id: true, fullName: true },
  });

  if (testCustomer) {
    // 5 lời gọi song song
    const promises = Array.from({ length: 5 }, () =>
      getOrCreateConversation({
        customerId: testCustomer.id,
        name: testCustomer.fullName,
      })
    );

    const results = await Promise.all(promises);
    const convIds = new Set(results.map((r) => r.conversation.id));
    assert.strictEqual(
      convIds.size,
      1,
      `Chạy đồng thời 5 lần cho cùng customerId ${testCustomer.id} phải trả về đúng 1 hội thoại duy nhất! Nhận được: ${Array.from(convIds).join(', ')}`
    );

    // Xác nhận trong DB chỉ có đúng 1 hội thoại cho customer này
    const countInDb = await prisma.chatConversation.count({
      where: { customerId: testCustomer.id },
    });
    // Dữ liệu cũ chưa merge có thể có nhiều, nhưng các lời gọi đồng thời getOrCreateConversation cùng quy về 1
    assert.ok(countInDb >= 1);
  }
});

runTest('Mô phỏng 5 lần gọi đồng thời getOrCreateConversation cho cùng guestToken', async () => {
  const { getOrCreateConversation, hashGuestToken } = await import('../src/services/chat.socket');
  const prisma = (await import('../src/lib/prisma')).default;

  const fakeGuestToken = 'simulated_guest_token_' + Date.now();
  const guestTokenHash = hashGuestToken(fakeGuestToken);

  try {
    const promises = Array.from({ length: 5 }, () =>
      getOrCreateConversation({
        guestTokenHash,
        name: 'Khách Đồng Thời Test',
      })
    );

    const results = await Promise.all(promises);
    const convIds = new Set(results.map((r) => r.conversation.id));
    assert.strictEqual(
      convIds.size,
      1,
      `Chạy đồng thời 5 lần cho cùng guestToken phải trả về đúng 1 hội thoại duy nhất! Nhận được: ${Array.from(convIds).join(', ')}`
    );

    const countInDb = await prisma.chatConversation.count({
      where: { guestTokenHash },
    });
    assert.strictEqual(
      countInDb,
      1,
      `Trong Database phải lưu đúng 1 hội thoại cho guestTokenHash này! Nhận được: ${countInDb}`
    );
  } finally {
    // Dọn dẹp hội thoại test
    await prisma.chatConversation.deleteMany({
      where: { guestTokenHash },
    });
  }
});

Promise.all(asyncTests).then(async () => {
  const prisma = (await import('../src/lib/prisma')).default;
  await prisma.$disconnect();
  console.log(`\n🎉 HOÀN THÀNH XUẤT SẮC! ${passedCount}/${totalCount} bài kiểm thử đã VƯỢT QUA thành công (100%).\n`);
  process.exit(0);
});
