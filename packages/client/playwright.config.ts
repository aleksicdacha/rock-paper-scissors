import { defineConfig } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:4173';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'html' : 'list',
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
  },
  webServer: [
    {
      command: process.env.CI
        ? 'npm run start --workspace=packages/server'
        : 'npm run dev --workspace=packages/server',
      url: 'http://localhost:3001/health',
      reuseExistingServer: !process.env.CI,
      cwd: '../..',
      env: {
        PORT: '3001',
        REDIS_URL: process.env.REDIS_URL ?? 'redis://localhost:6379',
        MATCH_PREFIX: 'match:',
        MATCH_TTL_SECONDS: '3600',
        MOVE_TIMEOUT_MS: '10000',
        RECONNECT_TIMEOUT_MS: '30000',
        CORS_ORIGIN: '*',
      },
    },
    {
      command: 'npm run preview',
      url: BASE_URL,
      reuseExistingServer: !process.env.CI,
    },
  ],
});
