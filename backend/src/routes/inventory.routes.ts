import { Router } from 'express';
import { inventoryController } from '../controllers/inventory.controller';

const router = Router();

// Warehouses & Branches
router.get('/warehouses', inventoryController.getWarehouses);

// Categories (Cấp 1 & Cấp 2)
router.get('/categories', inventoryController.getCategories);

// Inventory Overview (Tab 1: Tổng quan kho)
router.get('/overview', inventoryController.getInventoryOverview);

// Products with real variants for Form selection
router.get('/products-options', inventoryController.getProductsWithOptions);
router.get('/product/:id', inventoryController.getProductInventoryDetail);

// Stock Orders (Tab 3)
router.get('/orders', inventoryController.getStockOrders);
router.post('/orders', inventoryController.createStockOrder);

// Stock Audits (Tab 2)
router.get('/audits', inventoryController.getStockAudits);
router.post('/audits', inventoryController.createStockAudit);

// Stock History Ledger (Tab 4)
router.get('/history', inventoryController.getStockTransactions);

export default router;
