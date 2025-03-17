<?php
/**
 * User.php - Kullanıcı model sınıfı
 * 
 * Kullanıcı verilerini yönetmek için kullanılır.
 */

require_once __DIR__ . '/../includes/database.php';
require_once __DIR__ . '/../includes/auth.php';

class User {
    private $db;
    private $table = 'users';
    
    /**
     * Yapıcı metod
     */
    public function __construct() {
        $this->db = Database::getInstance();
    }
    
    /**
     * Kullanıcı oluştur
     * 
     * @param array $userData Kullanıcı verileri
     * @return array|bool Oluşturulan kullanıcı verileri veya false
     */
    public function create($userData) {
        try {
            // Şifreyi hash'le
            $userData['password'] = Auth::hashPassword($userData['password']);
            
            $sql = "INSERT INTO " . $this->table . " (
                    nickname, 
                    email, 
                    password, 
                    country_code, 
                    phone, 
                    security_question, 
                    security_answer
                ) VALUES (
                    :nickname, 
                    :email, 
                    :password, 
                    :country_code, 
                    :phone, 
                    :security_question, 
                    :security_answer
                )";
            
            $this->db->query($sql, [
                ':nickname' => $userData['nickname'],
                ':email' => $userData['email'],
                ':password' => $userData['password'],
                ':country_code' => $userData['country_code'],
                ':phone' => $userData['phone'],
                ':security_question' => $userData['security_question'],
                ':security_answer' => $userData['security_answer']
            ]);
            
            $id = $this->db->lastInsertId();
            return $this->findById($id);
        } catch (Exception $e) {
            error_log("Kullanıcı oluşturma hatası: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * ID ile kullanıcı bul
     * 
     * @param int $id Kullanıcı ID'si
     * @return array|null Kullanıcı verisi veya null
     */
    public function findById($id) {
        $sql = "SELECT * FROM " . $this->table . " WHERE id = :id";
        return $this->db->fetchOne($sql, [':id' => $id]);
    }
    
    /**
     * E-posta ile kullanıcı bul
     * 
     * @param string $email E-posta
     * @return array|null Kullanıcı verisi veya null
     */
    public function findByEmail($email) {
        $sql = "SELECT * FROM " . $this->table . " WHERE email = :email";
        return $this->db->fetchOne($sql, [':email' => $email]);
    }
    
    /**
     * Kullanıcı adı ile kullanıcı bul
     * 
     * @param string $nickname Kullanıcı adı
     * @return array|null Kullanıcı verisi veya null
     */
    public function findByNickname($nickname) {
        $sql = "SELECT * FROM " . $this->table . " WHERE nickname = :nickname";
        return $this->db->fetchOne($sql, [':nickname' => $nickname]);
    }
    
    /**
     * Tüm kullanıcıları getir
     * 
     * @param int $limit Sayfa limiti
     * @param int $offset Başlangıç noktası
     * @return array Kullanıcı verileri
     */
    public function getAll($limit = 10, $offset = 0) {
        $sql = "SELECT * FROM " . $this->table . " ORDER BY created_at DESC LIMIT :limit OFFSET :offset";
        return $this->db->fetchAll($sql, [':limit' => (int)$limit, ':offset' => (int)$offset]);
    }
    
    /**
     * Toplam kullanıcı sayısını getir
     * 
     * @return int Kullanıcı sayısı
     */
    public function count() {
        $sql = "SELECT COUNT(*) as count FROM " . $this->table;
        $result = $this->db->fetchOne($sql);
        return (int)$result['count'];
    }
    
    /**
     * Kullanıcı güncelle
     * 
     * @param int $id Kullanıcı ID'si
     * @param array $userData Güncellenecek kullanıcı verileri
     * @return array|bool Güncellenmiş kullanıcı verileri veya false
     */
    public function update($id, $userData) {
        try {
            $updateFields = [];
            $params = [':id' => $id];
            
            // Güncellenecek alanları hazırla
            foreach ($userData as $key => $value) {
                if ($key !== 'id' && $key !== 'password' && $key !== 'email') {
                    $updateFields[] = "$key = :$key";
                    $params[":$key"] = $value;
                }
            }
            
            if (empty($updateFields)) {
                return false;
            }
            
            $sql = "UPDATE " . $this->table . " SET " . implode(', ', $updateFields) . ", updated_at = NOW() WHERE id = :id";
            $this->db->query($sql, $params);
            
            return $this->findById($id);
        } catch (Exception $e) {
            error_log("Kullanıcı güncelleme hatası: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Şifre güncelle
     * 
     * @param int $id Kullanıcı ID'si
     * @param string $newPassword Yeni şifre
     * @return bool İşlem başarılı mı?
     */
    public function updatePassword($id, $newPassword) {
        try {
            $hashedPassword = Auth::hashPassword($newPassword);
            
            $sql = "UPDATE " . $this->table . " SET password = :password, updated_at = NOW() WHERE id = :id";
            $this->db->query($sql, [':password' => $hashedPassword, ':id' => $id]);
            
            return true;
        } catch (Exception $e) {
            error_log("Şifre güncelleme hatası: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Abonelik güncelle
     * 
     * @param int $id Kullanıcı ID'si
     * @param string $plan Abonelik planı
     * @return array|bool Güncellenmiş kullanıcı verileri veya false
     */
    public function updateSubscription($id, $plan) {
        try {
            $validPlans = ['free', 'starter', 'plus', 'pro'];
            
            if (!in_array($plan, $validPlans)) {
                return false;
            }
            
            $startDate = date('Y-m-d H:i:s');
            $endDate = date('Y-m-d H:i:s', strtotime('+1 month'));
            
            $sql = "UPDATE " . $this->table . " 
                    SET subscription_plan = :plan, 
                        subscription_start_date = :start_date, 
                        subscription_end_date = :end_date,
                        updated_at = NOW()
                    WHERE id = :id";
            
            $this->db->query($sql, [
                ':plan' => $plan,
                ':start_date' => $startDate,
                ':end_date' => $endDate,
                ':id' => $id
            ]);
            
            return $this->findById($id);
        } catch (Exception $e) {
            error_log("Abonelik güncelleme hatası: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Kullanıcı sil
     * 
     * @param int $id Kullanıcı ID'si
     * @return bool İşlem başarılı mı?
     */
    public function delete($id) {
        try {
            $sql = "DELETE FROM " . $this->table . " WHERE id = :id";
            $this->db->query($sql, [':id' => $id]);
            return true;
        } catch (Exception $e) {
            error_log("Kullanıcı silme hatası: " . $e->getMessage());
            return false;
        }
    }
}
