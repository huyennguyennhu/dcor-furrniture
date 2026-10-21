import { Request, Response } from 'express';
import prisma from '../lib/prisma';

function generateSlug(text: string): string {
  const base = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/([^0-9a-z-\s])/g, '')
    .replace(/(\s+)/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${base}-${Date.now().toString().slice(-6)}`;
}

export const productController = {
  // Lấy danh sách sản phẩm cho Admin (bao gồm cả sản phẩm ẩn/nháp)
  getAllAdmin: async (req: Request, res: Response): Promise<void> => {
    try {
      const { search, categoryId, status } = req.query;

      const whereClause: any = {
        deletedAt: null
      };

      if (status === 'ACTIVE') {
        whereClause.isActive = true;
      } else if (status === 'INACTIVE') {
        whereClause.isActive = false;
      }

      if (categoryId && typeof categoryId === 'string' && categoryId !== 'all') {
        whereClause.categoryId = categoryId;
      }

      if (search && typeof search === 'string') {
        whereClause.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { slug: { contains: search, mode: 'insensitive' } },
          { variants: { some: { sku: { contains: search, mode: 'insensitive' } } } }
        ];
      }

      const products = await prisma.product.findMany({
        where: whereClause,
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
              parentId: true,
              parent: { select: { id: true, name: true } }
            }
          },
          variants: {
            select: {
              id: true,
              sku: true,
              name: true,
              price: true,
              stock: true,
              isActive: true,
              optionValues: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      const formatted = products.map(p => {
        const totalStock = p.variants.reduce((sum, v) => sum + (v.stock || 0), 0);
        const config = (p.configOptions as any) || {};
        return {
          ...p,
          totalStock,
          variantsCount: p.variants.length,
          allowCustom: !!config.allowCustom,
          categoryName: p.category?.name || 'Chưa phân loại',
          parentCategoryName: p.category?.parent?.name || null
        };
      });

      res.json(formatted);
    } catch (error: any) {
      console.error('Lỗi lấy danh sách sản phẩm Admin:', error);
      res.status(500).json({ message: 'Lỗi tải danh sách sản phẩm.', error: error?.message });
    }
  },

  // Lấy chi tiết sản phẩm theo ID hoặc slug
  getDetail: async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params.id as string;
      const product = await prisma.product.findUnique({
        where: { id },
        include: {
          category: {
            include: { parent: true }
          },
          variants: true
        }
      });

      if (!product) {
        res.status(404).json({ message: 'Không tìm thấy sản phẩm.' });
        return;
      }

      res.json(product);
    } catch (error: any) {
      console.error('Lỗi lấy chi tiết sản phẩm:', error);
      res.status(500).json({ message: 'Lỗi server.', error: error?.message });
    }
  },

  // Tạo mới sản phẩm & biến thể
  createProduct: async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        name,
        categoryId,
        description,
        basePrice,
        images,
        allowCustom,
        configOptions,
        isBestSeller,
        isNew,
        isActive,
        variants
      } = req.body;

      if (!name || !name.trim()) {
        res.status(400).json({ message: 'Tên sản phẩm không được để trống.' });
        return;
      }

      if (!categoryId) {
        res.status(400).json({ message: 'Vui lòng chọn danh mục cho sản phẩm.' });
        return;
      }

      const cleanSlug = generateSlug(name);

      // Chuẩn bị configOptions bao gồm cờ allowCustom
      const mergedConfig = {
        ...(typeof configOptions === 'object' ? configOptions : {}),
        allowCustom: !!allowCustom
      };

      // Đọc danh sách kho hiện tại để khởi tạo WarehouseStock (tồn kho ban đầu = 0)
      const warehouses = await prisma.warehouse.findMany({
        where: { isActive: true },
        select: { id: true }
      });

      // Tạo trong Transaction
      const newProduct = await prisma.$transaction(async (tx) => {
        // 1. Tạo Product
        const prod = await tx.product.create({
          data: {
            name: name.trim(),
            slug: cleanSlug,
            categoryId,
            description: description || '',
            basePrice: Number(basePrice) || 0,
            images: Array.isArray(images) ? images : [],
            configOptions: mergedConfig,
            isBestSeller: !!isBestSeller,
            isNew: !!isNew,
            isActive: isActive !== false,
          }
        });

        // 2. Tạo các Biến thể (Variants)
        // Nếu không gửi biến thể nào, tạo 1 biến thể mặc định (Tiêu chuẩn)
        const variantsToCreate = Array.isArray(variants) && variants.length > 0 
          ? variants 
          : [
              {
                sku: `DCOR-${cleanSlug.slice(0, 10).toUpperCase()}-DF`,
                name: 'Tiêu chuẩn',
                price: Number(basePrice) || 0,
                optionValues: {}
              }
            ];

        for (let idx = 0; idx < variantsToCreate.length; idx++) {
          const v = variantsToCreate[idx];
          
          // Format tên biến thể cách nhau bằng ' / ' (Ví dụ: sofa vải / 20x20cm / phong cách tối giản)
          let variantName = v.name?.trim() || 'Tiêu chuẩn';
          if (Array.isArray(v.attributes) && v.attributes.length > 0) {
            variantName = v.attributes.filter(Boolean).join(' / ');
          }

          const sku = v.sku?.trim() || `SKU-${cleanSlug.slice(0, 8).toUpperCase()}-${idx + 1}`;

          const createdVariant = await tx.productVariant.create({
            data: {
              productId: prod.id,
              sku,
              name: variantName,
              price: Number(v.price) || Number(basePrice) || 0,
              stock: 0, // Bỏ nhập tồn kho: Mặc định 0, bộ phận kho sẽ xử lý nhập sau
              reservedStock: 0,
              optionValues: v.optionValues || {},
              isActive: v.isActive !== false
            }
          });

          // Khởi tạo bản ghi WarehouseStock tồn 0 cho từng điểm kho để hiển thị tức thì trên module kho
          for (const wh of warehouses) {
            await tx.warehouseStock.upsert({
              where: {
                warehouseId_variantId: {
                  warehouseId: wh.id,
                  variantId: createdVariant.id
                }
              },
              create: {
                warehouseId: wh.id,
                variantId: createdVariant.id,
                physicalStock: 0,
                reservedStock: 0,
                safetyThreshold: 5
              },
              update: {}
            });
          }
        }

        return prod;
      });

      // Lấy lại sản phẩm hoàn chỉnh cùng variants
      const fullCreated = await prisma.product.findUnique({
        where: { id: newProduct.id },
        include: { category: true, variants: true }
      });

      res.status(201).json({
        message: 'Tạo sản phẩm thành công!',
        product: fullCreated
      });
    } catch (error: any) {
      console.error('Lỗi tạo sản phẩm:', error);
      res.status(500).json({ message: 'Không thể tạo sản phẩm.', error: error?.message });
    }
  },

  // Cập nhật sản phẩm
  updateProduct: async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params.id as string;
      const {
        name,
        categoryId,
        description,
        basePrice,
        images,
        allowCustom,
        configOptions,
        isBestSeller,
        isNew,
        isActive,
        variants
      } = req.body;

      const existing = await prisma.product.findUnique({
        where: { id },
        include: { variants: true }
      });

      if (!existing) {
        res.status(404).json({ message: 'Sản phẩm không tồn tại.' });
        return;
      }

      const mergedConfig = {
        ...(typeof existing.configOptions === 'object' && existing.configOptions ? (existing.configOptions as any) : {}),
        ...(typeof configOptions === 'object' ? configOptions : {}),
        allowCustom: allowCustom !== undefined ? !!allowCustom : !!(existing.configOptions as any)?.allowCustom
      };

      await prisma.$transaction(async (tx) => {
        // 1. Update Product
        await tx.product.update({
          where: { id },
          data: {
            name: name !== undefined ? name.trim() : existing.name,
            categoryId: categoryId || existing.categoryId,
            description: description !== undefined ? description : existing.description,
            basePrice: basePrice !== undefined ? Number(basePrice) : existing.basePrice,
            images: images !== undefined ? images : existing.images,
            configOptions: mergedConfig,
            isBestSeller: isBestSeller !== undefined ? !!isBestSeller : existing.isBestSeller,
            isNew: isNew !== undefined ? !!isNew : existing.isNew,
            isActive: isActive !== undefined ? !!isActive : existing.isActive
          }
        });

        // 2. Cập nhật hoặc thêm mới Variants nếu được cung cấp
        if (Array.isArray(variants)) {
          const warehouses = await tx.warehouse.findMany({
            where: { isActive: true },
            select: { id: true }
          });

          for (let idx = 0; idx < variants.length; idx++) {
            const v = variants[idx];
            let variantName = v.name?.trim() || 'Tiêu chuẩn';
            if (Array.isArray(v.attributes) && v.attributes.length > 0) {
              variantName = v.attributes.filter(Boolean).join(' / ');
            }

            if (v.id) {
              // Cập nhật variant sẵn có
              await tx.productVariant.update({
                where: { id: v.id },
                data: {
                  sku: v.sku?.trim(),
                  name: variantName,
                  price: Number(v.price) || 0,
                  isActive: v.isActive !== false,
                  optionValues: v.optionValues || undefined
                }
              });
            } else {
              // Thêm variant mới
              const cleanSlug = existing.slug;
              const sku = v.sku?.trim() || `SKU-${cleanSlug.slice(0, 8).toUpperCase()}-${Date.now().toString().slice(-4)}`;
              const newV = await tx.productVariant.create({
                data: {
                  productId: id,
                  sku,
                  name: variantName,
                  price: Number(v.price) || existing.basePrice,
                  stock: 0,
                  reservedStock: 0,
                  optionValues: v.optionValues || {},
                  isActive: v.isActive !== false
                }
              });

              for (const wh of warehouses) {
                await tx.warehouseStock.upsert({
                  where: {
                    warehouseId_variantId: {
                      warehouseId: wh.id,
                      variantId: newV.id
                    }
                  },
                  create: {
                    warehouseId: wh.id,
                    variantId: newV.id,
                    physicalStock: 0,
                    reservedStock: 0,
                    safetyThreshold: 5
                  },
                  update: {}
                });
              }
            }
          }
        }
      });

      const updated = await prisma.product.findUnique({
        where: { id },
        include: { category: true, variants: true }
      });

      res.json({ message: 'Cập nhật sản phẩm thành công!', product: updated });
    } catch (error: any) {
      console.error('Lỗi cập nhật sản phẩm:', error);
      res.status(500).json({ message: 'Lỗi cập nhật sản phẩm.', error: error?.message });
    }
  },

  // Xóa / Ẩn sản phẩm
  deleteProduct: async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params.id as string;
      await prisma.product.update({
        where: { id },
        data: { deletedAt: new Date(), isActive: false }
      });
      res.json({ message: 'Đã xóa sản phẩm thành công.' });
    } catch (error: any) {
      console.error('Lỗi xóa sản phẩm:', error);
      res.status(500).json({ message: 'Lỗi xóa sản phẩm.', error: error?.message });
    }
  }
};
