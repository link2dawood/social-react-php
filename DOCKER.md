# Docker Setup Guide

This guide explains how to run the full-stack application using Docker.

## Prerequisites

- Docker Desktop (or Docker Engine + Docker Compose)
- Git (to clone the repository)

## Quick Start (Production)

### 1. Build and Run

```bash
# Build the production image
docker-compose build

# Start the container
docker-compose up -d

# View logs
docker-compose logs -f
```

The application will be available at `http://localhost:8080`

### 2. Initialize Database

```bash
# Run database initialization
docker-compose exec app php /var/www/html/backend/init.php
docker-compose exec app php /var/www/html/backend/migrate_schema.php
```

Or access the container shell:
```bash
docker-compose exec app bash
cd /var/www/html/backend
php init.php
php migrate_schema.php
```

## Development Mode

For development with hot reload:

```bash
# Start both backend and frontend dev servers
docker-compose -f docker-compose.dev.yml up

# Or start only backend
docker-compose up backend
```

- Backend: `http://localhost:8080`
- Frontend Dev Server: `http://localhost:5173`

## Docker Commands

### Build Images

```bash
# Build production image
docker-compose build

# Build without cache
docker-compose build --no-cache
```

### Start/Stop Services

```bash
# Start in background
docker-compose up -d

# Start in foreground (see logs)
docker-compose up

# Stop services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f app
```

### Access Container Shell

```bash
docker-compose exec app bash
```

### Database Backup

```bash
# Copy database from container
docker-compose cp app:/var/www/html/backend/database.db ./backend/database.db.backup
```

### Database Restore

```bash
# Copy database to container
docker-compose cp ./backend/database.db.backup app:/var/www/html/backend/database.db
```

## Environment Variables

Create a `.env` file in the project root:

```env
# PHP Configuration
PHP_MEMORY_LIMIT=256M
PHP_UPLOAD_MAX_FILESIZE=50M

# Application URLs
APP_URL=http://localhost:8080
API_URL=http://localhost:8080/backend
```

## Volumes

The following directories are mounted as volumes for data persistence:

- `./backend/database.db` - SQLite database
- `./backend/uploads` - Uploaded files

## Troubleshooting

### Port Already in Use

If port 8080 is already in use, change it in `docker-compose.yml`:

```yaml
ports:
  - "3000:80"  # Use port 3000 instead
```

### Permission Issues

If you encounter permission issues:

```bash
# Fix permissions
docker-compose exec app chown -R www-data:www-data /var/www/html
docker-compose exec app chmod -R 755 /var/www/html
docker-compose exec app chmod 666 /var/www/html/backend/database.db
```

### Database Not Initializing

Manually initialize:

```bash
docker-compose exec app bash
cd /var/www/html/backend
php init.php
php migrate_schema.php
exit
```

### Rebuild After Code Changes

```bash
# Rebuild and restart
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### View Apache Error Logs

```bash
docker-compose exec app tail -f /var/log/apache2/error.log
```

## Production Deployment

For production deployment:

1. Update `.env` with production URLs
2. Set proper file permissions
3. Use environment-specific configuration
4. Enable HTTPS (use reverse proxy like Nginx)
5. Set up regular database backups

### Example Production Setup with Nginx

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Multi-Stage Build

The `Dockerfile.frontend` uses a multi-stage build:
1. **Builder stage**: Builds the React frontend
2. **Production stage**: Serves both PHP backend and built frontend

This results in a smaller final image.

## Health Checks

The docker-compose.yml includes a health check that verifies the API is responding. Check status:

```bash
docker-compose ps
```

## Clean Up

Remove everything:

```bash
# Stop and remove containers, networks
docker-compose down

# Also remove volumes
docker-compose down -v

# Remove images
docker-compose down --rmi all
```

