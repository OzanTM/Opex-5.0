#!/usr/bin/env bash
set -euo pipefail

APP_DOMAIN=""
API_DOMAIN=""
SKIP_HTTPS_CHECK=false

log() {
  printf "[domain-ssl] %s\n" "$*"
}

die() {
  printf "[domain-ssl][error] %s\n" "$*" >&2
  exit 1
}

usage() {
  cat <<EOF
Usage: bash scripts/domain-ssl-preflight.sh --app-domain <domain> --api-domain <domain> [options]

Options:
  --app-domain <domain>     Frontend/app domain (required)
  --api-domain <domain>     API domain (required)
  --skip-https-check        Skip live HTTPS curl checks
  -h, --help                Show this help
EOF
}

is_valid_domain() {
  local value="$1"
  [[ "$value" =~ ^[A-Za-z0-9.-]+$ ]] && [[ "$value" == *.* ]]
}

resolve_domain() {
  local domain="$1"
  node - "$domain" <<'NODE'
const dns = require('dns').promises;
const domain = process.argv[2];

(async () => {
  try {
    const [a, aaaa] = await Promise.allSettled([
      dns.resolve4(domain),
      dns.resolve6(domain),
    ]);

    const ipv4 = a.status === 'fulfilled' ? a.value : [];
    const ipv6 = aaaa.status === 'fulfilled' ? aaaa.value : [];

    if (ipv4.length === 0 && ipv6.length === 0) {
      console.error(`no A/AAAA records for ${domain}`);
      process.exit(1);
    }

    if (ipv4.length > 0) {
      console.log(`A: ${ipv4.join(', ')}`);
    }
    if (ipv6.length > 0) {
      console.log(`AAAA: ${ipv6.join(', ')}`);
    }
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
})();
NODE
}

check_https() {
  local url="$1"
  curl -fsSI --max-time 8 "$url" >/dev/null
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
    --skip-https-check)
      SKIP_HTTPS_CHECK=true
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

[[ -n "$APP_DOMAIN" ]] || die "--app-domain is required"
[[ -n "$API_DOMAIN" ]] || die "--api-domain is required"
is_valid_domain "$APP_DOMAIN" || die "Invalid app domain: $APP_DOMAIN"
is_valid_domain "$API_DOMAIN" || die "Invalid api domain: $API_DOMAIN"

log "Resolving DNS: $APP_DOMAIN"
resolve_domain "$APP_DOMAIN"
log "Resolving DNS: $API_DOMAIN"
resolve_domain "$API_DOMAIN"

if [[ "$SKIP_HTTPS_CHECK" == "false" ]]; then
  log "Checking HTTPS: https://$APP_DOMAIN"
  check_https "https://$APP_DOMAIN"
  log "Checking HTTPS: https://$API_DOMAIN/api/v1/health"
  check_https "https://$API_DOMAIN/api/v1/health"
  log "HTTPS checks passed."
else
  log "HTTPS checks skipped."
fi

log "Domain/SSL preflight passed."
