<?php
/**
 * subscription.php - Abonelik güncelleme API endpoint'i
 * 
 * PUT /api/user/subscription
 */

// Gerekli dosyaları dahil et
require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../../includes/database.php';
require_once __DIR__ . '/../../includes/validation.php';
require_once __DIR__ . '/../../includes/response.php';
require_once __DIR__ . '/../../includes/auth.php';
require_once __DIR__ . '/../../models/User.php';
require_once __DIR__ . '/../../models/ActivityLog.php';

// Sadece PUT isteklerine izin ver
if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    Response::error('Geçersiz istek metodu', 405);
}

try {
    // Kullanıcıyı doğrula
    $user = Auth::authenticate();
    
    // JSON verilerini al
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!$data || !isset($data['plan'])) {
        Response::error('Plan bilgisi gereklidir', 400);
    }
    
    $plan = $data['plan'];
    
    // Geçerli bir plan mı kontrol et
    $validPlans = ['free', 'starter', 'plus', 'pro'];
    if (!in_array($plan, $validPlans)) {
        Response::error('Geçerli bir abonelik planı seçiniz', 400);
    }
    
    // Burada gerçek bir ödeme entegrasyonu olacaktır
    // Ödeme başarılı olursa abonelik güncellenir
    
    // Aboneliği güncelle
    $userModel = new User();
    $updatedUser = $userModel->updateSubscription($user['id'], $plan);
    
    if (!$updatedUser) {
        Response::error('Abonelik güncellenemedi', 500);
    }
    
    // Plan bilgilerini al
    $planDetails = [];
    if ($plan === 'free') {
        $planDetails = [
            'id' => 'free',
            'name' => 'Free',
            'price' => 0,
            'currency' => 'TRY',
            'features' => [
                'dailyLimit' => 3,
                'aiMusicLevel' => 'basic',
                'support' => 'standard'
            ]
        ];
    } else {
        $planDetails = SUBSCRIPTION_PLANS[$plan];
        $planDetails['id'] = $plan;
    }
    
    // Abonelik değişikliğini logla
    $activityLogModel = new ActivityLog();
    $activityLogModel->create([
        'user_id' => $user['id'],
        'action' => 'subscription_change',
        'description' => "Abonelik değiştirildi: {$user['email']} ({$plan})",
        'metadata' => [
            'email' => $user['email'],
            'newPlan' => $plan,
            'oldPlan' => $user['subscription_plan']
        ]
    ]);
    
    Response::success([
        'subscription' => [
            'plan' => $updatedUser['subscription_plan'],
            'startDate' => $updatedUser['subscription_start_date'],
            'endDate' => $updatedUser['subscription_end_date']
        ],
        'plan' => $planDetails
    ], 'Abonelik güncellendi');
    
} catch (Exception $e) {
    error_log('Abonelik güncelleme hatası: ' . $e->getMessage());
    Response::serverError('Abonelik güncellenirken bir hata oluştu');
}
