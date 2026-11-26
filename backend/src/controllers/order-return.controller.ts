import { Request, Response } from 'express';
import prisma, { withDbRetry } from '../lib/prisma';
import { extractCaller, isOrderAccessibleByCaller } from './order.controller';

export const orderReturnController = {
  /**
   * Khách hàng gửi yêu cầu đổi trả cho 1 hoặc nhiều sản phẩm trong đơn hàng
   * Tự động tách thành các bản ghi OrderReturn độc lập cho từng sản phẩm
   */
  createBulkReturnRequest: async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        orderNumber,
        customerPhone,
        customerName,
        customerEmail,
        customerAddress,
        refundBank,
        items
      } = req.body;

      if (!orderNumber || !items || !Array.isArray(items) || items.length === 0) {
        res.status(400).json({ message: 'Vui lòng cung cấp mã đơn hàng và danh sách sản phẩm cần đổi trả.' });
        return;
      }

      // 1. Kiểm tra đơn hàng gốc
      const order = await withDbRetry(() => prisma.order.findUnique({
        where: { orderNumber },
        include: { items: true }
      }));

      if (!order) {
        res.status(404).json({ message: 'Không tìm thấy thông tin đơn hàng.' });
        return;
      }

      // 2. Kiểm tra quyền sở hữu đơn hàng (Chống IDOR)
      if (!isOrderAccessibleByCaller(order, req)) {
        res.status(403).json({ message: 'Bạn không có quyền yêu cầu đổi trả cho đơn hàng này.' });
        return;
      }

      // 3. Kiểm tra trạng thái đơn: Phải là DELIVERED hoặc COMPLETED
      if (order.status !== 'DELIVERED' && (order.status as any) !== 'COMPLETED') {
        res.status(400).json({ message: 'Chỉ có thể yêu cầu đổi trả cho đơn hàng đã hoàn tất hoặc đã nhận hàng.' });
        return;
      }

      // 4. Lấy thông tin khách hàng
      const caller = extractCaller(req);
      const finalCustomerId = order.customerId || caller.userId || null;
      const finalCustomerName = customerName || (order as any).receiverName || (order as any).customerName || 'Khách hàng';
      const finalCustomerPhone = customerPhone || order.phone || (order as any).receiverPhone || '';
      const finalCustomerEmail = customerEmail || order.email || '';
      const finalCustomerAddress = customerAddress || (order as any).detailAddress || (order as any).shippingAddress || '';

      const createdReturns: any[] = [];
      const timestamp = Date.now().toString().slice(-6);

      for (let i = 0; i < items.length; i++) {
        const itemReq = items[i];
        const targetOrderItem = (order.items || []).find((oi: any) => 
          oi.id === itemReq.orderItemId || 
          oi.productName === itemReq.productName || 
          (oi.sku && oi.sku === itemReq.productSku)
        );

        if (!targetOrderItem && !itemReq.productName) {
          continue;
        }

        const maxQty = targetOrderItem ? targetOrderItem.quantity : 1;
        const reqQty = Math.max(1, Math.min(Number(itemReq.quantity) || 1, maxQty));
        const unitPrice = targetOrderItem ? Number(targetOrderItem.price) : Number(itemReq.unitPrice || 0);
        const totalPrice = unitPrice * reqQty;

        const returnCode = `RMA-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${timestamp}${i + 1}`;
        const returnId = `ret_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`;
        const returnType = itemReq.returnType === 'REFUND' ? 'REFUND' : 'EXCHANGE';
        const refundAmount = returnType === 'REFUND' ? totalPrice : 0;

        const images = Array.isArray(itemReq.images) 
          ? itemReq.images 
          : (typeof itemReq.images === 'string' && itemReq.images ? [itemReq.images] : []);

        const detailedReason = itemReq.detailedReason ? String(itemReq.detailedReason).trim() : '';
        const reason = itemReq.reason || 'Sản phẩm lỗi kỹ thuật do nhà sản xuất';

        // Tạo bản ghi OrderReturn
        await withDbRetry(() => prisma.$executeRawUnsafe(`
          INSERT INTO "OrderReturn" (
            "id", "returnCode", "orderId", "orderNumber", "customerId", "customerName", "customerPhone",
            "customerEmail", "customerAddress", "returnType", "status", "reason", "detailedReason",
            "proofImages", "refundAmount", "refundBankName", "refundAccountNumber", "refundAccountHolder",
            "createdAt", "updatedAt"
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7,
            $8, $9, $10, 'PENDING', $11, $12,
            $13::jsonb, $14, $15, $16, $17,
            NOW(), NOW()
          );
        `,
          returnId, returnCode, order.id, order.orderNumber, finalCustomerId, finalCustomerName, finalCustomerPhone,
          finalCustomerEmail, finalCustomerAddress, returnType, reason, detailedReason,
          JSON.stringify(images), refundAmount, refundBank?.bankName || null, refundBank?.accountNumber || null, refundBank?.accountHolder || null
        ));

        // Tạo bản ghi OrderReturnItem
        const itemId = `ret_item_${Date.now()}_${i}`;
        const prodName = targetOrderItem ? targetOrderItem.productName : (itemReq.productName || 'Sản phẩm');
        const prodSku = targetOrderItem?.sku || itemReq.productSku || null;
        const varName = targetOrderItem?.variantDescription || itemReq.variantName || null;
        const prodImg = targetOrderItem?.imageUrl || itemReq.productImage || null;

        await withDbRetry(() => prisma.$executeRawUnsafe(`
          INSERT INTO "OrderReturnItem" (
            "id", "returnId", "orderItemId", "productId", "productName", "productSku",
            "variantName", "quantity", "unitPrice", "totalPrice", "productImage", "createdAt"
          ) VALUES (
            $1, $2, $3, $4, $5, $6,
            $7, $8, $9, $10, $11, NOW()
          );
        `,
          itemId, returnId, targetOrderItem ? targetOrderItem.id : 'unknown',
          targetOrderItem?.productId || null, prodName, prodSku,
          varName, reqQty, unitPrice, totalPrice, prodImg
        ));

        // Tạo bản ghi OrderReturnTimeline
        const tlId = `ret_tl_${Date.now()}_${i}`;
        const tlTitle = `Khách hàng gửi yêu cầu ${returnType === 'EXCHANGE' ? 'đổi sản phẩm mới' : 'trả hàng hoàn tiền'}`;
        const tlDesc = `Sản phẩm: ${prodName} (SL: ${reqQty}). Lý do: ${reason}. Chi tiết: ${detailedReason || 'Không có mô tả'}.`;

        await withDbRetry(() => prisma.$executeRawUnsafe(`
          INSERT INTO "OrderReturnTimeline" (
            "id", "returnId", "status", "title", "description", "performedBy", "actorType", "createdAt"
          ) VALUES (
            $1, $2, 'PENDING', $3, $4, $5, 'CUSTOMER', NOW()
          );
        `,
          tlId, returnId, tlTitle, tlDesc, finalCustomerName
        ));

        createdReturns.push({
          id: returnId,
          returnCode,
          productName: prodName,
          quantity: reqQty,
          returnType,
          status: 'PENDING'
        });
      }

      // Ghi chú lịch sử đơn hàng gốc: Có yêu cầu đổi trả (TUYỆT ĐỐI KHÔNG ÉP order.status = 'RETURNED')
      await withDbRetry(() => prisma.orderStatusHistory.create({
        data: {
          orderId: order.id,
          status: order.status,
          fromStatus: order.status,
          actorType: 'CUSTOMER',
          notes: `[Yêu cầu Đổi trả mới] Đã tạo ${createdReturns.length} phiếu đổi trả (${createdReturns.map(r => r.returnCode).join(', ')}). Đơn hàng gốc được bảo toàn trạng thái.`
        }
      }));

      res.status(201).json({
        success: true,
        message: `Đã gửi thành công ${createdReturns.length} yêu cầu đổi trả. Hồ sơ đang ở trạng thái Chờ duyệt.`,
        returns: createdReturns
      });
    } catch (error: any) {
      console.error('Lỗi createBulkReturnRequest:', error);
      res.status(500).json({ message: 'Không thể tạo yêu cầu đổi trả.', error: error?.message });
    }
  },

  /**
   * Khách hàng lấy danh sách hồ sơ đổi trả của mình
   */
  getMyReturns: async (req: Request, res: Response): Promise<void> => {
    try {
      const caller = extractCaller(req);
      const queryPhone = req.query.phone as string;
      const headerPhone = req.headers['x-guest-phone'] as string;
      const targetPhone = queryPhone || headerPhone || caller.phone;

      const cleanPhone = (p?: string | null) => (p ? String(p).replace(/[^0-9]/g, '') : '');
      const userPhoneClean = cleanPhone(targetPhone);
      const userId = caller.userId;

      if (!userId && !userPhoneClean) {
        res.json([]);
        return;
      }

      const rows: any[] = await withDbRetry(() => prisma.$queryRawUnsafe(`
        SELECT r.*,
               COALESCE(
                 json_agg(
                   json_build_object(
                     'id', i.id,
                     'orderItemId', i."orderItemId",
                     'productId', i."productId",
                     'productName', i."productName",
                     'productSku', i."productSku",
                     'variantName', i."variantName",
                     'quantity', i.quantity,
                     'unitPrice', i."unitPrice",
                     'totalPrice', i."totalPrice",
                     'productImage', i."productImage"
                   )
                 ) FILTER (WHERE i.id IS NOT NULL), '[]'
               ) as items
        FROM "OrderReturn" r
        LEFT JOIN "OrderReturnItem" i ON r.id = i."returnId"
        WHERE ($1::text IS NOT NULL AND r."customerId" = $1)
           OR ($2::text IS NOT NULL AND regexp_replace(r."customerPhone", '[^0-9]', '', 'g') = $2)
        GROUP BY r.id
        ORDER BY r."createdAt" DESC;
      `, userId || null, userPhoneClean || null));

      // Parse JSON proofImages nếu là string
      const formatted = (rows || []).map(r => ({
        ...r,
        proofImages: typeof r.proofImages === 'string' ? JSON.parse(r.proofImages) : (r.proofImages || []),
        qcChecklist: typeof r.qcChecklist === 'string' ? JSON.parse(r.qcChecklist) : (r.qcChecklist || {})
      }));

      res.json(formatted);
    } catch (error: any) {
      console.error('Lỗi getMyReturns:', error);
      res.status(500).json({ message: 'Không thể lấy danh sách đổi trả.', error: error?.message });
    }
  },

  /**
   * Xem chi tiết 1 hồ sơ đổi trả (Kèm Items & Timeline)
   */
  getReturnDetail: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const rows: any[] = await withDbRetry(() => prisma.$queryRawUnsafe(`
        SELECT r.*,
               COALESCE(
                 json_agg(
                   DISTINCT jsonb_build_object(
                     'id', i.id,
                     'orderItemId', i."orderItemId",
                     'productId', i."productId",
                     'productName', i."productName",
                     'productSku', i."productSku",
                     'variantName', i."variantName",
                     'quantity', i.quantity,
                     'unitPrice', i."unitPrice",
                     'totalPrice', i."totalPrice",
                     'productImage', i."productImage"
                   )
                 ) FILTER (WHERE i.id IS NOT NULL), '[]'::jsonb
               ) as items,
               COALESCE(
                 json_agg(
                   DISTINCT jsonb_build_object(
                     'id', t.id,
                     'status', t.status,
                     'title', t.title,
                     'description', t.description,
                     'performedBy', t."performedBy",
                     'actorType', t."actorType",
                     'createdAt', t."createdAt"
                   )
                 ) FILTER (WHERE t.id IS NOT NULL), '[]'::jsonb
               ) as timelines
        FROM "OrderReturn" r
        LEFT JOIN "OrderReturnItem" i ON r.id = i."returnId"
        LEFT JOIN "OrderReturnTimeline" t ON r.id = t."returnId"
        WHERE r.id = $1 OR r."returnCode" = $1
        GROUP BY r.id
        LIMIT 1;
      `, id));

      if (!rows || rows.length === 0) {
        res.status(404).json({ message: 'Không tìm thấy hồ sơ đổi trả.' });
        return;
      }

      const ret = rows[0];
      ret.proofImages = typeof ret.proofImages === 'string' ? JSON.parse(ret.proofImages) : (ret.proofImages || []);
      ret.qcChecklist = typeof ret.qcChecklist === 'string' ? JSON.parse(ret.qcChecklist) : (ret.qcChecklist || {});

      res.json(ret);
    } catch (error: any) {
      console.error('Lỗi getReturnDetail:', error);
      res.status(500).json({ message: 'Không thể lấy chi tiết đổi trả.', error: error?.message });
    }
  },

  /**
   * ADMIN: Lấy danh sách toàn bộ khiếu nại đổi trả có lọc và đếm theo Tab
   */
  adminGetReturns: async (req: Request, res: Response): Promise<void> => {
    try {
      const { status, returnType, search, page = 1, limit = 50 } = req.query;

      let whereClause = '1=1';
      const params: any[] = [];

      if (status && status !== 'ALL') {
        params.push(status);
        whereClause += ` AND r.status = $${params.length}`;
      }

      if (returnType && returnType !== 'ALL') {
        params.push(returnType);
        whereClause += ` AND r."returnType" = $${params.length}`;
      }

      if (search) {
        params.push(`%${String(search).trim()}%`);
        const idx = params.length;
        whereClause += ` AND (r."returnCode" ILIKE $${idx} OR r."orderNumber" ILIKE $${idx} OR r."customerName" ILIKE $${idx} OR r."customerPhone" ILIKE $${idx})`;
      }

      const offset = (Number(page) - 1) * Number(limit);
      params.push(Number(limit));
      const limitIdx = params.length;
      params.push(offset);
      const offsetIdx = params.length;

      const rows: any[] = await withDbRetry(() => prisma.$queryRawUnsafe(`
        SELECT r.*,
               COALESCE(
                 json_agg(
                   json_build_object(
                     'id', i.id,
                     'orderItemId', i."orderItemId",
                     'productId', i."productId",
                     'productName', i."productName",
                     'productSku', i."productSku",
                     'variantName', i."variantName",
                     'quantity', i.quantity,
                     'unitPrice', i."unitPrice",
                     'totalPrice', i."totalPrice",
                     'productImage', i."productImage"
                   )
                 ) FILTER (WHERE i.id IS NOT NULL), '[]'
               ) as items
        FROM "OrderReturn" r
        LEFT JOIN "OrderReturnItem" i ON r.id = i."returnId"
        WHERE ${whereClause}
        GROUP BY r.id
        ORDER BY r."createdAt" DESC
        LIMIT $${limitIdx} OFFSET $${offsetIdx};
      `, ...params));

      // Đếm số lượng theo từng Tab trạng thái
      const countRows: any[] = await withDbRetry(() => prisma.$queryRawUnsafe(`
        SELECT status, COUNT(*)::int as count
        FROM "OrderReturn"
        GROUP BY status;
      `));

      const counts: Record<string, number> = { ALL: 0 };
      for (const row of countRows) {
        counts[row.status] = Number(row.count);
        counts.ALL += Number(row.count);
      }

      const formatted = (rows || []).map(r => ({
        ...r,
        proofImages: typeof r.proofImages === 'string' ? JSON.parse(r.proofImages) : (r.proofImages || []),
        qcChecklist: typeof r.qcChecklist === 'string' ? JSON.parse(r.qcChecklist) : (r.qcChecklist || {})
      }));

      res.json({
        data: formatted,
        counts,
        pagination: {
          page: Number(page),
          limit: Number(limit)
        }
      });
    } catch (error: any) {
      console.error('Lỗi adminGetReturns:', error);
      res.status(500).json({ message: 'Không thể lấy danh sách đổi trả Admin.', error: error?.message });
    }
  },

  /**
   * ADMIN: CSKH duyệt yêu cầu thu hồi (PENDING -> APPROVED)
   */
  adminApproveReturn: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { staffName = 'CSKH DCor', notes = 'Đã phê duyệt yêu cầu thu hồi hàng' } = req.body;

      const retRows: any[] = await prisma.$queryRawUnsafe(`SELECT * FROM "OrderReturn" WHERE id = $1 LIMIT 1;`, id);
      if (!retRows || retRows.length === 0) {
        res.status(404).json({ message: 'Không tìm thấy hồ sơ đổi trả.' });
        return;
      }

      await prisma.$executeRawUnsafe(`
        UPDATE "OrderReturn"
        SET status = 'APPROVED', "updatedAt" = NOW()
        WHERE id = $1;
      `, id);

      await prisma.$executeRawUnsafe(`
        INSERT INTO "OrderReturnTimeline" ("id", "returnId", "status", "title", "description", "performedBy", "actorType", "createdAt")
        VALUES ($1, $2, 'APPROVED', 'CSKH đã duyệt yêu cầu thu hồi', $3, $4, 'STAFF', NOW());
      `, `tl_${Date.now()}`, id, notes, staffName);

      res.json({ success: true, message: 'Đã duyệt yêu cầu thu hồi hàng thành công.' });
    } catch (error: any) {
      console.error('Lỗi adminApproveReturn:', error);
      res.status(500).json({ message: 'Không thể duyệt yêu cầu.', error: error?.message });
    }
  },

  /**
   * ADMIN: CSKH từ chối yêu cầu (PENDING -> REJECTED)
   */
  adminRejectReturn: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { reason, staffName = 'CSKH DCor' } = req.body;

      if (!reason || !reason.trim()) {
        res.status(400).json({ message: 'Vui lòng cung cấp lý do từ chối khiếu nại.' });
        return;
      }

      await prisma.$executeRawUnsafe(`
        UPDATE "OrderReturn"
        SET status = 'REJECTED', "rejectReason" = $1, "rejectedAt" = NOW(), "updatedAt" = NOW()
        WHERE id = $2;
      `, reason.trim(), id);

      await prisma.$executeRawUnsafe(`
        INSERT INTO "OrderReturnTimeline" ("id", "returnId", "status", "title", "description", "performedBy", "actorType", "createdAt")
        VALUES ($1, $2, 'REJECTED', 'Đã từ chối yêu cầu đổi trả', $3, $4, 'STAFF', NOW());
      `, `tl_${Date.now()}`, id, `Lý do từ chối: ${reason.trim()}`, staffName);

      res.json({ success: true, message: 'Đã từ chối yêu cầu đổi trả.' });
    } catch (error: any) {
      console.error('Lỗi adminRejectReturn:', error);
      res.status(500).json({ message: 'Không thể từ chối yêu cầu.', error: error?.message });
    }
  },

  /**
   * ADMIN: Điều phối xe / cập nhật thông tin thu hồi (APPROVED -> RETURNING)
   */
  adminDispatchPickup: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const {
        shippingProvider = 'Đội xe nội bộ DCor Express',
        driverName,
        driverPhone,
        trackingNumber,
        pickupDate,
        pickupAddress,
        staffName = 'Điều phối viên DCor'
      } = req.body;

      await prisma.$executeRawUnsafe(`
        UPDATE "OrderReturn"
        SET status = 'RETURNING',
            "shippingProvider" = $1,
            "driverName" = $2,
            "driverPhone" = $3,
            "trackingNumber" = $4,
            "pickupDate" = $5::timestamptz,
            "pickupAddress" = $6,
            "updatedAt" = NOW()
        WHERE id = $7;
      `,
        shippingProvider, driverName || null, driverPhone || null,
        trackingNumber || null, pickupDate ? new Date(pickupDate).toISOString() : new Date().toISOString(),
        pickupAddress || null, id
      );

      await prisma.$executeRawUnsafe(`
        INSERT INTO "OrderReturnTimeline" ("id", "returnId", "status", "title", "description", "performedBy", "actorType", "createdAt")
        VALUES ($1, $2, 'RETURNING', 'Đang thu hồi hàng về kho', $3, $4, 'STAFF', NOW());
      `, `tl_${Date.now()}`, id, `Đơn vị vận chuyển: ${shippingProvider}. Tài xế: ${driverName || 'Chưa cập nhật'} (${driverPhone || ''})`, staffName);

      res.json({ success: true, message: 'Đã cập nhật lịch thu hồi hàng thành công.' });
    } catch (error: any) {
      console.error('Lỗi adminDispatchPickup:', error);
      res.status(500).json({ message: 'Không thể cập nhật lịch thu hồi.', error: error?.message });
    }
  },

  /**
   * ADMIN: Thủ kho kiểm định QC hàng hoàn (RETURNING -> RECEIVED)
   */
  adminQcInspection: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const {
        qcPassed = true,
        qcGrade = 'GRADE_A',
        qcChecklist = {},
        qcNotes = '',
        inspectorName = 'Thủ kho DCor'
      } = req.body;

      await prisma.$executeRawUnsafe(`
        UPDATE "OrderReturn"
        SET status = 'RECEIVED',
            "qcPassed" = $1,
            "qcGrade" = $2,
            "qcChecklist" = $3::jsonb,
            "qcNotes" = $4,
            "inspectorName" = $5,
            "updatedAt" = NOW()
        WHERE id = $6;
      `,
        Boolean(qcPassed), qcGrade, JSON.stringify(qcChecklist), qcNotes, inspectorName, id
      );

      const gradeText = qcGrade === 'GRADE_A' ? 'Loại A (Tái nhập bán mới)' : (qcGrade === 'GRADE_B' ? 'Loại B (Sửa chữa bảo trì)' : 'Loại C (Xuất hủy)');
      await prisma.$executeRawUnsafe(`
        INSERT INTO "OrderReturnTimeline" ("id", "returnId", "status", "title", "description", "performedBy", "actorType", "createdAt")
        VALUES ($1, $2, 'RECEIVED', 'Đã tiếp nhận hàng tại kho & Hoàn tất QC', $3, $4, 'STAFF', NOW());
      `, `tl_${Date.now()}`, id, `Kết quả QC: ${qcPassed ? 'ĐẠT CHUẨN' : 'KHÔNG ĐẠT'}. Phân loại: ${gradeText}. Ghi chú: ${qcNotes || 'Không có'}`, inspectorName);

      res.json({ success: true, message: 'Đã lưu kết quả nghiệm thu QC thành công.' });
    } catch (error: any) {
      console.error('Lỗi adminQcInspection:', error);
      res.status(500).json({ message: 'Không thể lưu kết quả QC.', error: error?.message });
    }
  },

  /**
   * ADMIN: Kích hoạt đơn hàng đổi mới vật lý (RECEIVED -> EXCHANGING)
   * Tự động sinh bản ghi Order thật trong Database để kho xuất hàng
   */
  adminExecuteExchange: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { staffName = 'Điều phối kho DCor' } = req.body;

      const retRows: any[] = await prisma.$queryRawUnsafe(`
        SELECT r.*,
               COALESCE(
                 json_agg(
                   json_build_object(
                     'productName', i."productName",
                     'productSku', i."productSku",
                     'variantName', i."variantName",
                     'quantity', i.quantity,
                     'unitPrice', i."unitPrice",
                     'productImage', i."productImage"
                   )
                 ) FILTER (WHERE i.id IS NOT NULL), '[]'
               ) as items
        FROM "OrderReturn" r
        LEFT JOIN "OrderReturnItem" i ON r.id = i."returnId"
        WHERE r.id = $1
        GROUP BY r.id
        LIMIT 1;
      `, id);

      if (!retRows || retRows.length === 0) {
        res.status(404).json({ message: 'Không tìm thấy hồ sơ đổi trả.' });
        return;
      }

      const ret = retRows[0];
      const items = typeof ret.items === 'string' ? JSON.parse(ret.items) : (ret.items || []);
      const firstItem = items[0] || {};

      // Sinh mã đơn hàng đổi mới
      const newOrderNumber = `DCOR-EXC-${Date.now().toString().slice(-6)}`;
      const newOrderId = `ord_exc_${Date.now()}`;

      // Tạo Order thật trong PostgreSQL
      await prisma.order.create({
        data: {
          id: newOrderId,
          orderNumber: newOrderNumber,
          customerId: ret.customerId || null,
          receiverName: ret.customerName || 'Khách hàng',
          phone: ret.customerPhone,
          email: ret.customerEmail || null,
          province: 'TP. Hồ Chí Minh',
          detailAddress: ret.customerAddress || 'Showroom DCOR',
          status: 'PROCESSING',
          subTotal: BigInt(0),
          totalAmount: BigInt(0),
          shippingFee: BigInt(0),
          paymentMethod: 'BANK_TRANSFER',
          paymentStatus: 'PAID',
          discountAmount: BigInt(0),
          notes: `Đơn hàng đổi mới bảo hành cho phiếu khiếu nại ${ret.returnCode} (Đơn gốc #${ret.orderNumber})`,
          items: {
            create: items.map((it: any) => ({
              productName: it.productName || 'Sản phẩm đổi mới',
              productId: it.productId || 'default',
              sku: it.productSku || 'EXC-SKU',
              variantDescription: it.variantName || 'Mặc định',
              quantity: it.quantity || 1,
              price: 0,
              lineTotal: BigInt(0),
              imageUrl: it.productImage || ''
            }))
          },
          statusHistory: {
            create: {
              status: 'PROCESSING',
              fromStatus: 'PENDING',
              actorType: 'STAFF',
              notes: `Tự động sinh đơn hàng đổi mới từ phiếu đổi trả ${ret.returnCode}`
            }
          }
        }
      });

      // Cập nhật OrderReturn sang EXCHANGING
      await prisma.$executeRawUnsafe(`
        UPDATE "OrderReturn"
        SET status = 'EXCHANGING',
            "replacementOrderId" = $1,
            "replacementOrderNumber" = $2,
            "updatedAt" = NOW()
        WHERE id = $3;
      `, newOrderId, newOrderNumber, id);

      await prisma.$executeRawUnsafe(`
        INSERT INTO "OrderReturnTimeline" ("id", "returnId", "status", "title", "description", "performedBy", "actorType", "createdAt")
        VALUES ($1, $2, 'EXCHANGING', 'Đã tạo đơn hàng đổi mới vật lý', $3, $4, 'STAFF', NOW());
      `, `tl_${Date.now()}`, id, `Đã kích hoạt đơn hàng xuất kho mới #${newOrderNumber}. Bộ phận đóng gói đang chuẩn bị giao.`, staffName);

      res.json({
        success: true,
        message: `Đã kích hoạt đơn hàng đổi mới #${newOrderNumber} thành công!`,
        orderNumber: newOrderNumber,
        orderId: newOrderId
      });
    } catch (error: any) {
      console.error('Lỗi adminExecuteExchange:', error);
      res.status(500).json({ message: 'Không thể kích hoạt đơn hàng đổi mới.', error: error?.message });
    }
  },

  /**
   * ADMIN: Kế toán nộp bill hoàn tiền (RECEIVED -> REFUNDING -> COMPLETED)
   */
  adminExecuteRefund: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const {
        refundProofImage,
        refundBankName,
        refundAccountNumber,
        refundAccountHolder,
        refundAmount,
        staffName = 'Kế toán DCor'
      } = req.body;

      await prisma.$executeRawUnsafe(`
        UPDATE "OrderReturn"
        SET status = 'COMPLETED',
            "refundProofImage" = $1,
            "refundBankName" = COALESCE($2, "refundBankName"),
            "refundAccountNumber" = COALESCE($3, "refundAccountNumber"),
            "refundAccountHolder" = COALESCE($4, "refundAccountHolder"),
            "refundAmount" = COALESCE($5, "refundAmount"),
            "refundedAt" = NOW(),
            "completedAt" = NOW(),
            "updatedAt" = NOW()
        WHERE id = $6;
      `,
        refundProofImage || null, refundBankName || null,
        refundAccountNumber || null, refundAccountHolder || null,
        refundAmount !== undefined ? Number(refundAmount) : null,
        id
      );

      await prisma.$executeRawUnsafe(`
        INSERT INTO "OrderReturnTimeline" ("id", "returnId", "status", "title", "description", "performedBy", "actorType", "createdAt")
        VALUES ($1, $2, 'COMPLETED', 'Đã chuyển khoản hoàn tiền & Hoàn tất khiếu nại', $3, $4, 'STAFF', NOW());
      `, `tl_${Date.now()}`, id, `Kế toán đã hoàn tất lệnh chuyển tiền hoàn trả vào tài khoản khách hàng. Hồ sơ khiếu nại đóng thành công.`, staffName);

      res.json({ success: true, message: 'Đã hoàn tất chuyển khoản và đóng phiếu khiếu nại.' });
    } catch (error: any) {
      console.error('Lỗi adminExecuteRefund:', error);
      res.status(500).json({ message: 'Không thể hoàn tất hoàn tiền.', error: error?.message });
    }
  },

  /**
   * ADMIN: Đóng phiếu đổi trả (EXCHANGING / SHIPPED -> COMPLETED)
   */
  adminCompleteReturn: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { staffName = 'CSKH DCor' } = req.body;

      await prisma.$executeRawUnsafe(`
        UPDATE "OrderReturn"
        SET status = 'COMPLETED', "completedAt" = NOW(), "updatedAt" = NOW()
        WHERE id = $1;
      `, id);

      await prisma.$executeRawUnsafe(`
        INSERT INTO "OrderReturnTimeline" ("id", "returnId", "status", "title", "description", "performedBy", "actorType", "createdAt")
        VALUES ($1, $2, 'COMPLETED', 'Hồ sơ đổi trả đã hoàn tất thành công', 'Khách hàng đã nhận được sản phẩm đổi mới / tiền hoàn.', $3, 'STAFF', NOW());
      `, `tl_${Date.now()}`, id, staffName);

      res.json({ success: true, message: 'Đã hoàn tất đóng hồ sơ đổi trả.' });
    } catch (error: any) {
      console.error('Lỗi adminCompleteReturn:', error);
      res.status(500).json({ message: 'Không thể hoàn tất hồ sơ.', error: error?.message });
    }
  }
};
