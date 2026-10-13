import { WebStorageStateStore } from 'oidc-client-ts';
import { describe, expect, it } from 'vitest';
import { buildLogoutUrl, buildOidcSettings, clearAuthParamsFromUrl, returnToFrom } from './oidc';

const cfg = {
  apiBaseUrl: 'http://localhost:3000',
  oidcAuthority: 'http://localhost:8090/shortener',
  oidcClientId: 'shortener-web',
};

describe('buildOidcSettings', () => {
  it('usa code + PKCE, callback na origem e tokens no sessionStorage', () => {
    const s = buildOidcSettings(cfg, 'http://localhost:5173');
    expect(s).toMatchObject({
      authority: 'http://localhost:8090/shortener',
      client_id: 'shortener-web',
      redirect_uri: 'http://localhost:5173/callback',
      post_logout_redirect_uri: 'http://localhost:5173/',
      response_type: 'code',
      scope: 'openid email profile',
      automaticSilentRenew: true,
    });
    expect(s.userStore).toBeInstanceOf(WebStorageStateStore);
  });
});

describe('clearAuthParamsFromUrl', () => {
  it('remove code e state da URL sem mudar o caminho', () => {
    window.history.replaceState({}, '', '/callback?code=abc&state=xyz');
    clearAuthParamsFromUrl();
    expect(window.location.pathname).toBe('/callback');
    expect(window.location.search).toBe('');
  });
});

describe('returnToFrom', () => {
  it('aceita caminho interno', () => {
    expect(returnToFrom({ returnTo: '/links/abc1234' })).toBe('/links/abc1234');
  });
  it('recusa URL externa, protocolo relativo e lixo', () => {
    expect(returnToFrom({ returnTo: 'https://evil.example' })).toBe('/links');
    expect(returnToFrom({ returnTo: '//evil.example' })).toBe('/links');
    expect(returnToFrom({ returnTo: '/\\evil.example' })).toBe('/links');
    expect(returnToFrom(undefined)).toBe('/links');
  });
});

describe('buildLogoutUrl', () => {
  it('monta a URL de logout estilo Cognito', () => {
    const url = new URL(
      buildLogoutUrl('https://x.auth.us-east-1.amazoncognito.com/logout', 'abc123', 'https://app.example.com'),
    );
    expect(url.origin + url.pathname).toBe('https://x.auth.us-east-1.amazoncognito.com/logout');
    expect(url.searchParams.get('client_id')).toBe('abc123');
    expect(url.searchParams.get('logout_uri')).toBe('https://app.example.com/');
  });
});
