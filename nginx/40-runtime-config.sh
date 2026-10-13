#!/bin/sh
# Gera o /runtime/config.js a partir das variáveis de ambiente.
# Roda pelo /docker-entrypoint.sh da imagem do nginx, antes do nginx subir.
set -eu

out_dir="${RUNTIME_CONFIG_DIR:-/usr/share/nginx/html/runtime}"
out_file="$out_dir/config.js"

fail() {
  echo "40-runtime-config: $*" >&2
  exit 1
}

# Allowlist: nenhum caractere aceito precisa de escape numa string JS entre aspas duplas.
URL_RE='^https?://[A-Za-z0-9.-]+(:[0-9]{1,5})?(/[A-Za-z0-9._~%/-]*)?$'
ID_RE='^[A-Za-z0-9._-]{1,128}$'

check() { # uso: check NOME VALOR REGEX
  # O grep testa linha a linha; por isso recusamos quebra de linha antes.
  [ "$(printf '%s' "$2" | wc -l)" -eq 0 ] || fail "$1 não pode ter quebra de linha"
  printf '%s' "$2" | grep -Eq "$3" || fail "$1 inválida: '$2'"
}

require() { # uso: require NOME VALOR REGEX
  [ -n "$2" ] || fail "$1 é obrigatória"
  check "$1" "$2" "$3"
}

require API_BASE_URL "${API_BASE_URL:-}" "$URL_RE"
require OIDC_AUTHORITY "${OIDC_AUTHORITY:-}" "$URL_RE"
require OIDC_CLIENT_ID "${OIDC_CLIENT_ID:-}" "$ID_RE"
if [ -n "${OIDC_LOGOUT_URL:-}" ]; then
  check OIDC_LOGOUT_URL "$OIDC_LOGOUT_URL" "$URL_RE"
fi

tmp="$out_file.tmp"
# Testa escrevendo de verdade: o "-w" do BusyBox olha só as permissões e não percebe um FS somente leitura.
# O subshell é necessário: redirecionamento que falha em builtin especial (":") encerra o script na hora.
if [ ! -d "$out_dir" ] || ! (: > "$tmp") 2>/dev/null; then
  fail "$out_dir não existe ou não é gravável (no K8s, monte um emptyDir)"
fi

{
  printf 'window.__APP_CONFIG__ = {\n'
  printf '  "apiBaseUrl": "%s",\n' "$API_BASE_URL"
  printf '  "oidcAuthority": "%s",\n' "$OIDC_AUTHORITY"
  printf '  "oidcClientId": "%s"' "$OIDC_CLIENT_ID"
  if [ -n "${OIDC_LOGOUT_URL:-}" ]; then
    printf ',\n  "oidcLogoutUrl": "%s"' "$OIDC_LOGOUT_URL"
  fi
  printf '\n};\n'
} > "$tmp"
mv "$tmp" "$out_file" # troca atômica: o nginx nunca serve um arquivo pela metade
echo "40-runtime-config: $out_file gerado"
