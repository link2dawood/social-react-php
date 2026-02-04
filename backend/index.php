<?php
/**
 * Backend Router - Entry point for PHP development server
 * This file routes requests to the appropriate backend PHP files
 */

// Enable CORS - NEVER use wildcard with credentials
$origin = $_SERVER['HTTP_ORIGIN'] ?? null;

// Extract origin from referer if HTTP_ORIGIN is not set
if (!$origin && isset($_SERVER['HTTP_REFERER'])) {
    $referer = $_SERVER['HTTP_REFERER'];
    $parsed = parse_url($referer);
    if ($parsed) {
        $origin = $parsed['scheme'] . '://' . $parsed['host'];
        if (isset($parsed['port']) && !in_array($parsed['port'], [80, 443])) {
            $origin .= ':' . $parsed['port'];
        }
    }
}

// Normalize origin
if ($origin) {
    $origin = rtrim($origin, '/');
}

// Set specific origin (never wildcard when using credentials)
if ($origin) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    // Fallback to common development origin
    header("Access-Control-Allow-Origin: http://localhost:5000");
}
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Allow-Credentials: true');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Get the request URI
$requestUri = $_SERVER['REQUEST_URI'];
$scriptName = $_SERVER['SCRIPT_NAME'];

// Remove query string
$path = parse_url($requestUri, PHP_URL_PATH);

// Remove leading slash
$path = ltrim($path, '/');

// If path is empty, redirect to Swagger UI or show API info
if (empty($path)) {
    // Check if request is from a browser (has Accept header with text/html)
    $acceptHeader = $_SERVER['HTTP_ACCEPT'] ?? '';
    
    // If browser request, redirect to Swagger UI
    if (strpos($acceptHeader, 'text/html') !== false) {
        header('Location: /swagger.php');
        exit();
    }
    
    // Otherwise, return JSON for API clients (curl, fetch, etc.)
    header('Content-Type: application/json');
    echo json_encode([
        'success' => true,
        'message' => 'Backend API is running',
        'version' => '1.0',
        'documentation' => '/swagger.php',
        'endpoints' => [
            'auth' => '/auth.php',
            'content' => '/content.php',
            'social' => '/social.php',
            'messages' => '/messages.php',
            'settings' => '/settings.php',
            'upload' => '/upload.php',
            'search' => '/search.php',
            'analytics' => '/analytics.php',
            'admin' => '/admin.php',
            'payments' => '/payments.php'
        ]
    ]);
    exit();
}

// Map of routes to files
$routes = [
    'auth.php' => __DIR__ . '/auth.php',
    'content.php' => __DIR__ . '/content.php',
    'social.php' => __DIR__ . '/social.php',
    'messages.php' => __DIR__ . '/messages.php',
    'settings.php' => __DIR__ . '/settings.php',
    'upload.php' => __DIR__ . '/upload.php',
    'search.php' => __DIR__ . '/search.php',
    'analytics.php' => __DIR__ . '/analytics.php',
    'admin.php' => __DIR__ . '/admin.php',
    'payments.php' => __DIR__ . '/payments.php',
    'init.php' => __DIR__ . '/init.php',
    'migrate_schema.php' => __DIR__ . '/migrate_schema.php',
    'swagger.php' => __DIR__ . '/swagger.php',
    'openapi.yaml' => __DIR__ . '/openapi.yaml'
];

// Check if the requested file exists in our routes
if (isset($routes[$path]) && file_exists($routes[$path])) {
    // Include the requested file
    require $routes[$path];
    exit();
}

// Check if it's a direct file request
$filePath = __DIR__ . '/' . $path;
if (file_exists($filePath) && is_file($filePath)) {
    // Serve static files or PHP files
    if (pathinfo($filePath, PATHINFO_EXTENSION) === 'php') {
        require $filePath;
        exit();
    } else {
        // Serve static file
        return false; // Let PHP's built-in server handle it
    }
}

// 404 - Not Found
header('HTTP/1.1 404 Not Found');
header('Content-Type: application/json');
echo json_encode([
    'success' => false,
    'error' => 'Endpoint not found',
    'path' => $path,
    'available_endpoints' => array_keys($routes)
]);
exit();
