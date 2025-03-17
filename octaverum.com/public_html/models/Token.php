<?php
/**
 * Token.php - Token model sınıfı
 * 
 * Token verilerini yönetmek için kullanılır.
 * Refresh token ve şifre sıfırlama token'larını saklar.
 */

require_once __DIR__ . '/../includes/database.php';

class Token {
    private $db;
    private $table = 'tokens';
    
    /**
     * Yapıcı metod
     */
    public function __construct() {
        $this->db = Database::getInstance();
    }
    
    /**
     * Token oluştur
     * 
     * @param array $tokenData Token verileri
     * @return bool İşlem başarılı mı?
     */
    public function create($tokenData) {
        try {
            $sql = "INSERT INTO " . $this->table . " (
                    user_id, 
                    token, 
                    type, 
                    expires_at
                ) VALUES (
                    :user_id, 
                    :token, 
                    :type, 
                    :expires_at
                )";
            
            $this->db->query($sql, [
                ':user_id' => $tokenData['user_id'],
                ':token' => $tokenData['token'],
                ':type' => $tokenData['type'],
                ':expires_at' => $tokenData['expires_at']
            ]);
            
            return true;
        } catch (Exception $e) {
            error_log("Token oluşturma hatası: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Token değeri ile token bul
     * 
     * @param string $token Token değeri
     * @param string $type Token türü (refresh, reset)
     * @return array|null Token verisi veya null
     */
    public function findByToken($token, $type) {
        $sql = "SELECT * FROM " . $this->table . " 
                WHERE token = :token 
                AND type = :type 
                AND is_revoked = 0 
                AND expires_at > NOW()";
                
        return $this->db->fetchOne($sql, [':token' => $token, ':type' => $type]);
    }
    
    /**
     * Kullanıcıya ait token'ları bul
     * 
     * @param int $userId Kullanıcı ID'si
     * @param string $type Token türü (refresh, reset)
     * @return array Token verileri
     */
    public function findByUserId($userId, $type = null) {
        $params = [':user_id' => $userId];
        $typeCondition = "";
        
        if ($type) {
            $typeCondition = "AND type = :type";
            $params[':type'] = $type;
        }
        
        $sql = "SELECT * FROM " . $this->table . " 
                WHERE user_id = :user_id 
                {$typeCondition}
                ORDER BY created_at DESC";
                
        return $this->db->fetchAll($sql, $params);
    }
    
    /**
     * Token'ı kullanılmış olarak işaretle
     * 
     * @param string $token Token değeri
     * @param string $type Token türü (refresh, reset)
     * @return bool İşlem başarılı mı?
     */
    public function revokeToken($token, $type) {
        try {
            $sql = "UPDATE " . $this->table . " 
                    SET is_revoked = 1 
                    WHERE token = :token 
                    AND type = :type";
                    
            $this->db->query($sql, [':token' => $token, ':type' => $type]);
            return true;
        } catch (Exception $e) {
            error_log("Token iptal hatası: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Kullanıcıya ait tüm token'ları kullanılmış olarak işaretle
     * 
     * @param int $userId Kullanıcı ID'si
     * @param string $type Token türü (refresh, reset)
     * @return bool İşlem başarılı mı?
     */
    public function revokeAllUserTokens($userId, $type = 'refresh') {
        try {
            $sql = "UPDATE " . $this->table . " 
                    SET is_revoked = 1 
                    WHERE user_id = :user_id 
                    AND type = :type";
                    
            $this->db->query($sql, [':user_id' => $userId, ':type' => $type]);
            return true;
        } catch (Exception $e) {
            error_log("Tüm kullanıcı token'larını iptal etme hatası: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Süresi dolmuş token'ları temizle
     * 
     * @return bool İşlem başarılı mı?
     */
    public function cleanupExpiredTokens() {
        try {
            $sql = "DELETE FROM " . $this->table . " 
                    WHERE expires_at < NOW() 
                    OR (is_revoked = 1 AND created_at < DATE_SUB(NOW(), INTERVAL 30 DAY))";
                    
            $this->db->query($sql);
            return true;
        } catch (Exception $e) {
            error_log("Süresi dolmuş token'ları temizleme hatası: " . $e->getMessage());
            return false;
        }
    }
}
