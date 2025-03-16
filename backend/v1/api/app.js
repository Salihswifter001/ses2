/**
 * Ana uygulama dosyası
 */
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const config = require('./config/default');

// Rotaları içe aktar
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');

// Express uygulamasını oluştur
const app = express();

// Body parser
app.use(express.json());

// CORS ayarları
app.use(cors(config.security.cors));

// Güvenlik başlıkları
app.use(helmet());

// API isteklerini logla
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// İstek limitleme
const limiter = rateLimit(config.rateLimit);
app.use('/api', limiter);

// API rotalarını tanımla
app.use(`/api/${config.apiVersion}/auth`, authRoutes);
app.use(`/api/${config.apiVersion}/users`, userRoutes);

// Kök rotayı tanımla
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Octaverum API aktif',
    version: config.apiVersion
  });
});

// 404 - Rota bulunamadı
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    error: 'İstenen kaynak bulunamadı'
  });
});

// Hata yakalama middleware'i
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  
  res.status(statusCode).json({
    success: false,
    error: err.message || 'Sunucu hatası'
  });
});

module.exports = app;
