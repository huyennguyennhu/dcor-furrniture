import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';

const prisma = new PrismaClient();

export const cartController = {
  // Lấy giỏ hàng của Customer
  getCart: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const customerId = req.user.userId;
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
        // Gom các Tags từ optionValues (Json)
        const options = (item.variant.optionValues as any) || {};
        const tags = Object.keys(options).map(key => ({
          label: key,
          value: options[key]
        }));

        // Lấy ảnh gốc
        const productImages = (item.variant.product.images as any) || [];
        const baseImage = Array.isArray(productImages) && productImages.length > 0 ? productImages[0] : '';

        return {
          id: item.id, // ID của CartItem
          productId: item.variant.productId,
          variantId: item.variantId,
          name: item.variant.product.name,
          image: baseImage,
          price: item.variant.price || item.variant.product.basePrice,
          quantity: item.quantity,
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
      const customerId = req.user.userId;
      const { variantId, quantity, selectedOptions } = req.body;

      if (!variantId || !quantity) {
        res.status(400).json({ message: 'Thiếu thông tin variantId hoặc quantity' });
        return;
      }

      // Kiểm tra xem đã có trong giỏ hàng chưa (cùng variantId)
      // Prisma có @@unique([customerId, variantId]) nên ta dùng upsert
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

  // Cập nhật số lượng
  updateCartItem: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const customerId = req.user.userId;
      const { id } = req.params; // id của CartItem
      const { quantity } = req.body;

      if (quantity < 1) {
        await prisma.cartItem.delete({
          where: { id: id as string }
        });
        res.status(200).json({ message: 'Đã xóa sản phẩm khỏi giỏ hàng' });
        return;
      }

      const cartItem = await prisma.cartItem.update({
        where: { id: id as string },
        data: { quantity }
      });

      res.status(200).json({ message: 'Cập nhật số lượng thành công', cartItem });
    } catch (error) {
      console.error('Lỗi updateCartItem:', error);
      res.status(500).json({ message: 'Lỗi server' });
    }
  },

  // Xóa khỏi giỏ hàng
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
  }
};
