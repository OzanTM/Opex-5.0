#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_DIR="${BACKUP_DIR:-$ROOT_DIR/backups}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"

log() {
  printf "[db-backup-rotate] %s\n" "$*"
}

die() {
  printf "[db-backup-rotate][error] %s\n" "$*" >&2
  exit 1
}

if ! [[ "$RETENTION_DAYS" =~ ^[0-9]+$ ]]; then
  die "RETENTION_DAYS must be a non-negative integer"
fi

mkdir -p "$BACKUP_DIR"

log "Starting backup job"
bash "$ROOT_DIR/scripts/db-backup.sh"

log "Applying retention policy: keep last ${RETENTION_DAYS} days"
find "$BACKUP_DIR" -type f -name 'opex_db_*.sql' -mtime +"$RETENTION_DAYS" -print -delete

log "Backup rotation completed"
