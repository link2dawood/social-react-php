# Quick Start Guide

## Docker (Fastest Way)

### 1. Build and Run

```bash
docker-compose up -d
```

### 2. Initialize Database

```bash
docker-compose exec app php /var/www/html/backend/init.php
docker-compose exec app php /var/www/html/backend/migrate_schema.php
```

### 3. Access Application

Open your browser to: `http://localhost:8080`

That's it! The application is running.

## Local Development

### Prerequisites
- PHP 7.4+
- Node.js 18+
- SQLite extension

### Steps

1. **Initialize Backend**
```bash
cd backend
php init.php
php migrate_schema.php
```

2. **Setup Frontend**
```bash
cd frontend
npm install
npm run build
```

3. **Run Development Server**
```bash
# Terminal 1 - Backend
cd backend
php -S localhost:8000

# Terminal 2 - Frontend
cd frontend
npm run dev
```

## Using Make Commands (Linux/Mac)

```bash
make build    # Build Docker images
make up       # Start containers
make init-db  # Initialize database
make logs     # View logs
make shell    # Access container shell
make dev      # Start development environment
```

## Troubleshooting

### Port Already in Use
Change the port in `docker-compose.yml`:
```yaml
ports:
  - "3000:80"  # Use port 3000 instead of 8080
```

### Database Errors
```bash
# Reinitialize database
docker-compose exec app php /var/www/html/backend/init.php
docker-compose exec app php /var/www/html/backend/migrate_schema.php
```

### Permission Issues
```bash
docker-compose exec app chmod 666 /var/www/html/backend/database.db
docker-compose exec app chmod 755 /var/www/html/backend/uploads
```

