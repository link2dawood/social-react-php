<?php
require_once __DIR__ . '/env.php';

// Load environment variables
Env::load();

// Application Configuration
define('APP_NAME', Env::get('APP_NAME', 'Lerumos Social Media Platform'));
define('APP_ENV', Env::get('APP_ENV', 'development'));
define('APP_DEBUG', filter_var(Env::get('APP_DEBUG', 'true'), FILTER_VALIDATE_BOOLEAN));
define('APP_URL', Env::get('APP_URL', 'http://localhost:8080'));
define('APP_TYPES', ["social-media","ecommerce","generic"]);
define('PRIMARY_APP_TYPE', 'social-media');

// Database Configuration
define('DB_TYPE', Env::get('DB_TYPE', 'sqlite'));
define('DB_PATH', Env::get('DB_PATH', 'database.db'));

// File Upload Configuration
define('UPLOAD_DIR', Env::get('UPLOAD_DIR', 'uploads/'));
define('MAX_UPLOAD_SIZE', (int)Env::get('MAX_UPLOAD_SIZE', 52428800)); // 50MB
$allowedExtensions = Env::get('ALLOWED_EXTENSIONS', 'jpg,jpeg,png,gif,mp3,mp4,pdf');
define('ALLOWED_EXTENSIONS', explode(',', $allowedExtensions));

// Session Configuration
define('SESSION_LIFETIME', (int)Env::get('SESSION_LIFETIME', 7200));
define('SESSION_NAME', Env::get('SESSION_NAME', 'social_media_session'));

// Security
define('SECRET_KEY', Env::get('SECRET_KEY', 'change-this-in-production'));
define('JWT_SECRET', Env::get('JWT_SECRET', 'change-this-in-production'));

// CORS Configuration
$corsOrigins = Env::get('CORS_ALLOWED_ORIGINS', 'http://localhost:5173,http://localhost:8080,http://127.0.0.1:8080,http://localhost:3000,http://localhost:5000');
$corsOriginsArray = array_map('trim', explode(',', $corsOrigins));

// Ensure APP_URL (frontend/theme URL) is always allowed if set
if (defined('APP_URL') && APP_URL) {
    $appUrl = rtrim(APP_URL, '/');
    if (!in_array($appUrl, $corsOriginsArray, true)) {
        $corsOriginsArray[] = $appUrl;
    }
}

// Add both localhost and 127.0.0.1 variants for each port
$expandedOrigins = [];
foreach ($corsOriginsArray as $origin) {
    $expandedOrigins[] = $origin;
    // Add localhost variant if 127.0.0.1
    if (strpos($origin, '127.0.0.1') !== false) {
        $expandedOrigins[] = str_replace('127.0.0.1', 'localhost', $origin);
    }
    // Add 127.0.0.1 variant if localhost
    if (strpos($origin, 'localhost') !== false) {
        $expandedOrigins[] = str_replace('localhost', '127.0.0.1', $origin);
    }
}
// Ensure common development ports are included
$commonPorts = ['http://localhost:5000', 'http://127.0.0.1:5000', 'http://localhost:8000', 'http://127.0.0.1:8000'];
foreach ($commonPorts as $port) {
    if (!in_array($port, $expandedOrigins)) {
        $expandedOrigins[] = $port;
    }
}
define('CORS_ALLOWED_ORIGINS', array_unique($expandedOrigins));
define('CORS_ALLOWED_METHODS', Env::get('CORS_ALLOWED_METHODS', 'GET,POST,PUT,DELETE,OPTIONS'));
define('CORS_ALLOWED_HEADERS', Env::get('CORS_ALLOWED_HEADERS', 'Content-Type,Authorization,X-Requested-With'));

// API Configuration
define('API_BASE_URL', Env::get('API_BASE_URL', '/backend'));
define('API_VERSION', Env::get('API_VERSION', 'v1'));

// Email Configuration
define('SMTP_HOST', Env::get('SMTP_HOST', 'smtp.gmail.com'));
define('SMTP_PORT', (int)Env::get('SMTP_PORT', 587));
define('SMTP_USER', Env::get('SMTP_USER', ''));
define('SMTP_PASSWORD', Env::get('SMTP_PASSWORD', ''));
define('SMTP_FROM_EMAIL', Env::get('SMTP_FROM_EMAIL', 'noreply@example.com'));
define('SMTP_FROM_NAME', Env::get('SMTP_FROM_NAME', 'Lerumos Platform'));

// Payment Configuration
define('STRIPE_PUBLIC_KEY', Env::get('STRIPE_PUBLIC_KEY', ''));
define('STRIPE_SECRET_KEY', Env::get('STRIPE_SECRET_KEY', ''));
define('PAYPAL_CLIENT_ID', Env::get('PAYPAL_CLIENT_ID', ''));
define('PAYPAL_SECRET', Env::get('PAYPAL_SECRET', ''));

// Admin Configuration
define('ADMIN_EMAIL', Env::get('ADMIN_EMAIL', 'admin@example.com'));
define('ADMIN_PASSWORD', Env::get('ADMIN_PASSWORD', 'change-this'));

// Logging
define('LOG_LEVEL', Env::get('LOG_LEVEL', 'debug'));
define('LOG_FILE', Env::get('LOG_FILE', 'backend/logs/app.log'));

// Rate Limiting
define('RATE_LIMIT_ENABLED', filter_var(Env::get('RATE_LIMIT_ENABLED', 'true'), FILTER_VALIDATE_BOOLEAN));
define('RATE_LIMIT_REQUESTS', (int)Env::get('RATE_LIMIT_REQUESTS', 100));
define('RATE_LIMIT_WINDOW', (int)Env::get('RATE_LIMIT_WINDOW', 60));

// Cache Configuration
define('CACHE_ENABLED', filter_var(Env::get('CACHE_ENABLED', 'false'), FILTER_VALIDATE_BOOLEAN));
define('CACHE_DRIVER', Env::get('CACHE_DRIVER', 'file'));
define('CACHE_TTL', (int)Env::get('CACHE_TTL', 3600));

// Create uploads directory if it doesn't exist
if (!file_exists(UPLOAD_DIR)) {
    mkdir(UPLOAD_DIR, 0755, true);
}

// Create logs directory if it doesn't exist
$logDir = dirname(LOG_FILE);
if (!file_exists($logDir)) {
    mkdir($logDir, 0755, true);
}
?>