require('dotenv').config({ quiet: true });

const { defineConfig, devices } = require('@playwright/test');

const UI_BASE_URL = process.env.UI_BASE_URL || 'https://practicesoftwaretesting.com';
const API_BASE_URL = process.env.API_BASE_URL || 'https://api.practicesoftwaretesting.com';

const onCI = !!process.env.CI;

module.exports = defineConfig({
  testDir: './tests',
  outputDir: './test-results',

  // The app under test is a public demo instance, so a slow response is a fact of
  // life rather than a bug. These are deliberately generous.
  timeout: 60 * 1000,
  expect: { timeout: 10 * 1000 },

  fullyParallel: true,
  forbidOnly: onCI,
  retries: onCI ? 2 : 0,
  workers: onCI ? 2 : 4,

  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ...(onCI ? [['github']] : []),
  ],

  use: {
    baseURL: UI_BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15 * 1000,
    navigationTimeout: 30 * 1000,
    testIdAttribute: 'data-test',
  },

  projects: [
    {
      name: 'api',
      testDir: './tests/api',
      use: { baseURL: API_BASE_URL },
    },
    {
      name: 'chromium',
      testDir: './tests/ui',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      testDir: './tests/ui',
      use: { ...devices['Desktop Firefox'] },
      // Cross-browser coverage is worth having but not worth doubling every PR.
      // Full run happens on the nightly schedule; PRs only get the smoke slice.
      grep: onCI ? /@smoke/ : /.*/,
    },
    {
      name: 'mobile-chrome',
      testDir: './tests/ui',
      use: { ...devices['Pixel 5'] },
      grep: /@smoke/,
    },
  ],
});
