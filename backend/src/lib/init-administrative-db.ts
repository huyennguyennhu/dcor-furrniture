import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import prisma, { withDbRetry } from './prisma';

function toSlug(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function initAdministrativeDatabase(): Promise<void> {
  try {
    await withDbRetry(async () => {
      // 1. Tạo bảng Province nếu chưa tồn tại
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "Province" (
          "id" VARCHAR(64) PRIMARY KEY,
          "name" VARCHAR(255) NOT NULL,
          "code" VARCHAR(100),
          "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          CONSTRAINT "uq_province_name" UNIQUE ("name"),
          CONSTRAINT "uq_province_code" UNIQUE ("code")
        );
      `);

      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "idx_province_name" ON "Province"("name");
      `);

      // 2. Tạo bảng Ward nếu chưa tồn tại
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "Ward" (
          "id" VARCHAR(64) PRIMARY KEY,
          "provinceId" VARCHAR(64) NOT NULL,
          "name" VARCHAR(255) NOT NULL,
          "code" VARCHAR(100),
          "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          CONSTRAINT "fk_ward_province" FOREIGN KEY ("provinceId") REFERENCES "Province"("id") ON DELETE CASCADE ON UPDATE CASCADE
        );
      `);

      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "idx_ward_province_id" ON "Ward"("provinceId");
      `);

      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "idx_ward_name" ON "Ward"("name");
      `);
    });

    // 3. Kiểm tra xem đã có dữ liệu chưa
    const provinceCountResult: any = await prisma.$queryRawUnsafe(`SELECT COUNT(*)::int as count FROM "Province"`);
    const provinceCount = Number(provinceCountResult[0]?.count || 0);

    if (provinceCount > 0) {
      const wardCountResult: any = await prisma.$queryRawUnsafe(`SELECT COUNT(*)::int as count FROM "Ward"`);
      const wardCount = Number(wardCountResult[0]?.count || 0);
      // console.log(`[Administrative DB] Dữ liệu đã sẵn sàng: ${provinceCount} Tỉnh/Thành, ${wardCount} Phường/Xã.`);
      return;
    }

    // 4. Tìm và đọc file vietnam-administrative-data.json
    const possiblePaths = [
      path.resolve(__dirname, '../../../dcor-studio/src/app/shared/data/vietnam-administrative-data.json'),
      path.resolve(process.cwd(), '../dcor-studio/src/app/shared/data/vietnam-administrative-data.json'),
      path.resolve(process.cwd(), 'dcor-studio/src/app/shared/data/vietnam-administrative-data.json'),
      path.resolve(__dirname, '../../../../dcor_Angular/dcor-studio/src/app/shared/data/vietnam-administrative-data.json'),
    ];

    let jsonFilePath = '';
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        jsonFilePath = p;
        break;
      }
    }

    if (!jsonFilePath) {
      console.warn('[Administrative DB] Không tìm thấy file vietnam-administrative-data.json. Bỏ qua bước seed tự động.');
      return;
    }

    // console.log(`[Administrative DB] Đọc dữ liệu từ ${jsonFilePath}...`);
    const rawData = fs.readFileSync(jsonFilePath, 'utf-8');
    const adminData: Record<string, string[]> = JSON.parse(rawData);

    const provinceEntries = Object.entries(adminData);
    // console.log(`[Administrative DB] Bắt đầu seed ${provinceEntries.length} Tỉnh/Thành vào Supabase...`);

    // Lưu bản đồ tên tỉnh -> ID
    const provinceMap = new Map<string, string>();

    for (const [provinceName] of provinceEntries) {
      const id = crypto.randomUUID();
      const code = toSlug(provinceName);
      
      await prisma.$executeRawUnsafe(`
        INSERT INTO "Province" ("id", "name", "code", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, NOW(), NOW())
        ON CONFLICT ("name") DO UPDATE SET "code" = EXCLUDED."code";
      `, id, provinceName, code);

      // Lấy id thực tế trong DB
      const row: any = await prisma.$queryRawUnsafe(`SELECT "id" FROM "Province" WHERE "name" = $1 LIMIT 1`, provinceName);
      if (row && row[0]?.id) {
        provinceMap.set(provinceName, row[0].id);
      }
    }

    // console.log(`[Administrative DB] Đã tạo xong ${provinceMap.size} Tỉnh/Thành. Chuẩn bị seed Phường/Xã...`);

    // 5. Chuẩn bị danh sách Phường/Xã để insert theo batch
    const allWards: { id: string; provinceId: string; name: string; code: string }[] = [];
    for (const [provinceName, wards] of provinceEntries) {
      const provinceId = provinceMap.get(provinceName);
      if (!provinceId) continue;

      for (const wardName of wards) {
        allWards.push({
          id: crypto.randomUUID(),
          provinceId,
          name: wardName,
          code: toSlug(wardName),
        });
      }
    }

    // console.log(`[Administrative DB] Đang nạp ${allWards.length} Phường/Xã vào Supabase (theo batch)...`);
    const BATCH_SIZE = 400;
    for (let i = 0; i < allWards.length; i += BATCH_SIZE) {
      const batch = allWards.slice(i, i + BATCH_SIZE);
      const valuePlaceholders: string[] = [];
      const params: any[] = [];

      batch.forEach((ward, index) => {
        const offset = index * 4;
        valuePlaceholders.push(`($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, NOW(), NOW())`);
        params.push(ward.id, ward.provinceId, ward.name, ward.code);
      });

      const sql = `
        INSERT INTO "Ward" ("id", "provinceId", "name", "code", "createdAt", "updatedAt")
        VALUES ${valuePlaceholders.join(', ')}
        ON CONFLICT DO NOTHING;
      `;

      await prisma.$executeRawUnsafe(sql, ...params);
    }

    // console.log(`[Administrative DB] Hoàn tất nạp thành công ${allWards.length} Phường/Xã lên Supabase!`);
  } catch (error) {
    console.error('[Administrative DB] Lỗi khởi tạo bảng dữ liệu hành chính:', error);
  }
}
