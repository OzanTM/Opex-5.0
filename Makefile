SHELL := /bin/bash

.PHONY: help first-setup bootstrap start stop restart status infra-up infra-down infra-logs db-reset seed backup-db restore-db backup-cron-install backup-cron-remove backup-cron-show secrets-aws-backend secrets-aws-frontend validate-prod-env prod-sync-secrets prod-deploy render-systemd-units render-nginx-config domain-ssl-preflight render-monitoring-config monitoring-up monitoring-down monitoring-status monitoring-logs monitoring-check ops-health-check perf-smoke backend-test frontend-test e2e-smoke branch-protect release-check test clean

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
	@echo "  make backup-db    - Create PostgreSQL backup to ./backups"
	@echo "  make restore-db   - Restore PostgreSQL from BACKUP_FILE (destructive if --reset used)"
	@echo "  make backup-cron-install - Install daily backup cron (optional HOUR/MINUTE/RETENTION_DAYS)"
	@echo "  make backup-cron-remove  - Remove backup cron entry"
	@echo "  make backup-cron-show    - Show backup cron entry"
	@echo "  make secrets-aws-backend - Export backend env file from AWS Secrets Manager"
	@echo "  make secrets-aws-frontend - Export frontend env file from AWS Secrets Manager"
	@echo "  make validate-prod-env   - Validate backend/frontend production env files"
	@echo "  make prod-sync-secrets   - Sync backend/frontend env from AWS Secrets Manager and apply runtime backend env"
	@echo "  make prod-deploy         - Server deploy flow (checkout ref + sync secrets + build + migrate + restart)"
	@echo "  make render-systemd-units - Render backend/frontend systemd unit files"
	@echo "  make render-nginx-config - Render production nginx config for domain+ssl"
	@echo "  make domain-ssl-preflight - Validate DNS/HTTPS readiness for app+api domains"
	@echo "  make render-monitoring-config - Render Prometheus probe targets for local/prod"
	@echo "  make monitoring-up  - Start Prometheus/Grafana/Alertmanager monitoring stack"
	@echo "  make monitoring-down - Stop monitoring stack"
	@echo "  make monitoring-status - Show monitoring stack status"
	@echo "  make monitoring-logs - Tail monitoring stack logs"
	@echo "  make monitoring-check - Check monitoring HTTP endpoints"
	@echo "  make ops-health-check - Run basic backend/frontend/docs availability checks"
	@echo "  make perf-smoke   - Run backend performance smoke test (p95/p99 check)"
	@echo "  make test         - Run backend + frontend tests"
	@echo "  make e2e-smoke    - Run CI-like Playwright smoke flow (resets DB)"
	@echo "  make branch-protect - Apply GitHub main branch protection (requires GITHUB_TOKEN)"
	@echo "  make release-check - Run release gate checks (build + tests + e2e smoke)"
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

backup-db:
	@bash scripts/db-backup.sh

restore-db:
	@if [ -z "$(BACKUP_FILE)" ]; then \
		echo "Usage: make restore-db BACKUP_FILE=backups/<file>.sql"; \
		exit 1; \
	fi
	@bash scripts/db-restore.sh --file "$(BACKUP_FILE)"

backup-cron-install:
	@bash scripts/setup-backup-cron.sh --install --hour "$(or $(HOUR),2)" --minute "$(or $(MINUTE),0)" --retention-days "$(or $(RETENTION_DAYS),14)"

backup-cron-remove:
	@bash scripts/setup-backup-cron.sh --remove

backup-cron-show:
	@bash scripts/setup-backup-cron.sh --show

secrets-aws-backend:
	@if [ -z "$(SECRET_ID)" ]; then \
		echo "Usage: make secrets-aws-backend SECRET_ID=<aws-secret-id> [REGION=eu-west-1] [OUT=backend/.env.production]"; \
		exit 1; \
	fi
	@bash scripts/aws-secrets-to-env.sh --secret-id "$(SECRET_ID)" --region "$(or $(REGION),eu-west-1)" --out "$(or $(OUT),backend/.env.production)"

secrets-aws-frontend:
	@if [ -z "$(SECRET_ID)" ]; then \
		echo "Usage: make secrets-aws-frontend SECRET_ID=<aws-secret-id> [REGION=eu-west-1] [OUT=frontend/.env.production]"; \
		exit 1; \
	fi
	@bash scripts/aws-secrets-to-env.sh --secret-id "$(SECRET_ID)" --region "$(or $(REGION),eu-west-1)" --out "$(or $(OUT),frontend/.env.production)"

validate-prod-env:
	@bash scripts/validate-production-env.sh --backend-file "$(or $(BACKEND_ENV_FILE),backend/.env.production)" --frontend-file "$(or $(FRONTEND_ENV_FILE),frontend/.env.production)"

prod-sync-secrets:
	@if [ -z "$(BACKEND_SECRET_ID)" ] || [ -z "$(FRONTEND_SECRET_ID)" ]; then \
		echo "Usage: make prod-sync-secrets BACKEND_SECRET_ID=<id> FRONTEND_SECRET_ID=<id> [REGION=eu-west-1]"; \
		exit 1; \
	fi
	@bash scripts/production-sync-secrets.sh --backend-secret-id "$(BACKEND_SECRET_ID)" --frontend-secret-id "$(FRONTEND_SECRET_ID)" --region "$(or $(REGION),eu-west-1)" --apply-runtime-files

prod-deploy:
	@if [ -z "$(REF)" ] || [ -z "$(BACKEND_SECRET_ID)" ] || [ -z "$(FRONTEND_SECRET_ID)" ]; then \
		echo "Usage: make prod-deploy REF=<git-ref> BACKEND_SECRET_ID=<id> FRONTEND_SECRET_ID=<id> [REGION=eu-west-1] [RESTART_CMD='sudo systemctl restart opex-backend opex-frontend']"; \
		exit 1; \
	fi
	@bash scripts/production-deploy.sh --ref "$(REF)" --backend-secret-id "$(BACKEND_SECRET_ID)" --frontend-secret-id "$(FRONTEND_SECRET_ID)" --region "$(or $(REGION),eu-west-1)" $(if $(RESTART_CMD),--restart-cmd "$(RESTART_CMD)",)

render-systemd-units:
	@if [ -z "$(APP_DIR)" ] || [ -z "$(RUN_USER)" ]; then \
		echo "Usage: make render-systemd-units APP_DIR=/opt/opex-5.0 RUN_USER=opex [RUN_GROUP=opex] [BACKEND_PORT=3001] [FRONTEND_PORT=3000] [OUT_DIR=ops/systemd/generated]"; \
		exit 1; \
	fi
	@bash scripts/render-systemd-units.sh --app-dir "$(APP_DIR)" --run-user "$(RUN_USER)" --run-group "$(or $(RUN_GROUP),$(RUN_USER))" --backend-port "$(or $(BACKEND_PORT),3001)" --frontend-port "$(or $(FRONTEND_PORT),3000)" --out-dir "$(or $(OUT_DIR),ops/systemd/generated)"

render-nginx-config:
	@if [ -z "$(APP_DOMAIN)" ] || [ -z "$(API_DOMAIN)" ]; then \
		echo "Usage: make render-nginx-config APP_DOMAIN=<app-domain> API_DOMAIN=<api-domain> [FRONTEND_UPSTREAM=http://127.0.0.1:3000] [BACKEND_UPSTREAM=http://127.0.0.1:3001] [OUT=ops/nginx/opex.conf]"; \
		exit 1; \
	fi
	@bash scripts/render-nginx-config.sh --app-domain "$(APP_DOMAIN)" --api-domain "$(API_DOMAIN)" --frontend-upstream "$(or $(FRONTEND_UPSTREAM),http://127.0.0.1:3000)" --backend-upstream "$(or $(BACKEND_UPSTREAM),http://127.0.0.1:3001)" --out "$(or $(OUT),ops/nginx/opex.conf)"

domain-ssl-preflight:
	@if [ -z "$(APP_DOMAIN)" ] || [ -z "$(API_DOMAIN)" ]; then \
		echo "Usage: make domain-ssl-preflight APP_DOMAIN=<app-domain> API_DOMAIN=<api-domain> [SKIP_HTTPS=true]"; \
		exit 1; \
	fi
	@bash scripts/domain-ssl-preflight.sh --app-domain "$(APP_DOMAIN)" --api-domain "$(API_DOMAIN)" $(if $(filter true,$(SKIP_HTTPS)),--skip-https-check,)

render-monitoring-config:
	@bash scripts/render-monitoring-config.sh --frontend-url "$(or $(FRONTEND_PROBE_URL),http://host.docker.internal:3000)" --backend-health-url "$(or $(BACKEND_HEALTH_URL),http://host.docker.internal:3001/api/v1/health)" --out "$(or $(OUT),ops/monitoring/prometheus.generated.yml)"

monitoring-up:
	@bash scripts/render-monitoring-config.sh --frontend-url "$(or $(FRONTEND_PROBE_URL),http://host.docker.internal:3000)" --backend-health-url "$(or $(BACKEND_HEALTH_URL),http://host.docker.internal:3001/api/v1/health)" --out "ops/monitoring/prometheus.generated.yml"
	@docker compose -f ops/monitoring/docker-compose.monitoring.yml up -d

monitoring-down:
	@docker compose -f ops/monitoring/docker-compose.monitoring.yml down

monitoring-status:
	@docker compose -f ops/monitoring/docker-compose.monitoring.yml ps

monitoring-logs:
	@docker compose -f ops/monitoring/docker-compose.monitoring.yml logs -f --tail=100

monitoring-check:
	@bash scripts/monitoring-check.sh

ops-health-check:
	@bash scripts/ops-health-check.sh

perf-smoke:
	@bash scripts/perf-smoke.sh

backend-test:
	@cd backend && npm test -- --runInBand

frontend-test:
	@cd frontend && npm test -- --runInBand

e2e-smoke:
	@bash scripts/e2e-smoke.sh

branch-protect:
	@bash scripts/setup-branch-protection.sh --apply

release-check:
	@cd backend && npm run build
	@cd backend && npm test -- --runInBand
	@cd frontend && npm run build
	@cd frontend && npm test -- --runInBand
	@bash scripts/e2e-smoke.sh

test: backend-test frontend-test

clean:
	@rm -rf .pids .logs
	@echo "Removed .pids and .logs"
