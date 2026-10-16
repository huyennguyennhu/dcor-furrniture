import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

/**
 * Helper thực hiện truy vấn cơ sở dữ liệu với cơ chế tự động kết nối lại và thử lại (retry)
 * khi gặp lỗi mất kết nối tạm thời (P1017: Server has closed the connection)
 * do Supabase PgBouncer/Supavisor đóng TCP socket khi nhàn rỗi.
 */
export async function withDbRetry<T>(queryFn: () => Promise<T>, maxRetries = 2): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await queryFn();
    } catch (error: any) {
      attempt++;
      const isPoolTimeout = error?.code === 'P2024' || error?.message?.includes('Timed out fetching a new connection');
      const isConnectionError =
        error?.code === 'P1017' ||
        error?.code === 'P1001' ||
        error?.message?.includes('Server has closed the connection') ||
        error?.message?.includes('connection closed') ||
        error?.message?.includes('Connection lost') ||
        error?.message?.includes("Can't reach database server");

      if (isPoolTimeout && attempt <= maxRetries) {
        console.warn(`[Prisma] Pool timeout (P2024), đang chờ giải phóng kết nối và thử lại (lần ${attempt}/${maxRetries})...`);
        await new Promise((r) => setTimeout(r, 1000 * attempt));
        continue;
      }

      if (isConnectionError && attempt <= maxRetries) {
        console.warn(`[Prisma] Kết nối DB bị đóng (${error?.code || 'P1017'}), đang reconnect và thử lại (lần ${attempt}/${maxRetries})...`);
        try {
          await prisma.$disconnect();
        } catch (_) {}
        await new Promise((r) => setTimeout(r, 600 * attempt));
        try {
          await prisma.$connect();
        } catch (_) {}
        continue;
      }
      throw error;
    }
  }
}

export default prisma;
