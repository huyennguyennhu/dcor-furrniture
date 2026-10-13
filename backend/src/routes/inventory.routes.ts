import { Router } from 'express';
import { inventoryController } from '../controllers/inventory.controller';

const router = Router();

// Warehouses & Branches
router.get('/warehouses', inventoryController.getWarehouses);

// Products with real variants for Form selection
router.get('/products-options', inventoryController.getProductsWithOptions);

// Stock Orders (Tab 3)
router.get('/orders', inventoryController.getStockOrders);
router.post('/orders', inventoryController.createStockOrder);

// Stock Audits (Tab 2)
router.get('/audits', inventoryController.getStockAudits);

// Stock History Ledger (Tab 4)
router.get('/history', inventoryController.getStockTransactions);

export default router;
