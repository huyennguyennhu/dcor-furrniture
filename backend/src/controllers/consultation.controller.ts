import { Request, Response } from 'express';
import prisma from '../lib/prisma';

let isTableInitialized = false;

// Tự động tạo bảng ShowroomConsultations nếu chưa tồn tại
async function ensureConsultationTable() {
  if (isTableInitialized) return;
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
        status VARCHAR(50) DEFAULT 'CONFIRMED',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_consultations_lookup 
      ON "ShowroomConsultations" (showroom_id, preferred_date, preferred_time);
    `);
    isTableInitialized = true;
  } catch (err) {
    console.error('[Consultation DB] Lỗi khởi tạo bảng ShowroomConsultations:', err);
  }
}

// Cấu hình ca tư vấn chuẩn
const STANDARD_SLOTS = [
  { time: '09:00 - 10:30', period: 'Ca sáng', maxCapacity: 3 },
  { time: '10:30 - 12:00', period: 'Ca sáng', maxCapacity: 3 },
  { time: '14:00 - 15:30', period: 'Ca chiều', maxCapacity: 3 },
  { time: '16:00 - 17:30', period: 'Ca chiều', maxCapacity: 3 },
  { time: '18:30 - 20:00', period: 'Ca tối', maxCapacity: 2 }
];

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

export const consultationController = {
  // 1. Lấy danh sách Showroom thực tế từ database (Warehouse type SHOWROOM)
  getShowrooms: async (req: Request, res: Response): Promise<void> => {
    try {
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

      // Danh sách ngày bảo trì / đóng cửa showroom (cấu hình lịch quản trị)
      const maintenanceDates = ['2026-12-25', '2026-01-01', '2026-04-30', '2026-05-01'];
      if (maintenanceDates.includes(dateStr)) {
        res.json({
          date: dateStr,
          isClosed: true,
          closureReason: 'Showroom tạm ngừng tiếp khách để bảo trì định kỳ không gian trưng bày theo lịch quản trị.',
          slots: []
        });
        return;
      }

      // Query số lượng lịch hẹn đã đặt thực tế trong Database
      const existingBookings: any[] = await prisma.$queryRawUnsafe(`
        SELECT preferred_time, COUNT(*)::int as booked_count
        FROM "ShowroomConsultations"
        WHERE showroom_id = $1 
          AND preferred_date = $2 
          AND status != 'CANCELLED'
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

      const slots = STANDARD_SLOTS.map(slot => {
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

        // Nếu là ngày hôm nay, kiểm tra xem khung giờ đã qua chưa
        let isPastSlot = false;
        if (isToday) {
          const startParts = slot.time.split(' - ')[0].split(':');
          const slotHour = parseInt(startParts[0], 10);
          const slotMinute = parseInt(startParts[1], 10);
          if (currentHour > slotHour || (currentHour === slotHour && currentMinute >= slotMinute)) {
            isPastSlot = true;
          }
        }

        const isAvailable = remaining > 0 && !isPastSlot;

        return {
          time: slot.time,
          period: slot.period,
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

  // 3. Đặt lịch tư vấn showroom với kiểm tra xung đột thời gian thực trước khi ghi DB
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

      // === KIỂM TRA XUNG ĐỘT THỜI GIAN THỰC (Concurrency / Conflict Check) ===
      const dateStr = String(preferredDate).trim();
      const timeStr = String(preferredTime).trim();

      const existingCountResult: any[] = await prisma.$queryRawUnsafe(`
        SELECT COUNT(*)::int as count
        FROM "ShowroomConsultations"
        WHERE showroom_id = $1 
          AND preferred_date = $2 
          AND preferred_time = $3 
          AND status != 'CANCELLED';
      `, String(showroomId), dateStr, timeStr);

      const currentBooked = Number(existingCountResult[0]?.count || 0);
      const slotConfig = STANDARD_SLOTS.find(s => s.time === timeStr);
      const maxCap = slotConfig ? slotConfig.maxCapacity : 3;

      if (currentBooked >= maxCap) {
        res.status(409).json({
          error: `Khung giờ ${timeStr} ngày ${dateStr} tại ${showroomName} vừa có khách hàng khác đặt kín chỗ. Quý khách vui lòng chọn khung giờ khác.`
        });
        return;
      }

      // Tạo mã cuộc hẹn duy nhất
      const now = new Date();
      const datePart = now.toISOString().slice(2, 10).replace(/-/g, '');
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const appointmentCode = `DL-${datePart}-${randomSuffix}`;
      const id = `consult-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

      // Ghi lịch tư vấn vào Database thực
      await prisma.$executeRawUnsafe(`
        INSERT INTO "ShowroomConsultations" (
          id, appointment_code, showroom_id, showroom_name, showroom_address,
          customer_name, customer_phone, customer_email, preferred_date, preferred_time,
          notes, product_id, product_name, variant_id, status, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5,
          $6, $7, $8, $9, $10,
          $11, $12, $13, $14, 'CONFIRMED', NOW(), NOW()
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
        variantId ? String(variantId) : null
      );

      res.status(201).json({
        success: true,
        appointmentCode,
        message: `Đặt lịch tư vấn thành công! Mã cuộc hẹn của bạn là ${appointmentCode}.`,
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
  }
};
