/**
 * Kullanıcı işlem günlüğü modeli
 */
const mongoose = require('mongoose');

const ActivityLogSchema = new mongoose.Schema({
  // İşlemi yapan kullanıcı (varsa)
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  
  // İşlem tipi
  action: {
    type: String,
    required: true,
    enum: [
      'register',          // Kayıt olma
      'login',             // Giriş yapma
      'logout',            // Çıkış yapma
      'password_change',   // Şifre değiştirme
      'password_reset',    // Şifre sıfırlama
      'profile_update',    // Profil güncelleme
      'subscription_change', // Abonelik değiştirme
      'account_lock',      // Hesap kilitleme
      'account_unlock',    // Hesap kilit açma
      'failed_login'       // Başarısız giriş denemesi
    ]
  },
  
  // İşlem tarifi
  description: {
    type: String,
    required: true
  },
  
  // IP adresi
  ip: {
    type: String,
    default: null
  },
  
  // Tarayıcı/cihaz bilgisi
  userAgent: {
    type: String,
    default: null
  },
  
  // Ek veri
  metadata: {
    type: Object,
    default: {}
  },
  
  // İşlem tarihi
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// IP'ye göre araştırma için indeks ekle
ActivityLogSchema.index({ ip: 1 });

// Kullanıcı ID'sine göre araştırma için indeks ekle
ActivityLogSchema.index({ user: 1 });

// Son 30 günlük logları saklayacak TTL indeks
ActivityLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 });

module.exports = mongoose.model('ActivityLog', ActivityLogSchema);
