#!/bin/bash

# Script to create .env files from examples

echo "Creating .env files from examples..."

# Create main .env file if it doesn't exist
if [ ! -f .env ]; then
    cp .env.example .env
    echo "✓ Created .env file"
else
    echo "⚠ .env file already exists, skipping..."
fi

# Create frontend .env file if it doesn't exist
if [ ! -f frontend/.env ]; then
    cp frontend/.env.example frontend/.env
    echo "✓ Created frontend/.env file"
else
    echo "⚠ frontend/.env file already exists, skipping..."
fi

echo ""
echo "✅ Environment files created!"
echo ""
echo "⚠️  IMPORTANT: Edit .env and frontend/.env files with your configuration values"
echo "   - Change SECRET_KEY and JWT_SECRET to random values"
echo "   - Update APP_URL for your environment"
echo "   - Configure database settings if needed"
echo ""

