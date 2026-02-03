<?php
require_once 'db.php';
require_once 'config.php';

$query = $_GET['q'] ?? '';
$limit = $_GET['limit'] ?? 20;

try {
    if (empty($query)) {
        throw new Exception('Search query required');
    }
    
    $searchTerm = '%' . $query . '%';
    $results = [];
    
    // Search users
    $stmt = $db->prepare("SELECT id, name, email, avatar FROM users WHERE name LIKE ? OR email LIKE ? LIMIT ?");
    $stmt->execute([$searchTerm, $searchTerm, $limit]);
    $results['users'] = $stmt->fetchAll();
    
    // Search posts/content
    $stmt = $db->prepare("SELECT id, title, content, created_at FROM posts WHERE title LIKE ? OR content LIKE ? LIMIT ?");
    $stmt->execute([$searchTerm, $searchTerm, $limit]);
    $results['posts'] = $stmt->fetchAll();
    
    echo json_encode(['success' => true, 'results' => $results]);
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>