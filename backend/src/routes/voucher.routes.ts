import { Router } from 'express';
import { voucherController } from '../controllers/voucher.controller';

const router = Router();

// Storefront & Verification
router.post('/verify', voucherController.verifyVoucher);

// Admin CRUD
router.get('/', voucherController.getVouchers);
router.post('/', voucherController.createVoucher);
router.put('/:id', voucherController.updateVoucher);
router.delete('/:id', voucherController.deleteVoucher);

export default router;
