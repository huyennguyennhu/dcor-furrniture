import prisma, { withDbRetry } from '../lib/prisma';

export interface CleanupResult {
  expiredOtps: number;
  expiredSessions: number;
  oldAuditLogs: number;
  cleanedAt: Date;
}

class DatabaseCleanupService {
  private timer: NodeJS.Timeout | null = null;
  private isRunning = false;

  /**
   * Thực thi dọn dẹp toàn bộ dữ liệu hết hạn và bản ghi rác để bảo vệ dung lượng Supabase (500MB)
   */
  async runCleanup(): Promise<CleanupResult> {
    if (this.isRunning) {
      console.log('[Cleanup] Tiến trình dọn dẹp trước đó đang chạy, bỏ qua lần này.');
      return {
        expiredOtps: 0,
        expiredSessions: 0,
        oldAuditLogs: 0,
        cleanedAt: new Date()
      };
    }

    this.isRunning = true;
    console.log('[Cleanup] 🧹 Bắt đầu tiến trình dọn dẹp dữ liệu rác định kỳ...');

    let expiredOtps = 0;
    let expiredSessions = 0;
    let oldAuditLogs = 0;

    try {
      // 1. Xóa OTP đã hết hạn trên 24 giờ
      const otpCutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const otpRes = await withDbRetry(() =>
        prisma.otpCode.deleteMany({
          where: { expiresAt: { lt: otpCutoff } }
        })
      );
      expiredOtps = otpRes.count;

      // 2. Xóa các phiên đăng nhập (UserSession) đã hết hạn
      const sessionCutoff = new Date();
      const sessionRes = await withDbRetry(() =>
        prisma.userSession.deleteMany({
          where: { expiresAt: { lt: sessionCutoff } }
        })
      );
      expiredSessions = sessionRes.count;

      // 3. Xóa các bản ghi AuditLog cũ hơn 90 ngày
      try {
        const auditRes: any = await withDbRetry(() =>
          prisma.$executeRawUnsafe(
            'DELETE FROM "AuditLogs" WHERE timestamp < NOW() - INTERVAL \'90 days\';'
          )
        );
        oldAuditLogs = typeof auditRes === 'number' ? auditRes : 0;
      } catch (err: any) {
        console.warn('[Cleanup] Lưu ý khi dọn AuditLogs:', err?.message || err);
      }

      console.log(
        `[Cleanup] ✅ Hoàn tất dọn dẹp: Đã xóa ${expiredOtps} OTP hết hạn, ${expiredSessions} phiên đăng nhập hết hạn, ${oldAuditLogs} nhật ký cũ.`
      );
    } catch (error) {
      console.error('[Cleanup] ❌ Lỗi trong tiến trình dọn dẹp database:', error);
    } finally {
      this.isRunning = false;
    }

    return {
      expiredOtps,
      expiredSessions,
      oldAuditLogs,
      cleanedAt: new Date()
    };
  }

  /**
   * Khởi động lịch trình chạy tự động trong nền (mỗi 12 tiếng chạy 1 lần)
   */
  startScheduledCleanup(intervalHours = 12) {
    if (this.timer) {
      clearInterval(this.timer);
    }

    // Chạy lần đầu tiên sau 30 giây khi server đã khởi động ổn định
    const initialTimer = setTimeout(() => {
      this.runCleanup().catch(() => {});
    }, 30000);
    if (typeof initialTimer.unref === 'function') initialTimer.unref();

    const intervalMs = intervalHours * 60 * 60 * 1000;
    this.timer = setInterval(() => {
      this.runCleanup().catch(() => {});
    }, intervalMs);
    if (typeof this.timer.unref === 'function') this.timer.unref();

    console.log(`[Cleanup] 🕒 Đã kích hoạt lịch dọn dẹp tự động định kỳ mỗi ${intervalHours} giờ.`);
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}

export const databaseCleanupService = new DatabaseCleanupService();
