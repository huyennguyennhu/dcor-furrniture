import { Router, Request, Response } from 'express';
import prisma, { withDbRetry } from '../lib/prisma';
import { authenticateJWT } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/iam.middleware';
import { DEFAULT_WARRANTY_MONTHS, parseWarrantyMonths } from '../controllers/product.controller';
import { ensureWarrantyClaimsTable } from '../controllers/customer.controller';

const router = Router();

router.use(authenticateJWT);

const formatDateVN = (d: Date): string => {
  const pad = (n: number) => (n < 10 ? '0' + n : '' + n);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
};

const classifyFurnitureCategory = (
  categoryName: string,
  productName: string,
  sku: string,
  variant: string
): { category: 'SOFA' | 'CHAIR' | 'TABLE' | 'BED' | 'STORAGE' | 'LIGHTING' | 'DECOR'; categoryLabel: string } => {
  const text = `${categoryName} ${productName} ${sku} ${variant}`.toLowerCase();
  if (text.includes('sofa') || text.includes('salon') || text.includes('lounge')) {
    return { category: 'SOFA', categoryLabel: 'Sofa & Ghế' };
  }
  if (text.includes('ghế') || text.includes('chair') || text.includes('armchair') || text.includes('stool')) {
    return { category: 'CHAIR', categoryLabel: 'Ghế thư giãn' };
  }
  if (text.includes('bàn') || text.includes('table') || text.includes('desk')) {
    return { category: 'TABLE', categoryLabel: 'Bàn ăn & Bàn trà' };
  }
  if (text.includes('giường') || text.includes('bed')) {
    return { category: 'BED', categoryLabel: 'Giường ngủ' };
  }
  if (text.includes('tủ') || text.includes('kệ') || text.includes('storage') || text.includes('wardrobe') || text.includes('cabinet')) {
    return { category: 'STORAGE', categoryLabel: 'Tủ & Kệ' };
  }
  if (text.includes('đèn') || text.includes('lamp') || text.includes('light')) {
    return { category: 'LIGHTING', categoryLabel: 'Đèn & Trang trí' };
  }
  return { category: 'DECOR', categoryLabel: 'Đèn & Trang trí' };
};

const isCleanImageUrl = (u: any): u is string =>
  typeof u === 'string' && u.trim().length > 0 && !u.includes('dsasf753c');

const extractFirstCleanImage = (imagesField: any): string => {
  if (Array.isArray(imagesField)) {
    for (const entry of imagesField) {
      const url = typeof entry === 'string' ? entry : entry?.url;
      if (isCleanImageUrl(url)) return url;
    }
  } else if (isCleanImageUrl(imagesField)) {
    return imagesField;
  }
  return '';
};

// GET /api/admin/warranties - Lấy toàn bộ danh sách bảo hành thực tế từ PostgreSQL (đơn đã giao/hoàn tất + cấu hình warrantyMonths của sản phẩm + phiếu yêu cầu bảo hành)
router.get('/', requirePermission('orders', 'view'), async (_req: Request, res: Response) => {
  try {
    await ensureWarrantyClaimsTable();

    const orders = await withDbRetry(() =>
      prisma.order.findMany({
        where: {
          status: { in: ['DELIVERED', 'COMPLETED'] }
        },
        include: {
          items: true,
          customer: {
            select: { id: true, fullName: true, phone: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      })
    );

    const productIdSet = new Set<string>();
    const variantIdSet = new Set<string>();
    const productNameSet = new Set<string>();

    for (const order of orders) {
      for (const item of order.items) {
        if (item.productId) productIdSet.add(item.productId);
        if (item.variantId) variantIdSet.add(item.variantId);
        if (item.productName) productNameSet.add(item.productName);
      }
    }

    const [dbProducts, dbVariants, dbProductsByName, claimRows] = await Promise.all([
      productIdSet.size > 0
        ? prisma.product.findMany({
            where: { id: { in: Array.from(productIdSet) } },
            select: {
              id: true,
              name: true,
              images: true,
              configOptions: true,
              category: { select: { name: true } }
            }
          }).catch(() => [])
        : Promise.resolve([]),
      variantIdSet.size > 0
        ? prisma.productVariant.findMany({
            where: { id: { in: Array.from(variantIdSet) } },
            select: {
              id: true,
              productId: true,
              optionValues: true,
              product: {
                select: {
                  id: true,
                  name: true,
                  images: true,
                  configOptions: true,
                  category: { select: { name: true } }
                }
              }
            }
          }).catch(() => [])
        : Promise.resolve([]),
      productNameSet.size > 0
        ? prisma.product.findMany({
            where: { name: { in: Array.from(productNameSet) } },
            select: {
              id: true,
              name: true,
              images: true,
              configOptions: true,
              category: { select: { name: true } }
            }
          }).catch(() => [])
        : Promise.resolve([]),
      prisma.$queryRawUnsafe<any[]>(`
        SELECT * FROM "WarrantyClaims" ORDER BY created_at DESC;
      `).catch(() => [])
    ]);

    type ProdMeta = { configOptions: any; images: any; categoryName: string };
    const productMap = new Map<string, ProdMeta>();
    const productByNameMap = new Map<string, ProdMeta>();

    for (const p of [...dbProducts, ...dbProductsByName]) {
      const meta: ProdMeta = {
        configOptions: p.configOptions,
        images: p.images,
        categoryName: p.category?.name || ''
      };
      if (!productMap.has(p.id)) productMap.set(p.id, meta);
      if (p.name && !productByNameMap.has(p.name.trim().toLowerCase())) {
        productByNameMap.set(p.name.trim().toLowerCase(), meta);
      }
    }

    const variantMap = new Map<string, { optionValues: any; product: ProdMeta | null }>();
    for (const v of dbVariants) {
      const meta = v.product
        ? {
            configOptions: v.product.configOptions,
            images: v.product.images,
            categoryName: v.product.category?.name || ''
          }
        : null;
      variantMap.set(v.id, { optionValues: v.optionValues, product: meta });
      if (v.product && !productMap.has(v.product.id) && meta) {
        productMap.set(v.product.id, meta);
      }
    }

    const claimsByOrder = new Map<string, any[]>();
    for (const c of claimRows) {
      const key = String(c.order_number || '').trim();
      if (!claimsByOrder.has(key)) claimsByOrder.set(key, []);
      claimsByOrder.get(key)!.push({
        id: c.id,
        claimCode: c.claim_code,
        orderNumber: c.order_number,
        productName: c.product_name,
        warrantyCode: c.warranty_code,
        claimType: c.claim_type,
        issueDescription: c.issue_description,
        evidenceImages: Array.isArray(c.evidence_images) ? c.evidence_images : [],
        status: c.status,
        adminNote: c.admin_note,
        createdAt: c.created_at,
        updatedAt: c.updated_at
      });
    }

    const now = new Date();
    const warranties: any[] = [];

    for (const order of orders) {
      const startDate = new Date(order.deliveredAt || order.createdAt);
      const purchaseDateObj = new Date(order.createdAt);
      const cleanOrderDigits = (order.orderNumber || '').replace(/[^0-9]/g, '');
      const defaultWarrantyCode = 'BH-' + (cleanOrderDigits.slice(-6) || order.id.slice(-6).toUpperCase());
      const baseWarrantyCode = (order as any).warrantyCode || defaultWarrantyCode;

      const fullAddress = [order.detailAddress, order.ward, order.district, order.province]
        .filter(Boolean)
        .join(', ');

      const sortedItems = [...order.items].sort((a, b) => String(a.id).localeCompare(String(b.id)));
      const orderClaims = claimsByOrder.get(order.orderNumber) || [];

      sortedItems.forEach((item, idx) => {
        const itemWarrantyCode =
          (item.selectedOptions as any)?.warrantyCode ||
          (sortedItems.length > 1
            ? `${baseWarrantyCode}-${String(idx + 1).padStart(2, '0')}`
            : baseWarrantyCode);

        const variantEntry = item.variantId ? variantMap.get(item.variantId) : undefined;
        const prodEntry =
          (item.productId ? productMap.get(item.productId) : undefined) ??
          variantEntry?.product ??
          (item.productName ? productByNameMap.get(item.productName.trim().toLowerCase()) : undefined);

        let resolvedImage = isCleanImageUrl(item.imageUrl) ? item.imageUrl : '';
        if (!resolvedImage && prodEntry) {
          resolvedImage = extractFirstCleanImage(prodEntry.images);
        }
        if (!resolvedImage && variantEntry?.optionValues) {
          const vOpt = typeof variantEntry.optionValues === 'string'
            ? (() => { try { return JSON.parse(variantEntry.optionValues); } catch { return {}; } })()
            : variantEntry.optionValues;
          resolvedImage = extractFirstCleanImage(vOpt?.images) || (isCleanImageUrl(vOpt?.image) ? vOpt.image : '');
        }

        const liveConfig = prodEntry?.configOptions;
        const liveWarranty = parseWarrantyMonths(liveConfig?.specs?.warrantyMonths ?? liveConfig?.warrantyMonths);
        const snapshotWarranty = parseWarrantyMonths((item.selectedOptions as any)?.warrantyMonths);
        const warrantyMonths = liveWarranty ?? snapshotWarranty ?? DEFAULT_WARRANTY_MONTHS;

        const expiryDateObj = new Date(startDate);
        expiryDateObj.setMonth(expiryDateObj.getMonth() + warrantyMonths);

        const diffMs = expiryDateObj.getTime() - now.getTime();
        const daysRemaining = warrantyMonths <= 0 ? 0 : Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        let status: 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED' = 'ACTIVE';
        if (warrantyMonths <= 0 || daysRemaining <= 0) {
          status = 'EXPIRED';
        } else if (daysRemaining <= 30) {
          status = 'EXPIRING_SOON';
        }

        const { category, categoryLabel } = classifyFurnitureCategory(
          prodEntry?.categoryName || '',
          item.productName || '',
          item.sku || '',
          item.variantDescription || ''
        );

        const matchedClaims = orderClaims.filter(
          c =>
            (c.warrantyCode && c.warrantyCode === itemWarrantyCode) ||
            (c.productName && item.productName && c.productName.trim().toLowerCase() === item.productName.trim().toLowerCase())
        );

        const customerName = order.receiverName || order.customer?.fullName || 'Khách hàng';
        const customerPhone = order.phone || (order.customer?.phone && !order.customer.phone.startsWith('GOOG_') ? order.customer.phone : '');

        warranties.push({
          id: itemWarrantyCode,
          orderId: order.id,
          orderNumber: order.orderNumber,
          customerId: order.customerId || null,
          customerName,
          phone: customerPhone,
          address: fullAddress || 'Đang cập nhật',
          productId: item.productId || '',
          productName: item.productName,
          sku: item.sku || `DCOR-${item.id.slice(0, 6).toUpperCase()}`,
          serialNumber: `SN-${(cleanOrderDigits.slice(-4) || item.id.slice(-4)).toUpperCase()}-${String(idx + 1).padStart(3, '0')}`,
          variant: item.variantDescription || 'Tiêu chuẩn',
          category,
          categoryLabel,
          image: resolvedImage || '/assets/img/furniture-placeholder.svg',
          price: Number(item.price) || 0,
          quantity: item.quantity || 1,
          purchaseDate: formatDateVN(purchaseDateObj),
          activationDate: formatDateVN(startDate),
          warrantyMonths,
          expiryDate: formatDateVN(expiryDateObj),
          daysRemaining,
          status,
          coverageNotes: warrantyMonths > 0
            ? [
                `Bảo hành chính hãng ${warrantyMonths} tháng kể từ ngày giao hàng thành công theo cấu hình sản phẩm.`,
                'Bảo hành kết cấu chịu lực, mối mọt, cong vênh, gãy sập khung sườn do lỗi kỹ thuật từ nhà sản xuất.',
                'Bảo hành bề mặt hoàn thiện, đệm mút và phụ kiện cơ khí theo tiêu chuẩn DCor.'
              ]
            : ['Sản phẩm không áp dụng bảo hành tiêu chuẩn. Hỗ trợ bảo dưỡng dịch vụ qua Hotline 1900 1234.'],
          termsNote: warrantyMonths > 0
            ? `Bảo hành miễn phí toàn diện theo tiêu chuẩn xuất xưởng DCOR trong thời hạn ${warrantyMonths} tháng kể từ ngày giao nhận hàng.`
            : 'Sản phẩm không áp dụng thời hạn bảo hành tiêu chuẩn theo cấu hình cửa hàng.',
          claims: matchedClaims
        });
      });
    }

    res.json({
      warranties,
      claims: claimRows.map(c => ({
        id: c.id,
        claimCode: c.claim_code,
        customerId: c.customer_id,
        orderNumber: c.order_number,
        productName: c.product_name,
        warrantyCode: c.warranty_code,
        claimType: c.claim_type,
        issueDescription: c.issue_description,
        evidenceImages: Array.isArray(c.evidence_images) ? c.evidence_images : [],
        status: c.status,
        adminNote: c.admin_note,
        createdAt: c.created_at,
        updatedAt: c.updated_at
      }))
    });
  } catch (error) {
    console.error('[Admin Warranty] Lỗi tải danh sách bảo hành:', error);
    res.status(500).json({ message: 'Không thể tải danh sách bảo hành từ cơ sở dữ liệu.' });
  }
});

// GET /api/admin/warranties/claims - Danh sách phiếu yêu cầu bảo hành của khách hàng
router.get('/claims', requirePermission('orders', 'view'), async (_req: Request, res: Response) => {
  try {
    await ensureWarrantyClaimsTable();
    const rows: any[] = await prisma.$queryRawUnsafe(`
      SELECT * FROM "WarrantyClaims" ORDER BY created_at DESC;
    `);
    res.json(rows);
  } catch (error) {
    console.error('[Admin Warranty] Lỗi tải phiếu yêu cầu bảo hành:', error);
    res.status(500).json({ message: 'Không thể tải danh sách yêu cầu bảo hành.' });
  }
});

// PATCH /api/admin/warranties/claims/:id/status - Cập nhật trạng thái phiếu yêu cầu bảo hành
router.patch('/claims/:id/status', requirePermission('orders', 'edit'), async (req: Request, res: Response) => {
  try {
    await ensureWarrantyClaimsTable();
    const id = String(req.params.id || '').trim();
    const status = String(req.body?.status || '').trim().toUpperCase();
    const adminNote = req.body?.adminNote !== undefined ? String(req.body.adminNote).trim() : null;

    if (!['PENDING', 'PROCESSING', 'RESOLVED', 'REJECTED'].includes(status)) {
      res.status(400).json({ message: 'Trạng thái yêu cầu bảo hành không hợp lệ (PENDING, PROCESSING, RESOLVED, REJECTED).' });
      return;
    }

    const rows: any[] = await prisma.$queryRawUnsafe(
      `SELECT * FROM "WarrantyClaims" WHERE id = $1 OR claim_code = $1 LIMIT 1;`,
      id
    );
    if (!rows || rows.length === 0) {
      res.status(404).json({ message: 'Không tìm thấy yêu cầu bảo hành.' });
      return;
    }

    await prisma.$executeRawUnsafe(
      `UPDATE "WarrantyClaims"
       SET status = $1, admin_note = COALESCE($2, admin_note), updated_at = NOW()
       WHERE id = $3;`,
      status,
      adminNote,
      rows[0].id
    );

    res.json({ success: true, message: 'Đã cập nhật trạng thái yêu cầu bảo hành.' });
  } catch (error) {
    console.error('[Admin Warranty] Lỗi cập nhật phiếu bảo hành:', error);
    res.status(500).json({ message: 'Không thể cập nhật yêu cầu bảo hành.' });
  }
});

export default router;
