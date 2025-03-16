/**
 * Güvenlik ile ilgili middleware'ler
 */
const rateLimit = require('express-rate-limit');
const config = require('../config/default');

/**
 * Genel API istek limitleme
 */
exports.apiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: config.rateLimit.standardHeaders,
  legacyHeaders: config.rateLimit.legacyHeaders,
  message: {
    success: false,
    error: 'Çok fazla istek yapıldı, lütfen daha sonra tekrar deneyin'
  }
});

/**
 * Giriş yapma isteklerini limitleme (brute force önleme)
 */
exports.loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dakika
  max: 5, // 15 dakika içinde en fazla 5 giriş denemesi
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Çok fazla giriş denemesi yapıldı, lütfen 15 dakika sonra tekrar deneyin'
  }
});

/**
 * Şifre sıfırlama isteklerini limitleme
 */
exports.passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 saat
  max: 3, // 1 saat içinde en fazla 3 istek
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Çok fazla şifre sıfırlama isteği yapıldı, lütfen 1 saat sonra tekrar deneyin'
  }
});

/**
 * Kullanıcı kaydı isteklerini limitleme
 */
exports.registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 saat
  max: 3, // 1 saat içinde en fazla 3 kayıt
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Çok fazla kayıt denemesi yapıldı, lütfen 1 saat sonra tekrar deneyin'
  }
});

/**
 * XSS güvenliği için içerik temizleme middleware
 */
exports.sanitizeInputs = (req, res, next) => {
  // Basit bir XSS koruması için <script> taglerini temizle
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = req.body[key]
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .trim();
      }
    });
  }
  
  next();
};

/**
 * SQL Injection koruma - parametre kontrol middleware
 */
exports.checkSqlInjection = (req, res, next) => {
  const sqlPattern = /(\%27)|(\')|(--)|(\%23)|(#)/i;
  const sqlPattern2 = /((\%3D)|(=))[^\n]*((\%27)|(\')|(--)|(\%3B)|(;))/i;
  const sqlPattern3 = /\w*((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/i;
  
  let containsSql = false;
  
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        if (
          sqlPattern.test(req.body[key]) ||
          sqlPattern2.test(req.body[key]) ||
          sqlPattern3.test(req.body[key])
        ) {
          containsSql = true;
        }
      }
    });
  }
  
  if (containsSql) {
    return res.status(403).json({
      success: false,
      error: 'Geçersiz karakterler tespit edildi'
    });
  }
  
  next();
};

/**
 * Demo hesaplarını ve kritik işlemleri koruma
 */
exports.protectDemoAccounts = async (req, res, next) => {
  // Eğer kullanıcı demo@octaverum.com ise bazı işlemleri engelle
  if (req.user && req.user.email === 'demo@octaverum.com') {
    // Şifre değiştirme, profil güncelleme vb. işlemleri engelle
    if (
      req.originalUrl.includes('/password') ||
      req.originalUrl.includes('/profile') ||
      req.method === 'DELETE'
    ) {
      return res.status(403).json({
        success: false,
        error: 'Demo hesaplarında bu işlem yapılamaz'
      });
    }
  }
  
  next();
};
