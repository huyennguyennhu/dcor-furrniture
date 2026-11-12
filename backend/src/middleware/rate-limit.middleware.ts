import { Request, Response, NextFunction } from 'express';

interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
  message: string;
}

interface ClientRecord {
  timestamps: number[];
}

export function createRateLimiter(options: RateLimitOptions) {
  const hits = new Map<string, ClientRecord>();

  // Tự động dọn dẹp các IP đã hết hạn định kỳ để chống rò rỉ RAM máy chủ
  const cleanupInterval = Math.max(options.windowMs, 60 * 1000);
  const timer = setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of hits.entries()) {
      record.timestamps = record.timestamps.filter(t => now - t < options.windowMs);
      if (record.timestamps.length === 0) {
        hits.delete(ip);
      }
    }
  }, cleanupInterval);

  if (typeof timer.unref === 'function') {
    timer.unref(); // Không giữ event loop Node.js khi shutdown
  }

  return (req: Request, res: Response, next: NextFunction): void => {
    // Nhận diện IP từ x-forwarded-for (proxy/load balancer/cloudflare) hoặc socket
    const forwarded = req.headers['x-forwarded-for'];
    const ip = typeof forwarded === 'string'
      ? forwarded.split(',')[0].trim()
      : (req.socket?.remoteAddress || req.ip || 'unknown');

    const now = Date.now();
    let record = hits.get(ip);
    if (!record) {
      record = { timestamps: [] };
      hits.set(ip, record);
    }

    // Lọc lại các request trong cửa sổ thời gian trượt (sliding window)
    record.timestamps = record.timestamps.filter(t => now - t < options.windowMs);

    if (record.timestamps.length >= options.maxRequests) {
      const oldest = record.timestamps[0];
      const retryAfterSeconds = Math.max(1, Math.ceil((oldest + options.windowMs - now) / 1000));
      res.setHeader('Retry-After', retryAfterSeconds);
      res.status(429).json({
        success: false,
        message: options.message,
        retryAfter: retryAfterSeconds
      });
      return;
    }

    record.timestamps.push(now);
    next();
  };
}

// Giới hạn 20 đơn hàng / IP / 15 phút (rất dư giả cho người mua sắm thật, chặn đứng bot spam đặt đơn)
export const orderRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 20,
  message: 'Hệ thống phát hiện quá nhiều yêu cầu đặt hàng từ thiết bị của bạn trong thời gian ngắn. Vui lòng thử lại sau 15 phút.'
});

// Giới hạn 15 mã OTP / IP / 15 phút (bảo vệ SMS balance và connection pool)
export const otpRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 15,
  message: 'Bạn đã yêu cầu gửi mã xác thực OTP quá nhiều lần. Vui lòng thử lại sau 15 phút.'
});

// Giới hạn 120 yêu cầu / IP / 1 phút cho các API công khai (sản phẩm, danh mục, blog)
// Rất thoải mái cho người dùng lướt web và chuyển trang nhanh, nhưng chặn triệt để bot cào dữ liệu hoặc spam F5
export const publicApiRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 120,
  message: 'Hệ thống đang ghi nhận lưu lượng truy cập cao từ thiết bị của bạn. Vui lòng thử lại sau giây lát.'
});


