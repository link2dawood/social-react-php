<?php
require_once 'config.php';

function sendEmail($to, $subject, $body) {
    $headers = "From: " . APP_NAME . " <noreply@example.com>\r\n";
    $headers .= "MIME-Version: 1.0\r\n";
    $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
    
    return mail($to, $subject, $body, $headers);
}

function sendWelcomeEmail($email, $name) {
    $subject = "Welcome to " . APP_NAME;
    $body = "<h1>Welcome, $name!</h1><p>Thanks for joining us.</p>";
    return sendEmail($email, $subject, $body);
}

function sendPasswordResetEmail($email, $resetToken) {
    $subject = "Password Reset Request";
    $body = "<h1>Password Reset</h1><p>Click here to reset your password: $resetToken</p>";
    return sendEmail($email, $subject, $body);
}
?>