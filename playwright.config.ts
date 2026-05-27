import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  // 1 retry on CI catches a flake once without hiding a real failure
  // behind a doubled retry budget. Fix flakes; don't paper over them.
  retries: process.env.CI ? 1 : 0,
  // 4 workers on CI (was 1). GitHub-hosted ubuntu-latest runners have
  // 4 cores; serial execution was the single biggest contributor to
  // long CI wall-clock time. 63 tests / 4 workers ≈ 1-2 min suite.
  workers: process.env.CI ? 4 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:8080',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:8080',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
