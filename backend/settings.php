<?php
// Load config first to get CORS settings
require_once 'config.php';
require_once 'db.php';

// Set CORS headers BEFORE session_start() and NEVER use wildcard with credentials
if (php_sapi_name() !== 'cli' && isset($_SERVER['REQUEST_METHOD'])) {
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
    
    // CRITICAL: When using credentials, we MUST set a specific origin, never '*'
    $allowedOrigin = null;
    if ($origin && defined('CORS_ALLOWED_ORIGINS')) {
        // Check if origin is in allowed list
        if (in_array($origin, CORS_ALLOWED_ORIGINS)) {
            $allowedOrigin = $origin;
        } else {
            // Try localhost/127.0.0.1 variants
            if (strpos($origin, '127.0.0.1') !== false) {
                $originLocalhost = str_replace('127.0.0.1', 'localhost', $origin);
                if (in_array($originLocalhost, CORS_ALLOWED_ORIGINS)) {
                    $allowedOrigin = $origin;
                }
            }
            if (strpos($origin, 'localhost') !== false) {
                $origin127 = str_replace('localhost', '127.0.0.1', $origin);
                if (in_array($origin127, CORS_ALLOWED_ORIGINS)) {
                    $allowedOrigin = $origin;
                }
            }
        }
    }
    
    // Set the specific origin (never wildcard when using credentials)
    if ($allowedOrigin) {
        header("Access-Control-Allow-Origin: $allowedOrigin");
    } else {
        // Development fallback - allow the requesting origin
        header("Access-Control-Allow-Origin: " . ($origin ?: 'http://localhost:5000'));
    }
    
    header("Access-Control-Allow-Methods: " . (defined('CORS_ALLOWED_METHODS') ? CORS_ALLOWED_METHODS : 'GET,POST,PUT,DELETE,OPTIONS'));
    header("Access-Control-Allow-Headers: " . (defined('CORS_ALLOWED_HEADERS') ? CORS_ALLOWED_HEADERS : 'Content-Type,Authorization,X-Requested-With'));
    header("Access-Control-Allow-Credentials: true");
    header("Content-Type: application/json");
    
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit;
    }
}

session_start();

$method = $_SERVER['REQUEST_METHOD'];
$data = json_decode(file_get_contents("php://input"), true);
$action = $_GET['action'] ?? '';

try {
    // Create site_settings table if it doesn't exist
    $db->exec("
        CREATE TABLE IF NOT EXISTS site_settings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            setting_key TEXT UNIQUE NOT NULL,
            setting_value TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ");
    
    switch ($action) {
        case 'get':
            // Get all settings or a specific setting
            $key = $_GET['key'] ?? null;
            if ($key) {
                $stmt = $db->prepare("SELECT setting_value FROM site_settings WHERE setting_key = ?");
                $stmt->execute([$key]);
                $result = $stmt->fetch();
                if ($result) {
                    echo json_encode([
                        'success' => true,
                        'data' => [
                            'key' => $key,
                            'value' => json_decode($result['setting_value'], true)
                        ]
                    ]);
                } else {
                    echo json_encode([
                        'success' => true,
                        'data' => [
                            'key' => $key,
                            'value' => null
                        ]
                    ]);
                }
            } else {
                // Get all settings
                $stmt = $db->query("SELECT setting_key, setting_value FROM site_settings");
                $settings = [];
                while ($row = $stmt->fetch()) {
                    $settings[$row['setting_key']] = json_decode($row['setting_value'], true);
                }
                echo json_encode([
                    'success' => true,
                    'data' => $settings
                ]);
            }
            break;
            
        case 'set':
            if (!isset($data['key']) || !isset($data['value'])) {
                throw new Exception('Key and value required');
            }
            
            $key = $data['key'];
            $value = json_encode($data['value']);
            
            $stmt = $db->prepare("
                INSERT INTO site_settings (setting_key, setting_value, updated_at)
                VALUES (?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(setting_key) DO UPDATE SET
                    setting_value = excluded.setting_value,
                    updated_at = CURRENT_TIMESTAMP
            ");
            $stmt->execute([$key, $value]);
            
            echo json_encode([
                'success' => true,
                'message' => 'Setting saved successfully',
                'data' => [
                    'key' => $key,
                    'value' => $data['value']
                ]
            ]);
            break;
            
        case 'isSetupComplete':
            // Check if setup is complete
            $stmt = $db->prepare("SELECT setting_value FROM site_settings WHERE setting_key = 'siteSettings'");
            $stmt->execute();
            $result = $stmt->fetch();
            
            if ($result) {
                $settings = json_decode($result['setting_value'], true);
                $isComplete = isset($settings['isSetupComplete']) && $settings['isSetupComplete'] === true;
            } else {
                $isComplete = false;
            }
            
            echo json_encode([
                'success' => true,
                'data' => [
                    'isSetupComplete' => $isComplete
                ]
            ]);
            break;
            
        default:
            throw new Exception('Invalid action');
    }
} catch (PDOException $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>