import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  timeout: 60000,
  globalSetup: './global-setup.js',
  
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:5173',  // static server port
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Comment out or remove webServer for CI – we start it manually in workflow
  // webServer: {
  //   command: 'npm run dev',
  //   url: 'http://localhost:5173/',
  //   reuseExistingServer: !process.env.CI,
  // },
});