import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { memoryCache, CACHE_KEYS } from '../lib/cache';
import { clearInventoryCaches } from './inventory.controller';

export const DEFAULT_WARRANTY_MONTHS = 24;

export function parseSafetyThreshold(raw: any): number | null {
  if (raw === null || raw === undefined || raw === '') return null;
  const parsed = Math.round(Number(raw));
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return parsed;
}

export function resolveVariantSafetyThreshold(v: any, fallback = 5): number {
  const opt = typeof v?.optionValues === 'string'
    ? (() => { try { return JSON.parse(v.optionValues); } catch { return {}; } })()
    : (v?.optionValues || {});
  const optThreshold = parseSafetyThreshold(opt?.safetyThreshold ?? opt?.threshold);
  const whThresholds = (v?.warehouseStocks || [])
    .map((ws: any) => parseSafetyThreshold(ws?.safetyThreshold))
    .filter((t: number | null): t is number => t !== null);
  if (whThresholds.length > 0) return Math.min(...whThresholds);
  if (optThreshold !== null) return optThreshold;
  return fallback;
}

export function parseWarrantyMonths(raw: any): number | null {
  if (raw === null || raw === undefined || raw === '') return null;
  const parsed = Math.round(Number(raw));
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return Math.min(120, parsed);
}

export function extractProductWarrantyMonths(configOptions: any, fallback = DEFAULT_WARRANTY_MONTHS): number {
  if (!configOptions || typeof configOptions !== 'object') return fallback;
  const parsed = parseWarrantyMonths(configOptions?.specs?.warrantyMonths ?? configOptions?.warrantyMonths);
  return parsed !== null ? parsed : fallback;
}

let productCacheInvalidator: (() => void) | null = null;
export function registerProductCacheInvalidator(fn: () => void) {
  productCacheInvalidator = fn;
}

function invalidateAllProductCaches() {
  memoryCache.invalidate(CACHE_KEYS.PRODUCTS_CATALOG);
  memoryCache.invalidatePrefix('products_catalog');
  memoryCache.invalidatePrefix('products_cat_');
  memoryCache.invalidatePrefix('products_slug_');
  memoryCache.invalidatePrefix('admin_products_');
  memoryCache.invalidatePrefix('product_detail_');
  clearInventoryCaches(true);
  if (productCacheInvalidator) {
    productCacheInvalidator();
  }
}

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
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limitParam = req.query.limit as string | undefined;
      const isUnlimited = limitParam === 'all' || limitParam === '-1';
      const limit = isUnlimited 
        ? 1000 
        : (limitParam !== undefined ? Math.min(1000, Math.max(1, parseInt(limitParam))) : 500);
      const skip = isUnlimited ? 0 : (page - 1) * limit;

      const cacheKey = `admin_products_p${page}_l${limit}_c${categoryId || 'all'}_s${status || 'all'}_q${search || ''}`;
      const cached = memoryCache.get<any[]>(cacheKey, 300000);
      if (cached) {
        res.json(cached);
        return;
      }

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
        take: limit,
        skip: skip,
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
              parentId: true,
              parent: { select: { id: true, name: true, slug: true } }
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
              optionValues: true,
              warehouseStocks: {
                select: {
                  warehouseId: true,
                  physicalStock: true,
                  reservedStock: true,
                  safetyThreshold: true,
                  warehouse: {
                    select: {
                      id: true,
                      code: true,
                      name: true
                    }
                  }
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      const formatted = products.map(p => {
        const totalStock = p.variants.reduce((sum, v) => sum + (v.stock || 0), 0);
        const config = (p.configOptions as any) || {};
        const variantsWithThreshold = p.variants.map((v: any) => ({
          ...v,
          safetyThreshold: resolveVariantSafetyThreshold(v)
        }));
        return {
          ...p,
          variants: variantsWithThreshold,
          totalStock,
          variantsCount: p.variants.length,
          allowCustom: !!config.allowCustom,
          warrantyMonths: extractProductWarrantyMonths(config),
          categoryName: p.category?.name || 'Chưa phân loại',
          parentCategoryName: p.category?.parent?.name || null
        };
      });

      memoryCache.set(cacheKey, formatted);

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
      let product = null;

      const variantInclude = {
        include: {
          warehouseStocks: {
            select: {
              warehouseId: true,
              physicalStock: true,
              reservedStock: true,
              safetyThreshold: true
            }
          }
        }
      };

      const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id);
      if (isUuid) {
        product = await prisma.product.findUnique({
          where: { id },
          include: {
            category: {
              include: { parent: true }
            },
            variants: variantInclude
          }
        });
      }

      if (!product) {
        product = await prisma.product.findUnique({
          where: { slug: id },
          include: {
            category: {
              include: { parent: true }
            },
            variants: variantInclude
          }
        });
      }

      if (!product || product.deletedAt !== null) {
        res.status(404).json({ message: 'Không tìm thấy sản phẩm.' });
        return;
      }

      const config = (product.configOptions as any) || {};

      const variantsWithThreshold = (product.variants || []).map((v: any) => {
        const safetyThreshold = resolveVariantSafetyThreshold(v);
        return {
          ...v,
          safetyThreshold
        };
      });

      res.json({
        ...product,
        variants: variantsWithThreshold,
        allowCustom: !!config.allowCustom,
        warrantyMonths: extractProductWarrantyMonths(config)
      });
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
        warrantyMonths,
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

      const categoryExists = await prisma.category.findUnique({
        where: { id: categoryId }
      });
      if (!categoryExists) {
        res.status(400).json({ message: 'Danh mục được chọn không hợp lệ hoặc không tồn tại.' });
        return;
      }

      const cleanSlug = generateSlug(name);

      // Chuẩn bị configOptions bao gồm cờ allowCustom và thời hạn bảo hành theo từng sản phẩm
      const incomingConfig = typeof configOptions === 'object' && configOptions ? configOptions : {};
      const resolvedWarranty = parseWarrantyMonths(
        warrantyMonths ?? incomingConfig?.specs?.warrantyMonths ?? incomingConfig?.warrantyMonths
      ) ?? DEFAULT_WARRANTY_MONTHS;
      const mergedConfig = {
        ...incomingConfig,
        allowCustom: !!allowCustom,
        warrantyMonths: resolvedWarranty,
        specs: {
          ...(typeof incomingConfig?.specs === 'object' && incomingConfig.specs ? incomingConfig.specs : {}),
          warrantyMonths: resolvedWarranty
        }
      };

      // Validate ngưỡng tồn kho cho các biến thể khi xuất bản sản phẩm
      if (isActive !== false && Array.isArray(variants) && variants.length > 0) {
        const invalidVariant = variants.find((v: any) => {
          const parsed = parseSafetyThreshold(v.safetyThreshold ?? v.optionValues?.safetyThreshold);
          return parsed === null;
        });
        if (invalidVariant) {
          res.status(400).json({ message: 'Vui lòng nhập ngưỡng tồn kho hợp lệ (≥ 0) cho tất cả biến thể.' });
          return;
        }
      }

      // Đọc danh sách kho hiện tại (ưu tiên kho mặc định để chứa tồn kho ban đầu, tránh nhân bản tồn kho ra mọi kho)
      const warehouses = await prisma.warehouse.findMany({
        where: { isActive: true },
        select: { id: true, isDefault: true, type: true },
        orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }]
      });
      const defaultWarehouseId = (
        warehouses.find(w => w.isDefault) ||
        warehouses.find(w => w.type === 'CENTRAL_WAREHOUSE') ||
        warehouses[0]
      )?.id;

      // Tạo trong Transaction có cấu hình timeout 30s để xử lý nhiều biến thể
      const newProduct = await prisma.$transaction(async (tx) => {
        // 1. Tạo Product
        const prod = await tx.product.create({
          data: {
            name: name.trim(),
            slug: cleanSlug,
            categoryId,
            description: description || '',
            basePrice: Math.round(Number(basePrice)) || 0,
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
                price: Math.round(Number(basePrice)) || 0,
                safetyThreshold: 0,
                optionValues: {}
              }
            ];

        const usedSkusInBatch = new Set<string>();
        const stockRecordsToInsert: any[] = [];

        for (let idx = 0; idx < variantsToCreate.length; idx++) {
          const v = variantsToCreate[idx];
          
          // Format tên biến thể cách nhau bằng ' / ' (Ví dụ: sofa vải / 20x20cm / phong cách tối giản)
          let variantName = v.name?.trim() || 'Tiêu chuẩn';
          if (Array.isArray(v.attributes) && v.attributes.length > 0) {
            variantName = v.attributes.filter(Boolean).join(' / ');
          }

          let baseVariantSku = v.sku?.trim() || `SKU-${cleanSlug.slice(0, 8).toUpperCase()}-${idx + 1}`;
          let sku = baseVariantSku;

          // Kiểm tra và tự động hóa giải xung đột trùng SKU
          const skuInDb = await tx.productVariant.findUnique({ where: { sku } });
          if (usedSkusInBatch.has(sku) || skuInDb) {
            const randSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
            sku = `${baseVariantSku}-${randSuffix}`;
          }
          usedSkusInBatch.add(sku);

          const initStock = Math.max(0, Math.round(Number(v.stock)) || Math.round(Number(v.optionValues?.stock)) || 0);
          const parsedThreshold = parseSafetyThreshold(v.safetyThreshold ?? v.optionValues?.safetyThreshold);
          const variantThreshold = parsedThreshold !== null ? parsedThreshold : 0;
          const incomingOptionValues = typeof v.optionValues === 'object' && v.optionValues ? v.optionValues : {};
          const mergedOptionValues = {
            ...incomingOptionValues,
            safetyThreshold: variantThreshold
          };

          const createdVariant = await tx.productVariant.create({
            data: {
              productId: prod.id,
              sku,
              name: variantName,
              price: Math.round(Number(v.price)) || Math.round(Number(basePrice)) || 0,
              stock: initStock,
              reservedStock: 0,
              optionValues: mergedOptionValues,
              isActive: v.isActive !== false
            }
          });

          // Gom bản ghi kho để insert hàng loạt: chỉ gán initStock vào kho mặc định, các kho khác = 0 (tránh nhân bản tồn kho)
          for (const wh of warehouses) {
            stockRecordsToInsert.push({
              warehouseId: wh.id,
              variantId: createdVariant.id,
              physicalStock: wh.id === defaultWarehouseId ? initStock : 0,
              reservedStock: 0,
              safetyThreshold: variantThreshold
            });
          }
        }

        // Tối ưu hóa hiệu năng: Thêm hàng loạt WarehouseStock trong 1 truy vấn duy nhất thay vì lặp tuần tự
        if (stockRecordsToInsert.length > 0) {
          await tx.warehouseStock.createMany({
            data: stockRecordsToInsert,
            skipDuplicates: true
          });
        }

        return prod;
      }, {
        maxWait: 10000,
        timeout: 30000
      });

      // Lấy lại sản phẩm hoàn chỉnh cùng variants
      const fullCreated = await prisma.product.findUnique({
        where: { id: newProduct.id },
        include: { category: true, variants: true }
      });

      invalidateAllProductCaches();

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
        warrantyMonths,
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

      if (!existing || existing.deletedAt !== null) {
        res.status(404).json({ message: 'Sản phẩm không tồn tại hoặc đã bị xóa.' });
        return;
      }

      if (categoryId) {
        const categoryExists = await prisma.category.findUnique({
          where: { id: categoryId }
        });
        if (!categoryExists) {
          res.status(400).json({ message: 'Danh mục được chọn không hợp lệ hoặc không tồn tại.' });
          return;
        }
      }

      const existingConfig = typeof existing.configOptions === 'object' && existing.configOptions ? (existing.configOptions as any) : {};
      const incomingConfig = typeof configOptions === 'object' && configOptions ? configOptions : {};
      const existingSpecs = typeof existingConfig.specs === 'object' && existingConfig.specs ? existingConfig.specs : {};
      const incomingSpecs = typeof incomingConfig.specs === 'object' && incomingConfig.specs ? incomingConfig.specs : {};
      const parsedWarranty = parseWarrantyMonths(
        warrantyMonths ?? incomingSpecs.warrantyMonths ?? incomingConfig.warrantyMonths
      );
      const resolvedWarranty = parsedWarranty !== null
        ? parsedWarranty
        : extractProductWarrantyMonths(existingConfig);

      const mergedConfig = {
        ...existingConfig,
        ...incomingConfig,
        allowCustom: allowCustom !== undefined ? !!allowCustom : !!existingConfig.allowCustom,
        warrantyMonths: resolvedWarranty,
        specs: {
          ...existingSpecs,
          ...incomingSpecs,
          warrantyMonths: resolvedWarranty
        }
      };

      const willBeActive = isActive !== undefined ? !!isActive : existing.isActive;
      if (willBeActive && Array.isArray(variants) && variants.length > 0) {
        const invalidVariant = variants.find((v: any) => {
          const hasExplicitThresholdField = 'safetyThreshold' in v || (v.optionValues && 'safetyThreshold' in v.optionValues);
          if (!hasExplicitThresholdField) return false;
          return parseSafetyThreshold(v.safetyThreshold ?? v.optionValues?.safetyThreshold) === null;
        });
        if (invalidVariant) {
          res.status(400).json({ message: 'Vui lòng nhập ngưỡng tồn kho hợp lệ (≥ 0) cho tất cả biến thể.' });
          return;
        }
      }

      await prisma.$transaction(async (tx) => {
        // 1. Update Product
        await tx.product.update({
          where: { id },
          data: {
            name: name !== undefined ? name.trim() : existing.name,
            categoryId: categoryId || existing.categoryId,
            description: description !== undefined ? description : existing.description,
            basePrice: basePrice !== undefined ? Math.round(Number(basePrice)) : existing.basePrice,
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
            select: { id: true, isDefault: true, type: true },
            orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }]
          });
          const defaultWarehouseId = (
            warehouses.find(w => w.isDefault) ||
            warehouses.find(w => w.type === 'CENTRAL_WAREHOUSE') ||
            warehouses[0]
          )?.id;

          const existingVariantsMap = new Map(existing.variants.map(ev => [ev.id, ev]));
          const incomingIds = new Set(variants.map(v => v.id).filter(Boolean));
          const newStockRecords: any[] = [];
          const usedSkusInBatch = new Set<string>();

          // 2.1 Xử lý các variant bị xóa khỏi form (so với existing.variants trong DB)
          const variantsToRemove = existing.variants.filter(ev => !incomingIds.has(ev.id));
          for (const rv of variantsToRemove) {
            const orderCount = await tx.orderItem.count({ where: { variantId: rv.id } });
            if (orderCount > 0) {
              await tx.productVariant.update({
                where: { id: rv.id },
                data: { isActive: false }
              });
            } else {
              await tx.warehouseStock.deleteMany({ where: { variantId: rv.id } });
              await tx.productVariant.delete({ where: { id: rv.id } });
            }
          }

          // 2.2 Cập nhật hoặc tạo mới các variant
          for (let idx = 0; idx < variants.length; idx++) {
            const v = variants[idx];
            let variantName = v.name?.trim() || 'Tiêu chuẩn';
            if (Array.isArray(v.attributes) && v.attributes.length > 0) {
              variantName = v.attributes.filter(Boolean).join(' / ');
            }

            const stockVal = v.stock !== undefined ? Math.max(0, Math.round(Number(v.stock))) : undefined;
            const parsedThreshold = parseSafetyThreshold(v.safetyThreshold ?? v.optionValues?.safetyThreshold);
            const incomingOptionValues = typeof v.optionValues === 'object' && v.optionValues ? v.optionValues : undefined;
            const mergedOptionValues = incomingOptionValues !== undefined
              ? {
                  ...incomingOptionValues,
                  ...(parsedThreshold !== null ? { safetyThreshold: parsedThreshold } : {})
                }
              : undefined;

            if (v.id) {
              // Cập nhật variant sẵn có
              await tx.productVariant.update({
                where: { id: v.id },
                data: {
                  sku: v.sku?.trim(),
                  name: variantName,
                  price: Math.round(Number(v.price)) || 0,
                  stock: stockVal,
                  isActive: v.isActive !== false,
                  optionValues: mergedOptionValues
                }
              });

              if (parsedThreshold !== null) {
                await tx.warehouseStock.updateMany({
                  where: { variantId: v.id },
                  data: { safetyThreshold: parsedThreshold }
                });
              }

              // Chỉ điều chỉnh tồn kho tại kho mặc định theo phần chênh lệch (tránh ghi đè nhân bản sang mọi kho)
              const prevVariant = existingVariantsMap.get(v.id);
              if (stockVal !== undefined && defaultWarehouseId && prevVariant && stockVal !== prevVariant.stock) {
                const otherWhAgg = await tx.warehouseStock.aggregate({
                  where: { variantId: v.id, warehouseId: { not: defaultWarehouseId } },
                  _sum: { physicalStock: true }
                });
                const otherTotal = Number(otherWhAgg._sum.physicalStock || 0);
                const targetDefaultPhy = Math.max(0, stockVal - otherTotal);
                await tx.warehouseStock.upsert({
                  where: {
                    warehouseId_variantId: {
                      warehouseId: defaultWarehouseId,
                      variantId: v.id
                    }
                  },
                  update: {
                    physicalStock: targetDefaultPhy,
                    ...(parsedThreshold !== null ? { safetyThreshold: parsedThreshold } : {})
                  },
                  create: {
                    warehouseId: defaultWarehouseId,
                    variantId: v.id,
                    physicalStock: targetDefaultPhy,
                    reservedStock: 0,
                    safetyThreshold: parsedThreshold !== null ? parsedThreshold : 0
                  }
                });
              }

              // Đảm bảo các kho đang hoạt động đều có bản ghi WarehouseStock (kho mới = 0, không nhân bản tồn)
              for (const wh of warehouses) {
                newStockRecords.push({
                  warehouseId: wh.id,
                  variantId: v.id,
                  physicalStock: wh.id === defaultWarehouseId ? (stockVal !== undefined ? stockVal : (prevVariant?.stock ?? 0)) : 0,
                  reservedStock: 0,
                  safetyThreshold: parsedThreshold !== null ? parsedThreshold : 0
                });
              }
            } else {
              // Thêm variant mới
              const cleanSlug = existing.slug;
              let baseSku = v.sku?.trim() || `SKU-${cleanSlug.slice(0, 8).toUpperCase()}-${Date.now().toString().slice(-4)}`;
              let sku = baseSku;

              const skuInDb = await tx.productVariant.findUnique({ where: { sku } });
              if (usedSkusInBatch.has(sku) || skuInDb) {
                const randSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
                sku = `${baseSku}-${randSuffix}`;
              }
              usedSkusInBatch.add(sku);

              const newVariantThreshold = parsedThreshold !== null ? parsedThreshold : 0;
              const newV = await tx.productVariant.create({
                data: {
                  productId: id,
                  sku,
                  name: variantName,
                  price: Math.round(Number(v.price)) || existing.basePrice,
                  stock: stockVal !== undefined ? stockVal : 0,
                  reservedStock: 0,
                  optionValues: {
                    ...(incomingOptionValues || {}),
                    safetyThreshold: newVariantThreshold
                  },
                  isActive: v.isActive !== false
                }
              });

              for (const wh of warehouses) {
                newStockRecords.push({
                  warehouseId: wh.id,
                  variantId: newV.id,
                  physicalStock: wh.id === defaultWarehouseId ? (stockVal !== undefined ? stockVal : 0) : 0,
                  reservedStock: 0,
                  safetyThreshold: newVariantThreshold
                });
              }
            }
          }

          if (newStockRecords.length > 0) {
            await tx.warehouseStock.createMany({
              data: newStockRecords,
              skipDuplicates: true
            });
          }
        }
      }, {
        maxWait: 10000,
        timeout: 30000
      });

      const updated = await prisma.product.findUnique({
        where: { id },
        include: { category: true, variants: true }
      });

      invalidateAllProductCaches();

      res.json({ message: 'Cập nhật sản phẩm thành công!', product: updated });
    } catch (error: any) {
      console.error('Lỗi cập nhật sản phẩm:', error);
      res.status(500).json({ message: 'Lỗi cập nhật sản phẩm.', error: error?.message });
    }
  },

  // Xóa mềm sản phẩm (Ẩn hoàn toàn khỏi UI, giữ nguyên bản ghi ở trạng thái DELETED trong CSDL)
  deleteProduct: async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params.id as string;
      const existing = await prisma.product.findUnique({ where: { id } });
      if (!existing) {
        res.status(404).json({ message: 'Không tìm thấy sản phẩm.' });
        return;
      }

      if (existing.deletedAt === null) {
        const now = new Date();
        const existingConfig =
          existing.configOptions && typeof existing.configOptions === 'object' && !Array.isArray(existing.configOptions)
            ? (existing.configOptions as Record<string, any>)
            : {};

        await prisma.$transaction([
          prisma.product.update({
            where: { id },
            data: {
              deletedAt: now,
              isActive: false,
              configOptions: {
                ...existingConfig,
                lifecycleStatus: 'DELETED',
                deletedAt: now.toISOString()
              }
            }
          }),
          prisma.productVariant.updateMany({
            where: { productId: id },
            data: { isActive: false }
          })
        ]);
      }

      invalidateAllProductCaches();
      res.json({
        message: 'Đã xóa sản phẩm khỏi hệ thống hiển thị (lưu trữ trạng thái đã xóa trong CSDL).',
        softDeleted: true
      });
    } catch (error: any) {
      console.error('Lỗi xóa sản phẩm:', error);
      res.status(500).json({ message: 'Lỗi xóa sản phẩm.', error: error?.message });
    }
  },

  // Bật / tắt hiển thị sản phẩm
  toggleStatus: async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params.id as string;
      const { isActive } = req.body;
      const existing = await prisma.product.findUnique({ where: { id } });
      if (!existing || existing.deletedAt !== null) {
        res.status(404).json({ message: 'Không tìm thấy sản phẩm hoặc sản phẩm đã bị xóa.' });
        return;
      }
      await prisma.product.update({
        where: { id },
        data: { isActive: isActive !== undefined ? !!isActive : !existing.isActive }
      });
      invalidateAllProductCaches();
      res.json({ message: 'Cập nhật trạng thái sản phẩm thành công.' });
    } catch (error: any) {
      console.error('Lỗi cập nhật trạng thái sản phẩm:', error);
      res.status(500).json({ message: 'Lỗi cập nhật trạng thái.', error: error?.message });
    }
  },

  // Bật / tắt mở bán từng biến thể
  toggleVariantStatus: async (req: Request, res: Response): Promise<void> => {
    try {
      const variantId = req.params.variantId as string;
      const { isActive } = req.body;
      const existing = await prisma.productVariant.findUnique({
        where: { id: variantId },
        include: { product: { select: { deletedAt: true } } }
      });
      if (!existing || existing.product?.deletedAt !== null) {
        res.status(404).json({ message: 'Không tìm thấy biến thể hoặc sản phẩm đã bị xóa.' });
        return;
      }
      const nextActive = isActive !== undefined ? !!isActive : !existing.isActive;
      const updated = await prisma.productVariant.update({
        where: { id: variantId },
        data: { isActive: nextActive }
      });
      invalidateAllProductCaches();
      res.json({ message: 'Cập nhật trạng thái biến thể thành công.', variant: updated });
    } catch (error: any) {
      console.error('Lỗi cập nhật trạng thái biến thể:', error);
      res.status(500).json({ message: 'Lỗi cập nhật trạng thái biến thể.', error: error?.message });
    }
  },

  // Bật / tắt hiển thị hàng loạt sản phẩm
  bulkStatus: async (req: Request, res: Response): Promise<void> => {
    try {
      const { productIds, isActive } = req.body;
      if (!Array.isArray(productIds) || productIds.length === 0) {
        res.status(400).json({ message: 'Vui lòng chọn ít nhất 1 sản phẩm.' });
        return;
      }
      const result = await prisma.product.updateMany({
        where: { id: { in: productIds }, deletedAt: null },
        data: { isActive: !!isActive }
      });
      invalidateAllProductCaches();
      res.json({ message: 'Cập nhật trạng thái hàng loạt thành công.', count: result.count });
    } catch (error: any) {
      console.error('Lỗi cập nhật trạng thái hàng loạt:', error);
      res.status(500).json({ message: 'Lỗi cập nhật trạng thái hàng loạt.', error: error?.message });
    }
  },

  // Xóa mềm hàng loạt sản phẩm (Giữ bản ghi trong CSDL, tắt toàn bộ biến thể và đánh dấu DELETED)
  bulkDelete: async (req: Request, res: Response): Promise<void> => {
    try {
      const { productIds } = req.body;
      if (!Array.isArray(productIds) || productIds.length === 0) {
        res.status(400).json({ message: 'Vui lòng chọn ít nhất 1 sản phẩm.' });
        return;
      }
      const now = new Date();
      const targets = await prisma.product.findMany({
        where: { id: { in: productIds }, deletedAt: null },
        select: { id: true, configOptions: true }
      });

      if (targets.length > 0) {
        const targetIds = targets.map(t => t.id);
        await prisma.$transaction([
          ...targets.map(t => {
            const cfg =
              t.configOptions && typeof t.configOptions === 'object' && !Array.isArray(t.configOptions)
                ? (t.configOptions as Record<string, any>)
                : {};
            return prisma.product.update({
              where: { id: t.id },
              data: {
                deletedAt: now,
                isActive: false,
                configOptions: {
                  ...cfg,
                  lifecycleStatus: 'DELETED',
                  deletedAt: now.toISOString()
                }
              }
            });
          }),
          prisma.productVariant.updateMany({
            where: { productId: { in: targetIds } },
            data: { isActive: false }
          })
        ]);
      }

      invalidateAllProductCaches();
      res.json({ message: 'Đã xóa hàng loạt sản phẩm thành công.', count: targets.length, softDeleted: true });
    } catch (error: any) {
      console.error('Lỗi xóa hàng loạt sản phẩm:', error);
      res.status(500).json({ message: 'Lỗi xóa hàng loạt sản phẩm.', error: error?.message });
    }
  },

  // Khôi phục hàng loạt sản phẩm từ thùng rác
  bulkRestore: async (req: Request, res: Response): Promise<void> => {
    try {
      const { productIds } = req.body;
      if (!Array.isArray(productIds) || productIds.length === 0) {
        res.status(400).json({ message: 'Vui lòng chọn ít nhất 1 sản phẩm.' });
        return;
      }
      const result = await prisma.product.updateMany({
        where: { id: { in: productIds } },
        data: { deletedAt: null }
      });
      invalidateAllProductCaches();
      res.json({ message: 'Đã khôi phục sản phẩm thành công.', count: result.count });
    } catch (error: any) {
      console.error('Lỗi khôi phục sản phẩm:', error);
      res.status(500).json({ message: 'Lỗi khôi phục sản phẩm.', error: error?.message });
    }
  }
};
