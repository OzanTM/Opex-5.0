#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="${COMPOSE_FILE:-$ROOT_DIR/docker-compose.yml}"
SERVICE="${POSTGRES_SERVICE:-postgres}"
DB_USER="${POSTGRES_USER:-opex_user}"
DB_NAME="${POSTGRES_DB:-opex_db}"
BACKUP_DIR="${BACKUP_DIR:-$ROOT_DIR/backups}"
OUTPUT_FILE=""

log() {
  printf "[db-backup] %s\n" "$*"
}

die() {
  printf "[db-backup][error] %s\n" "$*" >&2
  exit 1
}

usage() {
  cat <<EOF
Usage: bash scripts/db-backup.sh [options]

Options:
  --out <path>       Output backup file path (default: backups/opex_db_<timestamp>.sql)
  -h, --help         Show this help
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --out)
      [[ $# -lt 2 ]] && die "--out requires a file path"
      OUTPUT_FILE="$2"
      shift 2
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

command -v docker >/dev/null 2>&1 || die "docker command not found"

if [[ -z "$OUTPUT_FILE" ]]; then
  mkdir -p "$BACKUP_DIR"
  OUTPUT_FILE="$BACKUP_DIR/opex_db_$(date +%Y%m%d_%H%M%S).sql"
else
  mkdir -p "$(dirname "$OUTPUT_FILE")"
fi

if ! docker compose -f "$COMPOSE_FILE" ps --status running "$SERVICE" >/dev/null 2>&1; then
  die "Postgres service '$SERVICE' is not running. Start infra first (make infra-up)."
fi

log "Creating backup: $OUTPUT_FILE"
docker compose -f "$COMPOSE_FILE" exec -T "$SERVICE" pg_dump -U "$DB_USER" -d "$DB_NAME" > "$OUTPUT_FILE"

log "Backup completed successfully."
