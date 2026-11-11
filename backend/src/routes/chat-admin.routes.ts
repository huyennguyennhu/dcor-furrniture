import { Router, Response, NextFunction } from 'express';
import { authenticateJWT, AuthRequest } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/iam.middleware';
import { chatAdminController } from '../controllers/chat-admin.controller';

const router = Router();

// Bắt buộc xác thực JWT cho toàn bộ route admin chatbox
router.use(authenticateJWT);

// Từ chối tuyệt đối token của khách hàng (CUSTOMER) truy cập API quản trị chatbox (HTTP 403)
router.use((req: AuthRequest, res: Response, next: NextFunction): void => {
  const user = req.user;
  if (!user || user.type === 'CUSTOMER' || (user.type && user.type !== 'STAFF') || !user.email) {
    res.status(403).json({
      code: 'PERMISSION_DENIED',
      module: 'chat',
      message: 'Tài khoản khách hàng không có quyền truy cập khu vực quản trị chat.'
    });
    return;
  }
  next();
});

// 1. Thống kê tổng quan hội thoại (Summary: {total, waiting, mine, unread, resolved})
router.get('/summary', requirePermission('chat', 'view'), chatAdminController.getSummary);

// 2. Quản lý danh sách hội thoại (Nhóm đọc: 'view')
router.get('/conversations', requirePermission('chat', 'view'), chatAdminController.getConversations);
router.get('/conversations/:id', requirePermission('chat', 'view'), chatAdminController.getConversationDetail);
router.get('/conversations/:id/messages', requirePermission('chat', 'view'), chatAdminController.getConversationMessages);

// 3. Thao tác hội thoại (State machine & Handoff) (Nhóm ghi: 'edit')
router.post('/conversations/:id/claim', requirePermission('chat', 'edit'), chatAdminController.claimConversation);
router.post('/conversations/:id/return-to-bot', requirePermission('chat', 'edit'), chatAdminController.returnToBot);
router.post('/conversations/:id/close', requirePermission('chat', 'edit'), chatAdminController.closeConversation);
router.post('/conversations/:id/reopen', requirePermission('chat', 'edit'), chatAdminController.reopenConversation);
router.put('/conversations/:id/note', requirePermission('chat', 'edit'), chatAdminController.updateInternalNote);

// 4. Quản lý Kịch bản Bot (Scripts: Nhóm đọc 'view', Nhóm ghi 'edit')
router.get('/scripts', requirePermission('chat', 'view'), chatAdminController.getScripts);
router.post('/scripts', requirePermission('chat', 'edit'), chatAdminController.createScript);
router.put('/scripts/:id', requirePermission('chat', 'edit'), chatAdminController.updateScript);
router.delete('/scripts/:id', requirePermission('chat', 'edit'), chatAdminController.deleteScript);
router.post('/scripts/test', requirePermission('chat', 'edit'), chatAdminController.testScript);

// 5. Cấu hình Chat & Bot (Settings: Nhóm đọc 'view', Nhóm ghi 'edit')
router.get('/settings', requirePermission('chat', 'view'), chatAdminController.getSettings);
router.put('/settings', requirePermission('chat', 'edit'), chatAdminController.updateSettings);

export default router;
