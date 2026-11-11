import { Router } from 'express';
import { chatController } from '../controllers/chat.controller';

const router = Router();

// 1. Lời chào công khai và quick replies theo trạng thái đăng nhập (KHÔNG tạo hội thoại trong DB)
router.get('/greeting', chatController.getGreeting);

// 2. Lấy thông tin hội thoại hiện tại của khách
router.get('/conversations/me', chatController.getMeConversation);

// 3. Lấy danh sách tin nhắn của hội thoại (phân trang)
router.get('/conversations/:id/messages', chatController.getMessages);

// 4. Liên kết hội thoại guest vào customerId sau khi đăng nhập thành công
router.post('/conversations/claim', chatController.claimConversation);

// 5. Làm mới / Xóa lịch sử chat khỏi phía khách (ẩn khỏi khách, giữ lại cho admin)
router.delete('/conversations/:id', chatController.deleteConversation);

// 6. Khách hàng kết thúc cuộc trò chuyện
router.post('/conversations/:id/close', chatController.closeConversation);

export default router;
