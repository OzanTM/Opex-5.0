#!/usr/bin/env bash
set -euo pipefail

BACKEND_FILE="backend/.env.production"
FRONTEND_FILE="frontend/.env.production"

BACKEND_REQUIRED=(
  NODE_ENV
  PORT
  API_PREFIX
  DATABASE_URL
  REDIS_HOST
  REDIS_PORT
  REDIS_PASSWORD
  JWT_SECRET
  FRONTEND_URL
  FRONTEND_ALLOWED_ORIGINS
  TRUST_PROXY
  RATE_LIMIT_PER_MINUTE
  RATE_LIMIT_PER_HOUR
  RATE_LIMIT_AUTH_PER_15_MIN
  EMAIL_PROVIDER
  EMAIL_FROM
  EMAIL_FROM_NAME
)

FRONTEND_REQUIRED=(
  NEXT_PUBLIC_API_URL
  NEXT_PUBLIC_APP_URL
)

log() {
  printf "[env-validate] %s\n" "$*"
}

die() {
  printf "[env-validate][error] %s\n" "$*" >&2
  exit 1
}

usage() {
  cat <<EOF
Usage: bash scripts/validate-production-env.sh [options]

Options:
  --backend-file <path>   Backend env file (default: backend/.env.production)
  --frontend-file <path>  Frontend env file (default: frontend/.env.production)
  -h, --help              Show this help
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --backend-file)
      [[ $# -lt 2 ]] && die "--backend-file requires a path"
      BACKEND_FILE="$2"
      shift 2
      ;;
    --frontend-file)
      [[ $# -lt 2 ]] && die "--frontend-file requires a path"
      FRONTEND_FILE="$2"
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

[[ -f "$BACKEND_FILE" ]] || die "Backend env file not found: $BACKEND_FILE"
[[ -f "$FRONTEND_FILE" ]] || die "Frontend env file not found: $FRONTEND_FILE"

contains_placeholder() {
  local value="$1"
  [[ "$value" == *"<"* || "$value" == *">"* ]]
}

get_value() {
  local file="$1"
  local key="$2"
  local line
  line="$(grep -E "^${key}=" "$file" | tail -n 1 || true)"
  [[ -n "$line" ]] || return 1
  printf '%s' "${line#*=}"
}

validate_keys() {
  local file="$1"
  shift
  local keys=("$@")
  local failed=false

  for key in "${keys[@]}"; do
    local value
    if ! value="$(get_value "$file" "$key")"; then
      printf "[env-validate][missing] %s in %s\n" "$key" "$file" >&2
      failed=true
      continue
    fi

    if [[ -z "$value" ]]; then
      printf "[env-validate][empty] %s in %s\n" "$key" "$file" >&2
      failed=true
      continue
    fi

    if contains_placeholder "$value"; then
      printf "[env-validate][placeholder] %s in %s\n" "$key" "$file" >&2
      failed=true
      continue
    fi
  done

  if [[ "$failed" == "true" ]]; then
    return 1
  fi
}

log "Validating backend file: $BACKEND_FILE"
validate_keys "$BACKEND_FILE" "${BACKEND_REQUIRED[@]}" || die "Backend env validation failed"

log "Validating frontend file: $FRONTEND_FILE"
validate_keys "$FRONTEND_FILE" "${FRONTEND_REQUIRED[@]}" || die "Frontend env validation failed"

log "Production env validation passed."
