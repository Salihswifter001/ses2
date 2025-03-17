<?php
/**
 * register.php - Kullanıcı kayıt API endpoint'i
 * 
 * POST /api/auth/register
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
if (!$validator->validateRegistration($data)) {
    Response::validationError($validator->getErrors());
}

try {
    $userModel = new User();
    
    // E-posta adresi zaten kullanılıyor mu?
    $existingEmail = $userModel->findByEmail($data['email']);
    if ($existingEmail) {
        Response::error('Bu e-posta adresi zaten kullanılıyor', 400);
    }
    
    // Kullanıcı adı zaten kullanılıyor mu?
    $existingNickname = $userModel->findByNickname($data['nickname']);
    if ($existingNickname) {
        Response::error('Bu kullanıcı adı zaten kullanılıyor', 400);
    }
    
    // Kullanıcıyı oluştur
    $user = $userModel->create([
        'nickname' => $data['nickname'],
        'email' => $data['email'],
        'password' => $data['password'],
        'country_code' => $data['country_code'],
        'phone' => $data['phone'],
        'security_question' => $data['security_question'],
        'security_answer' => $data['security_answer']
    ]);
    
    if (!$user) {
        Response::error('Kullanıcı oluşturulamadı', 500);
    }
    
    // Kayıt işlemini logla
    $activityLogModel = new ActivityLog();
    $activityLogModel->logRegistration($user);
    
    // Token yanıtı oluştur ve gönder
    $tokenResponse = Auth::sendTokenResponse($user);
    Response::success($tokenResponse, 'Kayıt başarılı', 201);
    
} catch (Exception $e) {
    error_log('Kayıt hatası: ' . $e->getMessage());
    Response::serverError('Kayıt sırasında bir hata oluştu');
}
