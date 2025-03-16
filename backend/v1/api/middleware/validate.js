/**
 * İstek doğrulama middleware'leri
 */
const { body, validationResult } = require('express-validator');
const config = require('../config/default');

/**
 * Validasyon hatalarını kontrol eden middleware
 */
exports.validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }
  
  next();
};

/**
 * Kayıt işlemi için validasyon kuralları
 */
exports.registerValidation = [
  // Kullanıcı adı validasyonu
  body('nickname')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Kullanıcı adı 3-30 karakter arasında olmalıdır')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Kullanıcı adı sadece harf, rakam ve alt çizgi içerebilir'),
  
  // E-posta validasyonu
  body('email')
    .trim()
    .isEmail()
    .withMessage('Geçerli bir e-posta adresi giriniz')
    .normalizeEmail(),
  
  // Şifre validasyonu
  body('password')
    .isLength({ min: config.passwordPolicy.minLength })
    .withMessage(`Şifre en az ${config.passwordPolicy.minLength} karakter olmalıdır`),
  
  // Şifre tekrarı validasyonu
  body('password2')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Şifreler eşleşmiyor');
      }
      return true;
    }),
  
  // Ülke kodu validasyonu
  body('country_code')
    .trim()
    .notEmpty()
    .withMessage('Ülke kodu gereklidir'),
  
  // Telefon numarası validasyonu
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Telefon numarası gereklidir'),
  
  // Güvenlik sorusu validasyonu
  body('security_question')
    .isIn(['mother-maiden', 'first-pet', 'favorite-color'])
    .withMessage('Geçerli bir güvenlik sorusu seçiniz'),
  
  // Güvenlik sorusu cevabı validasyonu
  body('security_answer')
    .trim()
    .notEmpty()
    .withMessage('Güvenlik sorusu cevabı gereklidir')
];

/**
 * Giriş işlemi için validasyon kuralları
 */
exports.loginValidation = [
  // E-posta validasyonu
  body('email')
    .trim()
    .isEmail()
    .withMessage('Geçerli bir e-posta adresi giriniz')
    .normalizeEmail(),
  
  // Şifre validasyonu
  body('password')
    .notEmpty()
    .withMessage('Şifre gereklidir')
];

/**
 * Şifre sıfırlama isteği için validasyon kuralları
 */
exports.forgotPasswordValidation = [
  // E-posta validasyonu
  body('email')
    .trim()
    .isEmail()
    .withMessage('Geçerli bir e-posta adresi giriniz')
    .normalizeEmail()
];

/**
 * Şifre sıfırlama için validasyon kuralları
 */
exports.resetPasswordValidation = [
  // Şifre validasyonu
  body('password')
    .isLength({ min: config.passwordPolicy.minLength })
    .withMessage(`Şifre en az ${config.passwordPolicy.minLength} karakter olmalıdır`),
  
  // Şifre tekrarı validasyonu
  body('password2')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Şifreler eşleşmiyor');
      }
      return true;
    })
];
