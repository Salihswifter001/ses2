<?php
/**
 * Response.php - API yanıt sınıfı
 * 
 * Standart API yanıtları oluşturur.
 */

class Response {
    /**
     * Başarılı yanıt
     * 
     * @param mixed $data Yanıt verileri
     * @param string $message Başarı mesajı
     * @param int $statusCode HTTP durum kodu
     * @return void
     */
    public static function success($data = null, $message = 'İşlem başarılı', $statusCode = 200) {
        self::setHeaders($statusCode);
        
        echo json_encode([
            'success' => true,
            'message' => $message,
            'data' => $data
        ]);
        
        exit;
    }
    
    /**
     * Hata yanıtı
     * 
     * @param string $message Hata mesajı
     * @param int $statusCode HTTP durum kodu
     * @param array $errors Hata detayları
     * @return void
     */
    public static function error($message = 'Bir hata oluştu', $statusCode = 400, $errors = null) {
        self::setHeaders($statusCode);
        
        $response = [
            'success' => false,
            'message' => $message
        ];
        
        if ($errors) {
            $response['errors'] = $errors;
        }
        
        echo json_encode($response);
        
        exit;
    }
    
    /**
     * Doğrulama hatası yanıtı
     * 
     * @param array $errors Doğrulama hataları
     * @param string $message Genel hata mesajı
     * @return void
     */
    public static function validationError($errors, $message = 'Doğrulama hatası') {
        self::error($message, 422, $errors);
    }
    
    /**
     * Yetkilendirme hatası yanıtı
     * 
     * @param string $message Hata mesajı
     * @return void
     */
    public static function unauthorized($message = 'Bu işlem için giriş yapmanız gerekiyor') {
        self::error($message, 401);
    }
    
    /**
     * Yetki hatası yanıtı
     * 
     * @param string $message Hata mesajı
     * @return void
     */
    public static function forbidden($message = 'Bu işlem için yetkiniz bulunmuyor') {
        self::error($message, 403);
    }
    
    /**
     * Bulunamadı hatası yanıtı
     * 
     * @param string $message Hata mesajı
     * @return void
     */
    public static function notFound($message = 'İstenen kaynak bulunamadı') {
        self::error($message, 404);
    }
    
    /**
     * Sunucu hatası yanıtı
     * 
     * @param string $message Hata mesajı
     * @param Exception $exception Hata nesnesi
     * @return void
     */
    public static function serverError($message = 'Sunucu hatası', $exception = null) {
        if ($exception) {
            error_log($exception->getMessage() . "\n" . $exception->getTraceAsString());
        }
        
        self::error($message, 500);
    }
    
    /**
     * HTTP başlıklarını ayarla
     * 
     * @param int $statusCode HTTP durum kodu
     * @return void
     */
    private static function setHeaders($statusCode) {
        header('Content-Type: application/json; charset=UTF-8');
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization');
        
        http_response_code($statusCode);
    }
}
