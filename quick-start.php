<?php
/**
 * Quick Start Script
 * Run this to initialize the database and migrate schema
 */

echo "=== Quick Start Setup ===\n\n";

// Check PHP version
if (version_compare(PHP_VERSION, '7.4.0') < 0) {
    die("Error: PHP 7.4 or higher is required. Current version: " . PHP_VERSION . "\n");
}

// Check SQLite extension
if (!extension_loaded('sqlite3') && !extension_loaded('pdo_sqlite')) {
    die("Error: SQLite extension is required. Please enable it in php.ini\n");
}

echo "✓ PHP version check passed\n";
echo "✓ SQLite extension found\n\n";

// Initialize database
echo "Initializing database...\n";
chdir(__DIR__ . '/backend');
require_once 'db.php';
require_once 'init.php';

// Run migration
echo "\nRunning schema migration...\n";
require_once 'migrate_schema.php';

echo "\n=== Setup Complete ===\n";
echo "Next steps:\n";
echo "1. cd frontend && npm install\n";
echo "2. npm run build (for production) or npm run dev (for development)\n";
echo "3. Configure your web server to serve from the project root\n";
?>

