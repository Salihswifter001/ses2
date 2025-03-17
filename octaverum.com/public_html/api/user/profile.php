<?php
/**
 * profile.php - Profil güncelleme API endpoint'i
 * 
 * PUT /api/user/profile
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
    
    if (!$data) {
        Response::error('Geçersiz JSON verileri', 400);
    }
    
    // İzin verilen alanları belirle
    $allowedFields = ['nickname', 'country_code', 'phone'];
    $updateData = [];
    
    foreach ($allowedFields as $field) {
        if (isset($data[$field])) {
            $updateData[$field] = $data[$field];
        }
    }
    
    if (empty($updateData)) {
        Response::error('Güncellenecek veri bulunamadı', 400);
    }
    
    // Validator oluştur
    $validator = new Validation();
    $hasErrors = false;
    
    // Kullanıcı adı doğrulama
    if (isset($updateData['nickname'])) {
        if (!$validator->nickname($updateData['nickname'])) {
            $hasErrors = true;
        } else {
            // Kullanıcı adının benzersiz olup olmadığını kontrol et
            $userModel = new User();
            $existingUser = $userModel->findByNickname($updateData['nickname']);
            
            if ($existingUser && $existingUser['id'] != $user['id']) {
                $validator->errors['nickname'] = 'Bu kullanıcı adı zaten kullanılıyor';
                $hasErrors = true;
            }
        }
    }
    
    // Telefon doğrulama
    if (isset($updateData['phone']) && !$validator->phone($updateData['phone'])) {
        $hasErrors = true;
    }
    
    // Ülke kodu doğrulama
    if (isset($updateData['country_code']) && !$validator->required($updateData['country_code'], 'country_code', 'Ülke kodu gereklidir')) {
        $hasErrors = true;
    }
    
    // Hata varsa yanıt döndür
    if ($hasErrors) {
        Response::validationError($validator->getErrors());
    }
    
    // Profili güncelle
    $userModel = new User();
    $updatedUser = $userModel->update($user['id'], $updateData);
    
    if (!$updatedUser) {
        Response::error('Profil güncellenemedi', 500);
    }
    
    // Profil güncellemesini logla
    $activityLogModel = new ActivityLog();
    $activityLogModel->create([
        'user_id' => $user['id'],
        'action' => 'profile_update',
        'description' => "Profil güncellendi: {$user['email']}",
        'metadata' => [
            'email' => $user['email'],
            'updatedFields' => array_keys($updateData)
        ]
    ]);
    
    Response::success($updatedUser, 'Profil güncellendi');
    
} catch (Exception $e) {
    error_log('Profil güncelleme hatası: ' . $e->getMessage());
    Response::serverError('Profil güncellenirken bir hata oluştu');
}
