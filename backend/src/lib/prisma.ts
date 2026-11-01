import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

/**
 * Helper thực hiện truy vấn cơ sở dữ liệu với cơ chế tự động thử lại (retry) thông minh
 * khi gặp lỗi mất kết nối tạm thời (P1017: Server has closed the connection)
 * do Supabase PgBouncer/Supavisor đóng TCP socket khi nhàn rỗi.
 * 
 * Lưu ý: Để Prisma Client tự quản lý Connection Pool, không gọi $disconnect() / $connect()
 * nhằm tránh làm đứt gãy các request đồng thời khác.
 */
export async function withDbRetry<T>(queryFn: () => Promise<T>, maxRetries = 3): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await queryFn();
    } catch (error: any) {
      attempt++;
      const errStr = String(error?.message || '') + ' ' + String(error?.cause || '');
      const isPoolTimeout = error?.code === 'P2024' || errStr.includes('Timed out fetching a new connection');
      const isConnectionError =
        error?.code === 'P1017' ||
        error?.code === 'P1001' ||
        errStr.includes('Server has closed the connection') ||
        errStr.includes('connection closed') ||
        errStr.includes('Connection lost') ||
        errStr.includes('bytes remaining on stream') ||
        errStr.includes("Can't reach database server");

      if (isPoolTimeout && attempt <= maxRetries) {
        const jitter = Math.floor(Math.random() * 200);
        const delay = 500 * attempt + jitter;
        console.warn(`[Prisma] Pool timeout (P2024), đang chờ giải phóng kết nối và thử lại sau ${delay}ms (lần ${attempt}/${maxRetries})...`);
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }

      if (isConnectionError && attempt <= maxRetries) {
        const jitter = Math.floor(Math.random() * 150);
        const delay = 300 * Math.pow(2, attempt - 1) + jitter; // Exponential backoff + jitter
        console.warn(`[Prisma] Kết nối DB tạm gián đoạn (${error?.code || 'P1017'}), đang thử lại sau ${delay}ms (lần ${attempt}/${maxRetries})...`);
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      throw error;
    }
  }
}

export default prisma;
