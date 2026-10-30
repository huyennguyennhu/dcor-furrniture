import { Router } from 'express';
import { inventoryController } from '../controllers/inventory.controller';
import { inventorySettingsController } from '../controllers/inventory-settings.controller';
import { authenticateJWT } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/iam.middleware';

const router = Router();

// Toàn bộ các API Quản lý kho yêu cầu xác thực phiên đăng nhập hợp lệ
router.use(authenticateJWT);

// ==========================================
// CÀI ĐẶT TỒN KHO & DANH MỤC (5 TABS)
// ==========================================
// Tab 1: Điểm kho & Chi nhánh
router.get('/settings/warehouses', requirePermission('inventory', 'view'), inventorySettingsController.getWarehouses);
router.post('/settings/warehouses', requirePermission('inventory', 'settings'), inventorySettingsController.createWarehouse);
router.put('/settings/warehouses/:id', requirePermission('inventory', 'settings'), inventorySettingsController.updateWarehouse);
router.patch('/settings/warehouses/:id/toggle', requirePermission('inventory', 'settings'), inventorySettingsController.toggleWarehouseActive);
router.delete('/settings/warehouses/:id', requirePermission('inventory', 'settings'), inventorySettingsController.deleteWarehouse);

// Tab 2, 3, 4: Danh mục Lý do Xuất / Nhập / Kiểm kê
router.get('/settings/reasons', requirePermission('inventory', 'view'), inventorySettingsController.getReasons);
router.post('/settings/reasons', requirePermission('inventory', 'settings'), inventorySettingsController.createReason);
router.put('/settings/reasons/:id', requirePermission('inventory', 'settings'), inventorySettingsController.updateReason);
router.patch('/settings/reasons/:id/toggle', requirePermission('inventory', 'settings'), inventorySettingsController.toggleReasonActive);
router.delete('/settings/reasons/:id', requirePermission('inventory', 'settings'), inventorySettingsController.deleteReason);

// Tab 5: Phần trăm VAT
router.get('/settings/tax-rates', requirePermission('inventory', 'view'), inventorySettingsController.getTaxRates);
router.post('/settings/tax-rates', requirePermission('inventory', 'settings'), inventorySettingsController.createTaxRate);
router.put('/settings/tax-rates/:id', requirePermission('inventory', 'settings'), inventorySettingsController.updateTaxRate);
router.patch('/settings/tax-rates/:id/toggle', requirePermission('inventory', 'settings'), inventorySettingsController.toggleTaxRateActive);
router.patch('/settings/tax-rates/:id/default', requirePermission('inventory', 'settings'), inventorySettingsController.setDefaultTaxRate);
router.delete('/settings/tax-rates/:id', requirePermission('inventory', 'settings'), inventorySettingsController.deleteTaxRate);

// Cấu hình quy tắc chung
router.post('/settings/general', requirePermission('inventory', 'settings'), inventorySettingsController.saveGeneralSettings);

// ==========================================
// CÁC ENDPOINTS KHO HIỆN CÓ
// ==========================================
// Warehouses & Branches
router.get('/warehouses', requirePermission('inventory', 'view'), inventoryController.getWarehouses);

// Categories (Cấp 1 & Cấp 2)
router.get('/categories', requirePermission('inventory', 'view'), inventoryController.getCategories);

// Inventory Overview (Tab 1: Tổng quan kho)
router.get('/overview', requirePermission('inventory', 'view'), inventoryController.getInventoryOverview);

// Products with real variants for Form selection
router.get('/products-options', requirePermission('inventory', 'view'), inventoryController.getProductsWithOptions);
router.get('/product/:id', requirePermission('inventory', 'view'), inventoryController.getProductInventoryDetail);

// Stock Orders (Tab 3: Nhập / Xuất kho)
router.get('/orders', requirePermission('inventory', 'view'), inventoryController.getStockOrders);
router.get('/reasons', requirePermission('inventory', 'view'), inventoryController.getInventoryReasons);
router.post('/reasons', requirePermission('inventory', 'settings'), inventoryController.saveInventoryReason);
router.post('/orders', requirePermission('inventory', 'create'), inventoryController.createStockOrder);
router.put('/orders/:id/status', requirePermission('inventory', 'approve'), inventoryController.updateStockOrderStatus);
router.put('/orders/:id', requirePermission('inventory', 'create'), inventoryController.updateStockOrder);
router.delete('/orders/:id', requirePermission('inventory', 'delete'), inventoryController.deleteStockOrder);

// Stock Audits (Tab 2: Kiểm kê kho)
router.get('/audits', requirePermission('inventory', 'view'), inventoryController.getStockAudits);
router.post('/audits', requirePermission('inventory', 'audit'), inventoryController.createStockAudit);
router.put('/audits/:id', requirePermission('inventory', 'audit'), inventoryController.updateStockAudit);
router.delete('/audits/:id', requirePermission('inventory', 'delete'), inventoryController.deleteStockAudit);

// Stock History Ledger (Tab 4: Sổ nhật ký kho)
router.get('/history', requirePermission('inventory', 'transactions'), inventoryController.getStockTransactions);

export default router;

