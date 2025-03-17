<?php
/**
 * index.php - API ana giriş noktası
 * 
 * Tüm API isteklerini yönlendirir.
 */

// CORS başlıkları
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// OPTIONS isteklerini ele al (CORS preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header('HTTP/1.1 200 OK');
    exit;
}

// Gerekli dosyaları dahil et
require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../includes/response.php';

// URL yolunu al
$path = isset($_GET['path']) ? $_GET['path'] : '';
$path = trim($path, '/');
$segments = explode('/', $path);

// API endpoint'lerini tanımla
$routes = [
    // Auth routes
    'auth/register' => '../api/auth/register.php',
    'auth/login' => '../api/auth/login.php',
    'auth/logout' => '../api/auth/logout.php',
    'auth/refresh-token' => '../api/auth/refresh.php',
    'auth/me' => '../api/auth/me.php',
    'auth/password' => '../api/auth/password.php',
    'auth/reset-password' => '../api/auth/reset-password.php',
    
    // User routes
    'user/profile' => '../api/user/profile.php',
    'user/subscription' => '../api/user/subscription.php'
];

// İstek yapılan endpoint'i bul
$endpoint = implode('/', $segments);

if (array_key_exists($endpoint, $routes)) {
    // İlgili endpoint dosyasını dahil et
    require_once $routes[$endpoint];
} else {
    // Endpoint bulunamadı
    Response::notFound('İstenen API endpoint\'i bulunamadı');
}
