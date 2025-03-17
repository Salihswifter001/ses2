<?php
/**
 * Validation.php - Girdi doğrulama yardımcı sınıfı
 * 
 * Kullanıcı girdilerini doğrulamak için kullanılır.
 */

class Validation {
    private $errors = [];
    
    /**
     * E-posta doğrulama
     * 
     * @param string $email E-posta adresi
     * @param string $field Alan adı
     * @return bool Geçerli mi?
     */
    public function email($email, $field = 'email') {
        if (empty($email)) {
            $this->errors[$field] = 'E-posta adresi gereklidir';
            return false;
        }
        
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $this->errors[$field] = 'Geçerli bir e-posta adresi giriniz';
            return false;
        }
        
        return true;
    }
    
    /**
     * Şifre doğrulama
     * 
     * @param string $password Şifre
     * @param string $field Alan adı
     * @return bool Geçerli mi?
     */
    public function password($password, $field = 'password') {
        if (empty($password)) {
            $this->errors[$field] = 'Şifre gereklidir';
            return false;
        }
        
        // En az 8 karakter
        if (strlen($password) < 8) {
            $this->errors[$field] = 'Şifre en az 8 karakter olmalıdır';
            return false;
        }
        
        // En az bir büyük harf
        if (!preg_match('/[A-Z]/', $password)) {
            $this->errors[$field] = 'Şifre en az bir büyük harf içermelidir';
            return false;
        }
        
        // En az bir küçük harf
        if (!preg_match('/[a-z]/', $password)) {
            $this->errors[$field] = 'Şifre en az bir küçük harf içermelidir';
            return false;
        }
        
        // En az bir rakam
        if (!preg_match('/[0-9]/', $password)) {
            $this->errors[$field] = 'Şifre en az bir rakam içermelidir';
            return false;
        }
        
        // En az bir özel karakter
        if (!preg_match('/[!@#$%^&*(),.?":{}|<>]/', $password)) {
            $this->errors[$field] = 'Şifre en az bir özel karakter içermelidir';
            return false;
        }
        
        return true;
    }
    
    /**
     * Şifre eşleşme doğrulama
     * 
     * @param string $password Şifre
     * @param string $confirmPassword Şifre tekrarı
     * @param string $field Alan adı
     * @return bool Geçerli mi?
     */
    public function passwordsMatch($password, $confirmPassword, $field = 'password2') {
        if ($password !== $confirmPassword) {
            $this->errors[$field] = 'Şifreler eşleşmiyor';
            return false;
        }
        
        return true;
    }
    
    /**
     * Kullanıcı adı doğrulama
     * 
     * @param string $nickname Kullanıcı adı
     * @param string $field Alan adı
     * @return bool Geçerli mi?
     */
    public function nickname($nickname, $field = 'nickname') {
        if (empty($nickname)) {
            $this->errors[$field] = 'Kullanıcı adı gereklidir';
            return false;
        }
        
        // En az 3, en fazla 30 karakter
        if (strlen($nickname) < 3 || strlen($nickname) > 30) {
            $this->errors[$field] = 'Kullanıcı adı 3-30 karakter arasında olmalıdır';
            return false;
        }
        
        // Sadece harf, rakam ve alt çizgi
        if (!preg_match('/^[a-zA-Z0-9_]+$/', $nickname)) {
            $this->errors[$field] = 'Kullanıcı adı sadece harf, rakam ve alt çizgi içerebilir';
            return false;
        }
        
        // Yasaklı kullanıcı adları
        $bannedUsernames = [
            'admin', 'administrator', 'moderator', 'support',
            'helpdesk', 'system', 'webmaster', 'octaverum'
        ];
        
        if (in_array(strtolower($nickname), $bannedUsernames)) {
            $this->errors[$field] = 'Bu kullanıcı adı kullanılamaz';
            return false;
        }
        
        return true;
    }
    
    /**
     * Telefon numarası doğrulama
     * 
     * @param string $phone Telefon numarası
     * @param string $field Alan adı
     * @return bool Geçerli mi?
     */
    public function phone($phone, $field = 'phone') {
        if (empty($phone)) {
            $this->errors[$field] = 'Telefon numarası gereklidir';
            return false;
        }
        
        // Sadece rakam ve bazı özel karakterler
        if (!preg_match('/^[0-9+\-\s()]*$/', $phone)) {
            $this->errors[$field] = 'Geçerli bir telefon numarası giriniz';
            return false;
        }
        
        return true;
    }
    
    /**
     * Boş olmama kontrolü
     * 
     * @param string $value Değer
     * @param string $field Alan adı
     * @param string $message Hata mesajı
     * @return bool Geçerli mi?
     */
    public function required($value, $field, $message = null) {
        if (empty($value)) {
            $this->errors[$field] = $message ?? "Bu alan gereklidir";
            return false;
        }
        
        return true;
    }
    
    /**
     * Özel karakter temizleme
     * 
     * @param string $value Temizlenecek değer
     * @return string Temizlenmiş değer
     */
    public function sanitize($value) {
        if (is_string($value)) {
            // HTML ve PHP taglerini temizle
            $value = strip_tags($value);
            
            // Başındaki ve sonundaki boşlukları temizle
            $value = trim($value);
            
            // htmlspecialchars ile güvenli hale getir
            $value = htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
        }
        
        return $value;
    }
    
    /**
     * SQL Injection karşıtı temizleme
     * 
     * @param string $value Temizlenecek değer
     * @return string Temizlenmiş değer
     */
    public function sanitizeSql($value) {
        if (is_string($value)) {
            // Tehlikeli SQL kalıplarını kontrol et
            $sqlPatterns = [
                '/(\%27)|(\')|(\-\-)|(\%23)|(#)/',
                '/((\%3D)|(=))[^\n]*((\%27)|(\')|(\-\-)|(\%3B)|(;))/',
                '/\w*((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/'
            ];
            
            foreach ($sqlPatterns as $pattern) {
                if (preg_match($pattern, $value)) {
                    return '';
                }
            }
        }
        
        return $value;
    }
    
    /**
     * Tüm hataları getir
     * 
     * @return array Hatalar
     */
    public function getErrors() {
        return $this->errors;
    }
    
    /**
     * İlk hatayı getir
     * 
     * @return string|null İlk hata
     */
    public function getFirstError() {
        return !empty($this->errors) ? reset($this->errors) : null;
    }
    
    /**
     * Hata var mı?
     * 
     * @return bool Hata var mı?
     */
    public function hasErrors() {
        return !empty($this->errors);
    }
    
    /**
     * Kullanıcı kaydı için tüm alanları doğrula
     * 
     * @param array $data Doğrulanacak veriler
     * @return bool Tüm alanlar geçerli mi?
     */
    public function validateRegistration($data) {
        $this->errors = [];
        
        $this->nickname($data['nickname'] ?? '');
        $this->email($data['email'] ?? '');
        $this->password($data['password'] ?? '');
        $this->passwordsMatch($data['password'] ?? '', $data['password2'] ?? '');
        $this->required($data['country_code'] ?? '', 'country_code', 'Ülke kodu gereklidir');
        $this->phone($data['phone'] ?? '');
        $this->required($data['security_question'] ?? '', 'security_question', 'Güvenlik sorusu gereklidir');
        $this->required($data['security_answer'] ?? '', 'security_answer', 'Güvenlik sorusu cevabı gereklidir');
        
        return !$this->hasErrors();
    }
    
    /**
     * Kullanıcı girişi için alanları doğrula
     * 
     * @param array $data Doğrulanacak veriler
     * @return bool Tüm alanlar geçerli mi?
     */
    public function validateLogin($data) {
        $this->errors = [];
        
        $this->email($data['email'] ?? '');
        $this->required($data['password'] ?? '', 'password', 'Şifre gereklidir');
        
        return !$this->hasErrors();
    }
}
