<?php
/**
 * Environment Configuration Loader
 * Loads environment variables from .env file
 */

class Env {
    private static $loaded = false;
    private static $vars = [];

    /**
     * Load environment variables from .env file
     */
    public static function load($path = null) {
        if (self::$loaded) {
            return;
        }

        if ($path === null) {
            $path = dirname(__DIR__) . '/.env';
        }

        if (!file_exists($path)) {
            return;
        }

        $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        
        foreach ($lines as $line) {
            // Skip comments
            if (strpos(trim($line), '#') === 0) {
                continue;
            }

            // Parse KEY=VALUE
            if (strpos($line, '=') !== false) {
                list($key, $value) = explode('=', $line, 2);
                $key = trim($key);
                $value = trim($value);
                
                // Remove quotes if present
                $value = trim($value, '"\'');
                
                // Set environment variable if not already set
                if (!isset($_ENV[$key])) {
                    $_ENV[$key] = $value;
                    putenv("$key=$value");
                }
                
                self::$vars[$key] = $value;
            }
        }

        self::$loaded = true;
    }

    /**
     * Get environment variable
     */
    public static function get($key, $default = null) {
        self::load();
        
        // Check $_ENV first, then getenv, then our loaded vars
        if (isset($_ENV[$key])) {
            return $_ENV[$key];
        }
        
        $value = getenv($key);
        if ($value !== false) {
            return $value;
        }
        
        if (isset(self::$vars[$key])) {
            return self::$vars[$key];
        }
        
        return $default;
    }

    /**
     * Check if environment variable exists
     */
    public static function has($key) {
        self::load();
        return isset($_ENV[$key]) || getenv($key) !== false || isset(self::$vars[$key]);
    }

    /**
     * Get all environment variables
     */
    public static function all() {
        self::load();
        return array_merge($_ENV, self::$vars);
    }
}

// Auto-load on include
Env::load();

