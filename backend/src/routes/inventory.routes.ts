import { Router } from 'express';
import { inventoryController } from '../controllers/inventory.controller';
import { inventorySettingsController } from '../controllers/inventory-settings.controller';

const router = Router();

// ==========================================
// CÀI ĐẶT TỒN KHO & DANH MỤC (5 TABS)
// ==========================================
// Tab 1: Điểm kho & Chi nhánh
router.get('/settings/warehouses', inventorySettingsController.getWarehouses);
router.post('/settings/warehouses', inventorySettingsController.createWarehouse);
router.put('/settings/warehouses/:id', inventorySettingsController.updateWarehouse);
router.patch('/settings/warehouses/:id/toggle', inventorySettingsController.toggleWarehouseActive);
router.delete('/settings/warehouses/:id', inventorySettingsController.deleteWarehouse);

// Tab 2, 3, 4: Danh mục Lý do Xuất / Nhập / Kiểm kê
router.get('/settings/reasons', inventorySettingsController.getReasons);
router.post('/settings/reasons', inventorySettingsController.createReason);
router.put('/settings/reasons/:id', inventorySettingsController.updateReason);
router.patch('/settings/reasons/:id/toggle', inventorySettingsController.toggleReasonActive);
router.delete('/settings/reasons/:id', inventorySettingsController.deleteReason);

// Tab 5: Phần trăm VAT
router.get('/settings/tax-rates', inventorySettingsController.getTaxRates);
router.post('/settings/tax-rates', inventorySettingsController.createTaxRate);
router.put('/settings/tax-rates/:id', inventorySettingsController.updateTaxRate);
router.patch('/settings/tax-rates/:id/toggle', inventorySettingsController.toggleTaxRateActive);
router.patch('/settings/tax-rates/:id/default', inventorySettingsController.setDefaultTaxRate);
router.delete('/settings/tax-rates/:id', inventorySettingsController.deleteTaxRate);

// Cấu hình quy tắc chung
router.post('/settings/general', inventorySettingsController.saveGeneralSettings);

// ==========================================
// CÁC ENDPOINTS KHO HIỆN CÓ
// ==========================================
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
router.get('/reasons', inventoryController.getInventoryReasons);
router.post('/reasons', inventoryController.saveInventoryReason);
router.post('/orders', inventoryController.createStockOrder);
router.put('/orders/:id/status', inventoryController.updateStockOrderStatus);
router.put('/orders/:id', inventoryController.updateStockOrder);
router.delete('/orders/:id', inventoryController.deleteStockOrder);

// Stock Audits (Tab 2)
router.get('/audits', inventoryController.getStockAudits);
router.post('/audits', inventoryController.createStockAudit);
router.put('/audits/:id', inventoryController.updateStockAudit);
router.delete('/audits/:id', inventoryController.deleteStockAudit);

// Stock History Ledger (Tab 4)
router.get('/history', inventoryController.getStockTransactions);

export default router;

