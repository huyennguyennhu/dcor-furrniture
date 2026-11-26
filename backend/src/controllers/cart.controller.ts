import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth.middleware';
import { promotionController } from './promotion.controller';

const MAX_CART_ITEMS = 30;
const MAX_ITEM_QUANTITY = 100;

const SYSTEM_OPTION_KEYS = new Set([
  'sku',
  'variantName',
  'productId',
  'variantId',
  'images',
  'attributes',
  'dimensions',
  'material',
  'warrantyMonths',
  'price',
  'originalPrice',
  'stock',
  'leg',
  'upholstery'
]);

const isNumericSlash = (str: string): boolean => /\d[\d½¼¾.]*\s*\/\s*\d/.test(str);

const formatAttributeValue = (raw: string, isSize = false): string => {
  let str = raw.trim();
  if (!str) return '';
  if (isSize && /^\d+(\.\d+)?$/.test(str)) {
    return `${str} cm`;
  }
  str = str.replace(/(\d+(?:[½¼¾]|\/\d+)?)\s*(cm|mm|m)\b/gi, '$1 $2');
  str = str.replace(/([a-zA-Z0-9½¼¾]+)\s*[xX]\s*([a-zA-Z0-9½¼¾Øø]+)/g, '$1 × $2');
  str = str.replace(/([a-zA-Z0-9½¼¾]+)\s*[xX]\s*([a-zA-Z0-9½¼¾Øø]+)/g, '$1 × $2');
  str = str.replace(/[Øø]\s*(\d+)/g, 'Ø$1');
  return str;
};

const splitAttributeParts = (raw: string): string[] => {
  if (!raw) return [];
  const majorParts = raw.split(/\s*[|·]\s*/).map(p => p.trim()).filter(Boolean);
  const result: string[] = [];

  for (const chunk of majorParts) {
    if (isNumericSlash(chunk)) {
      result.push(chunk);
      continue;
    }
    const subParts = chunk.split(/\s*\/\s*/).map(p => p.trim()).filter(Boolean);
    if (subParts.length > 1 && subParts.every(p => !/^\d+$/.test(p))) {
      result.push(...subParts);
    } else {
      result.push(chunk);
    }
  }

  return result;
};

const extractVariantTags = (item: any): { label: string; value: string }[] => {
  const tags: { label: string; value: string }[] = [];
  const seen = new Set<string>();
  const variantSkuLower = String(item.variant?.sku || '').trim().toLowerCase();
  const variantOptionValues = (item.variant?.optionValues as any) || {};
  const selected = (item.selectedOptions as any) || {};
  const variantName = String(item.variant?.name || '').trim();
  const variantNameLower = variantName.toLowerCase();

  const pushTagValue = (label: string, rawVal: unknown, isSize = false) => {
    if (rawVal === undefined || rawVal === null) return;
    const strRaw = String(rawVal).trim();
    if (!strRaw || strRaw.startsWith('http://') || strRaw.startsWith('https://')) return;

    for (const part of splitAttributeParts(strRaw)) {
      const formatted = formatAttributeValue(part, isSize);
      const lower = formatted.toLowerCase();
      if (
        !formatted ||
        lower === 'phân loại mặc định' ||
        lower === 'tùy chọn mặc định' ||
        (variantSkuLower && lower === variantSkuLower) ||
        seen.has(lower)
      ) {
        continue;
      }
      seen.add(lower);
      tags.push({ label, value: formatted });
    }
  };

  // 1. Ưu tiên giải mã thuộc tính từ configOptions.attributes của sản phẩm theo đúng biến thể đã chọn
  const configAttrs: any[] = Array.isArray(item.variant?.product?.configOptions?.attributes)
    ? item.variant.product.configOptions.attributes
    : [];

  for (const attr of configAttrs) {
    const gid = String(attr?.groupId || '');
    const label = String(attr?.groupName || gid);
    const options: any[] = Array.isArray(attr?.options) ? attr.options : [];
    const isSize = /size|dimension|height|kích thước|chiều cao/i.test(`${gid} ${label}`);

    const rawId = variantOptionValues[gid] ?? selected[gid];
    let matchedOpt: any = null;

    if (rawId !== undefined && rawId !== null && String(rawId).trim() !== '') {
      const rawIdStr = String(rawId).trim();
      matchedOpt = options.find(
        (o: any) =>
          String(o?.id) === rawIdStr ||
          String(o?.name || '').trim().toLowerCase() === rawIdStr.toLowerCase()
      );
      if (matchedOpt?.name) {
        pushTagValue(label, matchedOpt.name, isSize);
        continue;
      }
    }

    // Fallback khớp theo tên biến thể nếu variantOptionValues không lưu groupId trực tiếp
    if (variantNameLower && options.length > 0) {
      const sortedOpts = [...options]
        .filter((o: any) => typeof o?.name === 'string' && o.name.trim())
        .sort((a: any, b: any) => b.name.length - a.name.length);
      matchedOpt = sortedOpts.find((o: any) => variantNameLower.includes(o.name.trim().toLowerCase()));
      if (matchedOpt?.name) {
        pushTagValue(label, matchedOpt.name, isSize);
        continue;
      }
    }

    if (options.length === 1 && options[0]?.name) {
      pushTagValue(label, options[0].name, isSize);
    }
  }

  // 2. Fallback: phân tích từ tên biến thể (variant.name) nếu sản phẩm không có configOptions.attributes
  if (tags.length === 0 && variantName && variantNameLower !== 'phân loại mặc định') {
    pushTagValue('', variantName, false);
  }

  // 3. Bổ sung thuộc tính tùy chọn riêng (chân, vải bọc hoặc thuộc tính custom không phải metadata hệ thống)
  if (selected.leg) {
    const legVal = typeof selected.leg === 'object' ? selected.leg.name : selected.leg;
    pushTagValue('Chân', legVal, false);
  }

  if (selected.upholstery) {
    const uphVal = typeof selected.upholstery === 'object' ? selected.upholstery.name : selected.upholstery;
    pushTagValue('Vải bọc', uphVal, false);
  }

  for (const [key, val] of Object.entries(selected)) {
    if (SYSTEM_OPTION_KEYS.has(key) || key.startsWith('va') || key.startsWith('opt_')) continue;
    if (typeof val === 'string' || typeof val === 'number') {
      pushTagValue(key, val, false);
    }
  }

  return tags;
};

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

        // Gom danh sách thuộc tính đã chọn theo đúng biến thể (loại bỏ hoàn toàn sku, variantName, url, thông số hệ thống)
        const tags = extractVariantTags(item);

        // Tính giá và giảm giá (từ chiến dịch khuyến mãi hoặc trường discountValue)
        const rawPrice = item.variant.price || item.variant.product.basePrice || 0;
        let discountVal = item.variant.product.discountValue || 0;
        let discountType = item.variant.product.discountType || 'PERCENT';
        let finalPrice = rawPrice;
        let originalPrice = rawPrice;

        const activeCampaigns = promotionController.getActiveCampaignsHelper();
        const p = item.variant.product;
        const pName = (p.name || '').toLowerCase().trim();
        const pId = String(p.id || '').toLowerCase().trim();
        const pSlug = String(p.slug || '').toLowerCase().trim();

        if (activeCampaigns.length > 0) {
          for (const camp of activeCampaigns) {
            if (!camp.items || !Array.isArray(camp.items)) continue;
            for (const it of camp.items) {
              const itId = String(it.productId || '').toLowerCase().trim();
              const itName = String(it.productName || '').toLowerCase().trim();
              const isMatch = (itId && (itId === pId || itId === pSlug || itId === item.variantId)) ||
                (itName && pName && (itName === pName || pName.includes(itName) || itName.includes(pName)));
              if (isMatch) {
                discountVal = it.discountPercent || camp.discountValue || 0;
                discountType = camp.discountType === 'FIXED' ? 'AMOUNT' : 'PERCENT';
                originalPrice = it.originalPrice || rawPrice;
                finalPrice = it.salePrice || (discountType === 'AMOUNT' ? Math.max(0, originalPrice - camp.discountValue) : Math.round(originalPrice * (100 - discountVal) / 100));
                break;
              }
            }
            if (finalPrice < rawPrice) break;
          }
        }

        if (finalPrice === rawPrice && discountVal > 0) {
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

      if (!existingItem) {
        const currentCartCount = await prisma.cartItem.count({
          where: { customerId }
        });
        if (currentCartCount >= MAX_CART_ITEMS) {
          res.status(400).json({
            code: 'CART_ITEM_LIMIT_EXCEEDED',
            message: `Giỏ hàng đã đạt tối đa ${MAX_CART_ITEMS} loại sản phẩm (biến thể) khác nhau. Vui lòng thanh toán hoặc bỏ bớt trước khi thêm mới.`,
            maxCartItems: MAX_CART_ITEMS
          });
          return;
        }
      }

      const maxAllowed = Math.min(availableStock, MAX_ITEM_QUANTITY);
      const totalRequested = quantity + (existingItem?.quantity || 0);
      if (totalRequested > maxAllowed) {
        if (availableStock < MAX_ITEM_QUANTITY) {
          res.status(409).json({
            code: 'INSUFFICIENT_STOCK',
            message: `Chỉ còn ${availableStock} sản phẩm trong kho (hiện có ${existingItem?.quantity || 0} trong giỏ).`,
            availableStock,
            maxAllowed
          });
        } else {
          res.status(400).json({
            code: 'CART_ITEM_QUANTITY_LIMIT_EXCEEDED',
            message: `Mỗi loại sản phẩm chỉ được đặt tối đa ${MAX_ITEM_QUANTITY} chiếc trong giỏ hàng.`,
            availableStock,
            maxAllowed
          });
        }
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
          const maxAllowed = Math.min(newAvailableStock, MAX_ITEM_QUANTITY);
          const mergedQuantity = existingTargetItem.quantity + targetQuantity;
          if (mergedQuantity > maxAllowed) {
            res.status(409).json({
              code: newAvailableStock < MAX_ITEM_QUANTITY ? 'INSUFFICIENT_STOCK' : 'CART_ITEM_QUANTITY_LIMIT_EXCEEDED',
              message: newAvailableStock < MAX_ITEM_QUANTITY
                ? `Không thể đổi sang biến thể này vì sau khi gộp số lượng (${mergedQuantity}) sẽ vượt tồn kho hiện có (Chỉ còn ${newAvailableStock} sản phẩm).`
                : `Không thể đổi sang biến thể này vì tổng số lượng (${mergedQuantity}) vượt giới hạn tối đa ${MAX_ITEM_QUANTITY} chiếc/biến thể.`,
              availableStock: newAvailableStock,
              maxAllowed
            });
            return;
          }

          // Hợp lệ -> Gộp số lượng vào dòng đã có và xóa dòng cũ
          const updatedItem = await prisma.cartItem.update({
            where: { id: existingTargetItem.id },
            data: {
              quantity: mergedQuantity,
              selectedOptions: selectedOptions !== undefined ? selectedOptions : (existingTargetItem.selectedOptions || {})
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
          const maxAllowed = Math.min(newAvailableStock, MAX_ITEM_QUANTITY);
          if (targetQuantity > maxAllowed) {
            res.status(409).json({
              code: newAvailableStock < MAX_ITEM_QUANTITY ? 'INSUFFICIENT_STOCK' : 'CART_ITEM_QUANTITY_LIMIT_EXCEEDED',
              message: newAvailableStock < MAX_ITEM_QUANTITY
                ? `Chỉ còn ${newAvailableStock} sản phẩm trong kho.`
                : `Mỗi loại sản phẩm chỉ được đặt tối đa ${MAX_ITEM_QUANTITY} chiếc.`,
              availableStock: newAvailableStock,
              maxAllowed
            });
            return;
          }

          const updatedItem = await prisma.cartItem.update({
            where: { id: currentItem.id },
            data: {
              variantId,
              quantity: targetQuantity,
              selectedOptions: selectedOptions !== undefined ? selectedOptions : {}
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
        const maxAllowed = Math.min(availableStock, MAX_ITEM_QUANTITY);
        if (quantity > maxAllowed) {
          if (availableStock < MAX_ITEM_QUANTITY) {
            res.status(409).json({
              code: 'INSUFFICIENT_STOCK',
              message: `Chỉ còn ${availableStock} sản phẩm trong kho.`,
              availableStock,
              maxAllowed
            });
          } else {
            res.status(400).json({
              code: 'CART_ITEM_QUANTITY_LIMIT_EXCEEDED',
              message: `Mỗi loại sản phẩm chỉ được đặt tối đa ${MAX_ITEM_QUANTITY} chiếc trong giỏ hàng.`,
              availableStock,
              maxAllowed
            });
          }
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
