/**
 * Loglama sistemi
 */
const winston = require('winston');

// Log formatını yapılandırma
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Logger oluşturma
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format,
  defaultMeta: { service: 'octaverum-api' },
  transports: [
    // Konsola log'ları yazdırma
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(
          ({ timestamp, level, message, service }) => `${timestamp} [${service}] ${level}: ${message}`
        )
      )
    }),
    // Dosyaya hata log'larını yazma (production ortamında)
    ...(process.env.NODE_ENV === 'production'
      ? [
          new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
          new winston.transports.File({ filename: 'logs/combined.log' })
        ]
      : [])
  ]
});

module.exports = logger;
