const express = require('express');
const router = express.Router();
const ordersController = require('../controllers/orders.controller');
const { verifyToken } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createOrderSchema, verifyPaymentSchema } = require('../schemas/order.schema');

router.post('/create-razorpay-order', verifyToken, validate(createOrderSchema), ordersController.createRazorpayOrder);
router.post('/verify-payment', verifyToken, validate(verifyPaymentSchema), ordersController.verifyPayment);
router.get('/', verifyToken, ordersController.getUserOrders);
router.get('/track', ordersController.trackOrder);
router.get('/:id', verifyToken, ordersController.getOrderById);

module.exports = router;
