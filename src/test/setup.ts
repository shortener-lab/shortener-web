import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { server } from './server';

// "error": request sem handler derruba o teste. Assim nenhuma chamada passa despercebida.
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  cleanup(); // sem "globals: true", o Testing Library não limpa o DOM sozinho
  server.resetHandlers();
  sessionStorage.clear();
});
afterAll(() => server.close());
