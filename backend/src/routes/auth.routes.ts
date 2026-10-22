import { Router } from 'express';
import { authController } from '../controllers/auth.controller';

const router = Router();

// Endpoint đăng nhập dành cho Admin
router.post('/admin/login', authController.adminLogin);

// Endpoint để tài khoản Admin mới được mời set lại pass (kích hoạt)
router.post('/admin/invite-accept', authController.acceptInvite);

// Endpoint quên mật khẩu Admin
router.post('/admin/forgot-password', authController.forgotPassword);

// Endpoint kiểm tra tính hợp lệ của phiên Admin & thu hồi ngay nếu bị khóa
router.get('/admin/verify-session', authController.verifyAdminSession);

// ----------------------------------------
// CUSTOMER AUTH (KHÁCH HÀNG)
// ----------------------------------------
router.post('/customer/otp/send', authController.customerSendOtp);
router.post('/customer/register', authController.customerRegister);
router.post('/customer/login', authController.customerLogin);
router.post('/customer/forgot-password/verify-otp', authController.customerVerifyForgotOtp);
router.post('/customer/forgot-password/reset', authController.customerResetPassword);
router.post('/customer/google', authController.customerGoogleLogin);

// ----------------------------------------
// OTP XÁC THỰC SỐ ĐIỆN THOẠI (CỐ ĐỊNH 111111)
// ----------------------------------------
router.post('/send-otp', (req, res) => {
  res.json({ success: true, message: 'Mã xác thực OTP đã được gửi.', otp: '111111' });
});

router.post('/verify-otp', (req, res) => {
  const { otp } = req.body;
  if (otp && String(otp).trim() === '111111') {
    res.json({ success: true, verified: true, message: 'Xác thực OTP thành công.' });
  } else {
    res.status(400).json({ success: false, message: 'Mã OTP không chính xác. Vui lòng nhập mã 111111.' });
  }
});

export default router;
