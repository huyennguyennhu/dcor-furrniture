import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { getStaffMetadata } from '../lib/staff-metadata';

const JWT_SECRET = process.env.JWT_SECRET || 'dcor_super_secret_key_2026';

export interface AuthRequest extends Request {
  user?: any;
}

export const authenticateJWT = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;
  const guestPhone = req.headers['x-guest-phone'] as string;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];

    try {
      const user: any = jwt.verify(token, JWT_SECRET);

      // Nếu là tài khoản Admin/Staff, kiểm tra trạng thái hoạt động trong cơ sở dữ liệu
      if (user && user.email) {
        const staff = await prisma.staffUser.findUnique({
          where: { email: user.email.toLowerCase() },
          select: { id: true, status: true, deletedAt: true }
        });

        if (staff) {
          if (staff.deletedAt !== null) {
            res.status(403).json({
              active: false,
              code: 'ACCOUNT_DELETED',
              message: 'Tài khoản nhân sự đã bị xóa khỏi hệ thống.'
            });
            return;
          }

          if (staff.status !== 'ACTIVE') {
            res.status(403).json({
              active: false,
              code: 'ACCOUNT_LOCKED',
              message: 'Tài khoản của bạn đã bị tạm khóa. Vui lòng liên hệ quản trị viên.'
            });
            return;
          }

          // Cập nhật roles mới nhất từ Metadata để các thay đổi phân quyền IAM có hiệu lực tức thì
          const metadata = getStaffMetadata(user.email);
          if (metadata && Array.isArray(metadata.roles) && metadata.roles.length > 0) {
            user.roles = metadata.roles;
            user.role = metadata.role || metadata.roles[0];
          }
        }
      }

      req.user = user;
      next();
    } catch (err) {
      if (guestPhone) {
        req.user = { phone: guestPhone.trim(), isGuest: true };
        return next();
      }
      res.status(403).json({ message: 'Token không hợp lệ hoặc đã hết hạn.' });
      return;
    }
  } else if (guestPhone) {
    req.user = { phone: guestPhone.trim(), isGuest: true };
    next();
  } else {
    res.status(401).json({ message: 'Vui lòng đăng nhập để tiếp tục.' });
  }
};

export const optionalAuth = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  const guestPhone = req.headers['x-guest-phone'] as string;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (!err && user) {
        req.user = user;
      } else if (guestPhone) {
        req.user = { phone: guestPhone.trim(), isGuest: true };
      }
      next();
    });
  } else if (guestPhone) {
    req.user = { phone: guestPhone.trim(), isGuest: true };
    next();
  } else {
    next();
  }
};
