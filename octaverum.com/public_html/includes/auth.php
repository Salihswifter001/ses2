<?php
/**
 * Auth.php - Kimlik doğrulama yardımcı sınıfı
 * 
 * JWT kullanarak kimlik doğrulama, şifre yönetimi ve yetkilendirme işlemleri.
 */

require_once __DIR__ . '/jwt.php';
require_once __DIR__ . '/response.php';
require_once __DIR__ . '/../models/User.php';
require_once __DIR__ . '/../models/Token.php';

class Auth {
    /**
     * Kullanıcı kimliğini doğrula
     * 
     * @return array Kimliği doğrulanmış kullanıcı bilgileri
     */
    public static function authenticate() {
        $token = self::getBearerToken();
        
        if (!$token) {
            Response::error('Bu işlem için giriş yapmanız gerekiyor', 401);
        }
        
        $decoded = JWTHandler::verifyAccessToken($token);
        
        if (!$decoded) {
            Response::error('Geçersiz token, lütfen tekrar giriş yapın', 401);
        }
        
        $userModel = new User();
        $user = $userModel->findById($decoded->id);
        
        if (!$user) {
            Response::error('Kullanıcı bulunamadı', 404);
        }
        
        return $user;
    }
    
    /**
     * Kullanıcı yetkilerini kontrol et
     * 
     * @param array $roles İzin verilen roller
     * @return array Yetkilendirilmiş kullanıcı bilgileri
     */
    public static function authorize($roles = ['admin']) {
        $user = self::authenticate();
        
        if (!in_array($user['role'], $roles)) {
            Response::error('Bu işlem için yetkiniz bulunmuyor', 403);
        }
        
        return $user;
    }
    
    /**
     * HTTP başlığından Bearer token'ı al
     * 
     * @return string|null Bearer token
     */
    public static function getBearerToken() {
        $headers = null;
        
        if (isset($_SERVER['Authorization'])) {
            $headers = trim($_SERVER['Authorization']);
        } elseif (isset($_SERVER['HTTP_AUTHORIZATION'])) {
            $headers = trim($_SERVER['HTTP_AUTHORIZATION']);
        } elseif (function_exists('apache_request_headers')) {
            $requestHeaders = apache_request_headers();
            $requestHeaders = array_combine(
                array_map('ucwords', array_keys($requestHeaders)),
                array_values($requestHeaders)
            );
            
            if (isset($requestHeaders['Authorization'])) {
                $headers = trim($requestHeaders['Authorization']);
            }
        }
        
        if (!$headers) {
            return null;
        }
        
        if (preg_match('/Bearer\s(\S+)/', $headers, $matches)) {
            return $matches[1];
        }
        
        return null;
    }
    
    /**
     * Şifre hash'leme
     * 
     * @param string $password Şifre
     * @return string Hash'lenmiş şifre
     */
    public static function hashPassword($password) {
        return password_hash($password, PASSWORD_BCRYPT, ['cost' => 10]);
    }
    
    /**
     * Şifre doğrulama
     * 
     * @param string $password Şifre
     * @param string $hash Hash'lenmiş şifre
     * @return bool Şifre doğru mu?
     */
    public static function verifyPassword($password, $hash) {
        return password_verify($password, $hash);
    }
    
    /**
     * Token yanıtı oluşturma
     * 
     * @param array $user Kullanıcı bilgileri
     * @return array Token yanıtı
     */
    public static function sendTokenResponse($user) {
        // Access ve refresh token oluştur
        $accessToken = JWTHandler::generateAccessToken($user['id']);
        $refreshToken = JWTHandler::generateRefreshToken($user['id']);
        
        // Refresh token'ı veritabanına kaydet
        $tokenModel = new Token();
        $expiresAt = date('Y-m-d H:i:s', time() + JWT_REFRESH_EXPIRE);
        $tokenModel->create([
            'user_id' => $user['id'],
            'token' => $refreshToken,
            'type' => 'refresh',
            'expires_at' => $expiresAt
        ]);
        
        // Hassas bilgileri kullanıcı objesinden çıkar
        unset($user['password']);
        unset($user['security_answer']);
        
        return [
            'accessToken' => $accessToken,
            'refreshToken' => $refreshToken,
            'user' => $user,
            'expiresIn' => JWT_EXPIRE
        ];
    }
}
