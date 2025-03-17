<?php
/**
 * database.php - Veritabanı bağlantı ayarları
 * 
 * MySQL/MariaDB veritabanı bağlantısı için gerekli yapılandırma sabitleri.
 * Bu dosya, veritabanı bağlantısını yapılandırmak için kullanılır.
 * !!! ÖNEMLİ: Bu dosyayı versiyon kontrolüne dahil etmeyin (gitignore'a ekleyin) !!!
 */

// Veritabanı sunucusu bilgileri
define('DB_HOST', 'localhost');     // Veritabanı sunucusu adresi
define('DB_NAME', 'octaverus_admin'); // Veritabanı adı
define('DB_USER', 'octaverus_admin'); // Veritabanı kullanıcı adı
define('DB_PASS', 'Achilles14123!'); // Veritabanı şifresi
define('DB_CHARSET', 'utf8mb4');    // Veritabanı karakter seti

// Veritabanı bağlantı seçenekleri
define('DB_PERSISTENT', true);      // Kalıcı bağlantı kullan
define('DB_TIMEOUT', 5);            // Bağlantı zaman aşımı (saniye)
define('DB_USE_CACHE', true);       // Sorgu önbelleği kullan

// Veritabanı tablo önekleri - birden fazla uygulama aynı veritabanını kullanıyorsa kullanışlı
define('DB_PREFIX', 'oct_');        // Tablo öneki

// Veritabanı hata ayıklama
define('DB_DEBUG', false);          // Hata ayıklama etkin mi

/**
 * MySQL PDO DSN değerini oluşturur
 * 
 * @return string DSN bağlantı string'i
 */
function getDatabaseDSN() {
    $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME;
    
    // Karakter seti belirt
    if (defined('DB_CHARSET')) {
        $dsn .= ";charset=" . DB_CHARSET;
    }
    
    // Diğer seçenekler eklenebilir
    
    return $dsn;
}

/**
 * Veritabanı bağlantı seçeneklerini oluşturur
 * 
 * @return array PDO seçenekleri
 */
function getDatabaseOptions() {
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false
    ];
    
    // Kalıcı bağlantı kullan
    if (defined('DB_PERSISTENT') && DB_PERSISTENT) {
        $options[PDO::ATTR_PERSISTENT] = true;
    }
    
    // Bağlantı zaman aşımını ayarla
    if (defined('DB_TIMEOUT') && DB_TIMEOUT > 0) {
        $options[PDO::ATTR_TIMEOUT] = DB_TIMEOUT;
    }
    
    // MySQL özel ayarları ekle
    if (defined('DB_CHARSET')) {
        $options[PDO::MYSQL_ATTR_INIT_COMMAND] = "SET NAMES " . DB_CHARSET;
    }
    
    return $options;
}

/**
 * Test amacıyla veritabanı bağlantısını kontrol et
 * Bağlantı başarısızsa exception fırlatır
 * 
 * @return bool Bağlantı başarılı mı
 */
function testDatabaseConnection() {
    try {
        $pdo = new PDO(
            getDatabaseDSN(),
            DB_USER,
            DB_PASS,
            getDatabaseOptions()
        );
        
        // Basit bir sorgu çalıştır
        $stmt = $pdo->query('SELECT 1');
        
        // Bağlantıyı kapat
        $pdo = null;
        
        return true;
    } catch (PDOException $e) {
        // Hatayı logla
        error_log("Veritabanı bağlantı hatası: " . $e->getMessage());
        
        // Exception'ı yeniden fırlat
        throw $e;
    }
}

// Eğer bu dosya doğrudan çalıştırılıyorsa, bağlantıyı test et
if (basename($_SERVER['SCRIPT_FILENAME']) == basename(__FILE__)) {
    try {
        if (testDatabaseConnection()) {
            echo "Veritabanı bağlantısı başarılı!";
        }
    } catch (PDOException $e) {
        echo "Veritabanı bağlantı hatası: " . $e->getMessage();
    }
}
