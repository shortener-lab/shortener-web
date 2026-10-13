import { describe, expect, it } from 'vitest';
import { getConfig, loadConfig } from './config';
import { TEST_API } from './test/server';

const valid = {
  apiBaseUrl: 'http://localhost:3000/',
  oidcAuthority: 'http://localhost:8090/shortener',
  oidcClientId: 'shortener-web',
};

describe('config', () => {
  it('aceita config válida e tira a barra final das URLs', () => {
    const c = loadConfig(valid);
    expect(c.apiBaseUrl).toBe('http://localhost:3000');
    expect(c.oidcAuthority).toBe('http://localhost:8090/shortener');
    expect(c.oidcLogoutUrl).toBeUndefined();
  });

  it('aceita oidcLogoutUrl opcional', () => {
    const c = loadConfig({ ...valid, oidcLogoutUrl: 'https://x.auth.us-east-1.amazoncognito.com/logout' });
    expect(c.oidcLogoutUrl).toBe('https://x.auth.us-east-1.amazoncognito.com/logout');
  });

  it('falha dizendo qual campo está errado', () => {
    expect(() => loadConfig({ ...valid, apiBaseUrl: 'nao-e-url' })).toThrow(/apiBaseUrl/);
    expect(() => loadConfig({ ...valid, oidcClientId: '' })).toThrow(/oidcClientId/);
  });

  it('rejeita protocolo que não é http(s)', () => {
    expect(() => loadConfig({ ...valid, apiBaseUrl: 'javascript:alert(1)' })).toThrow(/apiBaseUrl/);
  });

  it('explica quando o /runtime/config.js não carregou', () => {
    expect(() => loadConfig(undefined)).toThrow(/runtime\/config\.js/);
  });

  it('getConfig lê window.__APP_CONFIG__', () => {
    expect(getConfig().apiBaseUrl).toBe(TEST_API);
  });
});
