<?php
// Initialize database schema
require_once 'db.php';

try {
    // Read SQL file
    $sql = file_get_contents(__DIR__ . '/setup.sql');
    
    // Execute SQL
    $db->exec($sql);
    
    echo "Database schema created successfully!\n";
    echo "All tables have been initialized.\n";
} catch (PDOException $e) {
    echo "Error creating database schema: " . $e->getMessage() . "\n";
    exit(1);
}
?>
