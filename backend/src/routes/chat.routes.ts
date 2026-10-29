import { Router } from 'express';
import { chatController } from '../controllers/chat.controller';

const router = Router();

// 1. Lấy thông tin hội thoại hiện tại của khách
router.get('/conversations/me', chatController.getMeConversation);

// 2. Lấy danh sách tin nhắn của hội thoại (phân trang)
router.get('/conversations/:id/messages', chatController.getMessages);

export default router;

