#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TEMPLATE_FILE="$ROOT_DIR/ops/nginx/opex.conf.template"
OUT_FILE="$ROOT_DIR/ops/nginx/opex.conf"
APP_DOMAIN=""
API_DOMAIN=""
FRONTEND_UPSTREAM="http://127.0.0.1:3000"
BACKEND_UPSTREAM="http://127.0.0.1:3001"
CERT_BASE_DIR="/etc/letsencrypt/live"

log() {
  printf "[nginx-render] %s\n" "$*"
}

die() {
  printf "[nginx-render][error] %s\n" "$*" >&2
  exit 1
}

usage() {
  cat <<EOF
Usage: bash scripts/render-nginx-config.sh --app-domain <domain> --api-domain <domain> [options]

Options:
  --app-domain <domain>         Frontend/app domain (required)
  --api-domain <domain>         API domain (required)
  --frontend-upstream <url>     Frontend upstream (default: http://127.0.0.1:3000)
  --backend-upstream <url>      Backend upstream (default: http://127.0.0.1:3001)
  --cert-base-dir <path>        Cert base dir (default: /etc/letsencrypt/live)
  --out <path>                  Output nginx config path (default: ops/nginx/opex.conf)
  -h, --help                    Show this help
EOF
}

is_valid_domain() {
  local value="$1"
  [[ "$value" =~ ^[A-Za-z0-9.-]+$ ]] && [[ "$value" == *.* ]]
}

to_hostport() {
  local value="$1"
  value="${value#http://}"
  value="${value#https://}"
  value="${value%%/*}"
  printf '%s' "$value"
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --app-domain)
      [[ $# -lt 2 ]] && die "--app-domain requires a value"
      APP_DOMAIN="$2"
      shift 2
      ;;
    --api-domain)
      [[ $# -lt 2 ]] && die "--api-domain requires a value"
      API_DOMAIN="$2"
      shift 2
      ;;
    --frontend-upstream)
      [[ $# -lt 2 ]] && die "--frontend-upstream requires a value"
      FRONTEND_UPSTREAM="$2"
      shift 2
      ;;
    --backend-upstream)
      [[ $# -lt 2 ]] && die "--backend-upstream requires a value"
      BACKEND_UPSTREAM="$2"
      shift 2
      ;;
    --cert-base-dir)
      [[ $# -lt 2 ]] && die "--cert-base-dir requires a path"
      CERT_BASE_DIR="$2"
      shift 2
      ;;
    --out)
      [[ $# -lt 2 ]] && die "--out requires a path"
      OUT_FILE="$2"
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

[[ -n "$APP_DOMAIN" ]] || die "--app-domain is required"
[[ -n "$API_DOMAIN" ]] || die "--api-domain is required"
[[ -f "$TEMPLATE_FILE" ]] || die "Template file not found: $TEMPLATE_FILE"
is_valid_domain "$APP_DOMAIN" || die "Invalid app domain: $APP_DOMAIN"
is_valid_domain "$API_DOMAIN" || die "Invalid api domain: $API_DOMAIN"

FRONTEND_UPSTREAM_HOSTPORT="$(to_hostport "$FRONTEND_UPSTREAM")"
BACKEND_UPSTREAM_HOSTPORT="$(to_hostport "$BACKEND_UPSTREAM")"
[[ -n "$FRONTEND_UPSTREAM_HOSTPORT" ]] || die "Invalid frontend upstream: $FRONTEND_UPSTREAM"
[[ -n "$BACKEND_UPSTREAM_HOSTPORT" ]] || die "Invalid backend upstream: $BACKEND_UPSTREAM"

APP_CERT_FULLCHAIN="$CERT_BASE_DIR/$APP_DOMAIN/fullchain.pem"
APP_CERT_PRIVKEY="$CERT_BASE_DIR/$APP_DOMAIN/privkey.pem"
API_CERT_FULLCHAIN="$CERT_BASE_DIR/$API_DOMAIN/fullchain.pem"
API_CERT_PRIVKEY="$CERT_BASE_DIR/$API_DOMAIN/privkey.pem"

content="$(cat "$TEMPLATE_FILE")"
content="${content//'{{APP_DOMAIN}}'/$APP_DOMAIN}"
content="${content//'{{API_DOMAIN}}'/$API_DOMAIN}"
content="${content//'{{FRONTEND_UPSTREAM_HOSTPORT}}'/$FRONTEND_UPSTREAM_HOSTPORT}"
content="${content//'{{BACKEND_UPSTREAM_HOSTPORT}}'/$BACKEND_UPSTREAM_HOSTPORT}"
content="${content//'{{APP_CERT_FULLCHAIN}}'/$APP_CERT_FULLCHAIN}"
content="${content//'{{APP_CERT_PRIVKEY}}'/$APP_CERT_PRIVKEY}"
content="${content//'{{API_CERT_FULLCHAIN}}'/$API_CERT_FULLCHAIN}"
content="${content//'{{API_CERT_PRIVKEY}}'/$API_CERT_PRIVKEY}"

mkdir -p "$(dirname "$OUT_FILE")"
printf '%s\n' "$content" >"$OUT_FILE"

log "Rendered nginx config: $OUT_FILE"
log "App domain: $APP_DOMAIN"
log "API domain: $API_DOMAIN"
log "Frontend upstream: $FRONTEND_UPSTREAM_HOSTPORT"
log "Backend upstream: $BACKEND_UPSTREAM_HOSTPORT"
