import { WebStorageStateStore, type UserManagerSettings } from 'oidc-client-ts';
import type { AppConfig } from '../config';

export function buildOidcSettings(cfg: AppConfig, origin: string): UserManagerSettings {
  return {
    authority: cfg.oidcAuthority,
    client_id: cfg.oidcClientId,
    redirect_uri: `${origin}/callback`,
    post_logout_redirect_uri: `${origin}/`,
    response_type: 'code', // Authorization Code; o PKCE é ligado por padrão no oidc-client-ts
    scope: 'openid email profile',
    userStore: new WebStorageStateStore({ store: window.sessionStorage }),
    automaticSilentRenew: true, // usa o refresh token antes do access token expirar
  };
}

// Tira ?code=&state= da barra de endereço depois que o oidc-client-ts já trocou o código.
export function clearAuthParamsFromUrl(): void {
  window.history.replaceState({}, document.title, window.location.pathname);
}

// O state volta do IdP; só confiamos em caminho interno (evita open redirect).
export function returnToFrom(state: unknown): string {
  if (typeof state === 'object' && state !== null && 'returnTo' in state) {
    const returnTo = (state as { returnTo: unknown }).returnTo;
    if (
      typeof returnTo === 'string' &&
      returnTo.startsWith('/') &&
      !returnTo.startsWith('//') &&
      !returnTo.startsWith('/\\')
    ) {
      return returnTo;
    }
  }
  return '/links';
}

// Cognito: GET https://<domínio>/logout?client_id=...&logout_uri=... (logout_uri igual ao cadastrado).
export function buildLogoutUrl(logoutUrl: string, clientId: string, origin: string): string {
  const url = new URL(logoutUrl);
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('logout_uri', `${origin}/`);
  return url.toString();
}
