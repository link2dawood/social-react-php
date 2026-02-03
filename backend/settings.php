<?php
require_once 'db.php';
require_once 'config.php';

session_start();

// CORS Headers - must be set before any output
if (php_sapi_name() !== 'cli' && isset($_SERVER['REQUEST_METHOD'])) {
    $origin = $_SERVER['HTTP_ORIGIN'] ?? $_SERVER['HTTP_REFERER'] ?? '*';
    // Normalize origin (remove trailing slash, handle localhost/127.0.0.1)
    if ($origin !== '*') {
        $origin = rtrim($origin, '/');
        // Allow both localhost and 127.0.0.1 for same port
        if (strpos($origin, '127.0.0.1') !== false) {
            $originLocalhost = str_replace('127.0.0.1', 'localhost', $origin);
            if (in_array($originLocalhost, CORS_ALLOWED_ORIGINS)) {
                $origin = $originLocalhost;
            }
        }
    }
    if (in_array($origin, CORS_ALLOWED_ORIGINS) || in_array('*', CORS_ALLOWED_ORIGINS)) {
        header("Access-Control-Allow-Origin: $origin");
    } else {
        header("Access-Control-Allow-Origin: *");
    }

    header("Content-Type: application/json");
    header("Access-Control-Allow-Methods: " . CORS_ALLOWED_METHODS);
    header("Access-Control-Allow-Headers: " . CORS_ALLOWED_HEADERS);
    header("Access-Control-Allow-Credentials: true");

    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit;
    }
}

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

