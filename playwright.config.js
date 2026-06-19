const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './test',
  testMatch: '**/*.spec.js',
  use: {
    baseURL: 'http://localhost:3000',
    headless: true,
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
  },
  webServer: [
    {
      command: 'npm run dev',
      url: 'http://localhost:3000',
      reuseExistingServer: true,
      timeout: 60 * 1000,
    },
    {
      command: '.\\venv\\Scripts\\python.exe -m uvicorn backend.main:app --port 8000',
      url: 'http://localhost:8000/docs',
      reuseExistingServer: true,
      timeout: 60 * 1000,
    }
  ],
});

