# Claude Auto-Confirm Makefile
.PHONY: dev build test lint clean install help

# Default target
.DEFAULT_GOAL := help

# Variables
NODE_VERSION := $(shell node --version 2>/dev/null || echo "not-installed")

## Development commands
dev: ## Start development server
	@echo "🚀 Starting development server..."
	npm run dev

install: ## Install dependencies
	@echo "📦 Installing dependencies..."
	npm install

## Build commands
build: clean ## Build the project
	@echo "🔨 Building project..."
	npm run build
	@echo "✅ Build complete"

clean: ## Clean build artifacts
	@echo "🧹 Cleaning build artifacts..."
	npm run clean
	rm -rf coverage/
	@echo "✅ Cleaned"

## Testing commands
test: ## Run tests
	@echo "🧪 Running tests..."
	npm test

test-watch: ## Run tests in watch mode
	@echo "🔄 Running tests in watch mode..."
	npm run test:watch

## Code quality commands
lint: ## Run linter
	@echo "🔍 Running linter..."
	npm run lint

lint-fix: ## Fix linting issues
	@echo "🔧 Fixing linting issues..."
	npm run lint:fix

format: ## Format code
	@echo "💅 Formatting code..."
	npm run format

## Utility commands
check: lint test build ## Run all checks (lint, test, build)
	@echo "✅ All checks passed"

setup: install ## Setup project for development
	@echo "🎯 Setting up project..."
	@if [ "$(NODE_VERSION)" = "not-installed" ]; then \
		echo "❌ Node.js not found. Please install Node.js 18+ first."; \
		exit 1; \
	fi
	cp .env.example .env
	@echo "✅ Project setup complete"
	@echo "Run 'make dev' to start development server"

audit: ## Run security audit
	@echo "🔒 Running security audit..."
	npm audit

help: ## Show this help
	@echo "Claude Auto-Confirm - Available commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "Examples:"
	@echo "  make setup    # First time setup"
	@echo "  make dev      # Start development"
	@echo "  make check    # Run all checks"