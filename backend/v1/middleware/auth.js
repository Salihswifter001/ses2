/**
 * JWT kimlik doğrulama middleware
 */
const { verifyAccessToken } = require('../utils/jwt');
const User = require('../models/User');

/**
 * Kullanıcının giriş yapmış olmasını kontrol eder
 */
exports.protect = async (req, res, next) => {
  try {
    let token;
    
    // Header'dan Bearer token'ı al
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    // Token yoksa hata döndür
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Bu işlem için giriş yapmanız gerekiyor'
      });
    }
    
    // Token'ı doğrula
    const decoded = verifyAccessToken(token);
    
    // Token geçersizse hata döndür
    if (!decoded) {
      return res.status(401).json({
        success: false,
        error: 'Geçersiz token, lütfen tekrar giriş yapın'
      });
    }
    
    // Token geçerliyse kullanıcıyı bul
    const user = await User.findById(decoded.id);
    
    // Kullanıcı bulunamadıysa hata döndür
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Kullanıcı bulunamadı'
      });
    }
    
    // Kullanıcıyı request nesnesine ekle
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Kimlik doğrulama hatası'
    });
  }
};

/**
 * Kullanıcının belirli bir role sahip olmasını kontrol eder
 * @param {string[]} roles - İzin verilen roller
 */
exports.authorize = (...roles) => {
  return (req, res, next) => {
    // Kullanıcı yoksa veya rolü uygun değilse hata döndür
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Bu işlem için yetkiniz bulunmuyor'
      });
    }
    
    next();
  };
};
