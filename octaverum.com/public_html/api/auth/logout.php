<?php
/**
 * logout.php - Kullanıcı çıkış işlemini gerçekleştirir
 * 
 * POST /api/auth/logout
 */

// Gerekli dosyaları dahil et
require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../../includes/database.php';
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

try {
    // Kullanıcıyı doğrula (çıkış yapabilmek için giriş yapmış olmalı)
    $user = Auth::authenticate();
    
    // JSON verilerini al
    $data = json_decode(file_get_contents('php://input'), true);
    
    // Refresh token'ı kontrol et
    $refreshToken = null;
    
    if ($data && isset($data['refreshToken'])) {
        $refreshToken = $data['refreshToken'];
    }
    
    // Eğer refresh token sağlanmışsa, bu token'ı veritabanında iptal et
    if ($refreshToken) {
        $tokenModel = new Token();
        
        try {
            // Token iptal işlemi
            $tokenModel->revokeToken($refreshToken, 'refresh');
        } catch (Exception $e) {
            // Token iptali sırasında hata oluşursa loglayalım ama hatayı dışarı yansıtmayalım
            $logger->error('Token iptali sırasında hata: ' . $e->getMessage());
        }
    }
    
    // İsteğe bağlı olarak, kullanıcıya ait tüm refresh token'ları iptal et
    // Bu, "tüm cihazlardan çıkış yap" fonksiyonu için kullanılabilir
    if ($data && isset($data['logoutFromAllDevices']) && $data['logoutFromAllDevices'] === true) {
        $tokenModel = new Token();
        
        try {
            // Tüm tokenları iptal et
            $tokenModel->revokeAllUserTokens($user['id'], 'refresh');
        } catch (Exception $e) {
            $logger->error('Tüm token iptali sırasında hata: ' . $e->getMessage());
        }
    }
    
    // Kullanıcının çıkış yaptığını logla
    $activityLogModel = new ActivityLog();
    $activityLogModel->create([
        'user_id' => $user['id'],
        'action' => 'logout',
        'description' => "Kullanıcı çıkış yaptı: {$user['email']}",
        'metadata' => [
            'email' => $user['email']
        ]
    ]);
    
    // Başarılı yanıt gönder
    Response::success(null, 'Başarıyla çıkış yapıldı');
    
} catch (Exception $e) {
    // Hatayı logla
    $logger->exception($e);
    
    // Eğer doğrulama hatası ise, zaten oturum açmamış demektir
    // Bu durumda başarılı yanıt gönderelim
    if ($e->getMessage() === 'Bu işlem için giriş yapmanız gerekiyor' || 
        $e->getMessage() === 'Geçersiz token, lütfen tekrar giriş yapın') {
        Response::success(null, 'Başarıyla çıkış yapıldı');
    } else {
        Response::serverError('Çıkış yapılırken bir hata oluştu');
    }
}
