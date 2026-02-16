#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="${COMPOSE_FILE:-$ROOT_DIR/docker-compose.yml}"
SERVICE="${POSTGRES_SERVICE:-postgres}"
DB_USER="${POSTGRES_USER:-opex_user}"
DB_NAME="${POSTGRES_DB:-opex_db}"
BACKUP_FILE=""
RESET_SCHEMA="false"
ASSUME_YES="false"

log() {
  printf "[db-restore] %s\n" "$*"
}

die() {
  printf "[db-restore][error] %s\n" "$*" >&2
  exit 1
}

usage() {
  cat <<EOF
Usage: bash scripts/db-restore.sh --file <backup.sql> [options]

Options:
  --file <path>      Backup file path (required)
  --reset            Drop and recreate public schema before restore
  --yes              Skip confirmation prompt
  -h, --help         Show this help
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --file)
      [[ $# -lt 2 ]] && die "--file requires a path"
      BACKUP_FILE="$2"
      shift 2
      ;;
    --reset)
      RESET_SCHEMA="true"
      shift
      ;;
    --yes)
      ASSUME_YES="true"
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      die "Unknown argument: $1"
      ;;
  esac
done

[[ -z "$BACKUP_FILE" ]] && die "--file is required"
[[ -f "$BACKUP_FILE" ]] || die "Backup file not found: $BACKUP_FILE"
command -v docker >/dev/null 2>&1 || die "docker command not found"

if ! docker compose -f "$COMPOSE_FILE" ps --status running "$SERVICE" >/dev/null 2>&1; then
  die "Postgres service '$SERVICE' is not running. Start infra first (make infra-up)."
fi

if [[ "$ASSUME_YES" != "true" ]]; then
  printf "This will restore '%s' into '%s' database. Continue? [y/N]: " "$BACKUP_FILE" "$DB_NAME"
  read -r response
  if [[ ! "$response" =~ ^[Yy]$ ]]; then
    die "Restore cancelled by user."
  fi
fi

if [[ "$RESET_SCHEMA" == "true" ]]; then
  log "Resetting public schema before restore..."
  docker compose -f "$COMPOSE_FILE" exec -T "$SERVICE" psql -U "$DB_USER" -d "$DB_NAME" \
    -c "DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;"
fi

log "Restoring backup from: $BACKUP_FILE"
cat "$BACKUP_FILE" | docker compose -f "$COMPOSE_FILE" exec -T "$SERVICE" psql -U "$DB_USER" -d "$DB_NAME"

log "Restore completed successfully."
