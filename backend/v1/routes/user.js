/**
 * Kullanıcı rotaları
 */
const express = require('express');
const router = express.Router();

// Controller fonksiyonları
const {
  getUsers,
  getUser,
  updateProfile,
  updateSubscription,
  deleteUser
} = require('../controllers/userController');

// Middleware'ler
const { protect, authorize } = require('../middleware/auth');

// Rotaları tanımla

// Admin erişimli rotalar
router.get('/', protect, authorize('admin'), getUsers);
router.get('/:id', protect, authorize('admin'), getUser);
router.delete('/:id', protect, authorize('admin'), deleteUser);

// Kullanıcı erişimli rotalar
router.put('/profile', protect, updateProfile);
router.put('/subscription', protect, updateSubscription);

module.exports = router;
