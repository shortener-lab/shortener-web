#!/bin/sh
# Testa o 40-runtime-config.sh dentro da imagem do nginx (mesmo busybox de produção).
set -u

script="$(dirname "$0")/40-runtime-config.sh"
dir="$(mktemp -d)"
falhas=0

ok_api='API_BASE_URL=https://api.shortener-staging.fabricioroglio.com'
ok_auth='OIDC_AUTHORITY=https://cognito-idp.us-east-1.amazonaws.com/us-east-1_AbC123'
ok_id='OIDC_CLIENT_ID=shortener-web'

gera() { # uso: gera VAR=valor...
  rm -f "$dir/config.js"
  env -i PATH="$PATH" RUNTIME_CONFIG_DIR="$dir" "$@" sh "$script" >/dev/null 2>&1
}

passa() {
  desc="$1"; shift
  if gera "$@"; then echo "ok    - $desc"; else echo "FALHA - $desc (devia passar)"; falhas=$((falhas + 1)); fi
}

recusa() {
  desc="$1"; shift
  if gera "$@"; then echo "FALHA - $desc (devia recusar)"; falhas=$((falhas + 1)); else echo "ok    - $desc"; fi
}

contem() {
  if grep -qF "$1" "$dir/config.js" 2>/dev/null; then echo "ok    - config.js contém $1"
  else echo "FALHA - config.js não contém $1"; falhas=$((falhas + 1)); fi
}

passa 'variáveis válidas (staging)' "$ok_api" "$ok_auth" "$ok_id" \
  'OIDC_LOGOUT_URL=https://shortener-staging-x1y2.auth.us-east-1.amazoncognito.com/logout'
contem 'window.__APP_CONFIG__ = {'
contem '"apiBaseUrl": "https://api.shortener-staging.fabricioroglio.com",'
contem '"oidcAuthority": "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_AbC123",'
contem '"oidcLogoutUrl": "https://shortener-staging-x1y2.auth.us-east-1.amazoncognito.com/logout"'

passa 'logout é opcional' "$ok_api" "$ok_auth" "$ok_id"
if grep -q oidcLogoutUrl "$dir/config.js" 2>/dev/null; then
  echo "FALHA - oidcLogoutUrl apareceu sem a variável"; falhas=$((falhas + 1))
else
  echo "ok    - sem OIDC_LOGOUT_URL, sem oidcLogoutUrl"
fi

passa 'URLs de dev com porta' 'API_BASE_URL=http://localhost:3000' \
  'OIDC_AUTHORITY=http://localhost:8090/shortener' "$ok_id"

recusa 'falta API_BASE_URL' "$ok_auth" "$ok_id"
recusa 'falta OIDC_AUTHORITY' "$ok_api" "$ok_id"
recusa 'falta OIDC_CLIENT_ID' "$ok_api" "$ok_auth"
recusa 'aspas na URL' 'API_BASE_URL=https://x.com/"+alert(1)+"' "$ok_auth" "$ok_id"
recusa 'protocolo javascript:' 'API_BASE_URL=javascript:alert(1)' "$ok_auth" "$ok_id"
recusa 'quebra de linha' "API_BASE_URL=https://x.com
\"};alert(1);//" "$ok_auth" "$ok_id"
recusa 'client id com espaço' "$ok_api" "$ok_auth" 'OIDC_CLIENT_ID=a b'
recusa 'logout inválido' "$ok_api" "$ok_auth" "$ok_id" 'OIDC_LOGOUT_URL=ftp://x.com/logout'

if [ "$falhas" -eq 0 ]; then echo "todos os testes passaram"; else echo "$falhas falha(s)"; exit 1; fi
