<?php
require_once 'db.php';
require_once 'config.php';

session_start();

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Authentication required']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

try {
    switch ($action) {
        case 'send':
            $data = json_decode(file_get_contents("php://input"), true);
            
            if (!isset($data['receiver_id']) || !isset($data['message'])) {
                throw new Exception('Receiver and message required');
            }
            
            $stmt = $db->prepare("
                INSERT INTO messages (sender_id, receiver_id, message) 
                VALUES (?, ?, ?)
            ");
            $stmt->execute([$_SESSION['user_id'], $data['receiver_id'], $data['message']]);
            
            echo json_encode([
                'success' => true,
                'message_id' => $db->lastInsertId()
            ]);
            break;
            
        case 'list':
            $userId = $_GET['user_id'] ?? null;
            
            if ($userId) {
                // Get conversation with specific user
                $stmt = $db->prepare("
                    SELECT m.*, u.name as sender_name, u.avatar as sender_avatar 
                    FROM messages m 
                    JOIN users u ON m.sender_id = u.id 
                    WHERE (m.sender_id = ? AND m.receiver_id = ?) 
                       OR (m.sender_id = ? AND m.receiver_id = ?) 
                    ORDER BY m.created_at ASC
                ");
                $stmt->execute([$_SESSION['user_id'], $userId, $userId, $_SESSION['user_id']]);
            } else {
                // Get all messages for current user
                $stmt = $db->prepare("
                    SELECT m.*, u.name as sender_name, u.avatar as sender_avatar 
                    FROM messages m 
                    JOIN users u ON m.sender_id = u.id 
                    WHERE m.receiver_id = ? 
                    ORDER BY m.created_at DESC
                ");
                $stmt->execute([$_SESSION['user_id']]);
            }
            
            $messages = $stmt->fetchAll();
            
            echo json_encode(['success' => true, 'messages' => $messages]);
            break;
            
        case 'mark_read':
            if (!isset($_GET['id'])) {
                throw new Exception('Message ID required');
            }
            
            $stmt = $db->prepare("
                UPDATE messages 
                SET is_read = 1 
                WHERE id = ? AND receiver_id = ?
            ");
            $stmt->execute([$_GET['id'], $_SESSION['user_id']]);
            
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