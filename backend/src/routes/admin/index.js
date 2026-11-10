const express = require('express');
const router = express.Router();
const { verifyToken, requireAdmin } = require('../../middleware/auth');
const adminController = require('../../controllers/admin.controller');
const upload = require('../../middleware/upload');

// Apply auth middleware to all admin routes
router.use(verifyToken, requireAdmin);

// Dashboard & Analytics
router.get('/dashboard/stats', adminController.getDashboardStats);
router.get('/analytics', adminController.getAnalyticsOverview);

// Products & Lifecycle
router.post('/products', upload.array('images', 5), adminController.createProduct);
router.put('/products/:id', upload.array('images', 5), adminController.updateProduct);
router.delete('/products/:id', adminController.deleteProduct);
router.post('/products/:id/duplicate', adminController.duplicateProduct);
router.post('/products/bulk', adminController.bulkUpdateProducts);
router.get('/products/export', adminController.exportProductsCSV);
router.post('/products/import', upload.single('file'), adminController.importProductsCSV);

// Dynamic Categories & Subcategories
router.get('/categories', adminController.getCategoriesAdmin);
router.post('/categories', upload.single('image'), adminController.createCategoryAdmin);
router.put('/categories/:id', upload.single('image'), adminController.updateCategoryAdmin);
router.delete('/categories/:id', adminController.deleteCategoryAdmin);

// Dynamic Size Groups & Sizes
router.get('/size-groups', adminController.getSizeGroups);
router.post('/size-groups', adminController.createSizeGroup);
router.post('/sizes', adminController.createSize);
router.delete('/sizes/:id', adminController.deleteSize);

// Dynamic Attributes & Options
router.get('/attributes', adminController.getAttributes);
router.post('/attributes', adminController.createAttribute);
router.post('/attributes/options', adminController.createAttributeOption);
router.delete('/attributes/options/:id', adminController.deleteAttributeOption);

// Inventory Management
router.get('/inventory', adminController.getInventory);
router.post('/inventory/adjust', adminController.adjustStockAdmin);
router.get('/inventory/movements', adminController.getStockMovements);

// Orders & Returns
router.get('/orders', adminController.getOrders);
router.put('/orders/:id/status', adminController.updateOrderStatus);
router.get('/returns', adminController.getOrderReturns);
router.put('/returns/:id/status', adminController.updateOrderReturnStatus);

// Coupons & Promotions
router.get('/coupons', adminController.getCoupons);
router.post('/coupons', adminController.createCoupon);
router.put('/coupons/:id', adminController.updateCoupon);
router.delete('/coupons/:id', adminController.deleteCoupon);

// Customers & Abandoned Carts
router.get('/customers', adminController.getCustomers);
router.get('/abandoned-carts', adminController.getAbandonedCarts);

// Store Settings & Audit Logs
router.get('/settings', adminController.getStoreSettings);
router.put('/settings', adminController.updateStoreSetting);
router.get('/audit-logs', adminController.getAuditLogs);

// Marquee tag management
router.get('/marquee', adminController.getMarqueeTags);
router.post('/marquee', adminController.addMarqueeTag);
router.delete('/marquee/:id', adminController.deleteMarqueeTag);

module.exports = router;
