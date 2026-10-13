import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { server, TEST_API, TEST_AUTHORITY } from './server';

// O mesmo papel do /runtime/config.js, mas apontando para os hosts fictícios do MSW.
window.__APP_CONFIG__ = {
  apiBaseUrl: TEST_API,
  oidcAuthority: TEST_AUTHORITY,
  oidcClientId: 'shortener-web',
};

// "error": request sem handler derruba o teste. Assim nenhuma chamada passa despercebida.
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  cleanup(); // sem "globals: true", o Testing Library não limpa o DOM sozinho
  server.resetHandlers();
  sessionStorage.clear();
});
afterAll(() => server.close());
