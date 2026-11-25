import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { getVoucherEffectiveRange, isFreeshipVoucher, ensureDefaultFreeshipVouchers } from './voucher.controller';
import { inMemoryReturns } from './customer.controller';
import { extractProductWarrantyMonths } from './product.controller';
import { syncCustomerLoyalty } from '../lib/member-tier';

const JWT_SECRET = process.env.JWT_SECRET || 'dcor_super_secret_key_2026';

const serializeBigInt = (obj: any): any => {
  return JSON.parse(
    JSON.stringify(obj, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    )
  );
};

/**
 * Ràng buộc hệ thống: Tự động hủy các đơn hàng quá hạn 24 giờ
 * mà chưa được đặt cọc (đơn giá trị lớn > 50tr) hoặc chưa thanh toán chuyển khoản ngân hàng.
 */
export const autoCancelExpiredOrders = async (): Promise<void> => {
  try {
    const now = new Date();
    const expiredThreshold = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const expiredOrders = await prisma.order.findMany({
      where: {
        status: { in: ['PENDING'] },
        paymentStatus: { not: 'PAID' },
        OR: [
          {
            expiresAt: {
              not: null,
              lte: now
            }
          },
          {
            createdAt: { lt: expiredThreshold },
            OR: [
              { totalAmount: { gt: BigInt(50000000) } },
              { isHighValue: true },
              { isDepositRequired: true },
              { paymentMethod: 'BANK_TRANSFER' }
            ]
          }
        ]
      },
      select: { id: true, orderNumber: true },
      take: 50 // Giới hạn batch size để tránh chiếm dụng DB connection
    });

    if (expiredOrders.length > 0) {
      const cancelReason = 'Hệ thống tự động hủy do quá hạn đặt cọc / chuyển khoản trong vòng 24 giờ.';
      const expiredIds = expiredOrders.map(o => o.id);

      // Cập nhật hàng loạt (Bulk update) trong 1 câu query duy nhất thay vì lặp từng câu
      await prisma.order.updateMany({
        where: { id: { in: expiredIds } },
        data: {
          status: 'CANCELLED',
          cancelledAt: now,
          cancelledBy: 'SYSTEM',
          cancelReason
        }
      });

      // Ghi nhận lịch sử trạng thái hàng loạt
      await prisma.orderStatusHistory.createMany({
        data: expiredIds.map(orderId => ({
          orderId,
          status: 'CANCELLED',
          fromStatus: 'PENDING',
          actorType: 'SYSTEM',
          notes: 'Hệ thống tự động hủy do quá hạn 24 giờ kể từ khi đặt hàng nhưng chưa nhận được tiền đặt cọc hoặc thanh toán chuyển khoản.'
        }))
      }).catch(() => {});
      console.log(`[SYSTEM] Đã tự động hủy ${expiredOrders.length} đơn hàng quá hạn.`);
    }
  } catch (err) {
    console.warn('Lỗi khi kiểm tra autoCancelExpiredOrders:', err);
  }
};

/**
 * Ràng buộc hệ thống: Tự động chuyển các đơn hàng DELIVERED sang COMPLETED sau 5 phút
 * nếu khách hàng không chủ động bấm nút "Đã nhận hàng".
 */
export const autoCompleteExpiredDeliveredOrders = async (): Promise<void> => {
  try {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const expiredDelivered = await prisma.order.findMany({
      where: {
        status: 'DELIVERED',
        deliveredAt: { lt: fiveMinutesAgo }
      },
      select: { id: true, orderNumber: true, customerId: true },
      take: 50 // Giới hạn batch size
    });

    if (expiredDelivered.length > 0) {
      const deliveredIds = expiredDelivered.map(o => o.id);

      // Cập nhật hàng loạt trong 1 câu query duy nhất
      await prisma.order.updateMany({
        where: { id: { in: deliveredIds } },
        data: { status: 'COMPLETED' }
      });

      await prisma.orderStatusHistory.createMany({
        data: deliveredIds.map(orderId => ({
          orderId,
          status: 'COMPLETED',
          fromStatus: 'DELIVERED',
          actorType: 'SYSTEM',
          notes: 'Hệ thống tự động chuyển sang Hoàn tất sau 3 ngày kể từ khi giao hàng thành công.'
        }))
      }).catch(() => {});

      const uniqueCustomerIds = Array.from(new Set(expiredDelivered.map(o => o.customerId).filter(Boolean))) as string[];
      for (const cid of uniqueCustomerIds) {
        await syncCustomerLoyalty(cid);
      }
    }
  } catch (err) {
    console.warn('Lỗi khi kiểm tra autoCompleteExpiredDeliveredOrders:', err);
  }
};

// Quét định kỳ kiểm tra tự động hủy đơn quá hạn 24h và tự động hoàn tất đơn sau 5 phút
// Chạy mỗi 5 phút một lần kèm cờ chống trùng lặp (running lock) để bảo vệ connection pool
let isOrderCleanupInProgress = false;
setInterval(async () => {
  if (isOrderCleanupInProgress) return;
  isOrderCleanupInProgress = true;
  try {
    await autoCancelExpiredOrders();
    await autoCompleteExpiredDeliveredOrders();
  } catch (err) {
    console.warn('[Order Cron] Lỗi quét dọn đơn hàng định kỳ:', err);
  } finally {
    isOrderCleanupInProgress = false;
  }
}, 5 * 60 * 1000);

export const orderController = {
  // Tạo đơn hàng mới từ Store Checkout
  createOrder: async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        receiverName,
        phone,
        email,
        address,
        province,
        district,
        ward,
        detailAddress,
        shippingNotes,
        paymentMethod,
        voucherCode,
        freeshipVoucherCode,
        isGift,
        hideInvoicePrice,
        items,
        invoice
      } = req.body;

      if (!receiverName || !phone || !address) {
        res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ họ tên, số điện thoại và địa chỉ nhận hàng.' });
        return;
      }

      // === RATE LIMITING: Tối đa 5 đơn hàng / số điện thoại / giờ ===
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const recentOrderCount = await prisma.order.count({
        where: {
          phone: phone.trim(),
          createdAt: { gte: oneHourAgo }
        }
      });
      if (recentOrderCount >= 5) {
        res.status(429).json({
          message: 'Số điện thoại này đã tạo tối đa 5 đơn hàng trong 1 giờ qua. Vui lòng thử lại sau hoặc liên hệ CSKH để được hỗ trợ.'
        });
        return;
      }
      // ===================================================

      // Xác thực khách hàng nếu có token
      let customerId: string | null = null;
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
          const decoded = jwt.verify(token, JWT_SECRET) as any;
          if (decoded && decoded.userId) {
            customerId = decoded.userId;
          }
        } catch (_) {}
      }

      let subTotal = BigInt(0);
      const itemsList = Array.isArray(items) ? items : [];
      const orderItemsCreate: any[] = [];
      const purchasedVariantIds: string[] = [];

      // Tối ưu N+1: Gom toàn bộ variantId để truy vấn trong 1 câu lệnh duy nhất (O(1) database round-trip)
      const incomingVariantIds = itemsList.map((i: any) => i.variantId).filter(Boolean);
      const variantMap = new Map<string, any>();
      if (incomingVariantIds.length > 0) {
        const dbVariants = await prisma.productVariant.findMany({
          where: { id: { in: incomingVariantIds } },
          include: { product: true }
        }).catch(() => []);
        for (const v of dbVariants) {
          variantMap.set(v.id, v);
        }
      }

      // Chỉ truy vấn defaultProduct fallback nếu thực sự có sản phẩm không tìm thấy variant trong DB
      let defaultProduct: any = null;
      const needsFallback = itemsList.some((i: any) => !i.variantId || !variantMap.has(i.variantId));
      if (needsFallback) {
        defaultProduct = await prisma.product.findFirst({
          include: { variants: true }
        }).catch(() => null);
      }

      for (const item of itemsList) {
        const qty = Number(item.quantity) || 1;
        const price = Number(item.price) || 0;
        const lineTotal = BigInt(qty * price);
        subTotal += lineTotal;

        const variant = item.variantId ? (variantMap.get(item.variantId) || null) : null;
        if (item.variantId) {
          purchasedVariantIds.push(item.variantId);
        }

        const productId = variant?.productId || defaultProduct?.id || '';
        const variantId = variant?.id || defaultProduct?.variants?.[0]?.id || null;
        const productName = variant?.product?.name || item.name || defaultProduct?.name || 'Sản phẩm DCor';
        const imageUrl = item.image || (variant?.product?.images ? (Array.isArray(variant.product.images) ? variant.product.images[0] : '') : '') || '';
        const itemWarrantyMonths = extractProductWarrantyMonths(
          variant?.product?.configOptions ?? defaultProduct?.configOptions
        );
        const mergedSelectedOptions = {
          ...(item.selectedOptions && typeof item.selectedOptions === 'object' ? item.selectedOptions : {}),
          warrantyMonths: itemWarrantyMonths
        };

        if (productId) {
          orderItemsCreate.push({
            productId,
            variantId,
            productName,
            sku: variant?.sku || `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
            imageUrl: typeof imageUrl === 'string' ? imageUrl : '',
            quantity: qty,
            price: price,
            lineTotal: lineTotal,
            selectedOptions: mergedSelectedOptions
          });
        }
      }

      // Tính toán khuyến mãi và phí vận chuyển thực tế (đồng bộ 100% từ bảng Voucher PostgreSQL)
      await ensureDefaultFreeshipVouchers();
      const subTotalNum = Number(subTotal);
      let discountAmountNum = 0;
      let freeshipDiscountNum = 0;
      const appliedVoucherCodes: string[] = [];

      const validateAndConsumeVoucher = async (rawCode: string, expectedFreeship: boolean) => {
        const cleanCode = rawCode.trim().toUpperCase().replace(/\s+/g, '');
        if (!cleanCode) return null;

        const voucher = await (prisma as any).voucher.findUnique({
          where: { code: cleanCode }
        }).catch(() => null);

        if (!voucher || !voucher.isActive) return null;

        const now = new Date();
        const { start, end } = getVoucherEffectiveRange(voucher.startDate, voucher.endDate);
        const isDateValid = start <= now && now <= end;
        const isQuotaValid = !voucher.usageLimit || voucher.usageLimit <= 0 || (voucher.usedCount || 0) < voucher.usageLimit;
        const isMinOrderValid = subTotalNum >= (voucher.minOrderValue || 0);
        if (!isDateValid || !isQuotaValid || !isMinOrderValid) return null;

        // Kiểm tra giới hạn lượt dùng trên mỗi khách hàng
        if (voucher.perCustomerLimit > 0 && (customerId || phone)) {
          const customerUsedCount = await prisma.order.count({
            where: {
              status: { not: 'CANCELLED' },
              promoCode: { contains: voucher.code },
              ...(customerId ? { customerId } : { phone: phone.trim() })
            }
          }).catch(() => 0);
          if (customerUsedCount >= voucher.perCustomerLimit) return null;
        }

        const isFs = isFreeshipVoucher(voucher.code);
        if (expectedFreeship !== isFs) return null;

        let disc = 0;
        if (voucher.discountType === 'PERCENT') {
          disc = Math.round((subTotalNum * voucher.discountValue) / 100);
          if (voucher.maxDiscountCap && voucher.maxDiscountCap > 0) {
            disc = Math.min(disc, voucher.maxDiscountCap);
          }
        } else {
          disc = isFs ? voucher.discountValue : Math.min(voucher.discountValue, subTotalNum);
        }

        // Tăng usedCount trong DB
        await (prisma as any).voucher.update({
          where: { code: voucher.code },
          data: { usedCount: { increment: 1 } }
        }).catch((e: any) => console.warn('[WARN] Không thể tăng usedCount của voucher:', e));

        return { code: voucher.code, discount: disc, isFreeShip: isFs };
      };

      // 1. Áp dụng mã giảm giá sản phẩm (hoặc nếu khách gửi mã FREESHIP qua voucherCode)
      if (voucherCode && typeof voucherCode === 'string') {
        const cleanPrimary = voucherCode.trim().toUpperCase().replace(/\s+/g, '');
        if (isFreeshipVoucher(cleanPrimary)) {
          const resFs = await validateAndConsumeVoucher(cleanPrimary, true);
          if (resFs) {
            freeshipDiscountNum = Math.max(freeshipDiscountNum, resFs.discount);
            appliedVoucherCodes.push(resFs.code);
          }
        } else {
          const resProd = await validateAndConsumeVoucher(cleanPrimary, false);
          if (resProd) {
            discountAmountNum = resProd.discount;
            appliedVoucherCodes.push(resProd.code);
          }
        }
      }

      // 2. Áp dụng mã miễn phí vận chuyển (hỗ trợ dùng song song cùng mã sản phẩm)
      if (freeshipVoucherCode && typeof freeshipVoucherCode === 'string' && subTotalNum < 50000000) {
        const cleanFs = freeshipVoucherCode.trim().toUpperCase().replace(/\s+/g, '');
        if (cleanFs && !appliedVoucherCodes.includes(cleanFs)) {
          const resFs = await validateAndConsumeVoucher(cleanFs, true);
          if (resFs) {
            freeshipDiscountNum = Math.max(freeshipDiscountNum, resFs.discount);
            appliedVoucherCodes.push(resFs.code);
          }
        }
      }

      const appliedVoucherCode = appliedVoucherCodes.length > 0 ? appliedVoucherCodes.join(', ') : null;
      const discountAmount = BigInt(discountAmountNum);
      const baseShippingFee = (subTotalNum === 0 || subTotalNum >= 50000000) ? 0 : 250000;
      const finalShippingFeeNum = Math.max(0, baseShippingFee - freeshipDiscountNum);
      const shippingFee = BigInt(finalShippingFeeNum);
      
      const rawTotal = subTotal + shippingFee - discountAmount;
      const totalAmount = rawTotal > BigInt(0) ? rawTotal : BigInt(0);
      const isHighValue = totalAmount > BigInt(50000000);

      // Mã đơn hàng định dạng DC-xxxxxx
      const orderNumber = `DC-${Math.floor(100000 + Math.random() * 900000)}`;

      // Lưu đơn vào Database
      const order = await prisma.order.create({
        data: {
          orderNumber,
          customerId,
          receiverName: receiverName.trim(),
          phone: phone.trim(),
          email: email ? email.trim() : null,
          province: province ? String(province).trim() : 'TP. Hồ Chí Minh',
          district: district ? String(district).trim() : null,
          ward: ward ? String(ward).trim() : null,
          detailAddress: (() => {
            let d = detailAddress ? String(detailAddress).trim() : address.trim();
            if (province && d.toLowerCase().includes(String(province).toLowerCase())) {
              d = d.split(',')[0].trim();
            }
            return d;
          })(),
          companyName: invoice?.companyName ? String(invoice.companyName).trim() : null,
          taxCode: invoice?.taxCode ? String(invoice.taxCode).trim() : null,
          isGift: !!isGift,
          hideInvoicePrice: !!hideInvoicePrice,
          giftMessage: shippingNotes || null,
          subTotal,
          shippingFee,
          discountAmount,
          totalAmount,
          promoCode: appliedVoucherCode,
          status: 'PENDING',
          paymentMethod: paymentMethod === 'COD' ? 'COD' : (paymentMethod === 'VNPAY' ? 'VNPAY' : (paymentMethod === 'CREDIT_CARD' ? 'CREDIT_CARD' : 'BANK_TRANSFER')),
          paymentStatus: 'UNPAID',
          expiresAt: (isHighValue || paymentMethod === 'BANK_TRANSFER') ? new Date(Date.now() + 24 * 60 * 60 * 1000) : null,
          notes: isHighValue ? 'Chờ đặt cọc trong 24h' : (shippingNotes || null),
          internalNotes: isHighValue ? 'Chờ đặt cọc (Đơn giá trị lớn trên 50 triệu)' : null,
          items: orderItemsCreate.length > 0 ? {
            create: orderItemsCreate
          } : undefined,
          statusHistory: {
            create: [
              {
                status: 'PENDING',
                actorType: 'CUSTOMER',
                notes: isHighValue
                  ? 'Đơn hàng trên 50 triệu - Trạng thái: Chờ đặt cọc trong 24h'
                  : (appliedVoucherCode ? `Khách hàng tạo đơn áp dụng mã ưu đãi ${appliedVoucherCode}` : 'Khách hàng tạo đơn thành công')
              }
            ]
          }
        }
      });

      // Tự động xóa các sản phẩm đã mua khỏi giỏ hàng nếu khách đã đăng nhập
      if (customerId && purchasedVariantIds.length > 0) {
        await prisma.cartItem.deleteMany({
          where: {
            customerId,
            variantId: { in: purchasedVariantIds }
          }
        }).catch((err) => console.warn('Không thể xóa cartItem sau khi đặt hàng:', err));
      }

      // Không cộng totalSpent / rewardPoints lúc đơn mới tạo (PENDING).
      // Điểm thưởng và hạng thành viên chỉ được đồng bộ khi đơn giao thành công (DELIVERED / COMPLETED).

      res.status(201).json(serializeBigInt({
        success: true,
        orderNumber: order.orderNumber,
        id: order.id,
        status: isHighValue ? 'WAITING_DEPOSIT' : order.status,
        statusLabel: isHighValue ? 'Chờ đặt cọc' : 'Chờ xác nhận',
        totalAmount: Number(order.totalAmount),
        subTotal: Number(order.subTotal),
        discountAmount: Number(order.discountAmount),
        shippingFee: Number(order.shippingFee),
        promoCode: order.promoCode,
        isHighValue,
        depositAmount: isHighValue ? Math.round(Number(order.totalAmount) * 0.3) : 0,
        createdAt: order.createdAt,
        expiresAt: order.expiresAt
      }));
    } catch (error: any) {
      console.error('Lỗi khi tạo đơn hàng:', error);
      res.status(500).json({
        message: 'Có lỗi xảy ra khi lưu đơn hàng vào hệ thống.',
        error: error?.message
      });
    }
  },

  // Lấy danh sách đơn hàng của khách (hỗ trợ lọc tab & tìm kiếm)
  getMyOrders: async (req: Request, res: Response): Promise<void> => {
    try {
      // Đã chuyển dọn dẹp sang background worker 5 phút, không bắt request của khách hàng phải gánh

      let customerId: string | null = null;
      let customerPhone: string | null = null;

      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
          const decoded = jwt.verify(token, JWT_SECRET) as any;
          customerId = decoded?.userId || null;
          customerPhone = decoded?.phone || null;
        } catch (_) {}
      }

      // Khách vãng lai xác thực SĐT: cho phép truyền qua query phone hoặc header x-guest-phone
      const queryPhone = req.query.phone as string;
      const headerPhone = req.headers['x-guest-phone'] as string;
      if (queryPhone && queryPhone.trim()) {
        customerPhone = queryPhone.trim();
      } else if (headerPhone && headerPhone.trim()) {
        customerPhone = headerPhone.trim();
      }

      if (!customerId && !customerPhone) {
        res.json([]);
        return;
      }

      const { status: statusFilter, search } = req.query;

      const orConditions: any[] = [];
      if (customerId) orConditions.push({ customerId });
      if (customerPhone) orConditions.push({ phone: customerPhone });

      if (orConditions.length === 0) {
        res.json([]);
        return;
      }

      const whereClause: any = {
        OR: orConditions
      };

      if (statusFilter && statusFilter !== 'ALL') {
        if (statusFilter === 'WAITING_DEPOSIT' || statusFilter === 'WAITING_PAYMENT') {
          whereClause.paymentStatus = 'UNPAID';
          whereClause.depositPaid = BigInt(0);
          whereClause.status = { not: 'CANCELLED' };
          whereClause.AND = [
            {
              OR: [
                { totalAmount: { gt: BigInt(50000000) } },
                { paymentMethod: 'BANK_TRANSFER' }
              ]
            }
          ];
        } else {
          whereClause.status = statusFilter;
        }
      }

      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50));
      const skip = (page - 1) * limit;

      const orders = await prisma.order.findMany({
        where: whereClause,
        include: {
          items: true
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: limit,
        skip: skip
      });

      // Filter by search keyword if provided
      let filteredOrders = orders;
      if (search && typeof search === 'string' && search.trim()) {
        const query = search.trim().toLowerCase();
        filteredOrders = orders.filter(o => {
          const matchOrderNum = o.orderNumber.toLowerCase().includes(query);
          const matchReceiver = o.receiverName.toLowerCase().includes(query);
          const matchItem = o.items.some(i => i.productName.toLowerCase().includes(query));
          return matchOrderNum || matchReceiver || matchItem;
        });
      }

      const formatted = filteredOrders.map(o => {
        const isHighValue = o.totalAmount > BigInt(50000000) || !!o.isHighValue;
        const isBankTransfer = o.paymentMethod === 'BANK_TRANSFER' || (o.paymentMethod as any) === 'BANKING';
        const requiresDepositOrPayment = isHighValue || isBankTransfer || !!o.isDepositRequired;

        const rawExpiresAt = o.expiresAt || (requiresDepositOrPayment ? new Date(new Date(o.createdAt).getTime() + 24 * 60 * 60 * 1000) : null);

        let isExpired = false;
        let isExpiringSoon = false;
        let remainingExpirySeconds = 0;

        const oIsPaidOrDeposited = o.paymentStatus === 'PAID' || o.paymentStatus === 'PARTIAL' || Number(o.depositPaid || 0) > 0;
        if (rawExpiresAt && (o.status as any) !== 'CANCELLED' && !oIsPaidOrDeposited) {
          const diffMs = new Date(rawExpiresAt).getTime() - Date.now();
          if (diffMs <= 0) {
            isExpired = true;
            (o as any).status = 'CANCELLED';
            prisma.order.update({
              where: { id: o.id },
              data: {
                status: 'CANCELLED',
                cancelledAt: new Date(),
                cancelledBy: 'SYSTEM',
                cancelReason: 'Hệ thống tự động hủy do quá hạn đặt cọc / chuyển khoản trong vòng 24 giờ.'
              }
            }).catch(() => {});
          } else {
            remainingExpirySeconds = Math.floor(diffMs / 1000);
            if (diffMs <= 30 * 60 * 1000) {
              isExpiringSoon = true;
            }
          }
        }

        const isDeliveredWaiting = (o.status === 'DELIVERED') && o.deliveredAt && (Date.now() - new Date(o.deliveredAt).getTime() < 5 * 60 * 1000);
        const remainingConfirmSeconds = isDeliveredWaiting && o.deliveredAt
          ? Math.max(0, Math.floor((5 * 60 * 1000 - (Date.now() - new Date(o.deliveredAt).getTime())) / 1000))
          : 0;

        const isPaidOrDeposited = o.paymentStatus === 'PAID' || o.paymentStatus === 'PARTIAL' || Number(o.depositPaid || 0) > 0;
        let displayStatus = 'Chờ xác nhận';
        if ((o.status as any) === 'CANCELLED') {
          displayStatus = 'Đã hủy';
        } else if (isHighValue && !isPaidOrDeposited && o.status === 'PENDING') {
          displayStatus = 'Chờ đặt cọc';
        } else if (isBankTransfer && !isPaidOrDeposited && o.status === 'PENDING') {
          displayStatus = 'Chờ thanh toán';
        } else if (o.status === 'CONFIRMED') {
          displayStatus = 'Đã xác nhận';
        } else if (o.status === 'PROCESSING') {
          displayStatus = 'Đang chuẩn bị hàng';
        } else if (o.status === 'SHIPPED') {
          displayStatus = 'Đang giao hàng';
        } else if (o.status === 'DELIVERED') {
          displayStatus = isDeliveredWaiting ? 'Đang giao (Shipper báo đã giao)' : 'Đã giao hàng (Hoàn tất)';
        } else if ((o.status as any) === 'COMPLETED') {
          displayStatus = 'Đã giao hàng (Hoàn tất)';
        } else if (o.status === 'RETURNED') {
          displayStatus = 'Đổi trả';
        }

        const firstItem = o.items[0] || null;

        return {
          id: o.orderNumber,
          orderNumber: o.orderNumber,
          dbId: o.id,
          date: o.createdAt.toISOString().split('T')[0],
          createdAt: o.createdAt,
          deliveredAt: o.deliveredAt,
          updatedAt: o.updatedAt,
          isDeliveredWaitingConfirm: !!isDeliveredWaiting,
          remainingConfirmSeconds,
          expiresAt: rawExpiresAt,
          isExpired,
          isExpiringSoon,
          remainingExpirySeconds,
          cancelledAt: o.cancelledAt,
          total: Number(o.totalAmount),
          totalAmount: Number(o.totalAmount),
          subTotal: Number(o.subTotal),
          shippingFee: Number(o.shippingFee),
          discountAmount: Number(o.discountAmount),
          status: o.status,
          displayStatus,
          paymentMethod: o.paymentMethod,
          paymentStatus: (() => {
            if (o.paymentMethod === 'BANK_TRANSFER' && o.paymentStatus === 'UNPAID') {
              if (['CONFIRMED', 'PROCESSING', 'READY_TO_SHIP', 'SHIPPED', 'DELIVERED', 'COMPLETED'].includes(o.status)) {
                return isHighValue ? 'PARTIAL' : 'PAID';
              }
            }
            return o.paymentStatus;
          })(),
          isHighValue,
          depositAmount: isHighValue ? Math.round(Number(o.totalAmount) * 0.3) : 0,
          items: o.items.length || 1,
          firstItem: firstItem ? {
            productName: firstItem.productName,
            sku: firstItem.sku,
            imageUrl: firstItem.imageUrl,
            price: firstItem.price,
            quantity: firstItem.quantity,
            variantDescription: firstItem.variantDescription,
            selectedOptions: firstItem.selectedOptions
          } : null,
          allItems: o.items.map(it => ({
            id: it.id,
            productId: it.productId,
            variantId: it.variantId,
            productName: it.productName,
            sku: it.sku,
            imageUrl: it.imageUrl,
            price: it.price,
            quantity: it.quantity,
            lineTotal: Number(it.lineTotal),
            variantDescription: it.variantDescription,
            selectedOptions: it.selectedOptions
          })),
          shippingInfo: {
            receiverName: o.receiverName,
            phone: o.phone,
            email: o.email,
            province: o.province,
            district: o.district,
            ward: o.ward,
            detailAddress: o.detailAddress
          },
          statusHistory: [],
          notes: o.notes,
          cancelReason: o.cancelReason
        };
      });

      res.json(serializeBigInt(formatted));
    } catch (error: any) {
      console.error('Lỗi khi lấy danh sách đơn hàng:', error);
      res.status(500).json({ message: 'Không thể lấy danh sách đơn hàng.' });
    }
  },

  // Lấy chi tiết một đơn hàng
  getOrderDetail: async (req: Request, res: Response): Promise<void> => {
    try {

      const orderNumber = String(req.params.orderNumber);

      const order: any = await prisma.order.findUnique({
        where: { orderNumber },
        include: {
          items: true,
          statusHistory: {
            orderBy: { createdAt: 'desc' }
          },
          payments: true
        }
      });

      if (!order) {
        res.status(404).json({ message: 'Không tìm thấy thông tin đơn hàng.' });
        return;
      }

      const isHighValue = order.totalAmount > BigInt(50000000);
      let displayStatus = 'Chờ xác nhận';
      if (isHighValue && order.paymentStatus !== 'PAID' && order.status !== 'CANCELLED') {
        displayStatus = 'Chờ đặt cọc';
      } else if ((order.paymentMethod === 'BANK_TRANSFER' || (order.paymentMethod as any) === 'BANKING') && order.paymentStatus !== 'PAID' && order.status === 'PENDING') {
        displayStatus = 'Chờ thanh toán';
      } else if (order.status === 'CONFIRMED') {
        displayStatus = 'Đã xác nhận';
      } else if (order.status === 'PROCESSING') {
        displayStatus = 'Đang chuẩn bị hàng';
      } else if (order.status === 'SHIPPED') {
        displayStatus = 'Đang giao hàng';
      } else if (order.status === 'DELIVERED') {
        displayStatus = 'Đã giao hàng';
      } else if (order.status === 'CANCELLED') {
        displayStatus = 'Đã hủy';
      } else if (order.status === 'RETURNED') {
        displayStatus = 'Đổi trả';
      }

      res.json(serializeBigInt({
        id: order.orderNumber,
        orderNumber: order.orderNumber,
        dbId: order.id,
        createdAt: order.createdAt,
        expiresAt: order.expiresAt || ((isHighValue || order.paymentMethod === 'BANK_TRANSFER') ? new Date(new Date(order.createdAt).getTime() + 24 * 60 * 60 * 1000) : null),
        cancelledAt: order.cancelledAt,
        totalAmount: Number(order.totalAmount),
        subTotal: Number(order.subTotal),
        shippingFee: Number(order.shippingFee),
        discountAmount: Number(order.discountAmount),
        status: order.status,
        displayStatus,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        isHighValue,
        depositAmount: isHighValue ? Math.round(Number(order.totalAmount) * 0.3) : 0,
        paidAmount: order.paymentStatus === 'PAID' 
          ? Number(order.totalAmount) 
          : (order.paymentStatus === 'PARTIAL' ? Math.round(Number(order.totalAmount) * 0.3) : 0),
        remainingAmount: order.paymentStatus === 'PAID'
          ? 0
          : (order.paymentStatus === 'PARTIAL' ? Number(order.totalAmount) - Math.round(Number(order.totalAmount) * 0.3) : Number(order.totalAmount)),
        receiverName: order.receiverName,
        phone: order.phone,
        email: order.email,
        province: order.province,
        district: order.district,
        ward: order.ward,
        detailAddress: order.detailAddress,
        notes: order.notes,
        cancelReason: order.cancelReason,
        shippingProvider: order.shippingProvider,
        trackingCode: order.trackingCode,
        items: (order.items || []).map((it: any) => ({
          id: it.id,
          productId: it.productId,
          variantId: it.variantId,
          productName: it.productName,
          sku: it.sku,
          imageUrl: it.imageUrl,
          price: it.price,
          quantity: it.quantity,
          lineTotal: Number(it.lineTotal),
          variantDescription: it.variantDescription,
          selectedOptions: it.selectedOptions
        })),
        statusHistory: (order.statusHistory || []).map((sh: any) => ({
          id: sh.id,
          status: sh.status,
          actorType: sh.actorType,
          notes: sh.notes,
          createdAt: sh.createdAt
        })),
        payments: (order.payments || []).map((p: any) => ({
          id: p.id,
          transactionCode: p.transactionCode,
          amount: Number(p.amount),
          paymentMethod: p.paymentMethod,
          status: p.status,
          createdAt: p.createdAt
        }))
      }));
    } catch (error) {
      console.error('Lỗi getOrderDetail:', error);
      res.status(500).json({ message: 'Không thể lấy thông tin chi tiết đơn hàng.' });
    }
  },

  // Hủy đơn hàng (chỉ cho phép khi đơn PENDING và chưa thanh toán)
  cancelOrder: async (req: Request, res: Response): Promise<void> => {
    try {
      const orderNumber = String(req.params.orderNumber);
      const { reason } = req.body;

      const order = await prisma.order.findUnique({
        where: { orderNumber }
      });

      if (!order) {
        res.status(404).json({ message: 'Không tìm thấy đơn hàng.' });
        return;
      }

      if (order.status !== 'PENDING') {
        res.status(400).json({ message: 'Chỉ có thể hủy đơn hàng khi đơn đang ở trạng thái Chờ xác nhận hoặc Chờ đặt cọc.' });
        return;
      }

      const updated = await prisma.order.update({
        where: { orderNumber },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          cancelReason: reason || 'Khách hàng yêu cầu hủy đơn'
        }
      });

      await prisma.orderStatusHistory.create({
        data: {
          orderId: order.id,
          status: 'CANCELLED',
          fromStatus: order.status,
          actorType: 'CUSTOMER',
          notes: `Khách hàng hủy đơn: ${reason || 'Không nêu lý do'}`
        }
      });

      res.json({ message: 'Hủy đơn hàng thành công.', orderNumber: updated.orderNumber, status: 'CANCELLED' });
    } catch (error) {
      console.error('Lỗi cancelOrder:', error);
      res.status(500).json({ message: 'Lỗi khi hủy đơn hàng.' });
    }
  },

  // Khách hàng xác nhận đã nhận được hàng
  confirmReceived: async (req: Request, res: Response): Promise<void> => {
    try {
      const orderNumber = String(req.params.orderNumber);

      const order = await prisma.order.findUnique({
        where: { orderNumber }
      });

      if (!order) {
        res.status(404).json({ message: 'Không tìm thấy đơn hàng.' });
        return;
      }

      if (order.status !== 'SHIPPED' && order.status !== 'DELIVERED') {
        res.status(400).json({ message: 'Đơn hàng chưa được giao đi, không thể xác nhận nhận hàng.' });
        return;
      }

      const updated = await prisma.order.update({
        where: { orderNumber },
        data: {
          status: 'COMPLETED',
          deliveredAt: order.deliveredAt || new Date()
        }
      });

      await prisma.orderStatusHistory.create({
        data: {
          orderId: order.id,
          status: 'COMPLETED',
          fromStatus: order.status,
          actorType: 'CUSTOMER',
          notes: 'Khách hàng đã nhận hàng và xác nhận hoàn tất hài lòng.'
        }
      });

      res.json({ message: 'Xác nhận đã nhận hàng thành công.', orderNumber: updated.orderNumber, status: 'COMPLETED' });
    } catch (error) {
      console.error('Lỗi confirmReceived:', error);
      res.status(500).json({ message: 'Lỗi khi xác nhận nhận hàng.' });
    }
  },

  // Yêu cầu đổi trả hàng
  requestReturn: async (req: Request, res: Response): Promise<void> => {
    try {
      const orderNumber = String(req.params.orderNumber);
      const { reason, description, images } = req.body;

      const order = await prisma.order.findUnique({
        where: { orderNumber },
        include: { items: true }
      });

      if (!order) {
        res.status(404).json({ message: 'Không tìm thấy đơn hàng.' });
        return;
      }

      if (order.status !== 'DELIVERED' && (order.status as any) !== 'COMPLETED') {
        res.status(400).json({ message: 'Chỉ có thể yêu cầu đổi trả cho đơn hàng đã hoàn tất.' });
        return;
      }

      const updated = await prisma.order.update({
        where: { orderNumber },
        data: {
          status: 'RETURNED'
        }
      });

      await prisma.orderStatusHistory.create({
        data: {
          orderId: order.id,
          status: 'RETURNED',
          fromStatus: order.status,
          actorType: 'CUSTOMER',
          notes: `[Yêu cầu đổi trả] Lý do: ${reason}. Chi tiết: ${description || 'Không có mô tả'}. Ảnh đính kèm: ${(images || []).join(', ')}`
        }
      });

      // Đồng bộ vào inMemoryReturns với trạng thái mặc định PENDING ("Chờ duyệt")
      const firstItem = order.items?.[0];
      const returnId = `RET-${order.orderNumber.replace('ORD-', '')}`;
      const existingIdx = inMemoryReturns.findIndex(r => r.orderNumber === orderNumber);
      const newReturnObj = {
        id: returnId,
        customerId: order.customerId || 'guest',
        orderNumber: order.orderNumber,
        productName: firstItem ? firstItem.productName : 'Sản phẩm nội thất',
        sku: firstItem?.sku || '',
        imageUrl: firstItem?.imageUrl || '',
        variantDescription: firstItem?.variantDescription || '',
        quantity: firstItem?.quantity || 1,
        price: firstItem ? Number(firstItem.price) : Number(order.totalAmount),
        reason: reason || 'Sản phẩm lỗi kỹ thuật do nhà sản xuất',
        description: description ? description.trim() : '',
        images: Array.isArray(images) ? images : [],
        status: 'PENDING' as const,
        statusLabel: 'Chờ duyệt',
        refundAmount: Number(order.totalAmount),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (existingIdx >= 0) {
        inMemoryReturns[existingIdx] = newReturnObj;
      } else {
        inMemoryReturns.unshift(newReturnObj);
      }

      res.json({
        message: 'Gửi yêu cầu đổi trả thành công. Yêu cầu của bạn đang ở trạng thái Chờ duyệt.',
        status: 'PENDING',
        returnId
      });
    } catch (error) {
      console.error('Lỗi requestReturn:', error);
      res.status(500).json({ message: 'Lỗi khi gửi yêu cầu đổi trả.' });
    }
  },

  // Đánh giá sản phẩm đã mua
  submitReview: async (req: Request, res: Response): Promise<void> => {
    try {
      const orderNumber = String(req.params.orderNumber);
      const { rating, comment, itemId } = req.body;

      const order = await prisma.order.findUnique({
        where: { orderNumber }
      });

      if (!order) {
        res.status(404).json({ message: 'Không tìm thấy đơn hàng.' });
        return;
      }

      await prisma.orderStatusHistory.create({
        data: {
          orderId: order.id,
          status: order.status,
          actorType: 'CUSTOMER',
          notes: `[Đánh giá sản phẩm ${itemId || ''}] Số sao: ${rating}/5 ⭐. Nhận xét: ${comment || 'Hài lòng'}`
        }
      });

      res.json({ message: 'Cảm ơn bạn đã gửi đánh giá cho sản phẩm!' });
    } catch (error) {
      console.error('Lỗi submitReview:', error);
      res.status(500).json({ message: 'Lỗi khi gửi đánh giá.' });
    }
  },

  // Tra cứu địa chỉ đã đặt hàng qua số điện thoại (khách vãng lai)
  getAddressByPhone: async (req: Request, res: Response): Promise<void> => {
    try {
      const phone = (req.query.phone as string || '').trim();
      if (!phone || !/^(0)(3[2-9]|5[2689]|7[06-9]|8[1-9]|9[0-9])[0-9]{7}$/.test(phone)) {
        res.status(400).json({ message: 'Số điện thoại không hợp lệ.' });
        return;
      }

      // Lấy tối đa 5 địa chỉ gần nhất từ các đơn hàng cũa số điện thoại này
      const orders = await prisma.order.findMany({
        where: { phone },
        select: {
          receiverName: true,
          phone: true,
          province: true,
          district: true,
          ward: true,
          detailAddress: true
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      });

      // Loại bỏ trùng lặp theo địa chỉ đầy đủ
      const seen = new Set<string>();
      const uniqueAddresses = orders.filter(o => {
        const key = [o.detailAddress, o.ward, o.district, o.province].filter(Boolean).join(', ');
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      res.json(uniqueAddresses);
    } catch (error: any) {
      console.error('Lỗi tra cứu địa chỉ:', error);
      res.status(500).json({ message: 'Không thể tra cứu địa chỉ.' });
    }
  },

  // === DÀNH CHO ADMIN: QUẢN LÝ ĐƠN HÀNG ===

  // GET /api/admin/orders - Danh sách đơn hàng phía Quản trị
  getAdminOrders: async (req: Request, res: Response): Promise<void> => {
    try {
      await autoCancelExpiredOrders();

      const { status, search, paymentStatus } = req.query;
      const where: any = {};

      if (status && status !== 'ALL') {
        if (status === 'HIGH_VALUE') {
          where.totalAmount = { gt: BigInt(50000000) };
        } else {
          where.status = status;
        }
      }

      if (paymentStatus && paymentStatus !== 'ALL') {
        where.paymentStatus = paymentStatus;
      }

      if (search && typeof search === 'string' && search.trim()) {
        const query = search.trim();
        where.OR = [
          { orderNumber: { contains: query, mode: 'insensitive' } },
          { phone: { contains: query, mode: 'insensitive' } },
          { receiverName: { contains: query, mode: 'insensitive' } }
        ];
      }

      const orders = await prisma.order.findMany({
        where,
        include: {
          items: true,
          customer: true
        },
        orderBy: { createdAt: 'desc' }
      });

      const formatted = orders.map(o => {
        const isHighValue = o.totalAmount > BigInt(50000000);
        const fullAddr = [o.detailAddress, o.ward, o.district, o.province].filter(Boolean).join(', ');
        return {
          id: o.orderNumber,
          dbId: o.id,
          customerName: o.receiverName,
          phone: o.phone,
          email: o.email || o.customer?.email || '',
          address: fullAddr,
          province: o.province,
          district: o.district,
          ward: o.ward,
          detailAddress: o.detailAddress,
          products: o.items.map(i => ({
            name: i.productName,
            sku: i.sku || 'SKU-DCOR',
            quantity: i.quantity,
            price: i.price,
            imageUrl: i.imageUrl,
            lineTotal: Number(i.lineTotal)
          })),
          subTotal: Number(o.subTotal),
          shippingFee: Number(o.shippingFee),
          discountAmount: Number(o.discountAmount),
          totalAmount: Number(o.totalAmount),
          status: o.status,
          paymentStatus: o.paymentStatus,
          paymentMethod: o.paymentMethod === 'BANK_TRANSFER' ? 'Chuyển khoản' : (o.paymentMethod === 'COD' ? 'Tiền mặt' : (o.paymentMethod === 'VNPAY' ? 'VNPAY' : 'Thẻ tín dụng')),
          showroom: o.shippingProvider || 'Kho Tổng',
          createdAt: o.createdAt.toISOString().replace('T', ' ').substring(0, 16),
          expiresAt: o.expiresAt,
          cancelledAt: o.cancelledAt,
          isGift: o.isGift,
          giftMessage: o.giftMessage,
          hidePrice: o.hideInvoicePrice,
          isHighValue,
          promoCode: o.promoCode,
          notes: o.notes,
          internalNotes: o.internalNotes
        };
      });

      res.json(serializeBigInt(formatted));
    } catch (error) {
      console.error('Lỗi getAdminOrders:', error);
      res.status(500).json({ message: 'Lỗi tải danh sách đơn hàng Admin.' });
    }
  },

  // GET /api/admin/orders/:id - Chi tiết đơn hàng Admin
  getAdminOrderDetail: async (req: Request, res: Response): Promise<void> => {
    try {
      await autoCancelExpiredOrders();

      const idOrNumber = String(req.params.id);
      const order = await prisma.order.findFirst({
        where: {
          OR: [
            { orderNumber: idOrNumber },
            { id: idOrNumber }
          ]
        },
        include: {
          items: true,
          customer: true,
          statusHistory: {
            orderBy: { createdAt: 'desc' }
          },
          payments: true
        }
      });

      if (!order) {
        res.status(404).json({ message: 'Không tìm thấy thông tin đơn hàng.' });
        return;
      }

      const isHighValue = order.totalAmount > BigInt(50000000);
      const rawTokens = [order.detailAddress, order.ward, order.district, order.province].filter(Boolean).join(', ').split(',').map(s => s.trim()).filter(Boolean);
      const seenTokens = new Set<string>();
      const uniqueAddrParts: string[] = [];
      for (const tok of rawTokens) {
        if (!seenTokens.has(tok.toLowerCase())) {
          seenTokens.add(tok.toLowerCase());
          uniqueAddrParts.push(tok);
        }
      }
      const fullAddr = uniqueAddrParts.join(', ');

      const effectivePaymentStatus = (() => {
        if (order.paymentMethod === 'BANK_TRANSFER' && order.paymentStatus === 'UNPAID') {
          if (['CONFIRMED', 'PROCESSING', 'READY_TO_SHIP', 'SHIPPED', 'DELIVERED', 'COMPLETED'].includes(order.status)) {
            return isHighValue ? 'PARTIAL' : 'PAID';
          }
        }
        return order.paymentStatus;
      })();

      res.json(serializeBigInt({
        id: order.orderNumber,
        orderNumber: order.orderNumber,
        dbId: order.id,
        createdAt: order.createdAt.toISOString().replace('T', ' ').substring(0, 16),
        rawCreatedAt: order.createdAt,
        expiresAt: order.expiresAt,
        cancelledAt: order.cancelledAt,
        totalAmount: Number(order.totalAmount),
        subTotal: Number(order.subTotal),
        shippingFee: Number(order.shippingFee),
        discountAmount: Number(order.discountAmount),
        promoCode: order.promoCode,
        status: order.status,
        paymentMethod: order.paymentMethod === 'BANK_TRANSFER' ? 'Chuyển khoản' : (order.paymentMethod === 'COD' ? 'Tiền mặt' : (order.paymentMethod === 'VNPAY' ? 'VNPAY' : 'Thẻ tín dụng')),
        paymentStatus: effectivePaymentStatus,
        isHighValue,
        depositAmount: isHighValue ? Math.round(Number(order.totalAmount) * 0.3) : 0,
        paidAmount: effectivePaymentStatus === 'PAID'
          ? Number(order.totalAmount)
          : (effectivePaymentStatus === 'PARTIAL' ? Math.round(Number(order.totalAmount) * 0.3) : 0),
        remainingAmount: effectivePaymentStatus === 'PAID'
          ? 0
          : (effectivePaymentStatus === 'PARTIAL' ? Number(order.totalAmount) - Math.round(Number(order.totalAmount) * 0.3) : Number(order.totalAmount)),
        customerName: order.receiverName,
        phone: order.phone,
        email: order.email || order.customer?.email || '',
        customerType: order.customer?.type === 'B2B' ? 'B2B' : (order.companyName ? 'B2B' : 'Cá nhân'),
        companyName: order.companyName,
        taxCode: order.taxCode,
        address: fullAddr,
        detailAddress: order.detailAddress,
        province: order.province,
        district: order.district,
        ward: order.ward,
        shippingProvider: order.shippingProvider || 'Giao Hàng Nhanh (GHN)',
        trackingCode: order.trackingCode || `GHN-${order.orderNumber.replace('DC-', '')}`,
        showroom: order.shippingProvider || 'Kho Tổng',
        notes: order.notes,
        internalNotes: order.internalNotes,
        isGift: order.isGift,
        giftMessage: order.giftMessage,
        hidePrice: order.hideInvoicePrice,
        products: order.items.map(i => ({
          id: i.id,
          name: i.productName,
          sku: i.sku || 'SKU-DCOR',
          quantity: i.quantity,
          price: i.price,
          lineTotal: Number(i.lineTotal),
          imageUrl: i.imageUrl,
          variantDescription: i.variantDescription,
          selectedOptions: i.selectedOptions
        })),
        statusHistory: order.statusHistory.map(sh => ({
          id: sh.id,
          status: sh.status,
          actorType: sh.actorType,
          notes: sh.notes,
          createdAt: sh.createdAt.toISOString().replace('T', ' ').substring(0, 16)
        }))
      }));
    } catch (error) {
      console.error('Lỗi getAdminOrderDetail:', error);
      res.status(500).json({ message: 'Không thể lấy thông tin chi tiết đơn hàng.' });
    }
  },

  // PUT /api/admin/orders/:id/status & /api/store/orders/:orderNumber/status - Cập nhật trạng thái đơn hàng (Đồng bộ)
  updateAdminOrderStatus: async (req: Request, res: Response): Promise<void> => {
    try {
      const idOrNumber = String(req.params.id || req.params.orderNumber);
      const { status, notes, actorName } = req.body;

      if (!status) {
        res.status(400).json({ message: 'Vui lòng cung cấp trạng thái cần chuyển.' });
        return;
      }

      const order = await prisma.order.findFirst({
        where: {
          OR: [{ orderNumber: idOrNumber }, { id: idOrNumber }]
        }
      });

      if (!order) {
        res.status(404).json({ message: 'Không tìm thấy đơn hàng.' });
        return;
      }

      const updateData: any = { status };
      const now = new Date();

      if (status === 'PENDING') {
        updateData.cancelledAt = null;
        updateData.cancelReason = null;
        updateData.deliveredAt = null;
        updateData.shippedAt = null;
      } else if (status === 'CONFIRMED' || status === 'PROCESSING') {
        updateData.cancelledAt = null;
        updateData.cancelReason = null;
        if (order.paymentMethod === 'BANK_TRANSFER' && order.paymentStatus === 'UNPAID') {
          updateData.paymentStatus = (order.totalAmount > BigInt(50000000)) ? 'PARTIAL' : 'PAID';
          updateData.paidAt = now;
        }
      } else if (status === 'SHIPPED') {
        updateData.shippedAt = now;
        updateData.cancelledAt = null;
        updateData.cancelReason = null;
        if (order.paymentMethod === 'BANK_TRANSFER' && order.paymentStatus === 'UNPAID') {
          updateData.paymentStatus = (order.totalAmount > BigInt(50000000)) ? 'PARTIAL' : 'PAID';
          updateData.paidAt = now;
        }
      } else if (status === 'DELIVERED') {
        updateData.deliveredAt = now;
        updateData.paymentStatus = 'PAID';
        updateData.paidAt = now;
        updateData.cancelledAt = null;
        updateData.cancelReason = null;
      } else if (status === 'COMPLETED') {
        updateData.deliveredAt = order.deliveredAt || now;
        updateData.paymentStatus = 'PAID';
        updateData.paidAt = order.paidAt || now;
        updateData.cancelledAt = null;
        updateData.cancelReason = null;
      } else if (status === 'CANCELLED') {
        updateData.cancelledAt = now;
        updateData.cancelReason = notes || 'Hủy đơn thử nghiệm qua thanh test';
      }

      const updated = await prisma.order.update({
        where: { id: order.id },
        data: updateData
      });

      await prisma.orderStatusHistory.create({
        data: {
          orderId: order.id,
          status,
          fromStatus: order.status,
          actorType: 'STAFF',
          notes: notes || `Đồng bộ trạng thái (${actorName || 'Thanh test Admin'}) sang ${status}`
        }
      });

      res.json({ message: 'Cập nhật trạng thái đơn hàng thành công.', order: serializeBigInt(updated) });
    } catch (error) {
      console.error('Lỗi updateAdminOrderStatus:', error);
      res.status(500).json({ message: 'Không thể cập nhật trạng thái đơn hàng.' });
    }
  },

  // PUT /api/admin/orders/:id/payment - Cập nhật trạng thái thanh toán
  updateAdminOrderPayment: async (req: Request, res: Response): Promise<void> => {
    try {
      const idOrNumber = String(req.params.id);
      const { paymentStatus, notes, transactionCode } = req.body;

      const order = await prisma.order.findFirst({
        where: {
          OR: [{ orderNumber: idOrNumber }, { id: idOrNumber }]
        }
      });

      if (!order) {
        res.status(404).json({ message: 'Không tìm thấy đơn hàng.' });
        return;
      }

      const updateData: any = { paymentStatus };
      if (paymentStatus === 'PAID') {
        updateData.paidAt = new Date();
      }

      const updated = await prisma.order.update({
        where: { id: order.id },
        data: updateData
      });

      await prisma.orderStatusHistory.create({
        data: {
          orderId: order.id,
          status: order.status,
          actorType: 'STAFF',
          notes: notes || `Admin cập nhật thanh toán: ${paymentStatus}${transactionCode ? ' (Mã GD: ' + transactionCode + ')' : ''}`
        }
      });

      res.json({ message: 'Cập nhật trạng thái thanh toán thành công.', order: serializeBigInt(updated) });
    } catch (error) {
      console.error('Lỗi updateAdminOrderPayment:', error);
      res.status(500).json({ message: 'Không thể cập nhật trạng thái thanh toán.' });
    }
  },

  // PUT /api/admin/orders/:id/notes - Cập nhật ghi chú nội bộ
  updateAdminOrderNotes: async (req: Request, res: Response): Promise<void> => {
    try {
      const idOrNumber = String(req.params.id);
      const { internalNotes } = req.body;

      const order = await prisma.order.findFirst({
        where: {
          OR: [{ orderNumber: idOrNumber }, { id: idOrNumber }]
        }
      });

      if (!order) {
        res.status(404).json({ message: 'Không tìm thấy đơn hàng.' });
        return;
      }

      const updated = await prisma.order.update({
        where: { id: order.id },
        data: { internalNotes }
      });

      res.json({ message: 'Đã lưu ghi chú nội bộ.', internalNotes: updated.internalNotes });
    } catch (error) {
      console.error('Lỗi updateAdminOrderNotes:', error);
      res.status(500).json({ message: 'Không thể cập nhật ghi chú nội bộ.' });
    }
  }
};

