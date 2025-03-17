<?php
/**
 * refresh.php - Token yenileme API endpoint'i
 * 
 * POST /api/auth/refresh-token
 */

// Gerekli dosyaları dahil et
require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../../includes/database.php';
require_once __DIR__ . '/../../includes/validation.php';
require_once __DIR__ . '/../../includes/response.php';
require_once __DIR__ . '/../../includes/jwt.php';
require_once __DIR__ . '/../../models/User.php';
require_once __DIR__ . '/../../models/Token.php';

// Sadece POST isteklerine izin ver
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('Geçersiz istek metodu', 405);
}

// JSON verilerini al
$data = json_decode(file_get_contents('php://input'), true);

if (!$data || !isset($data['refreshToken'])) {
    Response::error('Refresh token gereklidir', 400);
}

$refreshToken = $data['refreshToken'];

try {
    // Refresh token'ı doğrula
    $decoded = JWTHandler::verifyRefreshToken($refreshToken);
    
    if (!$decoded) {
        Response::error('Geçersiz refresh token', 401);
    }
    
    // Veritabanında token'ı kontrol et
    $tokenModel = new Token();
    $storedToken = $tokenModel->findByToken($refreshToken, 'refresh');
    
    if (!$storedToken) {
        Response::error('Geçersiz veya iptal edilmiş token', 401);
    }
    
    // Token geçerlilik süresini kontrol et (veritabanındaki bilgiye göre)
    $tokenExpireDate = strtotime($storedToken['expires_at']);
    if ($tokenExpireDate < time()) {
        Response::error('Refresh token süresi dolmuş', 401);
    }
    
    // Kullanıcıyı bul
    $userModel = new User();
    $user = $userModel->findById($decoded->id);
    
    if (!$user) {
        Response::error('Kullanıcı bulunamadı', 404);
    }
    
    // Yeni access token oluştur
    $accessToken = JWTHandler::generateAccessToken($user['id']);
    
    Response::success([
        'accessToken' => $accessToken,
        'expiresIn' => JWT_EXPIRE
    ], 'Token yenilendi');
    
} catch (Exception $e) {
    error_log('Token yenileme hatası: ' . $e->getMessage());
    Response::serverError('Token yenileme sırasında bir hata oluştu');
}
