/**
 * Kullanıcı işlemlerini günlüğe kaydeden yardımcı fonksiyonlar
 */
const ActivityLog = require('../models/ActivityLog');
const logger = require('./logger');

/**
 * Kullanıcı işlemini günlüğe kaydet
 * @param {Object} logData - Log verileri
 * @returns {Promise} İşlem sonucu
 */
const logActivity = async (logData) => {
  try {
    await ActivityLog.create(logData);
  } catch (error) {
    logger.error(`İşlem günlüğe kaydedilemedi: ${error.message}`);
  }
};

/**
 * Kullanıcı kaydını günlüğe ekle
 * @param {Object} user - Kullanıcı objesi
 * @param {Object} req - İstek objesi
 */
exports.logRegistration = async (user, req) => {
  const logData = {
    user: user._id,
    action: 'register',
    description: `Yeni kullanıcı kaydı: ${user.email}`,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.headers['user-agent'] || 'Bilinmeyen',
    metadata: {
      email: user.email,
      nickname: user.nickname
    }
  };
  
  await logActivity(logData);
};

/**
 * Kullanıcı girişini günlüğe ekle
 * @param {Object} user - Kullanıcı objesi
 * @param {Object} req - İstek objesi
 */
exports.logLogin = async (user, req) => {
  const logData = {
    user: user._id,
    action: 'login',
    description: `Kullanıcı girişi: ${user.email}`,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.headers['user-agent'] || 'Bilinmeyen',
    metadata: {
      email: user.email
    }
  };
  
  await logActivity(logData);
};

/**
 * Başarısız giriş denemesini günlüğe ekle
 * @param {string} email - Denenen e-posta
 * @param {Object} req - İstek objesi
 */
exports.logFailedLogin = async (email, req) => {
  const logData = {
    user: null,
    action: 'failed_login',
    description: `Başarısız giriş denemesi: ${email}`,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.headers['user-agent'] || 'Bilinmeyen',
    metadata: {
      email: email,
      reason: 'Geçersiz kimlik bilgileri'
    }
  };
  
  await logActivity(logData);
};

/**
 * Kullanıcı çıkışını günlüğe ekle
 * @param {Object} user - Kullanıcı objesi
 * @param {Object} req - İstek objesi
 */
exports.logLogout = async (user, req) => {
  const logData = {
    user: user._id,
    action: 'logout',
    description: `Kullanıcı çıkışı: ${user.email}`,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.headers['user-agent'] || 'Bilinmeyen',
    metadata: {
      email: user.email
    }
  };
  
  await logActivity(logData);
};

/**
 * Şifre değiştirmeyi günlüğe ekle
 * @param {Object} user - Kullanıcı objesi
 * @param {Object} req - İstek objesi
 */
exports.logPasswordChange = async (user, req) => {
  const logData = {
    user: user._id,
    action: 'password_change',
    description: `Şifre değiştirildi: ${user.email}`,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.headers['user-agent'] || 'Bilinmeyen',
    metadata: {
      email: user.email
    }
  };
  
  await logActivity(logData);
};

/**
 * Şifre sıfırlamayı günlüğe ekle
 * @param {Object} user - Kullanıcı objesi
 * @param {Object} req - İstek objesi
 * @param {string} method - Sıfırlama metodu (email, security_question)
 */
exports.logPasswordReset = async (user, req, method) => {
  const logData = {
    user: user._id,
    action: 'password_reset',
    description: `Şifre sıfırlandı: ${user.email} (${method})`,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.headers['user-agent'] || 'Bilinmeyen',
    metadata: {
      email: user.email,
      method: method
    }
  };
  
  await logActivity(logData);
};

/**
 * Profil güncellemesini günlüğe ekle
 * @param {Object} user - Kullanıcı objesi
 * @param {Object} req - İstek objesi
 * @param {Object} updates - Güncellenen alanlar
 */
exports.logProfileUpdate = async (user, req, updates) => {
  const updatedFields = Object.keys(updates);
  
  const logData = {
    user: user._id,
    action: 'profile_update',
    description: `Profil güncellendi: ${user.email}`,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.headers['user-agent'] || 'Bilinmeyen',
    metadata: {
      email: user.email,
      updatedFields: updatedFields
    }
  };
  
  await logActivity(logData);
};

/**
 * Abonelik değişikliğini günlüğe ekle
 * @param {Object} user - Kullanıcı objesi
 * @param {Object} req - İstek objesi
 * @param {string} plan - Yeni abonelik planı
 */
exports.logSubscriptionChange = async (user, req, plan) => {
  const logData = {
    user: user._id,
    action: 'subscription_change',
    description: `Abonelik değiştirildi: ${user.email} (${plan})`,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.headers['user-agent'] || 'Bilinmeyen',
    metadata: {
      email: user.email,
      newPlan: plan,
      oldPlan: user.subscription ? user.subscription.plan : 'free'
    }
  };
  
  await logActivity(logData);
};

/**
 * Hesap kilitlemeyi günlüğe ekle
 * @param {Object} user - Kullanıcı objesi
 * @param {Object} req - İstek objesi
 * @param {string} reason - Kilitleme sebebi
 */
exports.logAccountLock = async (user, req, reason) => {
  const logData = {
    user: user._id,
    action: 'account_lock',
    description: `Hesap kilitlendi: ${user.email} (${reason})`,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.headers['user-agent'] || 'Bilinmeyen',
    metadata: {
      email: user.email,
      reason: reason
    }
  };
  
  await logActivity(logData);
};

/**
 * Hesap kilit açmayı günlüğe ekle
 * @param {Object} user - Kullanıcı objesi
 * @param {Object} req - İstek objesi
 * @param {string} unlockedBy - Kilidi açan (self, admin)
 */
exports.logAccountUnlock = async (user, req, unlockedBy) => {
  const logData = {
    user: user._id,
    action: 'account_unlock',
    description: `Hesap kilidi açıldı: ${user.email} (${unlockedBy})`,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.headers['user-agent'] || 'Bilinmeyen',
    metadata: {
      email: user.email,
      unlockedBy: unlockedBy
    }
  };
  
  await logActivity(logData);
};
