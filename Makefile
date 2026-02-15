SHELL := /bin/bash

.PHONY: help first-setup bootstrap start stop restart status infra-up infra-down infra-logs db-reset seed backend-test frontend-test test clean

help:
	@echo "Available targets:"
	@echo "  make first-setup  - First run: install deps, prepare DB, seed data, start apps"
	@echo "  make start        - Start local infra + backend + frontend"
	@echo "  make stop         - Stop backend + frontend (keeps docker infra running)"
	@echo "  make restart      - Restart backend + frontend"
	@echo "  make status       - Show docker/process/health status"
	@echo "  make bootstrap    - Install backend/frontend dependencies"
	@echo "  make infra-up     - Start docker services (postgres, redis, minio)"
	@echo "  make infra-down   - Stop docker services"
	@echo "  make db-reset     - Reset database schema (destructive)"
	@echo "  make seed         - Seed test users and sample data"
	@echo "  make test         - Run backend + frontend tests"
	@echo "  make clean        - Remove local pid/log folders created by scripts"

first-setup:
	@bash scripts/dev-start.sh --bootstrap --seed

start:
	@bash scripts/dev-start.sh

stop:
	@bash scripts/dev-stop.sh

restart:
	@bash scripts/dev-stop.sh
	@bash scripts/dev-start.sh

status:
	@bash scripts/dev-start.sh --status

bootstrap:
	@cd backend && npm ci
	@cd frontend && npm ci

infra-up:
	@docker compose up -d postgres redis minio

infra-down:
	@docker compose down

infra-logs:
	@docker compose logs -f --tail=100

db-reset:
	@cd backend && npx prisma migrate reset --force --skip-seed

seed:
	@cd backend && npm run db:seed

backend-test:
	@cd backend && npm test -- --runInBand

frontend-test:
	@cd frontend && npm test -- --runInBand

test: backend-test frontend-test

clean:
	@rm -rf .pids .logs
	@echo "Removed .pids and .logs"
