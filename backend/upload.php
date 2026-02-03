<?php
require_once 'db.php';
require_once 'config.php';

session_start();

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Authentication required']);
    exit;
}

if (!isset($_FILES['file'])) {
    http_response_code(400);
    echo json_encode(['error' => 'No file uploaded']);
    exit;
}

try {
    $file = $_FILES['file'];
    
    if ($file['error'] !== UPLOAD_ERR_OK) {
        throw new Exception('Upload failed');
    }
    
    if ($file['size'] > MAX_UPLOAD_SIZE) {
        throw new Exception('File too large. Maximum size: ' . (MAX_UPLOAD_SIZE / 1048576) . 'MB');
    }
    
    $extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    if (!in_array($extension, ALLOWED_EXTENSIONS)) {
        throw new Exception('File type not allowed');
    }
    
    $filename = uniqid() . '_' . time() . '.' . $extension;
    $filepath = UPLOAD_DIR . $filename;
    
    if (!move_uploaded_file($file['tmp_name'], $filepath)) {
        throw new Exception('Failed to save file');
    }
    
    $mediaType = 'image';
    if (in_array($extension, ['mp3', 'wav', 'ogg'])) $mediaType = 'audio';
    if (in_array($extension, ['mp4', 'webm', 'mov'])) $mediaType = 'video';
    if ($extension === 'pdf') $mediaType = 'document';
    
    
    
    $title = $_POST['title'] ?? null;
    $content = $_POST['content'] ?? null;
    
    $stmt = $db->prepare("INSERT INTO posts (user_id, title, content, media_url, media_type) VALUES (?, ?, ?, ?, ?)");
    $stmt->execute([$_SESSION['user_id'], $title, $content, $filepath, $mediaType]);
    
    echo json_encode([
        'success' => true,
        'post_id' => $db->lastInsertId(),
        'file_url' => $filepath,
        'media_type' => $mediaType
    ]);
    
    
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>