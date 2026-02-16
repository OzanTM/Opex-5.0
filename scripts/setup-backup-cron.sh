#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_DIR="$ROOT_DIR/.logs"
BACKUP_DIR_DEFAULT="$ROOT_DIR/backups"
MARKER="# OPEX_DB_BACKUP"
ACTION=""
HOUR="2"
MINUTE="0"
RETENTION_DAYS="14"
BACKUP_DIR="$BACKUP_DIR_DEFAULT"

log() {
  printf "[backup-cron] %s\n" "$*"
}

die() {
  printf "[backup-cron][error] %s\n" "$*" >&2
  exit 1
}

usage() {
  cat <<EOF
Usage: bash scripts/setup-backup-cron.sh [options]

Options:
  --install                 Install/update daily backup cron entry
  --remove                  Remove backup cron entry
  --show                    Show existing backup cron entry
  --hour <0-23>             Backup hour for --install (default: 2)
  --minute <0-59>           Backup minute for --install (default: 0)
  --retention-days <N>      Keep backups for N days (default: 14)
  --backup-dir <path>       Backup directory (default: ./backups)
  -h, --help                Show this help
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --install)
      ACTION="install"
      shift
      ;;
    --remove)
      ACTION="remove"
      shift
      ;;
    --show)
      ACTION="show"
      shift
      ;;
    --hour)
      [[ $# -lt 2 ]] && die "--hour requires a value"
      HOUR="$2"
      shift 2
      ;;
    --minute)
      [[ $# -lt 2 ]] && die "--minute requires a value"
      MINUTE="$2"
      shift 2
      ;;
    --retention-days)
      [[ $# -lt 2 ]] && die "--retention-days requires a value"
      RETENTION_DAYS="$2"
      shift 2
      ;;
    --backup-dir)
      [[ $# -lt 2 ]] && die "--backup-dir requires a path"
      BACKUP_DIR="$2"
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

[[ -z "$ACTION" ]] && die "One of --install, --remove or --show is required"
command -v crontab >/dev/null 2>&1 || die "crontab command not found"

if [[ "$ACTION" == "install" ]]; then
  [[ "$HOUR" =~ ^([01]?[0-9]|2[0-3])$ ]] || die "--hour must be between 0 and 23"
  [[ "$MINUTE" =~ ^([0-5]?[0-9])$ ]] || die "--minute must be between 0 and 59"
  [[ "$RETENTION_DAYS" =~ ^[0-9]+$ ]] || die "--retention-days must be a non-negative integer"
fi

existing="$(crontab -l 2>/dev/null || true)"
cleaned="$(printf '%s\n' "$existing" | sed "/${MARKER//\//\\/}/d")"

if [[ "$ACTION" == "show" ]]; then
  entry="$(printf '%s\n' "$existing" | grep "$MARKER" || true)"
  if [[ -z "$entry" ]]; then
    log "No backup cron entry found."
  else
    log "Current backup cron entry:"
    printf '%s\n' "$entry"
  fi
  exit 0
fi

if [[ "$ACTION" == "remove" ]]; then
  printf '%s\n' "$cleaned" | crontab -
  log "Backup cron entry removed (if it existed)."
  exit 0
fi

mkdir -p "$LOG_DIR" "$BACKUP_DIR"
cron_cmd="/bin/bash -lc 'cd \"$ROOT_DIR\" && mkdir -p \"$LOG_DIR\" \"$BACKUP_DIR\" && RETENTION_DAYS=\"$RETENTION_DAYS\" BACKUP_DIR=\"$BACKUP_DIR\" bash scripts/db-backup-rotate.sh >> \"$LOG_DIR/db-backup-cron.log\" 2>&1'"
cron_line="${MINUTE} ${HOUR} * * * ${cron_cmd} ${MARKER}"

{
  printf '%s\n' "$cleaned"
  printf '%s\n' "$cron_line"
} | sed '/^[[:space:]]*$/d' | crontab -

log "Backup cron entry installed: ${MINUTE} ${HOUR} * * *"
log "Retention days: ${RETENTION_DAYS}"
log "Backup directory: ${BACKUP_DIR}"
