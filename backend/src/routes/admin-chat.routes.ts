import { Router, Request, Response } from 'express';
import { authenticateJWT } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/iam.middleware';

const router = Router();

// In-memory chat sessions storage
let conversations: any[] = [
  {
    id: 'conv-101',
    customerName: 'Nguyễn Văn An',
    customerPhone: '0901234567',
    lastMessage: 'Tôi muốn tư vấn về mẫu sofa da Milano có sẵn tại Showroom Q1 không?',
    updatedAt: new Date().toISOString(),
    status: 'OPEN',
    unreadCount: 1,
    messages: [
      { sender: 'CUSTOMER', text: 'Chào shop, shop có mẫu sofa Milano trưng bày tại Quận 1 không ạ?', time: '10:15' }
    ]
  },
  {
    id: 'conv-102',
    customerName: 'Trần Thị Mai',
    customerPhone: '0912345678',
    lastMessage: 'Đơn hàng #DCOR-9823 đã giao chưa bạn?',
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
    status: 'RESOLVED',
    unreadCount: 0,
    messages: [
      { sender: 'CUSTOMER', text: 'Đơn hàng #DCOR-9823 đã giao chưa bạn?', time: '09:00' },
      { sender: 'STAFF', text: 'Dạ đơn hàng đang trên xe điều phối, dự kiến đến trong chiều nay ạ!', time: '09:05' }
    ]
  }
];

// Bảo vệ toàn bộ phân hệ Chat bằng JWT
router.use(authenticateJWT);

// 1. Danh sách hội thoại
router.get('/conversations', requirePermission('chat', 'view'), (req: Request, res: Response) => {
  res.json(conversations);
});

// 2. Chi tiết tin nhắn hội thoại
router.get('/conversations/:id', requirePermission('chat', 'view'), (req: Request, res: Response) => {
  const conv = conversations.find(c => c.id === req.params.id);
  if (!conv) {
    res.status(404).json({ message: 'Không tìm thấy cuộc hội thoại.' });
    return;
  }
  res.json(conv);
});

// 3. Phản hồi tin nhắn khách hàng (CSKH)
router.post('/conversations/:id/reply', requirePermission('chat', 'reply'), (req: Request, res: Response) => {
  const { text } = req.body;
  if (!text) {
    res.status(400).json({ message: 'Nội dung phản hồi không được để trống.' });
    return;
  }

  const conv = conversations.find(c => c.id === req.params.id);
  if (!conv) {
    res.status(404).json({ message: 'Không tìm thấy cuộc hội thoại.' });
    return;
  }

  const newMsg = {
    sender: 'STAFF',
    staffName: (req as any).user?.fullName || 'CSKH DCor',
    text: String(text).trim(),
    time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
  };

  conv.messages.push(newMsg);
  conv.lastMessage = newMsg.text;
  conv.updatedAt = new Date().toISOString();
  conv.unreadCount = 0;

  res.json({ success: true, message: 'Đã gửi phản hồi.', messageData: newMsg });
});

// 4. Đóng / hoàn tất cuộc hội thoại
router.patch('/conversations/:id/close', requirePermission('chat', 'close'), (req: Request, res: Response) => {
  const conv = conversations.find(c => c.id === req.params.id);
  if (!conv) {
    res.status(404).json({ message: 'Không tìm thấy cuộc hội thoại.' });
    return;
  }

  conv.status = 'CLOSED';
  conv.updatedAt = new Date().toISOString();
  res.json({ success: true, message: 'Đã đóng phiên hội thoại.' });
});

export default router;
