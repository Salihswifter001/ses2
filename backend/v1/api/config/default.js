/**
 * Uygulama geneli konfigürasyon ayarları
 */
module.exports = {
  // API versiyonu
  apiVersion: 'v1',
  
  // Şifre politikası
  passwordPolicy: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSymbols: false
  },
  
  // Rate limiting ayarları (istek sınırlama)
  rateLimit: {
    // Her IP için dakikada maksimum istek sayısı
    windowMs: 15 * 60 * 1000, // 15 dakika
    max: 100, // 15 dakika içinde maksimum 100 istek
    standardHeaders: true, // "RateLimit-*" header'larını göster
    legacyHeaders: false // "X-RateLimit-*" header'larını devre dışı bırak
  },
  
  // Güvenlik ayarları
  security: {
    // bcrypt için salt round sayısı
    saltRounds: 10,
    
    // CORS ayarları
    cors: {
      origin: process.env.CORS_ORIGIN || '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization']
    }
  },
  
  // Abonelik planları
  subscriptionPlans: {
    starter: {
      id: 'starter',
      name: 'Starter',
      price: 39.99,
      currency: 'TRY',
      features: {
        dailyLimit: 10,
        aiMusicLevel: 'basic',
        support: 'standard'
      }
    },
    plus: {
      id: 'plus',
      name: 'Plus',
      price: 69.99,
      currency: 'TRY',
      features: {
        dailyLimit: 20,
        aiMusicLevel: 'advanced',
        support: 'priority',
        additionalEffects: true
      }
    },
    pro: {
      id: 'pro',
      name: 'Pro',
      price: 99.99,
      currency: 'TRY',
      features: {
        dailyLimit: -1, // sınırsız
        aiMusicLevel: 'professional',
        support: 'priority',
        mixAndMastering: true,
        extraFeatures: true
      }
    }
  }
};
