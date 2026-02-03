<?php
require_once 'db.php';

try {
    $db->exec("
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT,
        avatar TEXT,
        bio TEXT,
        role TEXT DEFAULT 'user',
        is_active INTEGER DEFAULT 1,
        last_login DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
  ");
  
    
    $db->exec("
        CREATE TABLE IF NOT EXISTS posts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            title TEXT,
            content TEXT,
            media_url TEXT,
            media_type TEXT,
            likes_count INTEGER DEFAULT 0,
            comments_count INTEGER DEFAULT 0,
            shares_count INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        
        CREATE INDEX IF NOT EXISTS idx_posts_user ON posts(user_id);
        CREATE INDEX IF NOT EXISTS idx_posts_created ON posts(created_at);
    ");
    
    $db->exec("
        CREATE TABLE IF NOT EXISTS likes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            post_id INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
            UNIQUE(user_id, post_id)
        );
        
        CREATE INDEX IF NOT EXISTS idx_likes_post ON likes(post_id);
    ");
    
    $db->exec("
        CREATE TABLE IF NOT EXISTS comments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            post_id INTEGER NOT NULL,
            content TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
        );
        
        CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id);
    ");
    
    $db->exec("
        CREATE TABLE IF NOT EXISTS follows (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            follower_id INTEGER NOT NULL,
            following_id INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE,
            UNIQUE(follower_id, following_id)
        );
        
        CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
        CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);
    ");
    
    $db->exec("
        CREATE TABLE IF NOT EXISTS analytics_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            event TEXT NOT NULL,
            metadata TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
        );
        
        CREATE INDEX IF NOT EXISTS idx_analytics_event ON analytics_events(event);
        CREATE INDEX IF NOT EXISTS idx_analytics_user ON analytics_events(user_id);
    ");
    
    $db->exec("
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            price REAL NOT NULL,
            stock INTEGER DEFAULT 0,
            image_url TEXT,
            category TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
    ");
    
    $db->exec("
        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            total_amount REAL NOT NULL,
            status TEXT DEFAULT 'pending',
            payment_method TEXT,
            shipping_address TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );
        
        CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
    ");
    
    $db->exec("
        CREATE TABLE IF NOT EXISTS order_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id INTEGER NOT NULL,
            product_id INTEGER NOT NULL,
            quantity INTEGER NOT NULL,
            price REAL NOT NULL,
            FOREIGN KEY (order_id) REFERENCES orders(id),
            FOREIGN KEY (product_id) REFERENCES products(id)
        );
    ");
    
    echo json_encode([
        "status" => "ready",
        "message" => "Database initialized successfully",
        "app_types" => ["social-media","ecommerce","generic"],
        "features" => ["payment-processing","admin-panel","email-notifications","social-features","file-uploads","database","user-auth","search-functionality","analytics","api-endpoints"]
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "error" => "Database initialization failed",
        "message" => $e->getMessage()
    ]);
}
?>