#!/usr/bin/env bash
# Smoke test da imagem: ./scripts/smoke-container.sh [base-url]
set -euo pipefail

BASE="${1:-http://localhost:8081}"
falhou() { echo "FALHOU: $*" >&2; exit 1; }

health=$(curl -fsS "$BASE/healthz") || falhou "/healthz não respondeu"
[ "$health" = "ok" ] || falhou "/healthz devolveu '$health'"

cfg_headers=$(curl -fsS -D - -o /dev/null "$BASE/runtime/config.js") || falhou "/runtime/config.js não respondeu"
grep -qi '^cache-control: no-store' <<<"$cfg_headers" || falhou "config.js sem Cache-Control: no-store"
cfg=$(curl -fsS "$BASE/runtime/config.js")
grep -q 'window.__APP_CONFIG__' <<<"$cfg" || falhou "config.js sem window.__APP_CONFIG__"

index_headers=$(curl -fsS -D - -o /dev/null "$BASE/")
grep -qi '^cache-control: no-store' <<<"$index_headers" || falhou "index.html sem Cache-Control: no-store"
grep -qi '^x-frame-options: DENY' <<<"$index_headers" || falhou "sem X-Frame-Options"
grep -qi '^x-content-type-options: nosniff' <<<"$index_headers" || falhou "sem X-Content-Type-Options"
grep -qi '^referrer-policy: ' <<<"$index_headers" || falhou "sem Referrer-Policy"

index=$(curl -fsS "$BASE/")
asset=$(grep -o '/assets/[^"]*\.js' <<<"$index" | head -n 1 || true)
[ -n "$asset" ] || falhou "index.html não referencia nenhum /assets/*.js"
asset_headers=$(curl -fsS -D - -o /dev/null "$BASE$asset")
grep -qi '^cache-control: public, max-age=31536000, immutable' <<<"$asset_headers" \
  || falhou "$asset sem cache imutável"
grep -qi '^x-content-type-options: nosniff' <<<"$asset_headers" || falhou "$asset sem headers de segurança"

spa=$(curl -fsS "$BASE/links/abc1234")
grep -q 'id="root"' <<<"$spa" || falhou "fallback de SPA não devolveu o index.html"

status=$(curl -s -o /dev/null -w '%{http_code}' "$BASE/assets/nao-existe.js")
[ "$status" = "404" ] || falhou "asset inexistente devolveu $status (esperado 404)"

echo "smoke OK em $BASE"
