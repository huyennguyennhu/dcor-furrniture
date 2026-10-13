import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

let cachedWarehouses: any[] = [
  { id: '24114aab-767b-4877-b256-dc775fa88f66', code: 'KHO_TONG_HCM', name: 'Kho Tổng (TP.HCM)', type: 'CENTRAL_WAREHOUSE' },
  { id: '047e4fc0-036d-4392-9962-6f0313231cf1', code: 'KHO_HN', name: 'Kho Hà Nội', type: 'REGIONAL_WAREHOUSE' },
  { id: 'c3f1bec8-1e98-4808-9a97-4ed15d407a90', code: 'SR_Q1', name: 'Showroom Quận 1', type: 'SHOWROOM' },
  { id: 'eec08fe7-3c73-4e29-b124-4001e51eaed7', code: 'SR_THU_DUC', name: 'Showroom Thủ Đức', type: 'SHOWROOM' }
];

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

  // 1b. Lấy dữ liệu Tổng quan kho thực tế từ Supabase (có phân trang 10 sp/trang)
  getInventoryOverview: async (req: Request, res: Response) => {
    try {
      const warehouseId = req.query.warehouseId as string | undefined;
      const search = (req.query.search as string || '').trim();
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
          }

          const prodAvailable = Math.max(0, prodPhysical - prodReserved);
          const threshold = 15;
          if (prodAvailable <= 0) {
            outOfStockCount++;
          } else if (prodAvailable <= threshold) {
            lowStockCount++;
          } else {
            inStockCount++;
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
        isActive: true,
        ...(search ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { variants: { some: { sku: { contains: search, mode: 'insensitive' } } } }
          ]
        } : {})
      };

      const needWhStocksInList = Boolean(warehouseId && warehouseId !== 'all' && warehouseId !== 'Tất cả chi nhánh');

      // Đếm tổng số và phân trang chỉ lấy 10 sản phẩm
      const [totalItems, products] = await Promise.all([
        search ? prisma.product.count({ where: whereCondition }) : Promise.resolve(summary.totalProducts),
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

      const items = products.map((prod) => {
        let prodPhysical = 0;
        let prodReserved = 0;

        const variants = prod.variants.map((v) => {
          let vPhysical = v.stock || 0;
          let vReserved = v.reservedStock || 0;

          if (warehouseId && warehouseId !== 'all' && warehouseId !== 'Tất cả chi nhánh') {
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

          const vAvailable = Math.max(0, vPhysical - vReserved);
          prodPhysical += vPhysical;
          prodReserved += vReserved;

          return {
            id: v.id,
            sku: v.sku,
            name: v.name,
            price: v.price,
            physical: vPhysical,
            reserved: vReserved,
            available: vAvailable,
            threshold: 5
          };
        });

        const prodAvailable = Math.max(0, prodPhysical - prodReserved);
        const threshold = 15;
        let status = 'Tốt';
        if (prodAvailable <= 0) {
          status = 'Hết hàng';
        } else if (prodAvailable <= threshold) {
          status = 'Sắp hết';
        } else {
          status = 'Tốt';
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
          location: warehouseId && warehouseId !== 'all' ? warehouseId : 'Toàn hệ thống',
          physicalStock: prodPhysical,
          reservedStock: prodReserved,
          availableStock: prodAvailable,
          threshold,
          status,
          variants
        };
      });

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
  getProductsWithOptions: async (req: Request, res: Response) => {
    try {
      const products = await prisma.product.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          slug: true,
          basePrice: true,
          images: true,
          configOptions: true,
          category: {
            select: { id: true, name: true }
          },
          variants: {
            where: { isActive: true },
            select: {
              id: true,
              sku: true,
              name: true,
              price: true,
              stock: true,
              reservedStock: true
            },
            orderBy: { name: 'asc' }
          }
        },
        orderBy: { name: 'asc' }
      });
      res.json(products);
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

      // Format format BigInt to string/number for JSON response
      const formatted = orders.map((o: any) => ({
        ...o,
        totalAmount: Number(o.totalAmount || 0),
        items: (o.items || []).map((it: any) => ({
          ...it,
          lineTotal: Number(it.lineTotal || 0)
        }))
      }));

      res.json(formatted);
    } catch (error) {
      console.error('Error fetching stock orders:', error);
      res.status(500).json({ error: 'Không thể lấy danh sách lệnh kho' });
    }
  },

  // 4. Tạo Lệnh xuất - nhập kho mới
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
        items
      } = req.body;

      const prefix = type === 'IMPORT' ? 'NK' : (type === 'EXPORT' ? 'XK' : 'CK');
      const randomNum = Math.floor(100 + Math.random() * 900);
      const now = new Date();
      const yearMonth = `${now.getFullYear().toString().slice(-2)}${(now.getMonth() + 1).toString().padStart(2, '0')}`;
      const orderCode = `${prefix}-${yearMonth}-${randomNum}`;

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
          notes: it.notes || null
        };
      });

      const newOrder = await (prisma as any).stockOrder.create({
        data: {
          orderCode,
          type,
          status: 'PENDING',
          sourceLocation: sourceLocation || 'Kho Tổng (TP.HCM)',
          destinationLocation: destinationLocation || 'Khách hàng / Chi nhánh',
          sourceWarehouseId: sourceWarehouseId || null,
          destWarehouseId: destWarehouseId || null,
          referenceCode: referenceCode || null,
          reason: reason || 'Lập lệnh kho theo yêu cầu',
          notes: notes || null,
          totalQuantity: totalQty,
          totalAmount: totalAmt,
          items: {
            create: lineItems
          }
        },
        include: {
          items: true
        }
      });

      summaryCache.clear();
      res.status(201).json({
        ...newOrder,
        totalAmount: Number(newOrder.totalAmount)
      });
    } catch (error) {
      console.error('Error creating stock order:', error);
      res.status(500).json({ error: 'Không thể tạo lệnh kho' });
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
                  product: {
                    select: { id: true, name: true, images: true }
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
      const { warehouseId, location, scope, notes, items, status } = req.body;
      const now = new Date();
      const yearMonth = `${now.getFullYear().toString().slice(-2)}${(now.getMonth() + 1).toString().padStart(2, '0')}`;
      const randomNum = Math.floor(100 + Math.random() * 900);
      const auditCode = `ADT-${yearMonth}-${randomNum}`;

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

      const newAudit = await (prisma as any).stockAudit.create({
        data: {
          auditCode,
          location: location || 'Kho Tổng (TP.HCM)',
          warehouseId: warehouseId || null,
          scope: scope || 'ALL',
          notes: notes || null,
          status: status || 'COMPLETED',
          totalItemsCount,
          discrepancyCount,
          completedAt: status === 'COMPLETED' ? new Date() : null,
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

      // Nếu phiếu hoàn tất và có lệch, tạo bút toán StockTransaction
      if (newAudit.status === 'COMPLETED') {
        for (const item of auditItems) {
          if (item.actualStock !== null && item.discrepancy && item.discrepancy !== 0) {
            const txRandom = Math.floor(100 + Math.random() * 900);
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

      summaryCache.clear();
      res.status(201).json(newAudit);
    } catch (error) {
      console.error('Error creating stock audit:', error);
      res.status(500).json({ error: 'Không thể tạo phiếu kiểm kê' });
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
              product: { select: { name: true } }
            }
          },
          warehouse: true
        },
        orderBy: { createdAt: 'desc' }
      });
      res.json(transactions);
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
