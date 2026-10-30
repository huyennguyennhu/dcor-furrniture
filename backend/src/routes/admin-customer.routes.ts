import { Router, Request, Response } from 'express';
import prisma, { withDbRetry } from '../lib/prisma';
import { authenticateJWT, AuthRequest } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/iam.middleware';

const router = Router();

// Yêu cầu xác thực JWT cho toàn bộ thao tác quản lý khách hàng
router.use(authenticateJWT);

// 1. Lấy danh sách khách hàng
router.get('/', requirePermission('customers', 'view'), async (req: Request, res: Response) => {
  try {
    const customers = await withDbRetry(() =>
      prisma.customer.findMany({
        where: { deletedAt: null },
        include: {
          _count: {
            select: { orders: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      })
    );

    const formatted = customers.map(c => ({
      id: c.id,
      fullName: c.fullName,
      phone: c.phone,
      email: c.email || '',
      type: c.type,
      companyName: c.companyName || '',
      totalSpent: c.totalSpent ? c.totalSpent.toString() : '0',
      rewardPoints: c.rewardPoints || 0,
      orderCount: c._count?.orders || 0,
      isLocked: !!c.lockedUntil && c.lockedUntil > new Date(),
      createdAt: c.createdAt.toISOString()
    }));

    res.json(formatted);
  } catch (error) {
    console.error('[Admin Customer] Lỗi lấy danh sách khách hàng:', error);
    res.status(500).json({ message: 'Không thể tải danh sách khách hàng từ cơ sở dữ liệu.' });
  }
});

// 2. Chi tiết khách hàng
router.get('/:id', requirePermission('customers', 'view'), async (req: Request, res: Response) => {
  try {
    const customer = await withDbRetry(() =>
      prisma.customer.findUnique({
        where: { id: req.params.id as string },
        include: {
          addresses: true,
          orders: {
            take: 10,
            orderBy: { createdAt: 'desc' }
          }
        }
      })
    );

    if (!customer || customer.deletedAt !== null) {
      res.status(404).json({ message: 'Khách hàng không tồn tại hoặc đã bị xóa.' });
      return;
    }

    res.json({
      ...customer,
      totalSpent: customer.totalSpent ? customer.totalSpent.toString() : '0'
    });
  } catch (error) {
    console.error('[Admin Customer] Lỗi xem chi tiết khách hàng:', error);
    res.status(500).json({ message: 'Lỗi tải thông tin khách hàng.' });
  }
});

// 3. Cập nhật thông tin khách hàng
router.put('/:id', requirePermission('customers', 'edit'), async (req: Request, res: Response) => {
  try {
    const { fullName, email, companyName, taxCode } = req.body;
    const updated = await withDbRetry(() =>
      prisma.customer.update({
        where: { id: req.params.id as string },
        data: {
          fullName: fullName ? String(fullName).trim() : undefined,
          email: email ? String(email).trim().toLowerCase() : undefined,
          companyName: companyName ? String(companyName).trim() : undefined,
          taxCode: taxCode ? String(taxCode).trim() : undefined
        }
      })
    );

    res.json({
      message: 'Cập nhật thông tin khách hàng thành công.',
      customer: {
        ...updated,
        totalSpent: updated.totalSpent ? updated.totalSpent.toString() : '0'
      }
    });
  } catch (error) {
    console.error('[Admin Customer] Lỗi cập nhật khách hàng:', error);
    res.status(500).json({ message: 'Lỗi cập nhật thông tin khách hàng.' });
  }
});

// 4. Khóa / Mở khóa tài khoản khách hàng
router.patch('/:id/lock', requirePermission('customers', 'lock_account'), async (req: Request, res: Response) => {
  try {
    const { lock, reason } = req.body;
    const lockedUntil = lock ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) : null;

    const updated = await withDbRetry(() =>
      prisma.customer.update({
        where: { id: req.params.id as string },
        data: {
          lockedUntil,
          failedLoginCount: lock ? 5 : 0
        }
      })
    );

    res.json({
      message: lock ? 'Đã khóa tài khoản khách hàng.' : 'Đã mở khóa tài khoản khách hàng.',
      isLocked: !!lockedUntil,
      reason
    });
  } catch (error) {
    console.error('[Admin Customer] Lỗi khóa/mở khóa tài khoản:', error);
    res.status(500).json({ message: 'Không thể thay đổi trạng thái tài khoản khách hàng.' });
  }
});

export default router;
