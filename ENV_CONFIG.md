# Environment Configuration Guide

This project uses environment variables for configuration. This allows you to easily configure the application for different environments (development, staging, production) without changing code.

## Files

- `.env` - Main environment file (not committed to git)
- `.env.example` - Example/template file (committed to git)
- `frontend/.env` - Frontend-specific environment variables
- `frontend/.env.example` - Frontend example file

## Setup

1. Copy the example file to create your `.env`:
```bash
cp .env.example .env
cp frontend/.env.example frontend/.env
```

2. Edit `.env` and `frontend/.env` with your configuration values

3. **Important**: Never commit `.env` files to git (they're in `.gitignore`)

## Configuration Variables

### Application Settings

- `APP_ENV` - Environment: `development`, `staging`, `production`
- `APP_DEBUG` - Enable debug mode: `true` or `false`
- `APP_NAME` - Application name
- `APP_URL` - Base URL of the application

### Database Configuration

- `DB_TYPE` - Database type: `sqlite`, `mysql`, `pgsql`
- `DB_PATH` - Path to SQLite database file (for SQLite)
- `DB_HOST` - Database host (for MySQL/PostgreSQL)
- `DB_PORT` - Database port (for MySQL/PostgreSQL)
- `DB_NAME` - Database name (for MySQL/PostgreSQL)
- `DB_USER` - Database username (for MySQL/PostgreSQL)
- `DB_PASSWORD` - Database password (for MySQL/PostgreSQL)

### File Upload Settings

- `UPLOAD_DIR` - Directory for uploaded files
- `MAX_UPLOAD_SIZE` - Maximum upload size in bytes (default: 52428800 = 50MB)
- `ALLOWED_EXTENSIONS` - Comma-separated list of allowed file extensions

### Security Settings

- `SECRET_KEY` - Secret key for encryption (change in production!)
- `JWT_SECRET` - Secret key for JWT tokens (change in production!)
- `SESSION_LIFETIME` - Session lifetime in seconds (default: 7200 = 2 hours)
- `SESSION_NAME` - Session cookie name

### CORS Configuration

- `CORS_ALLOWED_ORIGINS` - Comma-separated list of allowed origins
- `CORS_ALLOWED_METHODS` - Comma-separated list of allowed HTTP methods
- `CORS_ALLOWED_HEADERS` - Comma-separated list of allowed headers

### API Configuration

- `API_BASE_URL` - Base URL for API endpoints (default: `/backend`)
- `API_VERSION` - API version (default: `v1`)

### Frontend Configuration (Vite)

- `VITE_API_BASE_URL` - API base URL for frontend
- `VITE_APP_NAME` - Application name for frontend
- `VITE_APP_URL` - Application URL for frontend
- `VITE_APP_ENV` - Frontend environment

**Note**: Vite environment variables must be prefixed with `VITE_` to be accessible in the frontend code.

### Email Configuration (Optional)

- `SMTP_HOST` - SMTP server hostname
- `SMTP_PORT` - SMTP server port
- `SMTP_USER` - SMTP username
- `SMTP_PASSWORD` - SMTP password
- `SMTP_FROM_EMAIL` - Default from email address
- `SMTP_FROM_NAME` - Default from name

### Payment Gateway Configuration (Optional)

- `STRIPE_PUBLIC_KEY` - Stripe public key
- `STRIPE_SECRET_KEY` - Stripe secret key
- `PAYPAL_CLIENT_ID` - PayPal client ID
- `PAYPAL_SECRET` - PayPal secret

### Admin Configuration

- `ADMIN_EMAIL` - Admin user email
- `ADMIN_PASSWORD` - Admin user password (change in production!)

### Logging

- `LOG_LEVEL` - Log level: `debug`, `info`, `warning`, `error`
- `LOG_FILE` - Path to log file

### Rate Limiting

- `RATE_LIMIT_ENABLED` - Enable rate limiting: `true` or `false`
- `RATE_LIMIT_REQUESTS` - Number of requests allowed
- `RATE_LIMIT_WINDOW` - Time window in seconds

### Cache Configuration

- `CACHE_ENABLED` - Enable caching: `true` or `false`
- `CACHE_DRIVER` - Cache driver: `file`, `redis`, `memcached`
- `CACHE_TTL` - Cache time-to-live in seconds

## Environment-Specific Configurations

### Development

```env
APP_ENV=development
APP_DEBUG=true
APP_URL=http://localhost:8080
VITE_API_BASE_URL=http://localhost:8080/backend
```

### Production

```env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://yourdomain.com
VITE_API_BASE_URL=https://yourdomain.com/backend
SECRET_KEY=your-random-secret-key-here
JWT_SECRET=your-random-jwt-secret-here
```

## Docker Usage

When using Docker, environment variables from `.env` are automatically loaded by docker-compose:

```yaml
env_file:
  - .env
```

You can also override specific variables:

```bash
docker-compose up -e APP_ENV=production
```

## Accessing Environment Variables

### In PHP (Backend)

```php
require_once 'env.php';

// Get a variable
$dbPath = Env::get('DB_PATH', 'default/path');

// Check if variable exists
if (Env::has('SMTP_HOST')) {
    // Use SMTP
}

// Get all variables
$allVars = Env::all();
```

Or use the constants defined in `config.php`:

```php
require_once 'config.php';

echo APP_NAME;
echo DB_PATH;
echo MAX_UPLOAD_SIZE;
```

### In React/TypeScript (Frontend)

```typescript
// Access Vite environment variables
const apiUrl = import.meta.env.VITE_API_BASE_URL
const appName = import.meta.env.VITE_APP_NAME

// With fallback
const apiUrl = import.meta.env.VITE_API_BASE_URL || '/backend'
```

## Security Best Practices

1. **Never commit `.env` files** - They contain sensitive information
2. **Use strong secrets** - Generate random strings for `SECRET_KEY` and `JWT_SECRET`
3. **Use different values per environment** - Don't use production secrets in development
4. **Restrict file permissions** - Make `.env` readable only by the application user
5. **Use environment-specific files** - Consider `.env.production`, `.env.staging` for different environments

## Generating Secure Keys

### Linux/Mac
```bash
# Generate a random secret key
openssl rand -base64 32

# Generate a JWT secret
openssl rand -hex 32
```

### Windows (PowerShell)
```powershell
# Generate a random secret key
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))

# Generate a JWT secret
-join ((48..57) + (97..102) | Get-Random -Count 64 | ForEach-Object {[char]$_})
```

## Troubleshooting

### Variables not loading
- Ensure `.env` file exists in the project root
- Check file permissions
- Verify no syntax errors (no spaces around `=`)
- Restart the server/container after changes

### Frontend variables not working
- Ensure variables are prefixed with `VITE_`
- Rebuild the frontend after changing `.env` files
- Check browser console for errors

### Docker environment issues
- Ensure `.env` file is in the same directory as `docker-compose.yml`
- Check `env_file` section in docker-compose.yml
- Restart containers after changing `.env`

