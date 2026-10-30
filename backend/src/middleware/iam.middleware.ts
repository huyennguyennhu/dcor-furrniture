import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import { iamService, AdminModule, PermissionActions } from '../lib/iam.service';

/**
 * Middleware kiểm tra quyền IAM tại Server
 * @param module Tên phân hệ nghiệp vụ (products, categories, orders, inventory, staff, ...)
 * @param action Hành động nghiệp vụ ('view' | 'create' | 'edit' | 'delete' | 'approve')
 */
export const requirePermission = (
  module: AdminModule | string,
  action: keyof PermissionActions = 'view'
) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    const user = req.user;

    if (!user) {
      res.status(401).json({
        code: 'UNAUTHORIZED',
        message: 'Yêu cầu đăng nhập để truy cập tài nguyên này.'
      });
      return;
    }

    const hasAccess = iamService.hasPermission(user, module as AdminModule, action);

    if (!hasAccess) {
      const actionLabels: Record<keyof PermissionActions, string> = {
        view: 'Xem',
        create: 'Thêm mới',
        edit: 'Chỉnh sửa',
        delete: 'Xóa',
        approve: 'Phê duyệt'
      };

      const actionText = actionLabels[action] || action;
      res.status(403).json({
        code: 'PERMISSION_DENIED',
        module,
        action,
        message: `Bạn không có quyền "${actionText}" trên phân hệ "${module}". Vui lòng liên hệ Quản trị viên hệ thống để được cấp quyền.`
      });
      return;
    }

    next();
  };
};
