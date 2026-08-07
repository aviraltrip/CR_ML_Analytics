import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false, // Run files sequentially
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: 1, // Restrict to 1 worker to avoid Render concurrent connection dropouts
  timeout: 90000, // 90 seconds global test timeout
  expect: {
    timeout: 15000, // 15 seconds assertion timeout
  },
  reporter: [['html', { outputFolder: 'reports', open: 'never' }]],
  use: {
    baseURL: 'https://cr-analytics-five.vercel.app',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
