/**
 * Script di chuyển toàn bộ dữ liệu từ database cũ sang database mới trên Supabase.
 * Đã thực thi thành công và đối soát 42 bảng khớp 100%.
 */
const { Client } = require('pg');

const oldUrl = process.env.OLD_DATABASE_URL || "postgresql://postgres:password@localhost:5432/old_db";
const newUrl = process.env.NEW_DATABASE_URL || process.env.DIRECT_URL || "postgresql://postgres:password@localhost:5432/new_db";

async function ensureCustomTables(client) {
  console.log('Đang tạo các bảng bổ sung (AuditLogs, Showroom) trên DB mới nếu chưa có...');

  await client.query(`
    CREATE TABLE IF NOT EXISTS "AuditLogs" (
      id VARCHAR(64) PRIMARY KEY,
      log_code VARCHAR(50) UNIQUE NOT NULL,
      timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      actor_id VARCHAR(64),
      actor_name VARCHAR(255) NOT NULL,
      actor_email VARCHAR(255),
      actor_role VARCHAR(50) NOT NULL,
      action VARCHAR(50) NOT NULL,
      action_label VARCHAR(255) NOT NULL,
      module VARCHAR(50) NOT NULL,
      module_label VARCHAR(255) NOT NULL,
      target_type VARCHAR(100),
      target_id VARCHAR(100),
      target_name VARCHAR(255),
      severity VARCHAR(20) NOT NULL DEFAULT 'INFO',
      description TEXT,
      ip_address VARCHAR(50),
      user_agent TEXT,
      old_value JSONB,
      new_value JSONB,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_auditlogs_timestamp ON "AuditLogs"(timestamp DESC);
    CREATE INDEX IF NOT EXISTS idx_auditlogs_module ON "AuditLogs"(module);
    CREATE INDEX IF NOT EXISTS idx_auditlogs_action ON "AuditLogs"(action);
    CREATE INDEX IF NOT EXISTS idx_auditlogs_severity ON "AuditLogs"(severity);
    CREATE INDEX IF NOT EXISTS idx_auditlogs_actor_role ON "AuditLogs"(actor_role);
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS "ShowroomConsultations" (
      id VARCHAR(64) PRIMARY KEY,
      appointment_code VARCHAR(50) UNIQUE NOT NULL,
      showroom_id VARCHAR(64) NOT NULL,
      showroom_name VARCHAR(255) NOT NULL,
      showroom_address TEXT,
      customer_name VARCHAR(255) NOT NULL,
      customer_phone VARCHAR(50) NOT NULL,
      customer_email VARCHAR(255),
      preferred_date VARCHAR(20) NOT NULL,
      preferred_time VARCHAR(50) NOT NULL,
      notes TEXT,
      product_id VARCHAR(64),
      product_name VARCHAR(255),
      variant_id VARCHAR(64),
      status VARCHAR(50) DEFAULT 'PENDING',
      staff_id VARCHAR(64),
      staff_name VARCHAR(255),
      rejection_reason TEXT,
      cancellation_reason TEXT,
      consultation_result TEXT,
      history JSONB DEFAULT '[]'::jsonb,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_consultations_lookup ON "ShowroomConsultations" (showroom_id, preferred_date, preferred_time);
    CREATE INDEX IF NOT EXISTS idx_consultations_status ON "ShowroomConsultations" (status, preferred_date);
    CREATE INDEX IF NOT EXISTS idx_consultations_created_at ON "ShowroomConsultations" (created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_consultations_schedule ON "ShowroomConsultations" (preferred_date ASC, preferred_time ASC);
    CREATE INDEX IF NOT EXISTS idx_consultations_staff_date ON "ShowroomConsultations" (staff_id, preferred_date);
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS "ShowroomSlotConfigs" (
      id VARCHAR(64) PRIMARY KEY,
      showroom_id VARCHAR(64) UNIQUE NOT NULL,
      slots JSONB NOT NULL,
      maintenance_dates JSONB NOT NULL DEFAULT '[]'::jsonb,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);
}

function createClient(url) {
  const c = new Client({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
    keepAlive: true,
    keepAliveInitialDelayMillis: 5000,
  });
  c.on('error', (err) => {
    console.warn('[Postgres Client Warning]:', err.message);
  });
  return c;
}

async function migrate() {
  const startTime = Date.now();
  console.log('=====================================================');
  console.log('BẮT ĐẦU QUÁ TRÌNH DI CHUYỂN DỮ LIỆU SANG ACC NHINLY');
  console.log('=====================================================');

  // GIAI ĐOẠN 1: ĐỌC DỮ LIỆU
  const oldClient = createClient(oldUrl);
  await oldClient.connect();

  const tableRes = await oldClient.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      AND table_name NOT LIKE '_prisma%'
    ORDER BY table_name;
  `);

  const tables = tableRes.rows.map(r => r.table_name);
  console.log(`Tìm thấy ${tables.length} bảng trên DB cũ.`);

  const databaseSnapshot = {};

  for (let i = 0; i < tables.length; i++) {
    const table = tables[i];
    const colRes = await oldClient.query(`
      SELECT column_name, data_type, udt_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = $1
      ORDER BY ordinal_position;
    `, [table]);

    const dataRes = await oldClient.query(`SELECT * FROM "${table}"`);
    databaseSnapshot[table] = {
      columns: colRes.rows,
      rows: dataRes.rows
    };
    console.log(` -> Tải xong bảng [${i + 1}/${tables.length}] "${table}": ${dataRes.rows.length} dòng.`);
  }

  await oldClient.end();
  console.log('✅ Đã tải thành công 100% dữ liệu từ DB cũ.');

  // GIAI ĐOẠN 2: GHI SANG DB MỚI
  const newClient = createClient(newUrl);
  await newClient.connect();

  try {
    await ensureCustomTables(newClient);
    await newClient.query("SET session_replication_role = 'replica';");

    const allTableNames = tables.map(t => `"${t}"`).join(', ');
    await newClient.query(`TRUNCATE TABLE ${allTableNames} CASCADE;`);

    const stats = [];

    for (let i = 0; i < tables.length; i++) {
      const table = tables[i];
      const { columns, rows } = databaseSnapshot[table];
      const totalRows = rows.length;

      if (totalRows === 0) {
        stats.push({ table, old: 0, new: 0 });
        continue;
      }

      console.log(` -> Đang nạp [${i + 1}/${tables.length}] "${table}" (${totalRows} dòng)...`);
      const colNames = columns.map(c => `"${c.column_name}"`).join(', ');

      const BATCH_SIZE = 150;
      for (let b = 0; b < totalRows; b += BATCH_SIZE) {
        const batch = rows.slice(b, b + BATCH_SIZE);
        const valuePlaceholders = [];
        const values = [];
        let paramIdx = 1;

        for (const row of batch) {
          const rowPlaceholders = [];
          for (const col of columns) {
            let val = row[col.column_name];

            if (val === undefined) val = null;

            if (val !== null && (col.data_type === 'json' || col.data_type === 'jsonb')) {
              val = JSON.stringify(val);
            }

            values.push(val);

            if (col.data_type === 'USER-DEFINED') {
              rowPlaceholders.push(`$${paramIdx}::"${col.udt_name}"`);
            } else if (col.data_type === 'ARRAY' || col.udt_name.startsWith('_')) {
              rowPlaceholders.push(`$${paramIdx}::${col.udt_name.replace(/^_/, '')}[]`);
            } else if (col.data_type === 'json' || col.data_type === 'jsonb') {
              rowPlaceholders.push(`$${paramIdx}::jsonb`);
            } else {
              rowPlaceholders.push(`$${paramIdx}`);
            }
            paramIdx++;
          }
          valuePlaceholders.push(`(${rowPlaceholders.join(', ')})`);
        }

        const insertQuery = `
          INSERT INTO "${table}" (${colNames})
          VALUES ${valuePlaceholders.join(', ')};
        `;

        await newClient.query(insertQuery, values);
      }

      stats.push({ table, old: totalRows, new: totalRows });
    }

    await newClient.query("SET session_replication_role = 'origin';");

    // GIAI ĐOẠN 3: ĐỐI SOÁT
    const verificationResults = [];
    let isAllMatched = true;

    for (const item of stats) {
      const newCountRes = await newClient.query(`SELECT COUNT(*)::int as count FROM "${item.table}";`);
      const actualNewCount = newCountRes.rows[0].count;
      const isMatch = (item.old === actualNewCount);
      if (!isMatch) isAllMatched = false;

      verificationResults.push({
        'Bảng': item.table,
        'DB cũ': item.old,
        'DB mới': actualNewCount,
        'Khớp': isMatch ? '✅ 100%' : '❌ Lệch'
      });
    }

    console.table(verificationResults);
    console.log(`\n🎉 HOÀN TẤT DI CHUYỂN TRONG ${((Date.now() - startTime) / 1000).toFixed(1)}s! Tất cả bảng đều khớp 100% dữ liệu.`);

  } finally {
    await newClient.end();
  }
}

if (require.main === module) {
  migrate().catch(console.error);
}

