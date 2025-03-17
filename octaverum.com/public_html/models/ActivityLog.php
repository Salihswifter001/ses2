<?php
/**
 * ActivityLog.php - Aktivite log model sınıfı
 * 
 * Kullanıcı işlemlerini kaydetmek için kullanılır.
 */

require_once __DIR__ . '/../includes/database.php';

class ActivityLog {
    private $db;
    private $table = 'activity_logs';
    
    /**
     * Yapıcı metod
     */
    public function __construct() {
        $this->db = Database::getInstance();
    }
    
    /**
     * Log oluştur
     * 
     * @param array $logData Log verileri
     * @return bool İşlem başarılı mı?
     */
    public function create($logData) {
        try {
            // Metadata varsa JSON'a dönüştür
            $metadata = isset($logData['metadata']) ? json_encode($logData['metadata']) : null;
            
            $sql = "INSERT INTO " . $this->table . " (
                    user_id, 
                    action, 
                    description, 
                    ip, 
                    user_agent, 
                    metadata
                ) VALUES (
                    :user_id, 
                    :action, 
                    :description, 
                    :ip, 
                    :user_agent, 
                    :metadata
                )";
            
            $this->db->query($sql, [
                ':user_id' => $logData['user_id'] ?? null,
                ':action' => $logData['action'],
                ':description' => $logData['description'],
                ':ip' => $logData['ip'] ?? $_SERVER['REMOTE_ADDR'] ?? null,
                ':user_agent' => $logData['user_agent'] ?? $_SERVER['HTTP_USER_AGENT'] ?? null,
                ':metadata' => $metadata
            ]);
            
            return true;
        } catch (Exception $e) {
            error_log("Log oluşturma hatası: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Kullanıcıya ait logları getir
     * 
     * @param int $userId Kullanıcı ID'si
     * @param int $limit Sayfa limiti
     * @param int $offset Başlangıç noktası
     * @return array Log verileri
     */
    public function getUserLogs($userId, $limit = 20, $offset = 0) {
        $sql = "SELECT * FROM " . $this->table . " 
                WHERE user_id = :user_id 
                ORDER BY created_at DESC 
                LIMIT :limit OFFSET :offset";
                
        return $this->db->fetchAll($sql, [
            ':user_id' => $userId,
            ':limit' => (int)$limit,
            ':offset' => (int)$offset
        ]);
    }
    
    /**
     * Tüm logları getir
     * 
     * @param string $action Filtrelenecek eylem
     * @param int $limit Sayfa limiti
     * @param int $offset Başlangıç noktası
     * @return array Log verileri
     */
    public function getAllLogs($action = null, $limit = 50, $offset = 0) {
        $params = [':limit' => (int)$limit, ':offset' => (int)$offset];
        $actionCondition = "";
        
        if ($action) {
            $actionCondition = "WHERE action = :action";
            $params[':action'] = $action;
        }
        
        $sql = "SELECT * FROM " . $this->table . " 
                {$actionCondition} 
                ORDER BY created_at DESC 
                LIMIT :limit OFFSET :offset";
                
        return $this->db->fetchAll($sql, $params);
    }
    
    /**
     * Belirli bir IP adresine ait logları getir
     * 
     * @param string $ip IP adresi
     * @param int $limit Sayfa limiti
     * @param int $offset Başlangıç noktası
     * @return array Log verileri
     */
    public function getLogsByIp($ip, $limit = 20, $offset = 0) {
        $sql = "SELECT * FROM " . $this->table . " 
                WHERE ip = :ip 
                ORDER BY created_at DESC 
                LIMIT :limit OFFSET :offset";
                
        return $this->db->fetchAll($sql, [
            ':ip' => $ip,
            ':limit' => (int)$limit,
            ':offset' => (int)$offset
        ]);
    }
    
    /**
     * Son başarısız giriş denemelerini getir
     * 
     * @param string $email E-posta adresi
     * @param int $minutes Kaç dakika içindeki denemeleri getir
     * @return int Başarısız giriş sayısı
     */
    public function getFailedLoginAttempts($email, $minutes = 15) {
        $sql = "SELECT COUNT(*) as count FROM " . $this->table . " 
                WHERE action = 'failed_login' 
                AND JSON_EXTRACT(metadata, '$.email') = :email
                AND created_at > DATE_SUB(NOW(), INTERVAL :minutes MINUTE)";
                
        $result = $this->db->fetchOne($sql, [
            ':email' => $email,
            ':minutes' => (int)$minutes
        ]);
        
        return (int)$result['count'];
    }
    
    /**
     * Eski logları temizle
     * 
     * @param int $days Kaç günden eski logları temizle
     * @return bool İşlem başarılı mı?
     */
    public function cleanupOldLogs($days = 30) {
        try {
            $sql = "DELETE FROM " . $this->table . " 
                    WHERE created_at < DATE_SUB(NOW(), INTERVAL :days DAY)";
                    
            $this->db->query($sql, [':days' => (int)$days]);
            return true;
        } catch (Exception $e) {
            error_log("Eski logları temizleme hatası: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Kullanıcı kaydı logla
     * 
     * @param array $user Kullanıcı bilgileri
     * @return bool İşlem başarılı mı?
     */
    public function logRegistration($user) {
        return $this->create([
            'user_id' => $user['id'],
            'action' => 'register',
            'description' => "Yeni kullanıcı kaydı: {$user['email']}",
            'metadata' => [
                'email' => $user['email'],
                'nickname' => $user['nickname']
            ]
        ]);
    }
    
    /**
     * Kullanıcı girişi logla
     * 
     * @param array $user Kullanıcı bilgileri
     * @return bool İşlem başarılı mı?
     */
    public function logLogin($user) {
        return $this->create([
            'user_id' => $user['id'],
            'action' => 'login',
            'description' => "Kullanıcı girişi: {$user['email']}",
            'metadata' => [
                'email' => $user['email']
            ]
        ]);
    }
    
    /**
     * Başarısız giriş denemesi logla
     * 
     * @param string $email E-posta adresi
     * @param string $reason Başarısız sebep
     * @return bool İşlem başarılı mı?
     */
    public function logFailedLogin($email, $reason = 'Geçersiz kimlik bilgileri') {
        return $this->create([
            'user_id' => null,
            'action' => 'failed_login',
            'description' => "Başarısız giriş denemesi: {$email}",
            'metadata' => [
                'email' => $email,
                'reason' => $reason
            ]
        ]);
    }
    
    /**
     * Çıkış işlemini logla
     * 
     * @param array $user Kullanıcı bilgileri
     * @return bool İşlem başarılı mı?
     */
    public function logLogout($user) {
        return $this->create([
            'user_id' => $user['id'],
            'action' => 'logout',
            'description' => "Kullanıcı çıkışı: {$user['email']}",
            'metadata' => [
                'email' => $user['email']
            ]
        ]);
    }
}
