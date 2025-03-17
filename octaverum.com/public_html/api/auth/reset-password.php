<?php
/**
 * reset-password.php - Şifre sıfırlama işlemleri
 * 
 * POST /api/auth/reset-password - Şifre sıfırlama bağlantısı gönder
 * POST /api/auth/reset-password/{token} - Şifre sıfırlama işlemi
 */

// Gerekli dosyaları dahil et
require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../../includes/database.php';
require_once __DIR__ . '/../../includes/validation.php';
require_once __DIR__ . '/../../includes/response.php';
require_once __DIR__ . '/../../includes/auth.php';
require_once __DIR__ . '/../../includes/logger.php';
require_once __DIR__ . '/../../models/User.php';
require_once __DIR__ . '/../../models/Token.php';
require_once __DIR__ . '/../../models/ActivityLog.php';

// Sadece POST isteklerine izin ver
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('Geçersiz istek metodu', 405);
}

// URL'den token bilgisini al
$pathParts = explode('/', trim($_SERVER['PATH_INFO'] ?? '', '/'));
$hasToken = count($pathParts) > 0 && $pathParts[count($pathParts) - 1] !== 'reset-password';

try {
    // JSON verilerini al
    $data = json_decode(file_get_contents('php://input'), true);

    if (!$data) {
        Response::error('Geçersiz JSON verileri', 400);
    }

    // Token varsa şifre sıfırlama işlemi yap
    if ($hasToken) {
        return resetPassword($pathParts[count($pathParts) - 1], $data);
    } else {
        // Yoksa şifre sıfırlama bağlantısı gönder
        return sendResetLink($data);
    }
} catch (Exception $e) {
    // Hatayı logla
    $logger->exception($e);
    Response::serverError('Şifre sıfırlama sırasında bir hata oluştu');
}

/**
 * Şifre sıfırlama bağlantısı gönder
 * 
 * @param array $data POST verileri
 * @return void
 */
function sendResetLink($data) {
    // E-posta doğrulaması
    $validator = new Validation();
    $validator->email($data['email'] ?? '');

    if ($validator->hasErrors()) {
        Response::validationError($validator->getErrors());
    }

    $email = $data['email'];

    // Kullanıcıyı e-posta ile bul
    $userModel = new User();
    $user = $userModel->findByEmail($email);

    if (!$user) {
        // Güvenlik nedeniyle, kullanıcı yoksa bile başarılı mesajı ver
        // böylece saldırganlar geçerli e-postaları tespit edemezler
        Response::success(null, 'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi');
    }

    // Benzersiz bir token oluştur
    $token = bin2hex(random_bytes(32));
    $tokenHash = hash('sha256', $token);

    // Token son kullanma tarihini hesapla (1 saat)
    $expiresAt = date('Y-m-d H:i:s', time() + 3600);

    // Token'ı veritabanına kaydet
    $tokenModel = new Token();
    $tokenModel->create([
        'user_id' => $user['id'],
        'token' => $tokenHash,
        'type' => 'reset',
        'expires_at' => $expiresAt
    ]);

    // Şifre sıfırlama URL'i oluştur
    $resetUrl = APP_URL . '/reset-password/' . $token;

    // NOT: Gerçek uygulamada e-posta gönderimi yapılmalı
    // Bu örnekte sadece bilgi veriyoruz
    
    // İşlemi logla
    $activityLogModel = new ActivityLog();
    $activityLogModel->create([
        'user_id' => $user['id'],
        'action' => 'password_reset',
        'description' => "Şifre sıfırlama bağlantısı istendi: {$email}",
        'metadata' => [
            'email' => $email,
            'expires_at' => $expiresAt
        ]
    ]);

    // Başarılı yanıt gönder
    Response::success([
        'resetUrl' => $resetUrl, // Gerçek uygulamada bu URL dönülmez, sadece geliştirme amaçlı
        'expiresIn' => '1 saat'
    ], 'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi');
}

/**
 * Şifre sıfırlama işlemi
 * 
 * @param string $token Şifre sıfırlama token'ı
 * @param array $data POST verileri
 * @return void
 */
function resetPassword($token, $data) {
    // Token ve şifre kontrolü
    if (!$token || !isset($data['password'])) {
        Response::error('Token ve yeni şifre gereklidir', 400);
    }

    // Şifre doğrulaması
    $validator = new Validation();
    $validator->password($data['password'] ?? '');
    
    // Şifre tekrarı kontrolü
    if (isset($data['password2']) && $data['password'] !== $data['password2']) {
        $validator->errors['password2'] = 'Şifreler eşleşmiyor';
    }
    
    if ($validator->hasErrors()) {
        Response::validationError($validator->getErrors());
    }

    // Token'ı hash'le
    $tokenHash = hash('sha256', $token);

    // Geçerli bir token olup olmadığını kontrol et
    $tokenModel = new Token();
    $resetToken = $tokenModel->findByToken($tokenHash, 'reset');

    if (!$resetToken) {
        Response::error('Geçersiz veya süresi dolmuş token', 400);
    }

    // Kullanıcıyı bul
    $userModel = new User();
    $user = $userModel->findById($resetToken['user_id']);

    if (!$user) {
        Response::error('Kullanıcı bulunamadı', 404);
    }

    // Şifreyi güncelle
    $result = $userModel->updatePassword($user['id'], $data['password']);
    
    if (!$result) {
        Response::error('Şifre güncellenemedi', 500);
    }

    // Token'ı kullanılmış olarak işaretle
    $tokenModel->revokeToken($tokenHash, 'reset');

    // İşlemi logla
    $activityLogModel = new ActivityLog();
    $activityLogModel->create([
        'user_id' => $user['id'],
        'action' => 'password_reset',
        'description' => "Şifre başarıyla sıfırlandı: {$user['email']}",
        'metadata' => [
            'email' => $user['email'],
            'method' => 'token'
        ]
    ]);

    // Başarılı yanıt gönder
    Response::success(null, 'Şifreniz başarıyla sıfırlandı');
}
