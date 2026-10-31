import { Router } from 'express';
import { chatController } from '../controllers/chat.controller';

const router = Router();

// 1. Lấy thông tin hội thoại hiện tại của khách
router.get('/conversations/me', chatController.getMeConversation);

// 2. Lấy danh sách tin nhắn của hội thoại (phân trang)
router.get('/conversations/:id/messages', chatController.getMessages);

// 3. Khách hàng kết thúc cuộc trò chuyện
router.post('/conversations/:id/close', chatController.closeConversation);

export default router;
