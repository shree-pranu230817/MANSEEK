const express = require('express');
const router = express.Router();
const reviewsController = require('../controllers/reviews.controller');
const { verifyToken, requireAdmin } = require('../middleware/auth');

router.get('/', reviewsController.getProductReviews);
router.post('/', verifyToken, reviewsController.createReview);

// Admin moderation
router.get('/admin', verifyToken, requireAdmin, reviewsController.getAdminReviews);
router.put('/admin/:id', verifyToken, requireAdmin, reviewsController.moderateReview);

module.exports = router;
