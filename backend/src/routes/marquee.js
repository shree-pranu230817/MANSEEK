const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');

// Public route to fetch landing page marquee ticker tags
router.get('/', adminController.getMarqueeTags);

module.exports = router;
