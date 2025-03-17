<?php
/**
 * me.php - Giriş yapmış kullanıcı bilgilerini getirir
 * 
 * GET /api/auth/me
 */

// Gerekli dosyaları dahil et
require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../../includes/database.php';
require_once __DIR__ . '/../../includes/response.php';
require_once __DIR__ . '/../../includes/auth.php';
require_once __DIR__ . '/../../includes/logger.php';
require_once __DIR__ . '/../../models/User.php';
require_once __DIR__ . '/../../models/ActivityLog.php';

// Sadece GET isteklerine izin ver
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    Response::error('Geçersiz istek metodu', 405);
}

try {
    // Kullanıcıyı doğrula (oturum açmış olmalı)
    $user = Auth::authenticate();
    
    // Hassas bilgileri çıkar
    unset($user['password']);
    unset($user['security_answer']);
    
    // Abonelik bilgilerini formatlayarak ekleyelim
    if (!empty($user['subscription_plan']) && $user['subscription_plan'] !== 'free') {
        $subscription = [
            'plan' => $user['subscription_plan'],
            'startDate' => $user['subscription_start_date'],
            'endDate' => $user['subscription_end_date'],
            'details' => null
        ];
        
        // Plan detaylarını getir
        if (defined('SUBSCRIPTION_PLANS') && isset(SUBSCRIPTION_PLANS[$user['subscription_plan']])) {
            $subscription['details'] = SUBSCRIPTION_PLANS[$user['subscription_plan']];
        }
        
        $user['subscription'] = $subscription;
    } else {
        $user['subscription'] = [
            'plan' => 'free',
            'details' => [
                'name' => 'Ücretsiz',
                'price' => 0,
                'features' => [
                    'dailyLimit' => 3,
                    'aiMusicLevel' => 'basic'
                ]
            ]
        ];
    }
    
    // Kullanıcı etkinliklerini günlüğe kaydet
    $activityLogModel = new ActivityLog();
    $activityLogModel->create([
        'user_id' => $user['id'],
        'action' => 'profile_view',
        'description' => "Kullanıcı profili görüntülendi: {$user['email']}",
        'metadata' => [
            'email' => $user['email']
        ]
    ]);
    
    // Başarılı yanıt gönder
    Response::success($user, 'Kullanıcı bilgileri başarıyla getirildi');
    
} catch (Exception $e) {
    // Hatayı logla
    $logger->exception($e);
    
    // Eğer doğrulama hatası ise 401, değilse 500 döndür
    if ($e->getMessage() === 'Bu işlem için giriş yapmanız gerekiyor' || 
        $e->getMessage() === 'Geçersiz token, lütfen tekrar giriş yapın') {
        Response::unauthorized($e->getMessage());
    } else {
        Response::serverError('Kullanıcı bilgileri alınırken bir hata oluştu');
    }
}
