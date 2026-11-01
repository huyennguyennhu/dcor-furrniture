/**
 * Script khởi tạo toàn bộ các bảng bổ sung một cách tuần tự (Sequential)
 * Dùng khi setup Database mới tinh, không chạy tự động trên server runtime.
 * Chạy bằng lệnh: node backend/scripts/init-all-db.js
 */
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

// Đảm bảo script chỉ dùng 1 connection
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: (process.env.DATABASE_URL || '') + '&connection_limit=1'
    }
  }
});

async function main() {
  console.log('🚀 Bắt đầu khởi tạo các bảng bổ sung tuần tự...');

  const { ensureConsultationTable } = require('../src/controllers/consultation.controller');
  const { initInventorySettingsDatabase } = require('../src/lib/init-inventory-settings-db');
  const { initAdministrativeDatabase } = require('../src/lib/init-administrative-db');
  const { initAuditLogsDatabase } = require('../src/lib/init-audit-logs-db');
  const { initPromotionsAndDesignsDatabase } = require('../src/lib/init-promotions-and-designs-db');
  const { initMyDesignsDatabase } = require('../src/lib/init-my-designs-db');
  const { initChatDatabase } = require('../src/lib/init-chat-db');
  const { initBlogDatabase } = require('../src/lib/init-blog-db');

  console.log('1/8. Consultation...');
  await ensureConsultationTable();

  console.log('2/8. Inventory Settings...');
  await initInventorySettingsDatabase();

  console.log('3/8. Administrative (Provinces & Wards)...');
  await initAdministrativeDatabase();

  console.log('4/8. Audit Logs...');
  await initAuditLogsDatabase();

  console.log('5/8. Promotions & Designs...');
  await initPromotionsAndDesignsDatabase();

  console.log('6/8. My Designs...');
  await initMyDesignsDatabase();

  console.log('7/8. Chat & Chatbot...');
  await initChatDatabase();

  console.log('8/8. Blog...');
  await initBlogDatabase();

  console.log('✅ Hoàn tất khởi tạo toàn bộ database an toàn!');
}

main()
  .catch((e) => {
    console.error('❌ Lỗi khi khởi tạo:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
