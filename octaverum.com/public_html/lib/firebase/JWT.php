<?php
/**
 * jwt.php - JWT oluşturma ve doğrulama sınıfı
 * 
 * Harici kütüphane olmadan JWT token oluşturma ve doğrulama işlemleri.
 * Firebase JWT kütüphanesi kullanmadan doğrudan implementasyon yapılmıştır.
 */

require_once __DIR__ . '/../config/config.php';

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
        
        return self::encode($payload, JWT_SECRET);
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
        
        return self::encode($payload, JWT_REFRESH_SECRET);
    }
    
    /**
     * Access token doğrulama
     * 
     * @param string $token Doğrulanacak token
     * @return object|null Doğrulama başarılıysa payload, değilse null
     */
    public static function verifyAccessToken($token) {
        try {
            $decoded = self::decode($token, JWT_SECRET);
            return $decoded;
        } catch (\Exception $e) {
            // Hata detaylarını loglama
            error_log("Token doğrulama hatası: " . $e->getMessage());
            
            // Hata türüne göre daha spesifik işlemler yapılabilir
            if (strpos($e->getMessage(), 'Token süresi dolmuş') !== false) {
                // Token süresi dolmuş
                error_log("Token süresi dolmuş: " . $token);
            } elseif (strpos($e->getMessage(), 'İmza doğrulanamadı') !== false) {
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
            $decoded = self::decode($token, JWT_REFRESH_SECRET);
            return $decoded;
        } catch (\Exception $e) {
            error_log("Refresh token doğrulama hatası: " . $e->getMessage());
            return null;
        }
    }
    
    /**
     * JWT token oluşturma
     * 
     * @param array $payload Token verileri
     * @param string $key İmza için anahtar
     * @param string $alg Algoritma (HS256 desteklenir)
     * @return string JWT token
     */
    private static function encode($payload, $key, $alg = 'HS256') {
        $header = ['typ' => 'JWT', 'alg' => $alg];
        
        $base64UrlHeader = self::base64UrlEncode(json_encode($header));
        $base64UrlPayload = self::base64UrlEncode(json_encode($payload));
        $signature = self::sign("$base64UrlHeader.$base64UrlPayload", $key, $alg);
        $base64UrlSignature = self::base64UrlEncode($signature);
        
        return "$base64UrlHeader.$base64UrlPayload.$base64UrlSignature";
    }
    
    /**
     * JWT token doğrulama ve çözme
     * 
     * @param string $jwt JWT token
     * @param string $key İmza doğrulama için anahtar
     * @param string $alg Algoritma (HS256 desteklenir)
     * @return object Doğrulanan ve çözülen token verileri
     * @throws Exception Token geçersizse veya süresi dolmuşsa
     */
    private static function decode($jwt, $key, $alg = 'HS256') {
        $parts = explode('.', $jwt);
        if (count($parts) != 3) {
            throw new \Exception('Geçersiz JWT formatı');
        }
        
        list($base64UrlHeader, $base64UrlPayload, $base64UrlSignature) = $parts;
        
        // İmza doğrulama
        $signature = self::base64UrlDecode($base64UrlSignature);
        $rawSignature = self::sign("$base64UrlHeader.$base64UrlPayload", $key, $alg);
        
        if (!self::constantTimeEquals($signature, $rawSignature)) {
            throw new \Exception('İmza doğrulanamadı');
        }
        
        // Payload çözme
        $payload = json_decode(self::base64UrlDecode($base64UrlPayload), true);
        
        // Süre kontrolü
        if (isset($payload['exp']) && $payload['exp'] < time()) {
            throw new \Exception('Token süresi dolmuş');
        }
        
        return (object) $payload;
    }
    
    /**
     * İmza oluşturma
     * 
     * @param string $msg İmzalanacak mesaj
     * @param string $key İmza anahtarı
     * @param string $alg İmza algoritması
     * @return string İmza
     * @throws Exception Desteklenmeyen algoritma
     */
    private static function sign($msg, $key, $alg) {
        switch ($alg) {
            case 'HS256':
                return hash_hmac('sha256', $msg, $key, true);
            default:
                throw new \Exception('Desteklenmeyen algoritma');
        }
    }
    
    /**
     * Base64Url encoding
     * 
     * @param string $data Kodlanacak veri
     * @return string Kodlanmış veri
     */
    private static function base64UrlEncode($data) {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }
    
    /**
     * Base64Url decoding
     * 
     * @param string $data Çözülecek veri
     * @return string Çözülmüş veri
     */
    private static function base64UrlDecode($data) {
        $base64 = strtr($data, '-_', '+/');
        $paddings = 4 - strlen($base64) % 4;
        if ($paddings < 4) {
            $base64 .= str_repeat('=', $paddings);
        }
        return base64_decode($base64);
    }
    
    /**
     * Zaman sabiti karşılaştırma (Timing attack'lara karşı koruma)
     * 
     * @param string $a Karşılaştırılacak ilk değer
     * @param string $b Karşılaştırılacak ikinci değer
     * @return bool Eşit mi?
     */
    private static function constantTimeEquals($a, $b) {
        if (strlen($a) !== strlen($b)) {
            return false;
        }
        $result = 0;
        for ($i = 0; $i < strlen($a); $i++) {
            $result |= ord($a[$i]) ^ ord($b[$i]);
        }
        return $result === 0;
    }
}