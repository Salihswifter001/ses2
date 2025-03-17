<?php
/**
 * config.php - Uygulama genel yapılandırma dosyası
 * 
 * Tüm uygulamada kullanılan sabit değerler ve yapılandırma ayarları
 */

// Uygulama bilgileri
define('APP_NAME', 'Octaverum');
define('APP_VERSION', '1.0.0');
define('APP_URL', 'https://octaverum.com');
define('API_URL', 'https://octaverum.com/api');

// JWT yapılandırması
define('JWT_SECRET', 'octaverum_super_gizli_anahtar_2025'); // Üretim ortamında değiştir!
define('JWT_REFRESH_SECRET', 'octaverum_super_gizli_refresh_anahtar_2025'); // Üretim ortamında değiştir!
define('JWT_EXPIRE', 3600); // 1 saat (saniye cinsinden)
define('JWT_REFRESH_EXPIRE', 604800); // 7 gün (saniye cinsinden)

// Oturum ayarları
define('SESSION_LIFETIME', 86400); // 24 saat (saniye cinsinden)
define('RATE_LIMIT_LOGIN_ATTEMPTS', 5); // 15 dakika içinde maksimum giriş denemesi
define('RATE_LIMIT_REGISTER_ATTEMPTS', 3); // 1 saat içinde maksimum kayıt denemesi
define('RATE_LIMIT_FORGOT_PASSWORD_ATTEMPTS', 3); // 1 saat içinde maksimum şifre sıfırlama istekleri

// Upload limitleri
define('MAX_UPLOAD_SIZE', 10485760); // 10MB
define('ALLOWED_IMAGE_TYPES', ['image/jpeg', 'image/png', 'image/gif']);
define('PROFILE_IMAGES_DIR', __DIR__ . '/../assets/uploads/profiles/');

// Abonelik planları
define('SUBSCRIPTION_PLANS', [
    'starter' => [
        'name' => 'Starter',
        'price' => 39.99,
        'currency' => 'TRY',
        'features' => [
            'dailyLimit' => 10,
            'aiMusicLevel' => 'basic',
            'support' => 'standard'
        ]
    ],
    'plus' => [
        'name' => 'Plus',
        'price' => 69.99,
        'currency' => 'TRY',
        'features' => [
            'dailyLimit' => 20,
            'aiMusicLevel' => 'advanced',
            'support' => 'priority',
            'additionalEffects' => true
        ]
    ],
    'pro' => [
        'name' => 'Pro',
        'price' => 99.99,
        'currency' => 'TRY',
        'features' => [
            'dailyLimit' => -1, // sınırsız
            'aiMusicLevel' => 'professional',
            'support' => 'priority',
            'mixAndMastering' => true,
            'extraFeatures' => true
        ]
    ]
]);

// Şifre politikası
define('PASSWORD_MIN_LENGTH', 8);
define('PASSWORD_REQUIRE_UPPERCASE', true);
define('PASSWORD_REQUIRE_LOWERCASE', true);
define('PASSWORD_REQUIRE_NUMBER', true);
define('PASSWORD_REQUIRE_SPECIAL', true);

// CORS ayarları
define('CORS_ALLOWED_ORIGINS', ['https://octaverum.com', 'http://localhost:3000']);
define('CORS_ALLOWED_METHODS', ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']);
define('CORS_ALLOWED_HEADERS', ['Content-Type', 'Authorization', 'X-Requested-With']);
define('CORS_MAX_AGE', 86400); // 24 saat

// Log ayarları
define('LOG_DIR', __DIR__ . '/../logs/');
define('LOG_LEVEL', 'INFO'); // DEBUG, INFO, WARNING, ERROR seviyeleri

// Zaman dilimi ayarları
date_default_timezone_set('Europe/Istanbul');

// Hata raporlama ayarları - geliştirme ortamında
if ($_SERVER['SERVER_NAME'] === 'localhost' || strpos($_SERVER['SERVER_NAME'], 'dev.') === 0) {
    // Tüm hataları göster
    ini_set('display_errors', 1);
    ini_set('display_startup_errors', 1);
    error_reporting(E_ALL);
    define('ENVIRONMENT', 'development');
} else {
    // Hataları gösterme ama logla
    ini_set('display_errors', 0);
    ini_set('display_startup_errors', 0);
    error_reporting(E_ALL);
    ini_set('log_errors', 1);
    ini_set('error_log', LOG_DIR . 'error.log');
    define('ENVIRONMENT', 'production');
}

// Otomatik purge edilecek log dosyalarını yapılandır
define('LOG_RETENTION_DAYS', 30); // 30 gün sonra logları otomatik temizle

// Kullanıcı sayısı tahminleri
define('CONCURRENT_USERS_LIMIT', 1000); // Aynı anda maksimum kullanıcı sayısı

// Cache TTL değerleri (saniye)
define('CACHE_SHORT', 60); // 1 dakika
define('CACHE_MEDIUM', 300); // 5 dakika
define('CACHE_LONG', 3600); // 1 saat
define('CACHE_DAY', 86400); // 1 gün

// Müzik türleri
define('MUSIC_GENRES', [
    'rap' => 'Rap',
    'hiphop' => 'Hip Hop',
    'rock' => 'Rock',
    'pop' => 'Pop',
    'jazz' => 'Jazz',
    'edm' => 'EDM',
    'classical' => 'Klasik',
    'rnb' => 'R&B',
    'metal' => 'Metal',
    'folk' => 'Folk',
    'country' => 'Country',
    'blues' => 'Blues',
    'reggae' => 'Reggae',
    'techno' => 'Techno'
]);

/**
 * Dinamik olarak yapılandırma değerini al
 * 
 * @param string $key Yapılandırma anahtarı
 * @param mixed $default Değer bulunamazsa varsayılan değer
 * @return mixed Yapılandırma değeri
 */
function config($key, $default = null) {
    $value = null;
    
    // Sabit olarak tanımlanmış mı kontrol et
    if (defined($key)) {
        $value = constant($key);
    } 
    // SUBSCRIPTION_PLANS içinde nested anahtar olabilir (ör: "SUBSCRIPTION_PLANS.starter.price")
    elseif (strpos($key, '.') !== false) {
        $parts = explode('.', $key);
        
        if (count($parts) >= 2 && defined($parts[0])) {
            $array = constant($parts[0]);
            array_shift($parts);
            
            foreach ($parts as $part) {
                if (isset($array[$part])) {
                    $array = $array[$part];
                } else {
                    return $default;
                }
            }
            
            $value = $array;
        }
    }
    
    return $value !== null ? $value : $default;
}
