<?php
require_once 'db.php';
require_once 'config.php';

$userId = requireAuth();
$action = $_GET['action'] ?? '';

try {
    switch ($action) {
        case 'track':
            $data = json_decode(file_get_contents("php://input"), true);
            $event = $data['event'] ?? '';
            $metadata = json_encode($data['metadata'] ?? []);
            
            $stmt = $db->prepare("INSERT INTO analytics_events (user_id, event, metadata) VALUES (?, ?, ?)");
            $stmt->execute([$userId, $event, $metadata]);
            echo json_encode(['success' => true]);
            break;
            
        case 'stats':
            $stmt = $db->prepare("SELECT event, COUNT(*) as count FROM analytics_events WHERE user_id = ? GROUP BY event");
            $stmt->execute([$userId]);
            $stats = $stmt->fetchAll();
            echo json_encode(['success' => true, 'stats' => $stats]);
            break;
            
        default:
            throw new Exception('Invalid action');
    }
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>