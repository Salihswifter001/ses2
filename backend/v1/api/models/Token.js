/**
 * Token modeli (refresh tokenlar için)
 */
const mongoose = require('mongoose');

const TokenSchema = new mongoose.Schema({
  // Token değeri
  token: {
    type: String,
    required: true,
    index: true
  },
  
  // Token'ın hangi kullanıcıya ait olduğu
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Token tipi (refresh, access vs.)
  type: {
    type: String,
    required: true,
    enum: ['refresh', 'reset']
  },
  
  // Token'ın geçerlilik süresi
  expiresAt: {
    type: Date,
    required: true
  },
  
  // Token kullanılmış mı
  isRevoked: {
    type: Boolean,
    default: false
  },
  
  // Token oluşturma tarihi
  createdAt: {
    type: Date,
    default: Date.now,
    expires: '30d' // 30 gün sonra MongoDB tarafından otomatik silinsin
  }
});

module.exports = mongoose.model('Token', TokenSchema);
