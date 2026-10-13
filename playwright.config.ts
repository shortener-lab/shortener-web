import { defineConfig, devices } from '@playwright/test';

// Padrão: Vite em 5173. Para testar o container: E2E_BASE_URL=http://localhost:8081 npm run test:e2e
const externalBaseUrl = process.env.E2E_BASE_URL;
const baseURL = externalBaseUrl ?? 'http://localhost:5173';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1, // um fluxo só, e ele depende de estado no compose
  retries: 0,
  forbidOnly: !!process.env.CI,
  reporter: 'list',
  use: {
    baseURL,
    trace: 'retain-on-failure', // npx playwright show-trace test-results/.../trace.zip
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: externalBaseUrl
    ? undefined
    : {
        command: 'npm run dev',
        url: 'http://localhost:5173',
        reuseExistingServer: true,
        timeout: 60_000,
      },
});
