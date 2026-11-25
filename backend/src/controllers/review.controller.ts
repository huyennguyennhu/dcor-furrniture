import { Request, Response } from 'express';
import prisma, { withDbRetry } from '../lib/prisma';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { extractCaller, isOrderAccessibleByCaller } from './order.controller';

const JWT_SECRET = process.env.JWT_SECRET || 'dcor_super_secret_key_2026';

interface ReviewInput {
  orderItemId?: string;
  productId: string;
  productName?: string;
  productImage?: string;
  variantDescription?: string;
  rating: number;
  comment: string;
  images?: string[];
}

export const reviewController = {
  // Lấy danh sách đánh giá của khách hàng: bao gồm cả đã đánh giá và chưa đánh giá
  getMyReviews: async (req: Request, res: Response): Promise<void> => {
    try {
      const caller = extractCaller(req);
      let customerId = caller.userId;
      let customerPhone = caller.phone;

      // Nếu đã đăng nhập: CHỈ dùng thông tin xác thực từ token (không nhận query.phone để chống xem trộm)
      if (!customerId) {
        const headerPhone = req.headers['x-guest-phone'] as string;
        if (headerPhone && headerPhone.trim()) {
          customerPhone = headerPhone.trim();
        }
      }

      if (!customerId && !customerPhone) {
        res.json({ reviewed: [], unreviewed: [] });
        return;
      }

      // 1. Lấy danh sách các đơn hàng đã hoàn tất của khách hàng
      const orConditions: any[] = [];
      if (customerId) orConditions.push({ customerId });
      if (customerPhone) orConditions.push({ phone: customerPhone });

      const completedOrders = await withDbRetry(() =>
        prisma.order.findMany({
          where: {
            OR: orConditions,
            status: { in: ['COMPLETED', 'DELIVERED'] }
          },
          include: {
            items: {
              include: {
                variant: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        })
      );

      // Lọc các đơn thực sự đã hoàn tất (không trong 5 phút chờ xác nhận)
      const validCompletedOrders = completedOrders.filter(o => {
        if (o.status === 'COMPLETED') return true;
        if (o.status === 'DELIVERED') {
          if (!o.deliveredAt) return true;
          const diffMs = Date.now() - new Date(o.deliveredAt).getTime();
          return diffMs >= 5 * 60 * 1000;
        }
        return false;
      });

      const orderIds = validCompletedOrders.map(o => o.id);
      const orderMap = new Map(validCompletedOrders.map(o => [o.id, o]));

      // 2. Lấy các đánh giá đã tạo từ DB
      let existingReviews: any[] = [];
      try {
        if (orderIds.length > 0) {
          const rawReviews: any = await prisma.$queryRawUnsafe(`
            SELECT * FROM "Review"
            WHERE "orderId" = ANY($1::varchar[])
               OR "customerId" = $2
               OR "customerPhone" = $3
            ORDER BY "createdAt" DESC
          `, orderIds, customerId || '', customerPhone || '');
          existingReviews = Array.isArray(rawReviews) ? rawReviews : [];
        } else if (customerId || customerPhone) {
          const rawReviews: any = await prisma.$queryRawUnsafe(`
            SELECT * FROM "Review"
            WHERE "customerId" = $1 OR "customerPhone" = $2
            ORDER BY "createdAt" DESC
          `, customerId || '', customerPhone || '');
          existingReviews = Array.isArray(rawReviews) ? rawReviews : [];
        }
      } catch (dbErr: any) {
        if (dbErr?.message?.includes('does not exist') || dbErr?.meta?.code === '42P01') {
          import('../lib/init-review-db').then(m => m.initReviewDatabase().catch(() => {}));
        } else {
          console.warn('Lỗi query bảng Review:', dbErr?.message || dbErr);
        }
        existingReviews = [];
      }

      // Thu thập productId / productName từ cả Review và OrderItem để thay thế mọi ảnh hỏng (dsasf753c) bằng ảnh sạch live
      const prodIds = new Set<string>();
      const prodNames = new Set<string>();
      for (const r of existingReviews) {
        if (r.productId) prodIds.add(String(r.productId));
        if (r.productName) prodNames.add(String(r.productName));
      }
      for (const order of validCompletedOrders) {
        for (const item of order.items) {
          if (item.productId) prodIds.add(String(item.productId));
          if (item.productName) prodNames.add(String(item.productName));
        }
      }

      const [dbProdsById, dbProdsByName] = await Promise.all([
        prodIds.size > 0
          ? prisma.product.findMany({
              where: { id: { in: Array.from(prodIds) } },
              select: { id: true, name: true, images: true, variants: { select: { optionValues: true }, take: 3 } }
            }).catch(() => [])
          : Promise.resolve([]),
        prodNames.size > 0
          ? prisma.product.findMany({
              where: { name: { in: Array.from(prodNames) } },
              select: { id: true, name: true, images: true, variants: { select: { optionValues: true }, take: 3 } }
            }).catch(() => [])
          : Promise.resolve([])
      ]);

      const isCleanImg = (u: any): u is string =>
        typeof u === 'string' && u.trim().length > 0 && !u.includes('dsasf753c');

      const extractCleanProdImg = (prod: any): string => {
        if (!prod) return '';
        if (Array.isArray(prod.images)) {
          for (const entry of prod.images) {
            const url = typeof entry === 'string' ? entry : entry?.url;
            if (isCleanImg(url)) return url;
          }
        } else if (isCleanImg(prod.images)) {
          return prod.images;
        }
        if (Array.isArray(prod.variants)) {
          for (const v of prod.variants) {
            const opt = typeof v.optionValues === 'string'
              ? (() => { try { return JSON.parse(v.optionValues); } catch { return {}; } })()
              : (v.optionValues || {});
            if (Array.isArray(opt?.images)) {
              for (const u of opt.images) {
                if (isCleanImg(u)) return u;
              }
            }
            if (isCleanImg(opt?.image)) return opt.image;
          }
        }
        return '';
      };

      const prodImgById = new Map<string, string>();
      const prodImgByName = new Map<string, string>();
      for (const p of [...dbProdsById, ...dbProdsByName]) {
        const cleanUrl = extractCleanProdImg(p);
        if (cleanUrl) {
          if (p.id && !prodImgById.has(p.id)) prodImgById.set(p.id, cleanUrl);
          if (p.name && !prodImgByName.has(p.name.trim().toLowerCase())) {
            prodImgByName.set(p.name.trim().toLowerCase(), cleanUrl);
          }
        }
      }

      const resolveCleanImage = (rawUrl: any, productId?: string | null, productName?: string | null): string => {
        if (isCleanImg(rawUrl)) return rawUrl;
        if (productId && prodImgById.has(String(productId))) return prodImgById.get(String(productId))!;
        if (productName && prodImgByName.has(String(productName).trim().toLowerCase())) {
          return prodImgByName.get(String(productName).trim().toLowerCase())!;
        }
        return '';
      };

      // Format các đánh giá đã có
      const reviewed = existingReviews.map((r: any) => {
        const order = orderMap.get(r.orderId);
        let imagesParsed = [];
        try {
          imagesParsed = typeof r.images === 'string' ? JSON.parse(r.images) : (r.images || []);
        } catch (_) {
          imagesParsed = [];
        }

        return {
          id: r.id,
          orderId: r.orderId,
          orderNumber: order?.orderNumber || r.orderNumber || '',
          orderItemId: r.orderItemId,
          productId: r.productId,
          productName: r.productName,
          productImage: resolveCleanImage(r.productImage, r.productId, r.productName),
          variantDescription: r.variantDescription,
          customerName: r.customerName,
          rating: Number(r.rating) || 5,
          comment: r.comment || '',
          images: Array.isArray(imagesParsed) ? imagesParsed.filter(isCleanImg) : [],
          isAnonymous: !!r.isAnonymous,
          reply: r.reply || null,
          replyAt: r.replyAt || null,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt
        };
      });

      // Tạo Set các cặp đã đánh giá (theo orderItemId hoặc orderId+productId)
      const reviewedItemKeys = new Set<string>();
      for (const r of existingReviews) {
        if (r.orderItemId) {
          reviewedItemKeys.add(`${r.orderId}_${r.orderItemId}`);
        }
        if (r.productId) {
          reviewedItemKeys.add(`${r.orderId}_${r.productId}`);
        }
      }

      // 3. Tìm các sản phẩm chưa được đánh giá từ các đơn hàng hoàn tất
      const unreviewed: any[] = [];
      for (const order of validCompletedOrders) {
        for (const item of order.items) {
          const keyByItemId = `${order.id}_${item.id}`;
          const keyByProdId = `${order.id}_${item.productId}`;

          if (!reviewedItemKeys.has(keyByItemId) && !reviewedItemKeys.has(keyByProdId)) {
            unreviewed.push({
              orderId: order.id,
              orderNumber: order.orderNumber,
              orderDate: order.createdAt,
              orderCompletedAt: order.completedAt || order.deliveredAt || order.updatedAt,
              orderItemId: item.id,
              productId: item.productId,
              productName: item.productName,
              productImage: resolveCleanImage(item.imageUrl, item.productId, item.productName),
              variantDescription: item.variantDescription || (item as any).variant?.name || null,
              price: item.price,
              quantity: item.quantity,
              lineTotal: Number(item.lineTotal)
            });
          }
        }
      }

      res.json({
        reviewed,
        unreviewed
      });
    } catch (error) {
      console.error('Lỗi khi lấy danh sách đánh giá:', error);
      res.status(500).json({ message: 'Không thể tải danh sách đánh giá.', error: (error as any)?.message });
    }
  },

  // Gửi đánh giá cho các sản phẩm trong đơn hàng
  submitOrderReviews: async (req: Request, res: Response): Promise<void> => {
    try {
      const orderNumber = req.params.orderNumber || req.body.orderNumber;
      if (!orderNumber) {
        res.status(400).json({ message: 'Thiếu mã đơn hàng.' });
        return;
      }

      // Xác thực người dùng
      let customerId: string | null = null;
      let customerPhone: string | null = null;
      let customerName = 'Khách hàng';

      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
          const decoded = jwt.verify(token, JWT_SECRET) as any;
          customerId = decoded?.userId || null;
          customerPhone = decoded?.phone || null;
          if (decoded?.fullName) customerName = decoded.fullName;
        } catch (_) {}
      }

      const order = await withDbRetry(() =>
        prisma.order.findUnique({
          where: { orderNumber },
          include: { items: { include: { variant: true } }, customer: true }
        })
      );

      if (!order) {
        res.status(404).json({ message: 'Không tìm thấy thông tin đơn hàng.' });
        return;
      }

      // KIỂM TRA QUYỀN SỞ HỮU (Chống đánh giá mạo danh đơn người khác)
      if (!isOrderAccessibleByCaller(order, req)) {
        res.status(403).json({ message: 'Bạn không có quyền gửi đánh giá cho đơn hàng của người khác.' });
        return;
      }

      if (order.customer?.fullName) {
        customerName = order.customer.fullName;
      } else if (order.receiverName) {
        customerName = order.receiverName;
      }
      if (!customerPhone && order.phone) {
        customerPhone = order.phone;
      }
      if (!customerId && order.customerId) {
        customerId = order.customerId;
      }

      // Nhận mảng reviews từ body (hỗ trợ cả dạng mảng reviews[] hoặc đơn lẻ { rating, comment, itemId })
      let reviewsList: ReviewInput[] = [];
      const isAnonymous = !!req.body.isAnonymous;

      if (Array.isArray(req.body.reviews) && req.body.reviews.length > 0) {
        reviewsList = req.body.reviews;
      } else if (req.body.rating) {
        reviewsList = [{
          orderItemId: req.body.orderItemId || req.body.itemId,
          productId: req.body.productId || order.items[0]?.productId,
          productName: req.body.productName || order.items[0]?.productName,
          productImage: req.body.productImage || order.items[0]?.imageUrl,
          variantDescription: req.body.variantDescription || order.items[0]?.variantDescription || undefined,
          rating: Number(req.body.rating) || 5,
          comment: req.body.comment || '',
          images: Array.isArray(req.body.images) ? req.body.images : []
        }];
      }

      if (reviewsList.length === 0) {
        res.status(400).json({ message: 'Vui lòng cung cấp ít nhất một đánh giá sản phẩm.' });
        return;
      }

      const createdReviews: any[] = [];

      for (const rev of reviewsList) {
        // Tìm thông tin item tương ứng trong đơn
        const matchingItem = order.items.find(it => it.id === rev.orderItemId || it.productId === rev.productId) || order.items[0];
        const prodId = rev.productId || matchingItem?.productId;
        const prodName = rev.productName || matchingItem?.productName || 'Sản phẩm Dcor';
        const prodImg = rev.productImage || matchingItem?.imageUrl || '';
        const variantDesc = rev.variantDescription || matchingItem?.variantDescription || (matchingItem as any)?.variant?.name || null;
        const rating = Math.min(5, Math.max(1, Math.round(Number(rev.rating) || 5)));
        const comment = (rev.comment || '').trim();
        const imagesJson = JSON.stringify(Array.isArray(rev.images) ? rev.images : []);

        const reviewId = crypto.randomUUID();

        await prisma.$executeRawUnsafe(`
          INSERT INTO "Review" (
            "id", "orderId", "orderItemId", "productId", "productName", "productImage", 
            "variantDescription", "customerId", "customerName", "customerPhone", 
            "rating", "comment", "images", "isAnonymous", "createdAt", "updatedAt"
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13::jsonb, $14, NOW(), NOW()
          )
        `, 
          reviewId,
          order.id,
          rev.orderItemId || matchingItem?.id || null,
          prodId,
          prodName,
          prodImg,
          variantDesc,
          customerId,
          isAnonymous ? (customerName.charAt(0) + '***' + customerName.slice(-1)) : customerName,
          customerPhone,
          rating,
          comment,
          imagesJson,
          isAnonymous
        );

        createdReviews.push({
          id: reviewId,
          productId: prodId,
          productName: prodName,
          rating,
          comment
        });
      }

      // Ghi log vào orderStatusHistory
      const avgRating = (reviewsList.reduce((sum, r) => sum + (Number(r.rating) || 5), 0) / reviewsList.length).toFixed(1);
      try {
        await prisma.orderStatusHistory.create({
          data: {
            orderId: order.id,
            status: order.status,
            actorType: 'CUSTOMER',
            notes: `[Đánh giá đơn hàng] Khách hàng đã gửi đánh giá cho ${reviewsList.length} sản phẩm. Điểm trung bình: ${avgRating}/5 ⭐`
          }
        });
      } catch (logErr) {
        console.warn('Không thể ghi orderStatusHistory (bỏ qua):', logErr);
      }

      res.status(201).json({
        message: 'Gửi đánh giá đơn hàng thành công! Cảm ơn ý kiến quý báu của bạn.',
        reviews: createdReviews
      });
    } catch (error) {
      console.error('Lỗi khi gửi đánh giá:', error);
      res.status(500).json({ message: 'Lỗi server khi lưu đánh giá. Vui lòng thử lại.', error: (error as any)?.message });
    }
  }
};
