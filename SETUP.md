# Setup Guide - Full Stack Integration

This project integrates a React frontend with a PHP backend. Follow these steps to get it running.

## Prerequisites

- PHP 7.4 or higher
- Node.js 18+ and npm
- SQLite extension enabled in PHP
- Apache/Nginx web server (or use PHP built-in server for development)

## Installation Steps

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Initialize the database
php init.php

# Run the migration to add frontend-specific fields
php migrate_schema.php

# Set proper permissions (Linux/Mac)
chmod 755 .
chmod 666 database.db
chmod 755 uploads/
```

### 2. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Build the frontend for production
npm run build

# Or run in development mode
npm run dev
```

### 3. Development Setup

For development, you can run both servers:

**Terminal 1 - PHP Backend:**
```bash
cd backend
php -S localhost:8000
```

**Terminal 2 - Frontend Dev Server:**
```bash
cd frontend
npm run dev
```

The Vite dev server is configured to proxy `/backend` requests to `http://localhost`.

### 4. Production Setup

For production with Apache:

1. Build the frontend:
```bash
cd frontend
npm run build
```

2. The build output will be in the `public/` directory

3. Configure your web server to:
   - Serve files from the project root
   - Route API requests to `/backend/`
   - Serve the React app from `/public/` or root

4. Ensure `.htaccess` is enabled in Apache

### 5. Database Migration

If you already have a database, run the migration:

```bash
php backend/migrate_schema.php
```

This adds the following fields to support the frontend:
- `username` field to users table
- `party` field to users table
- `display_name` field to users table
- `type` and `party` fields to posts table
- Tips, hashtags, and trending topics tables

## Project Structure

```
php-backend-social-media-ecommerce-generic-1769754811705/
├── backend/              # PHP API endpoints
│   ├── auth.php         # Authentication
│   ├── content.php      # Posts and content
│   ├── social.php       # Follow/unfollow
│   ├── messages.php     # Messaging
│   ├── upload.php       # File uploads
│   └── database.db      # SQLite database
├── frontend/            # React frontend source
│   ├── src/
│   │   ├── components/  # React components
│   │   └── lib/
│   │       └── api.ts   # API service layer
│   └── package.json
└── public/              # Built frontend (after npm run build)
```

## API Endpoints

### Authentication
- `POST /backend/auth.php?action=signup` - Create account
- `POST /backend/auth.php?action=login` - Login
- `GET /backend/auth.php?action=me` - Get current user
- `POST /backend/auth.php?action=logout` - Logout

### Content
- `GET /backend/content.php?action=list` - List posts
- `GET /backend/content.php?action=get&id={id}` - Get post
- `POST /backend/content.php?action=create` - Create post
- `POST /backend/content.php?action=like&id={id}` - Like/unlike post
- `POST /backend/content.php?action=comment&id={id}` - Comment on post

### Social
- `POST /backend/social.php?action=follow&user_id={id}` - Follow user
- `POST /backend/social.php?action=unfollow&user_id={id}` - Unfollow user
- `GET /backend/social.php?action=followers&user_id={id}` - Get followers
- `GET /backend/social.php?action=following&user_id={id}` - Get following

## Troubleshooting

### CORS Issues
The backend already includes CORS headers. If you still see CORS errors:
- Ensure you're accessing via the same origin
- Check that credentials are being sent with requests

### Database Errors
- Ensure SQLite extension is enabled: `php -m | grep sqlite`
- Check file permissions on `database.db`
- Run `php backend/migrate_schema.php` if you see missing column errors

### Frontend Not Loading
- Ensure you've run `npm run build`
- Check that the `public/` directory exists and contains built files
- Verify `.htaccess` is working (check Apache mod_rewrite is enabled)

### API Not Responding
- Check PHP error logs
- Verify session is working (check `session_start()` in PHP files)
- Ensure database file exists and is writable

## Next Steps

1. Update `frontend/src/lib/api.ts` if your API base URL differs
2. Customize the frontend components in `frontend/src/components/`
3. Add more API endpoints in `backend/` as needed
4. Configure payment gateways and other settings through the admin panel

