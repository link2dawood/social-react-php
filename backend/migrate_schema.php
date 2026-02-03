<?php
require_once 'db.php';

// Only set headers if running via web server
if (php_sapi_name() !== 'cli') {
    header("Content-Type: application/json");
}

function addColumnIfNotExists($db, $table, $column, $definition) {
    try {
        $db->exec("ALTER TABLE $table ADD COLUMN $column $definition");
        return true;
    } catch (Exception $e) {
        // SQLite doesn't support IF NOT EXISTS for ALTER TABLE
        // So we catch duplicate column errors
        if (strpos($e->getMessage(), 'duplicate column') !== false || 
            strpos($e->getMessage(), 'duplicate') !== false) {
            return false; // Column already exists
        }
        throw $e; // Re-throw other errors
    }
}

try {
    $changes = 0;
    
    // Add columns to users table
    if (addColumnIfNotExists($db, 'users', 'username', 'TEXT UNIQUE')) $changes++;
    if (addColumnIfNotExists($db, 'users', 'party', "TEXT DEFAULT 'independent'")) $changes++;
    if (addColumnIfNotExists($db, 'users', 'display_name', 'TEXT')) $changes++;
    if (addColumnIfNotExists($db, 'users', 'banner', 'TEXT')) $changes++;
    if (addColumnIfNotExists($db, 'users', 'is_verified', 'INTEGER DEFAULT 0')) $changes++;
    if (addColumnIfNotExists($db, 'users', 'earnings', 'REAL DEFAULT 0')) $changes++;
    if (addColumnIfNotExists($db, 'users', 'total_tips', 'REAL DEFAULT 0')) $changes++;
    if (addColumnIfNotExists($db, 'users', 'tokens', 'REAL DEFAULT 0')) $changes++;
    if (addColumnIfNotExists($db, 'users', 'impressions', 'INTEGER DEFAULT 0')) $changes++;
    
    // Add columns to posts table
    if (addColumnIfNotExists($db, 'posts', 'type', "TEXT DEFAULT 'post'")) $changes++;
    if (addColumnIfNotExists($db, 'posts', 'party', 'TEXT')) $changes++;
    
    // Create new tables
    $db->exec("CREATE TABLE IF NOT EXISTS tips (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        post_id INTEGER,
        from_user_id INTEGER NOT NULL,
        amount REAL NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
        FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE CASCADE
    )");
    
    $db->exec("CREATE TABLE IF NOT EXISTS hashtags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        hashtag TEXT NOT NULL,
        user_id INTEGER,
        post_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
    )");
    
    $db->exec("CREATE TABLE IF NOT EXISTS trending_topics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        hashtag TEXT NOT NULL,
        user_id INTEGER,
        image TEXT,
        expires_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )");
    
    // Update existing users to have display_name = name
    $db->exec("UPDATE users SET display_name = name WHERE display_name IS NULL AND name IS NOT NULL");
    
    // Create index on username
    $db->exec("CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)");
    
    echo json_encode([
        'success' => true,
        'message' => 'Database schema migrated successfully',
        'changes' => $changes
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>

