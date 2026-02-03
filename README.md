# Full Stack Social Media Platform

This is a complete full-stack social media platform integrating a React frontend with a PHP backend.

## Quick Start

### Prerequisites Setup

1. **Create environment files:**
```bash
# Linux/Mac
chmod +x create-env.sh
./create-env.sh

# Windows PowerShell
.\create-env.ps1
```

2. **Edit `.env` and `frontend/.env`** with your configuration (see [ENV_CONFIG.md](ENV_CONFIG.md))

### Option 1: Docker (Recommended - Easiest)

**Quick Commands:**
```bash
docker-compose build                    # Build image
docker-compose up -d                    # Start application
docker-compose exec app php /var/www/html/backend/init.php  # Init database
docker-compose exec app php /var/www/html/backend/migrate_schema.php  # Migrate
docker-compose logs -f                  # View logs
```

**Access:** http://localhost:8080

See [RUN.md](RUN.md) for complete command reference.

```bash
# Build and start the application
docker-compose up -d

# Initialize the database
docker-compose exec app php /var/www/html/backend/init.php
docker-compose exec app php /var/www/html/backend/migrate_schema.php

# View logs
docker-compose logs -f
```

The application will be available at `http://localhost:8080`

For development with hot reload:
```bash
docker-compose -f docker-compose.dev.yml up
```

See [DOCKER.md](DOCKER.md) for detailed Docker instructions.

### Option 2: Local Setup

**Backend:**
```bash
cd backend
php init.php                           # Initialize database
php migrate_schema.php                 # Run migration
php -S localhost:8000                  # Start PHP server
```

**Frontend (new terminal):**
```bash
cd frontend
npm install                             # Install dependencies
npm run dev                             # Start dev server
```

**Access:** 
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000/backend

### Option 3: Manual Setup

See [SETUP.md](SETUP.md) for detailed instructions.

## Command Reference

For all available commands, see **[RUN.md](RUN.md)** - Complete command reference guide.

## Project Structure

- `backend/` - PHP API endpoints and database
- `frontend/` - React TypeScript frontend
- `public/` - Built frontend files (generated after build)

## Development

### Backend (PHP)
```bash
cd backend
php -S localhost:8000
```

### Frontend (React)
```bash
cd frontend
npm run dev
```

The frontend dev server runs on `http://localhost:5173` and proxies API requests to the backend.

## Production

1. Build the frontend:
```bash
cd frontend
npm run build
```

2. Configure your web server to:
   - Serve static files from `public/`
   - Route `/backend/*` to PHP backend
   - Use the root `.htaccess` for routing

## Features

- User authentication (signup/login)
- Social media posts with likes and comments
- User profiles with political party affiliation
- Follow/unfollow system
- Real-time messaging
- File uploads
- Admin panel
- Analytics

## API Documentation

See `backend/README.md` for complete API endpoint documentation.

## Requirements

- PHP 7.4+
- Node.js 18+
- SQLite extension
- Apache/Nginx (or PHP built-in server for dev)

## License

See individual component licenses.
