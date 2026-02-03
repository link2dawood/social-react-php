<?php
require_once 'db.php';
require_once 'config.php';

session_start();

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Authentication required']);
    exit;
}

$stmt = $db->prepare("SELECT role FROM users WHERE id = ?");
$stmt->execute([$_SESSION['user_id']]);
$user = $stmt->fetch();

if (!$user || $user['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['error' => 'Admin access required']);
    exit;
}

$action = $_GET['action'] ?? '';

try {
    switch ($action) {
        case 'stats':
            $stats = [];
            $stats['total_users'] = $db->query("SELECT COUNT(*) as count FROM users")->fetch()['count'];
            $stats['total_posts'] = $db->query("SELECT COUNT(*) as count FROM posts")->fetch()['count'];
            echo json_encode(['success' => true, 'stats' => $stats]);
            break;
            
        case 'delete_user':
            if (!isset($_GET['id'])) throw new Exception('User ID required');
            $stmt = $db->prepare("DELETE FROM users WHERE id = ?");
            $stmt->execute([$_GET['id']]);
            echo json_encode(['success' => true]);
            break;
            
        case 'delete_post':
            if (!isset($_GET['id'])) throw new Exception('Post ID required');
            $stmt = $db->prepare("DELETE FROM posts WHERE id = ?");
            $stmt->execute([$_GET['id']]);
            echo json_encode(['success' => true]);
            break;
            
        default:
            throw new Exception('Invalid action');
    }
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>