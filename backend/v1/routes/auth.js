/**
 * Kimlik doğrulama rotaları
 */
const express = require('express');
const router = express.Router();

// Controller fonksiyonları
const {
  register,
  login,
  logout,
  refreshToken,
  getMe,
  updatePassword
} = require('../controllers/authController');

// Middleware'ler
const { protect } = require('../middleware/auth');
const {
  registerValidation,
  loginValidation,
  validateRequest,
  resetPasswordValidation
} = require('../middleware/validate');

// Rotaları tanımla
router.post('/register', registerValidation, validateRequest, register);
router.post('/login', loginValidation, validateRequest, login);
router.post('/logout', logout);
router.post('/refresh-token', refreshToken);
router.get('/me', protect, getMe);
router.put('/password', protect, resetPasswordValidation, validateRequest, updatePassword);

module.exports = router;
