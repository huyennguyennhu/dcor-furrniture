import { Router } from 'express';
import { authenticateJWT } from '../middleware/auth.middleware';
import { chatAdminController } from '../controllers/chat-admin.controller';

const router = Router();

// Bắt buộc xác thực nhân sự (Staff token hợp lệ và tài khoản ACTIVE) cho toàn bộ route admin
router.use(authenticateJWT);

// 1. Quản lý danh sách hội thoại
router.get('/conversations', chatAdminController.getConversations);
router.get('/conversations/:id', chatAdminController.getConversationDetail);
router.get('/conversations/:id/messages', chatAdminController.getConversationMessages);

// 2. Thao tác hội thoại (State machine & Handoff)
router.post('/conversations/:id/claim', chatAdminController.claimConversation);
router.post('/conversations/:id/transfer', chatAdminController.transferConversation);
router.post('/conversations/:id/return-to-bot', chatAdminController.returnToBot);
router.post('/conversations/:id/close', chatAdminController.closeConversation);
router.post('/conversations/:id/reopen', chatAdminController.reopenConversation);
router.put('/conversations/:id/note', chatAdminController.updateInternalNote);

// 3. Danh sách nhân sự có thể tiếp nhận hội thoại
router.get('/staff', chatAdminController.getAvailableStaff);

// 4. Quản lý Kịch bản Bot (Scripts)
router.get('/scripts', chatAdminController.getScripts);
router.post('/scripts', chatAdminController.createScript);
router.put('/scripts/:id', chatAdminController.updateScript);
router.delete('/scripts/:id', chatAdminController.deleteScript);
router.post('/scripts/test', chatAdminController.testScript);

// 5. Cấu hình Chat & Bot (Settings)
router.get('/settings', chatAdminController.getSettings);
router.put('/settings', chatAdminController.updateSettings);

export default router;

