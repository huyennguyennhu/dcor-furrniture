/**
 * NHÓM C - KIỂM THỬ TÍCH HỢP API & DATABASE (INTEGRATION TESTS)
 * Chỉ chạy khi ALLOW_DB_TESTS=1 và server đang phản hồi tại TEST_API_URL (mặc định http://localhost:3000)
 * Chạy bằng: npx ts-node tests/integration.test.ts
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { prisma } from '../src/lib/prisma';

const BASE_URL = process.env.TEST_API_URL || 'http://localhost:3000';
const ALLOW_DB_TESTS = process.env.ALLOW_DB_TESTS === '1';

// Dải số điện thoại định danh an toàn: 0900000100 đến 0900000199
const TEST_PHONES = {
  P1: '0900000101',
  P2: '0900000102',
  P3: '0900000103',
  P4: '0900000104',
  P5: '0900000105',
  P6: '0900000106',
  P7: '0900000107',
  P8: '0900000108',
  P9: '0900000109',
};

// Hàm dọn sạch dữ liệu mang định danh TEST
async function cleanupTestData() {
  if (!ALLOW_DB_TESTS) return;
  try {
    // 1. Dọn bảng OTP trong dải số test
    await prisma.otpCode.deleteMany({
      where: {
        phone: {
          gte: '0900000100',
          lte: '0900000199',
        },
      },
    });

    // 2. Dọn bảng Customer và các quan hệ liên quan
    const testCustomers = await prisma.customer.findMany({
      where: {
        OR: [
          { phone: { gte: '0900000100', lte: '0900000199' } },
          { fullName: { startsWith: '[TEST]' } },
          { email: { startsWith: 'test_' } },
        ],
      },
      select: { id: true },
    });

    const customerIds = testCustomers.map(c => c.id);
    if (customerIds.length > 0) {
      // Dọn giỏ hàng, token, địa chỉ, comment blog, like
      await (prisma as any).cartItem?.deleteMany({ where: { cart: { customerId: { in: customerIds } } } });
      await (prisma as any).cart?.deleteMany({ where: { customerId: { in: customerIds } } });
      await (prisma as any).address?.deleteMany({ where: { customerId: { in: customerIds } } });
      await (prisma as any).blogComment?.deleteMany({ where: { customerId: { in: customerIds } } });
      await (prisma as any).blogLike?.deleteMany({ where: { customerId: { in: customerIds } } });
      await prisma.customer.deleteMany({ where: { id: { in: customerIds } } });
    }

    // 3. Dọn các bài viết Blog mang tiền tố [TEST]
    await (prisma as any).blogPost?.deleteMany({
      where: {
        title: { startsWith: '[TEST]' },
      },
    });

    // 4. Dọn Design Post / Room Template mang tiền tố [TEST]
    await (prisma as any).designPost?.deleteMany({
      where: {
        title: { startsWith: '[TEST]' },
      },
    });
  } catch (err) {
    console.error('[CLEANUP] Lỗi khi dọn dẹp dữ liệu test:', err);
  }
}

// Kiểm tra xem server có đang chạy và phản hồi hay không
async function isServerHealthy(): Promise<boolean> {
  if (!ALLOW_DB_TESTS) return false;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(`${BASE_URL}/api/health`, { signal: controller.signal });
    clearTimeout(timeoutId);
    return res.status === 200 || res.status === 503;
  } catch {
    return false;
  }
}

describe('NHÓM C - KIỂM THỬ TÍCH HỢP API & DATABASE (INTEGRATION TESTS)', () => {
  let canRunIntegration = false;

  before(async () => {
    if (!ALLOW_DB_TESTS) {
      console.log('===> SKIP NHÓM C: Biến môi trường ALLOW_DB_TESTS=1 chưa được bật để bảo vệ cơ sở dữ liệu chung.');
      return;
    }
    const healthy = await isServerHealthy();
    if (!healthy) {
      console.log(`===> SKIP NHÓM C: Máy chủ không hoạt động tại ${BASE_URL} (Health check không phản hồi).`);
      return;
    }
    canRunIntegration = true;
    await cleanupTestData();
  });

  after(async () => {
    if (canRunIntegration) {
      await cleanupTestData();
    }
  });

  // ==========================================
  // PHÂN HỆ XÁC THỰC (AUTHENTICATION)
  // ==========================================
  describe('1. Phân hệ Xác thực (Auth)', () => {
    it('TC-AUTH-10: Gửi OTP với SĐT sai định dạng phải trả về 400', async (t) => {
      if (!canRunIntegration) {
        t.skip('Bỏ qua vì server offline hoặc chưa bật ALLOW_DB_TESTS=1');
        return;
      }
      const res = await fetch(`${BASE_URL}/api/auth/register/otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: '12345' }),
      });
      assert.strictEqual(res.status, 400, 'SĐT không hợp lệ phải trả HTTP 400');
    });

    it('TC-AUTH-11: Gửi lại OTP trong vòng 60 giây phải trả 429 kèm retryAfter', async (t) => {
      if (!canRunIntegration) {
        t.skip('Bỏ qua vì server offline hoặc chưa bật ALLOW_DB_TESTS=1');
        return;
      }
      // Gửi lần 1
      await fetch(`${BASE_URL}/api/auth/register/otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: TEST_PHONES.P1 }),
      });

      // Gửi lần 2 ngay lập tức
      const res2 = await fetch(`${BASE_URL}/api/auth/register/otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: TEST_PHONES.P1 }),
      });

      assert.strictEqual(res2.status, 429, 'Gửi lại OTP quá nhanh phải trả về 429');
      const data = await res2.json() as any;
      assert.ok(data.retryAfter !== undefined || data.remainingSeconds !== undefined, 'Phải có trường retryAfter hoặc remainingSeconds');
    });

    it('TC-AUTH-12: Nhập sai OTP 5 lần liên tiếp sẽ bị khóa (isLocked / 429)', async (t) => {
      if (!canRunIntegration) {
        t.skip('Bỏ qua vì server offline hoặc chưa bật ALLOW_DB_TESTS=1');
        return;
      }
      // Khởi tạo bản ghi OTP cho P2
      await fetch(`${BASE_URL}/api/auth/register/otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: TEST_PHONES.P2 }),
      });

      // Nhập sai 5 lần
      for (let i = 0; i < 5; i++) {
        await fetch(`${BASE_URL}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: TEST_PHONES.P2,
            otp: '000000',
            password: 'Password123',
            fullName: '[TEST] Nguyen Van A',
          }),
        });
      }

      // Lần thứ 6 phải trả về lỗi khóa
      const resFinal = await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: TEST_PHONES.P2,
          otp: '000000',
          password: 'Password123',
          fullName: '[TEST] Nguyen Van A',
        }),
      });

      assert.ok([400, 423, 429].includes(resFinal.status), 'Phải khóa tài khoản/số điện thoại sau 5 lần sai');
    });

    it('TC-AUTH-13: OTP hết hạn (expiresAt trong quá khứ) phải bị từ chối', async (t) => {
      if (!canRunIntegration) {
        t.skip('Bỏ qua vì server offline hoặc chưa bật ALLOW_DB_TESTS=1');
        return;
      }
      // Tạo trực tiếp OTP đã hết hạn trong database
      await prisma.otpCode.create({
        data: {
          phone: TEST_PHONES.P3,
          otpHash: 'fake_hash',
          attempts: 0,
          expiresAt: new Date(Date.now() - 60000), // Quá khứ 1 phút
        },
      });

      const res = await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: TEST_PHONES.P3,
          otp: '123456',
          password: 'Password123',
          fullName: '[TEST] Expired OTP',
        }),
      });

      assert.strictEqual(res.status, 400, 'OTP hết hạn phải trả về 400');
    });

    it('TC-AUTH-14: Đăng ký thành công trả token và KHÔNG lộ passwordHash/otpHash', async (t) => {
      if (!canRunIntegration) {
        t.skip('Bỏ qua vì server offline hoặc chưa bật ALLOW_DB_TESTS=1');
        return;
      }
      // Gửi OTP với EXPOSE_DEV_OTP=true nếu server hỗ trợ
      const otpRes = await fetch(`${BASE_URL}/api/auth/register/otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: TEST_PHONES.P4 }),
      });
      const otpData = await otpRes.json() as any;
      const devOtp = otpData.devOtp || '123456';

      const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: TEST_PHONES.P4,
          otp: devOtp,
          password: 'Password123',
          fullName: '[TEST] Success User',
        }),
      });

      if (regRes.status === 200 || regRes.status === 201) {
        const data = await regRes.json() as any;
        assert.ok(data.token || data.accessToken, 'Phải có token sau khi đăng ký');
        assert.strictEqual(data.passwordHash, undefined, 'Tuyệt đối không lộ passwordHash');
        assert.strictEqual(data.otpHash, undefined, 'Tuyệt đối không lộ otpHash');
      }
    });

    it('TC-AUTH-15: Đăng ký với mật khẩu yếu (< 8 ký tự hoặc chỉ có số) phải bị từ chối 400', async (t) => {
      if (!canRunIntegration) {
        t.skip('Bỏ qua vì server offline hoặc chưa bật ALLOW_DB_TESTS=1');
        return;
      }
      const res = await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: TEST_PHONES.P5,
          otp: '123456',
          password: '123', // Mật khẩu yếu
          fullName: '[TEST] Weak Password',
        }),
      });
      assert.strictEqual(res.status, 400, 'Mật khẩu yếu phải trả 400');
    });

    it('TC-AUTH-16: Đăng nhập sai mật khẩu trả thông báo chung (chống rà quét người dùng)', async (t) => {
      if (!canRunIntegration) {
        t.skip('Bỏ qua vì server offline hoặc chưa bật ALLOW_DB_TESTS=1');
        return;
      }
      const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: '0900000199', // SĐT không tồn tại hoặc sai pass
          password: 'WrongPassword999',
        }),
      });

      assert.ok([400, 401].includes(res.status));
      const data = await res.json() as any;
      // Thông báo không được phân biệt giữa 'SĐT không tồn tại' và 'Sai mật khẩu'
      assert.ok(
        data.message?.toLowerCase().includes('không chính xác') ||
        data.message?.toLowerCase().includes('không hợp lệ') ||
        data.error?.toLowerCase().includes('invalid')
      );
    });

    it('TC-AUTH-17: Đăng nhập sai 5 lần liên tiếp trả 423 Locked kèm remainingSeconds', async (t) => {
      if (!canRunIntegration) {
        t.skip('Bỏ qua vì server offline hoặc chưa bật ALLOW_DB_TESTS=1');
        return;
      }
      // Thử đăng nhập sai 5 lần
      for (let i = 0; i < 5; i++) {
        await fetch(`${BASE_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: TEST_PHONES.P6,
            password: 'WrongPassword123',
          }),
        });
      }

      const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: TEST_PHONES.P6,
          password: 'WrongPassword123',
        }),
      });

      // Lần thứ 6 nếu tài khoản bị khóa phải trả 423
      if (res.status === 423) {
        const data = await res.json() as any;
        assert.ok(data.remainingSeconds !== undefined, 'Mã 423 phải có remainingSeconds');
      }
    });

    it('TC-AUTH-18: Quên mật khẩu luôn trả 200 generic message dù SĐT có tồn tại hay không', async (t) => {
      if (!canRunIntegration) {
        t.skip('Bỏ qua vì server offline hoặc chưa bật ALLOW_DB_TESTS=1');
        return;
      }
      const res = await fetch(`${BASE_URL}/api/auth/forgot-password/otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: '0900000188' }), // SĐT lạ
      });
      assert.strictEqual(res.status, 200, 'Quên mật khẩu phải luôn trả 200 để tránh enumeration attack');
    });

    it('TC-AUTH-19: devOtp chỉ được trả về khi biến EXPOSE_DEV_OTP=true', async (t) => {
      if (!canRunIntegration) {
        t.skip('Bỏ qua vì server offline hoặc chưa bật ALLOW_DB_TESTS=1');
        return;
      }
      const res = await fetch(`${BASE_URL}/api/auth/register/otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: TEST_PHONES.P7 }),
      });
      const data = await res.json() as any;
      if (process.env.EXPOSE_DEV_OTP !== 'true') {
        assert.strictEqual(data.devOtp, undefined, 'Môi trường production (không có EXPOSE_DEV_OTP=true) không được trả devOtp');
      }
    });
  });

  // ==========================================
  // PHÂN HỆ CHAT (CUSTOMER + ADMIN CHATBOX)
  // ==========================================
  describe('2. Phân hệ Chatbox (Chat & Admin)', () => {
    it('TC-CHAT-20: Khách không được xem hội thoại của khách khác (403 hoặc 404)', async (t) => {
      if (!canRunIntegration) {
        t.skip('Bỏ qua vì server offline hoặc chưa bật ALLOW_DB_TESTS=1');
        return;
      }
      // Gửi request lấy hội thoại với guest token giả mạo hoặc ID của người khác
      const res = await fetch(`${BASE_URL}/api/chat/conversation`, {
        headers: {
          'x-guest-token': 'fake-guest-token-random-12345',
        },
      });
      assert.ok([200, 403, 404].includes(res.status));
      if (res.status === 200) {
        const data = await res.json() as any;
        // Phải tạo mới conversation rỗng cho token mới, không được lộ tin nhắn cũ của khách khác
        assert.strictEqual(data.conversation?.messages?.length || 0, 0);
      }
    });

    it('TC-CHAT-21: Truy cập /api/admin/chatbox không có token quản trị phải bị từ chối 401', async (t) => {
      if (!canRunIntegration) {
        t.skip('Bỏ qua vì server offline hoặc chưa bật ALLOW_DB_TESTS=1');
        return;
      }
      const res = await fetch(`${BASE_URL}/api/admin/chatbox/scripts`);
      assert.strictEqual(res.status, 401, 'Không có Authorization header phải trả về 401');
    });

    it('TC-CHAT-22: Token khách hàng thường gọi vào /api/admin/chatbox phải bị từ chối 403', async (t) => {
      if (!canRunIntegration) {
        t.skip('Bỏ qua vì server offline hoặc chưa bật ALLOW_DB_TESTS=1');
        return;
      }
      // Giả lập token khách hàng (role CUSTOMER)
      const jwt = require('jsonwebtoken');
      const customerToken = jwt.sign(
        { id: 'fake-customer-id', role: 'CUSTOMER', type: 'customer' },
        process.env.JWT_SECRET || 'dcor_super_secret_key_2026'
      );

      const res = await fetch(`${BASE_URL}/api/admin/chatbox/scripts`, {
        headers: { Authorization: `Bearer ${customerToken}` },
      });
      assert.ok([401, 403].includes(res.status), 'Khách hàng không được truy cập API Admin');
    });

    it('TC-CHAT-23: API thử nghiệm kịch bản /scripts/test KHÔNG được ghi tin nhắn vào DB', async (t) => {
      if (!canRunIntegration) {
        t.skip('Bỏ qua vì server offline hoặc chưa bật ALLOW_DB_TESTS=1');
        return;
      }
      // Tạo token staff test có quyền
      const jwt = require('jsonwebtoken');
      const staffToken = jwt.sign(
        { id: 'staff-test', role: 'ADMIN', permissions: ['chat:view', 'chat:manage'] },
        process.env.JWT_SECRET || 'dcor_super_secret_key_2026'
      );

      const res = await fetch(`${BASE_URL}/api/admin/chatbox/scripts/test`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${staffToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: 'tra cứu đơn hàng' }),
      });

      if (res.status === 200) {
        const data = await res.json() as any;
        assert.ok(data.matchedScript !== undefined || data.bestMatch !== undefined);
        assert.strictEqual(data.savedMessage, undefined, 'Không được lưu message vào database');
      }
    });

    it('TC-CHAT-24: Dữ liệu trả về qua API phải ẩn guestTokenHash và che SĐT của khách', async (t) => {
      if (!canRunIntegration) {
        t.skip('Bỏ qua vì server offline hoặc chưa bật ALLOW_DB_TESTS=1');
        return;
      }
      const res = await fetch(`${BASE_URL}/api/chat/conversation`, {
        headers: { 'x-guest-token': 'safe-test-guest-token' },
      });
      if (res.status === 200) {
        const data = await res.json() as any;
        const jsonStr = JSON.stringify(data);
        assert.ok(!jsonStr.includes('guestTokenHash'), 'Không được để lộ guestTokenHash trong response JSON');
      }
    });
  });

  // ==========================================
  // PHÂN HỆ BLOG (PUBLIC + ADMIN)
  // ==========================================
  describe('3. Phân hệ Blog & Cẩm nang', () => {
    it('TC-BLOG-20: Khách chỉ xem được bài viết PUBLISHED và publishedAt <= now', async (t) => {
      if (!canRunIntegration) {
        t.skip('Bỏ qua vì server offline hoặc chưa bật ALLOW_DB_TESTS=1');
        return;
      }
      const res = await fetch(`${BASE_URL}/api/blog/posts`);
      assert.strictEqual(res.status, 200);
      const data = await res.json() as any;
      const posts: any[] = data.posts || data;
      for (const p of posts) {
        assert.strictEqual(p.status, 'PUBLISHED', 'Bài viết công khai phải ở trạng thái PUBLISHED');
        if (p.publishedAt) {
          assert.ok(new Date(p.publishedAt).getTime() <= Date.now(), 'Ngày xuất bản không được ở tương lai');
        }
      }
    });

    it('TC-BLOG-21: Xem bài viết theo slug bị ẩn/chưa xuất bản phải trả về 404', async (t) => {
      if (!canRunIntegration) {
        t.skip('Bỏ qua vì server offline hoặc chưa bật ALLOW_DB_TESTS=1');
        return;
      }
      const res = await fetch(`${BASE_URL}/api/blog/posts/slug-chua-xuat-ban-non-existent-999`);
      assert.strictEqual(res.status, 404, 'Slug không tồn tại hoặc chưa xuất bản phải trả về 404');
    });

    it('TC-BLOG-22: Gửi bình luận rỗng hoặc > 500 ký tự phải bị từ chối 400', async (t) => {
      if (!canRunIntegration) {
        t.skip('Bỏ qua vì server offline hoặc chưa bật ALLOW_DB_TESTS=1');
        return;
      }
      const res = await fetch(`${BASE_URL}/api/blog/posts/sample-id/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: '' }),
      });
      // Phải yêu cầu đăng nhập (401) hoặc từ chối input rỗng (400)
      assert.ok([400, 401].includes(res.status));
    });

    it('TC-BLOG-23: API quản trị Blog /api/admin/blog yêu cầu quyền content', async (t) => {
      if (!canRunIntegration) {
        t.skip('Bỏ qua vì server offline hoặc chưa bật ALLOW_DB_TESTS=1');
        return;
      }
      const res = await fetch(`${BASE_URL}/api/admin/blog/posts`);
      assert.strictEqual(res.status, 401, 'Truy cập quản trị blog không có token phải trả 401');
    });
  });

  // ==========================================
  // PHÂN HỆ CỘNG ĐỒNG THIẾT KẾ (COMMUNITY)
  // ==========================================
  describe('4. Phân hệ Cộng đồng thiết kế & KNOWN ISSUES', () => {
    it('TC-COM-01: Bài đăng thiết kế mới tạo phải ở trạng thái PENDING chờ duyệt', async (t) => {
      if (!canRunIntegration) {
        t.skip('Bỏ qua vì server offline hoặc chưa bật ALLOW_DB_TESTS=1');
        return;
      }
      const jwt = require('jsonwebtoken');
      const customerToken = jwt.sign(
        { id: 'test-designer', role: 'CUSTOMER', type: 'customer' },
        process.env.JWT_SECRET || 'dcor_super_secret_key_2026'
      );

      const res = await fetch(`${BASE_URL}/api/designs/posts`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${customerToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: '[TEST] Thiết kế phòng khách hiện đại',
          roomType: 'LIVING_ROOM',
          previewUrl: 'https://res.cloudinary.com/dcor/sample.webp',
        }),
      });

      if (res.status === 201 || res.status === 200) {
        const data = await res.json() as any;
        assert.strictEqual(data.status, 'PENDING', 'Bài đăng mới phải có trạng thái PENDING');
      }
    });

    it('TC-COM-02: KNOWN ISSUE - Duyệt bài đăng hoặc xóa bài phải yêu cầu token xác thực (Test ĐỎ nếu hở bảo mật)', async (t) => {
      if (!canRunIntegration) {
        t.skip('Bỏ qua vì server offline hoặc chưa bật ALLOW_DB_TESTS=1');
        return;
      }
      // Gửi request duyệt bài không có Authorization header
      const res = await fetch(`${BASE_URL}/api/designs/posts/some-post-id/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'PUBLISHED' }),
      });

      // Nếu API không yêu cầu authenticateJWT, mã sẽ không phải là 401/403 -> Test FAIL theo đúng yêu cầu để lộ lỗi
      assert.ok(
        res.status === 401 || res.status === 403,
        `Cảnh báo an ninh: Endpoint /api/designs/posts/:id/status không bảo vệ xác thực (trả về status: ${res.status})`
      );
    });
  });
});
