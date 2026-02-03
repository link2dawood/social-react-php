# How to Run This Project - Command Reference

This guide provides all the commands you need to run the project.

## Quick Start Commands

### Option 1: Docker (Recommended - Easiest)

```bash
# 1. Navigate to project directory
cd php-backend-social-media-ecommerce-generic-1769754811705

# 2. Create environment files (if not exists)
# Windows PowerShell:
.\create-env.ps1

# Linux/Mac:
chmod +x create-env.sh
./create-env.sh

# 3. Build Docker image
docker-compose build

# 4. Start the application
docker-compose up -d

# 5. Initialize database
docker-compose exec app php /var/www/html/backend/init.php
docker-compose exec app php /var/www/html/backend/migrate_schema.php

# 6. View logs
docker-compose logs -f

# Access the application at: http://localhost:8080
```

### Option 2: Local Development (Without Docker)

#### Backend Setup

```bash
# Navigate to project directory
cd php-backend-social-media-ecommerce-generic-1769754811705

# Create environment files
# Windows:
.\create-env.ps1
# Linux/Mac:
./create-env.sh

# Initialize database
cd backend
php init.php
php migrate_schema.php

# Start PHP development server
php -S localhost:8000
```

#### Frontend Setup (in a new terminal)

```bash
# Navigate to frontend directory
cd php-backend-social-media-ecommerce-generic-1769754811705/frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Access frontend at: http://localhost:5173
```

#### Production Build

```bash
# Build frontend for production
cd frontend
npm run build

# The built files will be in ../public directory
```

## Complete Command Reference

### Docker Commands

#### Build and Start

```bash
# Build the Docker image
docker-compose build

# Build without cache (if having issues)
docker-compose build --no-cache

# Start containers in background
docker-compose up -d

# Start containers in foreground (see logs)
docker-compose up

# Stop containers
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

#### Database Operations

```bash
# Initialize database
docker-compose exec app php /var/www/html/backend/init.php

# Run migration
docker-compose exec app php /var/www/html/backend/migrate_schema.php

# Access database directly
docker-compose exec app sqlite3 /var/www/html/backend/database.db

# Backup database
docker-compose cp app:/var/www/html/backend/database.db ./backend/database.db.backup

# Restore database
docker-compose cp ./backend/database.db.backup app:/var/www/html/backend/database.db
```

#### Container Management

```bash
# View running containers
docker-compose ps

# View logs
docker-compose logs -f

# View logs for specific service
docker-compose logs -f app

# Access container shell
docker-compose exec app bash

# Restart containers
docker-compose restart

# Stop specific service
docker-compose stop app

# Start specific service
docker-compose start app
```

#### Development Mode (Hot Reload)

```bash
# Start development environment
docker-compose -f docker-compose.dev.yml up

# Stop development environment
docker-compose -f docker-compose.dev.yml down
```

### Local Development Commands

#### Backend (PHP)

```bash
# Navigate to backend
cd backend

# Initialize database
php init.php

# Run migration
php migrate_schema.php

# Start PHP server (port 8000)
php -S localhost:8000

# Start PHP server on different port
php -S localhost:3000

# Check PHP version
php -v

# Check if SQLite extension is enabled
php -m | grep sqlite
```

#### Frontend (React/Node)

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Install with legacy peer deps (if conflicts)
npm install --legacy-peer-deps

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint

# Check Node version
node -v

# Check npm version
npm -v
```

### Environment Setup Commands

```bash
# Create .env files (Windows)
.\create-env.ps1

# Create .env files (Linux/Mac)
chmod +x create-env.sh
./create-env.sh

# Manual creation
cp .env.example .env
cp frontend/.env.example frontend/.env

# Edit .env file (Windows)
notepad .env

# Edit .env file (Linux/Mac)
nano .env
# or
vim .env
```

### Database Commands

#### Using SQLite directly

```bash
# Access SQLite database
sqlite3 backend/database.db

# Run SQL file
sqlite3 backend/database.db < backend/setup.sql

# Backup database
cp backend/database.db backend/database.db.backup

# View database schema
sqlite3 backend/database.db ".schema"

# List all tables
sqlite3 backend/database.db ".tables"
```

#### Using Docker

```bash
# Access database in container
docker-compose exec app sqlite3 /var/www/html/backend/database.db

# Run SQL commands
docker-compose exec app sqlite3 /var/www/html/backend/database.db "SELECT * FROM users;"
```

### Utility Commands

#### Check Project Status

```bash
# Check if Docker is running
docker ps

# Check Docker Compose version
docker-compose --version

# Check if port is in use (Windows)
netstat -ano | findstr :8080

# Check if port is in use (Linux/Mac)
lsof -i :8080
# or
netstat -tulpn | grep :8080

# Check PHP configuration
php -i

# Check Apache modules (if using Apache)
apache2ctl -M
```

#### File Permissions (Linux/Mac)

```bash
# Set proper permissions
chmod 755 backend/
chmod 666 backend/database.db
chmod 755 backend/uploads/
chmod +x create-env.sh
chmod +x docker-entrypoint.sh
```

#### Cleanup Commands

```bash
# Remove Docker containers and volumes
docker-compose down -v

# Remove Docker images
docker-compose down --rmi all

# Clean npm cache
npm cache clean --force

# Remove node_modules
rm -rf frontend/node_modules
# or Windows:
rmdir /s frontend\node_modules

# Remove build files
rm -rf frontend/dist
rm -rf public
```

## Step-by-Step Setup (First Time)

### Complete Setup with Docker

```bash
# 1. Navigate to project
cd php-backend-social-media-ecommerce-generic-1769754811705

# 2. Create environment files
.\create-env.ps1  # Windows
# or
./create-env.sh   # Linux/Mac

# 3. Build Docker image
docker-compose build

# 4. Start containers
docker-compose up -d

# 5. Initialize database
docker-compose exec app php /var/www/html/backend/init.php
docker-compose exec app php /var/www/html/backend/migrate_schema.php

# 6. Check status
docker-compose ps

# 7. View logs
docker-compose logs -f

# 8. Access application
# Open browser: http://localhost:8080
```

### Complete Setup (Local Development)

```bash
# Terminal 1 - Backend
cd php-backend-social-media-ecommerce-generic-1769754811705
.\create-env.ps1  # or ./create-env.sh
cd backend
php init.php
php migrate_schema.php
php -S localhost:8000

# Terminal 2 - Frontend
cd php-backend-social-media-ecommerce-generic-1769754811705/frontend
npm install
npm run dev

# Access:
# Frontend: http://localhost:5173
# Backend API: http://localhost:8000/backend
```

## Troubleshooting Commands

```bash
# Rebuild everything
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Check container logs
docker-compose logs app

# Check container status
docker-compose ps

# Restart services
docker-compose restart

# Fix permissions (Linux/Mac)
docker-compose exec app chmod 666 /var/www/html/backend/database.db
docker-compose exec app chmod 755 /var/www/html/backend/uploads

# View Apache error logs
docker-compose exec app tail -f /var/log/apache2/error.log

# Test API endpoint
curl http://localhost:8080/backend/auth.php?action=me

# Check environment variables in container
docker-compose exec app env | grep APP_
```

## Using Make Commands (Linux/Mac)

If you have Make installed:

```bash
# Build images
make build

# Start containers
make up

# Stop containers
make down

# View logs
make logs

# Access shell
make shell

# Initialize database
make init-db

# Development mode
make dev

# Clean everything
make clean

# Rebuild everything
make rebuild

# Show help
make help
```

## Common Workflows

### Daily Development

```bash
# Start development
docker-compose -f docker-compose.dev.yml up

# Or locally:
# Terminal 1: cd backend && php -S localhost:8000
# Terminal 2: cd frontend && npm run dev
```

### Testing Production Build

```bash
# Build frontend
cd frontend && npm run build

# Start Docker production
docker-compose up -d

# Test at http://localhost:8080
```

### Database Reset

```bash
# Stop containers
docker-compose down

# Remove database
rm backend/database.db  # or del backend\database.db on Windows

# Start containers
docker-compose up -d

# Reinitialize database
docker-compose exec app php /var/www/html/backend/init.php
docker-compose exec app php /var/www/html/backend/migrate_schema.php
```

## Quick Reference

| Task | Command |
|------|---------|
| Start Docker | `docker-compose up -d` |
| Stop Docker | `docker-compose down` |
| View Logs | `docker-compose logs -f` |
| Access Shell | `docker-compose exec app bash` |
| Init Database | `docker-compose exec app php /var/www/html/backend/init.php` |
| Start Dev Server | `cd frontend && npm run dev` |
| Build Frontend | `cd frontend && npm run build` |
| Start PHP Server | `cd backend && php -S localhost:8000` |

## Access URLs

- **Production (Docker)**: http://localhost:8080
- **Frontend Dev**: http://localhost:5173
- **Backend API**: http://localhost:8000/backend
- **Backend API (Docker)**: http://localhost:8080/backend

