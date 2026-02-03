<?php
require_once 'db.php';
require_once 'config.php';

session_start();

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
            if (!isset($_SESSION['user_id'])) {
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