const express = require('express');
const router = express.Router();
const { verifyToken, requireAdmin } = require('../../middleware/auth');
const adminController = require('../../controllers/admin.controller');
const upload = require('../../middleware/upload');
const validate = require('../../middleware/validate');
const { productSchema } = require('../../schemas/product.schema');

// Apply auth middleware to all admin routes
router.use(verifyToken, requireAdmin);

router.get('/dashboard/stats', adminController.getDashboardStats);

router.get('/orders', adminController.getOrders);
router.put('/orders/:id/status', adminController.updateOrderStatus);

router.post('/products', upload.array('images', 5), adminController.createProduct);
router.put('/products/:id', upload.array('images', 5), adminController.updateProduct);
router.delete('/products/:id', adminController.deleteProduct);

module.exports = router;
