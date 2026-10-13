import { z } from 'zod';

declare global {
  interface Window {
    // Definido por /runtime/config.js antes do bundle. "unknown" de propósito: só confiamos depois do zod.
    __APP_CONFIG__?: unknown;
  }
}

// Sem barra no fim: depois concatenamos caminhos ("/links", "/me/links").
const httpUrl = z.url({ protocol: /^https?$/ }).transform((s) => s.replace(/\/+$/, ''));

const configSchema = z.object({
  apiBaseUrl: httpUrl,
  oidcAuthority: httpUrl,
  oidcClientId: z.string().min(1),
  oidcLogoutUrl: httpUrl.optional(), // só o Cognito precisa; o mock usa o end_session_endpoint
});

export type AppConfig = z.infer<typeof configSchema>;

export function loadConfig(raw: unknown): AppConfig {
  if (raw === undefined) {
    throw new Error('Configuração ausente: window.__APP_CONFIG__ não existe. O /runtime/config.js carregou?');
  }
  const result = configSchema.safeParse(raw);
  if (!result.success) {
    throw new Error(`Configuração inválida em /runtime/config.js:\n${z.prettifyError(result.error)}`);
  }
  return result.data;
}

export function getConfig(): AppConfig {
  return loadConfig(window.__APP_CONFIG__);
}
