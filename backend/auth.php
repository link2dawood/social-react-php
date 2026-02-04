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

// Configure session cookie BEFORE starting session
if (php_sapi_name() !== 'cli') {
    ini_set('session.cookie_httponly', '0'); // Allow JS access for debugging
    ini_set('session.cookie_samesite', 'Lax');
    ini_set('session.cookie_secure', '0');
    ini_set('session.use_only_cookies', '1');
    ini_set('session.cookie_path', '/');
    ini_set('session.cookie_domain', '');
}

session_start();

// Ensure session cookie is set with proper parameters
if (php_sapi_name() !== 'cli' && !isset($_COOKIE[session_name()])) {
    $params = session_get_cookie_params();
    setcookie(
        session_name(),
        session_id(),
        $params['lifetime'] ? time() + $params['lifetime'] : 0,
        $params['path'],
        $params['domain'],
        $params['secure'],
        $params['httponly']
    );
}

$method = $_SERVER['REQUEST_METHOD'];
$data = json_decode(file_get_contents("php://input"), true);
$action = $_GET['action'] ?? '';

try {
    switch ($action) {
        case 'signup':
            if (!isset($data['email']) || !isset($data['password'])) {
                throw new Exception('Email and password required');
            }
            
            if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
                throw new Exception('Invalid email format');
            }
            
            if (strlen($data['password']) < 6) {
                throw new Exception('Password must be at least 6 characters');
            }
            
            // Check if email already exists
            $emailCheckStmt = $db->prepare("SELECT id FROM users WHERE email = ?");
            $emailCheckStmt->execute([$data['email']]);
            if ($emailCheckStmt->fetch()) {
                throw new Exception('Email already registered');
            }
            
            // Check if username already exists
            if (isset($data['username']) && !empty($data['username'])) {
                $checkStmt = $db->prepare("SELECT id FROM users WHERE username = ?");
                $checkStmt->execute([$data['username']]);
                if ($checkStmt->fetch()) {
                    throw new Exception('Username already taken');
                }
            }
            
            $hashedPassword = password_hash($data['password'], PASSWORD_DEFAULT);
            $name = $data['name'] ?? $data['displayName'] ?? null;
            $username = $data['username'] ?? null;
            $party = $data['party'] ?? 'independent';
            $bio = $data['bio'] ?? null;
            $displayName = $data['displayName'] ?? $name;
            
            $stmt = $db->prepare("
                INSERT INTO users (email, password, name, username, display_name, party, bio) 
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([$data['email'], $hashedPassword, $name, $username, $displayName, $party, $bio]);
            
            $userId = $db->lastInsertId();
            $_SESSION['user_id'] = $userId;
            
            // Fetch the created user
            $userStmt = $db->prepare("SELECT id, email, name, display_name, username, avatar, bio, party, created_at FROM users WHERE id = ?");
            $userStmt->execute([$userId]);
            $user = $userStmt->fetch();
            
            echo json_encode([
                'success' => true,
                'message' => 'Account created successfully',
                'data' => [
                    'user' => $user,
                    'user_id' => $userId
                ]
            ]);
            break;
            
        case 'login':
            if (!isset($data['email']) || !isset($data['password'])) {
                throw new Exception('Email and password required');
            }
            
            $stmt = $db->prepare("SELECT * FROM users WHERE email = ? OR username = ?");
            $stmt->execute([$data['email'], $data['email']]);
            $user = $stmt->fetch();
            
            if (!$user || !password_verify($data['password'], $user['password'])) {
                throw new Exception('Invalid credentials');
            }
            
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['user_email'] = $user['email'];
            $_SESSION['user_username'] = $user['username'];
            
            // Regenerate session ID for security (automatically copies session data)
            $oldSessionId = session_id();
            session_regenerate_id(true);
            $newSessionId = session_id();
            
            // Explicitly set cookie with the NEW session ID
            $cookieName = session_name();
            
            // Use setcookie() with explicit parameters - MUST be called after regenerate
            setcookie($cookieName, $newSessionId, [
                'expires' => 0, // Session cookie (expires when browser closes)
                'path' => '/',
                'domain' => '',
                'secure' => false,
                'httponly' => false,
                'samesite' => 'Lax'
            ]);
            
            // Debug: Log session info
            error_log('Login - Old Session ID: ' . $oldSessionId);
            error_log('Login - New Session ID: ' . $newSessionId);
            error_log('Login - User ID set in session: ' . $user['id']);
            error_log('Login - Session data: ' . json_encode($_SESSION));
            error_log('Login - Cookie set: ' . $cookieName . '=' . $newSessionId);
            error_log('Login - Cookie params: ' . json_encode(session_get_cookie_params()));
            
            // Get follower/following counts and IDs
            $followersStmt = $db->prepare("SELECT COUNT(*) as count FROM follows WHERE following_id = ?");
            $followersStmt->execute([$user['id']]);
            $followersCount = $followersStmt->fetch()['count'];
            
            $followingStmt = $db->prepare("SELECT COUNT(*) as count FROM follows WHERE follower_id = ?");
            $followingStmt->execute([$user['id']]);
            $followingCount = $followingStmt->fetch()['count'];
            
            // Get follower IDs
            $followersIdsStmt = $db->prepare("SELECT follower_id FROM follows WHERE following_id = ?");
            $followersIdsStmt->execute([$user['id']]);
            $followersIds = $followersIdsStmt->fetchAll(PDO::FETCH_COLUMN);
            
            // Get following IDs
            $followingIdsStmt = $db->prepare("SELECT following_id FROM follows WHERE follower_id = ?");
            $followingIdsStmt->execute([$user['id']]);
            $followingIds = $followingIdsStmt->fetchAll(PDO::FETCH_COLUMN);
            
            echo json_encode([
                'success' => true,
                'message' => 'Login successful',
                'data' => [
                    'user' => [
                        'id' => (string)$user['id'],
                        'email' => $user['email'],
                        'name' => $user['name'],
                        'displayName' => $user['display_name'] ?? $user['name'],
                        'username' => $user['username'],
                        'avatar' => $user['avatar'],
                        'bio' => $user['bio'],
                        'party' => $user['party'] ?? 'independent',
                        'followerCount' => (int)$followersCount,
                        'followers' => array_map('strval', $followersIds),
                        'following' => array_map('strval', $followingIds),
                        'friends' => [],
                        'earnings' => (float)($user['earnings'] ?? 0),
                        'totalTips' => (float)($user['total_tips'] ?? 0),
                        'tokens' => (float)($user['tokens'] ?? 0),
                        'impressions' => (int)($user['impressions'] ?? 0),
                        'isVerified' => (bool)($user['is_verified'] ?? false),
                        'joinDate' => $user['created_at']
                    ]
                ]
            ]);
            break;
            
        case 'logout':
            // Clear session data
            $_SESSION = array();
            // Destroy session cookie
            if (ini_get("session.use_cookies")) {
                $params = session_get_cookie_params();
                setcookie(session_name(), '', time() - 42000,
                    $params["path"], $params["domain"],
                    $params["secure"], $params["httponly"]
                );
            }
            // Destroy session
            session_destroy();
            echo json_encode(['success' => true, 'message' => 'Logged out successfully']);
            break;
            
        case 'me':
            // Debug: Log session info
            error_log('Auth.php ME - Session ID: ' . session_id());
            error_log('Auth.php ME - Session name: ' . session_name());
            error_log('Auth.php ME - Cookies received: ' . json_encode($_COOKIE));
            error_log('Auth.php ME - Session data: ' . json_encode($_SESSION));
            error_log('Auth.php ME - User ID in session: ' . (isset($_SESSION['user_id']) ? $_SESSION['user_id'] : 'NOT SET'));
            
            if (!isset($_SESSION['user_id'])) {
                error_log('Auth.php ME - Authentication failed: No user_id in session');
                throw new Exception('Not authenticated');
            }
            
            $stmt = $db->prepare("SELECT * FROM users WHERE id = ?");
            $stmt->execute([$_SESSION['user_id']]);
            $user = $stmt->fetch();
            
            if (!$user) {
                throw new Exception('User not found');
            }
            
            // Get follower/following counts
            $followersStmt = $db->prepare("SELECT COUNT(*) as count FROM follows WHERE following_id = ?");
            $followersStmt->execute([$user['id']]);
            $followersCount = $followersStmt->fetch()['count'];
            
            $followingStmt = $db->prepare("SELECT COUNT(*) as count FROM follows WHERE follower_id = ?");
            $followingStmt->execute([$user['id']]);
            $followingCount = $followingStmt->fetch()['count'];
            
            // Get follower/following IDs
            $followersIdsStmt = $db->prepare("SELECT follower_id FROM follows WHERE following_id = ?");
            $followersIdsStmt->execute([$user['id']]);
            $followersIds = array_column($followersIdsStmt->fetchAll(), 'follower_id');
            
            $followingIdsStmt = $db->prepare("SELECT following_id FROM follows WHERE follower_id = ?");
            $followingIdsStmt->execute([$user['id']]);
            $followingIds = array_column($followingIdsStmt->fetchAll(), 'following_id');
            
            echo json_encode([
                'success' => true,
                'data' => [
                    'user' => [
                        'id' => (string)$user['id'],
                        'email' => $user['email'],
                        'name' => $user['name'],
                        'displayName' => $user['display_name'] ?? $user['name'],
                        'username' => $user['username'],
                        'avatar' => $user['avatar'],
                        'bio' => $user['bio'],
                        'party' => $user['party'] ?? 'independent',
                        'followerCount' => (int)$followersCount,
                        'followers' => array_map('strval', $followersIds),
                        'following' => array_map('strval', $followingIds),
                        'friends' => [],
                        'earnings' => (float)($user['earnings'] ?? 0),
                        'totalTips' => (float)($user['total_tips'] ?? 0),
                        'tokens' => (float)($user['tokens'] ?? 0),
                        'impressions' => (int)($user['impressions'] ?? 0),
                        'isVerified' => (bool)($user['is_verified'] ?? false),
                        'joinDate' => $user['created_at']
                    ]
                ]
            ]);
            break;
            
        default:
            throw new Exception('Invalid action');
    }
} catch (PDOException $e) {
    http_response_code(400);
    // Handle database constraint violations
    $errorMessage = $e->getMessage();
    if (strpos($errorMessage, 'UNIQUE constraint failed') !== false) {
        if (strpos($errorMessage, 'email') !== false) {
            $errorMessage = 'Email already registered';
        } elseif (strpos($errorMessage, 'username') !== false) {
            $errorMessage = 'Username already taken';
        }
    }
    echo json_encode([
        'success' => false,
        'error' => $errorMessage
    ]);
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>