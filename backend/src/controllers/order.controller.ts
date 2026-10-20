import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'dcor_super_secret_key_2026';

const serializeBigInt = (obj: any): any => {
  return JSON.parse(
    JSON.stringify(obj, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    )
  );
};

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
        isGift,
        hideInvoicePrice,
        items,
        invoice
      } = req.body;

      if (!receiverName || !phone || !address) {
        res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ họ tên, số điện thoại và địa chỉ nhận hàng.' });
        return;
      }

      // === RATE LIMITING: Tối đa 3 đơn hàng / số điện thoại / giờ ===
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const recentOrderCount = await prisma.order.count({
        where: {
          phone: phone.trim(),
          createdAt: { gte: oneHourAgo }
        }
      });
      if (recentOrderCount >= 3) {
        res.status(429).json({
          message: 'Số điện thoại này đã tạo tối đa 3 đơn hàng trong 1 giờ qua. Vui lòng thử lại sau hoặc liên hệ CSKH để được hỗ trợ.'
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

      // Tìm fallback product nếu variant không tìm thấy trong DB
      const defaultProduct = await prisma.product.findFirst({
        include: { variants: true }
      }).catch(() => null);

      let subTotal = BigInt(0);
      const itemsList = Array.isArray(items) ? items : [];
      const orderItemsCreate: any[] = [];

      for (const item of itemsList) {
        const qty = Number(item.quantity) || 1;
        const price = Number(item.price) || 0;
        const lineTotal = BigInt(qty * price);
        subTotal += lineTotal;

        let variant: any = null;
        if (item.variantId) {
          variant = await prisma.productVariant.findUnique({
            where: { id: item.variantId },
            include: { product: true }
          }).catch(() => null);
        }

        const productId = variant?.productId || defaultProduct?.id || '';
        const variantId = variant?.id || defaultProduct?.variants?.[0]?.id || null;
        const productName = variant?.product?.name || item.name || defaultProduct?.name || 'Sản phẩm DCor';
        const imageUrl = item.image || (variant?.product?.images ? (Array.isArray(variant.product.images) ? variant.product.images[0] : '') : '') || '';

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
            selectedOptions: item.selectedOptions || null
          });
        }
      }

      const totalAmount = subTotal;
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
          detailAddress: detailAddress ? String(detailAddress).trim() : address.trim(),
          isGift: !!isGift,
          hideInvoicePrice: !!hideInvoicePrice,
          giftMessage: shippingNotes || null,
          subTotal,
          shippingFee: BigInt(0),
          discountAmount: BigInt(0),
          totalAmount,
          promoCode: voucherCode || null,
          status: 'PENDING',
          paymentMethod: paymentMethod === 'COD' ? 'COD' : 'BANK_TRANSFER',
          paymentStatus: 'UNPAID',
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
                  : 'Khách hàng tạo đơn thành công'
              }
            ]
          }
        }
      });

      res.status(201).json(serializeBigInt({
        success: true,
        orderNumber: order.orderNumber,
        id: order.id,
        status: isHighValue ? 'WAITING_DEPOSIT' : order.status,
        statusLabel: isHighValue ? 'Chờ đặt cọc' : 'Chờ xác nhận',
        totalAmount: Number(order.totalAmount),
        isHighValue,
        depositAmount: isHighValue ? Math.round(Number(order.totalAmount) * 0.3) : 0,
        createdAt: order.createdAt
      }));
    } catch (error: any) {
      console.error('Lỗi khi tạo đơn hàng:', error);
      res.status(500).json({
        message: 'Có lỗi xảy ra khi lưu đơn hàng vào hệ thống.',
        error: error?.message
      });
    }
  },

  // Lấy danh sách đơn hàng của khách
  getMyOrders: async (req: Request, res: Response): Promise<void> => {
    try {
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

      if (!customerId && !customerPhone) {
        res.json([]);
        return;
      }

      const orders = await prisma.order.findMany({
        where: {
          OR: [
            customerId ? { customerId } : {},
            customerPhone ? { phone: customerPhone } : {}
          ]
        },
        include: {
          items: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      const formatted = orders.map(o => {
        const isHighValue = o.totalAmount > BigInt(50000000);
        let displayStatus = 'Chờ xác nhận';
        if (isHighValue && o.paymentStatus !== 'PAID') {
          displayStatus = 'Chờ đặt cọc';
        } else if (o.status === 'PROCESSING') {
          displayStatus = 'Đang xử lý';
        } else if (o.status === 'SHIPPED') {
          displayStatus = 'Đang giao';
        } else if (o.status === 'DELIVERED') {
          displayStatus = 'Hoàn thành';
        } else if (o.status === 'CANCELLED') {
          displayStatus = 'Đã hủy';
        }

        return {
          id: o.orderNumber,
          date: o.createdAt.toISOString().split('T')[0],
          total: Number(o.totalAmount),
          status: displayStatus,
          items: o.items.length || 1,
          isHighValue
        };
      });

      res.json(serializeBigInt(formatted));
    } catch (error: any) {
      console.error('Lỗi khi lấy danh sách đơn hàng:', error);
      res.status(500).json({ message: 'Không thể lấy danh sách đơn hàng.' });
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
  }
};
