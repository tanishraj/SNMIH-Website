import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/security',
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  timeout: 90_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL: 'http://localhost:3011',
    trace: 'off',
    ...devices['Desktop Chrome'],
    channel: 'chromium',
    launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined },
  },
  webServer: {
    command: 'pnpm exec tsx tests/helpers/twoFactorBrowserServer.ts',
    url: 'http://localhost:3011/admin/login',
    timeout: 300_000,
    reuseExistingServer: false,
    gracefulShutdown: { signal: 'SIGTERM', timeout: 10_000 },
  },
})
