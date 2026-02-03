<?php
require_once 'db.php';
require_once 'config.php';

session_start();

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

try {
    switch ($action) {
        case 'list':
            $limit = $_GET['limit'] ?? 20;
            $offset = $_GET['offset'] ?? 0;
            
            $stmt = $db->prepare("
                SELECT p.*, u.name, u.display_name, u.username, u.avatar, u.party as user_party
                FROM posts p 
                JOIN users u ON p.user_id = u.id 
                ORDER BY p.created_at DESC 
                LIMIT ? OFFSET ?
            ");
            $stmt->execute([$limit, $offset]);
            $items = $stmt->fetchAll();
            
            // Get likes and comments for each post
            $posts = [];
            foreach ($items as $item) {
                // Get likes
                $likesStmt = $db->prepare("
                    SELECT l.user_id, u.party 
                    FROM likes l 
                    JOIN users u ON l.user_id = u.id 
                    WHERE l.post_id = ?
                ");
                $likesStmt->execute([$item['id']]);
                $likes = $likesStmt->fetchAll();
                
                // Get comments
                $commentsStmt = $db->prepare("
                    SELECT c.id, c.user_id, c.content, c.created_at as timestamp, u.username
                    FROM comments c 
                    JOIN users u ON c.user_id = u.id 
                    WHERE c.post_id = ? 
                    ORDER BY c.created_at ASC
                ");
                $commentsStmt->execute([$item['id']]);
                $comments = $commentsStmt->fetchAll();
                
                // Get tips
                $tipsStmt = $db->prepare("
                    SELECT from_user_id as userId, amount, created_at as timestamp
                    FROM tips 
                    WHERE post_id = ?
                ");
                $tipsStmt->execute([$item['id']]);
                $tips = $tipsStmt->fetchAll();
                
                $posts[] = [
                    'id' => (string)$item['id'],
                    'userId' => (string)$item['user_id'],
                    'content' => $item['content'],
                    'image' => $item['media_type'] === 'image' ? $item['media_url'] : null,
                    'video' => $item['media_type'] === 'video' ? $item['media_url'] : null,
                    'type' => $item['type'] ?? 'post',
                    'party' => $item['party'] ?? $item['user_party'] ?? 'independent',
                    'timestamp' => $item['created_at'],
                    'likes' => array_map(function($like) {
                        return ['userId' => (string)$like['user_id'], 'party' => $like['party'] ?? 'independent'];
                    }, $likes),
                    'comments' => array_map(function($comment) {
                        return [
                            'id' => (string)$comment['id'],
                            'userId' => (string)$comment['user_id'],
                            'content' => $comment['content'],
                            'timestamp' => $comment['timestamp']
                        ];
                    }, $comments),
                    'tips' => array_map(function($tip) {
                        return [
                            'userId' => (string)$tip['userId'],
                            'amount' => (float)$tip['amount'],
                            'timestamp' => $tip['timestamp']
                        ];
                    }, $tips),
                    'shares' => (int)($item['shares_count'] ?? 0),
                    'author' => [
                        'id' => (string)$item['user_id'],
                        'username' => $item['username'],
                        'displayName' => $item['display_name'] ?? $item['name'],
                        'avatar' => $item['avatar'],
                        'party' => $item['user_party'] ?? 'independent'
                    ]
                ];
            }
            
            echo json_encode(['success' => true, 'data' => $posts, 'posts' => $posts]);
            
            break;
            
        case 'get':
            if (!isset($_GET['id'])) {
                throw new Exception('ID required');
            }
            
            $stmt = $db->prepare("
                SELECT p.*, u.name, u.display_name, u.username, u.avatar, u.party as user_party
                FROM posts p 
                JOIN users u ON p.user_id = u.id 
                WHERE p.id = ?
            ");
            $stmt->execute([$_GET['id']]);
            $item = $stmt->fetch();
            
            if (!$item) {
                throw new Exception('Post not found');
            }
            
            // Get likes, comments, tips (similar to list)
            $likesStmt = $db->prepare("
                SELECT l.user_id, u.party 
                FROM likes l 
                JOIN users u ON l.user_id = u.id 
                WHERE l.post_id = ?
            ");
            $likesStmt->execute([$item['id']]);
            $likes = $likesStmt->fetchAll();
            
            $commentsStmt = $db->prepare("
                SELECT c.id, c.user_id, c.content, c.created_at as timestamp
                FROM comments c 
                WHERE c.post_id = ? 
                ORDER BY c.created_at ASC
            ");
            $commentsStmt->execute([$item['id']]);
            $comments = $commentsStmt->fetchAll();
            
            $tipsStmt = $db->prepare("
                SELECT from_user_id as userId, amount, created_at as timestamp
                FROM tips 
                WHERE post_id = ?
            ");
            $tipsStmt->execute([$item['id']]);
            $tips = $tipsStmt->fetchAll();
            
            $post = [
                'id' => (string)$item['id'],
                'userId' => (string)$item['user_id'],
                'content' => $item['content'],
                'image' => $item['media_type'] === 'image' ? $item['media_url'] : null,
                'video' => $item['media_type'] === 'video' ? $item['media_url'] : null,
                'type' => $item['type'] ?? 'post',
                'party' => $item['party'] ?? $item['user_party'] ?? 'independent',
                'timestamp' => $item['created_at'],
                'likes' => array_map(function($like) {
                    return ['userId' => (string)$like['user_id'], 'party' => $like['party'] ?? 'independent'];
                }, $likes),
                'comments' => array_map(function($comment) {
                    return [
                        'id' => (string)$comment['id'],
                        'userId' => (string)$comment['user_id'],
                        'content' => $comment['content'],
                        'timestamp' => $comment['timestamp']
                    ];
                }, $comments),
                'tips' => array_map(function($tip) {
                    return [
                        'userId' => (string)$tip['userId'],
                        'amount' => (float)$tip['amount'],
                        'timestamp' => $tip['timestamp']
                    ];
                }, $tips),
                'shares' => (int)($item['shares_count'] ?? 0)
            ];
            
            echo json_encode(['success' => true, 'data' => $post]);
            
            break;
            
        case 'like':
            if (!isset($_SESSION['user_id'])) {
                throw new Exception('Authentication required');
            }
            
            if (!isset($_GET['id'])) {
                throw new Exception('ID required');
            }
            
            // Check if already liked
            $checkStmt = $db->prepare("SELECT id FROM likes WHERE user_id = ? AND post_id = ?");
            $checkStmt->execute([$_SESSION['user_id'], $_GET['id']]);
            
            if ($checkStmt->fetch()) {
                // Unlike
                $stmt = $db->prepare("DELETE FROM likes WHERE user_id = ? AND post_id = ?");
                $stmt->execute([$_SESSION['user_id'], $_GET['id']]);
                $db->prepare("UPDATE posts SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = ?")->execute([$_GET['id']]);
                echo json_encode(['success' => true, 'message' => 'Unliked', 'liked' => false]);
            } else {
                // Like
                $stmt = $db->prepare("INSERT INTO likes (user_id, post_id) VALUES (?, ?)");
            $stmt->execute([$_SESSION['user_id'], $_GET['id']]);
                $db->prepare("UPDATE posts SET likes_count = likes_count + 1 WHERE id = ?")->execute([$_GET['id']]);
                echo json_encode(['success' => true, 'message' => 'Liked', 'liked' => true]);
            }
            break;
            
        case 'create':
            // Debug: Log session info
            error_log('Create post - Session ID: ' . session_id());
            error_log('Create post - User ID in session: ' . (isset($_SESSION['user_id']) ? $_SESSION['user_id'] : 'NOT SET'));
            error_log('Create post - All session data: ' . json_encode($_SESSION));
            
            if (!isset($_SESSION['user_id'])) {
                error_log('Create post - Authentication failed: No user_id in session');
                throw new Exception('Authentication required. Please log in again.');
            }
            
            $rawInput = file_get_contents("php://input");
            error_log('Create post - Raw input: ' . $rawInput);
            $data = json_decode($rawInput, true);
            
            if (json_last_error() !== JSON_ERROR_NONE) {
                error_log('Create post - JSON decode error: ' . json_last_error_msg());
                throw new Exception('Invalid JSON data: ' . json_last_error_msg());
            }
            
            if (!isset($data['content'])) {
                error_log('Create post - Missing content in data: ' . json_encode($data));
                throw new Exception('Content required');
            }
            
            $content = $data['content'];
            $mediaUrl = $data['media_url'] ?? null;
            $mediaType = $data['media_type'] ?? null;
            $type = $data['type'] ?? 'post';
            $party = $data['party'] ?? null;
            
            // Get user's party if not specified
            if (!$party) {
                $userStmt = $db->prepare("SELECT party FROM users WHERE id = ?");
                $userStmt->execute([$_SESSION['user_id']]);
                $user = $userStmt->fetch();
                $party = $user['party'] ?? 'independent';
            }
            
            $stmt = $db->prepare("
                INSERT INTO posts (user_id, content, media_url, media_type, type, party) 
                VALUES (?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([$_SESSION['user_id'], $content, $mediaUrl, $mediaType, $type, $party]);
            
            $postId = $db->lastInsertId();
            echo json_encode(['success' => true, 'data' => ['id' => $postId]]);
            break;
            
        case 'comment':
            if (!isset($_SESSION['user_id'])) {
                throw new Exception('Authentication required');
            }
            
            $data = json_decode(file_get_contents("php://input"), true);
            if (!isset($_GET['id']) && !isset($data['post_id'])) {
                throw new Exception('Post ID required');
            }
            
            $postId = $_GET['id'] ?? $data['post_id'];
            $content = $data['content'] ?? '';
            
            if (empty($content)) {
                throw new Exception('Comment content required');
            }
            
            $stmt = $db->prepare("INSERT INTO comments (user_id, post_id, content) VALUES (?, ?, ?)");
            $stmt->execute([$_SESSION['user_id'], $postId, $content]);
            
            $db->prepare("UPDATE posts SET comments_count = comments_count + 1 WHERE id = ?")->execute([$postId]);
            
            echo json_encode(['success' => true, 'data' => ['id' => $db->lastInsertId()]]);
            break;
            
        default:
            throw new Exception('Invalid action');
    }
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>