<?php
/**
 * login.php - Kullanıcı giriş API endpoint'i
 * 
 * POST /api/auth/login
 */

// Gerekli dosyaları dahil et
require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../../includes/database.php';
require_once __DIR__ . '/../../includes/validation.php';
require_once __DIR__ . '/../../includes/response.php';
require_once __DIR__ . '/../../includes/auth.php';
require_once __DIR__ . '/../../models/User.php';
require_once __DIR__ . '/../../models/ActivityLog.php';

// Sadece POST isteklerine izin ver
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('Geçersiz istek metodu', 405);
}

// JSON verilerini al
$data = json_decode(file_get_contents('php://input'), true);

if (!$data) {
    Response::error('Geçersiz JSON verileri', 400);
}

// Girdileri doğrula
$validator = new Validation();
if (!$validator->validateLogin($data)) {
    Response::validationError($validator->getErrors());
}

try {
    // Kullanıcıyı e-posta ile bul
    $userModel = new User();
    $user = $userModel->findByEmail($data['email']);
    
    // E-posta kontrolü
    if (!$user) {
        // Başarısız giriş logla
        $activityLogModel = new ActivityLog();
        $activityLogModel->logFailedLogin($data['email'], 'Kullanıcı bulunamadı');
        
        Response::error('Geçersiz e-posta veya şifre', 401);
    }
    
    // Başarısız giriş denemelerini kontrol et (brute force koruması)
    $activityLogModel = new ActivityLog();
    $failedAttempts = $activityLogModel->getFailedLoginAttempts($data['email'], 15); // Son 15 dakika
    
    if ($failedAttempts >= RATE_LIMIT_LOGIN_ATTEMPTS) {
        Response::error('Çok fazla başarısız giriş denemesi. Lütfen 15 dakika sonra tekrar deneyin.', 429);
    }
    
    // Şifre kontrolü
    if (!Auth::verifyPassword($data['password'], $user['password'])) {
        // Başarısız giriş logla
        $activityLogModel->logFailedLogin($data['email'], 'Geçersiz şifre');
        
        Response::error('Geçersiz e-posta veya şifre', 401);
    }
    
    // Başarılı giriş logla
    $activityLogModel->logLogin($user);
    
    // Token yanıtı oluştur ve gönder
    $tokenResponse = Auth::sendTokenResponse($user);
    Response::success($tokenResponse, 'Giriş başarılı');
    
} catch (Exception $e) {
    error_log('Giriş hatası: ' . $e->getMessage());
    Response::serverError('Giriş sırasında bir hata oluştu');
}
