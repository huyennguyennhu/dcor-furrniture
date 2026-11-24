import { Router, Request, Response } from 'express';
import prisma, { withDbRetry } from '../lib/prisma';
import { calculateMemberTier } from '../lib/member-tier';
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
          },
          orders: {
            take: 1,
            orderBy: { createdAt: 'desc' },
            select: { createdAt: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      })
    );

    const formatted = customers.map(c => {
      const tierInfo = calculateMemberTier(c.totalSpent);
      const isB2B = c.type === 'B2B' || (!!c.companyName && c.companyName.trim() !== '');
      return {
        id: c.id,
        fullName: c.fullName,
        phone: c.phone,
        email: c.email || '',
        type: c.type,
        companyName: c.companyName || '',
        membership: isB2B ? 'B2B Partner' : tierInfo.tier,
        memberTier: tierInfo.tier,
        memberBadge: tierInfo.badge,
        totalSpent: c.totalSpent ? c.totalSpent.toString() : '0',
        rewardPoints: c.rewardPoints || 0,
        orderCount: c._count?.orders || 0,
        lastPurchaseAt: c.orders?.[0]?.createdAt ? c.orders[0].createdAt.toISOString() : null,
        isLocked: !!c.lockedUntil && c.lockedUntil > new Date(),
        createdAt: c.createdAt.toISOString()
      };
    });

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
          addresses: {
            orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }]
          },
          orders: {
            take: 20,
            orderBy: { createdAt: 'desc' },
            include: { items: { select: { id: true } } }
          }
        }
      })
    );

    if (!customer || customer.deletedAt !== null) {
      res.status(404).json({ message: 'Khách hàng không tồn tại hoặc đã bị xóa.' });
      return;
    }

    const spent = Number(customer.totalSpent || 0);
    const isLocked = !!customer.lockedUntil && customer.lockedUntil > new Date();
    const tierInfo = calculateMemberTier(spent);
    const tier = { label: tierInfo.tier, badge: tierInfo.badge };

    res.json({
      id: customer.id,
      name: customer.fullName,
      fullName: customer.fullName,
      phone: customer.phone && !customer.phone.startsWith('GOOG_') ? customer.phone : '',
      email: customer.email || '',
      avatarUrl: customer.avatarUrl,
      type: customer.type === 'B2B' ? 'B2B' : 'Cá nhân',
      membership: customer.type === 'B2B' ? 'B2B Partner' : tier.label,
      memberBadge: tier.badge,
      companyName: customer.companyName,
      taxCode: customer.taxCode,
      rewardPoints: customer.rewardPoints || 0,
      totalSpent: spent,
      isLocked,
      status: isLocked ? 'Khóa' : 'Hoạt động',
      createdAt: customer.createdAt.toISOString().split('T')[0],
      ordersCount: customer.orders.length,
      addresses: customer.addresses,
      orders: customer.orders.map(o => ({
        id: o.orderNumber,
        orderNumber: o.orderNumber,
        totalAmount: Number(o.totalAmount || 0),
        status: o.status,
        paymentStatus: o.paymentStatus,
        createdAt: o.createdAt.toISOString().replace('T', ' ').substring(0, 16),
        itemsCount: o.items.length
      }))
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
      status: lockedUntil ? 'Khóa' : 'Hoạt động',
      reason
    });
  } catch (error) {
    console.error('[Admin Customer] Lỗi khóa/mở khóa tài khoản:', error);
    res.status(500).json({ message: 'Không thể thay đổi trạng thái tài khoản khách hàng.' });
  }
});

// 5. Alias PUT /:id/status tương thích với trang chi tiết khách hàng
router.put('/:id/status', requirePermission('customers', 'lock_account'), async (req: Request, res: Response) => {
  try {
    const { status, lock } = req.body;
    const willLock = typeof lock === 'boolean' ? lock : status === 'Khóa';
    const lockedUntil = willLock ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) : null;

    await withDbRetry(() =>
      prisma.customer.update({
        where: { id: req.params.id as string },
        data: {
          lockedUntil,
          failedLoginCount: willLock ? 5 : 0
        }
      })
    );

    res.json({
      message: willLock ? 'Đã khóa tài khoản khách hàng.' : 'Đã mở khóa tài khoản khách hàng.',
      isLocked: !!lockedUntil,
      status: lockedUntil ? 'Khóa' : 'Hoạt động'
    });
  } catch (error) {
    console.error('[Admin Customer] Lỗi cập nhật trạng thái tài khoản:', error);
    res.status(500).json({ message: 'Không thể cập nhật trạng thái tài khoản khách hàng.' });
  }
});

export default router;
