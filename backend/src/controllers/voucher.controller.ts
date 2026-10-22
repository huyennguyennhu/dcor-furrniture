import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const voucherController = {
  // Lấy toàn bộ danh sách voucher (Admin)
  getVouchers: async (req: Request, res: Response): Promise<void> => {
    try {
      const { search, status } = req.query;
      const where: any = {};

      if (search && typeof search === 'string') {
        where.code = { contains: search.trim().toUpperCase(), mode: 'insensitive' };
      }

      if (status === 'ACTIVE') {
        where.isActive = true;
      } else if (status === 'INACTIVE') {
        where.isActive = false;
      }

      const vouchers = await (prisma as any).voucher.findMany({
        where,
        orderBy: { createdAt: 'desc' }
      });

      res.json(vouchers);
    } catch (error: any) {
      console.error('[ERROR] Lấy danh sách voucher thất bại:', error);
      res.status(500).json({ message: 'Không thể tải danh sách voucher từ cơ sở dữ liệu.', error: error.message });
    }
  },

  // Tạo voucher mới (Admin)
  createVoucher: async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        code,
        discountType,
        discountValue,
        maxDiscountCap,
        minOrderValue,
        startDate,
        endDate,
        usageLimit,
        perCustomerLimit,
        isStackableWithFlashSale,
        isActive
      } = req.body;

      if (!code || !discountType || discountValue === undefined) {
        res.status(400).json({ message: 'Vui lòng cung cấp mã voucher, loại giảm giá và mức giảm.' });
        return;
      }

      const cleanCode = String(code).trim().toUpperCase().replace(/\s+/g, '');
      const numDiscountValue = Number(discountValue);

      if (numDiscountValue <= 0) {
        res.status(400).json({ message: 'Mức giảm giá phải lớn hơn 0.' });
        return;
      }

      if (discountType === 'PERCENT' && numDiscountValue > 100) {
        res.status(400).json({ message: 'Phần trăm giảm không được vượt quá 100%.' });
        return;
      }

      // Kiểm tra trùng mã
      const existing = await (prisma as any).voucher.findUnique({
        where: { code: cleanCode }
      });
      if (existing) {
        res.status(409).json({ message: `Mã voucher "${cleanCode}" đã tồn tại trong hệ thống.` });
        return;
      }

      const now = new Date();
      const parsedStart = startDate ? new Date(startDate) : now;
      const parsedEnd = endDate ? new Date(endDate) : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const voucher = await (prisma as any).voucher.create({
        data: {
          code: cleanCode,
          discountType: discountType === 'PERCENT' ? 'PERCENT' : 'FIXED_AMOUNT',
          discountValue: numDiscountValue,
          maxDiscountCap: maxDiscountCap ? Number(maxDiscountCap) : null,
          minOrderValue: minOrderValue ? Number(minOrderValue) : 0,
          startDate: parsedStart,
          endDate: parsedEnd,
          usageLimit: usageLimit ? Number(usageLimit) : 100,
          usedCount: 0,
          perCustomerLimit: perCustomerLimit ? Number(perCustomerLimit) : 1,
          isStackableWithFlashSale: !!isStackableWithFlashSale,
          isActive: isActive !== undefined ? !!isActive : true
        }
      });

      res.status(201).json(voucher);
    } catch (error: any) {
      console.error('[ERROR] Tạo voucher thất bại:', error);
      res.status(500).json({ message: 'Không thể tạo voucher.', error: error.message });
    }
  },

  // Sửa voucher hoặc bật/tắt trạng thái (Admin)
  updateVoucher: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const {
        code,
        discountType,
        discountValue,
        maxDiscountCap,
        minOrderValue,
        startDate,
        endDate,
        usageLimit,
        usedCount,
        perCustomerLimit,
        isStackableWithFlashSale,
        isActive
      } = req.body;

      const existing = await (prisma as any).voucher.findUnique({ where: { id } });
      if (!existing) {
        res.status(404).json({ message: 'Không tìm thấy voucher cần cập nhật.' });
        return;
      }

      const updateData: any = {};
      if (code) updateData.code = String(code).trim().toUpperCase().replace(/\s+/g, '');
      if (discountType) updateData.discountType = discountType;
      if (discountValue !== undefined) updateData.discountValue = Number(discountValue);
      if (maxDiscountCap !== undefined) updateData.maxDiscountCap = maxDiscountCap ? Number(maxDiscountCap) : null;
      if (minOrderValue !== undefined) updateData.minOrderValue = Number(minOrderValue);
      if (startDate) updateData.startDate = new Date(startDate);
      if (endDate) updateData.endDate = new Date(endDate);
      if (usageLimit !== undefined) updateData.usageLimit = Number(usageLimit);
      if (usedCount !== undefined) updateData.usedCount = Number(usedCount);
      if (perCustomerLimit !== undefined) updateData.perCustomerLimit = Number(perCustomerLimit);
      if (isStackableWithFlashSale !== undefined) updateData.isStackableWithFlashSale = !!isStackableWithFlashSale;
      if (isActive !== undefined) updateData.isActive = !!isActive;

      const updated = await (prisma as any).voucher.update({
        where: { id },
        data: updateData
      });

      res.json(updated);
    } catch (error: any) {
      console.error('[ERROR] Cập nhật voucher thất bại:', error);
      res.status(500).json({ message: 'Không thể cập nhật voucher.', error: error.message });
    }
  },

  // Xóa voucher (Admin)
  deleteVoucher: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const existing = await (prisma as any).voucher.findUnique({ where: { id } });
      if (!existing) {
        res.status(404).json({ message: 'Không tìm thấy voucher để xóa.' });
        return;
      }

      await (prisma as any).voucher.delete({ where: { id } });
      res.json({ success: true, message: `Đã xóa voucher ${existing.code} thành công.` });
    } catch (error: any) {
      console.error('[ERROR] Xóa voucher thất bại:', error);
      res.status(500).json({ message: 'Không thể xóa voucher.', error: error.message });
    }
  },

  // Kiểm tra mã voucher và tính số tiền giảm thực tế (Storefront Checkout)
  verifyVoucher: async (req: Request, res: Response): Promise<void> => {
    try {
      const { code, orderTotal } = req.body;

      if (!code || typeof code !== 'string') {
        res.status(400).json({ valid: false, message: 'Vui lòng cung cấp mã voucher.' });
        return;
      }

      const cleanCode = code.trim().toUpperCase().replace(/\s+/g, '');
      const total = Number(orderTotal) || 0;

      const voucher = await (prisma as any).voucher.findUnique({
        where: { code: cleanCode }
      });

      if (!voucher) {
        res.json({ valid: false, message: `Mã giảm giá "${cleanCode}" không tồn tại trên hệ thống.` });
        return;
      }

      if (!voucher.isActive) {
        res.json({ valid: false, message: `Mã giảm giá "${cleanCode}" hiện đang tạm dừng hoặc không còn hiệu lực.` });
        return;
      }

      const now = new Date();
      if (new Date(voucher.startDate) > now) {
        res.json({ valid: false, message: `Mã giảm giá "${cleanCode}" chưa đến ngày áp dụng.` });
        return;
      }

      if (new Date(voucher.endDate) < now) {
        res.json({ valid: false, message: `Mã giảm giá "${cleanCode}" đã hết hạn sử dụng.` });
        return;
      }

      if (voucher.usageLimit > 0 && voucher.usedCount >= voucher.usageLimit) {
        res.json({ valid: false, message: `Mã giảm giá "${cleanCode}" đã hết lượt sử dụng trên toàn sàn.` });
        return;
      }

      if (voucher.minOrderValue > 0 && total < voucher.minOrderValue) {
        const formattedMin = new Intl.NumberFormat('vi-VN').format(voucher.minOrderValue) + '₫';
        res.json({
          valid: false,
          message: `Mã "${cleanCode}" yêu cầu giá trị đơn hàng tối thiểu từ ${formattedMin} (Đơn hiện tại: ${new Intl.NumberFormat('vi-VN').format(total)}₫).`
        });
        return;
      }

      // Tính mức chiết khấu
      let discountAmount = 0;
      if (voucher.discountType === 'PERCENT') {
        discountAmount = Math.round((total * voucher.discountValue) / 100);
        if (voucher.maxDiscountCap && voucher.maxDiscountCap > 0) {
          discountAmount = Math.min(discountAmount, voucher.maxDiscountCap);
        }
      } else {
        // FIXED_AMOUNT
        discountAmount = Math.min(voucher.discountValue, total);
      }

      res.json({
        valid: true,
        success: true,
        code: voucher.code,
        name: voucher.code,
        discountType: voucher.discountType === 'PERCENT' ? 'PERCENT' : 'AMOUNT',
        discountValue: voucher.discountValue,
        maxDiscountAmount: voucher.maxDiscountCap,
        minOrderValue: voucher.minOrderValue,
        discountAmount,
        message: `Áp dụng mã ${voucher.code} thành công! Tiết kiệm ${new Intl.NumberFormat('vi-VN').format(discountAmount)}₫.`,
        voucher: {
          id: voucher.id,
          code: voucher.code,
          discountType: voucher.discountType,
          discountValue: voucher.discountValue,
          maxDiscountCap: voucher.maxDiscountCap,
          minOrderValue: voucher.minOrderValue,
          isStackableWithFlashSale: voucher.isStackableWithFlashSale
        }
      });
    } catch (error: any) {
      console.error('[ERROR] Xác thực voucher thất bại:', error);
      res.status(500).json({ valid: false, message: 'Lỗi hệ thống khi kiểm tra mã voucher.', error: error.message });
    }
  }
};
