/**
 * Kimlik doğrulama yardımcı fonksiyonları
 */
const crypto = require('crypto');
const logger = require('./logger');

/**
 * Şifre karmaşıklığını kontrol eder
 * @param {string} password - Kontrol edilecek şifre
 * @returns {object} Doğrulama sonucu ve hata mesajı
 */
exports.validatePasswordStrength = (password) => {
  // Şifre en az 8 karakter olmalı
  if (password.length < 8) {
    return {
      isValid: false,
      message: 'Şifre en az 8 karakter olmalıdır'
    };
  }
  
  // Şifre en az bir büyük harf içermeli
  if (!/[A-Z]/.test(password)) {
    return {
      isValid: false,
      message: 'Şifre en az bir büyük harf içermelidir'
    };
  }
  
  // Şifre en az bir küçük harf içermeli
  if (!/[a-z]/.test(password)) {
    return {
      isValid: false,
      message: 'Şifre en az bir küçük harf içermelidir'
    };
  }
  
  // Şifre en az bir rakam içermeli
  if (!/[0-9]/.test(password)) {
    return {
      isValid: false,
      message: 'Şifre en az bir rakam içermelidir'
    };
  }
  
  // Şifre en az bir özel karakter içermeli
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return {
      isValid: false,
      message: 'Şifre en az bir özel karakter içermelidir'
    };
  }
  
  return {
    isValid: true,
    message: 'Şifre geçerli'
  };
};

/**
 * E-posta adresinin gerçek bir e-posta olup olmadığını kontrol eder
 * @param {string} email - Kontrol edilecek e-posta
 * @returns {boolean} E-posta geçerli mi
 */
exports.isValidEmail = (email) => {
  // Basit e-posta doğrulama
  const emailRegex = /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/;
  return emailRegex.test(email);
};

/**
 * Yaygın şifreleri kontrol eder
 * @param {string} password - Kontrol edilecek şifre
 * @returns {boolean} Şifre yaygın mı
 */
exports.isCommonPassword = (password) => {
  const commonPasswords = [
    'password', 'Password123', '123456', 'qwerty', 'admin',
    '12345678', 'welcome', '1234', 'abc123', 'password1',
    'admin123', 'login', 'master', 'welcome1', 'password123'
  ];
  
  return commonPasswords.includes(password);
};

/**
 * Kullanıcı adının uygun olup olmadığını kontrol eder
 * @param {string} username - Kontrol edilecek kullanıcı adı
 * @returns {object} Doğrulama sonucu ve hata mesajı
 */
exports.validateUsername = (username) => {
  // Kullanıcı adı en az 3 karakter olmalı
  if (username.length < 3) {
    return {
      isValid: false,
      message: 'Kullanıcı adı en az 3 karakter olmalıdır'
    };
  }
  
  // Kullanıcı adı en fazla 30 karakter olmalı
  if (username.length > 30) {
    return {
      isValid: false,
      message: 'Kullanıcı adı en fazla 30 karakter olabilir'
    };
  }
  
  // Kullanıcı adı sadece harf, rakam ve alt çizgi içermeli
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return {
      isValid: false,
      message: 'Kullanıcı adı sadece harf, rakam ve alt çizgi içerebilir'
    };
  }
  
  // Yasaklı kullanıcı adları kontrol et
  const bannedUsernames = [
    'admin', 'administrator', 'moderator', 'support',
    'helpdesk', 'system', 'webmaster', 'octaverum'
  ];
  
  if (bannedUsernames.includes(username.toLowerCase())) {
    return {
      isValid: false,
      message: 'Bu kullanıcı adı kullanılamaz'
    };
  }
  
  return {
    isValid: true,
    message: 'Kullanıcı adı geçerli'
  };
};

/**
 * Doğrulama kodları oluşturma
 * @param {number} length - Kod uzunluğu
 * @returns {string} Oluşturulan kod
 */
exports.generateVerificationCode = (length = 6) => {
  const characters = '0123456789';
  let code = '';
  
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    code += characters[randomIndex];
  }
  
  return code;
};

/**
 * Belirli bir uzunlukta rastgele bir token oluşturur
 * @param {number} length - Token bit uzunluğu
 * @returns {string} Oluşturulan token
 */
exports.generateRandomToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * API Anahtar oluşturma (API'yi dışarıdan kullanmak isteyenler için)
 * @param {string} userId - Kullanıcı ID'si
 * @returns {string} API anahtarı
 */
exports.generateApiKey = (userId) => {
  const prefix = 'octav_';
  const randomPart = crypto.randomBytes(16).toString('hex');
  const timestamp = Date.now().toString(36);
  const userPart = userId.toString().substring(0, 8);
  
  // Tüm parçaları birleştir
  return `${prefix}${randomPart}_${timestamp}_${userPart}`;
};

/**
 * Oturum süresini kısalt veya uzat
 * @param {number} minutes - Dakika olarak süre
 * @returns {string} JWT için süre string'i
 */
exports.adjustTokenExpiry = (minutes) => {
  return `${minutes}m`;
};

/**
 * IP adresi kontrolü
 * @param {string} ip - Kontrol edilecek IP adresi
 * @param {array} whitelistedIPs - İzin verilen IP'ler
 * @returns {boolean} IP izin verilen listede mi
 */
exports.isWhitelistedIP = (ip, whitelistedIPs) => {
  return whitelistedIPs.includes(ip);
};

/**
 * Kaynak kontrolü (CORS için)
 * @param {string} origin - İstek kaynağı
 * @param {array} allowedOrigins - İzin verilen kaynaklar
 * @returns {boolean} Kaynak izin verilen listede mi
 */
exports.isAllowedOrigin = (origin, allowedOrigins) => {
  return allowedOrigins.includes(origin) || allowedOrigins.includes('*');
};

/**
 * İstek günlüğü
 * @param {object} req - Request nesnesi
 * @param {string} action - Yapılan işlem
 */
exports.logRequest = (req, action) => {
  const ip = req.ip || req.connection.remoteAddress;
  const userAgent = req.headers['user-agent'] || 'Bilinmeyen';
  const userId = req.user ? req.user._id : 'Anonim';
  
  logger.info(`${action} | IP: ${ip} | User: ${userId} | Agent: ${userAgent}`);
};
