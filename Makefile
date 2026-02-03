.PHONY: help build up down logs shell init-db clean rebuild dev

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-15s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

build: ## Build Docker images
	docker-compose build

up: ## Start containers
	docker-compose up -d

down: ## Stop containers
	docker-compose down

logs: ## View container logs
	docker-compose logs -f

shell: ## Access container shell
	docker-compose exec app bash

init-db: ## Initialize database
	docker-compose exec app php /var/www/html/backend/init.php
	docker-compose exec app php /var/www/html/backend/migrate_schema.php

clean: ## Stop containers and remove volumes
	docker-compose down -v

rebuild: ## Rebuild and restart containers
	docker-compose down
	docker-compose build --no-cache
	docker-compose up -d
	make init-db

dev: ## Start development environment
	docker-compose -f docker-compose.dev.yml up

restart: ## Restart containers
	docker-compose restart

ps: ## Show running containers
	docker-compose ps

