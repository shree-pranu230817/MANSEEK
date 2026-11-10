const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { verifyToken } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { registerSchema, loginSchema } = require('../schemas/auth.schema');

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.get('/me', verifyToken, authController.me);
router.put('/profile', verifyToken, authController.updateProfile);
router.post('/addresses', verifyToken, authController.addAddress);
router.post('/logout', authController.logout);

module.exports = router;
