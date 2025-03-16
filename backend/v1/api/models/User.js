/**
 * Kullanıcı modeli
 */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const config = require('../config/default');

const UserSchema = new mongoose.Schema({
  // Kullanıcı adı (nickname)
  nickname: {
    type: String,
    required: [true, 'Kullanıcı adı zorunludur'],
    unique: true,
    trim: true,
    minlength: [3, 'Kullanıcı adı en az 3 karakter olmalıdır'],
    maxlength: [30, 'Kullanıcı adı en fazla 30 karakter olabilir']
  },
  
  // E-posta
  email: {
    type: String,
    required: [true, 'E-posta zorunludur'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [
      /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/,
      'Lütfen geçerli bir e-posta adresi girin'
    ]
  },
  
  // Şifre
  password: {
    type: String,
    required: [true, 'Şifre zorunludur'],
    minlength: [
      config.passwordPolicy.minLength,
      `Şifre en az ${config.passwordPolicy.minLength} karakter olmalıdır`
    ],
    select: false // Sorgularda şifreyi varsayılan olarak döndürme
  },
  
  // Ülke kodu
  countryCode: {
    type: String,
    required: [true, 'Ülke kodu zorunludur'],
    trim: true
  },
  
  // Telefon numarası
  phone: {
    type: String,
    required: [true, 'Telefon numarası zorunludur'],
    trim: true
  },
  
  // Güvenlik sorusu
  securityQuestion: {
    type: String,
    required: [true, 'Güvenlik sorusu zorunludur'],
    enum: ['mother-maiden', 'first-pet', 'favorite-color']
  },
  
  // Güvenlik sorusu cevabı
  securityAnswer: {
    type: String,
    required: [true, 'Güvenlik sorusu cevabı zorunludur'],
    select: false // Sorgularda cevabı varsayılan olarak döndürme
  },
  
  // Abonelik planı
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'starter', 'plus', 'pro'],
      default: 'free'
    },
    startDate: {
      type: Date
    },
    endDate: {
      type: Date
    }
  },
  
  // Yetkiler (Admin, User vb.)
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  
  // Hesap doğrulama
  isVerified: {
    type: Boolean,
    default: false
  },
  
  // Hesap oluşturma ve güncelleme tarihleri
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

/**
 * Şifreyi kaydetmeden önce hash'le
 */
UserSchema.pre('save', async function (next) {
  // Eğer şifre değiştirilmediyse
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    // Salt oluştur ve şifreyi hash'le
    const salt = await bcrypt.genSalt(config.security.saltRounds);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * Şifre doğrulama metodu
 * @param {string} enteredPassword - Kullanıcının girdiği şifre
 * @returns {boolean} Şifre doğruysa true, yanlışsa false
 */
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

/**
 * Model'ı oluştur ve dışa aktar
 */
module.exports = mongoose.model('User', UserSchema);
