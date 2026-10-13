import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

let cachedWarehouses: any[] = [
  { id: '24114aab-767b-4877-b256-dc775fa88f66', code: 'KHO_TONG_HCM', name: 'Kho Tổng (TP.HCM)', type: 'CENTRAL_WAREHOUSE' },
  { id: '047e4fc0-036d-4392-9962-6f0313231cf1', code: 'KHO_HN', name: 'Kho Hà Nội', type: 'REGIONAL_WAREHOUSE' },
  { id: 'c3f1bec8-1e98-4808-9a97-4ed15d407a90', code: 'SR_Q1', name: 'Showroom Quận 1', type: 'SHOWROOM' },
  { id: 'eec08fe7-3c73-4e29-b124-4001e51eaed7', code: 'SR_THU_DUC', name: 'Showroom Thủ Đức', type: 'SHOWROOM' }
];

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
                select: { id: true, sku: true, name: true }
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
  }
};
