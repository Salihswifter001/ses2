<?php
/**
 * Database.php - Veritabanı bağlantı ve işlem sınıfı
 * 
 * PDO kullanarak MySQL veritabanı bağlantısı oluşturur ve yönetir.
 * Singleton tasarım deseni kullanılarak tek bir bağlantı oluşturulur.
 */

// Yapılandırma dosyası
require_once __DIR__ . '/../config/database.php';

class Database {
    private $host = DB_HOST;
    private $db_name = DB_NAME;
    private $username = DB_USER;
    private $password = DB_PASS;
    private $charset = DB_CHARSET;
    private $conn;
    private static $instance = null;
    
    /**
     * Singleton pattern ile tek bir veritabanı bağlantısı oluştur
     * 
     * @return Database
     */
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    /**
     * Yapıcı metod - Veritabanı bağlantısı oluşturur
     */
    private function __construct() {
        try {
            $dsn = "mysql:host={$this->host};dbname={$this->db_name};charset={$this->charset}";
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES {$this->charset}"
            ];
            
            $this->conn = new PDO($dsn, $this->username, $this->password, $options);
        } catch (PDOException $e) {
            // Loglama
            error_log("Veritabanı bağlantı hatası: " . $e->getMessage());
            throw new Exception("Veritabanına bağlanılamadı: " . $e->getMessage());
        }
    }
    
    /**
     * Bağlantıyı döndür
     * 
     * @return PDO
     */
    public function getConnection() {
        return $this->conn;
    }
    
    /**
     * Sorgu çalıştırma
     * 
     * @param string $sql Çalıştırılacak SQL sorgusu
     * @param array $params Parametreler
     * @return PDOStatement
     */
    public function query($sql, $params = []) {
        try {
            $stmt = $this->conn->prepare($sql);
            $stmt->execute($params);
            return $stmt;
        } catch (PDOException $e) {
            error_log("Sorgu hatası: " . $e->getMessage() . " - SQL: " . $sql);
            throw new Exception("Sorgu çalıştırılırken bir hata oluştu: " . $e->getMessage());
        }
    }
    
    /**
     * Tek satır getir
     * 
     * @param string $sql Çalıştırılacak SQL sorgusu
     * @param array $params Parametreler
     * @return array|null
     */
    public function fetchOne($sql, $params = []) {
        $stmt = $this->query($sql, $params);
        return $stmt->fetch();
    }
    
    /**
     * Tüm sonuçları getir
     * 
     * @param string $sql Çalıştırılacak SQL sorgusu
     * @param array $params Parametreler
     * @return array
     */
    public function fetchAll($sql, $params = []) {
        $stmt = $this->query($sql, $params);
        return $stmt->fetchAll();
    }
    
    /**
     * Son eklenen ID'yi getir
     * 
     * @return string
     */
    public function lastInsertId() {
        return $this->conn->lastInsertId();
    }
    
    /**
     * İşlem başlat
     */
    public function beginTransaction() {
        $this->conn->beginTransaction();
    }
    
    /**
     * İşlemi kaydet
     */
    public function commit() {
        $this->conn->commit();
    }
    
    /**
     * İşlemi geri al
     */
    public function rollback() {
        $this->conn->rollBack();
    }
}
