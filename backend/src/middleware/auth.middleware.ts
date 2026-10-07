import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dcor_super_secret_key_2026';

export interface AuthRequest extends Request {
  user?: any;
}

export const authenticateJWT = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];

    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) {
        res.status(403).json({ message: 'Token không hợp lệ hoặc đã hết hạn.' });
        return;
      }
      req.user = user;
      next();
    });
  } else {
    res.status(401).json({ message: 'Vui lòng đăng nhập để tiếp tục.' });
  }
};
