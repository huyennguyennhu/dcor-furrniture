import { Router } from 'express';
import { authController } from '../controllers/auth.controller';

const router = Router();

// Endpoint đăng nhập dành cho Admin
router.post('/admin/login', authController.adminLogin);

// Endpoint để tài khoản Admin mới được mời set lại pass (kích hoạt)
router.post('/admin/invite-accept', authController.acceptInvite);

// ----------------------------------------
// CUSTOMER AUTH (KHÁCH HÀNG)
// ----------------------------------------
router.post('/customer/otp/send', authController.customerSendOtp);
router.post('/customer/register', authController.customerRegister);
router.post('/customer/login', authController.customerLogin);
router.post('/customer/forgot-password/verify-otp', authController.customerVerifyForgotOtp);
router.post('/customer/forgot-password/reset', authController.customerResetPassword);
router.post('/customer/google', authController.customerGoogleLogin);

export default router;
