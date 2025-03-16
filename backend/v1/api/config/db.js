/**
 * Veritabanı bağlantı konfigürasyonu
 */
const mongoose = require('mongoose');
const logger = require('../utils/logger');

/**
 * MongoDB'ye bağlanma fonksiyonu
 */
const connectDB = async () => {
  try {
    // MongoDB bağlantısı
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // MongoDB sürüm 6+ için bu seçenekler otomatik ayarlanıyor
    });

    logger.info(`MongoDB bağlantısı kuruldu: ${conn.connection.host}`);
  } catch (error) {
    logger.error(`Veritabanı bağlantı hatası: ${error.message}`);
    process.exit(1); // Hata durumunda uygulamayı sonlandır
  }
};

module.exports = connectDB;
