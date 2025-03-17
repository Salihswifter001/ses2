<?php
/**
 * JWTHandler.php - JWT oluşturma ve doğrulama sınıfı
 * 
 * Firebase JWT kütüphanesi kullanarak JWT token oluşturma ve doğrulama işlemleri.
 */

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../vendor/autoload.php';
use \Firebase\JWT\JWT;
use \Firebase\JWT\Key;

class JWTHandler {
    /**
     * Access token oluşturma
     * 
     * @param int $userId Kullanıcı ID'si
     * @return string JWT token
     */
    public static function generateAccessToken($userId) {
        $issuedAt = time();
        $expire = $issuedAt + JWT_EXPIRE;
        
        $payload = [
            'iat' => $issuedAt,  // Oluşturulma zamanı
            'exp' => $expire,    // Sona erme zamanı
            'id' => $userId      // Kullanıcı ID'si
        ];
        
        return JWT::encode($payload, JWT_SECRET, 'HS256');
    }
    
    /**
     * Refresh token oluşturma
     * 
     * @param int $userId Kullanıcı ID'si
     * @return string JWT refresh token
     */
    public static function generateRefreshToken($userId) {
        $issuedAt = time();
        $expire = $issuedAt + JWT_REFRESH_EXPIRE;
        
        $payload = [
            'iat' => $issuedAt,  // Oluşturulma zamanı
            'exp' => $expire,    // Sona erme zamanı
            'id' => $userId      // Kullanıcı ID'si
        ];
        
        return JWT::encode($payload, JWT_REFRESH_SECRET, 'HS256');
    }
    
    /**
     * Access token doğrulama
     * 
     * @param string $token Doğrulanacak token
     * @return object|null Doğrulama başarılıysa payload, değilse null
     */
    public static function verifyAccessToken($token) {
        try {
            $decoded = JWT::decode($token, new Key(JWT_SECRET, 'HS256'));
            return $decoded;
        } catch (\Exception $e) {
            // Hata detaylarını loglama
            error_log("Token doğrulama hatası: " . $e->getMessage());
            
            // Hata türüne göre daha spesifik işlemler yapılabilir
            if ($e instanceof \Firebase\JWT\ExpiredException) {
                // Token süresi dolmuş
                error_log("Token süresi dolmuş: " . $token);
            } elseif ($e instanceof \Firebase\JWT\SignatureInvalidException) {
                // Token imzası geçersiz
                error_log("Token imzası geçersiz: " . $token);
            }
            
            return null;
        }
    }
    
    /**
     * Refresh token doğrulama
     * 
     * @param string $token Doğrulanacak refresh token
     * @return object|null Doğrulama başarılıysa payload, değilse null
     */
    public static function verifyRefreshToken($token) {
        try {
            $decoded = JWT::decode($token, new Key(JWT_REFRESH_SECRET, 'HS256'));
            return $decoded;
        } catch (\Exception $e) {
            error_log("Refresh token doğrulama hatası: " . $e->getMessage());
            return null;
        }
    }
}
