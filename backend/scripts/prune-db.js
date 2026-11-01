/**
 * Script dọn dẹp dữ liệu rác, OTP và phiên đăng nhập hết hạn (Data Retention)
 * Bảo vệ dung lượng lưu trữ của Supabase khỏi chạm hạn mức 500MB (chống bị Read-Only)
 * 
 * Chạy bằng lệnh: node backend/scripts/prune-db.js
 */
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: (process.env.DATABASE_URL || '') + '&connection_limit=1'
    }
  }
});

async function main() {
  console.log('🧹 Bắt đầu tiến trình dọn dẹp Database bảo vệ hạn mức 500MB...');

  // 1. Xóa OTP hết hạn trên 24 giờ
  const cutoffOtp = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const otpRes = await prisma.otpCode.deleteMany({
    where: { expiresAt: { lt: cutoffOtp } }
  });
  console.log(`✅ Đã xóa ${otpRes.count} mã OTP hết hạn (>24h).`);

  // 2. Xóa phiên đăng nhập hết hạn
  const sessionRes = await prisma.userSession.deleteMany({
    where: { expiresAt: { lt: new Date() } }
  });
  console.log(`✅ Đã xóa ${sessionRes.count} phiên đăng nhập hết hạn.`);

  // 3. Xóa AuditLogs cũ hơn 90 ngày
  try {
    const auditRes = await prisma.$executeRawUnsafe(
      'DELETE FROM "AuditLogs" WHERE timestamp < NOW() - INTERVAL \'90 days\';'
    );
    console.log(`✅ Đã xóa ${auditRes} bản ghi nhật ký AuditLog cũ (>90 ngày).`);
  } catch (err) {
    console.log('ℹ️ Bảng AuditLogs không cần dọn hoặc chưa có dữ liệu cũ.');
  }

  // 4. Kiểm tra tổng dung lượng cơ sở dữ liệu hiện tại
  try {
    const dbSize = await prisma.$queryRawUnsafe(
      "SELECT pg_size_pretty(pg_database_size(current_database())) as size;"
    );
    console.log(`📊 Dung lượng hiện tại của Database: ${dbSize[0]?.size || 'Chưa xác định'}`);
  } catch (e) {
    // Không quan trọng nếu lỗi quyền
  }

  console.log('🎉 Hoàn tất bảo trì và dọn dẹp dữ liệu an toàn!');
}

main()
  .catch((e) => {
    console.error('❌ Lỗi khi dọn dẹp:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
