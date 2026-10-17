import { Router } from 'express';
import { authController } from '../controllers/auth.controller';

const router = Router();

// Endpoint đăng nhập dành cho Admin
router.post('/admin/login', authController.adminLogin);

// Endpoint để tài khoản Admin mới được mời set lại pass (kích hoạt)
router.post('/admin/invite-accept', authController.acceptInvite);

// Endpoint quên mật khẩu Admin
router.post('/admin/forgot-password', authController.forgotPassword);

// ----------------------------------------
// CUSTOMER AUTH (KHÁCH HÀNG)
// ----------------------------------------
router.post('/customer/login', authController.customerLogin);
router.post('/customer/register', authController.customerRegister);
router.post('/customer/google', authController.customerGoogleLogin);

export default router;
