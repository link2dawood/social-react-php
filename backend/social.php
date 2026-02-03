<?php
require_once 'db.php';
require_once 'config.php';

$userId = requireAuth();
$action = $_GET['action'] ?? '';

try {
    switch ($action) {
        case 'follow':
            $targetUserId = $_GET['user_id'] ?? json_decode(file_get_contents("php://input"), true)['user_id'] ?? null;
            if (!$targetUserId) throw new Exception('User ID required');
            
            if ($userId == $targetUserId) {
                throw new Exception('Cannot follow yourself');
            }
            
            $stmt = $db->prepare("INSERT OR IGNORE INTO follows (follower_id, following_id) VALUES (?, ?)");
            $stmt->execute([$userId, $targetUserId]);
            echo json_encode(['success' => true, 'data' => ['following' => true]]);
            break;
            
        case 'unfollow':
            $targetUserId = $_GET['user_id'] ?? json_decode(file_get_contents("php://input"), true)['user_id'] ?? null;
            if (!$targetUserId) throw new Exception('User ID required');
            
            $stmt = $db->prepare("DELETE FROM follows WHERE follower_id = ? AND following_id = ?");
            $stmt->execute([$userId, $targetUserId]);
            echo json_encode(['success' => true, 'data' => ['following' => false]]);
            break;
            
        case 'followers':
            $targetUserId = $_GET['user_id'] ?? $userId;
            
            $stmt = $db->prepare("
                SELECT u.id, u.username, u.display_name, u.name, u.avatar, u.party, u.bio
                FROM follows f
                JOIN users u ON f.follower_id = u.id
                WHERE f.following_id = ?
            ");
            $stmt->execute([$targetUserId]);
            $followers = $stmt->fetchAll();
            
            echo json_encode(['success' => true, 'data' => $followers]);
            break;
            
        case 'following':
            $targetUserId = $_GET['user_id'] ?? $userId;
            
            $stmt = $db->prepare("
                SELECT u.id, u.username, u.display_name, u.name, u.avatar, u.party, u.bio
                FROM follows f
                JOIN users u ON f.following_id = u.id
                WHERE f.follower_id = ?
            ");
            $stmt->execute([$targetUserId]);
            $following = $stmt->fetchAll();
            
            echo json_encode(['success' => true, 'data' => $following]);
            break;
            
        case 'comment':
            $data = json_decode(file_get_contents("php://input"), true);
            if (!isset($data['post_id']) || !isset($data['content'])) {
                throw new Exception('Post ID and content required');
            }
            
            $stmt = $db->prepare("INSERT INTO comments (user_id, post_id, content) VALUES (?, ?, ?)");
            $stmt->execute([$userId, $data['post_id'], $data['content']]);
            
            $db->prepare("UPDATE posts SET comments_count = comments_count + 1 WHERE id = ?")->execute([$data['post_id']]);
            
            echo json_encode(['success' => true, 'comment_id' => $db->lastInsertId()]);
            break;
            
        default:
            throw new Exception('Invalid action');
    }
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>