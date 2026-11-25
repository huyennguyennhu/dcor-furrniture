import { Router } from 'express';
import { customRequestController } from '../controllers/custom-request.controller';
import { authenticateJWT, optionalAuth } from '../middleware/auth.middleware';

const router = Router();

// ==========================================
// 1. Phân hệ Khách hàng (Store / Customer)
// ==========================================
// Tra cứu danh sách yêu cầu cá nhân (hỗ trợ JWT hoặc query phone/email)
router.get('/my-requests', optionalAuth, customRequestController.getMyCustomRequests);

// Khách hàng gửi form yêu cầu may đo từ website
router.post('/', optionalAuth, customRequestController.createCustomRequest);

// Khách hàng ký điện tử hợp đồng may đo kinh tế
router.put('/:id/sign-contract', optionalAuth, customRequestController.signContract);

// Khách hàng nộp ảnh hóa đơn / bill VietQR đặt cọc 30%
router.post('/:id/deposit-proof', optionalAuth, customRequestController.submitDepositProof);

// Khách hàng hoặc Admin hủy hồ sơ
router.put('/:id/cancel', optionalAuth, customRequestController.cancelCustomRequest);

// ==========================================
// 2. Phân hệ Quản trị (Admin / KTS)
// ==========================================
// Lấy toàn bộ danh sách hồ sơ may đo (hỗ trợ phân trang, lọc trạng thái, tìm kiếm)
router.get('/', optionalAuth, customRequestController.getAdminCustomRequests);

// Lấy chi tiết một hồ sơ theo ID hoặc mã CODE (dùng chung cho cả Admin & Khách)
router.get('/:idOrCode', optionalAuth, customRequestController.getCustomRequestDetail);

// Cập nhật tiến trình hồ sơ (Tiếp nhận, Báo giá 3D, Hợp đồng, QC, Bàn giao...)
router.put('/:id', optionalAuth, customRequestController.updateAdminCustomRequest);

export default router;
