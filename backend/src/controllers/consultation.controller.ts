import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { memoryCache, CACHE_KEYS } from '../lib/cache';

let isTableInitialized = false;
let initPromise: Promise<void> | null = null;

// Cấu hình ca tư vấn chuẩn
const STANDARD_SLOTS = [
  { time: '09:00 - 10:30', period: 'Ca sáng', maxCapacity: 3 },
  { time: '10:30 - 12:00', period: 'Ca sáng', maxCapacity: 3 },
  { time: '14:00 - 15:30', period: 'Ca chiều', maxCapacity: 3 },
  { time: '16:00 - 17:30', period: 'Ca chiều', maxCapacity: 3 },
  { time: '18:30 - 20:00', period: 'Ca tối', maxCapacity: 2 }
];

// Hàm lấy sức chứa tối đa linh hoạt theo cấu hình riêng của Showroom
const getMaxCapacityForSlot = async (showroomId: any, timeStr: string): Promise<number> => {
  try {
    const configRes: any[] = await prisma.$queryRawUnsafe(`
      SELECT slots FROM "ShowroomSlotConfigs" WHERE showroom_id = $1 LIMIT 1;
    `, String(showroomId));
    if (configRes && configRes.length > 0 && Array.isArray(configRes[0].slots)) {
      const match = configRes[0].slots.find((s: any) => s.time === timeStr);
      if (match && typeof match.maxCapacity === 'number') {
        return match.maxCapacity;
      }
    }
  } catch (e) {}
  const standardMatch = STANDARD_SLOTS.find(s => s.time === timeStr);
  return standardMatch ? standardMatch.maxCapacity : 3;
};

// Dữ liệu tọa độ và thông tin mở rộng cho Showroom thực tế
const SHOWROOM_EXTRAS: Record<string, any> = {
  SR_Q1: {
    lat: 10.785055,
    lng: 106.697479,
    googleMapsUrl: 'https://maps.google.com/?q=128+Hai+B%C3%A0+Tr%C6%B0ng,+Ph%C6%B0%E1%BB%9Dng+%C4%90a+Kao,+Qu%E1%BA%ADn+1,+H%E1%BB%93+Ch%C3%AD+Minh',
    openingHours: '08:30 - 21:00 (Hàng ngày, kể cả Chủ Nhật)',
    image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80',
    highlight: 'Flagship Showroom 4 tầng với hơn 100+ bối cảnh không gian sống Bắc Âu thực tế'
  },
  SR_THU_DUC: {
    lat: 10.801248,
    lng: 106.745612,
    googleMapsUrl: 'https://maps.google.com/?q=45+Song+H%C3%A0nh,+An+Ph%C3%BA,+Th%E1%BB%A7+%C4%90%E1%BB%A9c,+H%E1%BB%93+Ch%C3%AD+Minh',
    openingHours: '09:00 - 21:00 (Hàng ngày)',
    image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80',
    highlight: 'Khu trưng bày giải pháp Sofa may đo, Bàn ăn mở rộng và Thư viện mẫu da/vải nhập khẩu'
  }
};

function getFormattedDate(offsetDays: number = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// Tự động tạo bảng ShowroomConsultations và ShowroomSlotConfigs nếu chưa tồn tại
export async function ensureConsultationTable(): Promise<void> {
  if (isTableInitialized) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      await prisma.$executeRawUnsafe(`
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
      `);

      // Chạy các lệnh migration thêm cột nếu bảng đã tồn tại từ trước
      await prisma.$executeRawUnsafe(`ALTER TABLE "ShowroomConsultations" ADD COLUMN IF NOT EXISTS staff_id VARCHAR(64);`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "ShowroomConsultations" ADD COLUMN IF NOT EXISTS staff_name VARCHAR(255);`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "ShowroomConsultations" ADD COLUMN IF NOT EXISTS rejection_reason TEXT;`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "ShowroomConsultations" ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "ShowroomConsultations" ADD COLUMN IF NOT EXISTS consultation_result TEXT;`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "ShowroomConsultations" ADD COLUMN IF NOT EXISTS history JSONB DEFAULT '[]'::jsonb;`);

      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS idx_consultations_lookup 
        ON "ShowroomConsultations" (showroom_id, preferred_date, preferred_time);
      `);
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS idx_consultations_status 
        ON "ShowroomConsultations" (status, preferred_date);
      `);
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS idx_consultations_created_at 
        ON "ShowroomConsultations" (created_at DESC);
      `);
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS idx_consultations_schedule 
        ON "ShowroomConsultations" (preferred_date ASC, preferred_time ASC);
      `);
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS idx_consultations_staff_date 
        ON "ShowroomConsultations" (staff_id, preferred_date);
      `);

      // Bảng cấu hình slot và ngày nghỉ theo từng Showroom
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "ShowroomSlotConfigs" (
          id VARCHAR(64) PRIMARY KEY,
          showroom_id VARCHAR(64) UNIQUE NOT NULL,
          slots JSONB NOT NULL,
          maintenance_dates JSONB NOT NULL DEFAULT '[]'::jsonb,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);

      // Kiểm tra và khởi tạo dữ liệu mẫu phong phú ban đầu nếu hệ thống có ít hơn 4 bản ghi
      const countRes: any[] = await prisma.$queryRawUnsafe(`SELECT COUNT(*)::int as count FROM "ShowroomConsultations";`);
      const existingCount = Number(countRes[0]?.count || 0);

      if (existingCount < 5) {
        await seedRealisticConsultations();
      }

      isTableInitialized = true;
    } catch (err) {
      console.error('[Consultation DB] Lỗi khởi tạo bảng ShowroomConsultations:', err);
    } finally {
      initPromise = null;
    }
  })();

  return initPromise;
}

// Khởi tạo các cuộc hẹn mẫu đa dạng trạng thái để Admin có dữ liệu kiểm thử trực quan ngay lập tức
async function seedRealisticConsultations() {
  try {
    const showrooms = await prisma.warehouse.findMany({ where: { type: 'SHOWROOM', isActive: true } });
    const q1 = showrooms.find(s => s.code === 'SR_Q1') || showrooms[0];
    const td = showrooms.find(s => s.code === 'SR_THU_DUC') || showrooms[1] || showrooms[0];

    const todayStr = getFormattedDate(0);
    const tomorrowStr = getFormattedDate(1);
    const in2DaysStr = getFormattedDate(2);
    const yesterdayStr = getFormattedDate(-1);
    const nextWeekStr = getFormattedDate(5);

    const initialData = [
      {
        id: 'seed-req-001',
        appointment_code: 'REQ-20261023-01',
        showroom_id: q1?.id || 'sr-q1',
        showroom_name: q1?.name || 'Showroom Quận 1',
        showroom_address: q1?.address || '128 Hai Bà Trưng, P. Đa Kao, Quận 1, TP.HCM',
        customer_name: 'Lê Minh Triết',
        customer_phone: '0903123456',
        customer_email: 'minhtriet.le@gmail.com',
        preferred_date: todayStr,
        preferred_time: '14:00 - 15:30',
        notes: 'Tư vấn sofa da phòng khách chung cư 75m2, căn hộ Gateway Thảo Điền',
        product_name: 'Sofa Da Cao Cấp DCOR',
        status: 'PENDING',
        history: JSON.stringify([
          { action: 'CREATED', title: 'Khách hàng gửi yêu cầu tư vấn qua Website', timestamp: new Date().toISOString(), actor: 'Lê Minh Triết' }
        ])
      },
      {
        id: 'seed-req-002',
        appointment_code: 'REQ-20261023-02',
        showroom_id: td?.id || 'sr-td',
        showroom_name: td?.name || 'Showroom Thủ Đức',
        showroom_address: td?.address || '45 Song Hành, P. An Phú, TP. Thủ Đức, TP.HCM',
        customer_name: 'Hoàng Kim Ngân',
        customer_phone: '0987654321',
        customer_email: 'kimngan.h@gmail.com',
        preferred_date: tomorrowStr,
        preferred_time: '10:30 - 12:00',
        notes: 'Cần tư vấn phối màu bàn ăn mở rộng và tủ giày đồng bộ phong cách Japandi',
        product_name: 'Bàn Ăn Mở Rộng Bắc Âu',
        status: 'PENDING',
        history: JSON.stringify([
          { action: 'CREATED', title: 'Khách hàng gửi yêu cầu tư vấn qua Website', timestamp: new Date().toISOString(), actor: 'Hoàng Kim Ngân' }
        ])
      },
      {
        id: 'seed-req-003',
        appointment_code: 'REQ-20261022-03',
        showroom_id: q1?.id || 'sr-q1',
        showroom_name: q1?.name || 'Showroom Quận 1',
        showroom_address: q1?.address || '128 Hai Bà Trưng, P. Đa Kao, Quận 1, TP.HCM',
        customer_name: 'Vũ Quốc Khánh',
        customer_phone: '0918999888',
        customer_email: 'khanh.vu@techcorp.vn',
        preferred_date: in2DaysStr,
        preferred_time: '09:00 - 10:30',
        notes: 'Hẹn trực tiếp KTS trưởng tư vấn hoàn thiện nội thất Penthouse Thảo Điền',
        product_name: 'Bộ sưu tập Luxury Milano',
        status: 'PENDING',
        history: JSON.stringify([
          { action: 'CREATED', title: 'Khách hàng gửi yêu cầu tư vấn qua Website', timestamp: new Date(Date.now() - 3600000 * 5).toISOString(), actor: 'Vũ Quốc Khánh' }
        ])
      },
      {
        id: 'seed-req-004',
        appointment_code: 'REQ-20261021-04',
        showroom_id: q1?.id || 'sr-q1',
        showroom_name: q1?.name || 'Showroom Quận 1',
        showroom_address: q1?.address || '128 Hai Bà Trưng, P. Đa Kao, Quận 1, TP.HCM',
        customer_name: 'Phan Văn Đạt',
        customer_phone: '0933221100',
        customer_email: 'datphan@yahoo.com',
        preferred_date: yesterdayStr,
        preferred_time: '18:30 - 20:00',
        notes: 'Tư vấn phụ kiện trang trí phòng ngủ nhỏ',
        product_name: 'Kệ trang trí treo tường',
        status: 'REJECTED',
        rejection_reason: 'Showroom kín lịch tư vấn trong ngày bảo trì định kỳ, đã liên hệ khách xin chuyển sang hẹn cuối tuần.',
        history: JSON.stringify([
          { action: 'CREATED', title: 'Khách gửi yêu cầu', timestamp: new Date(Date.now() - 86400000).toISOString(), actor: 'Phan Văn Đạt' },
          { action: 'REJECTED', title: 'Từ chối lịch hẹn', timestamp: new Date().toISOString(), actor: 'Admin DCor', reason: 'Showroom kín lịch tư vấn trong ngày bảo trì định kỳ' }
        ])
      },
      {
        id: 'seed-appt-005',
        appointment_code: 'DL-20261023-05',
        showroom_id: q1?.id || 'sr-q1',
        showroom_name: q1?.name || 'Showroom Quận 1',
        showroom_address: q1?.address || '128 Hai Bà Trưng, P. Đa Kao, Quận 1, TP.HCM',
        customer_name: 'Đỗ Thị Thu Hương',
        customer_phone: '0908889977',
        customer_email: 'thuhuong.do@gmail.com',
        preferred_date: todayStr,
        preferred_time: '14:00 - 15:30',
        notes: 'Khách đến trải nghiệm chất liệu nỉ nhung cao cấp cho căn hộ Masteri An Phú',
        product_name: 'Sofa Vũ Cao Cấp',
        status: 'IN_PROGRESS',
        staff_id: 'f7f61251-7cd9-42b9-9073-1b81a05990c6',
        staff_name: 'vu',
        history: JSON.stringify([
          { action: 'CREATED', title: 'Khách đặt lịch', timestamp: new Date(Date.now() - 86400000).toISOString(), actor: 'Đỗ Thị Thu Hương' },
          { action: 'APPROVED', title: 'Phê duyệt & Gán nhân viên tư vấn', timestamp: new Date(Date.now() - 7200000).toISOString(), actor: 'Admin DCor', staffName: 'vu' },
          { action: 'IN_PROGRESS', title: 'Khách hàng đã đến showroom - Đang tiếp đón tư vấn', timestamp: new Date(Date.now() - 1800000).toISOString(), actor: 'vu' }
        ])
      },
      {
        id: 'seed-appt-006',
        appointment_code: 'DL-20261023-06',
        showroom_id: q1?.id || 'sr-q1',
        showroom_name: q1?.name || 'Showroom Quận 1',
        showroom_address: q1?.address || '128 Hai Bà Trưng, P. Đa Kao, Quận 1, TP.HCM',
        customer_name: 'Nguyễn Thành Nam',
        customer_phone: '0909123888',
        customer_email: 'nam.nguyen@corp.vn',
        preferred_date: todayStr,
        preferred_time: '16:00 - 17:30',
        notes: 'Tư vấn bộ sofa góc chữ L và bàn trà mặt đá phiến',
        product_name: 'Sofa Góc L Luxury',
        status: 'CONFIRMED',
        staff_id: '0666ec64-b9bb-4ef8-9911-0577ba13eb1d',
        staff_name: 'Admin DCor',
        history: JSON.stringify([
          { action: 'CREATED', title: 'Khách đặt lịch', timestamp: new Date(Date.now() - 86400000 * 2).toISOString(), actor: 'Nguyễn Thành Nam' },
          { action: 'APPROVED', title: 'Phê duyệt & Xác nhận cuộc hẹn', timestamp: new Date(Date.now() - 86400000).toISOString(), actor: 'Admin DCor', staffName: 'Admin DCor' }
        ])
      },
      {
        id: 'seed-appt-007',
        appointment_code: 'DL-20261024-07',
        showroom_id: td?.id || 'sr-td',
        showroom_name: td?.name || 'Showroom Thủ Đức',
        showroom_address: td?.address || '45 Song Hành, P. An Phú, TP. Thủ Đức, TP.HCM',
        customer_name: 'Phạm Quỳnh Anh',
        customer_phone: '0977665544',
        customer_email: 'quynhanh.p@gmail.com',
        preferred_date: tomorrowStr,
        preferred_time: '10:30 - 12:00',
        notes: 'Tư vấn trọn gói nội thất biệt thự Song Hành, cần xem mẫu vật liệu thực tế',
        product_name: 'Gói nội thất biệt thự Song Hành',
        status: 'CONFIRMED',
        staff_id: 'f7f61251-7cd9-42b9-9073-1b81a05990c6',
        staff_name: 'vu',
        history: JSON.stringify([
          { action: 'CREATED', title: 'Khách đặt lịch', timestamp: new Date(Date.now() - 3600000 * 8).toISOString(), actor: 'Phạm Quỳnh Anh' },
          { action: 'APPROVED', title: 'Phê duyệt cuộc hẹn', timestamp: new Date(Date.now() - 3600000 * 2).toISOString(), actor: 'Admin DCor', staffName: 'vu' }
        ])
      },
      {
        id: 'seed-appt-008',
        appointment_code: 'DL-20261022-08',
        showroom_id: q1?.id || 'sr-q1',
        showroom_name: q1?.name || 'Showroom Quận 1',
        showroom_address: q1?.address || '128 Hai Bà Trưng, P. Đa Kao, Quận 1, TP.HCM',
        customer_name: 'Trần Đình Trọng',
        customer_phone: '0912344556',
        customer_email: 'trong.tran@gmail.com',
        preferred_date: yesterdayStr,
        preferred_time: '09:00 - 10:30',
        notes: 'Muốn xem trực tiếp độ êm và da bò của dòng sofa văng',
        product_name: 'Sofa Vũ Cao Cấp',
        status: 'COMPLETED',
        staff_id: 'f7f61251-7cd9-42b9-9073-1b81a05990c6',
        staff_name: 'vu',
        consultation_result: 'Khách hàng rất hài lòng về độ êm của đệm mút cao su và chất da bò Ý. Đã chốt đơn đặt cọc mẫu Sofa Vũ da bò Ý 32.500.000đ, hẹn giao hàng ngày 28/10.',
        history: JSON.stringify([
          { action: 'CREATED', title: 'Khách gửi yêu cầu', timestamp: new Date(Date.now() - 86400000 * 3).toISOString(), actor: 'Trần Đình Trọng' },
          { action: 'APPROVED', title: 'Phê duyệt lịch hẹn', timestamp: new Date(Date.now() - 86400000 * 2).toISOString(), actor: 'Admin DCor', staffName: 'vu' },
          { action: 'COMPLETED', title: 'Hoàn tất buổi tư vấn', timestamp: new Date(Date.now() - 86400000).toISOString(), actor: 'vu', result: 'Khách hàng chốt đơn Sofa Vũ' }
        ])
      },
      {
        id: 'seed-appt-009',
        appointment_code: 'DL-20261020-09',
        showroom_id: td?.id || 'sr-td',
        showroom_name: td?.name || 'Showroom Thủ Đức',
        showroom_address: td?.address || '45 Song Hành, P. An Phú, TP. Thủ Đức, TP.HCM',
        customer_name: 'Bùi Thanh Hằng',
        customer_phone: '0944556677',
        customer_email: 'thanhhang.bui@gmail.com',
        preferred_date: nextWeekStr,
        preferred_time: '16:00 - 17:30',
        notes: 'Tư vấn bàn làm việc gỗ tự nhiên',
        status: 'CANCELLED',
        cancellation_reason: 'Khách hàng có lịch công tác đột xuất tại Hà Nội, xin hủy hẹn và sẽ chủ động đặt lại sau.',
        history: JSON.stringify([
          { action: 'CREATED', title: 'Khách gửi yêu cầu', timestamp: new Date(Date.now() - 86400000 * 4).toISOString(), actor: 'Bùi Thanh Hằng' },
          { action: 'CANCELLED', title: 'Khách hàng thông báo hủy hẹn', timestamp: new Date(Date.now() - 86400000 * 2).toISOString(), actor: 'Admin DCor', reason: 'Khách bận công tác' }
        ])
      }
    ];

    for (const item of initialData) {
      await prisma.$executeRawUnsafe(`
        INSERT INTO "ShowroomConsultations" (
          id, appointment_code, showroom_id, showroom_name, showroom_address,
          customer_name, customer_phone, customer_email, preferred_date, preferred_time,
          notes, product_name, status, staff_id, staff_name, rejection_reason, cancellation_reason, consultation_result, history, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5,
          $6, $7, $8, $9, $10,
          $11, $12, $13, $14, $15, $16, $17, $18, $19::jsonb, NOW(), NOW()
        ) ON CONFLICT (appointment_code) DO NOTHING;
      `,
        item.id,
        item.appointment_code,
        item.showroom_id,
        item.showroom_name,
        item.showroom_address,
        item.customer_name,
        item.customer_phone,
        item.customer_email,
        item.preferred_date,
        item.preferred_time,
        item.notes || null,
        item.product_name || null,
        item.status,
        item.staff_id || null,
        item.staff_name || null,
        item.rejection_reason || null,
        item.cancellation_reason || null,
        item.consultation_result || null,
        item.history
      );
    }
    console.log('[Consultation DB] Khởi tạo thành công 9 cuộc hẹn mẫu thực tế.');
  } catch (err) {
    console.error('[Consultation DB] Lỗi khởi tạo dữ liệu mẫu:', err);
  }
}

export const consultationController = {
  // 1. Lấy danh sách Showroom thực tế từ database (Warehouse type SHOWROOM)
  getShowrooms: async (req: Request, res: Response): Promise<void> => {
    try {
      const cached = memoryCache.get<any[]>(CACHE_KEYS.SHOWROOMS_LIST, 10 * 60 * 1000);
      if (cached) {
        res.json(cached);
        return;
      }

      const warehouses = await prisma.warehouse.findMany({
        where: { type: 'SHOWROOM', isActive: true },
        select: {
          id: true,
          code: true,
          name: true,
          address: true,
          phone: true,
          managerName: true
        },
        orderBy: { name: 'asc' }
      });

      const showrooms = warehouses.map(w => {
        const extra = SHOWROOM_EXTRAS[w.code] || {
          lat: 10.7769,
          lng: 106.7009,
          googleMapsUrl: `https://maps.google.com/?q=${encodeURIComponent(w.name + ' ' + (w.address || ''))}`,
          openingHours: '08:30 - 20:30 (Thứ 2 - Chủ Nhật)',
          image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80',
          highlight: 'Không gian trải nghiệm nội thất cao cấp DCOR Studio'
        };
        return {
          ...w,
          ...extra
        };
      });

      memoryCache.set(CACHE_KEYS.SHOWROOMS_LIST, showrooms);
      res.json(showrooms);
    } catch (error) {
      console.error('[Consultation] Lỗi lấy danh sách showroom:', error);
      res.status(500).json({ error: 'Không thể tải danh sách showroom.' });
    }
  },

  // 2. Tra cứu lịch và dung lượng slot thời gian thực theo cấu hình và dữ liệu database
  getAvailability: async (req: Request, res: Response): Promise<void> => {
    try {
      await ensureConsultationTable();
      const { showroomId, date } = req.query;

      if (!showroomId || !date) {
        res.status(400).json({ error: 'Vui lòng cung cấp showroomId và date (YYYY-MM-DD).' });
        return;
      }

      const dateStr = String(date).trim();
      const targetDate = new Date(dateStr);
      if (isNaN(targetDate.getTime())) {
        res.status(400).json({ error: 'Định dạng ngày không hợp lệ. Vui lòng dùng YYYY-MM-DD.' });
        return;
      }

      // Kiểm tra ngày trong quá khứ
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const chosenDay = new Date(dateStr);
      chosenDay.setHours(0, 0, 0, 0);
      if (chosenDay < today) {
        res.status(400).json({ error: 'Không thể chọn ngày trong quá khứ.' });
        return;
      }

      // Lấy cấu hình slot riêng của Showroom nếu có
      let activeSlots = STANDARD_SLOTS;
      let maintenanceDates = ['2026-12-25', '2026-01-01', '2026-04-30', '2026-05-01'];

      const configRes: any[] = await prisma.$queryRawUnsafe(`
        SELECT slots, maintenance_dates FROM "ShowroomSlotConfigs" WHERE showroom_id = $1 LIMIT 1;
      `, String(showroomId));

      if (configRes && configRes.length > 0) {
        if (configRes[0].slots && Array.isArray(configRes[0].slots)) {
          activeSlots = configRes[0].slots;
        }
        if (configRes[0].maintenance_dates && Array.isArray(configRes[0].maintenance_dates)) {
          maintenanceDates = configRes[0].maintenance_dates;
        }
      }

      // Kiểm tra ngày bảo trì / đóng cửa showroom
      if (maintenanceDates.includes(dateStr)) {
        res.json({
          date: dateStr,
          isClosed: true,
          closureReason: 'Showroom tạm ngừng đón tiếp khách vào ngày này. Quý khách vui lòng chọn ngày hẹn khác.',
          slots: []
        });
        return;
      }

      // Query số lượng lịch hẹn đã đặt thực tế trong Database (chưa bị hủy/từ chối)
      const existingBookings: any[] = await prisma.$queryRawUnsafe(`
        SELECT preferred_time, COUNT(*)::int as booked_count
        FROM "ShowroomConsultations"
        WHERE showroom_id = $1 
          AND preferred_date = $2 
          AND status NOT IN ('CANCELLED', 'REJECTED')
        GROUP BY preferred_time;
      `, String(showroomId), dateStr);

      const bookingMap: Record<string, number> = {};
      for (const row of existingBookings) {
        bookingMap[row.preferred_time] = Number(row.booked_count);
      }

      // Xây dựng ma trận khung giờ và dung lượng slot thực tế
      const now = new Date();
      const isToday = chosenDay.getTime() === today.getTime();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();

      const slots = activeSlots.map(slot => {
        let booked = bookingMap[slot.time] || 0;
        if (!booked) {
          const startTime = slot.time.split(' - ')[0];
          for (const key of Object.keys(bookingMap)) {
            if (key === startTime || key.startsWith(startTime)) {
              booked += bookingMap[key];
            }
          }
        }
        const remaining = Math.max(0, slot.maxCapacity - booked);

        // Kiểm tra ca đã qua trong ngày hôm nay
        let isPastSlot = false;
        if (isToday) {
          const startTime = slot.time.split(' - ')[0].trim();
          const [sh, sm] = startTime.split(':').map(Number);
          if (currentHour > sh || (currentHour === sh && currentMinute >= sm)) {
            isPastSlot = true;
          }
        }

        const isAvailable = remaining > 0 && !isPastSlot;

        return {
          time: slot.time,
          period: slot.period || 'Ca tư vấn',
          maxCapacity: slot.maxCapacity,
          bookedCount: booked,
          remainingSlots: remaining,
          isAvailable,
          isPastSlot,
          statusLabel: isPastSlot 
            ? 'Đã qua giờ' 
            : (remaining === 0 ? 'Hết chỗ' : `Còn ${remaining} slot trống`)
        };
      });

      res.json({
        date: dateStr,
        showroomId: String(showroomId),
        isClosed: false,
        closureReason: null,
        slots
      });
    } catch (error) {
      console.error('[Consultation] Lỗi query availability:', error);
      res.status(500).json({ error: 'Không thể kiểm tra dung lượng slot showroom.' });
    }
  },

  // 3. Đặt lịch tư vấn showroom với kiểm tra xung đột thời gian thực trước khi ghi DB (Khách hàng)
  createConsultation: async (req: Request, res: Response): Promise<void> => {
    try {
      await ensureConsultationTable();
      const {
        showroomId,
        preferredDate,
        preferredTime,
        fullName,
        phone,
        email,
        notes,
        productId,
        productName,
        variantId
      } = req.body;

      if (!showroomId || !preferredDate || !preferredTime || !fullName || !phone) {
        res.status(400).json({
          error: 'Vui lòng cung cấp đầy đủ: Showroom, Ngày hẹn, Khung giờ, Họ và tên và Số điện thoại.'
        });
        return;
      }

      // Xác thực số điện thoại
      const phoneClean = String(phone).trim();
      const phoneRegex = /^(0)(3[2-9]|5[2689]|7[06-9]|8[1-9]|9[0-9])[0-9]{7}$/;
      if (!phoneRegex.test(phoneClean)) {
        res.status(400).json({ error: 'Số điện thoại không đúng định dạng di động Việt Nam (10 chữ số).' });
        return;
      }

      // Lấy thông tin showroom từ DB
      const showroom = await prisma.warehouse.findUnique({
        where: { id: String(showroomId) }
      });

      const showroomName = showroom?.name || 'Showroom DCOR Studio';
      const showroomAddress = showroom?.address || '128 Hai Bà Trưng, P. Đa Kao, Quận 1, TP.HCM';

      // === KIỂM TRA XUNG ĐỘT THỜI GIAN THỰC ===
      const dateStr = String(preferredDate).trim();
      const timeStr = String(preferredTime).trim();

      const existingCountResult: any[] = await prisma.$queryRawUnsafe(`
        SELECT COUNT(*)::int as count
        FROM "ShowroomConsultations"
        WHERE showroom_id = $1 
          AND preferred_date = $2 
          AND preferred_time = $3 
          AND status NOT IN ('CANCELLED', 'REJECTED');
      `, String(showroomId), dateStr, timeStr);

      const currentBooked = Number(existingCountResult[0]?.count || 0);
      const maxCap = await getMaxCapacityForSlot(showroomId, timeStr);

      if (currentBooked >= maxCap) {
        res.status(409).json({
          error: `Khung giờ ${timeStr} ngày ${dateStr} tại ${showroomName} vừa có khách hàng khác đặt kín chỗ. Quý khách vui lòng chọn khung giờ khác.`
        });
        return;
      }

      // Tạo mã yêu cầu duy nhất dạng REQ-YYYYMMDD-XXXX
      const now = new Date();
      const datePart = now.toISOString().slice(0, 10).replace(/-/g, '');
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const appointmentCode = `REQ-${datePart}-${randomSuffix}`;
      const id = `consult-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

      const initialHistory = JSON.stringify([
        {
          action: 'CREATED',
          title: 'Khách hàng gửi biểu mẫu đặt lịch trực tuyến',
          timestamp: now.toISOString(),
          actor: String(fullName).trim(),
          note: notes || 'Yêu cầu chờ ban quản trị phân công nhân sự và phê duyệt'
        }
      ]);

      // Ghi lịch tư vấn vào Database thực với trạng thái PENDING
      await prisma.$executeRawUnsafe(`
        INSERT INTO "ShowroomConsultations" (
          id, appointment_code, showroom_id, showroom_name, showroom_address,
          customer_name, customer_phone, customer_email, preferred_date, preferred_time,
          notes, product_id, product_name, variant_id, status, history, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5,
          $6, $7, $8, $9, $10,
          $11, $12, $13, $14, 'PENDING', $15::jsonb, NOW(), NOW()
        );
      `,
        id,
        appointmentCode,
        String(showroomId),
        showroomName,
        showroomAddress,
        String(fullName).trim(),
        phoneClean,
        email ? String(email).trim() : null,
        dateStr,
        timeStr,
        notes ? String(notes).trim() : null,
        productId ? String(productId) : null,
        productName ? String(productName) : null,
        variantId ? String(variantId) : null,
        initialHistory
      );

      memoryCache.invalidatePrefix(CACHE_KEYS.CONSULTATIONS_ADMIN_PREFIX);

      res.status(201).json({
        success: true,
        appointmentCode,
        message: `Gửi yêu cầu đặt lịch tư vấn thành công! Mã yêu cầu của bạn là ${appointmentCode}. Nhân viên DCOR sẽ sớm liên hệ xác nhận.`,
        consultation: {
          id,
          appointmentCode,
          showroomName,
          showroomAddress,
          customerName: fullName,
          customerPhone: phoneClean,
          customerEmail: email || null,
          preferredDate: dateStr,
          preferredTime: timeStr,
          productName: productName || null,
          notes: notes || null,
          status: 'PENDING',
          createdAt: now.toISOString()
        }
      });
    } catch (error) {
      console.error('[Consultation] Lỗi tạo lịch tư vấn:', error);
      res.status(500).json({ error: 'Có lỗi xảy ra khi lưu lịch tư vấn vào cơ sở dữ liệu.' });
    }
  },

  // 4. Tra cứu lịch hẹn của khách hàng theo số điện thoại
  getMyAppointments: async (req: Request, res: Response): Promise<void> => {
    try {
      await ensureConsultationTable();
      const { phone } = req.query;
      if (!phone) {
        res.status(400).json({ error: 'Vui lòng cung cấp số điện thoại tra cứu.' });
        return;
      }

      const records: any[] = await prisma.$queryRawUnsafe(`
        SELECT *
        FROM "ShowroomConsultations"
        WHERE customer_phone = $1
        ORDER BY created_at DESC;
      `, String(phone).trim());

      res.json(records);
    } catch (error) {
      console.error('[Consultation] Lỗi tra cứu lịch hẹn:', error);
      res.status(500).json({ error: 'Không thể tra cứu lịch hẹn.' });
    }
  },

  // =========================================================================
  // ADMIN APIS: QUẢN LÝ YÊU CẦU & LỊCH TƯ VẤN SHOWROOM
  // =========================================================================

  // 5. Admin: Lấy danh sách yêu cầu tư vấn & lịch tư vấn theo bộ lọc
  getAdminConsultations: async (req: Request, res: Response): Promise<void> => {
    try {
      await ensureConsultationTable();
      const {
        tab,
        status,
        showroomId,
        staffId,
        startDate,
        endDate,
        search
      } = req.query;

      const cacheKey = `${CACHE_KEYS.CONSULTATIONS_ADMIN_PREFIX}${tab || ''}_${status || ''}_${showroomId || ''}_${staffId || ''}_${startDate || ''}_${endDate || ''}_${search || ''}`;
      const cached = memoryCache.get<any>(cacheKey, 15 * 1000);
      if (cached) {
        res.json(cached);
        return;
      }

      const conditions: string[] = ['1=1'];
      const params: any[] = [];
      let pIdx = 1;

      // Lọc theo Tab nếu không chỉ định status cụ thể
      if (tab === 'calendar' && (!status || status === 'ALL')) {
        // Tab 2: Lịch tư vấn (Đã xác nhận, Đang tư vấn, Hoàn tất, Đã hủy)
        conditions.push(`status IN ('CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')`);
      } else if (status && status !== 'ALL') {
        conditions.push(`status = $${pIdx}`);
        params.push(String(status).trim().toUpperCase());
        pIdx++;
      }

      // Lọc Showroom
      if (showroomId && showroomId !== 'ALL') {
        conditions.push(`showroom_id = $${pIdx}`);
        params.push(String(showroomId).trim());
        pIdx++;
      }

      // Lọc Nhân viên phụ trách
      if (staffId && staffId !== 'ALL') {
        conditions.push(`staff_id = $${pIdx}`);
        params.push(String(staffId).trim());
        pIdx++;
      }

      // Lọc Khoảng ngày
      if (startDate) {
        conditions.push(`preferred_date >= $${pIdx}`);
        params.push(String(startDate).trim());
        pIdx++;
      }
      if (endDate) {
        conditions.push(`preferred_date <= $${pIdx}`);
        params.push(String(endDate).trim());
        pIdx++;
      }

      // Lọc Từ khóa tìm kiếm
      if (search && String(search).trim()) {
        const s = `%${String(search).trim().toLowerCase()}%`;
        conditions.push(`(
          LOWER(appointment_code) LIKE $${pIdx} OR 
          LOWER(customer_name) LIKE $${pIdx} OR 
          customer_phone LIKE $${pIdx} OR 
          LOWER(COALESCE(customer_email, '')) LIKE $${pIdx} OR 
          LOWER(COALESCE(notes, '')) LIKE $${pIdx} OR 
          LOWER(COALESCE(product_name, '')) LIKE $${pIdx}
        )`);
        params.push(s);
        pIdx++;
      }

      const whereClause = conditions.join(' AND ');

      // Truy vấn danh sách
      const orderClause = tab === 'requests'
        ? 'ORDER BY created_at DESC'
        : 'ORDER BY preferred_date ASC, preferred_time ASC, created_at DESC';

      const querySql = `
        SELECT *
        FROM "ShowroomConsultations"
        WHERE ${whereClause}
        ${orderClause};
      `;

      // Truy vấn song song (Promise.all) danh sách và thống kê đếm trạng thái
      const [records, statsRes]: [any[], any[]] = await Promise.all([
        prisma.$queryRawUnsafe(querySql, ...params) as Promise<any[]>,
        prisma.$queryRawUnsafe(`
          SELECT status, COUNT(*)::int as count
          FROM "ShowroomConsultations"
          GROUP BY status;
        `) as Promise<any[]>
      ]);

      const stats = {
        total: 0,
        pending: 0,
        confirmed: 0,
        inProgress: 0,
        completed: 0,
        rejected: 0,
        cancelled: 0
      };

      for (const row of statsRes) {
        const cnt = Number(row.count);
        stats.total += cnt;
        if (row.status === 'PENDING') stats.pending = cnt;
        else if (row.status === 'CONFIRMED') stats.confirmed = cnt;
        else if (row.status === 'IN_PROGRESS') stats.inProgress = cnt;
        else if (row.status === 'COMPLETED') stats.completed = cnt;
        else if (row.status === 'REJECTED') stats.rejected = cnt;
        else if (row.status === 'CANCELLED') stats.cancelled = cnt;
      }

      const responseData = {
        success: true,
        consultations: records,
        stats
      };

      memoryCache.set(cacheKey, responseData);

      res.json(responseData);
    } catch (error) {
      console.error('[Consultation Admin] Lỗi lấy danh sách tư vấn:', error);
      res.status(500).json({ error: 'Không thể tải danh sách yêu cầu tư vấn.' });
    }
  },

  // 6. Admin: Phê duyệt lịch tư vấn & Gán nhân viên phụ trách
  approveConsultation: async (req: Request, res: Response): Promise<void> => {
    try {
      await ensureConsultationTable();
      const {
        id,
        staffId,
        staffName,
        preferredDate,
        preferredTime,
        adminNote
      } = req.body;

      if (!id || !staffId || !staffName) {
        res.status(400).json({ error: 'Vui lòng cung cấp mã cuộc hẹn, mã nhân viên và tên nhân viên phụ trách.' });
        return;
      }

      // Lấy bản ghi hiện tại
      const found: any[] = await prisma.$queryRawUnsafe(`
        SELECT * FROM "ShowroomConsultations" WHERE id = $1 LIMIT 1;
      `, String(id));

      if (!found || found.length === 0) {
        res.status(404).json({ error: 'Không tìm thấy yêu cầu tư vấn.' });
        return;
      }

      const record = found[0];
      const finalDate = (preferredDate || record.preferred_date).trim();
      const finalTime = (preferredTime || record.preferred_time).trim();

      // Kiểm tra xung đột slot tại Showroom (nếu có đổi ngày/giờ)
      if (finalDate !== record.preferred_date || finalTime !== record.preferred_time) {
        const slotBookedRes: any[] = await prisma.$queryRawUnsafe(`
          SELECT COUNT(*)::int as count 
          FROM "ShowroomConsultations" 
          WHERE showroom_id = $1 
            AND preferred_date = $2 
            AND preferred_time = $3 
            AND status NOT IN ('CANCELLED', 'REJECTED')
            AND id != $4;
        `, record.showroom_id, finalDate, finalTime, record.id);

        const booked = Number(slotBookedRes[0]?.count || 0);
        const maxCap = await getMaxCapacityForSlot(record.showroom_id, finalTime);

        if (booked >= maxCap) {
          res.status(409).json({
            error: `Khung giờ ${finalTime} ngày ${finalDate} tại showroom đã kín chỗ (${booked}/${maxCap}). Vui lòng chọn khung giờ khác.`
          });
          return;
        }
      }

      // Kiểm tra trùng lịch nhân viên tư vấn trong cùng ngày và khung giờ
      const staffConflictRes: any[] = await prisma.$queryRawUnsafe(`
        SELECT appointment_code, customer_name
        FROM "ShowroomConsultations"
        WHERE staff_id = $1
          AND preferred_date = $2
          AND preferred_time = $3
          AND status IN ('CONFIRMED', 'IN_PROGRESS')
          AND id != $4
        LIMIT 1;
      `, String(staffId), finalDate, finalTime, record.id);

      let staffWarning: string | null = null;
      if (staffConflictRes && staffConflictRes.length > 0) {
        staffWarning = `Lưu ý: Nhân viên ${staffName} đang có lịch hẹn ${staffConflictRes[0].appointment_code} (${staffConflictRes[0].customer_name}) trong cùng khung giờ này.`;
      }

      // Cập nhật timeline lịch sử
      let currentHistory: any[] = [];
      try {
        currentHistory = Array.isArray(record.history) ? record.history : JSON.parse(record.history || '[]');
      } catch (e) {
        currentHistory = [];
      }

      currentHistory.push({
        action: 'APPROVED',
        title: 'Phê duyệt cuộc hẹn & Phân công nhân sự',
        timestamp: new Date().toISOString(),
        actor: 'Quản trị viên',
        staffName,
        preferredDate: finalDate,
        preferredTime: finalTime,
        note: adminNote || 'Đã kiểm duyệt slot & phân công chuyên viên tư vấn tiếp đón'
      });

      // Cập nhật Database
      await prisma.$executeRawUnsafe(`
        UPDATE "ShowroomConsultations"
        SET status = 'CONFIRMED',
            staff_id = $1,
            staff_name = $2,
            preferred_date = $3,
            preferred_time = $4,
            history = $5::jsonb,
            updated_at = NOW()
        WHERE id = $6;
      `,
        String(staffId),
        String(staffName).trim(),
        finalDate,
        finalTime,
        JSON.stringify(currentHistory),
        record.id
      );

      memoryCache.invalidatePrefix(CACHE_KEYS.CONSULTATIONS_ADMIN_PREFIX);

      // Trả thông báo thành công kèm mô phỏng gửi Email / SMS Brandname
      const notification = {
        emailSent: !!record.customer_email,
        emailRecipient: record.customer_email || null,
        smsSent: true,
        smsRecipient: record.customer_phone,
        smsBrandname: 'DCOR STUDIO',
        smsMessage: `[DCOR] Lich hen tu van tai ${record.showroom_name} luc ${finalTime} ngay ${finalDate} da duoc XAC NHAN. Chuyen vien tiep don: ${staffName}. Hotline: 028 3822 5588.`,
        staffNotification: {
          staffId,
          staffName,
          title: 'Phân công tiếp đón khách hàng',
          content: `Bạn được phân công tư vấn khách ${record.customer_name} (${record.customer_phone}) lúc ${finalTime} ngày ${finalDate} tại ${record.showroom_name}.`
        }
      };

      res.json({
        success: true,
        message: `Phê duyệt lịch hẹn ${record.appointment_code} thành công và đã phân công cho ${staffName}.`,
        warning: staffWarning,
        notification
      });
    } catch (error) {
      console.error('[Consultation Admin] Lỗi phê duyệt lịch:', error);
      res.status(500).json({ error: 'Có lỗi xảy ra khi phê duyệt lịch tư vấn.' });
    }
  },

  // 7. Admin: Từ chối yêu cầu tư vấn
  rejectConsultation: async (req: Request, res: Response): Promise<void> => {
    try {
      await ensureConsultationTable();
      const { id, rejectionReason } = req.body;

      if (!id || !rejectionReason || !String(rejectionReason).trim()) {
        res.status(400).json({ error: 'Vui lòng cung cấp mã yêu cầu và lý do từ chối rõ ràng.' });
        return;
      }

      const found: any[] = await prisma.$queryRawUnsafe(`
        SELECT * FROM "ShowroomConsultations" WHERE id = $1 LIMIT 1;
      `, String(id));

      if (!found || found.length === 0) {
        res.status(404).json({ error: 'Không tìm thấy yêu cầu tư vấn.' });
        return;
      }

      const record = found[0];

      let currentHistory: any[] = [];
      try {
        currentHistory = Array.isArray(record.history) ? record.history : JSON.parse(record.history || '[]');
      } catch (e) {
        currentHistory = [];
      }

      const reasonClean = String(rejectionReason).trim();
      currentHistory.push({
        action: 'REJECTED',
        title: 'Từ chối yêu cầu tư vấn',
        timestamp: new Date().toISOString(),
        actor: 'Quản trị viên',
        reason: reasonClean
      });

      await prisma.$executeRawUnsafe(`
        UPDATE "ShowroomConsultations"
        SET status = 'REJECTED',
             rejection_reason = $1,
             history = $2::jsonb,
             updated_at = NOW()
        WHERE id = $3;
      `,
        reasonClean,
        JSON.stringify(currentHistory),
        record.id
      );

      memoryCache.invalidatePrefix(CACHE_KEYS.CONSULTATIONS_ADMIN_PREFIX);

      res.json({
        success: true,
        message: `Đã từ chối yêu cầu ${record.appointment_code}. Hệ thống đã giải phóng slot và gửi thông báo phản hồi đến khách hàng.`,
        notification: {
          emailSent: !!record.customer_email,
          emailRecipient: record.customer_email || null,
          smsSent: true,
          smsRecipient: record.customer_phone,
          smsMessage: `[DCOR] Yeu cau dat lich ${record.appointment_code} tam thoi chua the xep cho vi ly do: ${reasonClean}. Quy khach vui long goi hotline 028 3822 5588 de duoc ho tro doi lich phu hop nhat.`
        }
      });
    } catch (error) {
      console.error('[Consultation Admin] Lỗi từ chối lịch:', error);
      res.status(500).json({ error: 'Có lỗi xảy ra khi từ chối yêu cầu tư vấn.' });
    }
  },

  // 8. Admin: Hoàn tất tư vấn & Ghi nhận kết quả
  completeConsultation: async (req: Request, res: Response): Promise<void> => {
    try {
      await ensureConsultationTable();
      const { id, consultationResult } = req.body;

      if (!id || !consultationResult || !String(consultationResult).trim()) {
        res.status(400).json({ error: 'Vui lòng cung cấp mã cuộc hẹn và tóm tắt kết quả tư vấn.' });
        return;
      }

      const found: any[] = await prisma.$queryRawUnsafe(`
        SELECT * FROM "ShowroomConsultations" WHERE id = $1 LIMIT 1;
      `, String(id));

      if (!found || found.length === 0) {
        res.status(404).json({ error: 'Không tìm thấy cuộc hẹn tư vấn.' });
        return;
      }

      const record = found[0];
      let currentHistory: any[] = [];
      try {
        currentHistory = Array.isArray(record.history) ? record.history : JSON.parse(record.history || '[]');
      } catch (e) {
        currentHistory = [];
      }

      const resultClean = String(consultationResult).trim();
      currentHistory.push({
        action: 'COMPLETED',
        title: 'Hoàn tất buổi tư vấn tại showroom',
        timestamp: new Date().toISOString(),
        actor: record.staff_name || 'Nhân viên tư vấn',
        result: resultClean
      });

      await prisma.$executeRawUnsafe(`
        UPDATE "ShowroomConsultations"
        SET status = 'COMPLETED',
             consultation_result = $1,
             history = $2::jsonb,
             updated_at = NOW()
        WHERE id = $3;
      `,
        resultClean,
        JSON.stringify(currentHistory),
        record.id
      );

      memoryCache.invalidatePrefix(CACHE_KEYS.CONSULTATIONS_ADMIN_PREFIX);

      res.json({
        success: true,
        message: `Đã đánh dấu hoàn tất buổi tư vấn cho khách ${record.customer_name}. Ghi chú kết quả đã được lưu trữ an toàn.`
      });
    } catch (error) {
      console.error('[Consultation Admin] Lỗi hoàn tất tư vấn:', error);
      res.status(500).json({ error: 'Có lỗi xảy ra khi cập nhật kết quả tư vấn.' });
    }
  },

  // 9. Admin: Dời lịch hẹn tư vấn (Reschedule)
  rescheduleConsultation: async (req: Request, res: Response): Promise<void> => {
    try {
      await ensureConsultationTable();
      const { id, newDate, newTime, reason } = req.body;

      if (!id || !newDate || !newTime) {
        res.status(400).json({ error: 'Vui lòng cung cấp mã cuộc hẹn, ngày hẹn mới và khung giờ mới.' });
        return;
      }

      const found: any[] = await prisma.$queryRawUnsafe(`
        SELECT * FROM "ShowroomConsultations" WHERE id = $1 LIMIT 1;
      `, String(id));

      if (!found || found.length === 0) {
        res.status(404).json({ error: 'Không tìm thấy cuộc hẹn.' });
        return;
      }

      const record = found[0];
      const newDateStr = String(newDate).trim();
      const newTimeStr = String(newTime).trim();

      // Kiểm tra slot trống tại ngày/giờ mới
      const countRes: any[] = await prisma.$queryRawUnsafe(`
        SELECT COUNT(*)::int as count 
        FROM "ShowroomConsultations" 
        WHERE showroom_id = $1 
          AND preferred_date = $2 
          AND preferred_time = $3 
          AND status NOT IN ('CANCELLED', 'REJECTED')
          AND id != $4;
      `, record.showroom_id, newDateStr, newTimeStr, record.id);

      const booked = Number(countRes[0]?.count || 0);
      const maxCap = await getMaxCapacityForSlot(record.showroom_id, newTimeStr);

      if (booked >= maxCap) {
        res.status(409).json({
          error: `Khung giờ ${newTimeStr} ngày ${newDateStr} tại showroom đã kín chỗ. Vui lòng chọn thời gian khác.`
        });
        return;
      }

      let currentHistory: any[] = [];
      try {
        currentHistory = Array.isArray(record.history) ? record.history : JSON.parse(record.history || '[]');
      } catch (e) {
        currentHistory = [];
      }

      currentHistory.push({
        action: 'RESCHEDULED',
        title: `Dời lịch hẹn từ [${record.preferred_time} ${record.preferred_date}] sang [${newTimeStr} ${newDateStr}]`,
        timestamp: new Date().toISOString(),
        actor: 'Quản trị viên',
        reason: reason || 'Theo yêu cầu thống nhất với khách hàng'
      });

      await prisma.$executeRawUnsafe(`
        UPDATE "ShowroomConsultations"
        SET preferred_date = $1,
            preferred_time = $2,
            history = $3::jsonb,
            updated_at = NOW()
        WHERE id = $4;
      `,
        newDateStr,
        newTimeStr,
        JSON.stringify(currentHistory),
        record.id
      );

      memoryCache.invalidatePrefix(CACHE_KEYS.CONSULTATIONS_ADMIN_PREFIX);

      res.json({
        success: true,
        message: `Đã dời lịch hẹn ${record.appointment_code} sang ${newTimeStr} ngày ${newDateStr} thành công.`,
        notification: {
          emailSent: !!record.customer_email,
          emailRecipient: record.customer_email || null,
          smsSent: true,
          smsRecipient: record.customer_phone,
          smsMessage: `[DCOR] Lich hen tu van tai ${record.showroom_name} cua quy khach da duoc DOI sang: ${newTimeStr} ngay ${newDateStr}. Hen gap quy khach!`
        }
      });
    } catch (error) {
      console.error('[Consultation Admin] Lỗi dời lịch:', error);
      res.status(500).json({ error: 'Có lỗi xảy ra khi dời lịch tư vấn.' });
    }
  },

  // 10. Admin: Hủy lịch hẹn (Cancel)
  cancelConsultation: async (req: Request, res: Response): Promise<void> => {
    try {
      await ensureConsultationTable();
      const { id, cancellationReason } = req.body;

      if (!id || !cancellationReason || !String(cancellationReason).trim()) {
        res.status(400).json({ error: 'Vui lòng cung cấp mã cuộc hẹn và lý do hủy cuộc hẹn.' });
        return;
      }

      const found: any[] = await prisma.$queryRawUnsafe(`
        SELECT * FROM "ShowroomConsultations" WHERE id = $1 LIMIT 1;
      `, String(id));

      if (!found || found.length === 0) {
        res.status(404).json({ error: 'Không tìm thấy cuộc hẹn.' });
        return;
      }

      const record = found[0];
      const reasonClean = String(cancellationReason).trim();

      let currentHistory: any[] = [];
      try {
        currentHistory = Array.isArray(record.history) ? record.history : JSON.parse(record.history || '[]');
      } catch (e) {
        currentHistory = [];
      }

      currentHistory.push({
        action: 'CANCELLED',
        title: 'Hủy cuộc hẹn tư vấn',
        timestamp: new Date().toISOString(),
        actor: 'Quản trị viên',
        reason: reasonClean
      });

      await prisma.$executeRawUnsafe(`
        UPDATE "ShowroomConsultations"
        SET status = 'CANCELLED',
            cancellation_reason = $1,
            history = $2::jsonb,
            updated_at = NOW()
        WHERE id = $3;
      `,
        reasonClean,
        JSON.stringify(currentHistory),
        record.id
      );

      memoryCache.invalidatePrefix(CACHE_KEYS.CONSULTATIONS_ADMIN_PREFIX);

      res.json({
        success: true,
        message: `Đã hủy cuộc hẹn ${record.appointment_code} thành công và giải phóng slot trên lịch.`
      });
    } catch (error) {
      console.error('[Consultation Admin] Lỗi hủy lịch:', error);
      res.status(500).json({ error: 'Có lỗi xảy ra khi hủy lịch tư vấn.' });
    }
  },

  // 11. Admin: Đổi trạng thái cuộc hẹn (ví dụ sang IN_PROGRESS)
  updateStatusConsultation: async (req: Request, res: Response): Promise<void> => {
    try {
      await ensureConsultationTable();
      const { id, status, note } = req.body;

      if (!id || !status) {
        res.status(400).json({ error: 'Vui lòng cung cấp mã cuộc hẹn và trạng thái mới.' });
        return;
      }

      const found: any[] = await prisma.$queryRawUnsafe(`
        SELECT * FROM "ShowroomConsultations" WHERE id = $1 LIMIT 1;
      `, String(id));

      if (!found || found.length === 0) {
        res.status(404).json({ error: 'Không tìm thấy cuộc hẹn.' });
        return;
      }

      const record = found[0];
      const statusClean = String(status).trim().toUpperCase();

      let currentHistory: any[] = [];
      try {
        currentHistory = Array.isArray(record.history) ? record.history : JSON.parse(record.history || '[]');
      } catch (e) {
        currentHistory = [];
      }

      let actionTitle = `Cập nhật trạng thái sang ${statusClean}`;
      if (statusClean === 'IN_PROGRESS') {
        actionTitle = 'Khách hàng đã có mặt tại Showroom - Chuyên viên đang tư vấn';
      }

      currentHistory.push({
        action: statusClean,
        title: actionTitle,
        timestamp: new Date().toISOString(),
        actor: record.staff_name || 'Quản trị viên',
        note: note || null
      });

      await prisma.$executeRawUnsafe(`
        UPDATE "ShowroomConsultations"
        SET status = $1,
            history = $2::jsonb,
            updated_at = NOW()
        WHERE id = $3;
      `,
        statusClean,
        JSON.stringify(currentHistory),
        record.id
      );

      memoryCache.invalidatePrefix(CACHE_KEYS.CONSULTATIONS_ADMIN_PREFIX);

      res.json({
        success: true,
        message: `Đã cập nhật trạng thái lịch hẹn sang ${statusClean}.`
      });
    } catch (error) {
      console.error('[Consultation Admin] Lỗi cập nhật trạng thái:', error);
      res.status(500).json({ error: 'Có lỗi xảy ra khi cập nhật trạng thái.' });
    }
  },

  // 12. Admin: Lấy danh sách nhân sự thực tế từ bảng StaffUser để gán vào dropdown
  getStaffList: async (req: Request, res: Response): Promise<void> => {
    try {
      const cached = memoryCache.get<any[]>(CACHE_KEYS.STAFF_LIST, 5 * 60 * 1000);
      if (cached) {
        res.json(cached);
        return;
      }

      const staffUsers = await prisma.staffUser.findMany({
        where: {
          status: 'ACTIVE'
        },
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          role: true
        },
        orderBy: { fullName: 'asc' }
      });

      const list = staffUsers.map(s => ({
        id: s.id,
        name: s.fullName,
        email: s.email,
        phone: s.phone,
        role: s.role
      }));

      memoryCache.set(CACHE_KEYS.STAFF_LIST, list);
      res.json(list);
    } catch (error) {
      console.error('[Consultation Admin] Lỗi lấy danh sách nhân sự:', error);
      res.status(500).json({ error: 'Không thể tải danh sách nhân sự.' });
    }
  },

  // 13. Admin: Lấy cấu hình khung giờ & ngày nghỉ lễ của Showroom
  getSlotConfig: async (req: Request, res: Response): Promise<void> => {
    try {
      const { showroomId } = req.query;

      if (!showroomId) {
        res.status(400).json({ error: 'Vui lòng cung cấp showroomId.' });
        return;
      }

      const cacheKey = `slot_config_${showroomId}`;
      const cached = memoryCache.get<any>(cacheKey, 10 * 60 * 1000);
      if (cached) {
        res.json(cached);
        return;
      }

      await ensureConsultationTable();
      const configRes: any[] = await prisma.$queryRawUnsafe(`
        SELECT * FROM "ShowroomSlotConfigs" WHERE showroom_id = $1 LIMIT 1;
      `, String(showroomId));

      let resultConfig;
      if (configRes && configRes.length > 0) {
        resultConfig = {
          showroomId: String(showroomId),
          slots: configRes[0].slots,
          maintenanceDates: configRes[0].maintenance_dates
        };
      } else {
        resultConfig = {
          showroomId: String(showroomId),
          slots: STANDARD_SLOTS,
          maintenanceDates: ['2026-12-25', '2026-01-01', '2026-04-30', '2026-05-01']
        };
      }

      memoryCache.set(cacheKey, resultConfig);
      res.json(resultConfig);
    } catch (error) {
      console.error('[Consultation Admin] Lỗi lấy cấu hình slot:', error);
      res.status(500).json({ error: 'Không thể tải cấu hình ca làm việc.' });
    }
  },

  // 14. Admin: Lưu cấu hình khung giờ & ngày nghỉ của Showroom
  saveSlotConfig: async (req: Request, res: Response): Promise<void> => {
    try {
      await ensureConsultationTable();
      const { showroomId, slots, maintenanceDates } = req.body;

      if (!showroomId || !slots || !Array.isArray(slots)) {
        res.status(400).json({ error: 'Vui lòng cung cấp showroomId và danh sách các ca làm việc hợp lệ.' });
        return;
      }

      const id = `cfg-${showroomId}`;
      const slotsJson = JSON.stringify(slots);
      const datesJson = JSON.stringify(maintenanceDates || []);

      await prisma.$executeRawUnsafe(`
        INSERT INTO "ShowroomSlotConfigs" (id, showroom_id, slots, maintenance_dates, updated_at)
        VALUES ($1, $2, $3::jsonb, $4::jsonb, NOW())
        ON CONFLICT (showroom_id) DO UPDATE
        SET slots = EXCLUDED.slots,
            maintenance_dates = EXCLUDED.maintenance_dates,
            updated_at = NOW();
      `, id, String(showroomId), slotsJson, datesJson);

      memoryCache.invalidate(`slot_config_${showroomId}`);

      res.json({
        success: true,
        message: 'Đã cập nhật cấu hình ca tư vấn và ngày nghỉ lễ cho Showroom thành công!'
      });
    } catch (error) {
      console.error('[Consultation Admin] Lỗi lưu cấu hình slot:', error);
      res.status(500).json({ error: 'Không thể lưu cấu hình ca làm việc.' });
    }
  }
};
