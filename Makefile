# Claude Code Auto-Confirm Extension Makefile

.PHONY: help dev build test lint clean install setup

# Default target
help:
	@echo "Claude Code Auto-Confirm Extension"
	@echo ""
	@echo "Available commands:"
	@echo "  make setup     - Setup the auto-confirm extension"
	@echo "  make test      - Run tests"
	@echo "  make dev       - Development mode (enable auto-confirm)"
	@echo "  make build     - Build and verify functionality"
	@echo "  make lint      - Check code style and formatting"
	@echo "  make clean     - Clean temporary files"
	@echo "  make install   - Install extension files"
	@echo ""

# Setup the extension
setup:
	@echo "Setting up Claude Code Auto-Confirm extension..."
	@mkdir -p .claude/agents .claude/commands .claude/utils .claude/tests
	@chmod +x .claude/utils/auto-confirm-checker.js 2>/dev/null || true
	@chmod +x .claude/tests/auto-confirm.test.js 2>/dev/null || true
	@echo "✅ Extension setup complete"
	@echo "Use '/auto-confirm on' to enable auto-confirmation"

# Development mode
dev:
	@echo "Enabling auto-confirm for development..."
	@node .claude/utils/auto-confirm-checker.js status >/dev/null 2>&1 && echo "✅ Auto-confirm already enabled" || (echo "Enabling auto-confirm..." && echo '{"enabled":true,"agentName":"auto-confirm","version":"1.0.0","lastModified":"'$$(date -u +"%Y-%m-%dT%H:%M:%SZ")'","description":"Configuration for Claude Code auto-confirmation behavior"}' > .claude/auto-confirm-config.json && echo "✅ Auto-confirm enabled")

# Run tests
test:
	@echo "Running auto-confirm tests..."
	@node .claude/tests/auto-confirm.test.js

# Build and verify
build:
	@echo "Building and verifying auto-confirm extension..."
	@make setup
	@make test
	@echo "✅ Build complete"

# Lint (basic checks)
lint:
	@echo "Checking extension files..."
	@test -f .claude/agents/auto-confirm.md || (echo "❌ Missing agent file" && exit 1)
	@test -f .claude/commands/auto-confirm.md || (echo "❌ Missing command file" && exit 1)
	@test -f .claude/utils/auto-confirm-checker.js || (echo "❌ Missing utility script" && exit 1)
	@test -f .claude/tests/auto-confirm.test.js || (echo "❌ Missing test file" && exit 1)
	@echo "✅ All extension files present"

# Clean temporary files
clean:
	@echo "Cleaning temporary files..."
	@rm -rf .claude/tests/test-workspace
	@echo "✅ Clean complete"

# Install extension files (already in place, just verify)
install: setup
	@echo "✅ Extension installed and ready to use"
	@echo "Commands available:"
	@echo "  /auto-confirm on    - Enable auto-confirmation"
	@echo "  /auto-confirm off   - Disable auto-confirmation"
	@echo "  /auto-confirm status - Check current status"