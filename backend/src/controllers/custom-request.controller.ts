import { Request, Response } from 'express';
import prisma, { withDbRetry } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth.middleware';

/**
 * Helper format một record CustomRequest từ DB sang dạng JSON object chuẩn cho Frontend
 */
function formatCustomRequest(row: any, timelineList: any[] = []): any {
  if (!row) return null;
  return {
    id: row.id,
    code: row.code,
    customerId: row.customerId || undefined,
    customerName: row.customerName,
    customerPhone: row.customerPhone,
    customerEmail: row.customerEmail || undefined,
    customerAddress: row.customerAddress || undefined,
    isPhoneVerified: Boolean(row.isPhoneVerified),

    productId: row.productId || undefined,
    productName: row.productName,
    productSku: row.productSku || undefined,
    productImage: row.productImage || undefined,
    categoryName: row.categoryName || undefined,
    basePrice: row.basePrice !== null ? Number(row.basePrice) : undefined,

    hasDimensions: row.hasDimensions !== null ? Boolean(row.hasDimensions) : true,
    originalDimensions: row.originalDimensions || undefined,
    requestedDimensions: row.requestedDimensions || undefined,
    customDimensionNote: row.customDimensionNote || undefined,
    length: row.length !== null ? Number(row.length) : undefined,
    width: row.width !== null ? Number(row.width) : undefined,
    height: row.height !== null ? Number(row.height) : undefined,

    customizedAttributes: Array.isArray(row.customizedAttributes)
      ? row.customizedAttributes
      : typeof row.customizedAttributes === 'string'
      ? JSON.parse(row.customizedAttributes || '[]')
      : [],
    colorName: row.colorName || undefined,
    colorHex: row.colorHex || undefined,
    colorImage: row.colorImage || undefined,
    material: row.material || undefined,
    legMaterial: row.legMaterial || undefined,

    notes: row.notes || undefined,
    requirementDetails: row.requirementDetails || undefined,
    budgetRange: row.budgetRange || undefined,
    estimatedBudget: row.estimatedBudget || undefined,
    preferredSurveyTime: row.preferredSurveyTime || undefined,
    expectedDeliveryDate: row.expectedDeliveryDate || undefined,
    roomSpace: row.roomSpace || undefined,

    attachments: Array.isArray(row.attachments)
      ? row.attachments
      : typeof row.attachments === 'string'
      ? JSON.parse(row.attachments || '[]')
      : [],
    referenceImages: Array.isArray(row.referenceImages)
      ? row.referenceImages
      : typeof row.referenceImages === 'string'
      ? JSON.parse(row.referenceImages || '[]')
      : [],

    status: row.status,
    assignedStaff: row.assignedStaff || undefined,
    assignedStaffId: row.assignedStaffId || undefined,
    adminNotes: row.adminNotes || undefined,

    surveyNotes: row.surveyNotes || undefined,
    surveyAttachment: row.surveyAttachment
      ? typeof row.surveyAttachment === 'string'
        ? JSON.parse(row.surveyAttachment)
        : row.surveyAttachment
      : undefined,
    surveyDate: row.surveyDate ? new Date(row.surveyDate).toISOString() : undefined,

    drawing3dUrl: row.drawing3dUrl || undefined,
    drawing3dUrls: Array.isArray(row.drawing3dUrls)
      ? row.drawing3dUrls
      : typeof row.drawing3dUrls === 'string'
      ? JSON.parse(row.drawing3dUrls || '[]')
      : [],

    quotedPrice: row.quotedPrice !== null ? Number(row.quotedPrice) : undefined,
    quotedDeposit: row.quotedDeposit !== null ? Number(row.quotedDeposit) : undefined,
    quotedAt: row.quotedAt ? new Date(row.quotedAt).toISOString() : undefined,
    estimatedProductionDays: row.estimatedProductionDays !== null ? Number(row.estimatedProductionDays) : 15,

    contractScanUrl: row.contractScanUrl || undefined,
    contractSignedAt: row.contractSignedAt ? new Date(row.contractSignedAt).toISOString() : undefined,
    contractSignerName: row.contractSignerName || undefined,

    depositProofImage: row.depositProofImage || undefined,
    depositProofNote: row.depositProofNote || undefined,
    depositPaidAt: row.depositPaidAt ? new Date(row.depositPaidAt).toISOString() : undefined,

    cancelReason: row.cancelReason || undefined,
    cancelledAt: row.cancelledAt ? new Date(row.cancelledAt).toISOString() : undefined,
    cancelledBy: row.cancelledBy || undefined,

    qcPassedAt: row.qcPassedAt ? new Date(row.qcPassedAt).toISOString() : undefined,
    qcInspector: row.qcInspector || undefined,
    qcChecklist: row.qcChecklist
      ? typeof row.qcChecklist === 'string'
        ? JSON.parse(row.qcChecklist)
        : row.qcChecklist
      : undefined,

    warrantyCode: row.warrantyCode || undefined,
    warrantyMonths: row.warrantyMonths !== null ? Number(row.warrantyMonths) : 24,
    warrantyFrameYears: row.warrantyFrameYears !== null ? Number(row.warrantyFrameYears) : 10,
    warrantySurfaceYears: row.warrantySurfaceYears !== null ? Number(row.warrantySurfaceYears) : 3,
    warrantyPolicy: row.warrantyPolicy || undefined,
    deliveredAt: row.deliveredAt ? new Date(row.deliveredAt).toISOString() : undefined,
    finalPaymentReceived: Boolean(row.finalPaymentReceived),

    generatedOrderNumber: row.generatedOrderNumber || undefined,
    orderId: row.orderId || undefined,
    workOrderCode: row.workOrderCode || undefined,
    customVariantId: row.customVariantId || undefined,
    customVariant: row.customVariant
      ? typeof row.customVariant === 'string'
        ? JSON.parse(row.customVariant)
      : row.customVariant
      : undefined,

    createdAt: new Date(row.createdAt).toISOString(),
    updatedAt: new Date(row.updatedAt).toISOString(),
    timeline: (timelineList || []).map(t => ({
      id: t.id,
      status: t.status,
      title: t.title,
      description: t.description || '',
      timestamp: new Date(t.timestamp || t.createdAt).toISOString(),
      performedBy: t.performedBy || 'Hệ thống',
      actorType: t.actorType || 'SYSTEM'
    }))
  };
}

/**
 * Sinh mã code duy nhất dạng CR-0005 hoặc CR-YYYYMM-XXXX
 */
async function generateNextCustomCode(): Promise<string> {
  try {
    const rows: any[] = await prisma.$queryRawUnsafe(`
      SELECT "code" FROM "CustomRequest" ORDER BY "createdAt" DESC LIMIT 10
    `);
    
    // Tìm các code dạng CR-XXXX
    let maxNum = 0;
    for (const r of rows) {
      const match = (r.code || '').match(/CR-(\d+)/i);
      if (match && match[1]) {
        const val = parseInt(match[1], 10);
        if (val > maxNum) maxNum = val;
      }
    }

    const nextNum = maxNum + 1;
    return `CR-${String(nextNum).padStart(4, '0')}`;
  } catch (_) {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    return `CR-${randomSuffix}`;
  }
}

export const customRequestController = {
  /**
   * [ADMIN] Lấy toàn bộ danh sách đơn may đo (có phân trang, tìm kiếm, lọc trạng thái)
   */
  async getAdminCustomRequests(req: Request, res: Response): Promise<void> {
    try {
      const { status, search, staffId, page = 1, limit = 50 } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      let whereClause = 'WHERE 1=1';
      const params: any[] = [];

      if (status && status !== 'ALL') {
        params.push(status);
        whereClause += ` AND "status" = $${params.length}`;
      }

      if (staffId) {
        params.push(staffId);
        whereClause += ` AND "assignedStaffId" = $${params.length}`;
      }

      if (search && String(search).trim()) {
        params.push(`%${String(search).trim()}%`);
        const pIdx = params.length;
        whereClause += ` AND (
          "code" ILIKE $${pIdx} OR
          "customerName" ILIKE $${pIdx} OR
          "customerPhone" ILIKE $${pIdx} OR
          "customerEmail" ILIKE $${pIdx} OR
          "productName" ILIKE $${pIdx}
        )`;
      }

      const countSql = `SELECT COUNT(*)::int as count FROM "CustomRequest" ${whereClause}`;
      const totalCountRes: any[] = await prisma.$queryRawUnsafe(countSql, ...params);
      const total = Number(totalCountRes[0]?.count || 0);

      const listSql = `
        SELECT * FROM "CustomRequest"
        ${whereClause}
        ORDER BY "createdAt" DESC
        LIMIT ${Number(limit)} OFFSET ${offset}
      `;
      const rows: any[] = await prisma.$queryRawUnsafe(listSql, ...params);

      // Lấy timeline tương ứng cho các đơn
      const requestIds = rows.map(r => r.id);
      let timelineMap: Record<string, any[]> = {};

      if (requestIds.length > 0) {
        const inClause = requestIds.map((_, i) => `$${i + 1}`).join(',');
        const timelines: any[] = await prisma.$queryRawUnsafe(`
          SELECT * FROM "CustomRequestTimeline"
          WHERE "requestId" IN (${inClause})
          ORDER BY "timestamp" ASC
        `, ...requestIds);

        for (const t of timelines) {
          if (!timelineMap[t.requestId]) timelineMap[t.requestId] = [];
          timelineMap[t.requestId].push(t);
        }
      }

      const data = rows.map(r => formatCustomRequest(r, timelineMap[r.id] || []));

      // Thống kê số lượng theo từng trạng thái để làm badge UI
      const statsRes: any[] = await prisma.$queryRawUnsafe(`
        SELECT "status", COUNT(*)::int as count FROM "CustomRequest" GROUP BY "status"
      `);
      const statusCounts: Record<string, number> = {};
      for (const s of statsRes) {
        statusCounts[s.status] = Number(s.count);
      }

      res.json({
        success: true,
        data,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit))
        },
        statusCounts
      });
    } catch (error: any) {
      console.error('[customRequestController.getAdminCustomRequests] Error:', error);
      res.status(500).json({ success: false, message: 'Lỗi tải danh sách yêu cầu may đo', error: error.message });
    }
  },

  /**
   * [CUSTOMER] Lấy danh sách yêu cầu may đo của chính khách hàng hiện tại
   * (Xác thực qua JWT token hoặc tìm theo customerId / email / phone)
   */
  async getMyCustomRequests(req: AuthRequest, res: Response): Promise<void> {
    try {
      const user = req.user;
      const phoneParam = req.query.phone as string;
      const emailParam = req.query.email as string;

      let whereClause = 'WHERE 1=0'; // mặc định an toàn
      const params: any[] = [];

      if (user) {
        const conds: string[] = [];
        if (user.id) {
          params.push(user.id);
          conds.push(`"customerId" = $${params.length}`);
        }
        if (user.phone) {
          params.push(user.phone);
          conds.push(`"customerPhone" = $${params.length}`);
        }
        if (user.email) {
          params.push(user.email.toLowerCase());
          conds.push(`LOWER("customerEmail") = $${params.length}`);
        }
        if (conds.length > 0) {
          whereClause = `WHERE (${conds.join(' OR ')})`;
        }
      } else if (phoneParam || emailParam) {
        const conds: string[] = [];
        if (phoneParam) {
          params.push(phoneParam);
          conds.push(`"customerPhone" = $${params.length}`);
        }
        if (emailParam) {
          params.push(emailParam.toLowerCase());
          conds.push(`LOWER("customerEmail") = $${params.length}`);
        }
        whereClause = `WHERE (${conds.join(' OR ')})`;
      }

      const listSql = `
        SELECT * FROM "CustomRequest"
        ${whereClause}
        ORDER BY "createdAt" DESC
      `;
      const rows: any[] = await prisma.$queryRawUnsafe(listSql, ...params);

      const requestIds = rows.map(r => r.id);
      let timelineMap: Record<string, any[]> = {};

      if (requestIds.length > 0) {
        const inClause = requestIds.map((_, i) => `$${i + 1}`).join(',');
        const timelines: any[] = await prisma.$queryRawUnsafe(`
          SELECT * FROM "CustomRequestTimeline"
          WHERE "requestId" IN (${inClause})
          ORDER BY "timestamp" ASC
        `, ...requestIds);

        for (const t of timelines) {
          if (!timelineMap[t.requestId]) timelineMap[t.requestId] = [];
          timelineMap[t.requestId].push(t);
        }
      }

      const data = rows.map(r => formatCustomRequest(r, timelineMap[r.id] || []));
      res.json({ success: true, data });
    } catch (error: any) {
      console.error('[customRequestController.getMyCustomRequests] Error:', error);
      res.status(500).json({ success: false, message: 'Lỗi tải danh sách yêu cầu cá nhân', error: error.message });
    }
  },

  /**
   * [CHUNG] Lấy chi tiết 1 hồ sơ CustomRequest theo ID hoặc CODE
   */
  async getCustomRequestDetail(req: Request, res: Response): Promise<void> {
    try {
      const { idOrCode } = req.params;
      const rows: any[] = await prisma.$queryRawUnsafe(`
        SELECT * FROM "CustomRequest" WHERE "id" = $1 OR "code" = $1 LIMIT 1
      `, idOrCode);

      if (rows.length === 0) {
        res.status(404).json({ success: false, message: 'Không tìm thấy hồ sơ yêu cầu may đo' });
        return;
      }

      const item = rows[0];
      const timelines: any[] = await prisma.$queryRawUnsafe(`
        SELECT * FROM "CustomRequestTimeline" WHERE "requestId" = $1 ORDER BY "timestamp" ASC
      `, item.id);

      const data = formatCustomRequest(item, timelines);
      res.json({ success: true, data });
    } catch (error: any) {
      console.error('[customRequestController.getCustomRequestDetail] Error:', error);
      res.status(500).json({ success: false, message: 'Lỗi lấy chi tiết yêu cầu', error: error.message });
    }
  },

  /**
   * [STORE / CUSTOMER] Tạo mới yêu cầu may đo từ Website
   */
  async createCustomRequest(req: AuthRequest, res: Response): Promise<void> {
    try {
      const payload = req.body;
      const code = payload.code || (await generateNextCustomCode());
      const id = payload.id || `cr-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      const customerId = req.user?.id || payload.customerId || null;
      const customerEmail = req.user?.email || payload.customerEmail || null;
      const customerName = payload.customerName || req.user?.fullName || 'Khách hàng';
      const customerPhone = payload.customerPhone || req.user?.phone || '';

      const basePrice = payload.basePrice ? Number(payload.basePrice) : 0;
      const length = payload.length ? Number(payload.length) : null;
      const width = payload.width ? Number(payload.width) : null;
      const height = payload.height ? Number(payload.height) : null;

      // Làm sạch danh sách ảnh: loại bỏ triệt để các URL tạm blob: hoặc data:
      const cleanRefImages = Array.isArray(payload.referenceImages)
        ? payload.referenceImages.filter((u: any) => typeof u === 'string' && !u.startsWith('blob:') && !u.startsWith('data:'))
        : [];
      const cleanAttachments = Array.isArray(payload.attachments)
        ? payload.attachments.filter((a: any) => a && (!a.previewUrl || (!a.previewUrl.startsWith('blob:') && !a.previewUrl.startsWith('data:'))))
        : [];
      let cleanProdImage = payload.productImage || null;
      if (cleanProdImage && (cleanProdImage.startsWith('blob:') || cleanProdImage.startsWith('data:'))) {
        cleanProdImage = null;
      }

      await withDbRetry(async () => {
        await prisma.$executeRawUnsafe(`
          INSERT INTO "CustomRequest" (
            "id", "code", "customerId", "customerName", "customerPhone", "customerEmail", "customerAddress", "isPhoneVerified",
            "productId", "productName", "productSku", "productImage", "categoryName", "basePrice",
            "hasDimensions", "originalDimensions", "requestedDimensions", "customDimensionNote",
            "length", "width", "height", "customizedAttributes",
            "colorName", "colorHex", "colorImage", "material", "legMaterial",
            "notes", "requirementDetails", "budgetRange", "estimatedBudget", "preferredSurveyTime", "expectedDeliveryDate", "roomSpace",
            "attachments", "referenceImages", "status"
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8,
            $9, $10, $11, $12, $13, $14,
            $15, $16, $17, $18,
            $19, $20, $21, $22::jsonb,
            $23, $24, $25, $26, $27,
            $28, $29, $30, $31, $32, $33, $34,
            $35::jsonb, $36::jsonb, 'PENDING_REVIEW'
          )
        `,
          id, code, customerId, customerName, customerPhone, customerEmail, payload.customerAddress || null, Boolean(payload.isPhoneVerified),
          payload.productId || null, payload.productName || 'Sản phẩm may đo riêng', payload.productSku || null, cleanProdImage, payload.categoryName || null, basePrice,
          payload.hasDimensions ?? true, payload.originalDimensions || null, payload.requestedDimensions || null, payload.customDimensionNote || null,
          length, width, height, JSON.stringify(payload.customizedAttributes || []),
          payload.colorName || null, payload.colorHex || null, payload.colorImage || null, payload.material || null, payload.legMaterial || null,
          payload.notes || null, payload.requirementDetails || null, payload.budgetRange || null, payload.estimatedBudget || null, payload.preferredSurveyTime || null, payload.expectedDeliveryDate || null, payload.roomSpace || null,
          JSON.stringify(cleanAttachments), JSON.stringify(cleanRefImages)
        );

        // Tạo mốc timeline đầu tiên
        const timelineId = `ctl-${Date.now()}`;
        await prisma.$executeRawUnsafe(`
          INSERT INTO "CustomRequestTimeline" (
            "id", "requestId", "status", "title", "description", "performedBy", "actorType"
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        `,
          timelineId, id, 'PENDING_REVIEW', 'Khách hàng gửi yêu cầu may đo',
          `Khách hàng ${customerName} đã gửi form yêu cầu may đo sản phẩm ${payload.productName || ''} qua website.`,
          customerName, 'CUSTOMER'
        );
      });

      // Lấy bản ghi hoàn chỉnh trả về
      const createdRows: any[] = await prisma.$queryRawUnsafe(`SELECT * FROM "CustomRequest" WHERE "id" = $1`, id);
      const timelines: any[] = await prisma.$queryRawUnsafe(`SELECT * FROM "CustomRequestTimeline" WHERE "requestId" = $1`, id);

      res.status(201).json({
        success: true,
        message: 'Gửi yêu cầu may đo thành công',
        data: formatCustomRequest(createdRows[0], timelines)
      });
    } catch (error: any) {
      console.error('[customRequestController.createCustomRequest] Error:', error);
      res.status(500).json({ success: false, message: 'Lỗi tạo yêu cầu may đo', error: error.message });
    }
  },

  /**
   * [ADMIN] Cập nhật tiến trình CustomRequest (Phân công KTS, Báo giá, Hợp đồng, QC, Bàn giao...)
   */
  async updateAdminCustomRequest(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const body = req.body;

      const existingRows: any[] = await prisma.$queryRawUnsafe(`SELECT * FROM "CustomRequest" WHERE "id" = $1`, id);
      if (existingRows.length === 0) {
        res.status(404).json({ success: false, message: 'Không tìm thấy hồ sơ yêu cầu' });
        return;
      }
      const oldItem = existingRows[0];

      // Chuẩn bị các giá trị cập nhật
      const status = body.status || oldItem.status;
      const assignedStaff = body.assignedStaff !== undefined ? body.assignedStaff : oldItem.assignedStaff;
      const assignedStaffId = body.assignedStaffId !== undefined ? body.assignedStaffId : oldItem.assignedStaffId;
      const adminNotes = body.adminNotes !== undefined ? body.adminNotes : oldItem.adminNotes;
      const surveyNotes = body.surveyNotes !== undefined ? body.surveyNotes : oldItem.surveyNotes;
      const surveyDate = body.surveyDate ? new Date(body.surveyDate) : (oldItem.surveyDate ? new Date(oldItem.surveyDate) : null);
      const drawing3dUrl = body.drawing3dUrl !== undefined ? body.drawing3dUrl : oldItem.drawing3dUrl;
      const drawing3dUrls = body.drawing3dUrls ? JSON.stringify(body.drawing3dUrls) : JSON.stringify(oldItem.drawing3dUrls || []);
      const quotedPrice = body.quotedPrice !== undefined ? Number(body.quotedPrice) : (oldItem.quotedPrice !== null ? Number(oldItem.quotedPrice) : null);
      const quotedDeposit = body.quotedDeposit !== undefined ? Number(body.quotedDeposit) : (oldItem.quotedDeposit !== null ? Number(oldItem.quotedDeposit) : null);
      const quotedAt = body.quotedAt ? new Date(body.quotedAt) : (oldItem.quotedAt ? new Date(oldItem.quotedAt) : null);
      const estimatedProductionDays = body.estimatedProductionDays !== undefined ? Number(body.estimatedProductionDays) : oldItem.estimatedProductionDays;
      const contractScanUrl = body.contractScanUrl !== undefined ? body.contractScanUrl : oldItem.contractScanUrl;
      const contractSignedAt = body.contractSignedAt ? new Date(body.contractSignedAt) : (oldItem.contractSignedAt ? new Date(oldItem.contractSignedAt) : null);
      const contractSignerName = body.contractSignerName !== undefined ? body.contractSignerName : oldItem.contractSignerName;
      const depositProofImage = body.depositProofImage !== undefined ? body.depositProofImage : oldItem.depositProofImage;
      const depositProofNote = body.depositProofNote !== undefined ? body.depositProofNote : oldItem.depositProofNote;
      const depositPaidAt = body.depositPaidAt ? new Date(body.depositPaidAt) : (oldItem.depositPaidAt ? new Date(oldItem.depositPaidAt) : null);
      const cancelReason = body.cancelReason !== undefined ? body.cancelReason : oldItem.cancelReason;
      const cancelledAt = body.cancelledAt ? new Date(body.cancelledAt) : (oldItem.cancelledAt ? new Date(oldItem.cancelledAt) : null);
      const cancelledBy = body.cancelledBy !== undefined ? body.cancelledBy : oldItem.cancelledBy;
      const qcPassedAt = body.qcPassedAt ? new Date(body.qcPassedAt) : (oldItem.qcPassedAt ? new Date(oldItem.qcPassedAt) : null);
      const qcInspector = body.qcInspector !== undefined ? body.qcInspector : oldItem.qcInspector;
      const qcChecklist = body.qcChecklist ? JSON.stringify(body.qcChecklist) : (oldItem.qcChecklist ? JSON.stringify(oldItem.qcChecklist) : null);
      const warrantyCode = body.warrantyCode !== undefined ? body.warrantyCode : oldItem.warrantyCode;
      const warrantyMonths = body.warrantyMonths !== undefined ? Number(body.warrantyMonths) : oldItem.warrantyMonths;
      const warrantyFrameYears = body.warrantyFrameYears !== undefined ? Number(body.warrantyFrameYears) : oldItem.warrantyFrameYears;
      const warrantySurfaceYears = body.warrantySurfaceYears !== undefined ? Number(body.warrantySurfaceYears) : oldItem.warrantySurfaceYears;
      const deliveredAt = body.deliveredAt ? new Date(body.deliveredAt) : (oldItem.deliveredAt ? new Date(oldItem.deliveredAt) : null);
      const finalPaymentReceived = body.finalPaymentReceived !== undefined ? Boolean(body.finalPaymentReceived) : Boolean(oldItem.finalPaymentReceived);
      const generatedOrderNumber = body.generatedOrderNumber !== undefined ? body.generatedOrderNumber : oldItem.generatedOrderNumber;
      const workOrderCode = body.workOrderCode !== undefined ? body.workOrderCode : oldItem.workOrderCode;
      const customVariant = body.customVariant ? JSON.stringify(body.customVariant) : (oldItem.customVariant ? JSON.stringify(oldItem.customVariant) : null);

      await withDbRetry(async () => {
        await prisma.$executeRawUnsafe(`
          UPDATE "CustomRequest" SET
            "status" = $1,
            "assignedStaff" = $2,
            "assignedStaffId" = $3,
            "adminNotes" = $4,
            "surveyNotes" = $5,
            "surveyDate" = $6,
            "drawing3dUrl" = $7,
            "drawing3dUrls" = $8::jsonb,
            "quotedPrice" = $9,
            "quotedDeposit" = $10,
            "quotedAt" = $11,
            "estimatedProductionDays" = $12,
            "contractScanUrl" = $13,
            "contractSignedAt" = $14,
            "contractSignerName" = $15,
            "depositProofImage" = $16,
            "depositProofNote" = $17,
            "depositPaidAt" = $18,
            "cancelReason" = $19,
            "cancelledAt" = $20,
            "cancelledBy" = $21,
            "qcPassedAt" = $22,
            "qcInspector" = $23,
            "qcChecklist" = $24::jsonb,
            "warrantyCode" = $25,
            "warrantyMonths" = $26,
            "warrantyFrameYears" = $27,
            "warrantySurfaceYears" = $28,
            "deliveredAt" = $29,
            "finalPaymentReceived" = $30,
            "generatedOrderNumber" = $31,
            "workOrderCode" = $32,
            "customVariant" = $33::jsonb,
            "updatedAt" = NOW()
          WHERE "id" = $34
        `,
          status, assignedStaff, assignedStaffId, adminNotes, surveyNotes, surveyDate,
          drawing3dUrl, drawing3dUrls, quotedPrice, quotedDeposit, quotedAt, estimatedProductionDays,
          contractScanUrl, contractSignedAt, contractSignerName, depositProofImage, depositProofNote, depositPaidAt,
          cancelReason, cancelledAt, cancelledBy, qcPassedAt, qcInspector, qcChecklist,
          warrantyCode, warrantyMonths, warrantyFrameYears, warrantySurfaceYears, deliveredAt, finalPaymentReceived,
          generatedOrderNumber, workOrderCode, customVariant, id
        );

        // Nếu trạng thái thay đổi hoặc có ghi chú timeline kèm theo, thêm timeline
        if (body.newTimelineEvent) {
          const t = body.newTimelineEvent;
          await prisma.$executeRawUnsafe(`
            INSERT INTO "CustomRequestTimeline" (
              "id", "requestId", "status", "title", "description", "performedBy", "actorType", "timestamp"
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
          `,
            `ctl-${Date.now()}`, id, t.status || status, t.title || 'Cập nhật tiến trình',
            t.description || '', t.performedBy || req.user?.fullName || 'Kiến trúc sư', t.actorType || 'STAFF'
          );
        } else if (status !== oldItem.status) {
          await prisma.$executeRawUnsafe(`
            INSERT INTO "CustomRequestTimeline" (
              "id", "requestId", "status", "title", "description", "performedBy", "actorType", "timestamp"
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
          `,
            `ctl-${Date.now()}`, id, status, `Chuyển trạng thái sang ${status}`,
            `Hồ sơ may đo được cập nhật tiến trình sang ${status}.`,
            req.user?.fullName || assignedStaff || 'Hệ thống', 'STAFF'
          );
        }
      });

      const updatedRows: any[] = await prisma.$queryRawUnsafe(`SELECT * FROM "CustomRequest" WHERE "id" = $1`, id);
      const timelines: any[] = await prisma.$queryRawUnsafe(`SELECT * FROM "CustomRequestTimeline" WHERE "requestId" = $1 ORDER BY "timestamp" ASC`, id);

      res.json({
        success: true,
        message: 'Cập nhật tiến trình thành công',
        data: formatCustomRequest(updatedRows[0], timelines)
      });
    } catch (error: any) {
      console.error('[customRequestController.updateAdminCustomRequest] Error:', error);
      res.status(500).json({ success: false, message: 'Lỗi cập nhật tiến trình yêu cầu', error: error.message });
    }
  },

  /**
   * [CUSTOMER] Khách hàng ký hợp đồng may đo điện tử
   */
  async signContract(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { signerName } = req.body;

      const name = signerName || req.user?.fullName || 'Khách hàng';

      await withDbRetry(async () => {
        await prisma.$executeRawUnsafe(`
          UPDATE "CustomRequest" SET
            "status" = 'CONTRACT_SIGNED',
            "contractSignedAt" = NOW(),
            "contractSignerName" = $1,
            "updatedAt" = NOW()
          WHERE "id" = $2
        `, name, id);

        await prisma.$executeRawUnsafe(`
          INSERT INTO "CustomRequestTimeline" (
            "id", "requestId", "status", "title", "description", "performedBy", "actorType", "timestamp"
          ) VALUES ($1, $2, 'CONTRACT_SIGNED', 'Khách hàng ký hợp đồng may đo kinh tế', $3, $4, 'CUSTOMER', NOW())
        `,
          `ctl-${Date.now()}`, id,
          `Khách hàng ${name} đã xác nhận ký điện tử hợp đồng may đo kinh tế.`,
          name
        );
      });

      const updatedRows: any[] = await prisma.$queryRawUnsafe(`SELECT * FROM "CustomRequest" WHERE "id" = $1`, id);
      const timelines: any[] = await prisma.$queryRawUnsafe(`SELECT * FROM "CustomRequestTimeline" WHERE "requestId" = $1 ORDER BY "timestamp" ASC`, id);

      res.json({
        success: true,
        message: 'Ký hợp đồng thành công',
        data: formatCustomRequest(updatedRows[0], timelines)
      });
    } catch (error: any) {
      console.error('[customRequestController.signContract] Error:', error);
      res.status(500).json({ success: false, message: 'Lỗi ký hợp đồng', error: error.message });
    }
  },

  /**
   * [CUSTOMER] Khách hàng nộp chứng từ/bill chuyển khoản cọc VietQR
   */
  async submitDepositProof(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { depositProofImage, depositProofNote } = req.body;

      const actorName = req.user?.fullName || 'Khách hàng';

      await withDbRetry(async () => {
        await prisma.$executeRawUnsafe(`
          UPDATE "CustomRequest" SET
            "status" = 'DEPOSIT_SUBMITTED',
            "depositProofImage" = $1,
            "depositProofNote" = $2,
            "depositPaidAt" = NOW(),
            "updatedAt" = NOW()
          WHERE "id" = $3
        `, depositProofImage || null, depositProofNote || null, id);

        await prisma.$executeRawUnsafe(`
          INSERT INTO "CustomRequestTimeline" (
            "id", "requestId", "status", "title", "description", "performedBy", "actorType", "timestamp"
          ) VALUES ($1, $2, 'DEPOSIT_SUBMITTED', 'Nộp biên lai chuyển khoản đặt cọc 30%', $3, $4, 'CUSTOMER', NOW())
        `,
          `ctl-${Date.now()}`, id,
          `Khách hàng đã tải lên biên lai thanh toán đặt cọc 30%. Chờ kế toán xác nhận nhận tiền.`,
          actorName
        );
      });

      const updatedRows: any[] = await prisma.$queryRawUnsafe(`SELECT * FROM "CustomRequest" WHERE "id" = $1`, id);
      const timelines: any[] = await prisma.$queryRawUnsafe(`SELECT * FROM "CustomRequestTimeline" WHERE "requestId" = $1 ORDER BY "timestamp" ASC`, id);

      res.json({
        success: true,
        message: 'Nộp biên lai đặt cọc thành công',
        data: formatCustomRequest(updatedRows[0], timelines)
      });
    } catch (error: any) {
      console.error('[customRequestController.submitDepositProof] Error:', error);
      res.status(500).json({ success: false, message: 'Lỗi nộp biên lai cọc', error: error.message });
    }
  },

  /**
   * [CUSTOMER / ADMIN] Hủy yêu cầu may đo
   */
  async cancelCustomRequest(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const cancelledBy = req.user?.fullName || 'Khách hàng';

      await withDbRetry(async () => {
        await prisma.$executeRawUnsafe(`
          UPDATE "CustomRequest" SET
            "status" = 'CANCELLED',
            "cancelReason" = $1,
            "cancelledAt" = NOW(),
            "cancelledBy" = $2,
            "updatedAt" = NOW()
          WHERE "id" = $3
        `, reason || 'Hủy theo yêu cầu', cancelledBy, id);

        await prisma.$executeRawUnsafe(`
          INSERT INTO "CustomRequestTimeline" (
            "id", "requestId", "status", "title", "description", "performedBy", "actorType", "timestamp"
          ) VALUES ($1, $2, 'CANCELLED', 'Hủy hồ sơ may đo', $3, $4, $5, NOW())
        `,
          `ctl-${Date.now()}`, id,
          `Hồ sơ bị hủy với lý do: ${reason || 'Không có lý do cụ thể'}`,
          cancelledBy, req.user?.role ? 'STAFF' : 'CUSTOMER'
        );
      });

      const updatedRows: any[] = await prisma.$queryRawUnsafe(`SELECT * FROM "CustomRequest" WHERE "id" = $1`, id);
      const timelines: any[] = await prisma.$queryRawUnsafe(`SELECT * FROM "CustomRequestTimeline" WHERE "requestId" = $1 ORDER BY "timestamp" ASC`, id);

      res.json({
        success: true,
        message: 'Hủy hồ sơ may đo thành công',
        data: formatCustomRequest(updatedRows[0], timelines)
      });
    } catch (error: any) {
      console.error('[customRequestController.cancelCustomRequest] Error:', error);
      res.status(500).json({ success: false, message: 'Lỗi hủy hồ sơ', error: error.message });
    }
  }
};
