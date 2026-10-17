import { Request, Response } from 'express';
import prisma, { withDbRetry } from '../lib/prisma';

let cachedWarehouses: any[] = [
  { id: '24114aab-767b-4877-b256-dc775fa88f66', code: 'KHO_TONG_HCM', name: 'Kho Tổng (TP.HCM)', type: 'CENTRAL_WAREHOUSE' },
  { id: '047e4fc0-036d-4392-9962-6f0313231cf1', code: 'KHO_HN', name: 'Kho Hà Nội', type: 'REGIONAL_WAREHOUSE' },
  { id: 'c3f1bec8-1e98-4808-9a97-4ed15d407a90', code: 'SR_Q1', name: 'Showroom Quận 1', type: 'SHOWROOM' },
  { id: 'eec08fe7-3c73-4e29-b124-4001e51eaed7', code: 'SR_THU_DUC', name: 'Showroom Thủ Đức', type: 'SHOWROOM' }
];

let cachedCategories: any[] = [];

interface OverviewSummary {
  totalPhysicalStock: number;
  totalReservedStock: number;
  totalAvailableStock: number;
  inStockCount: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalProducts: number;
}

const summaryCache = new Map<string, { data: OverviewSummary; timestamp: number }>();
let productsWithOptionsCache: { data: any[]; timestamp: number } | null = null;
const PRODUCTS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache

function clearInventoryCaches() {
  summaryCache.clear();
  productsWithOptionsCache = null;
}

function resolveVariantNameAndImage(v: any, prod: any) {
  let nameParts: string[] = [];
  let variantImage = '';

  const optValues = typeof v.optionValues === 'string' ? JSON.parse(v.optionValues) : (v.optionValues || {});
  if (Array.isArray(optValues.images) && optValues.images.length > 0) {
    variantImage = optValues.images[0];
  }

  const configOptions = prod?.configOptions?.attributes || prod?.configOptions || [];
  if (Array.isArray(configOptions) && typeof optValues === 'object') {
    for (const group of configOptions) {
      const valId = optValues[group.groupId];
      if (valId !== undefined && Array.isArray(group.options)) {
        const matched = group.options.find((opt: any) => String(opt.id) === String(valId));
        if (matched) {
          nameParts.push(matched.name);
          if (!variantImage && (matched.imageUrl || matched.image)) {
            variantImage = matched.imageUrl || matched.image;
          }
        }
      }
    }
  }

  let finalName = v.name || '';
  if (nameParts.length > 0) {
    finalName = nameParts.join(' / ');
  } else if (finalName.includes('(Tiêu chuẩn)')) {
    finalName = 'Tiêu chuẩn';
  } else if (finalName === prod?.name) {
    finalName = 'Tiêu chuẩn';
  }

  return {
    name: finalName,
    image: variantImage || v.image || (v as any).imageUrl || (Array.isArray(prod?.images) ? prod.images[0] : '') || prod?.thumbnail || ''
  };
}

function mapProductToInventoryItem(prod: any, warehouseId?: string) {
  let prodPhysical = 0;
  let prodReserved = 0;

  const variants = prod.variants.map((v: any) => {
    let vPhysical = v.stock || 0;
    let vReserved = v.reservedStock || 0;

    if (warehouseId && warehouseId !== 'all' && warehouseId !== 'Tất cả chi nhánh') {
      const whStock = v.warehouseStocks?.find((ws: any) =>
        ws.warehouseId === warehouseId || ws.warehouse?.name === warehouseId
      );
      if (whStock) {
        vPhysical = whStock.physicalStock;
        vReserved = whStock.reservedStock;
      } else {
        vPhysical = Math.floor(vPhysical / 4);
        vReserved = Math.floor(vReserved / 4);
      }
    }

    const vAvailable = Math.max(0, vPhysical - vReserved);
    prodPhysical += vPhysical;
    prodReserved += vReserved;
    const vThreshold = 5;
    let vStatus = 'Còn hàng';
    if (vAvailable <= 0) {
      vStatus = 'Hết hàng';
    } else if (vAvailable <= vThreshold) {
      vStatus = 'Sắp hết hàng';
    } else {
      vStatus = 'Còn hàng';
    }

    const resolved = resolveVariantNameAndImage(v, prod);

    return {
      id: v.id,
      sku: v.sku,
      name: resolved.name,
      price: v.price,
      physical: vPhysical,
      reserved: vReserved,
      available: vAvailable,
      threshold: vThreshold,
      status: vStatus,
      image: resolved.image
    };
  });

  const prodAvailable = Math.max(0, prodPhysical - prodReserved);
  const isSingleVariant = variants.length <= 1;

  // 1. Cột Cảnh báo:
  // - Nếu chỉ có 1 biến thể: cảnh báo cha = cảnh báo con (variants[0].threshold || 5)
  // - Nếu nhiều biến thể: cột cảnh báo để '-' vì từng biến thể có ngưỡng cảnh báo độc lập
  const threshold: string | number = isSingleVariant ? (variants[0]?.threshold ?? 5) : '-';

  // 2. Tag Trạng thái:
  const outOfStockCount = variants.filter((v: any) => v.available <= 0).length;
  const lowStockCount = variants.filter((v: any) => v.available > 0 && v.available <= (v.threshold ?? 5)).length;

  let status = 'Còn hàng';
  let statusCategory = 'Còn hàng';
  const statusBadges: { text: string; type: 'in' | 'low' | 'out' }[] = [];

  if (isSingleVariant) {
    status = variants[0]?.status || 'Còn hàng';
    statusCategory = status;
    statusBadges.push({
      text: status,
      type: status === 'Hết hàng' ? 'out' : (status === 'Sắp hết hàng' ? 'low' : 'in')
    });
  } else {
    // Sản phẩm nhiều biến thể:
    if (outOfStockCount === 0 && lowStockCount === 0) {
      status = 'Còn hàng';
      statusCategory = 'Còn hàng';
      statusBadges.push({ text: 'Còn hàng', type: 'in' });
    } else {
      if (outOfStockCount > 0) {
        statusBadges.push({ text: `${outOfStockCount} hết hàng`, type: 'out' });
      }
      if (lowStockCount > 0) {
        statusBadges.push({ text: `${lowStockCount} sắp hết`, type: 'low' });
      }

      if (outOfStockCount > 0 && lowStockCount > 0) {
        status = `${outOfStockCount} hết hàng, ${lowStockCount} sắp hết`;
        statusCategory = 'Hết hàng';
      } else if (outOfStockCount > 0) {
        status = `${outOfStockCount} hết hàng`;
        statusCategory = 'Hết hàng';
      } else {
        status = `${lowStockCount} sắp hết`;
        statusCategory = 'Sắp hết hàng';
      }
    }
  }

  let image = '';
  if (Array.isArray(prod.images) && prod.images.length > 0) {
    image = (prod.images[0] as string) || '';
  } else if (typeof prod.images === 'string') {
    try {
      const parsed = JSON.parse(prod.images);
      image = Array.isArray(parsed) ? parsed[0] : prod.images;
    } catch {
      image = prod.images;
    }
  }

  return {
    id: prod.id,
    sku: prod.variants[0]?.sku || `SKU-${prod.id.slice(0, 8)}`,
    productName: prod.name,
    category: prod.category?.name || 'Nội thất',
    image,
    location: warehouseId && warehouseId !== 'all' && warehouseId !== 'Tất cả chi nhánh' ? warehouseId : 'Toàn hệ thống',
    physicalStock: prodPhysical,
    reservedStock: prodReserved,
    availableStock: prodAvailable,
    threshold,
    status,
    statusCategory,
    statusBadges,
    variants
  };
}

export const inventoryController = {
  // 1. Lấy danh sách Kho / Chi nhánh thực tế
  getWarehouses: async (req: Request, res: Response) => {
    try {
      const warehouses = await (prisma as any).warehouse.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' }
      });
      if (warehouses && warehouses.length > 0) {
        cachedWarehouses = warehouses;
      }
      res.json(warehouses);
    } catch (error) {
      console.warn('Temporary connection issue to Supabase pooler, using cached warehouses:', (error as any)?.message);
      res.json(cachedWarehouses);
    }
  },

  // 1b. Lấy danh sách Danh mục cấp 1 & cấp 2 cho bộ lọc
  getCategories: async (req: Request, res: Response) => {
    try {
      const categories = await prisma.category.findMany({
        where: { parentId: null, isActive: true },
        include: {
          children: {
            where: { isActive: true },
            orderBy: { name: 'asc' }
          }
        },
        orderBy: { name: 'asc' }
      });
      if (categories && categories.length > 0) {
        cachedCategories = categories;
      }
      res.json(categories.length > 0 ? categories : cachedCategories);
    } catch (error) {
      console.warn('Temporary connection issue fetching categories, using cache:', (error as any)?.message);
      res.json(cachedCategories);
    }
  },

  // 1c. Lấy dữ liệu Tổng quan kho thực tế từ Supabase (có phân trang 10 sp/trang)
  getInventoryOverview: async (req: Request, res: Response) => {
    try {
      const warehouseId = req.query.warehouseId as string | undefined;
      const search = (req.query.search as string || '').trim();
      const categoryId = req.query.categoryId as string | undefined;
      const stockStatus = (req.query.stockStatus as string || req.query.status as string || '').trim();
      const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
      const limit = Math.max(1, parseInt(req.query.limit as string, 10) || 10);
      const skip = (page - 1) * limit;

      const cacheKey = warehouseId || 'all';
      const now = Date.now();
      let cachedSummary = summaryCache.get(cacheKey);

      let summary: OverviewSummary;

      if (cachedSummary && now - cachedSummary.timestamp < 5 * 60 * 1000) {
        summary = cachedSummary.data;
      } else {
        const needWarehouseStocks = Boolean(warehouseId && warehouseId !== 'all' && warehouseId !== 'Tất cả chi nhánh');

        // Truy vấn nhẹ chỉ lấy stock & reservedStock của variants để tính KPI tổng
        const allProductsForSummary = await prisma.product.findMany({
          where: { isActive: true },
          select: {
            variants: {
              where: { isActive: true },
              select: {
                stock: true,
                reservedStock: true,
                ...(needWarehouseStocks ? {
                  warehouseStocks: {
                    select: {
                      warehouseId: true,
                      physicalStock: true,
                      reservedStock: true,
                      warehouse: { select: { name: true } }
                    }
                  }
                } : {})
              }
            }
          }
        });

        let totalPhysicalStock = 0;
        let totalReservedStock = 0;
        let inStockCount = 0;
        let lowStockCount = 0;
        let outOfStockCount = 0;

        for (const prod of allProductsForSummary) {
          let prodPhysical = 0;
          let prodReserved = 0;
          let prodOutCount = 0;
          let prodLowCount = 0;

          for (const v of prod.variants) {
            let vPhysical = v.stock || 0;
            let vReserved = v.reservedStock || 0;

            if (needWarehouseStocks) {
              const whStock = (v as any).warehouseStocks?.find((ws: any) =>
                ws.warehouseId === warehouseId || ws.warehouse?.name === warehouseId
              );
              if (whStock) {
                vPhysical = whStock.physicalStock;
                vReserved = whStock.reservedStock;
              } else {
                vPhysical = Math.floor(vPhysical / 4);
                vReserved = Math.floor(vReserved / 4);
              }
            }
            prodPhysical += vPhysical;
            prodReserved += vReserved;

            const vAvail = Math.max(0, vPhysical - vReserved);
            const vThreshold = 5;
            if (vAvail <= 0) {
              outOfStockCount++;
            } else if (vAvail <= vThreshold) {
              lowStockCount++;
            } else {
              inStockCount++;
            }
          }

          totalPhysicalStock += prodPhysical;
          totalReservedStock += prodReserved;
        }

        summary = {
          totalPhysicalStock,
          totalReservedStock,
          totalAvailableStock: Math.max(0, totalPhysicalStock - totalReservedStock),
          inStockCount,
          lowStockCount,
          outOfStockCount,
          totalProducts: allProductsForSummary.length
        };

        summaryCache.set(cacheKey, { data: summary, timestamp: now });
      }

      // Điều kiện lọc sản phẩm cho bảng
      const whereCondition: any = {
        isActive: true
      };

      // 1. Tìm tức thời theo Tên sản phẩm, Mã SKU, Danh mục
      if (search) {
        whereCondition.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { variants: { some: { sku: { contains: search, mode: 'insensitive' } } } },
          { category: { name: { contains: search, mode: 'insensitive' } } },
          { category: { parent: { name: { contains: search, mode: 'insensitive' } } } }
        ];
      }

      // 2. Lọc theo danh mục cấp 1, cấp 2
      if (categoryId && categoryId !== 'all' && categoryId !== 'Tất cả danh mục') {
        try {
          const selectedCat = await prisma.category.findFirst({
            where: {
              OR: [
                { id: categoryId },
                { name: { equals: categoryId, mode: 'insensitive' } }
              ]
            },
            include: { children: { select: { id: true } } }
          });

          if (selectedCat) {
            if (selectedCat.children && selectedCat.children.length > 0) {
              const childIds = selectedCat.children.map(c => c.id);
              whereCondition.categoryId = { in: [selectedCat.id, ...childIds] };
            } else {
              whereCondition.categoryId = selectedCat.id;
            }
          }
        } catch (catErr) {
          console.warn('Could not resolve category filter:', catErr);
        }
      }

      const needWhStocksInList = Boolean(warehouseId && warehouseId !== 'all' && warehouseId !== 'Tất cả chi nhánh');
      const hasStatusFilter = Boolean(stockStatus && stockStatus !== 'Tất cả trạng thái');

      let totalItems = 0;
      let items: any[] = [];

      if (hasStatusFilter) {
        // Lấy tất cả ứng viên khớp điều kiện tìm kiếm và danh mục để tính toán trạng thái tồn chính xác
        const matchedProducts = await prisma.product.findMany({
          where: whereCondition,
          include: {
            category: { select: { id: true, name: true } },
            variants: {
              where: { isActive: true },
              include: needWhStocksInList ? {
                warehouseStocks: {
                  include: { warehouse: true }
                }
              } : undefined,
              orderBy: { name: 'asc' }
            }
          },
          orderBy: { createdAt: 'desc' }
        });

        const allMapped = matchedProducts.map(p => mapProductToInventoryItem(p, warehouseId));
        const filtered = allMapped.filter(item => {
          if (stockStatus === 'Còn hàng') {
            return item.variants.some((v: any) => v.status === 'Còn hàng');
          }
          if (stockStatus === 'Sắp hết hàng' || stockStatus === 'Sắp hết') {
            return item.variants.some((v: any) => v.status === 'Sắp hết hàng');
          }
          if (stockStatus === 'Hết hàng') {
            return item.variants.some((v: any) => v.status === 'Hết hàng');
          }
          return item.status === stockStatus;
        });
        totalItems = filtered.length;
        items = filtered.slice(skip, skip + limit);
      } else {
        const [count, products] = await Promise.all([
          (search || (categoryId && categoryId !== 'all' && categoryId !== 'Tất cả danh mục'))
            ? prisma.product.count({ where: whereCondition })
            : Promise.resolve(summary.totalProducts),
          prisma.product.findMany({
            where: whereCondition,
            include: {
              category: { select: { id: true, name: true } },
              variants: {
                where: { isActive: true },
                include: needWhStocksInList ? {
                  warehouseStocks: {
                    include: { warehouse: true }
                  }
                } : undefined,
                orderBy: { name: 'asc' }
              }
            },
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' }
          })
        ]);

        totalItems = count;
        items = products.map(p => mapProductToInventoryItem(p, warehouseId));
      }

      res.json({
        summary,
        items,
        pagination: {
          page,
          limit,
          totalItems,
          totalPages: Math.ceil(totalItems / limit) || 1
        }
      });
    } catch (error) {
      console.error('Error fetching inventory overview:', error);
      res.status(500).json({ error: 'Không thể lấy dữ liệu tổng quan kho' });
    }
  },

  // 2. Lấy danh sách Sản phẩm kèm đầy đủ Biến thể thực tế cho Form
  // 2. Lấy danh sách Sản phẩm kèm đầy đủ Biến thể & Tồn kho theo từng kho thực tế cho Form
  getProductsWithOptions: async (req: Request, res: Response) => {
    try {
      if (productsWithOptionsCache && (Date.now() - productsWithOptionsCache.timestamp < PRODUCTS_CACHE_TTL)) {
        return res.json(productsWithOptionsCache.data);
      }

      const products = await withDbRetry(() =>
        prisma.$queryRawUnsafe<any[]>(`
          SELECT 
            p.id, p.name, p.slug, p."basePrice", p."categoryId",
            p.images, p."configOptions",
            c.name as "categoryName", c."parentId" as "categoryParentId"
          FROM "Product" p
          LEFT JOIN "Category" c ON p."categoryId" = c.id
          WHERE p."isActive" = true
          ORDER BY p.name ASC;
        `)
      );

      const variants = await withDbRetry(() =>
        prisma.$queryRawUnsafe<any[]>(`
          SELECT 
            v.id, v."productId", v.sku, v.name, v.price, v.stock, v."reservedStock", v."optionValues"
          FROM "ProductVariant" v
          WHERE v."isActive" = true;
        `)
      );

      const stocks = await withDbRetry(() =>
        prisma.$queryRawUnsafe<any[]>(`
          SELECT 
            ws."variantId", ws."warehouseId", ws."physicalStock", ws."reservedStock" as "whReservedStock"
          FROM "WarehouseStock" ws;
        `)
      );

      const stockMap = new Map<string, any[]>();
      for (const s of stocks) {
        let list = stockMap.get(s.variantId);
        if (!list) {
          list = [];
          stockMap.set(s.variantId, list);
        }
        list.push({
          warehouseId: s.warehouseId,
          physicalStock: Number(s.physicalStock || 0),
          reservedStock: Number(s.whReservedStock || 0)
        });
      }

      const productVariantMap = new Map<string, any[]>();
      for (const v of variants) {
        const vObj = {
          id: v.id,
          productId: v.productId,
          sku: v.sku,
          name: v.name,
          price: Number(v.price || 0),
          stock: Number(v.stock || 0),
          reservedStock: Number(v.reservedStock || 0),
          optionValues: v.optionValues,
          warehouseStocks: stockMap.get(v.id) || []
        };

        let list = productVariantMap.get(v.productId);
        if (!list) {
          list = [];
          productVariantMap.set(v.productId, list);
        }
        list.push(vObj);
      }

      const formatted = products.map((p: any) => {
        const prodVariants = productVariantMap.get(p.id) || [];
        const mappedVariants = prodVariants.map((v: any) => {
          const resolved = resolveVariantNameAndImage(v, p);
          return {
            ...v,
            name: resolved.name,
            image: resolved.image
          };
        });

        return {
          id: p.id,
          name: p.name,
          slug: p.slug,
          basePrice: Number(p.basePrice || 0),
          images: p.images,
          configOptions: p.configOptions,
          category: p.categoryId ? {
            id: p.categoryId,
            name: p.categoryName,
            parentId: p.categoryParentId
          } : null,
          sku: mappedVariants[0]?.sku || `SKU-${p.id.slice(0, 8).toUpperCase()}`,
          variants: mappedVariants
        };
      });

      productsWithOptionsCache = {
        data: formatted,
        timestamp: Date.now()
      };

      res.json(formatted);
    } catch (error) {
      console.error('Error fetching products with options:', error);
      res.status(500).json({ error: 'Không thể lấy danh sách sản phẩm' });
    }
  },

  // 3. Lấy danh sách Lệnh xuất - nhập kho (Tab 3)
  getStockOrders: async (req: Request, res: Response) => {
    try {
      const orders = await (prisma as any).stockOrder.findMany({
        include: {
          items: {
            include: {
              variant: {
                select: {
                  id: true,
                  sku: true,
                  name: true,
                  price: true,
                  product: {
                    select: { id: true, name: true, images: true }
                  }
                }
              }
            }
          },
          sourceWarehouse: true,
          destWarehouse: true,
          creator: {
            select: { id: true, fullName: true, email: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      // Format BigInt to string/number and resolve status
      const formatted = orders.map((o: any) => {
        let displayStatus = o.status;
        if (o.notes?.includes('[STATUS:DRAFT]')) displayStatus = 'DRAFT';
        else if (o.notes?.includes('[STATUS:PLANNED]')) displayStatus = 'PLANNED';
        else if (o.notes?.includes('[STATUS:IMPORTED]')) displayStatus = 'IMPORTED';
        else if (o.notes?.includes('[STATUS:EXPORTED]')) displayStatus = 'EXPORTED';
        else if (o.notes?.includes('[STATUS:CANCELLED]') || o.status === 'CANCELLED') displayStatus = 'CANCELLED';
        else if (o.status === 'COMPLETED') displayStatus = o.type === 'IMPORT' ? 'IMPORTED' : 'EXPORTED';
        else if (o.status === 'PENDING') displayStatus = 'DRAFT';
        else if (o.status === 'PROCESSING') displayStatus = 'PLANNED';

        let creatorName = o.creator?.fullName || o.creator?.name;
        if (!creatorName && o.notes) {
          const match = o.notes.match(/\[Người lập:\s*([^\]]+)\]/);
          if (match) creatorName = match[1].trim();
        }
        if (!creatorName && o.notes && o.notes.includes('ACTION_LOGS:')) {
          try {
            const logsMatch = o.notes.match(/\[ACTION_LOGS:([\s\S]*?)\]\]/) || o.notes.match(/\[ACTION_LOGS:([\s\S]*?)\]/);
            if (logsMatch) {
              const logs = JSON.parse(logsMatch[1]);
              if (Array.isArray(logs) && logs.length > 0 && logs[0].operator) {
                creatorName = logs[0].operator;
              }
            }
          } catch {}
        }
        if (!creatorName) creatorName = 'Admin Quản Trị';

        let recipientName = '';
        if (o.notes) {
          const matchRec = o.notes.match(/\[Người nhận:\s*([^\]]+)\]/);
          if (matchRec) recipientName = matchRec[1].trim();
        }

        // Clean user notes so technical tags never appear on UI
        const rawNotes = o.notes || '';
        const cleanUserNotes = rawNotes
          .replace(/\[ACTION_LOGS:[\s\S]*?\]\]/g, '')
          .replace(/\[ACTION_LOGS:[\s\S]*?\]/g, '')
          .replace(/\[STATUS:[^\]]+\]/g, '')
          .replace(/\[Người lập:[^\]]+\]/g, '')
          .replace(/\[Người nhận:[^\]]+\]/g, '')
          .replace(/\[Lý do hủy:[^\]]+\]/g, '')
          .trim();

        return {
          ...o,
          status: displayStatus,
          rawStatus: displayStatus,
          creatorName,
          recipientName,
          notes: cleanUserNotes,
          rawNotes: rawNotes,
          totalAmount: Number(o.totalAmount || 0),
          items: (o.items || []).map((it: any) => ({
            ...it,
            lineTotal: Number(it.lineTotal || 0)
          }))
        };
      });

      res.json(formatted);
    } catch (error) {
      console.error('Error fetching stock orders:', error);
      res.status(500).json({ error: 'Không thể lấy danh sách lệnh kho' });
    }
  },

  // Lấy danh sách các lý do xuất/nhập kho đã từng được sử dụng trong hệ thống và cấu hình đối tác
  getInventoryReasons: async (req: Request, res: Response) => {
    try {
      // 1. Lấy từ bảng cấu hình inventory_custom_reasons
      let customReasons: any[] = [];
      try {
        customReasons = await prisma.$queryRawUnsafe<any[]>(
          `SELECT type, reason, requires_partner as "requiresPartner", partner_label as "partnerLabel" 
           FROM inventory_custom_reasons ORDER BY created_at ASC`
        );
      } catch (err) {
        console.warn('inventory_custom_reasons query warning:', err);
      }

      // 2. Lấy các lý do thực tế từ StockOrder
      const orders = await (prisma as any).stockOrder.findMany({
        where: {
          NOT: { reason: '' }
        },
        select: {
          reason: true,
          type: true
        }
      });

      const importReasons: string[] = [];
      const exportReasons: string[] = [];

      (customReasons || []).forEach((c: any) => {
        const r = (c.reason || '').trim();
        if (r) {
          if (c.type === 'import') {
            if (!importReasons.includes(r)) importReasons.push(r);
          } else {
            if (!exportReasons.includes(r)) exportReasons.push(r);
          }
        }
      });

      (orders || []).forEach((o: any) => {
        if (o.reason && typeof o.reason === 'string') {
          const trimmed = o.reason.trim();
          if (trimmed) {
            if (o.type === 'IMPORT') {
              if (!importReasons.includes(trimmed)) importReasons.push(trimmed);
            } else {
              if (!exportReasons.includes(trimmed)) exportReasons.push(trimmed);
            }
          }
        }
      });

      res.json({
        importReasons,
        exportReasons,
        customReasons: customReasons || []
      });
    } catch (error) {
      console.error('Error fetching inventory reasons:', error);
      res.status(500).json({ error: 'Không thể lấy danh sách lý do xuất nhập kho' });
    }
  },

  // Lưu mới hoặc cập nhật lý do xuất/nhập kèm cấu hình trường đối tác vào cơ sở dữ liệu
  saveInventoryReason: async (req: Request, res: Response) => {
    try {
      const { type, reason, requiresPartner, partnerLabel } = req.body;
      if (!reason || typeof reason !== 'string') {
        return res.status(400).json({ error: 'Lý do không được để trống' });
      }
      const trimmedReason = reason.trim();
      const normType = (type || 'export').toLowerCase() === 'import' ? 'import' : 'export';
      const reqPartner = Boolean(requiresPartner);
      const label = reqPartner 
        ? ((partnerLabel && typeof partnerLabel === 'string' && partnerLabel.trim()) ? partnerLabel.trim() : (normType === 'import' ? 'Nhà cung ứng' : 'Khách hàng'))
        : null;
      const id = 'reason_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

      await prisma.$executeRawUnsafe(
        `INSERT INTO inventory_custom_reasons (id, type, reason, requires_partner, partner_label)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (reason) 
         DO UPDATE SET requires_partner = EXCLUDED.requires_partner, partner_label = EXCLUDED.partner_label`,
        id,
        normType,
        trimmedReason,
        reqPartner,
        label
      );

      res.json({
        success: true,
        reason: {
          id,
          type: normType,
          reason: trimmedReason,
          requiresPartner: reqPartner,
          partnerLabel: label
        }
      });
    } catch (error) {
      console.error('Error saving inventory reason:', error);
      res.status(500).json({ error: 'Không thể lưu lý do vào cơ sở dữ liệu' });
    }
  },

  // 4. Tạo Lệnh xuất - nhập kho mới (Hỗ trợ Lưu nháp PENDING và Tạo phiếu xuất COMPLETED trừ kho)
  createStockOrder: async (req: Request, res: Response) => {
    try {
      const {
        type, // 'IMPORT' | 'EXPORT' | 'TRANSFER'
        sourceLocation,
        destinationLocation,
        sourceWarehouseId,
        destWarehouseId,
        referenceCode,
        reason,
        notes,
        items,
        orderCode: customOrderCode,
        status: customStatus,
        createdAt: customCreatedAt,
        creatorName,
        recipientName
      } = req.body;

      const now = new Date();
      const yearMonth = `${now.getFullYear().toString().slice(-2)}${(now.getMonth() + 1).toString().padStart(2, '0')}`;
      
      // Xác định mã phiếu nếu client chưa gửi
      // Xác định mã phiếu nếu client chưa gửi
      let orderCode = customOrderCode;
      if (!orderCode) {
        const prefix = type === 'IMPORT' ? 'NK' : (type === 'EXPORT' ? 'XK' : 'CK');
        const randomNum = Math.floor(100 + Math.random() * 900);
        orderCode = `${prefix}-${yearMonth}-${randomNum}`;
      }

      // Đảm bảo mã chứng từ orderCode không bị trùng trong DB (tự tăng STT nếu đã có)
      let uniqueOrderCode = orderCode;
      let counter = 1;
      while (await (prisma as any).stockOrder.findUnique({ where: { orderCode: uniqueOrderCode } })) {
        const parts = orderCode.split('-');
        const prefixParts = parts.slice(0, -1).join('-');
        const lastPart = parts[parts.length - 1];
        const num = parseInt(lastPart, 10);
        if (!isNaN(num)) {
          uniqueOrderCode = `${prefixParts}-${String(num + counter).padStart(lastPart.length, '0')}`;
        } else {
          uniqueOrderCode = `${orderCode}-${counter}`;
        }
        counter++;
      }
      orderCode = uniqueOrderCode;

      let dbStatus: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED' = 'PENDING';
      let statusTag = '[STATUS:DRAFT]';
      if (customStatus === 'PLANNED') {
        dbStatus = 'PROCESSING';
        statusTag = '[STATUS:PLANNED]';
      } else if (customStatus === 'IMPORTED') {
        dbStatus = 'COMPLETED';
        statusTag = '[STATUS:IMPORTED]';
      } else if (customStatus === 'EXPORTED' || customStatus === 'COMPLETED') {
        dbStatus = 'COMPLETED';
        statusTag = type === 'IMPORT' ? '[STATUS:IMPORTED]' : '[STATUS:EXPORTED]';
      } else if (customStatus === 'CANCELLED') {
        dbStatus = 'CANCELLED';
        statusTag = '[STATUS:CANCELLED]';
      } else {
        dbStatus = 'PENDING';
        statusTag = '[STATUS:DRAFT]';
      }

      const finalStatus = dbStatus;
      const createdDate = customCreatedAt ? new Date(customCreatedAt) : now;
      const finalDestination = destinationLocation || recipientName || (type === 'TRANSFER' ? 'Chi nhánh điều chuyển' : 'Khách hàng / Đối tác');
      const creatorTag = creatorName ? `[Người lập: ${creatorName}]` : '';
      const recipientTag = recipientName ? `[Người nhận: ${recipientName}]` : '';
      const baseNotes = [creatorTag, recipientTag, notes || ''].filter(Boolean).join(' ');
      const extraNotes = `${statusTag} ${baseNotes}`.trim() || null;

      let totalQty = 0;
      let totalAmt = BigInt(0);

      const lineItems = (items || []).map((it: any) => {
        const qty = parseInt(it.quantity, 10) || 1;
        const price = parseInt(it.price, 10) || 0;
        const lineTotal = BigInt(qty * price);
        totalQty += qty;
        totalAmt += lineTotal;

        return {
          variantId: it.variantId,
          quantity: qty,
          unitPrice: price,
          lineTotal: lineTotal,
          notes: it.notes || (it.unit ? `ĐVT: ${it.unit}` : null)
        };
      });

      const newOrder = await (prisma as any).stockOrder.create({
        data: {
          orderCode,
          type,
          status: finalStatus,
          sourceLocation: sourceLocation || 'Kho Tổng (TP.HCM)',
          destinationLocation: finalDestination,
          sourceWarehouseId: sourceWarehouseId || null,
          destWarehouseId: destWarehouseId || null,
          referenceCode: referenceCode || orderCode,
          reason: reason || 'Lập lệnh kho theo yêu cầu',
          notes: extraNotes,
          totalQuantity: totalQty,
          totalAmount: totalAmt,
          completedAt: finalStatus === 'COMPLETED' ? new Date() : null,
          createdAt: createdDate,
          items: {
            create: lineItems
          }
        },
        include: {
          items: true
        }
      });

      // Chỉ cập nhật tồn kho khi thực sự hoàn tất (IMPORTED, EXPORTED hoặc COMPLETED)
      if (customStatus === 'IMPORTED' || customStatus === 'EXPORTED' || customStatus === 'COMPLETED') {
        for (const item of lineItems) {
          try {
            if (type === 'EXPORT') {
              // 1. Trừ tồn kho tổng của Variant
              await prisma.productVariant.update({
                where: { id: item.variantId },
                data: {
                  stock: { decrement: item.quantity }
                }
              }).catch(e => console.warn('Could not decrement variant stock:', e));

              // 2. Trừ tồn kho tại WarehouseStock cụ thể
              let stockBefore = 0;
              let stockAfter = 0;
              if (sourceWarehouseId) {
                const whStock = await (prisma as any).warehouseStock.findFirst({
                  where: { warehouseId: sourceWarehouseId, variantId: item.variantId }
                });
                if (whStock) {
                  stockBefore = whStock.physicalStock;
                  stockAfter = Math.max(0, whStock.physicalStock - item.quantity);
                  await (prisma as any).warehouseStock.update({
                    where: { id: whStock.id },
                    data: { physicalStock: { decrement: item.quantity } }
                  }).catch((e: any) => console.warn('Could not decrement warehouseStock:', e));
                }
              }

              // 3. Ghi bút toán sổ cái biến động kho StockTransaction
              const txRandom = Math.floor(1000 + Math.random() * 9000);
              const txType = reason?.includes('Chuyển kho') ? 'TRANSFER_OUT'
                           : (reason?.includes('hủy') || reason?.includes('Hư hỏng') ? 'DISPOSAL_DISPATCH' : 'SALES_DISPATCH');
              
              await (prisma as any).stockTransaction.create({
                data: {
                  txCode: `TX-${yearMonth}-${txRandom}`,
                  type: txType,
                  variantId: item.variantId,
                  location: sourceLocation || 'Kho xuất',
                  warehouseId: sourceWarehouseId || null,
                  stockBefore,
                  quantityChange: -item.quantity,
                  stockAfter,
                  referenceCode: orderCode,
                  stockOrderId: newOrder.id,
                  notes: `Xuất kho [${orderCode}]: ${reason || 'Xuất kho chính thức'}`
                }
              }).catch((e: any) => console.warn('Could not create transaction ledger:', e));

            } else if (type === 'IMPORT') {
              // Tăng tồn kho nếu là phiếu nhập hoàn tất
              await prisma.productVariant.update({
                where: { id: item.variantId },
                data: {
                  stock: { increment: item.quantity }
                }
              }).catch((e: any) => console.warn('Could not increment variant stock:', e));

              let stockBefore = 0;
              let stockAfter = item.quantity;
              const targetWhId = destWarehouseId || sourceWarehouseId;

              if (targetWhId) {
                const whStock = await (prisma as any).warehouseStock.findFirst({
                  where: { warehouseId: targetWhId, variantId: item.variantId }
                });
                if (whStock) {
                  stockBefore = whStock.physicalStock;
                  stockAfter = whStock.physicalStock + item.quantity;
                  await (prisma as any).warehouseStock.update({
                    where: { id: whStock.id },
                    data: { physicalStock: { increment: item.quantity } }
                  }).catch((e: any) => console.warn('Could not increment warehouseStock:', e));
                }
              }

              // Ghi bút toán sổ cái biến động kho StockTransaction cho Nhập kho
              const txRandom = Math.floor(1000 + Math.random() * 9000);
              const txType = reason?.includes('Chuyển kho') ? 'TRANSFER_IN'
                           : (reason?.includes('trả lại') || reason?.includes('khách hàng') ? 'RETURN_RECEIPT' : 'IMPORT_RECEIPT');
              await (prisma as any).stockTransaction.create({
                data: {
                  txCode: `TX-${yearMonth}-${txRandom}`,
                  type: txType,
                  variantId: item.variantId,
                  location: destinationLocation || 'Kho nhập',
                  warehouseId: destWarehouseId || null,
                  stockBefore,
                  quantityChange: item.quantity,
                  stockAfter,
                  referenceCode: referenceCode || orderCode,
                  stockOrderId: newOrder.id,
                  notes: `Nhập kho [${orderCode}]: ${reason || 'Nhập kho hàng hóa'}`
                }
              }).catch((e: any) => console.warn('Could not create import transaction ledger:', e));
            }
          } catch (itemErr) {
            console.error('Error processing item inventory update:', itemErr);
          }
        }
      }

      clearInventoryCaches();
      res.status(201).json({
        ...newOrder,
        totalAmount: Number(newOrder.totalAmount || 0),
        items: (newOrder.items || []).map((it: any) => ({
          ...it,
          lineTotal: Number(it.lineTotal || 0)
        }))
      });
    } catch (error) {
      console.error('Error creating stock order:', error);
      res.status(500).json({ error: 'Không thể tạo lệnh kho' });
    }
  },

  // 4b. Cập nhật trạng thái Lệnh xuất - nhập kho (Ví dụ từ DRAFT sang PLANNED hoặc sang EXPORTED)
  updateStockOrderStatus: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status: newStatus, cancelReason } = req.body;

      const order = await (prisma as any).stockOrder.findFirst({
        where: { OR: [{ id }, { orderCode: id }] },
        include: { items: true }
      });

      if (!order) {
        return res.status(404).json({ error: 'Không tìm thấy lệnh kho' });
      }

      const prevStatus = order.status;
      let dbStatus: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED' = 'PENDING';
      let statusTag = '';

      if (newStatus === 'DRAFT') {
        dbStatus = 'PENDING';
        statusTag = '[STATUS:DRAFT]';
      } else if (newStatus === 'PLANNED') {
        dbStatus = 'PROCESSING';
        statusTag = '[STATUS:PLANNED]';
      } else if (newStatus === 'IMPORTED') {
        dbStatus = 'COMPLETED';
        statusTag = '[STATUS:IMPORTED]';
      } else if (newStatus === 'EXPORTED' || newStatus === 'COMPLETED') {
        dbStatus = 'COMPLETED';
        statusTag = order.type === 'IMPORT' ? '[STATUS:IMPORTED]' : '[STATUS:EXPORTED]';
      } else if (newStatus === 'CANCELLED') {
        dbStatus = 'CANCELLED';
        statusTag = '[STATUS:CANCELLED]';
      } else {
        dbStatus = 'PROCESSING';
        statusTag = `[STATUS:${newStatus}]`;
      }

      let updatedNotes = order.notes || '';
      updatedNotes = updatedNotes.replace(/\[STATUS:[^\]]+\]\s*/g, '').trim();
      if (statusTag) {
        updatedNotes = `${statusTag} ${updatedNotes}`.trim();
      }
      if (cancelReason) {
        updatedNotes = `${updatedNotes} [Lý do hủy: ${cancelReason}]`.trim();
      }

      const updated = await (prisma as any).stockOrder.update({
        where: { id: order.id },
        data: {
          status: dbStatus,
          notes: updatedNotes,
          completedAt: (dbStatus === 'COMPLETED') ? new Date() : (dbStatus === 'PENDING' ? null : order.completedAt)
        }
      });

      // Nếu chuyển sang COMPLETED / EXPORTED / IMPORTED và trước đó chưa COMPLETED: cập nhật tồn kho thực tế
      if (prevStatus !== 'COMPLETED' && (newStatus === 'IMPORTED' || newStatus === 'EXPORTED' || newStatus === 'COMPLETED' || dbStatus === 'COMPLETED')) {
        for (const item of order.items) {
          try {
            if (order.type === 'EXPORT') {
              await prisma.productVariant.update({
                where: { id: item.variantId },
                data: { stock: { decrement: item.quantity } }
              }).catch(e => console.warn('Could not decrement variant stock:', e));

              if (order.sourceWarehouseId) {
                const whStock = await (prisma as any).warehouseStock.findFirst({
                  where: { warehouseId: order.sourceWarehouseId, variantId: item.variantId }
                });
                if (whStock) {
                  await (prisma as any).warehouseStock.update({
                    where: { id: whStock.id },
                    data: { physicalStock: { decrement: item.quantity } }
                  }).catch((e: any) => console.warn('Could not decrement warehouseStock:', e));
                }
              }
            } else if (order.type === 'IMPORT') {
              await prisma.productVariant.update({
                where: { id: item.variantId },
                data: { stock: { increment: item.quantity } }
              }).catch(e => console.warn('Could not increment variant stock:', e));

              const targetWhId = order.destWarehouseId || order.sourceWarehouseId;
              if (targetWhId) {
                const whStock = await (prisma as any).warehouseStock.findFirst({
                  where: { warehouseId: targetWhId, variantId: item.variantId }
                });
                if (whStock) {
                  await (prisma as any).warehouseStock.update({
                    where: { id: whStock.id },
                    data: { physicalStock: { increment: item.quantity } }
                  }).catch((e: any) => console.warn('Could not increment warehouseStock:', e));
                }
              }
            }
          } catch (e) {
            console.warn('Error adjusting stock on status complete:', e);
          }
        }
        clearInventoryCaches();
      }

      res.json({
        ...updated,
        status: newStatus,
        rawStatus: newStatus,
        totalAmount: Number(updated.totalAmount || 0),
        items: (updated.items || []).map((it: any) => ({
          ...it,
          lineTotal: Number(it.lineTotal || 0)
        }))
      });
    } catch (error) {
      console.error('Error updating stock order status:', error);
      res.status(500).json({ error: 'Không thể cập nhật trạng thái lệnh kho' });
    }
  },

  // 4c. Chỉnh sửa chi tiết phiếu (Dành cho phiếu nháp Draft)
  updateStockOrder: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const {
        sourceLocation,
        destinationLocation,
        sourceWarehouseId,
        destWarehouseId,
        reason,
        notes,
        items
      } = req.body;

      const order = await (prisma as any).stockOrder.findFirst({
        where: { OR: [{ id }, { orderCode: id }] }
      });
      if (!order) {
        return res.status(404).json({ error: 'Không tìm thấy phiếu' });
      }

      let totalQty = 0;
      let totalAmt = BigInt(0);
      const lineItems = (items || []).map((it: any) => {
        const qty = parseInt(it.quantity, 10) || 1;
        const price = parseInt(it.price, 10) || 0;
        const lineTotal = BigInt(qty * price);
        totalQty += qty;
        totalAmt += lineTotal;
        return {
          stockOrderId: order.id,
          variantId: it.variantId,
          quantity: qty,
          unitPrice: price,
          lineTotal: lineTotal,
          notes: it.notes || (it.unit ? `ĐVT: ${it.unit}` : null)
        };
      });

      await (prisma as any).stockOrderItem.deleteMany({
        where: { stockOrderId: order.id }
      });
      if (lineItems.length > 0) {
        await (prisma as any).stockOrderItem.createMany({
          data: lineItems
        });
      }

      let baseNotes = notes !== undefined ? notes : (order.notes || '');
      if (!baseNotes.includes('[STATUS:')) {
        baseNotes = `[STATUS:DRAFT] ${baseNotes}`.trim();
      }

      const updated = await (prisma as any).stockOrder.update({
        where: { id: order.id },
        data: {
          sourceLocation: sourceLocation || order.sourceLocation,
          destinationLocation: destinationLocation || order.destinationLocation,
          sourceWarehouseId: sourceWarehouseId || order.sourceWarehouseId,
          destWarehouseId: destWarehouseId || order.destWarehouseId,
          reason: reason || order.reason,
          notes: baseNotes,
          totalQuantity: totalQty,
          totalAmount: totalAmt
        },
        include: { items: true }
      });

      res.json({
        ...updated,
        status: 'DRAFT',
        rawStatus: 'DRAFT',
        totalAmount: Number(updated.totalAmount || 0),
        items: (updated.items || []).map((it: any) => ({
          ...it,
          lineTotal: Number(it.lineTotal || 0)
        }))
      });
    } catch (error) {
      console.error('Error updating stock order:', error);
      res.status(500).json({ error: 'Không thể cập nhật phiếu' });
    }
  },

  // 4d. Xóa phiếu kho (Dành cho phiếu nháp Draft)
  deleteStockOrder: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const order = await (prisma as any).stockOrder.findFirst({
        where: { OR: [{ id }, { orderCode: id }] }
      });
      if (!order) {
        return res.status(404).json({ error: 'Không tìm thấy phiếu' });
      }
      await (prisma as any).stockOrderItem.deleteMany({
        where: { stockOrderId: order.id }
      });
      await (prisma as any).stockOrder.delete({
        where: { id: order.id }
      });
      res.json({ message: 'Xóa phiếu thành công' });
    } catch (error) {
      console.error('Error deleting stock order:', error);
      res.status(500).json({ error: 'Không thể xóa phiếu' });
    }
  },

  // 5. Lấy danh sách Phiếu kiểm kê (Tab 2)
  getStockAudits: async (req: Request, res: Response) => {
    try {
      const audits = await (prisma as any).stockAudit.findMany({
        include: {
          items: {
            include: {
              variant: {
                select: {
                  id: true,
                  sku: true,
                  name: true,
                  price: true,
                  product: {
                    select: { id: true, name: true, images: true, basePrice: true }
                  }
                }
              }
            }
          },
          warehouse: true,
          creator: { select: { fullName: true } }
        },
        orderBy: { createdAt: 'desc' }
      });
      res.json(audits);
    } catch (error) {
      console.error('Error fetching stock audits:', error);
      res.status(500).json({ error: 'Không thể lấy danh sách kiểm kê' });
    }
  },

  // 5b. Tạo Phiếu kiểm kê mới
  createStockAudit: async (req: Request, res: Response) => {
    try {
      const { 
        warehouseId, 
        location, 
        scope, 
        notes, 
        items, 
        status, 
        auditCode: clientAuditCode, 
        createdAt: clientCreatedAt 
      } = req.body;
      const now = new Date();
      const yearMonth = `${now.getFullYear().toString().slice(-2)}${(now.getMonth() + 1).toString().padStart(2, '0')}`;
      
      let auditCode = clientAuditCode;
      if (!auditCode) {
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        auditCode = `PKK-${yearMonth}-${randomNum}`;
      }

      // Đảm bảo không trùng auditCode
      let uniqueAuditCode = auditCode;
      let counter = 1;
      while (await (prisma as any).stockAudit.findUnique({ where: { auditCode: uniqueAuditCode } })) {
        uniqueAuditCode = `${auditCode}-${counter}`;
        counter++;
      }
      auditCode = uniqueAuditCode;

      let totalItemsCount = 0;
      let discrepancyCount = 0;

      const auditItems = (items || []).map((it: any) => {
        const systemStock = parseInt(it.systemStock, 10) || 0;
        const actualStock = it.actualStock !== null && it.actualStock !== undefined && it.actualStock !== '' 
          ? parseInt(it.actualStock, 10) 
          : null;
        let discrepancy = null;
        if (actualStock !== null) {
          discrepancy = actualStock - systemStock;
          if (discrepancy !== 0) {
            discrepancyCount++;
          }
        }
        totalItemsCount++;

        return {
          variantId: it.variantId,
          systemStock,
          actualStock,
          discrepancy,
          reason: it.reason || (discrepancy === 0 ? 'Khớp' : (discrepancy !== null ? (discrepancy > 0 ? 'Dư' : 'Thiếu') : null))
        };
      });

      const auditStatus = status || 'COMPLETED';

      const newAudit = await (prisma as any).stockAudit.create({
        data: {
          auditCode,
          location: location || 'Kho Tổng (TP.HCM)',
          warehouseId: warehouseId || null,
          scope: scope || 'Kiểm kê định kỳ',
          notes: notes || null,
          status: auditStatus,
          totalItemsCount,
          discrepancyCount,
          createdAt: clientCreatedAt ? new Date(clientCreatedAt) : now,
          completedAt: auditStatus === 'COMPLETED' ? new Date() : null,
          items: {
            create: auditItems
          }
        },
        include: {
          items: {
            include: {
              variant: {
                select: {
                  id: true,
                  sku: true,
                  name: true,
                  product: { select: { id: true, name: true } }
                }
              }
            }
          },
          warehouse: true
        }
      });

      // Nếu phiếu hoàn tất và có lệch, tạo bút toán StockTransaction và cân bằng tồn kho thực tế
      if (newAudit.status === 'COMPLETED') {
        for (const item of auditItems) {
          if (item.actualStock !== null && item.discrepancy && item.discrepancy !== 0) {
            // 1. Cân bằng tồn kho chung biến thể
            await prisma.productVariant.update({
              where: { id: item.variantId },
              data: { stock: { increment: item.discrepancy } }
            }).catch((e: any) => console.warn('Could not balance variant stock:', e));

            // 2. Cân bằng tồn kho tại chi nhánh cụ thể
            if (newAudit.warehouseId) {
              const whStock = await (prisma as any).warehouseStock.findFirst({
                where: { warehouseId: newAudit.warehouseId, variantId: item.variantId }
              });
              if (whStock) {
                await (prisma as any).warehouseStock.update({
                  where: { id: whStock.id },
                  data: { physicalStock: { increment: item.discrepancy } }
                }).catch((e: any) => console.warn('Could not update warehouse stock:', e));
              } else {
                await (prisma as any).warehouseStock.create({
                  data: {
                    warehouseId: newAudit.warehouseId,
                    variantId: item.variantId,
                    physicalStock: Math.max(0, item.actualStock),
                    reservedStock: 0
                  }
                }).catch((e: any) => console.warn('Could not create warehouse stock:', e));
              }
            }

            // 3. Ghi bút toán sổ cái biến động
            const txRandom = Math.floor(1000 + Math.random() * 9000);
            await (prisma as any).stockTransaction.create({
              data: {
                txCode: `TX-${yearMonth}-${txRandom}`,
                type: item.discrepancy > 0 ? 'AUDIT_INCREASE' : 'AUDIT_DECREASE',
                variantId: item.variantId,
                location: newAudit.location,
                warehouseId: newAudit.warehouseId,
                stockBefore: item.systemStock,
                quantityChange: item.discrepancy,
                stockAfter: item.actualStock,
                referenceCode: newAudit.auditCode,
                stockAuditId: newAudit.id,
                notes: `Cân bằng tồn kho từ phiếu kiểm kê ${newAudit.auditCode}: ${item.reason || ''}`
              }
            }).catch((e: any) => console.error('Failed to create audit transaction:', e));
          }
        }
      }

      clearInventoryCaches();
      res.status(201).json(newAudit);
    } catch (error) {
      console.error('Error creating stock audit:', error);
      res.status(500).json({ error: 'Không thể tạo phiếu kiểm kê' });
    }
  },

  // 5c. Cập nhật phiếu kiểm kê (lưu tiếp hoặc hoàn tất phiếu nháp)
  updateStockAudit: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { notes, items, status, scope } = req.body;
      const now = new Date();
      const yearMonth = `${now.getFullYear().toString().slice(-2)}${(now.getMonth() + 1).toString().padStart(2, '0')}`;

      const existingAudit = await (prisma as any).stockAudit.findUnique({
        where: { id },
        include: { items: true }
      });

      if (!existingAudit) {
        return res.status(404).json({ error: 'Không tìm thấy phiếu kiểm kê' });
      }

      let updateData: any = {
        scope: scope || existingAudit.scope,
        notes: notes !== undefined ? notes : existingAudit.notes,
        status: status || existingAudit.status,
        completedAt: status === 'COMPLETED' ? now : existingAudit.completedAt,
      };

      let auditItems: any[] = [];
      if (items !== undefined) {
        let totalItemsCount = 0;
        let discrepancyCount = 0;

        auditItems = (items || []).map((it: any) => {
          const systemStock = parseInt(it.systemStock, 10) || 0;
          const actualStock = it.actualStock !== null && it.actualStock !== undefined && it.actualStock !== '' 
            ? parseInt(it.actualStock, 10) 
            : null;
          let discrepancy = null;
          if (actualStock !== null) {
            discrepancy = actualStock - systemStock;
            if (discrepancy !== 0) {
              discrepancyCount++;
            }
          }
          totalItemsCount++;

          return {
            variantId: it.variantId,
            systemStock,
            actualStock,
            discrepancy,
            reason: it.reason || (discrepancy === 0 ? 'Khớp' : (discrepancy !== null ? (discrepancy > 0 ? 'Dư' : 'Thiếu') : null))
          };
        });

        // Xóa các items cũ và tạo lại items mới
        await (prisma as any).stockAuditItem.deleteMany({
          where: { auditId: id }
        });

        updateData.totalItemsCount = totalItemsCount;
        updateData.discrepancyCount = discrepancyCount;
        updateData.items = {
          create: auditItems
        };
      }

      const updatedAudit = await (prisma as any).stockAudit.update({
        where: { id },
        data: updateData,
        include: {
          items: {
            include: {
              variant: {
                select: {
                  id: true,
                  sku: true,
                  name: true,
                  product: { select: { id: true, name: true } }
                }
              }
            }
          },
          warehouse: true
        }
      });

      // Nếu chuyển sang COMPLETED, cân bằng kho
      if (updatedAudit.status === 'COMPLETED' && existingAudit.status !== 'COMPLETED') {
        for (const item of auditItems) {
          if (item.actualStock !== null && item.discrepancy && item.discrepancy !== 0) {
            await prisma.productVariant.update({
              where: { id: item.variantId },
              data: { stock: { increment: item.discrepancy } }
            }).catch((e: any) => console.warn('Could not balance variant stock:', e));

            if (updatedAudit.warehouseId) {
              const whStock = await (prisma as any).warehouseStock.findFirst({
                where: { warehouseId: updatedAudit.warehouseId, variantId: item.variantId }
              });
              if (whStock) {
                await (prisma as any).warehouseStock.update({
                  where: { id: whStock.id },
                  data: { physicalStock: { increment: item.discrepancy } }
                }).catch((e: any) => console.warn('Could not update warehouse stock:', e));
              } else {
                await (prisma as any).warehouseStock.create({
                  data: {
                    warehouseId: updatedAudit.warehouseId,
                    variantId: item.variantId,
                    physicalStock: Math.max(0, item.actualStock),
                    reservedStock: 0
                  }
                }).catch((e: any) => console.warn('Could not create warehouse stock:', e));
              }
            }

            const txRandom = Math.floor(1000 + Math.random() * 9000);
            await (prisma as any).stockTransaction.create({
              data: {
                txCode: `TX-${yearMonth}-${txRandom}`,
                type: item.discrepancy > 0 ? 'AUDIT_INCREASE' : 'AUDIT_DECREASE',
                variantId: item.variantId,
                location: updatedAudit.location,
                warehouseId: updatedAudit.warehouseId,
                stockBefore: item.systemStock,
                quantityChange: item.discrepancy,
                stockAfter: item.actualStock,
                referenceCode: updatedAudit.auditCode,
                stockAuditId: updatedAudit.id,
                notes: `Cân bằng tồn kho từ phiếu kiểm kê ${updatedAudit.auditCode}: ${item.reason || ''}`
              }
            }).catch((e: any) => console.error('Failed to create audit transaction:', e));
          }
        }
      }

      clearInventoryCaches();
      res.json(updatedAudit);
    } catch (error) {
      console.error('Error updating stock audit:', error);
      res.status(500).json({ error: 'Không thể cập nhật phiếu kiểm kê' });
    }
  },

  // 5d. Xóa phiếu kiểm kê (chỉ cho phiếu DRAFT/PENDING hoặc theo yêu cầu)
  deleteStockAudit: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const existingAudit = await (prisma as any).stockAudit.findUnique({
        where: { id }
      });
      if (!existingAudit) {
        return res.status(404).json({ error: 'Không tìm thấy phiếu kiểm kê' });
      }

      await (prisma as any).stockAuditItem.deleteMany({
        where: { auditId: id }
      });
      await (prisma as any).stockAudit.delete({
        where: { id }
      });

      clearInventoryCaches();
      res.json({ message: 'Đã xóa phiếu kiểm kê thành công' });
    } catch (error) {
      console.error('Error deleting stock audit:', error);
      res.status(500).json({ error: 'Không thể xóa phiếu kiểm kê' });
    }
  },

  // 6. Lấy Sổ cái lịch sử biến động (Tab 4)
  getStockTransactions: async (req: Request, res: Response) => {
    try {
      const transactions = await (prisma as any).stockTransaction.findMany({
        include: {
          variant: {
            select: {
              id: true,
              sku: true,
              name: true,
              product: { select: { id: true, name: true } }
            }
          },
          warehouse: true,
          actor: {
            select: {
              id: true,
              fullName: true,
              email: true
            }
          },
          stockOrder: {
            select: {
              id: true,
              orderCode: true,
              referenceCode: true,
              type: true,
              status: true,
              notes: true,
              creator: {
                select: {
                  id: true,
                  fullName: true
                }
              }
            }
          },
          stockAudit: {
            select: {
              id: true,
              auditCode: true,
              status: true,
              notes: true,
              creator: { select: { id: true, fullName: true } },
              auditor: { select: { id: true, fullName: true } }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      // Lấy danh sách orders và audits để fallback theo referenceCode nếu stockOrderId hoặc stockAuditId bị null
      const missingRefCodes = transactions
        .filter((t: any) => !t.stockOrder && !t.stockAudit && t.referenceCode)
        .map((t: any) => t.referenceCode);

      let refOrdersMap = new Map<string, any>();
      let refAuditsMap = new Map<string, any>();

      if (missingRefCodes.length > 0) {
        const refOrders = await (prisma as any).stockOrder.findMany({
          where: {
            OR: [
              { orderCode: { in: missingRefCodes } },
              { referenceCode: { in: missingRefCodes } }
            ]
          },
          select: {
            id: true,
            orderCode: true,
            referenceCode: true,
            type: true,
            status: true,
            notes: true,
            creator: { select: { fullName: true } }
          }
        }).catch(() => []);

        refOrders.forEach((o: any) => {
          if (o.orderCode) refOrdersMap.set(o.orderCode, o);
          if (o.referenceCode) refOrdersMap.set(o.referenceCode, o);
        });

        const refAudits = await (prisma as any).stockAudit.findMany({
          where: { auditCode: { in: missingRefCodes } },
          select: {
            id: true,
            auditCode: true,
            status: true,
            notes: true,
            creator: { select: { fullName: true } },
            auditor: { select: { fullName: true } }
          }
        }).catch(() => []);

        refAudits.forEach((a: any) => {
          if (a.auditCode) refAuditsMap.set(a.auditCode, a);
        });
      }

      const normalized = transactions.map((tx: any) => {
        let creator = tx.actor?.fullName || '';

        // 1. Kiểm tra từ stockOrder (trực tiếp hoặc qua referenceCode)
        const order = tx.stockOrder || refOrdersMap.get(tx.referenceCode);
        if (!creator && order) {
          creator = order.creator?.fullName || '';
          if (!creator && order.notes) {
            const m = order.notes.match(/\[Người lập:\s*([^\]]+)\]/);
            if (m) {
              creator = m[1].trim();
            } else {
              const logsMatch = order.notes.match(/\[ACTION_LOGS:([\s\S]*?)\]/);
              if (logsMatch) {
                try {
                  const logs = JSON.parse(logsMatch[1]);
                  if (Array.isArray(logs) && logs.length > 0 && logs[0].operator) {
                    creator = logs[0].operator;
                  }
                } catch {}
              }
            }
          }
        }

        // 2. Kiểm tra từ stockAudit (trực tiếp hoặc qua referenceCode)
        const audit = tx.stockAudit || refAuditsMap.get(tx.referenceCode);
        if (!creator && audit) {
          creator = audit.auditor?.fullName || audit.creator?.fullName || '';
        }

        // 3. Trích xuất từ tx.notes nếu có
        if (!creator && tx.notes) {
          const m = tx.notes.match(/\[Người lập:\s*([^\]]+)\]/);
          if (m) creator = m[1].trim();
        }

        // 4. Fallback theo thủ kho / quản lý của kho phát sinh giao dịch
        if (!creator && tx.warehouse?.managerName) {
          creator = tx.warehouse.managerName;
        }

        // 5. Mặc định quản trị viên nếu vẫn chưa có
        if (!creator) {
          creator = 'Admin Quản Trị';
        }

        // 6. Xác định Loại đơn và Trạng thái thay đổi tồn kho (Thực tế vs Khả dụng)
        let orderType: 'IMPORT' | 'EXPORT' | 'TRANSFER' | 'AUDIT' = 'EXPORT';
        let orderTypeLabel = 'Xuất kho';
        if (order) {
          if (order.type === 'IMPORT') {
            orderType = 'IMPORT';
            orderTypeLabel = 'Nhập kho';
          } else if (order.type === 'TRANSFER') {
            orderType = 'TRANSFER';
            orderTypeLabel = 'Chuyển kho';
          } else {
            orderType = 'EXPORT';
            orderTypeLabel = 'Xuất kho';
          }
        } else if (audit || tx.type.includes('AUDIT')) {
          orderType = 'AUDIT';
          orderTypeLabel = 'Kiểm kê';
        } else if (tx.type === 'IMPORT_RECEIPT' || tx.type === 'RETURN_RECEIPT') {
          orderType = 'IMPORT';
          orderTypeLabel = 'Nhập kho';
        } else if (tx.type.includes('TRANSFER')) {
          orderType = 'TRANSFER';
          orderTypeLabel = 'Chuyển kho';
        } else {
          orderType = 'EXPORT';
          orderTypeLabel = 'Xuất kho';
        }

        // Trạng thái phiếu làm thay đổi tồn kho
        let status = 'COMPLETED';
        let statusLabel = 'Đã xuất kho';
        let stockImpactType: 'Thực tế' | 'Khả dụng' = 'Thực tế';

        if (order) {
          const rawStatus = String(order.status || '').toUpperCase();
          if (rawStatus === 'PROCESSING' || rawStatus === 'PLANNED') {
            status = 'PLANNED';
            statusLabel = 'Lên kế hoạch';
            stockImpactType = 'Khả dụng';
          } else if (rawStatus === 'COMPLETED') {
            status = 'COMPLETED';
            statusLabel = orderType === 'IMPORT' ? 'Đã nhập kho' : (orderType === 'TRANSFER' ? 'Đã điều chuyển' : 'Đã xuất kho');
            stockImpactType = 'Thực tế';
          } else {
            status = rawStatus;
            statusLabel = orderType === 'IMPORT' ? 'Đã nhập kho' : 'Đã xuất kho';
            stockImpactType = 'Thực tế';
          }
        } else if (audit) {
          const rawAuditStatus = String(audit.status || '').toUpperCase();
          if (rawAuditStatus === 'COMPLETED') {
            status = 'COMPLETED';
            statusLabel = 'Đã cân bằng';
            stockImpactType = 'Thực tế';
          } else {
            status = rawAuditStatus;
            statusLabel = 'Đang kiểm kê';
            stockImpactType = 'Thực tế';
          }
        } else {
          if (tx.type === 'IMPORT_RECEIPT') {
            status = 'COMPLETED';
            statusLabel = 'Đã nhập kho';
            stockImpactType = 'Thực tế';
          } else if (tx.type === 'SALES_DISPATCH' || tx.type === 'DISPOSAL_DISPATCH') {
            status = 'COMPLETED';
            statusLabel = 'Đã xuất kho';
            stockImpactType = 'Thực tế';
          } else if (tx.type.includes('AUDIT')) {
            status = 'COMPLETED';
            statusLabel = 'Đã cân bằng';
            stockImpactType = 'Thực tế';
          } else {
            status = 'COMPLETED';
            statusLabel = 'Hoàn tất';
            stockImpactType = 'Thực tế';
          }
        }

        return {
          ...tx,
          orderType,
          orderTypeLabel,
          status,
          statusLabel,
          stockImpactType,
          creator,
          actor: tx.actor || { fullName: creator }
        };
      });

      res.json(normalized);
    } catch (error) {
      console.error('Error fetching stock transactions:', error);
      res.status(500).json({ error: 'Không thể lấy lịch sử biến động' });
    }
  },

  // 7. Chi tiết tồn kho của 1 sản phẩm
  getProductInventoryDetail: async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const product: any = await prisma.product.findUnique({
        where: { id },
        include: {
          category: true,
          variants: {
            include: {
              warehouseStocks: {
                include: {
                  warehouse: true
                }
              }
            }
          }
        }
      });

      if (!product) {
        return res.status(404).json({ error: 'Không tìm thấy sản phẩm' });
      }

      const variantIds = (product.variants || []).map((v: any) => v.id);
      const history = await (prisma as any).stockTransaction.findMany({
        where: {
          variantId: { in: variantIds }
        },
        include: {
          variant: true,
          warehouse: true
        },
        orderBy: { createdAt: 'desc' },
        take: 50
      });

      if (product && product.variants) {
        product.variants = product.variants.map((v: any) => {
          const resolved = resolveVariantNameAndImage(v, product);
          return {
            ...v,
            name: resolved.name,
            image: resolved.image
          };
        });
      }

      res.json({
        product,
        history
      });
    } catch (error) {
      console.error('Error fetching product inventory detail:', error);
      res.status(500).json({ error: 'Không thể lấy chi tiết tồn kho sản phẩm' });
    }
  }
};
