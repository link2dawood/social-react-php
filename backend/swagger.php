<?php
/**
 * Swagger UI Interface
 * Provides interactive API documentation
 */

// Enable CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Lerumos API Documentation - Swagger UI</title>
    <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css">
    <style>
        html {
            box-sizing: border-box;
            overflow: -moz-scrollbars-vertical;
            overflow-y: scroll;
        }

        *,
        *:before,
        *:after {
            box-sizing: inherit;
        }

        body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        }

        .swagger-ui .topbar {
            background-color: #2c3e50;
        }

        .swagger-ui .topbar .download-url-wrapper .select-label {
            color: #fff;
        }

        .custom-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 2rem;
            text-align: center;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }

        .custom-header h1 {
            margin: 0;
            font-size: 2.5rem;
            font-weight: 700;
        }

        .custom-header p {
            margin: 0.5rem 0 0 0;
            font-size: 1.1rem;
            opacity: 0.9;
        }

        .info-banner {
            background-color: #e3f2fd;
            border-left: 4px solid #2196f3;
            padding: 1rem;
            margin: 1rem;
            border-radius: 4px;
        }

        .info-banner h3 {
            margin-top: 0;
            color: #1976d2;
        }

        .info-banner ul {
            margin-bottom: 0;
        }

        #swagger-ui {
            max-width: 1460px;
            margin: 0 auto;
        }
    </style>
</head>
<body>
    <div class="custom-header">
        <h1>🚀 Lerumos API Documentation</h1>
        <p>Interactive API documentation for the Lerumos Social Media Platform</p>
    </div>

    <div class="info-banner">
        <h3>📚 Quick Start Guide</h3>
        <ul>
            <li><strong>Authentication:</strong> Most endpoints require session-based authentication. Start by testing the <code>POST /auth.php?action=login</code> endpoint.</li>
            <li><strong>Try it out:</strong> Click on any endpoint, then click "Try it out" to test it directly from this page.</li>
            <li><strong>Server URL:</strong> The API is currently running at <code><?php echo 'http://' . $_SERVER['HTTP_HOST']; ?></code></li>
            <li><strong>Response Format:</strong> All endpoints return JSON with <code>success</code>, <code>data</code>, <code>error</code>, and <code>message</code> fields.</li>
        </ul>
    </div>

    <div id="swagger-ui"></div>

    <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js"></script>
    <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-standalone-preset.js"></script>
    <script>
        window.onload = function() {
            // Get the current server URL
            const currentUrl = window.location.origin;
            
            // Initialize Swagger UI
            const ui = SwaggerUIBundle({
                url: currentUrl + "/openapi.yaml",
                dom_id: '#swagger-ui',
                deepLinking: true,
                presets: [
                    SwaggerUIBundle.presets.apis,
                    SwaggerUIStandalonePreset
                ],
                plugins: [
                    SwaggerUIBundle.plugins.DownloadUrl
                ],
                layout: "StandaloneLayout",
                defaultModelsExpandDepth: 1,
                defaultModelExpandDepth: 1,
                docExpansion: "list",
                filter: true,
                showRequestHeaders: true,
                supportedSubmitMethods: ['get', 'post', 'put', 'delete', 'patch'],
                validatorUrl: null,
                // Add custom request interceptor to handle CORS
                requestInterceptor: (request) => {
                    request.credentials = 'include';
                    return request;
                }
            });

            window.ui = ui;
        };
    </script>
</body>
</html>
