import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth.middleware';

export const cartController = {
  // Lấy giỏ hàng của Customer
  getCart: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const customerId = req.user?.userId;
      if (!customerId) {
        res.status(401).json({ message: 'Vui lòng đăng nhập để xem giỏ hàng thành viên.' });
        return;
      }
      const cartItems = await prisma.cartItem.findMany({
        where: { customerId },
        include: {
          variant: {
            include: {
              product: true
            }
          }
        }
      });

      // Format lại data cho giống CartItem interface trên Frontend
      const formattedCart = cartItems.map(item => {
        // Lấy ảnh của biến thể hoặc fallback về ảnh sản phẩm
        const variantOptionValues = (item.variant.optionValues as any) || {};
        const variantImages = variantOptionValues.images;
        const productImages = (item.variant.product.images as any) || [];

        let baseImage = '';
        if (Array.isArray(variantImages) && variantImages.length > 0 && typeof variantImages[0] === 'string') {
          baseImage = variantImages[0];
        } else if (Array.isArray(productImages) && productImages.length > 0 && typeof productImages[0] === 'string') {
          baseImage = productImages[0];
        }

        // Gom các Tags từ selectedOptions hoặc tên biến thể (LOẠI BỎ hoàn toàn url, image, object/array)
        const tags: { label: string; value: string }[] = [];
        const selected = (item.selectedOptions as any) || {};

        if (selected.leg) {
          const legVal = typeof selected.leg === 'object' ? selected.leg.name : selected.leg;
          if (legVal && typeof legVal === 'string' && !legVal.startsWith('http')) {
            tags.push({ label: 'Chân', value: legVal });
          }
        }

        if (selected.upholstery) {
          const uphVal = typeof selected.upholstery === 'object' ? selected.upholstery.name : selected.upholstery;
          if (uphVal && typeof uphVal === 'string' && !uphVal.startsWith('http')) {
            tags.push({ label: 'Vải bọc', value: uphVal });
          }
        }

        // Lọc các thuộc tính tùy chọn người dùng (loại trừ mã hệ thống, url, ảnh, thông số kỹ thuật)
        for (const [key, val] of Object.entries(selected)) {
          if (['leg', 'upholstery', 'images', 'attributes'].includes(key) || key.startsWith('va')) continue;
          if (typeof val === 'string' || typeof val === 'number') {
            const strVal = String(val).trim();
            if (strVal && !strVal.startsWith('http://') && !strVal.startsWith('https://')) {
              tags.push({ label: key, value: strVal });
            }
          }
        }

        // Nếu không có custom selectedOptions, phân tích tên biến thể (variant.name)
        if (tags.length === 0 && item.variant.name && item.variant.name !== 'Phân loại mặc định') {
          const rawParts = item.variant.name.split('/').map(p => p.trim()).filter(Boolean);
          // Loại bỏ các phần trùng lặp
          const uniqueParts = Array.from(new Set(rawParts));
          if (uniqueParts.length > 1) {
            uniqueParts.forEach(part => {
              if (!part.startsWith('http')) {
                tags.push({ label: '', value: part });
              }
            });
          }
        }

        // Tính giá và giảm giá
        const rawPrice = item.variant.price || item.variant.product.basePrice || 0;
        const discountVal = item.variant.product.discountValue || 0;
        const discountType = item.variant.product.discountType;
        let finalPrice = rawPrice;
        let originalPrice = rawPrice;

        if (discountVal > 0) {
          if (discountType === 'PERCENT') {
            finalPrice = Math.round(rawPrice * (100 - discountVal) / 100);
          } else {
            finalPrice = Math.max(0, rawPrice - discountVal);
          }
        }

        // Tồn kho và trạng thái khả dụng
        const stock = item.variant.stock ?? 0;
        const reservedStock = item.variant.reservedStock ?? 0;
        const availableStock = Math.max(0, stock - reservedStock);
        const isVariantActive = item.variant.isActive !== false;
        const isProductActive = item.variant.product.isActive !== false && !item.variant.product.deletedAt;
        const isAvailable = isVariantActive && isProductActive && availableStock > 0;

        let unavailableReason = '';
        if (!isProductActive) {
          unavailableReason = 'Sản phẩm đã ngừng kinh doanh';
        } else if (!isVariantActive) {
          unavailableReason = 'Biến thể tạm ngừng kinh doanh';
        } else if (availableStock <= 0) {
          unavailableReason = 'Hết hàng';
        }

        return {
          id: item.id, // ID của CartItem
          productId: item.variant.productId,
          variantId: item.variantId,
          sku: item.variant.sku,
          name: item.variant.product.name,
          variantName: item.variant.name,
          image: baseImage,
          price: finalPrice,
          originalPrice: discountVal > 0 ? originalPrice : undefined,
          discountValue: discountVal > 0 ? discountVal : undefined,
          discountType: discountVal > 0 ? discountType : undefined,
          quantity: item.quantity,
          stock,
          reservedStock,
          availableStock,
          isActive: isAvailable,
          isVariantActive,
          isProductActive,
          unavailableReason,
          variantTags: tags,
          selectedOptions: item.selectedOptions,
          leg: (item.selectedOptions as any)?.leg,
          upholstery: (item.selectedOptions as any)?.upholstery
        };
      });

      res.status(200).json(formattedCart);
    } catch (error) {
      console.error('Lỗi getCart:', error);
      res.status(500).json({ message: 'Lỗi server' });
    }
  },

  // Thêm vào giỏ hàng
  addToCart: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const customerId = req.user?.userId;
      if (!customerId) {
        res.status(401).json({ message: 'Vui lòng đăng nhập để thêm vào giỏ hàng thành viên.' });
        return;
      }
      const { variantId, quantity, selectedOptions } = req.body;

      if (!variantId || !quantity) {
        res.status(400).json({ message: 'Thiếu thông tin variantId hoặc quantity' });
        return;
      }

      if (!Number.isInteger(quantity) || quantity < 1) {
        res.status(400).json({ message: 'Số lượng phải là số nguyên lớn hơn 0.' });
        return;
      }

      const variant = await prisma.productVariant.findUnique({
        where: { id: variantId },
        include: { product: true }
      });
      if (!variant || !variant.isActive || !variant.product.isActive || variant.product.deletedAt) {
        res.status(404).json({ message: 'Sản phẩm hoặc biến thể không còn khả dụng.' });
        return;
      }

      const availableStock = Math.max(0, variant.stock - variant.reservedStock);
      const existingItem = await prisma.cartItem.findUnique({
        where: {
          customerId_variantId: {
            customerId,
            variantId
          }
        },
        select: { quantity: true }
      });
      
      const totalRequested = quantity + (existingItem?.quantity || 0);
      if (totalRequested > availableStock) {
        res.status(409).json({ message: `Chỉ còn ${availableStock} sản phẩm trong kho.`, availableStock });
        return;
      }

      const cartItem = await prisma.cartItem.upsert({
        where: {
          customerId_variantId: {
            customerId,
            variantId
          }
        },
        update: {
          quantity: { increment: quantity },
          selectedOptions: selectedOptions || undefined
        },
        create: {
          customerId,
          variantId,
          quantity,
          selectedOptions: selectedOptions || {}
        }
      });

      res.status(200).json({ message: 'Thêm vào giỏ hàng thành công', cartItem });
    } catch (error) {
      console.error('Lỗi addToCart:', error);
      res.status(500).json({ message: 'Lỗi server' });
    }
  },

  // Cập nhật số lượng hoặc đổi biến thể
  updateCartItem: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const customerId = req.user?.userId;
      if (!customerId) {
        res.status(401).json({ message: 'Vui lòng đăng nhập để cập nhật giỏ hàng.' });
        return;
      }
      const { id } = req.params; // id của CartItem
      const { quantity, variantId, selectedOptions } = req.body;

      const currentItem = await prisma.cartItem.findUnique({
        where: { id: id as string },
        include: { variant: { include: { product: true } } }
      });

      if (!currentItem) {
        res.status(404).json({ message: 'Không tìm thấy sản phẩm trong giỏ hàng.' });
        return;
      }

      // 1. Trường hợp đổi biến thể
      if (variantId && variantId !== currentItem.variantId) {
        const newVariant = await prisma.productVariant.findUnique({
          where: { id: variantId },
          include: { product: true }
        });

        if (!newVariant || !newVariant.isActive || !newVariant.product.isActive || newVariant.product.deletedAt) {
          res.status(400).json({ message: 'Biến thể mới không khả dụng.' });
          return;
        }

        const newAvailableStock = Math.max(0, newVariant.stock - newVariant.reservedStock);
        const targetQuantity = quantity !== undefined ? Number(quantity) : currentItem.quantity;

        // Kiểm tra xem khách hàng đã có sản phẩm với biến thể này chưa
        const existingTargetItem = await prisma.cartItem.findUnique({
          where: {
            customerId_variantId: {
              customerId,
              variantId
            }
          }
        });

        if (existingTargetItem && existingTargetItem.id !== currentItem.id) {
          // Trùng biến thể đã có trong giỏ hàng -> Kiểm tra tổng số lượng
          const mergedQuantity = existingTargetItem.quantity + targetQuantity;
          if (mergedQuantity > newAvailableStock) {
            res.status(409).json({
              message: `Không thể đổi sang biến thể này vì sau khi gộp số lượng (${mergedQuantity}) sẽ vượt tồn kho hiện có (Chỉ còn ${newAvailableStock} sản phẩm).`,
              availableStock: newAvailableStock
            });
            return;
          }

          // Hợp lệ -> Gộp số lượng vào dòng đã có và xóa dòng cũ
          const updatedItem = await prisma.cartItem.update({
            where: { id: existingTargetItem.id },
            data: {
              quantity: mergedQuantity,
              selectedOptions: selectedOptions || existingTargetItem.selectedOptions
            }
          });

          await prisma.cartItem.delete({
            where: { id: currentItem.id }
          });

          res.status(200).json({
            message: 'Đã gộp vào sản phẩm cùng biến thể đã có trong giỏ hàng',
            cartItem: updatedItem,
            merged: true
          });
          return;
        } else {
          // Chưa có biến thể này -> Cập nhật trực tiếp
          if (targetQuantity > newAvailableStock) {
            res.status(409).json({
              message: `Chỉ còn ${newAvailableStock} sản phẩm trong kho.`,
              availableStock: newAvailableStock
            });
            return;
          }

          const updatedItem = await prisma.cartItem.update({
            where: { id: currentItem.id },
            data: {
              variantId,
              quantity: targetQuantity,
              selectedOptions: selectedOptions || currentItem.selectedOptions
            }
          });

          res.status(200).json({ message: 'Cập nhật biến thể thành công', cartItem: updatedItem });
          return;
        }
      }

      // 2. Cập nhật số lượng thông thường
      if (quantity !== undefined) {
        if (quantity < 1) {
          await prisma.cartItem.delete({
            where: { id: id as string }
          });
          res.status(200).json({ message: 'Đã xóa sản phẩm khỏi giỏ hàng' });
          return;
        }

        const availableStock = Math.max(0, currentItem.variant.stock - currentItem.variant.reservedStock);
        if (quantity > availableStock) {
          res.status(409).json({
            message: `Chỉ còn ${availableStock} sản phẩm trong kho.`,
            availableStock
          });
          return;
        }

        const cartItem = await prisma.cartItem.update({
          where: { id: id as string },
          data: { quantity, selectedOptions: selectedOptions || undefined }
        });

        res.status(200).json({ message: 'Cập nhật số lượng thành công', cartItem });
        return;
      }

      res.status(400).json({ message: 'Không có dữ liệu cần cập nhật' });
    } catch (error) {
      console.error('Lỗi updateCartItem:', error);
      res.status(500).json({ message: 'Lỗi server' });
    }
  },

  // Xóa một sản phẩm khỏi giỏ hàng
  removeCartItem: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      await prisma.cartItem.delete({
        where: { id: id as string }
      });

      res.status(200).json({ message: 'Đã xóa sản phẩm khỏi giỏ hàng' });
    } catch (error) {
      console.error('Lỗi removeCartItem:', error);
      res.status(500).json({ message: 'Lỗi server' });
    }
  },

  // Xóa nhiều sản phẩm khỏi giỏ hàng cùng lúc
  removeMultiple: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const customerId = req.user?.userId;
      if (!customerId) {
        res.status(401).json({ message: 'Vui lòng đăng nhập.' });
        return;
      }
      const { ids } = req.body;

      if (!Array.isArray(ids) || ids.length === 0) {
        res.status(400).json({ message: 'Danh sách ID không hợp lệ.' });
        return;
      }

      await prisma.cartItem.deleteMany({
        where: {
          id: { in: ids },
          customerId
        }
      });

      res.status(200).json({ message: 'Đã xóa các sản phẩm được chọn' });
    } catch (error) {
      console.error('Lỗi removeMultiple:', error);
      res.status(500).json({ message: 'Lỗi server' });
    }
  }
};
