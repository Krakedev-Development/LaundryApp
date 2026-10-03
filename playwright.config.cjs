const { defineConfig } = require("@playwright/test");
module.exports = defineConfig({
  testDir: "./tests",
  testMatch: "**/*.spec.cjs",
  timeout: 240000,
  workers: 1,
  reporter: "list",
  expect: { timeout: 30000 },
  outputDir: "./test-results",
  use: {
    baseURL: "http://localhost:8083",
    viewport: { width: 390, height: 844 },
    channel: process.env.PLAYWRIGHT_CHANNEL || undefined,
    permissions: ["geolocation"],
    geolocation: { latitude: -12.11, longitude: -77.03 },
    screenshot: "only-on-failure",
    headless: true,
    actionTimeout: 20000,
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run web -- --port 8083",
    url: "http://localhost:8083",
    reuseExistingServer: !process.env.CI,
    timeout: 180000,
  },
});
