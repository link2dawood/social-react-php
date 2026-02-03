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
$data = json_decode(file_get_contents("php://input"), true);

try {
    if ($method !== 'POST') {
        throw new Exception('Invalid method');
    }
    
    if (!isset($data['amount']) || $data['amount'] <= 0) {
        throw new Exception('Invalid amount');
    }
    
    $paymentMethod = $data['payment_method'] ?? 'stripe';
    $shippingAddress = $data['shipping_address'] ?? null;
    
    // In production, integrate with actual payment gateways
    // For now, we simulate successful payment
    
    $stmt = $db->prepare("
        INSERT INTO orders (user_id, total_amount, status, payment_method, shipping_address) 
        VALUES (?, ?, ?, ?, ?)
    ");
    $stmt->execute([
        $_SESSION['user_id'],
        $data['amount'],
        'completed',
        $paymentMethod,
        $shippingAddress
    ]);
    
    $orderId = $db->lastInsertId();
    
    // If cart items provided, save them
    if (isset($data['items']) && is_array($data['items'])) {
        $stmt = $db->prepare("
            INSERT INTO order_items (order_id, product_id, quantity, price) 
            VALUES (?, ?, ?, ?)
        ");
        
        foreach ($data['items'] as $item) {
            $stmt->execute([
                $orderId,
                $item['product_id'],
                $item['quantity'],
                $item['price']
            ]);
        }
    }
    
    echo json_encode([
        'success' => true,
        'order_id' => $orderId,
        'message' => 'Payment processed successfully'
    ]);
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>